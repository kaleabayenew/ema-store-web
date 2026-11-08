import { useCallback, useEffect, useState } from 'react'
import {
  ShoppingCart, CheckCircle2, Package, XCircle, Search,
  Loader2, AlertCircle, Eye, ChevronLeft, ChevronRight,
  MoreHorizontal, TrendingUp,
} from 'lucide-react'

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

interface Order {
  id: string
  status: string
  totalAmount: number
  shippingAddress: string
  paymentMethod: string
  customerName: string
  customerPhone: string
  itemCount: number
  createdAt: string
  updatedAt: string
}

interface OrderItem {
  id: string
  productName: string
  productImage: string | null
  quantity: number
  priceAtOrder: number
}

interface OrderDetail extends Order {
  customerEmail: string
  items: OrderItem[]
}

type FilterStatus = 'All' | 'PENDING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  DELIVERED: 'success',
  IN_TRANSIT: 'info',
  SHIPPED: 'info',
  PACKED: 'warning',
  PROCESSING: 'warning',
  CONFIRMED: 'warning',
  PENDING: 'default',
  PLACED: 'default',
  CANCELLED: 'danger',
  REFUNDED: 'danger',
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pending', PLACED: 'Placed', CONFIRMED: 'Confirmed', PROCESSING: 'Processing',
  PACKED: 'Packed', SHIPPED: 'Shipped', IN_TRANSIT: 'In transit',
  DELIVERED: 'Delivered', CANCELLED: 'Cancelled', REFUNDED: 'Refunded',
}

const ALL_STATUSES = ['PLACED', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'REFUNDED']

function formatCurrency(amount: number) {
  return `ETB ${amount.toLocaleString('en-ET', { minimumFractionDigits: 2 })}`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-ET', { day: 'numeric', month: 'short', year: 'numeric' })
}

