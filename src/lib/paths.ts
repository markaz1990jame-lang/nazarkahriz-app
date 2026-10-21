import type { PathDef } from './types'

/**
 * الگوهای مسیر ساده برای تمرین دنبال‌کردن — فضای نرمال ۰..۱۰۰
 * جهت شروع: راست (سازگار با نوشتن فارسی)
 */
export const PATH_PATTERNS: PathDef[] = [
  { id: 'line-h', name: 'خط راست', level: 1, strokes: ['M85,50 L15,50'] },
  { id: 'line-v', name: 'خط عمودی', level: 1, strokes: ['M50,15 L50,85'] },
  { id: 'slant', name: 'خط مورب', level: 1, strokes: ['M80,25 L20,75'] },
  { id: 'curve-smile', name: 'خم ساده', level: 1, strokes: ['M82,45 C66,76 34,76 18,45'] },
  { id: 'wave', name: 'خط موجی', level: 2, strokes: ['M85,45 C75,22 60,22 50,45 C40,68 25,68 15,45'] },
  { id: 'zigzag', name: 'زیگزاگ', level: 2, strokes: ['M85,30 L65,70 L50,30 L35,70 L15,30'] },
  { id: 'arc', name: 'نیم‌دایره', level: 2, strokes: ['M82,62 C82,26 18,26 18,62'] },
  { id: 'circle', name: 'دایره', level: 3, strokes: ['M80,50 A30,30 0 1,0 20,50 A30,30 0 1,0 80,50'] },
  { id: 'square', name: 'چهارگوش', level: 3, strokes: ['M80,22 L80,78 L20,78 L20,22 L80,22'] },
  { id: 'steps', name: 'پلکانی', level: 3, strokes: ['M85,25 L60,25 L60,50 L35,50 L35,75 L15,75'] },
]

export function pathsForLevel(level: number): PathDef[] {
  const lvl = (Math.min(3, Math.max(1, level)) as 1 | 2 | 3)
  return PATH_PATTERNS.filter((p) => p.level === lvl)
}
