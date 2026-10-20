import { expect, type Locator, type Page, type Request, type TestInfo } from "@playwright/test";

// flows.spec.ts uchun yordamchilar.
//
// RATE LIMIT: /api/contact, /api/inquiry va /api/booking bitta hisoblagichni bo'lishadi
// (5 POST / 10 daqiqa / IP — src/lib/leads.ts). Shuning uchun deyarli barcha testlar bu
// endpoint'larni `mockLeads` bilan ushlab qoladi va so'rov tanasini tekshiradi; serverga haqiqatan
// boradigan testlar `@real` tegi bilan belgilangan (butun to'plamda 2 ta, faqat `desktop` loyihasida).

export const LEAD_API = /\/api\/(contact|inquiry|booking)(\?|$)/;

export const isMobile = (testInfo: TestInfo) => testInfo.project.name === "mobile-360";

export interface CapturedLead {
  kind: "contact" | "inquiry" | "booking";
  raw: string;
  body: Record<string, unknown>;
  /** Mock qaytargan javob tanasi. */
  response: unknown;
}

/** Sinov uchun /api/booking javobidagi to'lov kaliti (22 belgi, base64url — server beradigandek). */
export const MOCK_PAY_TOKEN = "abcdefghijklmnopqrstuv";

/** /api/booking'ning muvaffaqiyatli javobi: bron raqami va summani SERVER beradi (mijoz bookingId yubormaydi). */
export function bookingResponse(body: Record<string, unknown>): Record<string, unknown> {
  return {
    ok: true,
    bookingId: `RV-${new Date().getFullYear()}-${String(40000 + Math.floor(Math.random() * 50000))}`,
    amountUzs: body.totalUzs,
    holdUntil: Date.now() + 30 * 60 * 1000,
    payToken: MOCK_PAY_TOKEN,
  };
}

/**
 * Forma endpoint'larini ushlab qoladi (server chaqirilmaydi) va yuborilgan tanalarni yig'adi.
 * Default javob: aloqa/so'rov — `{ok:true}`, bron — `bookingResponse()` (berilgan javob `response` ga yoziladi).
 * `respond` — javobni almashtirish (masalan 429 holatini tekshirish uchun); barcha endpoint'larga birdek.
 */
export async function mockLeads(
  page: Page,
  respond?: { status: number; json: unknown },
): Promise<CapturedLead[]> {
  const captured: CapturedLead[] = [];
  // context darajasida: `keepalive: true` bilan yuborilgan fetch ham shu yerdan o'tadi
  await page.context().route(LEAD_API, async (route) => {
    const request = route.request();
    if (request.method() !== "POST") return route.fallback();
    const raw = request.postData() ?? "";
    const kind = /\/api\/(contact|inquiry|booking)/.exec(request.url())![1] as CapturedLead["kind"];
    const body = JSON.parse(raw || "{}") as Record<string, unknown>;
    const reply = respond ?? { status: 200, json: kind === "booking" ? bookingResponse(body) : { ok: true } };
    captured.push({ kind, raw, body, response: reply.json });
    await route.fulfill({ status: reply.status, contentType: "application/json", body: JSON.stringify(reply.json) });
  });
  return captured;
}

/** Sahifadan chiqqan BARCHA so'rovlarni (URL + tana) yig'adi — karta raqami sizib chiqmasligini tekshirish uchun. */
export function recordRequests(page: Page): { url: string; body: string }[] {
  const seen: { url: string; body: string }[] = [];
  page.context().on("request", (request: Request) => {
    seen.push({ url: request.url(), body: request.postData() ?? "" });
  });
  return seen;
}

export interface SeedOptions {
  id?: string;
  holdMinutes?: number;
  adults?: number;
  children?: number;
  departureId?: string;
  totalUzs?: number;
}

/**
 * To'lov sahifasi testlari uchun bronni to'g'ridan-to'g'ri sessionStorage'ga yozadi (bron ustasi
 * — sekin va /api/booking chaqiradi; u (c) testida to'liq bosib o'tiladi). sessionStorage oynaga
 * bog'liq, shuning uchun avval shu origin'dagi istalgan sahifa ochiladi.
 */
