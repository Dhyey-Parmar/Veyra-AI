import React from 'react'
import { cn } from '@/lib/utils'

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn('size-7 shrink-0', className)}
      role="img"
      aria-label="VEYRA logo"
    >
      <rect x="1.5" y="1.5" width="29" height="29" rx="7" fill="var(--brand)" />
      <path
        d="M8.5 9.5L16 23.5L23.5 9.5"
        fill="none"
        stroke="white"
        strokeWidth="2.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="14" r="1.75" fill="var(--brand-accent)" />
    </svg>
  )
}

export function BrandLockup({
  className,
  showDescriptor = false,
}: {
  className?: string
  showDescriptor?: boolean
}) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <BrandMark />
      <span className="flex flex-col leading-none">
        <span className="text-[1.125rem] font-bold tracking-[0.12em] text-ink uppercase">
          VEYRA
        </span>
        {showDescriptor && (
          <span className="mt-0.5 text-[0.625rem] font-medium uppercase tracking-[0.14em] text-muted-ink">
            Intelligent Credit Risk Analytics
          </span>
        )}
      </span>
    </span>
  )
}
