import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { verifyOtp } from '@/services/authService'
import { useAuthStore } from '@/store/authStore'

export function OtpPage() {
  const navigate = useNavigate()
  const { pendingOtp, setSession, clearPendingOtp } = useAuthStore()
  const [otp, setOtp] = useState('123456')
  const [error, setError] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)

  if (!pendingOtp) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4 dark:bg-slate-950">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
          No OTP session found. Please sign in again.
        </div>
      </div>
    )
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setIsVerifying(true)
    setError('')

    try {
      const response = await verifyOtp({ otp, otpSessionId: pendingOtp.otpSessionId })

      if (!response.ok) {
        throw new Error('OTP verification failed')
      }

      const user = useAuthStore.getState().user
      if (!user) {
        throw new Error('User session not found')
      }

      setSession({
        user,
        accessToken: 'mock-access-token-verified',
        refreshToken: 'mock-refresh-token-verified',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 8).toISOString(),
      })
      clearPendingOtp()
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid OTP. Please try again.')
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10 dark:bg-slate-950">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Two-factor authentication</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Enter the 6-digit code sent to {pendingOtp.email}</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="otp" className="text-sm font-medium text-slate-700 dark:text-slate-200">
              One-time password
            </label>
            <input
              id="otp"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-center text-lg font-semibold tracking-[0.3em] text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>

          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">{error}</div>}

          <Button type="submit" className="w-full" disabled={isVerifying}>
            {isVerifying ? 'Verifying...' : 'Verify code'}
          </Button>
        </form>
      </div>
    </div>
  )
}
