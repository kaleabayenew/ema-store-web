import { Home } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

function toTitleCase(str: string): string {
  return str
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function Breadcrumbs() {
  const { pathname } = useLocation()
  const crumbs = pathname
    .split('/')
    .filter(Boolean)
    .map((segment) => toTitleCase(segment.replace(/-/g, ' ')))

  return (
    <nav className="flex items-center gap-2 px-4 py-2 text-sm text-slate-500 border-b border-slate-100 dark:border-slate-800/60 bg-white/60 dark:bg-slate-950/60 backdrop-blur-sm md:px-6">
      <Link to="/dashboard" className="flex items-center gap-1 font-medium text-slate-600 hover:text-brand-600 dark:text-slate-300">
        <Home className="h-3.5 w-3.5" />
        Home
      </Link>

      {crumbs.length > 0 && <span className="text-slate-300 select-none dark:text-slate-600">/</span>}

      {crumbs.map((crumb, index) => {
        const path = `/${crumbs.slice(0, index + 1).join('/')}`
        const isLast = index === crumbs.length - 1

        return (
          <div key={path} className="flex items-center gap-2">
            {index > 0 && <span className="text-slate-300 select-none dark:text-slate-600">/</span>}
            {isLast ? (
              <span className="font-semibold text-slate-800 dark:text-slate-200">{crumb}</span>
            ) : (
              <Link to={path} className="hover:text-brand-600">
                {crumb}
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}
