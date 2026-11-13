export type IntegrationCategory = 'payment' | 'location' | 'telegram' | 'other'

/**
 * in_use  - the API is already used by the system
 * planned - agreed or prepared, but not connected yet
 * unknown - status could not be determined
 */
export type IntegrationStatus = 'in_use' | 'planned' | 'unknown'

export type UsedBy = 'Backend' | 'Customer app' | 'Partner app' | 'Web'

export interface IntegrationDef {
  id: string
  name: string
  category: IntegrationCategory
  description: string
  status: IntegrationStatus
  usedBy: UsedBy[]
  /** Environment variable NAMES only. Never put secret values here. */
  envVars: string[]
  docsUrl?: string
  note?: string
}

export const CATEGORY_LABELS: Record<IntegrationCategory, string> = {
  payment: 'Payment',
  location: 'Location',
  telegram: 'Telegram',
  other: 'Other',
}

/** Order of the tabs after "All". */
export const CATEGORY_ORDER: IntegrationCategory[] = ['payment', 'location', 'telegram', 'other']