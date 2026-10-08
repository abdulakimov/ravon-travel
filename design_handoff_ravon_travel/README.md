# Handoff: Ravon Travel — turoperator veb-sayti

## Umumiy ma'lumot

**Ravon Travel** — chiquvchi turizm (O'zbekistondan xorijga) bo'yicha litsenziyalangan turoperatorning sayti. Foydalanuvchi tayyor turlarni ko'radi, filtrlaydi, sanani tanlab bron qiladi va karta bilan onlayn to'laydi. Sayt litsenziya talablarini (TZ, L1–L12) bajarishi kerak: rekvizitlar, litsenziya, mas'ul mutaxassislar, ish vaqti, uch til, huquqiy hujjatlar ochiq ko'rsatiladi.

- **Ekranlar:** Bosh sahifa, Turlar katalogi, Tur tafsiloti, Bron (4 qadam), To'lov (2 bosqich + 4 natija), Biz haqimizda, Aloqa. Qo'shimcha: Dizayn tizimi va Brend qo'llanmasi.
- **Tillar:** o'zbek (asosiy, lotin), rus, ingliz — barcha matnlarning 3 tildagi tarjimasi fayllarda bor.
- **Valyuta:** USD (asosiy), UZS ixtiyoriy.
- **To'liq texnik topshiriq:** `reference/TZ.md`.

## Dizayn fayllari haqida

`design/` papkasidagi fayllar **HTML'da yaratilgan dizayn namunalari** (prototiplar). Ular ko'rinish va xatti-harakatni ko'rsatadi, lekin **production kodi emas** — to'g'ridan-to'g'ri ko'chirmang. Vazifa — bu dizaynlarni loyihaning o'z muhitida (React, Vue, Next.js va h.k.) uning qabul qilingan uslubi va kutubxonalari bilan **qayta qurish**.

Agar hali kod bazasi bo'lmasa, tavsiya: **Next.js (App Router) + TypeScript**, `next-intl` (uz/ru/en, server-side render — SEO uchun muhim), CSS Modules yoki Tailwind. Sayt kontentli va SEO'ga bog'liq, shuning uchun SSR/SSG kerak.

**Fayllarni ko'rish:** `design/` ni oddiy statik server bilan oching (masalan `npx serve design`), keyin `Ravon Travel - Bosh sahifa.dc.html` ni oching. `support.js` `.dc.html` fayllar yonida turishi shart. Sahifalar bir-biriga havola orqali bog'langan. Header'dagi UZ / RU / EN tugmalari ishlaydi.

**Prototip texnikasi haqida:** stillar inline yozilgan, ba'zi holatlar (tanlangan tugma, filtr paneli) `sync()` ichida DOM orqali bo'yalgan. Bu faqat prototip uchun. Productionda tokenlar va komponentlar orqali qiling.

## Aniqlik darajasi (Fidelity)

**High-fidelity.** Ranglar, tipografika, o'lchamlar, holatlar va o'zaro ta'sirlar yakuniy. Pikselgacha aniq qayta quring.

Yakuniy bo'lmaganlari: fotosuratlar (vaqtinchalik), rekvizit va ismlar (`{...}` placeholder), tur narxlari va sanalari (namuna ma'lumot).

---

## Dizayn tokenlari

### Ranglar — palitra «2a Okean»

