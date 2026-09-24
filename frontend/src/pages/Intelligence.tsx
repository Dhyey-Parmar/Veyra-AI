import React, { useEffect, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { PageShell, PageHeader, SectionHeading, Footnote } from '@/components/common/Layout'
import { MetricGrid, MetricCell } from '@/components/common/Metric'
import { ChartPanel } from '@/components/analytics/ChartPanel'
import { PerformanceTable } from '@/components/analytics/PerformanceTable'
import { ConfusionMatrix } from '@/components/analytics/ConfusionMatrix'
import { formatMetric } from '@/lib/format'
import { api, type MetricsResponse, type ModelDetailsResponse } from '@/services/api'
import {
  confusionMatrix as defaultConfusionMatrix,
  modelComparison as defaultModelComparison,
  performanceOverview as defaultPerformance,
  prCurve as defaultPrCurve,
  rocCurve as defaultRocCurve,
  type ModelRow,
} from '@/lib/reference-data'

const axisTick = { fontSize: 11, fill: 'var(--color-muted-ink)' }

export default function IntelligencePage() {
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null)
  const [modelDetails, setModelDetails] = useState<ModelDetailsResponse | null>(null)

  useEffect(() => {
    let mounted = true
    async function fetchIntelligence() {
      try {
        const [m, details] = await Promise.allSettled([api.getMetrics(), api.getModelDetails()])
        if (!mounted) return
        if (m.status === 'fulfilled') setMetrics(m.value)
        if (details.status === 'fulfilled') setModelDetails(details.value)
      } catch {
        // Fallback data remains active
      }
    }
    fetchIntelligence()
    return () => {
      mounted = false
    }
  }, [])

  const performance = {
    accuracy: metrics?.test_metrics?.accuracy ?? defaultPerformance.accuracy,
    precision: metrics?.test_metrics?.precision ?? defaultPerformance.precision,
    recall: metrics?.test_metrics?.recall ?? defaultPerformance.recall,
    f1: metrics?.test_metrics?.f1_score ?? defaultPerformance.f1,
    rocAuc: metrics?.test_metrics?.roc_auc ?? defaultPerformance.rocAuc,
    prAuc: metrics?.test_metrics?.pr_auc ?? defaultPerformance.prAuc,
  }

  const tableRows: ModelRow[] = (metrics?.model_comparison && metrics.model_comparison.length > 0
    ? metrics.model_comparison
    : defaultModelComparison
  ).map((r: any) => ({
    model: r.Model ?? r.model,
    accuracy: Number(r.Accuracy ?? r.accuracy),
    precision: Number(r.Precision ?? r.precision),
    recall: Number(r.Recall ?? r.recall),
    f1: Number(r.F1_Score ?? r.f1),
    rocAuc: Number(r.ROC_AUC ?? r.rocAuc),
    prAuc: Number(r.PR_AUC ?? r.prAuc),
    best: Boolean(r.best ?? (r.Model && r.Model.includes('HistGradientBoosting'))),
  }))

  const cmData = metrics?.confusion_matrix ?? defaultConfusionMatrix
  const rocData = metrics?.roc_curve && metrics.roc_curve.length > 0 ? metrics.roc_curve : defaultRocCurve
  const prData = metrics?.pr_curve && metrics.pr_curve.length > 0 ? metrics.pr_curve : defaultPrCurve

  return (
    <div className="pb-24">
      <PageShell>
        <PageHeader
          eyebrow="Model Intelligence"
          title="Model performance and evaluation"
          description="Rigorous out-of-sample evaluation on 51,070 test loans across 7 candidate architectures, featuring full ROC discrimination curves, Precision-Recall curves, and classification confusion matrix."
        />

        {/* Performance Overview */}
        <section className="py-10">
          <SectionHeading
            eyebrow="Performance Overview"
            title="Production model metrics"
            description={
              modelDetails?.architecture
                ? `Pipeline architecture: ${modelDetails.architecture}`
                : 'HistGradientBoosting with balanced class-weight calibration.'
            }
            className="mb-6"
          />
          <MetricGrid columns={6}>
            <MetricCell label="Accuracy" value={performance.accuracy} format={(n) => formatMetric(n)} />
            <MetricCell label="Precision" value={performance.precision} format={(n) => formatMetric(n)} />
            <MetricCell label="Recall" value={performance.recall} format={(n) => formatMetric(n)} />
            <MetricCell label="F1" value={performance.f1} format={(n) => formatMetric(n)} />
            <MetricCell label="ROC-AUC" value={performance.rocAuc} format={(n) => formatMetric(n)} accent="accent" />
            <MetricCell label="PR-AUC" value={performance.prAuc} format={(n) => formatMetric(n)} />
          </MetricGrid>
        </section>

        {/* Model Comparison */}
        <section className="py-4">
          <SectionHeading
            eyebrow="Model Comparison"
            title="Candidate models evaluated"
            description="Comparative benchmark across all linear, ensemble, and gradient-boosted models tested on the held-out evaluation dataset."
            className="mb-5"
          />
          <div className="rounded-xl border border-hairline bg-surface p-5 sm:p-6">
            <PerformanceTable rows={tableRows} />
          </div>
        </section>

        {/* Curves */}
        <section className="grid gap-5 py-10 lg:grid-cols-2">
          <ChartPanel
            title="ROC curve"
            eyebrow="Discrimination"
            description="True-positive rate against false-positive rate across decision thresholds."
            aside={<MetricTag label="ROC-AUC" value={formatMetric(performance.rocAuc)} />}
          >
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={rocData} margin={{ top: 8, right: 12, left: -12, bottom: 4 }}>
                <defs>
                  <linearGradient id="rocFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-brand-accent)" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="var(--color-brand-accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--color-hairline)" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="fpr"
                  type="number"
                  domain={[0, 1]}
                  ticks={[0, 0.25, 0.5, 0.75, 1]}
                  tick={axisTick}
                  tickLine={false}
                  axisLine={{ stroke: 'var(--color-hairline)' }}
                  label={{
                    value: 'False positive rate (1 - Specificity)',
                    position: 'insideBottom',
                    offset: -2,
                    fontSize: 11,
                    fill: 'var(--color-muted-ink)',
                  }}
                />
                <YAxis
                  domain={[0, 1]}
                  ticks={[0, 0.25, 0.5, 0.75, 1]}
                  tick={axisTick}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CurveTooltip xLabel="FPR" yLabel="TPR" xKey="fpr" yKey="tpr" />} />
                <ReferenceLine
                  segment={[
                    { x: 0, y: 0 },
                    { x: 1, y: 1 },
                  ]}
                  stroke="var(--color-muted-ink)"
                  strokeDasharray="4 4"
                  ifOverflow="extendDomain"
                />
                <Area
                  type="monotone"
                  dataKey="tpr"
                  stroke="var(--color-brand-accent)"
                  strokeWidth={2.5}
                  fill="url(#rocFill)"
                  animationDuration={1100}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartPanel>

          <ChartPanel
            title="Precision-Recall curve"
            eyebrow="Class balance"
            description="Precision against recall across thresholds on imbalanced default data."
            aside={<MetricTag label="PR-AUC" value={formatMetric(performance.prAuc)} />}
          >
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={prData} margin={{ top: 8, right: 12, left: -12, bottom: 4 }}>
                <CartesianGrid stroke="var(--color-hairline)" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="recall"
                  type="number"
                  domain={[0, 1]}
                  ticks={[0, 0.25, 0.5, 0.75, 1]}
                  tick={axisTick}
                  tickLine={false}
                  axisLine={{ stroke: 'var(--color-hairline)' }}
                  label={{
                    value: 'Recall (Sensitivity)',
                    position: 'insideBottom',
                    offset: -2,
                    fontSize: 11,
                    fill: 'var(--color-muted-ink)',
                  }}
                />
                <YAxis
                  domain={[0, 1]}
                  ticks={[0, 0.25, 0.5, 0.75, 1]}
                  tick={axisTick}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CurveTooltip xLabel="Recall" yLabel="Precision" xKey="recall" yKey="precision" />} />
                <Line
                  type="monotone"
                  dataKey="precision"
                  stroke="var(--color-teal)"
                  strokeWidth={2.5}
                  dot={false}
                  animationDuration={1100}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartPanel>
        </section>

        {/* Confusion Matrix */}
        <section className="py-4">
          <SectionHeading
            eyebrow="Confusion Matrix"
            title="Classification outcomes"
            description="Out-of-sample confusion matrix evaluated on the held-out 51,070 test loans at the default 0.50 threshold."
            className="mb-5"
          />
          <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
            <div className="rounded-xl border border-hairline bg-surface p-6 sm:p-8">
              <ConfusionMatrix data={cmData} />
            </div>
            <div className="flex flex-col justify-center gap-6 rounded-xl border border-hairline bg-surface p-6 sm:p-8">
              <DerivedStat
                label="Correctly classified"
                value={cmData.trueNegative + cmData.truePositive}
                tone="teal"
                total={total(cmData)}
              />
              <DerivedStat
                label="Misclassified"
                value={cmData.falsePositive + cmData.falseNegative}
                tone="danger"
                total={total(cmData)}
              />
              <div className="border-t border-hairline pt-4 text-xs text-muted-ink">
                <p>
                  High recall ({formatMetric(performance.recall)}) ensures the model successfully flags{' '}
                  <span className="font-semibold text-ink">{cmData.truePositive.toLocaleString()}</span> of{' '}
                  <span className="font-semibold text-ink">{(cmData.truePositive + cmData.falseNegative).toLocaleString()}</span> actual default events.
                </p>
              </div>
            </div>
          </div>
        </section>

        <Footnote className="mt-6">
          Model evaluation based on 80/20 stratified cross-validation and independent test partition. The HistGradientBoosting model incorporates ColumnTransformer preprocessing with median imputation, standard scaling, and one-hot encoding.
        </Footnote>
      </PageShell>
    </div>
  )
}

