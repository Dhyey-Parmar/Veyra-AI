import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, LineChart, ShieldCheck, Database, Layers } from 'lucide-react'
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts'

import { buttonVariants } from '@/components/common/Button'
import { PageShell, SectionHeading } from '@/components/common/Layout'
import { MetricGrid, MetricCell } from '@/components/common/Metric'
import { ChartPanel } from '@/components/analytics/ChartPanel'
import { OverviewHeroChart } from '@/components/analytics/OverviewHeroChart'
import { CountUp } from '@/components/common/CountUp'
import { formatCompact, formatMetric, formatPercent } from '@/lib/format'
import { api, type MetricsResponse, type InsightsResponse } from '@/services/api'
import {
  datasetSnapshot as defaultDataset,
  defaultDistribution as defaultDist,
  modelSnapshot as defaultModel,
  performanceOverview as defaultPerf,
  riskDistribution as defaultRisk,
} from '@/lib/reference-data'

type DonutItem = {
  label: string
  value: number
  share: number
}

type RiskBandItem = {
  band: string
  range: string
  count: number
  share: number
  fill: string
}

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
}

export default function Overview() {
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null)
  const [insights, setInsights] = useState<InsightsResponse | null>(null)

  useEffect(() => {
    let mounted = true
    async function loadLiveData() {
      try {
        const [m, ins] = await Promise.allSettled([api.getMetrics(), api.getInsights()])
        if (!mounted) return
        if (m.status === 'fulfilled') setMetrics(m.value)
        if (ins.status === 'fulfilled') setInsights(ins.value)
      } catch {
        // Fallback data remains active
      }
    }
    loadLiveData()
    return () => {
      mounted = false
    }
  }, [])

  const rocAuc = metrics?.test_metrics?.roc_auc ?? defaultModel.rocAuc
  const f1 = metrics?.test_metrics?.f1_score ?? defaultModel.f1
  const recall = metrics?.test_metrics?.recall ?? defaultModel.recall
  const prAuc = metrics?.test_metrics?.pr_auc ?? defaultModel.prAuc
  const accuracy = metrics?.test_metrics?.accuracy ?? defaultPerf.accuracy
  const precision = metrics?.test_metrics?.precision ?? defaultPerf.precision

  const totalApps = insights?.total_records ?? defaultDataset.applications
  const totalFeatures = insights?.features_count ?? defaultDataset.features
  const defaultPct =
    insights?.class_distribution?.default_percentage != null
      ? insights.class_distribution.default_percentage / 100
      : defaultDataset.defaultRate
  const nonDefaultPct =
    insights?.class_distribution?.non_default_percentage != null
      ? insights.class_distribution.non_default_percentage / 100
      : defaultDataset.nonDefaultRate

  const defaultDonutData: DonutItem[] = insights?.class_distribution
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

  const riskBandsData: RiskBandItem[] = insights?.risk_distribution ?? defaultRisk

  return (
    <div className="pb-24">
      {/* Hero */}
      <section className="border-b border-hairline">
        <PageShell className="grid items-center gap-12 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          <motion.div {...fadeUp} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
            <span className="label-eyebrow inline-flex items-center gap-2 rounded-full border border-hairline bg-surface px-3 py-1">
              <ShieldCheck className="size-3.5 text-teal" />
              VEYRA · Intelligent Credit Risk Analytics
            </span>
            <h1 className="mt-5 text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-[3.4rem]">
              See the risk before it becomes a default.
            </h1>
            <p className="mt-5 max-w-xl text-pretty text-lg leading-relaxed text-muted-ink">
              Veyra is an intelligent credit risk analytics platform for machine-learning powered loan default assessment. Calibrated on 255,000+ loan portfolio records to evaluate borrower cash-flow capacity and repayment risk.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/assess" className={buttonVariants({ variant: 'default', size: 'lg' })}>
                Assess Applicant
                <ArrowRight className="size-4" data-icon="inline-end" />
              </Link>
              <Link to="/intelligence" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
                <LineChart className="size-4" data-icon="inline-start" />
                Explore Intelligence
              </Link>
            </div>
            <div className="mt-6 flex items-center gap-4 text-xs text-muted-ink">
              <span className="flex items-center gap-1.5">
                <Layers className="size-3.5 text-brand-accent" />
                Production HistGradientBoosting
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Database className="size-3.5 text-teal" />
                255k Evaluated Loans
              </span>
            </div>
          </motion.div>

          <OverviewHeroChart />
        </PageShell>
      </section>

      {/* Model Snapshot */}
      <PageShell className="py-14">
        <SectionHeading
          eyebrow="Model Snapshot"
          title="Headline performance at a glance"
          description="Out-of-sample evaluation metrics for the production HistGradientBoosting pipeline on 51,070 held-out test loans."
          aside={
            <Link
              to="/intelligence"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-accent hover:underline"
            >
              Full model intelligence
              <ArrowRight className="size-3.5" />
            </Link>
          }
          className="mb-6"
        />
        <MetricGrid columns={4}>
          <MetricCell label="ROC-AUC" value={rocAuc} format={(n) => formatMetric(n)} accent="accent" />
          <MetricCell label="F1 Score" value={f1} format={(n) => formatMetric(n)} />
          <MetricCell label="Recall" value={recall} format={(n) => formatMetric(n)} />
          <MetricCell label="PR-AUC" value={prAuc} format={(n) => formatMetric(n)} />
        </MetricGrid>
      </PageShell>

      {/* Risk Landscape */}
      <PageShell className="py-4">
        <SectionHeading
          eyebrow="Risk Landscape"
          title="How risk is distributed"
          description="Analytical distribution of portfolio default outcomes, risk band segments, and key performance dimensions."
          className="mb-6"
        />
        <div className="grid gap-5 lg:grid-cols-3">
          <ChartPanel
            title="Default distribution"
            eyebrow="Outcome split"
            description="Proportion of non-default vs default borrowers across the portfolio."
          >
            <DefaultDonut data={defaultDonutData} />
          </ChartPanel>

          <ChartPanel
            title="Risk distribution"
            eyebrow="Portfolio bands"
            description="Evaluated loans categorized by calibrated probability bands."
          >
            <RiskBands data={riskBandsData} />
          </ChartPanel>

          <ChartPanel
            title="Model performance"
            eyebrow="Evaluation"
            description="Classification metrics on the held-out evaluation dataset."
          >
            <PerformanceBars accuracy={accuracy} precision={precision} recall={recall} rocAuc={rocAuc} />
          </ChartPanel>
        </div>
      </PageShell>

      {/* Dataset Snapshot */}
      <PageShell className="py-14">
        <SectionHeading
          eyebrow="Dataset Snapshot"
          title="Training portfolio at a glance"
          description="Comprehensive credit portfolio summary used to train and validate all candidate underwriting models."
          className="mb-6"
        />
        <MetricGrid columns={4}>
          <MetricCell label="Applications" value={totalApps} format={(n) => formatCompact(n)} />
          <MetricCell label="Features" value={totalFeatures} />
          <MetricCell label="Default Rate" value={defaultPct} format={(n) => formatPercent(n)} accent="danger" />
          <MetricCell label="Non-default Rate" value={nonDefaultPct} format={(n) => formatPercent(n)} accent="teal" />
        </MetricGrid>
      </PageShell>
    </div>
  )
}

