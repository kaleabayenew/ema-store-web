import { useCallback, useEffect, useState } from 'react'
import {
  Wallet, ArrowDownLeft, ArrowUpRight, Loader2, AlertCircle, Scale,
  X, ChevronLeft, ChevronRight, Users,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/DataTable'
import { FilterBar } from '@/components/ui/FilterBar'
import { PageHeader } from '@/components/ui/PageHeader'
import api from '@/lib/api'

// ── Types ─────────────────────────────────────────────────────────────────────

interface BalanceSummary {
  platformBalanceCents: number
  riderEarningsCents: number
  partnerRevenueCents: number
  pendingPayoutsCents: number
  serviceChargesCents: number
  totalPaidOutCents: number
  pendingPartnerCents: number
  pendingRiderCents: number
  platformPendingCents: number
  escrowHeldCents: number
}

interface BalanceEntry {
  id: string
  label: string
  party: string
  amountCents: number
  type: 'credit' | 'debit'
  createdAt: string
}

interface BreakdownRow {
  name: string
  detail: string
  amountCents: number
  orders: number
}

interface BreakdownResponse {
  card: string
  page: number
  limit: number
  total: number
  pages: number
  rows: BreakdownRow[]
}

interface CardDef {
  key: string
  label: string
  hint?: string
  valueCents: number
  icon: any
  tone: string
}

function formatMoney(n: number) {
  return `ETB ${n.toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-ET', { day: 'numeric', month: 'short', year: 'numeric' })
}

const PAGE_SIZE = 8

// ── Page ──────────────────────────────────────────────────────────────────────

export function BalancePage() {
  const [summary, setSummary] = useState<BalanceSummary | null>(null)
  const [entries, setEntries] = useState<BalanceEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState('all')
  const [entrySearch, setEntrySearch] = useState('')

  // Breakdown popup state
  const [selectedCard, setSelectedCard] = useState<CardDef | null>(null)
  const [breakdown, setBreakdown] = useState<BreakdownResponse | null>(null)
  const [breakdownLoading, setBreakdownLoading] = useState(false)
  const [breakdownError, setBreakdownError] = useState<string | null>(null)
  const [page, setPage] = useState(1)

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
          totalPaidOutCents: s.totalPaidOutCents ?? 0,
          pendingPartnerCents: s.pendingPartnerCents ?? 0,
          pendingRiderCents: s.pendingRiderCents ?? 0,
          platformPendingCents: s.platformPendingCents ?? 0,
          escrowHeldCents: s.escrowHeldCents ?? 0,
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

  const fetchBreakdown = useCallback(async (cardKey: string, p: number) => {
    setBreakdownLoading(true)
    setBreakdownError(null)
    try {
      const res = await api.get('/admin/balance/breakdown', {
        params: { card: cardKey, page: p, limit: PAGE_SIZE },
      })
      setBreakdown(res.data as BreakdownResponse)
    } catch (err: any) {
      setBreakdownError(err.response?.data?.message ?? 'Failed to load details')
      setBreakdown(null)
    } finally {
      setBreakdownLoading(false)
    }
  }, [])

  const openCard = (card: CardDef) => {
    setSelectedCard(card)
    setPage(1)
    setBreakdown(null)
    fetchBreakdown(card.key, 1)
  }

  const goToPage = (p: number) => {
    if (!selectedCard) return
    const next = Math.min(Math.max(1, p), breakdown?.pages ?? 1)
    setPage(next)
    fetchBreakdown(selectedCard.key, next)
  }

  const closeCard = () => {
    setSelectedCard(null)
    setBreakdown(null)
    setBreakdownError(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    )
  }

  const s = summary
  const cards: CardDef[] = [
    { key: 'platform', label: 'Platform balance', valueCents: s?.platformBalanceCents ?? 0, icon: Wallet, tone: 'text-brand-600 bg-brand-50 dark:bg-brand-950/40' },
    { key: 'rider', label: 'Rider earnings (net)', valueCents: s?.riderEarningsCents ?? 0, icon: ArrowUpRight, tone: 'text-sky-600 bg-sky-50 dark:bg-sky-950/40' },
    { key: 'partner', label: 'Partner revenue (net)', valueCents: s?.partnerRevenueCents ?? 0, icon: ArrowDownLeft, tone: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' },
    { key: 'pendingPayouts', label: 'Pending payouts', valueCents: s?.pendingPayoutsCents ?? 0, icon: Scale, tone: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40' },
    { key: 'service', label: 'Service charges', valueCents: s?.serviceChargesCents ?? 0, icon: Scale, tone: 'text-violet-600 bg-violet-50 dark:bg-violet-950/40' },
    { key: 'paidOut', label: 'Paid out to partners/riders', valueCents: s?.totalPaidOutCents ?? 0, icon: ArrowDownLeft, tone: 'text-teal-600 bg-teal-50 dark:bg-teal-950/40' },
    { key: 'pendingPartner', label: 'Pending partner payouts', hint: 'Earned on open orders, not yet deposited', valueCents: s?.pendingPartnerCents ?? 0, icon: ArrowDownLeft, tone: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' },
    { key: 'pendingRider', label: 'Pending rider payouts', hint: 'Rider net earning, not yet deposited', valueCents: s?.pendingRiderCents ?? 0, icon: ArrowUpRight, tone: 'text-sky-600 bg-sky-50 dark:bg-sky-950/40' },
    { key: 'platformPending', label: 'Platform cut pending', hint: 'Service fee + commissions on open orders', valueCents: s?.platformPendingCents ?? 0, icon: Scale, tone: 'text-violet-600 bg-violet-50 dark:bg-violet-950/40' },
    { key: 'escrow', label: 'Held in escrow', hint: 'Customer payments for undelivered orders', valueCents: s?.escrowHeldCents ?? 0, icon: Wallet, tone: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        eyebrow="Ema Store finances"
        title="Balance"
        description="Order money split between riders, partners and service charges. Tap a card for per-person details."
        actions={
          <Button variant="outline" onClick={fetchBalance} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Refresh
          </Button>
        }
      />

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/30">
          <AlertCircle className="h-4 w-4" />{error}
        </div>
      )}

      {/* Summary cards — single row, horizontal scroll */}
      <div className="flex gap-4 overflow-x-auto pb-3 -mx-1 px-1">
        {cards.map(({ key, label, hint, valueCents, icon: Icon, tone }) => (
          <button
            key={key}
            onClick={() => openCard(cards.find((c) => c.key === key)!)}
            className="min-w-[210px] flex-shrink-0 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-brand-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-700"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">{label}</span>
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}><Icon className="h-4 w-4" /></span>
            </div>
            <p className="mt-4 text-xl font-semibold text-slate-900 dark:text-slate-100">{formatMoney(valueCents / 100)}</p>
            {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
          </button>
        ))}
      </div>

      {/* Ledger */}
      <div className="space-y-3">
        <h2 className="px-1 text-base font-semibold text-slate-900 dark:text-slate-100">Balance entries</h2>
        <FilterBar
          filters={[
            { value: 'all', label: 'All', count: entries.length },
            { value: 'credit', label: 'Credits', count: entries.filter((e) => e.type === 'credit').length },
            { value: 'debit', label: 'Debits', count: entries.filter((e) => e.type === 'debit').length },
          ]}
          activeFilter={typeFilter}
          onFilterChange={setTypeFilter}
          search={entrySearch}
          onSearchChange={setEntrySearch}
          searchPlaceholder="Search entries…"
        />
        <DataTable
          columns={[
            {
              key: 'label', header: 'Entry', sortable: true,
              cell: (e) => <span className="font-medium text-slate-900 dark:text-slate-100">{e.label}</span>,
            },
            {
              key: 'party', header: 'Party', sortable: true,
              cell: (e) => <span className="text-slate-600 dark:text-slate-300">{e.party}</span>,
            },
            {
              key: 'type', header: 'Type', sortable: true,
              cell: (e) => <Badge variant={e.type === 'credit' ? 'success' : 'danger'}>{e.type}</Badge>,
            },
            {
              key: 'amountCents', header: 'Amount', sortable: true,
              cell: (e) => (
                <span className={`font-semibold ${e.type === 'credit' ? 'text-emerald-600' : 'text-red-500'}`}>
                  {e.type === 'credit' ? '+' : '−'}{formatMoney(e.amountCents / 100)}
                </span>
              ),
            },
            {
              key: 'createdAt', header: 'Date', sortable: true,
              cell: (e) => <span className="text-slate-500">{formatDate(e.createdAt)}</span>,
            },
          ]}
          data={entries.filter((e) => {
            if (typeFilter !== 'all' && e.type !== typeFilter) return false
            if (entrySearch) {
              const q = entrySearch.toLowerCase()
              if (!`${e.label} ${e.party}`.toLowerCase().includes(q)) return false
            }
            return true
          })}
          loading={loading}
          keyExtractor={(e) => e.id}
          emptyTitle="No balance entries yet"
          emptyDescription="The ledger will appear here once order money starts flowing."
        />
      </div>

      {/* Per-person breakdown popup */}
      {selectedCard && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          onClick={closeCard}
        >
          <div
            className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Popup header */}
            <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-brand-600" />
                  <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{selectedCard.label}</h2>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  Total: <span className="font-semibold text-slate-900 dark:text-slate-100">{formatMoney(selectedCard.valueCents / 100)}</span>
                  {breakdown ? ` · ${breakdown.total} ${breakdown.total === 1 ? 'person' : 'people'}` : ''}
                </p>
              </div>
              <button
                onClick={closeCard}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Popup body */}
            <div className="max-h-[55vh] overflow-y-auto px-5 py-4">
              {breakdownLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
                </div>
              ) : breakdownError ? (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/30">
                  <AlertCircle className="h-4 w-4" />{breakdownError}
                </div>
              ) : !breakdown || breakdown.rows.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-400">No records for this card yet.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left dark:border-slate-800">
                      {['Name', 'Detail', 'Orders', 'Amount'].map((h) => (
                        <th key={h} className="pb-2 pr-4 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {breakdown.rows.map((r, i) => (
                      <tr key={`${r.name}-${i}`} className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-2.5 pr-4 font-medium text-slate-900 dark:text-slate-100">{r.name}</td>
                        <td className="py-2.5 pr-4 text-slate-500">{r.detail || '—'}</td>
                        <td className="py-2.5 pr-4 text-slate-500">{r.orders}</td>
                        <td className="py-2.5 font-semibold text-slate-900 dark:text-slate-100">{formatMoney(r.amountCents / 100)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination footer */}
            {breakdown && breakdown.pages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3 dark:border-slate-800">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1 || breakdownLoading}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" /> Prev
                </Button>
                <span className="text-sm text-slate-500">
                  Page <span className="font-semibold text-slate-900 dark:text-slate-100">{page}</span> of {breakdown.pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= breakdown.pages || breakdownLoading}
                >
                  Next <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
