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
import { Building2 } from 'lucide-react';
import { HospitalInsightsPayload } from '../types/healthcare';

interface HospitalInsightsPageProps {
  insights: HospitalInsightsPayload | null;
  loading: boolean;
}

export const HospitalInsightsPage: React.FC<HospitalInsightsPageProps> = ({
  insights,
  loading,
}) => {
  if (loading || !insights) {
    return (
      <div className="space-y-6">
        <div className="h-24 bg-white border border-slate-200 rounded-xl animate-pulse" />
        <div className="h-80 bg-white border border-slate-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#0F2942]">
          Hospital Insights & Resource Planning
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Explore historical admission volume, hospital workload distribution, length of stay, admission categories, and hypothetical bed/staffing requirements.
        </p>
      </div>

      {/* Overview Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs text-slate-500">Hospitals Tracked (Top Shown)</div>
          <div className="mt-1 font-mono text-2xl font-bold text-[#0F2942] tabular-nums">
            {insights.hospitals.length}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs text-slate-500">Overall Average Stay</div>
          <div className="mt-1 font-mono text-2xl font-bold text-sky-700 tabular-nums">
            {insights.overallAvgStay} days
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs text-slate-500">Cumulative Patient Bed-Days</div>
          <div className="mt-1 font-mono text-2xl font-bold text-emerald-700 tabular-nums">
            {insights.overallTotalPatientDays.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Workload & Admission Category Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="font-display text-base font-bold text-[#0F2942]">
            Hospital Workload by Admission Category
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Emergency, Urgent, and Elective admissions stacked per hospital facility
          </p>
          <div className="h-72 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={insights.hospitals.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="hospital" tick={{ fontSize: 10, fill: '#475569' }} interval={0} angle={-12} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 11, fill: '#475569' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="emergencyCount" name="Emergency" stackId="a" fill="#0F2942" />
                <Bar dataKey="urgentCount" name="Urgent" stackId="a" fill="#0284C7" />
                <Bar dataKey="electiveCount" name="Elective" stackId="a" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-display text-base font-bold text-[#0F2942]">
              Admission Category Stay Profile
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Average length of stay across intake channels
            </p>
          </div>
          <div className="mt-4 space-y-4">
            {insights.admissionMix.map((m) => (
              <div key={m.type} className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[#0F2942]">{m.type}</span>
                  <span className="font-mono text-xs text-slate-600 tabular-nums">{m.count.toLocaleString()} visits</span>
                </div>
                <div className="mt-1 text-xs text-slate-600">
                  Avg Stay: <strong className="font-mono text-sky-700 tabular-nums">{m.avgStay} days</strong>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-[11px] text-slate-500 leading-relaxed">
            Note: Hypothetical bed & nurse requirements are modeled from historical patient-days plus a 25% surge buffer (4:1 nurse-to-bed ratio) for administrative planning exercises.
          </div>
        </div>
      </div>

      {/* Resource Planning Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-sky-700" />
          <h3 className="font-display text-base font-bold text-[#0F2942]">
            Facility Workload & Hypothetical Resource Capacity Table
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <th className="py-3 px-4 font-semibold">Hospital</th>
                <th className="py-3 px-4 font-semibold text-right">Admissions</th>
                <th className="py-3 px-4 font-semibold text-right">Workload %</th>
                <th className="py-3 px-4 font-semibold text-right">Avg Stay</th>
                <th className="py-3 px-4 font-semibold text-right">Abnormal %</th>
                <th className="py-3 px-4 font-semibold">Top Condition</th>
                <th className="py-3 px-4 font-semibold text-right">Avg Billing</th>
                <th className="py-3 px-4 font-semibold text-right">Est. Beds Needed</th>
                <th className="py-3 px-4 font-semibold text-right">Est. Nurses/Shift</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {insights.hospitals.map((h) => (
                <tr key={h.hospital} className="hover:bg-slate-50/70">
                  <td className="py-2.5 px-4 font-medium text-[#0F2942]">{h.hospital}</td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums">{h.totalAdmissions.toLocaleString()}</td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums">{h.workloadSharePct}%</td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums">{h.avgStay} d</td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums text-amber-700">{h.abnormalRatePct}%</td>
                  <td className="py-2.5 px-4 text-slate-700">{h.topCondition}</td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums">${h.avgBilling.toLocaleString()}</td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-sky-700">
                    {h.estimatedBedsNeeded}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-emerald-700">
                    {h.estimatedNursesPerShift}
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
