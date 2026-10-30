import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { canAccessRoute } from '@/config/rbac'
import { useAuthStore } from '@/store/authStore'

export function ProtectedRoute() {
  const { isAuthenticated, user } = useAuthStore()
  const { pathname } = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!canAccessRoute(user?.role ?? null, pathname)) {
    return <Navigate to="/403" replace />
  }

  return <Outlet />
}
