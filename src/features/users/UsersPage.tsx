import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ROLE_COLORS, ROLE_LABELS } from '@/config/rbac'
import type { Role } from '@/types/auth'

interface AdminUser {
  id: string
  name: string
  email: string
  role: Role
  status: 'ACTIVE' | 'INACTIVE'
  lastLogin: string
  allowedPages: string[]
}

const allPages: { route: string; label: string }[] = [
  { route: '/dashboard',  label: 'Dashboard' },
  { route: '/customers',  label: 'Customers' },
  { route: '/partners',   label: 'Partners' },
  { route: '/products',   label: 'Products' },
  { route: '/orders',     label: 'Orders' },
  { route: '/ride',       label: 'Ride' },
  { route: '/marketing',  label: 'Marketing' },
  { route: '/support',    label: 'Support' },
  { route: '/finance',    label: 'Finance' },
  { route: '/reports',    label: 'Reports' },
  { route: '/delivery',   label: 'Delivery' },
  { route: '/approvals',  label: 'Approvals' },
  { route: '/users',      label: 'Manage Users' },
  { route: '/settings',   label: 'Settings' },
]

const initialUsers: AdminUser[] = [
  { id: 'u-001', name: 'Aster Bekele',   email: 'admin@emastore.et',    role: 'SUPER_ADMIN',      status: 'ACTIVE',   lastLogin: '12 Jul 2025',  allowedPages: [] },
  { id: 'u-002', name: 'Daniel Tadesse', email: 'management@emastore.et',role: 'MANAGEMENT',      status: 'ACTIVE',   lastLogin: '12 Jul 2025',  allowedPages: ['/dashboard','/customers','/partners','/products','/orders','/ride','/marketing'] },
  { id: 'u-003', name: 'Selam Bekele',   email: 'support@emastore.et',  role: 'CUSTOMER_SUPPORT', status: 'ACTIVE',   lastLogin: '11 Jul 2025',  allowedPages: ['/dashboard','/customers','/support'] },
  { id: 'u-004', name: 'Biruk Mesfin',   email: 'partners@emastore.et', role: 'PARTNER_MANAGER',  status: 'ACTIVE',   lastLogin: '10 Jul 2025',  allowedPages: ['/dashboard','/partners','/reports','/approvals'] },
  { id: 'u-005', name: 'Mekdes Alemu',   email: 'products@emastore.et', role: 'PRODUCT_MANAGER',  status: 'ACTIVE',   lastLogin: '12 Jul 2025',  allowedPages: ['/dashboard','/products','/orders','/reports','/approvals'] },
  { id: 'u-006', name: 'Henok Haile',    email: 'finance@emastore.et',  role: 'FINANCE',          status: 'ACTIVE',   lastLogin: '9 Jul 2025',   allowedPages: ['/dashboard','/orders','/finance','/reports'] },
  { id: 'u-007', name: 'Yonas Girma',    email: 'yonas@emastore.et',    role: 'MANAGEMENT',       status: 'INACTIVE', lastLogin: '1 Jun 2025',   allowedPages: ['/dashboard','/orders'] },
]

export function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>(initialUsers)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<AdminUser | null>(null)
  const [editPages, setEditPages] = useState<string[]>([])

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    ROLE_LABELS[u.role].toLowerCase().includes(search.toLowerCase())
  )

  const openEdit = (u: AdminUser) => {
    setEditing(u)
    setEditPages([...u.allowedPages])
  }

  const saveEdit = () => {
    if (!editing) return
    setUsers((prev) => prev.map((u) => u.id === editing.id ? { ...u, allowedPages: editPages } : u))
    setEditing(null)
  }

  const togglePage = (route: string) => {
    setEditPages((prev) => prev.includes(route) ? prev.filter((r) => r !== route) : [...prev, route])
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-brand-600">Access control</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Manage Users</h1>
        </div>
        <Button className="gap-2"><Plus className="h-4 w-4" />Add user</Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        {/* User table */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 p-4 dark:border-slate-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Search users…" value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 sm:w-72" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left dark:border-slate-800">
                  {['User', 'Role', 'Pages', 'Status', 'Last login', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((u) => (
                  <tr key={u.id} className={`transition hover:bg-slate-50 dark:hover:bg-slate-800/50 ${editing?.id === u.id ? 'bg-brand-50 dark:bg-brand-950/20' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${ROLE_COLORS[u.role]}`}>{u.name.charAt(0)}</div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100">{u.name}</p>
                          <p className="text-xs text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${ROLE_COLORS[u.role]}`}>{ROLE_LABELS[u.role]}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {u.role === 'SUPER_ADMIN' ? <span className="flex items-center gap-1 text-brand-600 font-semibold"><Shield className="h-3.5 w-3.5" />All pages</span> : `${u.allowedPages.length} pages`}
                    </td>
                    <td className="px-4 py-3"><Badge variant={u.status === 'ACTIVE' ? 'success' : 'default'}>{u.status.charAt(0) + u.status.slice(1).toLowerCase()}</Badge></td>
                    <td className="px-4 py-3 text-slate-500">{u.lastLogin}</td>
                    <td className="px-4 py-3">
                      {u.role !== 'SUPER_ADMIN' && (
                        <Button variant="ghost" size="icon" onClick={() => openEdit(u)}>
                          <UserRoundCog className="h-4 w-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Permission editor */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {editing ? (
            <div className="p-5 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Editing permissions for</p>
                <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">{editing.name}</p>
                <span className={`inline-block mt-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${ROLE_COLORS[editing.role]}`}>{ROLE_LABELS[editing.role]}</span>
              </div>
              <p className="text-xs text-slate-500">Tick the pages this user can access. Unticked pages will be hidden from their sidebar.</p>
              <div className="space-y-2">
                {allPages.map(({ route, label }) => (
                  <label key={route} className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3 transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
                    <input
                      type="checkbox"
                      checked={editPages.includes(route)}
                      onChange={() => togglePage(route)}
                      className="h-4 w-4 rounded border-slate-300 text-brand-600 accent-brand-600"
                    />
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{label}</span>
                    <span className="ml-auto font-mono text-xs text-slate-400">{route}</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <Button className="flex-1" onClick={saveEdit}>Save changes</Button>
                <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center text-slate-400">
              <div className="text-center">
                <UserRoundCog className="mx-auto h-10 w-10 mb-2 opacity-30" />
                <p className="text-sm">Click the edit icon on a user</p>
                <p className="text-xs mt-1">to manage their page access</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
