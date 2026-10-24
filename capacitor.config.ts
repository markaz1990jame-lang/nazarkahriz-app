import type { CapacitorConfig } from '@capacitor/cli'

/**
 * پیکربندی پوشش اندروید (APK) برای اپ «مرکز جامع نظرکهریز»
 * خروجی استاتیک Next (پوشه out/) داخل WebView بسته‌بندی می‌شود تا
 * اپ بدون اینترنت و بدون سرور روی گوشی اجرا شود.
 */
const config: CapacitorConfig = {
  appId: 'ir.nazarkahriz.center',
  appName: 'مرکز جامع نظرکهریز',
  webDir: 'out',
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  server: {
    androidScheme: 'https',
  },
}

export default config
