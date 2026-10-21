'use client'

import { Baby, Hand, HeartHandshake, ShieldCheck, Stethoscope } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useAppStore } from '@/lib/store'
import { NkFooter, ScreenHeader } from '@/components/nk-ui'

export function HelpScreen() {
  const go = useAppStore((s) => s.go)
  return (
    <div className="min-h-dvh flex flex-col bg-slate-50">
      <ScreenHeader title="راهنمای استفاده" onBack={() => go('start')} />
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-4 space-y-3 nk-fade-up">
        <HelpCard
          icon={<Baby className="size-6 text-emerald-600" />}
          title="برای کودک"
          items={[
            'از صفحه شروع، پرونده خودت را انتخاب کن و «شروع تمرین» را بزن.',
            'در صفحه نوشتن، انگشتت را روی نقطه سبز بگذار و مسیر نقطه‌چین را دنبال کن.',
            'هر بار که تمرین را خوب انجام دهی، ستاره و نشان می‌گیری!',
            'دکمه «راهنما» مسیر را دوباره نشان می‌دهد؛ «تلاش مجدد» از اول شروع می‌کند.',
          ]}
        />
        <HelpCard
          icon={<Hand className="size-6 text-sky-600" />}
          title="برای والدین"
          items={[
            'جلسات کوتاه (۵ تا ۱۰ دقیقه) بهترین نتیجه را دارند؛ دکمه «استراحت» برای پیاده‌سازی همین موضوع است.',
            'برای انتقال پرونده از خانه به مرکز (یا برعکس) از «پشتیبان‌گیری» با رمز عبور استفاده کنید.',
            'داده‌ها فقط روی همین دستگاه ذخیره می‌شود؛ تصویر، صوت و موقعیت مکانی کودک ثبت نمی‌شود.',
          ]}
        />
        <HelpCard
          icon={<Stethoscope className="size-6 text-violet-600" />}
          title="برای متخصص"
          items={[
            'در تب «مهارت‌ها» می‌توانید هر مهارت را فعال/غیرفعال و سطح را دستی تنظیم کنید.',
            'در تب «پیشنهاد تمرین» تصمیم‌های موتور تطبیقی با دلیل قابل مشاهده و قابل تأیید یا اصلاح است.',
            'قواعد تطبیقی: میانگین دقت سه تلاش اخیر ≥۸۵٪ + دو تلاش مستقل موفق → مرحله بعد؛ ۶۰ تا ۸۴٪ → ادامه همین سطح؛ کمتر از ۶۰٪ → ساده‌تر با راهنمای کامل.',
            'گزارش‌ها «دقت در تمرین لمسی» را نشان می‌دهند؛ تعمیم آن به نوشتن با مداد نیازمند ارزیابی تخصصی است.',
          ]}
        />
        <HelpCard
          icon={<ShieldCheck className="size-6 text-amber-600" />}
          title="حریم خصوصی و محدودیت‌ها"
          items={[
            'بدون سرور، بدون حساب کاربری، بدون تبلیغ — همه‌چیز آفلاین روی دستگاه.',
            'نام نمایشی و عملکرد تمرین ذخیره می‌شود؛ تصویر چهره، ضبط صوت/ویدئو و موقعیت مکانی هرگز.',
            'این برنامه ابزار تمرین و پایش است و جایگزین تشخیص یا درمان تخصصی نیست.',
          ]}
        />
        <HelpCard
          icon={<HeartHandshake className="size-6 text-rose-500" />}
          title="نکته آموزشی"
          items={[
            'بازخورد مشخص بهتر از پیام کلی است: «این بار از نقطه سبز شروع کن» بهتر از «اشتباه است».',
            'الگوهای حروف نسخه اولیه هستند و پیش از استفاده گسترده باید به تأیید متخصص آموزش نوشتن برسد.',
          ]}
        />
      </main>
      <NkFooter />
    </div>
  )
}

function HelpCard({ icon, title, items }: { icon: React.ReactNode; title: string; items: string[] }) {
  return (
    <Card className="rounded-3xl">
      <CardContent className="p-4 space-y-2.5">
        <h2 className="font-bold flex items-center gap-2">{icon}{title}</h2>
        <ul className="space-y-1.5">
          {items.map((t, i) => (
            <li key={i} className="text-sm leading-7 text-muted-foreground flex gap-2">
              <span className="text-emerald-500 shrink-0" aria-hidden>◆</span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
