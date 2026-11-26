import { useCallback, useEffect, useState } from 'react'
import { Eye, EyeOff, Loader2, Lock, LockOpen, RefreshCw, Store, Smartphone, Wrench } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/PageHeader'
import api from '@/lib/api'
import { apiErrorMessage } from '@/lib/errors'

// ── Types ─────────────────────────────────────────────────────────────────────

type AppKind = 'customer' | 'partner'

interface AppPage {
  id: number
  app: AppKind
  pageKey: string
  title: string
  isHidden: boolean
  isLocked: boolean
  sortOrder: number
}

const APP_META: Record<AppKind, { label: string; description: string; icon: typeof Smartphone }> = {
  customer: {
    label: 'Customer App',
    description: 'Control which pages are visible or locked in the customer Flutter app.',
    icon: Smartphone,
  },
  partner: {
    label: 'Partner App',
    description: 'Control which pages are visible or locked in the partner Flutter app.',
    icon: Store,
  },
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function AppPagesPage({ app }: { app: AppKind }) {
  const meta = APP_META[app]
  const [pages, setPages] = useState<AppPage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingKeys, setSavingKeys] = useState<Set<string>>(new Set())
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set())
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false)
  const [maintenanceMessage, setMaintenanceMessage] = useState('')
  const [maintenanceSaving, setMaintenanceSaving] = useState(false)
  const [maintenanceSaved, setMaintenanceSaved] = useState(false)

  const fetchPages = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [pagesRes, maintRes] = await Promise.all([
        api.get(`/app-pages/${app}`),
        api.get(`/app-pages/${app}/maintenance`).catch(() => null),
      ])
      setPages(pagesRes.data.pages ?? [])
      const m = maintRes?.data?.maintenance
      if (m) {
        setMaintenanceEnabled(m.enabled === true)
        setMaintenanceMessage(m.message ?? '')
      }
    } catch (err: any) {
      setError(apiErrorMessage(err, 'Failed to load app pages'))
    } finally {
      setLoading(false)
    }
  }, [app])

  useEffect(() => { fetchPages() }, [fetchPages])

  const updatePage = async (page: AppPage, field: 'isHidden' | 'isLocked') => {
    const value = !page[field]
    // Optimistic update
    setPages((prev) => prev.map((p) => (p.id === page.id ? { ...p, [field]: value } : p)))
    setSavingKeys((prev) => new Set(prev).add(page.pageKey))
    setError(null)
    try {
      await api.put(`/app-pages/${app}/${encodeURIComponent(page.pageKey)}`, { [field]: value })
      setSavedKeys((prev) => new Set(prev).add(page.pageKey))
      setTimeout(() => {
        setSavedKeys((prev) => {
          const next = new Set(prev)
          next.delete(page.pageKey)
          return next
        })
      }, 2000)
    } catch (err: any) {
      // Revert on failure
      setPages((prev) => prev.map((p) => (p.id === page.id ? { ...p, [field]: !value } : p)))
      setError(apiErrorMessage(err, 'Failed to update page'))
    } finally {
      setSavingKeys((prev) => {
        const next = new Set(prev)
        next.delete(page.pageKey)
        return next
      })
    }
  }

  const saveMaintenance = async () => {
    setMaintenanceSaving(true)
    setError(null)
    try {
      await api.put(`/app-pages/${app}/maintenance`, {
        enabled: maintenanceEnabled,
        message: maintenanceMessage,
      })
      setMaintenanceSaved(true)
      setTimeout(() => setMaintenanceSaved(false), 2000)
    } catch (err: any) {
      setError(apiErrorMessage(err, 'Failed to update maintenance mode'))
    } finally {
      setMaintenanceSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        eyebrow="App Control"
        title={`${meta.label} Pages`}
        description={meta.description}
        actions={
          <Button variant="outline" onClick={fetchPages} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />

      {/* Maintenance mode */}
      <div className={`overflow-hidden rounded-2xl border shadow-sm ${
        maintenanceEnabled
          ? 'border-red-200 bg-red-50/60 dark:border-red-900 dark:bg-red-950/20'
          : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
      }`}>
        <div className="flex flex-wrap items-center gap-4 px-5 py-4">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            maintenanceEnabled
              ? 'bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400'
              : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
          }`}>
            <Wrench className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Maintenance Mode
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {maintenanceEnabled
                ? 'The app is closed — users see an "under maintenance" screen.'
                : 'The app is live and available to users.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setMaintenanceEnabled((v) => !v)}
            className={`relative h-7 w-12 rounded-full transition-colors ${
              maintenanceEnabled ? 'bg-red-500' : 'bg-slate-300 dark:bg-slate-600'
            }`}
            aria-pressed={maintenanceEnabled}
          >
            <span
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
                maintenanceEnabled ? 'left-[22px]' : 'left-0.5'
              }`}
            />
          </button>
          <span className={`text-xs font-bold ${maintenanceEnabled ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
            {maintenanceEnabled ? 'APP UNAVAILABLE' : 'APP LIVE'}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3 border-t border-slate-200/70 px-5 py-3 dark:border-slate-800">
          <input
            type="text"
            value={maintenanceMessage}
            onChange={(e) => setMaintenanceMessage(e.target.value)}
            placeholder="Message shown to users (optional), e.g. Back at 6 PM"
            className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            maxLength={300}
          />
          <Button size="sm" onClick={saveMaintenance} disabled={maintenanceSaving}>
            {maintenanceSaving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            Save Maintenance
          </Button>
          {maintenanceSaved && !maintenanceSaving && (
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Saved</span>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Pages table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Pages <span className="ml-1 text-sm font-normal text-slate-400">({pages.length})</span>
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
          </div>
        ) : pages.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-500 dark:text-slate-400">
            No pages configured for this app yet.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {pages.map((page) => {
              const saving = savingKeys.has(page.pageKey)
              const saved = savedKeys.has(page.pageKey)
              return (
                <li
                  key={page.id}
                  className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                      {page.title}
                    </p>
                    <code className="text-xs text-slate-400 dark:text-slate-500">{page.pageKey}</code>
                  </div>

                  {/* Hide toggle */}
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => updatePage(page, 'isHidden')}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
                      page.isHidden
                        ? 'border-red-200 bg-red-50 text-red-600 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400'
                        : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400'
                    }`}
                    title={page.isHidden ? 'Hidden — click to show' : 'Visible — click to hide'}
                  >
                    {page.isHidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    {page.isHidden ? 'Hidden' : 'Visible'}
                  </button>

                  {/* Lock toggle */}
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => updatePage(page, 'isLocked')}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
                      page.isLocked
                        ? 'border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-400'
                        : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400'
                    }`}
                    title={page.isLocked ? 'Locked — click to unlock' : 'Unlocked — click to lock'}
                  >
                    {page.isLocked ? <Lock className="h-3.5 w-3.5" /> : <LockOpen className="h-3.5 w-3.5" />}
                    {page.isLocked ? 'Locked' : 'Open'}
                  </button>

                  {saving && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
                  {saved && !saving && <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Saved</span>}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <p className="text-xs text-slate-400 dark:text-slate-500">
        Hidden pages are removed from the app's navigation. Locked pages stay visible but require
        staff approval before customers/partners can open them. Changes apply via{' '}
        <code>GET /api/v1/app-pages/state?app={app}</code>.
      </p>
    </div>
  )
}
