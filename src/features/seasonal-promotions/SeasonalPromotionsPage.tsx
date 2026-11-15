import { useState, useEffect } from 'react'
import { CalendarDays, Check, Clock, Plus, Search, Tag, Trash2, Pencil, Sparkles, X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import { DealImageField } from '@/features/flash-deals/FlashDealsPage'
import { dateAfter, dateInFuture, inRange, isInteger, isUrl, maxLength, required, validate } from '@/lib/validate'
import { api } from '@/lib/api'
import { apiErrorMessage } from '@/lib/errors'

interface SeasonalPromotion {
  id: string
  title: string
  subtitle: string | null
  description: string | null
  image_url: string | null
  category: string
  discount_percent: number | null
  starts_at: string
  ends_at: string
  sort_order: number
  is_active: boolean
  created_at: string
}

interface PickableProduct {
  id: string
  nameEn: string
  primaryImageUrl: string | null
  priceCents?: number
}

interface PromoForm {
  title: string
  subtitle: string
  description: string
  image_url: string
  category: string
  discount_percent: string
  sort_order: string
  starts_at: string
  ends_at: string
}

const CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'fashion', label: 'Fashion' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'shoes', label: 'Shoes' },
  { value: 'food-drink', label: 'Food & Drink' },
  { value: 'phones', label: 'Phones' },
  { value: 'watches', label: 'Watches' },
  { value: 'home-living', label: 'Home' },
]

const categoryLabel = (slug: string) =>
  CATEGORIES.find((c) => c.value === slug)?.label ?? slug

const emptyForm: PromoForm = {
  title: '',
  subtitle: '',
  description: '',
  image_url: '',
  category: 'all',
  discount_percent: '',
  sort_order: '0',
  starts_at: '',
  ends_at: '',
}

const toLocalInput = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100'

