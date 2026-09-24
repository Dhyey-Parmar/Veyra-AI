/**
 * Verified Evaluation Reference Data
 *
 * Sourced directly from the trained HistGradientBoosting pipeline and test evaluation
 * metrics (artifacts/metrics/evaluation_data.json and models/model_metadata.json).
 * Used as reliable fallback defaults during initial SSR rendering.
 */

export type MetricKey =
  | 'accuracy'
  | 'precision'
  | 'recall'
  | 'f1'
  | 'rocAuc'
  | 'prAuc'

export const modelSnapshot = {
  rocAuc: 0.7573,
  f1: 0.3421,
  recall: 0.682,
  prAuc: 0.3291,
}

export const performanceOverview: Record<MetricKey, number> = {
  accuracy: 0.6954,
  precision: 0.2283,
  recall: 0.682,
  f1: 0.3421,
  rocAuc: 0.7573,
  prAuc: 0.3291,
}

export type ModelRow = {
  model: string
  accuracy: number
  precision: number
  recall: number
  f1: number
  rocAuc: number
  prAuc: number
  best?: boolean
}

export const modelComparison: ModelRow[] = [
  { model: 'HistGradientBoosting (Balanced)', accuracy: 0.6938, precision: 0.2282, recall: 0.6867, f1: 0.3425, rocAuc: 0.7572, prAuc: 0.3281, best: true },
  { model: 'Balanced Logistic Regression', accuracy: 0.6764, precision: 0.2196, recall: 0.6997, f1: 0.3343, rocAuc: 0.7532, prAuc: 0.3105 },
  { model: 'Random Forest (Balanced)', accuracy: 0.7755, precision: 0.2700, recall: 0.5480, f1: 0.3618, rocAuc: 0.7518, prAuc: 0.3101 },
  { model: 'Gradient Boosting', accuracy: 0.8860, precision: 0.5787, recall: 0.0688, f1: 0.1230, rocAuc: 0.7551, prAuc: 0.3259 },
  { model: 'AdaBoost', accuracy: 0.8857, precision: 0.6110, recall: 0.0432, f1: 0.0806, rocAuc: 0.7513, prAuc: 0.3166 },
  { model: 'Logistic Regression (Baseline)', accuracy: 0.8852, precision: 0.6031, recall: 0.0330, f1: 0.0627, rocAuc: 0.7531, prAuc: 0.3116 },
  { model: 'Scratch Logistic Regression', accuracy: 0.8846, precision: 0.5510, recall: 0.0364, f1: 0.0683, rocAuc: 0.7461, prAuc: 0.3005 },
]

export type ConfusionMatrix = {
  truePositive: number
  falsePositive: number
  falseNegative: number
  trueNegative: number
}

// Exact evaluation matrix on the held-out 51,070 test samples
export const confusionMatrix: ConfusionMatrix = {
  trueNegative: 31467,
  falsePositive: 13672,
  falseNegative: 1886,
  truePositive: 4045,
}

export const datasetSnapshot = {
  applications: 255347,
  features: 18,
  defaultRate: 0.1161,
  nonDefaultRate: 0.8839,
  averageIncome: 82499,
  averageLoanAmount: 127578,
  averageCreditScore: 574,
}

export const defaultDistribution = [
  { label: 'No Default', value: 225694, share: 0.8839 },
  { label: 'Default', value: 29653, share: 0.1161 },
]

export type FeatureImportance = { feature: string; importance: number }

export const featureImportance: FeatureImportance[] = [
  { feature: 'Age', importance: 0.0774 },
  { feature: 'Interest Rate', importance: 0.0610 },
  { feature: 'Annual Income', importance: 0.0411 },
  { feature: 'Months Employed', importance: 0.0246 },
  { feature: 'Loan Amount', importance: 0.0211 },
  { feature: 'Unemployed Status', importance: 0.0045 },
  { feature: 'Has Dependents', importance: 0.0039 },
  { feature: 'Has Mortgage', importance: 0.0023 },
  { feature: 'Credit Score', importance: 0.0009 },
  { feature: 'DTI Ratio', importance: 0.0006 },
]

export const riskDistribution = [
  { band: 'Low', range: '0–30%', count: 16923, share: 0.3314, fill: 'var(--color-teal)' },
  { band: 'Moderate', range: '30–60%', count: 22795, share: 0.4463, fill: 'var(--color-warning)' },
  { band: 'High', range: '60–100%', count: 11352, share: 0.2223, fill: 'var(--color-danger)' },
]

export const defaultRateByScore = [
  { bucket: '300–499', count: 93029, rate: 0.1277 },
  { bucket: '500–579', count: 37194, rate: 0.1173 },
  { bucket: '580–669', count: 41847, rate: 0.1143 },
  { bucket: '670–739', count: 32073, rate: 0.1063 },
  { bucket: '740–799', count: 27736, rate: 0.1050 },
  { bucket: '800–850', count: 23468, rate: 0.0981 },
]

export const rocBaseline = [
  { fpr: 0, tpr: 0 },
  { fpr: 1, tpr: 1 },
]

export const rocCurve = [
  { fpr: 0.0, tpr: 0.0 },
  { fpr: 0.0134, tpr: 0.1214 },
  { fpr: 0.0325, tpr: 0.204 },
  { fpr: 0.0531, tpr: 0.2747 },
  { fpr: 0.0768, tpr: 0.3394 },
  { fpr: 0.1039, tpr: 0.3957 },
  { fpr: 0.1345, tpr: 0.4578 },
  { fpr: 0.1691, tpr: 0.5186 },
  { fpr: 0.2078, tpr: 0.5794 },
  { fpr: 0.2505, tpr: 0.6385 },
  { fpr: 0.2982, tpr: 0.6974 },
  { fpr: 0.3507, tpr: 0.7483 },
  { fpr: 0.4079, tpr: 0.7997 },
  { fpr: 0.4705, tpr: 0.8464 },
  { fpr: 0.5392, tpr: 0.8872 },
  { fpr: 0.6127, tpr: 0.9221 },
  { fpr: 0.6934, tpr: 0.9525 },
  { fpr: 0.7816, tpr: 0.9752 },
  { fpr: 0.8797, tpr: 0.9904 },
  { fpr: 1.0, tpr: 1.0 },
]

export const prCurve = [
  { recall: 1.0, precision: 0.1161 },
  { recall: 0.9831, precision: 0.1219 },
  { recall: 0.9493, precision: 0.1337 },
  { recall: 0.8985, precision: 0.1541 },
  { recall: 0.8477, precision: 0.174 },
  { recall: 0.797, precision: 0.1926 },
  { recall: 0.7462, precision: 0.2096 },
  { recall: 0.6955, precision: 0.2263 },
  { recall: 0.6447, precision: 0.2447 },
  { recall: 0.594, precision: 0.2624 },
  { recall: 0.5432, precision: 0.2798 },
  { recall: 0.4925, precision: 0.2974 },
  { recall: 0.4417, precision: 0.3168 },
  { recall: 0.391, precision: 0.3347 },
  { recall: 0.3402, precision: 0.3541 },
  { recall: 0.2895, precision: 0.3735 },
  { recall: 0.2387, precision: 0.3934 },
  { recall: 0.188, precision: 0.4137 },
  { recall: 0.1372, precision: 0.4356 },
  { recall: 0.0865, precision: 0.4632 },
  { recall: 0.0358, precision: 0.4947 },
  { recall: 0.0, precision: 1.0 },
]
