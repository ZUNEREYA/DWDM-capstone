import React from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Filter, RotateCcw } from 'lucide-react';
import { AnalyticsFilters, AnalyticsPayload } from '../types/healthcare';

interface HealthcareAnalyticsPageProps {
  analytics: AnalyticsPayload | null;
  filters: AnalyticsFilters;
  onFiltersChange: (next: AnalyticsFilters) => void;
  onResetFilters: () => void;
  loading: boolean;
}

const COLORS = ['#0F2942', '#0284C7', '#10B981', '#0EA5E9', '#D97706', '#64748B'];

export const HealthcareAnalyticsPage: React.FC<HealthcareAnalyticsPageProps> = ({
  analytics,
  filters,
  onFiltersChange,
  onResetFilters,
  loading,
}) => {
  if (!analytics) {
    return <div className="p-8 text-sm text-slate-500">Loading Healthcare Analytics Studio...</div>;
  }

  const { filterOptions, charts, kpis } = analytics;

  const update = (patch: Partial<AnalyticsFilters>) => {
    onFiltersChange({ ...filters, ...patch });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#0F2942]">
            Module 4: Healthcare Analytics Studio (10 Interactive Charts)
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Showing <span className="font-mono font-semibold text-[#0F2942] tabular-nums">{analytics.filteredCount.toLocaleString()}</span> of{' '}
            <span className="font-mono tabular-nums">{analytics.totalSourceRows.toLocaleString()}</span> anonymized records matching active filters.
          </p>
        </div>

        <button
          type="button"
          onClick={onResetFilters}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset All 7 Filters</span>
        </button>
      </div>

      {/* 7 Interactive Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-center gap-2 text-xs font-bold text-[#0F2942] mb-3.5">
          <Filter className="w-3.5 h-3.5 text-sky-700" />
          <span>Dynamic Multi-Dimensional Filters</span>
          {loading && <span className="text-sky-700 font-normal">Updating charts...</span>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Min Age</label>
            <input
              type="number"
              min={0}
              max={120}
              value={filters.ageMin ?? filterOptions.minAge}
              onChange={(e) => update({ ageMin: e.target.value ? Number(e.target.value) : undefined })}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Max Age</label>
            <input
              type="number"
              min={0}
              max={120}
              value={filters.ageMax ?? filterOptions.maxAge}
              onChange={(e) => update({ ageMax: e.target.value ? Number(e.target.value) : undefined })}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Gender</label>
            <select
              value={filters.gender || 'All'}
              onChange={(e) => update({ gender: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
            >
              <option value="All">All Genders</option>
              {filterOptions.genders.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Medical Condition</label>
            <select
              value={filters.medicalCondition || 'All'}
              onChange={(e) => update({ medicalCondition: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
            >
              <option value="All">All Conditions</option>
              {filterOptions.conditions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Hospital</label>
            <select
              value={filters.hospital || 'All'}
              onChange={(e) => update({ hospital: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
            >
              <option value="All">All Hospitals</option>
              {filterOptions.hospitals.map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Admission Type</label>
            <select
              value={filters.admissionType || 'All'}
              onChange={(e) => update({ admissionType: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
            >
              <option value="All">All Types</option>
              {filterOptions.admissionTypes.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Test Results</label>
            <select
              value={filters.testResults || 'All'}
              onChange={(e) => update({ testResults: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
            >
              <option value="All">All Results</option>
              {filterOptions.testResults.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Admission Date From</label>
            <input
              type="date"
              value={filters.dateFrom || filterOptions.minDate}
              onChange={(e) => update({ dateFrom: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Admission Date To</label>
            <input
              type="date"
              value={filters.dateTo || filterOptions.maxDate}
              onChange={(e) => update({ dateTo: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
            />
          </div>
          <div className="sm:col-span-2 flex flex-wrap items-center gap-6 text-xs text-slate-600 pb-1">
            <span>Avg Age: <strong className="font-mono text-[#0F2942] tabular-nums">{kpis.avgPatientAge} yrs</strong></span>
            <span>Avg Billing: <strong className="font-mono text-emerald-700 tabular-nums">${kpis.avgBillingAmount.toLocaleString()}</strong></span>
            <span>Avg Stay: <strong className="font-mono text-sky-700 tabular-nums">{kpis.avgHospitalStay} days</strong></span>
          </div>
        </div>
      </div>

      {/* 10 Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Medical Condition Distribution */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="font-display text-base font-bold text-[#0F2942]">01. Medical Condition Distribution</h3>
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.conditionDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} />
                <YAxis tick={{ fontSize: 11, fill: '#475569' }} />
                <Tooltip />
                <Bar dataKey="count" name="Admissions" fill="#0F2942" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Patient Age Distribution */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="font-display text-base font-bold text-[#0F2942]">02. Patient Age Distribution</h3>
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.ageDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="group" tick={{ fontSize: 11, fill: '#475569' }} />
                <YAxis tick={{ fontSize: 11, fill: '#475569' }} />
                <Tooltip />
                <Bar dataKey="count" name="Patients" fill="#10B981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Monthly Admission Trends */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="font-display text-base font-bold text-[#0F2942]">03. Monthly Admission Trends</h3>
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.monthlyAdmissions}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#475569' }} minTickGap={20} />
                <YAxis tick={{ fontSize: 11, fill: '#475569' }} />
                <Tooltip />
                <Area type="monotone" dataKey="admissions" stroke="#0284C7" fill="#bae6fd" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Admission Type Distribution (Pie) */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="font-display text-base font-bold text-[#0F2942]">04. Admission Type Distribution</h3>
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.admissionTypeDistribution}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={88}
                  label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                >
                  {charts.admissionTypeDistribution.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 5. Test Results Analysis (Donut) */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="font-display text-base font-bold text-[#0F2942]">05. Test Results Analysis</h3>
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.testResultsDistribution}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={86}
                  paddingAngle={3}
                  label={({ name, value }) => `${name}: ${value ?? 0}`}
                >
                  {charts.testResultsDistribution.map((_, i) => (
                    <Cell key={i} fill={COLORS[(i + 1) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 6. Medication Distribution */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="font-display text-base font-bold text-[#0F2942]">06. Medication Distribution</h3>
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.medicationDistribution} layout="vertical" margin={{ left: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#475569' }} />
                <YAxis dataKey="name" type="category" width={95} tick={{ fontSize: 11, fill: '#334155' }} />
                <Tooltip />
                <Bar dataKey="count" name="Prescriptions" fill="#0284C7" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 7. Hospital Comparison */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="font-display text-base font-bold text-[#0F2942]">07. Hospital Comparison (Admissions)</h3>
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.hospitalComparison.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="hospital" tick={{ fontSize: 10, fill: '#475569' }} interval={0} angle={-12} textAnchor="end" height={48} />
                <YAxis tick={{ fontSize: 11, fill: '#475569' }} />
                <Tooltip />
                <Bar dataKey="admissions" name="Admissions" fill="#0F2942" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 8. Billing Analysis by Condition */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="font-display text-base font-bold text-[#0F2942]">08. Billing Analysis (Average Billing $)</h3>
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.billingByCondition}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="condition" tick={{ fontSize: 11, fill: '#475569' }} />
                <YAxis tick={{ fontSize: 11, fill: '#475569' }} />
                <Tooltip formatter={(val) => `$${Number(val ?? 0).toLocaleString()}`} />
                <Bar dataKey="avgBilling" name="Avg Billing ($)" fill="#10B981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 9. Patient Segmentation Scatter (Age vs Billing) */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="font-display text-base font-bold text-[#0F2942]">09. Age vs Billing Correlation Scatter</h3>
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" dataKey="age" name="Age" unit=" yrs" tick={{ fontSize: 11, fill: '#475569' }} />
                <YAxis type="number" dataKey="billing" name="Billing" unit="$" tick={{ fontSize: 11, fill: '#475569' }} />
                <Tooltip />
                <Scatter name="Admissions" data={charts.ageBillingScatter} fill="#0284C7" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 10. Healthcare Trends (Monthly Avg Billing & Gender Condition Mix) */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="font-display text-base font-bold text-[#0F2942]">10. Healthcare Trends (Monthly Average Billing)</h3>
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.monthlyAdmissions}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#475569' }} minTickGap={20} />
                <YAxis tick={{ fontSize: 11, fill: '#475569' }} />
                <Tooltip formatter={(val) => `$${Number(val ?? 0).toLocaleString()}`} />
                <Legend />
                <Line type="monotone" dataKey="avgBilling" name="Avg Billing ($)" stroke="#0F2942" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
