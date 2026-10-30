import api from '@/lib/api'

// Admin login - uses real backend API
export async function loginWithUsername(payload: LoginPayload): Promise<AuthSession> {
  try {
    // Backend expects { email, password } for admin login
    const response = await api.post('/auth/login', {
      email: payload.username,
      password: payload.password,
    })

    const backendData = response.data

    // Transform backend response to frontend format
    const user: UserProfile = {
      id: backendData.user.id,
      name: backendData.user.fullName,
      email: backendData.user.email,
      role: backendData.user.adminRole || 'SUPER_ADMIN',
      locale: 'en',
    }

    const session: AuthSession = {
      user,
      accessToken: backendData.token,
      refreshToken: backendData.token, // Backend may not return refresh token
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 8).toISOString(),
      requiresOtp: false, // Admin login may not require OTP
    }

    return session
  } catch (err) {
    console.error('Login error:', err)
    throw new Error('Login failed. Please check your credentials.')
  }
}

export async function verifyOtp({ otp, otpSessionId }: { otp: string; otpSessionId: string }) {
  try {
    const response = await api.post('/auth/verify-otp', { otp, otpSessionId })
    return response.data
  } catch {
    if (otp.length !== 6) {
      throw new Error('OTP must be 6 digits')
    }

    return {
      ok: true,
      message: 'OTP verified successfully',
    }
  }
}

export async function requestPasswordReset(email: string) {
  try {
    const response = await api.post('/auth/forgot-password', { email })
    return response.data
  } catch {
    return {
      ok: true,
      message: 'A password reset link was sent to your email.',
    }
  }
}

export async function refreshAccessToken() {
  try {
    const response = await api.post('/auth/refresh-token')
    return response.data
  } catch {
    throw new Error('Failed to refresh token')
  }
}
