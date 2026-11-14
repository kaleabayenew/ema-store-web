import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, X, Star, Upload, Link as LinkIcon, Image as ImageIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export interface ImageItem {
  id: string
  url?: string
  file?: File
  preview: string
  isPrimary: boolean
}

const productSchema = z.object({
  nameEn: z.string().min(3, 'Name must be at least 3 characters'),
  descriptionEn: z.string().min(10, 'Description must be at least 10 characters'),
  categoryId: z.string().min(1, 'Category is required'),
  brandId: z.string().optional(),
  priceCents: z.number().min(100, 'Price must be at least 1 ETB').max(100_000_000, 'Price is too large'),
  discountCents: z.number().optional(),
  stock: z.number().min(0, 'Stock cannot be negative'),
  sku: z.string().optional(),
  deliveryInfo: z.string().optional(),
  imageUrl: z.string().optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
})

export type ProductFormData = z.infer<typeof productSchema> & {
  imageItems?: ImageItem[]
  imageUrls?: string[]
}

interface ProductFormProps {
  initialData?: Partial<ProductFormData> & {
    images?: Array<{ url?: string; image_url?: string; isPrimary?: boolean; is_primary?: boolean } | string>
    imageUrls?: string[]
  }
  categories: Array<{ id: string; name_en: string }>
  onSubmit: (data: ProductFormData) => Promise<void>
  onCancel: () => void
  isEditing?: boolean
}

// Generate SKU from product name and category
function generateSKU(name: string, categoryId: string): string {
  const categoryCode = categoryId.substring(0, 3).toUpperCase()
  const nameCode = name.substring(0, 3).toUpperCase()
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `EMA-${categoryCode}-${nameCode}-${random}`
}