| Token | Hex | Qayerda ishlatiladi | Kontrast |
|---|---|---|---|
| `primary` (Okean) | `#0A66E8` | Asosiy tugmalar, havolalar, tanlangan holatlar, ko'k sahifa bannerlari, logo doirasi, ikonkalar | Oq matn bilan 5.1:1 |
| `accent` (Quyosh) | `#FFC233` | Asosiy CTA ("Turlarni ko'rish", tafsilotdagi "Bron qilish", "To'lash"), TOP belgisi, yulduzcha, logo quyoshi, to'lqin motivi | Ustidagi matn har doim `#0B1B33`: 10.7:1 |
| `sky` (Osmon) | `#EAF3FF` | Bo'lim foni (kulrang o'rniga), tanlangan qator foni, ko'k fondagi ikkinchi darajali matn | `#0B1B33` bilan 15.5:1 |
| `ink` (Chuqurlik) | `#0B1B33` | Sarlavhalar, footer foni, sariq ustidagi matn, Rekvizitlar bloki foni | Oq bilan 17.4:1 |
| `white` | `#FFFFFF` | Asosiy fon, kartochkalar | — |
| `text-2` | `#333333` | Paragraf matni, navigatsiya | — |
| `text-3` | `#5C5C5C` | Yorliqlar, izohlar | Oq fonda 6.7:1 |
| `border` | `#DCE7F5` | Kartochka, forma va bo'lim chegaralari | — |
| `border-strong` | `#C9D8EC` | Osmon fonidagi chegaralar | — |
| `warn-text` | `#8A5A00` | "4 o'rin qoldi", placeholder teglari, ogohlantirish matni | — |
| `warn-bg` | `rgba(255,194,51,0.16)` (chegarasi `rgba(255,194,51,0.5)`) | Ogohlantirish pill/banner foni | — |
| `error` | `#B3261E` | Forma xatolari, muvaffaqiyatsiz to'lov | — |
| `error-bg` | `#FFF4F3` (chegarasi `rgba(179,38,30,0.35)`) | Xato natija bloki | — |
| `overlay` | `linear-gradient(180deg, rgba(11,27,51,.15) → rgba(11,27,51,.86))` | Foto ustidagi qoplama (hero, yo'nalish kartochkalari) | — |

**Qat'iy qoidalar:**
1. Ko'k (`#0A66E8`) fondagi mayda matn faqat oq yoki `#EAF3FF`. Sariq faqat katta raqamlarda (≥24px, masalan narx) va grafikada.
2. Sariq (`#FFC233`) oq fonda **hech qachon matn rangi bo'lmaydi**. Undan faqat fon, belgi va chiziq sifatida foydalaning.
3. Ogohlantirishlar — `warn-bg` fonda `#8A5A00` matn.

### Tipografika — bitta shrift: **Manrope** (Google Fonts, 400–800)

Global qoidalar: `h1–h4 { font-weight:700; letter-spacing:-0.02em; line-height:1.14 }`, `p { line-height:1.625 }`, `text-wrap: pretty`, `-webkit-font-smoothing: antialiased`.

| Rol | O'lcham | Qalinlik | Qo'shimcha |
|---|---|---|---|
| Hero H1 | `clamp(2.6rem, 1rem + 6vw, 5.4rem)` | 700 | −0.02em |
| Sahifa H1 (banner) | `clamp(2rem, 1rem + 2.6vw, 3.1rem)` | 700 | −0.015em |
| Bo'lim H2 (bosh sahifa) | `clamp(2rem, 1rem + 2.6vw, 3.2rem)` | 700 | −0.015em |
| Kichik bo'lim H2 (tafsilot, bron) | `clamp(1.3rem, 1rem + 1vw, 2rem)` | 700 | — |
| Kartochka sarlavhasi H3 | 18.5–21px | 700 | −0.01em |
| Narx | 21–36px | 700 | — |
| Asosiy matn L | 15.5px | 400 | lh 1.625 |
| Asosiy matn M | 13.5–14.5px | 400 | rang `#5C5C5C` yoki `#333333` |
| Eyebrow (bo'lim ustidagi yorliq) | 11.5px | 700 | UPPERCASE, 0.2em, `#0A66E8` (ko'k fonda oq), oldida to'lqin motivi |
| Meta yorliq | 10.5–12px | 700 | UPPERCASE, 0.12–0.14em, `#5C5C5C` |
| Tugma | 14–15.5px | 600–700 | — |
| Kod / bron raqami | `ui-monospace` | 700 | — |

### O'lchamlar va masshtab
- **Konteyner:** max-width 1280px (bosh sahifa, katalog, tafsilot), 1180px (bron, biz haqimizda, aloqa, dizayn tizimi), 1080px (to'lov), 1240px (brend). Yon chekinish `clamp(18px, 4vw, 48px)`.
- **Bo'lim vertikal paddingi:** `clamp(64px, 8vw, 124px)` (bosh sahifa), `clamp(48px, 6vw, 90px)` (ichki sahifalar).
- **Bo'shliq shkalasi:** 4 · 8 · 14 · 22 · 40 · 72px. Gridlar `gap` bilan quriladi, `margin` bilan emas.
- **Radiuslar:** 8px (kichik teg), 10–12px (input, ikonka tugma), 14–16px (tile), 18px (kartochka), 20–22px (katta panel), 99px (pill: tugma, belgi).
- **Bosish maydoni:** kamida 44×44px. Asosiy CTA balandligi 52–54px.
- **Soyalar:** kartochka hover `0 20px 44px rgba(11,27,51,0.14)`. Sticky bron kartochkasi `0 18px 44px rgba(11,27,51,0.10)`. Header scroll'da `0 6px 26px rgba(11,27,51,0.10)`. Sariq CTA hover `0 12px 30px rgba(255,194,51,0.4)`. Pastki sheet `0 -18px 50px rgba(11,27,51,0.28)`.

### Harakat (motion)
- Barcha o'tishlar: `0.3s cubic-bezier(0.4,0,0.2,1)`.
- Kartochka hover: `translateY(-5px)` + soya + chegara `rgba(255,194,51,0.45)`. Tugma hover: `translateY(-1px…-2px)`.
- Scroll'da paydo bo'lish (`data-reveal`): opacity 0→1, `translateY(22px)→0`, 0.7s, IntersectionObserver. Ekranning birinchi qismidagi elementlar darhol ko'rinadi. Zaxira: 2.5 soniyadan keyin hammasi ko'rsatiladi.
- `prefers-reduced-motion: reduce` — barcha animatsiya va smooth-scroll o'chadi.

### Uzilish nuqtalari (prototipda ishlatilgan)
- Header nav → hamburger: **< 940px**
- Katalog filtri: yon panel **≥ 1000px**, aks holda pastdan chiquvchi sheet
- Tur tafsiloti 2 ustun (kontent + sticky bron kartochkasi): **≥ 1040px**. Galereya 2 ustun: **≥ 760px**
- Bron / To'lov 2 ustun: **≥ 1000px**. Biz haqimizda: **≥ 940px**. Aloqa: **≥ 960px**
- Kartochka gridlari: `repeat(auto-fill, minmax(min(100%, 300px), 1fr))` — o'zi 1/2/3 ustunga tushadi
- Sayt 360px kenglikdan boshlab ishlashi shart (TZ L10)

---

## Brend

**Logo — 1b «Ufq»:** ko'k doira, ichida to'lqin ustidan chiqayotgan sariq quyosh va ikki oq to'lqin.

```html
<!-- Asosiy emblema, viewBox 48×48 -->
<svg viewBox="0 0 48 48">
  <circle cx="24" cy="24" r="24" fill="#0A66E8"/>
  <path d="M14.5 26.5a9.5 9.5 0 0 1 19 0z" fill="#FFC233"/>
  <path d="M9 31.6c5-3.2 10-3.2 15 0s10 3.2 15 0" fill="none" stroke="#FFF" stroke-width="2.6" stroke-linecap="round"/>
  <path d="M15 37c3-1.9 6-1.9 9 0s6 1.9 9 0" fill="none" stroke="#FFF" stroke-width="2.2" stroke-linecap="round" opacity=".55"/>
</svg>

<!-- Kichik variant (≤ 24px, favicon): bitta qalinroq to'lqin -->
<svg viewBox="0 0 48 48">
  <circle cx="24" cy="24" r="24" fill="#0A66E8"/>
  <path d="M13.5 27a10.5 10.5 0 0 1 21 0z" fill="#FFC233"/>
  <path d="M8 33c5.3-3.6 10.7-3.6 16 0s10.7 3.6 16 0" fill="none" stroke="#FFF" stroke-width="3.6" stroke-linecap="round"/>
</svg>
```

- **To'q fonda (inversiya):** doira `#FFFFFF`, quyosh `#FFC233`, to'lqinlar `#0A66E8`.
- **Yozuv (wordmark):** «RAVON» — Manrope 800, letter-spacing 0.2em, `#0B1B33`. «TRAVEL» — taxminan 0.42× o'lchamda, 700, letter-spacing 0.66em, `#0A66E8` (to'q fonda `#FFC233`).
- **Header kompozitsiyasi:** emblema 40px + 11px oraliq + RAVON 20px / TRAVEL 8.5px (orasida 5px). Footer: emblema 38px, RAVON 19px.
- **Himoya maydoni:** x = emblema diametrining ¼ qismi. Minimal o'lcham — 24px (raqamli), 8 mm (bosma).
- **«Ravon to'lqini» motivi** — har bir eyebrow oldidagi belgi (30×10):
  `<path d="M1 5c3.2-3.4 6.4-3.4 9.6 0s6.4 3.4 9.6 0 6.4-3.4 9.6 0" stroke="#FFC233" stroke-width="1.6" stroke-linecap="round" fill="none"/>`
- **Favicon:** `design/favicon.svg`
- **Shior (taklif, hali tasdiqlanmagan):** «Yo'lingiz ravon bo'lsin.» / «Пусть ваш путь будет лёгким.» / «May your road be smooth.»
- To'liq brend qo'llanmasi: `design/Ravon Travel - Brend.dc.html` (kompozitsiyalar, rang variantlari, konstruksiya, vizitka, vaucher, avatar).

---

## Umumiy komponentlar

### Header (`RTHeader.dc.html`)
- `position: sticky; top: 0`, balandligi 76px, fon `rgba(255,255,255,0.88)` + `backdrop-filter: blur(14px) saturate(1.4)`, pastki chegara 1px `#DCE7F5`. Scroll > 24px bo'lganda soya paydo bo'ladi.
- **Menyu** (14.5px, 500, `#333333`, oraliq `clamp(14px, 2vw, 30px)`): Bosh sahifa · Turlar · Yo'nalishlar · Blog · Biz haqimizda · Aloqa.
  - Faol band: `#0A66E8`, 600, pastida 1.5px `#0A66E8` chiziq.
  - Hover: `#0A66E8` + chiziq `rgba(10,102,232,0.45)`.
- **Til almashtirgich:** pill konteyner (1px `#DCE7F5`, 3px padding), ichida UZ / RU / EN tugmalari 12px 700, min-height 30px. Faol tugma — `#0A66E8` fon, oq matn.
- **CTA «Bron qilish»:** `#0A66E8` pill, 44px, kalendar ikonkasi bilan, katalogga olib boradi.
- **< 940px:** menyu o'rniga 44px hamburger. Bosilganda to'liq ekranli oq panel ochiladi (havolalar 26px, pastida to'liq kenglikdagi CTA).

### Footer (`RTFooter.dc.html`)
- Fon `#0B1B33`. 4 ustun `repeat(auto-fit, minmax(min(100%,190px), 1fr))`:
  1. Brend — inversiya logo, qisqa tavsif, 3 ta ijtimoiy tarmoq tugmasi (38px, chegara `rgba(255,255,255,.18)`)
  2. Navigatsiya
  3. Kompaniya (Biz haqimizda, Litsenziya, Jamoa, Rekvizitlar, Aloqa)
  4. Yordam (Savol-javob, Foydalanish shartlari, Maxfiylik siyosati, Bekor qilish siyosati)
- Ustun sarlavhalari: 11.5px 700 UPPERCASE 0.16em `#FFC233`. Havolalar: 13.5px `rgba(255,255,255,.78)`, hover `#FFC233`.
- Pastki qator: © matni va to'lov usullari (Humo · Uzcard · Visa · Mastercard).

### Tugmalar
| Tur | Fon | Matn | Chegara | Hover |
|---|---|---|---|---|
| Asosiy | `#0A66E8` | `#FFF` 600–700 | — | `translateY(-1px)` + soya |
| Urg'uli (CTA) | `#FFC233` | `#0B1B33` 700 | — | `translateY(-2px)` + sariq soya |
| Ikkinchi darajali | `#FFF` | `#0B1B33` 600 | 1px `rgba(11,27,51,.25)` | fon `#0A66E8`, matn oq |
| Foto/ko'k ustida ghost | `rgba(255,255,255,.12)` + blur | `#FFF` | 1px `rgba(255,255,255,.4)` | fon `.24` |
| O'chirilgan | o'sha rang | — | — | opacity .42–.45, `cursor: not-allowed` |

Hammasi pill (99px). Balandlik 44px (kichik), 48px, 52–54px (asosiy CTA).

### Belgilar (badge)
- **TOP:** `#FFC233` fon, `#0B1B33` matn, ★ ikonka, 10.5px 800, letter-spacing 0.09em.
- **«Sanasi bor»:** `#0A66E8` fon, oq matn, kalendar ikonkasi.
- **«So'rov bo'yicha»:** `rgba(255,255,255,.94)` fon, `#333333` matn.
- **O'rin qoldi:** `warn-bg` fon + `#8A5A00` matn (≤ 5 o'rin). 5 dan ko'p bo'lsa `rgba(11,27,51,.08)` fon + `#0B1B33` matn. Tugagan bo'lsa `#EAF3FF` fon + `#5C5C5C` matn.
- **«Rasmiylashtirilmoqda»** (litsenziya holati): `warn-bg` fon + chegara, `#8A5A00` matn.

### Tur kartochkasi
- Oq fon, 1px `#DCE7F5`, radius 18px, `overflow: hidden`.
- Rasm 4:3, chap yuqori burchakda belgilar (12px chekinish).
- Tana qismi (padding 20/22px):
  - meta qator: kategoriya · muddat (10.5px UPPERCASE)
  - H3 20px
  - tavsif 13.5px `#5C5C5C`
  - o'rin qoldi pill (ixtiyoriy)
  - pastki qator: yuqorisida 1px chiziq; narx 24–25px 700 `#0A66E8` yoki `#0B1B33`, ostida «1 kishi uchun · dan» 11px; o'ngda «Batafsil →» `#0A66E8`
- Hover: `translateY(-5px)` + soya.

### Forma elementlari
- **Input / select:** balandligi 48–52px, padding 12–14px, 1px `#DCE7F5`, radius 12px, 14.5px. Yorliq tepada: 12.5px 600 `#5C5C5C`.
- **Holatlar:**
  - Fokus — chegara `#0A66E8` + 3px halqa `rgba(11,27,51,.12)`.
  - Xato — chegara `#B3261E`, ostida 12.5px `#B3261E` xabar.
  - O'chirilgan — `#EAF3FF` fon, `#5C5C5C` matn.
- Checkbox / radio: `accent-color: #0A66E8`, 17–18px.
- Raqam sanagich (stepper): − / + tugmalar 40–44px (1px `#DCE7F5`, radius 11–12px), o'rtada qiymat 16–17px 700.

### Ikonkalar
Yagona uslub: 24×24 setka, 1.8px chiziq, yumaloq uchlar va burchaklar. To'ldirilgan variant faqat ★ va messenjer belgilarida. Hammasi fayllar ichida inline SVG — ko'chirib oling yoki eng yaqin muqobil sifatida **Lucide** to'plamidan foydalaning. To'liq ro'yxat: Dizayn tizimi → Ikonkalar (33 ta).

---

## Ekranlar

### 1. Bosh sahifa — `Ravon Travel - Bosh sahifa.dc.html`
1. **Hero:**
   - balandligi `min(86vh, 800px)`, to'liq kenglikdagi foto + qoplama, kontent pastga tekislangan
   - eyebrow «Dunyoni kashf eting» (sariq)
   - H1 «Orzudagi sayohat shu yerdan boshlanadi»
   - paragraf
   - 2 tugma: «Turlarni ko'rish» (sariq CTA) va «Biz haqimizda» (ghost)
   - ishonch qatori: 3 ta punkt, tepasida 1px `rgba(255,255,255,.2)` chiziq
2. **Raqamlar qatori** (`#EAF3FF` fon): 10 tayyor tur · 9 yo'nalish · 5 kategoriya · 3 xizmat tili. Grid `auto-fit minmax(150px, 1fr)`.
3. **«Eng ko'p tanlanadigan yo'nalishlar»** — 6 ta tur kartochkasi, o'ng tomonda «Barcha 10 turni ko'rish».
4. **«Qayerga uchamiz»** (`#EAF3FF` fon) — 8 ta yo'nalish kartochkasi: 3:4 foto, pastdan qoplama, nomi 21px va turlar soni. Grid `minmax(220px, 1fr)`.
5. **«Ishonch — hujjat bilan tasdiqlanadi»** — 4 ta afzallik kartochkasi (44px ikonka tile + H3 + matn).
6. **Blog** (`#EAF3FF` fon) — 3 ta maqola: 16:10 rasm, sana · o'qish vaqti, H3.
7. **CTA bandi** — ko'k fon + foto (opacity .42), H2 «Sayohatingizni bugun boshlang», ikki tugma: sariq «Bepul maslahat olish» va ghost «Telegram orqali yozish».
8. Footer.

Prototipdagi sozlamalar: `initialLocale` (uz/ru/en), `currency` (USD/UZS), `showSeatsLeft`.

### 2. Turlar katalogi — `Ravon Travel - Turlar katalogi.dc.html`
- **Banner** (`#0A66E8`):
  - breadcrumb
  - H1 «Turlar katalogi», tavsif
  - o'ngda jonli hisoblagich «10 tur topildi» (raqam 32px sariq)
- **Filtr paneli** (≥1000px — 290px yon panel, `sticky top: 96px`):
  - Yo'nalish — 9 ta checkbox, har birida soni
  - Kategoriya — 5 ta: Tarixiy, Tabiat, Plyaj, Davolanish, Kruiz
  - Narx — slider 400–1700 USD, qadam 50, «… gacha»
  - Muddat — segmentli tanlov: Istalgan / 5–6 / 7–8 / 9+
  - «Faqat sanasi belgilangan turlar» checkbox
  - Panel sarlavhasida «Tozalash» tugmasi
- **Mobil filtr:** «Filtrlar» tugmasi pastdan chiquvchi sheetni ochadi (max-height 88vh, body scroll bloklanadi), pastida «Ko'rsatilmoqda N» tugmasi.
- **Faol filtr chiplari:** har biri × bilan olib tashlanadi.
- **Saralash:** Ommabop / Narx: arzondan / Narx: qimmatdan / Muddat: qisqadan.
- **Natijalar:** grid `minmax(300px, 1fr)`. Sahifada 6 ta, «Ko'proq yuklash» tugmasi yana +6 qo'shadi.
- **Bo'sh holat:** chiziqli ramka, qidiruv ikonkasi, «Hech qanday tur topilmadi», ikki tugma: «Filtrlarni tozalash» va «Individual tur so'rash».
- **Holat:** `countries[]`, `categories[]`, `maxPrice`, `dur`, `fixedOnly`, `sort`, `shown`, `filtersOpen`. Filtr o'zgarsa `shown` 6 ga qaytadi. Productionda filtrlar URL query'da saqlanishi kerak (SEO va ulashish uchun).

### 3. Tur tafsiloti — `Ravon Travel - Tur tafsiloti.dc.html` (namuna: Ozarbayjon «7 mo'jiza»)
- **Sarlavha qismi:**
  - breadcrumb
  - belgilar: Sanasi bor, TOP, kategoriya
  - H1
  - meta qator: muddat, marshrut, guruh hajmi — ko'k ikonkalar bilan
- **Galereya:**
  - asosiy rasm 16:10 (radius 20px) va o'ngda 2×2 kichik rasm
  - kichik rasm bosilsa asosiy rasm almashadi
  - < 760px da bitta ustun
- **Chap ustun:**
  1. Tur haqida
  2. Kunlik marshrut — 6 kunlik akkordeon: kun raqami 44px tile, sarlavha, strelka 180° buriladi, ichida matn va teglar; «Hammasini ochish / yopish»
  3. Narxga nima kiradi — 2 ustun: Kiritilgan (✓) va Kiritilmagan (—, `#EAF3FF` fon)
  4. Jo'nash sanalari:
     - qatorlar: sana, hafta kuni, o'rin pill, narx, «Tanlash» tugmasi
     - tanlangan qator foni `rgba(255,194,51,.13)`
     - o'rni tugagan qator opacity .55 va bosilmaydi
  5. Mas'ul mutaxassis — avatar, `{SPECIALIST_NAME}`, «Savol berish»
  6. Muhim ma'lumot — viza, pasport, bekor qilish (chap tomonida 3px sariq chiziq)
- **O'ng ustun — sticky bron kartochkasi** (380px, `top: 96px`):
  - ko'k sarlavha qismi, narx 36px sariq
  - sana select (faqat o'rni bor sanalar)
  - Kattalar (12+, kamida 1) va Bolalar (2–11, −25%, ko'pi bilan 6) sanagichlari
  - hisob-kitob: kattalar × narx, bolalar × narx·0.75, **Jami**
  - sariq «Bron qilish» CTA → Bron sahifasi
- **«Shunga o'xshash turlar»** — 3 ta kartochka, `#EAF3FF` fonda.

### 4. Bron — `Ravon Travel - Bron.dc.html`
- **Stepper (4 qadam):** Sana va o'rin → Sayohatchilar → Aloqa → Tasdiqlash.
  - Joriy qadam: `#0A66E8` fon, raqam sariq doirada.
  - Bajarilgan qadam: ✓ ko'k doirada.
  - Kelgusi qadam: kulrang.
- **1-qadam:**
  - sana tanlash — radio uslubidagi katta qatorlar; o'rni tugagan sana bosilmaydi
  - kattalar va bolalar sanagichlari
  - tanlangan sanadagi o'rindan ko'p kishi tanlansa ogohlantirish banneri chiqadi
- **2-qadam:** har bir sayohatchi uchun kartochka (soni kattalar + bolalar soniga qarab). Maydonlar: Ism (lotin), Familiya (lotin), Tug'ilgan sana, Pasport raqami (monospace, `AB1234567`).
- **3-qadam:**
  - Telefon (`+998 __ ___ __ __`), Email, Qo'shimcha izoh
  - 2 ta majburiy rozilik: oferta va bekor qilish shartlari; shaxsiy ma'lumotlarni qayta ishlash
  - Ikkalasi belgilanmaguncha «Bronni tasdiqlash» o'chiq turadi (opacity .45) va yonida izoh chiqadi.
- **4-qadam:** ko'k banner «O'rin band qilindi — 30 daqiqa ichida to'lang», bron ma'lumotlari (raqami `RV-2026-04871`, tur, sana, kishilar soni, to'lov muddati), sariq «To'lovga o'tish».
- **O'ng panel:** tur rasmi va nomi, hisob-kitob qatorlari, Jami.

### 5. To'lov — `Ravon Travel - Tolov.dc.html`
- **Sarlavha:** «To'lov», bron raqami, o'ngda **30:00 dan teskari sanovchi taymer** (`warn-bg` pill, monospace).
- **1-bosqich:**
  - usul tanlash — 3 ta tile: HUMO · UZCARD / VISA · MC / B2B bank o'tkazmasi; tanlangani ko'k chegara va ko'k belgi bilan
  - karta raqami — avtomatik `XXXX XXXX XXXX XXXX` guruhlanadi, faqat raqam
  - amal qilish muddati — `MM/YY` avtomatik
  - SMS uchun telefon
  - Validatsiya: 16 ta raqamdan kam bo'lsa — «Karta raqami to'liq kiritilmagan».
- **2-bosqich:** 6 xonali SMS kod (60px katta input, harflar oralig'i 0.34em, markazda); xato bo'lsa qizil chegara va xabar; «Kodni qayta yuborish» + «42 soniyadan keyin».
- **Natija holatlari** (prototipda Tweaks orqali almashtiriladi):
  - `success` — ko'k blok, sariq ✓, to'lov cheki (summa, usul, tranzaksiya raqami, vaqt), «Vaucherni yuklab olish», «Bosh sahifaga qaytish»
  - `declined` — mablag' yetarli emas
  - `expired` — 30 daqiqa tugadi, o'rinlar bo'shatildi
  - `error` — bank bilan aloqa uzildi
  - Xato holatlarida: `#FFF4F3` blok, qizil ✕, «Nima qilish kerak» ro'yxati, «Qayta urinish» va «Menejer bilan bog'lanish».
- **O'ng panel:** to'lanadigan summa (32px sariq, ko'k fonda), buyurtma ma'lumotlari.
- Karta ma'lumotlari bizning serverda saqlanmaydi — to'lov shlyuzining sahifasi yoki SDK'si orqali o'tadi.

### 6. Biz haqimizda — `Ravon Travel - Biz haqimizda.dc.html`
- **Hero:** foto + chuqur qoplama, H1 «Litsenziyalangan turoperator — hujjat bilan ishlaymiz».
- **Biz haqimizda:** 2 ta paragraf, raqamlar (10 / 9 / 3), o'ngda 3 ta rasm (bitta 16:9 + ikkita 1:1).
- **`#litsenziya`** (`#EAF3FF` fon) — 3 ta kartochka:
  - Turizm faoliyati litsenziyasi — «Rasmiylashtirilmoqda» belgisi, `{LICENSE_NO}`, yo'nalish: Chiquvchi turizm
  - Ommaviy oferta — havola bilan
  - Litsenziya skani uchun joy (chiziqli ramka)
- **`#jamoa`** — 4 ta kartochka: Direktor, Bosh menejer, Mas'ul mutaxassis, Buxgalter. Ismlar `{...}`, har birining yo'nalish(lar)i ko'rsatilgan.
- **`#rekvizitlar`** (`#0B1B33` fon) — 8 ta maydon: yuridik nom, STIR, yuridik manzil, telefon, email, ish vaqti, bank, hisob raqami.
- **CTA blok:** «Bepul maslahat olish» va «Turlarni ko'rish».

### 7. Aloqa — `Ravon Travel - Aloqa.dc.html`
- **Banner** (`#0A66E8`): H1 «Savolingiz bormi? Yozing — javob beramiz».
- **Forma maydonlari:**
  - Ism* — bo'sh bo'lmasin
  - Telefon* — kamida 9 ta raqam
  - Email
  - Mavzu — 4 variantli select
  - Xabar* — kamida 10 belgi
  - Rozilik* (checkbox)
- **Validatsiya:** xatolar birinchi «Yuborish» bosilgandan keyin ko'rsatiladi; maydon to'g'rilangani sari yangilanadi.
- **Yuborilgandan keyin:** ko'k blok «Xabar yuborildi» va «Yana bir xabar yozish» tugmasi.
- **O'ng ustun:**
  - Bog'lanish — telefon, email, ish vaqti «Du–Sha 09:00–19:00 (UTC+5)», manzil
  - Messenjerlar — Telegram, WhatsApp, Instagram
  - Xarita uchun joy

### 8. Dizayn tizimi — `Ravon Travel - Dizayn tizimi.dc.html`
Tokenlar bo'yicha yagona manba: 11 ta rang va ularning qo'llanishi, kontrast qoidasi, tipografika shkalasi, bo'shliqlar va radiuslar, tugmalarning barcha holatlari (oddiy / hover / o'chirilgan), forma holatlari, belgilar va bildirishnomalar, 33 ta ikonka.

### 9. Brend — `Ravon Travel - Brend.dc.html`
Brend qo'llanmasi: tanlangan palitra, nom g'oyasi, ko'rib chiqilgan logo variantlari (1a/1b/1c), 1b logo tizimi, to'lqin motivi, shior, qo'llanish namunalari (vizitka, e-vaucher, avatar, favicon).

---

## Interaktivlik va holat

### Til (i18n)
- **Prototipda:** o'zbekcha matn kalit vazifasini bajaradi. Tarjimalar `design/rt-i18n.js` (umumiy `DICT`), har bir sahifaning `PAGE_DICT` va bosh sahifaning `T` obyektida turadi. Til almashganda DOM'dagi matnlar o'zgaradi.
- **Productionda:** i18n kutubxonasi (`next-intl` va h.k.) bilan qiling: kalitlar + uz / ru / en JSON fayllar. Barcha tarjimalarni yuqoridagi lug'atlardan oling.
- URL tuzilmasi: `/uz/…`, `/ru/…`, `/en/…` va `hreflang` (TZ L1). Har tilda `<html lang>` to'g'ri bo'lsin.

### Narx va sana formatlash
- USD: `$1,375`. UZS: kurs × narx, 1000 gacha yaxlitlanadi, bo'shliq bilan guruhlanadi — `17 394 000 so'm` / `сум` / `UZS`. Prototipdagi kurs 12650 — faqat namuna, productionda kursni API'dan oling.
- Sana: oy nomlari har tilda (`12 avgust 2026`, `12 августа 2026`, `12 August 2026`). Oraliq: bir oy ichida `12–17 oktabr 2026`.
- Bolalar narxi: kattalar narxining 75%.

### Ma'lumot modeli (taklif)
```ts
Tour {
  id, slug, country, category: 'historical'|'nature'|'beach'|'wellness'|'cruise',
  days, nights, priceFromUsd, fixedDeparture: boolean, top: boolean,
  title{uz,ru,en}, summary{uz,ru,en}, images[], route: string,
  groupSize: {min,max}, itinerary: {title, text, tags[]}[],
  included[], excluded[], notes{visa,passport,cancellation},
  departures: {from, to, weekday, seatsLeft, priceUsd}[],
  specialistId
}
Booking { id: 'RV-YYYY-NNNNN', tourId, departureId, adults, children,
  travelers: {firstName, lastName, birthDate, passportNo}[],
  phone, email, note, consents{offer, personalData},
  status: 'held'|'paid'|'expired'|'cancelled', holdUntil (now + 30 min) }
```

### Kerakli API'lar
- Turlar ro'yxati (filtr, saralash, sahifalash) va tur tafsiloti.
- Sanalar va **real vaqtdagi o'rin qoldig'i**.
- Bron yaratish: o'rinni 30 daqiqaga ushlab turish, keyin avtomatik bo'shatish.
- To'lov: Humo / Uzcard / Visa / Mastercard (shlyuz hali tanlanmagan — TZ'ga qarang). SMS / 3-D Secure, callback (webhook) orqali status. To'lovdan keyin vaucher PDF va email.
- Aloqa formasi → email yoki CRM.

---

## Kontent placeholderlari (haqiqiy ma'lumot bilan almashtiriladi)

`{LEGAL_NAME}` · `{STIR}` · `{POSTAL_ADDRESS}` · `{PHONE}` · `{EMAIL}` · `{LICENSE_NO}` · `{BANK_NAME}` · `{BANK_ACCOUNT}` · `{DIRECTOR_NAME}` · `{MANAGER_NAME}` · `{SPECIALIST_NAME}` · `{ACCOUNTANT_NAME}` · `{FULL_NAME}` · `{DOMAIN}`

Prototipda ular monospace + sariq chiziqli teg ko'rinishida. Productionda oddiy matn bo'ladi.

## Chizilmagan / ochiq qolganlar
- **Huquqiy sahifalar:** ommaviy oferta, foydalanish shartlari, maxfiylik siyosati, bekor qilish siyosati (TZ L12 — majburiy). Ichki sahifa uslubida: banner + matnli kontent, max-width ~760px.
- **Blog:** ro'yxat va maqola sahifasi. **FAQ.** **Yo'nalishlar** sahifasi (hozir katalogga olib boradi). **404.**
- Qolgan 9 tur uchun kontent — Tur tafsiloti shablonida.
- Domen (TZ'dagi `ray-travel.uz` → yangi Ravon domeni), haqiqiy fotolar, ijtimoiy tarmoq havolalari, ofis xaritasi, shiorni tasdiqlash.
- Admin panel, SEO (meta, OG, sitemap, schema.org `TravelAgency` / `TouristTrip`), analitika, hosting + SSL (TZ L11).

## Assetlar
- `design/img/*.jpg` — **Wikimedia Commons (CC litsenziya)** fotolari, faqat maket uchun. Ishga tushirishdan oldin kompaniyaning o'z fotolari bilan almashtiring, yoki CC atribusiya talablarini bajaring.
  - `hero-dubai`, `cta` — hero va CTA bandi
  - `tour-*` — tur kartochkalari
  - `dest-*` — yo'nalish kartochkalari
  - `az-*` — Ozarbayjon galereyasi
  - `blog-*` — blog
- `design/favicon.svg` — favicon (kichik variant).
- Ikonkalar — fayllar ichida inline SVG (Lucide bilan mos keladi).
- Shrift — Manrope (Google Fonts, SIL OFL).

## Fayllar
```
design/
  Ravon Travel - Bosh sahifa.dc.html
  Ravon Travel - Turlar katalogi.dc.html
  Ravon Travel - Tur tafsiloti.dc.html
  Ravon Travel - Bron.dc.html
  Ravon Travel - Tolov.dc.html
  Ravon Travel - Biz haqimizda.dc.html
  Ravon Travel - Aloqa.dc.html
  Ravon Travel - Dizayn tizimi.dc.html
  Ravon Travel - Brend.dc.html
  RTHeader.dc.html, RTFooter.dc.html   — umumiy header/footer
  rt-i18n.js                           — umumiy lug'at va yordamchi funksiyalar
  support.js, image-slot.js            — prototip runtime'i (productionga kerak emas)
  favicon.svg, img/
reference/
  TZ.md                                — texnik topshiriq
```
