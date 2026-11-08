import { useEffect, useRef, useState } from 'react'
import { Trash2, Edit, Loader2, Plus, ImageIcon, ChevronDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import { dateAfter, isUrl, maxLength, required, validate } from '@/lib/validate'
import api from '@/lib/api'

// ─── All app pages for the redirect picker ────────────────────────────────────
const APP_PAGES = [
  { label: '— Select a page —', value: '' },
  // Overview
  { label: 'Dashboard',         value: '/dashboard' },
  { label: 'Reports',           value: '/reports' },
  // Operations
  { label: 'Customers',         value: '/customers' },
  { label: 'Partners',          value: '/partners' },
  { label: 'Products',          value: '/products' },
  { label: 'Orders',            value: '/orders' },
  { label: 'Ride',              value: '/ride' },
  { label: 'Marketing',         value: '/marketing' },
  { label: 'Flash Deals',       value: '/flash-deals' },
  { label: 'Bid Control',       value: '/bids' },
  { label: 'Support',           value: '/support' },
  { label: 'Delivery',          value: '/delivery' },
  { label: 'Finance',           value: '/finance' },
  { label: 'Approvals',         value: '/approvals' },
  { label: 'Banners',           value: '/banners' },
  { label: 'About',             value: '/about' },
  // Admin
  { label: 'Manage Users',      value: '/users' },
  { label: 'Notifications',     value: '/notifications' },
  { label: 'Settings',          value: '/settings' },
  { label: 'Audit Log',         value: '/settings/audit-log' },
  // Other
  { label: 'Custom URL…',       value: '__custom__' },
]

// ─── Redirect URL field: page picker + optional custom URL input ──────────────
function RedirectUrlField({
  value,
  onChange,
}: {
  value: string
  onChange: (url: string) => void
}) {
  // Determine if the current value matches a known page
  const isKnown = APP_PAGES.some((p) => p.value === value && p.value !== '' && p.value !== '__custom__')
  const [mode, setMode] = useState<'page' | 'custom'>(
    value === '' || isKnown ? 'page' : 'custom',
  )
  // selectValue is what the <select> shows
  const selectValue = mode === 'custom' ? '__custom__' : value

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value
    if (v === '__custom__') {
      setMode('custom')
      onChange('')
    } else {
      setMode('page')
      onChange(v)
    }
  }

  return (
    <div className="space-y-2">
      {/* Page picker */}
      <div className="relative">
        <select
          value={selectValue}
          onChange={handleSelect}
          className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 pr-9 text-sm text-slate-900 shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        >
          {APP_PAGES.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>

      {/* Custom URL input — shown only when "Custom URL…" is selected */}
      {mode === 'custom' && (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://example.com/any-page"
          autoFocus
        />
      )}
    </div>
  )
}

interface PaymentBanner {
  id: string
  title: string
  description: string
  image_url: string
  valid_from: string
  valid_until: string
  redirect_url: string
  is_active: boolean
  created_at: string
}

// ─── Image field: URL input + file upload button ───────────────────────────────
function ImageField({
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
      form.append('folder', 'banners')

      const res = await api.post('/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      onChange(res.data.url)
    } catch (err: any) {
      setUploadError(err.response?.data?.message ?? 'Upload failed')
    } finally {
      setUploading(false)
      // reset so same file can be re-selected
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://example.com/banner.jpg"
          className="flex-1"
        />
        {/* Hidden file input */}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />
        {/* + button opens file picker */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 px-3"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
          title="Upload image from computer"
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

      {/* Preview */}
      {value && (
        <div className="relative h-24 w-40 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
          <img
            src={value}
            alt="Preview"
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none'
            }}
          />
        </div>
      )}
    </div>
  )
}

// ─── Form fields shared between add & edit dialogs ────────────────────────────
function BannerForm({
  formData,
  onChange,
}: {
  formData: {
    title: string
    description: string
    image_url: string
    valid_from: string
    valid_until: string
    redirect_url: string
  }
  onChange: (patch: Partial<typeof formData>) => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="b-title">Title</Label>
        <Input
          id="b-title"
          value={formData.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="e.g., 50% OFF Electronics"
        />
      </div>

      <div>
        <Label htmlFor="b-description">Description</Label>
        <Textarea
          id="b-description"
          value={formData.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Banner description"
          rows={3}
        />
      </div>

      <div>
        <Label>Image</Label>
        <ImageField
          value={formData.image_url}
          onChange={(url) => onChange({ image_url: url })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="b-valid_from">Valid From</Label>
          <Input
            id="b-valid_from"
            type="date"
            value={formData.valid_from}
            onChange={(e) => onChange({ valid_from: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="b-valid_until">Valid Until</Label>
          <Input
            id="b-valid_until"
            type="date"
            value={formData.valid_until}
            onChange={(e) => onChange({ valid_until: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label>Redirect to page (optional)</Label>
        <RedirectUrlField
          value={formData.redirect_url}
          onChange={(url) => onChange({ redirect_url: url })}
        />
      </div>
    </div>
  )
}

// ─── Empty form helper ─────────────────────────────────────────────────────────
const emptyForm = () => ({
  title: '',
  description: '',
  image_url: '',
  valid_from: '',
  valid_until: '',
  redirect_url: '',
})

// ─── Main page ─────────────────────────────────────────────────────────────────
export function PaymentBannersPage() {
  const confirmDialog = useConfirm()
  const [banners, setBanners] = useState<PaymentBanner[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingBanner, setEditingBanner] = useState<PaymentBanner | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState(emptyForm())

  const fetchBanners = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get('/banners/payment/all')
      setBanners((response.data.banners ?? []) as PaymentBanner[])
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to load banners')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    setError(null)
    const err = validate(
      required(formData.title, 'Title'),
      maxLength(formData.title, 100, 'Title'),
      maxLength(formData.description, 500, 'Description'),
      formData.image_url ? isUrl(formData.image_url) : null,
      formData.redirect_url && formData.redirect_url !== '' && !formData.redirect_url.startsWith('/')
        ? isUrl(formData.redirect_url)
        : null,
      formData.valid_from && formData.valid_until
        ? dateAfter(formData.valid_until, formData.valid_from, 'Valid Until', 'Valid From')
        : null,
    )
    if (err) { setError(err); return }
    setSubmitting(true)
    try {
      if (editingBanner) {
        await api.patch(`/banners/payment/${editingBanner.id}`, formData)
      } else {
        await api.post('/banners/payment', formData)
      }
      await fetchBanners()
      setShowAddDialog(false)
      setShowEditDialog(false)
      setEditingBanner(null)
      setFormData(emptyForm())
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to save banner')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (banner: PaymentBanner) => {
    setEditingBanner(banner)
    setFormData({
      title: banner.title,
      description: banner.description,
      image_url: banner.image_url,
      valid_from: banner.valid_from ? banner.valid_from.split('T')[0] : '',
      valid_until: banner.valid_until ? banner.valid_until.split('T')[0] : '',
      redirect_url: banner.redirect_url,
    })
    setShowEditDialog(true)
  }

  const handleDelete = async (id: string) => {
    const ok = await confirmDialog({
      title: 'Delete this banner?',
      message: 'This payment banner will be removed permanently.',
      confirmText: 'Delete',
      variant: 'danger',
    })
    if (!ok) return
    try {
      await api.delete(`/banners/payment/${id}`)
      await fetchBanners()
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to delete banner')
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString()
  }

  useEffect(() => {
    fetchBanners()
  }, [])

  if (loading && banners.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-brand-600">Banner management</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Payment Banners</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchBanners} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Refresh
          </Button>
          <Button onClick={() => {
            setEditingBanner(null)
            setFormData(emptyForm())
            setShowAddDialog(true)
          }}>
            Add Banner
          </Button>
        </div>
      </div>

      {error && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left dark:border-slate-800">
                {['Image', 'Title', 'Valid From', 'Valid Until', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {banners.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    No payment banners found.
                  </td>
                </tr>
              )}
              {banners.map((banner) => (
                <tr key={banner.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3">
                    {banner.image_url ? (
                      <img src={banner.image_url} alt={banner.title} className="h-12 w-20 object-cover rounded" />
                    ) : (
                      <div className="h-12 w-20 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center text-slate-400">
                        <ImageIcon className="h-5 w-5" />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{banner.title}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{formatDate(banner.valid_from)}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{formatDate(banner.valid_until)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${banner.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                      {banner.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(banner)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(banner.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowAddDialog(false)}>
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">Add Payment Banner</h2>
            <BannerForm
              formData={formData}
              onChange={(patch) => setFormData((prev) => ({ ...prev, ...patch }))}
            />
            <div className="flex gap-2 justify-end mt-6">
              <Button variant="outline" onClick={() => setShowAddDialog(false)} disabled={submitting}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {submitting ? 'Saving...' : 'Save Banner'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      {showEditDialog && editingBanner && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowEditDialog(false)}>
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">Edit Payment Banner</h2>
            <BannerForm
              formData={formData}
              onChange={(patch) => setFormData((prev) => ({ ...prev, ...patch }))}
            />
            <div className="flex gap-2 justify-end mt-6">
              <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={submitting}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {submitting ? 'Saving...' : 'Update Banner'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
