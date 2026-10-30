import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { AuthSession, UserProfile } from '@/types/auth'

interface AuthStore {
  user: UserProfile | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  sessionExpired: boolean
  pendingOtp: { email: string; otpSessionId: string } | null
  setSession: (session: AuthSession) => void
  setPendingOtp: (payload: { email: string; otpSessionId: string }) => void
  clearPendingOtp: () => void
  logout: () => void
  markSessionExpired: () => void
  clearSessionExpired: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      sessionExpired: false,
      pendingOtp: null,
      setSession: (session) =>
        set({
          user: session.user,
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
          isAuthenticated: true,
          sessionExpired: false,
          pendingOtp: session.requiresOtp ? { email: session.user.email, otpSessionId: session.otpSessionId ?? 'mock-otp-session' } : null,
        }),
      setPendingOtp: (payload) => set({ pendingOtp: payload }),
      clearPendingOtp: () => set({ pendingOtp: null }),
      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          pendingOtp: null,
          sessionExpired: false,
        }),
      markSessionExpired: () => set({ sessionExpired: true, isAuthenticated: false, accessToken: null, refreshToken: null }),
      clearSessionExpired: () => set({ sessionExpired: false }),
    }),
    {
      name: 'ema-store-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)
