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

function extractMessage(err: unknown, fallback: string): string {
  const msg = (err as { response?: { data?: { message?: unknown } } })?.response?.data?.message
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

    const backendData = response.data as {
      accessToken?: unknown
      refreshToken?: unknown
      token?: unknown
      expiresIn?: unknown
      requiresOtp?: unknown
      otpSessionId?: unknown
      user?: {
        id?: unknown
        fullName?: unknown
        email?: unknown
        phone?: unknown
        adminRole?: unknown
        role?: unknown
        allowedPages?: unknown
      }
    }

    // Transform backend response to frontend format.
    // Never default to SUPER_ADMIN — a missing/unknown role fails closed.
    const rawRole = backendData.user?.adminRole || backendData.user?.role
    const role: Role | null = rawRole && KNOWN_ROLES.has(rawRole as Role) ? (rawRole as Role) : null
    const accessToken =
      typeof backendData.accessToken === 'string' ? backendData.accessToken :
      typeof backendData.token === 'string' ? backendData.token : ''
    const userId = backendData.user?.id
    if (!role || typeof userId !== 'string' || !userId || !accessToken) {
      throw new Error('Your account does not have admin access.')
    }

    const user: UserProfile = {
      id: userId,
      name: typeof backendData.user?.fullName === 'string' ? backendData.user.fullName : '',
      email: typeof backendData.user?.email === 'string' ? backendData.user.email : '',
      phone: typeof backendData.user?.phone === 'string' ? backendData.user.phone : undefined,
      role,
      locale: 'en',
      allowedPages: Array.isArray(backendData.user?.allowedPages)
        ? backendData.user.allowedPages.filter((page): page is string => typeof page === 'string')
        : [],
    }

    const requiresOtp = backendData.requiresOtp === true
    const otpSessionId =
      typeof backendData.otpSessionId === 'string' ? backendData.otpSessionId : undefined
    if (requiresOtp && !otpSessionId) {
      throw new Error('The server did not create an OTP session. Please try signing in again.')
    }

    const session: AuthSession = {
      user,
      accessToken,
      refreshToken: typeof backendData.refreshToken === 'string' ? backendData.refreshToken : '',
      expiresAt: new Date(
        Date.now() +
          (typeof backendData.expiresIn === 'number' ? backendData.expiresIn : 900) * 1000,
      ).toISOString(),
      requiresOtp,
      otpSessionId,
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

export async function requestPasswordReset(phone: string) {
  try {
    const response = await api.post('/auth/forgot-password', { phone })
    return response.data
  } catch (err: any) {
    throw new Error(extractMessage(err, 'Could not send reset email. Please try again.'))
  }
}

export async function verifyPasswordReset(phone: string, code: string) {
  try {
    const response = await api.post('/auth/forgot-password/verify', { phone, code })
    return response.data
  } catch (err: unknown) {
    throw new Error(extractMessage(err, 'Invalid or expired code. Please try again.'))
  }
}

export async function resetPassword(phone: string, code: string, newPassword: string) {
  try {
    const response = await api.post('/auth/forgot-password/reset', {
      phone,
      code,
      newPassword,
    })
    return response.data
  } catch (err: unknown) {
    throw new Error(extractMessage(err, 'Could not reset the password. Please try again.'))
  }
}

export async function refreshAccessToken() {
  try {
    // The HttpOnly cookie supplies the refresh token automatically.
    const response = await api.post('/auth/refresh', {})
    return response.data
  } catch (err: unknown) {
    throw new Error(extractMessage(err, 'Failed to refresh token'))
  }
}
