import { useState } from 'react'
import { Building2, Boxes, CheckCircle2, XCircle, Clock } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const stats = [
  { label: 'Pending partners',  value: '31',  delta: '+8',  tone: 'warning', icon: Building2 },
  { label: 'Pending products',  value: '421', delta: '+64', tone: 'warning', icon: Boxes },
  { label: 'Approved today',    value: '18',  delta: '+4',  tone: 'success', icon: CheckCircle2 },
  { label: 'Rejected today',    value: '5',   delta: '+2',  tone: 'danger',  icon: XCircle },
]

type ApprovalType = 'PARTNER' | 'PRODUCT'

interface ApprovalItem {
  id: string
  type: ApprovalType
  name: string
  submittedBy: string
  category: string
  submitted: string
  priority: 'HIGH' | 'NORMAL'
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  details: string
}

const items: ApprovalItem[] = [
  { id: 'PA-031', type: 'PARTNER',  name: 'Tigist Fashions',      submittedBy: 'Tigist Alemu',   category: 'Fashion',    submitted: '12 Jul', priority: 'HIGH',   status: 'PENDING', details: 'New partner application with business license attached.' },
  { id: 'PA-032', type: 'PARTNER',  name: 'Selam Crafts',         submittedBy: 'Selam Haile',    category: 'Crafts',     submitted: '11 Jul', priority: 'NORMAL', status: 'PENDING', details: 'Handcraft seller from Merkato area.' },
  { id: 'PR-421', type: 'PRODUCT',  name: 'Handwoven Market Basket',submittedBy: 'Selam Crafts', category: 'Home',       submitted: '12 Jul', priority: 'NORMAL', status: 'PENDING', details: 'Natural fiber basket, price ETB 1,450. Images attached.' },
  { id: 'PR-422', type: 'PRODUCT',  name: 'Berbere Spice 500g',   submittedBy: 'Dawit Foods',    category: 'Food',       submitted: '12 Jul', priority: 'HIGH',   status: 'PENDING', details: 'Bulk spice variant — new SKU. Shelf life 18 months.' },
  { id: 'PR-420', type: 'PRODUCT',  name: 'Leather Sandals — Brown',submittedBy: 'Aster Mart',   category: 'Fashion',    submitted: '11 Jul', priority: 'NORMAL', status: 'PENDING', details: 'Genuine leather, sizes 36-45. Price ETB 1,200.' },
  { id: 'PA-030', type: 'PARTNER',  name: 'Henok Organics',       submittedBy: 'Henok Mesfin',   category: 'Health',     submitted: '10 Jul', priority: 'NORMAL', status: 'APPROVED',details: 'Approved by Biruk M. on 11 Jul.' },
  { id: 'PR-419', type: 'PRODUCT',  name: 'Ethiopian Cookbook 2nd Ed.',submittedBy: 'Aster Mart', category: 'Books',     submitted: '10 Jul', priority: 'NORMAL', status: 'REJECTED',details: 'Rejected: duplicate ISBN, existing listing found.' },
]

export function ApprovalsPage() {
  const [filter, setFilter] = useState<'All' | ApprovalType | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING')
  const [selected, setSelected] = useState<ApprovalItem | null>(null)

  const filtered = items.filter((i) => {
    if (filter === 'All') return true
    if (filter === 'PARTNER' || filter === 'PRODUCT') return i.type === filter
    return i.status === filter
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-brand-600">Approvals queue</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Approvals</h1>
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
            <Badge variant={tone as 'success' | 'warning' | 'danger'} className="mt-2">{delta}</Badge>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        {/* List */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap gap-2 border-b border-slate-200 p-4 dark:border-slate-800">
            {(['PENDING', 'PARTNER', 'PRODUCT', 'APPROVED', 'REJECTED', 'All'] as const).map((f) => (
              <button key={f} type="button" onClick={() => setFilter(f)}
                className={`rounded-xl px-3 py-1.5 text-xs font-medium capitalize transition ${filter === f ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'}`}>
                {f.charAt(0) + f.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((item) => (
              <button key={item.id} type="button" onClick={() => setSelected(item)}
                className={`w-full p-4 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/50 ${selected?.id === item.id ? 'bg-brand-50 dark:bg-brand-950/20' : ''}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant={item.type === 'PARTNER' ? 'info' : 'warning'} className="text-[10px]">{item.type}</Badge>
                      {item.priority === 'HIGH' && <Badge variant="danger" className="text-[10px]">HIGH PRIORITY</Badge>}
                    </div>
                    <p className="mt-1 truncate font-medium text-slate-900 dark:text-slate-100">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.id} · {item.submittedBy} · {item.submitted}</p>
                  </div>
                  <Badge variant={item.status === 'PENDING' ? 'warning' : item.status === 'APPROVED' ? 'success' : 'danger'}>
                    {item.status.charAt(0) + item.status.slice(1).toLowerCase()}
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Detail */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {selected ? (
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant={selected.type === 'PARTNER' ? 'info' : 'warning'}>{selected.type}</Badge>
                <span className="font-mono text-xs text-slate-400">{selected.id}</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{selected.name}</h2>
                <p className="mt-1 text-sm text-slate-500">Submitted by <span className="font-medium">{selected.submittedBy}</span> on {selected.submitted}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                {selected.details}
              </div>
              <div className="flex gap-2">
                <Badge variant="default">Category: {selected.category}</Badge>
                <Badge variant={selected.priority === 'HIGH' ? 'danger' : 'default'}>Priority: {selected.priority}</Badge>
              </div>
              {selected.status === 'PENDING' && (
                <div className="flex gap-3 pt-2">
                  <Button className="flex-1 gap-2 bg-brand-600 hover:bg-brand-700">
                    <CheckCircle2 className="h-4 w-4" />Approve
                  </Button>
                  <Button variant="outline" className="flex-1 gap-2 border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30">
                    <XCircle className="h-4 w-4" />Reject
                  </Button>
                </div>
              )}
              {selected.status !== 'PENDING' && (
                <div className={`rounded-xl p-3 text-sm font-medium ${selected.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400'}`}>
                  This item has been {selected.status.toLowerCase()}.
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center text-slate-400">
              <div className="text-center">
                <Clock className="mx-auto h-10 w-10 mb-2 opacity-30" />
                <p className="text-sm">Select an item to review</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
