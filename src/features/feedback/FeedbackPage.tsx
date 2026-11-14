import { useEffect, useState } from 'react'
import { CheckCircle2, Loader2, MessageSquareText, RefreshCw, Star, Trash2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api'

interface Feedback {
  id: string
  message: string
  rating: number | null
  status: 'NEW' | 'IN_PROGRESS' | 'RESOLVED'
  created_at: string
  user_id: string | null
  user_name: string | null
  user_email: string | null
  user_phone: string | null
}

const STATUS_VARIANT: Record<Feedback['status'], 'warning' | 'info' | 'success'> = {
  NEW: 'warning',
  IN_PROGRESS: 'info',
  RESOLVED: 'success',
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const d = Math.floor(diff / 86400000)
  if (d < 1) return 'Today'
  if (d === 1) return 'Yesterday'
  return `${d}d ago`
}

export function FeedbackPage() {
  const confirmDialog = useConfirm()
  const { user } = useAuthStore()
  const canModerate = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN'

  const [items, setItems] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'NEW' | 'IN_PROGRESS' | 'RESOLVED'>('all')

  const fetchFeedback = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get<{ feedback: Feedback[] }>('/admin/feedback')
      setItems(res.data.feedback ?? [])
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to load feedback')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchFeedback() }, [])

  const setStatus = async (item: Feedback, status: Feedback['status']) => {
    try {
      await api.patch(`/admin/feedback/${item.id}/status`, { status })
      setItems((prev) => prev.map((f) => f.id === item.id ? { ...f, status } : f))
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to update status')
    }
  }

  const handleDelete = async (item: Feedback) => {
    const ok = await confirmDialog({
      title: 'Delete this feedback?',
      message: 'The feedback will be permanently removed.',
      confirmText: 'Delete',
      variant: 'danger',
    })
    if (!ok) return
    try {
      await api.delete(`/admin/feedback/${item.id}`)
      setItems((prev) => prev.filter((f) => f.id !== item.id))
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to delete feedback')
    }
  }

  const filtered = items.filter((f) => filter === 'all' || f.status === filter)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-brand-600">Community</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Feedback</h1>
        </div>
        <Button variant="outline" onClick={fetchFeedback} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Refresh
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: 'Total', value: items.length },
          { label: 'New', value: items.filter((f) => f.status === 'NEW').length },
          { label: 'In progress', value: items.filter((f) => f.status === 'IN_PROGRESS').length },
          { label: 'Resolved', value: items.filter((f) => f.status === 'RESOLVED').length },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{value}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">{error}</div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap gap-2 border-b border-slate-200 p-4 dark:border-slate-800">
          {(['all', 'NEW', 'IN_PROGRESS', 'RESOLVED'] as const).map((f) => (
            <button key={f} type="button" onClick={() => setFilter(f)}
              className={`rounded-xl px-3 py-1.5 text-xs font-medium capitalize transition ${filter === f ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'}`}>
              {f === 'all' ? 'All' : f === 'IN_PROGRESS' ? 'In progress' : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-brand-600" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-slate-400">
            <MessageSquareText className="h-10 w-10 opacity-40" />
            <p className="text-sm">No feedback received yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((f) => (
              <div key={f.id} className="flex items-start gap-4 p-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-300">
                  <MessageSquareText className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{f.user_name || 'Customer'}</span>
                    {f.rating != null && (
                      <span className="flex items-center gap-0.5 text-xs text-amber-500">
                        <Star className="h-3.5 w-3.5 fill-amber-400" />{f.rating}
                      </span>
                    )}
                    <span className="text-xs text-slate-400">{timeAgo(f.created_at)}</span>
                  </div>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{f.message}</p>
                  <div className="mt-1.5 flex flex-wrap gap-x-4 text-xs text-slate-400">
                    {f.user_email && <span>{f.user_email}</span>}
                    {f.user_phone && <span>{f.user_phone}</span>}
                  </div>
                </div>
                <div className="flex flex-shrink-0 flex-col items-end gap-2">
                  <Badge variant={STATUS_VARIANT[f.status]}>{f.status === 'IN_PROGRESS' ? 'In progress' : f.status.charAt(0) + f.status.slice(1).toLowerCase()}</Badge>
                  {canModerate && (
                    <div className="flex gap-1.5">
                      {f.status !== 'RESOLVED' && (
                        <Button variant="outline" size="sm" className="gap-1" onClick={() => setStatus(f, 'RESOLVED')}>
                          <CheckCircle2 className="h-3.5 w-3.5" />Resolve
                        </Button>
                      )}
                      {f.status === 'NEW' && (
                        <Button variant="ghost" size="sm" onClick={() => setStatus(f, 'IN_PROGRESS')}>Start</Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(f)} aria-label="Delete feedback">
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
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
