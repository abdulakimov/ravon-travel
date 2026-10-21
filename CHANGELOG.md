# Changelog

## 2026-10-21 — haqiqiy logo va yashil-oltin palitra

### O'zgardi
- **Logo:** kompaniyaning haqiqiy logosi (CMYK JPEG) vektorlashtirildi va saytga qo'yildi: sarlavhada gorizontal
  variant, footer.da to'liq logo — ikkalasi asl oltin rangda, to'q yashil fonda (sarlavha ham yashil bo'ldi).
  Oq fon uchun to'q oltin `on-light` variantlar ham bor (vaucher, mobil menyu). Fayllar: `public/brand/*.svg`. `Logo` endi
  `height` / `variant` / `inverse` / `alt` qabul qiladi; eski `Emblem` va to'lqin (`Wave`) olib tashlandi, eyebrow
  chizig'i — `Rule` (logodagi «— TRAVEL —» va cho'qqi motivi).
- **Palitra** logodan olindi: `--ink` #002F1A (chuqur yashil), `--primary` #0B5B3A (zumrad), `--accent` #D6AF55 (oltin),
  `--sky` #EEF4EF. Shaffof ranglar `--ink-rgb` / `--accent-rgb` / `--primary-rgb` orqali (barcha rgba'lar shunga o'tkazildi).
  Barcha asosiy juftliklar WCAG AA dan o'tadi (oq/zumrad 8.2, ink/oltin 7.1).
- `theme-color`, chekdagi QR rangi — yangi yashil.

### Qo'shildi
- Favicon (`favicon.ico` 16/32/48, `icon.svg`), `apple-icon.png`, `manifest.webmanifest` (192/512/maskable ikonkalar).
- Ijtimoiy tarmoqlarda ulashish rasmi `public/brand/og.jpg` (1200×630).

## 2026-10-21 — Click logotipi to'lov sahifasida

- To'lov usullari ichida "CLICK" yozuvi o'rniga Click'ning rasmiy logotipi (`src/components/ClickLogo.tsx`, manba: click.uz).
- Buyurtma xulosasi pastida «Xavfsiz to'lov + Click» belgisi (`payment.click.securedBy`, uch tilda).

## 2026-10-20 — chek QR'i, tekshirish sahifasi, ixcham bron/to'lov sahifalari

### Qo'shildi
- **Chekni tekshirish:** to'lov tasdiqlanganda bronga 12 belgili tekshirish kodi beriladi (`ABCD-1234-WXYZ`).
  Chekda (ekranda va chop etilgan vaucherda) QR kod va shu kod bor. QR `/<til>/verify?id=…&c=…` sahifasini
  ochadi; u yerda bron raqami va kod qo'lda ham kiritiladi. Sahifa faqat serverdagi ma'lumotni ko'rsatadi
  (tur, sanalar, summa, to'lov vaqti, Click raqami, sayohatchilar «ISLOM K.» ko'rinishida) — qog'ozdagi chekni
  soxtalashtirib bo'lmaydi. Noto'g'ri kod / to'lanmagan bron — bir xil «topilmadi» javobi.
- To'lov muvaffaqiyatli bo'lganda animatsiya (belgi chiziladi, halqa va uchqunlar); `prefers-reduced-motion`
  da o'chadi.

### O'zgardi
- Bron (4 qadam) va to'lov sahifalari desktopda bitta ekranga sig'adi (1366×640 dan): sarlavha, qadamlar va
  taymer bitta qatorda; demo ogohlantirishi o'ng ustunda; karta maydonlari bitta qatorda; chekda QR yonida.
- Serverdagi bron yozuvida sayohatchilar qisqartirilgan holda saqlanadi («ISLOM K.»), to'liq ism emas.

## 2026-10-20 — Click to'lovi, narxlar so'mda

