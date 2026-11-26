import { useEffect, useState } from 'react'
import { Boxes, Package, Star, Pencil, Trash2, Loader2, AlertCircle, ChevronLeft, ChevronRight, Eye, CheckCircle2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FilterBar } from '@/components/ui/FilterBar'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatsCard } from '@/components/ui/StatsCard'
import { useAlert } from '@/components/ui/ConfirmDialog'
import { ProductForm } from './ProductForm'
import api from '@/lib/api'
import { apiErrorMessage } from '@/lib/errors'
import { useAuthStore } from '@/store/authStore'

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
  images?: Array<{ url?: string; image_url?: string; is_primary?: boolean; isPrimary?: boolean } | string>
  imageUrls?: string[]
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
  const alert = useAlert()
  const { user } = useAuthStore()
  const isSuperAdmin =
    user?.role === 'SUPER_ADMIN' ||
    user?.role === 'ADMIN' ||
    user?.role === 'PRODUCT_MANAGER' ||
    user?.role === 'MANAGER'
  const [approvingId, setApprovingId] = useState<string | null>(null)

  const handleApproveProduct = async (id: string, name: string) => {
    try {
      setApprovingId(id)
      await api.post(`/admin/approvals/PRODUCT/${id}/review`, { action: 'approve' })
      alert({
        title: 'Product Approved',
        message: `"${name}" has been approved and is now active for customers.`,
      })
      await fetchProducts()
      if (viewingProduct?.id === id) {
        setViewingProduct(null)
      }
    } catch (err: any) {
      alert({
        title: 'Approval Failed',
        message: apiErrorMessage(err, 'Failed to approve product'),
        variant: 'error',
      })
    } finally {
      setApprovingId(null)
    }
  }
  const [products, setProducts]     = useState<Product[]>([])
  const [total, setTotal]           = useState(0)
  const [page, setPage]             = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [categories, setCategories] = useState<Array<{ id: string; name_en: string }>>([])
  const [search, setSearch]         = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filter, setFilter]         = useState<FilterStatus>('All')
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)

  const PAGE_SIZE = 15

  const [showAddDialog, setShowAddDialog]       = useState(false)
  const [showEditDialog, setShowEditDialog]     = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedProduct, setSelectedProduct]  = useState<Product | null>(null)
  const [viewingProduct, setViewingProduct]    = useState<Product | null>(null)
  const [deleting, setDeleting]                 = useState(false)

  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, avgRating: 0 })

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchProducts = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get('/products', {
        params: { search: debouncedSearch, status: filter === 'All' ? 'ALL' : filter, page, limit: PAGE_SIZE },
      })
      const data = (response.data.products ?? []) as Product[]
      setProducts(data)
      setTotal(response.data.total ?? data.length)
      setTotalPages(response.data.totalPages ?? 1)

      // Stats: backend returns totals across all pages
      setStats({
        total:    response.data.total ?? data.length,
        approved: response.data.approved ?? data.filter((p) => p.status === 'APPROVED').length,
        pending:  response.data.pending ?? data.filter((p) => p.status === 'PENDING').length,
        avgRating: response.data.avgRating ?? 0,
      })
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
      console.error('Failed to fetch categories:', apiErrorMessage(err))
    }
  }

  useEffect(() => {
    fetchProducts()
    fetchCategories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filter, debouncedSearch])

  // Debounced search resets to page 1 — single request after typing stops
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search)
      if (page !== 1) setPage(1)
    }, 400)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  // ── Mutations ─────────────────────────────────────────────────────────────

  const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // matches backend limit

  const validateImageFile = (file: File): string | null => {
    if (!file.type.startsWith('image/')) return 'Only image files are allowed.'
    if (file.size > MAX_IMAGE_BYTES) return 'Image must be 5 MB or smaller.'
    return null
  }

  const uploadProductImage = async (file: File): Promise<string | null> => {
    const err = validateImageFile(file)
    if (err) {
      alert({ variant: 'error', message: err })
      return null
    }
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', 'products')
    try {
      const uploadResponse = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return uploadResponse.data.url as string
    } catch {
      alert({ variant: 'error', message: 'Failed to upload image. Try a URL instead.' })
      return null
    }
  }

  const resolveFinalImages = async (data: any): Promise<string[]> => {
    const finalUrls: string[] = []
    if (Array.isArray(data.imageItems) && data.imageItems.length > 0) {
      for (const item of data.imageItems) {
        if (item.file) {
          const uploaded = await uploadProductImage(item.file)
          if (uploaded) finalUrls.push(uploaded)
        } else if (item.url) {
          finalUrls.push(item.url)
        }
      }
    } else if (data.imageMethod === 'file' && data.imageFile) {
      const uploaded = await uploadProductImage(data.imageFile)
      if (uploaded) finalUrls.push(uploaded)
    } else if (data.imageUrl) {
      finalUrls.push(data.imageUrl)
    }
    return finalUrls
  }

  const handleCreateProduct = async (data: any) => {
    try {
      const finalImageUrls = await resolveFinalImages(data)

      await api.post('/products', {
        ...data,
        priceCents: Math.round(data.priceCents * 100),
        discountCents: data.discountCents ? Math.round(data.discountCents * 100) : undefined,
        images: finalImageUrls.map((url, i) => ({ url, isPrimary: i === 0 })),
        imageUrls: finalImageUrls,
      })
      setShowAddDialog(false)
      fetchProducts()
    } catch (err: any) {
      alert({ variant: 'error', message: err.response?.data?.message ?? 'Failed to create product' })
    }
  }

  const handleUpdateProduct = async (data: any) => {
    if (!selectedProduct) return
    try {
      const finalImageUrls = await resolveFinalImages(data)

      await api.patch(`/products/${selectedProduct.id}`, {
        ...data,
        priceCents: Math.round(data.priceCents * 100),
        discountCents: data.discountCents ? Math.round(data.discountCents * 100) : undefined,
        images: finalImageUrls.length > 0 ? finalImageUrls.map((url, i) => ({ url, isPrimary: i === 0 })) : undefined,
        imageUrls: finalImageUrls.length > 0 ? finalImageUrls : undefined,
      })
      setShowEditDialog(false)
      setSelectedProduct(null)
      fetchProducts()
    } catch (err: any) {
      alert({ variant: 'error', message: err.response?.data?.message ?? 'Failed to update product' })
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
      alert({ variant: 'error', message: err.response?.data?.message ?? 'Failed to delete product' })
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

  // Filtering (search + status) is handled by the backend, so we render
  // the current page's `products` directly.

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
      <PageHeader
        eyebrow="Product management"
        title="Products"
        actions={
          <>
            <Button variant="outline" onClick={fetchProducts} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Refresh
            </Button>
            {isSuperAdmin && <Button onClick={() => setShowAddDialog(true)}>Add product</Button>}
          </>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard label="Total products" value={stats.total} icon={Boxes} iconClassName="text-brand-600" loading={loading} />
        <StatsCard label="Approved" value={stats.approved} icon={Package} iconClassName="text-emerald-600" iconBgClassName="bg-emerald-50 dark:bg-emerald-950/40" loading={loading} />
        <StatsCard label="Pending review" value={stats.pending} icon={Package} iconClassName="text-amber-600" iconBgClassName="bg-amber-50 dark:bg-amber-950/40" loading={loading} />
        <StatsCard label="Avg. rating" value={stats.avgRating} icon={Star} iconClassName="text-violet-600" iconBgClassName="bg-violet-50 dark:bg-violet-950/40" loading={loading} />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {/* Toolbar */}
        <FilterBar
          filters={[
            { value: 'All', label: 'All' },
            { value: 'APPROVED', label: 'Approved' },
            { value: 'PENDING', label: 'Pending' },
            { value: 'REJECTED', label: 'Rejected' },
          ]}
          activeFilter={filter}
          onFilterChange={(v) => setFilter(v as FilterStatus)}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by name, category or SKU…"
        />

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
              {products.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    <Package className="mx-auto h-8 w-8 mb-2" />
                    No products found.
                  </td>
                </tr>
              )}
              {products.map((p) => {
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
                      <div className="flex items-center gap-1">
                        {p.status === 'PENDING' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                            title="Approve product"
                            disabled={approvingId === p.id}
                            onClick={() => handleApproveProduct(p.id, p.nameEn)}
                          >
                            {approvingId === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                          </Button>
                        )}
                        {isSuperAdmin ? (
                          <>
                            <Button variant="ghost" size="icon" title="Edit" onClick={() => openEditDialog(p)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" title="Delete" onClick={() => openDeleteDialog(p)}>
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </>
                        ) : (
                          <Button variant="ghost" size="icon" title="View" onClick={() => setViewingProduct(p)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
          <span className="text-sm text-slate-500">
            {loading
              ? 'Loading…'
              : `Showing ${products.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–${(page - 1) * PAGE_SIZE + products.length} of ${total} products`}
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => setPage(page - 1)}>
                <ChevronLeft className="h-4 w-4" />
                <span className="ml-1">Prev</span>
              </Button>
              <span className="text-sm text-slate-500">
                Page <span className="font-semibold text-slate-800 dark:text-slate-100">{page}</span> of {totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={page >= totalPages || loading} onClick={() => setPage(page + 1)}>
                <span className="mr-1">Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Add Product Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowAddDialog(false)}>
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => { setShowEditDialog(false); setSelectedProduct(null) }}>
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
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
                images: selectedProduct.images,
                imageUrls: selectedProduct.imageUrls,
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

      {/* Product View Dialog (non-super-admin) */}
      {viewingProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setViewingProduct(null)}>
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{viewingProduct.nameEn}</h2>
                <p className="mt-1 font-mono text-xs text-slate-400">{viewingProduct.sku ?? viewingProduct.id.slice(0, 8)}</p>
              </div>
              <Badge variant={statusVariant[viewingProduct.status] ?? 'default'}>
                {viewingProduct.status ? viewingProduct.status.charAt(0) + viewingProduct.status.slice(1).toLowerCase() : '—'}
              </Badge>
            </div>
            {viewingProduct.imageUrls && viewingProduct.imageUrls.length > 1 ? (
              <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
                {viewingProduct.imageUrls.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`${viewingProduct.nameEn} ${i + 1}`}
                    className="h-24 w-24 rounded-xl border border-slate-200 dark:border-slate-700 object-cover flex-shrink-0"
                  />
                ))}
              </div>
            ) : viewingProduct.primaryImageUrl ? (
              <img src={viewingProduct.primaryImageUrl} alt={viewingProduct.nameEn} className="mb-4 h-40 w-full rounded-xl object-cover" />
            ) : null}
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: 'Category', value: viewingProduct.categoryName ?? '—' },
                { label: 'Partner', value: viewingProduct.partnerName ?? '—' },
                { label: 'Price', value: formatPrice(viewingProduct.priceCents) },
                { label: 'Stock', value: viewingProduct.stock === 0 ? 'Out of stock' : String(viewingProduct.stock) },
                { label: 'Sold', value: String(viewingProduct.soldCount) },
                { label: 'Rating', value: Number(viewingProduct.ratingAvg) > 0 ? `${Number(viewingProduct.ratingAvg).toFixed(1)} ★` : '—' },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                  <p className="text-xs text-slate-400">{label}</p>
                  <p className="mt-1 font-semibold text-slate-800 dark:text-slate-100">{value}</p>
                </div>
              ))}
              {viewingProduct.descriptionEn && (
                <div className="col-span-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                  <p className="text-xs text-slate-400">Description</p>
                  <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">{viewingProduct.descriptionEn}</p>
                </div>
              )}
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              {viewingProduct.status === 'PENDING' ? (
                <Button
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={approvingId === viewingProduct.id}
                  onClick={() => handleApproveProduct(viewingProduct.id, viewingProduct.nameEn)}
                >
                  {approvingId === viewingProduct.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Approve Product
                </Button>
              ) : <div />}
              <Button variant="outline" onClick={() => setViewingProduct(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => { setShowDeleteDialog(false); setSelectedProduct(null) }}>
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
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
