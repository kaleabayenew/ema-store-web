import { useCallback, useEffect, useState } from 'react'
import { AlarmClockCheck, Bike, Store, User, PackageSearch, Loader2, RefreshCw, UserPlus, Undo2, AlertTriangle } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FilterBar } from '@/components/ui/FilterBar'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatsCard } from '@/components/ui/StatsCard'
import api from '@/lib/api'
import { useConfirm } from '@/components/ui/ConfirmDialog'

interface OverdueDelivery {
  id: string
  orderNumber: string
  status: string
  createdAt: string | null
  acceptedAt: string | null
  deadlineAt: string | null
  overdueHours: number | null
  issueReason: string | null
  issueReportedAt: string | null
  issueResolved: boolean
  deliveryFeeCents: number
  riderEarningCents: number
  customerName: string | null
  customerPhone: string | null
  shippingAddress: string | null
  shopName: string | null
  shopAddress: string | null
  handoverRequestedAt: string | null
  riderArrivedAt: string | null
  agent: { id: string; agentCode: string; name: string; phone: string }
  items: string[]
}

type Filter = 'All' | 'ISSUE' | 'OVERDUE'

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function OverduePage() {
  const confirmDialog = useConfirm()
  const [items, setItems] = useState<OverdueDelivery[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('All')
  const [search, setSearch] = useState('')
  const [hours, setHours] = useState('24')
  const [acting, setActing] = useState<string | null>(null)
  const [assignFor, setAssignFor] = useState<string | null>(null)
  const [agentCode, setAgentCode] = useState('')

  const fetchOverdue = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get<{ deliveries: OverdueDelivery[] }>(
        `/admin/delivery/overdue?hours=${encodeURIComponent(hours)}`,
      )
      setItems(res.data.deliveries ?? [])
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to load overdue deliveries')
    } finally {
      setLoading(false)
    }
  }, [hours])

  useEffect(() => { fetchOverdue() }, [fetchOverdue])

  const issueCount = items.filter((i) => i.issueReason && !i.issueResolved).length
  const maxHours = items.reduce((m, i) => Math.max(m, i.overdueHours ?? 0), 0)

  const q = search.trim().toLowerCase()
  const filtered = items.filter((i) => {
    if (filter === 'ISSUE' && !(i.issueReason && !i.issueResolved)) return false
    if (filter === 'OVERDUE' && (i.overdueHours ?? 0) < Number(hours)) return false
    if (!q) return true
    return [i.orderNumber, i.customerName, i.agent?.name, i.agent?.agentCode, i.shopName, i.shippingAddress]
      .filter(Boolean).some((v) => String(v).toLowerCase().includes(q))
  })

  const reassign = async (id: string, code?: string) => {
    setActing(id)
    setError(null)
    try {
      await api.post(`/admin/delivery/${id}/reassign`, code ? { agentCode: code.trim() } : {})
      setAssignFor(null)
      setAgentCode('')
      await fetchOverdue()
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Reassign failed')
    } finally {
      setActing(null)
    }
  }

  const release = async (item: OverdueDelivery) => {
    const ok = await confirmDialog({
      title: `Release order #${item.orderNumber}?`,
      message: `This removes ${item.agent?.name ?? 'the rider'} and returns the order to the open offers pool for any available rider.`,
      confirmText: 'Release to pool',
    })
    if (ok) reassign(item.id)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operations"
        title="Overdue Deliveries"
        description="Deliveries past their deadline or flagged by riders. Reassign to another rider or release back to the offers pool."
        actions={
          <div className="flex items-center gap-2">
            <select
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <option value="12">Overdue after 12h</option>
              <option value="24">Overdue after 24h</option>
              <option value="48">Overdue after 48h</option>
            </select>
            <Button variant="outline" onClick={fetchOverdue} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Refresh
            </Button>
          </div>
        }
      />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">{error}</div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard label="Needs attention" value={items.length} icon={AlarmClockCheck} iconClassName="text-red-600" iconBgClassName="bg-red-50 dark:bg-red-950/40" loading={loading && items.length === 0} />
        <StatsCard label="Rider-reported issues" value={issueCount} icon={AlertTriangle} iconClassName="text-amber-600" iconBgClassName="bg-amber-50 dark:bg-amber-950/40" loading={loading && items.length === 0} />
        <StatsCard label="Longest overdue" value={maxHours > 0 ? `${maxHours}h` : '—'} icon={PackageSearch} iconClassName="text-brand-600" iconBgClassName="bg-brand-50 dark:bg-brand-950/40" loading={loading && items.length === 0} />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <FilterBar
          filters={[
            { value: 'All', label: 'All' },
            { value: 'ISSUE', label: 'Reported issues', count: issueCount },
            { value: 'OVERDUE', label: `Overdue >${hours}h` },
          ]}
          activeFilter={filter}
          onFilterChange={(v) => setFilter(v as Filter)}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search order, rider, customer, shop…"
        />
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-brand-600" /></div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-slate-400">
              <AlarmClockCheck className="h-10 w-10 opacity-40" />
              <p className="text-sm">No overdue deliveries.</p>
            </div>
          ) : filtered.map((item) => (
            <div key={item.id} className="p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-950/40">
                    <Bike className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">#{item.orderNumber}</p>
                      <Badge variant="warning">{item.status}</Badge>
                      {item.overdueHours != null && item.overdueHours >= Number(hours) && (
                        <Badge variant="danger">{item.overdueHours}h overdue</Badge>
                      )}
                      {item.issueReason && !item.issueResolved && <Badge variant="danger">Issue reported</Badge>}
                    </div>
                    <p className="text-xs text-slate-500">
                      <User className="mr-1 inline h-3 w-3" />{item.customerName ?? 'Customer'} · {item.customerPhone ?? '—'}
                    </p>
                    <p className="text-xs text-slate-500">
                      <Bike className="mr-1 inline h-3 w-3" />{item.agent?.name} ({item.agent?.agentCode}) · {item.agent?.phone}
                    </p>
                    <p className="text-xs text-slate-500">
                      <Store className="mr-1 inline h-3 w-3" />{item.shopName} → {item.shippingAddress ?? '—'}
                    </p>
                    {item.items.length > 0 && (
                      <p className="text-xs text-slate-400">{item.items.join(', ')}</p>
                    )}
                    <p className="text-[11px] text-slate-400">
                      Accepted {fmtDate(item.acceptedAt)} · Deadline {fmtDate(item.deadlineAt)}
                      {item.handoverRequestedAt ? ' · Handover requested' : ''}
                      {item.riderArrivedAt ? ' · Rider arrived' : ''}
                    </p>
                    {item.issueReason && (
                      <p className="mt-1 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                        Rider says: {item.issueReason}
                        {item.issueReportedAt ? ` · ${fmtDate(item.issueReportedAt)}` : ''}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-shrink-0 flex-col gap-2 sm:flex-row">
                  {assignFor === item.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        value={agentCode}
                        onChange={(e) => setAgentCode(e.target.value.toUpperCase())}
                        placeholder="Agent code e.g. R7K2QM"
                        className="w-40 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm uppercase dark:border-slate-700 dark:bg-slate-950"
                      />
                      <Button size="sm" className="gap-1.5 bg-brand-600 hover:bg-brand-700" disabled={acting === item.id || !agentCode.trim()}
                        onClick={() => reassign(item.id, agentCode)}>
                        {acting === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}Assign
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { setAssignFor(null); setAgentCode('') }}>Cancel</Button>
                    </div>
                  ) : (
                    <>
                      <Button size="sm" variant="outline" className="gap-1.5" disabled={acting === item.id}
                        onClick={() => setAssignFor(item.id)}>
                        <UserPlus className="h-3.5 w-3.5" />Reassign
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400"
                        disabled={acting === item.id} onClick={() => release(item)}>
                        {acting === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Undo2 className="h-3.5 w-3.5" />}Release to pool
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
