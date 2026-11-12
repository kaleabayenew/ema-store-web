import { useState, useEffect, useRef } from 'react'
import { Flame, Clock, Tag, Plus, Trash2, Loader2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import { dateAfter, dateInFuture, inRange, isInteger, isUrl, maxLength, required, validate } from '@/lib/validate'
import { api } from '@/lib/api'

interface FlashDeal {
  id: string
  title: string
  description: string | null
  discount_percent: number
  starts_at: string
  ends_at: string
  image_url: string | null
  is_active: boolean
  created_at: string
}

interface DealForm {
  title: string
  description: string
  discount_percent: string
  starts_at: string
  ends_at: string
  image_url: string
}

const emptyForm: DealForm = {
  title: '',
  description: '',
  discount_percent: '',
  starts_at: '',
  ends_at: '',
  image_url: '',
}

// Value format required by <input type="datetime-local">
const toLocalInput = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100'

// ─── Image field: URL input + device upload button ────────────────────────────
function DealImageField({
  value,
  onChange,
}: {
  value: string
  onChange: (url: string) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setUploadError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('folder', 'flash-deals')

      const res = await api.post('/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      onChange(res.data.url)
    } catch (err: any) {
      setUploadError(err.response?.data?.message ?? 'Upload failed')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          id="deal-image"
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
          className={inputClass}
        />
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 px-3"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
          title="Upload image from device"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </Button>
      </div>

      {uploadError && (
        <p className="text-xs text-red-500">{uploadError}</p>
      )}

      {value && (
        <img
          src={value}
          alt="Deal preview"
          className="h-20 w-32 rounded-xl border border-slate-200 object-cover dark:border-slate-700"
        />
      )}
    </div>
  )
}

export function FlashDealsPage() {
  const confirmDialog = useConfirm()
  const [deals, setDeals] = useState<FlashDeal[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [filter, setFilter] = useState<'All' | 'Active' | 'Ended'>('All')
  const [form, setForm] = useState<DealForm>(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    loadDeals()
  }, [])

  const loadDeals = async () => {
    try {
      setLoading(true)
      const response = await api.get('/flash-deals')
      setDeals(response.data.deals || [])
    } catch (error) {
      console.error('Failed to load flash deals:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredDeals = deals.filter((deal) => {
    if (filter === 'All') return true
    if (filter === 'Active') return deal.is_active
    if (filter === 'Ended') return !deal.is_active
    return true
  })

  const stats = [
    {
      label: 'Active deals',
      value: String(deals.filter((d) => d.is_active).length),
      delta: '+0',
      tone: 'success',
      icon: Flame,
    },
    { label: 'Total views', value: '0', delta: '+0%', tone: 'info', icon: Clock },
    { label: 'Redeemed coupons', value: '0', delta: '+0%', tone: 'warning', icon: Tag },
  ]

  const formatTimeRemaining = (endsAt: string) => {
    const end = new Date(endsAt)
    const now = new Date()
    const diff = end.getTime() - now.getTime()

    if (diff <= 0) return 'Ended'

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 24) {
      const days = Math.floor(hours / 24)
      return `${days}d ${hours % 24}h`
    }

    return `${hours}h ${minutes}m`
  }

  const handleDelete = async (id: string) => {
    const ok = await confirmDialog({
      title: 'Delete this flash deal?',
      message: 'This flash deal will be removed permanently.',
      confirmText: 'Delete',
      variant: 'danger',
    })
    if (!ok) return
    try {
      await api.delete(`/flash-deals/${id}`)
      setDeals(deals.filter((d) => d.id !== id))
    } catch (error) {
      console.error('Failed to delete flash deal:', error)
    }
  }

  const handleToggleActive = async (id: string) => {
    try {
      const deal = deals.find((d) => d.id === id)
      if (deal) {
        await api.patch(`/flash-deals/${id}`, { is_active: !deal.is_active })
        setDeals(
          deals.map((d) =>
            d.id === id ? { ...d, is_active: !d.is_active } : d
          )
        )
      }
    } catch (error) {
      console.error('Failed to toggle flash deal:', error)
    }
  }

  const openCreateDialog = () => {
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    setForm({ ...emptyForm, starts_at: toLocalInput(now), ends_at: toLocalInput(tomorrow) })
    setFormError(null)
    setShowCreateDialog(true)
  }

  const closeCreateDialog = () => {
    if (submitting) return
    setShowCreateDialog(false)
  }

  const updateForm = (field: keyof DealForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setFormError(null)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()

    const title = form.title.trim()
    const discount = Number(form.discount_percent)
    const start = new Date(form.starts_at)
    const end = new Date(form.ends_at)

    const err = validate(
      required(title, 'Title'),
      maxLength(title, 100, 'Title'),
      maxLength(form.description.trim(), 500, 'Description'),
      required(form.discount_percent, 'Discount'),
      isInteger(form.discount_percent, 'Discount'),
      inRange(form.discount_percent, 1, 99, 'Discount'),
      required(form.starts_at, 'Start time'),
      required(form.ends_at, 'End time'),
      dateAfter(form.ends_at, form.starts_at, 'End time', 'start time'),
      dateInFuture(form.ends_at, 'End time'),
      form.image_url.trim() ? isUrl(form.image_url, true) : null,
    )
    if (err) return setFormError(err)

    try {
      setSubmitting(true)
      setFormError(null)
      await api.post('/flash-deals', {
        title,
        description: form.description.trim() || null,
        discount_percent: discount,
        starts_at: start.toISOString(),
        ends_at: end.toISOString(),
        image_url: form.image_url.trim() || null,
        is_active: true,
      })
      setShowCreateDialog(false)
      await loadDeals()
    } catch (error) {
      console.error('Failed to create flash deal:', error)
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data
        ?.message
      setFormError(message || 'Could not create the flash deal. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-brand-600">Flash Deals Management</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Flash Deals
          </h1>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Create Flash Deal
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map(({ label, value, delta, tone, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">{label}</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-300">
                <Icon className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-4 text-2xl font-semibold text-slate-900 dark:text-slate-100">{value}</p>
            <Badge variant={tone as 'success' | 'info' | 'warning'} className="mt-2">{delta}</Badge>
          </div>
        ))}
      </div>

      {/* Deals List */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            {(['All', 'Active', 'Ended'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-xl px-3 py-1.5 text-sm font-medium transition ${
                  filter === f
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">
            Loading flash deals...
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredDeals.map((deal) => (
              <div key={deal.id} className="p-4">
                <div className="flex gap-4">
                  {/* Deal Image */}
                  <div className="h-24 w-32 flex-shrink-0 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                    {deal.image_url ? (
                      <img
                        src={deal.image_url}
                        alt={deal.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-400">
                        <Flame className="h-8 w-8" />
                      </div>
                    )}
                  </div>

                  {/* Deal Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                            {deal.title}
                          </h3>
                          <Badge variant={deal.is_active ? 'success' : 'default'}>
                            {deal.is_active ? 'Active' : 'Ended'}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                          {deal.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(deal.id)}
                        >
                          {deal.is_active ? 'Pause' : 'Activate'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(deal.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-brand-600" />
                        <span className="text-slate-600 dark:text-slate-300">
                          {deal.discount_percent}% off
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-slate-400" />
                        <span className="text-slate-600 dark:text-slate-300">
                          {formatTimeRemaining(deal.ends_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filteredDeals.length === 0 && (
          <div className="p-12 text-center text-slate-500">
            No flash deals found
          </div>
        )}
      </div>

      {/* Create Deal Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowCreateDialog(false)}>
          <form
            onSubmit={handleCreate}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900"
          >
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
              Create Flash Deal
            </h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="deal-title" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Title
                </label>
                <input
                  id="deal-title"
                  type="text"
                  value={form.title}
                  onChange={(e) => updateForm('title', e.target.value)}
                  placeholder="Weekend mega sale"
                  className={inputClass}
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="deal-description" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Description <span className="text-slate-400">(optional)</span>
                </label>
                <textarea
                  id="deal-description"
                  rows={3}
                  value={form.description}
                  onChange={(e) => updateForm('description', e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="deal-discount" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Discount (%)
                </label>
                <input
                  id="deal-discount"
                  type="number"
                  min={1}
                  max={99}
                  step={1}
                  value={form.discount_percent}
                  onChange={(e) => updateForm('discount_percent', e.target.value)}
                  placeholder="20"
                  className={inputClass}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="deal-start" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Starts at
                  </label>
                  <input
                    id="deal-start"
                    type="datetime-local"
                    value={form.starts_at}
                    onChange={(e) => updateForm('starts_at', e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="deal-end" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Ends at
                  </label>
                  <input
                    id="deal-end"
                    type="datetime-local"
                    value={form.ends_at}
                    onChange={(e) => updateForm('ends_at', e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="deal-image" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Image URL <span className="text-slate-400">(optional)</span>
                </label>
                <DealImageField
                  value={form.image_url}
                  onChange={(url) => updateForm('image_url', url)}
                />
              </div>

              {formError && (
                <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
                  {formError}
                </p>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={closeCreateDialog} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
