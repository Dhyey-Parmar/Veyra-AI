import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BrandLockup } from './BrandLogo'
import { buttonVariants } from '@/components/common/Button'

const NAV = [
  { label: 'Overview', href: '/overview' },
  { label: 'Assess', href: '/assess' },
  { label: 'Risk Analysis', href: '/risk-analysis' },
  { label: 'Intelligence', href: '/intelligence' },
  { label: 'Insights', href: '/insights' },
]

function isActive(pathname: string, href: string) {
  if (href === '/overview') return pathname === '/' || pathname === '/overview'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function SiteNav() {
  const location = useLocation()
  const pathname = location.pathname
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-hairline bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between gap-6 px-5 sm:px-8">
        <Link to="/" className="shrink-0" aria-label="Veyra home">
          <BrandLockup showDescriptor={true} />
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href)
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'relative rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  active ? 'text-ink' : 'text-muted-ink hover:text-ink',
                )}
              >
                {item.label}
                {active && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute inset-x-3 -bottom-[21px] h-[2px] bg-brand-accent"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
              </Link>
            )
          })}
        </nav>

        <div className="hidden md:block">
          <Link to="/assess" className={buttonVariants({ variant: 'default', size: 'sm' })}>
            Assess Applicant
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex size-9 items-center justify-center rounded-md text-ink md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-t border-hairline bg-background md:hidden"
        >
          <nav className="mx-auto flex max-w-[1240px] flex-col px-5 py-3 sm:px-8" aria-label="Mobile">
            {NAV.map((item) => {
              const active = isActive(pathname, item.href)
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'rounded-md px-3 py-2.5 text-sm font-medium',
                    active ? 'bg-secondary text-ink' : 'text-muted-ink',
                  )}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </motion.div>
      )}
    </header>
  )
}
