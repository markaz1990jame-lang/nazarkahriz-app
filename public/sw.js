/* Service Worker — مرکز جامع نظرکهریز */
/* استراتژی: precache هسته + cache-first برای دارایی‌های ثابت (آیکون/صدا/تصویر/فونت) + network-first برای ناوبری */

const CACHE = 'nazarkahriz-v2' // v2: صوت فارسی بازتولید شد (edge-tts fa-IR)
const CORE = [
  '/',
  '/manifest.webmanifest',
  '/favicon-32.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/maskable-512.png',
  '/images/mascot-lion.png',
  '/audio/manifest.json',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(CORE))
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

const STATIC_PREFIXES = ['/_next/static/', '/audio/', '/icons/', '/images/', '/fonts/']

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  // ناوبری: ابتدا شبکه، در نبود اینترنت نسخه ذخیره‌شده
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put('/', copy)).catch(() => undefined)
          return res
        })
        .catch(() => caches.match('/').then((r) => r || Response.error())),
    )
    return
  }

  // دارایی‌های ثابت: cache-first با به‌روزرسانی پس‌زمینه
  const isStatic = STATIC_PREFIXES.some((p) => url.pathname.startsWith(p)) || url.pathname.endsWith('.woff2')
  if (isStatic) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const fetchAndCache = fetch(req)
          .then((res) => {
            if (res.ok) {
              const copy = res.clone()
              caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => undefined)
            }
            return res
          })
          .catch(() => cached || Response.error())
        return cached || fetchAndCache
      }),
    )
    return
  }

  // سایر درخواست‌ها (مثل صفحه مستندات) — سعی در شبکه و در غیر این صورت کش
  event.respondWith(fetch(req).catch(() => caches.match(req).then((r) => r || Response.error())))
})
