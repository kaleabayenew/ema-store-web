import { useEffect, useState } from 'react'
import { Boxes, Package, Star, Search, Pencil, Trash2, MoreHorizontal, TrendingUp } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ProductForm } from './ProductForm'
import api from '@/lib/api'

interface Product {
  id: string
  nameEn: string
  categoryName: string
  partnerName: string
  priceCents: number
  stock: number
  soldCount: number
  status: string
  ratingAvg: number
}

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Array<{ id: string; name_en: string }>>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'All' | 'APPROVED' | 'PENDING' | 'REJECTED'>('All')
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    avgRating: 0,
  })

  // Fetch products and categories from API
  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await api.get('/products')
      const data = response.data.products as Product[]
      setProducts(data)

      // Calculate stats
      const total = data.length
      const approved = data.filter((p) => p.status === 'APPROVED').length
      const pending = data.filter((p) => p.status === 'PENDING').length
      const avgRating = data.length > 0
        ? (data.reduce((sum, p) => sum + p.ratingAvg, 0) / data.length).toFixed(1)
        : '0.0'

      setStats({ total, approved, pending, avgRating: parseFloat(avgRating) })
    } catch (err) {
      console.error('Failed to fetch products:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await api.get('/products/categories')
      const data = response.data.categories as Array<{ id: string; name_en: string }>
      setCategories(data)
    } catch (err) {
      console.error('Failed to fetch categories:', err)
    }
  }

  const handleCreateProduct = async (data: any) => {
    try {
      let imageUrl = data.imageUrl

      // Handle file upload
      if (data.imageMethod === 'file' && data.imageFile) {
        const formData = new FormData()
        formData.append('file', data.imageFile)
        formData.append('folder', 'products')

        try {
          const uploadResponse = await api.post('/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
          imageUrl = uploadResponse.data.url
        } catch (uploadErr) {
          console.error('Failed to upload image:', uploadErr)
          alert('Failed to upload image. Please try again or use a URL instead.')
          return
        }
      }

      await api.post('/products', {
        ...data,
        priceCents: Math.round(data.priceCents * 100), // Convert ETB to cents
        discountCents: data.discountCents ? Math.round(data.discountCents * 100) : undefined,
        images: imageUrl ? [{ url: imageUrl, isPrimary: true }] : [],
      })
      setShowAddDialog(false)
      fetchProducts()
    } catch (err) {
      console.error('Failed to create product:', err)
      alert('Failed to create product. Please try again.')
    }
  }

  const handleUpdateProduct = async (data: any) => {
    if (!selectedProduct) return
    try {
      let imageUrl = data.imageUrl

      // Handle file upload for updates
      if (data.imageMethod === 'file' && data.imageFile) {
        const formData = new FormData()
        formData.append('file', data.imageFile)
        formData.append('folder', 'products')

        try {
          const uploadResponse = await api.post('/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
          imageUrl = uploadResponse.data.url
        } catch (uploadErr) {
          console.error('Failed to upload image:', uploadErr)
          alert('Failed to upload image. Please try again or use a URL instead.')
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
    } catch (err) {
      console.error('Failed to update product:', err)
      alert('Failed to update product. Please try again.')
    }
  }

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return
    try {
      await api.delete(`/products/${selectedProduct.id}`)
      setShowDeleteDialog(false)
      setSelectedProduct(null)
      fetchProducts()
    } catch (err) {
      console.error('Failed to delete product:', err)
      alert('Failed to delete product. Please try again.')
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

  const filtered = products.filter((p) => {
    const matchSearch = p.nameEn.toLowerCase().includes(search.toLowerCase()) || p.categoryName.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'All' || p.status === filter
    return matchSearch && matchFilter
  })

  const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
    APPROVED: 'success', PENDING: 'warning', REJECTED: 'danger',
  }

  const formatPrice = (cents: number) => `ETB ${(cents / 100).toLocaleString()}`

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand-600 border-r-transparent"></div>
          <p className="mt-4 text-sm text-slate-500">Loading products...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-brand-600">Product management</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Products</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchProducts}>Refresh</Button>
          <Button onClick={() => setShowAddDialog(true)}>Add product</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total products', value: stats.total, delta: '+11.2%', tone: 'success', icon: Boxes },
          { label: 'Approved', value: stats.approved, delta: '+9.8%', tone: 'success', icon: Package },
          { label: 'Pending review', value: stats.pending, delta: '+24.1%', tone: 'warning', icon: Package },
          { label: 'Avg. rating', value: stats.avgRating, delta: '+0.1', tone: 'info', icon: Star },
        ].map(({ label, value, delta, tone, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">{label}</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300"><Icon className="h-4 w-4" /></span>
            </div>
            <p className="mt-4 text-2xl font-semibold text-slate-900 dark:text-slate-100">{value}</p>
            <Badge variant={tone as 'success' | 'info' | 'warning'} className="mt-2">{delta}</Badge>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 sm:w-72" />
          </div>
          <div className="flex gap-2">
            {(['All', 'APPROVED', 'PENDING', 'REJECTED'] as const).map((f) => (
              <button key={f} type="button" onClick={() => setFilter(f)}
                className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${filter === f ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'}`}>
                {f.charAt(0) + f.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
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
              {filtered.map((p) => (
                <tr key={p.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{p.nameEn}</p>
                      <p className="text-xs text-slate-400">{p.id}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3"><Badge variant="default">{p.categoryName}</Badge></td>
                  <td className="px-4 py-3 text-slate-500">{p.partnerName}</td>
                  <td className="px-4 py-3 font-semibold text-brand-700 dark:text-brand-300">{formatPrice(p.priceCents)}</td>
                  <td className="px-4 py-3">
                    <span className={p.stock === 0 ? 'font-semibold text-red-600' : 'text-slate-900 dark:text-slate-100'}>{p.stock === 0 ? 'Out of stock' : p.stock}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{p.soldCount}</td>
                  <td className="px-4 py-3">
                    {p.ratingAvg > 0 ? <span className="flex items-center gap-1 text-amber-600"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />{p.ratingAvg.toFixed(1)}</span> : <span className="text-slate-400">—</span>}
                  </td>
                  <td className="px-4 py-3"><Badge variant={statusVariant[p.status]}>{p.status.charAt(0) + p.status.slice(1).toLowerCase()}</Badge></td>
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
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-200 px-4 py-3 text-sm text-slate-500 dark:border-slate-800">Showing {filtered.length} of {products.length} products</div>
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
                descriptionEn: selectedProduct.descriptionEn,
                categoryId: selectedProduct.categoryId,
                brandId: selectedProduct.brandId,
                priceCents: selectedProduct.priceCents / 100,
                discountCents: selectedProduct.discountCents ? selectedProduct.discountCents / 100 : undefined,
                stock: selectedProduct.stock,
                sku: selectedProduct.sku,
                deliveryInfo: selectedProduct.deliveryInfo,
                imageUrl: selectedProduct.primaryImageUrl,
                status: selectedProduct.status,
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
              <Button variant="outline" onClick={() => {
                setShowDeleteDialog(false)
                setSelectedProduct(null)
              }}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteProduct}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
