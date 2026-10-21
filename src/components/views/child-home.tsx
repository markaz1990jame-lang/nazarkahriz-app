'use client'

import { useMemo } from 'react'
import { Home, LogOut, Play, Sparkles, Star } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { BADGES } from '@/lib/types'
import { SKILL_LABELS } from '@/lib/types'
import { toFa } from '@/lib/fa'
import { GRADE_LABELS } from '@/lib/letters'
import { useAppStore, useCurrentChild } from '@/lib/store'
import { playPhrase } from '@/lib/audio'
import { Mascot, NkFooter } from '@/components/nk-ui'
import { toast } from '@/hooks/use-toast'

export function ChildHomeScreen() {
  const child = useCurrentChild()
  const go = useAppStore((s) => s.go)
  const startSession = useAppStore((s) => s.startSession)
  const selectChild = useAppStore((s) => s.selectChild)

  const goal = useMemo(() => {
    if (!child) return 'تمرین امروز'
    const enabled = child.plan.enabledSkills
    if (enabled.length === 0) return 'هنوز مهارتی فعال نشده — از متخصص بخواهید برنامه را تنظیم کند'
    const labels: Record<string, string> = { path: 'دنبال کردن مسیرها', letter: 'شکل دادن حروف', independent: 'نوشتن مستقل' }
    return labels[enabled[0]] ?? 'تمرین نوشتاری'
  }, [child])

  if (!child) {
    return (
      <div className="min-h-dvh grid place-items-center p-6">
        <Button onClick={() => go('start')}>بازگشت به صفحه شروع</Button>
      </div>
    )
  }

  const earnedBadges = BADGES.filter((b) => child.badges.includes(b.id))
  const nextStars = child.stars < 10 ? 10 : child.stars < 30 ? 30 : 50

  const startPractice = () => {
    if (child.plan.enabledSkills.length === 0) {
      toast({ title: 'مهارتی فعال نیست', description: 'متخصص باید در بخش مدیریت، مهارت‌ها را فعال کند.' })
      return
    }
    startSession()
    go('skills')
  }

  const leave = () => {
    selectChild(null)
    go('start')
  }

  return (
    <div className="min-h-dvh flex flex-col bg-gradient-to-b from-emerald-50 via-white to-sky-50">
      <div className="nk-safe-top" />
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-4 space-y-4 nk-fade-up">
        {/* خوش‌آمد */}
        <section className="flex items-center gap-4">
          <Mascot size={72} />
          <div className="flex-1">
            <h1 className="text-xl font-extrabold text-emerald-900">سلام {child.displayName}!</h1>
            <p className="text-sm text-muted-foreground">آماده‌ای با انگشتت بنویسی؟</p>
          </div>
          <Button variant="ghost" size="icon" onClick={leave} aria-label="خروج از پروفایل" className="rounded-full shrink-0">
            <LogOut className="size-5 text-slate-500" />
          </Button>
        </section>

        {/* هدف جلسه */}
        <Card className="rounded-3xl border-sky-200 bg-sky-50/70">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-12 rounded-2xl bg-sky-100 grid place-items-center shrink-0">
              <Sparkles className="size-6 text-sky-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">هدف جلسه امروز</p>
              <p className="font-bold text-sky-900">{goal}</p>
              <p className="text-xs text-muted-foreground mt-0.5">پایه {GRADE_LABELS[child.grade]} — زمان پیشنهادی جلسه: {toFa(child.plan.maxSessionMinutes)} دقیقه</p>
            </div>
          </CardContent>
        </Card>

        {/* پیشرفت و پاداش */}
        <Card className="rounded-3xl border-amber-200">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="size-6 fill-amber-400 text-amber-400" />
                <span className="text-2xl font-extrabold text-amber-600">{toFa(child.stars)}</span>
                <span className="text-sm text-muted-foreground">ستاره جمع کردی</span>
              </div>
              <Badge variant="secondary" className="rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                تا نشان بعدی: {toFa(Math.max(0, nextStars - child.stars))} ستاره
              </Badge>
            </div>
            <Progress value={(child.stars / nextStars) * 100} className="h-3" aria-label="پیشرفت ستاره‌ها" />
            <div className="nk-scroll flex gap-2 overflow-x-auto pb-1 max-h-24">
              {earnedBadges.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">با انجام تمرین‌ها، نشان‌های جالبی بگیر!</p>
              ) : (
                earnedBadges.map((b) => (
                  <div
                    key={b.id}
                    title={b.description}
                    className="flex flex-col items-center gap-0.5 rounded-2xl bg-amber-50 border border-amber-200 px-3 py-2 shrink-0"
                  >
                    <span className="text-2xl" aria-hidden>{b.emoji}</span>
                    <span className="text-[10px] font-bold text-amber-800">{b.title}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* دکمه‌های اصلی */}
        <div className="space-y-3 pt-1">
          <Button
            size="lg"
            className="w-full h-20 rounded-3xl text-2xl font-extrabold shadow-lg hover:shadow-xl active:scale-[0.98] transition-all"
            onClick={startPractice}
          >
            <Play className="size-8" />
            شروع تمرین
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full h-14 rounded-3xl font-bold border-sky-200 text-sky-700 hover:bg-sky-50"
            onClick={() => {
              playPhrase('rest')
              toast({ title: 'زمان استراحت ☕', description: 'کمی استراحت کن، هر وقت خواستی برگرد.' })
            }}
          >
            استراحت
          </Button>
          <Button variant="ghost" className="w-full rounded-2xl text-muted-foreground" onClick={leave}>
            <Home className="size-4" />
            بازگشت به خانه
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          مهارت‌های فعال: {child.plan.enabledSkills.length ? child.plan.enabledSkills.map((s) => SKILL_LABELS[s]).join('، ') : '—'}
        </p>
      </main>
      <NkFooter />
    </div>
  )
}
