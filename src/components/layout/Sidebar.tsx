import {
  BarChart3, Bell, Bike, Boxes, Building2, CreditCard, FileText, Flame,
  LayoutDashboard, LogOut, MessageSquareText, PackageCheck,
  Settings, ShoppingCart, Sparkles, UserRoundCog, Users, Warehouse,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'

import { canAccessRoute, ROLE_COLORS, ROLE_LABELS } from '@/config/rbac'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import type { Role } from '@/types/auth'

interface NavItem { title: string; href: string; icon: LucideIcon }

const navGroups: { title: string; items: NavItem[] }[] = [
  {
    title: 'Overview',
    items: [
      { title: 'Dashboard',  href: '/dashboard', icon: LayoutDashboard },
      { title: 'Reports',    href: '/reports',   icon: BarChart3 },
    ],
  },
  {
    title: 'Operations',
    items: [
      { title: 'Customers',  href: '/customers', icon: Users },
      { title: 'Partners',   href: '/partners',  icon: Building2 },
      { title: 'Products',   href: '/products',  icon: Boxes },
      { title: 'Orders',     href: '/orders',    icon: ShoppingCart },
      { title: 'Ride',       href: '/ride',      icon: Bike },
      { title: 'Marketing',  href: '/marketing', icon: Sparkles },
      { title: 'Flash Deals', href: '/flash-deals', icon: Flame },
      { title: 'Support',    href: '/support',   icon: MessageSquareText },
      { title: 'Delivery',   href: '/delivery',  icon: Warehouse },
      { title: 'Finance',    href: '/finance',   icon: CreditCard },
      { title: 'Approvals',  href: '/approvals', icon: PackageCheck },
    ],
  },
  {
    title: 'Admin',
    items: [
      { title: 'Manage Users', href: '/users',              icon: UserRoundCog },
      { title: 'Notifications', href: '/notifications',      icon: Bell },
      { title: 'Settings',     href: '/settings',           icon: Settings },
      { title: 'Audit Log',    href: '/settings/audit-log', icon: FileText },
    ],
  },
]

interface SidebarProps { isCollapsed: boolean; onToggle: () => void }

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const role = (user?.role ?? 'SUPER_ADMIN') as Role

  const visibleGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => canAccessRoute(role, item.href)),
    }))
    .filter((group) => group.items.length > 0)

  const initial = user?.name?.charAt(0).toUpperCase() ?? 'A'

  return (
    <aside
      className={cn(
        'flex flex-col border-r border-slate-200 bg-white/90 backdrop-blur-sm transition-all duration-200 dark:border-slate-800 dark:bg-slate-950/90',
        isCollapsed ? 'w-20' : 'w-72',
      )}
    >
      {/* ── Logo ── */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-800">
        <div className={cn('flex items-center gap-3', isCollapsed && 'justify-center w-full')}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white shadow-lg shadow-brand-600/20">
            E
          </div>
          {!isCollapsed && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Ema</p>
              <h1 className="text-[15px] font-semibold leading-tight">Store Admin</h1>
            </div>
          )}
        </div>

        {!isCollapsed && (
          <button
            type="button"
            aria-label="Collapse sidebar"
            onClick={onToggle}
            className="rounded-lg border border-slate-200 p-1.5 text-slate-500 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}

        {isCollapsed && (
          <button
            type="button"
            aria-label="Expand sidebar"
            onClick={onToggle}
            className="absolute left-14 top-4 z-50 rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 space-y-5 overflow-y-auto p-3 py-4">
        {visibleGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            {!isCollapsed && (
              <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                {group.title}
              </p>
            )}
            {group.items.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  title={isCollapsed ? item.title : undefined}
                  className={({ isActive }) =>
                    cn(
                      'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                      isCollapsed && 'justify-center px-2',
                      isActive
                        ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-200 dark:bg-brand-950/30 dark:text-brand-300 dark:ring-brand-900'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={cn('h-[18px] w-[18px] shrink-0', isActive ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300')} />
                      {!isCollapsed && <span>{item.title}</span>}
                    </>
                  )}
                </NavLink>
              )
            })}
          </div>
        ))}
      </nav>

      {/* ── User chip ── */}
      <div className={cn(
        'shrink-0 border-t border-slate-200 p-3 dark:border-slate-800',
        isCollapsed ? 'flex justify-center' : '',
      )}>
        {isCollapsed ? (
          <div
            title={user?.name}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-300"
          >
            {initial}
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-2.5 dark:bg-slate-900">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{user?.name ?? 'Admin'}</p>
              <span className={cn('inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold', ROLE_COLORS[role])}>
                {ROLE_LABELS[role]}
              </span>
            </div>
            <button
              type="button"
              aria-label="Sign out"
              title="Sign out"
              onClick={() => { logout(); navigate('/login') }}
              className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
