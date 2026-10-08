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
}

/**
 * Forma endpoint'larini ushlab qoladi (server chaqirilmaydi) va yuborilgan tanalarni yig'adi.
 * `respond` — javobni almashtirish (masalan 429 holatini tekshirish uchun).
 */
export async function mockLeads(
  page: Page,
  respond: { status: number; json: unknown } = { status: 200, json: { ok: true } },
): Promise<CapturedLead[]> {
  const captured: CapturedLead[] = [];
  // context darajasida: `keepalive: true` bilan yuborilgan fetch ham shu yerdan o'tadi
  await page.context().route(LEAD_API, async (route) => {
    const request = route.request();
    if (request.method() !== "POST") return route.fallback();
    const raw = request.postData() ?? "";
    const kind = /\/api\/(contact|inquiry|booking)/.exec(request.url())![1] as CapturedLead["kind"];
    captured.push({ kind, raw, body: JSON.parse(raw || "{}") as Record<string, unknown> });
    await route.fulfill({ status: respond.status, contentType: "application/json", body: JSON.stringify(respond.json) });
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
  totalUsd?: number;
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
          totalUsd: o.totalUsd ?? 1440,
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

/** Ko'rinib turgan kartochkalardagi narxlar (USD, butun son). */
export async function visiblePrices(page: Page): Promise<number[]> {
  const texts = await visibleCards(page).allInnerTexts();
  return texts.map((text) => {
    const match = /\$([\d,]+)/.exec(text);
    if (!match) throw new Error(`price not found in card: ${text}`);
    return Number(match[1].replace(/,/g, ""));
  });
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
