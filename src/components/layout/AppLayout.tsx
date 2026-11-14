import { Suspense, useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'

import { ConnectionBanner } from '@/components/ui/ConnectionBanner'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { PageLoader } from '@/components/ui/PageLoader'
import { canAccessPage } from '@/config/rbac'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { Breadcrumbs } from './Breadcrumbs'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { pathname } = useLocation()
  const { user, isAuthenticated, accessToken } = useAuthStore()
  const onSupportPage = pathname === '/support'
  const canUseSupport = canAccessPage(user, '/support')

  // Validate the persisted session against the backend once on mount.
  // A forged/expired token gets a 401 → the axios interceptor logs out.
  // Network failures are ignored so offline use still works.
  useEffect(() => {
    if (!isAuthenticated || !accessToken) return
    api.get('/auth/me', { timeout: 10000 }).catch(() => {})
  }, [isAuthenticated, accessToken])

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((prev) => !prev)} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar onSidebarToggle={() => setSidebarCollapsed((prev) => !prev)} />
        <Breadcrumbs />

        <main className="flex-1 overflow-auto px-4 pb-24 pt-4 md:px-6 md:pb-28 md:pt-6">
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

      {/* Floating support chat shortcut — only for roles that can open /support */}
      {canUseSupport && !onSupportPage && (
        <Link
          to="/support"
          aria-label="Open support chat"
          title="Support chat"
          className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg shadow-brand-600/30 transition hover:bg-brand-700 hover:shadow-xl"
        >
          <MessageCircle className="h-6 w-6" />
        </Link>
      )}

      {/* Global connection-error banner (top-center, dismissible) */}
      <ConnectionBanner />
    </div>
  )
}
