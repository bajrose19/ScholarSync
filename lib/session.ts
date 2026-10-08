import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

export const SESSION_COOKIE = 'scholarsync_session'
const MAX_AGE_SECONDS = 60 * 60 * 24 * 14

type SessionPayload = {
  uid: string
  exp: number
}

function secret() {
  const cached = (globalThis as { __scholarsyncSecret?: string }).__scholarsyncSecret
  if (cached) return cached

  const dir = path.join(process.cwd(), '.data')
  const secretPath = path.join(dir, 'session.secret')
  fs.mkdirSync(dir, { recursive: true })
  if (!fs.existsSync(secretPath)) {
    fs.writeFileSync(secretPath, crypto.randomBytes(32).toString('hex'), { mode: 0o600 })
  }
  const value = fs.readFileSync(secretPath, 'utf8').trim()
  ;(globalThis as { __scholarsyncSecret?: string }).__scholarsyncSecret = value
  return value
}

function sign(payload: string) {
  return crypto.createHmac('sha256', secret()).update(payload).digest('base64url')
}

export function createSessionToken(userId: string) {
  const payload = Buffer.from(
    JSON.stringify({ uid: userId, exp: Date.now() + MAX_AGE_SECONDS * 1000 } satisfies SessionPayload),
  ).toString('base64url')
  return `${payload}.${sign(payload)}`
}

export function readSessionToken(token: string | undefined | null) {
  if (!token) return null
  const [payload, signature] = token.split('.')
  if (!payload || !signature) return null
  const expected = sign(payload)
  const actualBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)
  if (actualBuffer.length !== expectedBuffer.length) return null
  if (!crypto.timingSafeEqual(actualBuffer, expectedBuffer)) return null
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString()) as SessionPayload
    if (!data.uid || typeof data.exp !== 'number' || data.exp < Date.now()) return null
    return data.uid
  } catch {
    return null
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: MAX_AGE_SECONDS,
}
