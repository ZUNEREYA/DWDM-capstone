import { GoogleGenAI, Type } from '@google/genai';
import { AiChatResponse, AnalyticsPayload, CleanedHealthcareRecord, DatasetMode } from '../src/types/healthcare.js';
import { computeAnalyticsPayload } from './dataEngine.js';

function buildDeterministicFallback(question: string, analytics: AnalyticsPayload): AiChatResponse {
  const q = question.toLowerCase();
  const { kpis, charts } = analytics;

  if (q.includes('condition') || q.includes('common') || q.includes('disease')) {
    const top = charts.conditionDistribution[0];
    const listStr = charts.conditionDistribution
      .slice(0, 5)
      .map((c) => `${c.name} (${c.count.toLocaleString()} cases, avg $${c.avgBilling.toLocaleString()})`)
      .join('; ');
    return {
      source: 'fallback',
      answer: top
        ? `Based on the active ${analytics.mode} dataset (${kpis.totalAdmissions.toLocaleString()} admissions), the most common medical condition is **${top.name}** with **${top.count.toLocaleString()} records** (${((top.count / Math.max(1, kpis.totalAdmissions)) * 100).toFixed(1)}% of total).\n\nTop conditions breakdown: ${listStr}.`
        : 'No medical condition records are currently loaded.',
      chart: {
        type: 'bar',
        title: 'Medical Condition Distribution',
        data: charts.conditionDistribution.map((c) => ({ name: c.name, value: c.count })),
      },
    };
  }

  if (q.includes('age') || q.includes('cohort') || q.includes('group')) {
    const sorted = [...charts.ageDistribution].sort((a, b) => b.count - a.count);
    const top = sorted[0];
    return {
      source: 'fallback',
      answer: top
        ? `The age group with the highest admissions is **${top.group} years**, accounting for **${top.count.toLocaleString()} visits** (${((top.count / Math.max(1, kpis.totalAdmissions)) * 100).toFixed(1)}%). The overall average patient age is **${kpis.avgPatientAge} years**.`
        : 'Age distribution data is unavailable.',
      chart: {
        type: 'bar',
        title: 'Admissions by Age Group',
        data: charts.ageDistribution.map((a) => ({ name: a.group, value: a.count })),
      },
    };
  }

  if (q.includes('abnormal') || q.includes('test') || q.includes('result')) {
    const abnormal = charts.testResultsDistribution.find((t) => t.name.toLowerCase() === 'abnormal');
    const summary = charts.testResultsDistribution
      .map((t) => `${t.name}: ${t.count.toLocaleString()} (${((t.count / Math.max(1, kpis.totalAdmissions)) * 100).toFixed(1)}%)`)
      .join(' · ');
    return {
      source: 'fallback',
      answer: abnormal
        ? `There are **${abnormal.count.toLocaleString()} records** with **Abnormal** test results (${((abnormal.count / Math.max(1, kpis.totalAdmissions)) * 100).toFixed(1)}% of ${kpis.totalAdmissions.toLocaleString()} admissions).\n\nFull test results breakdown: ${summary}.`
        : `Test results summary across ${kpis.totalAdmissions.toLocaleString()} admissions: ${summary}.`,
      chart: {
        type: 'pie',
        title: 'Test Results Distribution',
        data: charts.testResultsDistribution.map((t) => ({ name: t.name, value: t.count })),
      },
    };
  }

  if (q.includes('bill') || q.includes('cost') || q.includes('amount') || q.includes('revenue')) {
    const topBill = charts.billingByCondition[0];
    return {
      source: 'fallback',
      answer: `Across **${kpis.totalAdmissions.toLocaleString()} admissions**, the average billing amount is **$${kpis.avgBillingAmount.toLocaleString()}**.\n\nHighest average billing by condition: **${topBill ? `${topBill.condition} ($${topBill.avgBilling.toLocaleString()})` : 'N/A'}**.`,
      chart: {
        type: 'bar',
        title: 'Average Billing by Medical Condition ($)',
        data: charts.billingByCondition.map((b) => ({ name: b.condition, value: b.avgBilling })),
      },
    };
  }

  if (q.includes('month') || q.includes('trend') || q.includes('time') || q.includes('admission')) {
    const peak = [...charts.monthlyAdmissions].sort((a, b) => b.admissions - a.admissions)[0];
    return {
      source: 'fallback',
      answer: `Monthly admission trends span **${charts.monthlyAdmissions.length} months** across **${kpis.totalHospitals} hospitals**.\n\nPeak admission month: **${peak ? `${peak.month} (${peak.admissions.toLocaleString()} admissions)` : 'N/A'}**. Overall average length of stay is **${kpis.avgHospitalStay} days**.`,
      chart: {
        type: 'line',
        title: 'Monthly Admission Volume Trend',
        data: charts.monthlyAdmissions.map((m) => ({ name: m.month, value: m.admissions })),
      },
    };
  }

  if (q.includes('hospital') || q.includes('stay') || q.includes('medication')) {
    const topHosp = charts.hospitalComparison[0];
    const topMed = charts.medicationDistribution[0];
    return {
      source: 'fallback',
      answer: `The dataset covers **${kpis.totalHospitals} hospitals** with an average hospital stay of **${kpis.avgHospitalStay} days**.\n\nHighest-volume facility: **${topHosp ? `${topHosp.hospital} (${topHosp.admissions.toLocaleString()} admissions)` : 'N/A'}**. Most prescribed medication: **${topMed ? `${topMed.name} (${topMed.count.toLocaleString()} prescriptions)` : 'N/A'}**.`,
      chart: {
        type: 'bar',
        title: 'Top Hospitals by Admission Volume',
        data: charts.hospitalComparison.slice(0, 8).map((h) => ({ name: h.hospital, value: h.admissions })),
      },
    };
  }

  return {
    source: 'fallback',
    answer: `Dataset Overview (${analytics.mode === 'demonstration' ? 'Demonstration Sample' : analytics.filename}):\n• Total Admissions: **${kpis.totalAdmissions.toLocaleString()}** across **${kpis.totalHospitals} hospitals**\n• Most Common Condition: **${charts.conditionDistribution[0]?.name || 'N/A'}** (${charts.conditionDistribution[0]?.count.toLocaleString() || 0} records)\n• Average Patient Age: **${kpis.avgPatientAge} yrs** | Average Billing: **$${kpis.avgBillingAmount.toLocaleString()}** | Average Stay: **${kpis.avgHospitalStay} days**\n\nTry asking about medical conditions, age groups, abnormal test results, billing amounts, hospitals, or monthly admission trends.`,
    chart: {
      type: 'bar',
      title: 'Medical Condition Overview',
      data: charts.conditionDistribution.map((c) => ({ name: c.name, value: c.count })),
    },
  };
}

