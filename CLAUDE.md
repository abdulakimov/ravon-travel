# Ravon Travel — loyiha qoidalari

Chiquvchi turizm turoperatori sayti. **Spetsifikatsiya:** `design_handoff_ravon_travel/README.md`
(dizayn tokenlari, ekranlar, xatti-harakat) va `design_handoff_ravon_travel/reference/TZ.md`
(litsenziya talablari L1–L12). Ziddiyat bo'lsa README ustun (yangiroq, brend Ray → Ravon).
**Brend (logo va ranglar) README'dagidan farq qiladi:** 2026-10-21 dan kompaniyaning haqiqiy logosi (yashil + oltin)
ishlatiladi — `public/brand/*.svg`, palitra `globals.css` boshida. README'dagi ko'k «2a Okean» palitrasi va to'lqinli emblema bekor.
`design_handoff_ravon_travel/design/*.dc.html` — prototiplar: ko'rinish manbai, **kod ko'chirilmaydi**.

@AGENTS.md

## Stack

Next.js 16 (App Router, `output: "standalone"`) · TypeScript · next-intl 4 (`/uz`, `/ru`, `/en`) ·
CSS Modules + `globals.css` tokenlari · lucide-react (ikonkalar) · zod · vitest · Playwright.
Ma'lumotlar bazasi yo'q: kontent `/data/content/*.json` da (admin panel tahrirlaydi), `src/data/` — faqat boshlang'ich (seed) nusxa.

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
src/app/admin/…           ADMIN PANEL (admin.ravontravel.uz; o'z ildiz layout'i, admin.css, _ui/ komponentlar)
src/app/api/…             route handler'lar (aloqa / so'rov formalari, Click, /api/admin/media yuklash)
src/app/media/[...path]   admin yuklagan rasmlarni berish (/data/media)
src/components/           umumiy komponentlar (Header, Footer, TourCard, Icon, Brand, Reveal)
src/config/site.ts        sayt identifikatori (nom, domen, url) + rekvizitlarning boshlang'ich qiymati
src/data/                 SEED: turlar, tafsilotlar, blog, FAQ — faqat src/lib/content.ts import qiladi (test tekshiradi)
src/i18n/                 next-intl routing / request / navigation
src/lib/                  format (pul, sana), l10n, seo, content.ts (kontent ombori), fsdb.ts (fayl qulfi/yozish),
                          tour-utils.ts (sof hisob-kitob), media.ts, orders.ts, click.ts
