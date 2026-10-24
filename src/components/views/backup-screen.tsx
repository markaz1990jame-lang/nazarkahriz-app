'use client'

import { useRef, useState } from 'react'
import { Download, FileCheck2, ShieldCheck, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { downloadBackup, mergeData, restoreBackup } from '@/lib/backup'
import { toFa } from '@/lib/fa'
import { useAppStore } from '@/lib/store'
import { NkFooter, ScreenHeader } from '@/components/nk-ui'
import { toast } from '@/hooks/use-toast'

export function BackupScreen() {
  const data = useAppStore((s) => s.data)
  const replaceAllData = useAppStore((s) => s.replaceAllData)
  const go = useAppStore((s) => s.go)

  const [pass, setPass] = useState('')
  const [pass2, setPass2] = useState('')
  const [importPass, setImportPass] = useState('')
  const [mode, setMode] = useState<'merge' | 'replace'>('merge')
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const doExport = async () => {
    if (pass.length < 4) {
      toast({ title: 'رمز عبور کوتاه است', description: 'حداقل ۴ نویسه انتخاب کنید.', variant: 'destructive' })
      return
    }
    if (pass !== pass2) {
      toast({ title: 'تکرار رمز عبور مطابقت ندارد', variant: 'destructive' })
      return
    }
    setBusy(true)
    try {
      const name = await downloadBackup(data, pass)
      toast({ title: 'پشتیبان تهیه شد ✓', description: `فایل «${name}» دانلود شد — آن را در محل امن نگه دارید.` })
    } catch (e) {
      toast({ title: 'خطا در تهیه پشتیبان', description: e instanceof Error ? e.message : 'دوباره تلاش کنید', variant: 'destructive' })
    } finally {
      setBusy(false)
    }
  }

  const doImport = async () => {
    if (!selectedFile) {
      toast({ title: 'ابتدا فایل پشتیبان را انتخاب کنید', variant: 'destructive' })
      return
    }
    setBusy(true)
    try {
      const restored = await restoreBackup(selectedFile, importPass)
      if (mode === 'replace') {
        replaceAllData(restored)
        toast({ title: 'بازیابی کامل انجام شد ✓', description: `${toFa(restored.children.length)} پرونده وارد شد.` })
      } else {
        const merged = mergeData(data, restored)
        replaceAllData(merged)
        const added = merged.children.length - data.children.length
        toast({
          title: 'ادغام انجام شد ✓',
          description: added > 0 ? `${toFa(added)} پرونده جدید اضافه شد؛ داده‌های تکراری حفظ شدند.` : 'داده‌های تکراری نادیده گرفته شدند.',
        })
      }
      go('start')
    } catch (e) {
      toast({ title: 'بازیابی ناموفق', description: e instanceof Error ? e.message : 'فایل نامعتبر', variant: 'destructive' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-dvh flex flex-col bg-slate-50">
      <ScreenHeader title="پشتیبان‌گیری و بازیابی" subtitle="انتقال پرونده بین خانه و مرکز" onBack={() => go('start')} />
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-4 space-y-4 nk-fade-up">
        {/* توضیح */}
        <Card className="rounded-3xl border-emerald-200 bg-emerald-50/50">
          <CardContent className="p-4 flex gap-3">
            <ShieldCheck className="size-6 text-emerald-700 shrink-0" />
            <div className="text-xs leading-6 text-emerald-900">
              فایل پشتیبان با رمز عبور شما <strong>رمزگذاری (AES-GCM)</strong> می‌شود؛ بدون رمز، محتوای آن قابل خواندن نیست.
              فایل‌های نامعتبر یا دست‌کاری‌شده قبل از ورود به پایگاه داده محلی رد می‌شوند.
              پیش از حذف برنامه یا تغییر دستگاه، حتماً پشتیبان بگیرید.
            </div>
          </CardContent>
        </Card>

        {/* خروجی */}
        <Card className="rounded-3xl">
          <CardContent className="p-4 space-y-4">
            <h2 className="font-bold flex items-center gap-2">
              <Download className="size-5 text-emerald-600" />
              تهیه نسخه پشتیبان
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="bk-pass">رمز عبور فایل (حداقل ۴ نویسه)</Label>
                <Input id="bk-pass" type="password" dir="ltr" value={pass} onChange={(e) => setPass(e.target.value)} className="h-11" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bk-pass2">تکرار رمز عبور</Label>
                <Input id="bk-pass2" type="password" dir="ltr" value={pass2} onChange={(e) => setPass2(e.target.value)} className="h-11" />
              </div>
            </div>
            <Button className="w-full h-12 rounded-2xl font-bold" onClick={doExport} disabled={busy}>
              <Download className="size-5" />
              دانلود فایل پشتیبان رمزگذاری‌شده
            </Button>
          </CardContent>
        </Card>

        {/* بازیابی */}
        <Card className="rounded-3xl">
          <CardContent className="p-4 space-y-4">
            <h2 className="font-bold flex items-center gap-2">
              <Upload className="size-5 text-violet-600" />
              بازیابی از فایل پشتیبان
            </h2>
            <div className="space-y-1.5">
              <Label htmlFor="bk-file">انتخاب فایل (.nkz)</Label>
              <Input
                id="bk-file"
                ref={fileRef}
                type="file"
                accept=".nkz,application/json"
                className="h-11"
                onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              />
              {selectedFile && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <FileCheck2 className="size-3.5 text-emerald-600" />
                  {selectedFile.name}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bk-import-pass">رمز عبور همان فایل</Label>
              <Input id="bk-import-pass" type="password" dir="ltr" value={importPass} onChange={(e) => setImportPass(e.target.value)} className="h-11" />
            </div>
            <div className="space-y-2">
              <Label>نحوه بازیابی</Label>
              <RadioGroup value={mode} onValueChange={(v) => setMode(v as 'merge' | 'replace')} className="grid grid-cols-2 gap-2">
                <Label htmlFor="mode-merge" className={`flex items-center gap-2 rounded-2xl border-2 p-3 cursor-pointer text-sm ${mode === 'merge' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200'}`}>
                  <RadioGroupItem id="mode-merge" value="merge" className="sr-only" />
                  ادغام با داده‌های فعلی (پیشنهادی)
                </Label>
                <Label htmlFor="mode-replace" className={`flex items-center gap-2 rounded-2xl border-2 p-3 cursor-pointer text-sm ${mode === 'replace' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200'}`}>
                  <RadioGroupItem id="mode-replace" value="replace" className="sr-only" />
                  جایگزینی کامل
                </Label>
              </RadioGroup>
              {mode === 'replace' && (
                <p className="text-xs text-rose-600">⚠️ جایگزینی کامل، داده‌های فعلی این دستگاه را حذف می‌کند.</p>
              )}
            </div>
            <Button variant="secondary" className="w-full h-12 rounded-2xl font-bold" onClick={doImport} disabled={busy}>
              <Upload className="size-5" />
              بررسی و بازیابی
            </Button>
          </CardContent>
        </Card>

        <p className="text-xs text-center text-muted-foreground leading-6">
          انتقال پرونده با رضایت والد یا سرپرست انجام شود؛ رمز فایل را فقط با مرکز به اشتراک بگذارید.
        </p>
      </main>
      <NkFooter />
    </div>
  )
}
