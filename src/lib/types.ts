// ─── انواع داده اصلی اپلیکیشن مرکز جامع نظرکهریز ───
// مطابق سند نیازمندی نسخه ۱.۰ — موجودیت‌های: Child, Session, Exercise, ExerciseAttempt,
// InterventionPlan, AdaptiveDecision, Reward

export type SkillType = 'path' | 'letter' | 'independent'
export type GuidanceLevel = 'full' | 'partial' | 'none'
export type Grade = 1 | 2 | 3

/** مهارت‌های نسخه اولیه */
export const SKILL_TYPES: SkillType[] = ['path', 'letter', 'independent']

export const SKILL_LABELS: Record<SkillType, string> = {
  path: 'دنبال کردن مسیر',
  letter: 'شکل دادن حروف',
  independent: 'نوشتن مستقل',
}

export const SKILL_DESCRIPTIONS: Record<SkillType, string> = {
  path: 'دنبال کردن خطوط و مسیرهای ساده با انگشت',
  letter: 'شکل‌دهی هدایت‌شده حروف فارسی روی مسیر نقطه‌چین',
  independent: 'نوشتن حرف بدون راهنما روی خط زمینه',
}

export const GUIDANCE_LABELS: Record<GuidanceLevel, string> = {
  full: 'راهنمای کامل',
  partial: 'راهنمای جزئی',
  none: 'بدون راهنما',
}

/** تعریف یک حرف فارسی با مسیرهای رسم در فضای نرمال ۰ تا ۱۰۰ (راست به چپ) */
export interface LetterDef {
  id: string
  char: string
  name: string // تلفظ فارسی
  grade: Grade
  strokes: string[] // مسیرهای اصلی به فرمت d برای SVG
  dots: [number, number][] // مختصات نقطه‌ها
  word: string // کلمه نمونه
}

/** الگوی مسیر ساده برای تمرین دنبال‌کردن */
export interface PathDef {
  id: string
  name: string
  level: 1 | 2 | 3
  strokes: string[]
}

/** تمرین آماده اجرا */
export interface ExerciseDef {
  id: string
  skillType: SkillType
  level: number
  title: string
  referenceChar?: string
  word?: string
  strokes: string[]
  dots: [number, number][]
  tolerance: number // تلورانس پوشش مسیر در فضای نرمال
  guidance: GuidanceLevel
}

/** برنامه تمرینی که متخصص تعیین/تأیید می‌کند (InterventionPlan) */
export interface ChildPlan {
  enabledSkills: SkillType[]
  autoAdvance: boolean // پیشروی خودکار سطح با تأیید قواعد
  levelOverrides: Partial<Record<SkillType, number>>
  maxSessionMinutes: number
  note?: string
  updatedAt?: string
}

/** پرونده کودک */
export interface ChildProfile {
  id: string
  displayName: string
  grade: Grade
  createdAt: string
  stars: number
  skillLevels: Record<SkillType, number>
  plan: ChildPlan
  badges: string[]
}

/** هر تلاش کودک روی یک تمرین */
export interface ExerciseAttempt {
  id: string
  childId: string
  exerciseId: string
  exerciseTitle: string
  skillType: SkillType
  level: number
  sessionId: string
  startedAt: string
  durationMs: number
  accuracyPercent: number
  coveragePercent: number
  completed: boolean
  guidanceLevel: GuidanceLevel
  offPathCount: number
  startedCorrectly: boolean
  algorithmVersion: 1
  rawPoints?: number[][] // داده خام نمونه‌برداری‌شده (جدای از امتیاز)
}

/** جلسه تمرین */
export interface PracticeSession {
  id: string
  childId: string
  startedAt: string
  endedAt?: string
  status: 'active' | 'completed' | 'stopped'
  attemptCount: number
}

/** تصمیم موتور تطبیقی */
export interface AdaptiveDecision {
  id: string
  childId: string
  sessionId?: string
  attemptId?: string
  skillType: SkillType
  createdAt: string
  action: 'advance' | 'continue' | 'ease' | 'insufficient'
  suggestedLevel: number
  suggestedGuidance: GuidanceLevel
  reason: string
  applied: boolean
  overridden: boolean
}

/** پاداش */
export interface Reward {
  id: string
  childId: string
  type: 'star' | 'badge'
  badgeId?: string
  earnedAt: string
}

export interface BadgeDef {
  id: string
  title: string
  emoji: string
  description: string
}

export const BADGES: BadgeDef[] = [
  { id: 'first_attempt', title: 'اولین قدم', emoji: '🎯', description: 'اولین تمرین را انجام دادی' },
  { id: 'stars_10', title: '۱۰ ستاره', emoji: '⭐', description: '۱۰ ستاره جمع کردی' },
  { id: 'stars_30', title: '۳۰ ستاره', emoji: '🌟', description: '۳۰ ستاره جمع کردی' },
  { id: 'level2', title: 'تکامل', emoji: '🚀', description: 'به مرحله ۲ رسیدی' },
  { id: 'level3', title: 'قهرمان', emoji: '🏆', description: 'به مرحله ۳ رسیدی' },
  { id: 'perfect', title: 'بی‌نقص', emoji: '💯', description: 'دقت بالای ۹۷ درصد' },
  { id: 'persistent', title: 'پشتکار', emoji: '💪', description: '۱۰ تمرین انجام دادی' },
  { id: 'independent', title: 'بال پر', emoji: '🪽', description: 'اولین نوشتن مستقل موفق' },
]

export interface AppSettings {
  soundEnabled: boolean
  voiceEnabled: boolean
  specialistPin: string
}

/** کل داده محلی برنامه — روی دستگاه ذخیره می‌شود (FR-10) */
export interface AppData {
  version: number
  children: ChildProfile[]
  sessions: PracticeSession[]
  attempts: ExerciseAttempt[]
  decisions: AdaptiveDecision[]
  rewards: Reward[]
  settings: AppSettings
}

export const DATA_VERSION = 1
export const ALGORITHM_VERSION = 1 as const

export function defaultSettings(): AppSettings {
  return { soundEnabled: true, voiceEnabled: true, specialistPin: '1234' }
}

export function defaultPlan(grade: Grade): ChildPlan {
  return {
    enabledSkills: grade === 1 ? ['path', 'letter'] : ['path', 'letter', 'independent'],
    autoAdvance: true,
    levelOverrides: {},
    maxSessionMinutes: 10,
    updatedAt: new Date().toISOString(),
  }
}

export function emptyData(): AppData {
  return {
    version: DATA_VERSION,
    children: [],
    sessions: [],
    attempts: [],
    decisions: [],
    rewards: [],
    settings: defaultSettings(),
  }
}
