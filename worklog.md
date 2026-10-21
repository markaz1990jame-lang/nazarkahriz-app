# Worklog — مرکز جامع نظرکهریز

Project: Persian PWA (installable on Android) for handwriting rehabilitation practice for children grades 1-3.
Stack: Next.js 16 + TypeScript + Tailwind 4 + shadcn/ui + Zustand (persisted localStorage) + PWA (manifest + service worker).
Key constraint: user only sees `/` route; app is fully client-side & offline-first (FR-10); backup via encrypted file (FR-11).

---
Task ID: 1
Agent: main (Z.ai Code)
Task: Project bootstrap — plan, worklog, Persian font

Work Log:
- Analyzed requirements document (FR-01..FR-13, adaptive engine rules, acceptance criteria AC-01..AC-12)
- Reviewed design mockup uploaded by user (start screen, practice canvas, feedback, specialist report)
- Installed vazirmatn@33.0.3 Persian font package (self-hosted for offline use)
- Created task plan; delegated asset generation to Task 2 agent

Stage Summary:
- App name: «مرکز جامع نظرکهریز», RTL Persian, mobile-first PWA
- Data: client-side Zustand persist (localStorage), no server DB needed for prototype
- Adaptive engine: rules-based per skill type (path/letter/independent), thresholds 85%/60%
- 3 skills: مسیر (path tracing), شکل حروف (guided letters), نوشتن مستقل (independent writing)

---
Task ID: 2
Agent: asset-generation (general-purpose)
Task: Generate mascot, app icons, Persian TTS audio files

Work Log:
- Read worklog.md + image-generation/TTS skill docs; created public/images, public/icons, public/audio dirs
- Generated mascot via z-ai CLI: public/images/mascot-lion.png (1024x1024, friendly lion mascot, flat vector)
- Generated app icon source via z-ai CLI: public/icons/icon-src.png (1024x1024, lion face + pencil on green)
- Wrote scripts-tmp/resize.ts (sharp) and ran with bun: icon-512.png, icon-192.png, maskable-512.png (389px content centered on solid #22C55E, 12% padding), favicon-32.png; verified dims via sharp metadata; removed scripts-tmp
- TTS test run: direct `-f mp3` rejected by API (HTTP 400 code 1214 "response_format value not supported"; retried once, still failing) -> adapted pipeline: z-ai tts WAV output (voice tongtong, speed 0.9) -> ffmpeg libmp3lame 96k -> .mp3; test file verified >2000 bytes before batch
- Regenerated all 12 phrase files via scripts-tmp/gen-tts.sh (sequential, 2s pacing, one retry w/ 25s backoff on failure); fa_welcome.mp3 first render rambled to 20.5s -> regenerated, accepted 4.9s take
- Letter batch: 22/32 generated; transient API outage skipped 10 (zal, re, ze, zhe, sin, shin, sad, dad) which were already present from an earlier partial batch (same prescribed texts, verified valid); fa_letter_ta.mp3 was missing -> generated on retry (18764B, 1.54s)
- ASR spot-checks (wav): outputs are approximate syllabic renderings - tongtong voice is not a native Persian voice; kept prescribed voice per task spec
- Verified all 44 mp3s: present, codec=mp3, >2000 bytes, sane durations (letters 0.67-2.74s, phrases 2.69-8.47s); wrote audio/manifest.json (12 phrases + 32 letters, all paths resolve); cleaned temp files (test.wav, scripts-tmp, /tmp artifacts)

Stage Summary:
- Images: public/images/mascot-lion.png (1024x1024), public/icons/icon-src.png (1024x1024), icon-512.png, icon-192.png, maskable-512.png (#22C55E pad), favicon-32.png (public root)
- Audio: 44/44 files in public/audio/ (12 phrases + 32 letter names), all valid mp3 >2000B; 0 final skips
- Manifest: public/audio/manifest.json with keys phrases{12} + letters{32}, paths /audio/fa_*.mp3 - validated, 0 missing
- Notes for main agent: TTS API currently rejects mp3 format (use wav->ffmpeg); tongtong Persian pronunciation is approximate (syllabic) - consider professional re-record if budget allows; fa_great.mp3 is 7.2s (engine renders slowly, deterministic output)