export async function queryMediBotAI(
  question: string,
  records: CleanedHealthcareRecord[],
  mode: DatasetMode,
  filename: string,
  cleaned: boolean
): Promise<AiChatResponse> {
  const analytics = computeAnalyticsPayload(records, {}, mode, filename, cleaned);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    return buildDeterministicFallback(question, analytics);
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const contextSummary = {
      datasetMode: mode,
      filename,
      kpis: analytics.kpis,
      conditionDistribution: analytics.charts.conditionDistribution,
      ageDistribution: analytics.charts.ageDistribution,
      testResultsDistribution: analytics.charts.testResultsDistribution,
      admissionTypeDistribution: analytics.charts.admissionTypeDistribution,
      medicationDistribution: analytics.charts.medicationDistribution.slice(0, 8),
      billingByCondition: analytics.charts.billingByCondition,
      topHospitals: analytics.charts.hospitalComparison.slice(0, 8),
      monthlyAdmissions: analytics.charts.monthlyAdmissions.slice(-18),
    };

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Dataset Telemetry (Anonymized Aggregated Summary):\n${JSON.stringify(contextSummary)}\n\nUser Question: ${question}`,
      config: {
        systemInstruction:
          'You are MediBot AI, the analytical assistant for MediInsight AI. Answer the user question strictly using the provided aggregated healthcare dataset statistics. Never invent numbers or patient names. Provide a clear, concise plain-English explanation (2-4 sentences). Also optionally return a chart specification from the provided aggregates when visual representation helps.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            answer: {
              type: Type.STRING,
              description: 'Clear analytical answer grounded strictly in the provided dataset metrics.',
            },
            includeChart: {
              type: Type.BOOLEAN,
              description: 'Whether a chart is helpful for this question.',
            },
            chartType: {
              type: Type.STRING,
              description: 'One of: bar, line, pie',
            },
            chartTitle: {
              type: Type.STRING,
              description: 'Short descriptive chart title.',
            },
            chartData: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  value: { type: Type.NUMBER },
                },
              },
            },
          },
        },
      },
    });

    const rawText = (response.text ?? '').trim();
    if (!rawText) {
      return buildDeterministicFallback(question, analytics);
    }

    const parsed = JSON.parse(rawText) as {
      answer?: string;
      includeChart?: boolean;
      chartType?: 'bar' | 'line' | 'pie';
      chartTitle?: string;
      chartData?: Array<{ name: string; value: number }>;
    };

    return {
      answer: parsed.answer || buildDeterministicFallback(question, analytics).answer,
      source: 'gemini',
      modelUsed: 'gemini-4-hydrogen',
      chart:
        parsed.includeChart && parsed.chartData && parsed.chartData.length > 0
          ? {
              type: parsed.chartType === 'line' || parsed.chartType === 'pie' ? parsed.chartType : 'bar',
              title: parsed.chartTitle || 'Dataset Analysis',
              data: parsed.chartData,
            }
          : undefined,
    };
  } catch (err) {
    console.warn('Gemini API fallback triggered:', err instanceof Error ? err.message : err);
    return buildDeterministicFallback(question, analytics);
  }
}
