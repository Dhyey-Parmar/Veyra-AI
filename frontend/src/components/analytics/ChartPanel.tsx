import React, { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function ChartPanel({
  eyebrow,
  title,
  description,
  aside,
  children,
  className,
}: {
  eyebrow?: string
  title: string
  description?: string
  aside?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col rounded-xl border border-hairline bg-surface p-5 sm:p-6',
        className,
      )}
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          {eyebrow && <p className="label-eyebrow mb-1">{eyebrow}</p>}
          <h3 className="text-base font-semibold text-ink">{title}</h3>
          {description && (
            <p className="mt-1 text-xs leading-relaxed text-muted-ink">{description}</p>
          )}
        </div>
        {aside && <div className="shrink-0">{aside}</div>}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  )
}
