import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const stats = [
  { label: 'Gross revenue',   value: 'ETB 4.8M', delta: '+18.2%', tone: 'success', icon: TrendingUp },
  { label: 'Platform fees',   value: 'ETB 598K', delta: '+16.4%', tone: 'info',    icon: CreditCard },
  { label: 'Payouts sent',    value: 'ETB 3.9M', delta: '+19.1%', tone: 'success', icon: ArrowUpRight },
  { label: 'Refunds issued',  value: 'ETB 86K',  delta: '-3.1%',  tone: 'danger',  icon: ArrowDownLeft },
]

const transactions = [
  { id: 'TXN-8821', type: 'ORDER_SALE',            ref: 'EM-4829', party: 'Meron Haile',     amount: '+ETB 2,140', fee: 'ETB 267',  status: 'PAID',   date: '12 Jul 2025' },
  { id: 'TXN-8822', type: 'PAYOUT_WITHDRAWAL',     ref: 'PO-312',  party: 'Aster Mart',      amount: '-ETB 8,420', fee: '—',        status: 'PAID',   date: '12 Jul 2025' },
  { id: 'TXN-8823', type: 'REFUND',                ref: 'EM-4801', party: 'Tigist Alemu',    amount: '-ETB 680',   fee: '—',        status: 'PAID',   date: '11 Jul 2025' },
  { id: 'TXN-8824', type: 'ORDER_SALE',            ref: 'EM-4830', party: 'Yonas Tesfaye',   amount: '+ETB 680',   fee: 'ETB 85',   status: 'PENDING',date: '12 Jul 2025' },
  { id: 'TXN-8825', type: 'COMMISSION_DEDUCTION',  ref: 'EM-4828', party: 'Biruk Electronics',amount: '-ETB 406',  fee: '—',        status: 'PAID',   date: '11 Jul 2025' },
  { id: 'TXN-8826', type: 'ORDER_SALE',            ref: 'EM-4831', party: 'Rahel Tadesse',   amount: '+ETB 5,120', fee: 'ETB 640',  status: 'PENDING',date: '9 Jul 2025' },
]

const payouts = [
  { id: 'PO-312', partner: 'Aster Mart',        amount: 'ETB 8,420', bank: 'Telebirr',  status: 'PAID',      requested: '10 Jul', paid: '12 Jul' },
  { id: 'PO-313', partner: 'Biruk Electronics', amount: 'ETB 24,180',bank: 'CBE',       status: 'APPROVED',  requested: '11 Jul', paid: '—' },
  { id: 'PO-314', partner: 'Dawit Foods',       amount: 'ETB 6,340', bank: 'Telebirr',  status: 'REQUESTED', requested: '12 Jul', paid: '—' },
  { id: 'PO-315', partner: 'Selam Crafts',      amount: 'ETB 2,180', bank: 'CBE',       status: 'REQUESTED', requested: '12 Jul', paid: '—' },
]

const typeColors: Record<string, string> = {
  ORDER_SALE: 'text-emerald-600 dark:text-emerald-400',
  PAYOUT_WITHDRAWAL: 'text-slate-500',
  REFUND: 'text-red-500',
  COMMISSION_DEDUCTION: 'text-amber-600 dark:text-amber-400',
}

const payoutVariant: Record<string, 'success' | 'warning' | 'info' | 'default'> = {
  PAID: 'success', APPROVED: 'info', REQUESTED: 'warning',
}

export function FinancePage() {
  const [tab, setTab] = useState<'transactions' | 'payouts'>('transactions')

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-brand-600">Finance</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Finance & Payouts</h1>
        </div>
        <Button variant="outline">Export statement</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, delta, tone, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">{label}</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300"><Icon className="h-4 w-4" /></span>
            </div>
            <p className="mt-4 text-2xl font-semibold text-slate-900 dark:text-slate-100">{value}</p>
            <Badge variant={tone as 'success' | 'info' | 'danger'} className="mt-2">{delta}</Badge>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex gap-1 border-b border-slate-200 px-4 pt-3 dark:border-slate-800">
          {(['transactions', 'payouts'] as const).map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)}
              className={`rounded-t-lg px-4 py-2 text-sm font-medium capitalize transition ${tab === t ? 'border-b-2 border-brand-600 text-brand-700 dark:text-brand-300' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'}`}>{t}</button>
          ))}
        </div>

        {tab === 'transactions' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left dark:border-slate-800">
                  {['ID', 'Type', 'Reference', 'Party', 'Amount', 'Fee', 'Status', 'Date'].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {transactions.map((t) => (
                  <tr key={t.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">{t.id}</td>
                    <td className="px-4 py-3"><span className={`text-xs font-semibold ${typeColors[t.type]}`}>{t.type.replace(/_/g, ' ')}</span></td>
                    <td className="px-4 py-3 text-brand-700 dark:text-brand-300 font-medium">{t.ref}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{t.party}</td>
                    <td className={`px-4 py-3 font-bold ${t.amount.startsWith('+') ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>{t.amount}</td>
                    <td className="px-4 py-3 text-slate-500">{t.fee}</td>
                    <td className="px-4 py-3"><Badge variant={t.status === 'PAID' ? 'success' : 'warning'}>{t.status.charAt(0) + t.status.slice(1).toLowerCase()}</Badge></td>
                    <td className="px-4 py-3 text-slate-500">{t.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'payouts' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left dark:border-slate-800">
                  {['ID', 'Partner', 'Amount', 'Bank', 'Requested', 'Paid', 'Status', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {payouts.map((p) => (
                  <tr key={p.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">{p.id}</td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{p.partner}</td>
                    <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">{p.amount}</td>
                    <td className="px-4 py-3 text-slate-500">{p.bank}</td>
                    <td className="px-4 py-3 text-slate-500">{p.requested}</td>
                    <td className="px-4 py-3 text-slate-500">{p.paid}</td>
                    <td className="px-4 py-3"><Badge variant={payoutVariant[p.status]}>{p.status.charAt(0) + p.status.slice(1).toLowerCase()}</Badge></td>
                    <td className="px-4 py-3"><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
