import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./admin.css";

// Admin panelning ildiz layout'i (ommaviy saytning [locale] layout'idan alohida).
// Faqat admin.ravontravel.uz orqali ochiladi (proxy.ts), kirish huquqi har sahifada tekshiriladi.
// Interfeys tili — faqat o'zbekcha (CLAUDE.md: admin uchun i18n istisnosi).

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Ravon Travel — Admin", template: "%s · Admin" },
  robots: { index: false, follow: false, nocache: true },
};

export const viewport: Viewport = { themeColor: "#002F1A", width: "device-width", initialScale: 1 };

// Har so'rovda render (sessiya, yangi ma'lumot). Hech narsa keshlanmaydi.
export const dynamic = "force-dynamic";

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" className={manrope.variable}>
      <body>{children}</body>
    </html>
  );
}
