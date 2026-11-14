import api from '@/lib/api'

export type AnnouncementAudience = 'CUSTOMER' | 'PARTNER' | 'RIDE'
export type AnnouncementStatus = 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'SENT'

export interface AnnouncementStats {
  audience?: AnnouncementAudience[]
  recipients?: number
  notified?: number
  pushed?: number
  telegramSent?: number
  telegramFailed?: number
  telegramSkipped?: number
}

export interface Announcement {
  id: string
  title: string
  body: string
  audience: AnnouncementAudience[]
  status: AnnouncementStatus
  scheduled_at: string | null
  sent_at: string | null
  created_by: string | null
  stats: AnnouncementStats
  created_at: string
  updated_at: string
}

export interface AnnouncementListResponse {
  announcements: Announcement[]
  total: number
  page: number
  limit: number
}

export async function listAnnouncements(params?: {
  page?: number
  limit?: number
  status?: AnnouncementStatus
}): Promise<AnnouncementListResponse> {
  const { data } = await api.get<AnnouncementListResponse>('/admin/announcements', { params })
  return data
}

export async function createAnnouncement(payload: {
  title: string
  body: string
  audience: AnnouncementAudience[]
  action: 'draft' | 'schedule' | 'send'
  scheduledAt?: string
}): Promise<Announcement> {
  const { data } = await api.post<{ announcement: Announcement }>('/admin/announcements', payload)
  return data.announcement
}

export async function updateAnnouncement(
  id: string,
  payload: {
    title?: string
    body?: string
    audience?: AnnouncementAudience[]
    action?: 'draft' | 'schedule'
    scheduledAt?: string
  },
): Promise<Announcement> {
  const { data } = await api.put<{ announcement: Announcement }>(`/admin/announcements/${id}`, payload)
  return data.announcement
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await api.delete(`/admin/announcements/${id}`)
}

export async function publishAnnouncement(id: string): Promise<Announcement> {
  const { data } = await api.post<{ announcement: Announcement }>(`/admin/announcements/${id}/publish`)
  return data.announcement
}
