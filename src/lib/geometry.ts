/**
 * ابزارهای هندسی — تبدیل مسیرهای SVG به نقاط نرمال و محاسبات فاصله
 * مطابق سند ۶: مختصات مستقل از اندازه صفحه (فضای نرمال ۰..۱۰۰)
 */

export interface Pt {
  x: number
  y: number
}

let measureSvg: SVGSVGElement | null = null

function getMeasureSvg(): SVGSVGElement | null {
  if (typeof document === 'undefined') return null
  if (measureSvg) return measureSvg
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('width', '0')
  svg.setAttribute('height', '0')
  svg.style.position = 'fixed'
  svg.style.width = '0'
  svg.style.height = '0'
  svg.style.opacity = '0'
  svg.style.pointerEvents = 'none'
  svg.style.zIndex = '-1'
  document.body.appendChild(svg)
  measureSvg = svg
  return svg
}

/** نمونه‌برداری از یک مسیر SVG به نقاط با فاصله step (در فضای همان مختصات مسیر) */
export function sampleStroke(d: string, step = 2.5): Pt[] {
  const svg = getMeasureSvg()
  if (!svg) return []
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  path.setAttribute('d', d)
  svg.appendChild(path)
  const pts: Pt[] = []
  try {
    const len = path.getTotalLength()
    const n = Math.max(2, Math.ceil(len / step))
    for (let i = 0; i <= n; i++) {
      const p = path.getPointAtLength((len * i) / n)
      pts.push({ x: p.x, y: p.y })
    }
  } finally {
    svg.removeChild(path)
  }
  return pts
}

/** نمونه‌برداری همه مسیرهای یک تمرین + نقطه‌های نقطه‌دار */
export function sampleExercise(strokes: string[], dots: [number, number][], step = 2.5): Pt[] {
  const pts: Pt[] = []
  for (const d of strokes) pts.push(...sampleStroke(d, step))
  for (const [x, y] of dots) pts.push({ x, y })
  return pts
}

export function dist(a: Pt, b: Pt): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.sqrt(dx * dx + dy * dy)
}

export function nearestDist(p: Pt, pts: Pt[]): number {
  let min = Infinity
  for (const q of pts) {
    const d = dist(p, q)
    if (d < min) min = d
  }
  return min
}

/** فاصله نقطه تا نزدیک‌ترین قطعه مسیر (برای شمارش خروج از مسیر با hysteresis) */
export function downsample(pts: Pt[], max = 240): number[][] {
  if (pts.length === 0) return []
  const stride = Math.max(1, Math.ceil(pts.length / max))
  const out: number[][] = []
  for (let i = 0; i < pts.length; i += stride) out.push([Math.round(pts[i].x * 10) / 10, Math.round(pts[i].y * 10) / 10])
  return out
}

/** نمونه‌های پراکنده برای فلش‌های جهت: برمی‌گرداند مختصات + زاویه مماس */
export function arrowPoints(stroke: Pt[], everyUnits = 16): { p: Pt; angle: number }[] {
  const out: { p: Pt; angle: number }[] = []
  if (stroke.length < 3) return out
  let acc = 0
  let next = everyUnits / 2
  for (let i = 1; i < stroke.length; i++) {
    const d = dist(stroke[i - 1], stroke[i])
    acc += d
    if (acc >= next) {
      const angle = Math.atan2(stroke[i].y - stroke[i - 1].y, stroke[i].x - stroke[i - 1].x)
      out.push({ p: stroke[i], angle })
      next += everyUnits
    }
  }
  return out
}
