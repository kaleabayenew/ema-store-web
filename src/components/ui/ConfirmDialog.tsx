import {
  createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode,
} from 'react'
import { AlertTriangle, CheckCircle2, Info, X, Loader2, MessageSquare } from 'lucide-react'

import { Button } from '@/components/ui/button'

// ── Types ────────────────────────────────────────────────────────────────────

type ConfirmVariant = 'danger' | 'default'

interface ConfirmOptions {
  title?: string
  message: ReactNode
  confirmText?: string
  cancelText?: string
  variant?: ConfirmVariant
}

type AlertVariant = 'error' | 'success' | 'info'

interface AlertOptions {
  title?: string
  message: ReactNode
  variant?: AlertVariant
  duration?: number
}

interface ToastItem {
  id: number
  title?: string
  message: ReactNode
  variant: AlertVariant
}

interface PromptOptions {
  title?: string
  message?: ReactNode
  defaultValue?: string
  placeholder?: string
  confirmText?: string
  cancelText?: string
  multiline?: boolean
  maxLength?: number
  required?: boolean
}

interface ConfirmCtx {
  confirm: (opts: ConfirmOptions) => Promise<boolean>
  alert: (opts: AlertOptions) => void
  prompt: (opts: PromptOptions) => Promise<string | null>
}

// ── Context ──────────────────────────────────────────────────────────────────

const Ctx = createContext<ConfirmCtx | null>(null)

export function useConfirm(): (opts: ConfirmOptions) => Promise<boolean> {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useConfirm must be used within <ConfirmProvider>')
  return ctx.confirm
}

export function useAlert(): (opts: AlertOptions) => void {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAlert must be used within <ConfirmProvider>')
  return ctx.alert
}

export function usePrompt(): (opts: PromptOptions) => Promise<string | null> {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('usePrompt must be used within <ConfirmProvider>')
  return ctx.prompt
}