function DefaultDonut({ data }: { data: DonutItem[] }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  const colors = ['var(--teal)', 'var(--danger)']
  return (
    <div className="flex items-center gap-6">
      <div className="relative h-[150px] w-[150px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius={52}
              outerRadius={72}
              startAngle={90}
              endAngle={-270}
              stroke="none"
              paddingAngle={2}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="tabular text-xl font-semibold text-ink">
            <CountUp value={total / 1000} format={(n) => `${Math.round(n)}K`} />
          </span>
          <span className="label-eyebrow">Records</span>
        </div>
      </div>
      <ul className="flex flex-1 flex-col gap-3">
        {data.map((d, i) => (
          <li key={d.label} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-sm text-ink">
              <span className="size-2.5 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
              {d.label}
            </span>
            <span className="tabular text-sm font-medium text-muted-ink">{formatPercent(d.share)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function RiskBands({ data }: { data: RiskBandItem[] }) {
  return (
    <ResponsiveContainer width="100%" height={190}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
        <XAxis
          dataKey="band"
          tick={{ fontSize: 11, fill: 'var(--muted-ink)' }}
          axisLine={{ stroke: 'var(--hairline)' }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v: number | string) => formatCompact(Number(v))}
          tick={{ fontSize: 11, fill: 'var(--muted-ink)' }}
          axisLine={false}
          tickLine={false}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={54} animationDuration={900}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

function PerformanceBars({
  accuracy,
  precision,
  recall,
  rocAuc,
}: {
  accuracy: number
  precision: number
  recall: number
  rocAuc: number
}) {
  const data = [
    { metric: 'Accuracy', value: accuracy },
    { metric: 'Precision', value: precision },
    { metric: 'Recall', value: recall },
    { metric: 'ROC-AUC', value: rocAuc },
  ]
  return (
    <ResponsiveContainer width="100%" height={190}>
      <BarChart layout="vertical" data={data} margin={{ top: 0, right: 12, left: 4, bottom: 0 }}>
        <XAxis type="number" domain={[0, 1]} hide />
        <YAxis
          type="category"
          dataKey="metric"
          width={68}
          tick={{ fontSize: 11, fill: 'var(--muted-ink)' }}
          axisLine={false}
          tickLine={false}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} fill="var(--brand)" maxBarSize={18} animationDuration={900} />
      </BarChart>
    </ResponsiveContainer>
  )
}
