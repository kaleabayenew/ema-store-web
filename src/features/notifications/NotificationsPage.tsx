import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Bell, Megaphone, Send, Users } from 'lucide-react'

const stats = [
  { label: 'Total notifications sent', value: '1,248', delta: '+18.2%', tone: 'success', icon: Bell },
  { label: 'Active FCM tokens', value: '4,821', delta: '+12.6%', tone: 'info', icon: Users },
  { label: 'Announcements this month', value: '12', delta: '+2', tone: 'warning', icon: Megaphone },
]

const recentAnnouncements = [
  { id: 'ANN-001', title: 'Flash Sale: 50% Off Fashion', body: 'Limited time offer on all fashion items from our top sellers.', target: 'All Users', sent: '2 hours ago', recipientCount: 4821 },
  { id: 'ANN-002', title: 'New Delivery Zone: Megenagna', body: 'We now deliver to Megenagna and surrounding areas. Enjoy faster delivery!', target: 'All Users', sent: '1 day ago', recipientCount: 4750 },
  { id: 'ANN-003', title: 'Partner Onboarding Bonus', body: 'New partners get 0% commission for the first month. Sign up now!', target: 'PARTNER', sent: '3 days ago', recipientCount: 184 },
]

export function NotificationsPage() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [targetRole, setTargetRole] = useState<'ALL' | 'CUSTOMER' | 'PARTNER' | 'ADMIN'>('ALL')
  const [isSending, setIsSending] = useState(false)

  const handleSend = async () => {
    if (!title || !body) return

    setIsSending(true)
    try {
      // TODO: Call backend API
      // await api.post('/api/v1/notifications/announce', { title, body, targetRole })
      
      console.log('Sending announcement:', { title, body, targetRole })
      
      // Reset form
      setTitle('')
      setBody('')
      setTargetRole('ALL')
      
      // Show success message
      alert('Announcement sent successfully!')
    } catch (error) {
      console.error('Failed to send announcement:', error)
      alert('Failed to send announcement. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-brand-600">Notification Management</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Notifications
          </h1>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map(({ label, value, delta, tone, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">{label}</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-300">
                <Icon className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-4 text-2xl font-semibold text-slate-900 dark:text-slate-100">{value}</p>
            <Badge variant={tone as 'success' | 'info' | 'warning'} className="mt-2">{delta}</Badge>
          </div>
        ))}
      </div>

      {/* Send Announcement Form */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">Send Announcement</h2>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter announcement title..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>

          <div>
            <label htmlFor="body" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Message
            </label>
            <textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Enter announcement message..."
              rows={4}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Target Audience
            </label>
            <div className="flex flex-wrap gap-2">
              {(['ALL', 'CUSTOMER', 'PARTNER', 'ADMIN'] as const).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setTargetRole(role)}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                    targetRole === role
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {role === 'ALL' ? 'All Users' : role.charAt(0) + role.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleSend}
            disabled={!title || !body || isSending}
            className="w-full"
          >
            {isSending ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Announcement
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Recent Announcements */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 p-4 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Recent Announcements</h2>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {recentAnnouncements.map((announcement) => (
            <div key={announcement.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                      {announcement.title}
                    </h3>
                    <Badge variant="default">{announcement.target}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {announcement.body}
                  </p>
                  <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                    <span>Sent: {announcement.sent}</span>
                    <span>Recipients: {announcement.recipientCount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
