import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Loader2, AlertCircle, RefreshCw } from 'lucide-react'

import { PageShell, PageHeader } from '@/components/common/Layout'
import { AssessmentStepper, type Step } from '@/components/assessment/AssessmentStepper'
import {
  FormField,
  NumberField,
  SelectField,
  SegmentedControl,
  ToggleField,
} from '@/components/assessment/FormField'
import { ApplicantSummary } from '@/components/assessment/ApplicantSummary'
import { Button } from '@/components/common/Button'
import { useAssessment, type ApplicantData } from '@/context/AssessmentContext'
import { cn } from '@/lib/utils'

const STEPS: Step[] = [
  { id: 'applicant', label: 'Applicant' },
  { id: 'financial', label: 'Financial' },
  { id: 'credit', label: 'Credit' },
  { id: 'loan', label: 'Loan' },
  { id: 'review', label: 'Review' },
]

// Aligned strictly with model training features & dataset vocabulary
const EDUCATION = ["Bachelor's", "Master's", 'High School', 'PhD']
const EMPLOYMENT = ['Full-time', 'Part-time', 'Self-employed', 'Unemployed']
const MARITAL = ['Married', 'Single', 'Divorced']
const PURPOSE = ['Home', 'Auto', 'Business', 'Education', 'Other']

type StepKey = 'applicant' | 'financial' | 'credit' | 'loan'

function validateStep(step: StepKey, a: ApplicantData): Record<string, string> {
  const errors: Record<string, string> = {}
  const num = (v: number) => !Number.isNaN(v) && Number.isFinite(v)

  if (step === 'applicant') {
    if (!num(a.age) || a.age < 18 || a.age > 100) {
      errors.age = 'Applicant age must be between 18 and 100 years.'
    }
  }
  if (step === 'financial') {
    if (!num(a.income) || a.income < 0) {
      errors.income = 'Annual income must be $0 or greater.'
    }
    if (!num(a.loanAmount) || a.loanAmount < 500) {
      errors.loanAmount = 'Requested loan amount must be at least $500.'
    }
    if (!num(a.interestRate) || a.interestRate < 0.1 || a.interestRate > 40.0) {
      errors.interestRate = 'Interest rate must be between 0.1% and 40.0%.'
    }
    if (!num(a.dtiRatio) || a.dtiRatio < 0.0 || a.dtiRatio > 2.0) {
      errors.dtiRatio = 'Debt-to-income ratio must be between 0.00 and 2.00.'
    }
  }
  if (step === 'credit') {
    if (!num(a.creditScore) || a.creditScore < 300 || a.creditScore > 850) {
      errors.creditScore = 'Credit score must be within standard bureau range (300–850).'
    }
    if (!num(a.monthsEmployed) || a.monthsEmployed < 0 || a.monthsEmployed > 600) {
      errors.monthsEmployed = 'Months employed must be between 0 and 600.'
    }
    if (!num(a.creditLines) || a.creditLines < 0 || a.creditLines > 50) {
      errors.creditLines = 'Active credit lines must be between 0 and 50.'
    }
  }
  if (step === 'loan') {
    if (!num(a.loanTerm) || a.loanTerm < 12 || a.loanTerm > 360) {
      errors.loanTerm = 'Loan term must be between 12 and 360 months.'
    }
    if (!num(a.dependents) || a.dependents < 0 || a.dependents > 20) {
      errors.dependents = 'Dependents must be between 0 and 20.'
    }
  }
  return errors
}

