import { CheckCircle2, MapPin, MoreHorizontal, Package, Search, Truck, Warehouse } from 'lucide-react'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const stats = [
  { label: 'Active zones',      value: '8',    delta: '+1',     tone: 'info',    icon: MapPin },
  { label: 'Deliveries today',  value: '412',  delta: '+18.4%', tone: 'success', icon: Truck },
  { label: 'On-time rate',      value: '94.2%',delta: '+2.1%',  tone: 'success', icon: CheckCircle2 },
  { label: 'Avg. delivery time',value: '42 min',delta: '-4m',   tone: 'success', icon: Package },
]

const zones = [
  { id: 'Z-001', name: 'Bole Area',         subCities: ['Bole', 'Lemi Kura'],     fee: 'ETB 60', riders: 18, deliveries: 124, status: 'ACTIVE' },
  { id: 'Z-002', name: 'Piazza / Arada',    subCities: ['Arada', 'Addis Ketema'], fee: 'ETB 55', riders: 14, deliveries: 98,  status: 'ACTIVE' },
  { id: 'Z-003', name: 'Kazanchis',         subCities: ['Kirkos'],                fee: 'ETB 50', riders: 11, deliveries: 82,  status: 'ACTIVE' },
  { id: 'Z-004', name: 'Yeka & Entoto',     subCities: ['Yeka', 'Entoto'],        fee: 'ETB 80', riders: 9,  deliveries: 54,  status: 'ACTIVE' },
  { id: 'Z-005', name: 'Nifas Silk Lafto',  subCities: ['Nifas Silk'],            fee: 'ETB 70', riders: 8,  deliveries: 44,  status: 'ACTIVE' },
  { id: 'Z-006', name: 'Lideta',            subCities: ['Lideta'],                fee: 'ETB 55', riders: 7,  deliveries: 38,  status: 'ACTIVE' },
  { id: 'Z-007', name: 'Akaki Kality',      subCities: ['Akaki Kality'],          fee: 'ETB 90', riders: 5,  deliveries: 21,  status: 'LIMITED' },
  { id: 'Z-008', name: 'Kolfe Keranio',     subCities: ['Kolfe'],                 fee: 'ETB 75', riders: 6,  deliveries: 31,  status: 'ACTIVE' },
]

const recentDeliveries = [
  { id: 'DL-2201', order: 'EM-4829', rider: 'Abebe G.',   from: 'Aster Mart, Bole',        to: 'Yeka',      eta: 'Delivered', status: 'DELIVERED' },
  { id: 'DL-2202', order: 'EM-4830', rider: 'Tekle H.',   from: 'Kebede Store, Arada',     to: 'Yeka',      eta: '4 min',     status: 'IN_TRANSIT' },
  { id: 'DL-2203', order: 'EM-4831', rider: 'Solomon T.', from: 'Biruk Electronics, Kirkos',to: 'Bole',     eta: '11 min',    status: 'IN_TRANSIT' },
  { id: 'DL-2204', order: 'EM-4832', rider: '—',          from: '—',                        to: 'Arada',     eta: '—',         status: 'CANCELLED' },
  { id: 'DL-2205', order: 'EM-4833', rider: 'Mulatu K.',  from: 'Dawit Foods, Bole',       to: 'Nifas',     eta: 'Delivered', status: 'DELIVERED' },
]

const deliveryVariant: Record<string, 'success' | 'info' | 'danger' | 'default'> = {
  DELIVERED: 'success', IN_TRANSIT: 'info', CANCELLED: 'danger', PENDING: 'default',
}

export function DeliveryPage() {
  const [search, setSearch] = useState('')

  const filteredZones = zones.filter((z) =>
    z.name.toLowerCase().includes(search.toLowerCase()) ||
    z.subCities.some((s) => s.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-brand-600">Delivery management</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Delivery & Zones</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Export</Button>
          <Button>Add zone</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, delta, tone, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">{label}</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-300"><Icon className="h-4 w-4" /></span>
            </div>
            <p className="mt-4 text-2xl font-semibold text-slate-900 dark:text-slate-100">{value}</p>
            <Badge variant={tone as 'success' | 'info'} className="mt-2">{delta}</Badge>
          </div>
        ))}
      </div>

      {/* Zones */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">Delivery zones</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search zones…" value={search} onChange={(e) => setSearch(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 w-56" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left dark:border-slate-800">
                {['Zone', 'Sub-cities', 'Delivery fee', 'Riders', 'Deliveries today', 'Status', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredZones.map((z) => (
                <tr key={z.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-300"><Warehouse className="h-4 w-4" /></span>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100">{z.name}</p>
                        <p className="text-xs text-slate-400">{z.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{z.subCities.join(', ')}</td>
                  <td className="px-4 py-3 font-semibold text-brand-700 dark:text-brand-300">{z.fee}</td>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{z.riders}</td>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{z.deliveries}</td>
                  <td className="px-4 py-3"><Badge variant={z.status === 'ACTIVE' ? 'success' : 'warning'}>{z.status.charAt(0) + z.status.slice(1).toLowerCase()}</Badge></td>
                  <td className="px-4 py-3"><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent deliveries */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 p-4 dark:border-slate-800">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">Recent deliveries</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left dark:border-slate-800">
                {['Delivery ID', 'Order', 'Rider', 'From', 'To', 'ETA', 'Status'].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentDeliveries.map((d) => (
                <tr key={d.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">{d.id}</td>
                  <td className="px-4 py-3 font-medium text-brand-700 dark:text-brand-300">{d.order}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{d.rider}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{d.from}</td>
                  <td className="px-4 py-3 text-slate-500">{d.to}</td>
                  <td className="px-4 py-3 text-slate-500">{d.eta}</td>
                  <td className="px-4 py-3"><Badge variant={deliveryVariant[d.status]}>{d.status === 'IN_TRANSIT' ? 'In transit' : d.status.charAt(0) + d.status.slice(1).toLowerCase()}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
