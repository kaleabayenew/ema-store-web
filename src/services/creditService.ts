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
  userId?: string
  role?: CreditRole
  direction?: CreditDirection
  currency?: CreditCurrency
  status?: string
  page?: number
  limit?: number
}

export interface CreditUser {
  id: string
  role: string | null
  adminRole?: string | null
  allowedPages?: string[]
  phone: string | null
  email: string | null
  name: string
  balance: number
  coins: number
  status?: string
  transactionCount: number
  lastActivityAt: string | null
  createdAt: string
}

export interface CreditUsersResponse {
  success: boolean
  users: CreditUser[]
  total: number
  page: number
  limit: number
}

export async function getCreditTransactions(query: CreditQuery): Promise<CreditTransactionsResponse> {
  const { data } = await api.get<CreditTransactionsResponse>('/admin/credits/transactions', {
    params: {
      q: query.q || undefined,
      userId: query.userId || undefined,
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

export async function getCreditUsers(query: {
  q?: string
  role?: CreditRole
  scope?: 'staff'
  page?: number
  limit?: number
}): Promise<CreditUsersResponse> {
  const { data } = await api.get<CreditUsersResponse>('/admin/credits/users', {
    params: {
      q: query.q || undefined,
      role: query.role && query.role !== 'ALL' ? query.role : undefined,
      scope: query.scope || undefined,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    },
  })
  return data
}

export interface AdjustBalancePayload {
  userId: string
  direction: 'deposit' | 'withdraw'
  amount: number
  note?: string
}

export interface AdjustBalanceResponse {
  success: boolean
  userId: string
  direction: 'deposit' | 'withdraw'
  amount: number
  newBalance: number
  transaction: {
    id: string
    amount: number
    type: string
    status: string
    createdAt: string
  }
}

export async function adjustCreditBalance(payload: AdjustBalancePayload): Promise<AdjustBalanceResponse> {
  const { data } = await api.post<AdjustBalanceResponse>('/admin/credits/adjust', payload)
  return data
}

export interface StaffUser {
  id: string
  fullName: string | null
  email: string
  phone: string
  role: string
  status: string
  allowedPages: string[]
  lastLogin: string | null
}

export interface StaffUsersResponse {
  success: boolean
  users: StaffUser[]
  total: number
  page: number
  totalPages: number
}

export async function getStaffUsers(): Promise<StaffUsersResponse> {
  const { data } = await api.get<StaffUsersResponse>('/admin/users', {
    params: { limit: 100 },
  })
  return data
}

export async function getCreditSummary(): Promise<CreditSummaryResponse> {
  const { data } = await api.get<CreditSummaryResponse>('/admin/credits/summary')
  return data
}

export interface CoinRate {
  coinsPerUnit: number
  conversionEnabled?: boolean
  updatedAt: string | null
}

export async function getCoinRate(): Promise<CoinRate> {
  const { data } = await api.get<CoinRate>('/admin/credits/coin-rate')
  return data
}

export async function updateCoinRate(coinsPerUnit: number): Promise<CoinRate> {
  const { data } = await api.put<CoinRate>('/admin/credits/coin-rate', { coinsPerUnit })
  return data
}

export async function updateCoinSettings(payload: {
  coinsPerUnit?: number
  conversionEnabled?: boolean
}): Promise<CoinRate> {
  const { data } = await api.put<CoinRate>('/admin/credits/coin-settings', payload)
  return data
}
