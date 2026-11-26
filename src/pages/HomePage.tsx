import React from 'react';
import {
  ArrowRight,
  BarChart3,
  Building2,
  Cpu,
  Database,
  FileSpreadsheet,
  GraduationCap,
  LineChart,
  ShieldCheck,
  Upload,
  Users,
} from 'lucide-react';
import { AnalyticsPayload } from '../types/healthcare';
import { LanguageCode, NavPageId, TRANSLATIONS } from '../i18n/translations';

interface HomePageProps {
  language: LanguageCode;
  analytics: AnalyticsPayload | null;
  onNavigate: (page: NavPageId) => void;
}

const PIPELINE_STEPS = [
  { step: '01', name: 'COLLECT', desc: 'Ingest Kaggle CSV admissions & clinical attributes with PII masking.' },
  { step: '02', name: 'CLEAN', desc: 'Detect & resolve missing cells, duplicates, and format drift.' },
  { step: '03', name: 'STORE', desc: 'Load Fact_Admission & 5 dimensions into SQLite Star Schema.' },
  { step: '04', name: 'ANALYZE', desc: 'Slice, dice, roll-up & pivot multidimensional OLAP cubes.' },
  { step: '05', name: 'DISCOVER', desc: 'Train Decision Tree, Random Forest, Logistic Regression & K-Means.' },
  { step: '06', name: 'VISUALIZE', desc: 'Explore 10 interactive charts, MediBot AI & PDF/CSV exports.' },
];

const MODULES = [
  {
    num: 'Module 01',
    title: 'Data Collection & Preprocessing',
    desc: 'Automated CSV schema validation, missing value audit, duplicate detection, whitespace normalization, and privacy-preserving PII redaction with Before vs After quality comparison.',
    target: 'data-collection' as NavPageId,
    icon: FileSpreadsheet,
  },
  {
    num: 'Module 02',
    title: 'Data Warehouse & ETL Pipeline',
    desc: 'End-to-end Extract, Transform, and Load pipeline populating an atomic SQLite Star Schema (Fact_Admission + 5 Dimension tables) with full ETL run history.',
    target: 'data-warehouse' as NavPageId,
    icon: Database,
  },
  {
    num: 'Module 03',
    title: 'Data Mining & Pattern Discovery',
    desc: 'Train and benchmark Decision Tree, Random Forest, and Logistic Regression classifiers alongside K-Means patient segmentation and plain-English pattern discovery.',
    target: 'disease-pattern' as NavPageId,
    icon: Cpu,
  },
  {
    num: 'Module 04',
    title: 'Healthcare Analytics & AI Insights',
    desc: 'Interactive 10-chart dashboard with 7 dynamic filters, live SQL OLAP Explorer, Hospital Resource Planning, MediBot AI assistant, and automated PDF/CSV reports.',
    target: 'healthcare-analytics' as NavPageId,
    icon: BarChart3,
  },
];

const STAKEHOLDERS = [
  {
    role: 'Healthcare Administrators',
    benefit: 'Monitor facility admission volume, length of stay, and hypothetical bed/nursing allocations across hospital branches.',
    icon: Building2,
  },
  {
    role: 'Medical Researchers',
    benefit: 'Inspect condition distributions across age cohorts, diagnostic test patterns, and historical trend trajectories without PII exposure.',
    icon: LineChart,
  },
  {
    role: 'Students & Capstone Evaluators',
    benefit: 'Demonstrate authentic Star Schema modeling, ETL execution, supervised classification metrics, and OLAP cube operations in one workspace.',
    icon: GraduationCap,
  },
  {
    role: 'Data Analysts',
    benefit: 'Profile raw CSV quality, execute dynamic slice-and-dice SQL queries, and export cleaned datasets and PDF audit summaries.',
    icon: Users,
  },
  {
    role: 'Hospital Management Teams',
    benefit: 'Compare average billing across conditions, emergency vs elective intake ratios, and medication demand patterns.',
    icon: ShieldCheck,
  },
];

