import { useCallback, useEffect, useState } from 'react'
import {
  Bike, CheckCircle2, Clock, Copy, Eye, KeyRound, Loader2, MapPin, MoreHorizontal,
  Phone, Plus, RefreshCw, Search, UserX, UserCheck, AlertCircle,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatsCard } from '@/components/ui/StatsCard'
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
  const [tab, setTab]                 = useState<'riders' | 'fees'>('riders')

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
      <PageHeader
        eyebrow="Ride management"
        title="Ride & Delivery Riders"
        actions={
          <>
            <Button variant="outline" onClick={fetchAgents} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Refresh
            </Button>
            <Button onClick={() => setShowAdd(true)}>
              <Plus className="mr-2 h-4 w-4" />Add rider
            </Button>
          </>
        }
      />

      {/* Tabs */}
      <div className="flex gap-2">
        {([
          { key: 'riders' as const, label: 'Riders' },
          { key: 'fees' as const, label: 'Delivery Fees' },
        ]).map((t) => (
          <button key={t.key} type="button" onClick={() => setTab(t.key)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${tab === t.key ? 'bg-brand-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'fees' ? (
        <DeliveryFeePanel />
      ) : (
      <>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon, tone }) => (
          <StatsCard
            key={label}
            label={label}
            value={value}
            icon={Icon}
            iconClassName={tone === 'info' ? 'text-sky-600' : 'text-emerald-600'}
            iconBgClassName={tone === 'info' ? 'bg-sky-50 dark:bg-sky-950/40' : 'bg-emerald-50 dark:bg-emerald-950/40'}
            loading={loading && agents.length === 0}
          />
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
      </>
      )}

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

// ── Shared bits ───────────────────────────────────────────────────────────────

function ModalShell({ children, onClose, wide }: { children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        className={`w-full ${wide ? 'max-w-lg' : 'max-w-md'} max-h-[90vh] overflow-y-auto rounded-t-3xl bg-white shadow-2xl dark:bg-slate-900 sm:rounded-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1 mt-5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
      {children}
    </p>
  )
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-right text-sm font-semibold text-slate-900 dark:text-slate-100">
        {value ?? <span className="font-normal text-slate-300 dark:text-slate-600">—</span>}
      </span>
    </div>
  )
}

function StatusPill({ ok, okText, badText }: { ok: boolean; okText: string; badText: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
      ok
        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
        : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
    }`}>
      <span className={`h-1.5 w-1.5 rounded-full ${ok ? 'bg-emerald-500' : 'bg-slate-400'}`} />
      {ok ? okText : badText}
    </span>
  )
}

// ── Rider Details Modal ───────────────────────────────────────────────────────

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
    <ModalShell onClose={onClose} wide>
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-slate-100 p-5 dark:border-slate-800">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-xl font-extrabold text-white shadow-md">
          {agent.fullName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-bold text-slate-900 dark:text-slate-100">{agent.fullName}</h2>
          <p className="font-mono text-xs text-slate-400">{agent.agentCode}</p>
        </div>
        <button type="button" onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800">
          ✕
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center gap-3 py-14">
          <Loader2 className="h-7 w-7 animate-spin text-brand-600" />
          <p className="text-sm text-slate-400">Loading rider profile…</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-14">
          <AlertCircle className="h-8 w-8 text-red-400" />
          <p className="text-sm text-red-500">{error}</p>
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
        </div>
      ) : d ? (
        <div className="px-5 pb-5">
          {/* Status + stats */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <StatusPill ok={d.isOnline} okText="Online now" badText="Offline" />
            <StatusPill ok={d.isActive} okText="Account active" badText="Deactivated" />
            <StatusPill ok={d.approvalStatus === 'APPROVED'} okText="Approved" badText={d.approvalStatus || 'Pending'} />
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { label: 'Completed', value: d.completedDeliveries, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300' },
              { label: 'Active now', value: d.activeDeliveries, icon: Bike, color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/40 dark:text-sky-300' },
              { label: 'Today', value: d.deliveriesToday, icon: Clock, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300' },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-slate-100 p-3 text-center dark:border-slate-800">
                <span className={`mx-auto flex h-8 w-8 items-center justify-center rounded-lg ${s.color}`}>
                  <s.icon className="h-4 w-4" />
                </span>
                <p className="mt-1.5 text-lg font-bold text-slate-900 dark:text-slate-100">{s.value}</p>
                <p className="text-[11px] text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Sections */}
          <SectionTitle>Contact</SectionTitle>
          <div className="rounded-xl border border-slate-100 px-4 dark:border-slate-800">
            <DetailRow label="Phone" value={d.phone} />
            <DetailRow label="Joined" value={formatDate(d.createdAt)} />
            <DetailRow label="Last seen" value={timeAgo(d.lastLocationAt)} />
            <DetailRow label="Last delivery" value={formatDate(d.lastDeliveryAt)} />
          </div>

          <SectionTitle>Vehicle & license</SectionTitle>
          <div className="rounded-xl border border-slate-100 px-4 dark:border-slate-800">
            <DetailRow label="Vehicle" value={d.vehicleType} />
            <DetailRow label="Plate number" value={d.plateNumber} />
            <DetailRow label="License number" value={d.licenseNumber} />
            <DetailRow label="National ID" value={d.nationalId} />
          </div>

          <SectionTitle>Emergency contact</SectionTitle>
          <div className="rounded-xl border border-slate-100 px-4 dark:border-slate-800">
            <DetailRow label="Contact" value={d.emergencyContact} />
            <DetailRow label="National ID" value={d.emergencyNationalId} />
          </div>

          <SectionTitle>Location</SectionTitle>
          <div className="rounded-xl border border-slate-100 px-4 dark:border-slate-800">
            <DetailRow
              label="Last GPS"
              value={d.lastLat != null && d.lastLng != null
                ? <span className="font-mono text-xs">{d.lastLat.toFixed(5)}, {d.lastLng.toFixed(5)}</span>
                : null}
            />
          </div>

          {/* Password note */}
          <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/50 dark:bg-amber-950/30">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-300">
              Passwords are stored hashed and cannot be viewed. Use <span className="font-semibold">"Reset password"</span> from the rider's menu to set a new one.
            </p>
          </div>

          <div className="mt-4 flex justify-end">
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        </div>
      ) : null}
    </ModalShell>
  )
}

// ── Reset Password Modal ──────────────────────────────────────────────────────

function ResetPasswordModal({ agent, onClose }: { agent: RideAgent; onClose: () => void }) {
  const alert = useAlert()
  const [customPassword, setCustomPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

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

  const copyPassword = async () => {
    if (!result) return
    try {
      await navigator.clipboard.writeText(result)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (_) {
      alert({ variant: 'error', message: 'Could not copy — select and copy manually' })
    }
  }

  return (
    <ModalShell onClose={onClose}>
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-slate-100 p-5 dark:border-slate-800">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md">
          <KeyRound className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Reset password</h2>
          <p className="truncate text-xs text-slate-400">
            {agent.fullName} · <span className="font-mono">{agent.agentCode}</span>
          </p>
        </div>
        <button type="button" onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800">
          ✕
        </button>
      </div>

      <div className="p-5">
        {result ? (
          /* Success state */
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-slate-100">Password reset</h3>
            <p className="mt-1 text-sm text-slate-500">New password for {agent.fullName} — shown only once:</p>

            <button type="button" onClick={copyPassword}
              className="mt-4 flex w-full items-center justify-between gap-3 rounded-xl border-2 border-dashed border-brand-300 bg-brand-50 px-4 py-3.5 font-mono text-base font-bold tracking-wider text-brand-800 transition hover:border-brand-400 hover:bg-brand-100 dark:border-brand-800 dark:bg-brand-950/40 dark:text-brand-200">
              {result}
              {copied
                ? <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                : <Copy className="h-5 w-5" />}
            </button>
            {copied && <p className="mt-1.5 text-xs font-semibold text-emerald-600">Copied to clipboard</p>}

            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-left dark:border-amber-900/50 dark:bg-amber-950/30">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-300">
                Share this password with the rider securely. They must use it on their next sign-in — it cannot be viewed again.
              </p>
            </div>

            <Button className="mt-4 w-full" onClick={onClose}>Done</Button>
          </div>
        ) : (
          /* Form state */
          <>
            <div className="mt-1 flex items-start gap-2.5 rounded-xl border border-sky-200 bg-sky-50 p-3 dark:border-sky-900/50 dark:bg-sky-950/30">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" />
              <p className="text-xs leading-relaxed text-sky-700 dark:text-sky-300">
                This immediately replaces the rider's current password. Their existing sessions stay valid until they sign in again.
              </p>
            </div>

            <div className="mt-4">
              <Label htmlFor="newPassword">New password (optional)</Label>
              <Input id="newPassword" type="text" value={customPassword}
                onChange={(e) => setCustomPassword(e.target.value)}
                placeholder="Leave empty to auto-generate" className="mt-1.5" minLength={6} />
              <p className="mt-1.5 text-xs text-slate-400">Minimum 6 characters. A secure temporary password is generated if left blank.</p>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
              <Button onClick={submit} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
                Reset password
              </Button>
            </div>
          </>
        )}
      </div>
    </ModalShell>
  )
}

// ── Delivery Fee Settings Panel ───────────────────────────────────────────────

interface FeeSettings {
  baseFeeCents: number
  freeKm: number
  perKmCents: number
  freeWeightGrams: number
  perKgCents: number
  fragileSurchargeCents: number
  bulkyMultiplier: number
  defaultKm: number
  roadFactor: number
  minFeeCents: number
  maxFeeCents: number
  serviceFeeCents: number
  serviceFeeExtraLegPct: number
  partnerCommissionPct: number
  riderCommissionPct: number
}

function DeliveryFeePanel() {
  const alert = useAlert()
  const [s, setS] = useState<FeeSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/admin/delivery-fee')
      .then((res) => setS(res.data.settings))
      .catch((err: any) => alert({ variant: 'error', message: err.response?.data?.message ?? 'Failed to load fee settings' }))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-brand-600" /></div>
  }
  if (!s) return null

  const set = (k: keyof FeeSettings) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setS({ ...s, [k]: e.target.value === '' ? 0 : Number(e.target.value) })

  // Display helper: cents fields shown in whole birr.
  const birr = (cents?: number) => (cents ?? 0) / 100

  const save = async () => {
    setSaving(true)
    try {
      const res = await api.put('/admin/delivery-fee', {
        baseFeeCents: s.baseFeeCents,
        freeKm: s.freeKm,
        perKmCents: s.perKmCents,
        freeWeightGrams: s.freeWeightGrams,
        perKgCents: s.perKgCents,
        fragileSurchargeCents: s.fragileSurchargeCents,
        bulkyMultiplier: s.bulkyMultiplier,
        defaultKm: s.defaultKm,
        roadFactor: s.roadFactor,
        minFeeCents: s.minFeeCents,
        maxFeeCents: s.maxFeeCents,
        serviceFeeCents: s.serviceFeeCents,
        serviceFeeExtraLegPct: s.serviceFeeExtraLegPct,
        partnerCommissionPct: s.partnerCommissionPct,
        riderCommissionPct: s.riderCommissionPct,
      })
      setS(res.data.settings)
      alert({ variant: 'success', message: 'Delivery fee settings saved' })
    } catch (err: any) {
      alert({ variant: 'error', message: err.response?.data?.message ?? 'Failed to save settings' })
    } finally {
      setSaving(false)
    }
  }

  const Field = ({ label, k, suffix, step }: { label: string; k: keyof FeeSettings; suffix?: string; step?: string }) => (
    <div>
      <Label className="text-xs text-slate-500">{label}</Label>
      <div className="mt-1 flex items-center gap-2">
        <Input type="number" step={step ?? '1'} value={s[k] as number} onChange={set(k)} className="w-32" />
        {suffix && <span className="text-xs text-slate-400">{suffix}</span>}
      </div>
    </div>
  )

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Formula explainer */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-1">
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">How the fee is calculated</h2>
        <div className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
          <p><span className="font-semibold">fee = base + km×rate + kg×rate + fragile − caps</span></p>
          <ul className="list-disc space-y-1 pl-5 text-xs text-slate-500">
            <li>Distance: shop pin → customer pin (or subcity estimate), road factor applied.</li>
            <li>Weight &amp; material guessed from product names (no extra fields needed).</li>
            <li>Customer pays the fee + a flat service fee at checkout; the rider earns the fee minus their commission.</li>
            <li>Coupons discount products only — never the delivery fee.</li>
          </ul>
        </div>
        <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-500 dark:bg-slate-800/60">
          Example: phone order, 4 km trip, 0.3 kg → base {birr(s.baseFeeCents)} + {(4 - s.freeKm).toFixed(1)} km × {birr(s.perKmCents)} + fragile {birr(s.fragileSurchargeCents)} ≈ <span className="font-bold text-slate-700 dark:text-slate-200">{birr(Math.min(s.maxFeeCents, Math.max(s.minFeeCents, s.baseFeeCents + Math.max(0, 4 - s.freeKm) * s.perKmCents + s.fragileSurchargeCents)))} ETB</span>
        </div>
      </div>

      {/* Settings form */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Rates</h2>

        <p className="mt-4 text-xs font-bold uppercase tracking-wide text-slate-400">Base &amp; distance</p>
        <div className="mt-2 grid gap-4 sm:grid-cols-3">
          <Field label="Base fee (cents)" k="baseFeeCents" suffix={`= ${birr(s.baseFeeCents)} ETB`} />
          <Field label="Free distance (km)" k="freeKm" step="0.5" />
          <Field label="Per km (cents)" k="perKmCents" suffix={`= ${birr(s.perKmCents)} ETB/km`} />
          <Field label="Default km (no pin)" k="defaultKm" step="0.5" />
          <Field label="Road factor" k="roadFactor" step="0.05" />
        </div>

        <p className="mt-5 text-xs font-bold uppercase tracking-wide text-slate-400">Weight &amp; material</p>
        <div className="mt-2 grid gap-4 sm:grid-cols-3">
          <Field label="Free weight (grams)" k="freeWeightGrams" step="500" />
          <Field label="Per kg (cents)" k="perKgCents" suffix={`= ${birr(s.perKgCents)} ETB/kg`} />
          <Field label="Fragile surcharge (cents)" k="fragileSurchargeCents" suffix={`= ${birr(s.fragileSurchargeCents)} ETB/item`} />
          <Field label="Bulky multiplier" k="bulkyMultiplier" step="0.1" />
        </div>

        <p className="mt-5 text-xs font-bold uppercase tracking-wide text-slate-400">Limits</p>
        <div className="mt-2 grid gap-4 sm:grid-cols-3">
          <Field label="Min fee (cents)" k="minFeeCents" suffix={`= ${birr(s.minFeeCents)} ETB`} />
          <Field label="Max fee (cents)" k="maxFeeCents" suffix={`= ${birr(s.maxFeeCents)} ETB`} />
        </div>

        <p className="mt-5 text-xs font-bold uppercase tracking-wide text-slate-400">Platform commissions</p>
        <div className="mt-2 grid gap-4 sm:grid-cols-3">
          <Field label="Service fee — 1st shop (cents)" k="serviceFeeCents" suffix={`= ${birr(s.serviceFeeCents)} ETB · paid by customer`} />
          <Field label="Extra shop leg (%)" k="serviceFeeExtraLegPct" step="5" suffix="% of base fee per additional shop" />
          <Field label="Partner commission (%)" k="partnerCommissionPct" step="0.1" suffix="% of product subtotal" />
          <Field label="Rider commission (%)" k="riderCommissionPct" step="0.1" suffix="% of delivery fee" />
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Example (phone, 15,000 ETB + 128 ETB fee): platform keeps ≈ {birr(s.serviceFeeCents + Math.round(15000 * s.partnerCommissionPct / 100) + Math.round(12800 * s.riderCommissionPct / 100))} ETB
        </p>

        <div className="mt-6 flex justify-end gap-2">
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
            Save rates
          </Button>
        </div>
      </div>
    </div>
  )
}
