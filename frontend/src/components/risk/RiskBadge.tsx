import React from 'react'
import type { RiskBand } from '@/context/AssessmentContext'
import { cn } from '@/lib/utils'

const styles: Record<RiskBand, { text: string; bg: string; dot: string }> = {
  Low: { text: 'text-teal', bg: 'bg-teal/10', dot: 'bg-teal' },
  Moderate: { text: 'text-warning', bg: 'bg-warning/10', dot: 'bg-warning' },
  High: { text: 'text-danger', bg: 'bg-danger/10', dot: 'bg-danger' },
}

export function RiskBadge({
  band,
  size = 'md',
  className,
}: {
  band: RiskBand
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const s = styles[band]
  const sizeClasses = {
    sm: 'text-[0.6875rem] px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-2',
    lg: 'text-sm px-3 py-1.5 gap-2.5 font-medium',
  }[size]

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium tracking-wide uppercase',
        sizeClasses,
        s.bg,
        s.text,
        className,
      )}
    >
      <span className="size-1.5 rounded-full" style={{ backgroundColor: 'currentColor' }} />
      {band} Risk
    </span>
  )
}
