import { useCallback, useEffect, useMemo, useState } from 'react'
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet'
import { latLng, latLngBounds } from 'leaflet'
import { AlertCircle, Loader2, MapPin, RefreshCw, Search, Store, Users } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatsCard } from '@/components/ui/StatsCard'
import api from '@/lib/api'

import 'leaflet/dist/leaflet.css'

type LocationKind = 'partner' | 'customer'

interface MapLocation {
  id: string
  kind: LocationKind
  name: string
  detail: string
  lat: number
  lng: number
  active?: boolean
  verified?: boolean
  updatedAt?: string
}

interface LocationsResponse {
  locations: MapLocation[]
  counts: { partners: number; customers: number; total: number }
}

type LocationFilter = 'all' | LocationKind

const ADDIS_ABABA: [number, number] = [9.03, 38.74]

function getErrorMessage(requestError: unknown): string {
  if (
    typeof requestError === 'object' &&
    requestError !== null &&
    'response' in requestError &&
    typeof requestError.response === 'object' &&
    requestError.response !== null &&
    'data' in requestError.response &&
    typeof requestError.response.data === 'object' &&
    requestError.response.data !== null &&
    'message' in requestError.response.data &&
    typeof requestError.response.data.message === 'string'
  ) {
    return requestError.response.data.message
  }
  return 'Could not load map locations.'
}

function FitLocations({ locations }: { locations: MapLocation[] }) {
  const map = useMap()

  useEffect(() => {
    if (locations.length === 0) {
      map.setView(ADDIS_ABABA, 6)
      return
    }
    if (locations.length === 1) {
      map.setView([locations[0].lat, locations[0].lng], 13)
      return
    }
    map.fitBounds(
      latLngBounds(locations.map((location) => latLng(location.lat, location.lng))),
      { padding: [36, 36], maxZoom: 12 },
    )
  }, [locations, map])

  return null
}

export function LocationsMapPage() {
  const [locations, setLocations] = useState<MapLocation[]>([])
  const [counts, setCounts] = useState({ partners: 0, customers: 0, total: 0 })
  const [filter, setFilter] = useState<LocationFilter>('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const requestLocations = useCallback(
    () => api.get<LocationsResponse>('/admin/locations'),
    [],
  )

  const syncResponse = useCallback((response: { data: LocationsResponse }) => {
    setLocations(response.data.locations ?? [])
    setCounts(response.data.counts ?? { partners: 0, customers: 0, total: 0 })
  }, [])

  const loadLocations = useCallback(() => {
    setLoading(true)
    setError(null)
    void requestLocations()
      .then(syncResponse)
      .catch((requestError: unknown) => setError(getErrorMessage(requestError)))
      .finally(() => setLoading(false))
  }, [requestLocations, syncResponse])

  useEffect(() => {
    let active = true
    requestLocations()
      .then((response) => {
        if (active) syncResponse(response)
      })
      .catch((requestError: unknown) => {
        if (active) setError(getErrorMessage(requestError))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [requestLocations, syncResponse])

  const visibleLocations = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()
    return locations.filter((location) =>
      (filter === 'all' || location.kind === filter) &&
      (!query || `${location.name} ${location.detail}`.toLocaleLowerCase().includes(query)),
    )
  }, [filter, locations, search])

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operations"
        title="Partner & customer map"
        description="Partner shop pins and each customer’s latest pinned delivery location."
        actions={
          <Button variant="outline" onClick={loadLocations} disabled={loading}>
            {loading
              ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard label="All locations" value={counts.total} icon={MapPin} iconClassName="text-brand-600" loading={loading} />
        <StatsCard label="Partner shops" value={counts.partners} icon={Store} iconClassName="text-emerald-600" loading={loading} />
        <StatsCard label="Customer delivery pins" value={counts.customers} icon={Users} iconClassName="text-sky-600" loading={loading} />
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {([
              ['all', 'All'],
              ['partner', 'Partners'],
              ['customer', 'Customers'],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                  filter === value
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <label className="relative block w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name or city"
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </label>
        </div>

        {error && (
          <div role="alert" className="flex items-center gap-2 border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="relative h-[min(72vh,720px)] min-h-[420px]">
          {loading && locations.length === 0 ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 dark:bg-slate-900/70">
              <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
            </div>
          ) : null}
          <MapContainer
            center={ADDIS_ABABA}
            zoom={6}
            scrollWheelZoom
            className="h-full w-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FitLocations locations={visibleLocations} />
            {visibleLocations.map((location) => {
              const isPartner = location.kind === 'partner'
              const color = isPartner ? '#16a34a' : '#0284c7'
              return (
                <CircleMarker
                  key={location.id}
                  center={[location.lat, location.lng]}
                  radius={9}
                  pathOptions={{ color, fillColor: color, fillOpacity: 0.85, weight: 2 }}
                >
                  <Popup>
                    <div className="min-w-40">
                      <p className="font-semibold">{location.name}</p>
                      <p className="text-xs capitalize text-slate-500">{location.kind} · {location.detail}</p>
                      {isPartner ? (
                        <p className="mt-1 text-xs text-slate-500">
                          {location.verified ? 'Verified' : 'Not verified'} · {location.active ? 'Active' : 'Inactive'}
                        </p>
                      ) : location.updatedAt ? (
                        <p className="mt-1 text-xs text-slate-500">
                          Pin from {new Date(location.updatedAt).toLocaleDateString()}
                        </p>
                      ) : null}
                    </div>
                  </Popup>
                </CircleMarker>
              )
            })}
          </MapContainer>
        </div>

        <div className="flex flex-col gap-2 border-t border-slate-200 px-4 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <span>Showing {visibleLocations.length} of {counts.total} saved map pins.</span>
          <span>Only saved coordinates are mapped; customer addresses are not sent for external geocoding.</span>
        </div>
      </section>
    </div>
  )
}
