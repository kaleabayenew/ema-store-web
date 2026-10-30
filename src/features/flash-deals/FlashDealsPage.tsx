import { useState } from 'react'
import { Flame, Clock, Tag, Plus, Trash2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const stats = [
  { label: 'Active deals', value: '3', delta: '+1', tone: 'success', icon: Flame },
  { label: 'Total views', value: '12.4K', delta: '+18.2%', tone: 'info', icon: Clock },
  { label: 'Redeemed coupons', value: '842', delta: '+12.6%', tone: 'warning', icon: Tag },
]

const mockDeals = [
  {
    id: 'FD-001',
    title: '50% Off Fashion Week',
    description: 'Get 50% off on all fashion items from top Ethiopian designers!',
    discountPercent: 50,
    startsAt: '2026-10-22T10:00:00Z',
    endsAt: '2026-10-23T10:00:00Z',
    imageUrl: 'https://via.placeholder.com/400x200/1B9B5A/FFFFFF?text=Fashion',
    productCount: 24,
    categoryIds: ['fashion'],
    isActive: true,
    createdAt: '2026-10-22T08:00:00Z',
  },
  {
    id: 'FD-002',
    title: 'Electronics Bonanza',
    description: 'Up to 30% off on smartphones, headphones, and accessories!',
    discountPercent: 30,
    startsAt: '2026-10-22T08:00:00Z',
    endsAt: '2026-10-22T20:00:00Z',
    imageUrl: 'https://via.placeholder.com/400x200/3B82F6/FFFFFF?text=Electronics',
    productCount: 18,
    categoryIds: ['electronics'],
    isActive: true,
    createdAt: '2026-10-21T10:00:00Z',
  },
  {
    id: 'FD-003',
    title: 'Home Essentials Sale',
    description: '25% off on home and kitchen essentials.',
    discountPercent: 25,
    startsAt: '2026-10-20T08:00:00Z',
    endsAt: '2026-10-21T08:00:00Z',
    imageUrl: 'https://via.placeholder.com/400x200/27C470/FFFFFF?text=Home',
    productCount: 35,
    categoryIds: ['home'],
    isActive: false,
    createdAt: '2026-10-19T12:00:00Z',
  },
]

export function FlashDealsPage() {
  const [deals, setDeals] = useState(mockDeals)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [filter, setFilter] = useState<'All' | 'Active' | 'Ended'>('All')

  const filteredDeals = deals.filter((deal) => {
    if (filter === 'All') return true
    if (filter === 'Active') return deal.isActive
    if (filter === 'Ended') return !deal.isActive
    return true
  })

  const formatTimeRemaining = (endsAt: string) => {
    const end = new Date(endsAt)
    const now = new Date()
    const diff = end.getTime() - now.getTime()

    if (diff <= 0) return 'Ended'

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 24) {
      const days = Math.floor(hours / 24)
      return `${days}d ${hours % 24}h`
    }

    return `${hours}h ${minutes}m`
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this flash deal?')) {
      setDeals(deals.filter((d) => d.id !== id))
    }
  }

  const handleToggleActive = (id: string) => {
    setDeals(
      deals.map((d) =>
        d.id === id ? { ...d, isActive: !d.isActive } : d
      )
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-brand-600">Flash Deals Management</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Flash Deals
          </h1>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Flash Deal
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map(({ label, value, delta, tone, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">{label}</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-300">
                <Icon className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-4 text-2xl font-semibold text-slate-900 dark:text-slate-100">{value}</p>
            <Badge variant={tone as 'success' | 'info' | 'warning'} className="mt-2">{delta}</Badge>
          </div>
        ))}
      </div>

      {/* Deals List */}
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

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {filteredDeals.map((deal) => (
            <div key={deal.id} className="p-4">
              <div className="flex gap-4">
                {/* Deal Image */}
                <div className="h-24 w-32 flex-shrink-0 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                  {deal.imageUrl ? (
                    <img
                      src={deal.imageUrl}
                      alt={deal.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-400">
                      <Flame className="h-8 w-8" />
                    </div>
                  )}
                </div>

                {/* Deal Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                          {deal.title}
                        </h3>
                        <Badge variant={deal.isActive ? 'success' : 'default'}>
                          {deal.isActive ? 'Active' : 'Ended'}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        {deal.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(deal.id)}
                      >
                        {deal.isActive ? 'Pause' : 'Activate'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(deal.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-brand-600" />
                      <span className="text-slate-600 dark:text-slate-300">
                        {deal.discountPercent}% off
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-600 dark:text-slate-300">
                        {formatTimeRemaining(deal.endsAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-600 dark:text-slate-300">
                        {deal.productCount} products
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredDeals.length === 0 && (
          <div className="p-12 text-center text-slate-500">
            No flash deals found
          </div>
        )}
      </div>

      {/* Create Deal Dialog (placeholder) */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Create Flash Deal
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              TODO: Implement flash deal creation form with title, description, discount, time range, and product/category selection.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowCreateDialog(false)}>
                Create
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
