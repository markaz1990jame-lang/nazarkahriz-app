'use client'

import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { TOUCH_ONLY_DISCLAIMER } from '@/lib/adaptive'

export function Mascot({ size = 96, className }: { size?: number; className?: string }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-full ring-4 ring-white shadow-lg bg-emerald-50 shrink-0',
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Image
        src="/images/mascot-lion.png"
        alt="شیر دانا — شخصیت راهنمای کودک"
        fill
        sizes={`${size}px`}
        className="object-cover"
        priority
      />
    </div>
  )
}

export function ScreenHeader({
  title,
  onBack,
  left,
  subtitle,
}: {
  title: string
  onBack?: () => void
  left?: React.ReactNode
  subtitle?: string
}) {
  return (
    <header className="nk-safe-top sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-emerald-100">
      <div className="flex items-center gap-2 px-3 py-2.5 max-w-2xl mx-auto">
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            aria-label="بازگشت"
            className="shrink-0 rounded-full hover:bg-emerald-50"
          >
            <ArrowRight className="size-5" />
          </Button>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold truncate">{title}</h1>
          {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
        </div>
        {left}
      </div>
    </header>
  )
}

export function NkFooter() {
  return (
    <footer className="mt-auto nk-safe-bottom pt-4">
      <div className="max-w-2xl mx-auto px-4 text-center space-y-1">
        <p className="text-[11px] leading-5 text-muted-foreground">
          «مرکز جامع نظرکهریز» ابزار تمرین و پایش عملکرد لمسی است و جایگزین ارزیابی و تشخیص تخصصی اختلال یادگیری نیست.
        </p>
        <p className="text-[11px] leading-5 text-muted-foreground/80">{TOUCH_ONLY_DISCLAIMER}</p>
        <p className="text-[11px] text-muted-foreground/70">
          مرکز جامع سنجش نظرکهریز — نسخه آزمایشی ۱٫۰
        </p>
      </div>
    </footer>
  )
}
