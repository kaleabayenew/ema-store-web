import { useCallback, useEffect, useState } from 'react'
import {
  Bike, CheckCircle2, Clock, Copy, Eye, KeyRound, Loader2, MapPin, MoreHorizontal,
  Phone, Plus, RefreshCw, Search, UserX, UserCheck, AlertCircle,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAlert } from '@/components/ui/ConfirmDialog'
import api from '@/lib/api'

// ── Types ─────────────────────────────────────────────────────────────────────

interface RideAgent {
  id: string
  agentCode: string
  fullName: string
  phone: string | null
  isActive: boolean
  createdAt: string
  completedDeliveries: number
  activeDeliveries: number
  deliveriesToday: number
  lastDeliveryAt: string | null
  isOnline: boolean
  lastLocationAt: string | null
  lastLat: number | null
  lastLng: number | null
}

interface RideStats {
  totalRiders: number
  activeRiders: number
  onlineRiders: number
  deliveriesToday: number
  completedDeliveries: number
}

type StatusFilter = 'All' | 'ONLINE' | 'ACTIVE' | 'INACTIVE' | 'ON_DELIVERY'

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-ET', { day: 'numeric', month: 'short', year: 'numeric' })
}

function timeAgo(iso: string | null) {
  if (!iso) return 'never'
  const secs = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000))
  if (secs < 60) return `${secs}s ago`
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function agentStatus(a: RideAgent): 'ACTIVE' | 'INACTIVE' | 'ON_DELIVERY' {
  if (!a.isActive) return 'INACTIVE'
  if (a.activeDeliveries > 0) return 'ON_DELIVERY'
  return 'ACTIVE'
}

