import React from 'react';
import { Database, KeyRound, Table2 } from 'lucide-react';
import { WarehouseStats } from '../types/healthcare';

interface DataWarehousePageProps {
  stats: WarehouseStats | null;
}

const STAR_DIMENSIONS = [
  {
    name: 'Dim_Patient',
    pk: 'patient_key',
    fields: ['patient_hash (SHA-256)', 'age', 'age_group', 'gender', 'blood_type'],
  },
  {
    name: 'Dim_Hospital',
    pk: 'hospital_key',
    fields: ['hospital_name', 'hospital_tier'],
  },
  {
    name: 'Dim_Date',
    pk: 'date_key',
    fields: ['full_date', 'year', 'quarter', 'month', 'month_name', 'day_of_week'],
  },
  {
    name: 'Dim_Medical_Condition',
    pk: 'condition_key',
    fields: ['condition_name', 'clinical_category'],
  },
  {
    name: 'Dim_Insurance',
    pk: 'insurance_key',
    fields: ['provider_name'],
  },
];

export const DataWarehousePage: React.FC<DataWarehousePageProps> = ({ stats }) => {
  if (!stats) {
    return <div className="p-8 text-sm text-slate-500">Loading SQLite Star Schema warehouse...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#0F2942]">
          Module 2: SQLite Star Schema Data Warehouse
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Centralized dimensional model separating quantitative admission facts from descriptive clinical dimensions.
        </p>
      </div>

      {/* Live SQLite Table Row Counts */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {Object.entries(stats.tables).map(([tableName, count]) => (
          <div key={tableName} className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono truncate">
              <Table2 className="w-3.5 h-3.5 text-sky-700 shrink-0" />
              <span className="truncate">{tableName}</span>
            </div>
            <div className="mt-2 font-mono text-xl font-bold text-[#0F2942] tabular-nums">
              {count.toLocaleString()}
            </div>
            <div className="text-xs text-slate-400">rows stored</div>
          </div>
        ))}
      </div>

      {/* Visual Star Schema & Isometric Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-base font-bold text-[#0F2942]">
                Star Schema Entity-Relationship Model
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Central Fact_Admission table joined via surrogate foreign keys to 5 dimension tables
              </p>
            </div>
            <Database className="w-5 h-5 text-sky-700" />
          </div>

          {/* Central Fact Table */}
          <div className="bg-[#0F2942] text-white rounded-xl p-4 mb-5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm font-bold">FACT TABLE: Fact_Admission</span>
              <span className="font-mono text-xs text-emerald-300 tabular-nums">
                {stats.tables.Fact_Admission.toLocaleString()} records
              </span>
            </div>
            <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-xs font-mono text-sky-100">
              <span>PK admission_id</span>
              <span>FK patient_key</span>
              <span>FK hospital_key</span>
              <span>FK date_key</span>
              <span>FK condition_key</span>
              <span>FK insurance_key</span>
              <span>billing_amount</span>
              <span>length_of_stay</span>
              <span>admission_type</span>
              <span>medication</span>
              <span>test_results</span>
              <span>room_number</span>
            </div>
          </div>

          {/* 5 Dimension Tables */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {STAR_DIMENSIONS.map((dim) => (
              <div key={dim.name} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <div className="font-mono text-xs font-bold text-[#0F2942]">{dim.name}</div>
                <div className="mt-1 flex items-center gap-1 text-[11px] font-mono text-emerald-700">
                  <KeyRound className="w-3 h-3" />
                  <span>PK {dim.pk}</span>
                </div>
                <ul className="mt-2 space-y-0.5 text-[11px] font-mono text-slate-600">
                  {dim.fields.map((f) => (
                    <li key={f}>• {f}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col">
          <div className="h-64 lg:h-72 bg-slate-100 border-b border-slate-200">
            <img
              src="/src/assets/images/warehouse_architecture_isometric_1795697260702.jpg"
              alt="Isometric Healthcare Data Warehouse Architecture"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-6 flex-1 flex flex-col justify-between">
            <div>
              <h3 className="font-display text-base font-bold text-[#0F2942]">
                SQLite Warehouse Engine
              </h3>
              <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                Stored atomically inside <span className="font-mono text-slate-800">data/mediinsight_warehouse.db</span> with foreign key enforcement and indexed join paths on date, hospital, condition, and patient keys for sub-50ms OLAP queries.
              </p>
            </div>
            {stats.latestEtlRun && (
              <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 font-mono tabular-nums">
                Last Batch #{stats.latestEtlRun.run_id} · {stats.latestEtlRun.status} · {new Date(stats.latestEtlRun.executed_at).toLocaleString()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Star Schema Joined Records Preview */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="font-display text-base font-bold text-[#0F2942]">
            Live Warehouse Fact_Admission Join Preview
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Direct SQL query joining Fact_Admission with Dim_Patient, Dim_Hospital, Dim_Date, Dim_Medical_Condition, and Dim_Insurance
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <th className="py-2.5 px-3 font-semibold">Fact ID</th>
                <th className="py-2.5 px-3 font-semibold">Patient Hash</th>
                <th className="py-2.5 px-3 font-semibold">Age Group</th>
                <th className="py-2.5 px-3 font-semibold">Hospital</th>
                <th className="py-2.5 px-3 font-semibold">Condition</th>
                <th className="py-2.5 px-3 font-semibold">Admission Date</th>
                <th className="py-2.5 px-3 font-semibold">Test Results</th>
                <th className="py-2.5 px-3 font-semibold text-right">Stay (Days)</th>
                <th className="py-2.5 px-3 font-semibold text-right">Billing ($)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.sampleFacts.map((row) => (
                <tr key={row.admission_id} className="hover:bg-slate-50/70">
                  <td className="py-2 px-3 font-mono tabular-nums text-slate-500">#{row.admission_id}</td>
                  <td className="py-2 px-3 font-mono text-[#0F2942]">{row.patient_hash}</td>
                  <td className="py-2 px-3">{row.age_group} · {row.gender}</td>
                  <td className="py-2 px-3 text-slate-700">{row.hospital_name}</td>
                  <td className="py-2 px-3 font-medium text-slate-900">{row.condition_name}</td>
                  <td className="py-2 px-3 font-mono tabular-nums">{row.full_date}</td>
                  <td className="py-2 px-3">{row.test_results}</td>
                  <td className="py-2 px-3 text-right font-mono tabular-nums">{row.length_of_stay}</td>
                  <td className="py-2 px-3 text-right font-mono tabular-nums">${row.billing_amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
