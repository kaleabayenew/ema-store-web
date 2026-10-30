import { Bell, ChevronDown, Globe2, Moon, PanelLeft, Search, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ROLE_COLORS, ROLE_LABELS } from '@/config/rbac'
import { useAuthStore } from '@/store/authStore'
import type { Role } from '@/types/auth'

interface TopbarProps { onSidebarToggle: () => void }

export function Topbar({ onSidebarToggle }: TopbarProps) {
  const [darkMode, setDarkMode] = useState(false)
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const role = (user?.role ?? 'SUPER_ADMIN') as Role
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

        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          <Badge variant="warning" className="absolute -right-1 -top-1 min-h-5 min-w-5 justify-center rounded-full px-1.5 py-0.5 text-[10px]">3</Badge>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 px-2 py-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${ROLE_COLORS[role]}`}>
                {initial}
              </div>
              <div className="hidden text-left md:block">
                <p className="text-sm font-medium leading-tight">{user?.name ?? 'Admin'}</p>
                <p className={`text-[11px] font-semibold leading-tight ${ROLE_COLORS[role].split(' ').find(c => c.startsWith('text-')) ?? 'text-slate-500'}`}>
                  {ROLE_LABELS[role]}
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
