import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { canAccessPage, ROUTE_ACCESS } from '@/config/rbac'
import { useAuthStore } from '@/store/authStore'

export function ProtectedRoute() {
  const { isAuthenticated, user } = useAuthStore()
  const { pathname } = useLocation()

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  // Unknown paths fall through to the catch-all 404 route instead of 403.
  const isKnownRoute = Object.keys(ROUTE_ACCESS).some(
    (key) => pathname === key || pathname.startsWith(key + '/'),
  )
  if (isKnownRoute && !canAccessPage(user, pathname)) {
    return <Navigate to="/403" replace />
  }

  return <Outlet />
}
