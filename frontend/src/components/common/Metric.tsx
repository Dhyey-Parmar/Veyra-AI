import React, { type ReactNode } from 'react'
import { CountUp } from './CountUp'
import { cn } from '@/lib/utils'

type Accent = 'none' | 'accent' | 'teal' | 'danger'

const accentStyles: Record<Accent, { text: string; bg: string }> = {
  none: { text: 'text-ink', bg: 'bg-surface' },
  accent: { text: 'text-brand-accent', bg: 'bg-surface' },
  teal: { text: 'text-teal', bg: 'bg-surface' },
  danger: { text: 'text-danger', bg: 'bg-surface' },
}

export function MetricCell({
  label,
  value,
  format,
  delta,
  accent = 'none',
  className,
}: {
  label: string
  value: number
  format?: (n: number) => string
  delta?: { value: string; positive: boolean }
  accent?: Accent
  className?: string
}) {
  const styles = accentStyles[accent]
  return (
    <div
      className={cn(
        'flex flex-col justify-between border-hairline bg-surface p-5 sm:p-6 transition-colors',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="label-eyebrow">{label}</span>
        {delta && (
          <span
            className={cn(
              'tabular text-xs font-medium',
              delta.positive ? 'text-teal' : 'text-danger',
            )}
          >
            {delta.value}
          </span>
        )}
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <span className={cn('tabular text-3xl font-semibold tracking-tight sm:text-4xl', styles.text)}>
          <CountUp value={value} format={format} />
        </span>
      </div>
    </div>
  )
}

export function MetricGrid({
  children,
  columns = 4,
  className,
}: {
  children: ReactNode
  columns?: 2 | 3 | 4 | 5 | 6
  className?: string
}) {
  const colClass = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-4',
    5: 'sm:grid-cols-3 lg:grid-cols-5',
    6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
  }[columns]

  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-hairline bg-hairline shadow-none',
        colClass,
        className,
      )}
    >
      {children}
    </div>
  )
}
