import { Suspense, useState } from 'react'
import { Outlet } from 'react-router-dom'

import { ConnectionBanner } from '@/components/ui/ConnectionBanner'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { PageLoader } from '@/components/ui/PageLoader'
import { Breadcrumbs } from './Breadcrumbs'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="flex min-h-screen">
        <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((prev) => !prev)} />

        <div className="flex min-h-screen flex-1 flex-col overflow-hidden">
          <Topbar onSidebarToggle={() => setSidebarCollapsed((prev) => !prev)} />
          <Breadcrumbs />

          <main className="flex-1 overflow-auto p-4 md:p-6">
            {/*
              ErrorBoundary catches any render/lifecycle crash inside a page.
              Suspense handles lazy-loaded page chunks (future code-splitting).
            */}
            <ErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <Outlet />
              </Suspense>
            </ErrorBoundary>
          </main>
        </div>
      </div>

      {/* Global connection-error banner (bottom-center, dismissible) */}
      <ConnectionBanner />
    </div>
  )
}
