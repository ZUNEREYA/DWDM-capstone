import React from 'react';
import { ArrowRight, CheckCircle2, Database, FileSpreadsheet, Play, RefreshCw } from 'lucide-react';
import { WarehouseStats } from '../types/healthcare';

interface EtlProcessPageProps {
  stats: WarehouseStats | null;
  onRunEtl: () => Promise<void>;
  etlRunning: boolean;
}

export const EtlProcessPage: React.FC<EtlProcessPageProps> = ({
  stats,
  onRunEtl,
  etlRunning,
}) => {
  const latest = stats?.latestEtlRun;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#0F2942]">
            Module 2: Interactive ETL Pipeline
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Execute the Extract, Transform, and Load workflow into the centralized SQLite Star Schema warehouse.
          </p>
        </div>

        <button
          type="button"
          onClick={onRunEtl}
          disabled={etlRunning}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#0F2942] hover:bg-sky-900 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
        >
          {etlRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 text-emerald-300" />}
          <span>{etlRunning ? 'Running ETL...' : 'Run ETL Pipeline'}</span>
        </button>
      </div>

      {/* Interactive 3-Stage ETL Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-sky-700">Stage 01 · EXTRACT</span>
            <FileSpreadsheet className="w-5 h-5 text-sky-700" />
          </div>
          <h2 className="mt-2 font-display text-lg font-bold text-[#0F2942]">
            CSV Source Ingestion
          </h2>
          <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
            Reads raw admission records from uploaded Kaggle CSV or Demonstration dataset, validates 15 expected columns, and computes schema statistics.
          </p>
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-baseline justify-between">
            <span className="text-xs text-slate-500">Records Extracted</span>
            <span className="font-mono text-2xl font-bold text-[#0F2942] tabular-nums">
              {latest ? latest.records_extracted.toLocaleString() : '0'}
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700">Stage 02 · TRANSFORM</span>
            <ArrowRight className="w-5 h-5 text-emerald-700" />
          </div>
          <h2 className="mt-2 font-display text-lg font-bold text-[#0F2942]">
            Clean, Normalize & Anonymize
          </h2>
          <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
            Drops duplicate admissions, imputes missing cells, derives Age Groups and Length of Stay, and hashes patient PII into surrogate keys.
          </p>
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-baseline justify-between">
            <span className="text-xs text-slate-500">Records Transformed</span>
            <span className="font-mono text-2xl font-bold text-emerald-700 tabular-nums">
              {latest ? latest.records_transformed.toLocaleString() : '0'}
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#0F2942]">Stage 03 · LOAD</span>
            <Database className="w-5 h-5 text-[#0F2942]" />
          </div>
          <h2 className="mt-2 font-display text-lg font-bold text-[#0F2942]">
            SQLite Star Schema Commit
          </h2>
          <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
            Atomically populates Dim_Patient, Dim_Hospital, Dim_Date, Dim_Medical_Condition, Dim_Insurance, and Fact_Admission inside a single SQL transaction.
          </p>
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-baseline justify-between">
            <span className="text-xs text-slate-500">Records Loaded</span>
            <span className="font-mono text-2xl font-bold text-[#0F2942] tabular-nums">
              {latest ? latest.records_loaded.toLocaleString() : '0'}
            </span>
          </div>
        </div>
      </div>

      {/* Latest Run Status Banner */}
      {latest && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <div className="text-sm font-bold text-[#0F2942]">
                ETL Pipeline Status: {latest.status}
              </div>
              <div className="text-xs text-slate-600 mt-0.5">
                Batch #{latest.run_id} · Source: {latest.source_filename} · Removed {latest.duplicates_removed} duplicates & fixed {latest.missing_fixed} missing cells
              </div>
            </div>
          </div>
          <div className="font-mono text-xs text-slate-500 tabular-nums">
            {new Date(latest.executed_at).toLocaleString()}
          </div>
        </div>
      )}

      {/* Historical ETL Runs Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="font-display text-base font-bold text-[#0F2942]">
            Historical ETL Execution Log
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Persisted in SQLite table ETL_Run_History across warehouse reloads
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <th className="py-3 px-4 font-semibold">Run ID</th>
                <th className="py-3 px-4 font-semibold">Mode</th>
                <th className="py-3 px-4 font-semibold">Source File</th>
                <th className="py-3 px-4 font-semibold text-right">Extracted</th>
                <th className="py-3 px-4 font-semibold text-right">Transformed</th>
                <th className="py-3 px-4 font-semibold text-right">Loaded</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Executed At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(stats?.etlHistory || []).map((run) => (
                <tr key={run.run_id} className="hover:bg-slate-50/70">
                  <td className="py-2.5 px-4 font-mono tabular-nums text-[#0F2942]">#{run.run_id}</td>
                  <td className="py-2.5 px-4 capitalize">{run.dataset_mode}</td>
                  <td className="py-2.5 px-4 font-mono text-slate-700">{run.source_filename}</td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums">{run.records_extracted.toLocaleString()}</td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums">{run.records_transformed.toLocaleString()}</td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-emerald-700">
                    {run.records_loaded.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-4 text-emerald-700 font-medium">{run.status}</td>
                  <td className="py-2.5 px-4 font-mono tabular-nums text-slate-500">
                    {new Date(run.executed_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
