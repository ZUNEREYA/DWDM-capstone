import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';
import { Users } from 'lucide-react';
import { ClusteringResult } from '../types/healthcare';

interface PatientSegmentationPageProps {
  clustering: ClusteringResult | null;
  loading: boolean;
  k: number;
  onChangeK: (newK: number) => void;
}

const CLUSTER_COLORS = ['#0F2942', '#0284C7', '#10B981', '#D97706', '#7C3AED', '#DC2626'];

export const PatientSegmentationPage: React.FC<PatientSegmentationPageProps> = ({
  clustering,
  loading,
  k,
  onChangeK,
}) => {
  if (loading || !clustering) {
    return (
      <div className="space-y-6">
        <div className="h-24 bg-white border border-slate-200 rounded-xl animate-pulse" />
        <div className="h-80 bg-white border border-slate-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#0F2942]">
            Module 3: Patient Segmentation (K-Means Clustering)
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Unsupervised segmentation grouping anonymized admissions by standardized Age, Billing Amount, and Length of Stay.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-medium text-slate-600">Clusters (K):</span>
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
            {[2, 3, 4, 5, 6].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => onChangeK(val)}
                className={`px-3 py-1.5 text-xs font-mono font-semibold rounded-md transition-colors ${
                  k === val ? 'bg-white text-[#0F2942] shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {val}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs text-slate-500">Active Clusters (K)</div>
          <div className="mt-1 font-mono text-2xl font-bold text-[#0F2942] tabular-nums">
            {clustering.k}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs text-slate-500">Records Clustered</div>
          <div className="mt-1 font-mono text-2xl font-bold text-[#0F2942] tabular-nums">
            {clustering.totalPoints.toLocaleString()}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs text-slate-500">Within-Cluster Inertia (SSE)</div>
          <div className="mt-1 font-mono text-2xl font-bold text-sky-700 tabular-nums">
            {clustering.inertia.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Interactive Cluster Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="font-display text-base font-bold text-[#0F2942]">
            Cluster Scatter Projection (Age vs Billing Amount)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Each point represents an anonymized patient stay colored by its assigned K-Means cluster
          </p>
          <div className="h-80 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 12, right: 16, bottom: 12, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" dataKey="age" name="Age" unit=" yrs" tick={{ fontSize: 11, fill: '#475569' }} />
                <YAxis type="number" dataKey="billing" name="Billing" unit="$" tick={{ fontSize: 11, fill: '#475569' }} />
                <ZAxis type="number" dataKey="stay" range={[35, 110]} name="Stay (Days)" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                {clustering.clusters.map((cl, idx) => (
                  <Scatter
                    key={cl.clusterId}
                    name={`Cluster ${cl.clusterId}`}
                    data={clustering.scatterPoints.filter((p) => p.clusterId === cl.clusterId)}
                    fill={CLUSTER_COLORS[idx % CLUSTER_COLORS.length]}
                  />
                ))}
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="font-display text-base font-bold text-[#0F2942]">
            Cluster Size Distribution
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Patient volume across discovered segments
          </p>
          <div className="h-80 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={clustering.clusters} margin={{ top: 12, right: 16, bottom: 12, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#475569' }} />
                <YAxis tick={{ fontSize: 11, fill: '#475569' }} />
                <Tooltip />
                <Bar dataKey="count" name="Patients" radius={[6, 6, 0, 0]}>
                  {clustering.clusters.map((_, idx) => (
                    <Cell key={idx} fill={CLUSTER_COLORS[idx % CLUSTER_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Cluster Profile Cards */}
      <section>
        <div className="flex items-center gap-2 mb-3.5">
          <Users className="w-4 h-4 text-emerald-700" />
          <h2 className="font-display text-lg font-bold text-[#0F2942]">
            Cluster Characteristics & Clinical Profiles
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {clustering.clusters.map((cl, idx) => (
            <div key={cl.clusterId} className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-center justify-between">
                <span
                  className="text-xs font-mono font-bold"
                  style={{ color: CLUSTER_COLORS[idx % CLUSTER_COLORS.length] }}
                >
                  Cluster 0{cl.clusterId}
                </span>
                <span className="font-mono text-xs text-slate-500 tabular-nums">
                  {cl.percentage}% ({cl.count.toLocaleString()})
                </span>
              </div>
              <h3 className="mt-1 font-display text-base font-bold text-[#0F2942]">{cl.label}</h3>
              <dl className="mt-4 space-y-2 text-xs border-t border-slate-100 pt-3">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Average Age</dt>
                  <dd className="font-mono font-semibold text-slate-900 tabular-nums">{cl.avgAge} yrs</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Average Billing</dt>
                  <dd className="font-mono font-semibold text-emerald-700 tabular-nums">${cl.avgBilling.toLocaleString()}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Avg Stay</dt>
                  <dd className="font-mono font-semibold text-slate-900 tabular-nums">{cl.avgStay} days</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Top Condition</dt>
                  <dd className="font-medium text-slate-900">{cl.topCondition}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Primary Channel</dt>
                  <dd className="font-medium text-slate-900">{cl.topAdmissionType}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Dominant Test</dt>
                  <dd className="font-medium text-slate-900">{cl.dominantTestResult}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