export default function AssessPage() {
  const navigate = useNavigate()
  const { applicant, setApplicant, runAssessment, isRunning, error, clearError } = useAssessment()
  const [index, setIndex] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [direction, setDirection] = useState(1)

  const step = STEPS[index]
  const isReview = step.id === 'review'

  const canProceed = useMemo(() => {
    if (isReview) return true
    return Object.keys(validateStep(step.id as StepKey, applicant)).length === 0
  }, [step.id, applicant, isReview])

  function goNext() {
    clearError()
    if (!isReview) {
      const errs = validateStep(step.id as StepKey, applicant)
      setErrors(errs)
      if (Object.keys(errs).length > 0) return
    }
    setDirection(1)
    setIndex((i) => Math.min(STEPS.length - 1, i + 1))
  }

  function goPrev() {
    clearError()
    setErrors({})
    setDirection(-1)
    setIndex((i) => Math.max(0, i - 1))
  }

  function jumpTo(i: number) {
    clearError()
    setErrors({})
    setDirection(i > index ? 1 : -1)
    setIndex(i)
  }

  async function handleRun() {
    clearError()
    try {
      await runAssessment()
      navigate('/risk-analysis')
    } catch {
      // Error handled in context state
    }
  }

  return (
    <div className="pb-24">
      <PageShell>
        <PageHeader
          eyebrow="Assess Applicant"
          title="Build a credit risk profile"
          description="Complete each underwriting section to evaluate applicant default probability against the production HistGradientBoosting model."
        />

        <div className="py-8">
          <AssessmentStepper steps={STEPS} current={index} onStepChange={jumpTo} />
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
            <AlertCircle className="size-5 shrink-0" />
            <div className="flex-1">
              <p className="font-medium">Underwriting Inference Failed</p>
              <p className="mt-0.5 text-xs text-danger/90">{error}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRun}
              disabled={isRunning}
              className="text-danger hover:bg-danger/10"
            >
              <RefreshCw className="mr-1 size-3.5" />
              Retry
            </Button>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="min-w-0">
            <div className="overflow-hidden rounded-xl border border-hairline bg-surface">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={step.id}
                  custom={direction}
                  initial={{ opacity: 0, x: direction * 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction * -24 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className="p-6 sm:p-8"
                >
                  <StepContent
                    stepId={step.id}
                    applicant={applicant}
                    setApplicant={setApplicant}
                    errors={errors}
                    onJump={jumpTo}
                  />
                </motion.div>
              </AnimatePresence>

              <div className="flex items-center justify-between gap-3 border-t border-hairline px-6 py-4 sm:px-8">
                <Button variant="ghost" size="lg" onClick={goPrev} disabled={index === 0 || isRunning}>
                  <ArrowLeft className="size-4" data-icon="inline-start" />
                  Previous
                </Button>

                {isReview ? (
                  <Button
                    size="lg"
                    onClick={handleRun}
                    disabled={isRunning}
                    className="min-w-[220px] bg-brand text-white hover:bg-brand/90"
                  >
                    {isRunning ? (
                      <>
                        <Loader2 className="size-4 animate-spin" data-icon="inline-start" />
                        Analyzing applicant profile…
                      </>
                    ) : (
                      <>
                        Run Risk Assessment
                        <ArrowRight className="size-4" data-icon="inline-end" />
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    onClick={goNext}
                    className={cn(!canProceed && 'opacity-60')}
                  >
                    Continue
                    <ArrowRight className="size-4" data-icon="inline-end" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Contextual side rail */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-xl border border-hairline bg-surface p-6">
              <p className="label-eyebrow mb-3">Progress</p>
              <div className="flex items-baseline gap-2">
                <span className="tabular text-3xl font-semibold text-ink">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="text-sm text-muted-ink">/ {String(STEPS.length).padStart(2, '0')} sections</span>
              </div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-secondary">
                <motion.div
                  className="h-full rounded-full bg-brand-accent"
                  animate={{ width: `${((index + 1) / STEPS.length) * 100}%` }}
                  transition={{ ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
              <p className="mt-5 text-sm leading-relaxed text-muted-ink">
                {STEP_HELP[step.id]}
              </p>
              <div className="mt-6 border-t border-hairline pt-4 text-xs text-muted-ink">
                <p className="font-medium text-ink">Underwriting Model</p>
                <p className="mt-0.5">HistGradientBoosting (Balanced)</p>
                <p className="mt-2 font-medium text-ink">Decision Threshold</p>
                <p className="mt-0.5">0.50 (Low &lt;30% · Mod 30–60% · High &ge;60%)</p>
              </div>
            </div>
          </aside>
        </div>
      </PageShell>
    </div>
  )
}

const STEP_HELP: Record<string, string> = {
  applicant: 'Demographic features calibrate baseline borrower segment characteristics across the portfolio.',
  financial: 'Income, requested capital, and debt obligations represent primary cash-flow capacity indicators.',
  credit: 'Credit bureau score, tenure of employment, and active revolving credit lines evaluate borrower repayment behavior.',
  loan: 'Loan maturity, intended capital purpose, mortgage obligations, and co-signer backing finalize underwriting input.',
  review: 'Verify every parameter before initiating model inference. Each parameter maps strictly to model feature inputs.',
}

function StepHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="mb-7">
      <p className="label-eyebrow mb-1.5">{eyebrow}</p>
      <h2 className="text-xl font-semibold tracking-tight text-ink">{title}</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-ink">{description}</p>
    </div>
  )
}

function StepContent({
  stepId,
  applicant,
  setApplicant,
  errors,
  onJump,
}: {
  stepId: string
  applicant: ApplicantData
  setApplicant: (patch: Partial<ApplicantData>) => void
  errors: Record<string, string>
  onJump: (index: number) => void
}) {
  if (stepId === 'applicant') {
    return (
      <div>
        <StepHeading
          eyebrow="Step 01"
          title="Applicant details"
          description="Demographic profile and educational background of the primary borrower."
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Age" htmlFor="age" error={errors.age}>
            <NumberField
              id="age"
              value={applicant.age}
              min={18}
              max={100}
              onChange={(v) => setApplicant({ age: v })}
              invalid={!!errors.age}
            />
          </FormField>
          <FormField label="Education" htmlFor="education">
            <SelectField
              id="education"
              value={applicant.education}
              options={EDUCATION}
              onChange={(v) => setApplicant({ education: v })}
            />
          </FormField>
          <FormField label="Employment Classification" className="sm:col-span-2">
            <SegmentedControl
              ariaLabel="Employment type"
              value={applicant.employmentType}
              options={EMPLOYMENT.map((e) => ({ label: e, value: e }))}
              onChange={(v) => setApplicant({ employmentType: v })}
            />
          </FormField>
          <FormField label="Marital Status" className="sm:col-span-2">
            <SegmentedControl
              ariaLabel="Marital status"
              value={applicant.maritalStatus}
              options={MARITAL.map((e) => ({ label: e, value: e }))}
              onChange={(v) => setApplicant({ maritalStatus: v })}
            />
          </FormField>
        </div>
      </div>
    )
  }

  if (stepId === 'financial') {
    return (
      <div>
        <StepHeading
          eyebrow="Step 02"
          title="Financial capacity"
          description="Income, requested loan amount, interest rate, and debt burden."
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Annual Income" htmlFor="income" error={errors.income}>
            <NumberField
              id="income"
              value={applicant.income}
              min={0}
              step={1000}
              prefix="$"
              onChange={(v) => setApplicant({ income: v })}
              invalid={!!errors.income}
            />
          </FormField>
          <FormField label="Loan Amount" htmlFor="loanAmount" error={errors.loanAmount}>
            <NumberField
              id="loanAmount"
              value={applicant.loanAmount}
              min={500}
              step={1000}
              prefix="$"
              onChange={(v) => setApplicant({ loanAmount: v })}
              invalid={!!errors.loanAmount}
            />
          </FormField>
          <FormField label="Interest Rate" htmlFor="interestRate" error={errors.interestRate}>
            <NumberField
              id="interestRate"
              value={applicant.interestRate}
              min={0.1}
              max={40.0}
              step={0.1}
              suffix="%"
              onChange={(v) => setApplicant({ interestRate: v })}
              invalid={!!errors.interestRate}
            />
          </FormField>
          <FormField
            label="Debt-to-Income (DTI) Ratio"
            htmlFor="dtiRatio"
            hint="Total debt service divided by gross income (0.00 – 2.00)."
            error={errors.dtiRatio}
          >
            <NumberField
              id="dtiRatio"
              value={applicant.dtiRatio}
              min={0.0}
              max={2.0}
              step={0.01}
              onChange={(v) => setApplicant({ dtiRatio: v })}
              invalid={!!errors.dtiRatio}
            />
          </FormField>
        </div>
      </div>
    )
  }

  if (stepId === 'credit') {
    return (
      <div>
        <StepHeading
          eyebrow="Step 03"
          title="Credit history"
          description="Bureau credit score, employment tenure, and existing revolving credit lines."
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            label="Credit Score"
            htmlFor="creditScore"
            hint="Bureau FICO score between 300 and 850."
            error={errors.creditScore}
          >
            <NumberField
              id="creditScore"
              value={applicant.creditScore}
              min={300}
              max={850}
              onChange={(v) => setApplicant({ creditScore: v })}
              invalid={!!errors.creditScore}
            />
          </FormField>
          <FormField
            label="Months Employed"
            htmlFor="monthsEmployed"
            hint="Duration in current or total employment."
            error={errors.monthsEmployed}
          >
            <NumberField
              id="monthsEmployed"
              value={applicant.monthsEmployed}
              min={0}
              max={600}
              onChange={(v) => setApplicant({ monthsEmployed: v })}
              invalid={!!errors.monthsEmployed}
            />
          </FormField>
          <FormField
            label="Number of Credit Lines"
            htmlFor="creditLines"
            className="sm:col-span-2"
            hint="Total open lines of revolving and installment credit (0–50)."
            error={errors.creditLines}
          >
            <NumberField
              id="creditLines"
              value={applicant.creditLines}
              min={0}
              max={50}
              onChange={(v) => setApplicant({ creditLines: v })}
              invalid={!!errors.creditLines}
            />
          </FormField>
        </div>
      </div>
    )
  }

  if (stepId === 'loan') {
    return (
      <div>
        <StepHeading
          eyebrow="Step 04"
          title="Loan terms & support"
          description="Maturity schedule, capital purpose, and collateral / co-borrower status."
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Loan Term (Months)" className="sm:col-span-2" error={errors.loanTerm}>
            <SegmentedControl
              ariaLabel="Loan term in months"
              value={String(applicant.loanTerm)}
              options={[12, 24, 36, 48, 60, 120, 180, 240, 360].map((t) => ({ label: `${t} mo`, value: String(t) }))}
              onChange={(v) => setApplicant({ loanTerm: Number(v) })}
            />
          </FormField>
          <FormField label="Loan Purpose" htmlFor="loanPurpose">
            <SelectField
              id="loanPurpose"
              value={applicant.loanPurpose}
              options={PURPOSE}
              onChange={(v) => setApplicant({ loanPurpose: v })}
            />
          </FormField>
          <FormField
            label="Dependents"
            htmlFor="dependents"
            hint="Number of dependent family members."
            error={errors.dependents}
          >
            <NumberField
              id="dependents"
              value={applicant.dependents}
              min={0}
              max={20}
              onChange={(v) => setApplicant({ dependents: v })}
              invalid={!!errors.dependents}
            />
          </FormField>
          <div className="flex flex-col gap-3 sm:col-span-2">
            <ToggleField
              label="Existing Mortgage"
              description="Applicant currently maintains an active residential mortgage."
              checked={applicant.mortgage}
              onChange={(v) => setApplicant({ mortgage: v })}
            />
            <ToggleField
              label="Co-Signer Backing"
              description="A qualified co-signer is legally committed to this loan application."
              checked={applicant.coSigner}
              onChange={(v) => setApplicant({ coSigner: v })}
            />
          </div>
        </div>
      </div>
    )
  }

  // review step
  return (
    <div>
      <div className="mb-7 flex items-end justify-between">
        <div>
          <p className="label-eyebrow mb-1.5">Step 05</p>
          <h2 className="text-xl font-semibold tracking-tight text-ink">Review application</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-ink">
            Confirm all submitted borrower parameters before triggering production model inference.
          </p>
        </div>
      </div>
      <div className="space-y-4">
        <ApplicantSummary applicant={applicant} columns={2} />
        <div className="flex flex-wrap gap-2 text-xs text-muted-ink">
          <span>Edit sections:</span>
          <button
            type="button"
            onClick={() => onJump(0)}
            className="font-medium text-brand-accent hover:underline"
          >
            Applicant
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={() => onJump(1)}
            className="font-medium text-brand-accent hover:underline"
          >
            Financial
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={() => onJump(2)}
            className="font-medium text-brand-accent hover:underline"
          >
            Credit
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={() => onJump(3)}
            className="font-medium text-brand-accent hover:underline"
          >
            Loan
          </button>
        </div>
      </div>
    </div>
  )
}
