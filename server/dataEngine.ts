import crypto from 'node:crypto';
import Papa from 'papaparse';
import {
  AnalyticsFilters,
  AnalyticsPayload,
  CleanedHealthcareRecord,
  CleaningComparison,
  ColumnProfile,
  DataQualityProfile,
  DatasetMode,
  HospitalInsightsPayload,
  RawHealthcareRow,
  SmartInsight,
} from '../src/types/healthcare.js';

const EXPECTED_COLUMNS = [
  'Name',
  'Age',
  'Gender',
  'Blood Type',
  'Medical Condition',
  'Date of Admission',
  'Doctor',
  'Hospital',
  'Insurance Provider',
  'Billing Amount',
  'Room Number',
  'Admission Type',
  'Discharge Date',
  'Medication',
  'Test Results',
] as const;

const NUMERICAL_COLS = new Set(['Age', 'Billing Amount', 'Room Number']);
const DATE_COLS = new Set(['Date of Admission', 'Discharge Date']);
const IDENTIFIER_COLS = new Set(['Name', 'Doctor']);

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function isMissing(val: unknown): boolean {
  if (val === null || val === undefined) return true;
  const s = String(val).trim();
  return s === '' || s.toLowerCase() === 'null' || s.toLowerCase() === 'nan' || s.toLowerCase() === 'na';
}

