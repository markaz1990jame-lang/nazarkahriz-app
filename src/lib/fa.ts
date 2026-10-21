// ابزارهای فارسی‌سازی اعداد و تاریخ

const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']

export function toFa(input: number | string): string {
  return String(input).replace(/\d/g, (d) => FA_DIGITS[Number(d)])
}

export function faRound(n: number): string {
  return toFa(Math.round(n))
}

export function formatDurationMs(ms: number): string {
  const totalSec = Math.round(ms / 1000)
  if (totalSec < 60) return `${toFa(totalSec)} ثانیه`
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${toFa(m)}:${toFa(String(s).padStart(2, '0'))} دقیقه`
}

export function formatFaDate(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' })
  } catch {
    return '—'
  }
}

export function formatFaDateTime(iso: string): string {
  try {
    const d = new Date(iso)
    return `${d.toLocaleDateString('fa-IR', { month: 'long', day: 'numeric' })}، ${d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}`
  } catch {
    return '—'
  }
}

export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}