export function ProductForm({ initialData, categories, onSubmit, onCancel, isEditing = false }: ProductFormProps) {
  const [loading, setLoading] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [autoGenerateSKU, setAutoGenerateSKU] = useState(!isEditing)

  // Initialize multiple images from initialData
  const [images, setImages] = useState<ImageItem[]>(() => {
    const list: ImageItem[] = []
    const rawUrls: string[] = []

    if (Array.isArray(initialData?.imageUrls) && initialData.imageUrls.length > 0) {
      rawUrls.push(...initialData.imageUrls)
    } else if (Array.isArray(initialData?.images) && initialData.images.length > 0) {
      for (const item of initialData.images) {
        if (typeof item === 'string') {
          rawUrls.push(item)
        } else if (item && typeof item === 'object') {
          const u = item.url || item.image_url
          if (u) rawUrls.push(u)
        }
      }
    } else if (initialData?.imageUrl) {
      rawUrls.push(initialData.imageUrl)
    }

    rawUrls.filter(Boolean).slice(0, 5).forEach((url, i) => {
      list.push({
        id: `img_${i}_${Date.now()}`,
        url,
        preview: url,
        isPrimary: i === 0,
      })
    })

    return list
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      nameEn: initialData?.nameEn || '',
      descriptionEn: initialData?.descriptionEn || '',
      categoryId: initialData?.categoryId || '',
      brandId: initialData?.brandId || '',
      priceCents: initialData?.priceCents || 0,
      discountCents: initialData?.discountCents,
      stock: initialData?.stock || 0,
      sku: initialData?.sku || '',
      deliveryInfo: initialData?.deliveryInfo || '',
      imageUrl: initialData?.imageUrl || '',
      status: initialData?.status || 'PENDING',
    },
  })

  const nameEn = watch('nameEn')
  const categoryId = watch('categoryId')

  // Auto-generate SKU when name or category changes
  const handleAutoGenerateSKU = () => {
    if (nameEn && categoryId && autoGenerateSKU) {
      const sku = generateSKU(nameEn, categoryId)
      setValue('sku', sku)
    }
  }

  // Handle multiple image file selection (up to 5)
  const handleImageFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const remaining = 5 - images.length
    if (remaining <= 0) {
      alert('Maximum 5 images allowed per product.')
      e.target.value = ''
      return
    }

    const filesToAdd = files.slice(0, remaining)
    const newItems: ImageItem[] = []

    for (const file of filesToAdd) {
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not an image file.`)
        continue
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} exceeds the 5 MB limit.`)
        continue
      }

      const preview = URL.createObjectURL(file)
      newItems.push({
        id: `file_${Date.now()}_${Math.random()}`,
        file,
        preview,
        isPrimary: images.length === 0 && newItems.length === 0,
      })
    }

    if (newItems.length > 0) {
      setImages(prev => {
        const updated = [...prev, ...newItems].slice(0, 5)
        if (updated.length > 0 && !updated.some(x => x.isPrimary)) {
          updated[0].isPrimary = true
        }
        return updated
      })
    }

    e.target.value = ''
  }

  // Handle adding image via URL
  const handleAddUrl = () => {
    const trimmed = urlInput.trim()
    if (!trimmed) return
    if (images.length >= 5) {
      alert('Maximum 5 images allowed.')
      return
    }

    try {
      new URL(trimmed)
    } catch {
      alert('Please enter a valid URL starting with http:// or https://')
      return
    }

    setImages(prev => {
      const updated = [
        ...prev,
        {
          id: `url_${Date.now()}_${Math.random()}`,
          url: trimmed,
          preview: trimmed,
          isPrimary: prev.length === 0,
        },
      ]
      return updated
    })
    setUrlInput('')
  }

  // Set primary cover photo
  const handleSetPrimary = (index: number) => {
    setImages(prev =>
      prev.map((item, idx) => ({
        ...item,
        isPrimary: idx === index,
      }))
    )
  }

  // Remove photo from list
  const handleRemoveImage = (index: number) => {
    setImages(prev => {
      const updated = prev.filter((_, idx) => idx !== index)
      if (updated.length > 0 && !updated.some(x => x.isPrimary)) {
        updated[0].isPrimary = true
      }
      return updated
    })
  }

  const onFormSubmit = async (data: z.infer<typeof productSchema>) => {
    setLoading(true)
    try {
      // Re-order so primary image is first
      const sorted = [...images].sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0))
      const primaryItem = sorted[0]

      await onSubmit({
        ...data,
        imageItems: sorted,
        imageUrls: sorted.map(i => i.url).filter(Boolean) as string[],
        imageUrl: primaryItem?.url || '',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      {/* Product Name */}
      <div className="space-y-2">
        <Label htmlFor="nameEn">Product Name *</Label>
        <Input
          id="nameEn"
          placeholder="Enter product name"
          {...register('nameEn')}
          onBlur={handleAutoGenerateSKU}
        />
        {errors.nameEn && <p className="text-sm text-red-600">{errors.nameEn.message}</p>}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="descriptionEn">Description *</Label>
        <Textarea
          id="descriptionEn"
          placeholder="Enter product description"
          rows={3}
          {...register('descriptionEn')}
        />
        {errors.descriptionEn && <p className="text-sm text-red-600">{errors.descriptionEn.message}</p>}
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label htmlFor="categoryId">Category *</Label>
        <Select
          onValueChange={(value) => {
            setValue('categoryId', value)
            handleAutoGenerateSKU()
          }}
          defaultValue={initialData?.categoryId}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name_en}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.categoryId && <p className="text-sm text-red-600">{errors.categoryId.message}</p>}
      </div>

      {/* Price & Stock */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="priceCents">Price (ETB) *</Label>
          <Input
            id="priceCents"
            type="number"
            placeholder="0.00"
            step="0.01"
            {...register('priceCents', { valueAsNumber: true })}
          />
          {errors.priceCents && <p className="text-sm text-red-600">{errors.priceCents.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="discountCents">Discount Price (ETB)</Label>
          <Input
            id="discountCents"
            type="number"
            placeholder="0.00"
            step="0.01"
            {...register('discountCents', { valueAsNumber: true })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="stock">Stock *</Label>
          <Input
            id="stock"
            type="number"
            placeholder="0"
            {...register('stock', { valueAsNumber: true })}
          />
          {errors.stock && <p className="text-sm text-red-600">{errors.stock.message}</p>}
        </div>
      </div>

      {/* SKU */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="sku">SKU</Label>
          {!isEditing && (
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <input
                type="checkbox"
                checked={autoGenerateSKU}
                onChange={(e) => setAutoGenerateSKU(e.target.checked)}
                className="rounded accent-green-600"
              />
              Auto-generate
            </label>
          )}
        </div>
        <div className="flex gap-2">
          <Input
            id="sku"
            placeholder="PROD-001"
            {...register('sku')}
            disabled={autoGenerateSKU && !isEditing}
            className={autoGenerateSKU && !isEditing ? 'bg-gray-100 dark:bg-slate-800' : ''}
          />
          {!isEditing && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAutoGenerateSKU}
              disabled={!nameEn || !categoryId}
            >
              Generate
            </Button>
          )}
        </div>
        {errors.sku && <p className="text-sm text-red-600">{errors.sku.message}</p>}
      </div>

      {/* Brand */}
      <div className="space-y-2">
        <Label htmlFor="brandId">Brand</Label>
        <Input
          id="brandId"
          placeholder="Brand ID / Name"
          {...register('brandId')}
        />
      </div>

      {/* ── Multi-Image Upload Manager (Up to 5 Photos) ── */}
      <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-green-600" />
            <Label className="font-semibold text-slate-900 dark:text-slate-100">
              Product Photos ({images.length}/5)
            </Label>
          </div>
          <span className="text-xs text-slate-500">
            {images.length === 0 ? 'Upload up to 5 photos' : 'Tap star to set cover image'}
          </span>
        </div>

        {/* Existing & Picked Image Thumbnails */}
        {images.length > 0 && (
          <div className="grid grid-cols-5 gap-3">
            {images.map((img, idx) => (
              <div
                key={img.id}
                className={`relative group aspect-square rounded-xl border-2 overflow-hidden bg-slate-100 dark:bg-slate-800 ${img.isPrimary
                    ? 'border-green-600 ring-2 ring-green-600/30'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'
                  }`}
              >
                <img
                  src={img.preview}
                  alt={`Product photo ${idx + 1}`}
                  className="h-full w-full object-cover"
                />

                {/* Primary Cover Badge */}
                {img.isPrimary && (
                  <div className="absolute top-1 left-1 flex items-center gap-0.5 rounded-md bg-green-600 px-1.5 py-0.5 text-[10px] font-bold text-white shadow">
                    <Star className="h-2.5 w-2.5 fill-current" />
                    Cover
                  </div>
                )}

                {/* Make Primary Button (if not primary) */}
                {!img.isPrimary && (
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(idx)}
                    title="Set as Cover Photo"
                    className="absolute bottom-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-medium text-white hover:bg-black/80"
                  >
                    Set Cover
                  </button>
                )}

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  title="Remove photo"
                  className="absolute top-1 right-1 h-5 w-5 rounded-full bg-red-600 text-white flex items-center justify-center shadow opacity-90 hover:opacity-100 hover:scale-110 transition-all"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload & Add URL Controls (if under 5 images) */}
        {images.length < 5 && (
          <div className="space-y-2 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              {/* File upload button */}
              <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-green-600 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100 dark:border-green-700 dark:bg-green-950/40 dark:text-green-300">
                <Upload className="h-3.5 w-3.5" />
                <span>Upload Photos ({5 - images.length} remaining)</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageFiles}
                  className="hidden"
                />
              </label>

              <span className="text-xs text-slate-400">or</span>

              {/* URL Input */}
              <div className="flex flex-1 items-center gap-1.5 min-w-[200px]">
                <div className="relative flex-1">
                  <LinkIcon className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                    className="h-8 pl-8 text-xs"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddUrl()
                      }
                    }}
                  />
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAddUrl}
                  className="h-8 text-xs"
                >
                  <Plus className="mr-1 h-3 w-3" /> Add URL
                </Button>
              </div>
            </div>
            <p className="text-[11px] text-slate-400">
              Supported: JPG, PNG, WebP (Max 5 MB each). The first photo is the primary cover image.
            </p>
          </div>
        )}
      </div>

      {/* Delivery Info */}
      <div className="space-y-2">
        <Label htmlFor="deliveryInfo">Delivery Information</Label>
        <Textarea
          id="deliveryInfo"
          placeholder="Delivery options, lead time, etc."
          rows={2}
          {...register('deliveryInfo')}
        />
      </div>

      {/* Status */}
      {isEditing && (
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            onValueChange={(value) => setValue('status', value as 'PENDING' | 'APPROVED' | 'REJECTED')}
            defaultValue={initialData?.status}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : isEditing ? 'Update Product' : 'Create Product'}
        </Button>
      </div>
    </form>
  )
}
