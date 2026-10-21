'use client'

import { useState } from 'react'
import { CloudUpload, GraduationCap, HelpCircle, Lock, Settings, Star, Stethoscope, UserPlus, Volume2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GRADE_LABELS } from '@/lib/letters'
import { toFa } from '@/lib/fa'
import { useAppStore } from '@/lib/store'
import { playPhrase } from '@/lib/audio'
import { Mascot, NkFooter } from '@/components/nk-ui'
import { toast } from '@/hooks/use-toast'

export function StartScreen() {
  const children = useAppStore((s) => s.data.children)
  const pin = useAppStore((s) => s.data.settings.specialistPin)
  const selectChild = useAppStore((s) => s.selectChild)
  const go = useAppStore((s) => s.go)

  const [pinOpen, setPinOpen] = useState(false)
  const [pinValue, setPinValue] = useState('')

  const openChild = (id: string) => {
    selectChild(id)
    go('childHome')
  }

  const submitPin = () => {
    if (pinValue === pin) {
      setPinOpen(false)
      setPinValue('')
      go('specialist')
    } else {
      toast({ title: 'رمز نادرست است', description: 'رمز ورود بخش متخصص را بررسی کنید.', variant: 'destructive' })
    }
  }

  return (
    <div className="min-h-dvh flex flex-col bg-gradient-to-b from-sky-100 via-white to-emerald-50">
      <div className="nk-safe-top" />
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 pt-4 pb-2 space-y-5 nk-fade-up">
        {/* سربرگ با شخصیت راهنما */}
        <section className="relative rounded-3xl bg-gradient-to-b from-sky-300 to-sky-100 p-5 pt-6 overflow-hidden shadow-sm">
          <div className="absolute -bottom-6 -start-6 size-28 rounded-full bg-white/25" aria-hidden />
          <div className="absolute top-4 end-8 size-16 rounded-full bg-white/20" aria-hidden />
          <div className="relative flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => playPhrase('welcome')}
              className="rounded-full outline-offset-4 focus-visible:outline-2 focus-visible:outline-emerald-700"
              aria-label="پخش پیام خوش‌آمد"
            >
              <Mascot size={104} />
            </button>
            <div className="relative bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow text-center max-w-xs">
              <p className="font-bold text-emerald-900">سلام!</p>
              <p className="text-sm text-emerald-800/80">برای شروع، نقش خود را انتخاب کن.</p>
              <Volume2 className="absolute -top-2 -end-2 size-5 text-sky-400" aria-hidden />
            </div>
          </div>
        </section>

        {/* کارت دانش‌آموز */}
        <Card className="border-emerald-200 shadow-md rounded-3xl overflow-hidden">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-2xl bg-emerald-100 grid place-items-center">
                <GraduationCap className="size-7 text-emerald-700" />
              </div>
              <div>
                <h2 className="font-extrabold text-emerald-900">من دانش‌آموز هستم</h2>
                <p className="text-xs text-muted-foreground">تمرین و بازی با نوشتن</p>
              </div>
            </div>

            {children.length === 0 ? (
              <div className="text-center space-y-3 py-2">
                <p className="text-sm text-muted-foreground">هنوز پرونده‌ای ساخته نشده است.</p>
                <Button size="lg" className="w-full rounded-2xl h-14 text-lg font-bold" onClick={() => go('childForm')}>
                  <UserPlus className="size-5" />
                  ساخت پرونده تمرین
                </Button>
              </div>
            ) : (
              <div className="grid gap-2.5 sm:grid-cols-2">
                {children.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => openChild(c.id)}
                    className="group flex items-center gap-3 rounded-2xl border-2 border-emerald-100 bg-emerald-50/60 hover:border-emerald-400 hover:bg-emerald-50 p-3 text-start transition-colors outline-offset-2 focus-visible:outline-2 focus-visible:outline-emerald-600"
                    aria-label={`ورود به محیط تمرین ${c.displayName}`}
                  >
                    <span className="size-11 rounded-full bg-emerald-600 text-white grid place-items-center text-lg font-extrabold shrink-0">
                      {c.displayName.slice(0, 1)}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block font-bold text-emerald-900 truncate">{c.displayName}</span>
                      <span className="block text-xs text-muted-foreground">پایه {GRADE_LABELS[c.grade]}</span>
                    </span>
                    <span className="flex items-center gap-1 text-amber-500 font-extrabold text-sm shrink-0">
                      <Star className="size-4 fill-amber-400 text-amber-400" />
                      {toFa(c.stars)}
                    </span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => go('childForm')}
                  className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-emerald-200 text-emerald-700 p-3 text-sm font-bold hover:border-emerald-400 transition-colors"
                >
                  <UserPlus className="size-4" />
                  پرونده جدید
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* کارت متخصص */}
        <Card className="border-violet-200 shadow-md rounded-3xl overflow-hidden">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-2xl bg-violet-100 grid place-items-center">
                <Stethoscope className="size-7 text-violet-700" />
              </div>
              <div>
                <h2 className="font-extrabold text-violet-900">من متخصص هستم</h2>
                <p className="text-xs text-muted-foreground">مدیریت و گزارش‌ها</p>
              </div>
            </div>
            <Button
              size="lg"
              className="w-full rounded-2xl h-14 text-lg font-bold bg-violet-600 hover:bg-violet-700 text-white"
              onClick={() => setPinOpen(true)}
            >
              <Lock className="size-5" />
              ورود
            </Button>
          </CardContent>
        </Card>

        {/* ردیف ابزارها */}
        <div className="grid grid-cols-3 gap-3 pb-1">
          <ToolButton icon={<Settings className="size-6 text-sky-600" />} label="تنظیمات" onClick={() => go('settings')} />
          <ToolButton icon={<HelpCircle className="size-6 text-emerald-600" />} label="راهنما" onClick={() => go('help')} />
          <ToolButton icon={<CloudUpload className="size-6 text-violet-600" />} label="پشتیبان‌گیری" onClick={() => go('backup')} />
        </div>
      </main>

      <NkFooter />

      {/* دیالوگ رمز متخصص */}
      <Dialog open={pinOpen} onOpenChange={setPinOpen}>
        <DialogContent className="max-w-sm rounded-3xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-start">ورود متخصص</DialogTitle>
            <DialogDescription className="text-start">
              برای محافظت از داده‌ها، بخش مدیریت با رمز ورود محافظت می‌شود.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pin">رمز ورود (پیش‌فرض: ۱۲۳۴)</Label>
              <Input
                id="pin"
                type="password"
                inputMode="numeric"
                dir="ltr"
                className="text-center text-xl tracking-[0.4em] h-12"
                value={pinValue}
                onChange={(e) => setPinValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitPin()}
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <Button className="flex-1 rounded-2xl" onClick={submitPin}>ورود</Button>
              <Button variant="outline" className="rounded-2xl" onClick={() => setPinOpen(false)}>انصراف</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ToolButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 rounded-2xl bg-white border border-emerald-100 shadow-sm py-3.5 px-2 hover:shadow hover:border-emerald-300 active:scale-95 transition-all outline-offset-2 focus-visible:outline-2 focus-visible:outline-emerald-600"
    >
      {icon}
      <span className="text-xs font-bold text-slate-700">{label}</span>
    </button>
  )
}
