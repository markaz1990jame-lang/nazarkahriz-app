/**
 * پشتیبان‌گیری رمزگذاری‌شده برای انتقال پرونده بین خانه و مرکز (FR-11)
 * فرمت: JSON { magic, v, salt, iv, ct } — AES-GCM 256 + PBKDF2 (SHA-256, 150k تکرار)
 * فایل بدون رمز درست به‌هیچ‌وجه رمزگشایی نمی‌شود (کنترل فایل دست‌کاری‌شده — AC-10)
 */

import { DATA_VERSION, emptyData, type AppData } from './types'

const MAGIC = 'NKZ1'

interface BackupPayload {
  magic: string
  v: number
  exportedAt: string
  salt: string
  iv: string
  ct: string
}

function b64encode(buf: Uint8Array): string {
  let s = ''
  for (let i = 0; i < buf.length; i++) s += String.fromCharCode(buf[i])
  return btoa(s)
}

function b64decode(s: string): Uint8Array {
  const bin = atob(s)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const base = await crypto.subtle.importKey('raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as unknown as BufferSource, iterations: 150000, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

export function backupFileName(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `nazarkahriz-backup-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}.nkz`
}

export async function createBackupBlob(data: AppData, passphrase: string): Promise<Blob> {
  if (!passphrase || passphrase.length < 4) {
    throw new Error('رمز عبور باید حداقل ۴ نویسه باشد')
  }
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(passphrase, salt)
  const enc = new TextEncoder()
  const plain = enc.encode(JSON.stringify({ magic: MAGIC, data }))
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv as unknown as BufferSource }, key, plain as unknown as BufferSource)

  const payload: BackupPayload = {
    magic: MAGIC,
    v: 1,
    exportedAt: new Date().toISOString(),
    salt: b64encode(salt),
    iv: b64encode(iv),
    ct: b64encode(new Uint8Array(ct)),
  }
  return new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
}

export async function downloadBackup(data: AppData, passphrase: string): Promise<string> {
  const blob = await createBackupBlob(data, passphrase)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = backupFileName()
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
  return a.download
}

/** اعتبارسنجی ساختاری داده — فایل نامعتبر وارد پایگاه داده محلی نمی‌شود */
export function validateAppData(obj: unknown): AppData {
  const base = emptyData()
  if (typeof obj !== 'object' || obj === null) throw new Error('ساختار فایل نامعتبر است')
  const o = obj as Partial<AppData>

  if (!Array.isArray(o.children)) throw new Error('فهرست پرونده کودکان یافت نشد')
  if (!Array.isArray(o.attempts)) throw new Error('فهرست تلاش‌ها یافت نشد')

  const children = o.children
    .filter((c) => c && typeof c.id === 'string' && typeof c.displayName === 'string' && c.displayName.trim().length > 0)
    .map((c) => ({
      id: c.id,
      displayName: c.displayName.trim().slice(0, 40),
      grade: (c.grade === 2 || c.grade === 3 ? c.grade : 1) as 1 | 2 | 3,
      createdAt: typeof c.createdAt === 'string' ? c.createdAt : new Date().toISOString(),
      stars: Math.max(0, Math.round(Number(c.stars) || 0)),
      skillLevels: {
        path: clampLevel(c.skillLevels?.path),
        letter: clampLevel(c.skillLevels?.letter),
        independent: clampLevel(c.skillLevels?.independent),
      },
      plan: {
        enabledSkills: Array.isArray(c.plan?.enabledSkills)
          ? (c.plan.enabledSkills.filter((s) => s === 'path' || s === 'letter' || s === 'independent') as AppData['children'][number]['plan']['enabledSkills'])
          : ['path', 'letter'],
        autoAdvance: Boolean(c.plan?.autoAdvance ?? true),
        levelOverrides: typeof c.plan?.levelOverrides === 'object' && c.plan?.levelOverrides ? c.plan.levelOverrides : {},
        maxSessionMinutes: clampNum(c.plan?.maxSessionMinutes, 5, 30, 10),
        note: typeof c.plan?.note === 'string' ? c.plan.note.slice(0, 500) : undefined,
        updatedAt: c.plan?.updatedAt,
      },
      badges: Array.isArray(c.badges) ? c.badges.filter((b) => typeof b === 'string').slice(0, 50) : [],
    }))

  const ids = new Set(children.map((c) => c.id))
  const childOk = (id: unknown) => typeof id === 'string' && ids.has(id)

  const attempts = (Array.isArray(o.attempts) ? o.attempts : [])
    .filter((a) => a && typeof a.id === 'string' && childOk(a.childId))
    .map((a) => ({
      ...a,
      accuracyPercent: clampNum(a.accuracyPercent, 0, 100, 0),
      coveragePercent: clampNum(a.coveragePercent, 0, 100, 0),
      durationMs: Math.max(0, Math.round(Number(a.durationMs) || 0)),
      offPathCount: Math.max(0, Math.round(Number(a.offPathCount) || 0)),
    }))

  const sessions = (Array.isArray(o.sessions) ? o.sessions : []).filter((s) => s && typeof s.id === 'string' && childOk(s.childId))
  const decisions = (Array.isArray(o.decisions) ? o.decisions : []).filter((d) => d && typeof d.id === 'string' && childOk(d.childId))
  const rewards = (Array.isArray(o.rewards) ? o.rewards : []).filter((r) => r && typeof r.id === 'string' && childOk(r.childId))

  if (children.length === 0 && (attempts.length > 0 || sessions.length > 0)) {
    throw new Error('فایل ناسازگار است: تلاش بدون پرونده کودک')
  }

  return {
    version: DATA_VERSION,
    children,
    sessions,
    attempts,
    decisions,
    rewards,
    settings: {
      soundEnabled: Boolean(o.settings?.soundEnabled ?? true),
      voiceEnabled: Boolean(o.settings?.voiceEnabled ?? true),
      specialistPin: typeof o.settings?.specialistPin === 'string' && o.settings.specialistPin.length >= 4 ? o.settings.specialistPin : '1234',
    },
  }
}

