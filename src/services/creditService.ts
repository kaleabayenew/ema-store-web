import api from '@/lib/api'

export type CreditRole = 'ALL' | 'CUSTOMER' | 'PARTNER' | 'RIDE'
export type CreditDirection = 'all' | 'deposit' | 'withdraw'
export type CreditCurrency = 'all' | 'balance' | 'coins'

export interface CreditTransactionUser {
  id: string
  role: string | null
  phone: string | null
  email: string | null
  name: string
  balance: number
  coins: number
}

export interface CreditTransaction {
  id: string
  title: string
  description: string | null
  amount: number
  type: string
  status: string
  metadata: Record<string, unknown> | null
  createdAt: string
  user: CreditTransactionUser | null
}

export interface CreditTransactionsResponse {
  success: boolean
  transactions: CreditTransaction[]
  total: number
  page: number
  limit: number
}

export interface CreditRoleSummary {
  users: number
  balance: number
  coins: number
}

export interface CreditSummaryResponse {
  success: boolean
  totalBalance: number
  totalCoins: number
  byRole: Record<string, CreditRoleSummary>
}

export interface CreditQuery {
  q?: string
  role?: CreditRole
  direction?: CreditDirection
  currency?: CreditCurrency
  status?: string
  page?: number
  limit?: number
}

export async function getCreditTransactions(query: CreditQuery): Promise<CreditTransactionsResponse> {
  const { data } = await api.get<CreditTransactionsResponse>('/admin/credits/transactions', {
    params: {
      q: query.q || undefined,
      role: query.role && query.role !== 'ALL' ? query.role : undefined,
      direction: query.direction && query.direction !== 'all' ? query.direction : undefined,
      currency: query.currency && query.currency !== 'all' ? query.currency : undefined,
      status: query.status || undefined,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    },
  })
  return data
}

export async function getCreditSummary(): Promise<CreditSummaryResponse> {
  const { data } = await api.get<CreditSummaryResponse>('/admin/credits/summary')
  return data
}
