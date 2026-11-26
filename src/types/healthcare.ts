export type DatasetMode = 'demonstration' | 'uploaded';

export interface RawHealthcareRow {
  Name?: string;
  Age?: string | number | null;
  Gender?: string | null;
  'Blood Type'?: string | null;
  'Medical Condition'?: string | null;
  'Date of Admission'?: string | null;
  Doctor?: string | null;
  Hospital?: string | null;
  'Insurance Provider'?: string | null;
  'Billing Amount'?: string | number | null;
  'Room Number'?: string | number | null;
  'Admission Type'?: string | null;
  'Discharge Date'?: string | null;
  Medication?: string | null;
  'Test Results'?: string | null;
  [key: string]: unknown;
}

export interface CleanedHealthcareRecord {
  patientHash: string;
  age: number;
  ageGroup: string;
  gender: string;
  bloodType: string;
  medicalCondition: string;
  dateOfAdmission: string;
  admissionYear: number;
  admissionMonth: string; // YYYY-MM
  admissionMonthName: string;
  hospital: string;
  insuranceProvider: string;
  billingAmount: number;
  roomNumber: number;
  admissionType: string;
  dischargeDate: string;
  lengthOfStay: number;
  medication: string;
  testResults: string;
}

export interface ColumnProfile {
  name: string;
  type: 'numerical' | 'categorical' | 'date' | 'identifier';
  missingCount: number;
  missingPct: number;
  uniqueCount: number;
  inconsistentCount: number;
  sampleValues: string[];
}

export interface DataQualityProfile {
  mode: DatasetMode;
  filename: string;
  totalRows: number;
  totalColumns: number;
  numericalColumns: string[];
  categoricalColumns: string[];
  dateColumns: string[];
  identifierColumns: string[];
  missingTotal: number;
  duplicateRows: number;
  inconsistentValues: number;
  negativeBillingCount: number;
  invalidDateRangeCount: number;
  dataQualityScore: number;
  columns: ColumnProfile[];
  previewRows: Array<Record<string, string | number | null>>;
}

export interface CleaningComparison {
  cleaned: boolean;
  before: {
    totalRows: number;
    missingValues: number;
    duplicateRows: number;
    inconsistentValues: number;
    qualityScore: number;
  };
  after: {
    totalRows: number;
    missingValues: number;
    duplicateRows: number;
    inconsistentValues: number;
    qualityScore: number;
  };
  actionsLog: Array<{
    step: string;
    detail: string;
    recordsAffected: number;
  }>;
  missingByColumn: Array<{
    column: string;
    before: number;
    after: number;
  }>;
  previewCleanedRows: CleanedHealthcareRecord[];
}

