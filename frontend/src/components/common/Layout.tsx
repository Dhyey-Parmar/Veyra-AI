import React, { type ReactNode, type ElementType } from 'react'
import { cn } from '@/lib/utils'

export function PageShell({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('mx-auto w-full max-w-[1240px] px-5 sm:px-8', className)}>{children}</div>
  )
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-5 border-b border-hairline py-8 sm:flex-row sm:items-end sm:justify-between sm:py-10">
      <div className="max-w-2xl">
        {eyebrow && <p className="label-eyebrow mb-2">{eyebrow}</p>}
        <h1 className="text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mt-3 text-pretty text-[0.95rem] leading-relaxed text-muted-ink">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2.5">{actions}</div>}
    </div>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  aside,
  className,
}: {
  eyebrow?: string
  title: ReactNode
  description?: ReactNode
  aside?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="max-w-xl">
        {eyebrow && <p className="label-eyebrow mb-1.5">{eyebrow}</p>}
        <h2 className="text-xl font-semibold tracking-tight text-ink">{title}</h2>
        {description && <p className="mt-1.5 text-sm leading-relaxed text-muted-ink">{description}</p>}
      </div>
      {aside && <div className="shrink-0">{aside}</div>}
    </div>
  )
}

export function Panel({
  children,
  className,
  as: Tag = 'div',
}: {
  children: ReactNode
  className?: string
  as?: ElementType
}) {
  return (
    <Tag className={cn('rounded-xl border border-hairline bg-surface', className)}>
      {children}
    </Tag>
  )
}

export function Footnote({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn('text-xs leading-relaxed text-muted-ink', className)}>{children}</p>
  )
}
