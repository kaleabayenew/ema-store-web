import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const stats = [
  { label: 'Active campaigns', value: '12',   delta: '+3',     tone: 'success', icon: Sparkles },
  { label: 'Active coupons',   value: '28',   delta: '+6',     tone: 'info',    icon: Tag },
  { label: 'Total impressions',value: '184K', delta: '+22.4%', tone: 'success', icon: Eye },
  { label: 'Coupon redemptions',value: '1,842',delta: '+14.8%',tone: 'warning', icon: MousePointerClick },
]

const campaigns = [
  { id: 'MK-001', name: 'Eid Sale 2025',         type: 'Banner',  target: 'All customers',  impressions: '42K', clicks: '3.2K', ctr: '7.6%', status: 'ACTIVE',   start: '1 Jun', end: '15 Jun' },
  { id: 'MK-002', name: 'New Arrivals — Fashion', type: 'Email',   target: 'Segment: Female',impressions: '18K', clicks: '1.4K', ctr: '7.8%', status: 'ACTIVE',   start: '5 Jul', end: '31 Jul' },
  { id: 'MK-003', name: 'Flash Deal Friday',      type: 'Push',    target: 'All customers',  impressions: '68K', clicks: '8.1K', ctr: '11.9%',status: 'COMPLETED',start: '4 Jul', end: '4 Jul' },
  { id: 'MK-004', name: 'Partner Spotlight',      type: 'Banner',  target: 'All customers',  impressions: '12K', clicks: '890',  ctr: '7.4%', status: 'DRAFT',    start: '—',     end: '—' },
  { id: 'MK-005', name: 'Back to School',         type: 'Email',   target: 'Segment: Youth', impressions: '—',   clicks: '—',    ctr: '—',    status: 'SCHEDULED',start: '20 Jul',end: '10 Aug' },
]

const coupons = [
  { code: 'EMA10',    discount: '10% off',      minOrder: 'ETB 500',  used: 284, limit: 500,  expires: '31 Jul 2025', status: 'ACTIVE' },
  { code: 'NEWUSER',  discount: 'ETB 100 off',  minOrder: 'ETB 300',  used: 1042,limit: 2000, expires: '31 Dec 2025', status: 'ACTIVE' },
  { code: 'FLASH25',  discount: '25% off',      minOrder: 'ETB 1000', used: 516, limit: 516,  expires: '4 Jul 2025',  status: 'EXPIRED' },
  { code: 'PARTNER5', discount: '5% off',       minOrder: 'ETB 200',  used: 88,  limit: 300,  expires: '31 Aug 2025', status: 'ACTIVE' },
]

const campaignVariant: Record<string, 'success' | 'warning' | 'default' | 'info'> = {
  ACTIVE: 'success', COMPLETED: 'default', DRAFT: 'warning', SCHEDULED: 'info',
}

export function MarketingPage() {
  const [tab, setTab] = useState<'campaigns' | 'coupons'>('campaigns')

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-brand-600">Marketing</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Marketing & Promotions</h1>
        </div>
        <Button className="gap-2"><Plus className="h-4 w-4" />New campaign</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, delta, tone, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">{label}</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-300"><Icon className="h-4 w-4" /></span>
            </div>
            <p className="mt-4 text-2xl font-semibold text-slate-900 dark:text-slate-100">{value}</p>
            <Badge variant={tone as 'success' | 'info' | 'warning'} className="mt-2">{delta}</Badge>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex gap-1 border-b border-slate-200 px-4 pt-3 dark:border-slate-800">
          {(['campaigns', 'coupons'] as const).map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)}
              className={`rounded-t-lg px-4 py-2 text-sm font-medium capitalize transition ${tab === t ? 'border-b-2 border-brand-600 text-brand-700 dark:text-brand-300' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'}`}>
              {t}
            </button>
          ))}
        </div>

        {tab === 'campaigns' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left dark:border-slate-800">
                  {['Campaign', 'Type', 'Target', 'Impressions', 'Clicks', 'CTR', 'Period', 'Status'].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {campaigns.map((c) => (
                  <tr key={c.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900 dark:text-slate-100">{c.name}</p>
                      <p className="text-xs text-slate-400">{c.id}</p>
                    </td>
                    <td className="px-4 py-3"><Badge variant="default">{c.type}</Badge></td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{c.target}</td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{c.impressions}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{c.clicks}</td>
                    <td className="px-4 py-3 font-semibold text-brand-700 dark:text-brand-300">{c.ctr}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{c.start} → {c.end}</td>
                    <td className="px-4 py-3"><Badge variant={campaignVariant[c.status]}>{c.status.charAt(0) + c.status.slice(1).toLowerCase()}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'coupons' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left dark:border-slate-800">
                  {['Code', 'Discount', 'Min. order', 'Used / Limit', 'Expires', 'Status'].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {coupons.map((c) => (
                  <tr key={c.code} className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-mono font-bold text-brand-700 dark:text-brand-300">{c.code}</td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{c.discount}</td>
                    <td className="px-4 py-3 text-slate-500">{c.minOrder}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                          <div className="h-full rounded-full bg-brand-500" style={{ width: `${Math.min((c.used / c.limit) * 100, 100)}%` }} />
                        </div>
                        <span className="text-xs text-slate-500">{c.used}/{c.limit}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{c.expires}</td>
                    <td className="px-4 py-3"><Badge variant={c.status === 'ACTIVE' ? 'success' : 'danger'}>{c.status.charAt(0) + c.status.slice(1).toLowerCase()}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
