import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { passwordPolicy, passwordsMatch, required, validate } from '@/lib/validate'
import {
  requestPasswordReset,
  resetPassword,
  verifyPasswordReset,
} from '@/services/authService'

function normalizePhone(value: string): string | null {
  let digits = value.replace(/\D/g, '')
  if (digits.startsWith('0') && digits.length === 10) digits = `251${digits.slice(1)}`
  else if (digits.length === 9 && /^[79]/.test(digits)) digits = `251${digits}`
  if (!digits.startsWith('251') || digits.length !== 12) return null
  return `+${digits}`
}

export function ForgotPasswordPage() {
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [step, setStep] = useState<'request' | 'reset' | 'complete'>('request')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setMessage('')

    const canonicalPhone = normalizePhone(phone)
    if (!canonicalPhone) {
      setError('Enter a valid Ethiopian phone number.')
      return
    }

    if (step === 'request') {
      setIsSubmitting(true)
      try {
        const result = await requestPasswordReset(canonicalPhone) as { message?: string }
        setPhone(canonicalPhone)
        setStep('reset')
        setMessage(result.message || 'If this number is registered, a reset code has been sent.')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not request a reset code.')
      } finally {
        setIsSubmitting(false)
      }
      return
    }

    const validationError = validate(
      required(code, 'Verification code'),
      code.length === 6 ? null : 'Enter the 6-digit verification code.',
      passwordPolicy(newPassword, 'New password'),
      passwordsMatch(newPassword, confirmPassword),
    )
    if (validationError) {
      setError(validationError)
      return
    }

    setIsSubmitting(true)
    try {
      await verifyPasswordReset(canonicalPhone, code)
      const result = await resetPassword(canonicalPhone, code, newPassword) as { message?: string }
      setStep('complete')
      setMessage(result.message || 'Password reset successfully. You can now sign in.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset the password.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10 dark:bg-slate-950">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6 text-center">
          <img src="/image/logo_full.svg" alt="Ema Store" className="mx-auto mb-4 h-12 w-auto" />
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Reset password</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {step === 'request'
              ? 'We’ll send a verification code to your phone.'
              : step === 'reset'
                ? 'Enter the code and choose a new password.'
                : 'Your password has been updated.'}
          </p>
        </div>

        {step !== 'complete' && (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="reset-phone" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Phone number
              </label>
              <input
                id="reset-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                disabled={step === 'reset'}
                placeholder="+251 911 234 567"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            {step === 'reset' && (
              <>
                <div className="space-y-2">
                  <label htmlFor="reset-code" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Verification code
                  </label>
                  <input
                    id="reset-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={code}
                    onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-center tracking-[0.3em] text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="new-password" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    New password
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="confirm-password" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Confirm new password
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>
              </>
            )}

            {message && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">{message}</div>}
            {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">{error}</div>}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting
                ? 'Please wait...'
                : step === 'request'
                  ? 'Send verification code'
                  : 'Reset password'}
            </Button>
          </form>
        )}

        {step === 'complete' && (
          <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
            {message}
          </div>
        )}

        <div className="mt-6 text-center text-sm text-slate-600 dark:text-slate-300">
          <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}
