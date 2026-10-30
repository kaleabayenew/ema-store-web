import { Mail, MoreHorizontal, Phone, Search, ShoppingBag, TrendingUp, UserCheck, Users } from 'lucide-react'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const stats = [
  { label: 'Total customers',   value: '14,832', delta: '+8.4%',  tone: 'success', icon: Users },
  { label: 'Active this month', value: '3,241',  delta: '+12.1%', tone: 'info',    icon: UserCheck },
  { label: 'Orders placed',     value: '9,108',  delta: '+6.7%',  tone: 'success', icon: ShoppingBag },
  { label: 'Avg. order value',  value: 'ETB 420', delta: '+3.2%', tone: 'warning', icon: TrendingUp },
]

const customers = [
  { id: 'C-001', name: 'Meron Haile',    phone: '911 234 567', email: 'meron@email.et',    orders: 12, spent: 'ETB 5,240', status: 'Active',   joined: 'Jan 2024' },
  { id: 'C-002', name: 'Yonas Tesfaye',  phone: '912 345 678', email: 'yonas@email.et',    orders: 8,  spent: 'ETB 3,180', status: 'Active',   joined: 'Mar 2024' },
  { id: 'C-003', name: 'Tigist Alemu',   phone: '913 456 789', email: 'tigist@email.et',   orders: 3,  spent: 'ETB 890',   status: 'Inactive', joined: 'Jun 2024' },
  { id: 'C-004', name: 'Biruk Mengistu', phone: '914 567 890', email: 'biruk@email.et',    orders: 21, spent: 'ETB 9,760', status: 'Active',   joined: 'Nov 2023' },
  { id: 'C-005', name: 'Hiwot Girma',    phone: '915 678 901', email: 'hiwot@email.et',    orders: 5,  spent: 'ETB 2,100', status: 'Active',   joined: 'Feb 2024' },
  { id: 'C-006', name: 'Abel Kebede',    phone: '916 789 012', email: 'abel@email.et',     orders: 0,  spent: 'ETB 0',     status: 'Inactive', joined: 'Aug 2024' },
  { id: 'C-007', name: 'Rahel Tadesse',  phone: '917 890 123', email: 'rahel@email.et',    orders: 17, spent: 'ETB 7,340', status: 'Active',   joined: 'Dec 2023' },
  { id: 'C-008', name: 'Dawit Bekele',   phone: '918 901 234', email: 'dawit@email.et',    orders: 9,  spent: 'ETB 3,920', status: 'Active',   joined: 'Apr 2024' },
]

export function CustomersPage() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'All' | 'Active' | 'Inactive'>('All')

  const filtered = customers.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
    const matchFilter = filter === 'All' || c.status === filter
    return matchSearch && matchFilter
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-brand-600">Customer management</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Customers</h1>
        </div>
        <Button>Export customers</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, delta, tone, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">{label}</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-300">
                <Icon className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-4 text-2xl font-semibold text-slate-900 dark:text-slate-100">{value}</p>
            <Badge variant={tone as 'success' | 'info' | 'warning'} className="mt-2">{delta} this month</Badge>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
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
            {(['All', 'Active', 'Inactive'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-xl px-3 py-1.5 text-sm font-medium transition ${filter === f ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left dark:border-slate-800">
                {['Customer', 'Contact', 'Orders', 'Total spent', 'Status', 'Joined', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((c) => (
                <tr key={c.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100">{c.name}</p>
                        <p className="text-xs text-slate-400">{c.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span className="flex items-center gap-1 text-xs text-slate-500"><Phone className="h-3 w-3" />{c.phone}</span>
                      <span className="flex items-center gap-1 text-xs text-slate-500"><Mail className="h-3 w-3" />{c.email}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{c.orders}</td>
                  <td className="px-4 py-3 font-semibold text-brand-700 dark:text-brand-300">{c.spent}</td>
                  <td className="px-4 py-3">
                    <Badge variant={c.status === 'Active' ? 'success' : 'default'}>{c.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{c.joined}</td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-200 px-4 py-3 text-sm text-slate-500 dark:border-slate-800">
          Showing {filtered.length} of {customers.length} customers
        </div>
      </div>
    </div>
  )
}
