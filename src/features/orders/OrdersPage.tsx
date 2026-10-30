import { useState } from 'react'
import { ShoppingCart, CheckCircle2, Package, XCircle, Search, MoreHorizontal } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const stats = [
  { label: 'Total orders',  value: '9,108', delta: '+12.6%', tone: 'success', icon: ShoppingCart },
  { label: 'Delivered',     value: '7,840', delta: '+10.2%', tone: 'success', icon: CheckCircle2 },
  { label: 'In transit',    value: '842',   delta: '+8.1%',  tone: 'info',    icon: Package },
  { label: 'Cancelled',     value: '426',   delta: '-3.1%',  tone: 'danger',  icon: XCircle },
]

const orders = [
  { id: 'EM-4829', customer: 'Meron Haile',    items: 3, total: 'ETB 2,140', method: 'Telebirr',         status: 'DELIVERED',  date: '12 Jul 2025', subCity: 'Bole' },
  { id: 'EM-4830', customer: 'Yonas Tesfaye',  items: 1, total: 'ETB 680',   method: 'CBE Birr',         status: 'IN_TRANSIT', date: '12 Jul 2025', subCity: 'Yeka' },
  { id: 'EM-4831', customer: 'Tigist Alemu',   items: 5, total: 'ETB 4,810', method: 'Cash on delivery', status: 'PACKED',     date: '11 Jul 2025', subCity: 'Kirkos' },
  { id: 'EM-4832', customer: 'Biruk Mengistu', items: 2, total: 'ETB 1,220', method: 'Telebirr',         status: 'CANCELLED',  date: '11 Jul 2025', subCity: 'Arada' },
  { id: 'EM-4833', customer: 'Hiwot Girma',    items: 4, total: 'ETB 3,450', method: 'CBE Birr',         status: 'DELIVERED',  date: '10 Jul 2025', subCity: 'Nifas' },
  { id: 'EM-4834', customer: 'Abel Kebede',    items: 1, total: 'ETB 350',   method: 'Cash on delivery', status: 'PLACED',     date: '10 Jul 2025', subCity: 'Lideta' },
  { id: 'EM-4835', customer: 'Rahel Tadesse',  items: 6, total: 'ETB 5,120', method: 'Telebirr',         status: 'DELIVERED',  date: '9 Jul 2025',  subCity: 'Bole' },
  { id: 'EM-4836', customer: 'Dawit Bekele',   items: 2, total: 'ETB 1,030', method: 'CBE Birr',         status: 'IN_TRANSIT', date: '9 Jul 2025',  subCity: 'Kazanch' },
]

const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  DELIVERED:  'success',
  IN_TRANSIT: 'info',
  PACKED:     'warning',
  PLACED:     'default',
  CANCELLED:  'danger',
}

const statusLabel: Record<string, string> = {
  DELIVERED: 'Delivered', IN_TRANSIT: 'In transit', PACKED: 'Packed', PLACED: 'Placed', CANCELLED: 'Cancelled',
}

export function OrdersPage() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'All' | 'PLACED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED'>('All')

  const filtered = orders.filter((o) => {
    const matchSearch = o.id.toLowerCase().includes(search.toLowerCase()) || o.customer.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'All' || o.status === filter
    return matchSearch && matchFilter
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-brand-600">Order management</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Orders</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Export</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, delta, tone, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">{label}</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-300"><Icon className="h-4 w-4" /></span>
            </div>
            <p className="mt-4 text-2xl font-semibold text-slate-900 dark:text-slate-100">{value}</p>
            <Badge variant={tone as 'success' | 'info' | 'warning' | 'danger'} className="mt-2">{delta}</Badge>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search order ID or customer…" value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 sm:w-72" />
          </div>
          <div className="flex flex-wrap gap-2">
            {(['All', 'PLACED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'] as const).map((f) => (
              <button key={f} type="button" onClick={() => setFilter(f)}
                className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${filter === f ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'}`}>
                {statusLabel[f] ?? f}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left dark:border-slate-800">
                {['Order', 'Customer', 'Sub-city', 'Items', 'Total', 'Payment', 'Status', 'Date', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((o) => (
                <tr key={o.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-medium text-brand-700 dark:text-brand-300">{o.id}</td>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{o.customer}</td>
                  <td className="px-4 py-3 text-slate-500">{o.subCity}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{o.items}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">{o.total}</td>
                  <td className="px-4 py-3 text-slate-500">{o.method}</td>
                  <td className="px-4 py-3"><Badge variant={statusVariant[o.status]}>{statusLabel[o.status]}</Badge></td>
                  <td className="px-4 py-3 text-slate-500">{o.date}</td>
                  <td className="px-4 py-3"><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-200 px-4 py-3 text-sm text-slate-500 dark:border-slate-800">Showing {filtered.length} of {orders.length} orders</div>
      </div>
    </div>
  )
}
