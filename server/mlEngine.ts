import {
  CleanedHealthcareRecord,
  ClusteringResult,
  DataMiningResponse,
  DatasetMode,
  ModelMetrics,
} from '../src/types/healthcare.js';

interface EncodedSample {
  features: number[];
  labelIndex: number;
}

function buildDatasetMatrix(
  records: CleanedHealthcareRecord[],
  targetCol: 'Test Results' | 'Admission Type'
): {
  samples: EncodedSample[];
  labels: string[];
  featureNames: string[];
} {
  // Stratified cap at 3500 rows so training stays responsive (<400ms) while preserving true dataset distribution
  const stride = Math.max(1, Math.floor(records.length / 3500));
  const subset = records.filter((_, i) => i % stride === 0).slice(0, 3500);

  const conditions = Array.from(new Set(subset.map((r) => r.medicalCondition))).sort().slice(0, 8);
  const genders = Array.from(new Set(subset.map((r) => r.gender))).sort().slice(0, 4);
  const otherCats =
    targetCol === 'Test Results'
      ? Array.from(new Set(subset.map((r) => r.admissionType))).sort()
      : Array.from(new Set(subset.map((r) => r.testResults))).sort();

  const labels = Array.from(
    new Set(subset.map((r) => (targetCol === 'Test Results' ? r.testResults : r.admissionType)))
  ).sort();
  const labelMap = new Map(labels.map((l, idx) => [l, idx]));

  // Numerical normalization parameters
  const ages = subset.map((r) => r.age);
  const bills = subset.map((r) => r.billingAmount);
  const stays = subset.map((r) => r.lengthOfStay);
  const mean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / Math.max(1, arr.length);
  const std = (arr: number[], m: number) =>
    Math.max(1e-6, Math.sqrt(arr.reduce((s, x) => s + (x - m) ** 2, 0) / Math.max(1, arr.length)));

  const ageM = mean(ages),
    ageS = std(ages, ageM);
  const billM = mean(bills),
    billS = std(bills, billM);
  const stayM = mean(stays),
    stayS = std(stays, stayM);

  const featureNames = [
    'Age',
    'Billing Amount',
    'Length of Stay',
    ...conditions.map((c) => `Condition: ${c}`),
    ...genders.map((g) => `Gender: ${g}`),
    ...otherCats.map((o) => `${targetCol === 'Test Results' ? 'Admission' : 'Test'}: ${o}`),
  ];

  const samples: EncodedSample[] = subset.map((r) => {
    const f: number[] = [
      (r.age - ageM) / ageS,
      (r.billingAmount - billM) / billS,
      (r.lengthOfStay - stayM) / stayS,
      ...conditions.map((c) => (r.medicalCondition === c ? 1 : 0)),
      ...genders.map((g) => (r.gender === g ? 1 : 0)),
      ...otherCats.map((o) =>
        (targetCol === 'Test Results' ? r.admissionType === o : r.testResults === o) ? 1 : 0
      ),
    ];
    const lbl = targetCol === 'Test Results' ? r.testResults : r.admissionType;
    return { features: f, labelIndex: labelMap.get(lbl) ?? 0 };
  });

  return { samples, labels, featureNames };
}

