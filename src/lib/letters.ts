import type { LetterDef } from './types'

/**
 * الگوی نوشتاری حروف فارسی — فضای نرمال ۰..۱۰۰ (۰ بالای چپ، y به پایین)
 * جهت نوشتن: راست به چپ (نقطه شروع در سمت راست هر مسیر)
 *
 * ⚠️ نکته سند نیازمندی (ریسک‌ها): الگوهای حروف پیش از استفاده گسترده باید
 * به تأیید متخصص آموزش نوشتن برسد. این تعاریف نمونه اولیه هستند.
 */

// مسیرهای پایه مشترک بین حروف هم‌خانواده
const BASE_BOWL = 'M84,58 C68,78 32,78 16,58' // کاسه ب/پ/ت/ث
const STROKE_JIM = 'M74,18 C60,12 46,18 42,32 C38,46 42,60 52,66 C61,71 71,66 73,56' // ج/چ
const STROKE_H = ['M72,16 C58,10 46,18 44,30 C42,42 50,50 60,52', 'M60,52 C48,56 40,66 44,76 C48,85 58,87 64,82'] // ح/خ
const STROKE_DAL = 'M82,28 C70,22 58,26 52,40 C46,54 44,68 32,74 C26,77 21,72 23,65' // د/ذ
const STROKE_RE = 'M72,26 C60,30 50,42 46,56 C42,70 48,80 58,80 C66,80 71,72 68,64' // ر/ز/ژ
const TEETH_SIN = [
  'M84,50 C80,40 70,40 68,47 C67,51 70,53 72,52',
  'M68,50 C64,40 54,40 52,47 C51,51 54,53 56,52',
  'M52,50 C44,38 28,42 24,54 C20,66 28,78 40,78 C49,78 54,71 52,64',
] // س/ش
const STROKE_SAD = [
  'M62,28 C54,22 42,26 40,36 C38,46 50,52 60,46 C64,43 65,33 62,28',
  'M58,48 C44,50 30,56 26,66 C22,75 31,82 41,80',
] // ص/ض
const STROKE_TA = ['M56,26 L56,84', 'M80,32 C66,22 46,26 42,40 C39,50 50,57 63,53'] // ط/ظ
const STROKE_EIN = [
  'M78,22 C70,16 58,18 56,26 C54,34 64,39 72,35',
  'M62,38 C51,42 44,52 44,63 C44,73 54,78 62,74 C69,71 71,62 66,57',
] // ع/غ
const STROKE_FE = ['M62,24 L62,82', 'M62,42 C56,32 42,34 40,43 C38,52 52,57 60,50 C63,47 64,45 62,42'] // ف/ق
const STROKE_KAF = ['M80,20 C66,24 54,40 47,62', 'M58,38 L58,84', 'M58,58 C64,63 72,63 78,58'] // ک/گ