export function SeasonalPromotionsPage() {
  const confirmDialog = useConfirm()
  const [promotions, setPromotions] = useState<SeasonalPromotion[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editing, setEditing] = useState<SeasonalPromotion | null>(null)
  const [filter, setFilter] = useState<'All' | 'Active' | 'Ended'>('All')
  const [form, setForm] = useState<PromoForm>(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [imageUploading, setImageUploading] = useState(false)
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [allProducts, setAllProducts] = useState<PickableProduct[]>([])
  const [productSearch, setProductSearch] = useState('')
  const [pickerLoading, setPickerLoading] = useState(false)

  useEffect(() => {
    loadPromotions()
  }, [])

  const loadPromotions = async () => {
    try {
      setLoading(true)
      const response = await api.get('/seasonal-promotions')
      setPromotions(response.data.promotions || [])
    } catch (error) {
      console.error('Failed to load seasonal promotions:', apiErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  const isLive = (p: SeasonalPromotion) => {
    const now = Date.now()
    return p.is_active && new Date(p.starts_at).getTime() <= now && new Date(p.ends_at).getTime() > now
  }
  const isExpired = (p: SeasonalPromotion) => new Date(p.ends_at).getTime() <= Date.now()
  const statusOf = (p: SeasonalPromotion): { label: string; variant: 'success' | 'default' | 'warning' } => {
    if (isExpired(p)) return { label: 'Ended', variant: 'default' }
    if (!p.is_active) return { label: 'Paused', variant: 'warning' }
    if (new Date(p.starts_at).getTime() > Date.now()) return { label: 'Scheduled', variant: 'warning' }
    return { label: 'Active', variant: 'success' }
  }

  const filtered = promotions.filter((p) => {
    if (filter === 'All') return true
    if (filter === 'Active') return isLive(p)
    return !isLive(p)
  })

  const formatTimeRemaining = (endsAt: string) => {
    const diff = new Date(endsAt).getTime() - Date.now()
    if (diff <= 0) return 'Ended'
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`
    return `${hours}h ${minutes}m`
  }

  const handleDelete = async (id: string) => {
    const ok = await confirmDialog({
      title: 'Delete this promotion?',
      message: 'This seasonal promotion will be removed permanently.',
      confirmText: 'Delete',
      variant: 'danger',
    })
    if (!ok) return
    try {
      await api.delete(`/seasonal-promotions/${id}`)
      setPromotions(promotions.filter((p) => p.id !== id))
    } catch (error) {
      console.error('Failed to delete promotion:', apiErrorMessage(error))
    }
  }

  const handleToggleActive = async (id: string) => {
    try {
      const promo = promotions.find((p) => p.id === id)
      if (promo) {
        await api.patch(`/seasonal-promotions/${id}`, { isActive: !promo.is_active, is_active: !promo.is_active })
        setPromotions(promotions.map((p) => (p.id === id ? { ...p, is_active: !p.is_active } : p)))
      }
    } catch (error) {
      console.error('Failed to toggle promotion:', apiErrorMessage(error))
    }
  }

  const openCreateDialog = () => {
    setEditing(null)
    setSelectedProductIds([])
    const now = new Date()
    const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    setForm({ ...emptyForm, starts_at: toLocalInput(now), ends_at: toLocalInput(in30) })
    setFormError(null)
    setShowDialog(true)
  }

  const openEditDialog = async (promo: SeasonalPromotion) => {
    setEditing(promo)
    setForm({
      title: promo.title,
      subtitle: promo.subtitle ?? '',
      description: promo.description ?? '',
      image_url: promo.image_url ?? '',
      category: promo.category || 'all',
      discount_percent: promo.discount_percent != null ? String(promo.discount_percent) : '',
      sort_order: String(promo.sort_order ?? 0),
      starts_at: toLocalInput(new Date(promo.starts_at)),
      ends_at: toLocalInput(new Date(promo.ends_at)),
    })
    setFormError(null)
    setShowDialog(true)
    // Load linked products for pre-selection
    try {
      const res = await api.get(`/seasonal-promotions/${promo.id}`)
      const ids = res.data?.promotion?.product_ids ?? res.data?.product_ids ?? []
      setSelectedProductIds(Array.isArray(ids) ? ids.map(String) : [])
    } catch {
      setSelectedProductIds([])
    }
  }

  const openProductPicker = async () => {
    setPickerOpen(true)
    setProductSearch('')
    if (allProducts.length === 0) {
      setPickerLoading(true)
      try {
        const res = await api.get('/products', { params: { limit: 200 } })
        const rows = (res.data.products ?? []) as Array<Record<string, unknown>>
        setAllProducts(
          rows.map((p) => ({
            id: String(p.id),
            nameEn: String(p.nameEn ?? p.name_en ?? ''),
            primaryImageUrl: (p.primaryImageUrl ?? p.primary_image_url ?? null) as string | null,
            priceCents: typeof p.priceCents === 'number' ? p.priceCents : undefined,
          })),
        )
      } catch (err) {
        console.error('Failed to load products:', apiErrorMessage(err))
      } finally {
        setPickerLoading(false)
      }
    }
  }

  const toggleProduct = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const filteredPickerProducts = allProducts.filter((p) =>
    p.nameEn.toLowerCase().includes(productSearch.trim().toLowerCase()),
  )

  const closeDialog = () => {
    if (submitting || imageUploading) return
    setShowDialog(false)
    setEditing(null)
  }

  const updateForm = (field: keyof PromoForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setFormError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const title = form.title.trim()
    const start = new Date(form.starts_at)
    const end = new Date(form.ends_at)

    if (imageUploading) return setFormError('Please wait for the image to finish uploading.')

    const discountChecks = form.discount_percent.trim()
      ? [
          isInteger(form.discount_percent, 'Discount'),
          inRange(form.discount_percent, 1, 100, 'Discount'),
        ]
      : []

    const err = validate(
      required(title, 'Title'),
      maxLength(title, 255, 'Title'),
      maxLength(form.subtitle.trim(), 255, 'Subtitle'),
      maxLength(form.description.trim(), 1000, 'Description'),
      required(form.starts_at, 'Start time'),
      required(form.ends_at, 'End time'),
      dateAfter(form.ends_at, form.starts_at, 'End time', 'start time'),
      editing ? null : dateInFuture(form.ends_at, 'End time'),
      form.image_url.trim() ? isUrl(form.image_url, true) : null,
      ...discountChecks,
    )
    if (err) return setFormError(err)

    try {
      setSubmitting(true)
      setFormError(null)
      const payload = {
        title,
        subtitle: form.subtitle.trim() || null,
        description: form.description.trim() || null,
        imageUrl: form.image_url.trim() || null,
        category: form.category,
        discountPercent: form.discount_percent.trim() ? Number(form.discount_percent) : null,
        sortOrder: parseInt(form.sort_order, 10) || 0,
        startsAt: start.toISOString(),
        endsAt: end.toISOString(),
        productIds: selectedProductIds,
      }
      if (editing) {
        await api.patch(`/seasonal-promotions/${editing.id}`, payload)
      } else {
        await api.post('/seasonal-promotions', payload)
      }
      setShowDialog(false)
      setEditing(null)
      await loadPromotions()
    } catch (error) {
      console.error('Failed to save promotion:', apiErrorMessage(error))
      const resp = (error as { response?: { data?: { message?: string } } })?.response
      setFormError(resp?.data?.message || 'Could not save the promotion. Please check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-brand-600">Marketing Campaigns</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Seasonal Promotions
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            These appear in the customer app under Seasonal Promotions, filterable by category tab.
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          New Promotion
        </Button>
      </div>

      {/* Promotions list */}
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
          <div className="p-12 text-center text-slate-500">Loading promotions...</div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((promo) => (
              <div key={promo.id} className="p-4">
                <div className="flex gap-4">
                  <div className="h-24 w-32 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                    {promo.image_url ? (
                      <img src={promo.image_url} alt={promo.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-400">
                        <Sparkles className="h-8 w-8" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-slate-900 dark:text-slate-100">{promo.title}</h3>
                          <Badge variant={statusOf(promo).variant}>{statusOf(promo).label}</Badge>
                          <Badge variant="info">{categoryLabel(promo.category)}</Badge>
                        </div>
                        {promo.subtitle && (
                          <p className="mt-0.5 text-sm font-medium text-slate-600 dark:text-slate-300">{promo.subtitle}</p>
                        )}
                        {promo.description && (
                          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{promo.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleToggleActive(promo.id)}>
                          {promo.is_active ? 'Pause' : 'Activate'}
                        </Button>
                        <Button variant="ghost" size="icon" title="Edit" onClick={() => openEditDialog(promo)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Delete" onClick={() => handleDelete(promo.id)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-6 text-sm">
                      {promo.discount_percent != null && (
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4 text-brand-600" />
                          <span className="text-slate-600 dark:text-slate-300">{promo.discount_percent}% off</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-slate-400" />
                        <span className="text-slate-600 dark:text-slate-300">{formatTimeRemaining(promo.ends_at)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500">
                        <CalendarDays className="h-4 w-4 text-slate-400" />
                        <span>
                          {new Date(promo.starts_at).toLocaleDateString()} → {new Date(promo.ends_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="p-12 text-center text-slate-500">No seasonal promotions found</div>
        )}
      </div>

      {/* Create / Edit dialog */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={closeDialog}>
          <form
            onSubmit={handleSubmit}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900"
          >
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
              {editing ? 'Edit Promotion' : 'New Seasonal Promotion'}
            </h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="promo-title" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Title
                </label>
                <input
                  id="promo-title"
                  type="text"
                  value={form.title}
                  onChange={(e) => updateForm('title', e.target.value)}
                  placeholder="Eid Holiday Sale"
                  className={inputClass}
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="promo-subtitle" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Subtitle <span className="text-slate-400">(optional)</span>
                </label>
                <input
                  id="promo-subtitle"
                  type="text"
                  value={form.subtitle}
                  onChange={(e) => updateForm('subtitle', e.target.value)}
                  placeholder="Up to 50% off"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="promo-description" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Description <span className="text-slate-400">(optional)</span>
                </label>
                <textarea
                  id="promo-description"
                  rows={2}
                  value={form.description}
                  onChange={(e) => updateForm('description', e.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="promo-category" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Category tab
                  </label>
                  <select
                    id="promo-category"
                    value={form.category}
                    onChange={(e) => updateForm('category', e.target.value)}
                    className={inputClass}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="promo-discount" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Discount (%) <span className="text-slate-400">(optional)</span>
                  </label>
                  <input
                    id="promo-discount"
                    type="number"
                    min={1}
                    max={100}
                    step={1}
                    value={form.discount_percent}
                    onChange={(e) => updateForm('discount_percent', e.target.value)}
                    placeholder="30"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Products <span className="text-slate-400">(discount applies to these)</span>
                  </label>
                  <Button type="button" variant="outline" size="sm" onClick={openProductPicker}>
                    <Plus className="mr-1 h-3.5 w-3.5" /> Add products
                  </Button>
                </div>
                {selectedProductIds.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-300 px-3 py-2 text-xs text-slate-400 dark:border-slate-700">
                    No products selected — tap "Add products" to pick items for this promotion.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectedProductIds.map((id) => {
                      const p = allProducts.find((x) => x.id === id)
                      return (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:bg-brand-950/40 dark:text-brand-300"
                        >
                          {p?.primaryImageUrl ? (
                            <img src={p.primaryImageUrl} alt="" className="h-4 w-4 rounded-full object-cover" />
                          ) : null}
                          {p?.nameEn ?? id.slice(0, 8)}
                          <button
                            type="button"
                            onClick={() => toggleProduct(id)}
                            className="ml-0.5 text-brand-500 hover:text-red-500"
                            title="Remove"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      )
                    })}
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="promo-sort" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Sort order <span className="text-slate-400">(lower shows first)</span>
                </label>
                <input
                  id="promo-sort"
                  type="number"
                  step={1}
                  value={form.sort_order}
                  onChange={(e) => updateForm('sort_order', e.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="promo-start" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Starts at
                  </label>
                  <input
                    id="promo-start"
                    type="datetime-local"
                    value={form.starts_at}
                    onChange={(e) => updateForm('starts_at', e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="promo-end" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Ends at
                  </label>
                  <input
                    id="promo-end"
                    type="datetime-local"
                    value={form.ends_at}
                    onChange={(e) => updateForm('ends_at', e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="promo-image" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Image <span className="text-slate-400">(optional)</span>
                </label>
                <DealImageField
                  value={form.image_url}
                  onChange={(url) => updateForm('image_url', url)}
                  onUploadingChange={setImageUploading}
                />
              </div>

              {formError && (
                <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
                  {formError}
                </p>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={closeDialog} disabled={submitting || imageUploading}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || imageUploading}>
                {submitting ? 'Saving...' : imageUploading ? 'Uploading image...' : editing ? 'Save changes' : 'Create'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Product picker modal */}
      {pickerOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={() => setPickerOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Select products ({selectedProductIds.length})
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setPickerOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="border-b border-slate-200 p-3 dark:border-slate-800">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search products..."
                  className={`${inputClass} pl-9`}
                  autoFocus
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {pickerLoading ? (
                <p className="p-8 text-center text-sm text-slate-500">Loading products...</p>
              ) : filteredPickerProducts.length === 0 ? (
                <p className="p-8 text-center text-sm text-slate-500">No products found</p>
              ) : (
                filteredPickerProducts.map((p) => {
                  const selected = selectedProductIds.includes(p.id)
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggleProduct(p.id)}
                      className={`flex w-full items-center gap-3 rounded-xl p-2 text-left transition ${
                        selected ? 'bg-brand-50 dark:bg-brand-950/40' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                        {p.primaryImageUrl ? (
                          <img src={p.primaryImageUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-300">
                            <Sparkles className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                      <span className="flex-1 truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                        {p.nameEn}
                      </span>
                      {selected && <Check className="h-4 w-4 text-brand-600" />}
                    </button>
                  )
                })
              )}
            </div>
            <div className="flex justify-end border-t border-slate-200 p-3 dark:border-slate-800">
              <Button onClick={() => setPickerOpen(false)}>Done</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
