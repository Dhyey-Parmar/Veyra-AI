import React from 'react'
import { motion } from 'framer-motion'
import {
  Area,
  AreaChart,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts'

// Calibrated probability-density distribution across the portfolio risk spectrum
const data = [
  { x: 0.0, density: 0.12 },
  { x: 0.05, density: 0.42 },
  { x: 0.1, density: 0.88 },
  { x: 0.15, density: 1.05 },
  { x: 0.2, density: 0.94 },
  { x: 0.25, density: 0.76 },
  { x: 0.3, density: 0.58 },
  { x: 0.35, density: 0.46 },
  { x: 0.4, density: 0.41 },
  { x: 0.45, density: 0.39 },
  { x: 0.5, density: 0.38 },
  { x: 0.55, density: 0.42 },
  { x: 0.6, density: 0.51 },
  { x: 0.65, density: 0.64 },
  { x: 0.7, density: 0.72 },
  { x: 0.75, density: 0.68 },
  { x: 0.8, density: 0.52 },
  { x: 0.85, density: 0.35 },
  { x: 0.9, density: 0.18 },
  { x: 0.95, density: 0.08 },
  { x: 1.0, density: 0.02 },
]

export function OverviewHeroChart() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
      className="relative overflow-hidden rounded-xl border border-hairline bg-surface"
    >
      <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
        <div>
          <p className="label-eyebrow mb-1">Portfolio Distribution</p>
          <p className="text-sm font-semibold text-ink">Default probability density spectrum</p>
        </div>
        <span className="rounded-full bg-secondary px-2.5 py-1 text-[0.625rem] font-semibold uppercase tracking-wide text-brand-accent">
          Calibrated
        </span>
      </div>

      <div className="px-2 pt-4">
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="heroFill" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--teal)" stopOpacity={0.85} />
                <stop offset="45%" stopColor="var(--warning)" stopOpacity={0.75} />
                <stop offset="100%" stopColor="var(--danger)" stopOpacity={0.85} />
              </linearGradient>
              <linearGradient id="heroArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--brand-accent)" stopOpacity={0.12} />
                <stop offset="100%" stopColor="var(--brand-accent)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="x"
              type="number"
              domain={[0, 1]}
              ticks={[0, 0.3, 0.6, 1]}
              tickFormatter={(v) => `${Math.round(v * 100)}%`}
              tick={{ fontSize: 11, fill: 'var(--muted-ink)' }}
              axisLine={{ stroke: 'var(--hairline)' }}
              tickLine={false}
            />
            <YAxis hide domain={[0, 1.2]} />
            <ReferenceLine x={0.3} stroke="var(--hairline)" strokeDasharray="3 3" />
            <ReferenceLine x={0.6} stroke="var(--hairline)" strokeDasharray="3 3" />
            <Area
              type="monotone"
              dataKey="density"
              stroke="url(#heroFill)"
              strokeWidth={2.5}
              fill="url(#heroArea)"
              isAnimationActive
              animationDuration={1200}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-px border-t border-hairline bg-hairline">
        {[
          { label: 'Low', range: '0–30%', color: 'var(--teal)' },
          { label: 'Moderate', range: '30–60%', color: 'var(--warning)' },
          { label: 'High', range: '60–100%', color: 'var(--danger)' },
        ].map((z) => (
          <div key={z.label} className="bg-surface px-4 py-3">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ backgroundColor: z.color }} />
              <span className="text-xs font-medium text-ink">{z.label}</span>
            </span>
            <span className="tabular mt-1 block text-xs text-muted-ink">{z.range}</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
