import { useEffect, useState } from 'react'
import { Loader2, RefreshCw, Star, Trash2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api'

interface Review {
  id: string
  rating: number
  comment: string | null
  is_approved: boolean
  helpful_count: number
  created_at: string
  product_id: string | null
  product_name: string | null
  customer_id: string | null
  customer_name: string | null
  customer_email: string | null
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const d = Math.floor(diff / 86400000)
  if (d < 1) return 'Today'
  if (d === 1) return 'Yesterday'
  return `${d}d ago`
}

export function ReviewsPage() {
  const confirmDialog = useConfirm()
  const { user } = useAuthStore()
  const canModerate = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN'

  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'approved' | 'hidden'>('all')

  const fetchReviews = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get<{ reviews: Review[] }>('/admin/reviews')
      setReviews(res.data.reviews ?? [])
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to load reviews')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchReviews() }, [])

  const toggleApproval = async (review: Review) => {
    try {
      await api.patch(`/admin/reviews/${review.id}`, { is_approved: !review.is_approved })
      setReviews((prev) => prev.map((r) => r.id === review.id ? { ...r, is_approved: !r.is_approved } : r))
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to update review')
    }
  }

  const handleDelete = async (review: Review) => {
    const ok = await confirmDialog({
      title: 'Delete this review?',
      message: 'The review will be permanently removed.',
      confirmText: 'Delete',
      variant: 'danger',
    })
    if (!ok) return
    try {
      await api.delete(`/admin/reviews/${review.id}`)
      setReviews((prev) => prev.filter((r) => r.id !== review.id))
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to delete review')
    }
  }

  const filtered = reviews.filter((r) =>
    filter === 'all' ? true : filter === 'approved' ? r.is_approved : !r.is_approved)

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : '—'

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-brand-600">Community</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Reviews</h1>
        </div>
        <Button variant="outline" onClick={fetchReviews} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Refresh
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Total reviews', value: reviews.length.toLocaleString() },
          { label: 'Average rating', value: avgRating },
          { label: 'Hidden', value: reviews.filter((r) => !r.is_approved).length.toLocaleString() },
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
          {(['all', 'approved', 'hidden'] as const).map((f) => (
            <button key={f} type="button" onClick={() => setFilter(f)}
              className={`rounded-xl px-3 py-1.5 text-xs font-medium capitalize transition ${filter === f ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'}`}>
              {f === 'all' ? 'All' : f === 'approved' ? 'Visible' : 'Hidden'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-brand-600" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-slate-400">
            <Star className="h-10 w-10 opacity-40" />
            <p className="text-sm">No reviews found.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((r) => (
              <div key={r.id} className="flex items-start gap-4 p-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300">
                  <Star className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`h-3.5 w-3.5 ${s <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}`} />
                      ))}
                    </div>
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{r.customer_name || 'Customer'}</span>
                    <span className="text-xs text-slate-400">on {r.product_name || 'Unknown product'} · {timeAgo(r.created_at)}</span>
                  </div>
                  {r.comment && <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">{r.comment}</p>}
                  <div className="mt-1.5 flex items-center gap-3 text-xs text-slate-400">
                    <span>{r.helpful_count} helpful</span>
                    {r.customer_email && <span>{r.customer_email}</span>}
                  </div>
                </div>
                <div className="flex flex-shrink-0 items-center gap-2">
                  <Badge variant={r.is_approved ? 'success' : 'danger'}>{r.is_approved ? 'Visible' : 'Hidden'}</Badge>
                  {canModerate && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => toggleApproval(r)}>
                        {r.is_approved ? 'Hide' : 'Show'}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(r)} aria-label="Delete review">
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </>
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
