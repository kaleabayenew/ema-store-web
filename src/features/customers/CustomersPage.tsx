import {
  Ban,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clipboard,
  Coins,
  Eye,
  KeyRound,
  Loader2,
  MoreHorizontal,
  Phone,
  RefreshCw,
  Search,
  Send,
  ShoppingBag,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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

interface OrderItem {
  id: string
  productName: string
  quantity: number
  price: number
}

interface Order {
  id: string
  totalAmount: number
  status: string
  shippingAddress: string | null
  createdAt: string
  updatedAt: string
  items: OrderItem[]
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

function orderStatusStyle(status: string) {
  const s = status?.toUpperCase()
  if (s === 'DELIVERED' || s === 'COMPLETED')
    return { dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' }
  if (s === 'PENDING' || s === 'PLACED')
    return { dot: 'bg-amber-400',   badge: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' }
  if (s === 'CONFIRMED' || s === 'PROCESSING')
    return { dot: 'bg-blue-500',    badge: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' }
  if (s === 'SHIPPED')
    return { dot: 'bg-violet-500',  badge: 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' }
  if (s === 'CANCELLED' || s === 'FAILED')
    return { dot: 'bg-red-500',     badge: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400' }
  return   { dot: 'bg-slate-400',   badge: 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400' }
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
  const [blockingId, setBlockingId]         = useState<string | null>(null)
  const [selected, setSelected]             = useState<Customer | null>(null)
  const [ordersCustomer, setOrdersCustomer] = useState<Customer | null>(null)
  const [orders, setOrders]                 = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading]   = useState(false)
  const [password, setPassword]             = useState<string | null>(null)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [resetCustomer, setResetCustomer]   = useState<Customer | null>(null)
  const [resetCurrent, setResetCurrent]     = useState<string>('')
  const [resetNew, setResetNew]             = useState<string | null>(null)
  const [resetting, setResetting]           = useState(false)
  const [resetSent, setResetSent]           = useState(false)

  async function openOrders(customer: Customer) {
    if (customer.totalOrders === 0) return
    setOrdersCustomer(customer)
    setOrders([])
    setOrdersLoading(true)
    try {
      const res = await api.get<{ success: boolean; data: Order[] }>(`/customers/${customer.id}/orders`)
      setOrders(res.data.data)
    } catch {
      setOrders([])
    } finally {
      setOrdersLoading(false)
    }
  }

  // Fetch readable password when the detail popup opens
  useEffect(() => {
    if (!selected) {
      setPassword(null)
      return
    }
    setPasswordLoading(true)
    setPassword(null)
    api.get<{ success: boolean; data: { password: string | null; phone: string } }>(`/customers/${selected.id}/password`)
      .then((res) => setPassword(res.data.data.password))
      .catch(() => setPassword(null))
      .finally(() => setPasswordLoading(false))
  }, [selected])

  // Open the reset password popup (fetch current password first)
  async function openResetPassword(customer: Customer) {
    setResetCustomer(customer)
    setResetNew(null)
    setResetSent(false)
    setResetCurrent('Loading…')
    try {
      const res = await api.get<{ success: boolean; data: { password: string | null; phone: string } }>(`/customers/${customer.id}/password`)
      setResetCurrent(res.data.data.password ?? '—')
    } catch {
      setResetCurrent('Unable to load')
    }
  }

  // Generate a new password, persist it, and send via Telegram
  async function generateNewPassword() {
    if (!resetCustomer) return
    setResetting(true)
    setResetSent(false)
    try {
      const res = await api.post<{ success: boolean; data: { newPassword: string; delivery: { sent: boolean; note: string } } }>(`/customers/${resetCustomer.id}/reset-password`)
      setResetNew(res.data.data.newPassword)
      setResetSent(res.data.data.delivery.sent)
      // If the detail popup is open for the same customer, refresh its password too
      if (selected?.id === resetCustomer.id) setPassword(res.data.data.newPassword)
      // Refresh the list so any derived state stays fresh
      fetchCustomers()
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Failed to reset password')
    } finally {
      setResetting(false)
    }
  }

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
                      <button
                        onClick={() => openOrders(c)}
                        disabled={c.totalOrders === 0}
                        className={`flex items-center gap-1 font-medium transition ${c.totalOrders > 0 ? 'cursor-pointer text-brand-600 underline-offset-2 hover:underline dark:text-brand-400' : 'cursor-default text-slate-400'}`}
                      >
                        <ShoppingBag className="h-3 w-3" />{c.totalOrders}
                      </button>
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <div className="px-2 py-1.5 text-xs font-semibold text-slate-400">Actions</div>
                          <div className="my-1 h-px bg-slate-100 dark:bg-slate-800" />
                          <DropdownMenuItem onClick={() => setSelected(c)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(c.id)}>
                            <Clipboard className="mr-2 h-4 w-4" />
                            Copy customer ID
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(c.phone)}>
                            <Phone className="mr-2 h-4 w-4" />
                            Copy phone
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openResetPassword(c)}>
                            <KeyRound className="mr-2 h-4 w-4" />
                            Reset password
                          </DropdownMenuItem>
                          <div className="my-1 h-px bg-slate-100 dark:bg-slate-800" />
                          <DropdownMenuItem
                            disabled={blockingId === c.id}
                            onClick={() => toggleBlock(c)}
                            className={c.isActive ? 'text-red-500 focus:text-red-600' : 'text-emerald-600 focus:text-emerald-700'}
                          >
                            {blockingId === c.id
                              ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              : c.isActive
                                ? <Ban className="mr-2 h-4 w-4" />
                                : <CheckCircle className="mr-2 h-4 w-4" />}
                            {c.isActive ? 'Block customer' : 'Unblock customer'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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

      {/* ── Customer Detail Modal ── */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelected(null)}
          />

          {/* Modal */}
          <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white shadow-2xl dark:bg-slate-900 overflow-hidden">

            {/* ── Header: avatar LEFT, info RIGHT ── */}
            <div className="bg-gradient-to-r from-brand-600 to-brand-500 px-6 py-5">
              <div className="flex items-center gap-4">
                {/* Circle avatar — left */}
                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full border-4 border-white/30 bg-white/20 text-2xl font-bold text-white shadow-lg">
                  {selected.fullName.charAt(0).toUpperCase()}
                </div>

                {/* Info — right */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-widest text-brand-100">Customer</p>
                  <h2 className="text-xl font-bold text-white truncate">{selected.fullName}</h2>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="flex items-center gap-1 text-xs text-brand-100">
                      <Phone className="h-3 w-3" />{selected.phone}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${selected.isActive ? 'bg-emerald-400/30 text-emerald-100' : 'bg-red-400/30 text-red-100'}`}>
                      {selected.isActive ? '● Active' : '● Blocked'}
                    </span>
                  </div>
                </div>

                {/* Close */}
                <button
                  onClick={() => setSelected(null)}
                  className="flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100 dark:divide-slate-800 dark:border-slate-800">
              {[
                { label: 'Orders',      value: selected.totalOrders.toString() },
                { label: 'Total Spent', value: formatCurrency(selected.totalSpent) },
                { label: 'Coins',       value: selected.coins.toLocaleString() },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col items-center py-4">
                  <p className="text-base font-bold text-slate-900 dark:text-slate-100">{value}</p>
                  <p className="text-xs text-slate-400">{label}</p>
                </div>
              ))}
            </div>

            {/* Detail grid */}
            <div className="grid grid-cols-2 gap-3 p-5">
              {[
                { label: 'Customer ID',    value: selected.id.slice(0, 16) + '…', mono: true },
                { label: 'Joined',         value: formatDate(selected.joinedAt) },
                { label: 'Wallet Balance', value: formatCurrency(selected.balance), highlight: true },
                { label: 'Status',         value: selected.isActive ? 'Active' : 'Blocked' },
              ].map(({ label, value, mono, highlight }) => (
                <div key={label} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                  <p className="text-xs text-slate-400">{label}</p>
                  <p className={`mt-1 text-sm font-semibold ${highlight ? 'text-emerald-600' : 'text-slate-800 dark:text-slate-100'} ${mono ? 'font-mono text-xs break-all' : ''}`}>
                    {value}
                  </p>
                </div>
              ))}

              {/* Password row (spans full width) */}
              <div className="col-span-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400">Password</p>
                  <button
                    onClick={() => password && navigator.clipboard.writeText(password)}
                    className="text-xs text-brand-600 hover:underline dark:text-brand-400"
                  >
                    Copy
                  </button>
                </div>
                {passwordLoading ? (
                  <p className="mt-1 flex items-center gap-2 text-sm text-slate-400">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
                  </p>
                ) : password ? (
                  <p className="mt-1 font-mono text-sm font-semibold text-slate-800 dark:text-slate-100">{password}</p>
                ) : (
                  <p className="mt-1 text-xs text-slate-400">No password on record. Use “Reset password” to generate one.</p>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 border-t border-slate-100 px-5 pb-5 pt-3 dark:border-slate-800">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => navigator.clipboard.writeText(selected.phone)}
              >
                <Phone className="mr-2 h-4 w-4" />
                Copy Phone
              </Button>
              <Button
                className={`flex-1 text-white ${selected.isActive ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                disabled={blockingId === selected.id}
                onClick={() => { toggleBlock(selected); setSelected(null); }}
              >
                {blockingId === selected.id ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : selected.isActive ? (
                  <><Ban className="mr-2 h-4 w-4" />Block</>
                ) : (
                  <><CheckCircle className="mr-2 h-4 w-4" />Unblock</>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* ── Orders Modal ── */}
      {ordersCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOrdersCustomer(null)}
          />
          <div className="relative z-10 w-full max-w-xl rounded-2xl bg-white shadow-2xl dark:bg-slate-900 overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <div>
                <p className="text-xs text-slate-400">Orders for</p>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {ordersCustomer.fullName}
                </h2>
              </div>
              <button
                onClick={() => setOrdersCustomer(null)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="max-h-[60vh] overflow-y-auto">
              {ordersLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-7 w-7 animate-spin text-brand-600" />
                </div>
              ) : orders.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-16 text-slate-400">
                  <ShoppingBag className="h-10 w-10" />
                  <p className="text-sm">No orders found</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {orders.map((order) => {
                    const { dot, badge } = orderStatusStyle(order.status)
                    return (
                      <div key={order.id} className="px-5 py-4">
                        {/* Order header row */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${dot}`} />
                            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                              {order.id.slice(0, 8).toUpperCase()}
                            </span>
                          </div>
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge}`}>
                            {order.status}
                          </span>
                        </div>

                        {/* Meta */}
                        <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                          <span>{formatDate(order.createdAt)}</span>
                          {order.shippingAddress && (
                            <span className="truncate max-w-[180px]">📍 {order.shippingAddress}</span>
                          )}
                        </div>

                        {/* Items */}
                        {order.items.length > 0 && (
                          <div className="mt-3 space-y-1">
                            {order.items.map((item) => (
                              <div key={item.id} className="flex items-center justify-between text-xs">
                                <span className="text-slate-600 dark:text-slate-300">
                                  {item.productName ?? 'Product'}
                                  <span className="ml-1 text-slate-400">×{item.quantity}</span>
                                </span>
                                <span className="font-medium text-slate-700 dark:text-slate-200">
                                  {formatCurrency(item.price * item.quantity)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Total */}
                        <div className="mt-3 flex justify-end">
                          <span className="text-sm font-bold text-brand-600 dark:text-brand-400">
                            Total: {formatCurrency(order.totalAmount)}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 px-5 py-3 text-right text-xs text-slate-400 dark:border-slate-800">
              {orders.length} order{orders.length !== 1 ? 's' : ''} total
            </div>
          </div>
        </div>
      )}

      {/* ── Reset Password Modal ── */}
      {resetCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setResetCustomer(null)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-slate-900 overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-brand-600" />
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Reset Password</h2>
              </div>
              <button
                onClick={() => setResetCustomer(null)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              {/* Customer name */}
              <p className="text-sm text-slate-500">
                For <span className="font-semibold text-slate-800 dark:text-slate-100">{resetCustomer.fullName}</span>
                <span className="ml-2 text-xs text-slate-400">{resetCustomer.phone}</span>
              </p>

              {/* Current password */}
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                <p className="text-xs text-slate-400">Current password</p>
                <p className="mt-1 font-mono text-sm font-semibold text-slate-800 dark:text-slate-100 break-all">
                  {resetCurrent}
                </p>
              </div>

              {/* New password (after generate) */}
              {resetNew && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900 dark:bg-emerald-900/20">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-emerald-700 dark:text-emerald-400">New password</p>
                    <button
                      onClick={() => navigator.clipboard.writeText(resetNew)}
                      className="text-xs text-emerald-700 hover:underline dark:text-emerald-400"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="mt-1 font-mono text-base font-bold text-emerald-700 dark:text-emerald-300 break-all">
                    {resetNew}
                  </p>
                  <div className="mt-2 flex items-center gap-1.5 text-xs">
                    <Send className="h-3 w-3 text-emerald-600" />
                    {resetting ? (
                      <span className="text-slate-400">Sending…</span>
                    ) : resetSent ? (
                      <span className="text-emerald-600 font-medium">Sent to customer on Telegram</span>
                    ) : (
                      <span className="text-amber-600">Customer hasn't linked Telegram — password logged on server</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 border-t border-slate-100 px-5 py-4 dark:border-slate-800">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setResetCustomer(null)}
                disabled={resetting}
              >
                Close
              </Button>
              <Button
                className="flex-1 bg-brand-600 text-white hover:bg-brand-700"
                disabled={resetting}
                onClick={generateNewPassword}
              >
                {resetting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating…</>
                ) : (
                  <><RefreshCw className="mr-2 h-4 w-4" />Generate</>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
