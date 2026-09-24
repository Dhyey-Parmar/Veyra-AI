import React from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export type Step = {
  id: string
  label: string
}

export function AssessmentStepper({
  steps,
  current,
  onStepChange,
}: {
  steps: Step[]
  current: number
  onStepChange?: (index: number) => void
}) {
  return (
    <nav aria-label="Assessment progress" className="w-full">
      <ol className="flex items-center justify-between gap-2">
        {steps.map((step, idx) => {
          const isComplete = idx < current
          const isCurrent = idx === current
          const isPending = idx > current

          return (
            <li key={step.id} className="flex flex-1 items-center gap-2 last:flex-initial">
              <button
                type="button"
                onClick={() => onStepChange?.(idx)}
                disabled={!onStepChange}
                className={cn(
                  'group flex items-center gap-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg p-1.5',
                  isPending && 'cursor-default opacity-50',
                )}
                aria-current={isCurrent ? 'step' : undefined}
              >
                <span
                  className={cn(
                    'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                    isComplete && 'bg-teal text-white',
                    isCurrent && 'bg-brand-accent text-white',
                    isPending && 'border border-hairline bg-surface text-muted-ink',
                  )}
                >
                  {isComplete ? <Check className="size-3.5" /> : idx + 1}
                </span>

                <span className="hidden flex-col sm:flex">
                  <span className="label-eyebrow text-[0.625rem]">Step 0{idx + 1}</span>
                  <span
                    className={cn(
                      'text-xs font-medium',
                      isCurrent ? 'text-ink' : 'text-muted-ink',
                    )}
                  >
                    {step.label}
                  </span>
                </span>
              </button>

              {idx < steps.length - 1 && (
                <div
                  aria-hidden="true"
                  className={cn(
                    'h-px flex-1 transition-colors',
                    isComplete ? 'bg-teal/40' : 'bg-hairline',
                  )}
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
