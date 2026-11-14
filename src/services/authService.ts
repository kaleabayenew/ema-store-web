import api from '@/lib/api'
import type { AuthSession, LoginPayload, Role, UserProfile } from '@/types/auth'

export const KNOWN_ROLES = new Set<Role>([
  'SUPER_ADMIN',
  'ADMIN',
  'MANAGEMENT',
  'CUSTOMER_SUPPORT',
  'PARTNER_MANAGER',
  'PRODUCT_MANAGER',
  'FINANCE',
  'MARKETING',
])

function extractMessage(err: any, fallback: string): string {
  const msg = err?.response?.data?.message
  return typeof msg === 'string' && msg.length > 0 ? msg : fallback
}

// Admin login - uses real backend API
export async function loginWithUsername(payload: LoginPayload): Promise<AuthSession> {
  try {
    const response = await api.post('/auth/login', {
      email: payload.username,
      password: payload.password,
    }, {
      // Render cold starts can exceed the default 15s timeout — give login more room
      timeout: 60000,
    })

    const backendData = response.data

    // Transform backend response to frontend format.
    // Never default to SUPER_ADMIN — a missing/unknown role fails closed.
    const rawRole: string | undefined =
      backendData.user?.adminRole || backendData.user?.role
    const role: Role | null = rawRole && KNOWN_ROLES.has(rawRole as Role) ? (rawRole as Role) : null
    if (!role) {
      throw new Error('Your account does not have admin access.')
    }

    const user: UserProfile = {
      id: backendData.user.id,
      name: backendData.user.fullName,
      email: backendData.user.email,
      role,
      locale: 'en',
      allowedPages: backendData.user.allowedPages || [],
    }

    const session: AuthSession = {
      user,
      accessToken: backendData.token,
      refreshToken: backendData.token, // Backend may not return refresh token
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 8).toISOString(),
      requiresOtp: false, // Admin login may not require OTP
    }

    return session
  } catch (err: any) {
    throw new Error(extractMessage(err, 'Login failed. Please check your credentials.'))
  }
}

export async function verifyOtp({ otp, otpSessionId }: { otp: string; otpSessionId: string }) {
  if (otp.length !== 6) {
    throw new Error('OTP must be 6 digits')
  }
  try {
    const response = await api.post('/auth/verify-otp', { otp, otpSessionId })
    return response.data
  } catch (err: any) {
    // Fail closed — never pretend an OTP was accepted.
    throw new Error(extractMessage(err, 'Invalid or expired code. Please try again.'))
  }
}

export async function requestPasswordReset(email: string) {
  try {
    const response = await api.post('/auth/forgot-password', { email })
    return response.data
  } catch (err: any) {
    throw new Error(extractMessage(err, 'Could not send reset email. Please try again.'))
  }
}

export async function refreshAccessToken() {
  try {
    // The HttpOnly cookie supplies the refresh token automatically.
    const response = await api.post('/auth/refresh', {})
    return response.data
  } catch {
    throw new Error('Failed to refresh token')
  }
}