### Qo'shildi
- **Click to'lov tizimi** (SHOP API): `/api/click/prepare` va `/api/click/complete` — md5 imzo, summa va bron
  tekshiruvi, takroriy so'rovlarga bir xil javob, barcha xato kodlari (-1 … -9). To'lov sahifasida ikki usul:
  «Click orqali» (my.click.uz sahifasi) va «Karta bilan» (Click oynasi, checkout.js). Qaytgach sahifa holatni
  serverdan tekshiradi (`/api/payment/<id>`). Har Prepare/Complete `data/click.ndjson` ga yoziladi; to'lovdan
  keyin menejerga «💳 To'lov qabul qilindi» xabari. Kalitlar `.env` da yo'q bo'lsa — avvalgi demo rejim.
- Bron endi serverda yaratiladi: raqam va summani server beradi (`data/orders/<id>.json`, shaxsiy ma'lumotsiz).
  Bron saqlanmasa (aloqa uzilsa, juda ko'p urinish) ustada xato xabari chiqadi.

### O'zgardi
- **Barcha narxlar so'mda** (12 650 kurs, 10 000 so'mga yaxlitlangan). Dollar saytdan olib tashlandi; katalog narx
  filtri 5–21 mln so'm, 500 ming qadam. FAQ va oferta matni yangilandi.

### Sozlash kerak (docs/DEPLOY.md → «Click to'lov tizimi»)
- `.env`: `CLICK_SERVICE_ID`, `CLICK_MERCHANT_ID`, `CLICK_SECRET_KEY`, `CLICK_MERCHANT_USER_ID`.
- Click'ga IP oq ro'yxati uchun domen/IP/port, kabinetda Prepare/Complete URL'lari, servisni yoqish.

## 2026-10-08 — tezlik

- Rasmlar endi build vaqtida WebP ga tayyorlanadi va statik fayl sifatida beriladi (30 kunlik kesh).
  Avval har bir rasm serverda so'rov vaqtida AVIF ga qayta kodlanardi: 1 CPU limitida 2–9 soniya,
  kesh esa har deploy'da tozalanardi.
- Katalog filtrlangan havolada serverning o'zida filtrlanadi; filtr bosilganda serverga so'rov ketmaydi.

## 2026-10-08 — birinchi reliz (ravontravel.uz)

### Qo'shildi
- Handoff dizayni asosida to'liq sayt, uch tilda (`/uz`, `/ru`, `/en`): bosh sahifa, turlar katalogi
  (filtrlar URL'da), tur tafsiloti (10 tur), yo'nalishlar, blog (3 maqola), biz haqimizda
  (litsenziya · jamoa · rekvizitlar), aloqa, FAQ, foydalanish shartlari, maxfiylik va bekor qilish
  siyosati, 404 va xato sahifalari.
- Bron oqimi (4 qadam) va to'lov sahifasi (**demo rejim** — pul yechilmaydi), "so'rov bo'yicha" turlar uchun so'rov formasi.
- Forma endpoint'lari (`/api/contact`, `/api/inquiry`, `/api/booking`): zod validatsiya, rate limit, honeypot;
  xabarlar serverda `data/leads.ndjson` ga yoziladi, ixtiyoriy `LEAD_WEBHOOK_URL`.
- Ikonkalar: `lucide-react` (yagona `<Icon>` o'rami, 1.8px), brend belgilari — `@icons-pack/react-simple-icons`.
- SEO: hreflang/canonical, `sitemap.xml`, `robots.txt`, JSON-LD (TravelAgency, TouristTrip, Article, FAQPage).
- Xavfsizlik: CSP va boshqa sarlavhalar, karta ma'lumoti brauzerdan chiqmaydi.
- CI/CD: GitHub Actions → GHCR → new-vps (pull + restart, health check, avtomatik rollback); nginx vhost + Let's Encrypt.
- Testlar: 85 unit (vitest), 152 e2e (Playwright, 1440px va 360px).

### Dizayndan ongli chetlanishlar
- `{PLACEHOLDER}` teglari o'rniga "Rasmiylashtirilmoqda" / "Ism e'lon qilinadi" (ma'lumot `src/config/site.ts` da `null`).
- Litsenziya raqami berilmaguncha "litsenziyalangan turoperator" iborasi olib tashlandi.
- To'lov sahifasidagi "PCI DSS · 3-D Secure" belgisi o'rniga "Demo rejim" ogohlantirishi.
- Bosish maydonlari 44px ga ko'tarildi; mobil filtr paneliga yopish tugmasi qo'shildi.
