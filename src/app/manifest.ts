import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'مرکز جامع نظرکهریز',
    short_name: 'نظرکهریز',
    description:
      'تمرین و توان‌بخشی مهارت‌های نوشتاری فارسی برای دانش‌آموزان پایه اول تا سوم ابتدایی — مرکز جامع سنجش نظرکهریز',
    id: '/',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    dir: 'rtl',
    lang: 'fa-IR',
    background_color: '#ECFDF5',
    theme_color: '#16A34A',
    categories: ['education', 'kids', 'health'],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
