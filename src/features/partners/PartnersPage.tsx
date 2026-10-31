import { useEffect, useState } from 'react'
import { Building2, CheckCircle2, Clock, Star, Search, MoreHorizontal, Loader2, AlertCircle } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'

interface Partner {
  id: string
  shop: string
  owner: string
  subCity: string
  products: number
  revenue: string
  rating: number
  status: 'APPROVED' | 'PENDING' | 'SUSPENDED'
  phone?: string
  email?: string
}

const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  APPROVED:  'success',
  PENDING:   'warning',
  SUSPENDED: 'danger',
  REJECTED: 'danger',
}

export function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'All' | 'APPROVED' | 'PENDING' | 'SUSPENDED'>('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, avgRating: 0 })

  // Fetch partners from backend
  const fetchPartners = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get('/admin/partners')
      const data = (response.data.partners ?? []) as Partner[]
      setPartners(data)

      const total = data.length
      const approved = data.filter((p) => p.status === 'APPROVED').length
      const pending = data.filter((p) => p.status === 'PENDING').length
      const avgRating = data.length > 0
        ? parseFloat((data.reduce((s, p) => s + (p.rating || 0), 0) / data.length).toFixed(1))
        : 0

      setStats({ total, approved, pending, avgRating })
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to load partners')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPartners()
  }, [])

  const filtered = partners.filter((p) => {
    const matchSearch = p.shop.toLowerCase().includes(search.toLowerCase()) || p.owner.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'All' || p.status === filter
    return matchSearch && matchFilter
  })

  if (loading && partners.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand-600" />
          <p className="mt-4 text-sm text-slate-500">Loading partners…</p>
        </div>
      </div>
    )
  }

  if (error && partners.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-red-500" />
          <p className="mt-4 text-sm text-slate-500">{error}</p>
          <Button variant="outline" className="mt-4" onClick={fetchPartners}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-brand-600">Partner management</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Partners</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchPartners} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Refresh
          </Button>
          <Button>Add partner</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total partners', value: stats.total,    delta: '',   tone: 'success', icon: Building2 },
          { label: 'Approved',       value: stats.approved, delta: '',   tone: 'success', icon: CheckCircle2 },
          { label: 'Pending review', value: stats.pending,   delta: '',   tone: 'warning', icon: Clock },
          { label: 'Avg. rating',    value: stats.avgRating, delta: '',   tone: 'info',    icon: Star },
        ].map(({ label, value, delta, tone, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">{label}</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-300"><Icon className="h-4 w-4" /></span>
            </div>
            <p className="mt-4 text-2xl font-semibold text-slate-900 dark:text-slate-100">{value}</p>
            {delta && <Badge variant={tone as 'success' | 'info' | 'warning'} className="mt-2">{delta}</Badge>}
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search partners…" value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 sm:w-64" />
          </div>
          <div className="flex gap-2">
            {(['All', 'APPROVED', 'PENDING', 'SUSPENDED'] as const).map((f) => (
              <button key={f} type="button" onClick={() => setFilter(f)}
                className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${filter === f ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'}`}>
                {f.charAt(0) + f.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-400">
            {error} — showing cached data.
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left dark:border-slate-800">
                {['Shop', 'Owner', 'Sub-city', 'Products', 'Revenue', 'Rating', 'Status', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    No partners found.
                  </td>
                </tr>
              )}
              {filtered.map((p) => (
                <tr key={p.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-sm font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-300">{p.shop.charAt(0)}</div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100">{p.shop}</p>
                        <p className="text-xs text-slate-400">{p.id.slice(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{p.owner}</td>
                  <td className="px-4 py-3 text-slate-500">{p.subCity}</td>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{p.products}</td>
                  <td className="px-4 py-3 font-semibold text-brand-700 dark:text-brand-300">{p.revenue}</td>
                  <td className="px-4 py-3">
                    {p.rating > 0 ? (
                      <span className="flex items-center gap-1 text-amber-600"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />{p.rating}</span>
                    ) : <span className="text-slate-400">—</span>}
                  </td>
                  <td className="px-4 py-3"><Badge variant={statusVariant[p.status]}>{p.status.charAt(0) + p.status.slice(1).toLowerCase()}</Badge></td>
                  <td className="px-4 py-3"><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-200 px-4 py-3 text-sm text-slate-500 dark:border-slate-800">Showing {filtered.length} of {partners.length} partners</div>
      </div>
    </div>
  )
}
