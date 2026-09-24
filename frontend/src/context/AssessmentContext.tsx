import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  api,
  type LoanApplicationInput,
  type PredictionResponse,
  type RiskBand,
} from '@/services/api'

export type ApplicantData = {
  // Applicant
  age: number
  education: string
  employmentType: string
  maritalStatus: string
  // Financial
  income: number
  loanAmount: number
  interestRate: number
  dtiRatio: number
  // Credit
  creditScore: number
  monthsEmployed: number
  creditLines: number
  // Loan
  loanTerm: number
  loanPurpose: string
  mortgage: boolean
  dependents: number
  coSigner: boolean
}

export type { RiskBand }

export type AssessmentResult = {
  probability: number
  probabilityPercent: string
  classification: 'DEFAULT' | 'NO DEFAULT'
  band: RiskBand
  riskLevel: string
  riskColor: string
  message: string
  riskFactors: string[]
  model: string
  modelVersion: string
  predictedAt: string
  rawResponse?: PredictionResponse
}

export const DEFAULT_APPLICANT: ApplicantData = {
  age: 38,
  education: "Bachelor's",
  employmentType: 'Full-time',
  maritalStatus: 'Married',
  income: 85000,
  loanAmount: 24000,
  interestRate: 8.5,
  dtiRatio: 0.28,
  creditScore: 720,
  monthsEmployed: 54,
  creditLines: 5,
  loanTerm: 36,
  loanPurpose: 'Home',
  mortgage: true,
  dependents: 1,
  coSigner: true,
}

export function bandForProbability(p: number): RiskBand {
  if (p < 0.3) return 'Low'
  if (p < 0.6) return 'Moderate'
  return 'High'
}

export function toLoanApplicationInput(a: ApplicantData): LoanApplicationInput {
  return {
    Age: Math.round(a.age),
    Income: Number(a.income),
    LoanAmount: Number(a.loanAmount),
    CreditScore: Math.round(a.creditScore),
    MonthsEmployed: Math.round(a.monthsEmployed),
    NumCreditLines: Math.round(a.creditLines),
    InterestRate: Number(a.interestRate),
    LoanTerm: Math.round(a.loanTerm),
    DTIRatio: Number(a.dtiRatio),
    Education: a.education,
    EmploymentType: a.employmentType,
    MaritalStatus: a.maritalStatus,
    HasMortgage: a.mortgage ? 'Yes' : 'No',
    HasDependents: a.dependents > 0 ? 'Yes' : 'No',
    LoanPurpose: a.loanPurpose,
    HasCoSigner: a.coSigner ? 'Yes' : 'No',
  }
}

type AssessmentContextValue = {
  applicant: ApplicantData
  setApplicant: (patch: Partial<ApplicantData>) => void
  resetApplicant: () => void
  result: AssessmentResult | null
  isRunning: boolean
  error: string | null
  clearError: () => void
  runAssessment: () => Promise<AssessmentResult>
}

const AssessmentContext = createContext<AssessmentContextValue | null>(null)

export function AssessmentProvider({ children }: { children: ReactNode }) {
  const [applicant, setApplicantState] = useState<ApplicantData>(DEFAULT_APPLICANT)
  const [result, setResult] = useState<AssessmentResult | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setApplicant = useCallback((patch: Partial<ApplicantData>) => {
    setApplicantState((prev) => ({ ...prev, ...patch }))
  }, [])

  const resetApplicant = useCallback(() => {
    setApplicantState(DEFAULT_APPLICANT)
    setResult(null)
    setError(null)
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const runAssessment = useCallback(async (): Promise<AssessmentResult> => {
    setIsRunning(true)
    setError(null)

    try {
      const payload = toLoanApplicationInput(applicant)
      const res = await api.predictLoanRisk(payload)

      const band: RiskBand = res.risk_band || bandForProbability(res.default_probability)
      const classification: 'DEFAULT' | 'NO DEFAULT' =
        res.prediction === 1 ? 'DEFAULT' : 'NO DEFAULT'

      const next: AssessmentResult = {
        probability: res.default_probability,
        probabilityPercent: res.default_probability_percent,
        classification,
        band,
        riskLevel: res.risk_level,
        riskColor: res.risk_color,
        message: res.message,
        riskFactors: res.risk_factors || [],
        model: res.model_name || 'HistGradientBoosting (Balanced)',
        modelVersion: res.model_version || '1.0.0',
        predictedAt: res.predicted_at || new Date().toISOString(),
        rawResponse: res,
      }

      setResult(next)
      return next
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Assessment failed. Please verify that the Veyra backend is running.'
      setError(msg)
      throw err
    } finally {
      setIsRunning(false)
    }
  }, [applicant])

  const value = useMemo(
    () => ({
      applicant,
      setApplicant,
      resetApplicant,
      result,
      isRunning,
      error,
      clearError,
      runAssessment,
    }),
    [applicant, setApplicant, resetApplicant, result, isRunning, error, clearError, runAssessment],
  )

  return <AssessmentContext.Provider value={value}>{children}</AssessmentContext.Provider>
}

export function useAssessment() {
  const ctx = useContext(AssessmentContext)
  if (!ctx) throw new Error('useAssessment must be used within AssessmentProvider')
  return ctx
}
