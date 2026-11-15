import { useCallback, useEffect, useState } from 'react'
import { Loader2, Pencil, Plus, RefreshCw, Tag, Trash2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import api from '@/lib/api'
import { apiErrorMessage } from '@/lib/errors'

interface AdminCoupon {
  id: string
  code: string
  discountType: 'PERCENT' | 'FIXED'
  discountValue: number
  minOrderCents: number
  maxDiscountCents: number
  expiresAt: string | null
  usageLimit: number
  usedCount: number
  claimedCount: number
  redeemedCount: number
  isActive: boolean
  createdAt: string
}

interface CouponForm {
  code: string
  discountType: 'PERCENT' | 'FIXED'
  discountValue: string
  minOrderBirr: string
  maxDiscountBirr: string
  expiresAt: string
  usageLimit: string
  isActive: boolean
}

const emptyForm: CouponForm = {
  code: '',
  discountType: 'PERCENT',
  discountValue: '',
  minOrderBirr: '',
  maxDiscountBirr: '',
  expiresAt: '',
  usageLimit: '1000',
  isActive: true,
}

const inputClass =
  'w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'

function toLocalInput(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function CouponsTab() {
  const confirmDialog = useConfirm()
  const [coupons, setCoupons] = useState<AdminCoupon[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [editing, setEditing] = useState<AdminCoupon | null>(null)
  const [form, setForm] = useState<CouponForm>(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const fetchCoupons = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/marketing/admin/coupons')
      setCoupons(res.data.coupons ?? [])
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to load coupons'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCoupons()
  }, [fetchCoupons])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setFormError(null)
    setShowDialog(true)
  }

  const openEdit = (c: AdminCoupon) => {
    setEditing(c)
    setForm({
      code: c.code,
      discountType: c.discountType,
      discountValue: String(c.discountValue),
      minOrderBirr: c.minOrderCents ? String(c.minOrderCents / 100) : '',
      maxDiscountBirr: c.maxDiscountCents ? String(c.maxDiscountCents / 100) : '',
      expiresAt: toLocalInput(c.expiresAt),
      usageLimit: String(c.usageLimit ?? 1000),
      isActive: c.isActive,
    })
    setFormError(null)
    setShowDialog(true)
  }

  const closeDialog = () => {
    if (submitting) return
    setShowDialog(false)
    setEditing(null)
    setFormError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    const code = form.code.trim().toUpperCase()
    const value = Number(form.discountValue)
    if (!code) return setFormError('Coupon code is required.')
    if (!Number.isFinite(value) || value <= 0) return setFormError('Discount value must be a positive number.')
    if (form.discountType === 'PERCENT' && value > 100) return setFormError('Percent discount cannot exceed 100.')

    const payload = {
      code,
      discountType: form.discountType,
      discountValue: value,
      minOrderCents: Math.round((Number(form.minOrderBirr) || 0) * 100),
      maxDiscountCents: Math.round((Number(form.maxDiscountBirr) || 0) * 100),
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      usageLimit: Math.max(0, Math.round(Number(form.usageLimit) || 0)),
      isActive: form.isActive,
    }

    setSubmitting(true)
    try {
      if (editing) {
        await api.patch(`/marketing/admin/coupons/${editing.id}`, payload)
      } else {
        await api.post('/marketing/admin/coupons', payload)
      }
      setShowDialog(false)
      setEditing(null)
      await fetchCoupons()
    } catch (err) {
      setFormError(apiErrorMessage(err, 'Failed to save coupon'))
    } finally {
      setSubmitting(false)
    }
  }

  const toggleActive = async (c: AdminCoupon) => {
    try {
      await api.patch(`/marketing/admin/coupons/${c.id}`, { isActive: !c.isActive })
      await fetchCoupons()
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to update coupon'))
    }
  }

  const handleDelete = async (c: AdminCoupon) => {
    const ok = await confirmDialog({
      title: 'Delete coupon',
      message: `Delete coupon "${c.code}"? Customers who claimed it will lose it.`,
      confirmText: 'Delete',
      danger: true,
    })
    if (!ok) return
    try {
      await api.delete(`/marketing/admin/coupons/${c.id}`)
      await fetchCoupons()
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to delete coupon'))
    }
  }

  const statusOf = (c: AdminCoupon) => {
    if (!c.isActive) return { label: 'Inactive', variant: 'default' as const }
    if (c.expiresAt && new Date(c.expiresAt) < new Date()) return { label: 'Expired', variant: 'danger' as const }
    if (c.usageLimit > 0 && c.usedCount >= c.usageLimit) return { label: 'Exhausted', variant: 'warning' as const }
    return { label: 'Active', variant: 'success' as const }
  }

  const discountLabel = (c: AdminCoupon) =>
    c.discountType === 'PERCENT' ? `${c.discountValue}% off` : `ETB ${c.discountValue} off`

  return (
    <div>
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Coupons</h2>
          <p className="text-xs text-slate-500">Customers claim these on the app, then apply them at checkout.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchCoupons} disabled={loading}>
            <RefreshCw className={`mr-1 h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-1 h-3.5 w-3.5" /> New coupon
          </Button>
        </div>
      </div>

      {error && (
        <div className="m-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left dark:border-slate-800">
              {['Code', 'Discount', 'Min. order', 'Max discount', 'Used / Claimed', 'Expires', 'Status', ''].map((h) => (
                <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-10 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-brand-600" /></td></tr>
            ) : coupons.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-500">No coupons yet — create one or let customers win them on the spin wheel.</td></tr>
            ) : coupons.map((c) => {
              const st = statusOf(c)
              return (
                <tr key={c.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-mono font-bold text-brand-700 dark:text-brand-300">{c.code}</td>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{discountLabel(c)}</td>
                  <td className="px-4 py-3 text-slate-500">{c.minOrderCents ? `ETB ${(c.minOrderCents / 100).toFixed(0)}` : '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{c.maxDiscountCents ? `ETB ${(c.maxDiscountCents / 100).toFixed(0)}` : '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                        <div className="h-full rounded-full bg-brand-500" style={{ width: `${Math.min(c.usageLimit > 0 ? (c.usedCount / c.usageLimit) * 100 : 0, 100)}%` }} />
                      </div>
                      <span className="text-xs text-slate-500">{c.usedCount} used · {c.claimedCount} claimed</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : 'Never'}</td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => toggleActive(c)} title="Click to toggle">
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(c)} title="Edit">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(c)} title="Delete" className="text-red-500 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {showDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={closeDialog}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="border-b border-slate-200 p-4 dark:border-slate-800">
              <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-100">
                <Tag className="h-4 w-4 text-brand-600" />
                {editing ? 'Edit coupon' : 'New coupon'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 p-4">
              {formError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
                  {formError}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="cp-code">Code</Label>
                  <Input id="cp-code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="EID25" className="mt-1 font-mono" maxLength={50} />
                </div>
                <div>
                  <Label htmlFor="cp-type">Type</Label>
                  <select
                    id="cp-type"
                    value={form.discountType}
                    onChange={(e) => setForm({ ...form, discountType: e.target.value as CouponForm['discountType'] })}
                    className={`${inputClass} mt-1`}
                  >
                    <option value="PERCENT">Percent off</option>
                    <option value="FIXED">Birr off</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="cp-value">{form.discountType === 'PERCENT' ? 'Percent (1-100)' : 'Amount (Birr)'}</Label>
                  <Input id="cp-value" type="number" min="0" step="0.01" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="cp-limit">Usage limit (0 = unlimited)</Label>
                  <Input id="cp-limit" type="number" min="0" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="cp-min">Min. order (Birr)</Label>
                  <Input id="cp-min" type="number" min="0" value={form.minOrderBirr} onChange={(e) => setForm({ ...form, minOrderBirr: e.target.value })} placeholder="0" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="cp-max">Max discount (Birr, 0 = none)</Label>
                  <Input id="cp-max" type="number" min="0" value={form.maxDiscountBirr} onChange={(e) => setForm({ ...form, maxDiscountBirr: e.target.value })} placeholder="0" className="mt-1" />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="cp-exp">Expiry date (optional)</Label>
                  <Input id="cp-exp" type="datetime-local" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className="mt-1" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                Active (customers can claim &amp; use it)
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={closeDialog} disabled={submitting}>Cancel</Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Saving...' : editing ? 'Save changes' : 'Create coupon'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
