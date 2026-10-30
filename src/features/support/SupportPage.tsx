import { useState } from 'react'
import { MessageSquareText, CheckCircle2, Clock, XCircle, Search, Send } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const stats = [
  { label: 'Open tickets',    value: '48',  delta: '-12.4%', tone: 'success', icon: MessageSquareText },
  { label: 'Resolved today',  value: '31',  delta: '+8.2%',  tone: 'success', icon: CheckCircle2 },
  { label: 'Avg. response',   value: '4h',  delta: '-0.5h',  tone: 'success', icon: Clock },
  { label: 'Escalated',       value: '6',   delta: '+2',     tone: 'danger',  icon: XCircle },
]

type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

interface Ticket {
  id: string
  subject: string
  customer: string
  agent: string
  priority: TicketPriority
  status: TicketStatus
  created: string
  messages: { sender: string; text: string; time: string; isStaff: boolean }[]
}

const tickets: Ticket[] = [
  { id: 'TKT-9921', subject: 'Order not received after 5 days',   customer: 'Meron Haile',    agent: 'Selam B.', priority: 'HIGH',   status: 'OPEN',        created: '12 Jul 2025',
    messages: [{ sender: 'Meron Haile', text: 'My order EM-4810 was supposed to arrive 3 days ago. Please help.', time: '09:12', isStaff: false }, { sender: 'Selam B.', text: "We're checking with the delivery team. We'll update you shortly.", time: '09:45', isStaff: true }] },
  { id: 'TKT-9922', subject: 'Wrong item delivered',               customer: 'Yonas Tesfaye', agent: 'Selam B.', priority: 'MEDIUM', status: 'IN_PROGRESS', created: '11 Jul 2025',
    messages: [{ sender: 'Yonas Tesfaye', text: 'I received a different product than what I ordered.', time: '14:30', isStaff: false }] },
  { id: 'TKT-9923', subject: 'Refund not processed',               customer: 'Tigist Alemu',  agent: '—',        priority: 'HIGH',   status: 'OPEN',        created: '11 Jul 2025',
    messages: [{ sender: 'Tigist Alemu', text: 'It has been 7 days since my return was approved. Still no refund.', time: '10:00', isStaff: false }] },
  { id: 'TKT-9924', subject: 'App login issue',                    customer: 'Abel Kebede',   agent: 'Dawit A.', priority: 'LOW',    status: 'RESOLVED',    created: '10 Jul 2025',
    messages: [{ sender: 'Dawit A.', text: 'Issue resolved — password reset link sent.', time: '16:20', isStaff: true }] },
  { id: 'TKT-9925', subject: 'Payment deducted but order failed',  customer: 'Rahel Tadesse', agent: 'Selam B.', priority: 'URGENT', status: 'IN_PROGRESS', created: '9 Jul 2025',
    messages: [{ sender: 'Rahel Tadesse', text: 'ETB 3,400 was deducted from my Telebirr but the order shows as failed.', time: '08:55', isStaff: false }] },
]

const statusVariant: Record<TicketStatus, 'success' | 'warning' | 'info' | 'default'> = {
  OPEN: 'warning', IN_PROGRESS: 'info', RESOLVED: 'success', CLOSED: 'default',
}
const priorityVariant: Record<TicketPriority, 'danger' | 'warning' | 'info' | 'default'> = {
  URGENT: 'danger', HIGH: 'danger', MEDIUM: 'warning', LOW: 'default',
}

export function SupportPage() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'All' | TicketStatus>('All')
  const [selected, setSelected] = useState<Ticket | null>(null)
  const [reply, setReply] = useState('')

  const filtered = tickets.filter((t) => {
    const matchSearch = t.subject.toLowerCase().includes(search.toLowerCase()) || t.customer.toLowerCase().includes(search.toLowerCase()) || t.id.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'All' || t.status === filter
    return matchSearch && matchFilter
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-brand-600">Customer support</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Support tickets</h1>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, delta, tone, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">{label}</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-300"><Icon className="h-4 w-4" /></span>
            </div>
            <p className="mt-4 text-2xl font-semibold text-slate-900 dark:text-slate-100">{value}</p>
            <Badge variant={tone as 'success' | 'danger'} className="mt-2">{delta}</Badge>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        {/* Ticket list */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-slate-800 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Search tickets…" value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
            </div>
            <div className="flex gap-1">
              {(['All', 'OPEN', 'IN_PROGRESS', 'RESOLVED'] as const).map((f) => (
                <button key={f} type="button" onClick={() => setFilter(f)}
                  className={`rounded-xl px-2.5 py-1.5 text-xs font-medium transition ${filter === f ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'}`}>
                  {f === 'IN_PROGRESS' ? 'In progress' : f.charAt(0) + f.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((t) => (
              <button key={t.id} type="button" onClick={() => setSelected(t)}
                className={`w-full p-4 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/50 ${selected?.id === t.id ? 'bg-brand-50 dark:bg-brand-950/20' : ''}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900 dark:text-slate-100">{t.subject}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{t.id} · {t.customer} · {t.created}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge variant={statusVariant[t.status]}>{t.status === 'IN_PROGRESS' ? 'In progress' : t.status.charAt(0) + t.status.slice(1).toLowerCase()}</Badge>
                    <Badge variant={priorityVariant[t.priority]}>{t.priority.charAt(0) + t.priority.slice(1).toLowerCase()}</Badge>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Ticket detail */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {selected ? (
            <div className="flex h-full flex-col">
              <div className="border-b border-slate-200 p-4 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-brand-600">{selected.id}</span>
                  <Badge variant={statusVariant[selected.status]}>{selected.status === 'IN_PROGRESS' ? 'In progress' : selected.status.charAt(0) + selected.status.slice(1).toLowerCase()}</Badge>
                </div>
                <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{selected.subject}</p>
                <p className="mt-0.5 text-xs text-slate-500">Customer: {selected.customer} · Agent: {selected.agent}</p>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {selected.messages.map((m, i) => (
                  <div key={i} className={`flex ${m.isStaff ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.isStaff ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100'}`}>
                      <p className="text-[11px] font-semibold mb-1 opacity-70">{m.sender}</p>
                      <p>{m.text}</p>
                      <p className="mt-1 text-[10px] opacity-60 text-right">{m.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-200 p-3 dark:border-slate-800">
                <div className="flex gap-2">
                  <input type="text" placeholder="Reply…" value={reply} onChange={(e) => setReply(e.target.value)}
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
                  <Button size="icon" onClick={() => setReply('')}><Send className="h-4 w-4" /></Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center text-slate-400">
              <div className="text-center">
                <MessageSquareText className="mx-auto h-10 w-10 mb-2 opacity-30" />
                <p className="text-sm">Select a ticket to view</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