export async function restoreBackup(file: File, passphrase: string): Promise<AppData> {
  if (!passphrase) throw new Error('رمز عبور فایل پشتیبان را وارد کنید')
  let payload: BackupPayload
  try {
    payload = JSON.parse(await file.text()) as BackupPayload
  } catch {
    throw new Error('فایل قابل خواندن نیست')
  }
  if (payload?.magic !== MAGIC || !payload.salt || !payload.iv || !payload.ct) {
    throw new Error('این فایل یک پشتیبان معتبر نظرکهریز نیست')
  }
  let key: CryptoKey
  try {
    key = await deriveKey(passphrase, b64decode(payload.salt))
  } catch {
    throw new Error('خطا در پردازش رمز عبور')
  }
  let plain: ArrayBuffer
  try {
    plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: b64decode(payload.iv) as unknown as BufferSource },
      key,
      b64decode(payload.ct) as unknown as BufferSource,
    )
  } catch {
    throw new Error('رمز عبور نادرست است یا فایل خراب شده')
  }
  try {
    const inner = JSON.parse(new TextDecoder().decode(plain)) as { magic: string; data: unknown }
    if (inner?.magic !== MAGIC) throw new Error('bad')
    return validateAppData(inner.data)
  } catch {
    throw new Error('محتوای فایل پشتیبان معتبر نیست')
  }
}

/** ادغام بدون حذف داده‌های فعلی (برای انتقال بین خانه و مرکز) */
export function mergeData(current: AppData, incoming: AppData): AppData {
  const union = <T extends { id: string }>(a: T[], b: T[]): T[] => {
    const map = new Map<string, T>()
    for (const x of a) map.set(x.id, x)
    for (const x of b) if (!map.has(x.id)) map.set(x.id, x)
    return [...map.values()]
  }
  return {
    version: DATA_VERSION,
    children: union(current.children, incoming.children),
    sessions: union(current.sessions, incoming.sessions),
    attempts: union(current.attempts, incoming.attempts),
    decisions: union(current.decisions, incoming.decisions),
    rewards: union(current.rewards, incoming.rewards),
    settings: current.settings,
  }
}

function clampLevel(v: unknown): number {
  const n = Math.round(Number(v) || 1)
  return Math.min(3, Math.max(1, n))
}

function clampNum(v: unknown, min: number, max: number, dflt: number): number {
  const n = Number(v)
  if (!Number.isFinite(n)) return dflt
  return Math.min(max, Math.max(min, n))
}