export const HomePage: React.FC<HomePageProps> = ({ language, analytics, onNavigate }) => {
  const t = TRANSLATIONS[language];

  return (
    <div className="space-y-12 pb-12">
      {/* Hero Split Section */}
      <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-center bg-gradient-to-br from-white via-sky-50/40 to-emerald-50/30">
            <div className="text-xs font-medium text-sky-700 mb-3">
              {t.brandName} · {t.tagline}
            </div>
            <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-[#0F2942] leading-[1.12] max-w-2xl [text-wrap:balance]">
              {t.heroTitle}
            </h1>
            <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
              {t.heroSubtitle}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onNavigate('dashboard')}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#0F2942] hover:bg-sky-900 rounded-lg transition-colors whitespace-nowrap"
              >
                <span>{t.exploreDashboardBtn}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('data-collection')}
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-[#0F2942] bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors whitespace-nowrap"
              >
                <Upload className="w-4 h-4 text-sky-700" />
                <span>{t.uploadCsvBtn}</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('about-project')}
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium text-slate-700 hover:text-[#0F2942] hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap"
              >
                <span>{t.learnProjectBtn}</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 relative min-h-[280px] bg-slate-100 border-t lg:border-t-0 lg:border-l border-slate-200">
            <img
              src="/src/assets/images/hero_healthcare_studio_1795697261244.jpg"
              alt="MediInsight AI clinical analytics environment"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0F2942]/75 via-[#0F2942]/15 to-transparent flex items-end p-6">
              <div className="text-white">
                <div className="text-xs font-medium text-emerald-300">
                  {analytics?.mode === 'uploaded' ? 'Live Kaggle Dataset' : 'Active Demonstration Snapshot'}
                </div>
                <div className="mt-1 text-sm font-medium text-slate-100 tabular-nums">
                  {analytics
                    ? `${analytics.kpis.totalAdmissions.toLocaleString()} admissions · ${analytics.kpis.totalHospitals} hospitals · $${analytics.kpis.avgBillingAmount.toLocaleString()} avg billing`
                    : 'Star Schema Warehouse & ML Engine Ready'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Telemetry Preview Strip directly anchored under hero */}
        {analytics && (
          <div className="grid grid-cols-2 lg:grid-cols-4 border-t border-slate-200 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 bg-white">
            <div className="p-5">
              <div className="text-xs text-slate-500">{t.kpis.totalAdmissions}</div>
              <div className="mt-1 font-mono text-2xl font-bold text-[#0F2942] tabular-nums">
                {analytics.kpis.totalAdmissions.toLocaleString()}
              </div>
            </div>
            <div className="p-5">
              <div className="text-xs text-slate-500">{t.kpis.totalConditions}</div>
              <div className="mt-1 font-mono text-2xl font-bold text-[#0F2942] tabular-nums">
                {analytics.kpis.totalMedicalConditions}
              </div>
            </div>
            <div className="p-5">
              <div className="text-xs text-slate-500">{t.kpis.avgBilling}</div>
              <div className="mt-1 font-mono text-2xl font-bold text-emerald-700 tabular-nums">
                ${analytics.kpis.avgBillingAmount.toLocaleString()}
              </div>
            </div>
            <div className="p-5">
              <div className="text-xs text-slate-500">{t.kpis.avgStay}</div>
              <div className="mt-1 font-mono text-2xl font-bold text-sky-700 tabular-nums">
                {analytics.kpis.avgHospitalStay} days
              </div>
            </div>
          </div>
        )}
      </section>

      {/* How MediInsight AI Works: 6-Stage Architecture Pipeline */}
      <section>
        <div className="mb-5">
          <h2 className="font-display text-2xl font-bold text-[#0F2942]">
            How MediInsight AI Works
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            End-to-end data engineering and clinical intelligence pipeline transforming raw hospital CSV records into validated insights.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          {PIPELINE_STEPS.map((item) => (
            <div
              key={item.step}
              className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between"
            >
              <div>
                <div className="font-mono text-xs font-semibold text-emerald-700">
                  Step {item.step}
                </div>
                <h3 className="mt-1.5 font-display text-base font-bold text-[#0F2942]">
                  {item.name}
                </h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Four Core Capstone Modules */}
      <section>
        <div className="mb-5">
          <h2 className="font-display text-2xl font-bold text-[#0F2942]">
            Four Integrated Capstone Modules
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Click any module to inspect live data processing, Star Schema storage, machine learning evaluation, or interactive dashboards.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {MODULES.map((mod) => {
            const Icon = mod.icon;
            return (
              <button
                key={mod.num}
                type="button"
                onClick={() => onNavigate(mod.target)}
                className="text-left bg-white border border-slate-200 hover:border-sky-300 rounded-xl p-6 transition-colors group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-medium text-sky-700">{mod.num}</div>
                    <h3 className="mt-1 font-display text-lg font-bold text-[#0F2942] group-hover:text-sky-800">
                      {mod.title}
                    </h3>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[#0F2942] group-hover:bg-sky-50">
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-600 leading-relaxed">{mod.desc}</p>
                <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700">
                  <span>Open Module</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Stakeholder Benefits */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8">
        <div className="mb-6">
          <h2 className="font-display text-2xl font-bold text-[#0F2942]">
            Built for Every Healthcare Analytics Stakeholder
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Designed for clarity during academic capstone presentations while delivering practical operational value.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {STAKEHOLDERS.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.role} className="border-t border-slate-200 pt-4">
                <Icon className="w-5 h-5 text-emerald-600 mb-2.5" />
                <h3 className="font-display text-sm font-bold text-[#0F2942]">{s.role}</h3>
                <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">{s.benefit}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
