import { Bell, CheckCheck, ChevronDown, Globe2, Moon, PanelLeft, Search, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import api from '@/lib/api'
import { ROLE_COLORS, ROLE_LABELS } from '@/config/rbac'
import { useAuthStore } from '@/store/authStore'
import type { Role } from '@/types/auth'

interface TopbarNotification {
  id: string
  title: string
  body: string
  is_read: boolean
  created_at: string
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

interface TopbarProps { onSidebarToggle: () => void }

export function Topbar({ onSidebarToggle }: TopbarProps) {
  const [darkMode, setDarkMode] = useState(false)
  const [notifications, setNotifications] = useState<TopbarNotification[]>([])
  const [notifOpen, setNotifOpen] = useState(false)
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const unreadCount = notifications.filter((n) => !n.is_read).length

  const fetchNotifications = async () => {
    try {
      const res = await api.get<{ notifications: TopbarNotification[] }>('/notifications', { params: { limit: 8 } })
      setNotifications(res.data.notifications ?? [])
    } catch {
      // notifications are best-effort in the topbar
    }
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [])

  const role = user?.role as Role | undefined
  const roleColor = role ? ROLE_COLORS[role] : 'bg-slate-100 text-slate-600'
  const roleLabel = role ? ROLE_LABELS[role] : 'User'
  const initial = user?.name?.charAt(0).toUpperCase() ?? 'A'

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/90 md:px-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Toggle sidebar" onClick={onSidebarToggle}>
          <PanelLeft className="h-4 w-4" />
        </Button>

        <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 md:flex">
          <Search className="h-4 w-4" />
          <span>Search</span>
          <span className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold uppercase dark:border-slate-700 dark:bg-slate-950">Ctrl K</span>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <Button variant="outline" size="sm" className="gap-2">
          <Globe2 className="h-4 w-4" />
          <span className="hidden sm:inline">EN</span>
        </Button>

        <Button variant="outline" size="icon" aria-label="Toggle theme" onClick={() => setDarkMode((p) => !p)}>
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <DropdownMenu onOpenChange={(open) => { setNotifOpen(open); if (open) fetchNotifications() }}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <Badge variant="warning" className="absolute -right-1 -top-1 min-h-5 min-w-5 justify-center rounded-full px-1.5 py-0.5 text-[10px]">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between px-3 py-2">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Notifications</p>
              {unreadCount > 0 && (
                <button
                  type="button"
                  className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
                  onClick={async () => {
                    try { await api.patch('/notifications/read-all') } catch { /* ignore */ }
                    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
                  }}
                >
                  <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                </button>
              )}
            </div>
            <div className="my-1 h-px bg-slate-200 dark:bg-slate-800" />
            {notifications.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-slate-400">No notifications</p>
            ) : (
              notifications.map((n) => (
                <DropdownMenuItem
                  key={n.id}
                  className="flex cursor-pointer flex-col items-start gap-0.5 px-3 py-2.5"
                  onClick={async () => {
                    if (!n.is_read) {
                      try { await api.patch(`/notifications/${n.id}/read`) } catch { /* ignore */ }
                      setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, is_read: true } : x))
                    }
                  }}
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <p className={`truncate text-sm ${n.is_read ? 'font-normal text-slate-600 dark:text-slate-300' : 'font-semibold text-slate-900 dark:text-slate-100'}`}>
                      {n.title}
                    </p>
                    <span className="flex-shrink-0 text-[10px] text-slate-400">{timeAgo(n.created_at)}</span>
                  </div>
                  <p className="line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{n.body}</p>
                </DropdownMenuItem>
              ))
            )}
            {notifOpen && (
              <>
                <div className="my-1 h-px bg-slate-200 dark:bg-slate-800" />
                <div className="px-3 py-2">
                  <Link to="/notifications" className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
                    Manage notifications
                  </Link>
                </div>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 px-2 py-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${roleColor}`}>
                {initial}
              </div>
              <div className="hidden text-left md:block">
                <p className="text-sm font-medium leading-tight">{user?.name ?? 'Admin'}</p>
                <p className={`text-[11px] font-semibold leading-tight ${roleColor.split(' ').find(c => c.startsWith('text-')) ?? 'text-slate-500'}`}>
                  {roleLabel}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-500" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-48">
            <Link to="/profile"><DropdownMenuItem>My profile</DropdownMenuItem></Link>
            {role === 'SUPER_ADMIN' && (
              <Link to="/settings"><DropdownMenuItem>Settings</DropdownMenuItem></Link>
            )}
            <DropdownMenuItem
              className="text-red-600 dark:text-red-400"
              onClick={() => { logout(); navigate('/login') }}
            >
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
