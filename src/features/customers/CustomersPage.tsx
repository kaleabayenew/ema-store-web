import {
  Ban,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Coins,
  Loader2,
  MoreHorizontal,
  Phone,
  RefreshCw,
  Search,
  ShoppingBag,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Customer {
  id: string
  fullName: string
  phone: string
  isActive: boolean
  balance: number
  coins: number
  totalOrders: number
  totalSpent: number
  joinedAt: string
  avatarUrl: string | null
}

interface CustomersResponse {
  customers: Customer[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-ET', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function formatCurrency(amount: number) {
  return `ETB ${amount.toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// ── Page ──────────────────────────────────────────────────────────────────────

type FilterStatus = 'all' | 'active' | 'blocked'

export function CustomersPage() {
  const [search, setSearch]   = useState('')
  const [filter, setFilter]   = useState<FilterStatus>('all')
  const [page, setPage]       = useState(1)
  const [data, setData]       = useState<CustomersResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [blockingId, setBlockingId] = useState<string | null>(null)

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get<{ success: boolean; data: CustomersResponse }>('/customers', {
        params: { search, status: filter, page, limit: 20 },
      })
      setData(res.data.data)
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to load customers')
    } finally {
      setLoading(false)
    }
  }, [search, filter, page])

  useEffect(() => {
    const t = setTimeout(fetchCustomers, search ? 400 : 0)
    return () => clearTimeout(t)
  }, [fetchCustomers, search])

  // reset page on filter/search change
  useEffect(() => { setPage(1) }, [search, filter])

  async function toggleBlock(customer: Customer) {
    setBlockingId(customer.id)
    try {
      await api.patch(`/customers/${customer.id}/block`, { block: customer.isActive })
      fetchCustomers()
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Action failed')
    } finally {
      setBlockingId(null)
    }
  }

  // ── Derived stats from current page data ────────────────────────────────────
  const customers  = data?.customers ?? []
  const total      = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1
  const active     = customers.filter((c) => c.isActive).length
  const blocked    = customers.filter((c) => !c.isActive).length
  const totalSpent = customers.reduce((s, c) => s + c.totalSpent, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-brand-600">Customer management</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Customers
          </h1>
        </div>
        <Button variant="outline" size="sm" onClick={fetchCustomers} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total customers',  value: total.toLocaleString(),           icon: Users,       color: 'text-brand-600' },
          { label: 'Active (this page)', value: active.toLocaleString(),         icon: UserCheck,   color: 'text-emerald-600' },
          { label: 'Blocked (this page)', value: blocked.toLocaleString(),       icon: Ban,         color: 'text-red-500' },
          { label: 'Total spent (page)', value: formatCurrency(totalSpent),      icon: TrendingUp,  color: 'text-violet-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">{label}</span>
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 ${color}`}>
                <Icon className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-4 text-2xl font-semibold text-slate-900 dark:text-slate-100">{value}</p>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 sm:w-72"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'active', 'blocked'] as FilterStatus[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-xl px-3 py-1.5 text-sm font-medium capitalize transition ${filter === f ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="px-4 py-6 text-center text-sm text-red-500">{error}</div>
        )}

        {/* Loading */}
        {loading && !error && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-brand-600" />
          </div>
        )}

        {/* Table */}
        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left dark:border-slate-800">
                  {['Customer', 'Phone', 'Wallet / Coins', 'Orders', 'Total spent', 'Status', 'Joined', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {customers.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-slate-400">
                      No customers found.
                    </td>
                  </tr>
                )}
                {customers.map((c) => (
                  <tr key={c.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    {/* Avatar + name */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                          {c.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100">{c.fullName}</p>
                          <p className="text-xs text-slate-400 font-mono">{c.id.slice(0, 8)}…</p>
                        </div>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Phone className="h-3 w-3" />{c.phone}
                      </span>
                    </td>

                    {/* Wallet + coins */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                          <Wallet className="h-3 w-3" />{formatCurrency(c.balance)}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-amber-600">
                          <Coins className="h-3 w-3" />{c.coins.toLocaleString()} coins
                        </span>
                      </div>
                    </td>

                    {/* Orders */}
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 font-medium text-slate-900 dark:text-slate-100">
                        <ShoppingBag className="h-3 w-3 text-slate-400" />{c.totalOrders}
                      </span>
                    </td>

                    {/* Total spent */}
                    <td className="px-4 py-3 font-semibold text-brand-700 dark:text-brand-300">
                      {formatCurrency(c.totalSpent)}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <Badge variant={c.isActive ? 'success' : 'destructive'}>
                        {c.isActive ? 'Active' : 'Blocked'}
                      </Badge>
                    </td>

                    {/* Joined */}
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {formatDate(c.joinedAt)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={blockingId === c.id}
                          onClick={() => toggleBlock(c)}
                          className={c.isActive ? 'text-red-500 hover:text-red-600' : 'text-emerald-600 hover:text-emerald-700'}
                        >
                          {blockingId === c.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : c.isActive ? (
                            <><Ban className="mr-1 h-3 w-3" />Block</>
                          ) : (
                            <><CheckCircle className="mr-1 h-3 w-3" />Unblock</>
                          )}
                        </Button>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 dark:border-slate-800">
            <span className="text-sm text-slate-500">
              Page {page} of {totalPages} · {total} customers
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Footer count */}
        {!loading && !error && totalPages <= 1 && (
          <div className="border-t border-slate-200 px-4 py-3 text-sm text-slate-500 dark:border-slate-800">
            Showing {customers.length} of {total} customers
          </div>
        )}
      </div>
    </div>
  )
}