function shortId(id: string) {
  return id.slice(0, 8).toUpperCase()
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterStatus>('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [stats, setStats] = useState({
    total: 0, delivered: 0, inTransit: 0, cancelled: 0, totalRevenue: 0,
  })

  // Detail modal
  const [detail, setDetail] = useState<OrderDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const PAGE_SIZE = 15

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/orders/admin', {
        params: {
          search,
          status: filter === 'All' ? undefined : filter,
          page,
          limit: PAGE_SIZE,
        },
      })
      setOrders(res.data.orders ?? [])
      setTotal(res.data.total ?? 0)
      setTotalPages(res.data.totalPages ?? 1)
      setStats({
        total: res.data.total ?? 0,
        delivered: res.data.delivered ?? 0,
        inTransit: res.data.inTransit ?? 0,
        cancelled: res.data.cancelled ?? 0,
        totalRevenue: res.data.totalRevenue ?? 0,
      })
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }, [search, filter, page])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  useEffect(() => {
    const t = setTimeout(() => { if (page !== 1) setPage(1); else fetchOrders() }, search ? 400 : 0)
    return () => clearTimeout(t)
    // eslint-disable-next-line
  }, [search])

  useEffect(() => { setPage(1) }, [filter])

  async function openDetail(order: Order) {
    setDetail({ ...order, customerEmail: '', items: [] })
    setDetailLoading(true)
    try {
      const res = await api.get<{ order: OrderDetail }>(`/orders/admin/${order.id}`)
      setDetail(res.data.order)
    } catch {
      // keep basic info
    } finally {
      setDetailLoading(false)
    }
  }

  async function changeStatus(orderId: string, status: string) {
    setUpdatingStatus(true)
    try {
      await api.patch(`/orders/admin/${orderId}/status`, { status })
      fetchOrders()
      if (detail?.id === orderId) setDetail((d) => d ? { ...d, status } : null)
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Failed to update status')
    } finally {
      setUpdatingStatus(false)
    }
  }

  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand-600" />
          <p className="mt-4 text-sm text-slate-500">Loading orders…</p>
        </div>
      </div>
    )
  }

  if (error && orders.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-red-500" />
          <p className="mt-4 text-sm text-slate-500">{error}</p>
          <Button variant="outline" className="mt-4" onClick={fetchOrders}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-brand-600">Order management</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Orders</h1>
        </div>
        <Button variant="outline" onClick={fetchOrders} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: 'Total orders', value: stats.total.toLocaleString(), icon: ShoppingCart, color: 'text-brand-600' },
          { label: 'Delivered', value: stats.delivered.toLocaleString(), icon: CheckCircle2, color: 'text-emerald-600' },
          { label: 'In transit', value: stats.inTransit.toLocaleString(), icon: Package, color: 'text-blue-600' },
          { label: 'Cancelled', value: stats.cancelled.toLocaleString(), icon: XCircle, color: 'text-red-500' },
          { label: 'Total revenue', value: formatCurrency(stats.totalRevenue), icon: TrendingUp, color: 'text-violet-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">{label}</span>
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 ${color}`}>
                <Icon className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-4 text-xl font-semibold text-slate-900 dark:text-slate-100">{value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by order ID or customer…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 sm:w-80"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {(['All', 'PENDING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as FilterStatus[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${filter === f ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'}`}
              >
                {STATUS_LABEL[f] ?? f}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-400">
            {error} — showing cached data.
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left dark:border-slate-800">
                {['Order ID', 'Customer', 'Items', 'Total', 'Payment', 'Status', 'Date', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {orders.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    <ShoppingCart className="mx-auto mb-2 h-8 w-8" />No orders found.
                  </td>
                </tr>
              )}
              {orders.map((o) => (
                <tr key={o.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-mono font-semibold text-brand-700 dark:text-brand-300">{shortId(o.id)}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900 dark:text-slate-100 truncate max-w-[140px]">{o.customerName}</p>
                    {o.customerPhone && <p className="text-xs text-slate-400">{o.customerPhone}</p>}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{o.itemCount}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(o.totalAmount)}</td>
                  <td className="px-4 py-3 text-slate-500 truncate max-w-[120px]">{o.paymentMethod}</td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANT[o.status] ?? 'default'}>
                      {STATUS_LABEL[o.status] ?? o.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{formatDate(o.createdAt)}</td>
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <div className="px-2 py-1.5 text-xs font-semibold text-slate-400">Actions</div>
                        <div className="my-1 h-px bg-slate-100 dark:bg-slate-800" />
                        <DropdownMenuItem onClick={() => openDetail(o)}>
                          <Eye className="mr-2 h-4 w-4" />View details
                        </DropdownMenuItem>
                        <div className="my-1 h-px bg-slate-100 dark:bg-slate-800" />
                        <div className="px-2 py-1.5 text-xs font-semibold text-slate-400">Change status</div>
                        {ALL_STATUSES.filter((s) => s !== o.status).map((s) => (
                          <DropdownMenuItem key={s} onClick={() => changeStatus(o.id, s)}>
                            <span className={`mr-2 h-2 w-2 rounded-full inline-block ${STATUS_VARIANT[s] === 'success' ? 'bg-emerald-500' : STATUS_VARIANT[s] === 'danger' ? 'bg-red-500' : STATUS_VARIANT[s] === 'info' ? 'bg-blue-500' : 'bg-amber-400'}`} />
                            {STATUS_LABEL[s] ?? s}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
          <span className="text-sm text-slate-500">
            {loading ? 'Loading…' : `Showing ${orders.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–${(page - 1) * PAGE_SIZE + orders.length} of ${total} orders`}
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => setPage(page - 1)}>
                <ChevronLeft className="h-4 w-4" /><span className="ml-1">Prev</span>
              </Button>
              <span className="text-sm text-slate-500">Page <span className="font-semibold">{page}</span> of {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages || loading} onClick={() => setPage(page + 1)}>
                <span className="mr-1">Next</span><ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ── Order Detail Modal ── */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
            {/* Header */}
            <div className="flex items-center justify-between bg-gradient-to-r from-brand-600 to-brand-500 px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-brand-100">Order</p>
                <h2 className="font-mono text-lg font-bold text-white">{shortId(detail.id)}</h2>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={STATUS_VARIANT[detail.status] ?? 'default'}>
                  {STATUS_LABEL[detail.status] ?? detail.status}
                </Badge>
                <button onClick={() => setDetail(null)} className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30">✕</button>
              </div>
            </div>

            <div className="space-y-4 p-5">
              {/* Info grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Customer', value: detail.customerName },
                  { label: 'Phone', value: detail.customerPhone || '—' },
                  { label: 'Email', value: detail.customerEmail || '—' },
                  { label: 'Payment', value: detail.paymentMethod },
                  { label: 'Order total', value: formatCurrency(detail.totalAmount), highlight: true },
                  { label: 'Date', value: formatDate(detail.createdAt) },
                  { label: 'Shipping', value: detail.shippingAddress },
                ].map(({ label, value, highlight }) => (
                  <div key={label} className={`rounded-xl p-3 ${highlight ? 'col-span-2 bg-brand-50 dark:bg-brand-900/20' : 'bg-slate-50 dark:bg-slate-800'}`}>
                    <p className="text-xs text-slate-400">{label}</p>
                    <p className={`mt-1 text-sm font-semibold truncate ${highlight ? 'text-brand-700 dark:text-brand-300' : 'text-slate-800 dark:text-slate-100'}`}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Update status */}
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Update status</p>
                <div className="flex flex-wrap gap-2">
                  {ALL_STATUSES.map((s) => (
                    <button
                      key={s}
                      disabled={updatingStatus || s === detail.status}
                      onClick={() => changeStatus(detail.id, s)}
                      className={`rounded-xl px-3 py-1.5 text-xs font-medium transition
                        ${s === detail.status
                          ? 'bg-brand-600 text-white cursor-default'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 disabled:opacity-50'}`}
                    >
                      {updatingStatus && s !== detail.status ? '' : STATUS_LABEL[s] ?? s}
                    </button>
                  ))}
                  {updatingStatus && <Loader2 className="h-4 w-4 animate-spin text-brand-600 self-center" />}
                </div>
              </div>

              {/* Items */}
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Items ({detail.items.length})
                  {detailLoading && <Loader2 className="ml-2 inline h-3.5 w-3.5 animate-spin" />}
                </p>
                {detail.items.length === 0 ? (
                  <p className="rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-400 dark:bg-slate-800">
                    {detailLoading ? 'Loading items…' : 'No items found.'}
                  </p>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 text-left dark:bg-slate-800">
                          {['Product', 'Qty', 'Price', 'Subtotal'].map((h) => (
                            <th key={h} className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {detail.items.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                                  {item.productImage
                                    ? <img src={item.productImage} alt={item.productName} className="h-full w-full object-cover" />
                                    : <div className="flex h-full w-full items-center justify-center"><Package className="h-3 w-3 text-slate-400" /></div>}
                                </div>
                                <span className="font-medium text-slate-800 dark:text-slate-100 truncate max-w-[180px]">{item.productName}</span>
                              </div>
                            </td>
                            <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{item.quantity}</td>
                            <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{formatCurrency(item.priceAtOrder)}</td>
                            <td className="px-3 py-2 font-semibold text-brand-700 dark:text-brand-300">{formatCurrency(item.priceAtOrder * item.quantity)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
