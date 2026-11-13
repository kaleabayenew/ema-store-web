import api from '@/lib/api'

export interface IntegrationCheckResult {
  ok: boolean
  configured?: boolean
  message?: string
}

/**
 * Asks the backend whether an API is configured and reachable.
 *
 * The backend endpoint is not built yet (phase 2). It must return only
 * booleans and a short message, never secret values.
 * Until then this request fails (404) and the page shows
 * "Check is not available yet".
 */
export async function checkIntegration(id: string): Promise<IntegrationCheckResult> {
  const { data } = await api.get<IntegrationCheckResult>(
    `/admin/integrations/${encodeURIComponent(id)}/check`,
  )
  return data
}