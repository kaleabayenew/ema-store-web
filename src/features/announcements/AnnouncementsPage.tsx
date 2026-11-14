import { useCallback, useEffect, useState } from 'react'
import { Loader2, Megaphone, Pencil, Plus, Send, Trash2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAlert, useConfirm } from '@/components/ui/ConfirmDialog'
import {
  createAnnouncement,
  deleteAnnouncement,
  listAnnouncements,
  publishAnnouncement,
  updateAnnouncement,
  type Announcement,
  type AnnouncementAudience,
} from '@/services/announcementService'

const AUDIENCE_LABEL: Record<AnnouncementAudience, string> = {
  CUSTOMER: 'Customers',
  PARTNER: 'Partners',
  RIDE: 'Ride',
}

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'default' | 'info'> = {
  SENT: 'success',
  SCHEDULED: 'info',
  SENDING: 'warning',
  DRAFT: 'default',
}

interface FormState {
  title: string
  body: string
  audience: AnnouncementAudience[]
  action: 'draft' | 'schedule' | 'send'
  scheduledAt: string
}

const emptyForm = (): FormState => ({
  title: '',
  body: '',
  audience: ['CUSTOMER'],
  action: 'send',
  scheduledAt: '',
})

function toLocalInput(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formFromAnnouncement(a: Announcement): FormState {
  return {
    title: a.title,
    body: a.body,
    audience: a.audience?.length ? a.audience : ['CUSTOMER'],
    action: a.status === 'SCHEDULED' ? 'schedule' : 'draft',
    scheduledAt: toLocalInput(a.scheduled_at),
  }
}

export function AnnouncementsPage() {
  const alert = useAlert()
  const confirmDialog = useConfirm()
  const [items, setItems] = useState<Announcement[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showDialog, setShowDialog] = useState(false)
  const [editing, setEditing] = useState<Announcement | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm())
  const [submitting, setSubmitting] = useState(false)
  const [publishingId, setPublishingId] = useState<string | null>(null)
  const limit = 15

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await listAnnouncements({ page, limit })
      setItems(res.announcements)
      setTotal(res.total)
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Failed to load announcements')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => { void fetchAll() }, [fetchAll])

  const totalPages = Math.max(1, Math.ceil(total / limit))

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm())
    setShowDialog(true)
  }

  const openEdit = (a: Announcement) => {
    setEditing(a)
    setForm(formFromAnnouncement(a))
    setShowDialog(true)
  }

  const toggleAudience = (aud: AnnouncementAudience) => {
    setForm((f) => ({
      ...f,
      audience: f.audience.includes(aud)
        ? f.audience.filter((a) => a !== aud)
        : [...f.audience, aud],
    }))
  }

  const handleSubmit = async () => {
    if (form.title.trim().length < 3) {
      alert({ variant: 'error', message: 'Title must be at least 3 characters.' })
      return
    }
    if (!form.body.trim()) {
      alert({ variant: 'error', message: 'Message body is required.' })
      return
    }
    if (form.audience.length === 0) {
      alert({ variant: 'error', message: 'Select at least one audience.' })
      return
    }
    if (form.action === 'schedule' && (!form.scheduledAt || new Date(form.scheduledAt).getTime() <= Date.now())) {
      alert({ variant: 'error', message: 'Pick a future date and time.' })
      return
    }

    setSubmitting(true)
    try {
      if (editing) {
        await updateAnnouncement(editing.id, {
          title: form.title.trim(),
          body: form.body.trim(),
          audience: form.audience,
          action: form.action === 'send' ? undefined : form.action,
          scheduledAt: form.action === 'schedule' ? new Date(form.scheduledAt).toISOString() : undefined,
        })
        alert({ variant: 'success', message: 'Announcement updated.' })
      } else {
        await createAnnouncement({
          title: form.title.trim(),
          body: form.body.trim(),
          audience: form.audience,
          action: form.action,
          scheduledAt: form.action === 'schedule' ? new Date(form.scheduledAt).toISOString() : undefined,
        })
        alert({
          variant: 'success',
          message: form.action === 'send'
            ? 'Announcement sent to all selected audiences.'
            : form.action === 'schedule'
              ? 'Announcement scheduled.'
              : 'Draft saved.',
        })
      }
      setShowDialog(false)
      await fetchAll()
    } catch (e: any) {
      alert({ variant: 'error', message: e.response?.data?.message ?? 'Failed to save announcement' })
    } finally {
      setSubmitting(false)
    }
  }

  const handlePublish = async (a: Announcement) => {
    const okConfirm = await confirmDialog({
      title: 'Send announcement now',
      message: `Send "${a.title}" to ${a.audience.map((x) => AUDIENCE_LABEL[x]).join(', ')} immediately? This cannot be undone.`,
      confirmText: 'Send now',
      variant: 'danger',
    })
    if (!okConfirm) return
    setPublishingId(a.id)
    try {
      await publishAnnouncement(a.id)
      alert({ variant: 'success', message: 'Announcement sent.' })
      await fetchAll()
    } catch (e: any) {
      alert({ variant: 'error', message: e.response?.data?.message ?? 'Failed to send announcement' })
    } finally {
      setPublishingId(null)
    }
  }

  const handleDelete = async (a: Announcement) => {
    const okConfirm = await confirmDialog({
      title: 'Delete announcement',
      message: `Delete "${a.title}"?`,
      confirmText: 'Delete',
      variant: 'danger',
    })
    if (!okConfirm) return
    try {
      await deleteAnnouncement(a.id)
      await fetchAll()
    } catch (e: any) {
      alert({ variant: 'error', message: e.response?.data?.message ?? 'Failed to delete' })
    }
  }

  const fmtDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleString('en-ET', { dateStyle: 'medium', timeStyle: 'short' }) : '—'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-brand-600">Broadcast center</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Announcements
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Send in-app notifications, push alerts and Telegram messages to customers, partners and ride users.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void fetchAll()} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Refresh
          </Button>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> New announcement
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {loading && items.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
            <Megaphone className="mx-auto mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
            <p className="text-slate-500 dark:text-slate-400">No announcements yet. Create your first broadcast.</p>
          </div>
        ) : (
          items.map((a) => (
            <div
              key={a.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">{a.title}</h3>
                    <Badge variant={STATUS_VARIANT[a.status] ?? 'default'}>{a.status}</Badge>
                    {a.audience.map((aud) => (
                      <Badge key={aud} variant="info">{AUDIENCE_LABEL[aud]}</Badge>
                    ))}
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">{a.body}</p>
                  <p className="mt-2 text-xs text-slate-400">
                    Created {fmtDate(a.created_at)}
                    {a.status === 'SCHEDULED' && ` · Sends ${fmtDate(a.scheduled_at)}`}
                    {a.status === 'SENT' && a.sent_at && ` · Sent ${fmtDate(a.sent_at)}`}
                    {a.status === 'SENT' && a.stats?.recipients != null &&
                      ` · ${a.stats.notified ?? 0} notified, ${a.stats.pushed ?? 0} pushed, ${a.stats.telegramSent ?? 0} Telegram`}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {(a.status === 'DRAFT' || a.status === 'SCHEDULED') && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEdit(a)}
                      >
                        <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => void handlePublish(a)}
                        disabled={publishingId === a.id}
                      >
                        {publishingId === a.id
                          ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                          : <Send className="mr-1 h-3.5 w-3.5" />}
                        Send now
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void handleDelete(a)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>Page {page} of {totalPages} · {total} announcements</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      {/* Create / Edit dialog */}
      {showDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowDialog(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-slate-100">
              {editing ? 'Edit announcement' : 'New announcement'}
            </h2>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ann-title">Title</Label>
                <Input
                  id="ann-title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Scheduled maintenance this Friday"
                  maxLength={200}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ann-body">Message</Label>
                <Textarea
                  id="ann-body"
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  placeholder="Write the announcement shown in the app, as a push notification and on Telegram…"
                  rows={5}
                  maxLength={4000}
                />
                <p className="text-xs text-slate-400">{form.body.length}/4000</p>
              </div>

              <div className="space-y-2">
                <Label>Audience</Label>
                <div className="flex flex-wrap gap-2">
                  {(['CUSTOMER', 'PARTNER', 'RIDE'] as AnnouncementAudience[]).map((aud) => (
                    <button
                      key={aud}
                      type="button"
                      onClick={() => toggleAudience(aud)}
                      className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                        form.audience.includes(aud)
                          ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                      }`}
                    >
                      {AUDIENCE_LABEL[aud]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Delivery</Label>
                <div className="grid gap-2 sm:grid-cols-3">
                  {([
                    { v: 'send', label: 'Send now', hint: 'Deliver immediately' },
                    { v: 'schedule', label: 'Schedule', hint: 'Pick date & time' },
                    { v: 'draft', label: 'Save draft', hint: 'Publish later' },
                  ] as const).map((opt) => (
                    <button
                      key={opt.v}
                      type="button"
                      onClick={() => setForm({ ...form, action: opt.v })}
                      className={`rounded-xl border p-3 text-left transition ${
                        form.action === opt.v
                          ? 'border-brand-600 bg-brand-50 dark:bg-brand-950/40'
                          : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'
                      }`}
                    >
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{opt.label}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{opt.hint}</p>
                    </button>
                  ))}
                </div>

                {form.action === 'schedule' && (
                  <div className="pt-1">
                    <Input
                      type="datetime-local"
                      value={form.scheduledAt}
                      onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDialog(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button onClick={() => void handleSubmit()} disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editing
                  ? 'Save changes'
                  : form.action === 'send'
                    ? 'Send announcement'
                    : form.action === 'schedule'
                      ? 'Schedule announcement'
                      : 'Save draft'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
