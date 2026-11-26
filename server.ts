import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import {
  AnalyticsFilters,
  CleanedHealthcareRecord,
  CleaningComparison,
  DataQualityProfile,
  DatasetMode,
  OlapQueryRequest,
  RawHealthcareRow,
} from './src/types/healthcare.js';
import { generateDemoDataset } from './server/demoDataset.js';
import {
  cleanRawDataset,
  computeAnalyticsPayload,
  computeHospitalInsights,
  parseCsvBuffer,
  profileRawDataset,
  recordsToCsv,
} from './server/dataEngine.js';
import { getWarehouseStats, loadRecordsIntoWarehouse, runOlapQuery } from './server/warehouse.js';
import { runDataMiningSuite, runKMeansClustering } from './server/mlEngine.js';
import { queryMediBotAI } from './server/aiAssistant.js';

interface AppDatasetState {
  mode: DatasetMode;
  filename: string;
  rawRows: RawHealthcareRow[];
  rawProfile: DataQualityProfile;
  cleanedRows: CleanedHealthcareRecord[];
  cleaningComparison: CleaningComparison;
  isCleaned: boolean;
}

function initializeState(rawRows: RawHealthcareRow[], mode: DatasetMode, filename: string): AppDatasetState {
  const rawProfile = profileRawDataset(rawRows, mode, filename);
  const { cleanedRows, comparison } = cleanRawDataset(rawRows, rawProfile);
  // Mark cleaned=false initially for uploaded datasets so user can observe Before vs After and click "Clean Dataset"
  // For demonstration mode, pre-populate comparison metrics and load warehouse so all modules work out-of-the-box
  const isDemo = mode === 'demonstration';
  if (isDemo) {
    loadRecordsIntoWarehouse(cleanedRows, {
      mode,
      filename,
      recordsExtracted: rawRows.length,
      duplicatesRemoved: rawProfile.duplicateRows,
      missingFixed: rawProfile.missingTotal,
    });
  }
  return {
    mode,
    filename,
    rawRows,
    rawProfile,
    cleanedRows,
    cleaningComparison: { ...comparison, cleaned: isDemo },
    isCleaned: isDemo,
  };
}

