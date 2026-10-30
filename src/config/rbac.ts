import type { Role } from '@/types/auth'

// ─────────────────────────────────────────────────────────────────────────────
//  Route → allowed roles
// ─────────────────────────────────────────────────────────────────────────────
export const ROUTE_ACCESS: Record<string, Role[]> = {
  '/dashboard':          ['SUPER_ADMIN', 'MANAGEMENT', 'CUSTOMER_SUPPORT', 'PARTNER_MANAGER', 'PRODUCT_MANAGER', 'FINANCE'],
  '/customers':          ['SUPER_ADMIN', 'MANAGEMENT', 'CUSTOMER_SUPPORT'],
  '/partners':           ['SUPER_ADMIN', 'MANAGEMENT', 'PARTNER_MANAGER'],
  '/products':           ['SUPER_ADMIN', 'MANAGEMENT', 'PRODUCT_MANAGER'],
  '/orders':             ['SUPER_ADMIN', 'MANAGEMENT', 'PRODUCT_MANAGER', 'FINANCE'],
  '/ride':               ['SUPER_ADMIN', 'MANAGEMENT'],
  '/marketing':          ['SUPER_ADMIN', 'MANAGEMENT'],
  '/flash-deals':        ['SUPER_ADMIN', 'MANAGEMENT', 'MARKETING'],
  '/support':            ['SUPER_ADMIN', 'CUSTOMER_SUPPORT'],
  '/finance':            ['SUPER_ADMIN', 'FINANCE'],
  '/reports':            ['SUPER_ADMIN', 'PARTNER_MANAGER', 'PRODUCT_MANAGER', 'FINANCE'],
  '/delivery':           ['SUPER_ADMIN'],
  '/approvals':          ['SUPER_ADMIN', 'PARTNER_MANAGER', 'PRODUCT_MANAGER'],
  '/notifications':      ['SUPER_ADMIN', 'MANAGEMENT', 'MARKETING'],
  '/users':              ['SUPER_ADMIN'],
  '/settings':           ['SUPER_ADMIN'],
  '/settings/audit-log': ['SUPER_ADMIN'],
  '/profile':            ['SUPER_ADMIN', 'MANAGEMENT', 'CUSTOMER_SUPPORT', 'PARTNER_MANAGER', 'PRODUCT_MANAGER', 'FINANCE'],
}

// ─────────────────────────────────────────────────────────────────────────────
//  Role → permission labels (used for display / future API guards)
// ─────────────────────────────────────────────────────────────────────────────
export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  SUPER_ADMIN:      ['*'],
  MANAGEMENT:       ['dashboard', 'customers', 'partners', 'products', 'orders', 'ride', 'marketing', 'flash-deals', 'notifications'],
  CUSTOMER_SUPPORT: ['dashboard', 'customers', 'support'],
  PARTNER_MANAGER:  ['dashboard', 'partners', 'reports', 'approvals'],
  PRODUCT_MANAGER:  ['dashboard', 'products', 'orders', 'reports', 'approvals'],
  FINANCE:          ['dashboard', 'orders', 'finance', 'reports'],
  MARKETING:        ['dashboard', 'marketing', 'flash-deals', 'notifications'],
}

// ─────────────────────────────────────────────────────────────────────────────
//  Route guard
// ─────────────────────────────────────────────────────────────────────────────
export function canAccessRoute(role: Role | null, pathname: string): boolean {
  if (!role) return false
  if (role === 'SUPER_ADMIN') return true
  const route = Object.keys(ROUTE_ACCESS).find((key) => pathname === key || pathname.startsWith(key + '/')) ?? pathname
  const allowed = ROUTE_ACCESS[route] ?? []
  return allowed.includes(role)
}

// ─────────────────────────────────────────────────────────────────────────────
//  Role display helpers
// ─────────────────────────────────────────────────────────────────────────────
export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN:      'Super Admin',
  MANAGEMENT:       'Management',
  CUSTOMER_SUPPORT: 'Customer Support',
  PARTNER_MANAGER:  'Partner Manager',
  PRODUCT_MANAGER:  'Product Manager',
  FINANCE:          'Finance',
  MARKETING:        'Marketing',
}

export const ROLE_COLORS: Record<Role, string> = {
  SUPER_ADMIN:      'bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300',
  MANAGEMENT:       'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
  CUSTOMER_SUPPORT: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
  PARTNER_MANAGER:  'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  PRODUCT_MANAGER:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  FINANCE:          'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
  MARKETING:        'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
}
