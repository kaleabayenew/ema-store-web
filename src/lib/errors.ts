// Sanitizes backend error text before it reaches the UI or console.
// Strips absolute URLs (including the API host), stack traces and control
// characters so users never see internal addresses like
// https://ema-store-backend.onrender.com/... in toasts or logs.

const URL_RE = /https?:\/\/[^\s"'<>]+/gi
const STACK_RE = /\n\s*at\s+[^\n]+/g

export function sanitizeErrorMessage(
  input: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  if (typeof input !== 'string' || input.trim().length === 0) return fallback
  let out = input
    .replace(URL_RE, '')
    .replace(STACK_RE, '')
    // Collapse artifacts left by removed URLs: "at /path", dangling punctuation
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([.,;:!?])/g, '$1')
    .replace(/^[\s.,;:!?-]+|[\s.,;:!?-]+$/g, '')
    .trim()
  return out.length > 0 ? out : fallback
}

/** Pull a safe message out of an axios-style error. */
export function apiErrorMessage(
  err: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  const e = err as {
    response?: { data?: { message?: unknown } }
    message?: unknown
  }
  const fromBody = sanitizeErrorMessage(e?.response?.data?.message, '')
  if (fromBody) return fromBody
  // Axios messages ("Request failed with status code 500", "Network Error",
  // timeouts) contain no URLs — sanitize is a no-op safety net here.
  const fromErr = sanitizeErrorMessage(e?.message, '')
  return fromErr || fallback
}
