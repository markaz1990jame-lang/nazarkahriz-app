import { nearestDist, type Pt } from './geometry'

/**
 * معیارهای امتیازدهی تمرین لمسی — مطابق سند بخش ۴ و ۶
 * - پوشش مسیر: نسبت نقاط هدف که در محدوده تلورانس پوشیده شده‌اند
 * - خروج از مسیر: شمارش دفعات خروج با hysteresis (حساسیت کم به لرزش دست)
 * - دقت نهایی: پوشش منهای جریمه خروج از مسیر (۰..۱۰۰)
 */

export const COVERAGE_COMPLETE = 0.8 // حداقل پوشش برای «تمرین کامل»
export const COVERAGE_AUTO_FINISH = 0.92 // پایان خودکار تلاش

export function coverageOf(target: Pt[], drawn: Pt[], tolerance: number): number {
  if (target.length === 0) return 0
  if (drawn.length === 0) return 0
  let covered = 0
  for (const tp of target) {
    if (nearestDist(tp, drawn) <= tolerance) covered++
  }
  return covered / target.length
}

export function finalAccuracy(coverage: number, offPathCount: number): number {
  const base = coverage * 100
  const score = base - offPathCount * 2
  return Math.max(0, Math.min(100, Math.round(score * 10) / 10))
}

/** شمارنده خروج از مسیر با hysteresis — نمونه یک‌بار ساخته و در طول تمرین تغذیه می‌شود */
export class OffPathCounter {
  private inPath = false
  private outStreak = 0
  count = 0

  constructor(private tolerance: number) {}

  feed(p: Pt, target: Pt[]): void {
    const d = nearestDist(p, target)
    if (d > this.tolerance) {
      this.outStreak++
      if (this.inPath && this.outStreak >= 3) {
        this.count++
        this.inPath = false
      }
    } else {
      this.outStreak = 0
      this.inPath = true
    }
  }

  reset(): void {
    this.inPath = false
    this.outStreak = 0
    this.count = 0
  }
}

/** ستاره‌های کسب‌شده بر اساس دقت */
export function starsFor(accuracy: number): number {
  if (accuracy >= 95) return 3
  if (accuracy >= 85) return 2
  if (accuracy >= 60) return 1
  return 0
}
