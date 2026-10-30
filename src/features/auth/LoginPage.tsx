import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { loginWithUsername } from '@/services/authService'
import { useAuthStore } from '@/store/authStore'
import type { Role } from '@/types/auth'

const roleOptions: { value: Role; label: string }[] = [
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
  { value: 'MANAGEMENT', label: 'Management' },
  { value: 'CUSTOMER_SUPPORT', label: 'Customer Support' },
  { value: 'PARTNER_MANAGER', label: 'Partner Manager' },
  { value: 'PRODUCT_MANAGER', label: 'Product Manager' },
  { value: 'FINANCE', label: 'Finance' },
  { value: 'MARKETING', label: 'Marketing' },
]

export function LoginPage() {
  const navigate = useNavigate()
  const { setSession, setPendingOtp } = useAuthStore()
  const [email, setEmail] = useState('admin@emastore.et')
  const [password, setPassword] = useState('Password123!')
  const [role, setRole] = useState<Role>('SUPER_ADMIN')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const session = await loginWithUsername({ username: email, password, role })

      setSession(session)

      if (session.requiresOtp) {
        setPendingOtp({ email: session.user.email, otpSessionId: session.otpSessionId ?? 'mock-otp-session' })
        navigate('/otp')
        return
      }

      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10 dark:bg-slate-950">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-xl font-bold text-white shadow-lg shadow-brand-600/20">
            E
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Welcome back</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Sign in to the Ema Store admin portal</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              placeholder="admin@emastore.et"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              placeholder="••••••••"
            />
          </div>

          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">{error}</div>}

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <input type="checkbox" className="rounded border-slate-300" />
              Remember me
            </label>
            <Link to="/forgot-password" className="font-medium text-brand-600 hover:text-brand-700">
              Forgot password?
            </Link>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-3 text-center text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
          Use your admin email to sign in. Contact your administrator if you need an account.
        </div>
      </div>
    </div>
  )
}
