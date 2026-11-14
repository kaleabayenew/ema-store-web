import { useEffect, useRef, useState } from 'react'
import { Trash2, Edit, Loader2, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import { maxLength, required, validate } from '@/lib/validate'
import api from '@/lib/api'

interface AboutContent {
  id: string
  title: string
  description: string
  mission: string
  vision: string
  values: string
  story: string
  image_url: string
  contact_email: string
  contact_phone: string
  social_links: Record<string, string>
  is_active: boolean
  created_at: string
  updated_at: string
}

// ─── Image field: URL input + file upload button ───────────────────────────────
function ImageField({
  value,
  onChange,
}: {
  value: string
  onChange: (url: string) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setUploadError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('folder', 'about')

      const res = await api.post('/upload', form)
      onChange(res.data.url)
    } catch (err: any) {
      setUploadError(err.response?.data?.message ?? 'Upload failed')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://example.com/about-image.jpg"
          className="flex-1"
        />
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 px-3"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
          title="Upload image from computer"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </Button>
      </div>

      {uploadError && (
        <p className="text-xs text-red-500">{uploadError}</p>
      )}

      {value && (
        <div className="relative h-32 w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
          <img
            src={value}
            alt="Preview"
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none'
            }}
          />
        </div>
      )}
    </div>
  )
}

