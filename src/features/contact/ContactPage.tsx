import { useEffect, useState } from 'react'
import { Camera, Globe, Mail, MapPin, MessageCircle, Phone, Send, Clock } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { PageHeader } from '@/components/ui/PageHeader'
import api from '@/lib/api'
import { apiErrorMessage } from '@/lib/errors'

interface ContactSettings {
  hotline_phone: string
  sos_phone: string
  telegram: string
  whatsapp: string
  facebook: string
  instagram: string
  email: string
  website: string
  address: string
  working_hours: string
  updated_at?: string
}

const EMPTY: ContactSettings = {
  hotline_phone: '',
  sos_phone: '',
  telegram: '',
  whatsapp: '',
  facebook: '',
  instagram: '',
  email: '',
  website: '',
  address: '',
  working_hours: '',
}

const FIELDS: { key: keyof ContactSettings; label: string; icon: typeof Phone; placeholder: string; textarea?: boolean }[] = [
  { key: 'hotline_phone', label: 'Hotline phone', icon: Phone, placeholder: '+2519XXXXXXXX' },
  { key: 'sos_phone', label: 'SOS / emergency number', icon: Phone, placeholder: '+2519XXXXXXXX' },
  { key: 'telegram', label: 'Telegram', icon: Send, placeholder: '@emastore_support or https://t.me/…' },
  { key: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, placeholder: '+2519XXXXXXXX' },
  { key: 'facebook', label: 'Facebook', icon: Globe, placeholder: 'https://facebook.com/…' },
  { key: 'instagram', label: 'Instagram', icon: Camera, placeholder: 'https://instagram.com/…' },
  { key: 'email', label: 'Email', icon: Mail, placeholder: 'support@emastore.et' },
  { key: 'website', label: 'Website', icon: Globe, placeholder: 'https://emastore.et' },
  { key: 'working_hours', label: 'Working hours', icon: Clock, placeholder: '24/7 or Sat–Thu 8:00–18:00' },
  { key: 'address', label: 'Address', icon: MapPin, placeholder: 'Addis Ababa, Ethiopia', textarea: true },
]

export function ContactPage() {
  const [form, setForm] = useState<ContactSettings>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchContact = async () => {
    setLoading(true)
    try {
      const res = await api.get('/contact/admin')
      setForm({ ...EMPTY, ...((res.data?.data ?? {}) as ContactSettings) })
    } catch (err) {
      setMessage({ type: 'error', text: apiErrorMessage(err, 'Failed to load contact settings') })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void fetchContact() }, [])

  const save = async () => {
    setSaving(true)
    setMessage(null)
    try {
      await api.put('/contact/admin', form)
      setMessage({ type: 'success', text: 'Contact settings saved — apps will show the new details on next load.' })
    } catch (err) {
      setMessage({ type: 'error', text: apiErrorMessage(err, 'Failed to save contact settings') })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Communication"
        title="Contact Us"
        description="Phone numbers, social links and support channels shown inside the customer, partner and ride apps."
        actions={
          <Button onClick={save} disabled={saving || loading}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        }
      />

      {message && (
        <div className={`rounded-xl border px-4 py-2 text-sm ${
          message.type === 'success'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300'
            : 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-5 text-base font-semibold text-slate-900 dark:text-slate-100">Contact channels</h2>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {FIELDS.filter((f) => !f.textarea).map((f) => {
                const Icon = f.icon
                return (
                  <div key={f.key}>
                    <Label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                      <Icon className="h-3.5 w-3.5 text-slate-400" />
                      {f.label}
                    </Label>
                    <Input
                      value={String(form[f.key] ?? '')}
                      onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                    />
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-5 text-base font-semibold text-slate-900 dark:text-slate-100">Location & hours</h2>
            {loading ? (
              <div className="space-y-4">
                <div className="h-20 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700" />
                <div className="h-10 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700" />
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Address</Label>
                  <Textarea
                    rows={3}
                    value={form.address}
                    onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                    placeholder="Addis Ababa, Ethiopia"
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Working hours</Label>
                  <Input
                    value={form.working_hours}
                    onChange={(e) => setForm((p) => ({ ...p, working_hours: e.target.value }))}
                    placeholder="24/7 or Sat–Thu 8:00–18:00"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-red-200 bg-red-50/60 p-5 shadow-sm dark:border-red-900 dark:bg-red-950/20">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-red-700 dark:text-red-300">
              <Phone className="h-4 w-4" /> Emergency SOS
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              The SOS number is what the ride app dials when a rider taps the emergency button.
            </p>
            <div className="mt-3">
              <Label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">SOS number</Label>
              <Input
                value={form.sos_phone}
                onChange={(e) => setForm((p) => ({ ...p, sos_phone: e.target.value }))}
                placeholder="+2519XXXXXXXX"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
