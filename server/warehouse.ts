import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import {
  CleanedHealthcareRecord,
  DatasetMode,
  ETLRunRecord,
  OlapQueryRequest,
  OlapQueryResult,
  WarehouseStats,
} from '../src/types/healthcare.js';

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'mediinsight_warehouse.db');

let dbInstance: DatabaseSync | null = null;

function getDb(): DatabaseSync {
  if (dbInstance) return dbInstance;
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  const db = new DatabaseSync(DB_PATH);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');

  // Create Star Schema Tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS Dim_Patient (
      patient_key INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_hash TEXT UNIQUE NOT NULL,
      age INTEGER NOT NULL,
      age_group TEXT NOT NULL,
      gender TEXT NOT NULL,
      blood_type TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS Dim_Hospital (
      hospital_key INTEGER PRIMARY KEY AUTOINCREMENT,
      hospital_name TEXT UNIQUE NOT NULL,
      hospital_tier TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS Dim_Date (
      date_key INTEGER PRIMARY KEY AUTOINCREMENT,
      full_date TEXT UNIQUE NOT NULL,
      year INTEGER NOT NULL,
      quarter TEXT NOT NULL,
      month INTEGER NOT NULL,
      month_name TEXT NOT NULL,
      day_of_week TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS Dim_Medical_Condition (
      condition_key INTEGER PRIMARY KEY AUTOINCREMENT,
      condition_name TEXT UNIQUE NOT NULL,
      clinical_category TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS Dim_Insurance (
      insurance_key INTEGER PRIMARY KEY AUTOINCREMENT,
      provider_name TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS Fact_Admission (
      admission_id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_key INTEGER NOT NULL,
      hospital_key INTEGER NOT NULL,
      date_key INTEGER NOT NULL,
      condition_key INTEGER NOT NULL,
      insurance_key INTEGER NOT NULL,
      admission_type TEXT NOT NULL,
      medication TEXT NOT NULL,
      test_results TEXT NOT NULL,
      billing_amount REAL NOT NULL,
      room_number INTEGER NOT NULL,
      discharge_date TEXT NOT NULL,
      length_of_stay INTEGER NOT NULL,
      load_batch_id INTEGER NOT NULL,
      FOREIGN KEY (patient_key) REFERENCES Dim_Patient(patient_key),
      FOREIGN KEY (hospital_key) REFERENCES Dim_Hospital(hospital_key),
      FOREIGN KEY (date_key) REFERENCES Dim_Date(date_key),
      FOREIGN KEY (condition_key) REFERENCES Dim_Medical_Condition(condition_key),
      FOREIGN KEY (insurance_key) REFERENCES Dim_Insurance(insurance_key)
    );

    CREATE TABLE IF NOT EXISTS ETL_Run_History (
      run_id INTEGER PRIMARY KEY AUTOINCREMENT,
      dataset_mode TEXT NOT NULL,
      source_filename TEXT NOT NULL,
      records_extracted INTEGER NOT NULL,
      records_transformed INTEGER NOT NULL,
      records_loaded INTEGER NOT NULL,
      duplicates_removed INTEGER NOT NULL,
      missing_fixed INTEGER NOT NULL,
      status TEXT NOT NULL,
      executed_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_fact_date ON Fact_Admission(date_key);
    CREATE INDEX IF NOT EXISTS idx_fact_cond ON Fact_Admission(condition_key);
    CREATE INDEX IF NOT EXISTS idx_fact_hosp ON Fact_Admission(hospital_key);
    CREATE INDEX IF NOT EXISTS idx_fact_patient ON Fact_Admission(patient_key);
  `);

  dbInstance = db;
  return db;
}

const CONDITION_CATEGORY: Record<string, string> = {
  Diabetes: 'Endocrine & Metabolic',
  Hypertension: 'Cardiovascular',
  Asthma: 'Respiratory',
  Arthritis: 'Musculoskeletal',
  Cancer: 'Oncology',
  Obesity: 'Metabolic & Nutritional',
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function loadRecordsIntoWarehouse(
  records: CleanedHealthcareRecord[],
  meta: {
    mode: DatasetMode;
    filename: string;
    recordsExtracted: number;
    duplicatesRemoved: number;
    missingFixed: number;
  }
): ETLRunRecord {
  const db = getDb();

  const executedAt = new Date().toISOString();

  db.exec('BEGIN TRANSACTION;');
  try {
    // Clear existing fact/dimension rows for clean warehouse snapshot reload
    db.exec(`
      DELETE FROM Fact_Admission;
      DELETE FROM Dim_Patient;
      DELETE FROM Dim_Hospital;
      DELETE FROM Dim_Date;
      DELETE FROM Dim_Medical_Condition;
      DELETE FROM Dim_Insurance;
    `);

    const insertRun = db.prepare(`
      INSERT INTO ETL_Run_History (
        dataset_mode, source_filename, records_extracted, records_transformed,
        records_loaded, duplicates_removed, missing_fixed, status, executed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const runResult = insertRun.run(
      meta.mode,
      meta.filename,
      meta.recordsExtracted,
      records.length,
      records.length,
      meta.duplicatesRemoved,
      meta.missingFixed,
      'Completed',
      executedAt
    );
    const batchId = Number(runResult.lastInsertRowid);

    const insertPatient = db.prepare(
      `INSERT OR IGNORE INTO Dim_Patient (patient_hash, age, age_group, gender, blood_type) VALUES (?, ?, ?, ?, ?)`
    );
    const selectPatient = db.prepare(`SELECT patient_key FROM Dim_Patient WHERE patient_hash = ?`);

    const insertHospital = db.prepare(
      `INSERT OR IGNORE INTO Dim_Hospital (hospital_name, hospital_tier) VALUES (?, ?)`
    );
    const selectHospital = db.prepare(`SELECT hospital_key FROM Dim_Hospital WHERE hospital_name = ?`);

    const insertDate = db.prepare(
      `INSERT OR IGNORE INTO Dim_Date (full_date, year, quarter, month, month_name, day_of_week) VALUES (?, ?, ?, ?, ?, ?)`
    );
    const selectDate = db.prepare(`SELECT date_key FROM Dim_Date WHERE full_date = ?`);

    const insertCondition = db.prepare(
      `INSERT OR IGNORE INTO Dim_Medical_Condition (condition_name, clinical_category) VALUES (?, ?)`
    );
    const selectCondition = db.prepare(`SELECT condition_key FROM Dim_Medical_Condition WHERE condition_name = ?`);

    const insertInsurance = db.prepare(`INSERT OR IGNORE INTO Dim_Insurance (provider_name) VALUES (?)`);
    const selectInsurance = db.prepare(`SELECT insurance_key FROM Dim_Insurance WHERE provider_name = ?`);

    const insertFact = db.prepare(`
      INSERT INTO Fact_Admission (
        patient_key, hospital_key, date_key, condition_key, insurance_key,
        admission_type, medication, test_results, billing_amount, room_number,
        discharge_date, length_of_stay, load_batch_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const patientCache = new Map<string, number>();
    const hospitalCache = new Map<string, number>();
    const dateCache = new Map<string, number>();
    const conditionCache = new Map<string, number>();
    const insuranceCache = new Map<string, number>();

    for (const r of records) {
      let pKey = patientCache.get(r.patientHash);
      if (pKey === undefined) {
        insertPatient.run(r.patientHash, r.age, r.ageGroup, r.gender, r.bloodType);
        const row = selectPatient.get(r.patientHash) as { patient_key: number };
        pKey = row.patient_key;
        patientCache.set(r.patientHash, pKey);
      }

      let hKey = hospitalCache.get(r.hospital);
      if (hKey === undefined) {
        const tier = r.hospital.toLowerCase().includes('specialty') || r.hospital.toLowerCase().includes('institute')
          ? 'Tertiary Specialty'
          : 'General Acute Care';
        insertHospital.run(r.hospital, tier);
        const row = selectHospital.get(r.hospital) as { hospital_key: number };
        hKey = row.hospital_key;
        hospitalCache.set(r.hospital, hKey);
      }

      let dKey = dateCache.get(r.dateOfAdmission);
      if (dKey === undefined) {
        const dt = new Date(r.dateOfAdmission + 'T00:00:00Z');
        const m = dt.getUTCMonth() + 1;
        const q = `Q${Math.ceil(m / 3)}`;
        const dow = WEEKDAYS[dt.getUTCDay()] || 'Mon';
        insertDate.run(r.dateOfAdmission, r.admissionYear, q, m, r.admissionMonthName, dow);
        const row = selectDate.get(r.dateOfAdmission) as { date_key: number };
        dKey = row.date_key;
        dateCache.set(r.dateOfAdmission, dKey);
      }

      let cKey = conditionCache.get(r.medicalCondition);
      if (cKey === undefined) {
        const cat = CONDITION_CATEGORY[r.medicalCondition] || 'General Clinical';
        insertCondition.run(r.medicalCondition, cat);
        const row = selectCondition.get(r.medicalCondition) as { condition_key: number };
        cKey = row.condition_key;
        conditionCache.set(r.medicalCondition, cKey);
      }

      let iKey = insuranceCache.get(r.insuranceProvider);
      if (iKey === undefined) {
        insertInsurance.run(r.insuranceProvider);
        const row = selectInsurance.get(r.insuranceProvider) as { insurance_key: number };
        iKey = row.insurance_key;
        insuranceCache.set(r.insuranceProvider, iKey);
      }

      insertFact.run(
        pKey,
        hKey,
        dKey,
        cKey,
        iKey,
        r.admissionType,
        r.medication,
        r.testResults,
        r.billingAmount,
        r.roomNumber,
        r.dischargeDate,
        r.lengthOfStay,
        batchId
      );
    }

    db.exec('COMMIT;');

    return {
      run_id: batchId,
      dataset_mode: meta.mode,
      source_filename: meta.filename,
      records_extracted: meta.recordsExtracted,
      records_transformed: records.length,
      records_loaded: records.length,
      duplicates_removed: meta.duplicatesRemoved,
      missing_fixed: meta.missingFixed,
      status: 'Completed',
      executed_at: executedAt,
    };
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}

export function getWarehouseStats(mode: DatasetMode, filename: string): WarehouseStats {
  const db = getDb();

  const countTable = (tbl: string): number => {
    const row = db.prepare(`SELECT COUNT(*) as cnt FROM ${tbl}`).get() as { cnt: number };
    return row?.cnt || 0;
  };

  const history = db
    .prepare(`SELECT * FROM ETL_Run_History ORDER BY run_id DESC LIMIT 12`)
    .all() as unknown as ETLRunRecord[];

  const sampleFacts = db
    .prepare(`
      SELECT
        f.admission_id,
        p.patient_hash,
        p.age_group,
        p.gender,
        h.hospital_name,
        d.full_date,
        c.condition_name,
        i.provider_name,
        f.admission_type,
        f.test_results,
        f.billing_amount,
        f.length_of_stay
      FROM Fact_Admission f
      JOIN Dim_Patient p ON f.patient_key = p.patient_key
      JOIN Dim_Hospital h ON f.hospital_key = h.hospital_key
      JOIN Dim_Date d ON f.date_key = d.date_key
      JOIN Dim_Medical_Condition c ON f.condition_key = c.condition_key
      JOIN Dim_Insurance i ON f.insurance_key = i.insurance_key
      ORDER BY f.admission_id DESC
      LIMIT 15
    `)
    .all() as WarehouseStats['sampleFacts'];

  const factCount = countTable('Fact_Admission');

  return {
    etlLoaded: factCount > 0,
    datasetMode: mode,
    filename,
    tables: {
      Fact_Admission: factCount,
      Dim_Patient: countTable('Dim_Patient'),
      Dim_Hospital: countTable('Dim_Hospital'),
      Dim_Date: countTable('Dim_Date'),
      Dim_Medical_Condition: countTable('Dim_Medical_Condition'),
      Dim_Insurance: countTable('Dim_Insurance'),
    },
    latestEtlRun: history[0] || null,
    etlHistory: history,
    sampleFacts,
  };
}

const DIM_SQL_MAP: Record<string, { expr: string; label: string }> = {
  year: { expr: 'CAST(d.year AS TEXT)', label: 'Year' },
  month: { expr: "d.year || '-' || printf('%02d', d.month)", label: 'Month' },
  hospital: { expr: 'h.hospital_name', label: 'Hospital' },
  age_group: { expr: 'p.age_group', label: 'Age Group' },
  condition: { expr: 'c.condition_name', label: 'Medical Condition' },
  admission_type: { expr: 'f.admission_type', label: 'Admission Type' },
  test_results: { expr: 'f.test_results', label: 'Test Results' },
  gender: { expr: 'p.gender', label: 'Gender' },
};

const MEASURE_SQL_MAP: Record<string, { expr: string; label: string }> = {
  admissions: { expr: 'COUNT(*)', label: 'Admissions' },
  avg_billing: { expr: 'ROUND(AVG(f.billing_amount), 2)', label: 'Avg Billing ($)' },
  total_billing: { expr: 'ROUND(SUM(f.billing_amount), 2)', label: 'Total Billing ($)' },
  avg_stay: { expr: 'ROUND(AVG(f.length_of_stay), 1)', label: 'Avg Stay (Days)' },
};

export function runOlapQuery(req: OlapQueryRequest): OlapQueryResult {
  const db = getDb();

  const years = (db.prepare(`SELECT DISTINCT CAST(year AS TEXT) AS v FROM Dim_Date ORDER BY v`).all() as Array<{ v: string }>).map((r) => r.v);
  const hospitals = (db.prepare(`SELECT DISTINCT hospital_name AS v FROM Dim_Hospital ORDER BY v LIMIT 30`).all() as Array<{ v: string }>).map((r) => r.v);
  const ageGroups = (db.prepare(`SELECT DISTINCT age_group AS v FROM Dim_Patient ORDER BY v`).all() as Array<{ v: string }>).map((r) => r.v);
  const conditions = (db.prepare(`SELECT DISTINCT condition_name AS v FROM Dim_Medical_Condition ORDER BY v`).all() as Array<{ v: string }>).map((r) => r.v);

  const rowDef = DIM_SQL_MAP[req.rowDim] || DIM_SQL_MAP.condition;
  const measureDef = MEASURE_SQL_MAP[req.measure] || MEASURE_SQL_MAP.admissions;

  const whereClauses: string[] = [];
  const params: (string | number)[] = [];

  if (req.operation === 'slice' && req.sliceField && req.sliceValue && req.sliceValue !== 'All') {
    const sliceDef = DIM_SQL_MAP[req.sliceField];
    if (sliceDef) {
      whereClauses.push(`${sliceDef.expr} = ?`);
      params.push(req.sliceValue);
    }
  }

  if (req.operation === 'dice' && req.diceFilters) {
    if (req.diceFilters.year && req.diceFilters.year !== 'All') {
      whereClauses.push(`CAST(d.year AS TEXT) = ?`);
      params.push(req.diceFilters.year);
    }
    if (req.diceFilters.hospital && req.diceFilters.hospital !== 'All') {
      whereClauses.push(`h.hospital_name = ?`);
      params.push(req.diceFilters.hospital);
    }
    if (req.diceFilters.age_group && req.diceFilters.age_group !== 'All') {
      whereClauses.push(`p.age_group = ?`);
      params.push(req.diceFilters.age_group);
    }
    if (req.diceFilters.condition && req.diceFilters.condition !== 'All') {
      whereClauses.push(`c.condition_name = ?`);
      params.push(req.diceFilters.condition);
    }
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const baseJoins = `
    FROM Fact_Admission f
    JOIN Dim_Patient p ON f.patient_key = p.patient_key
    JOIN Dim_Hospital h ON f.hospital_key = h.hospital_key
    JOIN Dim_Date d ON f.date_key = d.date_key
    JOIN Dim_Medical_Condition c ON f.condition_key = c.condition_key
    JOIN Dim_Insurance i ON f.insurance_key = i.insurance_key
  `;

  if (req.operation === 'pivot' && req.colDim) {
    const colDef = DIM_SQL_MAP[req.colDim] || DIM_SQL_MAP.admission_type;
    const sql = `
      SELECT
        ${rowDef.expr} AS row_dim,
        ${colDef.expr} AS col_dim,
        ${measureDef.expr} AS val
      ${baseJoins}
      ${whereSql}
      GROUP BY ${rowDef.expr}, ${colDef.expr}
      ORDER BY row_dim, col_dim
      LIMIT 300
    `;
    const rawRows = db.prepare(sql).all(...params) as Array<{ row_dim: string; col_dim: string; val: number }>;
    const colKeys = Array.from(new Set(rawRows.map((r) => r.col_dim))).sort();
    const rowMap = new Map<string, Record<string, string | number>>();

    for (const r of rawRows) {
      const existing = rowMap.get(r.row_dim) || { [rowDef.label]: r.row_dim };
      existing[r.col_dim] = r.val;
      rowMap.set(r.row_dim, existing);
    }
    const pivotedRows = Array.from(rowMap.values()).map((obj) => {
      for (const k of colKeys) {
        if (obj[k] === undefined) obj[k] = 0;
      }
      return obj;
    });

    return {
      operation: 'Pivot',
      explanation: `Pivot rotates the data cube axes so ${rowDef.label} values appear as rows and ${colDef.label} values become cross-tabulated columns showing ${measureDef.label}.`,
      sqlPreview: sql.trim().replace(/\s+/g, ' '),
      columns: [rowDef.label, ...colKeys],
      rows: pivotedRows,
      availableSlices: { years, hospitals, ageGroups, conditions },
    };
  }

  const sql = `
    SELECT
      ${rowDef.expr} AS dimension_value,
      COUNT(*) AS admissions,
      ROUND(AVG(f.billing_amount), 2) AS avg_billing,
      ROUND(SUM(f.billing_amount), 2) AS total_billing,
      ROUND(AVG(f.length_of_stay), 1) AS avg_stay
    ${baseJoins}
    ${whereSql}
    GROUP BY ${rowDef.expr}
    ORDER BY admissions DESC
    LIMIT 35
  `;

  const resultRows = db.prepare(sql).all(...params) as Array<{
    dimension_value: string;
    admissions: number;
    avg_billing: number;
    total_billing: number;
    avg_stay: number;
  }>;

  const formattedRows = resultRows.map((r) => ({
    [rowDef.label]: r.dimension_value,
    Admissions: r.admissions,
    'Avg Billing ($)': r.avg_billing,
    'Total Billing ($)': r.total_billing,
    'Avg Stay (Days)': r.avg_stay,
  }));

  const explanations: Record<string, string> = {
    rollup: `Roll-up aggregates granular admission facts upward along the hierarchy (e.g., from daily visits to ${rowDef.label} summaries) to reveal high-level patterns.`,
    drilldown: `Drill-down navigates deeper into finer granularity (${rowDef.label}) so analysts can inspect sub-categories driving overall metrics.`,
    slice: `Slice fixes one cube dimension (${req.sliceField || 'Year'} = ${req.sliceValue || 'All'}) to inspect a single two-dimensional cross-section of the warehouse.`,
    dice: `Dice applies multi-dimensional filters simultaneously across Year, Hospital, Age Group, and Medical Condition to isolate a targeted sub-cube.`,
  };

  return {
    operation: req.operation.toUpperCase(),
    explanation: explanations[req.operation] || explanations.rollup,
    sqlPreview: sql.trim().replace(/\s+/g, ' '),
    columns: [rowDef.label, 'Admissions', 'Avg Billing ($)', 'Total Billing ($)', 'Avg Stay (Days)'],
    rows: formattedRows,
    availableSlices: { years, hospitals, ageGroups, conditions },
  };
}
