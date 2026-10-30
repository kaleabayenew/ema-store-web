import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Download, TrendingUp } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const kpis = [
  { label: 'Revenue (Jul)',   value: 'ETB 842K', delta: '+18.2%', tone: 'success' },
  { label: 'Orders (Jul)',    value: '3,482',    delta: '+12.6%', tone: 'info' },
  { label: 'New customers',  value: '1,241',    delta: '+9.4%',  tone: 'success' },
  { label: 'Avg order value',value: 'ETB 242',  delta: '+4.8%',  tone: 'warning' },
]

const revenueData = [
  { month: 'Feb', revenue: 480 }, { month: 'Mar', revenue: 620 }, { month: 'Apr', revenue: 580 },
  { month: 'May', revenue: 740 }, { month: 'Jun', revenue: 810 }, { month: 'Jul', revenue: 842 },
]

const categoryData = [
  { name: 'Fashion', orders: 820 }, { name: 'Electronics', orders: 640 }, { name: 'Food', orders: 1100 },
  { name: 'Beauty', orders: 420 }, { name: 'Home', orders: 360 }, { name: 'Sports', orders: 280 },
]

const orderMix = [
  { name: 'Delivered',  value: 76, color: '#1B9B5A' },
  { name: 'In transit', value: 13, color: '#3B82F6' },
  { name: 'Cancelled',  value: 7,  color: '#D93025' },
  { name: 'Pending',    value: 4,  color: '#F5B700' },
]

const subCityData = [
  { city: 'Bole', orders: 920 }, { city: 'Yeka', orders: 740 }, { city: 'Kirkos', orders: 680 },
  { city: 'Arada', orders: 510 }, { city: 'Nifas', orders: 430 }, { city: 'Lideta', orders: 380 },
]

const topProducts = [
  { rank: 1, name: 'Yirgacheffe Coffee Beans',   category: 'Food',       sold: 412, revenue: 'ETB 280K' },
  { rank: 2, name: 'Moringa Leaf Powder',         category: 'Health',     sold: 318, revenue: 'ETB 99K' },
  { rank: 3, name: 'Everyday Wireless Headphones',category: 'Electronics',sold: 210, revenue: 'ETB 683K' },
  { rank: 4, name: 'Habesha Kemis Dress',         category: 'Fashion',    sold: 87,  revenue: 'ETB 209K' },
  { rank: 5, name: 'Pure Shea Butter',            category: 'Beauty',     sold: 194, revenue: 'ETB 68K' },
]

export function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-brand-600">Analytics & Reports</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Reports</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2"><Download className="h-4 w-4" />Export PDF</Button>
          <Button variant="outline">Last 30 days</Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(({ label, value, delta, tone }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">{label}</span>
              <TrendingUp className="h-4 w-4 text-slate-300" />
            </div>
            <p className="mt-4 text-2xl font-semibold text-slate-900 dark:text-slate-100">{value}</p>
            <Badge variant={tone as 'success' | 'info' | 'warning'} className="mt-2">{delta}</Badge>
          </div>
        ))}
      </div>

      {/* Revenue + order mix */}
      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Monthly revenue (ETB '000)</h2>
              <p className="text-sm text-slate-500">Last 6 months</p>
            </div>
            <Badge variant="success">+18.2% vs last month</Badge>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="rev" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#1B9B5A" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#1B9B5A" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#1B9B5A" fill="url(#rev)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Order status mix</h2>
          <div className="mt-3 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={orderMix} dataKey="value" nameKey="name" innerRadius={48} outerRadius={76} paddingAngle={3}>
                  {orderMix.map((e) => <Cell key={e.name} fill={e.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            {orderMix.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} /><span className="text-slate-600 dark:text-slate-300">{item.name}</span></div>
                <span className="font-medium text-slate-900 dark:text-slate-100">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category + sub-city */}
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-100">Orders by category</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="orders" radius={[8, 8, 0, 0]} fill="#1B9B5A" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-100">Orders by sub-city</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subCityData}>
                <CartesianGrid vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="city" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="orders" radius={[8, 8, 0, 0]} fill="#F5B700" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top products */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 p-4 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Top 5 products this month</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left dark:border-slate-800">
                {['#', 'Product', 'Category', 'Units sold', 'Revenue'].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {topProducts.map((p) => (
                <tr key={p.rank} className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-bold text-brand-600 dark:text-brand-400">{p.rank}</td>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{p.name}</td>
                  <td className="px-4 py-3"><Badge variant="default">{p.category}</Badge></td>
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">{p.sold}</td>
                  <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">{p.revenue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
