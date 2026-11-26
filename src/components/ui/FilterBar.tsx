import * as React from 'react'
import { Search } from 'lucide-react'

import { cn } from '@/lib/utils'

interface FilterOption {
  value: string
  label: string
  count?: number
}

interface FilterBarProps {
  filters: FilterOption[]
  activeFilter: string
  onFilterChange: (value: string) => void
  search?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  actions?: React.ReactNode
  className?: string
}

export function FilterBar({
  filters,
  activeFilter,
  onFilterChange,
  search,
  onSearchChange,
  searchPlaceholder = 'Search…',
  actions,
  className,
}: FilterBarProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      {/* Filter pills */}
      <div className="flex flex-wrap items-center gap-2">
        {filters.map((filter) => {
          const isActive = filter.value === activeFilter
          return (
            <button
              key={filter.value}
              type="button"
              onClick={() => onFilterChange(filter.value)}
              className={cn(
                'rounded-xl px-3 py-1.5 text-sm font-medium transition',
                isActive
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700',
              )}
            >
              {filter.label}
              {filter.count !== undefined && (
                <span
                  className={cn(
                    'ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                    isActive
                      ? 'bg-white/20'
                      : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
                  )}
                >
                  {filter.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Right side: search + actions */}
      {(onSearchChange || actions) && (
        <div className="flex items-center gap-2">
          {onSearchChange && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search ?? ''}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-64 rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
          )}
          {actions}
        </div>
      )}
    </div>
  )
}
