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
npm run test:e2e     # Playwright; ishlab turgan saytga qarshi (default http://localhost:3100)
                     #   PW_CHANNEL=chrome        — tizimdagi Chrome (brauzer yuklamasdan)
                     #   BASE_URL=https://ravontravel.uz E2E_MOCK_LEADS=1 — productionni tekshirish (soxta lead yubormaydi)
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
7. **Rasmlar** `next/image` orqali, manba `public/img/*.jpg`. Build vaqtida `scripts/optimize-images.mjs` ulardan
   WebP variantlar yaratadi (`public/img/opt/`, git'da yo'q), `src/lib/image-loader.ts` shularga yo'naltiradi.
   Ish vaqtida `/_next/image` ISHLATILMAYDI (ulashilgan serverda juda sekin edi). Kengliklar ro'yxati ikkala faylda bir xil bo'lsin.
8. **Karta ma'lumotlari hech qachon serverga yuborilmaydi va saqlanmaydi** — karta faqat Click sahifasi/oynasida
   kiritiladi (demo rejimda esa brauzer xotirasidan chiqmaydi). Forma endpoint'lari zod bilan tekshiradi va rate-limit qiladi.
9. Pul va sana faqat `src/lib/format.ts` orqali formatlanadi.
10. Server komponent default; `"use client"` faqat holat/hodisa kerak bo'lgan joyda.

## Hozirgi cheklovlar (ochiq qolgan)

- **To'lov — Click** (`src/lib/click.ts`, `/api/click/prepare|complete`, `ClickPayment.tsx`). `.env` da
  `CLICK_SERVICE_ID`+`CLICK_MERCHANT_ID`+`CLICK_SECRET_KEY` bo'lmasa — eski demo oqim (`PaymentFlow.tsx`, pul yechilmaydi).
  "To'landi" holatini FAQAT imzolangan Click Complete o'rnatadi; brauzerga ishonilmaydi. Fiskalizatsiya qilinmaydi
  (bitta IKPU deb faraz qilingan — bir nechta bo'lsa Merchant API `submit_items` kerak).
- **Narxlar so'mda** (`priceUzs`, `priceFromUzs`, `totalUzs`), dollar yo'q. `money(uzs, locale)`.
- Bron serverda: `/api/booking` raqamni va summani o'zi beradi va `/data/orders/<id>.json` ga yozadi (`src/lib/orders.ts`,
  shaxsiy ma'lumotsiz). To'lov sahifasi va `/api/payment/<id>` faqat `?k=<payToken>` bilan ochiladi (raqamni taxmin
  qilish yetmaydi). Bron yozuvlari bitta jarayon navbatida (`withOrdersLock`, globalThis) — konteyner faqat BITTA. Nusxasi brauzerda (`sessionStorage`) — vaucher uchun sayohatchilar ro'yxati. Pasport/tug'ilgan
  sana/karta serverga YUBORILMAYDI; o'rin qoldig'i statik.
- Aloqa/so'rov/bron xabarlari serverda `/opt/ravon-travel/data/leads.ndjson` ga yoziladi; `.env` da `TELEGRAM_BOT_TOKEN`+`TELEGRAM_CHAT_ID` va/yoki `LEAD_WEBHOOK_URL` berilsa — o'sha kanallarga ham yuboriladi (hozircha berilmagan).
- Rekvizit, litsenziya raqami, jamoa ismlari, ijtimoiy tarmoq havolalari, xarita — `site.ts` da `null`.
- Fotolar — Wikimedia Commons (CC); o'z fotolariga almashtirilishi kerak.

- Jo'nab ketgan sanalar server soati (Toshkent) bo'yicha yashiriladi: `getTour` / `liveToursByRank` (`src/data/tours.ts`).
  Shu sababli bosh sahifa, katalog, tur, bron va so'rov sahifalari `force-dynamic`. ISR ishlatilmaydi (konteyner read-only).

## Deploy

GitHub Actions → GHCR → `new-vps` (`/opt/ravon-travel`, `127.0.0.1:3130`) → host nginx → `ravontravel.uz`.
Serverda build QILINMAYDI. Batafsil: `docs/DEPLOY.md` (Click sozlash ham shu yerda).