export interface AnalyticsFilters {
  ageMin?: number;
  ageMax?: number;
  gender?: string;
  medicalCondition?: string;
  hospital?: string;
  admissionType?: string;
  testResults?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface SmartInsight {
  id: string;
  title: string;
  value: string;
  detail: string;
  metricLabel: string;
}

export interface AnalyticsPayload {
  mode: DatasetMode;
  filename: string;
  cleaned: boolean;
  totalSourceRows: number;
  filteredCount: number;
  kpis: {
    totalPatientRecords: number;
    totalHospitals: number;
    totalMedicalConditions: number;
    avgPatientAge: number;
    totalAdmissions: number;
    avgBillingAmount: number;
    avgHospitalStay: number;
  };
  filterOptions: {
    genders: string[];
    conditions: string[];
    hospitals: string[];
    admissionTypes: string[];
    testResults: string[];
    minAge: number;
    maxAge: number;
    minDate: string;
    maxDate: string;
  };
  charts: {
    conditionDistribution: Array<{ name: string; count: number; avgBilling: number }>;
    ageDistribution: Array<{ group: string; count: number }>;
    monthlyAdmissions: Array<{ month: string; admissions: number; avgBilling: number }>;
    admissionTypeDistribution: Array<{ name: string; count: number }>;
    testResultsDistribution: Array<{ name: string; count: number }>;
    medicationDistribution: Array<{ name: string; count: number }>;
    hospitalComparison: Array<{ hospital: string; admissions: number; avgBilling: number; avgStay: number }>;
    billingByCondition: Array<{ condition: string; avgBilling: number; minBilling: number; maxBilling: number; totalBilling: number }>;
    ageBillingScatter: Array<{ age: number; billing: number; stay: number; condition: string; testResult: string }>;
    genderConditionTrend: Array<{ condition: string; Male: number; Female: number; Other: number }>;
  };
  insights: SmartInsight[];
}

export interface WarehouseStats {
  etlLoaded: boolean;
  datasetMode: DatasetMode;
  filename: string;
  tables: {
    Fact_Admission: number;
    Dim_Patient: number;
    Dim_Hospital: number;
    Dim_Date: number;
    Dim_Medical_Condition: number;
    Dim_Insurance: number;
  };
  latestEtlRun: ETLRunRecord | null;
  etlHistory: ETLRunRecord[];
  sampleFacts: Array<{
    admission_id: number;
    patient_hash: string;
    age_group: string;
    gender: string;
    hospital_name: string;
    full_date: string;
    condition_name: string;
    provider_name: string;
    admission_type: string;
    test_results: string;
    billing_amount: number;
    length_of_stay: number;
  }>;
}

export interface ETLRunRecord {
  run_id: number;
  dataset_mode: string;
  source_filename: string;
  records_extracted: number;
  records_transformed: number;
  records_loaded: number;
  duplicates_removed: number;
  missing_fixed: number;
  status: string;
  executed_at: string;
}

export interface ModelMetrics {
  name: string;
  algorithm: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  trainSize: number;
  testSize: number;
  labels: string[];
  confusionMatrix: number[][];
  featureImportance: Array<{ feature: string; importance: number }>;
  explanation: string;
}

export interface ClusteringResult {
  k: number;
  inertia: number;
  totalPoints: number;
  clusters: Array<{
    clusterId: number;
    label: string;
    count: number;
    percentage: number;
    avgAge: number;
    avgBilling: number;
    avgStay: number;
    topCondition: string;
    topAdmissionType: string;
    dominantTestResult: string;
  }>;
  scatterPoints: Array<{
    age: number;
    billing: number;
    stay: number;
    clusterId: number;
    condition: string;
  }>;
}

export interface DataMiningResponse {
  mode: DatasetMode;
  targetColumn: string;
  sampleSize: number;
  models: ModelMetrics[];
  patterns: {
    topConditions: Array<{ condition: string; count: number; sharePct: number }>;
    conditionByAgeGroup: Array<{ ageGroup: string; topCondition: string; count: number; breakdown: Record<string, number> }>;
    admissionTypePatterns: Array<{ admissionType: string; count: number; avgStay: number; abnormalPct: number }>;
    testResultPatterns: Array<{ testResult: string; count: number; sharePct: number; avgBilling: number }>;
    medicationByCondition: Array<{ condition: string; topMedication: string; count: number }>;
    plainEnglishSummaries: string[];
  };
  historicalTrends: {
    monthlySeries: Array<{ month: string; admissions: number; movingAvg: number; avgBilling: number }>;
    trendDirection: string;
    monthlyGrowthRatePct: number;
    educationalNote: string;
  };
}

export interface OlapQueryRequest {
  operation: 'rollup' | 'drilldown' | 'slice' | 'dice' | 'pivot';
  rowDim: 'year' | 'month' | 'hospital' | 'age_group' | 'condition' | 'admission_type' | 'test_results';
  colDim?: 'gender' | 'admission_type' | 'test_results' | 'age_group';
  measure: 'admissions' | 'avg_billing' | 'total_billing' | 'avg_stay';
  sliceField?: string;
  sliceValue?: string;
  diceFilters?: {
    year?: string;
    hospital?: string;
    age_group?: string;
    condition?: string;
  };
}

export interface OlapQueryResult {
  operation: string;
  explanation: string;
  sqlPreview: string;
  columns: string[];
  rows: Array<Record<string, string | number>>;
  availableSlices: {
    years: string[];
    hospitals: string[];
    ageGroups: string[];
    conditions: string[];
  };
}

export interface HospitalInsightsPayload {
  mode: DatasetMode;
  hospitals: Array<{
    hospital: string;
    totalAdmissions: number;
    emergencyCount: number;
    urgentCount: number;
    electiveCount: number;
    avgStay: number;
    totalPatientDays: number;
    avgBilling: number;
    totalBilling: number;
    abnormalRatePct: number;
    topCondition: string;
    workloadSharePct: number;
    estimatedBedsNeeded: number;
    estimatedNursesPerShift: number;
  }>;
  overallAvgStay: number;
  overallTotalPatientDays: number;
  admissionMix: Array<{ type: string; count: number; avgStay: number }>;
}

export interface AiChatResponse {
  answer: string;
  source: 'gemini' | 'fallback';
  modelUsed?: string;
  chart?: {
    type: 'bar' | 'line' | 'pie';
    title: string;
    data: Array<{ name: string; value: number }>;
  };
}
