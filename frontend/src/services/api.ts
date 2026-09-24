/**
 * Veyra Centralized API Service Layer (Vite + React)
 *
 * Interacts with the real FastAPI ML backend.
 * Uses VITE_API_URL environment variable with fallback to local server.
 */

const rawEnvUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim()

// In production or when VITE_API_URL is unset/empty, use relative '/api' for same-origin calls on Vercel.
// For local development with Vite dev proxy, '/api' automatically forwards to http://127.0.0.1:8000.
// If VITE_API_URL is explicitly provided (e.g. custom domain), it will be used.
export const API_BASE_URL =
  rawEnvUrl && rawEnvUrl !== ''
    ? rawEnvUrl.replace(/\/$/, '')
    : '/api'

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public data?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// -------------------------------------------------------------
// Request & Response Typings
// -------------------------------------------------------------

export type LoanApplicationInput = {
  Age: number
  Income: number
  LoanAmount: number
  CreditScore: number
  MonthsEmployed: number
  NumCreditLines: number
  InterestRate: number
  LoanTerm: number
  DTIRatio: number
  Education: string
  EmploymentType: string
  MaritalStatus: string
  HasMortgage: 'Yes' | 'No'
  HasDependents: 'Yes' | 'No'
  LoanPurpose: string
  HasCoSigner: 'Yes' | 'No'
}

export type RiskBand = 'Low' | 'Moderate' | 'High'

export type PredictionResponse = {
  status: string
  prediction: 0 | 1
  prediction_label: 'Default' | 'Non-Default'
  default_probability: number
  default_probability_percent: string
  risk_band: RiskBand
  risk_level: string
  risk_color: string
  message: string
  risk_factors: string[]
  model_name: string
  model_version: string
  predicted_at: string
  applicant_summary: {
    Age: number
    Income: string
    LoanAmount: string
    CreditScore: number
    DTIRatio: number
  }
}

export type TestMetrics = {
  accuracy: number
  precision: number
  recall: number
  f1_score: number
  roc_auc: number
  pr_auc: number
}

export type ModelDetailsResponse = {
  project_name: string
  architecture: string
  target_column: string
  class_distribution: {
    non_default_count: number
    default_count: number
    default_rate_pct: number
    non_default_rate_pct: number
  }
  training_samples: number
  testing_samples: number
  numerical_features: string[]
  categorical_features: string[]
  encoded_features_count: number
  best_hyperparameters: Record<string, unknown>
  test_metrics: TestMetrics
  top_5_features: string[]
  created_timestamp: string
}

export type ModelComparisonRow = {
  Model: string
  Accuracy: number
  Precision: number
  Recall: number
  F1_Score: number
  ROC_AUC: number
  PR_AUC: number
  Train_Time_Sec: number
  best?: boolean
}

export type FeatureImportanceRow = {
  Feature: string
  Importance: number
  Std?: number
}

export type ConfusionMatrixData = {
  trueNegative: number
  falsePositive: number
  falseNegative: number
  truePositive: number
}

export type RocPoint = { fpr: number; tpr: number }
export type PrPoint = { recall: number; precision: number }

export type MetricsResponse = {
  model_comparison: ModelComparisonRow[]
  cross_validation?: Array<Record<string, unknown>>
  feature_importance: FeatureImportanceRow[]
  threshold_analysis?: Array<Record<string, unknown>>
  confusion_matrix: ConfusionMatrixData
  roc_curve: RocPoint[]
  roc_auc: number
  pr_curve: PrPoint[]
  pr_auc: number
  test_metrics: TestMetrics
}

export type ScoreBucketRate = {
  bucket: string
  count: number
  rate: number
}

export type RiskDistributionBand = {
  band: string
  range: string
  count: number
  share: number
  fill: string
}

export type InsightsResponse = {
  dataset_name: string
  total_records: number
  features_count: number
  numerical_features_count: number
  categorical_features_count: number
  missing_values: number
  class_distribution: {
    non_default_count: number
    default_count: number
    non_default_percentage: number
    default_percentage: number
    imbalance_ratio: string
  }
  key_feature_ranges: Record<string, { min: number; max: number; mean: number }>
  top_predictive_factors: string[]
  underwriting_observations: string[]
  default_rate_by_score?: ScoreBucketRate[]
  risk_distribution?: RiskDistributionBand[]
  feature_importance?: FeatureImportanceRow[]
}

// -------------------------------------------------------------
// Core Fetch Wrapper
// -------------------------------------------------------------

function resolveUrl(endpoint: string): string {
  const base = API_BASE_URL.replace(/\/$/, '')
  const ep = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  if (base.endsWith('/api') && ep.startsWith('/api/')) {
    return `${base.slice(0, -4)}${ep}`
  }
  return `${base}${ep}`
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = resolveUrl(endpoint)

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 12000)

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(options?.headers || {}),
      },
    })

    clearTimeout(timeoutId)

    if (!res.ok) {
      let errorData: unknown = null
      try {
        errorData = await res.json()
      } catch {
        errorData = await res.text()
      }
      const message =
        typeof errorData === 'object' && errorData && 'detail' in errorData
          ? String((errorData as { detail: unknown }).detail)
          : `API request failed with HTTP ${res.status}`
      throw new ApiError(message, res.status, errorData)
    }

    return (await res.json()) as T
  } catch (err: unknown) {
    clearTimeout(timeoutId)
    if (err instanceof ApiError) throw err
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ApiError('Request timed out while connecting to the Veyra prediction server.')
    }
    const msg =
      err instanceof Error
        ? err.message
        : 'Unable to connect to the Veyra ML backend. Ensure FastAPI is running.'
    throw new ApiError(msg)
  }
}

// -------------------------------------------------------------
// Public API Methods
// -------------------------------------------------------------

export const api = {
  async checkHealth(): Promise<{ status: string }> {
    return request<{ status: string }>('/health')
  },

  async predictLoanRisk(application: LoanApplicationInput): Promise<PredictionResponse> {
    return request<PredictionResponse>('/predict', {
      method: 'POST',
      body: JSON.stringify(application),
    })
  },

  async getModelDetails(): Promise<ModelDetailsResponse> {
    return request<ModelDetailsResponse>('/model-details')
  },

  async getMetrics(): Promise<MetricsResponse> {
    return request<MetricsResponse>('/metrics')
  },

  async getInsights(): Promise<InsightsResponse> {
    return request<InsightsResponse>('/insights')
  },
}
