import React from 'react'
import type { ApplicantData } from '@/context/AssessmentContext'
import { formatCurrency, formatPercent } from '@/lib/format'
import { cn } from '@/lib/utils'

type Row = { label: string; value: string }
type Group = { title: string; rows: Row[] }

export function buildApplicantGroups(a: ApplicantData): Group[] {
  return [
    {
      title: 'Applicant',
      rows: [
        { label: 'Age', value: String(a.age) },
        { label: 'Education', value: a.education },
        { label: 'Employment Type', value: a.employmentType },
        { label: 'Marital Status', value: a.maritalStatus },
      ],
    },
    {
      title: 'Financial',
      rows: [
        { label: 'Annual Income', value: formatCurrency(a.income) },
        { label: 'Loan Amount', value: formatCurrency(a.loanAmount) },
        { label: 'Interest Rate', value: `${a.interestRate.toFixed(1)}%` },
        { label: 'DTI Ratio', value: formatPercent(a.dtiRatio, 2) },
      ],
    },
    {
      title: 'Credit',
      rows: [
        { label: 'Credit Score', value: String(a.creditScore) },
        { label: 'Months Employed', value: String(a.monthsEmployed) },
        { label: 'Credit Lines', value: String(a.creditLines) },
      ],
    },
    {
      title: 'Loan',
      rows: [
        { label: 'Loan Term', value: `${a.loanTerm} mo` },
        { label: 'Loan Purpose', value: a.loanPurpose },
        { label: 'Mortgage', value: a.mortgage ? 'Yes' : 'No' },
        { label: 'Dependents', value: String(a.dependents) },
        { label: 'Co-Signer', value: a.coSigner ? 'Yes' : 'No' },
      ],
    },
  ]
}

export function ApplicantSummary({
  applicant,
  columns = 2,
  className,
}: {
  applicant: ApplicantData
  columns?: 1 | 2 | 4
  className?: string
}) {
  const groups = buildApplicantGroups(applicant)
  const grid =
    columns === 4
      ? 'sm:grid-cols-2 lg:grid-cols-4'
      : columns === 2
        ? 'sm:grid-cols-2'
        : ''

  return (
    <div className={cn('grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-hairline bg-hairline', grid, className)}>
      {groups.map((group) => (
        <div key={group.title} className="bg-surface p-5 sm:p-6">
          <p className="label-eyebrow mb-3">{group.title}</p>
          <dl className="flex flex-col gap-2.5">
            {group.rows.map((row) => (
              <div key={row.label} className="flex items-baseline justify-between gap-4">
                <dt className="text-sm text-muted-ink">{row.label}</dt>
                <dd className="tabular text-sm font-medium text-ink">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  )
}
