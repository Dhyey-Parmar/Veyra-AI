import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { formatNumber } from '@/lib/format'
import type { ConfusionMatrix as Matrix } from '@/lib/reference-data'

type Cell = {
  key: string
  label: string
  value: number
  correct: boolean
}

export function ConfusionMatrix({ data }: { data: Matrix }) {
  const total =
    data.trueNegative + data.falsePositive + data.falseNegative + data.truePositive

  const cells: Cell[] = [
    { key: 'tn', label: 'True Negative', value: data.trueNegative, correct: true },
    { key: 'fp', label: 'False Positive', value: data.falsePositive, correct: false },
    { key: 'fn', label: 'False Negative', value: data.falseNegative, correct: false },
    { key: 'tp', label: 'True Positive', value: data.truePositive, correct: true },
  ]
  const max = Math.max(...cells.map((c) => c.value)) || 1

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-3">
        {/* y-axis label */}
        <div className="flex flex-col items-center justify-center">
          <span className="label-eyebrow rotate-180 [writing-mode:vertical-rl]">Actual</span>
        </div>

        <div className="flex-1">
          <div className="mb-2 grid grid-cols-2 gap-2 pl-0">
            <span className="text-center text-xs font-medium text-muted-ink">Pred. No Default</span>
            <span className="text-center text-xs font-medium text-muted-ink">Pred. Default</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {cells.map((cell, i) => {
              const intensity = cell.value / max
              const base = cell.correct ? '15, 118, 110' : '220, 74, 74'
              return (
                <motion.div
                  key={cell.key}
                  initial={{ opacity: 0, scale: 0.96 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                  className="flex flex-col items-center justify-center rounded-lg border border-hairline p-6"
                  style={{ backgroundColor: `rgba(${base}, ${0.06 + intensity * 0.22})` }}
                >
                  <span
                    className={cn(
                      'tabular text-2xl font-semibold',
                      cell.correct ? 'text-teal' : 'text-danger',
                    )}
                  >
                    {formatNumber(cell.value)}
                  </span>
                  <span className="mt-1 text-[0.6875rem] font-medium uppercase tracking-wide text-muted-ink">
                    {cell.label}
                  </span>
                  <span className="tabular mt-0.5 text-xs text-muted-ink">
                    {((cell.value / total) * 100).toFixed(1)}%
                  </span>
                </motion.div>
              )
            })}
          </div>
          <div className="mt-2 text-center">
            <span className="label-eyebrow">Predicted</span>
          </div>
        </div>
      </div>
    </div>
  )
}
