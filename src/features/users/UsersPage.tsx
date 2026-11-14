import { useCallback, useEffect, useState } from 'react'
import {
  Plus, Search, Shield, Loader2, RefreshCw,
  Edit2, KeyRound, Ban, CheckCircle2, X,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAlert, useConfirm, usePrompt } from '@/components/ui/ConfirmDialog'
import { ROLE_COLORS, ROLE_LABELS } from '@/config/rbac'
import { assignablePages } from '@/config/navigation'
import api from '@/lib/api'
import { PASSWORD_MIN_LENGTH, passwordPolicy } from '@/lib/validate'
import type { Role } from '@/types/auth'

// ── Types ─────────────────────────────────────────────────────────────────────

interface AdminUser {
  id: string
  fullName: string | null
  email: string
  phone: string
  role: Role
  status: 'ACTIVE' | 'INACTIVE'
  isActive: boolean
  isBlocked: boolean
  allowedPages: string[]
  lastLogin: string | null
  createdAt: string
}

interface StaffListResponse {
  users: AdminUser[]
  total: number
  page: number
  totalPages: number
}

// All assignable pages — derived from the sidebar nav config so any new page
// appears here automatically. Admin-group pages (Manage Users, Settings, etc.)
// are excluded; only Super Admin can reach those.
const allPages = assignablePages

const roleOptions: { value: Role; label: string }[] = [
  { value: 'SUPER_ADMIN',      label: 'Super Admin' },
  { value: 'MANAGEMENT',       label: 'Management' },
  { value: 'CUSTOMER_SUPPORT', label: 'Customer Support' },
  { value: 'PARTNER_MANAGER',  label: 'Partner Manager' },
  { value: 'PRODUCT_MANAGER', label: 'Product Manager' },
  { value: 'FINANCE',          label: 'Finance' },
  { value: 'MARKETING',        label: 'Marketing' },
]

function nameOf(u: AdminUser) {
  return u.fullName || u.email?.split('@')[0] || 'Admin'
}

