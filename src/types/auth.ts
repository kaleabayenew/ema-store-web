export type Role =
  | 'SUPER_ADMIN'
  | 'MANAGEMENT'
  | 'CUSTOMER_SUPPORT'
  | 'PARTNER_MANAGER'
  | 'PRODUCT_MANAGER'
  | 'FINANCE'
  | 'MARKETING'

export interface UserProfile {
  id: string
  name: string
  email: string
  phone?: string
  role: Role
  avatar?: string
  locale: 'en' | 'am'
}

export interface LoginPayload {
  username: string
  password: string
  role: Role
}

export interface AuthSession {
  user: UserProfile
  accessToken: string
  refreshToken: string
  expiresAt: string
  requiresOtp?: boolean
  otpSessionId?: string
}
