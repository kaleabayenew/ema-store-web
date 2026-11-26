import * as React from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

import { cn } from '@/lib/utils'

interface StatsCardProps {
  label: string
  value: string | number
  icon?: React.ElementType
  iconClassName?: string
  iconBgClassName?: string
  delta?: string
  deltaPositive?: boolean
  trend?: 'up' | 'down' | 'neutral'
  className?: string
  loading?: boolean
}

export function StatsCard({
  label,
  value,
  icon: Icon,
  iconClassName,
  iconBgClassName,
  delta,
  deltaPositive,
  trend,
  className,
  loading = false,
}: StatsCardProps) {
  if (loading) {
    return (
      <div
        className={cn(
          'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900',
          className,
        )}
      >
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-10 w-10 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700" />
        </div>
        <div className="mt-3 h-7 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        <div className="mt-2 h-3.5 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
      </div>
    )
  }

  const deltaColor =
    deltaPositive === true
      ? 'text-emerald-600'
      : deltaPositive === false
        ? 'text-red-500'
        : 'text-slate-400'

  const TrendIcon =
    trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : deltaPositive === true ? TrendingUp : deltaPositive === false ? TrendingDown : null

  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900',
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">{label}</span>
        {Icon && (
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-xl',
              iconBgClassName ?? 'bg-brand-50 dark:bg-brand-950/40',
            )}
          >
            <Icon
              className={cn(
                'h-5 w-5',
                iconClassName ?? 'text-brand-600 dark:text-brand-300',
              )}
            />
          </div>
        )}
      </div>

      <p className="mt-3 text-2xl font-semibold text-slate-900 dark:text-slate-50">
        {value}
      </p>

      {delta && (
        <div className={cn('mt-1.5 flex items-center gap-1', deltaColor)}>
          {TrendIcon && <TrendIcon className="h-3.5 w-3.5" />}
          <span className="text-xs font-semibold">{delta}</span>
        </div>
      )}
    </div>
  )
}