let state: AppDatasetState = initializeState(
  generateDemoDataset(600),
  'demonstration',
  'demonstration_healthcare_sample.csv'
);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 55 * 1024 * 1024 }, // 55MB for full Kaggle CSV (55,500+ rows)
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // --- API Routes ---

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', mode: state.mode, rows: state.rawRows.length });
  });

  app.get('/api/state', (_req, res) => {
    const warehouseStats = getWarehouseStats(state.mode, state.filename);
    res.json({
      mode: state.mode,
      filename: state.filename,
      isCleaned: state.isCleaned,
      rawProfile: state.rawProfile,
      cleaningComparison: state.cleaningComparison,
      warehouseStats,
    });
  });

  app.post('/api/dataset/upload', upload.single('file'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No CSV file provided.' });
      }
      const csvText = req.file.buffer.toString('utf-8');
      const parsedRows = parseCsvBuffer(csvText);
      if (parsedRows.length === 0) {
        return res.status(400).json({ error: 'Uploaded CSV contains 0 data rows.' });
      }

      const filename = req.file.originalname || 'uploaded_healthcare_dataset.csv';
      state = initializeState(parsedRows, 'uploaded', filename);

      // Automatically load initial warehouse snapshot so analytics & OLAP reflect the uploaded CSV immediately
      loadRecordsIntoWarehouse(state.cleanedRows, {
        mode: state.mode,
        filename: state.filename,
        recordsExtracted: state.rawRows.length,
        duplicatesRemoved: state.rawProfile.duplicateRows,
        missingFixed: state.rawProfile.missingTotal,
      });

      const warehouseStats = getWarehouseStats(state.mode, state.filename);
      return res.json({
        message: `Loaded ${parsedRows.length.toLocaleString()} records from ${filename}.`,
        mode: state.mode,
        filename: state.filename,
        isCleaned: state.isCleaned,
        rawProfile: state.rawProfile,
        cleaningComparison: state.cleaningComparison,
        warehouseStats,
      });
    } catch (err) {
      return res.status(400).json({
        error: err instanceof Error ? err.message : 'Failed to parse uploaded CSV file.',
      });
    }
  });

  app.post('/api/dataset/reset-demo', (_req, res) => {
    state = initializeState(
      generateDemoDataset(600),
      'demonstration',
      'demonstration_healthcare_sample.csv'
    );
    const warehouseStats = getWarehouseStats(state.mode, state.filename);
    res.json({
      message: 'Restored Demonstration Mode dataset (600 synthetic records).',
      mode: state.mode,
      filename: state.filename,
      isCleaned: state.isCleaned,
      rawProfile: state.rawProfile,
      cleaningComparison: state.cleaningComparison,
      warehouseStats,
    });
  });

  app.post('/api/dataset/clean', (_req, res) => {
    const { cleanedRows, comparison } = cleanRawDataset(state.rawRows, state.rawProfile);
    state.cleanedRows = cleanedRows;
    state.isCleaned = true;
    state.cleaningComparison = { ...comparison, cleaned: true };
    res.json({
      message: `Cleaned ${cleanedRows.length.toLocaleString()} records (removed ${state.rawProfile.duplicateRows} duplicates, fixed ${state.rawProfile.missingTotal} missing values).`,
      isCleaned: true,
      cleaningComparison: state.cleaningComparison,
    });
  });

  app.get('/api/dataset/download-csv', (_req, res) => {
    const csv = recordsToCsv(state.cleanedRows);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="mediinsight_cleaned_healthcare.csv"');
    res.send(csv);
  });

  app.post('/api/etl/run', (_req, res) => {
    try {
      const etlRun = loadRecordsIntoWarehouse(state.cleanedRows, {
        mode: state.mode,
        filename: state.filename,
        recordsExtracted: state.rawRows.length,
        duplicatesRemoved: state.rawProfile.duplicateRows,
        missingFixed: state.rawProfile.missingTotal,
      });
      const warehouseStats = getWarehouseStats(state.mode, state.filename);
      res.json({
        message: `ETL completed: ${etlRun.records_loaded.toLocaleString()} facts loaded into SQLite Star Schema.`,
        etlRun,
        warehouseStats,
      });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'ETL pipeline failed.' });
    }
  });

  app.get('/api/warehouse/stats', (_req, res) => {
    res.json(getWarehouseStats(state.mode, state.filename));
  });

  app.post('/api/analytics', (req, res) => {
    const filters: AnalyticsFilters = req.body?.filters || {};
    const payload = computeAnalyticsPayload(
      state.cleanedRows,
      filters,
      state.mode,
      state.filename,
      state.isCleaned
    );
    res.json(payload);
  });

  app.post('/api/mining/run', (req, res) => {
    const targetColumn =
      req.body?.targetColumn === 'Admission Type' ? 'Admission Type' : 'Test Results';
    const k = Number(req.body?.k) || 4;
    const mining = runDataMiningSuite(state.cleanedRows, state.mode, targetColumn);
    const clustering = runKMeansClustering(state.cleanedRows, k);
    res.json({ mining, clustering });
  });

  app.post('/api/mining/cluster', (req, res) => {
    const k = Number(req.body?.k) || 4;
    const clustering = runKMeansClustering(state.cleanedRows, k);
    res.json(clustering);
  });

  app.post('/api/olap/query', (req, res) => {
    try {
      const olapReq: OlapQueryRequest = {
        operation: req.body?.operation || 'rollup',
        rowDim: req.body?.rowDim || 'condition',
        colDim: req.body?.colDim || 'admission_type',
        measure: req.body?.measure || 'admissions',
        sliceField: req.body?.sliceField,
        sliceValue: req.body?.sliceValue,
        diceFilters: req.body?.diceFilters,
      };
      const result = runOlapQuery(olapReq);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'OLAP query failed.' });
    }
  });

  app.get('/api/hospitals/insights', (_req, res) => {
    res.json(computeHospitalInsights(state.cleanedRows, state.mode));
  });

  app.post('/api/ai/chat', async (req, res) => {
    const question = String(req.body?.question || '').trim();
    if (!question) {
      return res.status(400).json({ error: 'Please enter a question.' });
    }
    const result = await queryMediBotAI(
      question,
      state.cleanedRows,
      state.mode,
      state.filename,
      state.isCleaned
    );
    res.json(result);
  });

  // --- Vite Dev Middleware or Static Production Build ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MediInsight AI server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
