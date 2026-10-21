'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Eraser, Lightbulb, RotateCcw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
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
import { arrowPoints, dist, downsample, nearestDist, sampleExercise, type Pt } from '@/lib/geometry'
import { COVERAGE_AUTO_FINISH, COVERAGE_COMPLETE, OffPathCounter, coverageOf, finalAccuracy } from '@/lib/scoring'
import { GUIDANCE_LABELS } from '@/lib/types'
import { formatDurationMs, toFa } from '@/lib/fa'
import { useAppStore, useCurrentChild } from '@/lib/store'
import { playLetter, playPhrase } from '@/lib/audio'
import { toast } from '@/hooks/use-toast'

/**
 * صفحه نوشتن — بوم رسم تمام‌صفحه (سند صفحه ۴)
 * - مختصات لمس به فضای نرمال ۰..۱۰۰ تبدیل می‌شود (مستقل از اندازه صفحه — سند ۶.۳)
 * - ثبت لمس/حرکت/برداشتن انگشت و شمارش خروج از مسیر با hysteresis (سند ۶.۵)
 * - تلاش ناقص به‌عنوان موفقیت کامل ثبت نمی‌شود (سند ۶.۴)
 */

export function PracticeScreen() {
  const exercise = useAppStore((s) => s.currentExercise)
  const child = useCurrentChild()
  const recordAttempt = useAppStore((s) => s.recordAttempt)
  const go = useAppStore((s) => s.go)

  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [size, setSize] = useState(0)
  const [hintOn, setHintOn] = useState(false)
  const [coveragePct, setCoveragePct] = useState(0)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [exitOpen, setExitOpen] = useState(false)
  const [showStartBubble, setShowStartBubble] = useState(true)

  const startedAtRef = useRef(Date.now())
  const strokesRef = useRef<Pt[][]>([])
  const currentStrokeRef = useRef<Pt[] | null>(null)
  const activePointerRef = useRef<number | null>(null)
  const counterRef = useRef<OffPathCounter | null>(null)
  const allPointsRef = useRef<Pt[]>([])
  const drawScheduledRef = useRef(false)
  const lastCoverCheckRef = useRef(0)
  const finishedRef = useRef(false)

  // نمونه‌برداری مسیر هدف (یک‌بار برای هر تمرین)
  const targetPts = useMemo(() => {
    if (!exercise) return []
    return sampleExercise(exercise.strokes, exercise.dots, 2.2)
  }, [exercise])

  const startPt = targetPts[0] ?? null

  const strokePathObjs = useMemo(() => {
    if (!exercise) return []
    return exercise.strokes.map((d) => ({ d, pts: sampleExercise([d], [], 2.5) }))
  }, [exercise])

  // تلورانس
  const tolerance = exercise?.tolerance ?? 7

  // تنظیم شمارنده خروج از مسیر
  useEffect(() => {
    counterRef.current = new OffPathCounter(tolerance)
  }, [tolerance, exercise])

  // شروع تمرین: تایمر + صدا
  useEffect(() => {
    startedAtRef.current = Date.now()
    finishedRef.current = false
    if (exercise) {
      if (exercise.skillType === 'independent') playPhrase('independent')
      else playPhrase('start_hint')
      if (exercise.referenceChar) {
        // تلفظ حرف
        const letterId = exercise.id.split('-')[1]
        if (letterId) playLetter(letterId, exercise.referenceChar)
      }
    }
    const t = setInterval(() => setElapsedMs(Date.now() - startedAtRef.current), 1000)
    return () => clearInterval(t)
  }, [exercise])

  // اندازه بوم — مربع متناسب با فضای موجود
  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const ro = new ResizeObserver((entries) => {
      const r = entries[0]?.contentRect
      if (!r) return
      const s = Math.floor(Math.min(r.width, r.height))
      setSize(Math.max(200, s))
    })
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [])

  /** رسم کامل صحنه */
  const draw = useCallback(() => {
    drawScheduledRef.current = false
    const canvas = canvasRef.current
    const ex = exercise
    if (!canvas || !ex || size === 0) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(2.5, window.devicePixelRatio || 1)
    const px = Math.round(size * dpr)
    if (canvas.width !== px) {
      canvas.width = px
      canvas.height = px
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    const W = size
    const u = W / 100 // یکا از فضای نرمال

    // پس‌زمینه
    ctx.clearRect(0, 0, W, W)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, W, W)

    // خط زمینه برای حروف (خط دفتر)
    if (ex.skillType !== 'path') {
      ctx.strokeStyle = '#e2e8f0'
      ctx.lineWidth = 2
      ctx.setLineDash([])
      ctx.beginPath()
      ctx.moveTo(6 * u, 80 * u)
      ctx.lineTo(94 * u, 80 * u)
      ctx.stroke()
      ctx.setLineDash([4, 6])
      ctx.strokeStyle = '#eef2f7'
      ctx.beginPath()
      ctx.moveTo(6 * u, 30 * u)
      ctx.lineTo(94 * u, 30 * u)
      ctx.stroke()
      ctx.setLineDash([])
    }

    const showFullGuide = ex.guidance === 'full' || hintOn

    // مسیر هدف
    for (const sp of strokePathObjs) {
      if (showFullGuide) {
        ctx.strokeStyle = '#94a3b8'
        ctx.lineWidth = 5.5
        ctx.setLineDash([7, 7])
        ctx.lineCap = 'round'
        ctx.beginPath()
        sp.pts.forEach((p, i) => {
          const x = p.x * u
          const y = p.y * u
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        })
        ctx.stroke()
        ctx.setLineDash([])
      } else if (ex.guidance === 'partial') {
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.18)'
        ctx.lineWidth = 5.5
        ctx.lineCap = 'round'
        ctx.beginPath()
        sp.pts.forEach((p, i) => {
          const x = p.x * u
          const y = p.y * u
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        })
        ctx.stroke()
      }
    }

    // فلش‌های جهت (راهنمای کامل یا جزئی)
    if (showFullGuide || ex.guidance === 'partial') {
      ctx.fillStyle = ex.guidance === 'full' || hintOn ? '#64748b' : 'rgba(100, 116, 139, 0.5)'
      for (const sp of strokePathObjs) {
        for (const { p, angle } of arrowPoints(sp.pts, 20)) {
          drawArrow(ctx, p.x * u, p.y * u, angle, 7)
        }
      }
    }

    // نقطه‌های حروف
    const drawn = allPointsRef.current
    for (const [dx, dy] of ex.dots) {
      const covered = drawn.length > 0 && nearestDist({ x: dx, y: dy }, drawn) <= tolerance
      ctx.beginPath()
      ctx.arc(dx * u, dy * u, 3.6 * u * 0.9, 0, Math.PI * 2)
      if (covered) {
        ctx.fillStyle = '#22c55e'
        ctx.fill()
      } else {
        ctx.strokeStyle = '#f87171'
        ctx.lineWidth = 2.5
        ctx.stroke()
      }
    }

    // رد قلم کودک
    ctx.strokeStyle = '#2563eb'
    ctx.lineWidth = 7
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    for (const stroke of strokesRef.current) {
      if (stroke.length < 2) continue
      ctx.beginPath()
      stroke.forEach((p, i) => {
        const x = p.x * u
        const y = p.y * u
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.stroke()
    }
    const cur = currentStrokeRef.current
    if (cur && cur.length > 1) {
      ctx.beginPath()
      cur.forEach((p, i) => {
        const x = p.x * u
        const y = p.y * u
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.stroke()
    }
  }, [exercise, size, hintOn, strokePathObjs, tolerance])

  const scheduleDraw = useCallback(() => {
    if (drawScheduledRef.current) return
    drawScheduledRef.current = true
    requestAnimationFrame(draw)
  }, [draw])

  useEffect(() => {
    scheduleDraw()
  }, [draw, scheduleDraw, size, hintOn])

  // پوشش زنده
  const refreshCoverage = useCallback(
    (force = false) => {
      const now = Date.now()
      if (!force && now - lastCoverCheckRef.current < 400) return
      lastCoverCheckRef.current = now
      const c = coverageOf(targetPts, allPointsRef.current, tolerance)
      setCoveragePct(Math.round(c * 100))
      return c
    },
    [targetPts, tolerance],
  )

  const finish = useCallback(() => {
    const ex = exercise
    if (!ex || finishedRef.current) return
    finishedRef.current = true
    const drawn = allPointsRef.current
    const coverage = coverageOf(targetPts, drawn, ex.tolerance)
    const off = counterRef.current?.count ?? 0
    const accuracy = finalAccuracy(coverage, off)
    const completed = coverage >= COVERAGE_COMPLETE
    recordAttempt({
      durationMs: Date.now() - startedAtRef.current,
      accuracyPercent: accuracy,
      coveragePercent: coverage,
      completed,
      offPathCount: off,
      startedCorrectly: startPt ? (drawn.length > 0 && dist(drawn[0], startPt) <= ex.tolerance * 2) : false,
      rawPoints: downsample(drawn),
    })
  }, [exercise, recordAttempt, targetPts, startPt])

  const clearDrawing = useCallback(() => {
    strokesRef.current = []
    currentStrokeRef.current = null
    allPointsRef.current = []
    counterRef.current?.reset()
    setCoveragePct(0)
    scheduleDraw()
  }, [scheduleDraw])

  // ─── رویدادهای لمس ───
  const toNorm = (e: React.PointerEvent<HTMLCanvasElement>): Pt | null => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    }
  }

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!exercise || finishedRef.current) return
    if (activePointerRef.current !== null) return // فقط یک لمس فعال
    const p = toNorm(e)
    if (!p) return
    activePointerRef.current = e.pointerId
    canvasRef.current?.setPointerCapture(e.pointerId)
    currentStrokeRef.current = [p]
    allPointsRef.current.push(p)
    setShowStartBubble(false)
    scheduleDraw()
  }

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!exercise || activePointerRef.current !== e.pointerId) return
    const p = toNorm(e)
    if (!p) return
    const cur = currentStrokeRef.current
    if (!cur) return
    const last = cur[cur.length - 1]
    if (last && dist(last, p) < 0.7) return // نویزگیری فاصله‌ای
    cur.push(p)
    allPointsRef.current.push(p)
    counterRef.current?.feed(p, targetPts)
    // بازخورد لرزشی ملایم هنگام خروج از مسیر
    if (counterRef.current && (counterRef.current as { _justOff?: boolean })._justOff !== true) {
      // بدون کار اضافه — شمارش در کلاس انجام می‌شود
    }
    refreshCoverage()
    scheduleDraw()
  }

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activePointerRef.current !== e.pointerId) return
    activePointerRef.current = null
    try {
      canvasRef.current?.releasePointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
    const cur = currentStrokeRef.current
    if (cur && cur.length > 1) strokesRef.current.push(cur)
    currentStrokeRef.current = null
    scheduleDraw()
    const c = refreshCoverage(true) ?? 0
    if (c >= COVERAGE_AUTO_FINISH) {
      playPhrase('great')
      finish()
    }
  }

  if (!exercise) {
    return (
      <div className="min-h-dvh grid place-items-center p-6">
        <Button onClick={() => go('skills')}>انتخاب تمرین</Button>
      </div>
    )
  }

  const hasDrawn = allPointsRef.current.length > 0
  const elapsedMin = elapsedMs / 60000
  const overTime = child ? elapsedMin > child.plan.maxSessionMinutes : false

  return (
    <div className="h-dvh flex flex-col bg-white">
      {/* سربرگ */}
      <header className="nk-safe-top border-b border-emerald-100 bg-white/95">
        <div className="max-w-3xl mx-auto px-3 py-2 flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full shrink-0"
            aria-label="توقف تمرین"
            onClick={() => setExitOpen(true)}
          >
            <X className="size-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm truncate">{exercise.title}</p>
            <div className="flex items-center gap-2">
              <Progress value={coveragePct} className="h-2 flex-1" aria-label="پیشرفت پوشش مسیر" />
              <span className="text-[11px] font-bold text-emerald-700 shrink-0">{toFa(coveragePct)}٪</span>
            </div>
          </div>
          <div className="text-center shrink-0 rounded-2xl border-2 border-emerald-100 bg-emerald-50/50 px-2.5 py-1">
            {exercise.referenceChar ? (
              <>
                <span className="block text-2xl font-extrabold leading-7 text-emerald-800" aria-label={`نمونه حرف ${exercise.referenceChar}`}>
                  {exercise.referenceChar}
                </span>
                <span className="block text-[9px] text-muted-foreground leading-3">{exercise.word}</span>
              </>
            ) : (
              <>
                <span className="block text-lg font-extrabold leading-6 text-emerald-800">مسیر</span>
                <span className="block text-[9px] text-muted-foreground leading-3">تمرین {toFa(exercise.level)}</span>
              </>
            )}
          </div>
        </div>
        {overTime && (
          <p className="bg-amber-50 text-amber-800 text-xs text-center py-1 px-3">
            زمان پیشنهادی جلسه تمام شده — بعد از این تمرین، استراحت کن ☕
          </p>
        )}
      </header>

      {/* بوم */}
      <div ref={wrapRef} className="flex-1 min-h-0 grid place-items-center p-2 relative">
        <div className="relative" style={{ width: size, height: size }}>
          <canvas
            ref={canvasRef}
            className="nk-canvas rounded-3xl border-4 border-emerald-100 bg-white shadow-inner"
            style={{ width: size, height: size, touchAction: 'none' }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onPointerLeave={(e) => e.pointerId === activePointerRef.current && onPointerUp(e)}
            aria-label="بوم تمرین نوشتن — با انگشت روی مسیر بکش"
          />
          {/* حباب نقطه شروع */}
          {startPt && showStartBubble && exercise.guidance !== 'none' && (
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10"
              style={{ left: `${startPt.x}%`, top: `${startPt.y}%` }}
            >
              <div className="nk-pulse absolute inset-0 -m-3 rounded-full bg-emerald-400/40" aria-hidden />
              <div className="relative size-6 rounded-full bg-emerald-500 border-4 border-white shadow" />
              <div className="absolute top-full start-1/2 translate-x-1/2 mt-2 whitespace-nowrap bg-emerald-600 text-white text-xs font-bold rounded-full px-3 py-1.5 shadow-lg" dir="rtl">
                از این نقطه شروع کن!
              </div>
            </div>
          )}
          {exercise.guidance === 'none' && (
            <div className="absolute top-3 start-1/2 -translate-x-1/2 bg-violet-50 text-violet-700 text-xs font-bold rounded-full px-3 py-1.5 border border-violet-200" dir="rtl">
              خودت بنویس — به نمونه بالا نگاه کن {exercise.referenceChar ? `«${exercise.referenceChar}»` : ''}
            </div>
          )}
        </div>
      </div>

      {/* نوار ابزار */}
      <div className="nk-safe-bottom border-t border-emerald-100 bg-white">
        <div className="max-w-3xl mx-auto grid grid-cols-4 gap-2 p-2.5">
          <ToolBtn
            icon={<Lightbulb className="size-6" />}
            label="راهنما"
            color="bg-sky-500 hover:bg-sky-600"
            onClick={() => {
              setHintOn(true)
              playPhrase('hint_btn')
              setTimeout(() => setHintOn(false), 4000)
            }}
          />
          <ToolBtn
            icon={<Eraser className="size-6" />}
            label="پاک کردن"
            color="bg-slate-500 hover:bg-slate-600"
            onClick={clearDrawing}
          />
          <ToolBtn
            icon={<RotateCcw className="size-6" />}
            label="تلاش مجدد"
            color="bg-rose-500 hover:bg-rose-600"
            onClick={() => {
              startedAtRef.current = Date.now()
              setElapsedMs(0)
              clearDrawing()
              playPhrase('try_again')
            }}
          />
          <ToolBtn
            icon={<span className="text-xl font-extrabold leading-none">✓</span>}
            label="پایان"
            color="bg-emerald-600 hover:bg-emerald-700"
            onClick={() => {
              if (allPointsRef.current.length === 0) {
                toast({ title: 'هنوز چیزی نکشیدی!', description: 'انگشتت را روی نقطه سبز بگذار و مسیر را دنبال کن.' })
                playPhrase('start_hint')
                return
              }
              finish()
            }}
          />
        </div>
        <p className="text-center text-[10px] text-muted-foreground pb-1">
          مدت: {formatDurationMs(elapsedMs)} — راهنما: {GUIDANCE_LABELS[exercise.guidance]}
        </p>
      </div>

      {/* دیالوگ خروج */}
      <AlertDialog open={exitOpen} onOpenChange={setExitOpen}>
        <AlertDialogContent className="max-w-sm rounded-3xl" dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>توقف تمرین؟</AlertDialogTitle>
            <AlertDialogDescription>
              {hasDrawn
                ? 'نتیجه تلاش فعلی ذخیره شود؟ نتیجه تلاش‌های قبلی همین‌جا محفوظ است.'
                : 'برای این تمرین چیزی رسم نشده — بدون ذخیره خارج می‌شوی.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            {hasDrawn && (
              <AlertDialogAction
                className="rounded-2xl"
                onClick={() => {
                  finish()
                }}
              >
                ذخیره و خروج
              </AlertDialogAction>
            )}
            <AlertDialogCancel className="rounded-2xl" onClick={() => go('skills')}>
              خروج بدون ذخیره
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function ToolBtn({ icon, label, color, onClick }: { icon: React.ReactNode; label: string; color: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 rounded-2xl ${color} text-white py-3 px-1 font-bold text-xs shadow active:scale-95 transition-all outline-offset-2 focus-visible:outline-2 focus-visible:outline-emerald-600`}
    >
      {icon}
      {label}
    </button>
  )
}

function drawArrow(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, size: number) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle)
  ctx.beginPath()
  ctx.moveTo(size, 0)
  ctx.lineTo(-size * 0.6, size * 0.7)
  ctx.lineTo(-size * 0.6, -size * 0.7)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}
