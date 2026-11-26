import React from 'react';
import { Cpu, Download, FileSpreadsheet, FileText, Sparkles } from 'lucide-react';
import {
  AnalyticsPayload,
  CleaningComparison,
  DataMiningResponse,
  DataQualityProfile,
} from '../types/healthcare';
import {
  generateAnalyticsPdfReport,
  generateDataQualityPdfReport,
  generateMlEvaluationPdfReport,
} from '../utils/pdfReports';

interface ReportsPageProps {
  analytics: AnalyticsPayload | null;
  profile: DataQualityProfile | null;
  comparison: CleaningComparison | null;
  mining: DataMiningResponse | null;
  onSuccessToast: (msg: string) => void;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({
  analytics,
  profile,
  comparison,
  mining,
  onSuccessToast,
}) => {
  const handleAnalyticsPdf = () => {
    if (!analytics) return;
    generateAnalyticsPdfReport(analytics);
    onSuccessToast('Downloaded Analytics Executive PDF Report.');
  };

  const handleQualityPdf = () => {
    if (!profile || !comparison) return;
    generateDataQualityPdfReport(profile, comparison);
    onSuccessToast('Downloaded Data Quality Audit PDF Report.');
  };

  const handleMlPdf = () => {
    if (!mining) return;
    generateMlEvaluationPdfReport(mining);
    onSuccessToast('Downloaded Machine Learning Evaluation PDF Report.');
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#0F2942]">
          Report Generator & Exports
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Download dynamically generated PDF reports and the cleaned, privacy-anonymized CSV dataset computed from your active records.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="p-2.5 w-fit rounded-lg bg-sky-50 border border-sky-100 text-sky-700 mb-4">
              <FileText className="w-5 h-5" />
            </div>
            <h2 className="font-display text-lg font-bold text-[#0F2942]">
              PDF Healthcare Analytics Report
            </h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Includes executive KPIs, condition-level billing analysis, and Smart Insight Generator findings formatted for capstone review.
            </p>
          </div>
          <button
            type="button"
            disabled={!analytics}
            onClick={handleAnalyticsPdf}
            className="mt-6 inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#0F2942] hover:bg-sky-900 disabled:opacity-50 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download Analytics PDF</span>
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="p-2.5 w-fit rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 mb-4">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h2 className="font-display text-lg font-bold text-[#0F2942]">
              Cleaned & Anonymized CSV Dataset
            </h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Exports the deduplicated, imputed, standardized dataset with patient names replaced by SHA-256 surrogate hashes and derived Length of Stay.
            </p>
          </div>
          <a
            href="/api/dataset/download-csv"
            onClick={() => onSuccessToast('Downloading cleaned CSV dataset.')}
            className="mt-6 inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download Cleaned CSV</span>
          </a>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="p-2.5 w-fit rounded-lg bg-slate-100 border border-slate-200 text-[#0F2942] mb-4">
              <Sparkles className="w-5 h-5" />
            </div>
            <h2 className="font-display text-lg font-bold text-[#0F2942]">
              PDF Data Quality & Preprocessing Report
            </h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Full Before-vs-After preprocessing comparison table, missingness audit by column, duplicate count, and composite quality score.
            </p>
          </div>
          <button
            type="button"
            disabled={!profile || !comparison}
            onClick={handleQualityPdf}
            className="mt-6 inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold text-[#0F2942] bg-white hover:bg-slate-50 border border-slate-300 disabled:opacity-50 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4 text-sky-700" />
            <span>Download Data Quality PDF</span>
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="p-2.5 w-fit rounded-lg bg-slate-100 border border-slate-200 text-[#0F2942] mb-4">
              <Cpu className="w-5 h-5" />
            </div>
            <h2 className="font-display text-lg font-bold text-[#0F2942]">
              PDF Machine Learning Evaluation Report
            </h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Summarizes Decision Tree, Random Forest, and Logistic Regression accuracy, precision, recall, F1-score, and discovered pattern statements.
            </p>
          </div>
          <button
            type="button"
            disabled={!mining}
            onClick={handleMlPdf}
            className="mt-6 inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold text-[#0F2942] bg-white hover:bg-slate-50 border border-slate-300 disabled:opacity-50 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4 text-sky-700" />
            <span>Download ML Evaluation PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
