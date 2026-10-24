import { LETTERS, lettersForGrade } from './letters'
import { pathsForLevel } from './paths'
import type { AdaptiveDecision, ChildProfile, ExerciseAttempt, ExerciseDef, GuidanceLevel, SkillType } from './types'
import { SKILL_LABELS } from './types'

/**
 * موتور تطبیقی قواعدمحور — مطابق سند بخش ۴
 * آستانه‌ها مقادیر اولیه برای آزمایش‌اند و متخصص می‌تواند سطح را دستی تغییر دهد.
 */
export const THRESHOLDS = {
  advance: 85, // میانگین سه تلاش اخیر برای پیشنهاد مرحله بعد
  continueMin: 60, // حد پایین «در حال یادگیری»
  independentOk: 80, // حداقل دقت یک تلاش مستقلِ موفق
  requiredIndependent: 2, // تعداد تلاش مستقل موفق لازم
}

export interface DecisionResult {
  action: AdaptiveDecision['action']
  nextLevel: number
  guidance: GuidanceLevel
  reason: string
}

function guidanceFromLast(last?: ExerciseAttempt): GuidanceLevel {
  if (!last) return 'full'
  if (!last.completed) return 'full'
  if (last.accuracyPercent >= 85) return 'none'
  if (last.accuracyPercent >= 65) return 'partial'
  return 'full'
}

export function decideNext(currentLevel: number, recent: ExerciseAttempt[]): DecisionResult {
  const last3 = recent.slice(0, 3)
  const last = last3[0]

  if (last3.length === 0) {
    return {
      action: 'insufficient',
      nextLevel: currentLevel,
      guidance: 'full',
      reason: `شروع مهارت «${SKILL_LABELS[recent.length ? recent[0].skillType : 'path']}» با راهنمای کامل`,
    }
  }

  if (last3.length < 3) {
    return {
      action: 'insufficient',
      nextLevel: currentLevel,
      guidance: guidanceFromLast(last),
      reason: 'داده کافی نیست؛ تمرین در همین سطح ادامه می‌یابد',
    }
  }

  const avg = last3.reduce((s, a) => s + a.accuracyPercent, 0) / last3.length
  const allCompleted = last3.every((a) => a.completed)
  const independentOk = last3.filter((a) => a.guidanceLevel !== 'full' && a.completed && a.accuracyPercent >= THRESHOLDS.independentOk).length >= THRESHOLDS.requiredIndependent
  const allWeak = last3.every((a) => !a.completed || a.accuracyPercent < THRESHOLDS.continueMin)

  if (avg >= THRESHOLDS.advance && independentOk && allCompleted) {
    const nextLevel = Math.min(3, currentLevel + 1)
    return {
      action: nextLevel > currentLevel ? 'advance' : 'continue',
      nextLevel,
      guidance: nextLevel > currentLevel ? 'partial' : 'none',
      reason: `میانگین دقت سه تلاش اخیر ${Math.round(avg)}٪ با عملکرد مستقل و پایدار${nextLevel > currentLevel ? ' — پیشنهاد مرحله بعد' : ' — بالاترین سطح ممکن'}`,
    }
  }

  if (avg >= THRESHOLDS.continueMin) {
    return {
      action: 'continue',
      nextLevel: currentLevel,
      guidance: guidanceFromLast(last),
      reason: `میانگین دقت ${Math.round(avg)}٪ — تمرین در همین سطح ادامه می‌یابد`,
    }
  }

  if (allWeak) {
    const nextLevel = Math.max(1, currentLevel - 1)
    return {
      action: nextLevel < currentLevel ? 'ease' : 'continue',
      nextLevel,
      guidance: 'full',
      reason: `دقت ${Math.round(avg)}٪ و تلاش‌های ناقص — ${nextLevel < currentLevel ? 'برگشت به مرحله ساده‌تر' : 'ساده‌ترین سطح'} با راهنمای کامل`,
    }
  }

  return {
    action: 'continue',
    nextLevel: currentLevel,
    guidance: 'full',
    reason: `میانگین دقت ${Math.round(avg)}٪ — ادامه با راهنمای بیشتر`,
  }
}

/** تلورانس پوشش بر اساس مهارت و سطح (فضای نرمال ۰..۱۰۰) */
export function toleranceFor(skillType: SkillType, level: number): number {
  const l = Math.min(3, Math.max(1, level))
  const table: Record<SkillType, [number, number, number]> = {
    path: [9, 7, 5.5],
    letter: [8.5, 7, 5.5],
    independent: [12, 11, 10],
  }
  return table[skillType][l - 1]
}

/** انتخاب تمرین بعدی بر اساس مهارت، پایه کودک و تصمیم تطبیقی */
export function pickExercise(child: ChildProfile, skillType: SkillType, level: number, guidance: GuidanceLevel, lastExerciseId?: string | null): ExerciseDef {
  const tolerance = toleranceFor(skillType, level)

  if (skillType === 'path') {
    const pool = pathsForLevel(level)
    const filtered = pool.length > 1 && lastExerciseId ? pool.filter((p) => `path-${p.id}` !== lastExerciseId) : pool
    const pick = filtered[Math.floor(Math.random() * filtered.length)] ?? pool[0]
    return {
      id: `path-${pick.id}`,
      skillType: 'path',
      level,
      title: `دنبال کردن: ${pick.name}`,
      strokes: pick.strokes,
      dots: [],
      tolerance,
      guidance,
    }
  }

  const gradePool = lettersForGrade(child.grade)
  let pool = gradePool
  if (skillType === 'letter') {
    // سطوح بر اساس پیچیدگی مسیر: سطح ۱ حروف تک‌مسیر، سطح ۲ حداکثر دو مسیر، سطح ۳ همه
    const maxStrokes = level === 1 ? 1 : level === 2 ? 2 : 99
    const byComplexity = gradePool.filter((l) => l.strokes.length <= maxStrokes)
    if (byComplexity.length >= 2) pool = byComplexity
  }
  const filtered = pool.length > 1 && lastExerciseId ? pool.filter((l) => `${skillType}-${l.id}` !== lastExerciseId) : pool
  const pick = filtered[Math.floor(Math.random() * filtered.length)] ?? pool[0]

  const prefix = skillType === 'letter' ? 'letter' : 'independent'
  const verb = skillType === 'letter' ? 'شکل دادن حرف' : 'نوشتن حرف'
  return {
    id: `${prefix}-${pick.id}`,
    skillType,
    level,
    title: `${verb} «${pick.char}»`,
    referenceChar: pick.char,
    word: pick.word,
    strokes: pick.strokes,
    dots: pick.dots,
    tolerance,
    guidance,
  }
}

export function decisionTitle(action: AdaptiveDecision['action']): string {
  switch (action) {
    case 'advance':
      return 'افزایش سطح'
    case 'continue':
      return 'ادامه همین سطح'
    case 'ease':
      return 'ساده‌تر کردن'
    default:
      return 'در حال جمع‌آوری داده'
  }
}

/** نمایش صریح محدودیت (سند ۴.۴): عناوین گزارش همیشه «تمرین لمسی» باشند */
export const TOUCH_ONLY_DISCLAIMER =
  'این درصد «دقت در تمرین لمسی» است و به‌تنهایی نشان‌دهنده مهارت نوشتن با مداد روی کاغذ نیست.'
