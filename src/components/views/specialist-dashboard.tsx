'use client'

import { useMemo, useState } from 'react'
import {
  Award,
  BarChart3,
  CalendarDays,
  ClipboardList,
  FileEdit,
  Lightbulb,
  Pencil,
  Plus,
  Settings2,
  Trash2,
  TrendingUp,
  UserRound,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { decisionTitle, TOUCH_ONLY_DISCLAIMER } from '@/lib/adaptive'
import { formatFaDate, formatFaDateTime, toFa } from '@/lib/fa'
import { GRADE_LABELS } from '@/lib/letters'
import { SKILL_LABELS, SKILL_TYPES, type SkillType } from '@/lib/types'
import { useAppStore } from '@/lib/store'
import { ScreenHeader } from '@/components/nk-ui'
import { toast } from '@/hooks/use-toast'

export function SpecialistScreen() {
  const data = useAppStore((s) => s.data)
  const currentChildId = useAppStore((s) => s.currentChildId)
  const selectChild = useAppStore((s) => s.selectChild)
  const go = useAppStore((s) => s.go)
  const startEditingChild = useAppStore((s) => s.startEditingChild)
  const removeChild = useAppStore((s) => s.removeChild)
  const applyDecision = useAppStore((s) => s.applyDecision)
  const updatePlan = useAppStore((s) => s.updatePlan)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [planOpen, setPlanOpen] = useState(false)

  const child = data.children.find((c) => c.id === currentChildId) ?? data.children[0] ?? null

  const stats = useMemo(() => {
    if (!child) return null
    const attempts = data.attempts.filter((a) => a.childId === child.id)
    const sessions = data.sessions.filter((s) => s.childId === child.id)
    const recent = attempts.slice(-10)
    const overall = recent.length ? Math.round(recent.reduce((s, a) => s + a.accuracyPercent, 0) / recent.length) : 0
    // میانگین دقت هر جلسه برای نمودار
    const perSession = sessions
      .map((s) => {
        const list = attempts.filter((a) => a.sessionId === s.id)
        const avg = list.length ? list.reduce((sum, a) => sum + a.accuracyPercent, 0) / list.length : 0
        return { id: s.id, startedAt: s.startedAt, avg, count: list.length }
      })
      .filter((x) => x.count > 0)
      .slice(-8)
    return { attempts, sessions, overall, perSession }
  }, [child, data])

  if (!child || !stats) {
    return (
      <div className="min-h-dvh flex flex-col bg-slate-50">
        <ScreenHeader title="گزارش عملکرد" onBack={() => go('start')} />
        <main className="flex-1 grid place-items-center p-6 text-center">
          <div className="space-y-4">
            <UserRound className="size-14 text-slate-300 mx-auto" />
            <p className="text-muted-foreground font-bold">هنوز هیچ پرونده کودکی ثبت نشده است.</p>
            <Button onClick={() => startEditingChild(null)} className="rounded-2xl">
              <Plus className="size-4" />
              ساخت اولین پرونده
            </Button>
          </div>
        </main>
      </div>
    )
  }

  const childDecisions = data.decisions.filter((d) => d.childId === child.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const pendingDecisions = childDecisions.filter((d) => !d.applied)

  return (
    <div className="min-h-dvh flex flex-col bg-slate-50">
      <ScreenHeader
        title="گزارش عملکرد"
        subtitle="دقت در تمرین لمسی"
        onBack={() => go('start')}
        left={
          <Button variant="outline" size="sm" className="rounded-full gap-1.5" onClick={() => setPlanOpen(true)}>
            <Settings2 className="size-4" />
            تغییر برنامه
          </Button>
        }
      />

      <main className="flex-1 w-full max-w-3xl mx-auto px-3 py-4 space-y-4 nk-fade-up">
        {/* انتخاب کودک + مدیریت */}
        <div className="flex items-center gap-2">
          <Select value={child.id} onValueChange={(v) => selectChild(v)}>
            <SelectTrigger className="flex-1 h-12 rounded-2xl bg-white" aria-label="انتخاب کودک">
              <div className="flex items-center gap-2 min-w-0">
                <span className="size-8 rounded-full bg-emerald-600 text-white grid place-items-center text-sm font-extrabold shrink-0">
                  {child.displayName.slice(0, 1)}
                </span>
                <span className="font-bold truncate">{child.displayName}</span>
                <span className="text-xs text-muted-foreground shrink-0">— پایه {GRADE_LABELS[child.grade]}</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              {data.children.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.displayName} (پایه {toFa(c.grade)})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" className="size-12 rounded-2xl shrink-0" aria-label="ویرایش پرونده" onClick={() => startEditingChild(child.id)}>
            <Pencil className="size-4" />
          </Button>
          <Button variant="outline" size="icon" className="size-12 rounded-2xl text-rose-600 shrink-0" aria-label="حذف پرونده" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="size-4" />
          </Button>
        </div>

        <Tabs defaultValue="home" dir="rtl">
          <TabsList className="grid grid-cols-4 w-full rounded-2xl h-12 bg-white p-1">
            <TabsTrigger value="home" className="rounded-xl text-xs sm:text-sm">خانه</TabsTrigger>
            <TabsTrigger value="skills" className="rounded-xl text-xs sm:text-sm">مهارت‌ها</TabsTrigger>
            <TabsTrigger value="sessions" className="rounded-xl text-xs sm:text-sm">جلسات</TabsTrigger>
            <TabsTrigger value="suggest" className="rounded-xl text-xs sm:text-sm relative">
              پیشنهاد تمرین
              {pendingDecisions.length > 0 && (
                <span className="absolute -top-1 -start-1 size-5 rounded-full bg-amber-500 text-white text-[10px] grid place-items-center font-bold">
                  {toFa(pendingDecisions.length)}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ─── تب خانه ─── */}
          <TabsContent value="home" className="space-y-4 mt-4">
            <div className="grid sm:grid-cols-3 gap-3">
              <AccuracyRing value={stats.overall} />
              <MiniStat icon={<CalendarDays className="size-5 text-sky-600" />} title="جلسات" value={toFa(stats.sessions.length)} sub="جلسه تمرین ثبت‌شده" />
              <MiniStat icon={<Award className="size-5 text-amber-500" />} title="ستاره‌ها" value={toFa(child.stars)} sub={`${toFa(stats.attempts.length)} تلاش ثبت‌شده`} />
            </div>

            <Card className="rounded-3xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="size-4 text-emerald-600" />
                  روند دقت در تمرین‌ها (میانگین هر جلسه)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TrendChart points={stats.perSession.map((p) => p.avg)} />
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-sky-200 bg-sky-50/50">
              <CardContent className="p-4 text-xs leading-6 text-sky-900">
                <strong>محدودیت تفسیر:</strong> {TOUCH_ONLY_DISCLAIMER} برای ادعای درمانی، ارزیابی تخصصی و سنجش معتبر لازم است.
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── تب مهارت‌ها ─── */}
          <TabsContent value="skills" className="space-y-3 mt-4">
            {SKILL_TYPES.map((skill) => (
              <SkillCard
                key={skill}
                skill={skill}
                enabled={child.plan.enabledSkills.includes(skill)}
                level={child.plan.levelOverrides[skill] ?? child.skillLevels[skill] ?? 1}
                attempts={stats.attempts.filter((a) => a.skillType === skill)}
                onToggle={(en) => {
                  const enabled = en
                    ? [...child.plan.enabledSkills, skill as SkillType]
                    : child.plan.enabledSkills.filter((s) => s !== skill)
                  updatePlan(child.id, { enabledSkills: enabled })
                  toast({ title: en ? `«${SKILL_LABELS[skill]}» فعال شد` : `«${SKILL_LABELS[skill]}» غیرفعال شد` })
                }}
                onLevel={(lvl) => {
                  updatePlan(child.id, { levelOverrides: { ...child.plan.levelOverrides, [skill]: lvl } })
                  toast({ title: `سطح «${SKILL_LABELS[skill]}» روی ${toFa(lvl)} تنظیم شد`, description: 'این تنظیم متخصص بر پیشنهاد خودکار اولویت دارد.' })
                }}
              />
            ))}
          </TabsContent>

          {/* ─── تب جلسات ─── */}
          <TabsContent value="sessions" className="mt-4">
            <Card className="rounded-3xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="size-4 text-emerald-600" />
                  تاریخچه جلسات ({toFa(stats.sessions.length)})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats.sessions.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">هنوز جلسه‌ای ثبت نشده است.</p>
                ) : (
                  <ScrollArea className="h-80 nk-scroll">
                    <div className="space-y-2 pe-2">
                      {[...stats.sessions].reverse().map((s) => {
                        const list = stats.attempts.filter((a) => a.sessionId === s.id)
                        const avg = list.length ? Math.round(list.reduce((sum, a) => sum + a.accuracyPercent, 0) / list.length) : 0
                        return (
                          <div key={s.id} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3">
                            <div className="size-10 rounded-xl bg-emerald-50 grid place-items-center shrink-0">
                              <CalendarDays className="size-5 text-emerald-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm">{formatFaDate(s.startedAt)}</p>
                              <p className="text-xs text-muted-foreground">
                                {toFa(list.length)} تلاش — وضعیت: {s.status === 'completed' ? 'تکمیل' : s.status === 'stopped' ? 'متوقف' : 'فعال'}
                              </p>
                            </div>
                            <Badge className={avg >= 85 ? 'bg-emerald-600' : avg >= 60 ? 'bg-amber-500' : 'bg-rose-500'}>
                              {toFa(avg)}٪
                            </Badge>
                          </div>
                        )
                      })}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── تب پیشنهاد تمرین ─── */}
          <TabsContent value="suggest" className="space-y-3 mt-4">
            {childDecisions.length === 0 ? (
              <Card className="rounded-3xl">
                <CardContent className="p-8 text-center text-sm text-muted-foreground">
                  پس از انجام تمرین‌ها، پیشنهادهای موتور تطبیقی اینجا نمایش داده می‌شود.
                </CardContent>
              </Card>
            ) : (
              <ScrollArea className="max-h-[32rem] nk-scroll">
                <div className="space-y-2.5 pe-2">
                  {childDecisions.slice(0, 15).map((d) => (
                    <Card key={d.id} className={`rounded-2xl ${d.applied ? 'opacity-80' : 'border-amber-300'}`}>
                      <CardContent className="p-3.5 space-y-2">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <Badge variant={d.action === 'advance' ? 'default' : d.action === 'ease' ? 'destructive' : 'secondary'} className="rounded-full">
                            {decisionTitle(d.action)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {SKILL_LABELS[d.skillType]} — {formatFaDateTime(d.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm leading-6">{d.reason}</p>
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-xs text-muted-foreground">
                            پیشنهاد: سطح {toFa(d.suggestedLevel)} — {d.suggestedGuidance === 'full' ? 'راهنمای کامل' : d.suggestedGuidance === 'partial' ? 'راهنمای جزئی' : 'بدون راهنما'}
                            {d.overridden && ' — (اصلاح‌شده توسط متخصص)'}
                          </span>
                          {!d.applied && (
                            <div className="flex gap-2">
                              <Button size="sm" className="rounded-xl h-8" onClick={() => { applyDecision(d.id, 'accept'); toast({ title: 'پیشنهاد تأیید و اعمال شد ✓' }) }}>
                                تأیید
                              </Button>
                              <Select onValueChange={(v) => { applyDecision(d.id, 'override', Number(v)); toast({ title: 'سطح توسط متخصص اصلاح شد' }) }}>
                                <SelectTrigger className="h-8 rounded-xl text-xs w-28">
                                  <SelectValue placeholder="اصلاح سطح" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="1">سطح ۱</SelectItem>
                                  <SelectItem value="2">سطح ۲</SelectItem>
                                  <SelectItem value="3">سطح ۳</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>

        <Button variant="outline" className="w-full rounded-2xl" onClick={() => startEditingChild(null)}>
          <Plus className="size-4" />
          افزودن پرونده جدید
        </Button>
      </main>

      {/* دیالوگ برنامه تمرینی */}
      <PlanDialog open={planOpen} onOpenChange={setPlanOpen} childId={child.id} />

      {/* حذف پرونده */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="max-w-sm rounded-3xl" dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف پرونده {child.displayName}؟</AlertDialogTitle>
            <AlertDialogDescription>
              همه جلسات، تلاش‌ها و گزارش‌های این کودک حذف می‌شوند. این عمل قابل بازگشت نیست. اگر داده لازم است، اول پشتیبان تهیه کنید.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-2xl">انصراف</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-2xl bg-rose-600 hover:bg-rose-700"
              onClick={() => {
                removeChild(child.id)
                setDeleteOpen(false)
                toast({ title: 'پرونده حذف شد' })
              }}
            >
              حذف قطعی
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

/* ─── اجزای فرعی داشبورد ─── */

function AccuracyRing({ value }: { value: number }) {
  const r = 42
  const c = 2 * Math.PI * r
  const filled = (Math.max(0, Math.min(100, value)) / 100) * c
  return (
    <Card className="rounded-3xl">
      <CardContent className="p-4 flex items-center gap-4">
        <svg viewBox="0 0 100 100" className="size-24 -rotate-90 shrink-0" role="img" aria-label={`دقت کلی ${value} درصد`}>
          <circle cx="50" cy="50" r={r} fill="none" stroke="#e2e8f0" strokeWidth="10" />
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={value >= 85 ? '#16a34a' : value >= 60 ? '#f59e0b' : '#ef4444'}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${filled} ${c - filled}`}
          />
        </svg>
        <div>
          <p className="text-3xl font-extrabold">{toFa(value)}٪</p>
          <p className="text-xs text-muted-foreground leading-5">دقت میانگین<br />تمرین‌های اخیر</p>
        </div>
      </CardContent>
    </Card>
  )
}

function MiniStat({ icon, title, value, sub }: { icon: React.ReactNode; title: string; value: string; sub: string }) {
  return (
    <Card className="rounded-3xl">
      <CardContent className="p-4 flex items-center gap-3">
        <div className="size-11 rounded-2xl bg-slate-50 grid place-items-center shrink-0">{icon}</div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className="text-xl font-extrabold">{value}</p>
          <p className="text-[10px] text-muted-foreground truncate">{sub}</p>
        </div>
      </CardContent>
    </Card>
  )
}

/** نمودار خطی روند دقت — SVG ساده بدون وابستگی */
function TrendChart({ points }: { points: number[] }) {
  if (points.length < 2) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        برای نمایش نمودار روند، حداقل دو جلسه تمرین لازم است.
      </p>
    )
  }
  const W = 320
  const H = 140
  const padX = 14
  const padY = 14
  const stepX = (W - padX * 2) / (points.length - 1)
  const y = (v: number) => H - padY - (Math.max(0, Math.min(100, v)) / 100) * (H - padY * 2)
  const pts = points.map((v, i) => ({ x: padX + i * stepX, y: y(v) }))
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="نمودار روند دقت">
      {[0, 25, 50, 75, 100].map((v) => (
        <g key={v}>
          <line x1={padX} x2={W - padX} y1={y(v)} y2={y(v)} stroke="#f1f5f9" strokeWidth="1" />
          <text x={W - padX + 2} y={y(v) + 3} fontSize="8" fill="#94a3b8">
            {toFa(v)}
          </text>
        </g>
      ))}
      <path d={path} fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#fff" stroke="#16a34a" strokeWidth="2" />
      ))}
    </svg>
  )
}

function SkillCard({
  skill,
  enabled,
  level,
  attempts,
  onToggle,
  onLevel,
}: {
  skill: SkillType
  enabled: boolean
  level: number
  attempts: { accuracyPercent: number; guidanceLevel: string; startedAt: string }[]
  onToggle: (en: boolean) => void
  onLevel: (lvl: number) => void
}) {
  const avg = attempts.length ? Math.round(attempts.reduce((s, a) => s + a.accuracyPercent, 0) / attempts.length) : 0
  const independent = attempts.filter((a) => a.guidanceLevel !== 'full').length
  return (
    <Card className="rounded-3xl">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <ClipboardList className="size-5 text-emerald-600 shrink-0" />
            <h3 className="font-bold">{SKILL_LABELS[skill]}</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{enabled ? 'فعال' : 'غیرفعال'}</span>
            <Switch checked={enabled} onCheckedChange={onToggle} aria-label={`فعال/غیرفعال ${SKILL_LABELS[skill]}`} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-xl bg-slate-50 p-2">
            <p className="font-extrabold text-lg">{toFa(attempts.length)}</p>
            <p className="text-muted-foreground">تلاش</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-2">
            <p className={`font-extrabold text-lg ${avg >= 85 ? 'text-emerald-600' : avg >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>{toFa(avg)}٪</p>
            <p className="text-muted-foreground">میانگین دقت</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-2">
            <p className="font-extrabold text-lg">{toFa(independent)}</p>
            <p className="text-muted-foreground">تلاش مستقل</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold shrink-0">سطح تمرین:</span>
          <div className="flex gap-1.5">
            {[1, 2, 3].map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => onLevel(l)}
                className={`size-9 rounded-xl text-sm font-extrabold border-2 transition-colors ${
                  level === l ? 'bg-emerald-600 text-white border-emerald-600' : 'border-slate-200 text-slate-600 hover:border-emerald-300'
                }`}
                aria-label={`سطح ${l}`}
                aria-pressed={level === l}
              >
                {toFa(l)}
              </button>
            ))}
          </div>
          <span className="text-[10px] text-muted-foreground">تغییر دستی متخصص</span>
        </div>
      </CardContent>
    </Card>
  )
}

function PlanDialog({ open, onOpenChange, childId }: { open: boolean; onOpenChange: (v: boolean) => void; childId: string }) {
  const child = useAppStore((s) => s.data.children.find((c) => c.id === childId))
  const updatePlan = useAppStore((s) => s.updatePlan)
  const [minutes, setMinutes] = useState(child?.plan.maxSessionMinutes ?? 10)
  const [auto, setAuto] = useState(child?.plan.autoAdvance ?? true)
  const [note, setNote] = useState(child?.plan.note ?? '')
  const [initialized, setInitialized] = useState<string | null>(null)

  // همگام‌سازی هنگام باز شدن دیالوگ با کودک جاری
  if (open && initialized !== childId && child) {
    setInitialized(childId)
    setMinutes(child.plan.maxSessionMinutes)
    setAuto(child.plan.autoAdvance)
    setNote(child.plan.note ?? '')
  }

  if (!child) return null

  const save = () => {
    updatePlan(childId, { maxSessionMinutes: minutes, autoAdvance: auto, note: note.trim() || undefined })
    toast({ title: 'برنامه تمرینی ذخیره شد ✓' })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl max-h-[85dvh] overflow-y-auto nk-scroll" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-start flex items-center gap-2">
            <FileEdit className="size-5 text-emerald-600" />
            برنامه تمرینی — {child.displayName}
          </DialogTitle>
          <DialogDescription className="text-start">
            قواعد تطبیقی پیشنهاد می‌دهند؛ تأیید نهایی با متخصص است.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          <div className="space-y-3">
            <Label>حداکثر مدت هر جلسه: {toFa(minutes)} دقیقه</Label>
            <Slider
              value={[minutes]}
              min={5}
              max={20}
              step={1}
              onValueChange={(v) => setMinutes(v[0] ?? 10)}
              aria-label="مدت جلسه"
            />
          </div>
          <div className="flex items-center justify-between rounded-2xl border p-3.5">
            <div>
              <p className="font-bold text-sm">پیشروی خودکار سطح</p>
              <p className="text-xs text-muted-foreground leading-5">
                در صورت تأیید قواعد (میانگین ≥۸۵٪ + دو تلاش مستقل)، سطح بعدی خودکار اجرا می‌شود. خاموش کنید تا فقط با تأیید شما پیشروی شود.
              </p>
            </div>
            <Switch checked={auto} onCheckedChange={setAuto} aria-label="پیشروی خودکار" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="planNote">یادداشت متخصص</Label>
            <Textarea
              id="planNote"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="مثلاً: تمرکز روی حروف با نقطه؛ حداکثر سه تلاش پشت سر هم؛ استراحت بین تمرین‌ها"
              className="rounded-2xl min-h-24"
              maxLength={500}
            />
          </div>
          <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3 text-xs leading-6 text-amber-900">
            <Lightbulb className="inline size-4 me-1" />
            آستانه‌های موتور تطبیقی (۸۵٪ / ۶۰٪) مقادیر اولیه آزمایشی هستند و پس از پایلوت با نظر متخصص قابل تنظیم‌اند.
          </div>
          <Button className="w-full h-12 rounded-2xl font-bold" onClick={save}>
            ذخیره برنامه
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
