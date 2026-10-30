import { useState } from 'react'
import { Outlet } from 'react-router-dom'

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
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
