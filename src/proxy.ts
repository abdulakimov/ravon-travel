import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intl = createMiddleware(routing);

/** `admin.` bilan boshlanadigan host — admin panel (admin.ravontravel.uz; lokal: admin.localhost). */
const isAdminHost = (host: string | null) => Boolean(host && host.toLowerCase().split(":")[0].startsWith("admin."));
const isAdminPath = (p: string) => p === "/admin" || p.startsWith("/admin/");

export default function proxy(req: NextRequest) {
  const host = req.headers.get("host");
  const { pathname } = req.nextUrl;

  if (isAdminHost(host)) {
    // admin.ravontravel.uz/orders → ichki /admin/orders. Bu faqat yo'naltirish: kirish huquqi har bir
    // sahifa/amalda alohida tekshiriladi (src/lib/admin/guard.ts).
    const url = req.nextUrl.clone();
    url.pathname = isAdminPath(pathname) ? pathname : `/admin${pathname === "/" ? "" : pathname}`;
    const res = NextResponse.rewrite(url);
    res.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    res.headers.set("Cache-Control", "no-store");
    return res;
  }

  // Asosiy saytda admin yo'llari mavjud emas.
  if (isAdminPath(pathname)) return new NextResponse("Not found", { status: 404 });

  return intl(req);
}

export const config = {
  // API, Next ichki fayllari va nuqtali (statik) fayllardan tashqari hammasi
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
