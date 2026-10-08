# Ravon Travel — loyiha qoidalari

Chiquvchi turizm turoperatori sayti. **Spetsifikatsiya:** `design_handoff_ravon_travel/README.md`
(dizayn tokenlari, ekranlar, xatti-harakat) va `design_handoff_ravon_travel/reference/TZ.md`
(litsenziya talablari L1–L12). Ziddiyat bo'lsa README ustun (yangiroq, brend Ray → Ravon).
`design_handoff_ravon_travel/design/*.dc.html` — prototiplar: ko'rinish manbai, **kod ko'chirilmaydi**.

@AGENTS.md

## Stack

Next.js 16 (App Router, `output: "standalone"`) · TypeScript · next-intl 4 (`/uz`, `/ru`, `/en`) ·
CSS Modules + `globals.css` tokenlari · lucide-react (ikonkalar) · zod · vitest · Playwright.
Ma'lumotlar bazasi yo'q: turlar `src/data/` da statik.

## Buyruqlar

```bash
npm run dev          # http://localhost:3000
npm run build        # production build (typecheck ham shu yerda)
npm run lint
npm test             # vitest (unit)
npm run test:e2e     # Playwright (build + start talab qiladi)
```

## Tuzilma

```
src/app/[locale]/…        sahifalar (har biri generateMetadata + setRequestLocale)
src/app/api/…             route handler'lar (aloqa / so'rov formalari)
src/components/           umumiy komponentlar (Header, Footer, TourCard, Icon, Brand, Reveal)
src/config/site.ts        kompaniya rekvizitlari — YAGONA manba (null = hali berilmagan)
src/data/                 turlar, tur tafsilotlari, blog — typed statik ma'lumot
src/i18n/                 next-intl routing / request / navigation
src/lib/                  format (pul, sana), l10n, seo
src/proxy.ts              locale proxy (Next 16'da middleware → proxy)
messages/<locale>/<ns>.json   tarjimalar, namespace bo'yicha
```

## Qoidalar

1. **Matn hardcode qilinmaydi.** UI matni `messages/{uz,ru,en}/<ns>.json` da, uchala tilda bir xil
   kalitlar bilan. Yangi namespace `src/i18n/request.ts` → `namespaces` ga qo'shiladi.
   Tur/blog kontenti `src/data/` da `{ uz, ru, en }` (L10n) ko'rinishida, `tr(value, locale)` bilan o'qiladi.
2. **Havolalar** faqat `@/i18n/navigation` dagi `Link` / `useRouter` / `redirect` orqali (locale prefiksi avtomatik).
3. **Ranglar va o'lchamlar** faqat `globals.css` dagi CSS o'zgaruvchilari orqali (`var(--primary)` …).
   Hex qiymat komponentda yozilmaydi (istisno: brend SVG). Umumiy klasslar: `.container`, `.section`,
   `.btn .btn--primary|accent|secondary|ghost`, `.badge`, `.pill`, `.field/.input/.select/.textarea`,
   `.stepper`, `.card .card--hover`, `.card-grid`, `.notice`, `.page-banner`, `.breadcrumb`, `.prose`, `.table`.
4. **Ikonkalar** — `lucide-react`, har doim `<Icon icon={…} />` o'rami orqali (1.8px chiziq). Brend
   belgilari (Telegram/Instagram/WhatsApp) — `@icons-pack/react-simple-icons`. Logo/to'lqin — `Brand.tsx`.
5. **Kontrast qoidalari:** sariq (`--accent`) oq fonda hech qachon matn rangi emas; ko'k fondagi mayda
   matn faqat oq yoki `--sky`; sariq ustidagi matn har doim `--ink`.
6. **Rekvizitlar** faqat `site.ts` dan. `null` bo'lsa — `common.pending` ("Rasmiylashtirilmoqda") yoki
   blok yashiriladi. `{PLACEHOLDER}` matni foydalanuvchiga ko'rsatilmaydi.
7. **Rasmlar** `next/image` orqali, `public/img/`. Birinchi ekrandagisi `priority`.
8. **Karta ma'lumotlari hech qachon serverga yuborilmaydi va saqlanmaydi** (to'lov hozircha demo —
   pastga qarang). Forma endpoint'lari zod bilan tekshiradi va rate-limit qiladi.
9. Pul va sana faqat `src/lib/format.ts` orqali formatlanadi.
10. Server komponent default; `"use client"` faqat holat/hodisa kerak bo'lgan joyda.

## Hozirgi cheklovlar (ochiq qolgan)

- **To'lov demo rejimida** — shlyuz (Atmos/Payme/Click) tanlanmagan. `/pay/[ref]` oqimi to'liq
  ishlaydi, lekin pul yechilmaydi; sahifada "demo" ogohlantirishi bor. Real integratsiya — backend ishi (TZ B5).
- Bron brauzerda (`sessionStorage`) saqlanadi; o'rin qoldig'i statik. Backend kelganda `src/lib/booking-store.ts` almashtiriladi.
- Aloqa/so'rov/bron xabarlari serverda `/opt/ravon-travel/data/leads.ndjson` ga yoziladi (+ `LEAD_WEBHOOK_URL` berilsa — webhook'ga ham).
- Rekvizit, litsenziya raqami, jamoa ismlari, ijtimoiy tarmoq havolalari, xarita — `site.ts` da `null`.
- Fotolar — Wikimedia Commons (CC); o'z fotolariga almashtirilishi kerak.

## Deploy

GitHub Actions → GHCR → `new-vps` (`/opt/ravon-travel`, `127.0.0.1:3130`) → host nginx → `ravontravel.uz`.
Serverda build QILINMAYDI. Batafsil: `docs/DEPLOY.md`.