const statusVariant: Record<string, 'success' | 'warning' | 'info' | 'default'> = {
  ACTIVE: 'success', ON_DELIVERY: 'info', INACTIVE: 'default',
}
const statusLabel: Record<string, string> = {
  ONLINE: 'Online now', ACTIVE: 'Available', ON_DELIVERY: 'On delivery', INACTIVE: 'Inactive',
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function RidePage() {
  const alert = useAlert()
  const [agents, setAgents]   = useState<RideAgent[]>([])
  const [stats, setStats]     = useState<RideStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [search, setSearch]   = useState('')
  const [filter, setFilter]   = useState<StatusFilter>('All')
  const [showAdd, setShowAdd] = useState(false)
  const [viewAgent, setViewAgent]     = useState<RideAgent | null>(null)
  const [resetAgent, setResetAgent]   = useState<RideAgent | null>(null)

  const fetchAgents = useCallback(async () => {
    try {
      const res = await api.get('/admin/agents')
      setAgents(res.data.agents ?? [])
      setStats(res.data.stats ?? null)
      setError(null)
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to load riders')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAgents() }, [fetchAgents])

  // Auto-refresh every 10s so rider status stays live.
  useEffect(() => {
    const t = setInterval(() => fetchAgents(), 10000)
    return () => clearInterval(t)
  }, [fetchAgents])

  const filtered = agents.filter((a) => {
    const q = search.toLowerCase()
    const matchSearch =
      a.fullName.toLowerCase().includes(q) ||
      a.agentCode.toLowerCase().includes(q) ||
      (a.phone ?? '').includes(q)
    const matchFilter =
      filter === 'All' ||
      (filter === 'ONLINE' ? a.isOnline : agentStatus(a) === filter)
    return matchSearch && matchFilter
  })

  const busyAgents = agents.filter((a) => a.activeDeliveries > 0)

  const toggleStatus = async (a: RideAgent) => {
    try {
      await api.patch(`/admin/agents/${a.id}/status`, { isActive: !a.isActive })
      await fetchAgents()
    } catch (err: any) {
      alert({ variant: 'error', message: err.response?.data?.message ?? 'Action failed' })
    }
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    alert({ variant: 'success', message: `Agent code ${code} copied` })
  }

  if (loading && agents.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand-600" />
          <p className="mt-4 text-sm text-slate-500">Loading riders…</p>
        </div>
      </div>
    )
  }

  if (error && agents.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-red-500" />
          <p className="mt-4 text-sm text-slate-500">{error}</p>
          <Button variant="outline" className="mt-4" onClick={fetchAgents}>Retry</Button>
        </div>
      </div>
    )
  }

  const statCards = [
    { label: 'Riders online',    value: String(stats?.onlineRiders ?? agents.filter((a) => a.isOnline).length), delta: null, tone: 'success', icon: Bike },
    { label: 'Riders on delivery', value: String(stats?.activeRiders ?? busyAgents.length), delta: null,         tone: 'info',    icon: MapPin },
    { label: 'Deliveries today', value: String(stats?.deliveriesToday ?? 0),               delta: null,            tone: 'success', icon: Clock },
    { label: 'Completed total',  value: String(stats?.completedDeliveries ?? 0),            delta: null,            tone: 'success', icon: CheckCircle2 },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-brand-600">Ride management</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Ride & Delivery Riders</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchAgents} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh
          </Button>
          <Button onClick={() => setShowAdd(true)}>
            <Plus className="mr-2 h-4 w-4" />Add rider
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">{label}</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300"><Icon className="h-4 w-4" /></span>
            </div>
            <p className="mt-4 text-2xl font-semibold text-slate-900 dark:text-slate-100">{value}</p>
          </div>
        ))}
      </div>

      {/* Riders currently on delivery */}
      {busyAgents.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-brand-500" />
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Active deliveries</h2>
            <Badge variant="info">{busyAgents.length} rider{busyAgents.length === 1 ? '' : 's'}</Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {busyAgents.map((a) => (
              <div key={a.id} className="rounded-xl border border-sky-200 bg-sky-50 p-3 dark:border-sky-900 dark:bg-sky-950/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sky-700 dark:text-sky-300">{a.agentCode}</span>
                  <Badge variant="info">{a.activeDeliveries} order{a.activeDeliveries === 1 ? '' : 's'}</Badge>
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{a.fullName}</p>
                <p className="text-xs text-slate-500">{a.phone ?? 'No phone'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rider table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search rider, code or phone…" value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 sm:w-72" />
          </div>
          <div className="flex gap-2">
            {(['All', 'ONLINE', 'ACTIVE', 'ON_DELIVERY', 'INACTIVE'] as const).map((f) => (
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
                {['Rider', 'Agent code', 'Phone', 'Deliveries', 'Today', 'Last delivery', 'Status', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((a) => {
                const st = agentStatus(a)
                return (
                  <tr key={a.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-300">{a.fullName.charAt(0)}</div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100">{a.fullName}</p>
                          <p className="text-xs text-slate-400">Joined {formatDate(a.createdAt)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button type="button" onClick={() => copyCode(a.agentCode)} title="Copy agent code"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2 py-1 font-mono text-xs font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200">
                        {a.agentCode}<Copy className="h-3 w-3" />
                      </button>
                    </td>
                    <td className="px-4 py-3"><span className="flex items-center gap-1 text-slate-500"><Phone className="h-3 w-3" />{a.phone ?? '—'}</span></td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{a.completedDeliveries}</td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{a.deliveriesToday}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(a.lastDeliveryAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${a.isOnline ? 'animate-pulse bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`} title={a.isOnline ? 'Online — reporting location' : 'Offline'} />
                        <Badge variant={statusVariant[st]}>{statusLabel[st]}</Badge>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-400">
                        {a.isOnline ? 'Live now' : `Last seen ${timeAgo(a.lastLocationAt)}`}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => copyCode(a.agentCode)}>
                            <Copy className="mr-2 h-4 w-4" />Copy agent code
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setViewAgent(a)}>
                            <Eye className="mr-2 h-4 w-4" />View details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setResetAgent(a)}>
                            <KeyRound className="mr-2 h-4 w-4" />Reset password
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleStatus(a)}>
                            {a.isActive
                              ? <><UserX className="mr-2 h-4 w-4" />Deactivate rider</>
                              : <><UserCheck className="mr-2 h-4 w-4" />Activate rider</>}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-400">
                    {agents.length === 0 ? 'No riders yet — click "Add rider" to register one.' : 'No riders match your filters.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-200 px-4 py-3 text-sm text-slate-500 dark:border-slate-800">Showing {filtered.length} of {agents.length} riders</div>
      </div>

      {/* ── Add Rider Modal ── */}
      {showAdd && (
        <AddRiderModal
          onClose={() => setShowAdd(false)}
          onCreated={async () => { setShowAdd(false); await fetchAgents() }}
        />
      )}

      {/* ── Rider details modal ── */}
      {viewAgent && (
        <RiderDetailsModal agent={viewAgent} onClose={() => setViewAgent(null)} />
      )}

      {/* ── Reset password modal ── */}
      {resetAgent && (
        <ResetPasswordModal
          agent={resetAgent}
          onClose={() => setResetAgent(null)}
        />
      )}
    </div>
  )
}

// ── Add Rider Modal ───────────────────────────────────────────────────────────

function AddRiderModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const alert = useAlert()
  const [agentCode, setAgentCode] = useState('')
  const [fullName, setFullName]   = useState('')
  const [phone, setPhone]         = useState('')
  const [saving, setSaving]       = useState(false)

  const submit = async () => {
    if (!agentCode.trim() || !fullName.trim()) {
      alert({ variant: 'error', message: 'Agent code and full name are required' })
      return
    }
    setSaving(true)
    try {
      await api.post('/admin/agents', {
        agentCode: agentCode.trim().toUpperCase(),
        fullName: fullName.trim(),
        phone: phone.trim() || null,
      })
      alert({ variant: 'success', message: `Rider ${agentCode.trim().toUpperCase()} created — they can now sign in with this agent code` })
      onCreated()
    } catch (err: any) {
      alert({ variant: 'error', message: err.response?.data?.message ?? 'Failed to create rider' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Add rider</h2>
        <p className="mt-1 text-sm text-slate-500">
          The agent code is what the rider enters in the ride app (More → Agent code) and what partners scan at handover.
        </p>
        <div className="mt-5 space-y-4">
          <div>
            <Label htmlFor="agentCode">Agent code</Label>
            <Input id="agentCode" value={agentCode} onChange={(e) => setAgentCode(e.target.value.toUpperCase())}
              placeholder="e.g. RIDER-002" className="mt-1 font-mono" maxLength={40} />
          </div>
          <div>
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Abebe Kebede" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="phone">Phone (optional)</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 0911…" className="mt-1" />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Create rider
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Rider Details Modal ───────────────────────────────────────────────────────

interface AgentDetails {
  id: string
  agentCode: string
  fullName: string
  phone: string | null
  isActive: boolean
  createdAt: string
  nationalId: string | null
  licenseNumber: string | null
  vehicleType: string | null
  plateNumber: string | null
  emergencyContact: string | null
  emergencyNationalId: string | null
  approvalStatus: string
  isOnline: boolean
  lastLat: number | null
  lastLng: number | null
  lastLocationAt: string | null
  completedDeliveries: number
  activeDeliveries: number
  deliveriesToday: number
  lastDeliveryAt: string | null
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-right text-sm font-medium text-slate-900 dark:text-slate-100">{value ?? '—'}</span>
    </div>
  )
}

function RiderDetailsModal({ agent, onClose }: { agent: RideAgent; onClose: () => void }) {
  const [details, setDetails] = useState<AgentDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await api.get(`/admin/agents/${agent.id}`)
        if (!cancelled) setDetails(res.data.agent ?? null)
      } catch (err: any) {
        if (!cancelled) setError(err.response?.data?.message ?? 'Failed to load rider details')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [agent.id])

  const d = details
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Rider details</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>✕</Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-brand-600" /></div>
        ) : error ? (
          <p className="py-6 text-sm text-red-500">{error}</p>
        ) : d ? (
          <>
            {/* Live status strip */}
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
              <span className={`h-2.5 w-2.5 rounded-full ${d.isOnline ? 'animate-pulse bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {d.isOnline ? 'Online now' : 'Offline'}
              </span>
              <span className="ml-auto text-xs text-slate-400">Last seen {timeAgo(d.lastLocationAt)}</span>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                { label: 'Completed', value: d.completedDeliveries },
                { label: 'Active', value: d.activeDeliveries },
                { label: 'Today', value: d.deliveriesToday },
              ].map((s) => (
                <div key={s.label} className="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-800/60">
                  <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{s.value}</p>
                  <p className="text-[11px] text-slate-500">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
              <DetailRow label="Full name" value={d.fullName} />
              <DetailRow label="Agent code" value={<span className="font-mono">{d.agentCode}</span>} />
              <DetailRow label="Phone" value={d.phone} />
              <DetailRow label="Account status" value={d.isActive ? 'Active' : 'Deactivated'} />
              <DetailRow label="Approval" value={d.approvalStatus} />
              <DetailRow label="Vehicle" value={d.vehicleType} />
              <DetailRow label="Plate number" value={d.plateNumber} />
              <DetailRow label="License number" value={d.licenseNumber} />
              <DetailRow label="National ID" value={d.nationalId} />
              <DetailRow label="Emergency contact" value={d.emergencyContact} />
              <DetailRow label="Emergency national ID" value={d.emergencyNationalId} />
              <DetailRow label="Joined" value={formatDate(d.createdAt)} />
              <DetailRow label="Last delivery" value={formatDate(d.lastDeliveryAt)} />
              <DetailRow
                label="Last location"
                value={d.lastLat != null && d.lastLng != null
                  ? `${d.lastLat.toFixed(5)}, ${d.lastLng.toFixed(5)}`
                  : null}
              />
            </div>
          </>
        ) : null}

        <div className="mt-5 rounded-xl bg-slate-50 p-3 text-xs text-slate-500 dark:bg-slate-800/60">
          Passwords are stored hashed and cannot be viewed. Use "Reset password" from the rider's menu to set a new one.
        </div>

        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  )
}

// ── Reset Password Modal ──────────────────────────────────────────────────────

function ResetPasswordModal({ agent, onClose }: { agent: RideAgent; onClose: () => void }) {
  const alert = useAlert()
  const [customPassword, setCustomPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const submit = async () => {
    setSaving(true)
    try {
      const res = await api.post(`/admin/agents/${agent.id}/reset-password`, {
        password: customPassword.trim() || undefined,
      })
      setResult(res.data.temporaryPassword)
    } catch (err: any) {
      alert({ variant: 'error', message: err.response?.data?.message ?? 'Failed to reset password' })
    } finally {
      setSaving(false)
    }
  }

  const copyPassword = () => {
    if (!result) return
    navigator.clipboard.writeText(result)
    alert({ variant: 'success', message: 'Password copied' })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Reset password</h2>
        <p className="mt-1 text-sm text-slate-500">
          Set a new sign-in password for <span className="font-semibold">{agent.fullName}</span> ({agent.agentCode}).
        </p>

        {result ? (
          <div className="mt-5">
            <p className="text-sm text-slate-500">New password — shown only once, save it now:</p>
            <button type="button" onClick={copyPassword}
              className="mt-2 flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm font-bold text-slate-900 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
              {result}<Copy className="h-4 w-4" />
            </button>
            <p className="mt-2 text-xs text-amber-600">The rider must use this password on their next sign-in.</p>
          </div>
        ) : (
          <div className="mt-5">
            <Label htmlFor="newPassword">New password (optional)</Label>
            <Input id="newPassword" type="text" value={customPassword}
              onChange={(e) => setCustomPassword(e.target.value)}
              placeholder="Leave empty to auto-generate" className="mt-1" minLength={6} />
            <p className="mt-1 text-xs text-slate-400">Minimum 6 characters. A temporary password is generated if left blank.</p>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>Close</Button>
          {!result && (
            <Button onClick={submit} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
              Reset password
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
