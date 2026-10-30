import { useEffect } from 'react'

import { useAuthStore } from '@/store/authStore'

const AUTO_LOGOUT_MS = 15 * 60 * 1000

export function useAutoLogout() {
  const { isAuthenticated, markSessionExpired } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated) return

    let timeoutId: number | undefined

    const resetTimer = () => {
      if (timeoutId) window.clearTimeout(timeoutId)
      timeoutId = window.setTimeout(() => {
        useAuthStore.getState().logout()
        markSessionExpired()
      }, AUTO_LOGOUT_MS)
    }

    const events = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart']
    events.forEach((event) => window.addEventListener(event, resetTimer, { passive: true }))
    resetTimer()

    return () => {
      events.forEach((event) => window.removeEventListener(event, resetTimer))
      if (timeoutId) window.clearTimeout(timeoutId)
    }
  }, [isAuthenticated, markSessionExpired])
}
