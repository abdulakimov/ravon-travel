# Changelog

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
