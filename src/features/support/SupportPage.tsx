import { useCallback, useEffect, useRef, useState } from 'react'
import {
  MessageSquareText, CheckCircle2, Clock, AlertCircle,
  Search, Send, Loader2, RefreshCw, Settings,
  Phone, User, ShoppingBag, Wallet, CalendarDays, X,
  ShieldOff, ShieldCheck, Plus, Trash2, Edit2, MessageSquareDashed,
  History, ChevronLeft, ChevronRight, Filter,
  Check, CheckCheck, Bell,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { maxLength, required, validate } from '@/lib/validate'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { useAlert, useConfirm } from '@/components/ui/ConfirmDialog'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Ticket {
  id: string
  subject: string
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  customerName: string
  customerPhone: string
  guestId?: string | null
  isGuest?: boolean
  messageCount: number
  unreadCount: number
  createdAt: string
  updatedAt: string
}

interface Message {
  id: string
  body: string
  isStaff: boolean
  senderName: string
  sentAt: string
  readAt?: string | null
}

interface TicketDetail extends Ticket {
  customerEmail: string
  messages: Message[]
}

interface SupportSettings {
  welcomeMessage: string
  isAutoReplyEnabled: boolean
  quickStarters: string[]
}

interface DefaultMessage {
  id: string
  title: string
  body: string
  sortOrder: number
}

interface CustomerProfile {
  id: string
  fullName: string
  phone: string
  isActive: boolean
  isBlocked: boolean
  blockReason: string | null
  balance: number
  coins: number
  totalOrders: number
  totalSpent: number
  joinedAt: string
  avatarUrl: string | null
}

type FilterStatus = 'All' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'
type SettingsTab = 'chat' | 'defaults'

// ── History types ─────────────────────────────────────────────────────────────

interface HistoryTicket {
  id: string
  subject: string
  status: string
  priority: string
  customerName: string
  customerPhone: string
  totalMessages: number
  staffMessages: number
  customerMessages: number
  lastStaffName: string | null
  lastStaffAt: string | null
  createdAt: string
  updatedAt: string
}

interface StaffUser {
  id: string
  name: string
  role: string
  email: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'info' | 'default' | 'danger'> = {
  OPEN: 'warning', IN_PROGRESS: 'info', RESOLVED: 'success', CLOSED: 'default',
}
const PRIORITY_VARIANT: Record<string, 'danger' | 'warning' | 'info' | 'default'> = {
  URGENT: 'danger', HIGH: 'danger', MEDIUM: 'warning', LOW: 'default',
}

function statusLabel(s: string) {
  const m: Record<string, string> = { OPEN: 'Open', IN_PROGRESS: 'In progress', RESOLVED: 'Resolved', CLOSED: 'Closed' }
  return m[s] ?? s
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

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function formatCurrency(n: number) {
  return `ETB ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// ── Customer Profile Panel ─────────────────────────────────────────────────────

function CustomerProfilePanel({ phone, onClose }: { phone: string; onClose: () => void }) {
  const [profile, setProfile] = useState<CustomerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      setLoading(true); setError(null)
      try {
        const res = await api.get('/customers', { params: { search: phone, limit: 1 } })
        const customers: CustomerProfile[] = res.data.data?.customers ?? []
        const match = customers.find((c) => c.phone === phone) ?? customers[0] ?? null
        if (!match) setError('Customer not found for this phone number.')
        else setProfile(match)
      } catch { setError('Failed to load customer profile.') }
      finally { setLoading(false) }
    }
    run()
  }, [phone])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-3 dark:border-slate-800">
          <div className="flex items-center gap-2 text-white">
            <Phone className="h-4 w-4 opacity-80" />
            <span className="text-sm font-semibold">{phone}</span>
          </div>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-4">
          {loading && <div className="flex items-center justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-brand-600" /></div>}
          {error && !loading && (
            <div className="flex flex-col items-center gap-2 py-8 text-slate-400">
              <User className="h-8 w-8 opacity-40" />
              <p className="text-sm text-center">{error}</p>
            </div>
          )}
          {profile && !loading && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt={profile.fullName} className="h-14 w-14 rounded-full object-cover ring-2 ring-brand-200" />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-xl font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                    {profile.fullName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{profile.fullName}</p>
                  <p className="text-sm text-slate-500">{profile.phone}</p>
                  <div className="mt-1 flex gap-1.5">
                    {profile.isBlocked ? (
                      <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400"><ShieldOff className="h-3 w-3" /> Blocked</span>
                    ) : profile.isActive ? (
                      <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400"><ShieldCheck className="h-3 w-3" /> Active</span>
                    ) : (
                      <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">Inactive</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400"><ShoppingBag className="h-3.5 w-3.5" /><span className="text-xs">Orders</span></div>
                  <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">{profile.totalOrders}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400"><Wallet className="h-3.5 w-3.5" /><span className="text-xs">Total spent</span></div>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(profile.totalSpent)}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400"><Wallet className="h-3.5 w-3.5" /><span className="text-xs">Balance</span></div>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(profile.balance)}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400"><span className="text-xs">🪙</span><span className="text-xs">Coins</span></div>
                  <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">{profile.coins.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                <span>Joined {new Date(profile.joinedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              {profile.isBlocked && profile.blockReason && (
                <div className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-400">
                  <span className="font-medium">Block reason:</span> {profile.blockReason}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Default message form (add / edit) ─────────────────────────────────────────

function DefaultMessageForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<DefaultMessage>
  onSave: (data: { title: string; body: string }) => Promise<void>
  onCancel: () => void
}) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [body, setBody]   = useState(initial?.body ?? '')
  const [saving, setSaving] = useState(false)
  const [err, setErr]     = useState<string | null>(null)

  const handleSave = async () => {
    if (!title.trim() || !body.trim()) { setErr('Title and body are required'); return }
    const err = validate(
      required(title, 'Title'),
      maxLength(title, 100, 'Title'),
      required(body, 'Message body'),
      maxLength(body, 1000, 'Message body'),
    )
    if (err) { setErr(err); return }
    setSaving(true); setErr(null)
    try { await onSave({ title: title.trim(), body: body.trim() }) }
    catch (e: any) { setErr(e.response?.data?.message ?? 'Failed to save') }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-3">
      <div>
        <Label>Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Order delayed" autoFocus />
      </div>
      <div>
        <Label>Message body</Label>
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} placeholder="We apologise for the delay…" />
      </div>
      {err && <p className="text-xs text-red-500">{err}</p>}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={saving}>Cancel</Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save
        </Button>
      </div>
    </div>
  )
}

// ── Conversation History Tab (Super Admin only) ───────────────────────────────

function ConversationHistoryTab({ onOpenTicket }: { onOpenTicket: (id: string) => void }) {
  const [tickets, setTickets]       = useState<HistoryTicket[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [total, setTotal]           = useState(0)
  const [page, setPage]             = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Filters
  const [search, setSearch]         = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [staffId, setStaffId]       = useState('')
  const [dateFrom, setDateFrom]     = useState('')
  const [dateTo, setDateTo]         = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const [staffList, setStaffList]   = useState<StaffUser[]>([])

  useEffect(() => {
    api.get('/support/staff-users')
      .then((r) => setStaffList(r.data.staff ?? []))
      .catch(() => {})
  }, [])

  const fetchHistory = useCallback(async (p = 1) => {
    setLoading(true); setError(null)
    try {
      const res = await api.get('/support/conversation-history', {
        params: {
          page: p, limit: 20,
          search: search || undefined,
          status: statusFilter || undefined,
          staffId: staffId || undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
        },
      })
      setTickets(res.data.tickets ?? [])
      setTotal(res.data.total ?? 0)
      setTotalPages(res.data.totalPages ?? 1)
      setPage(p)
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Failed to load history')
    } finally { setLoading(false) }
  }, [search, statusFilter, staffId, dateFrom, dateTo])

  useEffect(() => { fetchHistory(1) }, [fetchHistory])

  const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'info' | 'default'> = {
    OPEN: 'warning', IN_PROGRESS: 'info', RESOLVED: 'success', CLOSED: 'default',
  }
  function statusLabel(s: string) {
    return { OPEN: 'Open', IN_PROGRESS: 'In progress', RESOLVED: 'Resolved', CLOSED: 'Closed' }[s] ?? s
  }
  function timeAgoShort(iso: string) {
    if (!iso) return '—'
    const diff = Date.now() - new Date(iso).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1) return 'Just now'
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search subject or customer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowFilters((v) => !v)}>
          <Filter className="mr-2 h-4 w-4" />Filters
          {(statusFilter || staffId || dateFrom || dateTo) && (
            <span className="ml-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">
              {[statusFilter, staffId, dateFrom || dateTo].filter(Boolean).length}
            </span>
          )}
        </Button>
        <Button variant="outline" size="sm" onClick={() => fetchHistory(1)} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Status */}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="">All statuses</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
            {/* Staff member */}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Staff member</label>
              <select
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="">All staff</option>
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            {/* Date from */}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">From date</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
            {/* Date to */}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">To date</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={() => { setStatusFilter(''); setStaffId(''); setDateFrom(''); setDateTo('') }}
            className="mt-3 text-xs text-slate-400 hover:text-brand-600 transition"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Summary */}
      {!loading && (
        <p className="text-xs text-slate-400">
          {total.toLocaleString()} conversation{total !== 1 ? 's' : ''} found
        </p>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {error && (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400">{error}</div>
        )}
        {loading && tickets.length === 0 ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-brand-600" /></div>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-slate-400">
            <History className="h-8 w-8 opacity-30" />
            <p className="text-sm">No conversations found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left dark:border-slate-800">
                  {['Subject', 'Customer', 'Status', 'Messages', 'Last replied by', 'Updated'].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {tickets.map((t) => (
                  <tr
                    key={t.id}
                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                    onClick={() => onOpenTicket(t.id)}
                  >
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100 max-w-[200px] truncate">
                      {t.subject}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-700 dark:text-slate-200">{t.customerName}</p>
                      {t.customerPhone && <p className="text-xs text-slate-400">{t.customerPhone}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_VARIANT[t.status] ?? 'default'}>{statusLabel(t.status)}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="rounded-full bg-brand-50 px-2 py-0.5 text-brand-700 dark:bg-brand-950/30 dark:text-brand-300">
                          {t.staffMessages} staff
                        </span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          {t.customerMessages} customer
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {t.lastStaffName ?? <span className="text-slate-400 italic">No reply yet</span>}
                      {t.lastStaffAt && <p className="text-xs text-slate-400">{timeAgoShort(t.lastStaffAt)}</p>}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">{timeAgoShort(t.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 dark:border-slate-800">
            <p className="text-xs text-slate-400">Page {page} of {totalPages}</p>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => fetchHistory(page - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages || loading} onClick={() => fetchHistory(page + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function SupportPage() {
  const { user } = useAuthStore()
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'
  const confirmDialog = useConfirm()
  const alert = useAlert()

  // Top-level page tab: tickets | history (super admin only)
  const [pageTab, setPageTab] = useState<'tickets' | 'history'>('tickets')

  const [tickets, setTickets]     = useState<Ticket[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [search, setSearch]       = useState('')
  const [filter, setFilter]       = useState<FilterStatus>('All')
  const [stats, setStats]         = useState({ total: 0, open: 0, inProgress: 0, resolved: 0 })

  const [selected, setSelected]             = useState<TicketDetail | null>(null)
  const [detailLoading, setDetailLoading]   = useState(false)
  const [reply, setReply]                   = useState('')
  const [sending, setSending]               = useState(false)
  const [changingStatus, setChangingStatus] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const replyRef       = useRef<HTMLInputElement>(null)

  // Typing indicator (customer typing)
  const [customerTyping, setCustomerTyping] = useState(false)
  const typingPollRef   = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastTypingSentRef = useRef<number>(0)
  const openTicketIdRef = useRef<string | null>(null)

  // / autocomplete
  const [showSlash, setShowSlash]       = useState(false)
  const [slashFilter, setSlashFilter]   = useState('')
  const [slashIndex, setSlashIndex]     = useState(0)

  // Customer profile panel
  const [profilePhone, setProfilePhone] = useState<string | null>(null)

  // Settings
  const [showSettings, setShowSettings]     = useState(false)
  const [settingsTab, setSettingsTab]       = useState<SettingsTab>('chat')
  const [settings, setSettings]             = useState<SupportSettings>({
    welcomeMessage: 'Hello! 👋 Welcome to Ema Store customer support. How can we help you today?',
    isAutoReplyEnabled: true,
    quickStarters: ['Track my order', 'Payment issue', 'Return item', 'Speak to agent'],
  })
  const [savingSettings, setSavingSettings] = useState(false)

  // Default messages
  const [defaultMsgs, setDefaultMsgs]         = useState<DefaultMessage[]>([])
  const [defaultMsgsLoading, setDefaultMsgsLoading] = useState(false)
  const [showMsgForm, setShowMsgForm]         = useState(false)
  const [editingMsg, setEditingMsg]           = useState<DefaultMessage | null>(null)

  // ── Fetch helpers ────────────────────────────────────────────────────────────

  const fetchTickets = useCallback(async (silent = false) => {
    if (!silent) { setLoading(true); setError(null) }
    try {
      const res = await api.get('/support', { params: { search, status: filter === 'All' ? undefined : filter, limit: 50 } })
      setTickets(res.data.tickets ?? [])
      setStats({ total: res.data.total ?? 0, open: res.data.open ?? 0, inProgress: res.data.inProgress ?? 0, resolved: res.data.resolved ?? 0 })
    } catch (err: any) {
      if (!silent) setError(err.response?.data?.message ?? 'Failed to load tickets')
    } finally { if (!silent) setLoading(false) }
  }, [search, filter])

  useEffect(() => { fetchTickets() }, [fetchTickets])

  const fetchSettings = useCallback(async () => {
    try { const res = await api.get('/support/settings'); setSettings(res.data.data) }
    catch (e) { console.error('Failed to fetch settings', e) }
  }, [])
  useEffect(() => { fetchSettings() }, [fetchSettings])

  // Poll for new tickets/messages every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTickets(true)
    }, 5000)
    return () => clearInterval(interval)
  }, [fetchTickets])

  const fetchDefaultMsgs = useCallback(async () => {
    setDefaultMsgsLoading(true)
    try { const res = await api.get('/support/default-messages'); setDefaultMsgs(res.data.messages ?? []) }
    catch (e) { console.error('Failed to fetch default messages', e) }
    finally { setDefaultMsgsLoading(false) }
  }, [])
  useEffect(() => { fetchDefaultMsgs() }, [fetchDefaultMsgs])

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => fetchTickets(), search ? 400 : 0)
    return () => clearTimeout(t)
    // eslint-disable-next-line
  }, [search])

  useEffect(() => {
    if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
  }, [selected?.messages])

  // ── Slash autocomplete filtered list ─────────────────────────────────────────

  const filteredSlash = slashFilter
    ? defaultMsgs.filter((m) =>
        m.title.toLowerCase().includes(slashFilter.toLowerCase()) ||
        m.id.toLowerCase().startsWith(slashFilter.toLowerCase())
      )
    : defaultMsgs

  // ── Reply input handler ──────────────────────────────────────────────────────

  function handleReplyChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setReply(val)

    // Broadcast admin typing (throttled — at most once every 2s)
    if (selected && Date.now() - lastTypingSentRef.current > 2000) {
      lastTypingSentRef.current = Date.now()
      api.post(`/support/${selected.id}/typing`, { isStaff: true }).catch(() => {})
    }

    if (val.startsWith('/')) {
      setShowSlash(true)
      setSlashFilter(val.slice(1))
      setSlashIndex(0)
    } else {
      setShowSlash(false)
      setSlashFilter('')
    }
  }

  function selectSlashMsg(msg: DefaultMessage) {
    setReply(msg.body)
    setShowSlash(false)
    setSlashFilter('')
    replyRef.current?.focus()
  }

  function handleReplyKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (showSlash) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSlashIndex((i) => Math.min(i + 1, filteredSlash.length - 1)) }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setSlashIndex((i) => Math.max(i - 1, 0)) }
      else if (e.key === 'Enter') {
        e.preventDefault()
        if (filteredSlash[slashIndex]) selectSlashMsg(filteredSlash[slashIndex])
      } else if (e.key === 'Escape') { setShowSlash(false) }
      return
    }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply() }
  }

  // ── Ticket actions ───────────────────────────────────────────────────────────

  async function openTicket(ticket: Ticket) {
    setSelected({ ...ticket, customerEmail: '', messages: [] })
    setDetailLoading(true)
    setCustomerTyping(false)
    openTicketIdRef.current = ticket.id
    try {
      const res = await api.get<{ ticket: TicketDetail }>(`/support/${ticket.id}`)
      setSelected(res.data.ticket)
      // Mark customer messages as read (admin has seen them)
      api.post(`/support/${ticket.id}/read`, {}).catch(() => {})
      startTypingPoll(ticket.id)
    } catch { } finally { setDetailLoading(false) }
  }

  // Called from history tab — fetch ticket by id and switch to tickets tab
  async function openTicketById(id: string) {
    setPageTab('tickets')
    setDetailLoading(true)
    setCustomerTyping(false)
    openTicketIdRef.current = id
    try {
      const res = await api.get<{ ticket: TicketDetail }>(`/support/${id}`)
      setSelected(res.data.ticket)
      api.post(`/support/${id}/read`, {}).catch(() => {})
      startTypingPoll(id)
    } catch { } finally { setDetailLoading(false) }
  }

  // Poll customer typing status and new messages for the open ticket
  function startTypingPoll(ticketId: string) {
    if (typingPollRef.current) clearInterval(typingPollRef.current)
    typingPollRef.current = setInterval(async () => {
      // Stop if the user navigated away from this ticket
      if (openTicketIdRef.current !== ticketId) {
        if (typingPollRef.current) { clearInterval(typingPollRef.current); typingPollRef.current = null }
        setCustomerTyping(false)
        return
      }
      try {
        // Check typing status
        const typingRes = await api.get(`/support/${ticketId}/typing`)
        setCustomerTyping(typingRes.data.customerTyping === true)

        // Fetch new messages to update the conversation
        const res = await api.get<{ ticket: TicketDetail }>(`/support/${ticketId}`)
        setSelected((prev) => {
          if (!prev || prev.id !== ticketId) return prev
          const next = res.data.ticket
          const same = prev.status === next.status && prev.messages.length === next.messages.length &&
            prev.messages[prev.messages.length - 1]?.id === next.messages[next.messages.length - 1]?.id
          return same ? prev : next
        })
        // keep customer messages marked read while the admin has the ticket open
        api.post(`/support/${ticketId}/read`).catch(() => {})
      } catch (err) {
        console.error('Polling error:', err)
      }
    }, 3000)
  }

  // Clean up typing poll when component unmounts
  useEffect(() => {
    return () => { if (typingPollRef.current) clearInterval(typingPollRef.current) }
  }, [])

  async function sendReply() {
    if (!reply.trim() || !selected) return
    if (reply.trim().length > 2000) {
      alert({ variant: 'error', message: 'Reply must be 2000 characters or fewer.' })
      return
    }
    setSending(true)
    try {
      await api.post(`/support/${selected.id}/reply`, { body: reply.trim() })
      setReply('')
      const res = await api.get<{ ticket: TicketDetail }>(`/support/${selected.id}`)
      setSelected(res.data.ticket)
      // Admin just replied → they've seen the customer's messages
      api.post(`/support/${selected.id}/read`, {}).catch(() => {})
      fetchTickets(true)
    } catch (err: any) {
      alert({ variant: 'error', message: err.response?.data?.message ?? 'Failed to send reply' })
    } finally { setSending(false) }
  }

  async function changeStatus(status: string) {
    if (!selected) return
    setChangingStatus(true)
    try {
      await api.patch(`/support/${selected.id}/status`, { status })
      setSelected((s) => s ? { ...s, status: status as Ticket['status'] } : null)
      fetchTickets(true)
    } catch (err: any) {
      alert({ variant: 'error', message: err.response?.data?.message ?? 'Failed to update status' })
    } finally { setChangingStatus(false) }
  }

  const saveSettings = async () => {
    setSavingSettings(true)
    try { await api.put('/support/admin/settings', settings); setShowSettings(false) }
    catch (err: any) { alert({ variant: 'error', message: err.response?.data?.message ?? 'Failed to save settings' }) }
    finally { setSavingSettings(false) }
  }

  // ── Default message CRUD ──────────────────────────────────────────────────────

  async function handleSaveDefaultMsg(data: { title: string; body: string }) {
    if (editingMsg) {
      await api.patch(`/support/default-messages/${editingMsg.id}`, data)
    } else {
      await api.post('/support/default-messages', data)
    }
    await fetchDefaultMsgs()
    setShowMsgForm(false)
    setEditingMsg(null)
  }

  async function handleDeleteDefaultMsg(id: string) {
    const ok = await confirmDialog({
      title: 'Delete default message?',
      message: 'This canned response will be removed permanently.',
      confirmText: 'Delete',
      variant: 'danger',
    })
    if (!ok) return
    try { await api.delete(`/support/default-messages/${id}`); fetchDefaultMsgs() }
    catch (e: any) { alert({ variant: 'error', message: e.response?.data?.message ?? 'Failed to delete' }) }
  }

  // ── Sender label ─────────────────────────────────────────────────────────────
  const senderLabel = user?.name
    ? `${user.name}${user.role === 'SUPER_ADMIN' ? ' (Super Admin)' : user.role === 'CUSTOMER_SUPPORT' ? ' (Support)' : ''}`
    : 'Staff'

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-brand-600">Customer support</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Support tickets</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => fetchTickets()} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Refresh
          </Button>
          <Button variant="outline" onClick={() => { setShowSettings(true); setSettingsTab('chat') }}>
            <Settings className="mr-2 h-4 w-4" />Chat Settings
          </Button>
        </div>
      </div>

      {/* Page tabs (super admin only) */}
      {isSuperAdmin && (
        <div className="flex gap-1 border-b border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setPageTab('tickets')}
            className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition -mb-px ${pageTab === 'tickets' ? 'border-brand-600 text-brand-700 dark:text-brand-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
          >
            <MessageSquareText className="h-4 w-4" />Tickets
          </button>
          <button
            type="button"
            onClick={() => setPageTab('history')}
            className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition -mb-px ${pageTab === 'history' ? 'border-brand-600 text-brand-700 dark:text-brand-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
          >
            <History className="h-4 w-4" />Conversation History
          </button>
        </div>
      )}

      {/* ── History tab ── */}
      {isSuperAdmin && pageTab === 'history' && (
        <ConversationHistoryTab onOpenTicket={openTicketById} />
      )}

      {/* ── Tickets tab ── */}
      {pageTab === 'tickets' && (<>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total tickets',   value: stats.total,      icon: MessageSquareText, color: 'text-brand-600' },
          { label: 'Open',            value: stats.open,       icon: AlertCircle,       color: 'text-amber-600' },
          { label: 'In progress',     value: stats.inProgress, icon: Clock,             color: 'text-blue-600' },
          { label: 'Resolved',        value: stats.resolved,   icon: CheckCircle2,      color: 'text-emerald-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">{label}</span>
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 ${color}`}>
                <Icon className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-4 text-2xl font-semibold text-slate-900 dark:text-slate-100">{value}</p>
          </div>
        ))}
      </div>

      {/* Two-column layout */}
      <div className="grid gap-6 xl:grid-cols-[1fr_440px]">

        {/* Ticket list */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-slate-800 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search tickets…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
            <div className="flex gap-1 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:thin]">
              {(['All', 'OPEN', 'IN_PROGRESS', 'RESOLVED'] as FilterStatus[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`whitespace-nowrap shrink-0 rounded-xl px-2.5 py-1.5 text-xs font-medium transition ${filter === f ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'}`}
                >
                  {f === 'IN_PROGRESS' ? 'In progress' : f === 'All' ? 'All' : statusLabel(f)}
                </button>
              ))}
            </div>
          </div>

          {error && <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-400">{error}</div>}

          {loading && tickets.length === 0 ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-brand-600" /></div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-slate-400">
              <MessageSquareText className="h-8 w-8" /><p className="text-sm">No tickets found.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {tickets.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => openTicket(t)}
                  className={`w-full p-4 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/50 ${selected?.id === t.id ? 'bg-brand-50 dark:bg-brand-950/20' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-900 dark:text-slate-100">{t.subject}</p>
                      <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs text-slate-500">{t.customerName}</span>
                        {t.isGuest && <Badge variant="default">Guest</Badge>}
                        {t.customerPhone && (
                          <>
                            <span className="text-xs text-slate-300 dark:text-slate-600">·</span>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setProfilePhone(t.customerPhone) }}
                              className="flex items-center gap-1 rounded-md px-1 py-0.5 text-xs font-medium text-brand-600 hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-brand-950/30 transition"
                              title="View customer profile"
                            >
                              <Phone className="h-3 w-3" />{t.customerPhone}
                            </button>
                          </>
                        )}
                        <span className="text-xs text-slate-400">· {timeAgo(t.updatedAt)} · {t.messageCount} msg</span>
                      </div>
                    </div>
                    <div className="flex flex-shrink-0 flex-col items-end gap-1">
                      <div className="flex items-center gap-1.5">
                        <Badge variant={STATUS_VARIANT[t.status]}>{statusLabel(t.status)}</Badge>
                        {t.unreadCount > 0 && (
                          <Badge variant="danger" className="flex items-center gap-1">
                            <Bell className="h-3 w-3" />
                            {t.unreadCount}
                          </Badge>
                        )}
                      </div>
                      <Badge variant={PRIORITY_VARIANT[t.priority]}>{t.priority.charAt(0) + t.priority.slice(1).toLowerCase()}</Badge>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Ticket detail / chat */}
        <div className="flex h-[600px] flex-col rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {!selected ? (
            <div className="flex flex-1 flex-col items-center justify-center text-slate-400">
              <MessageSquareText className="mb-2 h-10 w-10 opacity-30" />
              <p className="text-sm">Select a ticket to view</p>
            </div>
          ) : (
            <>
              {/* Detail header */}
              <div className="border-b border-slate-200 p-4 dark:border-slate-800">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900 dark:text-slate-100">{selected.subject}</p>
                    <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs text-slate-500">{selected.customerName}</span>
                      {selected.customerPhone && (
                        <>
                          <span className="text-xs text-slate-300 dark:text-slate-600">·</span>
                          <button
                            type="button"
                            onClick={() => setProfilePhone(selected.customerPhone)}
                            className="flex items-center gap-1 rounded-md px-1 py-0.5 text-xs font-medium text-brand-600 hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-brand-950/30 transition"
                            title="View customer profile"
                          >
                            <Phone className="h-3 w-3" />{selected.customerPhone}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <Badge variant={STATUS_VARIANT[selected.status]}>{statusLabel(selected.status)}</Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const).map((s) => (
                    <button
                      key={s}
                      disabled={s === selected.status || changingStatus}
                      onClick={() => changeStatus(s)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${s === selected.status ? 'bg-brand-600 text-white cursor-default' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 disabled:opacity-40'}`}
                    >
                      {statusLabel(s)}
                    </button>
                  ))}
                  {changingStatus && <Loader2 className="h-4 w-4 animate-spin text-brand-600 self-center" />}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {detailLoading && selected.messages.length === 0 ? (
                  <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-brand-600" /></div>
                ) : selected.messages.length === 0 ? (
                  <p className="text-center text-xs text-slate-400">No messages yet.</p>
                ) : (
                  selected.messages.map((m) => (
                    <div key={m.id} className={`flex ${m.isStaff ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.isStaff ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100'}`}>
                        <p className="mb-1 text-[11px] font-semibold opacity-70">{m.senderName}</p>
                        <p className="leading-relaxed">{m.body}</p>
                        <div className="mt-1 flex items-center justify-end gap-1 text-[10px] opacity-70">
                          <span>{formatTime(m.sentAt)}</span>
                          {m.isStaff && (
                            m.readAt
                              ? <CheckCheck className="h-3 w-3" title={`Read ${timeAgo(m.readAt)}`} />
                              : <Check className="h-3 w-3 opacity-80" title="Sent" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}

                {/* Customer typing indicator */}
                {customerTyping && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-1 rounded-2xl bg-slate-100 px-3 py-2 dark:bg-slate-800">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply box */}
              <div className="border-t border-slate-200 p-3 dark:border-slate-800">
                {/* Sender label */}
                <div className="mb-1.5 flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
                  <User className="h-3 w-3" />
                  <span>Sending as <span className="font-medium text-slate-600 dark:text-slate-300">{senderLabel}</span></span>
                  {defaultMsgs.length > 0 && (
                    <span className="ml-auto text-[11px] text-slate-400">type <kbd className="rounded border border-slate-200 bg-slate-50 px-1 py-0.5 font-mono text-[10px] dark:border-slate-700 dark:bg-slate-800">/</kbd> for templates</span>
                  )}
                </div>

                {/* Slash autocomplete popup */}
                {showSlash && filteredSlash.length > 0 && (
                  <div className="mb-1.5 max-h-44 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                    {filteredSlash.map((msg, i) => (
                      <button
                        key={msg.id}
                        type="button"
                        onClick={() => selectSlashMsg(msg)}
                        className={`flex w-full items-start gap-2 px-3 py-2.5 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800 ${i === slashIndex ? 'bg-brand-50 dark:bg-brand-950/20' : ''}`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{msg.title}</p>
                            <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500">{msg.id.slice(0, 8)}</span>
                          </div>
                          <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">{msg.body}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    ref={replyRef}
                    type="text"
                    placeholder={defaultMsgs.length > 0 ? 'Reply… or type / for templates' : 'Reply…'}
                    value={reply}
                    onChange={handleReplyChange}
                    onKeyDown={handleReplyKeyDown}
                    disabled={sending || selected.status === 'CLOSED'}
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 disabled:opacity-50"
                  />
                  <Button size="icon" onClick={sendReply} disabled={!reply.trim() || sending || selected.status === 'CLOSED'}>
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
                {selected.status === 'CLOSED' && <p className="mt-1 text-xs text-slate-400">This ticket is closed.</p>}
              </div>
            </>
          )}
        </div>
      </div>
      </>)}
      {/* END tickets tab */}

      {/* Customer profile panel */}
      {profilePhone && <CustomerProfilePanel phone={profilePhone} onClose={() => setProfilePhone(null)} />}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowSettings(false)}>
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900 max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>

            {/* Dialog header + tabs */}
            <div className="border-b border-slate-200 px-6 pt-5 dark:border-slate-800">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">Chat Settings</h2>
              <div className="flex gap-1">
                {([['chat', 'Automation'], ['defaults', 'Default Messages']] as [SettingsTab, string][]).map(([tab, label]) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setSettingsTab(tab)}
                    className={`flex items-center gap-1.5 rounded-t-lg px-4 py-2 text-sm font-medium transition border-b-2 -mb-px ${settingsTab === tab ? 'border-brand-600 text-brand-700 dark:text-brand-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                  >
                    {tab === 'defaults' && <MessageSquareDashed className="h-4 w-4" />}
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {/* ── Automation tab ── */}
              {settingsTab === 'chat' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-reply">Enable Automated Welcome Greeting</Label>
                    <input
                      id="auto-reply"
                      type="checkbox"
                      checked={settings.isAutoReplyEnabled}
                      onChange={(e) => setSettings({ ...settings, isAutoReplyEnabled: e.target.checked })}
                      className="h-5 w-5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="welcome-message">Welcome Message</Label>
                    <Textarea
                      id="welcome-message"
                      value={settings.welcomeMessage}
                      onChange={(e) => setSettings({ ...settings, welcomeMessage: e.target.value })}
                      rows={3}
                      placeholder="Hello! How can we help you today?"
                    />
                  </div>
                  <div>
                    <Label>Quick Starters (one per line)</Label>
                    <Textarea
                      value={settings.quickStarters.join('\n')}
                      onChange={(e) => setSettings({ ...settings, quickStarters: e.target.value.split('\n').filter((s) => s.trim()) })}
                      rows={4}
                      placeholder="Track my order&#10;Payment issue&#10;Return item&#10;Speak to agent"
                    />
                  </div>
                  <div className="flex gap-2 justify-end pt-2">
                    <Button variant="outline" onClick={() => setShowSettings(false)} disabled={savingSettings}>Cancel</Button>
                    <Button onClick={saveSettings} disabled={savingSettings}>
                      {savingSettings ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      {savingSettings ? 'Saving...' : 'Save Settings'}
                    </Button>
                  </div>
                </div>
              )}

              {/* ── Default Messages tab ── */}
              {settingsTab === 'defaults' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Type <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-xs dark:border-slate-700 dark:bg-slate-800">/</kbd> in the reply box to insert a template.
                    </p>
                    <Button size="sm" onClick={() => { setEditingMsg(null); setShowMsgForm(true) }}>
                      <Plus className="mr-1.5 h-4 w-4" />Add
                    </Button>
                  </div>

                  {showMsgForm && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                      <p className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300">{editingMsg ? 'Edit message' : 'New default message'}</p>
                      <DefaultMessageForm
                        initial={editingMsg ?? undefined}
                        onSave={handleSaveDefaultMsg}
                        onCancel={() => { setShowMsgForm(false); setEditingMsg(null) }}
                      />
                    </div>
                  )}

                  {defaultMsgsLoading ? (
                    <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-brand-600" /></div>
                  ) : defaultMsgs.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-8 text-slate-400">
                      <MessageSquareDashed className="h-8 w-8 opacity-40" />
                      <p className="text-sm">No default messages yet. Add one above.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                      {defaultMsgs.map((msg) => (
                        <div key={msg.id} className="flex items-start gap-3 p-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{msg.title}</p>
                              <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500">{msg.id.slice(0, 8)}</span>
                            </div>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{msg.body}</p>
                          </div>
                          <div className="flex shrink-0 gap-1">
                            <button
                              type="button"
                              onClick={() => { setEditingMsg(msg); setShowMsgForm(true) }}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 transition"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteDefaultMsg(msg.id)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 transition"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
