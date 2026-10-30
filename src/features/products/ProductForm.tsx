import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const productSchema = z.object({
  nameEn: z.string().min(3, 'Name must be at least 3 characters'),
  descriptionEn: z.string().min(10, 'Description must be at least 10 characters'),
  categoryId: z.string().min(1, 'Category is required'),
  brandId: z.string().optional(),
  priceCents: z.number().min(100, 'Price must be at least 1 ETB'),
  discountCents: z.number().optional(),
  stock: z.number().min(0, 'Stock cannot be negative'),
  sku: z.string().optional(),
  deliveryInfo: z.string().optional(),
  imageUrl: z.string().url('Must be a valid URL').optional(),
  imageFile: z.any().optional(),
  imageMethod: z.enum(['url', 'file']),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
})

type ProductFormData = z.infer<typeof productSchema>

interface ProductFormProps {
  initialData?: Partial<ProductFormData>
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
  const [imageMethod, setImageMethod] = useState<'url' | 'file'>('url')
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.imageUrl || null)
  const [autoGenerateSKU, setAutoGenerateSKU] = useState(!isEditing)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: initialData || {
      nameEn: '',
      descriptionEn: '',
      categoryId: '',
      brandId: '',
      priceCents: 0,
      discountCents: undefined,
      stock: 0,
      sku: '',
      deliveryInfo: '',
      imageUrl: '',
      imageFile: undefined,
      imageMethod: 'url',
      status: 'PENDING',
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

  // Handle image file selection
  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setValue('imageFile', file)
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Handle image URL change
  const handleImageUrl = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value
    setValue('imageUrl', url)
    setImagePreview(url || null)
  }

  const onFormSubmit = async (data: ProductFormData) => {
    setLoading(true)
    try {
      await onSubmit(data)
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
        <Select onValueChange={(value) => {
          setValue('categoryId', value)
          handleAutoGenerateSKU()
        }} defaultValue={initialData?.categoryId}>
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
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoGenerateSKU}
                onChange={(e) => setAutoGenerateSKU(e.target.checked)}
                className="rounded"
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
            className={autoGenerateSKU && !isEditing ? 'bg-gray-100' : ''}
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
          placeholder="Brand ID"
          {...register('brandId')}
        />
      </div>

      {/* Image Upload Method */}
      <div className="space-y-2">
        <Label>Product Image *</Label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="url"
              checked={imageMethod === 'url'}
              onChange={() => setImageMethod('url')}
              className="accent-green-600"
            />
            <span>From URL</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="file"
              checked={imageMethod === 'file'}
              onChange={() => setImageMethod('file')}
              className="accent-green-600"
            />
            <span>Upload File</span>
          </label>
        </div>

        {imageMethod === 'url' ? (
          <div className="space-y-2">
            <Input
              id="imageUrl"
              type="url"
              placeholder="https://example.com/image.jpg"
              {...register('imageUrl')}
              onChange={handleImageUrl}
            />
            {errors.imageUrl && <p className="text-sm text-red-600">{errors.imageUrl.message}</p>}
          </div>
        ) : (
          <div className="space-y-2">
            <Input
              id="imageFile"
              type="file"
              accept="image/*"
              {...register('imageFile')}
              onChange={handleImageFile}
            />
            <p className="text-xs text-gray-500">Supported formats: JPG, PNG, GIF, WebP (Max 5MB)</p>
          </div>
        )}

        {/* Image Preview */}
        {imagePreview && (
          <div className="mt-2">
            <p className="text-sm font-medium mb-1">Preview:</p>
            <img
              src={imagePreview}
              alt="Product preview"
              className="w-32 h-32 object-cover rounded-lg border"
            />
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
          <Select onValueChange={(value) => setValue('status', value as 'PENDING' | 'APPROVED' | 'REJECTED')} defaultValue={initialData?.status}>
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
