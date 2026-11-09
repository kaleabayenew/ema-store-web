import axios from 'axios'

import { useAuthStore } from '@/store/authStore'

const baseURL = import.meta.env.VITE_API_URL ?? 'https://ema-store-backend.onrender.com/api/v1'

export const api = axios.create({
  baseURL,
  timeout: 30000,
})

api.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState()

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
    console.log('[API Request]', config.method?.toUpperCase(), config.url, 'Token:', accessToken.substring(0, 20) + '...')
  } else {
    console.log('[API Request]', config.method?.toUpperCase(), config.url, 'No token')
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401) {
      // Backend doesn't support refresh tokens - just logout immediately
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }

    return Promise.reject(error)
  },
)

export default api
