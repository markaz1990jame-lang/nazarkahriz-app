'use client'

import { useEffect } from 'react'

/**
 * ثبت Service Worker برای نصب‌پذیری و کارکرد آفلاین اپ روی اندروید
 * و گرفتن رویداد نصب (beforeinstallprompt)
 */

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

declare global {
  interface Window {
    __nkzInstallEvent?: InstallPromptEvent
  }
}

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const captureInstall = (e: Event) => {
      e.preventDefault()
      window.__nkzInstallEvent = e as InstallPromptEvent
      window.dispatchEvent(new CustomEvent('nkz-installable'))
    }
    window.addEventListener('beforeinstallprompt', captureInstall)

    if ('serviceWorker' in navigator) {
      const register = () => {
        navigator.serviceWorker
          .register('/sw.js', { scope: '/' })
          .catch(() => {
            // نصب SW حیاتی نیست — برنامه بدون آن هم کار می‌کند
          })
      }
      if (document.readyState === 'complete') register()
      else window.addEventListener('load', register, { once: true })
    }

    return () => window.removeEventListener('beforeinstallprompt', captureInstall)
  }, [])

  return null
}

/** فراخوانی دیالوگ نصب اپ (اگر مرورگر پشتیبانی کند) */
export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (typeof window === 'undefined') return 'unavailable'
  const evt = window.__nkzInstallEvent
  if (!evt) return 'unavailable'
  await evt.prompt()
  const choice = await evt.userChoice
  if (choice.outcome === 'accepted') window.__nkzInstallEvent = undefined
  return choice.outcome
}
