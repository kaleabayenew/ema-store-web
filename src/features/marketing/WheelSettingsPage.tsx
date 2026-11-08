import { useCallback, useEffect, useState } from 'react'
import { Settings, RefreshCw, Save, Loader2, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import api from '@/lib/api'

// ── Types ─────────────────────────────────────────────────────────────────────

interface WheelSlice {
  id: number
  sliceIndex: number
  label: string
  rewardType: 'COUPON' | 'COINS' | 'NONE'
  rewardValue: number
  probabilityWeight: number
  colorHex: string
  isActive: boolean
}

// ── Wheel Settings Page ───────────────────────────────────────────────────────

export function WheelSettingsPage() {
  const [slices, setSlices] = useState<WheelSlice[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSlices = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/marketing/admin/wheel-config')
      setSlices(res.data.slices ?? [])
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to load wheel configuration')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchSlices() }, [fetchSlices])

  const updateSlice = (index: number, field: keyof WheelSlice, value: any) => {
    const updated = [...slices]
    updated[index] = { ...updated[index], [field]: value }
    setSlices(updated)
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      await api.put('/marketing/admin/wheel-config', { slices })
      await fetchSlices()
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to save wheel configuration')
    } finally {
      setSaving(false)
    }
  }

  // ── Wheel Preview SVG ───────────────────────────────────────────────────────

  const totalWeight = slices.reduce((sum, s) => sum + (s.isActive ? s.probabilityWeight : 0), 0)
  let currentAngle = 0

  const pieSlices = slices.map((slice, i) => {
    if (!slice.isActive) return null

    const sliceAngle = (slice.probabilityWeight / totalWeight) * 360
    const startAngle = currentAngle
    const endAngle = currentAngle + sliceAngle
    currentAngle += sliceAngle

    const startRad = (startAngle - 90) * (Math.PI / 180)
    const endRad = (endAngle - 90) * (Math.PI / 180)

    const x1 = 50 + 45 * Math.cos(startRad)
    const y1 = 50 + 45 * Math.sin(startRad)
    const x2 = 50 + 45 * Math.cos(endRad)
    const y2 = 50 + 45 * Math.sin(endRad)

    const largeArcFlag = sliceAngle > 180 ? 1 : 0

    return (
      <g key={slice.id}>
        <path
          d={`M 50 50 L ${x1} ${y1} A 45 45 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
          fill={slice.colorHex}
          stroke="white"
          strokeWidth="1"
        />
        <text
          x={50 + 30 * Math.cos((startAngle + sliceAngle / 2 - 90) * (Math.PI / 180))}
          y={50 + 30 * Math.sin((startAngle + sliceAngle / 2 - 90) * (Math.PI / 180))}
          fill="white"
          fontSize="6"
          textAnchor="middle"
          dominantBaseline="middle"
          fontWeight="600"
        >
          {slice.label}
        </text>
      </g>
    )
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-brand-600">Marketing</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Lucky Spin Wheel Settings
          </h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchSlices} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Wheel Preview */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">Wheel Preview</h2>
          <div className="flex justify-center">
            <svg viewBox="0 0 100 100" className="h-64 w-64">
              {pieSlices}
              {/* Center circle */}
              <circle cx="50" cy="50" r="15" fill="white" stroke="#e2e8f0" strokeWidth="1" />
              {/* Pointer */}
              <polygon points="50,5 45,15 55,15" fill="#ef4444" />
            </svg>
          </div>
          <div className="mt-4 text-center text-sm text-slate-500">
            Total probability weight: {totalWeight}
          </div>
        </div>

        {/* Slices Editor */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 p-4 dark:border-slate-800">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Wheel Slices</h2>
          </div>
          <div className="max-h-[500px] overflow-y-auto p-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
              </div>
            ) : (
              <div className="space-y-4">
                {slices.map((slice, index) => (
                  <div
                    key={slice.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Slice {slice.sliceIndex}
                      </span>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={slice.isActive}
                          onChange={(e) => updateSlice(index, 'isActive', e.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                        />
                        <span className="text-xs text-slate-600 dark:text-slate-400">Active</span>
                      </label>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <Label className="text-xs">Label</Label>
                        <Input
                          value={slice.label}
                          onChange={(e) => updateSlice(index, 'label', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Reward Type</Label>
                        <select
                          value={slice.rewardType}
                          onChange={(e) => updateSlice(index, 'rewardType', e.target.value)}
                          className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                        >
                          <option value="COUPON">Coupon</option>
                          <option value="COINS">Coins</option>
                          <option value="NONE">None (Try Again)</option>
                        </select>
                      </div>
                      <div>
                        <Label className="text-xs">Reward Value</Label>
                        <Input
                          type="number"
                          value={slice.rewardValue}
                          onChange={(e) => updateSlice(index, 'rewardValue', parseFloat(e.target.value) || 0)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Probability Weight</Label>
                        <Input
                          type="number"
                          value={slice.probabilityWeight}
                          onChange={(e) => updateSlice(index, 'probabilityWeight', parseInt(e.target.value) || 0)}
                          className="mt-1"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <Label className="text-xs">Color</Label>
                        <div className="mt-1 flex gap-2">
                          <Input
                            type="color"
                            value={slice.colorHex}
                            onChange={(e) => updateSlice(index, 'colorHex', e.target.value)}
                            className="h-10 w-20 p-1"
                          />
                          <Input
                            value={slice.colorHex}
                            onChange={(e) => updateSlice(index, 'colorHex', e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
