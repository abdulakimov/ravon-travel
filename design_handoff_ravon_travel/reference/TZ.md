# Texnik Topshiriq (TZ) — Ray Travel veb-sayti

**Maqsad:** turizm faoliyati (turoperator / turagent) litsenziyasini olish uchun qonun talablariga
to'liq javob beradigan, ishlaydigan rasmiy veb-sayt.

**Versiya:** 1.0 · **Sana:** 2026-09-03
**Referens sayt:** https://dream-travel.uz (tahlil qilingan — struktura, oqim va dizayn tizimi shundan olingan)
**Kim uchun:** Claude Design (dizayn + frontend ekranlar) + backend jamoasi

---

## 0. Kirish va asosiy taxminlar

Bu hujjat **chet elga chiquvchi (outbound) dam olish turizmi** bo'yicha ishlaydigan sayohat
agentligi sayti uchun yozilgan — ya'ni O'zbekiston fuqarolarini xorijiy yo'nalishlarga
(Gruziya, BAA, Malayziya, Turkiya va h.k.) tayyor turlar bilan olib chiqadigan agentlik.
Referens sayt aynan shu modelda ishlaydi.

> **Agar siz "business travel" (korporativ xizmat safarlari) modelini nazarda tutgan bo'lsangiz**
> — asosiy struktura o'zgarmaydi, lekin 4-bo'limdagi kontent va 3-bo'limdagi mahsulot modeli
> boshqacha bo'ladi (tur o'rniga — korporativ paket, mijoz — kompaniya). Menga ayting, moslashtiraman.

### ⚠️ Litsenziya yo'nalishlari va katalog mos kelishi shart

Litsenziya **uch yo'nalish** bo'yicha beriladi: **ichki**, **chiquvchi** va **kiruvchi** turizm.
Saytda `/about#litsenziya` blokida qaysi yo'nalishlar ko'rsatilsa, **katalogda ham o'sha har bir
yo'nalish bo'yicha ko'rinadigan xizmat bo'lishi kerak** — aks holda saytning ikki qismi
bir-biriga zid bo'ladi.

- Faqat **chiquvchi** turizmga ariza berayotgan bo'lsangiz → litsenziya blokida faqat shuni
  ko'rsating, katalog faqat chet el turlaridan iborat bo'lsin.
- **Uchala** yo'nalishga ariza berayotgan bo'lsangiz → katalogda O'zbekiston ichidagi turlar
  (ichki) va xorijiy sayyohlar uchun O'zbekiston turlari (kiruvchi) ham bo'lishi shart.

Shuning uchun tur modelida `tourism_direction` maydoni bor (3.3) va katalogda shu bo'yicha
filtr qo'yiladi (4.2). **`{{LICENSE_DIRECTIONS}}` ni 10-bo'limda to'ldiring.**

### Nima uchun "shunchaki chiroyli sayt" yetarli emas

Litsenziya berish chog'ida saytga **funksional talablar** qo'yiladi — nafaqat ko'rinish, balki
**onlayn bron qilish va elektron to'lov haqiqatan ishlashi** kerak. Shuning uchun bu TZ ikkiga
bo'lingan: **Claude Design uchun** (9.1) va **Backend/Engineering uchun** (9.2). Faqat dizayn
bosqichining o'zi litsenziya talabini qoplamaydi.

---

## 1. LITSENZIYA TALABLARI — MAJBURIY CHECKLIST

Bu bo'lim — hujjatning eng muhim qismi. Litsenziya beruvchi organ aynan shu ro'yxatni tekshiradi.
Har bir talab qaysi sahifa/blok bilan qoplanishi ko'rsatilgan.

Huquqiy asos: O'zR Vazirlar Mahkamasining 10.07.2020 y. **433-son** qarori, 3-ilova —
"Turoperator va turagentlik xizmatlarini ko'rsatish tartibi to'g'risida Nizom".

