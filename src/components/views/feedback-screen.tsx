'use client'

import { useEffect, useMemo } from 'react'
import { Clock, Home, Lightbulb, Play, Star, Target, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { GUIDANCE_LABELS } from '@/lib/types'
import { formatDurationMs, toFa } from '@/lib/fa'
import { starsFor } from '@/lib/scoring'
import { decisionTitle } from '@/lib/adaptive'
import { useAppStore, useCurrentChild } from '@/lib/store'
import { playPhrase } from '@/lib/audio'
import { Mascot } from '@/components/nk-ui'
import { BADGES } from '@/lib/types'

export function FeedbackScreen() {
  const attempt = useAppStore((s) => s.lastAttempt)
  const decision = useAppStore((s) => s.lastDecision)
  const newBadges = useAppStore((s) => s.justEarnedBadges)
  const sessionStartedAt = useAppStore((s) => s.sessionStartedAt)
  const child = useCurrentChild()
  const go = useAppStore((s) => s.go)

  const stars = attempt ? starsFor(attempt.accuracyPercent) : 0

  const verdict = useMemo(() => {
    if (!attempt) return { title: 'تمرین تمام شد!', msg: 'ایول که آمدی.', key: 'good' }
    if (attempt.accuracyPercent >= 85 && attempt.completed) return { title: 'آفرین!', msg: 'مسیر را به خوبی دنبال کردی.', key: 'great' }
    if (attempt.accuracyPercent >= 60) return { title: 'خوب بود!', msg: 'کمی دقیق‌تر، عالی می‌شوی.', key: 'good' }
    return { title: 'تلاش خوبی بود!', msg: 'این بار از نقطه سبز شروع کن.', key: 'try_again' }
  }, [attempt])

  // صدا یک‌بار هنگام ورود
  useEffect(() => {
    if (stars > 0) playPhrase('star')
    else playPhrase(verdict.key)
  }, [])

  // پایان جلسه به دلیل زمان
  const sessionOver = useMemo(() => {
    if (!sessionStartedAt || !child) return false
    const elapsed = (Date.now() - new Date(sessionStartedAt).getTime()) / 60000
    return elapsed >= child.plan.maxSessionMinutes
  }, [sessionStartedAt, child])

  if (!attempt) {
    return (
      <div className="min-h-dvh grid place-items-center p-6">
        <Button onClick={() => go('childHome')}>بازگشت به خانه</Button>
      </div>
    )
  }

  const nextBadges = BADGES.filter((b) => newBadges.includes(b.id))

  return (
    <div className="min-h-dvh flex flex-col bg-gradient-to-b from-amber-50 via-white to-emerald-50">
      <div className="nk-safe-top" />
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-5 space-y-4 nk-fade-up">
        {/* تیتر و mascot */}
        <section className="text-center space-y-2">
          <div className="flex justify-center">
            <Mascot size={96} />
          </div>
          <h1 className="text-3xl font-extrabold text-emerald-700 nk-pop">{verdict.title}</h1>
          <p className="text-muted-foreground">{verdict.msg}</p>
          {/* ستاره‌ها */}
          <div className="flex justify-center gap-2 pt-1" aria-label={`${stars} ستاره`}>
            {[1, 2, 3].map((i) => (
              <Star
                key={i}
                className={`size-10 nk-pop ${i <= stars ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                style={{ animationDelay: `${i * 0.15}s` }}
                aria-hidden
              />
            ))}
          </div>
          {nextBadges.length > 0 && (
            <div className="flex justify-center gap-2 flex-wrap pt-1">
              {nextBadges.map((b) => (
                <span key={b.id} className="nk-pop inline-flex items-center gap-1.5 rounded-full bg-amber-100 border border-amber-300 px-3 py-1 text-xs font-bold text-amber-800">
                  <span className="text-base" aria-hidden>{b.emoji}</span>
                  نشان جدید: {b.title}
                </span>
              ))}
            </div>
          )}
        </section>

        {/* آمار تلاش — عنوان صریح: دقت در تمرین لمسی */}
        <Card className="rounded-3xl">
          <CardContent className="p-4">
            <div className="grid grid-cols-4 gap-2 text-center">
              <Stat icon={<Target className="size-5 text-emerald-600" />} label="دقت" value={`${toFa(attempt.accuracyPercent)}٪`} />
              <Stat icon={<Clock className="size-5 text-sky-600" />} label="مدت زمان" value={formatDurationMs(attempt.durationMs)} />
              <Stat icon={<Lightbulb className="size-5 text-amber-500" />} label="راهنما" value={GUIDANCE_LABELS[attempt.guidanceLevel]} small />
              <Stat icon={<XCircle className={`size-5 ${attempt.offPathCount > 0 ? 'text-rose-500' : 'text-emerald-500'}`} />} label="خروج از مسیر" value={toFa(attempt.offPathCount)} />
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-3">
              «دقت» یعنی دقت در تمرین لمسی — معیار همین تمرین روی صفحه است.
            </p>
          </CardContent>
        </Card>

        {/* توصیه بعدی بر اساس موتور تطبیقی */}
        {decision && (
          <Card className="rounded-3xl border-sky-200 bg-sky-50/60">
            <CardContent className="p-4 flex items-start gap-3">
              <div className="size-11 rounded-2xl bg-sky-100 grid place-items-center shrink-0">
                <Lightbulb className="size-6 text-sky-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">توصیه تمرین بعدی</p>
                <p className="font-bold text-sky-900 text-sm leading-6">{decision.reason}</p>
                <p className="text-xs text-sky-700 mt-0.5">
                  تصمیم: {decisionTitle(decision.action)} — سطح {toFa(decision.suggestedLevel)} — {GUIDANCE_LABELS[decision.suggestedGuidance]}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* دکمه‌ها */}
        <div className="space-y-2.5 pt-1">
          {sessionOver ? (
            <>
              <div className="rounded-3xl bg-amber-50 border border-amber-200 p-4 text-center text-sm font-bold text-amber-800">
                ⏰ زمان جلسه امروزش تمام شد — دستت درد نکند!
              </div>
              <Button size="lg" className="w-full h-16 rounded-3xl text-lg font-bold" onClick={() => endAndGoHome()}>
                <Home className="size-5" />
                پایان جلسه و بازگشت به خانه
              </Button>
            </>
          ) : (
            <>
              <Button size="lg" className="w-full h-16 rounded-3xl text-lg font-bold shadow-lg" onClick={() => go('skills')}>
                <Play className="size-6" />
                شروع تمرین بعدی
              </Button>
              <Button size="lg" variant="outline" className="w-full h-14 rounded-3xl font-bold" onClick={() => endAndGoHome()}>
                <Home className="size-5" />
                بازگشت به خانه
              </Button>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

function endAndGoHome() {
  const store = useAppStore.getState()
  store.endSession('completed')
  playPhrase('home')
  store.go('childHome')
}

function Stat({ icon, label, value, small }: { icon: React.ReactNode; label: string; value: string; small?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl bg-slate-50 p-2.5">
      {icon}
      <span className={`font-extrabold text-slate-800 ${small ? 'text-xs' : 'text-lg'}`}>{value}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  )
}
