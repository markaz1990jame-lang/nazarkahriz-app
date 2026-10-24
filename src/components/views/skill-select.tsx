'use client'

import { Feather, Lock, PenTool, Route } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { SKILL_DESCRIPTIONS, SKILL_LABELS, type SkillType } from '@/lib/types'
import { toFa } from '@/lib/fa'
import { useAppStore, useCurrentChild } from '@/lib/store'
import { playPhrase } from '@/lib/audio'
import { ScreenHeader } from '@/components/nk-ui'

const SKILL_ICONS: Record<SkillType, React.ReactNode> = {
  path: <Route className="size-9 text-emerald-600" />,
  letter: <PenTool className="size-9 text-sky-600" />,
  independent: <Feather className="size-9 text-violet-600" />,
}

const SKILL_COLORS: Record<SkillType, string> = {
  path: 'border-emerald-200 hover:border-emerald-400 bg-emerald-50/60',
  letter: 'border-sky-200 hover:border-sky-400 bg-sky-50/60',
  independent: 'border-violet-200 hover:border-violet-400 bg-violet-50/60',
}

export function SkillSelectScreen() {
  const child = useCurrentChild()
  const beginExercise = useAppStore((s) => s.beginExercise)
  const go = useAppStore((s) => s.go)

  if (!child) {
    return (
      <div className="min-h-dvh grid place-items-center p-6">
        <Button onClick={() => go('start')}>بازگشت به صفحه شروع</Button>
      </div>
    )
  }

  const pick = (skill: SkillType) => {
    if (!child.plan.enabledSkills.includes(skill)) return
    beginExercise(skill)
  }

  return (
    <div className="min-h-dvh flex flex-col bg-white">
      <ScreenHeader
        title="چه تمرینی دوست داری؟"
        subtitle={`${child.displayName} عزیز، یکی را انتخاب کن`}
        onBack={() => go('childHome')}
      />
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-5 space-y-4 nk-fade-up">
        {(['path', 'letter', 'independent'] as SkillType[]).map((skill) => {
          const enabled = child.plan.enabledSkills.includes(skill)
          const level = child.plan.levelOverrides[skill] ?? child.skillLevels[skill] ?? 1
          return (
            <button
              key={skill}
              type="button"
              disabled={!enabled}
              onClick={() => pick(skill)}
              className={`w-full text-start rounded-3xl border-2 p-5 transition-all outline-offset-2 focus-visible:outline-2 focus-visible:outline-emerald-600 ${
                enabled ? `${SKILL_COLORS[skill]} active:scale-[0.99] shadow-sm hover:shadow` : 'opacity-60 cursor-not-allowed border-slate-200 bg-slate-50'
              }`}
              aria-label={enabled ? `${SKILL_LABELS[skill]} — مرحله ${level}` : `${SKILL_LABELS[skill]} — غیرفعال`}
            >
              <div className="flex items-center gap-4">
                <div className="size-16 rounded-2xl bg-white grid place-items-center shadow-sm shrink-0">
                  {enabled ? SKILL_ICONS[skill] : <Lock className="size-8 text-slate-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-extrabold text-slate-800">{SKILL_LABELS[skill]}</h2>
                    {enabled && (
                      <Badge className="rounded-full bg-emerald-600 text-white">
                        مرحله {toFa(level)}
                      </Badge>
                    )}
                    {!enabled && (
                      <Badge variant="secondary" className="rounded-full">
                        غیرفعال — توسط متخصص
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{SKILL_DESCRIPTIONS[skill]}</p>
                </div>
              </div>
            </button>
          )
        })}
        <Card className="rounded-2xl border-dashed">
          <CardContent className="p-3.5 text-center text-xs text-muted-foreground">
            سطح تمرین به‌صورت خودکار بر اساس عملکرد قبلی تو انتخاب می‌شود تا نه خیلی سخت باشد نه خیلی آسان.
          </CardContent>
        </Card>
        <Button variant="ghost" className="w-full rounded-2xl" onClick={() => playPhrase('start_hint')}>
          🔊 یادآوری صوتی راهنما
        </Button>
      </main>
    </div>
  )
}