function deterministicShuffle<T>(arr: T[], seed = 42): T[] {
  const copy = [...arr];
  let s = seed;
  for (let i = copy.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function computeClassificationMetrics(
  yTrue: number[],
  yPred: number[],
  numClasses: number
): { accuracy: number; precision: number; recall: number; f1Score: number; confusionMatrix: number[][] } {
  const cm: number[][] = Array.from({ length: numClasses }, () => Array(numClasses).fill(0));
  let correct = 0;
  for (let i = 0; i < yTrue.length; i++) {
    const t = yTrue[i];
    const p = yPred[i];
    if (t >= 0 && t < numClasses && p >= 0 && p < numClasses) {
      cm[t][p]++;
      if (t === p) correct++;
    }
  }

  let precSum = 0;
  let recSum = 0;
  let f1Sum = 0;
  for (let c = 0; c < numClasses; c++) {
    const tp = cm[c][c];
    let fp = 0;
    let fn = 0;
    for (let r = 0; r < numClasses; r++) {
      if (r !== c) {
        fp += cm[r][c];
        fn += cm[c][r];
      }
    }
    const p = tp + fp > 0 ? tp / (tp + fp) : 0;
    const rec = tp + fn > 0 ? tp / (tp + fn) : 0;
    const f1 = p + rec > 0 ? (2 * p * rec) / (p + rec) : 0;
    precSum += p;
    recSum += rec;
    f1Sum += f1;
  }

  const n = Math.max(1, yTrue.length);
  return {
    accuracy: Number(((correct / n) * 100).toFixed(2)),
    precision: Number(((precSum / numClasses) * 100).toFixed(2)),
    recall: Number(((recSum / numClasses) * 100).toFixed(2)),
    f1Score: Number(((f1Sum / numClasses) * 100).toFixed(2)),
    confusionMatrix: cm,
  };
}

// --- Decision Tree Classifier (CART with Gini impurity) ---
interface TreeNode {
  leaf: boolean;
  prediction?: number;
  featureIndex?: number;
  threshold?: number;
  left?: TreeNode;
  right?: TreeNode;
}

function giniImpurity(counts: number[], total: number): number {
  if (total === 0) return 0;
  let sumSq = 0;
  for (const c of counts) {
    const p = c / total;
    sumSq += p * p;
  }
  return 1 - sumSq;
}

function trainDecisionTree(
  data: EncodedSample[],
  numClasses: number,
  numFeatures: number,
  maxDepth = 5,
  minSamplesSplit = 12,
  featureSubset?: number[]
): { root: TreeNode; importances: number[] } {
  const importances = Array(numFeatures).fill(0);
  const candidateFeatures = featureSubset || Array.from({ length: numFeatures }, (_, i) => i);

  function majorityClass(rows: EncodedSample[]): number {
    const counts = Array(numClasses).fill(0);
    for (const r of rows) counts[r.labelIndex]++;
    let best = 0;
    for (let i = 1; i < numClasses; i++) if (counts[i] > counts[best]) best = i;
    return best;
  }

  function build(rows: EncodedSample[], depth: number): TreeNode {
    const counts = Array(numClasses).fill(0);
    for (const r of rows) counts[r.labelIndex]++;
    const parentGini = giniImpurity(counts, rows.length);

    if (depth >= maxDepth || rows.length < minSamplesSplit || parentGini < 1e-6) {
      return { leaf: true, prediction: majorityClass(rows) };
    }

    let bestGain = 0;
    let bestFeat = -1;
    let bestThresh = 0;

    for (const fIdx of candidateFeatures) {
      const vals = rows.map((r) => r.features[fIdx]);
      const uniqueVals = Array.from(new Set(vals)).sort((a, b) => a - b);
      if (uniqueVals.length <= 1) continue;

      // Test up to 8 quantile thresholds for numerical efficiency
      const step = Math.max(1, Math.floor(uniqueVals.length / 8));
      for (let idx = 0; idx < uniqueVals.length - 1; idx += step) {
        const thresh = (uniqueVals[idx] + uniqueVals[idx + 1]) / 2;
        const leftCounts = Array(numClasses).fill(0);
        const rightCounts = Array(numClasses).fill(0);
        let leftTotal = 0;
        let rightTotal = 0;

        for (const r of rows) {
          if (r.features[fIdx] <= thresh) {
            leftCounts[r.labelIndex]++;
            leftTotal++;
          } else {
            rightCounts[r.labelIndex]++;
            rightTotal++;
          }
        }
        if (leftTotal === 0 || rightTotal === 0) continue;

        const weightedGini =
          (leftTotal / rows.length) * giniImpurity(leftCounts, leftTotal) +
          (rightTotal / rows.length) * giniImpurity(rightCounts, rightTotal);
        const gain = parentGini - weightedGini;
        if (gain > bestGain) {
          bestGain = gain;
          bestFeat = fIdx;
          bestThresh = thresh;
        }
      }
    }

    if (bestFeat === -1 || bestGain <= 1e-5) {
      return { leaf: true, prediction: majorityClass(rows) };
    }

    importances[bestFeat] += bestGain * rows.length;
    const leftRows = rows.filter((r) => r.features[bestFeat] <= bestThresh);
    const rightRows = rows.filter((r) => r.features[bestFeat] > bestThresh);

    return {
      leaf: false,
      featureIndex: bestFeat,
      threshold: bestThresh,
      left: build(leftRows, depth + 1),
      right: build(rightRows, depth + 1),
    };
  }

  return { root: build(data, 0), importances };
}

function predictTree(node: TreeNode, features: number[]): number {
  let curr = node;
  while (!curr.leaf) {
    if (features[curr.featureIndex!] <= curr.threshold!) {
      curr = curr.left!;
    } else {
      curr = curr.right!;
    }
  }
  return curr.prediction!;
}

function normalizeImportances(raw: number[], featureNames: string[]): Array<{ feature: string; importance: number }> {
  const sum = raw.reduce((a, b) => a + Math.abs(b), 0) || 1;
  return featureNames
    .map((feature, i) => ({
      feature,
      importance: Number(((Math.abs(raw[i]) / sum) * 100).toFixed(2)),
    }))
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 8);
}

// --- Multinomial Logistic Regression (Softmax Gradient Descent) ---
function trainLogisticRegression(
  train: EncodedSample[],
  numClasses: number,
  numFeatures: number
): { weights: number[][]; bias: number[] } {
  const weights = Array.from({ length: numClasses }, () => Array(numFeatures).fill(0));
  const bias = Array(numClasses).fill(0);
  const lr = 0.08;
  const reg = 0.001;
  const epochs = 45;
  const n = Math.max(1, train.length);

  for (let epoch = 0; epoch < epochs; epoch++) {
    const gradW = Array.from({ length: numClasses }, () => Array(numFeatures).fill(0));
    const gradB = Array(numClasses).fill(0);

    for (const s of train) {
      const logits = Array(numClasses).fill(0);
      let maxLogit = -Infinity;
      for (let c = 0; c < numClasses; c++) {
        let z = bias[c];
        for (let f = 0; f < numFeatures; f++) z += weights[c][f] * s.features[f];
        logits[c] = z;
        if (z > maxLogit) maxLogit = z;
      }
      const exps = logits.map((z) => Math.exp(z - maxLogit));
      const sumExp = exps.reduce((a, b) => a + b, 0) || 1;
      for (let c = 0; c < numClasses; c++) {
        const prob = exps[c] / sumExp;
        const err = prob - (c === s.labelIndex ? 1 : 0);
        gradB[c] += err;
        for (let f = 0; f < numFeatures; f++) {
          gradW[c][f] += err * s.features[f];
        }
      }
    }

    for (let c = 0; c < numClasses; c++) {
      bias[c] -= (lr * gradB[c]) / n;
      for (let f = 0; f < numFeatures; f++) {
        weights[c][f] -= lr * (gradW[c][f] / n + reg * weights[c][f]);
      }
    }
  }

  return { weights, bias };
}

function predictLogistic(weights: number[][], bias: number[], features: number[]): number {
  let bestC = 0;
  let bestZ = -Infinity;
  for (let c = 0; c < weights.length; c++) {
    let z = bias[c];
    for (let f = 0; f < features.length; f++) z += weights[c][f] * features[f];
    if (z > bestZ) {
      bestZ = z;
      bestC = c;
    }
  }
  return bestC;
}

export function runDataMiningSuite(
  records: CleanedHealthcareRecord[],
  mode: DatasetMode,
  targetColumn: 'Test Results' | 'Admission Type' = 'Test Results'
): DataMiningResponse {
  const { samples, labels, featureNames } = buildDatasetMatrix(records, targetColumn);
  const shuffled = deterministicShuffle(samples, 2026);
  const splitIdx = Math.max(1, Math.floor(shuffled.length * 0.8));
  const train = shuffled.slice(0, splitIdx);
  const test = shuffled.slice(splitIdx);
  const yTrue = test.map((s) => s.labelIndex);
  const numClasses = labels.length;
  const numFeatures = featureNames.length;

  // 1. Decision Tree
  const dt = trainDecisionTree(train, numClasses, numFeatures, 5, 10);
  const dtPreds = test.map((s) => predictTree(dt.root, s.features));
  const dtMetrics = computeClassificationMetrics(yTrue, dtPreds, numClasses);

  // 2. Random Forest (15 bagged trees with random sqrt(d) feature subsampling)
  const numTrees = 15;
  const subFeatureCount = Math.max(3, Math.ceil(Math.sqrt(numFeatures)));
  const forest: TreeNode[] = [];
  const rfImportances = Array(numFeatures).fill(0);
  let seed = 101;
  for (let t = 0; t < numTrees; t++) {
    const boot: EncodedSample[] = [];
    for (let i = 0; i < train.length; i++) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      boot.push(train[seed % train.length]);
    }
    const featIndices = deterministicShuffle(
      Array.from({ length: numFeatures }, (_, i) => i),
      t + 77
    ).slice(0, subFeatureCount);
    const tree = trainDecisionTree(boot, numClasses, numFeatures, 5, 10, featIndices);
    forest.push(tree.root);
    for (let f = 0; f < numFeatures; f++) rfImportances[f] += tree.importances[f];
  }
  const rfPreds = test.map((s) => {
    const votes = Array(numClasses).fill(0);
    for (const root of forest) votes[predictTree(root, s.features)]++;
    let best = 0;
    for (let c = 1; c < numClasses; c++) if (votes[c] > votes[best]) best = c;
    return best;
  });
  const rfMetrics = computeClassificationMetrics(yTrue, rfPreds, numClasses);

  // 3. Logistic Regression
  const lr = trainLogisticRegression(train, numClasses, numFeatures);
  const lrPreds = test.map((s) => predictLogistic(lr.weights, lr.bias, s.features));
  const lrMetrics = computeClassificationMetrics(yTrue, lrPreds, numClasses);
  const lrFeatImp = Array(numFeatures).fill(0);
  for (let f = 0; f < numFeatures; f++) {
    for (let c = 0; c < numClasses; c++) lrFeatImp[f] += Math.abs(lr.weights[c][f]);
  }

  const models: ModelMetrics[] = [
    {
      name: 'Decision Tree Classifier',
      algorithm: 'CART (Gini Impurity, Max Depth 5)',
      ...dtMetrics,
      trainSize: train.length,
      testSize: test.length,
      labels,
      featureImportance: normalizeImportances(dt.importances, featureNames),
      explanation: `Splits patient admission records recursively on thresholds of Age, Billing, Length of Stay, and clinical attributes to classify ${targetColumn} categories.`,
    },
    {
      name: 'Random Forest Classifier',
      algorithm: '15-Tree Bootstrap Ensemble',
      ...rfMetrics,
      trainSize: train.length,
      testSize: test.length,
      labels,
      featureImportance: normalizeImportances(rfImportances, featureNames),
      explanation: `Aggregates majority votes across 15 decorrelated decision trees trained on bootstrap samples, reducing variance compared to a single tree.`,
    },
    {
      name: 'Logistic Regression',
      algorithm: 'Multinomial Softmax Classifier',
      ...lrMetrics,
      trainSize: train.length,
      testSize: test.length,
      labels,
      featureImportance: normalizeImportances(lrFeatImp, featureNames),
      explanation: `Models linear log-odds relationships across standardized patient demographics, billing, and admission factors to estimate ${targetColumn} class probabilities.`,
    },
  ];

  // --- Pattern Discovery ---
  const total = Math.max(1, records.length);
  const condCounts = new Map<string, number>();
  const ageCondMap = new Map<string, Map<string, number>>();
  const admMap = new Map<string, { count: number; staySum: number; abnormal: number }>();
  const testMap = new Map<string, { count: number; billingSum: number }>();
  const condMedMap = new Map<string, Map<string, number>>();
  const monthMap = new Map<string, { count: number; billingSum: number }>();

  for (const r of records) {
    condCounts.set(r.medicalCondition, (condCounts.get(r.medicalCondition) || 0) + 1);

    const ac = ageCondMap.get(r.ageGroup) || new Map<string, number>();
    ac.set(r.medicalCondition, (ac.get(r.medicalCondition) || 0) + 1);
    ageCondMap.set(r.ageGroup, ac);

    const adm = admMap.get(r.admissionType) || { count: 0, staySum: 0, abnormal: 0 };
    adm.count++;
    adm.staySum += r.lengthOfStay;
    if (r.testResults === 'Abnormal') adm.abnormal++;
    admMap.set(r.admissionType, adm);

    const tst = testMap.get(r.testResults) || { count: 0, billingSum: 0 };
    tst.count++;
    tst.billingSum += r.billingAmount;
    testMap.set(r.testResults, tst);

    const cm = condMedMap.get(r.medicalCondition) || new Map<string, number>();
    cm.set(r.medication, (cm.get(r.medication) || 0) + 1);
    condMedMap.set(r.medicalCondition, cm);

    const mm = monthMap.get(r.admissionMonth) || { count: 0, billingSum: 0 };
    mm.count++;
    mm.billingSum += r.billingAmount;
    monthMap.set(r.admissionMonth, mm);
  }

  const topConditions = Array.from(condCounts.entries())
    .map(([condition, count]) => ({
      condition,
      count,
      sharePct: Number(((count / total) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.count - a.count);

  const ageOrder = ['0-17', '18-30', '31-45', '46-60', '61-75', '76+'];
  const conditionByAgeGroup = ageOrder
    .filter((ag) => ageCondMap.has(ag))
    .map((ageGroup) => {
      const m = ageCondMap.get(ageGroup)!;
      let topCond = '';
      let topCnt = -1;
      const breakdown: Record<string, number> = {};
      for (const [k, v] of m.entries()) {
        breakdown[k] = v;
        if (v > topCnt) {
          topCond = k;
          topCnt = v;
        }
      }
      return { ageGroup, topCondition: topCond, count: topCnt, breakdown };
    });

  const admissionTypePatterns = Array.from(admMap.entries())
    .map(([admissionType, v]) => ({
      admissionType,
      count: v.count,
      avgStay: Number((v.staySum / v.count).toFixed(1)),
      abnormalPct: Number(((v.abnormal / v.count) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.count - a.count);

  const testResultPatterns = Array.from(testMap.entries())
    .map(([testResult, v]) => ({
      testResult,
      count: v.count,
      sharePct: Number(((v.count / total) * 100).toFixed(1)),
      avgBilling: Number((v.billingSum / v.count).toFixed(2)),
    }))
    .sort((a, b) => b.count - a.count);

  const medicationByCondition = Array.from(condMedMap.entries()).map(([condition, m]) => {
    let topMed = '';
    let topCnt = -1;
    for (const [med, cnt] of m.entries()) {
      if (cnt > topCnt) {
        topMed = med;
        topCnt = cnt;
      }
    }
    return { condition, topMedication: topMed, count: topCnt };
  });

  const plainEnglishSummaries: string[] = [];
  if (topConditions[0]) {
    plainEnglishSummaries.push(
      `${topConditions[0].condition} is the most frequently recorded condition in this dataset (${topConditions[0].sharePct}% of ${total.toLocaleString()} admissions).`
    );
  }
  const olderCohort = conditionByAgeGroup.find((g) => g.ageGroup === '61-75') || conditionByAgeGroup[conditionByAgeGroup.length - 1];
  if (olderCohort) {
    plainEnglishSummaries.push(
      `Among patients aged ${olderCohort.ageGroup}, ${olderCohort.topCondition} appears most often (${olderCohort.count.toLocaleString()} records).`
    );
  }
  if (admissionTypePatterns[0]) {
    plainEnglishSummaries.push(
      `${admissionTypePatterns[0].admissionType} admissions account for the highest volume (${admissionTypePatterns[0].count.toLocaleString()} visits) with an average stay of ${admissionTypePatterns[0].avgStay} days and ${admissionTypePatterns[0].abnormalPct}% abnormal test results.`
    );
  }
  if (testResultPatterns[0]) {
    plainEnglishSummaries.push(
      `Diagnostic test results show ${testResultPatterns.map((t) => `${t.testResult}: ${t.sharePct}%`).join(', ')}.`
    );
  }

  // Historical trend analysis
  const sortedMonths = Array.from(monthMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  const monthlySeries = sortedMonths.map(([month, v], idx) => {
    const window = sortedMonths.slice(Math.max(0, idx - 2), idx + 1);
    const movingAvg = Number(
      (window.reduce((s, item) => s + item[1].count, 0) / window.length).toFixed(1)
    );
    return {
      month,
      admissions: v.count,
      movingAvg,
      avgBilling: Number((v.billingSum / v.count).toFixed(2)),
    };
  });

  let growthRate = 0;
  let direction = 'Stable';
  if (monthlySeries.length >= 4) {
    const firstHalf = monthlySeries.slice(0, Math.floor(monthlySeries.length / 2));
    const secondHalf = monthlySeries.slice(Math.floor(monthlySeries.length / 2));
    const avg1 = firstHalf.reduce((s, x) => s + x.admissions, 0) / firstHalf.length;
    const avg2 = secondHalf.reduce((s, x) => s + x.admissions, 0) / secondHalf.length;
    growthRate = Number((((avg2 - avg1) / Math.max(1, avg1)) * 100).toFixed(1));
    direction = growthRate > 3 ? 'Upward Trend' : growthRate < -3 ? 'Downward Trend' : 'Stable Volume';
  }

  return {
    mode,
    targetColumn,
    sampleSize: samples.length,
    models,
    patterns: {
      topConditions,
      conditionByAgeGroup,
      admissionTypePatterns,
      testResultPatterns,
      medicationByCondition,
      plainEnglishSummaries,
    },
    historicalTrends: {
      monthlySeries,
      trendDirection: direction,
      monthlyGrowthRatePct: growthRate,
      educationalNote:
        'Educational Historical Trend Analysis: Observed associations reflect patterns within the historical admission dataset only. Correlation in administrative records does not prove clinical risk or medical causation.',
    },
  };
}

export function runKMeansClustering(records: CleanedHealthcareRecord[], k = 4): ClusteringResult {
  const safeK = Math.max(2, Math.min(6, Math.round(k)));
  const stride = Math.max(1, Math.floor(records.length / 1800));
  const subset = records.filter((_, i) => i % stride === 0).slice(0, 1800);

  if (subset.length === 0) {
    return { k: safeK, inertia: 0, totalPoints: 0, clusters: [], scatterPoints: [] };
  }

  const ages = subset.map((r) => r.age);
  const bills = subset.map((r) => r.billingAmount);
  const stays = subset.map((r) => r.lengthOfStay);
  const mean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const std = (arr: number[], m: number) =>
    Math.max(1e-6, Math.sqrt(arr.reduce((s, x) => s + (x - m) ** 2, 0) / arr.length));

  const aM = mean(ages),
    aS = std(ages, aM);
  const bM = mean(bills),
    bS = std(bills, bM);
  const sM = mean(stays),
    sS = std(stays, sM);

  const vectors = subset.map((r) => [
    (r.age - aM) / aS,
    (r.billingAmount - bM) / bS,
    (r.lengthOfStay - sM) / sS,
  ]);

  // Deterministic spread initialization (k-means++ style spacing)
  const centroids: number[][] = [];
  for (let c = 0; c < safeK; c++) {
    const idx = Math.floor((c * vectors.length) / safeK);
    centroids.push([...vectors[idx]]);
  }

  const assignments = Array(vectors.length).fill(0);
  for (let iter = 0; iter < 20; iter++) {
    let changed = false;
    for (let i = 0; i < vectors.length; i++) {
      let bestC = 0;
      let bestD = Infinity;
      for (let c = 0; c < safeK; c++) {
        const d =
          (vectors[i][0] - centroids[c][0]) ** 2 +
          (vectors[i][1] - centroids[c][1]) ** 2 +
          (vectors[i][2] - centroids[c][2]) ** 2;
        if (d < bestD) {
          bestD = d;
          bestC = c;
        }
      }
      if (assignments[i] !== bestC) {
        assignments[i] = bestC;
        changed = true;
      }
    }

    const sums = Array.from({ length: safeK }, () => [0, 0, 0]);
    const counts = Array(safeK).fill(0);
    for (let i = 0; i < vectors.length; i++) {
      const c = assignments[i];
      counts[c]++;
      sums[c][0] += vectors[i][0];
      sums[c][1] += vectors[i][1];
      sums[c][2] += vectors[i][2];
    }
    for (let c = 0; c < safeK; c++) {
      if (counts[c] > 0) {
        centroids[c][0] = sums[c][0] / counts[c];
        centroids[c][1] = sums[c][1] / counts[c];
        centroids[c][2] = sums[c][2] / counts[c];
      }
    }
    if (!changed) break;
  }

  let inertia = 0;
  for (let i = 0; i < vectors.length; i++) {
    const c = assignments[i];
    inertia +=
      (vectors[i][0] - centroids[c][0]) ** 2 +
      (vectors[i][1] - centroids[c][1]) ** 2 +
      (vectors[i][2] - centroids[c][2]) ** 2;
  }

  const clusterProfiles = Array.from({ length: safeK }, (_, c) => {
    const members = subset.filter((_, idx) => assignments[idx] === c);
    const cnt = members.length;
    if (cnt === 0) {
      return {
        clusterId: c + 1,
        label: `Segment ${c + 1}`,
        count: 0,
        percentage: 0,
        avgAge: 0,
        avgBilling: 0,
        avgStay: 0,
        topCondition: 'N/A',
        topAdmissionType: 'N/A',
        dominantTestResult: 'N/A',
      };
    }

    const modeOf = (vals: string[]) => {
      const m = new Map<string, number>();
      for (const v of vals) m.set(v, (m.get(v) || 0) + 1);
      return Array.from(m.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
    };

    const avgAge = Number((members.reduce((s, r) => s + r.age, 0) / cnt).toFixed(1));
    const avgBilling = Number((members.reduce((s, r) => s + r.billingAmount, 0) / cnt).toFixed(2));
    const avgStay = Number((members.reduce((s, r) => s + r.lengthOfStay, 0) / cnt).toFixed(1));

    const ageDesc = avgAge >= 58 ? 'Senior' : avgAge <= 36 ? 'Young Adult' : 'Middle-Aged';
    const costDesc = avgBilling >= bM * 1.15 ? 'High-Billing' : avgBilling <= bM * 0.85 ? 'Standard-Cost' : 'Moderate-Cost';

    return {
      clusterId: c + 1,
      label: `${ageDesc} · ${costDesc}`,
      count: cnt,
      percentage: Number(((cnt / subset.length) * 100).toFixed(1)),
      avgAge,
      avgBilling,
      avgStay,
      topCondition: modeOf(members.map((r) => r.medicalCondition)),
      topAdmissionType: modeOf(members.map((r) => r.admissionType)),
      dominantTestResult: modeOf(members.map((r) => r.testResults)),
    };
  });

  const scatterStride = Math.max(1, Math.floor(subset.length / 260));
  const scatterPoints = subset
    .filter((_, idx) => idx % scatterStride === 0)
    .slice(0, 260)
    .map((r, idx) => {
      const origIdx = idx * scatterStride;
      return {
        age: r.age,
        billing: Number(r.billingAmount.toFixed(0)),
        stay: r.lengthOfStay,
        clusterId: (assignments[origIdx] ?? 0) + 1,
        condition: r.medicalCondition,
      };
    });

  return {
    k: safeK,
    inertia: Number(inertia.toFixed(2)),
    totalPoints: subset.length,
    clusters: clusterProfiles,
    scatterPoints,
  };
}
