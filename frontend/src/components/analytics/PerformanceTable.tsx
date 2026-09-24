import React from 'react'
import { cn } from '@/lib/utils'
import { formatMetric } from '@/lib/format'
import type { ModelRow } from '@/lib/reference-data'

type MetricColumnKey = 'accuracy' | 'precision' | 'recall' | 'f1' | 'rocAuc' | 'prAuc'

const COLUMNS: { key: MetricColumnKey; label: string }[] = [
  { key: 'accuracy', label: 'Accuracy' },
  { key: 'precision', label: 'Precision' },
  { key: 'recall', label: 'Recall' },
  { key: 'f1', label: 'F1' },
  { key: 'rocAuc', label: 'ROC-AUC' },
  { key: 'prAuc', label: 'PR-AUC' },
]

export function PerformanceTable({ rows }: { rows: ModelRow[] }) {
  const bestByCol: Record<MetricColumnKey, number> = {
    accuracy: 0,
    precision: 0,
    recall: 0,
    f1: 0,
    rocAuc: 0,
    prAuc: 0,
  }
  for (const col of COLUMNS) {
    bestByCol[col.key] = Math.max(...rows.map((r) => r[col.key] ?? 0))
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-hairline">
            <th className="label-eyebrow py-3 pr-4 text-left font-medium">Model</th>
            {COLUMNS.map((col) => (
              <th key={col.key} className="label-eyebrow px-4 py-3 text-right font-medium">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.model}
              className={cn(
                'border-b border-hairline last:border-b-0 transition-colors hover:bg-secondary/60',
                row.best && 'bg-brand-accent/[0.04]',
              )}
            >
              <td className="py-3.5 pr-4 text-left">
                <span className="flex items-center gap-2 font-medium text-ink">
                  {row.model}
                  {row.best && (
                    <span className="rounded-full bg-brand-accent/10 px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wide text-brand-accent">
                      Selected
                    </span>
                  )}
                </span>
              </td>
              {COLUMNS.map((col) => {
                const val = row[col.key] ?? 0
                const isBest = Math.abs(val - bestByCol[col.key]) < 0.0001
                return (
                  <td
                    key={col.key}
                    className={cn(
                      'tabular px-4 py-3.5 text-right text-ink',
                      isBest ? 'font-semibold text-brand-accent' : 'text-muted-ink',
                    )}
                  >
                    {formatMetric(val)}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
