import React from 'react';
import { Award, BookOpen, Cpu, Database, Layers, Users } from 'lucide-react';

const TEAM_MEMBERS = [
  'Shaik Ayesha Tabassum',
  'Pathan Zunereya',
  'P. Sana Banu',
  'R Harika',
];

export const AboutProjectPage: React.FC = () => {
  return (
    <div className="space-y-8 pb-12">
      {/* Title Banner */}
      <section className="bg-white border border-slate-200 rounded-2xl p-8">
        <div className="text-xs font-semibold text-sky-700">
          College Capstone Project · MediInsight AI
        </div>
        <h1 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-[#0F2942] max-w-4xl leading-snug">
          Design and Development of a Healthcare Analytics System Using Data Warehousing and Data Mining
        </h1>
        <p className="mt-3 text-sm text-slate-600 max-w-3xl leading-relaxed">
          An integrated full-stack healthcare intelligence platform demonstrating automated data preprocessing, Star Schema dimensional warehousing, OLAP multidimensional exploration, supervised and unsupervised data mining, and AI-assisted dataset querying.
        </p>

        {/* Team & Guide */}
        <div className="mt-6 pt-6 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#0F2942] mb-2">
              <Users className="w-4 h-4 text-emerald-600" />
              <span>Project Team Members</span>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-800 font-medium">
              {TEAM_MEMBERS.map((name) => (
                <li key={name} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg">
                  {name}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#0F2942] mb-2">
              <Award className="w-4 h-4 text-sky-700" />
              <span>Project Guide</span>
            </div>
            <div className="px-4 py-3.5 bg-sky-50/70 border border-sky-200 rounded-xl">
              <div className="font-display text-base font-bold text-[#0F2942]">Dr. Praveen D S</div>
              <div className="text-xs text-slate-600 mt-0.5">Capstone Faculty Advisor & Project Guide</div>
            </div>
          </div>
        </div>
      </section>

      {/* Abstract & Introduction */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center gap-2 text-xs font-bold text-sky-700 mb-2">
            <BookOpen className="w-4 h-4" />
            <span>Abstract</span>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Healthcare organizations generate massive volumes of heterogeneous admission, billing, pharmacy, and diagnostic records. However, raw datasets often contain missing fields, duplicates, and fragmented schemas that hinder clinical and operational decision-making. MediInsight AI addresses this gap by combining an automated ETL pipeline, a centralized SQLite Star Schema Data Warehouse, OLAP cube analytics, Scikit-learn/TypeScript Data Mining models, and Gemini AI natural-language querying into a single privacy-preserving web platform.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 mb-2">
            <Layers className="w-4 h-4" />
            <span>Introduction & Problem Statement</span>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Traditional hospital reporting systems rely on flat spreadsheets or siloed transactional databases that are slow for multi-dimensional aggregation and expose patient identifiers. Without structured preprocessing and dimensional modeling, administrators cannot easily compare hospital workloads, evaluate admission patterns across age cohorts, or segment patient billing behaviors.
          </p>
        </div>
      </div>

      {/* Existing vs Proposed System & Objectives */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="font-display text-base font-bold text-[#0F2942]">Project Objectives</h2>
          <ul className="mt-3 space-y-2 text-xs text-slate-600 leading-relaxed">
            <li>• Automate CSV ingestion, profiling, cleaning, and PII anonymization.</li>
            <li>• Implement a true ETL workflow loading into a Star Schema Data Warehouse.</li>
            <li>• Enable interactive Roll-Up, Drill-Down, Slice, Dice, and Pivot OLAP analysis.</li>
            <li>• Apply Decision Tree, Random Forest, Logistic Regression, and K-Means mining.</li>
            <li>• Provide dynamic dashboards, MediBot AI Q&A, and downloadable PDF/CSV reports.</li>
          </ul>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="font-display text-base font-bold text-[#0F2942]">Existing System Limitations</h2>
          <ul className="mt-3 space-y-2 text-xs text-slate-600 leading-relaxed">
            <li>• Manual spreadsheet cleaning prone to human error and inconsistency.</li>
            <li>• Lack of normalized Star Schema separation between facts and dimensions.</li>
            <li>• Static reports with no interactive filtering or OLAP cube navigation.</li>
            <li>• No integrated machine learning pattern discovery or explainability.</li>
            <li>• Direct exposure of patient names in shared operational reports.</li>
          </ul>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="font-display text-base font-bold text-[#0F2942]">Proposed System Advantages</h2>
          <ul className="mt-3 space-y-2 text-xs text-slate-600 leading-relaxed">
            <li>• End-to-end automated quality scoring with Before vs After verification.</li>
            <li>• Centralized SQLite Star Schema (Fact_Admission + 5 Dimension tables).</li>
            <li>• Real-time 10-chart analytics studio with 7 synchronized filters.</li>
            <li>• Privacy-first SHA-256 patient hashing across every public dashboard.</li>
            <li>• Multilingual interface (English, Tamil, Hindi) + Gemini AI assistant.</li>
          </ul>
        </div>
      </div>

      {/* Four Modules & System Architecture */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center gap-2 text-xs font-bold text-sky-700 mb-3">
          <Database className="w-4 h-4" />
          <span>System Architecture & Four Modules</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="font-mono text-xs font-bold text-[#0F2942]">01. Data Collection & Preprocessing</div>
            <p className="mt-1.5 text-xs text-slate-600">CSV parsing, column type detection, missing/duplicate audit, cleaning, and CSV export.</p>
          </div>
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="font-mono text-xs font-bold text-[#0F2942]">02. Data Warehouse & ETL</div>
            <p className="mt-1.5 text-xs text-slate-600">Extract, Transform, Load into SQLite Star Schema with Fact_Admission and 5 Dimensions.</p>
          </div>
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="font-mono text-xs font-bold text-[#0F2942]">03. Data Mining & Pattern Discovery</div>
            <p className="mt-1.5 text-xs text-slate-600">Decision Tree, Random Forest, Logistic Regression, K-Means Clustering, and Trend Analysis.</p>
          </div>
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="font-mono text-xs font-bold text-[#0F2942]">04. Healthcare Analytics & AI</div>
            <p className="mt-1.5 text-xs text-slate-600">10-chart Studio, OLAP Explorer, Hospital Resource Planning, MediBot AI, and PDF Reports.</p>
          </div>
        </div>
      </div>

      {/* Technologies, Applications, Limitations, Future Scope */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center gap-2 text-xs font-bold text-[#0F2942] mb-2">
            <Cpu className="w-4 h-4 text-emerald-600" />
            <span>Technologies Used</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            <strong>Frontend:</strong> React 19, Vite, Tailwind CSS, Recharts, Lucide React, jsPDF.
            <br />
            <strong>Runtime & Backend:</strong> Node.js Express + TypeScript (and companion Python FastAPI + Pandas + Scikit-learn backend in <span className="font-mono">/backend</span>).
            <br />
            <strong>Database & AI:</strong> SQLite Star Schema Warehouse, Google Gemini API (<span className="font-mono">@google/genai</span>) with deterministic dataset query fallback.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="font-display text-base font-bold text-[#0F2942]">Applications, Limitations & Future Scope</h2>
          <p className="mt-2 text-xs text-slate-600 leading-relaxed">
            <strong>Applications:</strong> Hospital capacity planning, condition prevalence tracking, insurance billing audits, and academic healthcare data science education.
            <br />
            <strong>Limitations:</strong> Administrative datasets reflect historical correlations and do not constitute clinical diagnostic instruments.
            <br />
            <strong>Future Scope:</strong> HL7/FHIR live EHR stream connectors, automated anomaly alerting, and multi-hospital federated warehouse synchronization.
          </p>
        </div>
      </div>
    </div>
  );
};
