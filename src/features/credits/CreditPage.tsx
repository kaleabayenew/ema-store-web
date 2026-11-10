import { useCallback, useEffect, useState } from 'react'
import { Coins, Search, Wallet, ChevronLeft, ChevronRight, RefreshCw, History, X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  getCreditSummary,
  getCreditTransactions,
  getCreditUsers,
  type CreditCurrency,
  type CreditDirection,
  type CreditRole,
  type CreditSummaryResponse,
  type CreditTransaction,
  type CreditUser,
} from '@/services/creditService'

const PAGE_SIZE = 20

const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  COMPLETED: 'success',
  PAID: 'success',
  PENDING: 'warning',
  FAILED: 'danger',
  CANCELLED: 'default',
}

const roleLabel: Record<string, string> = {
  CUSTOMER: 'Customer',
  PARTNER: 'Partner',
  RIDE: 'Ride',
}

const roleBadgeVariant: Record<string, 'info' | 'warning' | 'success'> = {
  CUSTOMER: 'info',
  PARTNER: 'warning',
  RIDE: 'success',
}

function formatMoney(n: number) {
  return `ETB ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function isCoinTxn(txn: CreditTransaction) {
  return txn.type.toUpperCase().includes('COIN')
}

function isOutflow(txn: CreditTransaction) {
  const t = txn.type.toUpperCase()
  return txn.amount < 0 || t.includes('WITHDRAW') || t.includes('PAYOUT')
}

function Pagination({ page, totalPages, total, loading, onPage }: {
  page: number
  totalPages: number
  total: number
  loading: boolean
  onPage: (p: number) => void
}) {
  return (
    <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 dark:border-slate-800">
      <span className="text-xs text-slate-400">{total} record{total === 1 ? '' : 's'}</span>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => onPage(page - 1)}>
          <ChevronLeft className="h-4 w-4" /> Prev
        </Button>
        <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
        <Button variant="outline" size="sm" disabled={page >= totalPages || loading} onClick={() => onPage(page + 1)}>
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export function CreditPage() {
  const [view, setView] = useState<'users' | 'transactions'>('users')
  const [currency, setCurrency] = useState<CreditCurrency>('balance')
  const [direction, setDirection] = useState<CreditDirection>('all')
  const [role, setRole] = useState<CreditRole>('ALL')
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [userPage, setUserPage] = useState(1)
  const [selectedUser, setSelectedUser] = useState<CreditUser | null>(null)

  const [summary, setSummary] = useState<CreditSummaryResponse | null>(null)
  const [transactions, setTransactions] = useState<CreditTransaction[]>([])
  const [txTotal, setTxTotal] = useState(0)
  const [users, setUsers] = useState<CreditUser[]>([])
  const [usersTotal, setUsersTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Debounce the search box so we don't fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search.trim())
      setPage(1)
      setUserPage(1)
    }, 350)
    return () => clearTimeout(t)
  }, [search])

  const loadSummary = useCallback(async () => {
    try {
      setSummary(await getCreditSummary())
    } catch {
      // Summary is decorative — don't block the tables if it fails.
    }
  }, [])

  const loadTransactions = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getCreditTransactions({
        q: debouncedSearch,
        userId: selectedUser?.id,
        role,
        direction,
        currency,
        status: status || undefined,
        page,
        limit: PAGE_SIZE,
      })
      setTransactions(res.transactions)
      setTxTotal(res.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transactions.')
      setTransactions([])
      setTxTotal(0)
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, selectedUser, role, direction, currency, status, page])

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getCreditUsers({
        q: debouncedSearch,
        role,
        page: userPage,
        limit: PAGE_SIZE,
      })
      setUsers(res.users)
      setUsersTotal(res.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users.')
      setUsers([])
      setUsersTotal(0)
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, role, userPage])

  useEffect(() => { loadSummary() }, [loadSummary])
  useEffect(() => {
    if (view === 'users') loadUsers()
    else loadTransactions()
  }, [view, loadUsers, loadTransactions])

  const txTotalPages = Math.max(1, Math.ceil(txTotal / PAGE_SIZE))
  const userTotalPages = Math.max(1, Math.ceil(usersTotal / PAGE_SIZE))
  const coinTotal = summary?.totalCoins ?? 0
  const balanceTotal = summary?.totalBalance ?? 0

  const showUserHistory = (u: CreditUser) => {
    setSelectedUser(u)
    setSearch('')
    setDebouncedSearch('')
    setPage(1)
    setView('transactions')
  }

  const clearUserFilter = () => {
    setSelectedUser(null)
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-brand-600">Finance</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Credits &amp; Wallets</h1>
        </div>
        <Button
          variant="outline"
          onClick={() => { loadSummary(); view === 'users' ? loadUsers() : loadTransactions() }}
          disabled={loading}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Currency summary cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => { setCurrency('coins'); setView('transactions'); setPage(1) }}
          className={`rounded-2xl border p-4 text-left shadow-sm transition ${
            currency === 'coins'
              ? 'border-brand-500 bg-brand-50 dark:border-brand-500 dark:bg-brand-950/40'
              : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500 dark:text-slate-400">Coin balance</span>
            <Coins className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
            {coinTotal.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-slate-500">Total coins across customers, partners &amp; riders</p>
        </button>

        <button
          type="button"
          onClick={() => { setCurrency('balance'); setView('transactions'); setPage(1) }}
          className={`rounded-2xl border p-4 text-left shadow-sm transition ${
            currency === 'balance'
              ? 'border-brand-500 bg-brand-50 dark:border-brand-500 dark:bg-brand-950/40'
              : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500 dark:text-slate-400">Real balance</span>
            <Wallet className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
            {formatMoney(balanceTotal)}
          </p>
          <p className="mt-1 text-xs text-slate-500">Total wallet balance (ETB) across all users</p>
        </button>
      </div>

      {/* Per-role breakdown */}
      {summary && (
        <div className="grid gap-3 sm:grid-cols-3">
          {(['CUSTOMER', 'PARTNER', 'RIDE'] as const).map((r) => {
            const s = summary.byRole[r]
            return (
              <button
                key={r}
                type="button"
                onClick={() => { setRole(r); setView('users'); setUserPage(1) }}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm shadow-sm transition hover:border-brand-300 dark:border-slate-800 dark:bg-slate-900"
              >
                <span className="font-medium text-slate-700 dark:text-slate-200">{roleLabel[r]}</span>
                <span className="ml-2 text-xs text-slate-400">{s?.users ?? 0} users</span>
                <div className="mt-1 flex gap-3 text-xs text-slate-500">
                  <span>{formatMoney(s?.balance ?? 0)}</span>
                  <span className="text-amber-600 dark:text-amber-400">{(s?.coins ?? 0).toLocaleString()} coins</span>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Main card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {/* View tabs */}
        <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 px-4 pt-3 dark:border-slate-800">
          {(['users', 'transactions'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`rounded-t-lg px-4 py-2 text-sm font-medium transition ${
                view === v
                  ? 'border-b-2 border-brand-600 text-brand-700 dark:text-brand-300'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {v === 'users' ? 'All users' : 'Transactions'}
            </button>
          ))}

          {/* Direction tabs — only on transactions view */}
          {view === 'transactions' && (['all', 'deposit', 'withdraw'] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => { setDirection(d); setPage(1) }}
              className={`rounded-t-lg px-4 py-2 text-sm font-medium capitalize transition ${
                direction === d
                  ? 'border-b-2 border-brand-600 text-brand-700 dark:text-brand-300'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {d === 'all' ? 'All' : d === 'deposit' ? 'Deposits' : 'Withdrawals'}
            </button>
          ))}
        </div>

        {/* Search + filters */}
        <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={view === 'users' ? 'Search name, phone, email…' : 'Search name, phone, transaction…'}
              className="pl-9"
            />
          </div>
          <Select value={role} onValueChange={(v) => { setRole(v as CreditRole); setPage(1); setUserPage(1) }}>
            <SelectTrigger className="sm:w-40"><SelectValue placeholder="All users" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All users</SelectItem>
              <SelectItem value="CUSTOMER">Customers</SelectItem>
              <SelectItem value="PARTNER">Partners</SelectItem>
              <SelectItem value="RIDE">Ride</SelectItem>
            </SelectContent>
          </Select>
          {view === 'transactions' && (
            <Select value={status || 'ALL'} onValueChange={(v) => { setStatus(v === 'ALL' ? '' : v); setPage(1) }}>
              <SelectTrigger className="sm:w-40"><SelectValue placeholder="All statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Active user filter chip */}
        {view === 'transactions' && selectedUser && (
          <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-2 dark:border-slate-800">
            <Badge variant="info">Filtered: {selectedUser.name}</Badge>
            <button
              type="button"
              onClick={clearUserFilter}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            >
              <X className="h-3 w-3" /> Clear
            </button>
          </div>
        )}

        {/* ── Users table ── */}
        {view === 'users' && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left dark:border-slate-800">
                    {['User', 'Balance', 'Coins', 'Transactions', 'Last activity', 'Actions'].map((h) => (
                      <th key={h} className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">Loading…</td></tr>
                  ) : error ? (
                    <tr><td colSpan={6} className="px-4 py-10 text-center text-red-500">{error}</td></tr>
                  ) : users.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">No users found.</td></tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800/60">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                              {(u.name || '?').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-slate-900 dark:text-slate-100">{u.name}</div>
                              <div className="text-xs text-slate-400">{u.phone ?? u.email ?? '—'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-semibold text-emerald-600 dark:text-emerald-400">{formatMoney(u.balance)}</td>
                        <td className="px-4 py-3 font-semibold text-amber-600 dark:text-amber-400">{u.coins.toLocaleString()}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{u.transactionCount}</td>
                        <td className="px-4 py-3 text-slate-500">{formatDate(u.lastActivityAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Badge variant={roleBadgeVariant[u.role ?? ''] ?? 'default'}>
                              {roleLabel[u.role ?? ''] ?? u.role ?? '—'}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => showUserHistory(u)}
                              title="View transactions"
                            >
                              <History className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <Pagination page={userPage} totalPages={userTotalPages} total={usersTotal} loading={loading} onPage={setUserPage} />
          </>
        )}

        {/* ── Transactions table ── */}
        {view === 'transactions' && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left dark:border-slate-800">
                    {['User', 'Transaction', 'Amount', 'Status', 'Date'].map((h) => (
                      <th key={h} className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400">Loading…</td></tr>
                  ) : error ? (
                    <tr><td colSpan={5} className="px-4 py-10 text-center text-red-500">{error}</td></tr>
                  ) : transactions.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400">No transactions found.</td></tr>
                  ) : (
                    transactions.map((t) => {
                      const coin = isCoinTxn(t)
                      const out = isOutflow(t)
                      return (
                        <tr key={t.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800/60">
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-900 dark:text-slate-100">{t.user?.name ?? 'Unknown'}</div>
                            <div className="text-xs text-slate-400">
                              {roleLabel[t.user?.role ?? ''] ?? t.user?.role ?? '—'}
                              {t.user?.phone ? ` · ${t.user.phone}` : ''}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-slate-700 dark:text-slate-200">{t.title}</div>
                            <div className="text-xs text-slate-400">{t.type}{t.description ? ` · ${t.description}` : ''}</div>
                          </td>
                          <td className={`px-4 py-3 font-semibold ${out ? 'text-red-500' : coin ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                            {out ? '−' : '+'}{coin ? `${Math.abs(t.amount).toLocaleString()} coins` : formatMoney(Math.abs(t.amount))}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={statusVariant[t.status] ?? 'default'}>{t.status}</Badge>
                          </td>
                          <td className="px-4 py-3 text-slate-500">{formatDate(t.createdAt)}</td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={txTotalPages} total={txTotal} loading={loading} onPage={setPage} />
          </>
        )}
      </div>
    </div>
  )
}
