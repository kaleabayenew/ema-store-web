import { ShieldAlert } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'

export function ForbiddenPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10 dark:bg-slate-950">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-300">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <p className="text-sm font-medium uppercase tracking-[0.22em] text-red-500">403</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900 dark:text-slate-50">No access</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-300">
          This account does not have permission to view this page. Please contact your administrator.
        </p>

        <Link to="/dashboard" className="mt-6 inline-flex">
          <Button>Return to dashboard</Button>
        </Link>
      </div>
    </div>
  )
}
