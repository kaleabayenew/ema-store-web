import { Bike, CheckCircle2, Clock, MapPin, MoreHorizontal, Phone, Search, Zap } from 'lucide-react'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const stats = [
  { label: 'Active riders',    value: '84',    delta: '+6.3%',  tone: 'success', icon: Bike },
  { label: 'Rides today',      value: '412',   delta: '+18.4%', tone: 'info',    icon: Zap },
  { label: 'Avg. pickup time', value: '8 min', delta: '-1.2m',  tone: 'success', icon: Clock },
  { label: 'Completed today',  value: '388',   delta: '+15.2%', tone: 'success', icon: CheckCircle2 },
]

const riders = [
  { id: 'R-001', name: 'Abebe Girma',    phone: '911 100 200', zone: 'Bole',    vehicle: 'Motorcycle', trips: 18, status: 'ACTIVE',      rating: 4.9 },
  { id: 'R-002', name: 'Tekle Haile',    phone: '912 200 300', zone: 'Yeka',    vehicle: 'Motorcycle', trips: 12, status: 'ON_DELIVERY',  rating: 4.7 },
  { id: 'R-003', name: 'Mulatu Kebede',  phone: '913 300 400', zone: 'Kirkos',  vehicle: 'Bicycle',    trips: 7,  status: 'ACTIVE',      rating: 4.5 },
  { id: 'R-004', name: 'Solomon Tadesse',phone: '914 400 500', zone: 'Arada',   vehicle: 'Motorcycle', trips: 21, status: 'ON_DELIVERY',  rating: 4.8 },
  { id: 'R-005', name: 'Girma Bekele',   phone: '915 500 600', zone: 'Lideta',  vehicle: 'Motorcycle', trips: 4,  status: 'OFFLINE',     rating: 4.2 },
  { id: 'R-006', name: 'Dawit Alemu',    phone: '916 600 700', zone: 'Nifas',   vehicle: 'Van',        trips: 9,  status: 'ACTIVE',      rating: 4.6 },
  { id: 'R-007', name: 'Henok Mesfin',   phone: '917 700 800', zone: 'Kazanch', vehicle: 'Motorcycle', trips: 15, status: 'ON_DELIVERY',  rating: 4.9 },
  { id: 'R-008', name: 'Yonas Girma',    phone: '918 800 900', zone: 'Bole',    vehicle: 'Bicycle',    trips: 3,  status: 'OFFLINE',     rating: 3.9 },
]

const liveRides = [
  { id: 'RD-1021', rider: 'Tekle Haile',     order: 'EM-4830', from: 'Kebede Superstore, Arada', to: 'Yeka Sub-city',   eta: '4 min',  status: 'Picking up' },
  { id: 'RD-1022', rider: 'Solomon Tadesse',  order: 'EM-4831', from: 'Biruk Electronics, Kirkos', to: 'Bole Sub-city',  eta: '11 min', status: 'En route' },
  { id: 'RD-1023', rider: 'Henok Mesfin',     order: 'EM-4835', from: 'Aster Mart, Bole',          to: 'Kazanchis',      eta: '7 min',  status: 'En route' },
]

const statusVariant: Record<string, 'success' | 'info' | 'default'> = {
  ACTIVE: 'success', ON_DELIVERY: 'info', OFFLINE: 'default',
}
const statusLabel: Record<string, string> = {
  ACTIVE: 'Available', ON_DELIVERY: 'On delivery', OFFLINE: 'Offline',
}

export function RidePage() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'All' | 'ACTIVE' | 'ON_DELIVERY' | 'OFFLINE'>('All')

  const filtered = riders.filter((r) => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase()) || r.zone.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'All' || r.status === filter
    return matchSearch && matchFilter
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-brand-600">Ride management</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Ride & Delivery Riders</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Export</Button>
          <Button>Add rider</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, delta, tone, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">{label}</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300"><Icon className="h-4 w-4" /></span>
            </div>
            <p className="mt-4 text-2xl font-semibold text-slate-900 dark:text-slate-100">{value}</p>
            <Badge variant={tone as 'success' | 'info'} className="mt-2">{delta}</Badge>
          </div>
        ))}
      </div>

      {/* Live rides */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-brand-500" />
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Live rides</h2>
          <Badge variant="info">{liveRides.length} active</Badge>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {liveRides.map((ride) => (
            <div key={ride.id} className="rounded-xl border border-sky-200 bg-sky-50 p-3 dark:border-sky-900 dark:bg-sky-950/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-700 dark:text-sky-300">{ride.id}</span>
                <Badge variant="info">{ride.status}</Badge>
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{ride.rider}</p>
              <p className="text-xs text-slate-500">Order: {ride.order}</p>
              <div className="mt-2 space-y-1 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-1"><MapPin className="h-3 w-3 text-brand-500" />{ride.from}</div>
                <div className="flex items-center gap-1"><MapPin className="h-3 w-3 text-red-400" />{ride.to}</div>
              </div>
              <div className="mt-2 flex items-center gap-1 text-xs font-semibold text-brand-700 dark:text-brand-300">
                <Clock className="h-3 w-3" />ETA: {ride.eta}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rider table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search rider or zone…" value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 sm:w-64" />
          </div>
          <div className="flex gap-2">
            {(['All', 'ACTIVE', 'ON_DELIVERY', 'OFFLINE'] as const).map((f) => (
              <button key={f} type="button" onClick={() => setFilter(f)}
                className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${filter === f ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'}`}>
                {statusLabel[f] ?? f}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left dark:border-slate-800">
                {['Rider', 'Phone', 'Zone', 'Vehicle', 'Trips today', 'Rating', 'Status', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((r) => (
                <tr key={r.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-300">{r.name.charAt(0)}</div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100">{r.name}</p>
                        <p className="text-xs text-slate-400">{r.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className="flex items-center gap-1 text-slate-500"><Phone className="h-3 w-3" />{r.phone}</span></td>
                  <td className="px-4 py-3 text-slate-500">{r.zone}</td>
                  <td className="px-4 py-3"><Badge variant="default">{r.vehicle}</Badge></td>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{r.trips}</td>
                  <td className="px-4 py-3 text-amber-600 font-medium">★ {r.rating}</td>
                  <td className="px-4 py-3"><Badge variant={statusVariant[r.status]}>{statusLabel[r.status]}</Badge></td>
                  <td className="px-4 py-3"><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-200 px-4 py-3 text-sm text-slate-500 dark:border-slate-800">Showing {filtered.length} of {riders.length} riders</div>
      </div>
    </div>
  )
}
