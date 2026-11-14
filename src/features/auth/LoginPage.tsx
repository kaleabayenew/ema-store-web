import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { isEmail, minLength, required, validate } from '@/lib/validate'
import { loginWithUsername } from '@/services/authService'
import { useAuthStore } from '@/store/authStore'

export function LoginPage() {
  const navigate = useNavigate()
  const { setSession, setPendingOtp } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')

    const err = validate(
      required(email, 'Email'),
      isEmail(email),
      required(password, 'Password'),
      minLength(password, 6, 'Password'),
    )
    if (err) { setError(err); return }

    setIsSubmitting(true)

    try {
      const session = await loginWithUsername({ username: email, password })

      // Only mark authenticated after any required OTP step succeeds.
      if (session.requiresOtp) {
        setPendingOtp({
          email: session.user.email,
          otpSessionId: session.otpSessionId ?? '',
        })
        navigate('/otp')
        return
      }

      setSession(session)
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
          <img
            src="/image/logo_full.svg"
            alt="Ema Store"
            className="mx-auto mb-4 h-14 w-auto"
          />
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Welcome back</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Sign in to the Ema Store admin portal</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit} autoComplete="off">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="off"
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              placeholder="admin@emastore.et"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 pr-11 text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">{error}</div>}

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
