import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import {
  AnalyticsFilters,
  AnalyticsPayload,
  CleaningComparison,
  ClusteringResult,
  DataMiningResponse,
  DataQualityProfile,
  DatasetMode,
  HospitalInsightsPayload,
  WarehouseStats,
} from './types/healthcare';
import { LanguageCode, NavPageId } from './i18n/translations';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { DashboardPage } from './pages/DashboardPage';
import { DataCollectionPage } from './pages/DataCollectionPage';
import { DataPreprocessingPage } from './pages/DataPreprocessingPage';
import { DataWarehousePage } from './pages/DataWarehousePage';
import { EtlProcessPage } from './pages/EtlProcessPage';
import { DiseasePatternPage } from './pages/DiseasePatternPage';
import { PatientSegmentationPage } from './pages/PatientSegmentationPage';
import { HealthcareAnalyticsPage } from './pages/HealthcareAnalyticsPage';
import { OlapExplorerPage } from './pages/OlapExplorerPage';
import { AiAssistantPage } from './pages/AiAssistantPage';
import { HospitalInsightsPage } from './pages/HospitalInsightsPage';
import { ReportsPage } from './pages/ReportsPage';
import { AboutProjectPage } from './pages/AboutProjectPage';

interface ToastMessage {
  type: 'success' | 'error';
  text: string;
}

