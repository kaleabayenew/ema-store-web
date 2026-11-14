import { useEffect, useState } from 'react'
import { Building2, Boxes, CheckCircle2, XCircle, Loader2, Mail } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { useConfirm } from '@/components/ui/ConfirmDialog'

type ApprovalType = 'PARTNER' | 'PRODUCT'

interface ApprovalDetail {
  [key: string]: unknown
}

interface ApprovalItem {
  id: string
  type: ApprovalType
  name: string
  submittedBy: string
  submittedAt: string | null
  email: string | null
  category?: string | null
  price?: number | null
  stock?: number | null
  imageUrl?: string | null
  detail: ApprovalDetail
}

function formatDate(d: string | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function DetailRow({ label, value }: { label: string; value: unknown }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-right text-sm font-medium text-slate-900 dark:text-slate-100">{String(value)}</span>
    </div>
  )
}

export function ApprovalsPage() {
  const { user } = useAuthStore()
  const confirmDialog = useConfirm()
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'

  const [items, setItems] = useState<ApprovalItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'All' | ApprovalType>('All')
  const [selected, setSelected] = useState<ApprovalItem | null>(null)
  const [acting, setActing] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionResult, setActionResult] = useState<string | null>(null)
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  const fetchApprovals = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get<{ partners: ApprovalItem[]; products: ApprovalItem[] }>('/admin/approvals')
      setItems([...(res.data.partners ?? []), ...(res.data.products ?? [])])
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to load approvals')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchApprovals() }, [])

  const pendingPartners = items.filter((i) => i.type === 'PARTNER').length
  const pendingProducts = items.filter((i) => i.type === 'PRODUCT').length

  const filtered = items.filter((i) => filter === 'All' || i.type === filter)

  const closeModal = () => {
    setSelected(null)
    setActionError(null)
    setActionResult(null)
    setShowRejectForm(false)
    setRejectReason('')
  }

  const review = async (action: 'approve' | 'reject') => {
    if (!selected) return
    setActing(true)
    setActionError(null)
    setActionResult(null)
    try {
      const res = await api.post<{ emailSent: boolean }>(
        `/admin/approvals/${selected.type}/${selected.id}/review`,
        { action, reason: action === 'reject' ? rejectReason.trim() : undefined },
      )
      setActionResult(
        action === 'approve'
          ? `Approved. ${res.data.emailSent ? 'Notification email sent.' : 'Email not sent (no address or SMTP not configured).'}`
          : `Rejected. ${res.data.emailSent ? 'Notification email sent.' : 'Email not sent (no address or SMTP not configured).'}`,
      )
      setItems((prev) => prev.filter((i) => !(i.type === selected.type && i.id === selected.id)))
      setTimeout(closeModal, 1200)
    } catch (err: any) {
      setActionError(err.response?.data?.message ?? 'Action failed')
    } finally {
      setActing(false)
    }
  }

  const handleApprove = async () => {
    if (!selected) return
    const ok = await confirmDialog({
      title: `Approve ${selected.name}?`,
      message: 'This will approve the submission and email a notification to the partner.',
      confirmText: 'Approve',
    })
    if (ok) review('approve')
  }

  const handleRejectClick = async () => {
    if (!selected) return
    if (!rejectReason.trim()) {
      const ok = await confirmDialog({
        title: `Reject ${selected.name}?`,
        message: 'A rejection reason is required and will be included in the email to the partner.',
        confirmText: 'Continue',
      })
      if (!ok) return
    }
    setShowRejectForm(true)
  }

  const stats = [
    { label: 'Pending partners', value: pendingPartners, icon: Building2 },
    { label: 'Pending products', value: pendingProducts, icon: Boxes },
    { label: 'Total pending',   value: items.length,        icon: CheckCircle2 },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-brand-600">Approvals queue</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Approvals</h1>
        </div>
        <Button variant="outline" onClick={fetchApprovals} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Refresh
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">{label}</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300"><Icon className="h-4 w-4" /></span>
            </div>
            <p className="mt-4 text-2xl font-semibold text-slate-900 dark:text-slate-100">{value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap gap-2 border-b border-slate-200 p-4 dark:border-slate-800">
          {(['All', 'PARTNER', 'PRODUCT'] as const).map((f) => (
            <button key={f} type="button" onClick={() => setFilter(f)}
              className={`rounded-xl px-3 py-1.5 text-xs font-medium capitalize transition ${filter === f ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'}`}>
              {f === 'PARTNER' ? 'Partners' : f === 'PRODUCT' ? 'Products' : 'All'}
            </button>
          ))}
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-7 w-7 animate-spin text-brand-600" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-slate-400">
              <CheckCircle2 className="h-10 w-10 opacity-40" />
              <p className="text-sm">Nothing pending approval.</p>
            </div>
          ) : filtered.map((item) => (
            <button key={`${item.type}-${item.id}`} type="button" onClick={() => setSelected(item)}
              className="flex w-full items-center justify-between gap-3 p-4 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <div className="flex min-w-0 items-center gap-3">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt="" className="h-10 w-10 flex-shrink-0 rounded-lg object-cover" />
                ) : (
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800">
                    {item.type === 'PARTNER' ? <Building2 className="h-5 w-5" /> : <Boxes className="h-5 w-5" />}
                  </span>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant={item.type === 'PARTNER' ? 'info' : 'warning'} className="text-[10px]">{item.type}</Badge>
                  </div>
                  <p className="mt-1 truncate font-medium text-slate-900 dark:text-slate-100">{item.name}</p>
                  <p className="text-xs text-slate-500">
                    {item.submittedBy}
                    {item.submittedAt ? ` · ${formatDate(item.submittedAt)}` : ''}
                  </p>
                </div>
              </div>
              <Badge variant="warning">Pending</Badge>
            </button>
          ))}
        </div>
      </div>

      {/* Detail popup */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={closeModal}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <Badge variant={selected.type === 'PARTNER' ? 'info' : 'warning'}>{selected.type === 'PARTNER' ? 'Partner application' : 'Product submission'}</Badge>
              <button type="button" onClick={closeModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" aria-label="Close">✕</button>
            </div>

            <div className="flex items-center gap-4">
              {selected.imageUrl || selected.detail.logoUrl ? (
                <img src={String(selected.imageUrl || selected.detail.logoUrl)} alt="" className="h-16 w-16 flex-shrink-0 rounded-xl object-cover" />
              ) : (
                <span className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800">
                  {selected.type === 'PARTNER' ? <Building2 className="h-8 w-8" /> : <Boxes className="h-8 w-8" />}
                </span>
              )}
              <div className="min-w-0">
                <h2 className="truncate text-xl font-semibold text-slate-900 dark:text-slate-100">{selected.name}</h2>
                <p className="text-sm text-slate-500">Submitted by {selected.submittedBy}{selected.submittedAt ? ` on ${formatDate(selected.submittedAt)}` : ''}</p>
              </div>
            </div>

            <div className="mt-5 divide-y divide-slate-100 rounded-xl border border-slate-200 px-4 dark:divide-slate-800 dark:border-slate-800">
              {selected.type === 'PARTNER' ? (
                <>
                  <DetailRow label="Business name" value={selected.detail.businessName} />
                  <DetailRow label="Owner name" value={selected.detail.ownerName} />
                  <DetailRow label="Account email" value={selected.detail.accountEmail} />
                  <DetailRow label="Partner email" value={selected.detail.partnerEmail} />
                  <DetailRow label="Phone" value={selected.detail.phone} />
                  <DetailRow label="City" value={selected.detail.city} />
                  <DetailRow label="Address" value={selected.detail.address} />
                  <DetailRow label="Rating" value={selected.detail.rating ? `${selected.detail.rating} (${selected.detail.reviewCount} reviews)` : 'No reviews yet'} />
                  <DetailRow label="Products" value={selected.detail.productCount} />
                </>
              ) : (
                <>
                  <DetailRow label="Product" value={selected.detail.name} />
                  <DetailRow label="Category" value={selected.detail.category} />
                  <DetailRow label="Price" value={selected.detail.price != null ? `ETB ${selected.detail.price}` : null} />
                  <DetailRow label="Stock" value={selected.detail.stock} />
                  <DetailRow label="Partner" value={selected.detail.partnerName} />
                  <DetailRow label="Partner owner" value={selected.detail.partnerOwner} />
                  <DetailRow label="Partner email" value={selected.detail.partnerEmail} />
                </>
              )}
              <DetailRow label="Submitted" value={formatDate(selected.submittedAt)} />
            </div>

            {Boolean(selected.detail.description || selected.detail.address) && (
              <div className="mt-4">
                {selected.detail.description ? (
                  <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-300">{String(selected.detail.description)}</p>
                ) : null}
              </div>
            )}

            {actionResult && (
              <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">{actionResult}</p>
            )}
            {actionError && (
              <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-400">{actionError}</p>
            )}

            {isSuperAdmin && !actionResult && (
              <div className="mt-5 space-y-3">
                {showRejectForm && (
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Rejection reason (sent by email)</label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      rows={3}
                      maxLength={500}
                      placeholder="e.g. Missing business license / duplicate product…"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                  </div>
                )}
                <div className="flex gap-3">
                  <Button className="flex-1 gap-2 bg-brand-600 hover:bg-brand-700" onClick={handleApprove} disabled={acting}>
                    {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}Approve
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 gap-2 border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
                    onClick={showRejectForm ? () => review('reject') : handleRejectClick}
                    disabled={acting || (showRejectForm && !rejectReason.trim())}
                  >
                    {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                    {showRejectForm ? 'Confirm reject' : 'Reject'}
                  </Button>
                </div>
              </div>
            )}

            {!isSuperAdmin && (
              <p className="mt-5 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                <Mail className="h-3.5 w-3.5" /> Only a super admin can approve or reject submissions.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