src/lib/admin/            admin: users, session, guard, audit, schemas (zod), orders/leads admin, Click Merchant API
src/proxy.ts              admin.* host → /admin/*; asosiy saytda /admin 404; qolgani — locale proxy
messages/<locale>/<ns>.json   tarjimalar, namespace bo'yicha
```

## Qoidalar

1. **Matn hardcode qilinmaydi.** UI matni `messages/{uz,ru,en}/<ns>.json` da, uchala tilda bir xil
   kalitlar bilan. ISTISNO: admin panel (`src/app/admin/**`) — ichki vosita, faqat o'zbekcha, matn komponentda. Yangi namespace `src/i18n/request.ts` → `namespaces` ga qo'shiladi.
   Tur/blog kontenti `src/data/` da `{ uz, ru, en }` (L10n) ko'rinishida, `tr(value, locale)` bilan o'qiladi.
2. **Havolalar** faqat `@/i18n/navigation` dagi `Link` / `useRouter` / `redirect` orqali (locale prefiksi avtomatik).
3. **Ranglar va o'lchamlar** faqat `globals.css` dagi CSS o'zgaruvchilari orqali (`var(--primary)` …).
   Hex qiymat komponentda yozilmaydi (istisno: brend SVG). Umumiy klasslar: `.container`, `.section`,
   `.btn .btn--primary|accent|secondary|ghost`, `.badge`, `.pill`, `.field/.input/.select/.textarea`,
   `.stepper`, `.card .card--hover`, `.card-grid`, `.notice`, `.page-banner`, `.breadcrumb`, `.prose`, `.table`.
4. **Ikonkalar** — `lucide-react`, har doim `<Icon icon={…} />` o'rami orqali (1.8px chiziq). Brend
   belgilari (Telegram/Instagram/WhatsApp) — `@icons-pack/react-simple-icons`. Logo — `Brand.tsx` (`<Logo>` → `public/brand/*.svg`,
   `<img>` orqali), eyebrow chizig'i — `Rule`. Click logosi — `ClickLogo.tsx`. Favicon/ikonkalar — `src/app/{favicon.ico,icon.svg,apple-icon.png,manifest.ts}`.
5. **Kontrast qoidalari:** oltin (`--accent`) oq fonda hech qachon matn rangi emas; yashil (`--primary`/`--ink`) fondagi mayda
   matn faqat oq yoki `--sky`; oltin ustidagi matn har doim `--ink`. Shaffof rang — `rgb(var(--ink-rgb) / 0.2)`, rgba hex yozilmaydi.
   Oq fonda logoning `on-light` (to'q oltin) varianti, yashil fonda — asl oltin (`inverse`).
6. **Rekvizitlar** faqat `getSettings()` dan (`src/lib/content.ts`; admin → Sozlamalar). Client komponentga props bilan. `null` bo'lsa — `common.pending` ("Rasmiylashtirilmoqda") yoki
   blok yashiriladi. `{PLACEHOLDER}` matni foydalanuvchiga ko'rsatilmaydi.
7. **Rasmlar** `next/image` orqali, manba `public/img/*.jpg` yoki admin yuklagan `/media/<id>.jpg` (yuklashda WebP'lar tayyorlanadi). Build vaqtida `scripts/optimize-images.mjs` ulardan
   WebP variantlar yaratadi (`public/img/opt/`, git'da yo'q), `src/lib/image-loader.ts` shularga yo'naltiradi.
   Ish vaqtida `/_next/image` ISHLATILMAYDI (ulashilgan serverda juda sekin edi). Kengliklar ro'yxati ikkala faylda bir xil bo'lsin.
8. **Karta ma'lumotlari hech qachon serverga yuborilmaydi va saqlanmaydi** — karta faqat Click sahifasi/oynasida
   kiritiladi (demo rejimda esa brauzer xotirasidan chiqmaydi). Forma endpoint'lari zod bilan tekshiradi va rate-limit qiladi.
9. Pul va sana faqat `src/lib/format.ts` orqali formatlanadi.
10. Server komponent default; `"use client"` faqat holat/hodisa kerak bo'lgan joyda.

## Hozirgi cheklovlar (ochiq qolgan)

- **To'lov — Click** (`src/lib/click.ts`, `/api/click/prepare|complete`, `ClickPayment.tsx`). `.env` da
  `CLICK_SERVICE_ID`+`CLICK_MERCHANT_ID`+`CLICK_SECRET_KEY` bo'lmasa — eski demo oqim (`PaymentFlow.tsx`, pul yechilmaydi).
  "To'landi" holatini FAQAT imzolangan Click Complete o'rnatadi; brauzerga ishonilmaydi. Fiskal chekni Click o'zi chiqaradi
  (bitta IKPU `10703999001000000` — turoperator xizmatlari, QQSsiz; Click'ga 16.10.2026 №1 xat). Saytdan chek yuborilmaydi;
  IKPU bir nechta bo'lib qolsa — Merchant API `submit_items` kerak.
- **Narxlar so'mda** (`priceUzs`, `priceFromUzs`, `totalUzs`), dollar yo'q. `money(uzs, locale)`.
- **Kontent** (turlar, sanalar, o'rinlar, yo'nalishlar, blog, FAQ, rekvizitlar) — `src/lib/content.ts`, fayllar `/data/content/`.
  Barcha o'qish shu modul orqali; yozish `updateDoc()` (umumiy navbat `withDataLock` — bronlar bilan bitta). Fayl yo'q/buzilgan
  bo'lsa — `src/data` seed ko'rsatiladi (log'da `content_read_failed`). Kontent sahifalari `force-dynamic`.
- **Admin panel** — `admin.ravontravel.uz` (xuddi shu konteyner). Kirish: `/data/admin/users.json` (scrypt), imzolangan cookie
  (`ADMIN_SESSION_SECRET`), birinchi egasi `.env` dagi `ADMIN_INITIAL_PASSWORD` bilan yaratiladi va parolni almashtirishi shart.
  Har bir sahifa/amal `requirePage`/`requireAction` (host + sessiya + rol). Rollar: owner / admin / manager. Harakatlar
  `/data/admin/audit.ndjson`. "To'landi" holatini admin qo'lda QO'YA OLMAYDI (faqat Click Complete); bekor qilingan/qaytarilgan
  bronga Click -9 oladi; to'lov tasdiqlanganda sana o'rinlari kamayadi, qaytarilganda tiklanadi.
  `"use server"` fayldan eksport qilingan HAR BIR async funksiya ochiq endpoint — ichida `requireAction` bo'lishi shart.
- Bron serverda: `/api/booking` raqamni va summani o'zi beradi va `/data/orders/<id>.json` ga yozadi (`src/lib/orders.ts`,
  shaxsiy ma'lumotsiz). To'lov sahifasi va `/api/payment/<id>` faqat `?k=<payToken>` bilan ochiladi (raqamni taxmin
  qilish yetmaydi). Bron yozuvlari bitta jarayon navbatida (`withOrdersLock`, globalThis) — konteyner faqat BITTA. Nusxasi brauzerda (`sessionStorage`) — vaucher uchun sayohatchilar ro'yxati. Pasport/tug'ilgan
  sana/karta serverga YUBORILMAYDI.
- Aloqa/so'rov/bron xabarlari serverda `/opt/ravon-travel/data/leads.ndjson` ga yoziladi; `.env` da `TELEGRAM_BOT_TOKEN`+`TELEGRAM_CHAT_ID` va/yoki `LEAD_WEBHOOK_URL` berilsa — o'sha kanallarga ham yuboriladi (hozircha berilmagan).
- Rekvizit, litsenziya raqami, jamoa ismlari, ijtimoiy tarmoq havolalari, xarita — admin → Sozlamalar (hozircha bo'sh).
- Huquqiy hujjatlar (`src/data/legal.ts`) statik; kompaniya nomi/email `{{company}}`/`{{email}}` belgilaridan sozlamalar bilan to'ldiriladi.
- Fotolar — Wikimedia Commons (CC); o'z fotolariga almashtirilishi kerak.

- Jo'nab ketgan sanalar server soati (Toshkent) bo'yicha yashiriladi: `getTour` / `liveToursByRank` (`src/lib/content.ts`).
  Shu sababli bosh sahifa, katalog, tur, bron va so'rov sahifalari `force-dynamic`. ISR ishlatilmaydi (konteyner read-only).

## Deploy

GitHub Actions → GHCR → `new-vps` (`/opt/ravon-travel`, `127.0.0.1:3130`) → host nginx → `ravontravel.uz`.
Serverda build QILINMAYDI. Batafsil: `docs/DEPLOY.md` (Click sozlash ham shu yerda).
