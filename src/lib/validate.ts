/**
 * Shared validation helpers used across all forms.
 * All functions return an error string or null (valid).
 */

export type ValidationError = string | null

// ── Primitives ────────────────────────────────────────────────────────────────

export function required(value: string, field = 'This field'): ValidationError {
  return value.trim() ? null : `${field} is required.`
}

export function minLength(value: string, min: number, field = 'This field'): ValidationError {
  return value.trim().length >= min ? null : `${field} must be at least ${min} characters.`
}

export function maxLength(value: string, max: number, field = 'This field'): ValidationError {
  return value.trim().length <= max ? null : `${field} must be ${max} characters or fewer.`
}

export function isEmail(value: string): ValidationError {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
    ? null
    : 'Enter a valid email address.'
}

export function isUrl(value: string, optional = false): ValidationError {
  if (!value.trim()) return optional ? null : 'URL is required.'
  try {
    const u = new URL(value.trim())
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return 'URL must start with http:// or https://.'
    return null
  } catch {
    return 'Enter a valid URL (e.g. https://example.com).'
  }
}

export function isNumber(value: string, field = 'This field'): ValidationError {
  return value.trim() !== '' && !Number.isNaN(Number(value))
    ? null
    : `${field} must be a number.`
}

export function isInteger(value: string, field = 'This field'): ValidationError {
  const n = Number(value)
  return Number.isInteger(n) ? null : `${field} must be a whole number.`
}

export function inRange(value: string | number, min: number, max: number, field = 'Value'): ValidationError {
  const n = typeof value === 'string' ? Number(value) : value
  if (Number.isNaN(n)) return `${field} must be a number.`
  if (n < min || n > max) return `${field} must be between ${min} and ${max}.`
  return null
}

export function isPositive(value: string | number, field = 'Value'): ValidationError {
  const n = typeof value === 'string' ? Number(value) : value
  return n > 0 ? null : `${field} must be greater than 0.`
}

export function isDate(value: string, field = 'Date'): ValidationError {
  return value && !Number.isNaN(new Date(value).getTime())
    ? null
    : `${field} is not a valid date.`
}

export function dateAfter(value: string, other: string, fieldA = 'End date', fieldB = 'start date'): ValidationError {
  const a = new Date(value), b = new Date(other)
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null // let isDate catch it
  return a > b ? null : `${fieldA} must be after ${fieldB}.`
}

export function dateInFuture(value: string, field = 'Date'): ValidationError {
  const d = new Date(value)
  return d > new Date() ? null : `${field} must be in the future.`
}

// ── Compose: run validators until first failure ───────────────────────────────

export function validate(...errors: ValidationError[]): ValidationError {
  return errors.find((e) => e !== null) ?? null
}

// ── Object-level form validator ───────────────────────────────────────────────

type FieldErrors<T> = Partial<Record<keyof T, string>>

export function validateForm<T extends Record<string, unknown>>(
  rules: { [K in keyof T]?: () => ValidationError }
): FieldErrors<T> {
  const errors: FieldErrors<T> = {}
  for (const key in rules) {
    const err = rules[key]?.()
    if (err) errors[key] = err
  }
  return errors
}

export function hasErrors<T>(errors: FieldErrors<T>): boolean {
  return Object.values(errors).some(Boolean)
}

// ── Sanitise (strip dangerous HTML from string values before display) ─────────

export function sanitiseText(value: string): string {
  return value
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
