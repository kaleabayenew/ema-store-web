import { useEffect, useState } from 'react'
import { Boxes, Package, Star, Search, Pencil, Trash2, Loader2, AlertCircle } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ProductForm } from './ProductForm'
import api from '@/lib/api'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Product {
  id: string
  partnerId: string | null
  categoryId: string | null
  brandId: string | null
  nameEn: string
  descriptionEn: string | null
  deliveryInfo: string | null
  priceCents: number
  discountCents: number | null
  sku: string | null
  stock: number
  status: string
  isVisible: boolean
  ratingAvg: number
  ratingCount: number
  soldCount: number
  primaryImageUrl: string | null
  categoryName: string | null
  categorySlug: string | null
  partnerName: string | null
  partnerOwner: string | null
  createdAt: string
  updatedAt: string
}

type FilterStatus = 'All' | 'APPROVED' | 'PENDING' | 'REJECTED'

// ── Helpers ──────────────────────────────────────────────────────────────────

const formatPrice = (cents: number) => `ETB ${(cents / 100).toLocaleString('en-ET', { minimumFractionDigits: 2 })}`

const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  APPROVED: 'success',
  PENDING:  'warning',
  REJECTED: 'danger',
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function ProductsPage() {
  const [products, setProducts]     = useState<Product[]>([])
  const [categories, setCategories] = useState<Array<{ id: string; name_en: string }>>([])
  const [search, setSearch]         = useState('')
  const [filter, setFilter]         = useState<FilterStatus>('All')
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)

  const [showAddDialog, setShowAddDialog]       = useState(false)
  const [showEditDialog, setShowEditDialog]     = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedProduct, setSelectedProduct]  = useState<Product | null>(null)
  const [deleting, setDeleting]                 = useState(false)

  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, avgRating: 0 })

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchProducts = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get('/products')
      const data = (response.data.products ?? []) as Product[]
      setProducts(data)

      const total    = data.length
      const approved = data.filter((p) => p.status === 'APPROVED').length
      const pending  = data.filter((p) => p.status === 'PENDING').length
      const avgRating = data.length > 0
        ? parseFloat((data.reduce((s, p) => s + (Number(p.ratingAvg) || 0), 0) / data.length).toFixed(1))
        : 0

      setStats({ total, approved, pending, avgRating })
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await api.get('/products/categories')
      setCategories((response.data.categories ?? []) as Array<{ id: string; name_en: string }>)
    } catch (err) {
      console.error('Failed to fetch categories:', err)
    }
  }

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  // ── Mutations ─────────────────────────────────────────────────────────────

  const handleCreateProduct = async (data: any) => {
    try {
      let imageUrl = data.imageUrl
      if (data.imageMethod === 'file' && data.imageFile) {
        const formData = new FormData()
        formData.append('file', data.imageFile)
        formData.append('folder', 'products')
        try {
          const uploadResponse = await api.post('/uploads', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
          imageUrl = uploadResponse.data.url
        } catch {
          alert('Failed to upload image. Try a URL instead.')
          return
        }
      }

      await api.post('/products', {
        ...data,
        priceCents: Math.round(data.priceCents * 100),
        discountCents: data.discountCents ? Math.round(data.discountCents * 100) : undefined,
        images: imageUrl ? [{ url: imageUrl, isPrimary: true }] : [],
      })
      setShowAddDialog(false)
      fetchProducts()
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Failed to create product')
    }
  }

  const handleUpdateProduct = async (data: any) => {
    if (!selectedProduct) return
    try {
      let imageUrl = data.imageUrl
      if (data.imageMethod === 'file' && data.imageFile) {
        const formData = new FormData()
        formData.append('file', data.imageFile)
        formData.append('folder', 'products')
        try {
          const uploadResponse = await api.post('/uploads', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
          imageUrl = uploadResponse.data.url
        } catch {
          alert('Failed to upload image. Try a URL instead.')
          return
        }
      }

      await api.patch(`/products/${selectedProduct.id}`, {
        ...data,
        priceCents: Math.round(data.priceCents * 100),
        discountCents: data.discountCents ? Math.round(data.discountCents * 100) : undefined,
        images: imageUrl ? [{ url: imageUrl, isPrimary: true }] : undefined,
      })
      setShowEditDialog(false)
      setSelectedProduct(null)
      fetchProducts()
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Failed to update product')
    }
  }

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return
    setDeleting(true)
    try {
      await api.delete(`/products/${selectedProduct.id}`)
      setShowDeleteDialog(false)
      setSelectedProduct(null)
      fetchProducts()
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Failed to delete product')
    } finally {
      setDeleting(false)
    }
  }

  const openEditDialog = (product: Product) => {
    setSelectedProduct(product)
    setShowEditDialog(true)
  }

  const openDeleteDialog = (product: Product) => {
    setSelectedProduct(product)
    setShowDeleteDialog(true)
  }

  // ── Derived ───────────────────────────────────────────────────────────────

  const filtered = products.filter((p) => {
    const q = search.toLowerCase()
    const matchSearch =
      p.nameEn.toLowerCase().includes(q) ||
      (p.categoryName ?? '').toLowerCase().includes(q) ||
      (p.sku ?? '').toLowerCase().includes(q)
    const matchFilter = filter === 'All' || p.status === filter
    return matchSearch && matchFilter
  })

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand-600" />
          <p className="mt-4 text-sm text-slate-500">Loading products…</p>
        </div>
      </div>
    )
  }

  if (error && products.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-red-500" />
          <p className="mt-4 text-sm text-slate-500">{error}</p>
          <Button variant="outline" className="mt-4" onClick={fetchProducts}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-brand-600">Product management</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Products</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchProducts} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Refresh
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>Add product</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total products', value: stats.total,    icon: Boxes,   color: 'text-brand-600' },
          { label: 'Approved',       value: stats.approved,  icon: Package,  color: 'text-emerald-600' },
          { label: 'Pending review', value: stats.pending,   icon: Package,  color: 'text-amber-600' },
          { label: 'Avg. rating',     value: stats.avgRating, icon: Star,     color: 'text-violet-600' },
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

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, category or SKU…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 sm:w-80"
            />
          </div>
          <div className="flex gap-2">
            {(['All', 'APPROVED', 'PENDING', 'REJECTED'] as FilterStatus[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-xl px-3 py-1.5 text-xs font-medium capitalize transition ${filter === f ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'}`}
              >
                {f === 'All' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Error banner (keep table visible if we have cached data) */}
        {error && (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-400">
            {error} — showing cached data.
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left dark:border-slate-800">
                {['Product', 'Category', 'Partner', 'Price', 'Stock', 'Sold', 'Rating', 'Status', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    <Package className="mx-auto h-8 w-8 mb-2" />
                    No products found.
                  </td>
                </tr>
              )}
              {filtered.map((p) => {
                const hasDiscount = p.discountCents != null && p.discountCents > 0 && p.discountCents < p.priceCents
                const finalPrice = hasDiscount ? (p.discountCents as number) : p.priceCents
                return (
                  <tr key={p.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    {/* Product */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                          {p.primaryImageUrl ? (
                            <img src={p.primaryImageUrl} alt={p.nameEn} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <Package className="h-4 w-4 text-slate-400" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 dark:text-slate-100 truncate max-w-[220px]">{p.nameEn}</p>
                          <p className="text-xs text-slate-400 font-mono truncate max-w-[220px]">{p.sku ?? p.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    {/* Category */}
                    <td className="px-4 py-3">
                      {p.categoryName ? <Badge variant="default">{p.categoryName}</Badge> : <span className="text-slate-400">—</span>}
                    </td>
                    {/* Partner */}
                    <td className="px-4 py-3 text-slate-500">
                      <div className="flex flex-col">
                        <span className="truncate max-w-[140px]">{p.partnerName ?? '—'}</span>
                        {p.partnerOwner && <span className="text-xs text-slate-400 truncate max-w-[140px]">{p.partnerOwner}</span>}
                      </div>
                    </td>
                    {/* Price */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        {hasDiscount ? (
                          <>
                            <span className="text-xs text-slate-400 line-through">{formatPrice(p.priceCents)}</span>
                            <span className="font-semibold text-brand-700 dark:text-brand-300">{formatPrice(finalPrice)}</span>
                          </>
                        ) : (
                          <span className="font-semibold text-brand-700 dark:text-brand-300">{formatPrice(p.priceCents)}</span>
                        )}
                      </div>
                    </td>
                    {/* Stock */}
                    <td className="px-4 py-3">
                      <span className={p.stock === 0 ? 'font-semibold text-red-600' : 'text-slate-900 dark:text-slate-100'}>
                        {p.stock === 0 ? 'Out of stock' : p.stock}
                      </span>
                    </td>
                    {/* Sold */}
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{p.soldCount}</td>
                    {/* Rating */}
                    <td className="px-4 py-3">
                      {Number(p.ratingAvg) > 0 ? (
                        <span className="flex items-center gap-1 text-amber-600">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          {Number(p.ratingAvg).toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    {/* Status */}
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[p.status] ?? 'default'}>
                        {p.status ? p.status.charAt(0) + p.status.slice(1).toLowerCase() : '—'}
                      </Badge>
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(p)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(p)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-200 px-4 py-3 text-sm text-slate-500 dark:border-slate-800">
          Showing {filtered.length} of {products.length} products
        </div>
      </div>

      {/* Add Product Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">Add New Product</h2>
            <ProductForm
              categories={categories}
              onSubmit={handleCreateProduct}
              onCancel={() => setShowAddDialog(false)}
            />
          </div>
        </div>
      )}

      {/* Edit Product Dialog */}
      {showEditDialog && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">Edit Product</h2>
            <ProductForm
              initialData={{
                nameEn: selectedProduct.nameEn,
                descriptionEn: selectedProduct.descriptionEn ?? '',
                categoryId: selectedProduct.categoryId ?? '',
                brandId: selectedProduct.brandId ?? '',
                priceCents: selectedProduct.priceCents / 100,
                discountCents: selectedProduct.discountCents ? selectedProduct.discountCents / 100 : undefined,
                stock: selectedProduct.stock,
                sku: selectedProduct.sku ?? '',
                deliveryInfo: selectedProduct.deliveryInfo ?? '',
                imageUrl: selectedProduct.primaryImageUrl ?? '',
                status: selectedProduct.status as 'PENDING' | 'APPROVED' | 'REJECTED',
              }}
              categories={categories}
              onSubmit={handleUpdateProduct}
              onCancel={() => {
                setShowEditDialog(false)
                setSelectedProduct(null)
              }}
              isEditing
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">Delete Product</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              Are you sure you want to delete <strong>{selectedProduct.nameEn}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setShowDeleteDialog(false); setSelectedProduct(null) }} disabled={deleting}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteProduct} disabled={deleting}>
                {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
