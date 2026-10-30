import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import {
  BarChart3, Bell, Bike, Boxes, Building2, CreditCard, Flame, MessageSquareText,
  PackageCheck, ShoppingCart, Sparkles, UserRoundCog, Users, Warehouse,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { canAccessRoute, ROLE_LABELS } from '@/config/rbac'
import { useAuthStore } from '@/store/authStore'
import type { Role } from '@/types/auth'

const allPages = [
  { title: 'Customers',     href: '/customers', description: 'View and manage customer accounts',   icon: Users },
  { title: 'Partners',      href: '/partners',  description: 'Review and manage store partners',    icon: Building2 },
  { title: 'Products',      href: '/products',  description: 'Manage the product catalog',          icon: Boxes },
  { title: 'Orders',        href: '/orders',    description: 'Review and track all orders',          icon: ShoppingCart },
  { title: 'Ride',          href: '/ride',      description: 'Manage riders and live deliveries',   icon: Bike },
  { title: 'Marketing',     href: '/marketing', description: 'Campaigns, banners and coupons',      icon: Sparkles },
  { title: 'Flash Deals',    href: '/flash-deals', description: 'Manage flash deals and time-limited offers',  icon: Flame },
  { title: 'Support',       href: '/support',   description: 'Handle customer support tickets',     icon: MessageSquareText },
  { title: 'Delivery',      href: '/delivery',  description: 'Manage delivery zones and routes',    icon: Warehouse },
  { title: 'Finance',       href: '/finance',   description: 'Revenue, payouts and transactions',   icon: CreditCard },
  { title: 'Reports',       href: '/reports',   description: 'Analytics and performance reports',   icon: BarChart3 },
  { title: 'Approvals',     href: '/approvals', description: 'Partner and product approval queue',  icon: PackageCheck },
  { title: 'Notifications', href: '/notifications', description: 'Send announcements and manage notifications', icon: Bell },
  { title: 'Manage Users',  href: '/users',     description: 'Admin users and access control',      icon: UserRoundCog },
]

const summary = [
  { label: 'Net revenue',     value: 'ETB 2.4M', delta: '+18.2%', tone: 'success' },
  { label: 'Orders',          value: '3,482',    delta: '+12.6%', tone: 'info' },
  { label: 'Active partners', value: '184',      delta: '+7.4%',  tone: 'warning' },
  { label: 'Refunds',         value: 'ETB 86K',  delta: '-3.1%',  tone: 'danger' },
]

const salesData = [
  { name: 'Jan', sales: 1200 }, { name: 'Feb', sales: 1450 }, { name: 'Mar', sales: 1340 },
  { name: 'Apr', sales: 1780 }, { name: 'May', sales: 1920 }, { name: 'Jun', sales: 2100 }, { name: 'Jul', sales: 1860 },
]

const orderMix = [
  { name: 'Completed',  value: 42, color: '#1B9B5A' },
  { name: 'In transit', value: 28, color: '#3B82F6' },
  { name: 'Pending',    value: 18, color: '#F5B700' },
  { name: 'Cancelled',  value: 12, color: '#D93025' },
]

const cityData = [
  { city: 'Bole', orders: 420 }, { city: 'Yeka', orders: 360 }, { city: 'Kirkos', orders: 330 },
  { city: 'Arada', orders: 240 }, { city: 'Lideta', orders: 210 },
]

const recentActivity = [
  { title: 'New high-value order',          time: '12 mins ago', detail: 'Order #EM-4829 from Bole',        tone: 'success' },
  { title: 'Partner application received',  time: '44 mins ago', detail: 'Tigist Fashions — pending review',tone: 'info' },
  { title: 'Refund request flagged',        time: '1 hour ago',  detail: 'Customer support needs review',   tone: 'danger' },
]

export function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const role = (user?.role ?? 'SUPER_ADMIN') as Role

  const visiblePages = allPages.filter(({ href }) => canAccessRoute(role, href))

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
        <div className="flex items-center gap-2">
          <Button variant="outline">Last 30 days</Button>
          <Button>Export report</Button>
        </div>
      </div>

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

      {/* KPI summary — show for all roles */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summary.map((item) => (
          <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>{item.label}</span>
              <Badge variant={item.tone as 'success' | 'info' | 'warning' | 'danger'}>{item.delta}</Badge>
            </div>
            <div className="mt-5 text-3xl font-semibold text-slate-900 dark:text-slate-50">{item.value}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Sales overview</h2>
              <p className="text-sm text-slate-500">Revenue trend — last 7 months</p>
            </div>
            <Badge variant="success">+12.4% vs last month</Badge>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="revenue" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%"  stopColor="#1B9B5A" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#1B9B5A" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="sales" stroke="#1B9B5A" fill="url(#revenue)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Order mix</h2>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={orderMix} dataKey="value" nameKey="name" innerRadius={52} outerRadius={80} paddingAngle={4}>
                  {orderMix.map((e) => <Cell key={e.name} fill={e.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            {orderMix.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600 dark:text-slate-300">{item.name}</span>
                </div>
                <span className="font-medium text-slate-900 dark:text-slate-100">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Orders by sub-city</h2>
          <div className="mt-5 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cityData}>
                <CartesianGrid vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="city" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="orders" radius={[10, 10, 0, 0]} fill="#F5B700" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Recent activity</h2>
          <div className="mt-5 space-y-4">
            {recentActivity.map((entry) => (
              <div key={entry.title} className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-slate-900 dark:text-slate-100">{entry.title}</p>
                  <Badge variant={entry.tone as 'success' | 'info' | 'danger'}>{entry.time}</Badge>
                </div>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{entry.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
