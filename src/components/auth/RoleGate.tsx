import type { ReactNode } from 'react'

import { canAccessRoute } from '@/config/rbac'
import { useAuthStore } from '@/store/authStore'
import type { Role } from '@/types/auth'

interface RoleGateProps {
  roles: Role[]
  children: ReactNode
  fallback?: ReactNode
}

export function RoleGate({ roles, children, fallback = null }: RoleGateProps) {
  const { user } = useAuthStore()
  const allowed = user ? roles.includes(user.role) : false

  if (!allowed) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

export function RoutePermissionGate({ pathname, children, fallback }: { pathname: string; children: ReactNode; fallback?: ReactNode }) {
  const { user } = useAuthStore()
  const allowed = canAccessRoute(user?.role ?? null, pathname)

  if (!allowed) {
    return <>{fallback ?? null}</>
  }

  return <>{children}</>
}
