import { Compass } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <img src="/image/logo_icon.svg" alt="Ema Store" className="mx-auto mb-5 h-12 w-12 rounded-xl" />
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-950 dark:text-brand-300">
          <Compass className="h-8 w-8" />
        </div>
        <p className="text-sm font-medium uppercase tracking-[0.22em] text-slate-500">404</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900 dark:text-slate-50">Page not found</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-300">
          The page you are looking for does not exist or may have been moved.
        </p>

        <Link to="/dashboard" className="mt-6 inline-flex">
          <Button>Return to dashboard</Button>
        </Link>
      </div>
    </div>
  )
}
