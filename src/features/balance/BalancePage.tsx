import { useEffect, useState } from 'react'
import { Wallet, ArrowDownLeft, ArrowUpRight, Loader2, AlertCircle, Scale } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'

// ── Types ─────────────────────────────────────────────────────────────────────
// TODO: replace with the real balance/ledger payload once the logic is defined.

interface BalanceSummary {
  platformBalanceCents: number
  riderEarningsCents: number
  partnerRevenueCents: number
  pendingPayoutsCents: number
  serviceChargesCents: number
}

interface BalanceEntry {
  id: string
  label: string
  party: string
  amountCents: number
  type: 'credit' | 'debit'
  createdAt: string
}

function formatMoney(n: number) {
  return `ETB ${n.toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-ET', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function BalancePage() {
  const [summary, setSummary] = useState<BalanceSummary | null>(null)
  const [entries, setEntries] = useState<BalanceEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBalance = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/admin/balance')
      const s = res.data?.summary
      if (s) {
        setSummary({
          platformBalanceCents: s.platformBalance ?? 0,
          riderEarningsCents: s.riderEarnings ?? 0,
          partnerRevenueCents: s.partnerRevenue ?? 0,
          pendingPayoutsCents: s.pendingPayouts ?? 0,
          serviceChargesCents: s.serviceCharges ?? 0,
        })
        setEntries(
          (res.data.entries ?? []).map((e: any) => ({
            id: e.id,
            label: e.label,
            party: e.party,
            amountCents: e.amount ?? 0,
            type: e.type === 'debit' ? 'debit' : 'credit',
            createdAt: e.createdAt,
          })),
        )
      } else {
        setSummary(null)
        setEntries([])
      }
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to load balance')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchBalance() }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    )
  }

  const birr = (cents: number) => cents / 100
  const cards = [
    { label: 'Platform balance', value: birr(summary?.platformBalanceCents ?? 0), icon: Wallet, tone: 'text-brand-600 bg-brand-50 dark:bg-brand-950/40' },
    { label: 'Rider earnings (net)', value: birr(summary?.riderEarningsCents ?? 0), icon: ArrowUpRight, tone: 'text-sky-600 bg-sky-50 dark:bg-sky-950/40' },
    { label: 'Partner revenue (net)', value: birr(summary?.partnerRevenueCents ?? 0), icon: ArrowDownLeft, tone: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' },
    { label: 'Pending payouts', value: birr(summary?.pendingPayoutsCents ?? 0), icon: Scale, tone: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40' },
    { label: 'Service charges', value: birr(summary?.serviceChargesCents ?? 0), icon: Scale, tone: 'text-violet-600 bg-violet-50 dark:bg-violet-950/40' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-brand-600">Ema Store finances</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Balance</h1>
          <p className="mt-1 text-sm text-slate-500">Order money split between riders, partners and service charges.</p>
        </div>
        <Button variant="outline" onClick={fetchBalance} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Refresh
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/30">
          <AlertCircle className="h-4 w-4" />{error}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">{label}</span>
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}><Icon className="h-4 w-4" /></span>
            </div>
            <p className="mt-4 text-xl font-semibold text-slate-900 dark:text-slate-100">{formatMoney(value)}</p>
          </div>
        ))}
      </div>

      {/* Ledger */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Balance entries</h2>
        </div>
        {entries.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-slate-400">
            No balance entries yet — the ledger will appear here once order money starts flowing.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left dark:border-slate-800">
                {['Entry', 'Party', 'Type', 'Amount', 'Date'].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {entries.map((e) => (
                <tr key={e.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{e.label}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{e.party}</td>
                  <td className="px-4 py-3">
                    <Badge variant={e.type === 'credit' ? 'success' : 'danger'}>{e.type}</Badge>
                  </td>
                  <td className={`px-4 py-3 font-semibold ${e.type === 'credit' ? 'text-emerald-600' : 'text-red-500'}`}>
                    {e.type === 'credit' ? '+' : '−'}{formatMoney(birr(e.amountCents))}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(e.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
