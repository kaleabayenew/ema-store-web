import * as React from 'react'

import { cn } from '@/lib/utils'

interface PageHeaderProps {
  eyebrow?: string
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 md:flex-row md:items-start md:justify-between',
        className,
      )}
    >
      <div>
        {eyebrow && (
          <p className="text-sm font-medium text-brand-600">{eyebrow}</p>
        )}
        <h1 className="mt-0.5 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      )}
    </div>
  )
}
