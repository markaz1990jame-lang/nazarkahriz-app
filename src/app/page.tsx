'use client'

import { useSyncExternalStore } from 'react'
import { useAppStore } from '@/lib/store'
import { StartScreen } from '@/components/views/start-screen'
import { ChildHomeScreen } from '@/components/views/child-home'
import { SkillSelectScreen } from '@/components/views/skill-select'
import { PracticeScreen } from '@/components/views/practice-canvas'
import { FeedbackScreen } from '@/components/views/feedback-screen'
import { SpecialistScreen } from '@/components/views/specialist-dashboard'
import { ChildFormScreen } from '@/components/views/child-form'
import { SettingsScreen } from '@/components/views/settings-screen'
import { HelpScreen } from '@/components/views/help-screen'
import { BackupScreen } from '@/components/views/backup-screen'

export default function Home() {
  const view = useAppStore((s) => s.view)
  const hydrated = useAppStore((s) => s.hydrated)

  // تشخیص رندر سمت کلاینت بدون setState در اثر (الگوی useSyncExternalStore)
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

  // صفحه بارگذاری تا آماده شدن داده محلی (جلوگیری از عدم تطابق رندر سمت سرور)
  if (!mounted || !hydrated) {
    return (
      <div className="min-h-dvh grid place-items-center bg-gradient-to-b from-emerald-50 to-white">
        <div className="text-center space-y-3">
          <div className="mx-auto size-16 rounded-full bg-emerald-600 text-white grid place-items-center text-3xl font-black shadow-lg">
            ن
          </div>
          <p className="font-extrabold text-emerald-900">مرکز جامع نظرکهریز</p>
          <p className="text-xs text-muted-foreground animate-pulse">در حال آماده‌سازی…</p>
        </div>
      </div>
    )
  }

  switch (view) {
    case 'childHome':
      return <ChildHomeScreen />
    case 'skills':
      return <SkillSelectScreen />
    case 'practice':
      return <PracticeScreen />
    case 'feedback':
      return <FeedbackScreen />
    case 'specialist':
      return <SpecialistScreen />
    case 'childForm':
      return <ChildFormScreen />
    case 'settings':
      return <SettingsScreen />
    case 'help':
      return <HelpScreen />
    case 'backup':
      return <BackupScreen />
    default:
      return <StartScreen />
  }
}
