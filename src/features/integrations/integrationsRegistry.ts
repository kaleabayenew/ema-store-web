import type { IntegrationDef } from './types'

/**
 * HOW TO ADD A NEW API
 * 1. Copy any entry below and paste it at the end of the list.
 * 2. Give it a unique `id`, a `name`, and set `category`
 *    ('payment' | 'location' | 'telegram' | 'other').
 * 3. Fill in `description`, `status`, `usedBy` and `envVars`.
 * 4. Save. It appears in the "All" tab and in its category tab automatically.
 *
 * SECURITY: `envVars` holds variable NAMES only. Never write a key, token or
 * password in this file.
 */
export const integrations: IntegrationDef[] = [
  // ── Payment ────────────────────────────────────────────────────────────────
  {
    id: 'chapa',
    name: 'Chapa',
    category: 'payment',
    description: 'Payment gateway for checkout and wallet top-up.',
    status: 'planned',
    usedBy: ['Backend', 'Customer app'],
    envVars: ['CHAPA_SECRET_KEY'],
    docsUrl: 'https://developer.chapa.co/docs/accept-payments',
    note: 'Not integrated yet. Only a placeholder payment method exists.',
  },
  {
    id: 'telebirr',
    name: 'Telebirr',
    category: 'payment',
    description: 'Mobile money payment option shown at checkout.',
    status: 'planned',
    usedBy: ['Backend', 'Customer app'],
    envVars: [],
    note: 'Only a payment label today; no real API connection.',
  },
  {
    id: 'cbe-birr',
    name: 'CBE Birr',
    category: 'payment',
    description: 'Mobile money payment option shown at checkout.',
    status: 'planned',
    usedBy: ['Backend', 'Customer app'],
    envVars: [],
    note: 'Only a payment label today; no real API connection.',
  },

  // ── Location ───────────────────────────────────────────────────────────────
  {
    id: 'carto-basemaps',
    name: 'CARTO Basemaps',
    category: 'location',
    description: 'Map tiles for the delivery location picker. Needs a free API key.',
    status: 'in_use',
    usedBy: ['Customer app'],
    envVars: ['CARTO_KEY (--dart-define)'],
    docsUrl: 'https://carto.com/basemaps/apikey',
  },
  {
    id: 'openstreetmap-tiles',
    name: 'OpenStreetMap tiles',
    category: 'location',
    description: 'Fallback map tiles used when no CARTO key is set.',
    status: 'in_use',
    usedBy: ['Customer app'],
    envVars: [],
  },
  {
    id: 'nominatim',
    name: 'Nominatim geocoding',
    category: 'location',
    description: 'Free address search and pin-to-address (max 1 request per second).',
    status: 'planned',
    usedBy: ['Customer app', 'Backend'],
    envVars: [],
  },

  // ── Telegram ───────────────────────────────────────────────────────────────
  {
    id: 'telegram-bot',
    name: 'Telegram Bot',
    category: 'telegram',
    description: 'Sends OTP codes to users through a Telegram bot.',
    status: 'in_use',
    usedBy: ['Backend'],
    envVars: ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_BOT_API_KEY'],
    docsUrl: 'https://core.telegram.org/bots/api',
  },
  {
    id: 'telegram-gateway',
    name: 'Telegram Gateway',
    category: 'telegram',
    description: 'Sends verification (OTP) messages by phone number.',
    status: 'in_use',
    usedBy: ['Backend'],
    envVars: ['TELEGRAM_GATEWAY_API_KEY', 'TELEGRAM_GATEWAY_SENDER_ID'],
    docsUrl: 'https://core.telegram.org/gateway/api',
  },

  // ── Other ──────────────────────────────────────────────────────────────────
  {
    id: 'firebase',
    name: 'Firebase',
    category: 'other',
    description: 'Firebase Admin services (e.g. push notifications).',
    status: 'in_use',
    usedBy: ['Backend'],
    envVars: ['FIREBASE_SERVICE_ACCOUNT_PATH'],
  },
  {
    id: 'neon-object-storage',
    name: 'Neon Object Storage',
    category: 'other',
    description: 'Stores uploaded images (products, banners, etc.).',
    status: 'in_use',
    usedBy: ['Backend'],
    envVars: [
      'NEON_OBJECT_STORAGE_ENDPOINT',
      'NEON_OBJECT_STORAGE_BUCKET',
      'NEON_OBJECT_STORAGE_REGION',
      'NEON_OBJECT_STORAGE_ACCESS_KEY_ID',
      'NEON_OBJECT_STORAGE_SECRET_ACCESS_KEY',
    ],
  },
]