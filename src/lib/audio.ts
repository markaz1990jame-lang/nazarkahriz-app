/**
 * پخش راهنمای صوتی فارسی (FR-13)
 * اولویت: فایل‌های صوتی از پیش تولیدشده (/audio) — در نبود فایل: speechSynthesis با صدای fa-IR
 */

interface AudioManifest {
  phrases: Record<string, string>
  letters: Record<string, string>
}

let manifest: AudioManifest | null = null
let manifestPromise: Promise<AudioManifest | null> | null = null
let currentAudio: HTMLAudioElement | null = null

export let soundEnabled = true
export let voiceEnabled = true

export function setSoundFlags(sound: boolean, voice: boolean): void {
  soundEnabled = sound
  voiceEnabled = voice
}

const PHRASE_TEXTS: Record<string, string> = {
  welcome: 'سلام! من شیر دانا هستم. بیا با هم تمرین نوشتن کنیم.',
  start_hint: 'انگشتت را روی نقطه سبز بگذار و مسیر را دنبال کن.',
  great: 'آفرین! عالی بود.',
  good: 'خیلی خوب بود! ادامه بده.',
  try_again: 'اشکالی ندارد. این بار از نقطه سبز شروع کن.',
  off_path: 'حواست باشد داخل مسیر بمانی.',
  rest: 'زمان استراحت است. کمی استراحت کن و بعد برگرد.',
  next_ready: 'آماده تمرین بعدی هستی؟ بزن بریم!',
  star: 'آفرین! یک ستاره گرفتی.',
  independent: 'حالا خودت حرف را بنویس. من به تو اعتماد دارم.',
  home: 'تمرین امروز تمام شد. دستت درد نکند.',
  hint_btn: 'مسیر کم رنگ شد. خوب نگاه کن و دوباره امتحان کن.',
}

async function loadManifest(): Promise<AudioManifest | null> {
  if (manifest) return manifest
  if (!manifestPromise) {
    manifestPromise = fetch('/audio/manifest.json')
      .then((r) => (r.ok ? (r.json() as Promise<AudioManifest>) : null))
      .then((m) => {
        manifest = m
        return m
      })
      .catch(() => null)
  }
  return manifestPromise
}

function stopCurrent(): void {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
    currentAudio = null
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
}

function speakFallback(text: string): void {
  if (!voiceEnabled) return
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  try {
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'fa-IR'
    u.rate = 0.9
    const voices = window.speechSynthesis.getVoices()
    const fa = voices.find((v) => v.lang?.toLowerCase().startsWith('fa'))
    if (fa) u.voice = fa
    window.speechSynthesis.speak(u)
  } catch {
    // سکوت — fallback صوتی اجباری نیست
  }
}

/** پخش یک عبارت آموزشی بر اساس کلید */
export async function playPhrase(key: string): Promise<void> {
  if (!soundEnabled) return
  stopCurrent()
  const m = await loadManifest()
  const file = m?.phrases?.[key]
  if (file) {
    try {
      const audio = new Audio(file)
      currentAudio = audio
      await audio.play()
      return
    } catch {
      // فایل در دسترس نیست — fallback
    }
  }
  const text = PHRASE_TEXTS[key]
  if (text) speakFallback(text)
}

/** پخش نام حرف */
export async function playLetter(letterId: string, char: string): Promise<void> {
  if (!soundEnabled) return
  stopCurrent()
  const m = await loadManifest()
  const file = m?.letters?.[letterId]
  if (file) {
    try {
      const audio = new Audio(file)
      currentAudio = audio
      await audio.play()
      return
    } catch {
      // fallback
    }
  }
  speakFallback(`حرف ${char}`)
}

/** توقف هر صدای در حال پخش */
export function stopAudio(): void {
  stopCurrent()
}

// پیش‌بارگذاری لیست صداها برای speechSynthesis
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.getVoices()
}
