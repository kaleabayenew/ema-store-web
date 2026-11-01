import { useEffect, useState } from 'react'
import {
  Building2, CheckCircle2, Clock, Star, Search, MoreHorizontal, Loader2, AlertCircle,
  ChevronLeft, ChevronRight, Eye, Clipboard, Phone, Ban, ShieldCheck,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import api from '@/lib/api'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Partner {
  id: string
  shop: string
  owner: string
  subCity: string
  products: number
  revenue: string
  rating: number
  reviewCount: number
  logoUrl: string | null
  description: string | null
  address: string | null
  partnerEmail: string | null
  createdAt: string
  phone?: string
  email?: string
  status: 'APPROVED' | 'PENDING' | 'SUSPENDED'
}

interface PartnerDetail extends Partner {
  phone?: string
  email?: string
}

type FilterStatus = 'All' | 'APPROVED' | 'PENDING' | 'SUSPENDED'

const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  APPROVED:  'success',
  PENDING:   'warning',
  SUSPENDED: 'danger',
  REJECTED:  'danger',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-ET', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function PartnersPage() {
  const [partners, setPartners]     = useState<Partner[]>([])
  const [total, setTotal]           = useState(0)
  const [page, setPage]             = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch]         = useState('')
  const [filter, setFilter]         = useState<FilterStatus>('All')
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [selected, setSelected]     = useState<PartnerDetail | null>(null)
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null)

  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, avgRating: 0 })

  const PAGE_SIZE = 15

  const fetchPartners = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get('/admin/partners', {
        params: {
          search,
          status: filter === 'All' ? undefined : filter,
          page,
          limit: PAGE_SIZE,
        },
      })
      setPartners(response.data.partners ?? [])
      setTotal(response.data.total ?? 0)
      setTotalPages(response.data.totalPages ?? 1)
      setStats({
        total:    response.data.total ?? 0,
        approved: response.data.approved ?? 0,
        pending:  response.data.pending ?? 0,
        avgRating: response.data.avgRating ?? 0,
      })
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to load partners')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPartners() /* eslint-disable-next-line */ }, [page, filter])

  useEffect(() => {
    const t = setTimeout(() => {
      if (page !== 1) setPage(1)
      else fetchPartners()
    }, search ? 400 : 0)
    return () => clearTimeout(t)
    // eslint-disable-next-line
  }, [search])

  async function updateStatus(partner: Partner, status: 'APPROVED' | 'PENDING' | 'SUSPENDED') {
    setStatusUpdatingId(partner.id)
    try {
      await api.patch(`/admin/partners/${partner.id}/status`, { status })
      fetchPartners()
      if (selected?.id === partner.id) setSelected(null)
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Action failed')
    } finally {
      setStatusUpdatingId(null)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

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
      {/* Header */}
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

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total partners', value: stats.total,    icon: Building2,    color: 'text-brand-600' },
          { label: 'Approved',       value: stats.approved,  icon: CheckCircle2, color: 'text-emerald-600' },
          { label: 'Pending review', value: stats.pending,   icon: Clock,        color: 'text-amber-600' },
          { label: 'Avg. rating',    value: stats.avgRating,  icon: Star,         color: 'text-violet-600' },
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
              placeholder="Search shop, owner or phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 sm:w-80"
            />
          </div>
          <div className="flex gap-2">
            {(['All', 'APPROVED', 'PENDING', 'SUSPENDED'] as FilterStatus[]).map((f) => (
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
              {partners.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    <Building2 className="mx-auto h-8 w-8 mb-2" />
                    No partners found.
                  </td>
                </tr>
              )}
              {partners.map((p) => (
                <tr key={p.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  {/* Shop */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-amber-100 text-sm font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                        {p.logoUrl
                          ? <img src={p.logoUrl} alt={p.shop} className="h-full w-full object-cover" />
                          : p.shop.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 dark:text-slate-100 truncate max-w-[160px]">{p.shop}</p>
                        <p className="text-xs text-slate-400 font-mono">{p.id.slice(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  {/* Owner */}
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    <div className="flex flex-col">
                      <span className="truncate max-w-[120px]">{p.owner}</span>
                      {p.phone && <span className="text-xs text-slate-400">{p.phone}</span>}
                    </div>
                  </td>
                  {/* Sub-city */}
                  <td className="px-4 py-3 text-slate-500">{p.subCity}</td>
                  {/* Products */}
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{p.products}</td>
                  {/* Revenue */}
                  <td className="px-4 py-3 font-semibold text-brand-700 dark:text-brand-300">{p.revenue}</td>
                  {/* Rating */}
                  <td className="px-4 py-3">
                    {p.rating > 0 ? (
                      <span className="flex items-center gap-1 text-amber-600">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />{p.rating.toFixed(1)}
                      </span>
                    ) : <span className="text-slate-400">—</span>}
                  </td>
                  {/* Status */}
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant[p.status]}>{p.status.charAt(0) + p.status.slice(1).toLowerCase()}</Badge>
                  </td>
                  {/* Actions */}
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <div className="px-2 py-1.5 text-xs font-semibold text-slate-400">Actions</div>
                        <div className="my-1 h-px bg-slate-100 dark:bg-slate-800" />
                        <DropdownMenuItem onClick={() => setSelected(p)}>
                          <Eye className="mr-2 h-4 w-4" />View details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => p.phone && navigator.clipboard.writeText(p.phone)}>
                          <Phone className="mr-2 h-4 w-4" />Copy phone
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(p.id)}>
                          <Clipboard className="mr-2 h-4 w-4" />Copy partner ID
                        </DropdownMenuItem>
                        <div className="my-1 h-px bg-slate-100 dark:bg-slate-800" />
                        <DropdownMenuItem
                          disabled={statusUpdatingId === p.id}
                          onClick={() => updateStatus(p, p.status === 'APPROVED' ? 'SUSPENDED' : 'APPROVED')}
                          className={p.status === 'APPROVED' ? 'text-red-500 focus:text-red-600' : 'text-emerald-600 focus:text-emerald-700'}
                        >
                          {statusUpdatingId === p.id
                            ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            : p.status === 'APPROVED'
                              ? <Ban className="mr-2 h-4 w-4" />
                              : <ShieldCheck className="mr-2 h-4 w-4" />}
                          {p.status === 'APPROVED' ? 'Suspend partner' : 'Approve partner'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
          <span className="text-sm text-slate-500">
            {loading
              ? 'Loading…'
              : `Showing ${partners.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–${(page - 1) * PAGE_SIZE + partners.length} of ${total} partners`}
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => setPage(page - 1)}>
                <ChevronLeft className="h-4 w-4" /><span className="ml-1">Prev</span>
              </Button>
              <span className="text-sm text-slate-500">
                Page <span className="font-semibold text-slate-800 dark:text-slate-100">{page}</span> of {totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={page >= totalPages || loading} onClick={() => setPage(page + 1)}>
                <span className="mr-1">Next</span><ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ── Partner Detail Modal ── */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white shadow-2xl dark:bg-slate-900 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-600 to-amber-500 px-6 py-5">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white/30 bg-white/20 text-2xl font-bold text-white shadow-lg">
                  {selected.logoUrl
                    ? <img src={selected.logoUrl} alt={selected.shop} className="h-full w-full object-cover" />
                    : selected.shop.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-widest text-amber-100">Partner</p>
                  <h2 className="text-xl font-bold text-white truncate">{selected.shop}</h2>
                  <div className="mt-1 flex items-center gap-2">
                    {selected.phone && (
                      <span className="flex items-center gap-1 text-xs text-amber-100">
                        <Phone className="h-3 w-3" />{selected.phone}
                      </span>
                    )}
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${selected.status === 'APPROVED' ? 'bg-emerald-400/30 text-emerald-100' : selected.status === 'SUSPENDED' ? 'bg-red-400/30 text-red-100' : 'bg-amber-400/30 text-amber-100'}`}>
                      {selected.status === 'APPROVED' ? '● Approved' : selected.status === 'SUSPENDED' ? '● Suspended' : '● Pending'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100 dark:divide-slate-800 dark:border-slate-800">
              {[
                { label: 'Products', value: selected.products.toString() },
                { label: 'Revenue', value: selected.revenue },
                { label: 'Rating', value: selected.rating > 0 ? `${selected.rating.toFixed(1)} ★` : '—' },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col items-center py-4">
                  <p className="text-base font-bold text-slate-900 dark:text-slate-100">{value}</p>
                  <p className="text-xs text-slate-400">{label}</p>
                </div>
              ))}
            </div>

            {/* Detail grid */}
            <div className="grid grid-cols-2 gap-3 p-5">
              {[
                { label: 'Owner',      value: selected.owner },
                { label: 'Sub-city',   value: selected.subCity },
                { label: 'Email',      value: selected.email ?? selected.partnerEmail ?? '—' },
                { label: 'Joined',     value: formatDate(selected.createdAt) },
                { label: 'Reviews',    value: selected.reviewCount?.toString() ?? '—' },
                { label: 'Address',    value: selected.address ?? '—' },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                  <p className="text-xs text-slate-400">{label}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{value}</p>
                </div>
              ))}
              {selected.description && (
                <div className="col-span-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                  <p className="text-xs text-slate-400">Description</p>
                  <p className="mt-1 text-sm text-slate-800 dark:text-slate-100">{selected.description}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 border-t border-slate-100 px-5 pb-5 pt-3 dark:border-slate-800">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => selected.phone && navigator.clipboard.writeText(selected.phone)}
              >
                <Phone className="mr-2 h-4 w-4" />Copy Phone
              </Button>
              <Button
                className={`flex-1 text-white ${selected.status === 'APPROVED' ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                disabled={statusUpdatingId === selected.id}
                onClick={() => { updateStatus(selected, selected.status === 'APPROVED' ? 'SUSPENDED' : 'APPROVED'); setSelected(null) }}
              >
                {statusUpdatingId === selected.id ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : selected.status === 'APPROVED' ? (
                  <><Ban className="mr-2 h-4 w-4" />Suspend</>
                ) : (
                  <><ShieldCheck className="mr-2 h-4 w-4" />Approve</>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
