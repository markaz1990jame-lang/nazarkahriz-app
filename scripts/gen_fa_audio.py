# -*- coding: utf-8 -*-
"""تولید فایل‌های صوتی فارسی برای مرکز جامع نظرکهریز
صدا: fa-IR-DilaraNeural (زن، دوستانه) — کمی آرام‌تر برای دانش‌آموزان کلاس اول
"""
import asyncio
import pathlib
import sys

import edge_tts

VOICE = "fa-IR-DilaraNeural"
RATE = "-10%"  # کمی آرام‌تر، مناسب کودکان
OUT = pathlib.Path("/home/z/my-project/public/audio")

# عبارت‌های آموزشی — متن‌ها مطابق PHRASE_TEXTS در src/lib/audio.ts
PHRASES = {
    "fa_welcome.mp3": "سلام! من شیر دانا هستم. بیا با هم تمرین نوشتن کنیم.",
    "fa_start_hint.mp3": "انگشتت را روی نقطه سبز بگذار و مسیر را دنبال کن.",
    "fa_great.mp3": "آفرین! عالی بود.",
    "fa_good.mp3": "خیلی خوب بود! ادامه بده.",
    "fa_try_again.mp3": "اشکالی ندارد. این بار از نقطه سبز شروع کن.",
    "fa_off_path.mp3": "حواست باشد داخل مسیر بمانی.",
    "fa_rest.mp3": "زمان استراحت است. کمی استراحت کن و بعد برگرد.",
    "fa_next_ready.mp3": "آماده تمرین بعدی هستی؟ بزن بریم!",
    "fa_star.mp3": "آفرین! یک ستاره گرفتی.",
    "fa_independent.mp3": "حالا خودت حرف را بنویس. من به تو اعتماد دارم.",
    "fa_home.mp3": "تمرین امروز تمام شد. دستت درد نکند.",
    "fa_hint_btn.mp3": "مسیر کم‌رنگ شد. خوب نگاه کن و دوباره امتحان کن.",
}

# نام حروف — مطابق letters.ts
LETTERS = {
    "alef": "اَلِف",
    "be": "بِ",
    "pe": "پِ",
    "te": "تِ",
    "se": "ثِ",
    "jim": "جیم",
    "che": "چِ",
    "he_jimi": "حِ",
    "khe": "خِ",
    "dal": "دال",
    "zal": "ذال",
    "re": "رِ",
    "ze": "زِ",
    "zhe": "ژِ",
    "sin": "سین",
    "shin": "شین",
    "sad": "صاد",
    "dad": "ضاد",
    "ta": "طِ",
    "za": "ظِ",
    "ein": "عین",
    "ghein": "غین",
    "fe": "فِ",
    "qaf": "قاف",
    "kaf": "کاف",
    "gaf": "گاف",
    "lam": "لام",
    "mim": "میم",
    "nun": "نون",
    "vav": "واو",
    "he_do_cheshm": "هِ",
    "ye": "یِ",
}

FILES = {}
for fname, text in PHRASES.items():
    FILES[fname] = text
for lid, name in LETTERS.items():
    FILES[f"fa_letter_{lid}.mp3"] = name

SEM = asyncio.Semaphore(4)


async def gen(fname: str, text: str) -> bool:
    async with SEM:
        path = OUT / fname
        for attempt in range(4):
            try:
                com = edge_tts.Communicate(text, VOICE, rate=RATE)
                await com.save(str(path))
                if path.exists() and path.stat().st_size > 1000:
                    print(f"OK   {fname}  ({path.stat().st_size} B)")
                    return True
                raise RuntimeError("empty output")
            except Exception as e:  # noqa: BLE001
                await asyncio.sleep(1.5 * (attempt + 1))
                if attempt == 3:
                    print(f"FAIL {fname}: {e}", file=sys.stderr)
                    return False
        return False


async def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    results = await asyncio.gather(*(gen(f, t) for f, t in FILES.items()))
    ok = sum(results)
    print(f"\n{ok}/{len(FILES)} files generated")
    return 0 if ok == len(FILES) else 1


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
