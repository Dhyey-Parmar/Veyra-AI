import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom'
import { AssessmentProvider } from '@/context/AssessmentContext'
import { SiteNav } from '@/components/navigation/SiteNav'
import { BrandLockup } from '@/components/navigation/BrandLogo'
import Overview from '@/pages/Overview'
import AssessPage from '@/pages/Assess'
import RiskAnalysisPage from '@/pages/RiskAnalysis'
import IntelligencePage from '@/pages/Intelligence'
import InsightsPage from '@/pages/Insights'

const ROUTE_TITLES: Record<string, string> = {
  '/': 'Veyra | Overview',
  '/overview': 'Veyra | Overview',
  '/assess': 'Veyra | Assess Applicant',
  '/risk-analysis': 'Veyra | Risk Analysis',
  '/intelligence': 'Veyra | Model Intelligence',
  '/insights': 'Veyra | Risk Insights',
}

function PageTitleManager() {
  const { pathname } = useLocation()
  useEffect(() => {
    document.title = ROUTE_TITLES[pathname] || 'Veyra | Intelligent Credit Risk Analytics'
  }, [pathname])
  return null
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function SiteFooter() {
  return (
    <footer className="border-t border-hairline bg-surface py-12 text-sm text-muted-ink">
      <div className="mx-auto flex max-w-[1240px] flex-col items-start justify-between gap-6 px-5 sm:flex-row sm:items-center sm:px-8">
        <div className="flex flex-col gap-1.5">
          <BrandLockup showDescriptor={true} />
          <p className="mt-1 text-xs text-muted-ink">
            See the risk before it becomes a default.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-6 text-xs font-medium">
          <Link to="/overview" className="hover:text-ink">Overview</Link>
          <Link to="/assess" className="hover:text-ink">Assess</Link>
          <Link to="/risk-analysis" className="hover:text-ink">Risk Analysis</Link>
          <Link to="/intelligence" className="hover:text-ink">Model Intelligence</Link>
          <Link to="/insights" className="hover:text-ink">Insights</Link>
        </div>
      </div>
      <div className="mx-auto mt-8 flex max-w-[1240px] flex-col items-start justify-between gap-2 border-t border-hairline/60 px-5 pt-6 text-[11px] text-muted-ink sm:flex-row sm:px-8">
        <p>© {new Date().getFullYear()} Veyra Systems Inc. Production Underwriting Pipeline.</p>
        <p className="tabular">HistGradientBoosting (Balanced) · 255k Evaluated Loans · v1.0.0</p>
      </div>
    </footer>
  )
}

export function App() {
  return (
    <AssessmentProvider>
      <BrowserRouter>
        <ScrollToTop />
        <PageTitleManager />
        <div className="flex min-h-screen flex-col bg-background text-foreground">
          <SiteNav />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Overview />} />
              <Route path="/overview" element={<Overview />} />
              <Route path="/assess" element={<AssessPage />} />
              <Route path="/risk-analysis" element={<RiskAnalysisPage />} />
              <Route path="/intelligence" element={<IntelligencePage />} />
              <Route path="/insights" element={<InsightsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <SiteFooter />
        </div>
      </BrowserRouter>
    </AssessmentProvider>
  )
}

export default App
