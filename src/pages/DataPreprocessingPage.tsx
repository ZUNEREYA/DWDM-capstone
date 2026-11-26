import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CheckCircle2, Download, Sparkles } from 'lucide-react';
import { CleaningComparison, DataQualityProfile } from '../types/healthcare';

interface DataPreprocessingPageProps {
  profile: DataQualityProfile | null;
  comparison: CleaningComparison | null;
  isCleaned: boolean;
  onCleanDataset: () => Promise<void>;
  cleaningLoading: boolean;
}

export const DataPreprocessingPage: React.FC<DataPreprocessingPageProps> = ({
  profile,
  comparison,
  isCleaned,
  onCleanDataset,
  cleaningLoading,
}) => {
  if (!profile || !comparison) {
    return <div className="p-8 text-sm text-slate-500">Loading preprocessing audit...</div>;
  }

  const comparisonChartData = [
    {
      metric: 'Missing Cells',
      Before: comparison.before.missingValues,
      After: isCleaned ? comparison.after.missingValues : comparison.before.missingValues,
    },
    {
      metric: 'Duplicates',
      Before: comparison.before.duplicateRows,
      After: isCleaned ? comparison.after.duplicateRows : comparison.before.duplicateRows,
    },
    {
      metric: 'Inconsistencies',
      Before: comparison.before.inconsistentValues,
      After: isCleaned ? comparison.after.inconsistentValues : comparison.before.inconsistentValues,
    },
  ];

  const missingColData = comparison.missingByColumn.filter((m) => m.before > 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#0F2942]">
            Module 1: Data Preprocessing & Quality Audit
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Inspect raw data quality defects and apply automated cleaning, deduplication, imputation, and standardization.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onCleanDataset}
            disabled={cleaningLoading}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#0F2942] hover:bg-sky-900 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4 text-emerald-300" />
            <span>{cleaningLoading ? 'Cleaning...' : isCleaned ? 'Re-Run Cleaning' : 'Clean Dataset'}</span>
          </button>

          <a
            href="/api/dataset/download-csv"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#0F2942] bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors whitespace-nowrap"
          >
            <Download className="w-4 h-4 text-sky-700" />
            <span>Download Cleaned CSV</span>
          </a>
        </div>
      </div>

      {/* Data Quality Score & Before vs After KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs text-slate-500">Data Quality Score (Raw)</div>
          <div className="mt-1 font-mono text-2xl font-bold text-amber-700 tabular-nums">
            {comparison.before.qualityScore}%
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {comparison.before.missingValues + comparison.before.duplicateRows + comparison.before.inconsistentValues} total anomalies
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs text-slate-500">Data Quality Score (After Cleaning)</div>
          <div className="mt-1 font-mono text-2xl font-bold text-emerald-700 tabular-nums">
            {isCleaned ? `${comparison.after.qualityScore}%` : 'Pending Clean'}
          </div>
          <div className="mt-1 text-xs text-emerald-700 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isCleaned ? 'Verified Clean Schema' : 'Click Clean Dataset'}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs text-slate-500">Duplicate Records Detected</div>
          <div className="mt-1 font-mono text-2xl font-bold text-[#0F2942] tabular-nums">
            {comparison.before.duplicateRows.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {isCleaned ? `Removed -> ${comparison.after.totalRows.toLocaleString()} unique rows` : 'Pending deduplication'}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs text-slate-500">Format & Value Anomalies</div>
          <div className="mt-1 font-mono text-2xl font-bold text-[#0F2942] tabular-nums">
            {comparison.before.inconsistentValues.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Negative billing: {profile.negativeBillingCount} · Date errors: {profile.invalidDateRangeCount}
          </div>
        </div>
      </div>

      {/* Visual Comparison Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="font-display text-base font-bold text-[#0F2942]">
            Before vs After Preprocessing Comparison
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Defect count reduction across missingness, duplicates, and format inconsistencies
          </p>
          <div className="h-72 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonChartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="metric" tick={{ fontSize: 12, fill: '#475569' }} />
                <YAxis tick={{ fontSize: 12, fill: '#475569' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Before" fill="#D97706" radius={[6, 6, 0, 0]} />
                <Bar dataKey="After" fill="#10B981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="font-display text-base font-bold text-[#0F2942]">
            Missing Values by Column
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Columns containing null or blank cells prior to imputation
          </p>
          <div className="h-72 mt-4">
            {missingColData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={missingColData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="column" tick={{ fontSize: 11, fill: '#475569' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#475569' }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="before" name="Missing (Before)" fill="#0F2942" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="after" name="Missing (After)" fill="#10B981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mb-2" />
                <p className="text-sm font-medium text-slate-700">Zero missing values detected in source CSV</p>
                <p className="text-xs text-slate-500 mt-1">All {profile.totalColumns} columns have 100% cell completeness.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cleaning Summary Table & Before/After Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="font-display text-base font-bold text-[#0F2942]">
              Before vs After Metrics Report
            </h3>
          </div>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <th className="py-3 px-4 font-semibold">Metric</th>
                <th className="py-3 px-4 font-semibold text-right">Before</th>
                <th className="py-3 px-4 font-semibold text-right">After</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-3 px-4 font-medium text-slate-800">Total Records</td>
                <td className="py-3 px-4 text-right font-mono tabular-nums">{comparison.before.totalRows.toLocaleString()}</td>
                <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-700 font-semibold">
                  {comparison.after.totalRows.toLocaleString()}
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-slate-800">Missing Values</td>
                <td className="py-3 px-4 text-right font-mono tabular-nums text-amber-700">{comparison.before.missingValues.toLocaleString()}</td>
                <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-700 font-semibold">
                  {isCleaned ? comparison.after.missingValues : comparison.before.missingValues}
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-slate-800">Duplicate Records</td>
                <td className="py-3 px-4 text-right font-mono tabular-nums text-rose-700">{comparison.before.duplicateRows.toLocaleString()}</td>
                <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-700 font-semibold">
                  {isCleaned ? comparison.after.duplicateRows : comparison.before.duplicateRows}
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-slate-800">Inconsistent Formats</td>
                <td className="py-3 px-4 text-right font-mono tabular-nums text-amber-700">{comparison.before.inconsistentValues.toLocaleString()}</td>
                <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-700 font-semibold">
                  {isCleaned ? comparison.after.inconsistentValues : comparison.before.inconsistentValues}
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-slate-800">Data Quality Score</td>
                <td className="py-3 px-4 text-right font-mono tabular-nums">{comparison.before.qualityScore}%</td>
                <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-700 font-bold">
                  {isCleaned ? `${comparison.after.qualityScore}%` : '—'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="font-display text-base font-bold text-[#0F2942]">
              Preprocessing Transformation Log
            </h3>
          </div>
          <div className="divide-y divide-slate-100">
            {comparison.actionsLog.map((act) => (
              <div key={act.step} className="px-6 py-3.5 flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-bold text-[#0F2942]">{act.step}</div>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{act.detail}</p>
                </div>
                <div className="font-mono text-xs font-semibold text-sky-700 tabular-nums whitespace-nowrap">
                  {act.recordsAffected.toLocaleString()} affected
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
