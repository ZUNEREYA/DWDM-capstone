import React, { useRef, useState } from 'react';
import {
  CheckCircle2,
  FileSpreadsheet,
  RotateCcw,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { DataQualityProfile } from '../types/healthcare';
import { NavPageId } from '../i18n/translations';

interface DataCollectionPageProps {
  profile: DataQualityProfile | null;
  onUploadFile: (file: File) => Promise<void>;
  onResetDemo: () => Promise<void>;
  onNavigate: (page: NavPageId) => void;
  uploading: boolean;
}

export const DataCollectionPage: React.FC<DataCollectionPageProps> = ({
  profile,
  onUploadFile,
  onResetDemo,
  onNavigate,
  uploading,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    await onUploadFile(files[0]);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#0F2942]">
            Module 1: Data Collection
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Upload the Kaggle Healthcare Dataset (Prasad22) CSV to automatically profile columns, detect anomalies, and mask patient PII.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onResetDemo}
            disabled={uploading}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Use Demo Dataset</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('data-preprocessing')}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0F2942] hover:bg-sky-900 rounded-lg transition-colors whitespace-nowrap"
          >
            <span>Proceed to Preprocessing</span>
          </button>
        </div>
      </div>

      {/* Upload Dropzone & Kaggle Dataset Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFiles(e.dataTransfer.files);
          }}
          className={`lg:col-span-7 bg-white border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-colors ${
            dragOver ? 'border-sky-500 bg-sky-50/40' : 'border-slate-300'
          }`}
        >
          <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-100 text-sky-700 mb-4">
            <Upload className="w-6 h-6" />
          </div>
          <h2 className="font-display text-lg font-bold text-[#0F2942]">
            {uploading ? 'Parsing & Profiling CSV Dataset...' : 'Upload Kaggle Healthcare CSV'}
          </h2>
          <p className="mt-1.5 text-sm text-slate-600 max-w-md">
            Drag and drop <span className="font-mono text-xs text-slate-800">healthcare_dataset.csv</span> here, or browse from your computer. Supports full 55,500+ row Kaggle datasets.
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#0F2942] hover:bg-sky-900 disabled:opacity-50 rounded-lg transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{uploading ? 'Processing...' : 'Select CSV File'}</span>
          </button>
        </div>

        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Privacy-Preserving Ingestion</span>
            </div>
            <h3 className="font-display text-base font-bold text-[#0F2942]">
              Expected Kaggle Dataset Schema
            </h3>
            <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
              Compatible with <span className="font-medium text-slate-800">Healthcare Dataset by Prasad22</span> (15 columns). Patient <span className="font-mono">Name</span> and <span className="font-mono">Doctor</span> identifiers are automatically masked into surrogate hashes (<span className="font-mono">PT-XXXXXXXX</span>) before display or warehousing.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-slate-700 font-mono">
              <span>• Name (Masked)</span>
              <span>• Age</span>
              <span>• Gender</span>
              <span>• Blood Type</span>
              <span>• Medical Condition</span>
              <span>• Date of Admission</span>
              <span>• Doctor (Redacted)</span>
              <span>• Hospital</span>
              <span>• Insurance Provider</span>
              <span>• Billing Amount</span>
              <span>• Room Number</span>
              <span>• Admission Type</span>
              <span>• Discharge Date</span>
              <span>• Medication</span>
              <span>• Test Results</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
            Dataset source: kaggle.com/datasets/prasad22/healthcare-dataset
          </div>
        </div>
      </div>

      {/* Dataset Overview Metrics */}
      {profile && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="text-xs text-slate-500">Total Rows</div>
              <div className="mt-1 font-mono text-xl font-bold text-[#0F2942] tabular-nums">
                {profile.totalRows.toLocaleString()}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="text-xs text-slate-500">Total Columns</div>
              <div className="mt-1 font-mono text-xl font-bold text-[#0F2942] tabular-nums">
                {profile.totalColumns}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="text-xs text-slate-500">Numerical Columns</div>
              <div className="mt-1 font-mono text-xl font-bold text-sky-700 tabular-nums">
                {profile.numericalColumns.length}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="text-xs text-slate-500">Categorical Columns</div>
              <div className="mt-1 font-mono text-xl font-bold text-emerald-700 tabular-nums">
                {profile.categoricalColumns.length}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="text-xs text-slate-500">Missing Values</div>
              <div className="mt-1 font-mono text-xl font-bold text-amber-700 tabular-nums">
                {profile.missingTotal.toLocaleString()}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="text-xs text-slate-500">Duplicate Records</div>
              <div className="mt-1 font-mono text-xl font-bold text-rose-700 tabular-nums">
                {profile.duplicateRows.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Column Type Classification Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-display text-base font-bold text-[#0F2942]">
                  Automated Column Schema & Anomaly Audit
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Numerical: {profile.numericalColumns.join(', ')} · Categorical: {profile.categoricalColumns.join(', ')}
                </p>
              </div>
              <div className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
                <span>PII Fields Masked</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <th className="py-3 px-4 font-semibold">Column Name</th>
                    <th className="py-3 px-4 font-semibold">Detected Type</th>
                    <th className="py-3 px-4 font-semibold text-right">Missing</th>
                    <th className="py-3 px-4 font-semibold text-right">Missing %</th>
                    <th className="py-3 px-4 font-semibold text-right">Unique</th>
                    <th className="py-3 px-4 font-semibold text-right">Inconsistent</th>
                    <th className="py-3 px-4 font-semibold">Sample Values</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {profile.columns.map((col) => (
                    <tr key={col.name} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-4 font-medium text-slate-900">{col.name}</td>
                      <td className="py-2.5 px-4 font-mono text-slate-600 uppercase">{col.type}</td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-700">
                        {col.missingCount.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-700">
                        {col.missingPct}%
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-700">
                        {col.uniqueCount.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-amber-700">
                        {col.inconsistentCount.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500 truncate max-w-[260px]">
                        {col.sampleValues.join(', ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Dataset Preview Table (First 25 Rows, PII Masked) */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="font-display text-base font-bold text-[#0F2942]">
                Privacy-Protected Dataset Preview (First 25 Rows)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Direct patient names and physician names are anonymized before rendering.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    {profile.columns.map((c) => (
                      <th key={c.name} className="py-2.5 px-3 font-semibold whitespace-nowrap">
                        {c.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {profile.previewRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70">
                      {profile.columns.map((c) => (
                        <td
                          key={c.name}
                          className="py-2 px-3 text-slate-700 whitespace-nowrap font-mono tabular-nums"
                        >
                          {row[c.name] === null || row[c.name] === '' ? (
                            <span className="text-rose-600 font-semibold">NULL</span>
                          ) : (
                            String(row[c.name])
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
