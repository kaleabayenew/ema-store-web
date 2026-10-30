import { ChevronRight } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

export function Breadcrumbs() {
  const { pathname } = useLocation()
  const crumbs = pathname
    .split('/')
    .filter(Boolean)
    .map((segment) => segment.replace(/-/g, ' '))

  return (
    <nav className="flex items-center gap-2 px-4 pb-3 pt-2 text-sm text-slate-500 md:px-6">
      <Link to="/dashboard" className="font-medium text-slate-600 hover:text-brand-600 dark:text-slate-300">
        Home
      </Link>

      {crumbs.length > 0 && <ChevronRight className="h-4 w-4" />}

      {crumbs.map((crumb, index) => {
        const path = `/${crumbs.slice(0, index + 1).join('/')}`
        const isLast = index === crumbs.length - 1

        return (
          <div key={path} className="flex items-center gap-2">
            {index > 0 && <ChevronRight className="h-4 w-4" />}
            {isLast ? (
              <span className="capitalize text-slate-700 dark:text-slate-200">{crumb}</span>
            ) : (
              <Link to={path} className="capitalize hover:text-brand-600">
                {crumb}
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}
