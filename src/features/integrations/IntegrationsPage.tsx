import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'

import { Input } from '@/components/ui/input'
import { checkIntegration } from '@/services/integrationService'

import { IntegrationCard } from './IntegrationCard'
import { integrations } from './integrationsRegistry'
import { CATEGORY_LABELS, CATEGORY_ORDER } from './types'
import type { IntegrationCategory, IntegrationDef } from './types'

type TabId = 'all' | IntegrationCategory

const TABS: { id: TabId; label: string }[] = [
  { id: 'all', label: 'All' },
  ...CATEGORY_ORDER.map((id) => ({ id, label: CATEGORY_LABELS[id] })),
]

function isCategory(value: string | null): value is IntegrationCategory {
  return value !== null && (CATEGORY_ORDER as string[]).includes(value)
}

function matchesQuery(item: IntegrationDef, query: string): boolean {
  if (!query) return true
  const q = query.toLowerCase()
  return (
    item.name.toLowerCase().includes(q) ||
    item.description.toLowerCase().includes(q) ||
    item.envVars.some((v) => v.toLowerCase().includes(q))
  )
}

export function IntegrationsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [checking, setChecking] = useState<Record<string, boolean>>({})
  const [results, setResults] = useState<Record<string, string>>({})

  // The active tab lives in the URL (?tab=payment). Anything invalid = All.
  const tabParam = searchParams.get('tab')
  const tab: TabId = isCategory(tabParam) ? tabParam : 'all'

  const selectTab = (id: TabId) => {
    setSearchParams(id === 'all' ? {} : { tab: id }, { replace: true })
  }

  // Items matching the search box (tab counts follow the search).
  const searched = useMemo(
    () => integrations.filter((item) => matchesQuery(item, query.trim())),
    [query],
  )

  const counts = useMemo(() => {
    const map: Record<TabId, number> = { all: searched.length, payment: 0, location: 0, telegram: 0, other: 0 }
    for (const item of searched) map[item.category] += 1
    return map
  }, [searched])

  const visible = useMemo(
    () => (tab === 'all' ? searched : searched.filter((item) => item.category === tab)),
    [searched, tab],
  )

  const inUse = visible.filter((i) => i.status === 'in_use').length
  const planned = visible.filter((i) => i.status === 'planned').length

  const handleCheck = async (id: string) => {
    setChecking((prev) => ({ ...prev, [id]: true }))
    try {
      const res = await checkIntegration(id)
      const state = res.configured === undefined ? (res.ok ? 'OK' : 'Failed') : res.configured ? 'Configured' : 'Not configured'
      setResults((prev) => ({ ...prev, [id]: res.message ? `${state} - ${res.message}` : state }))
    } catch {
      setResults((prev) => ({ ...prev, [id]: 'Check is not available yet' }))
    } finally {
      setChecking((prev) => ({ ...prev, [id]: false }))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-brand-600">System configuration</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            API
          </h1>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search APIs or variables"
            className="pl-9"
            aria-label="Search APIs"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => selectTab(id)}
            className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
              tab === id
                ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/30 dark:text-brand-300'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            {label}
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                tab === id
                  ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-200'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {counts[id]}
            </span>
          </button>
        ))}
      </div>

      {/* Summary */}
      <p className="text-sm text-slate-500 dark:text-slate-400">
        {visible.length} {visible.length === 1 ? 'API' : 'APIs'} · {inUse} in use · {planned} planned
      </p>

      {/* Grid */}
      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          No APIs match your search.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((item) => (
            <IntegrationCard
              key={item.id}
              item={item}
              checking={!!checking[item.id]}
              result={results[item.id]}
              onCheck={() => handleCheck(item.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}