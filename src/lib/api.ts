import axios from 'axios'

import { decryptPayload, encryptPayload, payloadCryptoEnabled } from '@/lib/apiCrypto'
import { ADMIN_BASE } from '@/lib/basePath'
import { sanitizeErrorMessage } from '@/lib/errors'
import { useAuthStore } from '@/store/authStore'

const rawApiUrl =
  import.meta.env.VITE_API_URL ?? 'https://ema-store-backend.onrender.com/api/v1'

// Optional secret path prefix — hides the real /api/v1 endpoints. The backend
// strips /<prefix> before routing when API_PATH_PREFIX matches.
const apiPrefix = (
  (import.meta.env.VITE_API_PREFIX as string | undefined) ?? ''
).replace(/^\/+|\/+$/g, '')
const baseURL = apiPrefix
  ? rawApiUrl.replace(/\/api\/v1\/?$/, `/${apiPrefix}/api/v1`)
  : rawApiUrl

export const api = axios.create({
  baseURL,
  timeout: 30000,
  // Send the HttpOnly session cookie (ema_rt) cross-origin.
  withCredentials: true,
})

api.interceptors.request.use(async (config) => {
  const { accessToken } = useAuthStore.getState()

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }

  // Opt every request into payload encryption when configured. The header is
  // sent even on GETs so the backend encrypts the response too. Bodies are
  // encrypted except multipart uploads (files can't go through JSON crypto).
  if (payloadCryptoEnabled) {
    config.headers['x-payload-enc'] = '1'
    const isMultipart =
      config.data instanceof FormData ||
      config.headers['Content-Type'] === 'multipart/form-data'
    if (
      config.data !== undefined &&
      config.data !== null &&
      typeof config.data === 'object' &&
      !isMultipart
    ) {
      config.data = { __enc: await encryptPayload(config.data) }
      config.headers['Content-Type'] = 'application/json'
    }
  }

  return config
})

async function maybeDecrypt(data: unknown): Promise<unknown> {
  if (
    payloadCryptoEnabled &&
    data !== null &&
    typeof data === 'object' &&
    typeof (data as { __enc?: unknown }).__enc === 'string'
  ) {
    try {
      return await decryptPayload((data as { __enc: string }).__enc)
    } catch {
      return data
    }
  }
  return data
}

api.interceptors.response.use(
  async (response) => {
    response.data = await maybeDecrypt(response.data)
    return response
  },
  async (error) => {
    if (error.response?.data) {
      error.response.data = await maybeDecrypt(error.response.data)
      // Strip backend URLs / internals from the message before any UI or
      // console code can display it.
      const d = error.response.data as { message?: unknown }
      if (d && typeof d === 'object' && 'message' in d) {
        d.message = sanitizeErrorMessage(d.message, 'Request failed.')
      }
    }
    const originalRequest = error.config

    if (error.response?.status === 401) {
      const url = originalRequest?.url ?? ''
      const isLoginRequest = url.includes('/auth/login')
      // Session bootstrap endpoints handle 401 themselves — redirecting here
      // would cause a reload loop.
      const isSessionEndpoint = url.includes('/auth/refresh') || url.includes('/auth/me') || url.includes('/auth/logout')
      const loginPath = `${ADMIN_BASE === '/' ? '' : ADMIN_BASE}/login`
      const isAlreadyOnLogin = window.location.pathname === loginPath

      if (!isLoginRequest && !isSessionEndpoint && !isAlreadyOnLogin) {
        useAuthStore.getState().logout()
        // In-app redirect instead of a full reload so SPA state survives.
        window.location.assign(loginPath)
      }
    }

    return Promise.reject(error)
  },
)

export default api