export default function App() {
  const [activePage, setActivePage] = useState<NavPageId>('home');
  const [language, setLanguage] = useState<LanguageCode>('en');

  const [mode, setMode] = useState<DatasetMode>('demonstration');
  const [filename, setFilename] = useState<string>('demonstration_healthcare_sample.csv');
  const [isCleaned, setIsCleaned] = useState<boolean>(true);
  const [rawProfile, setRawProfile] = useState<DataQualityProfile | null>(null);
  const [cleaningComparison, setCleaningComparison] = useState<CleaningComparison | null>(null);
  const [warehouseStats, setWarehouseStats] = useState<WarehouseStats | null>(null);

  const [analytics, setAnalytics] = useState<AnalyticsPayload | null>(null);
  const [filters, setFilters] = useState<AnalyticsFilters>({});
  const [analyticsLoading, setAnalyticsLoading] = useState<boolean>(false);

  const [mining, setMining] = useState<DataMiningResponse | null>(null);
  const [clustering, setClustering] = useState<ClusteringResult | null>(null);
  const [targetColumn, setTargetColumn] = useState<'Test Results' | 'Admission Type'>('Test Results');
  const [clusterK, setClusterK] = useState<number>(4);
  const [miningLoading, setMiningLoading] = useState<boolean>(false);

  const [hospitalInsights, setHospitalInsights] = useState<HospitalInsightsPayload | null>(null);
  const [hospitalLoading, setHospitalLoading] = useState<boolean>(false);

  const [uploading, setUploading] = useState<boolean>(false);
  const [cleaningLoading, setCleaningLoading] = useState<boolean>(false);
  const [etlRunning, setEtlRunning] = useState<boolean>(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = useCallback((type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => {
      setToast((cur) => (cur?.text === text ? null : cur));
    }, 5000);
  }, []);

  const fetchAnalytics = useCallback(async (activeFilters: AnalyticsFilters) => {
    setAnalyticsLoading(true);
    try {
      const res = await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters: activeFilters }),
      });
      if (!res.ok) throw new Error('Failed to load analytics.');
      const data: AnalyticsPayload = await res.json();
      setAnalytics(data);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Analytics fetch failed.');
    } finally {
      setAnalyticsLoading(false);
    }
  }, [showToast]);

  const fetchMining = useCallback(async (target: 'Test Results' | 'Admission Type', k: number) => {
    setMiningLoading(true);
    try {
      const res = await fetch('/api/mining/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetColumn: target, k }),
      });
      if (!res.ok) throw new Error('Failed to run ML models.');
      const data = await res.json();
      setMining(data.mining);
      setClustering(data.clustering);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Data mining failed.');
    } finally {
      setMiningLoading(false);
    }
  }, [showToast]);

  const fetchHospitalInsights = useCallback(async () => {
    setHospitalLoading(true);
    try {
      const res = await fetch('/api/hospitals/insights');
      if (!res.ok) throw new Error('Failed to load hospital insights.');
      const data: HospitalInsightsPayload = await res.json();
      setHospitalInsights(data);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Hospital insights failed.');
    } finally {
      setHospitalLoading(false);
    }
  }, [showToast]);

  const refreshAllData = useCallback(async () => {
    try {
      const res = await fetch('/api/state');
      const data = await res.json();
      setMode(data.mode);
      setFilename(data.filename);
      setIsCleaned(data.isCleaned);
      setRawProfile(data.rawProfile);
      setCleaningComparison(data.cleaningComparison);
      setWarehouseStats(data.warehouseStats);
    } catch {
      showToast('error', 'Failed to connect to backend server.');
    }
    await Promise.all([
      fetchAnalytics({}),
      fetchMining(targetColumn, clusterK),
      fetchHospitalInsights(),
    ]);
  }, [clusterK, fetchAnalytics, fetchHospitalInsights, fetchMining, showToast, targetColumn]);

  useEffect(() => {
    refreshAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFiltersChange = (next: AnalyticsFilters) => {
    setFilters(next);
    fetchAnalytics(next);
  };

  const handleResetFilters = () => {
    setFilters({});
    fetchAnalytics({});
  };

  const handleUploadFile = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/dataset/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'CSV upload failed.');
      }
      setMode(data.mode);
      setFilename(data.filename);
      setIsCleaned(data.isCleaned);
      setRawProfile(data.rawProfile);
      setCleaningComparison(data.cleaningComparison);
      setWarehouseStats(data.warehouseStats);
      setFilters({});
      showToast('success', data.message);
      await Promise.all([
        fetchAnalytics({}),
        fetchMining(targetColumn, clusterK),
        fetchHospitalInsights(),
      ]);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'CSV upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleResetDemo = async () => {
    setUploading(true);
    try {
      const res = await fetch('/api/dataset/reset-demo', { method: 'POST' });
      const data = await res.json();
      setMode(data.mode);
      setFilename(data.filename);
      setIsCleaned(data.isCleaned);
      setRawProfile(data.rawProfile);
      setCleaningComparison(data.cleaningComparison);
      setWarehouseStats(data.warehouseStats);
      setFilters({});
      showToast('success', data.message);
      await Promise.all([
        fetchAnalytics({}),
        fetchMining(targetColumn, clusterK),
        fetchHospitalInsights(),
      ]);
    } catch {
      showToast('error', 'Failed to reset demonstration dataset.');
    } finally {
      setUploading(false);
    }
  };

  const handleCleanDataset = async () => {
    setCleaningLoading(true);
    try {
      const res = await fetch('/api/dataset/clean', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Cleaning failed.');
      setIsCleaned(true);
      setCleaningComparison(data.cleaningComparison);
      showToast('success', data.message);
      await Promise.all([
        fetchAnalytics(filters),
        fetchMining(targetColumn, clusterK),
        fetchHospitalInsights(),
      ]);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Dataset cleaning failed.');
    } finally {
      setCleaningLoading(false);
    }
  };

  const handleRunEtl = async () => {
    setEtlRunning(true);
    try {
      const res = await fetch('/api/etl/run', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ETL pipeline failed.');
      setWarehouseStats(data.warehouseStats);
      showToast('success', data.message);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'ETL pipeline failed.');
    } finally {
      setEtlRunning(false);
    }
  };

  const handleTargetChange = (nextTarget: 'Test Results' | 'Admission Type') => {
    setTargetColumn(nextTarget);
    fetchMining(nextTarget, clusterK);
  };

  const handleChangeK = async (newK: number) => {
    setClusterK(newK);
    setMiningLoading(true);
    try {
      const res = await fetch('/api/mining/cluster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ k: newK }),
      });
      const data: ClusteringResult = await res.json();
      setClustering(data);
    } finally {
      setMiningLoading(false);
    }
  };

  const renderPage = () => {
    switch (activePage) {
      case 'home':
        return (
          <HomePage
            language={language}
            analytics={analytics}
            onNavigate={setActivePage}
          />
        );
      case 'dashboard':
        return (
          <DashboardPage
            language={language}
            analytics={analytics}
            loading={analyticsLoading}
            onNavigate={setActivePage}
          />
        );
      case 'data-collection':
        return (
          <DataCollectionPage
            profile={rawProfile}
            onUploadFile={handleUploadFile}
            onResetDemo={handleResetDemo}
            onNavigate={setActivePage}
            uploading={uploading}
          />
        );
      case 'data-preprocessing':
        return (
          <DataPreprocessingPage
            profile={rawProfile}
            comparison={cleaningComparison}
            isCleaned={isCleaned}
            onCleanDataset={handleCleanDataset}
            cleaningLoading={cleaningLoading}
          />
        );
      case 'data-warehouse':
        return <DataWarehousePage stats={warehouseStats} />;
      case 'etl-process':
        return (
          <EtlProcessPage
            stats={warehouseStats}
            onRunEtl={handleRunEtl}
            etlRunning={etlRunning}
          />
        );
      case 'disease-pattern':
        return (
          <DiseasePatternPage
            mining={mining}
            loading={miningLoading}
            targetColumn={targetColumn}
            onTargetChange={handleTargetChange}
            onRetrain={() => fetchMining(targetColumn, clusterK)}
          />
        );
      case 'patient-segmentation':
        return (
          <PatientSegmentationPage
            clustering={clustering}
            loading={miningLoading}
            k={clusterK}
            onChangeK={handleChangeK}
          />
        );
      case 'healthcare-analytics':
        return (
          <HealthcareAnalyticsPage
            analytics={analytics}
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onResetFilters={handleResetFilters}
            loading={analyticsLoading}
          />
        );
      case 'olap-explorer':
        return <OlapExplorerPage />;
      case 'ai-assistant':
        return <AiAssistantPage />;
      case 'hospital-insights':
        return <HospitalInsightsPage insights={hospitalInsights} loading={hospitalLoading} />;
      case 'reports':
        return (
          <ReportsPage
            analytics={analytics}
            profile={rawProfile}
            comparison={cleaningComparison}
            mining={mining}
            onSuccessToast={(msg) => showToast('success', msg)}
          />
        );
      case 'about-project':
        return <AboutProjectPage />;
      default:
        return null;
    }
  };

  return (
    <Layout
      activePage={activePage}
      onNavigate={setActivePage}
      language={language}
      onLanguageChange={setLanguage}
      mode={mode}
      filename={filename}
      totalRows={rawProfile?.totalRows || 0}
      onQuickUploadClick={() => setActivePage('data-collection')}
    >
      {toast && (
        <div
          role="status"
          className={`mb-6 px-4 py-3 rounded-xl border flex items-center justify-between gap-3 text-xs font-medium ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{toast.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Dismiss notification"
            className="p-1 rounded hover:bg-black/5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {renderPage()}
    </Layout>
  );
}
