import { useCallback, useEffect, useRef, useState } from 'react'
import { RefreshCw, Save, Loader2, Plus, Trash2, GripVertical } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/PageHeader'
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

// Reward slices keep their %; "Try Again" (NONE) slices automatically absorb
// whatever is left so the wheel always totals exactly 100. If the reward
// slices alone exceed 100 they are scaled down proportionally and try-again
// slices drop to 0. If there is no try-again slice and there is a remainder,
// one is appended automatically.
function balanceWithTryAgain(list: WheelSlice[], newId: () => number): WheelSlice[] {
  if (list.length === 0) return list
  const isTryAgain = (s: WheelSlice) => s.rewardType === 'NONE'
  const out = list.map((s) => ({ ...s }))
  const rewardSum = out.filter((s) => !isTryAgain(s)).reduce((a, s) => a + s.probabilityWeight, 0)
  const tryAgainIdx = out.map((s, i) => (isTryAgain(s) ? i : -1)).filter((i) => i >= 0)

  const fixTotal = (arr: WheelSlice[]) => {
    const total = arr.reduce((a, s) => a + s.probabilityWeight, 0)
    if (total === 100 || arr.length === 0) return arr
    let maxI = 0
    arr.forEach((s, i) => { if (s.probabilityWeight > arr[maxI].probabilityWeight) maxI = i })
    const fixed = arr.map((s) => ({ ...s }))
    fixed[maxI] = {
      ...fixed[maxI],
      probabilityWeight: Math.max(0, fixed[maxI].probabilityWeight + (100 - total)),
    }
    return fixed
  }

  if (rewardSum >= 100) {
    if (rewardSum > 0) {
      out.forEach((s, i) => {
        out[i] = isTryAgain(s)
          ? { ...s, probabilityWeight: 0 }
          : { ...s, probabilityWeight: Math.round((s.probabilityWeight / rewardSum) * 100) }
      })
    } else {
      out.forEach((s, i) => { out[i] = { ...s, probabilityWeight: 0 } })
      out[0] = { ...out[0], probabilityWeight: 100 }
    }
    return fixTotal(out)
  }

  const remainder = 100 - rewardSum
  if (tryAgainIdx.length > 0) {
    const each = Math.floor(remainder / tryAgainIdx.length)
    let leftover = remainder - each * tryAgainIdx.length
    tryAgainIdx.forEach((i) => {
      const w = each + (leftover > 0 ? 1 : 0)
      leftover = Math.max(0, leftover - 1)
      out[i] = { ...out[i], probabilityWeight: w }
    })
  } else if (remainder > 0) {
    out.push({
      id: newId(),
      sliceIndex: out.length + 1,
      label: 'Try Again',
      rewardType: 'NONE',
      rewardValue: 0,
      probabilityWeight: remainder,
      colorHex: '#94A3B8',
      isActive: true,
    })
  }
  return out
}

