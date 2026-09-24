import React, { useEffect, useState } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { bandForProbability, type RiskBand } from '@/context/AssessmentContext'
import { cn } from '@/lib/utils'

const bandColor: Record<RiskBand, string> = {
  Low: 'var(--teal)',
  Moderate: 'var(--warning)',
  High: 'var(--danger)',
}

type RiskGaugeProps = {
  probability: number
  size?: number
  strokeWidth?: number
  className?: string
}

export function RiskGauge({
  probability,
  size = 260,
  strokeWidth = 16,
  className,
}: RiskGaugeProps) {
  const band = bandForProbability(probability)
  const color = bandColor[band]

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const sweep = 0.82
  const arcLength = circumference * sweep

  const progress = useMotionValue(0)
  const dashOffset = useTransform(progress, (p) => arcLength * (1 - p))
  const [displayPct, setDisplayPct] = useState(0)

  useEffect(() => {
    const controls = animate(progress, probability, {
      duration: 1.3,
      ease: [0.22, 1, 0.36, 1],
    })
    const unsub = progress.on('change', (v) => setDisplayPct(v * 100))
    return () => {
      controls.stop()
      unsub()
    }
  }, [probability, progress])

  const rotation = -90 - sweep * 180

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} style={{ transform: `rotate(${rotation}deg)` }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--hairline)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${arcLength} ${circumference}`}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${arcLength} ${circumference}`}
          style={{ strokeDashoffset: dashOffset }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="label-eyebrow">Default Probability</span>
        <span
          className="tabular mt-1 text-5xl font-semibold tracking-tight"
          style={{ color }}
        >
          {displayPct.toFixed(1)}
          <span className="text-2xl">%</span>
        </span>
        <span
          className="mt-2 rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide"
          style={{
            color,
            backgroundColor:
              band === 'Low'
                ? 'rgba(15, 118, 110, 0.12)'
                : band === 'Moderate'
                  ? 'rgba(216, 155, 43, 0.12)'
                  : 'rgba(220, 74, 74, 0.12)',
          }}
        >
          {band} Risk
        </span>
      </div>
    </div>
  )
}
