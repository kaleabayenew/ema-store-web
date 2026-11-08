import { useCallback, useEffect, useRef, useState } from 'react'
import {
  MessageSquareText, CheckCircle2, Clock, AlertCircle,
  Search, Send, Loader2, RefreshCw, XCircle,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Ticket {
  id: string
  subject: string
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  customerName: string
  customerPhone: string
  messageCount: number
  createdAt: string
  updatedAt: string
}

interface Message {
  id: string
  body: string
  isStaff: boolean
  senderName: string
  sentAt: string
}

interface TicketDetail extends Ticket {
  customerEmail: string
  messages: Message[]
}

type FilterStatus = 'All' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'

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

// ── Page ──────────────────────────────────────────────────────────────────────

export function SupportPage() {
  const [tickets, setTickets]     = useState<Ticket[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [search, setSearch]       = useState('')
  const [filter, setFilter]       = useState<FilterStatus>('All')
  const [stats, setStats]         = useState({ total: 0, open: 0, inProgress: 0, resolved: 0 })

  const [selected, setSelected]         = useState<TicketDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [reply, setReply]               = useState('')
  const [sending, setSending]           = useState(false)
  const [changingStatus, setChangingStatus] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const fetchTickets = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/support', {
        params: { search, status: filter === 'All' ? undefined : filter, limit: 50 },
      })
      setTickets(res.data.tickets ?? [])
      setStats({
        total:      res.data.total ?? 0,
        open:       res.data.open ?? 0,
        inProgress: res.data.inProgress ?? 0,
        resolved:   res.data.resolved ?? 0,
      })
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to load tickets')
    } finally {
      setLoading(false)
    }
  }, [search, filter])

  useEffect(() => { fetchTickets() }, [fetchTickets])

  // Debounced search
  useEffect(() => {
    const t = setTimeout(fetchTickets, search ? 400 : 0)
    return () => clearTimeout(t)
    // eslint-disable-next-line
  }, [search])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [selected?.messages])

  async function openTicket(ticket: Ticket) {
    setSelected({ ...ticket, customerEmail: '', messages: [] })
    setDetailLoading(true)
    try {
      const res = await api.get<{ ticket: TicketDetail }>(`/support/${ticket.id}`)
      setSelected(res.data.ticket)
    } catch {
      // keep basic info
    } finally {
      setDetailLoading(false)
    }
  }

  async function sendReply() {
    if (!reply.trim() || !selected) return
    setSending(true)
    try {
      await api.post(`/support/${selected.id}/reply`, { body: reply.trim() })
      setReply('')
      // Re-fetch detail to get updated messages + status
      const res = await api.get<{ ticket: TicketDetail }>(`/support/${selected.id}`)
      setSelected(res.data.ticket)
      // Update ticket list
      fetchTickets()
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Failed to send reply')
    } finally {
      setSending(false)
    }
  }

  async function changeStatus(status: string) {
    if (!selected) return
    setChangingStatus(true)
    try {
      await api.patch(`/support/${selected.id}/status`, { status })
      setSelected((s) => s ? { ...s, status: status as Ticket['status'] } : null)
      fetchTickets()
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Failed to update status')
    } finally {
      setChangingStatus(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-brand-600">Customer support</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Support tickets</h1>
        </div>
        <Button variant="outline" onClick={fetchTickets} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Refresh
        </Button>
      </div>

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
            <div className="flex gap-1">
              {(['All', 'OPEN', 'IN_PROGRESS', 'RESOLVED'] as FilterStatus[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`rounded-xl px-2.5 py-1.5 text-xs font-medium transition ${filter === f ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'}`}
                >
                  {f === 'IN_PROGRESS' ? 'In progress' : f === 'All' ? 'All' : statusLabel(f)}
                </button>
              ))}
            </div>
          </div>

          {error && <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-400">{error}</div>}

          {loading && tickets.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-7 w-7 animate-spin text-brand-600" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-slate-400">
              <MessageSquareText className="h-8 w-8" />
              <p className="text-sm">No tickets found.</p>
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
                      <p className="mt-0.5 text-xs text-slate-500">
                        {t.customerName} · {timeAgo(t.updatedAt)} · {t.messageCount} messages
                      </p>
                    </div>
                    <div className="flex flex-shrink-0 flex-col items-end gap-1">
                      <Badge variant={STATUS_VARIANT[t.status]}>{statusLabel(t.status)}</Badge>
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
                    <p className="mt-0.5 text-xs text-slate-500">
                      {selected.customerName}
                      {selected.customerPhone ? ` · ${selected.customerPhone}` : ''}
                    </p>
                  </div>
                  <Badge variant={STATUS_VARIANT[selected.status]}>{statusLabel(selected.status)}</Badge>
                </div>

                {/* Status controls */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const).map((s) => (
                    <button
                      key={s}
                      disabled={s === selected.status || changingStatus}
                      onClick={() => changeStatus(s)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition
                        ${s === selected.status
                          ? 'bg-brand-600 text-white cursor-default'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 disabled:opacity-40'}`}
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
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
                  </div>
                ) : selected.messages.length === 0 ? (
                  <p className="text-center text-xs text-slate-400">No messages yet.</p>
                ) : (
                  selected.messages.map((m) => (
                    <div key={m.id} className={`flex ${m.isStaff ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.isStaff ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100'}`}>
                        <p className="mb-1 text-[11px] font-semibold opacity-70">{m.senderName}</p>
                        <p className="leading-relaxed">{m.body}</p>
                        <p className="mt-1 text-right text-[10px] opacity-60">{timeAgo(m.sentAt)}</p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply box */}
              <div className="border-t border-slate-200 p-3 dark:border-slate-800">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Reply…"
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply() } }}
                    disabled={sending || selected.status === 'CLOSED'}
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 disabled:opacity-50"
                  />
                  <Button size="icon" onClick={sendReply} disabled={!reply.trim() || sending || selected.status === 'CLOSED'}>
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
                {selected.status === 'CLOSED' && (
                  <p className="mt-1 text-xs text-slate-400">This ticket is closed.</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
