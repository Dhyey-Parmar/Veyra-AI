import React, { useId, type ReactNode } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export function FormField({
  label,
  hint,
  error,
  htmlFor,
  children,
  className,
}: {
  label: string
  hint?: string
  error?: string
  htmlFor?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {error ? (
        <span className="text-xs text-danger">{error}</span>
      ) : hint ? (
        <span className="text-xs text-muted-ink">{hint}</span>
      ) : null}
    </div>
  )
}

const controlBase =
  'h-11 w-full rounded-lg border border-input bg-surface px-3.5 text-sm text-ink transition-colors placeholder:text-muted-ink/70 focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/20 aria-[invalid=true]:border-danger'

export function NumberField({
  id,
  value,
  onChange,
  min,
  max,
  step,
  prefix,
  suffix,
  invalid,
  placeholder,
}: {
  id?: string
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
  prefix?: string
  suffix?: string
  invalid?: boolean
  placeholder?: string
}) {
  return (
    <div className="relative flex items-center">
      {prefix && (
        <span className="pointer-events-none absolute left-3.5 text-sm text-muted-ink">{prefix}</span>
      )}
      <input
        id={id}
        type="number"
        inputMode="decimal"
        value={Number.isNaN(value) ? '' : value}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        aria-invalid={invalid || undefined}
        onChange={(e) => onChange(e.target.value === '' ? NaN : Number(e.target.value))}
        className={cn(controlBase, 'tabular', prefix && 'pl-7', suffix && 'pr-10')}
      />
      {suffix && (
        <span className="pointer-events-none absolute right-3.5 text-sm text-muted-ink">{suffix}</span>
      )}
    </div>
  )
}

export function SelectField({
  id,
  value,
  onChange,
  options,
  invalid,
}: {
  id?: string
  value: string
  onChange: (v: string) => void
  options: string[]
  invalid?: boolean
}) {
  return (
    <div className="relative flex items-center">
      <select
        id={id}
        value={value}
        aria-invalid={invalid || undefined}
        onChange={(e) => onChange(e.target.value)}
        className={cn(controlBase, 'appearance-none pr-10')}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3.5 size-4 text-muted-ink" />
    </div>
  )
}

export function SegmentedControl({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: string
  options: { label: string; value: string }[]
  onChange: (v: string) => void
  ariaLabel?: string
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="inline-flex w-full rounded-lg border border-input bg-secondary/50 p-1"
    >
      {options.map((opt) => {
        const checked = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={checked}
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex-1 rounded-md py-1.5 text-xs font-medium transition-all text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              checked
                ? 'bg-surface text-ink shadow-sm'
                : 'text-muted-ink hover:text-ink',
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

export function ToggleField({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description?: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  const id = useId()
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-hairline bg-surface p-3.5">
      <div className="flex flex-col">
        <label htmlFor={id} className="cursor-pointer text-sm font-medium text-ink">
          {label}
        </label>
        {description && <span className="text-xs text-muted-ink">{description}</span>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          checked ? 'bg-teal' : 'bg-input',
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out',
            checked ? 'translate-x-5' : 'translate-x-0',
          )}
        />
      </button>
    </div>
  )
}
