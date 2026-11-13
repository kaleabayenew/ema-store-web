import { CreditCard, ExternalLink, Loader2, MapPin, Plug, Send } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

import { CATEGORY_LABELS } from './types'
import type { IntegrationCategory, IntegrationDef, IntegrationStatus } from './types'

const CATEGORY_ICONS: Record<IntegrationCategory, LucideIcon> = {
  payment: CreditCard,
  location: MapPin,
  telegram: Send,
  other: Plug,
}

const STATUS_BADGE: Record<
  IntegrationStatus,
  { label: string; variant: 'success' | 'warning' | 'default' }
> = {
  in_use: { label: 'In use', variant: 'success' },
  planned: { label: 'Planned', variant: 'warning' },
  unknown: { label: 'Unknown', variant: 'default' },
}

interface IntegrationCardProps {
  item: IntegrationDef
  checking: boolean
  result?: string
  onCheck: () => void
}

export function IntegrationCard({ item, checking, result, onCheck }: IntegrationCardProps) {
  const Icon = CATEGORY_ICONS[item.category]
  const status = STATUS_BADGE[item.status]

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/30 dark:text-brand-300">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">
              {item.name}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {CATEGORY_LABELS[item.category]}
            </p>
          </div>
        </div>
        <Badge variant={status.variant} className="shrink-0">
          {status.label}
        </Badge>
      </div>

      {/* Description */}
      <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">{item.description}</p>
      {item.note && (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{item.note}</p>
      )}

      {/* Used by */}
      <div className="mt-4">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Used by</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {item.usedBy.map((u) => (
            <Badge key={u} variant="info">
              {u}
            </Badge>
          ))}
        </div>
      </div>

      {/* Environment variables (names only) */}
      <div className="mt-4">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {item.envVars.length > 0 ? 'Environment variables' : 'No keys needed'}
        </p>
        {item.envVars.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {item.envVars.map((v) => (
              <code
                key={v}
                className="rounded-md bg-slate-100 px-2 py-1 font-mono text-[11px] text-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                {v}
              </code>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-auto pt-5">
        <div className="flex items-center justify-between gap-3">
          {item.docsUrl ? (
            <a
              href={item.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-300"
            >
              Docs
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : (
            <span />
          )}
          <Button variant="outline" size="sm" onClick={onCheck} disabled={checking}>
            {checking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {checking ? 'Checking...' : 'Check'}
          </Button>
        </div>
        {result && (
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400" role="status">
            {result}
          </p>
        )}
      </div>
    </div>
  )
}