export function WheelSettingsPage() {
  const [slices, setSlices] = useState<WheelSlice[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState(0)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const [savedJson, setSavedJson] = useState('')
  const nextTempId = useRef(-1)

  const isDirty = JSON.stringify(slices) !== savedJson

  const WHEEL_COLORS = ['#0F6841', '#2563EB', '#DC2626', '#D97706', '#7C3AED', '#DB2777', '#0891B2', '#65A30D']

  const fetchSlices = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/marketing/admin/wheel-config')
      const loaded: WheelSlice[] = balanceWithTryAgain(res.data.slices ?? [], () => nextTempId.current--)
      setSlices(loaded)
      setSavedJson(JSON.stringify(loaded))
      setActiveTab((t) => Math.min(t, Math.max(0, loaded.length - 1)))
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

  // Set a reward slice's % — "Try Again" slices automatically absorb the
  // remainder so the total always stays exactly 100.
  const setSliceWeight = (index: number, raw: number) => {
    const value = Math.max(0, Math.min(100, Math.round(raw) || 0))
    const updated = slices.map((s) => ({ ...s }))
    updated[index] = { ...updated[index], probabilityWeight: value }
    setSlices(balanceWithTryAgain(updated, () => nextTempId.current--))
  }

  const addSlice = () => {
    const slice: WheelSlice = {
      id: nextTempId.current--,
      sliceIndex: slices.length + 1,
      label: `Slice ${slices.length + 1}`,
      rewardType: 'COINS',
      rewardValue: 10,
      probabilityWeight: 0,
      colorHex: WHEEL_COLORS[slices.length % WHEEL_COLORS.length],
      isActive: true,
    }
    // Try-again slices absorb the remainder, keeping the total at 100%.
    setSlices(balanceWithTryAgain([...slices, slice], () => nextTempId.current--))
    setActiveTab(slices.length)
  }

  const removeSlice = (index: number) => {
    const updated = balanceWithTryAgain(
      slices.filter((_, i) => i !== index),
      () => nextTempId.current--
    )
    setSlices(updated)
    setActiveTab((t) => Math.min(t, Math.max(0, updated.length - 1)))
  }

  const moveSlice = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0 || from >= slices.length || to >= slices.length) return
    const updated = [...slices]
    const [moved] = updated.splice(from, 1)
    updated.splice(to, 0, moved)
    setSlices(updated)
    setActiveTab(to)
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

  const pieSlices = slices.map((slice) => {
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
      <PageHeader
        eyebrow="Marketing"
        title="Lucky Spin Wheel Settings"
        actions={
          <>
            <Button variant="outline" onClick={fetchSlices} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={handleSave} disabled={saving || !isDirty}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {isDirty ? 'Save Changes' : 'Saved'}
            </Button>
          </>
        }
      />

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
              {/* Pointer — points downward */}
              <polygon points="50,95 45,85 55,85" fill="#ef4444" />
            </svg>
          </div>
          <div className="mt-4 text-center text-sm text-slate-500">
            Total probability: {totalWeight}% {totalWeight === 100 ? '✓' : '(must be 100)'}
          </div>
        </div>

        {/* Slices Editor */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 p-4 dark:border-slate-800">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Wheel Slices</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Drag tabs to reorder · click + to add a slice
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
            </div>
          ) : (
            <>
              {/* Slice tabs — draggable to reorder, "+" adds a new slice */}
              <div className="flex items-end gap-1 overflow-x-auto border-b border-slate-200 px-4 pt-3 dark:border-slate-800">
                {slices.map((slice, index) => {
                  const isActive = index === activeTab
                  const isDropTarget = dropIndex === index && dragIndex !== null && dragIndex !== index
                  return (
                    <button
                      key={slice.id}
                      type="button"
                      draggable
                      onDragStart={(e) => {
                        setDragIndex(index)
                        e.dataTransfer.effectAllowed = 'move'
                      }}
                      onDragEnd={() => { setDragIndex(null); setDropIndex(null) }}
                      onDragOver={(e) => { e.preventDefault(); setDropIndex(index) }}
                      onDrop={(e) => {
                        e.preventDefault()
                        if (dragIndex !== null) moveSlice(dragIndex, index)
                        setDragIndex(null)
                        setDropIndex(null)
                      }}
                      onClick={() => setActiveTab(index)}
                      className={`group flex shrink-0 cursor-grab items-center gap-1.5 rounded-t-lg border border-b-0 px-3 py-2 text-xs font-medium transition-colors active:cursor-grabbing ${
                        isActive
                          ? 'border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'
                          : 'border-transparent bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                      } ${isDropTarget ? 'ring-2 ring-brand-500' : ''}`}
                      title="Drag to reorder"
                    >
                      <GripVertical className="h-3 w-3 opacity-40" />
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: slice.colorHex }}
                      />
                      <span className="max-w-[90px] truncate">
                        {slice.label || `Slice ${index + 1}`}
                      </span>
                      <span className="text-[10px] font-semibold text-brand-600 dark:text-brand-400">
                        {slice.probabilityWeight}%
                      </span>
                      <span className="text-[10px] text-slate-400">{index + 1}</span>
                    </button>
                  )
                })}

                {/* Add-slice tab */}
                <button
                  type="button"
                  onClick={addSlice}
                  className="flex shrink-0 items-center gap-1 rounded-t-lg border border-b-0 border-dashed border-slate-300 px-3 py-2 text-xs font-medium text-brand-600 hover:bg-brand-50 dark:border-slate-600 dark:text-brand-400 dark:hover:bg-slate-800"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Slice
                </button>
              </div>

              {/* Editor for the selected slice */}
              <div className="max-h-[480px] overflow-y-auto p-4">
                {slices.length === 0 ? (
                  <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    No slices yet — click <span className="font-semibold">+ Add Slice</span> to create one.
                  </div>
                ) : (
                  (() => {
                    const slice = slices[Math.min(activeTab, slices.length - 1)]
                    const index = slices.indexOf(slice)
                    return (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Slice {index + 1}
                          </span>
                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={slice.isActive}
                                onChange={(e) => updateSlice(index, 'isActive', e.target.checked)}
                                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                              />
                              <span className="text-xs text-slate-600 dark:text-slate-400">Active</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => removeSlice(index)}
                              disabled={slices.length <= 1}
                              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-red-950/40"
                              title={slices.length <= 1 ? 'At least one slice is required' : 'Remove this slice'}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Remove
                            </button>
                          </div>
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
                              onChange={(e) => {
                                const updated = slices.map((s) => ({ ...s }))
                                updated[index] = { ...updated[index], rewardType: e.target.value as WheelSlice['rewardType'] }
                                setSlices(balanceWithTryAgain(updated, () => nextTempId.current--))
                              }}
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
                            <Label className="text-xs">Probability (%)</Label>
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              disabled={slice.rewardType === 'NONE'}
                              value={slice.probabilityWeight}
                              onChange={(e) => setSliceWeight(index, parseInt(e.target.value) || 0)}
                              className="mt-1"
                            />
                            <p className="mt-1 text-[11px] text-slate-400">
                              {slice.rewardType === 'NONE'
                                ? 'Try Again automatically gets the remaining %.'
                                : 'Reward slices keep their % — Try Again fills the rest to 100.'}
                            </p>
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
                    )
                  })()
                )}
              </div>

              {/* Save bar */}
              <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 dark:border-slate-800">
                <span className={`text-xs ${isDirty ? 'font-medium text-amber-600 dark:text-amber-400' : 'text-slate-400'}`}>
                  {isDirty ? '● Unsaved changes' : 'All changes saved'}
                </span>
                <Button onClick={handleSave} disabled={saving || !isDirty} size="sm">
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Wheel
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
