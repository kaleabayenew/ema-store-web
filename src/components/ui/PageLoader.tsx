/**
 * Full-page loading spinner.
 * Used as a Suspense fallback and for initial app hydration.
 */
export function PageLoader({ message = 'Loading…' }: { message?: string }) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
      {/* Animated ring */}
      <div className="relative h-12 w-12">
        <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-800" />
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-brand-600" />
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400">{message}</p>
    </div>
  )
}

/**
 * Inline spinner — small, used inside cards/tables while fetching.
 */
export function InlineLoader({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center py-10 ${className}`}>
      <div className="h-6 w-6 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600 dark:border-slate-800" />
    </div>
  )
}
