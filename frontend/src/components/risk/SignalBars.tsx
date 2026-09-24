import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export type SignalItem = {
  label: string
  weight: number
  value?: string
}

export function SignalBars({
  items,
  className,
}: {
  items: SignalItem[]
  className?: string
}) {
  return (
    <ul className={cn('flex flex-col gap-3.5', className)}>
      {items.map((item, i) => (
        <li key={item.label} className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between text-xs">
            <span className="font-medium text-ink">{item.label}</span>
            {item.value && <span className="tabular text-muted-ink">{item.value}</span>}
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-secondary">
            <motion.div
              className="h-full rounded-full bg-brand-accent"
              initial={{ width: 0 }}
              whileInView={{ width: `${Math.min(100, Math.max(4, item.weight * 100))}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}