function formatDate(iso: string | null) {
  if (!iso) return 'Never'
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function UsersPage() {
  const alert = useAlert()
  const confirmDialog = useConfirm()
  const promptDialog = usePrompt()

  const [users, setUsers]       = useState<AdminUser[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [search, setSearch]     = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const [editing, setEditing]   = useState<AdminUser | null>(null)
  const [editPages, setEditPages] = useState<string[]>([])
  const [editRole, setEditRole] = useState<Role>('MANAGEMENT')
  const [saving, setSaving]     = useState(false)

  // Add dialog
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState({
    fullName: '', email: '', phone: '', password: '', role: 'CUSTOMER_SUPPORT' as Role,
  })
  const [adding, setAdding] = useState(false)

  const fetchUsers = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await api.get<StaffListResponse>('/admin/users', {
        params: { search: debouncedSearch || undefined, limit: 100 },
      })
      setUsers(res.data.users ?? [])
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Failed to load users')
    } finally { setLoading(false) }
  }, [debouncedSearch])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  // Debounced search — one request after typing stops
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(t)
  }, [search])

  const openEdit = (u: AdminUser) => {
    setEditing(u)
    setEditPages(u.role === 'SUPER_ADMIN' ? [] : [...u.allowedPages])
    setEditRole(u.role)
  }

  const togglePage = (route: string) => {
    setEditPages((prev) => (prev.includes(route) ? prev.filter((r) => r !== route) : [...prev, route]))
  }

  const saveEdit = async () => {
    if (!editing) return
    setSaving(true)
    try {
      await api.patch(`/admin/users/${editing.id}`, {
        fullName: editing.fullName,
        role: editRole,
        allowedPages: editRole === 'SUPER_ADMIN' ? [] : editPages,
      })
      await fetchUsers()
      setEditing(null)
      alert({ variant: 'success', message: 'Permissions updated.' })
    } catch (e: any) {
      alert({ variant: 'error', message: e.response?.data?.message ?? 'Failed to save' })
    } finally { setSaving(false) }
  }

  const toggleBlock = async (u: AdminUser) => {
    const willBlock = !u.isBlocked
    const ok = await confirmDialog({
      title: willBlock ? `Block ${nameOf(u)}?` : `Unblock ${nameOf(u)}?`,
      message: willBlock
        ? 'This user will lose access to the admin portal immediately.'
        : 'This will restore the user\'s access.',
      confirmText: willBlock ? 'Block' : 'Unblock',
      variant: willBlock ? 'danger' : 'default',
    })
    if (!ok) return
    try {
      await api.patch(`/admin/users/${u.id}/status`, { block: willBlock })
      await fetchUsers()
      if (editing?.id === u.id) setEditing(null)
    } catch (e: any) {
      alert({ variant: 'error', message: e.response?.data?.message ?? 'Action failed' })
    }
  }

  const resetPassword = async (u: AdminUser) => {
    const pw = await promptDialog({
      title: `Reset password for ${nameOf(u)}`,
      message: `Enter a new password (minimum ${PASSWORD_MIN_LENGTH} characters, letter + number).`,
      placeholder: 'New password',
      required: true,
      confirmText: 'Reset',
    })
    const pwError = pw ? passwordPolicy(pw) : null
    if (pwError) {
      if (pw !== null) alert({ variant: 'error', message: pwError })
      return
    }
    try {
      await api.post(`/admin/users/${u.id}/reset-password`, { newPassword: pw })
      alert({ variant: 'success', message: 'Password reset successfully.' })
    } catch (e: any) {
      alert({ variant: 'error', message: e.response?.data?.message ?? 'Failed to reset password' })
    }
  }

  const handleAdd = async () => {
    const pwError = addForm.password ? passwordPolicy(addForm.password) : 'Password is required.'
    if (pwError) {
      alert({ variant: 'error', message: pwError }); return
    }
    if (!addForm.role) { alert({ variant: 'error', message: 'Select a role.' }); return }
    setAdding(true)
    try {
      await api.post('/admin/users', {
        fullName: addForm.fullName.trim() || null,
        email: addForm.email.trim() || null,
        phone: addForm.phone.trim() || null,
        password: addForm.password,
        role: addForm.role,
        allowedPages: [],
      })
      await fetchUsers()
      setShowAdd(false)
      setAddForm({ fullName: '', email: '', phone: '', password: '', role: 'CUSTOMER_SUPPORT' })
      alert({ variant: 'success', message: 'User created.' })
    } catch (e: any) {
      alert({ variant: 'error', message: e.response?.data?.message ?? 'Failed to create user' })
    } finally { setAdding(false) }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-brand-600">Access control</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Manage Users</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchUsers} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Refresh
          </Button>
          <Button onClick={() => setShowAdd(true)}><Plus className="mr-2 h-4 w-4" />Add user</Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">{error}</div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        {/* User table */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 p-4 dark:border-slate-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search users…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 sm:w-72"
              />
            </div>
          </div>

          {loading && users.length === 0 ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-brand-600" /></div>
          ) : (
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
                  {users.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">No users found.</td></tr>
                  )}
                  {users.map((u) => (
                    <tr key={u.id} className={`transition hover:bg-slate-50 dark:hover:bg-slate-800/50 ${editing?.id === u.id ? 'bg-brand-50 dark:bg-brand-950/20' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${ROLE_COLORS[u.role]}`}>{nameOf(u).charAt(0).toUpperCase()}</div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-900 dark:text-slate-100">{nameOf(u)}</p>
                            <p className="truncate text-xs text-slate-400">{u.email || u.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${ROLE_COLORS[u.role]}`}>{ROLE_LABELS[u.role]}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {u.role === 'SUPER_ADMIN'
                          ? <span className="flex items-center gap-1 text-brand-600 font-semibold"><Shield className="h-3.5 w-3.5" />All pages</span>
                          : `${u.allowedPages.length} pages`}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={u.status === 'ACTIVE' ? 'success' : 'default'}>
                          {u.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{formatDate(u.lastLogin)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {u.role !== 'SUPER_ADMIN' ? (
                            <>
                              <button title="Edit permissions" onClick={() => openEdit(u)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 transition">
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button title={u.isBlocked ? 'Unblock' : 'Block'} onClick={() => toggleBlock(u)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 transition">
                                {u.isBlocked ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Ban className="h-4 w-4" />}
                              </button>
                              <button title="Reset password" onClick={() => resetPassword(u)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 transition">
                                <KeyRound className="h-4 w-4" />
                              </button>
                            </>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Permission editor modal */}
        {editing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => !saving && setEditing(null)}>
            <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Edit permissions</h2>
                <button onClick={() => setEditing(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-5 w-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Editing permissions for</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">{nameOf(editing)}</p>
                  <span className={`inline-block mt-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${ROLE_COLORS[editing.role]}`}>{ROLE_LABELS[editing.role]}</span>
                </div>

                {/* Role selector */}
                <div>
                  <Label className="mb-1.5 block text-xs font-medium text-slate-500">Role</Label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as Role)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  >
                    {roleOptions.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>

                {editRole === 'SUPER_ADMIN' ? (
                  <p className="text-xs text-slate-500">Super Admins have access to all pages automatically.</p>
                ) : (
                  <>
                    <p className="text-xs text-slate-500">Tick the pages this user can access. Unticked pages will be hidden from their sidebar.</p>
                    <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                      {allPages.map(({ route, label }) => (
                        <label key={route} className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3 transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
                          <input
                            type="checkbox"
                            checked={editPages.includes(route)}
                            onChange={() => togglePage(route)}
                            className="h-4 w-4 rounded border-slate-300 accent-brand-600"
                          />
                          <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{label}</span>
                          <span className="ml-auto font-mono text-xs text-slate-400">{route}</span>
                        </label>
                      ))}
                    </div>
                  </>
                )}

                <div className="flex gap-3 pt-2">
                  <Button className="flex-1" onClick={saveEdit} disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Save changes
                  </Button>
                  <Button variant="outline" onClick={() => setEditing(null)} disabled={saving}>Cancel</Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add user dialog */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => !adding && setShowAdd(false)}>
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Add staff user</h2>
              <button onClick={() => setShowAdd(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <Label htmlFor="add-name">Full name</Label>
                <Input id="add-name" value={addForm.fullName} onChange={(e) => setAddForm({ ...addForm, fullName: e.target.value })} placeholder="Aster Bekele" />
              </div>
              <div>
                <Label htmlFor="add-email">Email (used to log in)</Label>
                <Input id="add-email" type="email" value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} placeholder="name@emastore.et" />
              </div>
              <div>
                <Label htmlFor="add-phone">Phone <span className="text-slate-400">(optional)</span></Label>
                <Input id="add-phone" value={addForm.phone} onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })} placeholder="+2519..." />
              </div>
              <div>
                <Label htmlFor="add-role">Role</Label>
                <select
                  id="add-role"
                  value={addForm.role}
                  onChange={(e) => setAddForm({ ...addForm, role: e.target.value as Role })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  {roleOptions.map((r) => (<option key={r.value} value={r.value}>{r.label}</option>))}
                </select>
              </div>
              <div>
                <Label htmlFor="add-pw">Password</Label>
                <Input id="add-pw" type="password" value={addForm.password} onChange={(e) => setAddForm({ ...addForm, password: e.target.value })} placeholder={`At least ${PASSWORD_MIN_LENGTH} chars, letter + number`} />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAdd(false)} disabled={adding}>Cancel</Button>
              <Button onClick={handleAdd} disabled={adding}>
                {adding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Create user
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