// ── Provider ─────────────────────────────────────────────────────────────────

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<{
    opts: ConfirmOptions
    resolve: (v: boolean) => void
  } | null>(null)
  const [pending, setPending] = useState(false)

  const [promptState, setPromptState] = useState<{
    opts: PromptOptions
    resolve: (v: string | null) => void
  } | null>(null)
  const [promptValue, setPromptValue] = useState('')
  const [promptPending, setPromptPending] = useState(false)
  const promptInputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null)

  const [toasts, setToasts] = useState<ToastItem[]>([])
  const toastIdRef = useRef(0)

  const confirm = useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => setDialog({ opts, resolve }))
  }, [])

  const prompt = useCallback((opts: PromptOptions) => {
    return new Promise<string | null>((resolve) => {
      setPromptValue(opts.defaultValue ?? '')
      setPromptState({ opts, resolve })
      // focus input after render
      setTimeout(() => promptInputRef.current?.focus(), 50)
    })
  }, [])

  const alert = useCallback((opts: AlertOptions) => {
    const id = ++toastIdRef.current
    setToasts((prev) => [...prev, {
      id,
      title: opts.title,
      message: opts.message,
      variant: opts.variant ?? 'info',
    }])
    const duration = opts.duration ?? 4500
    if (duration > 0) {
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration)
    }
  }, [])

  const dismissToast = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id))

  const closeConfirm = (result: boolean) => {
    if (!dialog) return
    dialog.resolve(result)
    setDialog(null)
    setPending(false)
  }

  const closePrompt = (result: string | null) => {
    if (!promptState) return
    promptState.resolve(result)
    setPromptState(null)
    setPromptPending(false)
  }

  const submitPrompt = () => {
    if (!promptState) return
    const val = promptValue.trim()
    if (promptState.opts.required && !val) return
    setPromptPending(true)
    setTimeout(() => closePrompt(val), 50)
  }

  // Keyboard shortcuts
  useEffect(() => {
    if (!dialog && !promptState) return
    const onKey = (e: KeyboardEvent) => {
      if (promptState) {
        if (e.key === 'Escape') { e.preventDefault(); closePrompt(null) }
        if (e.key === 'Enter' && !promptState.opts.multiline && !promptPending) {
          e.preventDefault()
          submitPrompt()
        }
        return
      }
      if (dialog) {
        if (e.key === 'Escape') closeConfirm(false)
        if (e.key === 'Enter' && !pending) { setPending(true); setTimeout(() => closeConfirm(true), 50) }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialog, promptState, pending, promptPending, promptValue])

  const isDanger = dialog?.opts.variant === 'danger'
  const promptIsRequired = promptState?.opts.required ?? false
  const promptCanSubmit = !promptIsRequired || promptValue.trim().length > 0

  return (
    <Ctx.Provider value={{ confirm, alert, prompt }}>
      {children}

      {/* ── Confirm dialog ── */}
      {dialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={() => closeConfirm(false)}>
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${isDanger ? 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400' : 'bg-brand-100 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400'}`}>
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{dialog.opts.title ?? 'Are you sure?'}</h3>
                <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{dialog.opts.message}</div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => closeConfirm(false)} disabled={pending}>{dialog.opts.cancelText ?? 'Cancel'}</Button>
              <Button onClick={() => { setPending(true); setTimeout(() => closeConfirm(true), 50) }} disabled={pending} className={isDanger ? 'bg-red-600 hover:bg-red-700 text-white' : ''}>
                {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {dialog.opts.confirmText ?? (isDanger ? 'Delete' : 'Confirm')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Prompt dialog (input) ── */}
      {promptState && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={() => closePrompt(null)}>
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{promptState.opts.title ?? 'Enter value'}</h3>
                {promptState.opts.message && <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{promptState.opts.message}</div>}
              </div>
            </div>

            <div className="mt-4">
              {promptState.opts.multiline ? (
                <textarea
                  ref={promptInputRef as React.RefObject<HTMLTextAreaElement>}
                  value={promptValue}
                  onChange={(e) => setPromptValue(e.target.value)}
                  placeholder={promptState.opts.placeholder}
                  maxLength={promptState.opts.maxLength}
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              ) : (
                <input
                  ref={promptInputRef as React.RefObject<HTMLInputElement>}
                  type="text"
                  value={promptValue}
                  onChange={(e) => setPromptValue(e.target.value)}
                  placeholder={promptState.opts.placeholder}
                  maxLength={promptState.opts.maxLength}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              )}
              {promptState.opts.maxLength && (
                <p className={`mt-1 text-right text-xs ${promptValue.length >= promptState.opts.maxLength ? 'text-red-500' : 'text-slate-400'}`}>
                  {promptValue.length}/{promptState.opts.maxLength}
                </p>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => closePrompt(null)} disabled={promptPending}>{promptState.opts.cancelText ?? 'Cancel'}</Button>
              <Button onClick={submitPrompt} disabled={!promptCanSubmit || promptPending}>
                {promptPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {promptState.opts.confirmText ?? 'OK'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toasts ── */}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[101] flex w-full max-w-sm flex-col gap-2">
        {toasts.map((t) => {
          const Icon = t.variant === 'error' ? AlertTriangle : t.variant === 'success' ? CheckCircle2 : Info
          const color = t.variant === 'error' ? 'text-red-600 dark:text-red-400' : t.variant === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-brand-600 dark:text-brand-400'
          return (
            <div key={t.id} className="pointer-events-auto flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-lg dark:border-slate-800 dark:bg-slate-900" role="alert">
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${color}`} />
              <div className="flex-1 min-w-0">
                {t.title && <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t.title}</p>}
                <div className="text-sm text-slate-600 dark:text-slate-300">{t.message}</div>
              </div>
              <button onClick={() => dismissToast(t.id)} className="shrink-0 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800" aria-label="Dismiss">
                <X className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>
    </Ctx.Provider>
  )
}
