import api from '@/lib/api'
import { KNOWN_ROLES } from '@/services/authService'
import { useAuthStore } from '@/store/authStore'
import type { AuthSession, Role, UserProfile } from '@/types/auth'

function mapUser(raw: any): UserProfile | null {
  const rawRole: string | undefined = raw?.adminRole || raw?.role
  const role: Role | null = rawRole && KNOWN_ROLES.has(rawRole as Role) ? (rawRole as Role) : null
  if (!role || !raw?.id) return null
  return {
    id: String(raw.id),
    name: raw.fullName || raw.email || '',
    email: raw.email ?? '',
    role,
    locale: 'en',
    allowedPages: raw.allowedPages || [],
  }
}

/**
 * Startup session restore. The access/refresh tokens are memory-only, so on
 * every reload we rotate the session via the HttpOnly cookie
 * (POST /auth/refresh sends it automatically) and then validate against
 * /auth/me — which also re-checks blocked/deactivated accounts server-side.
 */
export async function bootstrapSession(): Promise<void> {
  // Purge tokens persisted by the old localStorage-based auth store.
  try { localStorage.removeItem('ema-store-auth') } catch { /* private mode */ }
  try {
    const refresh = await api.post('/auth/refresh', {}, { timeout: 60000 })
    const { accessToken, refreshToken } = refresh.data ?? {}
    if (!accessToken) throw new Error('No access token')

    const me = await api.get('/auth/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const user = mapUser(me.data?.user)
    if (!user) throw new Error('Not an admin account')

    const session: AuthSession = {
      user,
      accessToken,
      refreshToken: refreshToken ?? '',
      expiresAt: new Date(Date.now() + 1000 * 60 * 15).toISOString(),
      requiresOtp: false,
    }
    useAuthStore.getState().setSession(session)
  } catch {
    // No cookie, expired/revoked refresh token, blocked account, or not staff —
    // stay logged out. The user simply sees the login page.
    useAuthStore.getState().logout()
  } finally {
    useAuthStore.getState().markSessionChecked()
  }
}
