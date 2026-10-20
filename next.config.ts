import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Sahifalar statik prerender qilinadi (nonce yo'q) va Next inline skript/stil ishlatadi —
// shuning uchun 'unsafe-inline'. Tashqi manba faqat Click (to'lov oynasi checkout.js — my.click.uz).
// "Click orqali to'lash" oddiy havola (navigatsiya) — CSP unga ta'sir qilmaydi.
const CLICK = "https://my.click.uz";
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${CLICK}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${CLICK}`,
  "font-src 'self' data:",
  `connect-src 'self' ${CLICK}`,
  `frame-src 'self' https://www.google.com https://yandex.uz https://yandex.com ${CLICK}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join("; ");

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  // Rasmlar build vaqtida tayyorlanadi (scripts/optimize-images.mjs) — /_next/image ishlatilmaydi.
  images: {
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
    deviceSizes: [640, 828, 1200],
    imageSizes: [384],
  },
  async headers() {
    return [
      {
        // Tayyor rasmlar: brauzer va oraliq keshlar uzoq saqlaydi (fayl nomi kontentga bog'liq emas — 30 kun).
        source: "/img/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=86400" }],
      },
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