// ─── Form fields shared between add & edit dialogs ────────────────────────────
function AboutForm({
  formData,
  onChange,
}: {
  formData: {
    title: string
    description: string
    mission: string
    vision: string
    values: string
    story: string
    image_url: string
    contact_email: string
    contact_phone: string
    social_links: Record<string, string>
  }
  onChange: (patch: Partial<typeof formData>) => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="a-title">Title</Label>
        <Input
          id="a-title"
          value={formData.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="e.g., About Ema Store"
        />
      </div>

      <div>
        <Label htmlFor="a-description">Description</Label>
        <Textarea
          id="a-description"
          value={formData.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Brief description of Ema Store"
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="a-mission">Mission</Label>
        <Textarea
          id="a-mission"
          value={formData.mission}
          onChange={(e) => onChange({ mission: e.target.value })}
          placeholder="Our mission statement"
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="a-vision">Vision</Label>
        <Textarea
          id="a-vision"
          value={formData.vision}
          onChange={(e) => onChange({ vision: e.target.value })}
          placeholder="Our vision statement"
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="a-values">Values</Label>
        <Textarea
          id="a-values"
          value={formData.values}
          onChange={(e) => onChange({ values: e.target.value })}
          placeholder="Our core values (one per line)"
          rows={4}
        />
      </div>

      <div>
        <Label htmlFor="a-story">Our Story</Label>
        <Textarea
          id="a-story"
          value={formData.story}
          onChange={(e) => onChange({ story: e.target.value })}
          placeholder="The story of Ema Store"
          rows={5}
        />
      </div>

      <div>
        <Label>Cover Image</Label>
        <ImageField
          value={formData.image_url}
          onChange={(url) => onChange({ image_url: url })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="a-email">Contact Email</Label>
          <Input
            id="a-email"
            type="email"
            value={formData.contact_email}
            onChange={(e) => onChange({ contact_email: e.target.value })}
            placeholder="contact@emastore.com"
          />
        </div>
        <div>
          <Label htmlFor="a-phone">Contact Phone</Label>
          <Input
            id="a-phone"
            value={formData.contact_phone}
            onChange={(e) => onChange({ contact_phone: e.target.value })}
            placeholder="+251 911 234 567"
          />
        </div>
      </div>

      <div>
        <Label>Social Media Links</Label>
        <div className="space-y-2">
          <Input
            value={formData.social_links.facebook || ''}
            onChange={(e) => onChange({ social_links: { ...formData.social_links, facebook: e.target.value } })}
            placeholder="Facebook URL"
          />
          <Input
            value={formData.social_links.twitter || ''}
            onChange={(e) => onChange({ social_links: { ...formData.social_links, twitter: e.target.value } })}
            placeholder="Twitter/X URL"
          />
          <Input
            value={formData.social_links.instagram || ''}
            onChange={(e) => onChange({ social_links: { ...formData.social_links, instagram: e.target.value } })}
            placeholder="Instagram URL"
          />
          <Input
            value={formData.social_links.linkedin || ''}
            onChange={(e) => onChange({ social_links: { ...formData.social_links, linkedin: e.target.value } })}
            placeholder="LinkedIn URL"
          />
        </div>
      </div>
    </div>
  )
}

// ─── Empty form helper ─────────────────────────────────────────────────────────
const emptyForm = () => ({
  title: '',
  description: '',
  mission: '',
  vision: '',
  values: '',
  story: '',
  image_url: '',
  contact_email: '',
  contact_phone: '',
  social_links: {},
})

// ─── Main page ─────────────────────────────────────────────────────────────────
export function AboutPage() {
  const confirmDialog = useConfirm()
  const [contents, setContents] = useState<AboutContent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingContent, setEditingContent] = useState<AboutContent | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState(emptyForm())

  const fetchContents = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get('/about/all')
      setContents((response.data.content ?? []) as AboutContent[])
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to load about content')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    setError(null)
    const err = validate(
      required(formData.title, 'Title'),
      maxLength(formData.title, 255, 'Title'),
      maxLength(formData.description, 1000, 'Description'),
      maxLength(formData.mission, 2000, 'Mission'),
      maxLength(formData.vision, 2000, 'Vision'),
      maxLength(formData.values, 2000, 'Values'),
      maxLength(formData.story, 5000, 'Story'),
    )
    if (err) { setError(err); return }
    setSubmitting(true)
    try {
      if (editingContent) {
        await api.patch(`/about/${editingContent.id}`, { ...formData, is_active: true })
      } else {
        await api.post('/about', { ...formData, is_active: true })
      }
      await fetchContents()
      setShowAddDialog(false)
      setShowEditDialog(false)
      setEditingContent(null)
      setFormData(emptyForm())
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to save about content')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (content: AboutContent) => {
    setEditingContent(content)
    setFormData({
      title: content.title,
      description: content.description,
      mission: content.mission,
      vision: content.vision,
      values: content.values,
      story: content.story,
      image_url: content.image_url,
      contact_email: content.contact_email,
      contact_phone: content.contact_phone,
      social_links: content.social_links || {},
    })
    setShowEditDialog(true)
  }

  const handleDelete = async (id: string) => {
    const ok = await confirmDialog({
      title: 'Delete this about content?',
      message: 'This about content will be removed permanently.',
      confirmText: 'Delete',
      variant: 'danger',
    })
    if (!ok) return
    try {
      await api.delete(`/about/${id}`)
      await fetchContents()
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to delete about content')
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString()
  }

  useEffect(() => {
    fetchContents()
  }, [])

  if (loading && contents.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-brand-600">Content management</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">About Ema Store</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchContents} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Refresh
          </Button>
          <Button onClick={() => {
            setEditingContent(null)
            setFormData(emptyForm())
            setShowAddDialog(true)
          }}>
            Add Content
          </Button>
        </div>
      </div>

      {error && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left dark:border-slate-800">
                {['Title', 'Status', 'Updated', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {contents.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-slate-400">
                    No about content found.
                  </td>
                </tr>
              )}
              {contents.map((content) => (
                <tr key={content.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{content.title}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${content.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                      {content.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{formatDate(content.updated_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(content)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(content.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowAddDialog(false)}>
          <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">Add About Content</h2>
            <AboutForm
              formData={formData}
              onChange={(patch) => setFormData((prev) => ({ ...prev, ...patch }))}
            />
            <div className="flex gap-2 justify-end mt-6">
              <Button variant="outline" onClick={() => setShowAddDialog(false)} disabled={submitting}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {submitting ? 'Saving...' : 'Save Content'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      {showEditDialog && editingContent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowEditDialog(false)}>
          <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">Edit About Content</h2>
            <AboutForm
              formData={formData}
              onChange={(patch) => setFormData((prev) => ({ ...prev, ...patch }))}
            />
            <div className="flex gap-2 justify-end mt-6">
              <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={submitting}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {submitting ? 'Saving...' : 'Update Content'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}