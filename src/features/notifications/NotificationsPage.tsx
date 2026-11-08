import { useEffect, useState } from 'react'
import { Bell, Loader2, Megaphone, RefreshCw, Send, Users } from 'lucide-react'

import { Button } from '@/components/ui/button'
import api from '@/lib/api'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Notification {
  id: string
  title: string
  body: string
  is_read: boolean
  created_at: string
  recipient_name?: string
  phone?: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100'

// ── Page ──────────────────────────────────────────────────────────────────────

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [total, setTotal]                 = useState(0)
  const [loadingList, setLoadingList]     = useState(true)
  const [listError, setListError]         = useState<string | null>(null)

  const [title, setTitle]           = useState('')
  const [body, setBody]             = useState('')
  const [targetRole, setTargetRole] = useState<'ALL' | 'CUSTOMER' | 'PARTNER' | 'ADMIN'>('ALL')
  const [sending, setSending]       = useState(false)
  const [sendResult, setSendResult] = useState<{ ok: boolean; msg: string } | null>(null)

  const fetchNotifications = async () => {
    setLoadingList(true)
    setListError(null)
    try {
      const res = await api.get<{ notifications: Notification[]; total: number }>(
        '/notifications/admin/all',
        { params: { limit: 30 } },
      )
      setNotifications(res.data.notifications ?? [])
      setTotal(res.data.total ?? 0)
    } catch (err: any) {
      setListError(err.response?.data?.message ?? 'Failed to load notifications')
    } finally {
      setLoadingList(false)
    }
  }

  useEffect(() => { fetchNotifications() }, [])

  async function handleSend() {
    if (!title.trim() || !body.trim()) return
    setSending(true)
    setSendResult(null)
    try {
      const res = await api.post<{ sentCount: number }>('/notifications/announce', {
        title: title.trim(),
        body: body.trim(),
        targetRole: targetRole === 'ALL' ? null : targetRole,
      })
      setSendResult({ ok: true, msg: `Sent to ${res.data.sentCount?.toLocaleString() ?? '?'} users.` })
      setTitle('')
      setBody('')
      fetchNotifications()
    } catch (err: any) {
      setSendResult({ ok: false, msg: err.response?.data?.message ?? 'Failed to send.' })
    } finally {
      setSending(false)
    }
  }

  const sent  = notifications.length
  const unread = notifications.filter((n) => !n.is_read).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-brand-600">Notification management</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Notifications</h1>
        </div>
        <Button variant="outline" onClick={fetchNotifications} disabled={loadingList}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loadingList ? 'animate-spin' : ''}`} />Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Total sent',   value: total.toLocaleString(), icon: Bell,      color: 'text-brand-600' },
          { label: 'Recent (30)',  value: sent.toLocaleString(),  icon: Megaphone,  color: 'text-violet-600' },
          { label: 'Unread',       value: unread.toLocaleString(), icon: Users,    color: 'text-amber-600' },
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

      {/* Send Announcement */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">Send Announcement</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Title</label>
            <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Announcement title…" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Message</label>
            <textarea className={inputClass} rows={3} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Announcement body…" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Target audience</label>
            <div className="flex flex-wrap gap-2">
              {(['ALL', 'CUSTOMER', 'PARTNER', 'ADMIN'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setTargetRole(r)}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition ${targetRole === r ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'}`}
                >
                  {r === 'ALL' ? 'All Users' : r.charAt(0) + r.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {sendResult && (
            <p className={`rounded-xl px-3 py-2 text-sm ${sendResult.ok ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'}`}>
              {sendResult.msg}
            </p>
          )}

          <Button onClick={handleSend} disabled={!title.trim() || !body.trim() || sending} className="w-full">
            {sending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending…</> : <><Send className="mr-2 h-4 w-4" />Send Announcement</>}
          </Button>
        </div>
      </div>

      {/* Recent notifications */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Recent Notifications</h2>
        </div>

        {loadingList ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-7 w-7 animate-spin text-brand-600" />
          </div>
        ) : listError ? (
          <div className="px-5 py-8 text-center text-sm text-red-500">{listError}</div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-slate-400">
            <Bell className="h-8 w-8" />
            <p className="text-sm">No notifications sent yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {notifications.map((n) => (
              <div key={n.id} className={`flex items-start gap-4 px-5 py-4 ${!n.is_read ? 'bg-brand-50/40 dark:bg-brand-950/10' : ''}`}>
                <div className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${!n.is_read ? 'bg-brand-100 text-brand-600' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}>
                  <Bell className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-slate-900 dark:text-slate-100">{n.title}</p>
                    <span className="flex-shrink-0 text-xs text-slate-400">{timeAgo(n.created_at)}</span>
                  </div>
                  <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">{n.body}</p>
                  {n.recipient_name && (
                    <p className="mt-1 text-xs text-slate-400">To: {n.recipient_name} {n.phone ? `· ${n.phone}` : ''}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