| # | Qonun talabi | Saytda qanday qoplanadi | Sahifa |
|---|--------------|--------------------------|--------|
| **L1** | Sayt **kamida ikki chet tilida** bo'lishi | `uz` (asosiy) + `ru` + `en` — 3 til, to'liq tarjima. Har bir sahifa uchun `/uz/...`, `/ru/...`, `/en/...` | Butun sayt |
| **L2** | Saytda **elektron to'lov** xizmati bo'lishi | Atmos/Payme/Click orqali karta bilan real onlayn to'lov (Humo · Uzcard · Visa · Mastercard) | `/pay/:reference` |
| **L3** | Saytda **bron qilish** xizmati bo'lishi | To'liq bron oqimi: sana → sayohatchilar → yo'lovchi ma'lumotlari → to'lov → tasdiq | `/book/:slug` |
| **L4** | **Ish rejimi (ish vaqti)** e'lon qilinishi | "Ish vaqti" bloki — hafta kunlari va soatlar | `/contact` + footer |
| **L5** | **Joylashgan joyi (pochta manzili)** | To'liq yuridik + faktik manzil, xarita | `/contact` + `/about#rekvizitlar` + footer |
| **L6** | **Tegishli litsenziya haqida ma'lumot** | Litsenziya raqami, berilgan sana, bergan organ, litsenziyalangan yo'nalishlar | `/about#litsenziya` + footer |
| **L7** | **Turizm xizmatlari sertifikati** (mavjud bo'lsa) | Sertifikat raqami + PDF skan yuklab olish | `/about#litsenziya` |
| **L8** | **Yo'nalishlar bo'yicha mas'ul mutaxassislar ismlari** | Jamoa bloki: F.I.Sh., lavozim, malaka sertifikati, mas'ul yo'nalish | `/about#jamoa` |
| **L9** | Kompaniya **to'liq nomi** va rekvizitlari | Yuridik nom, STIR (INN), h/r, MFO, bank | `/about#rekvizitlar` |
| **L10** | Sayt **mobil qurilmalarga moslashgan** bo'lishi | Responsive, 360px dan boshlab | Butun sayt |
| **L11** | Sayt **haqiqatan ishlab turishi** (domen + hosting faol) | `ray-travel.uz` domeni, SSL (HTTPS), 24/7 uptime | Infratuzilma |
| **L12** | **Foydalanuvchi shartnomasi va maxfiylik siyosati** | 3 ta yuridik hujjat | `/terms`, `/privacy`, `/cancellation` |

> ⚠️ **DIQQAT — referens saytni 1:1 nusxalash yetarli emas.**
> dream-travel.uz kodi tahlil qilinganda **L6, L7 va L8** (turizm faoliyati litsenziyasi
> ma'lumotlari, turizm xizmatlari sertifikati, mas'ul mutaxassislar) **topilmadi** —
> "litsenziya"/"sertifikat"/"mutaxassis" so'zlari sayt kodida umuman uchramadi.
> Shuning uchun Ray Travel saytida bu 3 blok majburiy ravishda qo'shilishi kerak (4.7-bo'lim).
>
> **Referens saytda mavjud va yaxshi bajarilgan:** ish vaqti (L4 — "Dushanba–Shanba
> 09:00–19:00 (UTC+5)", yakshanba uchun alohida izoh bilan), manzil, rekvizitlar va
> **davlat ro'yxatidan o'tganlik guvohnomasi** bloki — PDF yuklab olish, tasdiqlash raqami va
> my.gov.uz orqali tekshirish kodi bilan. Bu blokni Ray Travel uchun ham takrorlash tavsiya
> etiladi (4.7, blok 7) — ishonch uchun kuchli element.

### Saytdan tashqari litsenziya shartlari (ma'lumot uchun — saytga taalluqli emas)

- Shtatda "turizm" yo'nalishi bo'yicha oliy/o'rta maxsus ma'lumotli **kamida 1 mutaxassis**
  (yoki malaka sertifikati egasi) bo'lishi. → Bu odam **L8** bo'yicha saytda ko'rsatiladi.
- Chet elga chiqish turizmi uchun **Xavfsiz turizm jamg'armasiga depozit** va fuqarolik
  javobgarligini sug'urtalash. Summa qonunchilikda o'zgarib turadi — **yuristingiz bilan
  aniqlang**, bu saytning texnik qismiga ta'sir qilmaydi.

---

## 2. SAYT XARITASI (routing)

Barcha URL **til prefiksi** bilan: `/:locale(uz|en|ru)/...`
Prefikssiz kirish → brauzer tiliga qarab yoki `uz` ga redirect.

### Ommaviy sahifalar
| URL | Sahifa | Izoh |
|-----|--------|------|
| `/uz/` | Bosh sahifa | |
| `/uz/tours` | Turlar katalogi | Kategoriya + yo'nalish filtri |
| `/uz/tours/:slug` | Tur tafsiloti | Asosiy konversiya sahifasi |
| `/uz/destinations` | Yo'nalishlar | Davlatlar grid |
| `/uz/blog` | Blog ro'yxati | |
| `/uz/blog/:slug` | Blog maqolasi | |
| `/uz/about` | Biz haqimizda | **+ litsenziya, jamoa, rekvizitlar** |
| `/uz/contact` | Aloqa | Forma + ish vaqti + xarita |
| `/uz/faq` | Savol-javob | |

### Yuridik sahifalar
| URL | Sahifa |
|-----|--------|
| `/uz/terms` | Foydalanish shartlari |
| `/uz/privacy` | Maxfiylik siyosati |
| `/uz/cancellation` | Bekor qilish siyosati |

### Bron va to'lov (litsenziya uchun MAJBURIY)
| URL | Sahifa |
|-----|--------|
| `/uz/book/:slug` | Bron qilish (sanasi belgilangan turlar) |
| `/uz/inquiry/:slug` | So'rov yuborish (so'rov bo'yicha turlar) |
| `/uz/pay/:reference` | To'lov (karta + SMS tasdiq) |
| `/uz/bookings/:reference/confirmation` | Bron tasdiqlandi |
| `/uz/inquiry/:reference/confirmation` | So'rov qabul qilindi |

### Foydalanuvchi kabineti
| URL | Sahifa |
|-----|--------|
| `/uz/login` | Kirish |
| `/uz/register` | Ro'yxatdan o'tish |
| `/uz/my-bookings` | Mening bronlarim + tafsilotlar |

### Xato
| URL | Sahifa |
|-----|--------|
| `*` | 404 — "Sahifa topilmadi" |

**SEO:** har bir sahifada `hreflang` teglari (uz/en/ru + x-default), `sitemap.xml`, `robots.txt`,
Open Graph rasmlari, `TravelAgency` va `TouristTrip` schema.org markup.

---

## 3. MAHSULOT MODELI — ikki xil tur

Bu saytning yuragi. **Har bir tur ikki turdan biri bo'ladi:**

### 3.1. "Sanasi bor" turlar (fixed departure)
- Aniq jo'nash sanalari va o'rinlar soni bor
- Narx belgilangan
- Mijoz **saytda to'liq bron qiladi va onlayn to'laydi** → `/book/:slug` → `/pay/:reference`
- Badge: `Sanasi bor` (yashil)
- ⚠️ **Litsenziya L2+L3 aynan shu oqim orqali qoplanadi — kamida 2-3 ta tur shu turda bo'lishi shart**

### 3.2. "So'rov bo'yicha" turlar (on request)
- Individual marshrut, sana kelishiladi
- Narx "…dan boshlab" ko'rsatiladi
- Mijoz **so'rov yuboradi**, menejer bog'lanadi → `/inquiry/:slug`
- Badge: `So'rov bo'yicha` (kulrang)

### 3.3. Tur ma'lumotlar modeli

| Maydon | Tur | Izoh |
|--------|-----|------|
| `slug` | string | URL uchun |
| `title` | i18n (uz/ru/en) | |
| `type` | `fixed` \| `request` | 3.1 yoki 3.2 |
| `tourism_direction` | enum | **`ichki` · `chiquvchi` · `kiruvchi`** — litsenziya yo'nalishi. Katalogda litsenziyada ko'rsatilgan **har bir yo'nalish bo'yicha** kamida bitta tur bo'lishi kerak (L6) |
| `category` | enum | Tarixiy · Tabiat · Plyaj dam olish · Davolanish · Ziyorat · Shopping |
| `destination` | ref | Davlat/yo'nalish |
| `duration_days` | int | |
| `price_from` | decimal + valyuta | USD yoki UZS |
| `is_featured` | bool | Bosh sahifadagi "TOP" badge |
| `hero_image` + `gallery[]` | media | |
| `short_description` | i18n | Kartochka uchun |
| `description` | i18n rich text | |
| `itinerary[]` | kun-kun | `{day, title, description}` |
| `inclusions[]` | i18n list | "Narxga kiradi" |
| `exclusions[]` | i18n list | "Narxga kirmaydi" |
| `departures[]` | faqat `fixed` uchun | `{date, price, seats_total, seats_left}` |
| `max_travelers` | int | |

**Namuna ma'lumot (o'rnak, o'zingiznikiga almashtiring):**
1. `Gruziya — Tbilisi va Batumi` · Tarixiy · 7 kun · $890 dan · **fixed** · 3 ta jo'nash sanasi
2. `Turkiya — Antaliya "all inclusive"` · Plyaj · 8 kun · $1 050 dan · **request**

---

## 4. SAHIFALAR BO'YICHA BLOK TARKIBI

### 4.1. Bosh sahifa (`/`)

| # | Blok | Tarkib |
|---|------|--------|
| 1 | **Hero** | Fon rasmi (to'liq ekran) + eyebrow ("DUNYONI KASHF ETING") + katta serif sarlavha + qism sarlavha + 2 CTA: `Turlarni ko'rish` (asosiy) / `Biz haqimizda` (ikkilamchi) |
| 2 | **Statistika** | 4 ta raqam: Turlar soni · Yo'nalishlar · Kategoriyalar · Tillar (UZ·EN·RU) |
| 3 | **Tanlangan turlar** | Eyebrow + sarlavha + tavsif + 6–8 ta tur kartochkasi grid + "Hammasini ko'rish →" |
| 4 | **Yo'nalishlar** | 6–8 ta davlat kartochkasi (rasm + nom + "Turlar →") |
| 5 | **Nega aynan biz** | 4 ta ustunlik (ikonka + sarlavha + 2 gap matn) |
| 6 | **Blog** | Oxirgi 3 maqola (sana + sarlavha + qisqacha) |
| 7 | **Yakuniy CTA** | Fon rasmi + "Sayohatingizni bugun boshlang" + CTA tugma |
| 8 | **Footer** | 5-bo'limga qarang |

**Tur kartochkasi (qayta ishlatiladigan komponent):**
```
┌──────────────────────────┐
│  [rasm]      ★TOP        │  ← badge yuqori o'ngda
│              Sanasi bor  │  ← tur turi badge
├──────────────────────────┤
│ TARIXIY TURLAR   ·  6 kun│  ← kategoriya (uppercase, kichik) + davomiylik
│ Gruziya — Tbilisi va     │  ← sarlavha (serif)
│ Batumi                   │
│ $890 dan       Batafsil →│  ← narx (yirik) + havola
└──────────────────────────┘
```

### 4.2. Turlar katalogi (`/tours`)
- Sarlavha + qism sarlavha
- **Filtrlar:** **Turizm yo'nalishi** (Ichki / Chiquvchi / Kiruvchi — tab yoki dropdown) · Kategoriya · Davlat · [ixtiyoriy] narx oralig'i, davomiylik
- Tur kartochkalari grid (desktop 3 ustun · planshet 2 · mobil 1)
- Pagination yoki "Ko'proq yuklash"
- **Bo'sh holat:** "Bu filtrlar bo'yicha tur topilmadi" + filtrni tozalash tugmasi

### 4.3. Tur tafsiloti (`/tours/:slug`) — eng muhim sahifa

| # | Blok |
|---|------|
| 1 | Hero: katta rasm + tur nomi + kategoriya + davomiylik + yo'nalish |
| 2 | **Yopishqoq (sticky) narx paneli** — o'ngda desktop, pastda mobil: narx / "kishi uchun" / CTA tugma (`Hozir band qilish` yoki `Tur so'rash`) |
| 3 | Tavsif |
| 4 | **Marshrut** — kun-kun akkordeon (1-kun, 2-kun…) |
| 5 | **Narxga kiradi** ✓ / **Narxga kirmaydi** ✗ — ikki ustun |
| 6 | **Yaqin sanalar** (faqat `fixed`) — jadval: sana · narx · qolgan o'rin · `Tanlash` |
| 7 | **Galereya** — rasm lightbox |
| 8 | Sharhlar (bo'sh holat: "Hali sharhlar yo'q") |
| 9 | **O'xshash turlar** — 3 ta kartochka |

### 4.4. Yo'nalishlar (`/destinations`)
- Davlatlar grid, har birida: rasm, nom, turlar soni, "Turlar →" → filtrlangan `/tours`

### 4.5. Blog (`/blog`, `/blog/:slug`)
- Ro'yxat: sana · sarlavha · qisqacha · rasm
- Maqola: hero rasm, sana, muallif, "{N} daqiqa o'qish", mundarija (TOC), matn, "Yana o'qing" bloki

### 4.6. Aloqa (`/contact`)

| Blok | Tarkib |
|------|--------|
| Hero | "Sayohatingiz haqida gaplashaylik" |
| **Tezkor aloqa** | 3 ta katta kartochka: 📞 Telefon (bevosita qo'ng'iroq) · ✈ Telegram · 💬 WhatsApp |
| **Forma** | Ism va familiya\* · Telefon\* · Email · Yo'nalish (dropdown) · Xabar\* · [Yuborish]. Ostida: maxfiylik siyosatiga rozilik matni |
| **Yon panel** | Ofis manzili · **Ish vaqti (L4)** · Telefon · Email · Ijtimoiy tarmoqlar |
| **Xarita** | Google Maps embed — ofis joylashuvi (L5) |
| Muvaffaqiyat holati | "Xabaringiz qabul qilindi" + Telegram CTA + "Yangi xabar yuborish" |

### 4.7. Biz haqimizda (`/about`) — LITSENZIYA UCHUN KRITIK SAHIFA

Bu sahifa 5 blokdan iborat. **Oxirgi 3 tasi litsenziya uchun majburiy va referens saytda yo'q.**

| # | Blok | Tarkib |
|---|------|--------|
| 1 | Hero | "Orzudagi sayohatga eshikni ochamiz" + kompaniya haqida 1 gap |
| 2 | Missiya | Eyebrow + sarlavha + 2 paragraf |
| 3 | Nega aynan biz | 4 ta ustunlik kartochkasi |
| 4 | **🔴 `#litsenziya` — Litsenziya va sertifikatlar (L6, L7)** | Rasmiy uslubdagi ma'lumot bloki |
| 5 | **🔴 `#jamoa` — Jamoa va mas'ul mutaxassislar (L8)** | Kartochkalar |
| 6 | **🔴 `#rekvizitlar` — Kompaniya rekvizitlari (L9)** | Ikki ustunli jadval |
| 7 | `#hujjatlar` — Rasmiy hujjatlar | Davlat ro'yxatidan o'tganlik guvohnomasi (ishonch elementi) |

**Blok 4 — Litsenziya va sertifikatlar** (aniq ko'rinish):
```
LITSENZIYA
Rasmiy ruxsatnomalar

┌─────────────────────────────────────────────────────┐
│ Turizm faoliyati litsenziyasi                       │
│                                                     │
│ Litsenziya raqami      {{LICENSE_NO}}               │
│ Berilgan sana          {{LICENSE_DATE}}             │
│ Bergan organ           {{LICENSE_AUTHORITY}}        │
│ Faoliyat turi          Turoperatorlik / Turagentlik │
│ Litsenziyalangan       Ichki · Chiquvchi · Kiruvchi │
│   yo'nalishlar         turizm                       │
│ Amal qilish muddati    Muddatsiz                    │
│                                                     │
│ [📄 Litsenziya nusxasini yuklab olish (PDF)]        │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ Turizm xizmatlari sertifikati                       │
│ Sertifikat raqami      {{CERT_NO}}                  │
│ Berilgan sana          {{CERT_DATE}}                │
│ [📄 Sertifikat nusxasi (PDF)]                       │
└─────────────────────────────────────────────────────┘
```

**Blok 5 — Jamoa va mas'ul mutaxassislar:**
Har bir kartochkada: foto (yoki bosh harflar) · **F.I.Sh.** · lavozim · **mas'ul yo'nalish**
(masalan "Chiquvchi turizm") · **malaka sertifikati / ma'lumoti** · telefon/email (ixtiyoriy).
Kamida turizm bo'yicha malakali 1 mutaxassis ko'rsatilishi **shart** (L8).

```
┌───────────────────────┐  ┌───────────────────────┐
│      [foto]           │  │      [foto]           │
│ {{SPECIALIST_1_NAME}} │  │ {{SPECIALIST_2_NAME}} │
│ Direktor              │  │ Turizm bo'yicha       │
│                       │  │ yetakchi mutaxassis   │
│ Mas'ul yo'nalish:     │  │ Mas'ul yo'nalish:     │
│ Chiquvchi turizm      │  │ Ichki turizm          │
│ Malaka sertifikati:   │  │ Ma'lumoti: TDIU,      │
│ № {{CERT}}            │  │ "Turizm" yo'nalishi   │
└───────────────────────┘  └───────────────────────┘
```

**Blok 6 — Kompaniya rekvizitlari:**

| Maydon | Qiymat |
|--------|--------|
| Yuridik shaxs nomi | `{{LEGAL_NAME}}` MAS'ULIYATI CHEKLANGAN JAMIYAT |
| Qisqartma | `{{LEGAL_NAME_SHORT}}` MCHJ |
| **Yuridik manzil** | `{{LEGAL_ADDRESS}}` |
| **Pochta manzili** | `{{POSTAL_ADDRESS}}` |
| **Ish vaqti** | `{{WORKING_HOURS}}` |
| STIR (INN) | `{{STIR}}` |
| OKED | `{{OKED}}` |
| Ro'yxatdan o'tgan sana | `{{REG_DATE}}` |
| Hisob raqami | `{{BANK_ACCOUNT}}` |
| Bank | `{{BANK_NAME}}` |
| MFO | `{{MFO}}` |
| Direktor | `{{DIRECTOR_NAME}}` |
| Telefon | `{{PHONE}}` |
| Email | `{{EMAIL}}` |

**Blok 7 — Rasmiy hujjatlar** (litsenziya talabi emas, lekin ishonch uchun kuchli — referens
saytda mavjud va yaxshi bajarilgan):
```
RASMIY HUJJATLAR
Davlat ro'yxatidan o'tgan kompaniya

┌──────────────────┬──────────────────────────────────────┐
│                  │ Hujjat turi     Yuridik shaxsni      │
│  [guvohnoma      │                 davlat ro'yxatidan   │
│   skani /        │                 o'tkazilganligi      │
│   PDF preview]   │                 to'g'risidagi        │
│                  │                 guvohnoma            │
│                  │ Ro'yxat sanasi  {{REG_DATE}}         │
│                  │ Tasdiqlash №    {{REG_CERT_NO}}      │
│                  │ Bergan organ    {{REG_AUTHORITY}}    │
│                  │ Tekshirish kodi {{VERIFY_CODE}}      │
│                  │                                      │
│                  │ Hujjat haqiqiyligini my.gov.uz yoki  │
│                  │ QR kod orqali tekshiring.            │
│                  │ [📄 PDF ko'rish] [⬇ Yuklab olish]    │
└──────────────────┴──────────────────────────────────────┘
```

### 4.8. Savol-javob (`/faq`)
Akkordeon, kamida 8 savol:
1. Qanday qilib turni bron qilaman?
2. Qanday to'lov usullari mavjud?
3. Bron qilingan turni bekor qilsam bo'ladimi?
4. Viza olishda yordam berasizmi?
5. Tur narxiga nima kiradi?
6. Individual marshrut tuzasizmi?
7. To'lov xavfsizmi? Karta ma'lumotlarim saqlanadimi?
8. Sug'urta kiradimi?

### 4.9. Yuridik sahifalar (`/terms`, `/privacy`, `/cancellation`)

Uchalasi bir xil shablon: sarlavha · "Kuchga kirish sanasi" · "Oxirgi o'zgartirish" ·
**yon mundarija (TOC)** · raqamlangan bo'limlar · "Yuqoriga qaytish" · pastda boshqa yuridik
hujjatlarga havolalar.

**Bekor qilish siyosati** — majburiy jadval:

| Sayohatdan oldingi muddat | Bekor qilish to'lovi |
|---------------------------|----------------------|
| 60 kundan ko'p | Faqat oldindan to'lov (30%) |
| 30 – 60 kun | Tur narxining 50% |
| 15 – 29 kun | Tur narxining 75% |
| 15 kundan kam | Tur narxining 100% (qaytarilmaydi) |

+ "Biz tomondan bekor qilish" bo'limi (pulni to'liq qaytarish / boshqa turga almashtirish /
kelgusi tur uchun kredit) va pul qaytarish muddati (5–10 ish kuni).

---

## 5. FOOTER (barcha sahifalarda)

4 ustun + pastki qator:

| Ustun 1 — Brend | Ustun 2 — Yo'nalishlar | Ustun 3 — Kompaniya | Ustun 4 — Yordam |
|---|---|---|---|
| Logo | Bosh sahifa | Biz haqimizda | Savol-javob |
| Tagline | Turlar | **Litsenziya** | Foydalanish shartlari |
| Ijtimoiy tarmoqlar | Yo'nalishlar | **Jamoa** | Maxfiylik siyosati |
| | Blog | **Rekvizitlar** | Bekor qilish siyosati |
| | | Aloqa | |

**Footerning pastki bloki — litsenziya uchun majburiy (L4, L5, L6):**
```
─────────────────────────────────────────────────────────
{{LEGAL_NAME}} MCHJ  ·  STIR: {{STIR}}
Manzil: {{POSTAL_ADDRESS}}
Ish vaqti: {{WORKING_HOURS}}
Turizm faoliyati litsenziyasi: № {{LICENSE_NO}}, {{LICENSE_DATE}}
Tel: {{PHONE}}  ·  Email: {{EMAIL}}
─────────────────────────────────────────────────────────
© 2026 Ray Travel. Barcha huquqlar himoyalangan.
```

---

## 6. BRON VA TO'LOV OQIMI (litsenziya L2 + L3)

### 6.1. Bron qilish — `/book/:slug` (4 qadam, progress indikator bilan)

```
[1 Sana] ──── [2 Sayohatchilar] ──── [3 Ma'lumotlar] ──── [4 To'lov]
```

**1-qadam — Sanani tanlang**
Mavjud jo'nash sanalari ro'yxati. Har birida: sana · narx · `{N} o'rin qoldi` (yoki `Sotilgan` —
tanlab bo'lmaydi).

**2-qadam — Sayohatchilar soni**
`[−] 2 [+]` stepper · "Maksimal {max} kishi" · jonli jami hisob: `narx × son = Jami`

**3-qadam — Yo'lovchi ma'lumotlari**
Har bir sayohatchi uchun: Ism\* · Familiya\* · (pasport seriya/raqami, tug'ilgan sana — chet el
turlari uchun). Aloqa: Email\* · Telefon\*.
Agar tizimga kirmagan bo'lsa: "Davom etish uchun tizimga kiring" → login/register.

**4-qadam → `/pay/:reference` ga o'tish**

### 6.2. To'lov — `/pay/:reference` (2 bosqichli, Atmos)

**1-bosqich — Karta ma'lumotlari**
- Karta raqami (placeholder `8600 0000 0000 0000`)
- Amal qilish muddati (`OO/YY`)
- Tugma: `SMS kod yuborish`
- Ostida: `Humo · Uzcard · Visa · Mastercard` ikonkalari
- 🔒 Ishonch matni: **"Biz hech qachon karta raqamini saqlamaymiz"** · "Banklar bilan SSL/TLS
  shifrlash" · "Karta ma'lumotlari Atmos to'lov tizimi (O'zR Markaziy banki) tomonidan himoyalangan"

**2-bosqich — SMS tasdiqlash**
- "Kartaga ulangan telefon raqamingizga 6 xonali kod yuborildi"
- 6 xonali OTP input
- `To'lashni tasdiqlash` · `Kodni qaytadan yuborish` · `Karta ma'lumotlarini o'zgartirish`

**Muvaffaqiyat:** "To'lov muvaffaqiyatli amalga oshirildi" + bron raqami + "Chekni yuklab olish"

**To'lov xatolari — barchasi dizayn qilinishi kerak (i18n xabarlar):**

| Kod | Foydalanuvchiga xabar |
|-----|------------------------|
| `card_invalid` | Noto'g'ri karta raqami. Iltimos, tekshiring. |
| `card_expired` | Kartaning amal qilish muddati tugagan. |
| `card_blocked` | Karta bloklangan. Bank bilan bog'laning. |
| `otp_invalid` | Noto'g'ri tasdiqlash kodi. |
| `otp_expired` | Tasdiqlash kodi muddati tugadi. Qaytadan urinib ko'ring. |
| `insufficient_funds` | Kartada mablag' yetarli emas. |
| `provider_unavailable` | To'lov tizimi vaqtincha ishlamayapti. Keyinroq urinib ko'ring. |
| `amount_too_low` | To'lov summasi juda kichik. Qo'llab-quvvatlashga murojaat qiling. |

### 6.3. So'rov oqimi — `/inquiry/:slug` ("So'rov bo'yicha" turlar uchun)
Forma: Ism\* · Telefon\* · Email · Taxminiy sana · Kishilar soni · Byudjet · Izoh
→ `/inquiry/:reference/confirmation` — "So'rovingiz qabul qilindi, 1 soat ichida bog'lanamiz"

### 6.4. Bron statuslari (state machine)

`pending` → `hold` → `awaiting_payment` → `paid` → `confirmed` → `completed`
Yon tarmoqlar: `cancelled` · `refunded` · `failed`

Har bir status uchun rang va yorliq:

| Status | Yorliq (uz) | Rang |
|--------|-------------|------|
| `pending` | Kutilmoqda | kulrang |
| `hold` | Vaqtinchalik band | sariq |
| `awaiting_payment` | To'lov kutilmoqda | sariq |
| `paid` | To'langan | ko'k |
| `confirmed` | Tasdiqlangan | yashil |
| `completed` | Yakunlangan | yashil (och) |
| `cancelled` | Bekor qilingan | kulrang |
| `refunded` | Qaytarilgan | ko'k (och) |
| `failed` | Muvaffaqiyatsiz | qizil |

### 6.5. Mening bronlarim — `/my-bookings`
- Filtrlar: `Hammasi` · `Kelgusi` · `O'tgan` · `Bekor qilingan`
- Kartochkalar: tur nomi · sana · status badge · summa · `Batafsil`
- **Tafsilotlar:** sayohat ma'lumotlari · sayohatchilar · to'lov ma'lumotlari (usul, status, sana,
  tranzaksiya ID, komissiya) · `Statusni yangilash` · `Chekni yuklab olish` ·
  `To'lovni yakunlash` (agar `awaiting_payment`)
- **Bo'sh holat:** "Hozircha bronlar yo'q" + "Turlarni ko'rish" tugmasi
- **Kirilmagan holat:** "Bronlaringizni ko'rish uchun tizimga kiring"
- **Xato holati:** "Bronlarni yuklab bo'lmadi. Qayta urinib ko'ring."

### 6.6. Autentifikatsiya
- `/login` — Email · Parol · `Kirish` · "Hisobingiz yo'qmi? Ro'yxatdan o'tish"
- `/register` — Ism · Familiya · Email · Parol · Parolni tasdiqlang
- Parolni tiklash oqimi (email orqali)

---

## 7. DIZAYN TIZIMI

> **Muhim:** quyidagi **token strukturasi majburiy** (semantik nomlar, shkalalar).
> Aniq rang qiymatlari — **taklif etilayotgan boshlang'ich palitra**. Ray Travel brendiga mos
> ravishda o'zgartirilishi mumkin va **o'zgartirilishi tavsiya etiladi** — aks holda sayt
> referens saytning nusxasiga o'xshab qoladi.

### 7.1. Ranglar (CSS custom properties, oklch)

```css
:root {
  /* Brend */
  --color-primary:        oklch(52% 0.22 245);   /* asosiy — ko'k */
  --color-accent:         oklch(68% 0.20 230);   /* urg'u — och ko'k */

  /* Fon va yuzalar */
  --color-bg:             oklch(96% 0.012 85);   /* iliq bej fon */
  --color-surface:        oklch(99% 0.005 85);   /* kartochka */
  --color-surface-raised: oklch(91% 0.022 80);   /* ko'tarilgan yuza */

  /* Matn */
  --color-text:           oklch(22% 0.04 250);
  --color-text-muted:     oklch(48% 0.05 245);

  /* Holat */
  --color-success:        oklch(58% 0.18 165);
  --color-error:          oklch(58% 0.22 25);
  --color-warning:        oklch(75% 0.15 75);
}
```

### 7.2. Tipografika

```css
--font-serif: "Playfair Display", Georgia, serif;   /* sarlavhalar */
--font-sans:  "Inter", system-ui, sans-serif;       /* matn, UI */
```

**Fluid shkala (clamp — barcha ekranlarda silliq):**
```css
--text-hero:       clamp(3rem, 1rem + 7vw, 8rem);        /* hero sarlavha */
--text-display:    clamp(2rem, 1rem + 4vw, 4rem);        /* bo'lim sarlavhasi */
--text-heading:    clamp(1.5rem, 1rem + 2vw, 2.5rem);
--text-subheading: clamp(1.125rem, 1rem + 0.5vw, 1.5rem);
--text-body:       clamp(1rem, 0.92rem + 0.4vw, 1.125rem);
--text-small:      clamp(0.8125rem, 0.78rem + 0.15vw, 0.875rem);
```

**Qoidalar:**
- Hero va bo'lim sarlavhalari — **serif** (Playfair Display)
- Matn, tugma, forma, UI — **sans** (Inter)
- "Eyebrow" yorliqlari — sans, uppercase, `letter-spacing: 0.05em`, kichik, muted rang
- Qatorlar orasi: sarlavha `1.2`, matn `1.625`

### 7.3. Bo'shliq va radius

```css
--space-section: clamp(5rem, 4rem + 5vw, 9rem);   /* bo'limlar orasi */
--space-block:   clamp(2.5rem, 2rem + 2vw, 5rem); /* blok ichi */

--radius-md:  0.875rem;
--radius-xl:  0.75rem;
--radius-2xl: 1rem;
--radius-lg:  1.5rem;   /* katta kartochka */
```

### 7.4. Konteyner va grid
```css
--container-7xl: 80rem;  /* asosiy konteyner (maks kenglik) */
--container-4xl: 56rem;  /* matn/maqola */
--container-3xl: 48rem;  /* yuridik sahifalar */
```

### 7.5. Animatsiya
```css
--duration-fast:   0.15s;
--duration-normal: 0.3s;
--easing: cubic-bezier(0.4, 0, 0.2, 1);
```
- Hover: kartochka biroz ko'tariladi + soya kuchayadi
- Scroll-reveal: bo'limlar pastdan yumshoq chiqadi
- **`prefers-reduced-motion` hurmat qilinsin** — animatsiyalar o'chirilsin

### 7.6. Komponentlar ro'yxati (Claude Design yasashi kerak)
Tugma (asosiy/ikkilamchi/matnli) · Input · Select · Textarea · Checkbox · Stepper ·
Tur kartochkasi · Yo'nalish kartochkasi · Blog kartochkasi · Ustunlik kartochkasi ·
Badge (TOP / tur turi / status) · Akkordeon · Jadval · Progress-steps · OTP input ·
Modal · Toast/alert · Skeleton loader · Bo'sh holat · Til almashtirgich · Navbar ·
Mobil menyu (drawer) · Footer · Breadcrumb · TOC · Pagination · Lightbox

---

## 8. RESPONSIVE, A11Y VA TEXNIK TALABLAR

### 8.1. Responsive (L10 — litsenziya talabi)
| Nom | Kenglik | Grid |
|-----|---------|------|
| Mobil | 360–767px | 1 ustun |
| Planshet | 768–1023px | 2 ustun |
| Desktop | 1024–1439px | 3 ustun |
| Katta | 1440px+ | 3 ustun, kengroq konteyner |

- **Mobile-first** yozilsin
- Navbar mobilda — hamburger + to'liq ekran drawer
- Tur sahifasidagi narx paneli mobilda — pastda yopishqoq (sticky bottom bar)
- Jadvallar mobilda gorizontal scroll ichida
- Tegish maydonlari ≥ 44×44px

### 8.2. Accessibility (WCAG 2.1 AA)
- Rang kontrasti ≥ 4.5:1 (matn), ≥ 3:1 (yirik matn/UI)
- Barcha interaktiv elementlar klaviatura bilan ishlashi, ko'rinadigan `:focus` halqasi
- Semantik HTML: `<header> <nav> <main> <article> <footer>`, `<h1>` har sahifada bitta
- Barcha rasmlarga `alt`, ikonkalarga `aria-label`
- Formalarda `<label>`, xatolar `aria-describedby` orqali
- Akkordeon/modal — to'g'ri ARIA rollari, modal ichida focus trap
- `prefers-reduced-motion` qo'llab-quvvatlansin

### 8.3. Performance
- Lighthouse ≥ 90 (Performance, Accessibility, Best Practices, SEO)
- LCP < 2.5s · CLS < 0.1
- Rasmlar: WebP/AVIF, `loading="lazy"`, responsive `srcset`
- Shriftlar: `font-display: swap`, preconnect

### 8.4. SEO
- Har sahifada noyob `<title>` + `meta description` (3 tilda)
- `hreflang` (uz, ru, en, x-default) + `canonical`
- Open Graph + Twitter Card
- `sitemap.xml`, `robots.txt`
- Schema.org: `TravelAgency` (bosh sahifa), `TouristTrip` (tur), `Article` (blog), `FAQPage`
- Semantik, o'qiladigan URL slug'lar

### 8.5. Xavfsizlik
- HTTPS majburiy (HSTS)
- Karta ma'lumotlari **hech qachon** o'z serverimizda saqlanmaydi — to'g'ridan-to'g'ri to'lov
  provayderiga
- Formalarda rate limiting + bot himoyasi
- CSRF himoyasi, XSS'dan tozalash
- Parollar hash qilinadi
- Shaxsiy ma'lumotlar — O'zR "Shaxsga doir ma'lumotlar to'g'risida"gi qonuniga muvofiq

---

## 9. ISH TAQSIMOTI

### 9.1. Claude Design uchun (dizayn + frontend ekranlar)

**🔥 BIRINCHI NAVBAT (1-bosqich) — bularsiz litsenziya topshirib bo'lmaydi:**

| # | Ekran | Nega birinchi |
|---|-------|----------------|
| 1 | **Bosh sahifa** | Sayt yuzi |
| 2 | **Turlar katalogi** (filtrlar bilan) | Xizmatlar ro'yxati — L6 yo'nalishlari |
| 3 | **Tur tafsiloti** | Asosiy konversiya |
| 4 | **Bron qilish — 4 qadam** | **L3** |
| 5 | **To'lov — 2 bosqich + xato holatlari** | **L2** |
| 6 | **Biz haqimizda** (litsenziya + jamoa + rekvizitlar bloklari) | **L6, L7, L8, L9** |
| 7 | **Aloqa** (ish vaqti + xarita bilan) | **L4, L5** |
| 8 | **Header + Footer** (til almashtirgich, litsenziya qatori) | **L1, L4, L5, L6** |
| 9 | **Dizayn tizimi + komponentlar** (7-bo'lim) | Qolgan hamma narsa shundan quriladi |

**2-bosqich (keyinroq):** Yo'nalishlar · Blog (ro'yxat + maqola) · FAQ · Yuridik sahifalar
shabloni · Login/Register · Mening bronlarim · So'rov formasi · 404

> Har bir ekran uchun **3 breakpoint** (mobil 360 · planshet 768 · desktop 1440).
> Mobil versiyani birinchi qiling — litsenziya talabi (L10).

✅ Bajaradi:
- Yuqoridagi 1-bosqich ekranlari, keyin 2-bosqich — 3 breakpoint'da
- 7-bo'limdagi dizayn tizimi va komponent kutubxonasi
- **Barcha holatlar:** normal · loading (skeleton) · bo'sh · xato · muvaffaqiyat
- Bron va to'lov oqimining barcha qadamlari va xato ekranlari (6-bo'lim)
- 3 tilda kontent strukturasi (matnlar `{{...}}` bilan to'ldiriladi)
- Statik frontend (HTML/CSS/JS yoki React/Vue)

❌ Bajarmaydi (backend kerak):
- Atmos/Payme/Click bilan real integratsiya
- Foydalanuvchi autentifikatsiyasi va sessiyalar
- Ma'lumotlar bazasi, bron state machine
- Email/SMS yuborish
- Admin panel

### 9.2. Backend / Engineering uchun

| # | Ish |
|---|-----|
| B1 | Ma'lumotlar bazasi: Tour, Departure, Destination, Category, Booking, Passenger, Payment, Inquiry, User, BlogPost |
| B2 | REST API (3-tilli kontent, i18n) |
| B3 | Autentifikatsiya (register / login / logout / parol tiklash) |
| B4 | **Bron API + state machine** (6.4) — o'rinlarni bloklash, overbooking'dan himoya |
| B5 | **Atmos to'lov integratsiyasi** — karta → OTP → tasdiq → webhook. Idempotent, retry-safe |
| B6 | Email/SMS bildirishnomalar (bron tasdiqi, to'lov cheki) |
| B7 | PDF chek generatsiyasi |
| B8 | Admin panel: turlar, sanalar, bronlar, so'rovlar, blog, kontent boshqaruvi |
| B9 | Deploy: domen + SSL + CI/CD + monitoring + backup |

---

## 10. TO'LDIRILISHI KERAK BO'LGAN MA'LUMOTLAR

Dizayn boshlanishidan oldin bu jadvalni to'ldiring:

| Placeholder | Nima kerak | Qiymat |
|-------------|------------|--------|
| `{{BRAND_NAME}}` | Brend nomi (Ray Travel?) | |
| `{{DOMAIN}}` | Domen (ray-travel.uz?) | |
| `{{LEGAL_NAME}}` | To'liq yuridik nom | |
| `{{LEGAL_NAME_SHORT}}` | Qisqartma | |
| `{{LEGAL_ADDRESS}}` | Yuridik manzil | |
| `{{POSTAL_ADDRESS}}` | Pochta/faktik manzil | |
| `{{WORKING_HOURS}}` | Ish vaqti (mas: Du–Ju 09:00–18:00, Sha 10:00–15:00) | |
| `{{PHONE}}` | Asosiy telefon | |
| `{{PHONE_2}}` | Qo'shimcha / hotline | |
| `{{EMAIL}}` | Rasmiy email | |
| `{{TELEGRAM}}` / `{{INSTAGRAM}}` / `{{WHATSAPP}}` | Ijtimoiy tarmoqlar | |
| `{{STIR}}` | STIR (INN) | |
| `{{OKED}}` | OKED kodi | |
| `{{REG_DATE}}` | Ro'yxatdan o'tgan sana | |
| `{{BANK_NAME}}` / `{{BANK_ACCOUNT}}` / `{{MFO}}` | Bank rekvizitlari | |
| `{{DIRECTOR_NAME}}` | Direktor F.I.Sh. | |
| **`{{LICENSE_NO}}`** | **Litsenziya raqami** | |
| **`{{LICENSE_DATE}}`** | **Litsenziya sanasi** | |
| **`{{LICENSE_AUTHORITY}}`** | **Bergan organ** | |
| **`{{LICENSE_DIRECTIONS}}`** | **Litsenziyalangan yo'nalishlar: ichki / chiquvchi / kiruvchi** | |
| **`{{SPECIALIST_N_*}}`** | **Mas'ul mutaxassislar: F.I.Sh., lavozim, yo'nalish, malaka** | |
| `{{CERT_NO}}` / `{{CERT_DATE}}` | Turizm xizmatlari sertifikati | |
| `{{REG_CERT_NO}}` / `{{REG_AUTHORITY}}` / `{{VERIFY_CODE}}` | Davlat ro'yxati guvohnomasi (+ PDF skan) | |
| Logo | SVG/PNG, och va to'q fonlar uchun | |
| Turlar ro'yxati | Kamida 8 ta tur (2–3 tasi "Sanasi bor") | |
| Rasmlar | Yo'nalish va tur fotolari (litsenziyalangan yoki o'zimizniki) | |

> **Litsenziya raqami hali yo'q bo'lsa:** saytni `{{LICENSE_NO}}` joyiga
> "Litsenziya rasmiylashtirilmoqda" yozuvi bilan ishga tushiring va raqam olinishi bilanoq
> darhol qo'shing. Bu blok tuzilmasi oldindan tayyor turishi kerak.

---

## 11. QABUL QILISH MEZONLARI (Definition of Done)

Sayt tayyor deb hisoblanadi, agar:

- [ ] **L1** — 3 tilda (uz/ru/en) to'liq ishlaydi, har bir sahifa tarjima qilingan
- [ ] **L2** — real onlayn to'lov ishlaydi (test karta bilan uchdan-uchiga tekshirilgan)
- [ ] **L3** — bron oqimi to'liq ishlaydi, bron raqami beriladi
- [ ] **L4** — ish vaqti aloqa sahifasida va footerda ko'rinadi
- [ ] **L5** — pochta manzili + xarita joyida
- [ ] **L6** — litsenziya ma'lumotlari `/about#litsenziya` da va footerda
- [ ] **L6+** — litsenziyada ko'rsatilgan har bir yo'nalish (ichki/chiquvchi/kiruvchi) bo'yicha katalogda kamida bitta tur bor
- [ ] **L7** — sertifikat bloki (yoki mavjud emasligi haqida izoh)
- [ ] **L8** — mas'ul mutaxassislar ismlari va malakasi `/about#jamoa` da
- [ ] **L9** — to'liq rekvizitlar `/about#rekvizitlar` da
- [ ] **L10** — 360px dan 1440px+ gacha barcha ekranlarda to'g'ri ko'rinadi
- [ ] **L11** — domen + SSL faol, sayt 24/7 ochiladi
- [ ] **L12** — 3 ta yuridik hujjat mavjud va to'ldirilgan
- [ ] Lighthouse ≥ 90 (4 ta ko'rsatkich)
- [ ] Barcha holatlar (loading / bo'sh / xato) dizayn qilingan va ishlaydi
- [ ] Barcha formalar validatsiya bilan ishlaydi va xabar yetkazadi
- [ ] Klaviatura bilan to'liq navigatsiya mumkin
- [ ] 404 sahifasi mavjud

---

## Ilova A — Manbalar

- O'zR VM 10.07.2020 y. **433-son** qarori, 3-ilova — "Turoperator va turagentlik xizmatlarini
  ko'rsatish tartibi to'g'risida Nizom" — https://lex.uz/docs/-4930291
- "Turizm faoliyati qanday litsenziyalanadi" — norma.uz
- "Turizm faoliyatini litsenziyalash tartibi to'g'risida Nizom" — ferganatourism.uz
- Turizm qo'mitasi — https://gov.uz/oz/uzbektourism
- Referens sayt tahlili — https://dream-travel.uz (2026-09-03 holatiga)

**Eslatma:** litsenziya talablari o'zgarib turadi (2026-yil iyulda chiquvchi turizm uchun zaxira
fond talabi bo'yicha yangi takliflar muhokama qilindi). **Yakuniy ro'yxatni Turizm qo'mitasi
yoki yuristingiz bilan tasdiqlang.** Bu TZ saytning texnik qismini qamraydi.
