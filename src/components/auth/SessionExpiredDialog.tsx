import { AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/authStore'

export function SessionExpiredDialog() {
  const navigate = useNavigate()
  const { sessionExpired, clearSessionExpired } = useAuthStore()

  if (!sessionExpired) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-amber-200 bg-white p-6 shadow-2xl dark:border-amber-900 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-300">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Session expired</h2>
            <p className="text-sm text-slate-500 dark:text-slate-300">Your session timed out due to inactivity.</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => {
              clearSessionExpired()
              navigate('/login')
            }}
          >
            Return to login
          </Button>
        </div>
      </div>
    </div>
  )
}
