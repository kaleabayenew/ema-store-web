import { useCallback, useEffect, useState } from 'react'
import {
  Gavel, Plus, Search, X, Package, Loader2, AlertCircle,
  ChevronLeft, ChevronRight, Image as ImageIcon, Pencil, Trash2, Eye, Users,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Bid {
  id: string
  title: string
  productId: string
  productName: string
  productImage: string | null
  startPrice: number
  minIncrement: number
  startsAt: string
  endsAt: string
  status: 'DRAFT' | 'ACTIVE' | 'ENDED'
  totalBidders: number
  lowestBid: number
  highestBid: number
  totalCollected: number
  entries?: Bidder[]
}

interface Bidder {
  id: string
  name: string
  phone: string
  amount: number
  at: string
}

interface Product {
  id: string
  nameEn: string
  priceCents: number
  primaryImageUrl: string | null
  categoryName: string | null
  stock: number
}

interface Category { id: string; name_en: string }

// ── Helpers ───────────────────────────────────────────────────────────────────

const toLocalInput = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const formatPrice = (cents: number) =>
  `ETB ${(cents / 100).toLocaleString('en-ET', { minimumFractionDigits: 2 })}`

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100'

// ── Page ──────────────────────────────────────────────────────────────────────

export function BidControlPage() {
  const [bids, setBids]       = useState<Bid[]>([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  // form state
  const [showForm, setShowForm]     = useState(false)
  const [editingId, setEditingId]   = useState<string | null>(null)
  const [saving, setSaving]         = useState(false)
  const [form, setForm] = useState({
    title: '', productId: '', productName: '',
    productImage: '' as string | null,
    startPrice: '', minIncrement: '10', startsAt: '', endsAt: '',
  })
  const [formError, setFormError]               = useState<string | null>(null)
  const [showProductPicker, setShowProductPicker] = useState(false)
  const [deleting, setDeleting]                 = useState<string | null>(null)

  // detail modal
  const [viewingBid, setViewingBid]       = useState<Bid | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // ── Fetch ────────────────────────────────────────────────────────────────────

  const fetchBids = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get<{ bids: Bid[]; total: number }>('/bids', { params: { limit: 50 } })
      setBids(res.data.bids ?? [])
      setTotal(res.data.total ?? 0)
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to load bids')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchBids() }, [fetchBids])

  // ── Form helpers ─────────────────────────────────────────────────────────────

  function openCreate() {
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    setEditingId(null)
    setForm({
      title: '', productId: '', productName: '', productImage: null,
      startPrice: '', minIncrement: '10',
      startsAt: toLocalInput(now), endsAt: toLocalInput(tomorrow),
    })
    setFormError(null)
    setShowForm(true)
  }

  function openEdit(bid: Bid) {
    setEditingId(bid.id)
    setForm({
      title: bid.title,
      productId: bid.productId,
      productName: bid.productName,
      productImage: bid.productImage,
      startPrice: String(bid.startPrice),
      minIncrement: String(bid.minIncrement),
      startsAt: toLocalInput(new Date(bid.startsAt)),
      endsAt: toLocalInput(new Date(bid.endsAt)),
    })
    setFormError(null)
    setShowForm(true)
  }

  function updateForm(field: keyof typeof form, value: string) {
    setForm((p) => ({ ...p, [field]: value }))
    setFormError(null)
  }

  function selectProduct(p: Product) {
    setForm((f) => ({
      ...f,
      productId: p.id,
      productName: p.nameEn,
      productImage: p.primaryImageUrl,
      startPrice: f.startPrice || (p.priceCents / 100).toString(),
    }))
    setShowProductPicker(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const title        = form.title.trim()
    const startPrice   = Number(form.startPrice)
    const minIncrement = Number(form.minIncrement)
    const start        = new Date(form.startsAt)
    const end          = new Date(form.endsAt)

    if (!title)            return setFormError('Title is required.')
    if (!form.productId)   return setFormError('Please select a product.')
    if (!startPrice || startPrice <= 0) return setFormError('Starting price must be greater than 0.')
    if (!minIncrement || minIncrement <= 0) return setFormError('Min increment must be greater than 0.')
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return setFormError('Choose valid start and end times.')
    if (end <= start)      return setFormError('End time must be after the start time.')

    setSaving(true)
    setFormError(null)
    try {
      const payload = {
        title,
        productId:    form.productId,
        startPrice,
        minIncrement,
        startsAt:     start.toISOString(),
        endsAt:       end.toISOString(),
      }
      if (editingId) {
        await api.patch(`/bids/${editingId}`, payload)
      } else {
        await api.post('/bids', payload)
      }
      setShowForm(false)
      fetchBids()
    } catch (err: any) {
      setFormError(err.response?.data?.message ?? 'Failed to save bid')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this bid?')) return
    setDeleting(id)
    try {
      await api.delete(`/bids/${id}`)
      fetchBids()
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Delete failed')
    } finally {
      setDeleting(null)
    }
  }

  async function handleView(bid: Bid) {
    setViewingBid(bid) // show modal immediately with basic info
    setDetailLoading(true)
    try {
      const res = await api.get<{ bid: Bid }>(`/bids/${bid.id}`)
      setViewingBid(res.data.bid)
    } catch {
      // keep showing basic info
    } finally {
      setDetailLoading(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-brand-600">Auction management</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Bid Control</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchBids} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Refresh
          </Button>
          <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Add Bid</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Total bids', value: total,                                           color: 'text-brand-600'   },
          { label: 'Active',     value: bids.filter((b) => b.status === 'ACTIVE').length, color: 'text-emerald-600' },
          { label: 'Drafts',     value: bids.filter((b) => b.status === 'DRAFT').length,  color: 'text-amber-600'   },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">{label}</span>
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 ${color}`}>
                <Gavel className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-4 text-2xl font-semibold text-slate-900 dark:text-slate-100">{value}</p>
          </div>
        ))}
      </div>

      {/* Bids table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {error && (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-400">
            {error}
          </div>
        )}
        {loading && bids.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-brand-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left dark:border-slate-800">
                  {['Bid', 'Start price', 'Min increment', 'Ends', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {bids.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                      <Gavel className="mx-auto mb-2 h-8 w-8" />
                      No bids yet. Click "Add Bid" to create one.
                    </td>
                  </tr>
                )}
                {bids.map((b) => (
                  <tr key={b.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    {/* Bid */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                          {b.productImage
                            ? <img src={b.productImage} alt={b.productName} className="h-full w-full object-cover" />
                            : <div className="flex h-full w-full items-center justify-center"><ImageIcon className="h-4 w-4 text-slate-400" /></div>}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate max-w-[200px] font-medium text-slate-900 dark:text-slate-100">{b.title}</p>
                          <p className="truncate max-w-[200px] text-xs text-slate-400">{b.productName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-brand-700 dark:text-brand-300">ETB {b.startPrice.toLocaleString()}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">ETB {b.minIncrement.toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{new Date(b.endsAt).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <Badge variant={b.status === 'ACTIVE' ? 'success' : b.status === 'DRAFT' ? 'warning' : 'default'}>
                        {b.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" title="View"   onClick={() => handleView(b)}><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" title="Edit"   onClick={() => openEdit(b)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" title="Delete" disabled={deleting === b.id} onClick={() => handleDelete(b.id)}>
                          {deleting === b.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-red-600" />}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Create / Edit Bid Modal ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleSubmit}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {editingId ? 'Edit Bid' : 'Create Bid'}
              </h2>
              <button type="button" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Title</label>
                <input className={inputClass} value={form.title} onChange={(e) => updateForm('title', e.target.value)} placeholder="Weekend auction" autoFocus />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Product</label>
                <div className="flex items-center gap-2">
                  <input className={inputClass} value={form.productName} placeholder="Select a product" readOnly />
                  <button
                    type="button"
                    onClick={() => setShowProductPicker(true)}
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white hover:bg-brand-700"
                    title="Select product"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
                {form.productId && <p className="mt-1 text-xs text-slate-400 font-mono">ID: {form.productId.slice(0, 16)}…</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Starting price (ETB)</label>
                  <input type="number" min={1} step="0.01" className={inputClass} value={form.startPrice} onChange={(e) => updateForm('startPrice', e.target.value)} placeholder="0.00" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Min increment (ETB)</label>
                  <input type="number" min={1} step="0.01" className={inputClass} value={form.minIncrement} onChange={(e) => updateForm('minIncrement', e.target.value)} placeholder="10" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Starts at</label>
                  <input type="datetime-local" className={inputClass} value={form.startsAt} onChange={(e) => updateForm('startsAt', e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Ends at</label>
                  <input type="datetime-local" className={inputClass} value={form.endsAt} onChange={(e) => updateForm('endsAt', e.target.value)} />
                </div>
              </div>

              {formError && (
                <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
                  {formError}
                </p>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)} disabled={saving}>Cancel</Button>
              <Button type="submit" disabled={saving}>
                {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : editingId ? 'Save Changes' : 'Create Bid'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* ── Product Picker ── */}
      {showProductPicker && <ProductPicker onPick={selectProduct} onClose={() => setShowProductPicker(false)} />}

      {/* ── Bid Detail Modal ── */}
      {viewingBid && <BidDetail bid={viewingBid} loading={detailLoading} onClose={() => setViewingBid(null)} />}
    </div>
  )
}

// ── Bid Detail ────────────────────────────────────────────────────────────────

function BidDetail({ bid, loading, onClose }: { bid: Bid; loading: boolean; onClose: () => void }) {
  const bidders       = (bid.entries ?? []).slice().sort((a, b) => b.amount - a.amount)
  const totalBidders  = bid.totalBidders
  const lowestBid     = bid.lowestBid
  const totalCollected = bid.totalCollected
  const initialCost   = bid.startPrice

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-brand-600 to-brand-500 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-100">Bid</p>
            <h2 className="text-lg font-bold text-white">{bid.title}</h2>
          </div>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30">✕</button>
        </div>

        <div className="space-y-4 p-5">
          {/* Product */}
          <div className="flex gap-4">
            <div className="h-20 w-24 flex-shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
              {bid.productImage
                ? <img src={bid.productImage} alt={bid.productName} className="h-full w-full object-cover" />
                : <div className="flex h-full w-full items-center justify-center"><ImageIcon className="h-6 w-6 text-slate-400" /></div>}
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-400">Product</p>
              <p className="font-semibold text-slate-900 dark:text-slate-100">{bid.productName}</p>
              <p className="mt-0.5 text-xs text-slate-400 font-mono">ID: {bid.productId.slice(0, 16)}…</p>
              <div className="mt-1">
                <Badge variant={bid.status === 'ACTIVE' ? 'success' : bid.status === 'DRAFT' ? 'warning' : 'default'}>{bid.status}</Badge>
              </div>
            </div>
          </div>

          {/* Stat tiles */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Material initial cost', value: `ETB ${initialCost.toLocaleString()}` },
              { label: 'Total collected',        value: `ETB ${totalCollected.toLocaleString()}`, highlight: true },
              { label: 'Total bidders',           value: String(totalBidders), useIcon: true },
              { label: 'Lowest bid',              value: lowestBid > 0 ? `ETB ${lowestBid.toLocaleString()}` : '—' },
            ].map(({ label, value, highlight, useIcon }) => (
              <div key={label} className={`rounded-xl p-3 ${highlight ? 'bg-emerald-50 ring-1 ring-emerald-200 dark:bg-emerald-900/20 dark:ring-emerald-900' : 'bg-slate-50 dark:bg-slate-800'}`}>
                <p className="flex items-center gap-1 text-xs text-slate-400">
                  {useIcon && <Users className="h-3 w-3" />}{label}
                </p>
                <p className={`mt-1 text-sm font-bold ${highlight ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-100'}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Schedule */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
              <p className="text-xs text-slate-400">Starts</p>
              <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{new Date(bid.startsAt).toLocaleString()}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
              <p className="text-xs text-slate-400">Ends</p>
              <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{new Date(bid.endsAt).toLocaleString()}</p>
            </div>
          </div>

          {/* Bidders table */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                <Users className="h-4 w-4 text-brand-600" /> Bidders ({totalBidders})
              </h3>
              {loading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
            </div>
            {bidders.length === 0 ? (
              <p className="rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-400 dark:bg-slate-800">
                {loading ? 'Loading bidders…' : 'No bids placed yet.'}
              </p>
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-left dark:bg-slate-800">
                      {['#', 'Bidder', 'Phone', 'Amount', 'Time'].map((h) => (
                        <th key={h} className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {bidders.map((b, i) => (
                      <tr key={b.id} className={i === 0 ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}>
                        <td className="px-3 py-2 text-xs font-bold text-slate-400">{i + 1}</td>
                        <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-100">{b.name}</td>
                        <td className="px-3 py-2 text-slate-500">{b.phone}</td>
                        <td className={`px-3 py-2 font-semibold ${i === 0 ? 'text-emerald-600' : 'text-brand-700 dark:text-brand-300'}`}>
                          ETB {b.amount.toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-xs text-slate-500">{new Date(b.at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Product Picker ─────────────────────────────────────────────────────────────

function ProductPicker({ onPick, onClose }: { onPick: (p: Product) => void; onClose: () => void }) {
  const [products, setProducts]     = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [search, setSearch]         = useState('')
  const [category, setCategory]     = useState('')
  const [page, setPage]             = useState(1)
  const [total, setTotal]           = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)

  const PAGE_SIZE = 8

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/products', {
        params: { search, page, limit: PAGE_SIZE, category: category || undefined },
      })
      setProducts(res.data.products ?? [])
      setTotal(res.data.total ?? 0)
      setTotalPages(res.data.totalPages ?? 1)
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }, [search, category, page])

  useEffect(() => { fetchProducts() }, [fetchProducts])
  useEffect(() => { const t = setTimeout(() => setPage(1), search ? 400 : 0); return () => clearTimeout(t) }, [search])
  useEffect(() => { setPage(1) }, [category])
  useEffect(() => {
    api.get('/products/categories')
      .then((res) => setCategories(res.data.categories ?? []))
      .catch(() => {})
  }, [])

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Select Product</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-slate-800 sm:flex-row sm:items-start sm:justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search products…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 sm:w-64"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setCategory('')}
              className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${category === '' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'}`}
            >All</button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${category === c.id ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'}`}
              >{c.name_en}</button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-brand-600" /></div>
          ) : error ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <p className="text-sm text-slate-500">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchProducts}>Retry</Button>
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center text-slate-400">
              <Package className="h-8 w-8" /><p>No products found.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {products.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onPick(p)}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-left transition hover:border-brand-400 hover:bg-brand-50/40 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                    {p.primaryImageUrl
                      ? <img src={p.primaryImageUrl} alt={p.nameEn} className="h-full w-full object-cover" />
                      : <div className="flex h-full w-full items-center justify-center"><Package className="h-4 w-4 text-slate-400" /></div>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{p.nameEn}</p>
                    <p className="text-xs text-slate-400">{p.categoryName ?? '—'}</p>
                    <p className="mt-0.5 text-sm font-semibold text-brand-600">{formatPrice(p.priceCents)}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 dark:border-slate-800">
            <span className="text-sm text-slate-500">
              {products.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{(page - 1) * PAGE_SIZE + products.length} of {total}
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" /></Button>
              <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages || loading} onClick={() => setPage(page + 1)}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
