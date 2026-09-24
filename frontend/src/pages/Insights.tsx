import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Info } from 'lucide-react'

import { PageShell, PageHeader, SectionHeading, Footnote } from '@/components/common/Layout'
import { MetricGrid, MetricCell } from '@/components/common/Metric'
import { ChartPanel } from '@/components/analytics/ChartPanel'
import { SignalBars } from '@/components/risk/SignalBars'
import { formatCompact, formatCurrency, formatNumber, formatPercent } from '@/lib/format'
import { api, type InsightsResponse, type MetricsResponse } from '@/services/api'
import {
  datasetSnapshot as defaultDataset,
  defaultDistribution as defaultDist,
  defaultRateByScore as defaultScoreBuckets,
  featureImportance as defaultFeatImp,
} from '@/lib/reference-data'

const axisTick = { fontSize: 11, fill: 'var(--color-muted-ink)' }

export default function InsightsPage() {
  const [insights, setInsights] = useState<InsightsResponse | null>(null)
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null)

  useEffect(() => {
    let mounted = true
    async function fetchInsights() {
      try {
        const [ins, m] = await Promise.allSettled([api.getInsights(), api.getMetrics()])
        if (!mounted) return
        if (ins.status === 'fulfilled') setInsights(ins.value)
        if (m.status === 'fulfilled') setMetrics(m.value)
      } catch {
        // Fallback data remains active
      }
    }
    fetchInsights()
    return () => {
      mounted = false
    }
  }, [])

  type DistItem = { label: string; value: number; share: number }
  type BucketItem = { bucket: string; count: number; rate: number }

  const classDist: DistItem[] = insights?.class_distribution
    ? [
        {
          label: 'No Default',
          value: insights.class_distribution.non_default_count,
          share: insights.class_distribution.non_default_percentage / 100,
        },
        {
          label: 'Default',
          value: insights.class_distribution.default_count,
          share: insights.class_distribution.default_percentage / 100,
        },
      ]
    : defaultDist

  const total = classDist.reduce((s, d) => s + d.value, 0)

  const scoreBuckets: BucketItem[] =
    insights?.default_rate_by_score && insights.default_rate_by_score.length > 0
      ? insights.default_rate_by_score
      : defaultScoreBuckets

  const featImp =
    metrics?.feature_importance && metrics.feature_importance.length > 0
      ? metrics.feature_importance
          .filter((f) => f.Importance > 0.0005)
          .slice(0, 10)
          .map((f) => ({
            feature: f.Feature.replace('_', ' '),
            importance: f.Importance,
          }))
      : defaultFeatImp

  const maxImp = featImp[0]?.importance || 1

  const avgIncome = insights?.key_feature_ranges?.Income?.mean ?? defaultDataset.averageIncome
  const avgLoan = insights?.key_feature_ranges?.LoanAmount?.mean ?? defaultDataset.averageLoanAmount
  const avgCredit = insights?.key_feature_ranges?.CreditScore?.mean ?? defaultDataset.averageCreditScore

  return (
    <div className="pb-24">
      <PageShell>
        <PageHeader
          eyebrow="Insights"
          title="Dataset and feature research"
          description="In-depth empirical analysis across 255,347 loan applications, exploring default outcome imbalance, bureau credit score elasticity, and permutation feature importance."
        />

        {/* Default Distribution */}
        <section className="py-10">
          <SectionHeading
            eyebrow="Default Distribution"
            title="Portfolio outcome balance"
            description="The portfolio exhibits an 7.61 : 1 class imbalance ratio toward non-default loans. Balanced class-weighting was applied in HistGradientBoosting to ensure strong default recall."
            className="mb-6"
          />
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="flex flex-col justify-center gap-6 rounded-xl border border-hairline bg-surface p-6 sm:p-8">
              {classDist.map((d, i) => {
                const color = i === 0 ? 'var(--color-teal)' : 'var(--color-danger)'
                return (
                  <div key={d.label}>
                    <div className="mb-2 flex items-baseline justify-between">
                      <span className="flex items-center gap-2 text-sm font-medium text-ink">
                        <span className="size-2.5 rounded-full" style={{ backgroundColor: color }} />
                        {d.label}
                      </span>
                      <span className="tabular text-sm text-muted-ink">
                        {formatNumber(d.value)} · {formatPercent(d.share)}
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-secondary">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: color }}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${d.share * 100}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </div>
                  </div>
                )
              })}
              <div className="flex items-center justify-between border-t border-hairline pt-4 text-xs text-muted-ink">
                <span>Total Applications: <strong className="text-ink">{formatNumber(total)}</strong></span>
                <span>Imbalance Ratio: <strong className="text-ink">7.61 : 1</strong></span>
              </div>
            </div>

            <ChartPanel
              title="Default rate by credit score"
              eyebrow="Segment analysis"
              description="Empirical default frequency across bureau credit score tiers in the portfolio."
              className="lg:h-full"
            >
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={scoreBuckets} margin={{ top: 4, right: 8, left: -14, bottom: 0 }}>
                  <CartesianGrid stroke="var(--color-hairline)" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="bucket"
                    tick={{ fontSize: 10, fill: 'var(--color-muted-ink)' }}
                    tickLine={false}
                    axisLine={{ stroke: 'var(--color-hairline)' }}
                  />
                  <YAxis
                    tickFormatter={(v: number | string) => `${Math.round(Number(v) * 100)}%`}
                    tick={axisTick}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<RateTooltip />} cursor={{ fill: 'var(--color-secondary)' }} />
                  <Bar dataKey="rate" radius={[4, 4, 0, 0]} maxBarSize={40} animationDuration={900}>
                    {scoreBuckets.map((entry: BucketItem, i: number) => (
                      <Cell
                        key={i}
                        fill={
                          entry.rate >= 0.12
                            ? 'var(--color-danger)'
                            : entry.rate >= 0.11
                              ? 'var(--color-warning)'
                              : 'var(--color-teal)'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartPanel>
          </div>
        </section>

        {/* Feature Importance */}
        <section className="py-4">
          <SectionHeading
            eyebrow="Feature Importance"
            title="Top predictive features"
            description="Features ranked by mean permutation decrease in ROC-AUC when shuffled on the evaluation dataset."
            className="mb-6"
          />
          <div className="rounded-xl border border-hairline bg-surface p-6 sm:p-8">
            <SignalBars
              items={featImp.map((f) => ({
                label: f.feature,
                weight: f.importance / maxImp,
                value: f.importance.toFixed(4),
              }))}
            />
          </div>
        </section>

        {/* Underwriting Observations */}
        {insights?.underwriting_observations && insights.underwriting_observations.length > 0 && (
          <section className="py-6">
            <SectionHeading
              eyebrow="Underwriting Diagnostics"
              title="Key empirical observations"
              description="Empirical patterns and underwriting dynamics derived from model training and validation."
              className="mb-6"
            />
            <div className="grid gap-4 sm:grid-cols-3">
              {insights.underwriting_observations.map((obs, i) => (
                <div key={i} className="flex flex-col gap-2 rounded-xl border border-hairline bg-surface p-5 sm:p-6">
                  <div className="flex items-center gap-2 text-xs font-semibold text-brand-accent">
                    <Info className="size-4" />
                    <span>Observation 0{i + 1}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-ink">{obs}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Dataset Overview */}
        <section className="py-10">
          <SectionHeading eyebrow="Dataset Overview" title="Population summary" className="mb-6" />
          <MetricGrid columns={6}>
            <MetricCell label="Applications" value={insights?.total_records ?? defaultDataset.applications} format={(n) => formatCompact(n)} />
            <MetricCell label="Features" value={insights?.features_count ?? defaultDataset.features} />
            <MetricCell
              label="Default %"
              value={insights?.class_distribution ? insights.class_distribution.default_percentage / 100 : defaultDataset.defaultRate}
              format={(n) => formatPercent(n)}
              accent="danger"
            />
            <MetricCell label="Avg Income" value={avgIncome} format={(n) => formatCurrency(n)} />
            <MetricCell label="Avg Loan" value={avgLoan} format={(n) => formatCurrency(n)} />
            <MetricCell label="Avg Credit Score" value={avgCredit} format={(n) => formatNumber(Math.round(n))} />
          </MetricGrid>
        </section>

        <Footnote className="mt-2">
          Dataset research based on the full 255,347 loan default benchmark portfolio with 18 raw features, 9 numerical variables, and 7 categorical dimensions.
        </Footnote>
      </PageShell>
    </div>
  )
}

function RateTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value: number; payload?: { count?: number } }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  const count = payload[0].payload?.count
  return (
    <div className="rounded-lg border border-hairline bg-surface px-3 py-2 text-xs shadow-sm">
      <p className="font-medium text-ink">Credit Score: {label}</p>
      <p className="tabular text-muted-ink">
        Default rate: <span className="font-medium text-ink">{(payload[0].value * 100).toFixed(2)}%</span>
      </p>
      {count != null && (
        <p className="tabular text-muted-ink">
          Volume: <span className="font-medium text-ink">{count.toLocaleString()} loans</span>
        </p>
      )}
    </div>
  )
}