function toTitleCase(input: string): string {
  return input
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((word) => {
      if (!word) return '';
      // Keep blood types and abbreviations clean
      if (/^(a|b|ab|o)[+-]$/i.test(word)) return word.toUpperCase();
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

function normalizeDate(val: unknown): string | null {
  if (isMissing(val)) return null;
  const str = String(val).trim();
  const parsed = new Date(str);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

function anonymizeName(name: unknown, idx: number): string {
  const raw = isMissing(name) ? `patient-${idx}` : String(name).trim().toLowerCase();
  const digest = crypto.createHash('sha256').update(raw).digest('hex').slice(0, 8).toUpperCase();
  return `PT-${digest}`;
}

export function getAgeGroup(age: number): string {
  if (age < 18) return '0-17';
  if (age <= 30) return '18-30';
  if (age <= 45) return '31-45';
  if (age <= 60) return '46-60';
  if (age <= 75) return '61-75';
  return '76+';
}

/**
 * Normalizes arbitrary CSV header casing/spacing to canonical Prasad22 column names.
 */
export function parseCsvBuffer(csvText: string): RawHealthcareRow[] {
  const result = Papa.parse<Record<string, unknown>>(csvText, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });

  if (result.errors.length > 0 && result.data.length === 0) {
    throw new Error(`CSV parsing failed: ${result.errors[0].message}`);
  }

  const headers = result.meta.fields || [];
  const headerLookup = new Map<string, string>();
  for (const h of headers) {
    headerLookup.set(h.trim().toLowerCase().replace(/[_-]+/g, ' '), h);
  }

  // Verify at least core healthcare columns exist
  const requiredCore = ['age', 'medical condition', 'billing amount', 'admission type'];
  const missingCore = requiredCore.filter((col) => !headerLookup.has(col));
  if (missingCore.length > 0) {
    throw new Error(
      `Invalid dataset schema. Missing required columns: ${missingCore.join(', ')}. Expected Prasad22 Kaggle Healthcare Dataset columns.`
    );
  }

  return result.data.map((raw) => {
    const normalized: Record<string, unknown> = {};
    for (const canonical of EXPECTED_COLUMNS) {
      const actualKey = headerLookup.get(canonical.toLowerCase());
      const rawVal = actualKey ? raw[actualKey] : null;
      normalized[canonical] = rawVal ?? null;
    }
    return normalized as RawHealthcareRow;
  });
}

export function profileRawDataset(
  rawRows: RawHealthcareRow[],
  mode: DatasetMode,
  filename: string
): DataQualityProfile {
  const totalRows = rawRows.length;
  const availableCols = EXPECTED_COLUMNS.filter((c) => rawRows.some((r) => c in r));
  const totalColumns = availableCols.length;

  let missingTotal = 0;
  let inconsistentValues = 0;
  let negativeBillingCount = 0;
  let invalidDateRangeCount = 0;

  // Duplicate detection
  const seenFingerprints = new Set<string>();
  let duplicateRows = 0;
  for (const row of rawRows) {
    const fp = EXPECTED_COLUMNS.map((c) => String(row[c] ?? '').trim().toLowerCase()).join('|');
    if (seenFingerprints.has(fp)) {
      duplicateRows++;
    } else {
      seenFingerprints.add(fp);
    }

    // Row-level inconsistency checks
    const bill = Number(row['Billing Amount']);
    if (!isMissing(row['Billing Amount']) && !Number.isNaN(bill) && bill < 0) {
      negativeBillingCount++;
    }
    const d1 = normalizeDate(row['Date of Admission']);
    const d2 = normalizeDate(row['Discharge Date']);
    if (d1 && d2 && d2 < d1) {
      invalidDateRangeCount++;
    }
  }

  const columns: ColumnProfile[] = availableCols.map((col) => {
    let missingCount = 0;
    let colInconsistent = 0;
    const uniqueSet = new Set<string>();
    const samples: string[] = [];

    const type: ColumnProfile['type'] = NUMERICAL_COLS.has(col)
      ? 'numerical'
      : DATE_COLS.has(col)
      ? 'date'
      : IDENTIFIER_COLS.has(col)
      ? 'identifier'
      : 'categorical';

    for (const row of rawRows) {
      const val = row[col];
      if (isMissing(val)) {
        missingCount++;
        continue;
      }
      const str = String(val);
      const trimmed = str.trim();

      if (type === 'numerical') {
        const num = Number(trimmed);
        if (Number.isNaN(num) || (col === 'Billing Amount' && num < 0) || (col === 'Age' && (num < 0 || num > 120))) {
          colInconsistent++;
        }
        uniqueSet.add(trimmed);
      } else if (type === 'date') {
        if (!normalizeDate(trimmed)) colInconsistent++;
        uniqueSet.add(trimmed);
      } else {
        // Check leading/trailing whitespace or casing mismatch against Title Case
        if (str !== trimmed || (col !== 'Blood Type' && col !== 'Name' && col !== 'Doctor' && trimmed !== toTitleCase(trimmed))) {
          colInconsistent++;
        }
        uniqueSet.add(trimmed.toLowerCase());
      }

      if (samples.length < 4 && !IDENTIFIER_COLS.has(col)) {
        if (!samples.includes(trimmed)) samples.push(trimmed);
      }
    }

    missingTotal += missingCount;
    inconsistentValues += colInconsistent;

    return {
      name: col,
      type,
      missingCount,
      missingPct: totalRows > 0 ? Number(((missingCount / totalRows) * 100).toFixed(2)) : 0,
      uniqueCount: uniqueSet.size,
      inconsistentCount: colInconsistent,
      sampleValues: IDENTIFIER_COLS.has(col) ? ['[Protected PII]'] : samples,
    };
  });

  const totalCells = Math.max(1, totalRows * totalColumns);
  const defectWeight = missingTotal * 1.2 + duplicateRows * 2.5 + inconsistentValues * 1.0 + invalidDateRangeCount * 1.5;
  const dataQualityScore = Math.max(0, Math.min(100, Number((100 - (defectWeight / totalCells) * 100 * 4).toFixed(1))));

  // Privacy-protected preview (mask Name and Doctor)
  const previewRows = rawRows.slice(0, 25).map((row, idx) => {
    const out: Record<string, string | number | null> = {};
    for (const col of availableCols) {
      if (col === 'Name') {
        out[col] = anonymizeName(row[col], idx);
      } else if (col === 'Doctor') {
        out[col] = 'Clinician [Redacted]';
      } else {
        out[col] = row[col] === undefined ? null : (row[col] as string | number | null);
      }
    }
    return out;
  });

  return {
    mode,
    filename,
    totalRows,
    totalColumns,
    numericalColumns: columns.filter((c) => c.type === 'numerical').map((c) => c.name),
    categoricalColumns: columns.filter((c) => c.type === 'categorical').map((c) => c.name),
    dateColumns: columns.filter((c) => c.type === 'date').map((c) => c.name),
    identifierColumns: columns.filter((c) => c.type === 'identifier').map((c) => c.name),
    missingTotal,
    duplicateRows,
    inconsistentValues: inconsistentValues + invalidDateRangeCount,
    negativeBillingCount,
    invalidDateRangeCount,
    dataQualityScore,
    columns,
    previewRows,
  };
}

function computeMedian(nums: number[], fallback: number): number {
  if (nums.length === 0) return fallback;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function computeMode(vals: string[], fallback: string): string {
  if (vals.length === 0) return fallback;
  const counts = new Map<string, number>();
  for (const v of vals) counts.set(v, (counts.get(v) || 0) + 1);
  let best = fallback;
  let bestCount = -1;
  for (const [k, c] of counts.entries()) {
    if (c > bestCount) {
      best = k;
      bestCount = c;
    }
  }
  return best;
}

export function cleanRawDataset(
  rawRows: RawHealthcareRow[],
  rawProfile: DataQualityProfile
): { cleanedRows: CleanedHealthcareRecord[]; comparison: CleaningComparison } {
  // Compute medians and modes from valid entries
  const validAges: number[] = [];
  const validBills: number[] = [];
  const validRooms: number[] = [];
  const catPools: Record<string, string[]> = {
    Gender: [],
    'Blood Type': [],
    'Medical Condition': [],
    Hospital: [],
    'Insurance Provider': [],
    'Admission Type': [],
    Medication: [],
    'Test Results': [],
  };

  for (const r of rawRows) {
    const age = Number(r.Age);
    if (!isMissing(r.Age) && !Number.isNaN(age) && age >= 0 && age <= 120) validAges.push(age);
    const bill = Number(r['Billing Amount']);
    if (!isMissing(r['Billing Amount']) && !Number.isNaN(bill)) validBills.push(Math.abs(bill));
    const room = Number(r['Room Number']);
    if (!isMissing(r['Room Number']) && !Number.isNaN(room) && room > 0) validRooms.push(room);

    for (const key of Object.keys(catPools)) {
      const v = r[key];
      if (!isMissing(v)) {
        const clean = key === 'Blood Type' ? String(v).trim().toUpperCase() : toTitleCase(String(v));
        catPools[key].push(clean);
      }
    }
  }

  const medianAge = Math.round(computeMedian(validAges, 45));
  const medianBill = Number(computeMedian(validBills, 20000).toFixed(2));
  const medianRoom = Math.round(computeMedian(validRooms, 250));

  const modeGender = computeMode(catPools.Gender, 'Female');
  const modeBlood = computeMode(catPools['Blood Type'], 'O+');
  const modeCondition = computeMode(catPools['Medical Condition'], 'Diabetes');
  const modeHospital = computeMode(catPools.Hospital, 'Metro General Hospital');
  const modeInsurance = computeMode(catPools['Insurance Provider'], 'BlueCross');
  const modeAdmType = computeMode(catPools['Admission Type'], 'Emergency');
  const modeMed = computeMode(catPools.Medication, 'Paracetamol');
  const modeTest = computeMode(catPools['Test Results'], 'Normal');

  const seenFingerprints = new Set<string>();
  let duplicatesRemoved = 0;
  let missingImputed = 0;
  let standardizedFields = 0;
  let billingFixed = 0;
  let datesFixed = 0;

  const cleanedRows: CleanedHealthcareRecord[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const r = rawRows[i];

    // Deduplicate based on canonicalized signature
    const fp = EXPECTED_COLUMNS.map((c) => String(r[c] ?? '').trim().toLowerCase()).join('|');
    if (seenFingerprints.has(fp)) {
      duplicatesRemoved++;
      continue;
    }
    seenFingerprints.add(fp);

    let age = Number(r.Age);
    if (isMissing(r.Age) || Number.isNaN(age) || age < 0 || age > 120) {
      age = medianAge;
      missingImputed++;
    } else {
      age = Math.round(age);
    }

    let bill = Number(r['Billing Amount']);
    if (isMissing(r['Billing Amount']) || Number.isNaN(bill)) {
      bill = medianBill;
      missingImputed++;
    } else if (bill < 0) {
      bill = Number(Math.abs(bill).toFixed(2));
      billingFixed++;
    } else {
      bill = Number(bill.toFixed(2));
    }

    let room = Number(r['Room Number']);
    if (isMissing(r['Room Number']) || Number.isNaN(room) || room <= 0) {
      room = medianRoom;
      missingImputed++;
    } else {
      room = Math.round(room);
    }

    const normalizeCat = (rawVal: unknown, fallback: string, isBlood = false) => {
      if (isMissing(rawVal)) {
        missingImputed++;
        return fallback;
      }
      const rawStr = String(rawVal);
      const formatted = isBlood ? rawStr.trim().toUpperCase() : toTitleCase(rawStr);
      if (formatted !== rawStr) standardizedFields++;
      return formatted;
    };

    const gender = normalizeCat(r.Gender, modeGender);
    const bloodType = normalizeCat(r['Blood Type'], modeBlood, true);
    const medicalCondition = normalizeCat(r['Medical Condition'], modeCondition);
    const hospital = normalizeCat(r.Hospital, modeHospital);
    const insuranceProvider = normalizeCat(r['Insurance Provider'], modeInsurance);
    const admissionType = normalizeCat(r['Admission Type'], modeAdmType);
    const medication = normalizeCat(r.Medication, modeMed);
    const testResults = normalizeCat(r['Test Results'], modeTest);

    let dateOfAdmission = normalizeDate(r['Date of Admission']);
    if (!dateOfAdmission) {
      dateOfAdmission = '2024-01-15';
      datesFixed++;
    }

    let dischargeDate = normalizeDate(r['Discharge Date']);
    if (!dischargeDate || dischargeDate < dateOfAdmission) {
      const d = new Date(dateOfAdmission + 'T00:00:00Z');
      d.setUTCDate(d.getUTCDate() + 5);
      dischargeDate = d.toISOString().slice(0, 10);
      datesFixed++;
    }

    const startMs = new Date(dateOfAdmission + 'T00:00:00Z').getTime();
    const endMs = new Date(dischargeDate + 'T00:00:00Z').getTime();
    const lengthOfStay = Math.max(1, Math.round((endMs - startMs) / 86400000));

    const dt = new Date(dateOfAdmission + 'T00:00:00Z');
    const admissionYear = dt.getUTCFullYear();
    const monthNum = dt.getUTCMonth();
    const admissionMonth = `${admissionYear}-${String(monthNum + 1).padStart(2, '0')}`;
    const admissionMonthName = MONTH_NAMES[monthNum] || 'Jan';

    cleanedRows.push({
      patientHash: anonymizeName(r.Name, i),
      age,
      ageGroup: getAgeGroup(age),
      gender,
      bloodType,
      medicalCondition,
      dateOfAdmission,
      admissionYear,
      admissionMonth,
      admissionMonthName,
      hospital,
      insuranceProvider,
      billingAmount: bill,
      roomNumber: room,
      admissionType,
      dischargeDate,
      lengthOfStay,
      medication,
      testResults,
    });
  }

  const comparison: CleaningComparison = {
    cleaned: true,
    before: {
      totalRows: rawProfile.totalRows,
      missingValues: rawProfile.missingTotal,
      duplicateRows: rawProfile.duplicateRows,
      inconsistentValues: rawProfile.inconsistentValues,
      qualityScore: rawProfile.dataQualityScore,
    },
    after: {
      totalRows: cleanedRows.length,
      missingValues: 0,
      duplicateRows: 0,
      inconsistentValues: 0,
      qualityScore: 100.0,
    },
    actionsLog: [
      {
        step: 'Duplicate Record Removal',
        detail: 'Identified and dropped exact duplicate admission records using canonicalized row signatures.',
        recordsAffected: duplicatesRemoved,
      },
      {
        step: 'Missing Value Imputation',
        detail: 'Imputed missing numeric columns with column medians and categorical attributes with statistical modes.',
        recordsAffected: missingImputed,
      },
      {
        step: 'Whitespace & Case Standardization',
        detail: 'Trimmed padding and normalized Medical Condition, Test Results, Gender, and Admission Type labels.',
        recordsAffected: standardizedFields,
      },
      {
        step: 'Billing & Temporal Validation',
        detail: 'Corrected negative billing anomalies and validated Discharge Date >= Date of Admission.',
        recordsAffected: billingFixed + datesFixed,
      },
      {
        step: 'PII Anonymization',
        detail: 'Hashed patient names to surrogate PT-XXXXXXXX identifiers and removed direct clinician PII.',
        recordsAffected: cleanedRows.length,
      },
    ],
    missingByColumn: rawProfile.columns.map((c) => ({
      column: c.name,
      before: c.missingCount,
      after: 0,
    })),
    previewCleanedRows: cleanedRows.slice(0, 25),
  };

  return { cleanedRows, comparison };
}

export function applyAnalyticsFilters(
  records: CleanedHealthcareRecord[],
  filters: AnalyticsFilters
): CleanedHealthcareRecord[] {
  return records.filter((r) => {
    if (filters.ageMin !== undefined && r.age < filters.ageMin) return false;
    if (filters.ageMax !== undefined && r.age > filters.ageMax) return false;
    if (filters.gender && filters.gender !== 'All' && r.gender !== filters.gender) return false;
    if (filters.medicalCondition && filters.medicalCondition !== 'All' && r.medicalCondition !== filters.medicalCondition)
      return false;
    if (filters.hospital && filters.hospital !== 'All' && r.hospital !== filters.hospital) return false;
    if (filters.admissionType && filters.admissionType !== 'All' && r.admissionType !== filters.admissionType)
      return false;
    if (filters.testResults && filters.testResults !== 'All' && r.testResults !== filters.testResults) return false;
    if (filters.dateFrom && r.dateOfAdmission < filters.dateFrom) return false;
    if (filters.dateTo && r.dateOfAdmission > filters.dateTo) return false;
    return true;
  });
}

export function computeAnalyticsPayload(
  allRecords: CleanedHealthcareRecord[],
  filters: AnalyticsFilters,
  mode: DatasetMode,
  filename: string,
  cleaned: boolean
): AnalyticsPayload {
  const filtered = applyAnalyticsFilters(allRecords, filters);

  const uniqueHospitals = new Set(filtered.map((r) => r.hospital));
  const uniqueConditions = new Set(filtered.map((r) => r.medicalCondition));
  const uniquePatients = new Set(filtered.map((r) => r.patientHash));

  const n = filtered.length;
  const totalAge = filtered.reduce((s, r) => s + r.age, 0);
  const totalBilling = filtered.reduce((s, r) => s + r.billingAmount, 0);
  const totalStay = filtered.reduce((s, r) => s + r.lengthOfStay, 0);

  // Filter option lists come from allRecords so dropdowns stay populated
  const sortedUnique = (arr: string[]) => Array.from(new Set(arr)).sort();
  const ages = allRecords.map((r) => r.age);
  const dates = allRecords.map((r) => r.dateOfAdmission).sort();

  // 1. Condition Distribution
  const condMap = new Map<string, { count: number; billing: number; minB: number; maxB: number }>();
  for (const r of filtered) {
    const cur = condMap.get(r.medicalCondition) || { count: 0, billing: 0, minB: r.billingAmount, maxB: r.billingAmount };
    cur.count++;
    cur.billing += r.billingAmount;
    cur.minB = Math.min(cur.minB, r.billingAmount);
    cur.maxB = Math.max(cur.maxB, r.billingAmount);
    condMap.set(r.medicalCondition, cur);
  }
  const conditionDistribution = Array.from(condMap.entries())
    .map(([name, v]) => ({
      name,
      count: v.count,
      avgBilling: Number((v.billing / v.count).toFixed(2)),
    }))
    .sort((a, b) => b.count - a.count);

  // 2. Age Distribution
  const ageOrder = ['0-17', '18-30', '31-45', '46-60', '61-75', '76+'];
  const ageMap = new Map<string, number>();
  for (const g of ageOrder) ageMap.set(g, 0);
  for (const r of filtered) ageMap.set(r.ageGroup, (ageMap.get(r.ageGroup) || 0) + 1);
  const ageDistribution = ageOrder
    .map((group) => ({ group, count: ageMap.get(group) || 0 }))
    .filter((d) => d.count > 0 || n === 0);

  // 3. Monthly Admission Trends
  const monthMap = new Map<string, { count: number; billing: number }>();
  for (const r of filtered) {
    const cur = monthMap.get(r.admissionMonth) || { count: 0, billing: 0 };
    cur.count++;
    cur.billing += r.billingAmount;
    monthMap.set(r.admissionMonth, cur);
  }
  const monthlyAdmissions = Array.from(monthMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, v]) => ({
      month,
      admissions: v.count,
      avgBilling: Number((v.billing / v.count).toFixed(2)),
    }));

  // 4. Admission Type Distribution
  const admMap = new Map<string, number>();
  for (const r of filtered) admMap.set(r.admissionType, (admMap.get(r.admissionType) || 0) + 1);
  const admissionTypeDistribution = Array.from(admMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // 5. Test Results Analysis
  const testMap = new Map<string, number>();
  for (const r of filtered) testMap.set(r.testResults, (testMap.get(r.testResults) || 0) + 1);
  const testResultsDistribution = Array.from(testMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // 6. Medication Distribution
  const medMap = new Map<string, number>();
  for (const r of filtered) medMap.set(r.medication, (medMap.get(r.medication) || 0) + 1);
  const medicationDistribution = Array.from(medMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // 7. Hospital Comparison
  const hospMap = new Map<string, { count: number; billing: number; stay: number }>();
  for (const r of filtered) {
    const cur = hospMap.get(r.hospital) || { count: 0, billing: 0, stay: 0 };
    cur.count++;
    cur.billing += r.billingAmount;
    cur.stay += r.lengthOfStay;
    hospMap.set(r.hospital, cur);
  }
  const hospitalComparison = Array.from(hospMap.entries())
    .map(([hospital, v]) => ({
      hospital,
      admissions: v.count,
      avgBilling: Number((v.billing / v.count).toFixed(2)),
      avgStay: Number((v.stay / v.count).toFixed(1)),
    }))
    .sort((a, b) => b.admissions - a.admissions)
    .slice(0, 12);

  // 8. Billing Analysis by Condition
  const billingByCondition = Array.from(condMap.entries())
    .map(([condition, v]) => ({
      condition,
      avgBilling: Number((v.billing / v.count).toFixed(2)),
      minBilling: Number(v.minB.toFixed(2)),
      maxBilling: Number(v.maxB.toFixed(2)),
      totalBilling: Number(v.billing.toFixed(2)),
    }))
    .sort((a, b) => b.avgBilling - a.avgBilling);

  // 9. Age vs Billing Scatter (sampled up to 220 points for crisp rendering)
  const stride = Math.max(1, Math.floor(filtered.length / 220));
  const ageBillingScatter = filtered
    .filter((_, idx) => idx % stride === 0)
    .slice(0, 220)
    .map((r) => ({
      age: r.age,
      billing: Number(r.billingAmount.toFixed(0)),
      stay: r.lengthOfStay,
      condition: r.medicalCondition,
      testResult: r.testResults,
    }));

  // 10. Gender x Condition Trend
  const gcMap = new Map<string, { Male: number; Female: number; Other: number }>();
  for (const r of filtered) {
    const cur = gcMap.get(r.medicalCondition) || { Male: 0, Female: 0, Other: 0 };
    if (r.gender === 'Male') cur.Male++;
    else if (r.gender === 'Female') cur.Female++;
    else cur.Other++;
    gcMap.set(r.medicalCondition, cur);
  }
  const genderConditionTrend = Array.from(gcMap.entries()).map(([condition, counts]) => ({
    condition,
    ...counts,
  }));

  // Smart Insight Generator
  const insights: SmartInsight[] = [];
  if (n > 0) {
    const topCond = conditionDistribution[0];
    const peakMonth = [...monthlyAdmissions].sort((a, b) => b.admissions - a.admissions)[0];
    const topMed = medicationDistribution[0];
    const topAdm = admissionTypeDistribution[0];
    const topAge = [...ageDistribution].sort((a, b) => b.count - a.count)[0];
    const avgStay = Number((totalStay / n).toFixed(1));

    if (topCond) {
      insights.push({
        id: 'top-condition',
        title: 'Most Common Condition',
        value: topCond.name,
        detail: `Accounts for ${((topCond.count / n) * 100).toFixed(1)}% of admissions (${topCond.count.toLocaleString()} cases).`,
        metricLabel: 'Prevalence',
      });
    }
    if (peakMonth) {
      insights.push({
        id: 'peak-month',
        title: 'Highest Admission Month',
        value: peakMonth.month,
        detail: `Recorded ${peakMonth.admissions.toLocaleString()} admissions with $${peakMonth.avgBilling.toLocaleString()} avg billing.`,
        metricLabel: 'Volume Peak',
      });
    }
    if (topMed) {
      insights.push({
        id: 'top-medication',
        title: 'Most Prescribed Medication',
        value: topMed.name,
        detail: `Administered in ${topMed.count.toLocaleString()} records (${((topMed.count / n) * 100).toFixed(1)}% share).`,
        metricLabel: 'Pharmacy Usage',
      });
    }
    if (topAdm) {
      insights.push({
        id: 'top-admission-type',
        title: 'Primary Admission Channel',
        value: topAdm.name,
        detail: `Represents ${((topAdm.count / n) * 100).toFixed(1)}% of hospital intake across selected records.`,
        metricLabel: 'Intake Mix',
      });
    }
    insights.push({
      id: 'avg-stay',
      title: 'Average Hospital Stay',
      value: `${avgStay} Days`,
      detail: `Calculated from admission-to-discharge spans across ${n.toLocaleString()} anonymized visits.`,
      metricLabel: 'Length of Stay',
    });
    if (topAge) {
      insights.push({
        id: 'age-bracket',
        title: 'Dominant Age Cohort',
        value: `${topAge.group} yrs`,
        detail: `Highest admission volume cohort with ${topAge.count.toLocaleString()} visits (${((topAge.count / n) * 100).toFixed(1)}%).`,
        metricLabel: 'Demographics',
      });
    }
  }

  return {
    mode,
    filename,
    cleaned,
    totalSourceRows: allRecords.length,
    filteredCount: n,
    kpis: {
      totalPatientRecords: uniquePatients.size,
      totalHospitals: uniqueHospitals.size,
      totalMedicalConditions: uniqueConditions.size,
      avgPatientAge: n > 0 ? Number((totalAge / n).toFixed(1)) : 0,
      totalAdmissions: n,
      avgBillingAmount: n > 0 ? Number((totalBilling / n).toFixed(2)) : 0,
      avgHospitalStay: n > 0 ? Number((totalStay / n).toFixed(1)) : 0,
    },
    filterOptions: {
      genders: sortedUnique(allRecords.map((r) => r.gender)),
      conditions: sortedUnique(allRecords.map((r) => r.medicalCondition)),
      hospitals: sortedUnique(allRecords.map((r) => r.hospital)).slice(0, 60),
      admissionTypes: sortedUnique(allRecords.map((r) => r.admissionType)),
      testResults: sortedUnique(allRecords.map((r) => r.testResults)),
      minAge: ages.length > 0 ? Math.min(...ages) : 0,
      maxAge: ages.length > 0 ? Math.max(...ages) : 100,
      minDate: dates[0] || '2020-01-01',
      maxDate: dates[dates.length - 1] || '2025-12-31',
    },
    charts: {
      conditionDistribution,
      ageDistribution,
      monthlyAdmissions,
      admissionTypeDistribution,
      testResultsDistribution,
      medicationDistribution,
      hospitalComparison,
      billingByCondition,
      ageBillingScatter,
      genderConditionTrend,
    },
    insights,
  };
}

export function computeHospitalInsights(
  records: CleanedHealthcareRecord[],
  mode: DatasetMode
): HospitalInsightsPayload {
  const n = Math.max(1, records.length);
  const hospMap = new Map<
    string,
    {
      total: number;
      emergency: number;
      urgent: number;
      elective: number;
      staySum: number;
      billingSum: number;
      abnormal: number;
      condCounts: Map<string, number>;
    }
  >();

  let totalDays = 0;
  const admMixMap = new Map<string, { count: number; staySum: number }>();

  for (const r of records) {
    totalDays += r.lengthOfStay;

    const admCur = admMixMap.get(r.admissionType) || { count: 0, staySum: 0 };
    admCur.count++;
    admCur.staySum += r.lengthOfStay;
    admMixMap.set(r.admissionType, admCur);

    const h = hospMap.get(r.hospital) || {
      total: 0,
      emergency: 0,
      urgent: 0,
      elective: 0,
      staySum: 0,
      billingSum: 0,
      abnormal: 0,
      condCounts: new Map<string, number>(),
    };
    h.total++;
    if (r.admissionType === 'Emergency') h.emergency++;
    else if (r.admissionType === 'Urgent') h.urgent++;
    else h.elective++;
    h.staySum += r.lengthOfStay;
    h.billingSum += r.billingAmount;
    if (r.testResults === 'Abnormal') h.abnormal++;
    h.condCounts.set(r.medicalCondition, (h.condCounts.get(r.medicalCondition) || 0) + 1);
    hospMap.set(r.hospital, h);
  }

  // Span in days for hypothetical capacity estimation
  const dates = records.map((r) => r.dateOfAdmission).sort();
  const minMs = dates.length ? new Date(dates[0]).getTime() : Date.now();
  const maxMs = dates.length ? new Date(dates[dates.length - 1]).getTime() : Date.now();
  const spanDays = Math.max(30, Math.round((maxMs - minMs) / 86400000));

  const hospitals = Array.from(hospMap.entries())
    .map(([hospital, h]) => {
      let topCond = 'N/A';
      let topCondCount = -1;
      for (const [c, cnt] of h.condCounts.entries()) {
        if (cnt > topCondCount) {
          topCond = c;
          topCondCount = cnt;
        }
      }
      // Hypothetical average daily bed occupancy = totalPatientDays / spanDays * 1.25 safety buffer
      const avgDailyOccupancy = h.staySum / spanDays;
      const estimatedBedsNeeded = Math.max(2, Math.ceil(avgDailyOccupancy * 1.25));
      const estimatedNursesPerShift = Math.max(1, Math.ceil(estimatedBedsNeeded / 4));

      return {
        hospital,
        totalAdmissions: h.total,
        emergencyCount: h.emergency,
        urgentCount: h.urgent,
        electiveCount: h.elective,
        avgStay: Number((h.staySum / h.total).toFixed(1)),
        totalPatientDays: h.staySum,
        avgBilling: Number((h.billingSum / h.total).toFixed(2)),
        totalBilling: Number(h.billingSum.toFixed(2)),
        abnormalRatePct: Number(((h.abnormal / h.total) * 100).toFixed(1)),
        topCondition: topCond,
        workloadSharePct: Number(((h.total / n) * 100).toFixed(1)),
        estimatedBedsNeeded,
        estimatedNursesPerShift,
      };
    })
    .sort((a, b) => b.totalAdmissions - a.totalAdmissions)
    .slice(0, 20);

  return {
    mode,
    hospitals,
    overallAvgStay: Number((totalDays / n).toFixed(1)),
    overallTotalPatientDays: totalDays,
    admissionMix: Array.from(admMixMap.entries()).map(([type, v]) => ({
      type,
      count: v.count,
      avgStay: Number((v.staySum / v.count).toFixed(1)),
    })),
  };
}

export function recordsToCsv(records: CleanedHealthcareRecord[]): string {
  const rows = records.map((r) => ({
    Patient_ID: r.patientHash,
    Age: r.age,
    Age_Group: r.ageGroup,
    Gender: r.gender,
    'Blood Type': r.bloodType,
    'Medical Condition': r.medicalCondition,
    'Date of Admission': r.dateOfAdmission,
    Hospital: r.hospital,
    'Insurance Provider': r.insuranceProvider,
    'Billing Amount': r.billingAmount,
    'Room Number': r.roomNumber,
    'Admission Type': r.admissionType,
    'Discharge Date': r.dischargeDate,
    'Length of Stay (Days)': r.lengthOfStay,
    Medication: r.medication,
    'Test Results': r.testResults,
  }));
  return Papa.unparse(rows);
}
