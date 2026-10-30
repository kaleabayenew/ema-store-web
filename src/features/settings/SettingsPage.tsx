import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const auditLogs = [
  { id: 'AL-001', admin: 'Aster Bekele',  action: 'PARTNER_APPROVED',  entity: 'Partner',  detail: 'Henok Organics approved',          time: '12 Jul, 14:22' },
  { id: 'AL-002', admin: 'Aster Bekele',  action: 'PRODUCT_REJECTED',  entity: 'Product',  detail: 'Ethiopian Cookbook 2nd Ed rejected',time: '12 Jul, 13:10' },
  { id: 'AL-003', admin: 'Biruk Mesfin',  action: 'COMMISSION_UPDATED', entity: 'Settings', detail: 'Commission rate changed 10% → 12.5%',time: '11 Jul, 10:45' },
  { id: 'AL-004', admin: 'Mekdes Alemu',  action: 'PRODUCT_APPROVED',  entity: 'Product',  detail: 'Moringa Leaf Powder approved',      time: '11 Jul, 09:30' },
  { id: 'AL-005', admin: 'Aster Bekele',  action: 'USER_CREATED',      entity: 'User',     detail: 'New user Yonas Girma (MANAGEMENT)', time: '10 Jul, 16:00' },
  { id: 'AL-006', admin: 'Aster Bekele',  action: 'COUPON_CREATED',    entity: 'Marketing',detail: 'Coupon EMA10 created',              time: '9 Jul, 11:20' },
]

const actionColors: Record<string, string> = {
  PARTNER_APPROVED:   'text-emerald-600 dark:text-emerald-400',
  PRODUCT_REJECTED:   'text-red-500',
  COMMISSION_UPDATED: 'text-amber-600 dark:text-amber-400',
  PRODUCT_APPROVED:   'text-emerald-600 dark:text-emerald-400',
  USER_CREATED:       'text-sky-600 dark:text-sky-400',
  COUPON_CREATED:     'text-purple-600 dark:text-purple-400',
}

const tabs = [
  { id: 'general',       label: 'General',      icon: Wrench },
  { id: 'commission',    label: 'Commission',   icon: CreditCard },
  { id: 'notifications', label: 'Notifications',icon: Bell },
  { id: 'security',      label: 'Security',     icon: Lock },
  { id: 'audit',         label: 'Audit Log',    icon: FileText },
]

export function SettingsPage() {
  const [tab, setTab] = useState('general')
  const [commission, setCommission] = useState('12.5')
  const [deliveryFee, setDeliveryFee] = useState('60')
  const [minOrder, setMinOrder] = useState('100')
  const [storeName, setStoreName] = useState('Ema Store')
  const [supportEmail, setSupportEmail] = useState('support@emastore.et')
  const [locale, setLocale] = useState('en')

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-brand-600">System configuration</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Settings</h1>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[220px_1fr]">
        {/* Sidebar tabs */}
        <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900 h-fit">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" onClick={() => setTab(id)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${tab === id ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/30 dark:text-brand-300' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}>
              <Icon className="h-4 w-4" />{label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {tab === 'general' && (
            <div className="space-y-5 max-w-lg">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">General settings</h2>
              {[
                { label: 'Store name',     value: storeName,     set: setStoreName,    type: 'text' },
                { label: 'Support email',  value: supportEmail,  set: setSupportEmail, type: 'email' },
              ].map(({ label, value, set, type }) => (
                <div key={label} className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</label>
                  <input type={type} value={value} onChange={(e) => set(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
                </div>
              ))}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Default language</label>
                <select value={locale} onChange={(e) => setLocale(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
                  <option value="en">English</option>
                  <option value="am">አማርኛ (Amharic)</option>
                  <option value="om">Afaan Oromoo</option>
                </select>
              </div>
              <Button className="gap-2"><Save className="h-4 w-4" />Save changes</Button>
            </div>
          )}

          {tab === 'commission' && (
            <div className="space-y-5 max-w-lg">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Commission & fee settings</h2>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                Changes here apply platform-wide. Partner-level overrides are set per partner.
              </div>
              {[
                { label: 'Platform commission (%)', value: commission, set: setCommission, hint: 'Default 12.5%' },
                { label: 'Base delivery fee (ETB)',  value: deliveryFee, set: setDeliveryFee, hint: 'Per zone override available' },
                { label: 'Min. order amount (ETB)',  value: minOrder,    set: setMinOrder,   hint: 'Orders below this amount are rejected' },
              ].map(({ label, value, set, hint }) => (
                <div key={label} className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</label>
                  <input type="number" value={value} onChange={(e) => set(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
                  <p className="text-xs text-slate-400">{hint}</p>
                </div>
              ))}
              <Button className="gap-2"><Save className="h-4 w-4" />Save changes</Button>
            </div>
          )}

          {tab === 'notifications' && (
            <div className="space-y-4 max-w-lg">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Notification settings</h2>
              {[
                'New partner applications',
                'New product submissions',
                'High-value orders (> ETB 5,000)',
                'Refund requests',
                'Rider offline alerts',
                'Daily revenue digest',
              ].map((item) => (
                <label key={item} className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                  <span className="text-sm text-slate-800 dark:text-slate-200">{item}</span>
                  <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-300 accent-brand-600" />
                </label>
              ))}
              <Button className="gap-2"><Save className="h-4 w-4" />Save changes</Button>
            </div>
          )}

          {tab === 'security' && (
            <div className="space-y-5 max-w-lg">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Security</h2>
              {[
                { label: 'Require 2FA for all admins',          checked: true },
                { label: 'Session timeout after 8 hours',       checked: true },
                { label: 'Alert on login from new IP',          checked: false },
                { label: 'Block login after 5 failed attempts', checked: true },
              ].map(({ label, checked }) => (
                <label key={label} className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                  <span className="text-sm text-slate-800 dark:text-slate-200">{label}</span>
                  <input type="checkbox" defaultChecked={checked} className="h-4 w-4 rounded border-slate-300 accent-brand-600" />
                </label>
              ))}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Change master password</label>
                <input type="password" placeholder="New password" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
              </div>
              <Button className="gap-2"><Shield className="h-4 w-4" />Save security settings</Button>
            </div>
          )}

          {tab === 'audit' && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Audit log</h2>
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left dark:border-slate-700">
                      {['ID', 'Admin', 'Action', 'Entity', 'Detail', 'Time'].map((h) => (
                        <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-4 py-3 font-mono text-xs text-slate-400">{log.id}</td>
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{log.admin}</td>
                        <td className="px-4 py-3"><span className={`text-xs font-semibold ${actionColors[log.action] ?? 'text-slate-500'}`}>{log.action.replace(/_/g, ' ')}</span></td>
                        <td className="px-4 py-3"><Badge variant="default">{log.entity}</Badge></td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{log.detail}</td>
                        <td className="px-4 py-3 text-slate-400 text-xs">{log.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
