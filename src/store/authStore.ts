import { create } from 'zustand'

import type { AuthSession, UserProfile } from '@/types/auth'

interface AuthStore {
  user: UserProfile | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  /** True once the startup /auth/refresh + /auth/me check has completed. */
  sessionChecked: boolean
  sessionExpired: boolean
  pendingOtp: { email: string; otpSessionId: string } | null
  setSession: (session: AuthSession) => void
  setPendingOtp: (payload: { email: string; otpSessionId: string }) => void
  clearPendingOtp: () => void
  markSessionChecked: () => void
  logout: () => void
  markSessionExpired: () => void
  clearSessionExpired: () => void
}

// Tokens live in memory only — never localStorage/sessionStorage, so XSS
// cannot steal them and they don't survive a browser restart. The durable
// session is the HttpOnly refresh-token cookie; on reload the app calls
// /auth/refresh (cookie-authenticated) then /auth/me to rebuild this state.
export const useAuthStore = create<AuthStore>()((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  sessionChecked: false,
  sessionExpired: false,
  pendingOtp: null,
  setSession: (session) =>
    set({
      user: session.user,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      isAuthenticated: true,
      sessionChecked: true,
      sessionExpired: false,
      pendingOtp: session.requiresOtp ? { email: session.user.email, otpSessionId: session.otpSessionId ?? 'mock-otp-session' } : null,
    }),
  setPendingOtp: (payload) => set({ pendingOtp: payload }),
  clearPendingOtp: () => set({ pendingOtp: null }),
  markSessionChecked: () => set({ sessionChecked: true }),
  logout: () => {
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      pendingOtp: null,
      sessionExpired: false,
    })
    // Revoke the server-side session cookie — best effort, dynamic import
    // avoids a module cycle with lib/api.
    import('@/lib/api')
      .then((m) => m.api.post('/auth/logout', {}).catch(() => {}))
      .catch(() => {})
  },
  markSessionExpired: () => set({ sessionExpired: true, isAuthenticated: false, accessToken: null, refreshToken: null }),
  clearSessionExpired: () => set({ sessionExpired: false }),
}))