function total(m: typeof defaultConfusionMatrix) {
  return m.trueNegative + m.truePositive + m.falsePositive + m.falseNegative
}

function MetricTag({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-end">
      <span className="label-eyebrow">{label}</span>
      <span className="tabular text-lg font-semibold text-ink">{value}</span>
    </div>
  )
}

function DerivedStat({
  label,
  value,
  total,
  tone,
}: {
  label: string
  value: number
  total: number
  tone: 'teal' | 'danger'
}) {
  const pct = ((value / total) * 100).toFixed(1)
  return (
    <div>
      <p className="label-eyebrow mb-1">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className={`tabular text-3xl font-semibold ${tone === 'teal' ? 'text-teal' : 'text-danger'}`}>
          {pct}%
        </span>
        <span className="tabular text-sm text-muted-ink">{value.toLocaleString()} loans</span>
      </div>
    </div>
  )
}

function CurveTooltip({
  active,
  payload,
  xLabel,
  yLabel,
  xKey,
  yKey,
}: {
  active?: boolean
  payload?: Array<{ payload: Record<string, number> }>
  xLabel: string
  yLabel: string
  xKey: string
  yKey: string
}) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <div className="rounded-lg border border-hairline bg-surface px-3 py-2 text-xs shadow-sm">
      <p className="tabular text-muted-ink">
        {xLabel}: <span className="font-medium text-ink">{p[xKey]?.toFixed(3)}</span>
      </p>
      <p className="tabular text-muted-ink">
        {yLabel}: <span className="font-medium text-ink">{p[yKey]?.toFixed(3)}</span>
      </p>
    </div>
  )
}
