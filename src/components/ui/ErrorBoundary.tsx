import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  /** Optional custom fallback — receives the error and a reset function */
  fallback?: (error: Error, reset: () => void) => ReactNode
}

interface State {
  error: Error | null
}

/**
 * React error boundary — catches render/lifecycle errors in child trees.
 *
 * Usage (wraps a single page or the whole <Outlet />):
 *   <ErrorBoundary>
 *     <SomePage />
 *   </ErrorBoundary>
 *
 * Or with a custom fallback:
 *   <ErrorBoundary fallback={(err, reset) => <p>{err.message} <button onClick={reset}>retry</button></p>}>
 *     <SomePage />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log to console; swap in a real error-tracking service (e.g. Sentry) here
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  reset = () => this.setState({ error: null })

  render() {
    const { error } = this.state

    if (error) {
      if (this.props.fallback) {
        return this.props.fallback(error, this.reset)
      }
      return <DefaultErrorFallback error={error} onReset={this.reset} />
    }

    return this.props.children
  }
}

// ── Default fallback UI ───────────────────────────────────────────────────────

function DefaultErrorFallback({ error, onReset }: { error: Error; onReset: () => void }) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950/30">
        <AlertTriangle className="h-7 w-7 text-red-500" />
      </div>
      <div className="max-w-md">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Something went wrong
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {error.message || 'An unexpected error occurred while rendering this page.'}
        </p>
      </div>
      <button
        onClick={onReset}
        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <RefreshCw className="h-4 w-4" />
        Try again
      </button>
    </div>
  )
}

// ── Connection error component (not a class) ──────────────────────────────────

interface ConnectionErrorProps {
  message?: string
  onRetry?: () => void
}

/**
 * Shown when an API request fails due to network/server errors.
 * Not an error boundary — just a presentational component.
 */
export function ConnectionError({
  message = 'Unable to connect to the server. Check your internet connection.',
  onRetry,
}: ConnectionErrorProps) {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/30">
        <AlertTriangle className="h-7 w-7 text-amber-500" />
      </div>
      <div className="max-w-md">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Connection error
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      )}
    </div>
  )
}
