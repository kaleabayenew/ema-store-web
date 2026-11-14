import { useEffect, useState } from 'react'
import { WifiOff, X } from 'lucide-react'
import api from '@/lib/api'

/**
 * Listens to axios response errors and surfaces a sticky banner
 * when the backend is unreachable (network timeout or 5xx).
 * Dismissible and auto-hides when a successful request comes in.
 */
export function ConnectionBanner() {
  const [visible, setVisible] = useState(false)
  const [message, setMessage] = useState('Server is unreachable. Some features may not work.')

  useEffect(() => {
    const reqId = api.interceptors.response.use(
      (response) => {
        // A successful response — backend is back online
        setVisible(false)
        return response
      },
      (error) => {
        const status = error?.response?.status

        // Network error (no response at all) or server-side error
        if (!error.response || (status && status >= 500)) {
          const msg =
            !error.response
              ? 'Cannot reach the server. Check your internet connection.'
              : `Server error (${status}). Please try again shortly.`
          setMessage(msg)
          setVisible(true)
        }

        return Promise.reject(error)
      },
    )

    return () => {
      api.interceptors.response.eject(reqId)
    }
  }, [])

  if (!visible) return null

  return (
    <div className="fixed left-1/2 top-20 z-[100] w-full max-w-md -translate-x-1/2 px-4">
      <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-lg dark:border-amber-900 dark:bg-amber-950/80">
        <WifiOff className="h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
        <p className="flex-1 text-sm font-medium text-amber-800 dark:text-amber-300">{message}</p>
        <button
          onClick={() => setVisible(false)}
          className="flex-shrink-0 text-amber-500 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-200"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