export async function seedBooking(page: Page, options: SeedOptions = {}): Promise<string> {
  const id = options.id ?? `RV-2026-${String(10000 + Math.floor(Math.random() * 80000))}`;
  await page.goto("/uz/faq");
  await page.evaluate(
    ({ id, o }) => {
      const now = Date.now();
      const adults = o.adults ?? 2;
      const children = o.children ?? 0;
      const people = [
        { firstName: "ISLOM", lastName: "KARIMOV", birthDate: "1990-05-15", passportNo: "AB1234567" },
        { firstName: "MADINA", lastName: "KARIMOVA", birthDate: "1992-07-01", passportNo: "AC7654321" },
      ];
      sessionStorage.setItem(
        "rt.booking." + id,
        JSON.stringify({
          id,
          tourSlug: "azerbaijan-7-wonders",
          departureId: o.departureId ?? "2026-10-26",
          adults,
          children,
          travelers: people.slice(0, adults + children),
          phone: "+998 90 123 45 67",
          email: "qa@example.com",
          note: "",
          consents: { offer: true, personalData: true },
          totalUzs: o.totalUzs ?? 18_220_000, // 2 kattalar × 9 110 000
          status: "held",
          createdAt: now,
          holdUntil: now + (o.holdMinutes ?? 30) * 60 * 1000,
        }),
      );
    },
    { id, o: options },
  );
  return id;
}

// ── Katalog ────────────────────────────────────────────────────────────────
/** Mobil ko'rinishda filtrlar pastki sheet ichida — avval ochiladi. Desktopda yon panel doim ko'rinadi. */
export async function openFilters(page: Page, mobile: boolean): Promise<Locator> {
  if (!mobile) return page.getByRole("complementary", { name: "Filtrlar" });
  await page.getByRole("button", { name: "Filtrlar", exact: true }).click();
  const sheet = page.getByRole("dialog", { name: "Filtrlar" });
  await expect(sheet).toBeVisible();
  return sheet;
}

/** Sheetni "Ko'rsatilmoqda N" tugmasi bilan yopadi (desktopda hech narsa qilmaydi). */
export async function applyFilters(page: Page, mobile: boolean, expectedCount: number): Promise<void> {
  if (!mobile) return;
  await page.getByRole("button", { name: `Ko'rsatilmoqda ${expectedCount}`, exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Filtrlar" })).toBeHidden();
}

/** Ko'rinib turgan tur kartochkalari (barcha natijalar DOM'da, sahifalashdan tashqaridagilari `hidden`). */
export const visibleCards = (page: Page): Locator => page.locator("main ul.card-grid > li:not([hidden])");

/** Bannerdagi jonli hisoblagich: "N tur topildi". */
export const resultCounter = (page: Page): Locator =>
  page.locator("main").getByRole("status").filter({ hasText: "tur topildi" });

/**
 * So'mdagi summa uchun regex: `som(15_942_500)` → /15\s942\s500\s*so'm/. `money()` guruhlarni bo'linmas
 * bo'shliq (U+00A0) bilan ajratadi; JS'dagi `\s` uni ham qamraydi.
 */
export function som(amount: number, suffix = "so'm"): RegExp {
  const grouped = String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, "\\s");
  // chapda raqam (yoki "raqam + bo'shliq") bo'lmasin: 15 942 500 summasi 115 942 500 ichida topilmasin
  return new RegExp(`(?<!\\d)(?<!\\d\\s)${grouped}\\s${suffix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`);
}

/** Matndagi birinchi so'm summasi (butun son). Guruhlar qat'iy 3 xonali — yonidagi raqamlar yopishmaydi. */
export function parseSom(text: string): number {
  const match = /(?<!\d)(?<!\d\s)(\d{1,3}(?:\s\d{3})*)\sso'm/.exec(text);
  if (!match) throw new Error(`soum amount not found in: ${text}`);
  return Number(match[1].replace(/\s/g, ""));
}

/** Ko'rinib turgan kartochkalardagi narxlar (so'm, butun son). */
export async function visiblePrices(page: Page): Promise<number[]> {
  const texts = await visibleCards(page).allInnerTexts();
  return texts.map(parseSom);
}

/** `aria-disabled` tugmani Playwright "o'chirilgan" deb hisoblaydi — haqiqiy foydalanuvchi esa bosa oladi. */
export async function clickEvenIfAriaDisabled(locator: Locator): Promise<void> {
  await locator.scrollIntoViewIfNeeded();
  await locator.click({ force: true });
}

/**
 * Gorizontal scroll yo'q (TZ L10). `window.innerWidth` bilan solishtirib BO'LMAYDI: `isMobile` emulyatsiyasida
 * Chrome kontent sig'masa layout viewport'ni kengaytiradi (innerWidth 360 → 367) va farq 0 bo'lib qoladi —
 * shuning uchun sozlangan viewport kengligi bilan solishtiriladi.
 */
export async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const width = page.viewportSize()!.width;
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(scrollWidth, `page is ${scrollWidth}px wide in a ${width}px viewport`).toBeLessThanOrEqual(width + 1);
}
