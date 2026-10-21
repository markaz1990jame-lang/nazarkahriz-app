'use client'

import { useEffect, useState } from 'react'
import { Download, Info, KeyRound, Smartphone, Trash2, Volume2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
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
import { promptInstall } from '@/components/pwa-register'
import { useAppStore } from '@/lib/store'
import { NkFooter, ScreenHeader } from '@/components/nk-ui'
import { toast } from '@/hooks/use-toast'

export function SettingsScreen() {
  const settings = useAppStore((s) => s.data.settings)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const resetAll = useAppStore((s) => s.resetAll)
  const go = useAppStore((s) => s.go)

  const [canInstall, setCanInstall] = useState(false)
  const [pinOpen, setPinOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')

  useEffect(() => {
    const check = () => setCanInstall(!!(window as { __nkzInstallEvent?: unknown }).__nkzInstallEvent)
    check()
    window.addEventListener('nkz-installable', check)
    return () => window.removeEventListener('nkz-installable', check)
  }, [])

  const changePin = () => {
    if (currentPin !== settings.specialistPin) {
      toast({ title: 'رمز فعلی نادرست است', variant: 'destructive' })
      return
    }
    if (newPin.trim().length < 4) {
      toast({ title: 'رمز جدید باید حداقل ۴ نویسه باشد', variant: 'destructive' })
      return
    }
    updateSettings({ specialistPin: newPin.trim() })
    setPinOpen(false)
    setCurrentPin('')
    setNewPin('')
    toast({ title: 'رمز ورود متخصص تغییر کرد ✓' })
  }

  return (
    <div className="min-h-dvh flex flex-col bg-slate-50">
      <ScreenHeader title="تنظیمات" onBack={() => go('start')} />
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-4 space-y-3 nk-fade-up">
        {/* صدا */}
        <Card className="rounded-3xl">
          <CardContent className="p-4 space-y-4">
            <h2 className="font-bold flex items-center gap-2">
              <Volume2 className="size-5 text-emerald-600" />
              صدا و راهنمای صوتی
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold">افکت‌ها و دستورالعمل صوتی</p>
                <p className="text-xs text-muted-foreground">پخش خودکار راهنما در تمرین‌ها</p>
              </div>
              <Switch
                checked={settings.soundEnabled}
                onCheckedChange={(v) => updateSettings({ soundEnabled: v })}
                aria-label="فعال بودن صدا"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold">خواندن متن با صدای دستگاه</p>
                <p className="text-xs text-muted-foreground">در نبود فایل صوتی، از گوینده سیستم استفاده می‌شود</p>
              </div>
              <Switch
                checked={settings.voiceEnabled}
                onCheckedChange={(v) => updateSettings({ voiceEnabled: v })}
                aria-label="گفتار سیستم"
              />
            </div>
          </CardContent>
        </Card>

        {/* نصب اپ */}
        <Card className="rounded-3xl border-emerald-200 bg-emerald-50/50">
          <CardContent className="p-4 space-y-3">
            <h2 className="font-bold flex items-center gap-2">
              <Smartphone className="size-5 text-emerald-700" />
              نصب روی گوشی اندرویدی
            </h2>
            {canInstall ? (
              <Button
                className="w-full h-12 rounded-2xl font-bold"
                onClick={async () => {
                  const res = await promptInstall()
                  if (res === 'accepted') toast({ title: 'برنامه نصب شد ✓', description: 'از صفحه اصلی گوشی اجرا کنید.' })
                  else if (res === 'dismissed') toast({ title: 'نصب لغو شد' })
                  setCanInstall(false)
                }}
              >
                <Download className="size-5" />
                نصب برنامه «مرکز جامع نظرکهریز»
              </Button>
            ) : (
              <ol className="text-xs leading-6 text-emerald-900 list-decimal list-inside space-y-1">
                <li>منوی سه‌نقطه مرورگر Chrome را باز کنید</li>
                <li>گزینه «Add to Home screen / افزودن به صفحه اصلی» را بزنید</li>
                <li>نام «نظرکهریز» را تأیید کنید — آیکون اپ ساخته می‌شود</li>
                <li>اپ به‌صورت تمام‌صفحه و بدون نیاز به اینترنت اجرا می‌شود</li>
              </ol>
            )}
          </CardContent>
        </Card>

        {/* امنیت */}
        <Card className="rounded-3xl">
          <CardContent className="p-4 space-y-3">
            <h2 className="font-bold flex items-center gap-2">
              <KeyRound className="size-5 text-violet-600" />
              امنیت بخش متخصص
            </h2>
            <Button variant="outline" className="w-full rounded-2xl" onClick={() => setPinOpen(true)}>
              تغییر رمز ورود متخصص
            </Button>
            <p className="text-xs text-muted-foreground">
              بخش مدیریت برای جلوگیری از دسترسی کودک (معیار AC-11) با رمز محافظت می‌شود.
            </p>
          </CardContent>
        </Card>

        {/* درباره */}
        <Card className="rounded-3xl">
          <CardContent className="p-4 space-y-2">
            <h2 className="font-bold flex items-center gap-2">
              <Info className="size-5 text-sky-600" />
              درباره برنامه
            </h2>
            <p className="text-xs leading-6 text-muted-foreground">
              «مرکز جامع نظرکهریز» نسخه ۱٫۰ — نمونه اولیه تمرین مهارت‌های نوشتاری برای پایه‌های اول تا سوم ابتدایی.
              همه داده‌ها فقط روی همین دستگاه ذخیره می‌شود (بدون سرور و بدون اینترنت) و انتقال پرونده بین خانه و مرکز
              با فایل پشتیبان رمزگذاری‌شده انجام می‌گیرد. این برنامه ابزار تمرین است، نه ابزار تشخیص اختلال یادگیری.
            </p>
          </CardContent>
        </Card>

        {/* خطر */}
        <Card className="rounded-3xl border-rose-200">
          <CardContent className="p-4 space-y-3">
            <h2 className="font-bold flex items-center gap-2 text-rose-700">
              <Trash2 className="size-5" />
              پاک‌کردن همه داده‌ها
            </h2>
            <Button variant="destructive" className="w-full rounded-2xl" onClick={() => setResetOpen(true)}>
              پاک‌کردن کامل (پرونده‌ها و گزارش‌ها)
            </Button>
          </CardContent>
        </Card>
      </main>
      <NkFooter />

      {/* تغییر رمز */}
      <Dialog open={pinOpen} onOpenChange={setPinOpen}>
        <DialogContent className="max-w-sm rounded-3xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-start">تغییر رمز متخصص</DialogTitle>
            <DialogDescription className="text-start">رمز فعلی را وارد و رمز جدید را تعیین کنید.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input type="password" inputMode="numeric" dir="ltr" placeholder="رمز فعلی" value={currentPin} onChange={(e) => setCurrentPin(e.target.value)} className="h-11" />
            <Input type="password" inputMode="numeric" dir="ltr" placeholder="رمز جدید (حداقل ۴ نویسه)" value={newPin} onChange={(e) => setNewPin(e.target.value)} className="h-11" />
            <div className="flex gap-2">
              <Button className="flex-1 rounded-2xl" onClick={changePin}>ذخیره</Button>
              <Button variant="outline" className="rounded-2xl" onClick={() => setPinOpen(false)}>انصراف</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* پاک‌کردن کامل */}
      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent className="max-w-sm rounded-3xl" dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>پاک‌کردن همه داده‌ها؟</AlertDialogTitle>
            <AlertDialogDescription>
              تمام پرونده‌های کودکان، جلسات، تلاش‌ها و گزارش‌ها از این دستگاه حذف می‌شود و قابل بازگشت نیست.
              اگر لازم است، ابتدا از بخش «پشتیبان‌گیری» نسخه پشتیبان تهیه کنید.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-2xl">انصراف</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-2xl bg-rose-600 hover:bg-rose-700"
              onClick={() => {
                resetAll()
                toast({ title: 'همه داده‌ها پاک شد' })
              }}
            >
              پاک‌کردن قطعی
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
