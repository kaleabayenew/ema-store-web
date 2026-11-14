// AES-256-GCM payload encryption for admin API traffic.
// Mirrors backend src/core/utils/payload_crypto.js — same secret, same
// SHA-256 key derivation, same wire format: iv.tag.ciphertext (base64url).
// This is obfuscation on top of HTTPS, not a replacement for it.

const SECRET = import.meta.env.VITE_API_PAYLOAD_SECRET as string | undefined

let keyPromise: Promise<CryptoKey> | null = null

function getKey(): Promise<CryptoKey> | null {
  if (!SECRET) return null
  keyPromise ??= crypto.subtle
    .digest('SHA-256', new TextEncoder().encode(SECRET))
    .then((digest) =>
      crypto.subtle.importKey('raw', digest, { name: 'AES-GCM' }, false, [
        'encrypt',
        'decrypt',
      ]),
    )
  return keyPromise
}

export const payloadCryptoEnabled = !!SECRET

function b64url(bytes: Uint8Array): string {
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function unb64url(s: string): Uint8Array<ArrayBuffer> {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(b64)
  const out = new Uint8Array(new ArrayBuffer(bin.length))
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

// WebCrypto appends the 16-byte GCM tag to the ciphertext; Node expects them
// separate, so we split/join at the boundary.
const TAG_BYTES = 16

export async function encryptPayload(payload: unknown): Promise<string> {
  const key = await getKey()
  if (!key) throw new Error('Payload encryption is not configured.')
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const combined = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      new TextEncoder().encode(JSON.stringify(payload)),
    ),
  )
  const ciphertext = combined.slice(0, combined.length - TAG_BYTES)
  const tag = combined.slice(combined.length - TAG_BYTES)
  return `${b64url(iv)}.${b64url(tag)}.${b64url(ciphertext)}`
}

export async function decryptPayload(token: string): Promise<unknown> {
  const key = await getKey()
  if (!key) throw new Error('Payload encryption is not configured.')
  const parts = token.split('.')
  if (parts.length !== 3) throw new Error('Malformed encrypted payload.')
  const iv = unb64url(parts[0])
  const tag = unb64url(parts[1])
  const ciphertext = unb64url(parts[2])
  const combined = new Uint8Array(ciphertext.length + tag.length)
  combined.set(ciphertext, 0)
  combined.set(tag, ciphertext.length)
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    combined,
  )
  return JSON.parse(new TextDecoder().decode(plain))
}
