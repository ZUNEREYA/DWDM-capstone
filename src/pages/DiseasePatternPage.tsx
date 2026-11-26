import React, { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AlertCircle, Cpu, RefreshCw, TrendingUp } from 'lucide-react';
import { DataMiningResponse } from '../types/healthcare';

interface DiseasePatternPageProps {
  mining: DataMiningResponse | null;
  loading: boolean;
  targetColumn: 'Test Results' | 'Admission Type';
  onTargetChange: (target: 'Test Results' | 'Admission Type') => void;
  onRetrain: () => void;
}

export const DiseasePatternPage: React.FC<DiseasePatternPageProps> = ({
  mining,
  loading,
  targetColumn,
  onTargetChange,
  onRetrain,
}) => {
  const [selectedModelIdx, setSelectedModelIdx] = useState(0);

  if (loading || !mining) {
    return (
      <div className="space-y-6">
        <div className="h-24 bg-white border border-slate-200 rounded-xl animate-pulse" />
        <div className="h-80 bg-white border border-slate-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  const activeModel = mining.models[selectedModelIdx] || mining.models[0];

  return (
    <div className="space-y-8">
      {/* Header & Target Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#0F2942]">
            Module 3: Disease Pattern Discovery & Classification
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Supervised classification benchmarks, Explainable AI feature influence, plain-English patterns, and historical trend analysis.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
            {(['Test Results', 'Admission Type'] as const).map((col) => (
              <button
                key={col}
                type="button"
                onClick={() => onTargetChange(col)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  targetColumn === col
                    ? 'bg-white text-[#0F2942] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Target: {col}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onRetrain}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0F2942] hover:bg-sky-900 rounded-lg transition-colors whitespace-nowrap"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Re-Evaluate Models</span>
          </button>
        </div>
      </div>

      {/* Educational Disclaimer */}
      <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-sky-700 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-700 leading-relaxed">
          <span className="font-bold text-[#0F2942]">Educational Classification Notice:</span>{' '}
          These models classify administrative record labels ({targetColumn}) on an 80/20 train-test split of {mining.sampleSize.toLocaleString()} records for data mining evaluation. They demonstrate algorithmic pattern recognition and are{' '}
          <span className="font-semibold">not clinical diagnostic predictors</span>.
        </div>
      </div>

      {/* A. Classification Model Comparison Cards */}
      <section>
        <div className="flex items-center gap-2 mb-3.5">
          <Cpu className="w-4 h-4 text-sky-700" />
          <h2 className="font-display text-lg font-bold text-[#0F2942]">
            A. Supervised Classification Models (Target: {mining.targetColumn})
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {mining.models.map((m, idx) => {
            const isSel = idx === selectedModelIdx;
            return (
              <button
                key={m.name}
                type="button"
                onClick={() => setSelectedModelIdx(idx)}
                className={`text-left bg-white border rounded-xl p-5 transition-colors ${
                  isSel ? 'border-[#0F2942] ring-1 ring-[#0F2942]' : 'border-slate-200 hover:border-sky-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display text-base font-bold text-[#0F2942]">{m.name}</span>
                  <span className="text-xs font-medium text-sky-700">
                    {isSel ? 'Inspecting' : 'Select'}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{m.algorithm}</div>

                <div className="mt-4 grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                  <div>
                    <div className="text-[11px] text-slate-500">Accuracy</div>
                    <div className="font-mono text-lg font-bold text-[#0F2942] tabular-nums">{m.accuracy}%</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500">F1-Score</div>
                    <div className="font-mono text-lg font-bold text-emerald-700 tabular-nums">{m.f1Score}%</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500">Precision</div>
                    <div className="font-mono text-sm font-semibold text-slate-800 tabular-nums">{m.precision}%</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500">Recall</div>
                    <div className="font-mono text-sm font-semibold text-slate-800 tabular-nums">{m.recall}%</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Confusion Matrix & Explainable AI Feature Importance */}
      {activeModel && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6">
            <h3 className="font-display text-base font-bold text-[#0F2942]">
              Confusion Matrix — {activeModel.name}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Evaluated on {activeModel.testSize.toLocaleString()} held-out test records (Train: {activeModel.trainSize.toLocaleString()})
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-center border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="py-2.5 px-3 text-left text-slate-500 font-medium">Actual \ Predicted</th>
                    {activeModel.labels.map((lbl) => (
                      <th key={lbl} className="py-2.5 px-3 font-semibold text-[#0F2942]">
                        {lbl}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeModel.labels.map((rowLbl, rIdx) => (
                    <tr key={rowLbl}>
                      <td className="py-2.5 px-3 text-left font-semibold text-slate-700 bg-slate-50/50">
                        {rowLbl}
                      </td>
                      {activeModel.confusionMatrix[rIdx]?.map((val, cIdx) => {
                        const isDiag = rIdx === cIdx;
                        return (
                          <td
                            key={cIdx}
                            className={`py-2.5 px-3 font-mono tabular-nums font-semibold ${
                              isDiag ? 'bg-emerald-50 text-emerald-800' : 'text-slate-600'
                            }`}
                          >
                            {val}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-xs text-slate-600 leading-relaxed">{activeModel.explanation}</p>
          </div>

          {/* Explainable AI Feature Importance */}
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6">
            <h3 className="font-display text-base font-bold text-[#0F2942]">
              Explainable AI — Feature Influence ({activeModel.name})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Relative feature contribution (%) explaining why the model produced its classifications
            </p>
            <div className="h-64 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={activeModel.featureImportance}
                  layout="vertical"
                  margin={{ top: 4, right: 20, left: 40, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#475569' }} unit="%" />
                  <YAxis dataKey="feature" type="category" width={120} tick={{ fontSize: 11, fill: '#334155' }} />
                  <Tooltip formatter={(val) => `${val ?? 0}%`} />
                  <Bar dataKey="importance" name="Feature Influence" fill="#0284C7" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Model Limitation: Administrative billing, room, and admission channel features capture operational patterns rather than physiological biomarkers.
            </p>
          </div>
        </div>
      )}

      {/* C. Pattern Discovery */}
      <section className="space-y-4">
        <div>
          <h2 className="font-display text-lg font-bold text-[#0F2942]">
            C. Discovered Clinical & Operational Patterns
          </h2>
          <p className="text-xs text-slate-500">
            Plain-English findings extracted directly from the active dataset
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mining.patterns.plainEnglishSummaries.map((summary, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="text-xs font-mono text-emerald-700 font-semibold">Finding 0{i + 1}</div>
              <p className="mt-1.5 text-sm text-slate-800 leading-relaxed">{summary}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="font-display text-base font-bold text-[#0F2942]">
                Dominant Medical Conditions by Age Group
              </h3>
            </div>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <th className="py-2.5 px-4 font-semibold">Age Cohort</th>
                  <th className="py-2.5 px-4 font-semibold">Most Frequent Condition</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Cases</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mining.patterns.conditionByAgeGroup.map((row) => (
                  <tr key={row.ageGroup}>
                    <td className="py-2.5 px-4 font-mono font-medium text-[#0F2942]">{row.ageGroup} yrs</td>
                    <td className="py-2.5 px-4 font-medium text-slate-800">{row.topCondition}</td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums">{row.count.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="font-display text-base font-bold text-[#0F2942]">
                Admission Type & Diagnostic Test Patterns
              </h3>
            </div>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <th className="py-2.5 px-4 font-semibold">Admission Type</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Volume</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Avg Stay</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Abnormal Tests %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mining.patterns.admissionTypePatterns.map((row) => (
                  <tr key={row.admissionType}>
                    <td className="py-2.5 px-4 font-medium text-[#0F2942]">{row.admissionType}</td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums">{row.count.toLocaleString()}</td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums">{row.avgStay} days</td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums text-amber-700">{row.abnormalPct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* D. Educational Historical Trend Analysis */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-sky-700" />
            <h2 className="font-display text-base font-bold text-[#0F2942]">
              D. Educational Historical Trend Analysis ({mining.historicalTrends.trendDirection})
            </h2>
          </div>
          <div className="font-mono text-xs text-slate-600 tabular-nums">
            Period Half-over-Half Change: {mining.historicalTrends.monthlyGrowthRatePct > 0 ? '+' : ''}
            {mining.historicalTrends.monthlyGrowthRatePct}%
          </div>
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mining.historicalTrends.monthlySeries} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#475569' }} minTickGap={24} />
              <YAxis tick={{ fontSize: 12, fill: '#475569' }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="admissions" name="Monthly Admissions" stroke="#0F2942" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="movingAvg" name="3-Month Moving Avg" stroke="#10B981" strokeWidth={2} strokeDasharray="4 4" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <p className="mt-4 text-xs text-slate-600 leading-relaxed">
          {mining.historicalTrends.educationalNote}
        </p>
      </section>
    </div>
  );
};
