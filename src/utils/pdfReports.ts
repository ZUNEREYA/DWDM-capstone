import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  AnalyticsPayload,
  CleaningComparison,
  DataMiningResponse,
  DataQualityProfile,
} from '../types/healthcare';

function addPdfHeader(doc: jsPDF, title: string, subtitle: string) {
  doc.setFillColor(15, 41, 66); // Navy #0F2942
  doc.rect(0, 0, 210, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text('MediInsight AI', 14, 12);
  doc.setFontSize(10);
  doc.setTextColor(186, 230, 253);
  doc.text(title, 14, 19);
  doc.setFontSize(8);
  doc.setTextColor(226, 232, 240);
  doc.text(subtitle, 14, 24);
  doc.setTextColor(15, 23, 42);
}

export function generateAnalyticsPdfReport(analytics: AnalyticsPayload) {
  const doc = new jsPDF();
  addPdfHeader(
    doc,
    'Healthcare Analytics Executive Report',
    `Source: ${analytics.filename} (${analytics.mode.toUpperCase()}) · Generated ${new Date().toLocaleDateString()}`
  );

  doc.setFontSize(12);
  doc.text('1. Executive Summary KPIs', 14, 38);

  autoTable(doc, {
    startY: 42,
    head: [['Metric', 'Value']],
    body: [
      ['Total Unique Patient IDs (Anonymized)', analytics.kpis.totalPatientRecords.toLocaleString()],
      ['Total Admissions Analyzed', analytics.kpis.totalAdmissions.toLocaleString()],
      ['Total Hospitals', analytics.kpis.totalHospitals.toLocaleString()],
      ['Distinct Medical Conditions', analytics.kpis.totalMedicalConditions.toLocaleString()],
      ['Average Patient Age', `${analytics.kpis.avgPatientAge} years`],
      ['Average Billing Amount', `$${analytics.kpis.avgBillingAmount.toLocaleString()}`],
      ['Average Hospital Stay', `${analytics.kpis.avgHospitalStay} days`],
    ],
    theme: 'grid',
    headStyles: { fillColor: [15, 41, 66] },
  });

  const y1 = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.text('2. Medical Condition Distribution & Billing', 14, y1);

  autoTable(doc, {
    startY: y1 + 4,
    head: [['Medical Condition', 'Admissions', 'Avg Billing ($)']],
    body: analytics.charts.conditionDistribution.map((c) => [
      c.name,
      c.count.toLocaleString(),
      `$${c.avgBilling.toLocaleString()}`,
    ]),
    theme: 'striped',
    headStyles: { fillColor: [2, 132, 199] },
  });

  const y2 = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  if (y2 < 245) {
    doc.setFontSize(12);
    doc.text('3. Generated Smart Insights', 14, y2);
    autoTable(doc, {
      startY: y2 + 4,
      head: [['Category', 'Finding', 'Detail']],
      body: analytics.insights.map((ins) => [ins.metricLabel, `${ins.title}: ${ins.value}`, ins.detail]),
      theme: 'grid',
      headStyles: { fillColor: [5, 150, 105] },
    });
  }

  doc.save('mediinsight_analytics_report.pdf');
}

export function generateDataQualityPdfReport(
  profile: DataQualityProfile,
  comparison: CleaningComparison
) {
  const doc = new jsPDF();
  addPdfHeader(
    doc,
    'Data Quality & Preprocessing Audit Report',
    `Source: ${profile.filename} · Privacy Mode: Patient PII Redacted`
  );

  doc.setFontSize(12);
  doc.text('1. Before vs After Preprocessing Summary', 14, 38);

  autoTable(doc, {
    startY: 42,
    head: [['Quality Dimension', 'Before Cleaning', 'After Cleaning']],
    body: [
      ['Total Records', comparison.before.totalRows.toLocaleString(), comparison.after.totalRows.toLocaleString()],
      ['Missing Cell Values', comparison.before.missingValues.toLocaleString(), comparison.after.missingValues.toLocaleString()],
      ['Duplicate Records', comparison.before.duplicateRows.toLocaleString(), comparison.after.duplicateRows.toLocaleString()],
      ['Inconsistent / Anomalous Values', comparison.before.inconsistentValues.toLocaleString(), comparison.after.inconsistentValues.toLocaleString()],
      ['Composite Data Quality Score', `${comparison.before.qualityScore}%`, `${comparison.after.qualityScore}%`],
    ],
    theme: 'grid',
    headStyles: { fillColor: [15, 41, 66] },
  });

  const y1 = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.text('2. Column Schema & Missingness Audit', 14, y1);

  autoTable(doc, {
    startY: y1 + 4,
    head: [['Column', 'Type', 'Missing Count', 'Missing %', 'Unique Values']],
    body: profile.columns.map((c) => [
      c.name,
      c.type.toUpperCase(),
      c.missingCount.toLocaleString(),
      `${c.missingPct}%`,
      c.uniqueCount.toLocaleString(),
    ]),
    theme: 'striped',
    headStyles: { fillColor: [2, 132, 199] },
  });

  doc.save('mediinsight_data_quality_report.pdf');
}

export function generateMlEvaluationPdfReport(mining: DataMiningResponse) {
  const doc = new jsPDF();
  addPdfHeader(
    doc,
    'Machine Learning & Data Mining Evaluation Report',
    `Target Label: ${mining.targetColumn} · Sample Size: ${mining.sampleSize.toLocaleString()} records`
  );

  doc.setFontSize(12);
  doc.text('1. Classification Model Benchmarks (80/20 Train-Test Split)', 14, 38);

  autoTable(doc, {
    startY: 42,
    head: [['Model', 'Algorithm', 'Accuracy', 'Precision', 'Recall', 'F1-Score']],
    body: mining.models.map((m) => [
      m.name,
      m.algorithm,
      `${m.accuracy}%`,
      `${m.precision}%`,
      `${m.recall}%`,
      `${m.f1Score}%`,
    ]),
    theme: 'grid',
    headStyles: { fillColor: [15, 41, 66] },
  });

  const y1 = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.text('2. Discovered Patterns & Educational Disclaimer', 14, y1);

  autoTable(doc, {
    startY: y1 + 4,
    head: [['Pattern Summary']],
    body: [
      ...mining.patterns.plainEnglishSummaries.map((s) => [s]),
      [mining.historicalTrends.educationalNote],
    ],
    theme: 'striped',
    headStyles: { fillColor: [5, 150, 105] },
  });

  doc.save('mediinsight_ml_evaluation_report.pdf');
}
