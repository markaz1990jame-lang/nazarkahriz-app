import type { NextConfig } from "next";

/**
 * دو حالت ساخت:
 * - حالت پیش‌فرض (standalone) برای اجرای محلی/سرور توسعه
 * - NEXT_STATIC_EXPORT=1 برای تولید خروجی استاتیک `out/` که در ساخت APK
 *   اندروید (Capacitor) استفاده می‌شود — اپ کاملاً سمت کلاینت و آفلاین است.
 */
const isStaticExport = process.env.NEXT_STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  ...(isStaticExport
    ? {
        output: "export" as const,
        images: { unoptimized: true },
      }
    : { output: "standalone" as const }),
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
