import React, { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Layers, Play } from 'lucide-react';
import { OlapQueryRequest, OlapQueryResult } from '../types/healthcare';

const OLAP_MODES: Array<{ id: OlapQueryRequest['operation']; label: string; summary: string }> = [
  { id: 'rollup', label: 'Roll-Up', summary: 'Aggregate facts upward to coarse hierarchies (e.g., Year or Condition).' },
  { id: 'drilldown', label: 'Drill-Down', summary: 'Navigate downward into detailed granularity (e.g., Month or Hospital).' },
  { id: 'slice', label: 'Slice', summary: 'Fix one dimension value to inspect a 2D warehouse cross-section.' },
  { id: 'dice', label: 'Dice', summary: 'Filter multiple cube dimensions simultaneously into a sub-cube.' },
  { id: 'pivot', label: 'Pivot', summary: 'Rotate row and column axes to cross-tabulate warehouse measures.' },
];

export const OlapExplorerPage: React.FC = () => {
  const [req, setReq] = useState<OlapQueryRequest>({
    operation: 'rollup',
    rowDim: 'condition',
    colDim: 'admission_type',
    measure: 'admissions',
    sliceField: 'year',
    sliceValue: 'All',
    diceFilters: { year: 'All', hospital: 'All', age_group: 'All', condition: 'All' },
  });
  const [result, setResult] = useState<OlapQueryResult | null>(null);
  const [loading, setLoading] = useState(false);

  const executeOlap = async (nextReq: OlapQueryRequest) => {
    setLoading(true);
    try {
      const res = await fetch('/api/olap/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextReq),
      });
      const data = await res.json();
      setResult(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    executeOlap(req);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpSelect = (op: OlapQueryRequest['operation']) => {
    const next: OlapQueryRequest = {
      ...req,
      operation: op,
      rowDim: op === 'rollup' ? 'year' : op === 'drilldown' ? 'month' : req.rowDim,
    };
    setReq(next);
    executeOlap(next);
  };

  const chartData = (result?.rows || []).slice(0, 12).map((row) => {
    const firstKey = result?.columns[0] || '';
    const metricKey = req.operation === 'pivot' ? result?.columns[1] || '' : 'Admissions';
    return {
      name: String(row[firstKey] ?? ''),
      value: Number(row[metricKey] ?? 0),
    };
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#0F2942]">
          Interactive OLAP Cube Explorer
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Perform real SQL Roll-Up, Drill-Down, Slice, Dice, and Pivot operations directly on the SQLite Star Schema warehouse.
        </p>
      </div>

      {/* OLAP Operation Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {OLAP_MODES.map((m) => {
          const active = req.operation === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => handleOpSelect(m.id)}
              className={`text-left p-4 rounded-xl border transition-colors ${
                active
                  ? 'bg-[#0F2942] text-white border-[#0F2942]'
                  : 'bg-white text-slate-800 border-slate-200 hover:border-sky-300'
              }`}
            >
              <div className="font-display text-sm font-bold">{m.label}</div>
              <div className={`mt-1 text-[11px] leading-snug ${active ? 'text-sky-100' : 'text-slate-500'}`}>
                {m.summary}
              </div>
            </button>
          );
        })}
      </div>

      {/* Dynamic Axis & Sub-Cube Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Row Dimension</label>
            <select
              value={req.rowDim}
              onChange={(e) => setReq({ ...req, rowDim: e.target.value as OlapQueryRequest['rowDim'] })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
            >
              <option value="year">Year</option>
              <option value="month">Month</option>
              <option value="hospital">Hospital</option>
              <option value="age_group">Age Group</option>
              <option value="condition">Medical Condition</option>
              <option value="admission_type">Admission Type</option>
              <option value="test_results">Test Results</option>
            </select>
          </div>

          {req.operation === 'pivot' && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Pivot Column Axis</label>
              <select
                value={req.colDim || 'admission_type'}
                onChange={(e) => setReq({ ...req, colDim: e.target.value as OlapQueryRequest['colDim'] })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
              >
                <option value="admission_type">Admission Type</option>
                <option value="test_results">Test Results</option>
                <option value="gender">Gender</option>
                <option value="age_group">Age Group</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Primary Measure</label>
            <select
              value={req.measure}
              onChange={(e) => setReq({ ...req, measure: e.target.value as OlapQueryRequest['measure'] })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
            >
              <option value="admissions">Admission Count</option>
              <option value="avg_billing">Average Billing ($)</option>
              <option value="total_billing">Total Billing ($)</option>
              <option value="avg_stay">Average Stay (Days)</option>
            </select>
          </div>

          {req.operation === 'slice' && result && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Slice Dimension</label>
                <select
                  value={req.sliceField || 'year'}
                  onChange={(e) => setReq({ ...req, sliceField: e.target.value, sliceValue: 'All' })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                >
                  <option value="year">Year</option>
                  <option value="hospital">Hospital</option>
                  <option value="age_group">Age Group</option>
                  <option value="condition">Medical Condition</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Slice Value</label>
                <select
                  value={req.sliceValue || 'All'}
                  onChange={(e) => setReq({ ...req, sliceValue: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                >
                  <option value="All">All</option>
                  {(req.sliceField === 'hospital'
                    ? result.availableSlices.hospitals
                    : req.sliceField === 'age_group'
                    ? result.availableSlices.ageGroups
                    : req.sliceField === 'condition'
                    ? result.availableSlices.conditions
                    : result.availableSlices.years
                  ).map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>

        {req.operation === 'dice' && result && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">Year</label>
              <select
                value={req.diceFilters?.year || 'All'}
                onChange={(e) => setReq({ ...req, diceFilters: { ...req.diceFilters, year: e.target.value } })}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
              >
                <option value="All">All Years</option>
                {result.availableSlices.years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">Hospital</label>
              <select
                value={req.diceFilters?.hospital || 'All'}
                onChange={(e) => setReq({ ...req, diceFilters: { ...req.diceFilters, hospital: e.target.value } })}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
              >
                <option value="All">All Hospitals</option>
                {result.availableSlices.hospitals.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">Age Group</label>
              <select
                value={req.diceFilters?.age_group || 'All'}
                onChange={(e) => setReq({ ...req, diceFilters: { ...req.diceFilters, age_group: e.target.value } })}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
              >
                <option value="All">All Age Groups</option>
                {result.availableSlices.ageGroups.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">Medical Condition</label>
              <select
                value={req.diceFilters?.condition || 'All'}
                onChange={(e) => setReq({ ...req, diceFilters: { ...req.diceFilters, condition: e.target.value } })}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
              >
                <option value="All">All Conditions</option>
                {result.availableSlices.conditions.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => executeOlap(req)}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-[#0F2942] hover:bg-sky-900 rounded-lg transition-colors"
          >
            <Play className="w-3.5 h-3.5 text-emerald-300" />
            <span>{loading ? 'Querying Cube...' : 'Execute OLAP Query'}</span>
          </button>
        </div>
      </div>

      {/* Plain English Explanation & SQL Inspector */}
      {result && (
        <>
          <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-5">
            <div className="flex items-center gap-2 text-xs font-bold text-[#0F2942]">
              <Layers className="w-4 h-4 text-sky-700" />
              <span>How {result.operation} Works</span>
            </div>
            <p className="mt-1.5 text-sm text-slate-700 leading-relaxed">{result.explanation}</p>
            <div className="mt-3 p-3 bg-white border border-sky-100 rounded-lg font-mono text-[11px] text-slate-600 overflow-x-auto">
              {result.sqlPreview}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6">
              <h3 className="font-display text-base font-bold text-[#0F2942]">
                OLAP Cube Visualization
              </h3>
              <div className="h-72 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#475569' }} />
                    <Tooltip />
                    <Bar dataKey="value" name="Measure" fill="#0284C7" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200">
                <h3 className="font-display text-base font-bold text-[#0F2942]">
                  Warehouse Cube Result Table ({result.rows.length} rows)
                </h3>
              </div>
              <div className="overflow-x-auto max-h-80">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 sticky top-0">
                      {result.columns.map((col, idx) => (
                        <th
                          key={col}
                          className={`py-2.5 px-4 font-semibold ${idx > 0 ? 'text-right' : ''}`}
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {result.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-50/70">
                        {result.columns.map((col, cIdx) => (
                          <td
                            key={col}
                            className={`py-2.5 px-4 ${
                              cIdx === 0 ? 'font-medium text-[#0F2942]' : 'text-right font-mono tabular-nums text-slate-700'
                            }`}
                          >
                            {typeof row[col] === 'number' ? Number(row[col]).toLocaleString() : String(row[col] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
