import { useEffect, useState } from 'react'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import {
  BarChart3, Bell, Bike, Boxes, Building2, CreditCard, Flame, Loader2,
  MessageSquareText, PackageCheck, RefreshCw, ShoppingCart,
  Sparkles, TrendingDown, TrendingUp, UserRoundCog, Users, Warehouse,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { canAccessRoute, ROLE_LABELS } from '@/config/rbac'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import type { Role } from '@/types/auth'

// ── Types ─────────────────────────────────────────────────────────────────────

interface DashboardData {
  kpi: {
    revenue: number
    revenueDelta: string
    orders: number
    ordersDelta: string
    partners: number
    customers: number
    refunds: number
    openTickets: number
    newCustomers: number
  }
  salesChart:   { name: string; revenue: number; orders: number }[]
  orderMix:     { name: string; value: number }[]
  cityData:     { city: string; orders: number }[]
  topProducts:  { name: string; sold: number }[]
  topPartners:  { name: string; sales: number }[]
  recentOrders: { id: string; status: string; totalAmount: number; customerName: string; createdAt: string }[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCurrency(amount: number) {
  if (amount >= 1_000_000) return `ETB ${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000)     return `ETB ${(amount / 1_000).toFixed(1)}K`
  return `ETB ${amount.toLocaleString('en-ET', { maximumFractionDigits: 0 })}`
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

const STATUS_COLOR: Record<string, string> = {
  DELIVERED: '#1B9B5A', PLACED: '#3B82F6', CONFIRMED: '#3B82F6',
  PROCESSING: '#F5B700', PACKED: '#F5B700', SHIPPED: '#8B5CF6',
  IN_TRANSIT: '#8B5CF6', CANCELLED: '#D93025', REFUNDED: '#D93025',
}

const STATUS_LABEL: Record<string, string> = {
  PLACED: 'Placed', CONFIRMED: 'Confirmed', PROCESSING: 'Processing',
  PACKED: 'Packed', SHIPPED: 'Shipped', IN_TRANSIT: 'In transit',
  DELIVERED: 'Delivered', CANCELLED: 'Cancelled', REFUNDED: 'Refunded',
}

const STATUS_BADGE: Record<string, 'success' | 'warning' | 'info' | 'danger' | 'default'> = {
  DELIVERED: 'success', PLACED: 'info', CONFIRMED: 'info',
  PROCESSING: 'warning', PACKED: 'warning', SHIPPED: 'info',
  IN_TRANSIT: 'info', CANCELLED: 'danger', REFUNDED: 'danger',
}

const allPages = [
  { title: 'Customers',     href: '/customers',     description: 'View and manage customer accounts',           icon: Users },
  { title: 'Partners',      href: '/partners',      description: 'Review and manage store partners',            icon: Building2 },
  { title: 'Products',      href: '/products',      description: 'Manage the product catalog',                  icon: Boxes },
  { title: 'Orders',        href: '/orders',        description: 'Review and track all orders',                  icon: ShoppingCart },
  { title: 'Ride',          href: '/ride',          description: 'Manage riders and live deliveries',           icon: Bike },
  { title: 'Marketing',     href: '/marketing',     description: 'Campaigns, banners and coupons',              icon: Sparkles },
  { title: 'Flash Deals',   href: '/flash-deals',   description: 'Manage flash deals and time-limited offers',  icon: Flame },
  { title: 'Support',       href: '/support',       description: 'Handle customer support tickets',             icon: MessageSquareText },
  { title: 'Delivery',      href: '/delivery',      description: 'Manage delivery zones and routes',            icon: Warehouse },
  { title: 'Finance',       href: '/finance',       description: 'Revenue, payouts and transactions',           icon: CreditCard },
  { title: 'Reports',       href: '/reports',       description: 'Analytics and performance reports',           icon: BarChart3 },
  { title: 'Approvals',     href: '/approvals',     description: 'Partner and product approval queue',          icon: PackageCheck },
  { title: 'Notifications', href: '/notifications', description: 'Send announcements and manage notifications', icon: Bell },
  { title: 'Manage Users',  href: '/users',         description: 'Admin users and access control',              icon: UserRoundCog },
]

// ── Page ──────────────────────────────────────────────────────────────────────

export function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const role = (user?.role ?? 'SUPER_ADMIN') as Role
  const visiblePages = allPages.filter(({ href }) => canAccessRoute(role, href))

  const [data, setData]       = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const fetchDashboard = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get<DashboardData>('/admin/dashboard')
      setData(res.data)
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDashboard() }, [])

  // Skeleton or error state
  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand-600" />
          <p className="mt-4 text-sm text-slate-500">Loading dashboard…</p>
        </div>
      </div>
    )
  }

  const kpi = data?.kpi
  const isPositiveDelta = (d?: string) => d?.startsWith('+')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-brand-600">
            Welcome back, {user?.name ?? 'Admin'} ·{' '}
            <span className="font-semibold">{ROLE_LABELS[role]}</span>
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Ema Store — Management Dashboard
          </h1>
        </div>
        <Button variant="outline" onClick={fetchDashboard} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Refresh
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-400">
          {error} — showing last data.
        </div>
      )}

      {/* Quick-access page cards */}
      {visiblePages.length > 0 && (
        <section className="space-y-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Your pages</h2>
            <p className="text-sm text-slate-500">Quick access to your assigned sections.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {visiblePages.map(({ title, href, description, icon: Icon }) => (
              <Link key={href} to={href}
                className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-700">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-300">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="font-semibold text-slate-900 group-hover:text-brand-700 dark:text-slate-100 dark:group-hover:text-brand-300">{title}</span>
                </div>
                <p className="mt-3 text-sm text-slate-500">{description}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* KPI summary */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: 'Revenue (30d)',
            value: kpi ? formatCurrency(kpi.revenue) : '—',
            delta: kpi?.revenueDelta ?? '',
            positive: isPositiveDelta(kpi?.revenueDelta),
          },
          {
            label: 'Orders (30d)',
            value: kpi?.orders.toLocaleString() ?? '—',
            delta: kpi?.ordersDelta ?? '',
            positive: isPositiveDelta(kpi?.ordersDelta),
          },
          {
            label: 'Active partners',
            value: kpi?.partners.toLocaleString() ?? '—',
            delta: '',
          },
          {
            label: 'Total customers',
            value: kpi?.customers.toLocaleString() ?? '—',
            delta: kpi ? `+${kpi.newCustomers} this month` : '',
            positive: true,
          },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>{item.label}</span>
              {item.delta && (
                <span className={`flex items-center gap-0.5 text-xs font-semibold ${item.positive ? 'text-emerald-600' : 'text-red-500'}`}>
                  {item.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {item.delta}
                </span>
              )}
            </div>
            <div className="mt-4 text-3xl font-semibold text-slate-900 dark:text-slate-50">{item.value}</div>
          </div>
        ))}
      </div>

      {/* Quick stats row */}
      {kpi && (
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Refunds (30d)',    value: formatCurrency(kpi.refunds),      color: 'text-red-500' },
            { label: 'Open tickets',     value: kpi.openTickets.toLocaleString(), color: 'text-amber-600' },
            { label: 'New customers',    value: kpi.newCustomers.toLocaleString(), color: 'text-emerald-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm text-slate-500">{label}</p>
              <p className={`mt-2 text-2xl font-semibold ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Charts */}
      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        {/* Sales chart */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Sales overview</h2>
              <p className="text-sm text-slate-500">Monthly revenue — last 12 months</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.salesChart ?? []}>
                <defs>
                  <linearGradient id="revenue" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%"  stopColor="#1B9B5A" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#1B9B5A" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Area type="monotone" dataKey="revenue" stroke="#1B9B5A" fill="url(#revenue)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order mix */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Order mix</h2>
          <div className="mt-4 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.orderMix ?? []}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={44}
                  outerRadius={72}
                  paddingAngle={4}
                >
                  {(data?.orderMix ?? []).map((e) => (
                    <Cell key={e.name} fill={STATUS_COLOR[e.name] ?? '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => [`${v} orders`, '']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-1.5">
            {(data?.orderMix ?? []).slice(0, 5).map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: STATUS_COLOR[item.name] ?? '#94a3b8' }} />
                  <span className="text-slate-600 dark:text-slate-300">{STATUS_LABEL[item.name] ?? item.name}</span>
                </div>
                <span className="font-medium text-slate-900 dark:text-slate-100">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* City bar + Recent orders */}
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        {/* Orders by city */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Orders by location</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.cityData ?? []}>
                <CartesianGrid vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="city" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="orders" radius={[8, 8, 0, 0]} fill="#F5B700" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent orders */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Recent orders</h2>
            <Link to="/orders" className="text-xs font-medium text-brand-600 hover:underline">See all</Link>
          </div>
          {data?.recentOrders.length === 0 ? (
            <p className="text-sm text-slate-400">No orders yet.</p>
          ) : (
            <div className="space-y-3">
              {(data?.recentOrders ?? []).map((o) => (
                <div key={o.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{o.customerName}</p>
                      <p className="text-xs text-slate-500">{formatCurrency(o.totalAmount)} · {timeAgo(o.createdAt)}</p>
                    </div>
                    <Badge variant={STATUS_BADGE[o.status] ?? 'default'} className="text-xs">
                      {STATUS_LABEL[o.status] ?? o.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top products + Top partners */}
      <div className="grid gap-6 xl:grid-cols-2">
        {/* Top products */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-100">Top products</h2>
          {(data?.topProducts ?? []).length === 0 ? (
            <p className="text-sm text-slate-400">No data yet.</p>
          ) : (
            <div className="space-y-3">
              {(data?.topProducts ?? []).map((p, i) => (
                <div key={p.name} className="flex items-center gap-3">
                  <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold ${i === 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{p.name}</p>
                      <span className="text-xs font-semibold text-brand-600">{p.sold} sold</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-brand-500"
                        style={{ width: `${data?.topProducts[0]?.sold ? (p.sold / data.topProducts[0].sold) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top partners */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-100">Top partners</h2>
          {(data?.topPartners ?? []).length === 0 ? (
            <p className="text-sm text-slate-400">No data yet.</p>
          ) : (
            <div className="space-y-3">
              {(data?.topPartners ?? []).map((p, i) => (
                <div key={p.name} className="flex items-center gap-3">
                  <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold ${i === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{p.name}</p>
                      <span className="text-xs font-semibold text-emerald-600">{formatCurrency(p.sales)}</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${data?.topPartners[0]?.sales ? (p.sales / data.topPartners[0].sales) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