export const LETTERS: LetterDef[] = [
  { id: 'alef', char: 'ا', name: 'اَلِف', grade: 1, strokes: ['M52,14 L52,86'], dots: [], word: 'آب' },
  { id: 'be', char: 'ب', name: 'بِ', grade: 1, strokes: [BASE_BOWL], dots: [[50, 88]], word: 'باد' },
  { id: 'pe', char: 'پ', name: 'پِ', grade: 1, strokes: [BASE_BOWL], dots: [[34, 90], [50, 92], [66, 90]], word: 'پر' },
  { id: 'te', char: 'ت', name: 'تِ', grade: 1, strokes: [BASE_BOWL], dots: [[36, 44], [64, 44]], word: 'تاب' },
  { id: 'se', char: 'ث', name: 'ثِ', grade: 1, strokes: [BASE_BOWL], dots: [[30, 44], [50, 42], [70, 44]], word: 'ثمر' },
  { id: 'jim', char: 'ج', name: 'جیم', grade: 1, strokes: [STROKE_JIM], dots: [[58, 86]], word: 'جام' },
  { id: 'che', char: 'چ', name: 'چِ', grade: 1, strokes: [STROKE_JIM], dots: [[46, 46], [56, 42], [56, 54]], word: 'چای' },
  { id: 'dal', char: 'د', name: 'دال', grade: 1, strokes: [STROKE_DAL], dots: [], word: 'در' },
  { id: 're', char: 'ر', name: 'رِ', grade: 1, strokes: [STROKE_RE], dots: [], word: 'رنگ' },
  { id: 'ze', char: 'ز', name: 'زِ', grade: 1, strokes: [STROKE_RE], dots: [[64, 12]], word: 'زرد' },
  { id: 'sin', char: 'س', name: 'سین', grade: 1, strokes: TEETH_SIN, dots: [], word: 'سال' },
  { id: 'shin', char: 'ش', name: 'شین', grade: 1, strokes: TEETH_SIN, dots: [[58, 30], [68, 24], [78, 30]], word: 'شیر' },
  { id: 'fe', char: 'ف', name: 'فِ', grade: 1, strokes: STROKE_FE, dots: [], word: 'فیل' },
  { id: 'kaf', char: 'ک', name: 'کاف', grade: 1, strokes: STROKE_KAF, dots: [], word: 'کفش' },
  { id: 'gaf', char: 'گ', name: 'گاف', grade: 1, strokes: [...STROKE_KAF, 'M52,42 C60,32 72,30 80,34'], dots: [], word: 'گل' },
  { id: 'lam', char: 'ل', name: 'لام', grade: 1, strokes: ['M38,14 L38,58', 'M38,58 C40,72 56,78 68,70 C75,65 73,55 64,53'], dots: [], word: 'لیمو' },
  { id: 'mim', char: 'م', name: 'میم', grade: 1, strokes: ['M57,34 C55,26 43,25 40,33 C37,41 47,48 54,44 C58,42 59,37 57,34', 'M48,46 C48,60 47,74 45,86'], dots: [], word: 'ماه' },
  { id: 'nun', char: 'ن', name: 'نون', grade: 1, strokes: ['M80,32 C66,22 46,26 42,42 C40,52 48,60 58,60', 'M53,61 L53,87'], dots: [], word: 'نان' },
  { id: 'vav', char: 'و', name: 'واو', grade: 1, strokes: ['M62,26 C52,30 42,42 42,54 C42,66 52,74 62,70 C71,66 72,54 64,46 C60,42 58,34 62,26'], dots: [], word: 'وال' },
  { id: 'he_do_cheshm', char: 'ه', name: 'هِ', grade: 1, strokes: ['M60,28 C46,20 32,30 34,44 C36,58 50,66 62,58 C70,52 68,40 58,36 C52,34 46,38 48,45'], dots: [], word: 'هوا' },
  { id: 'ye', char: 'ی', name: 'یِ', grade: 1, strokes: ['M28,16 C22,34 22,56 30,68 C40,82 62,82 72,68 C78,59 76,46 66,40'], dots: [], word: 'یخ' },
  { id: 'he_jimi', char: 'ح', name: 'حِ', grade: 2, strokes: STROKE_H, dots: [], word: 'حوض' },
  { id: 'khe', char: 'خ', name: 'خِ', grade: 2, strokes: STROKE_H, dots: [[54, 8]], word: 'خرما' },
  { id: 'zal', char: 'ذ', name: 'ذال', grade: 2, strokes: [STROKE_DAL], dots: [[64, 14]], word: 'ذرت' },
  { id: 'zhe', char: 'ژ', name: 'ژِ', grade: 2, strokes: [STROKE_RE], dots: [[46, 14], [58, 10], [70, 14]], word: 'ژاله' },
  { id: 'sad', char: 'ص', name: 'صاد', grade: 2, strokes: STROKE_SAD, dots: [], word: 'صدا' },
  { id: 'dad', char: 'ض', name: 'ضاد', grade: 2, strokes: STROKE_SAD, dots: [[30, 44]], word: 'ضرب' },
  { id: 'ta', char: 'ط', name: 'طِ', grade: 2, strokes: STROKE_TA, dots: [], word: 'طوطی' },
  { id: 'za', char: 'ظ', name: 'ظِ', grade: 2, strokes: STROKE_TA, dots: [[72, 14]], word: 'ظرف' },
  { id: 'ein', char: 'ع', name: 'عین', grade: 2, strokes: STROKE_EIN, dots: [], word: 'عسل' },
  { id: 'ghein', char: 'غ', name: 'غین', grade: 2, strokes: STROKE_EIN, dots: [[64, 10]], word: 'غاز' },
  { id: 'qaf', char: 'ق', name: 'قاف', grade: 2, strokes: STROKE_FE, dots: [[42, 22], [52, 18]], word: 'قاب' },
]

export function letterById(id: string): LetterDef | undefined {
  return LETTERS.find((l) => l.id === id)
}

/** حروف قابل تمرین برای پایه تحصیلی کودک */
export function lettersForGrade(grade: 1 | 2 | 3): LetterDef[] {
  const own = LETTERS.filter((l) => l.grade === grade)
  if (own.length) return own
  return LETTERS.filter((l) => l.grade <= grade)
}

export const GRADE_LABELS: Record<1 | 2 | 3, string> = {
  1: 'اول ابتدایی',
  2: 'دوم ابتدایی',
  3: 'سوم ابتدایی',
}
