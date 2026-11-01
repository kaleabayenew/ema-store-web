import { useEffect, useState } from 'react'
import { ImagePlus, Trash2, Edit, Calendar, Loader2, AlertCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import api from '@/lib/api'

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

export function PaymentBannersPage() {
  const [banners, setBanners] = useState<PaymentBanner[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)

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

  useEffect(() => {
    fetchBanners()
  }, [])

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString()
  }

  if (loading && banners.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
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
          <Button onClick={() => setShowAddDialog(true)}>Add Banner</Button>
        </div>
      </div>

      {error && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left dark:border-slate-800">
                {['Image', 'Title', 'Valid From', 'Valid Until', 'Status', ''].map((h) => (
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
                      <div className="h-12 w-20 bg-slate-100 rounded flex items-center justify-center text-slate-400">No image</div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{banner.title}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{formatDate(banner.valid_from)}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{formatDate(banner.valid_until)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${banner.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                      {banner.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">Add Payment Banner</h2>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
              <Button>Coming Soon</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
