import * as React from 'react'
import { AlertCircle, ChevronsUpDown, ChevronUp, ChevronDown, Inbox } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface Column<T> {
  key: string
  header: string
  cell: (row: T) => React.ReactNode
  sortable?: boolean
  className?: string
  headerClassName?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  error?: string | null
  emptyIcon?: React.ElementType
  emptyTitle?: string
  emptyDescription?: string
  skeletonRows?: number
  keyExtractor: (row: T) => string
  onRowClick?: (row: T) => void
  onRetry?: () => void
  className?: string
}

type SortDirection = 'asc' | 'desc' | null

const SKELETON_WIDTHS = ['w-3/4', 'w-1/2', 'w-full']

export function DataTable<T>({
  columns,
  data,
  loading = false,
  error,
  emptyIcon: EmptyIcon = Inbox,
  emptyTitle = 'No data',
  emptyDescription,
  skeletonRows = 5,
  keyExtractor,
  onRowClick,
  onRetry,
  className,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = React.useState<string | null>(null)
  const [sortDir, setSortDir] = React.useState<SortDirection>(null)

  function handleSort(key: string) {
    if (sortKey !== key) {
      setSortKey(key)
      setSortDir('asc')
    } else if (sortDir === 'asc') {
      setSortDir('desc')
    } else {
      setSortKey(null)
      setSortDir(null)
    }
  }

  const sortedData = React.useMemo(() => {
    if (!sortKey || !sortDir) return data
    return [...data].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortKey]
      const bVal = (b as Record<string, unknown>)[sortKey]
      if (aVal === bVal) return 0
      if (aVal === undefined || aVal === null) return 1
      if (bVal === undefined || bVal === null) return -1
      const result = aVal < bVal ? -1 : 1
      return sortDir === 'asc' ? result : -result
    })
  }, [data, sortKey, sortDir])

  const isEmpty = !loading && !error && sortedData.length === 0
  const isLoadingSkeleton = loading && data.length === 0
  const isError = !!error && data.length === 0

  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900',
        className,
      )}
    >
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-800">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500',
                  col.sortable && 'cursor-pointer select-none',
                  col.headerClassName,
                )}
                onClick={col.sortable ? () => handleSort(col.key) : undefined}
              >
                <span className="inline-flex items-center gap-1">
                  {col.header}
                  {col.sortable && (
                    <>
                      {sortKey === col.key && sortDir === 'asc' ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : sortKey === col.key && sortDir === 'desc' ? (
                        <ChevronDown className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
                      )}
                    </>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {isLoadingSkeleton &&
            Array.from({ length: skeletonRows }).map((_, rowIdx) => (
              <tr key={`skeleton-${rowIdx}`}>
                {columns.map((col, colIdx) => (
                  <td key={col.key} className="px-4 py-3">
                    <div
                      className={cn(
                        'h-4 animate-pulse rounded bg-slate-200 dark:bg-slate-700',
                        SKELETON_WIDTHS[(rowIdx + colIdx) % SKELETON_WIDTHS.length],
                      )}
                    />
                  </td>
                ))}
              </tr>
            ))}

          {isError && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10">
                <div className="flex flex-col items-center gap-3 text-center">
                  <AlertCircle className="h-8 w-8 text-red-500" />
                  <p className="text-sm text-slate-600 dark:text-slate-400">{error}</p>
                  {onRetry && (
                    <Button variant="outline" size="sm" onClick={onRetry}>
                      Retry
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          )}

          {isEmpty && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-14">
                <div className="flex flex-col items-center gap-3 text-center">
                  <EmptyIcon className="h-10 w-10 text-slate-300 dark:text-slate-600" />
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    {emptyTitle}
                  </p>
                  {emptyDescription && (
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {emptyDescription}
                    </p>
                  )}
                </div>
              </td>
            </tr>
          )}

          {!isLoadingSkeleton &&
            !isError &&
            !isEmpty &&
            sortedData.map((row) => (
              <tr
                key={keyExtractor(row)}
                className={cn(
                  'transition hover:bg-slate-50 dark:hover:bg-slate-800/50',
                  onRowClick && 'cursor-pointer',
                )}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn('px-4 py-3 text-slate-700 dark:text-slate-300', col.className)}
                  >
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  )
}
