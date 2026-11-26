import React from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowRight, Bot, Sparkles } from 'lucide-react';
import { AnalyticsPayload } from '../types/healthcare';
import { LanguageCode, NavPageId, TRANSLATIONS } from '../i18n/translations';

interface DashboardPageProps {
  language: LanguageCode;
  analytics: AnalyticsPayload | null;
  loading: boolean;
  onNavigate: (page: NavPageId) => void;
}

const CHART_COLORS = ['#0F2942', '#0284C7', '#10B981', '#0EA5E9', '#14B8A6', '#64748B'];

export const DashboardPage: React.FC<DashboardPageProps> = ({
  language,
  analytics,
  loading,
  onNavigate,
}) => {
  const t = TRANSLATIONS[language];

  if (loading || !analytics) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-24 bg-white border border-slate-200 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-80 bg-white border border-slate-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  const kpiCards = [
    { label: t.kpis.totalPatients, value: analytics.kpis.totalPatientRecords.toLocaleString() },
    { label: t.kpis.totalHospitals, value: analytics.kpis.totalHospitals.toLocaleString() },
    { label: t.kpis.totalConditions, value: analytics.kpis.totalMedicalConditions.toLocaleString() },
    { label: t.kpis.avgAge, value: `${analytics.kpis.avgPatientAge} yrs` },
    { label: t.kpis.totalAdmissions, value: analytics.kpis.totalAdmissions.toLocaleString() },
    { label: t.kpis.avgBilling, value: `$${analytics.kpis.avgBillingAmount.toLocaleString()}` },
    { label: t.kpis.avgStay, value: `${analytics.kpis.avgHospitalStay} days` },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#0F2942]">
            {t.nav.dashboard}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Anonymized executive overview calculated directly from{' '}
            <span className="font-medium text-slate-800">{analytics.filename}</span> · Patient PII masked.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('ai-assistant')}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#0F2942] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors whitespace-nowrap"
          >
            <Bot className="w-4 h-4 text-emerald-700" />
            <span>Ask MediBot AI</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('healthcare-analytics')}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0F2942] hover:bg-sky-900 rounded-lg transition-colors whitespace-nowrap"
          >
            <span>Full 10-Chart Studio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 7 Executive KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3.5">
        {kpiCards.map((kpi) => (
          <div
            key={kpi.label}
            className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between"
          >
            <span className="text-xs text-slate-500 leading-snug">{kpi.label}</span>
            <span className="mt-2 font-mono text-xl font-bold text-[#0F2942] tabular-nums">
              {kpi.value}
            </span>
          </div>
        ))}
      </div>

      {/* Smart Insight Generator */}
      <section>
        <div className="flex items-center gap-2 mb-3.5">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <h2 className="font-display text-lg font-bold text-[#0F2942]">
            Smart Insight Generator
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {analytics.insights.map((ins) => (
            <div key={ins.id} className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="text-xs text-slate-500">{ins.metricLabel} · {ins.title}</div>
              <div className="mt-1 font-display text-lg font-bold text-[#0F2942]">
                {ins.value}
              </div>
              <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">{ins.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Primary Executive Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="font-display text-base font-bold text-[#0F2942]">
            Medical Condition Distribution
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Admission volume by diagnosed condition</p>
          <div className="h-72 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.charts.conditionDistribution} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#475569' }} />
                <YAxis tick={{ fontSize: 12, fill: '#475569' }} />
                <Tooltip />
                <Bar dataKey="count" name="Admissions" fill="#0F2942" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="font-display text-base font-bold text-[#0F2942]">
            Monthly Admission Trends
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Time-series volume across admission dates</p>
          <div className="h-72 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.charts.monthlyAdmissions} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                <defs>
                  <linearGradient id="dashAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284C7" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#0284C7" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#475569' }} minTickGap={24} />
                <YAxis tick={{ fontSize: 12, fill: '#475569' }} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="admissions"
                  name="Admissions"
                  stroke="#0284C7"
                  strokeWidth={2}
                  fill="url(#dashAreaGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="font-display text-base font-bold text-[#0F2942]">
            Test Results Breakdown
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Normal vs Abnormal vs Inconclusive distribution</p>
          <div className="h-72 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.charts.testResultsDistribution}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={96}
                  paddingAngle={3}
                  label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(1)}%)`}
                >
                  {analytics.charts.testResultsDistribution.map((_, idx) => (
                    <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="font-display text-base font-bold text-[#0F2942]">
            Patient Age Distribution
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Hospitalizations segmented by demographic age group</p>
          <div className="h-72 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.charts.ageDistribution} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="group" tick={{ fontSize: 12, fill: '#475569' }} />
                <YAxis tick={{ fontSize: 12, fill: '#475569' }} />
                <Tooltip />
                <Bar dataKey="count" name="Patients" fill="#10B981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
