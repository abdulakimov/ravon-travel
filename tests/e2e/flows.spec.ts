import { expect, test, type Page } from "@playwright/test";
import {
  applyFilters,
  clickEvenIfAriaDisabled,
  expectNoHorizontalOverflow,
  isMobile,
  MOCK_PAY_TOKEN,
  mockLeads,
  openFilters,
  recordRequests,
  resultCounter,
  seedBooking,
  som,
  visibleCards,
  visiblePrices,
} from "./helpers";

// Haqiqiy foydalanuvchi yo'llari (smoke.spec.ts sahifalar ochilishini tekshiradi — bu yerda oqimlar).
// Til: `uz`, boshqasi alohida ko'rsatilgan.
//
// RATE LIMIT (5 POST / 10 daqiqa / IP, barcha forma endpoint'lari uchun umumiy): serverga haqiqatan
// boradigan testlar `@real` bilan belgilangan — to'plamda 2 ta (aloqa + so'rov, faqat `desktop`).
// Qolganlari `mockLeads` orqali ushlanadi. Bir to'liq yugurish = 2 ta haqiqiy POST, ya'ni 10 daqiqada
// ko'pi bilan 2 marta ketma-ket yugurtirish mumkin; tuzatish paytida: `--grep-invert @real`.
// E2E_MOCK_LEADS=1 — hech qanday haqiqiy POST yuborilmaydi (masalan BASE_URL=production bo'lganda
// menejerga "QA test" xabarlari ketmasligi uchun).
const MOCK_ALL_LEADS = process.env.E2E_MOCK_LEADS === "1";

test.use({ reducedMotion: "reduce" });

const TOUR = "/uz/tours/azerbaijan-7-wonders";
const CARD_FIELD = "Karta raqami";
const OTP_FIELD = "Tasdiqlash kodi";

/** To'lov sahifasida 1-bosqichni (karta) to'ldirib, SMS kod bosqichiga o'tadi. Demo kartani sahifadan o'qiydi. */
async function payWithDemoCard(page: Page): Promise<string> {
  const demoCard = (await page.getByRole("note").locator("code").first().innerText()).trim();
  expect(demoCard.replace(/\s/g, "")).toMatch(/^\d{16}$/);
  await page.getByLabel(CARD_FIELD).fill(demoCard);
  await page.getByLabel("Amal qilish muddati").fill("");
  await page.getByLabel("Amal qilish muddati").pressSequentially("1230"); // terilganda `12/30` ga aylanadi
  await expect(page.getByLabel("Amal qilish muddati")).toHaveValue("12/30");
  await page.getByRole("button", { name: /^To'lash \d/ }).click();
  await expect(page.getByRole("heading", { name: "SMS kodni kiriting" })).toBeVisible();
  return demoCard;
}

async function enterCode(page: Page, code: string): Promise<void> {
  await page.getByLabel(OTP_FIELD).fill(code);
  await page.getByRole("button", { name: "Tasdiqlash", exact: true }).click();
}

// ═══ a. Katalog ════════════════════════════════════════════════════════════
test.describe("catalogue", () => {
  test("filter by country + category updates URL, counter and chips; chip removal widens the result", async ({
    page,
  }, testInfo) => {
    const mobile = isMobile(testInfo);
    await page.goto("/uz/tours");
    await expect(resultCounter(page)).toHaveText(/^10\s*tur topildi$/);
    await expect(visibleCards(page)).toHaveCount(6);

    const filters = await openFilters(page, mobile);
    if (mobile) {
      // Sheet ochiq — orqadagi sahifa aylanmaydi
      await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
    }
    await filters.getByRole("checkbox", { name: /^Ozarbayjon/ }).check();
    await expect(page).toHaveURL(/\/uz\/tours\?country=az$/);
    await filters.getByRole("checkbox", { name: /^Tarixiy turlar/ }).check();
    await expect(page).toHaveURL(/\/uz\/tours\?country=az&category=historical$/);
    await applyFilters(page, mobile, 1);
    if (mobile) await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");

    await expect(resultCounter(page)).toHaveText(/^1\s*tur topildi$/);
    await expect(visibleCards(page)).toHaveCount(1);
    await expect(visibleCards(page).first()).toContainText("«7 mo'jiza»");

    const chips = page.getByRole("list", { name: "Faol filtrlar" });
    await expect(chips.getByRole("button")).toHaveCount(2);

    // Chipni olib tashlash → kategoriya filtri yo'qoladi, Ozarbayjonning 2 turi qoladi
    await chips.getByRole("button", { name: "Filtrni olib tashlash: Tarixiy turlar" }).click();
    await expect(page).toHaveURL(/\/uz\/tours\?country=az$/);
    await expect(resultCounter(page)).toHaveText(/^2\s*tur topildi$/);
    await expect(visibleCards(page)).toHaveCount(2);
    await expect(chips.getByRole("button")).toHaveCount(1);

    await chips.getByRole("button", { name: "Filtrni olib tashlash: Ozarbayjon" }).click();
    await expect(page).toHaveURL(/\/uz\/tours$/);
    await expect(resultCounter(page)).toHaveText(/^10\s*tur topildi$/);
    await expect(chips.getByRole("button")).toHaveCount(0);
  });

  test("empty state appears for a combination without tours and 'clear filters' restores the list", async ({
    page,
  }, testInfo) => {
    const mobile = isMobile(testInfo);
    await page.goto("/uz/tours");
    const filters = await openFilters(page, mobile);
    await filters.getByRole("checkbox", { name: /^Ozarbayjon/ }).check();
    await filters.getByRole("checkbox", { name: /^Kruiz/ }).check();
    await expect(page).toHaveURL(/\?country=az&category=cruise$/);
    await applyFilters(page, mobile, 0);

    await expect(page.getByRole("heading", { name: "Hech qanday tur topilmadi" })).toBeVisible();
    await expect(resultCounter(page)).toHaveText(/^0\s*tur topildi$/);
    await expect(visibleCards(page)).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Individual tur so'rash" })).toHaveAttribute("href", "/uz/contact");

    await page.getByRole("button", { name: "Filtrlarni tozalash", exact: true }).click();
    await expect(page).toHaveURL(/\/uz\/tours$/);
    await expect(page.getByRole("heading", { name: "Hech qanday tur topilmadi" })).toBeHidden();
    await expect(resultCounter(page)).toHaveText(/^10\s*tur topildi$/);
    await expect(visibleCards(page)).toHaveCount(6);
  });

  test("sort by price orders the cards and 'load more' reveals the remaining tours", async ({ page }) => {
    await page.goto("/uz/tours");
    await page.getByLabel("Saralash").selectOption({ label: "Narx: arzondan" });
    await expect(page).toHaveURL(/\/uz\/tours\?sort=price-asc$/);
    await expect(visibleCards(page)).toHaveCount(6);
    const firstPage = await visiblePrices(page);
    expect(firstPage).toEqual([...firstPage].sort((a, b) => a - b));
    expect(firstPage[0]).toBe(5_950_000); // eng arzon tur — Issiq-Ko'l
    // Narx so'mda, guruhlar BO'LINMAS bo'shliq bilan (narx qator oxirida uzilib qolmasin)
    expect(await visibleCards(page).first().textContent()).toContain("5\u00a0950\u00a0000\u00a0so'm");

    await page.getByRole("button", { name: "Ko'proq yuklash" }).click();
    await expect(visibleCards(page)).toHaveCount(10);
    await expect(page.getByRole("button", { name: "Ko'proq yuklash" })).toBeHidden();
    const all = await visiblePrices(page);
    expect(all).toEqual([...all].sort((a, b) => a - b));
    // Gretsiya kruizi (DATE-DEPENDENT: 2026-10-24 dan keyin eng arzon sanasi 21 380 000 bo'ladi).
    expect(all[all.length - 1]).toBe(20_870_000);

    await page.getByLabel("Saralash").selectOption({ label: "Narx: qimmatdan" });
    await expect(page).toHaveURL(/\?sort=price-desc$/);
    // Saralash o'zgarsa sahifalash 6 ga qaytadi
    await expect(visibleCards(page)).toHaveCount(6);
    const desc = await visiblePrices(page);
    expect(desc).toEqual([...desc].sort((a, b) => b - a));
    expect(desc[0]).toBe(20_870_000);
  });

  test("opening a filtered URL directly shows the filtered result with controls in sync", async ({
    page,
  }, testInfo) => {
    const mobile = isMobile(testInfo);
    await page.goto("/uz/tours?country=ge,bg&sort=price-desc");
    await expect(resultCounter(page)).toHaveText(/^2\s*tur topildi$/);
    await expect(visibleCards(page)).toHaveCount(2);
    // DATE-DEPENDENT: Gruziyaning 2026-10-20 sanasi (13 920 000) o'sha kuni ro'yxatdan chiqadi va karta keyingi
    // ochiq sana narxini ko'rsatadi (2026-12-27 — 15 690 000). Soft — qolgan tekshiruvlar baribir bajarilsin.
    expect.soft(await visiblePrices(page)).toEqual([13_920_000, 11_260_000]);
    await expect(page.getByLabel("Saralash")).toHaveValue("price-desc");
    await expect(page.getByRole("list", { name: "Faol filtrlar" }).getByRole("button")).toHaveCount(2);

    const filters = await openFilters(page, mobile);
    await expect(filters.getByRole("checkbox", { name: /^Gruziya/ })).toBeChecked();
    await expect(filters.getByRole("checkbox", { name: /^Bolgariya/ })).toBeChecked();
    await expect(filters.getByRole("checkbox", { name: /^Ozarbayjon/ })).not.toBeChecked();
    if (mobile) {
      await expect(page.getByRole("button", { name: "Ko'rsatilmoqda 2", exact: true })).toBeVisible();
      // Esc sheetni yopadi va fokusni ochgan tugmaga qaytaradi
      await page.keyboard.press("Escape");
      await expect(filters).toBeHidden();
      await expect(page.getByRole("button", { name: "Filtrlar", exact: true })).toBeFocused();
    }

    // Duration + fixed-only + narx — URL'dan o'qiladi (`9+` kodlangan holda ham, kodlanmagan holda ham)
    await page.goto("/uz/tours?duration=9%2B");
    await expect(resultCounter(page)).toHaveText(/^1\s*tur topildi$/);
    await expect(visibleCards(page).first()).toContainText("Malayziya");
    // Narx filtri so'mda: 11 500 000 gacha → Issiq-Ko'l (5 950 000), Ozarbayjon (8 730 000), Bolgariya (11 260 000)
    await page.goto("/uz/tours?fixed=1&maxPrice=11500000");
    await expect(resultCounter(page)).toHaveText(/^3\s*tur topildi$/);
    for (const price of await visiblePrices(page)) expect(price).toBeLessThanOrEqual(11_500_000);
    await expect(page.getByRole("list", { name: "Faol filtrlar" })).toContainText(som(11_500_000));
    // Qadamga (500 000) yaxlitlanadi: 11 200 000 → 11 000 000 → Bolgariya chiqib ketadi
    await page.goto("/uz/tours?fixed=1&maxPrice=11200000");
    await expect(resultCounter(page)).toHaveText(/^2\s*tur topildi$/);
    await expect(page.getByRole("list", { name: "Faol filtrlar" })).toContainText(som(11_000_000));
    // Eski (dollar) qiymatlar PRICE_MIN (5 000 000) ga qisiladi; 9 xonadan uzun qiymat e'tiborsiz qoldiriladi
    await page.goto("/uz/tours?maxPrice=900");
    await expect(resultCounter(page)).toHaveText(/^0\s*tur topildi$/);
    await page.goto("/uz/tours?maxPrice=1000000000");
    await expect(resultCounter(page)).toHaveText(/^10\s*tur topildi$/);
    await expect(page.getByRole("list", { name: "Faol filtrlar" }).getByRole("button")).toHaveCount(0);
  });

  test("catalogue fits a 360px viewport in every locale", async ({ page }, testInfo) => {
    test.skip(!isMobile(testInfo), "faqat 360px loyihasida ma'noga ega");
    // BUG (mobile-360, faqat ru): saralash bloki `.sort { flex: none }` (catalog.module.css) qisqarmaydi —
    // «Сортировка» yorlig'i + eng uzun variantga («Длительность: по возрастанию») moslangan <select> = 349px,
    // 18px chekinish bilan o'ng cheti 367px → sahifa 7px gorizontal aylanadi (TZ L10 buziladi).
    // smoke.spec.ts buni ko'rmaydi: u `scrollWidth - innerWidth` ni o'lchaydi, `isMobile` da esa innerWidth ham 367 bo'ladi.
    for (const locale of ["uz", "en", "ru"]) {
      await page.goto(`/${locale}/tours`);
      await expect(visibleCards(page)).toHaveCount(6);
      await expectNoHorizontalOverflow(page);
    }
  });

  test("language switch on the catalogue preserves the query string", async ({ page }) => {
    await page.goto("/uz/tours?country=az&category=historical&sort=price-asc");
    await expect(resultCounter(page)).toHaveText(/^1\s*tur topildi$/);
    await page.locator('header a[hreflang="ru"]').click();
    await expect(page).toHaveURL(/\/ru\/tours\?country=az&category=historical&sort=price-asc$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "ru");
    await expect(visibleCards(page)).toHaveCount(1);
    await expect(page.getByRole("list", { name: "Активные фильтры" }).getByRole("button")).toHaveCount(2);
    await expect(visibleCards(page).first()).toContainText(som(8_730_000, "сум"));
  });
});

// ═══ b. Tur tafsiloti ══════════════════════════════════════════════════════
test.describe("tour detail", () => {
  test("date + party selection drives the total and the booking link", async ({ page }) => {
    await page.goto(TOUR);
    const card = page.getByRole("complementary", { name: "Bron qilish" });
    const dateSelect = card.getByLabel("Jo'nash sanasi");
    const adults = card.getByRole("group", { name: "Kattalar" });
    const children = card.getByRole("group", { name: "Bolalar" });
    const total = card.locator("span").filter({ hasText: /^Jami\s*[\d\s]+so'm$/ });

    // Boshlang'ich holat: eng yaqin ochiq sana, 2 kattalar × 9 110 000
    // DATE-DEPENDENT: 2026-10-12 sanasi o'tib ketgan (2026-10-20 dan beri birinchi ochiq sana — 2026-10-26).
    await expect(dateSelect).toHaveValue("2026-10-12");
    await expect(total).toHaveText(som(18_220_000));

    // O'rni tugagan sana: jadvalda bosilmaydi, select'da umuman yo'q
    await expect(page.getByRole("button", { name: "O'rin tugadi: 9–14 noyabr 2026" })).toBeDisabled();
    await expect(dateSelect.locator("option")).toHaveCount(3);
    await expect(dateSelect.locator('option[value="2026-11-09"]')).toHaveCount(0);

    // Jadvaldan sana tanlash select bilan bir holatni bo'lishadi
    await page.getByRole("button", { name: "Tanlash: 26–31 oktabr 2026" }).click();
    await expect(dateSelect).toHaveValue("2026-10-26");
    await expect(page.getByRole("button", { name: "Tanlandi: 26–31 oktabr 2026" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    // Select orqali boshqa narxdagi sana: 8 730 000
    await dateSelect.selectOption("2026-11-26");
    await expect(page.getByRole("button", { name: "Tanlandi: 26 noyabr – 1 dekabr 2026" })).toBeVisible();

    await adults.getByRole("button", { name: "Kattalar: ko'paytirish" }).click();
    await children.getByRole("button", { name: "Bolalar: ko'paytirish" }).click();
    await children.getByRole("button", { name: "Bolalar: ko'paytirish" }).click();
    await expect(adults.locator(".stepper__value")).toHaveText("3");
    await expect(children.locator(".stepper__value")).toHaveText("2");

    // Jami = kattalar × narx + bolalar × narx × 0.75 = 3×8 730 000 + 2×8 730 000×0.75 = 39 285 000
    const price = 8_730_000;
    const expected = 3 * price + 2 * price * 0.75;
    expect(expected).toBe(39_285_000);
    await expect(card).toContainText("3 × kattalar");
    await expect(card).toContainText(som(26_190_000));
    await expect(card).toContainText("2 × bolalar");
    await expect(card).toContainText(som(13_095_000));
    await expect(total).toHaveText(som(39_285_000));

    // Toq bolalar soni — xom kasr ko'rinmasin
    await children.getByRole("button", { name: "Bolalar: kamaytirish" }).click();
    await expect(total).toHaveText(som(32_737_500));
    await expect(card).not.toContainText(/\d[.,]\d/);
    await children.getByRole("button", { name: "Bolalar: ko'paytirish" }).click();

    // Kattalar kamida 1
    const minus = adults.getByRole("button", { name: "Kattalar: kamaytirish" });
    await minus.click();
    await minus.click();
    await expect(adults.locator(".stepper__value")).toHaveText("1");
    await expect(minus).toBeDisabled();
    await adults.getByRole("button", { name: "Kattalar: ko'paytirish" }).click();
    await adults.getByRole("button", { name: "Kattalar: ko'paytirish" }).click();

    const cta = card.getByRole("link", { name: "Bron qilish" });
    await expect(cta).toHaveAttribute("href", "/uz/book/azerbaijan-7-wonders?date=2026-11-26&adults=3&children=2");
    await cta.click();
    await expect(page).toHaveURL(/\/uz\/book\/azerbaijan-7-wonders\?date=2026-11-26&adults=3&children=2$/);

    // Bron ustasi shu tanlov bilan ochiladi
    await expect(page.getByRole("heading", { name: "Sana va o'rinlarni tanlang" })).toBeVisible();
    await expect(page.getByRole("radio", { name: /26 noyabr – 1 dekabr 2026/ })).toBeChecked();
    await expect(page.getByRole("radio", { name: /9–14 noyabr 2026/ })).toBeDisabled();
    await expect(page.getByRole("group", { name: "Kattalar" }).locator(".stepper__value")).toHaveText("3");
    await expect(page.getByRole("group", { name: "Bolalar" }).locator(".stepper__value")).toHaveText("2");
    await expect(page.getByRole("complementary", { name: "Bron xulosasi" })).toContainText(som(39_285_000));
  });

  test("party size is capped by the seats left on the selected date", async ({ page }) => {
    await page.goto(TOUR);
    const card = page.getByRole("complementary", { name: "Bron qilish" });
    const plus = card.getByRole("button", { name: "Kattalar: ko'paytirish" });
    // 12 oktabr — 4 o'rin: 2 → 4, keyin tugma o'chadi va izoh chiqadi
    // DATE-DEPENDENT: 2026-10-12 o'tib ketgan; endi default — 2026-10-26 (9 o'rin), shuning uchun bu test yiqiladi.
    await plus.click();
    await plus.click();
    await expect(plus).toBeDisabled();
    await expect(card.getByRole("button", { name: "Bolalar: ko'paytirish" })).toBeDisabled();
    await expect(card.getByRole("status")).toContainText("4 ta o'rin qolgan");
  });

  // O'tib ketgan jo'nash sanalari SERVER soati (Toshkent) bo'yicha yashiriladi — brauzer soatini
  // o'zgartirib tekshirib bo'lmaydi. Qamrov: src/lib/__tests__/tours.test.ts → "departures in the past".

  test("on-request tour (dubai) leads to the inquiry form instead of booking", async ({ page }) => {
    await page.goto("/uz/tours/dubai");
    const card = page.getByRole("complementary", { name: "Bron qilish" });
    await expect(card.getByRole("combobox")).toHaveCount(0);
    await expect(card.getByRole("link", { name: "Bron qilish" })).toHaveCount(0);
    const cta = card.getByRole("link", { name: "So'rov yuborish" });
    await expect(cta).toHaveAttribute("href", "/uz/inquiry/dubai");
    await cta.click();
    await expect(page).toHaveURL(/\/uz\/inquiry\/dubai$/);
    await expect(page.locator("h1")).toBeVisible();
  });
});

// ═══ c. Bron → to'lov (to'liq yo'l) ════════════════════════════════════════
test.describe("booking → payment", () => {
  test("happy path: 4 steps with validation, booking id, demo card + 111111 → receipt that survives reload", async ({
    page,
  }) => {
    test.slow();
    const leads = await mockLeads(page);
    const requests = recordRequests(page);
    const year = new Date().getFullYear();

    // ── 1-qadam ──
    await page.goto("/uz/book/azerbaijan-7-wonders?date=2026-10-26&adults=1&children=1");
    await expect(page.getByRole("list", { name: "Bron bosqichlari" }).locator('[aria-current="step"]')).toContainText(
      "Sana va o'rin",
    );
    await expect(page.getByRole("radio", { name: /26–31 oktabr 2026/ })).toBeChecked();
    const summary = page.getByRole("complementary", { name: "Bron xulosasi" });
    await expect(summary).toContainText(som(15_942_500)); // 9 110 000 + 9 110 000×0.75
    await page.getByRole("button", { name: "Davom etish" }).click();

    // ── 2-qadam: sayohatchilar ──
    await expect(page.getByRole("heading", { name: "Sayohatchilar ma'lumoti" })).toBeFocused();
    const adult = page.getByRole("group", { name: "1. Kattalar sayohatchi" });
    const child = page.getByRole("group", { name: "2. Bola sayohatchi" });
    await expect(adult).toBeVisible();
    await expect(child).toBeVisible();
    const errors = page.locator("form .field__error");
    await expect(errors).toHaveCount(0); // xatolar faqat birinchi yuborishdan keyin
    await expectNoHorizontalOverflow(page);

    await page.getByRole("button", { name: "Davom etish" }).click();
    await expect(adult.getByText("Ismni kiriting")).toBeVisible();
    await expect(adult.getByText("Familiyani kiriting")).toBeVisible();
    await expect(adult.getByText("Tug'ilgan sanani kiriting")).toBeVisible();
    await expect(adult.getByText("Pasport raqamini kiriting")).toBeVisible();
    await expect(errors).toHaveCount(8);
    await expect(page.getByText("Belgilangan maydonlarni to'g'rilang")).toBeVisible();
    // Fokus birinchi noto'g'ri maydonga o'tadi
    await expect(adult.getByLabel("Ism (lotin)")).toBeFocused();
    await expect(adult.getByLabel("Ism (lotin)")).toHaveAttribute("aria-invalid", "true");

    // Noto'g'ri qiymatlar: kirill ism, qisqa pasport, kattalar uchun bola yoshi, bola uchun kattalar yoshi
    await adult.getByLabel("Ism (lotin)").fill("Ислом");
    await expect(adult.getByText("Faqat lotin harflari, pasportdagi kabi")).toBeVisible();
    await adult.getByLabel("Pasport raqami").fill("A12345");
    await expect(adult.getByText(/Format: 2 ta lotin harfi va 7 ta raqam/)).toBeVisible();
    await adult.getByLabel("Tug'ilgan sana").fill("2020-01-01");
    await expect(adult.getByText(/12 yoshdan katta bo'lishi kerak/)).toBeVisible();
    await child.getByLabel("Tug'ilgan sana").fill("1990-05-15");
    await expect(child.getByText(/2–11 yoshda bo'lishi kerak/)).toBeVisible();
    await page.getByRole("button", { name: "Davom etish" }).click();
    await expect(page.getByRole("heading", { name: "Sayohatchilar ma'lumoti" })).toBeVisible(); // o'tmadi

    // To'g'ri qiymatlar (kichik harf va bo'shliq normallashtiriladi)
    await adult.getByLabel("Ism (lotin)").fill("islom");
    await expect(adult.getByLabel("Ism (lotin)")).toHaveValue("ISLOM");
    await adult.getByLabel("Familiya (lotin)").fill("Karimov");
    await adult.getByLabel("Tug'ilgan sana").fill("1990-05-15");
    await adult.getByLabel("Pasport raqami").fill("ab 1234567");
    await expect(adult.getByLabel("Pasport raqami")).toHaveValue("AB1234567");
    await child.getByLabel("Ism (lotin)").fill("AZIZA");
    await child.getByLabel("Familiya (lotin)").fill("KARIMOVA");
    await child.getByLabel("Tug'ilgan sana").fill("2018-03-10");
    await child.getByLabel("Pasport raqami").fill("AC7654321");
    await expect(errors).toHaveCount(0);
    await page.getByRole("button", { name: "Davom etish" }).click();

    // ── 3-qadam: aloqa va roziliklar ──
    await expect(page.getByRole("heading", { name: "Aloqa ma'lumotlari" })).toBeFocused();
    const confirm = page.getByRole("button", { name: "Bronni tasdiqlash" });
    await expect(confirm).toHaveAttribute("aria-disabled", "true");
    await expect(page.getByText("Davom etish uchun ikkala shartga rozilik bering")).toBeVisible();
    await expect(errors).toHaveCount(0);

    await clickEvenIfAriaDisabled(confirm);
    await expect(page.getByText("Telefon raqamini kiriting")).toBeVisible();
    await expect(page.getByText("Emailni kiriting")).toBeVisible();
    await expect(page.getByText("Bu rozilik majburiy")).toHaveCount(2);
    expect(leads).toHaveLength(0);
    await expectNoHorizontalOverflow(page);

    const phone = page.getByLabel("Telefon");
    await phone.fill("90123");
    await expect(page.getByText("Raqamni to'liq kiriting: +998 va 9 ta raqam")).toBeVisible();
    await page.getByLabel("Email").fill("qa@example");
    await expect(page.getByText("Email manzili noto'g'ri")).toBeVisible();
    await phone.fill("901234567");
    await expect(phone).toHaveValue("+998 90 123 45 67");
    await page.getByLabel("Email").fill("qa@example.com");
    await page.getByLabel("Qo'shimcha izoh").fill("Yonma-yon o'rindiq");

    const offer = page.getByRole("checkbox", { name: /Ommaviy oferta/ });
    const personal = page.getByRole("checkbox", { name: /Shaxsiy ma'lumotlarimni/ });
    await offer.check();
    // Bitta rozilik yetarli emas
    await expect(confirm).toHaveAttribute("aria-disabled", "true");
    await expect(page.getByText("Bu rozilik majburiy")).toHaveCount(1);
    await personal.check();
    await expect(confirm).not.toHaveAttribute("aria-disabled", "true");
    await expect(errors).toHaveCount(0);
    await confirm.click();

    // ── 4-qadam: tasdiq ──
    await expect(page.getByRole("heading", { name: "O'rin band qilindi" })).toBeVisible();
    const details = page.locator("dl").filter({ hasText: "Bron raqami" });
    const bookingId = (await details.locator("dd").first().innerText()).trim();
    expect(bookingId).toMatch(/^RV-\d{4}-\d{5}$/);
    await expect(details).toContainText("26–31 oktabr 2026");
    await expect(details).toContainText("2 kishi");
    await expect(details).toContainText(/\d{2}:\d{2} gacha · 30 daqiqa/);
    await expectNoHorizontalOverflow(page);

    // /api/booking: bron SERVERDA yaratildi — raqamni server berdi (mijoz bookingId yubormaydi),
    // pasport raqami va tug'ilgan sana yuborilmadi
    await expect.poll(() => leads.length).toBe(1);
    const lead = leads[0];
    expect(lead.kind).toBe("booking");
    expect(bookingId).toBe((lead.response as { bookingId: string }).bookingId);
    expect(lead.body).not.toHaveProperty("bookingId");
    expect(lead.body).not.toHaveProperty("totalUsd");
    expect(lead.body).toMatchObject({
      slug: "azerbaijan-7-wonders",
      departureId: "2026-10-26",
      locale: "uz",
      adults: 1,
      children: 1,
      travelers: ["ISLOM KARIMOV", "AZIZA KARIMOVA"],
      phone: "+998 90 123 45 67",
      email: "qa@example.com",
      note: "Yonma-yon o'rindiq",
      totalUzs: 15_942_500,
    });
    expect(lead.raw).not.toMatch(/AB1234567|AC7654321/i);
    expect(lead.raw).not.toMatch(/1990-05-15|2018-03-10/);
    expect(lead.raw).not.toMatch(/passport|birth/i);

    // ── To'lov ──
    const toPay = page.getByRole("link", { name: "To'lovga o'tish" });
    // To'lov havolasi server bergan kalit bilan (?k=) — Click rejimida holat faqat shu kalit bilan ochiladi
    await expect(toPay).toHaveAttribute("href", `/uz/pay/${bookingId}?k=${MOCK_PAY_TOKEN}`);
    await toPay.click();
    await expect(page).toHaveURL(new RegExp(`/uz/pay/${bookingId}\\?k=${MOCK_PAY_TOKEN}$`));
    await expect(page.getByRole("heading", { level: 1, name: "To'lov" })).toBeVisible();
    await expect(page.locator("main")).toContainText(bookingId);
    await expect(page.getByRole("timer")).toHaveText(/^(29:\d\d|30:00)$/);
    await expect(page.getByRole("note")).toContainText("demo");
    const order = page.getByRole("complementary", { name: "Buyurtma xulosasi" });
    await expect(order).toContainText(som(15_942_500));
    await expect(order).toContainText("2 kishi");

    const pay = page.getByRole("button", { name: som(15_942_500) });
    await expect(pay).toHaveText(/^To'lash /);
    const payErrors = page.locator("form [id$='-err']");
    await expect(payErrors).toHaveCount(0);
    // SMS telefoni brondan olinadi
    await expect(page.getByLabel("SMS uchun telefon")).toHaveValue("+998 90 123 45 67");

    // Bo'sh / to'liq emas / Luhn'dan o'tmaydigan / muddati o'tgan karta rad etiladi
    await pay.click();
    await expect(page.getByText("Karta raqami to'liq kiritilmagan")).toBeVisible();
    await expect(page.getByText(/^Muddatni .* ko'rinishida kiriting$/)).toBeVisible();
    const cardInput = page.getByLabel(CARD_FIELD);
    await cardInput.fill("8600abc1234");
    await expect(cardInput).toHaveValue("8600 1234"); // faqat raqam, 4 tadan guruhlanadi
    await expect(page.getByText("Karta raqami to'liq kiritilmagan")).toBeVisible();
    const badCard = "8600 1234 5678 9013";
    await cardInput.fill(badCard.replace(/\s/g, ""));
    await expect(cardInput).toHaveValue(badCard);
    await expect(page.getByText("Noto'g'ri karta raqami. Iltimos, tekshiring.")).toBeVisible();
    await page.getByLabel("Amal qilish muddati").fill("0120");
    await expect(page.getByLabel("Amal qilish muddati")).toHaveValue("01/20");
    await expect(page.getByText("Kartaning amal qilish muddati tugagan.")).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await pay.click();
    await expect(page.getByRole("heading", { name: "To'lov usulini tanlang" })).toBeVisible(); // o'tmadi

    // To'g'ri sinov kartasi (demo ogohlantirishidan) + 111111
    const demoCard = await payWithDemoCard(page);
    await expect(page.getByText("+998 90 123 45 67 raqamiga 6 xonali kod yuborildi")).toBeVisible();
    await expect(page.getByRole("button", { name: "Kodni qayta yuborish" })).toBeDisabled();
    await expectNoHorizontalOverflow(page);
    await enterCode(page, "111111");

    const assertReceipt = async () => {
      await expect(page.getByRole("heading", { name: "To'lov muvaffaqiyatli" })).toBeVisible();
      const receipt = page.locator("dl:visible").filter({ hasText: "Tranzaksiya raqami" });
      await expect(receipt).toContainText(som(15_942_500));
      await expect(receipt).toContainText("Humo / Uzcard");
      await expect(receipt).toContainText(new RegExp(`\\d{1,2} [a-z]+ ${year} · \\d{2}:\\d{2}`));
      await expect(page.getByRole("button", { name: "Vaucherni yuklab olish" })).toBeVisible();
      await expect(page.getByRole("link", { name: "Bosh sahifaga qaytish" })).toHaveAttribute("href", "/uz");
      await expect(page.getByRole("timer")).toHaveCount(0);
      const tx = (await receipt.locator("dd").nth(2).innerText()).trim();
      expect(tx).toMatch(/^TX-\d{9}$/);
      return tx;
    };
    const transaction = await assertReceipt();
    await expectNoHorizontalOverflow(page);
    await expect(page.locator("dl:visible").filter({ hasText: "Tranzaksiya raqami" })).toContainText("·· 9012");

    // Qayta yuklash: holat saqlanadi, tranzaksiya raqami o'zgarmaydi
    await page.reload();
    expect(await assertReceipt()).toBe(transaction);

    // Karta raqami hech qayerga chiqmagan: na tarmoqqa, na brauzer xotirasiga
    const digits = demoCard.replace(/\s/g, "");
    const badDigits = badCard.replace(/\s/g, "");
    const leaks = requests.filter(({ url, body }) => {
      const haystack = decodeURIComponent(url) + "\n" + body;
      const compact = haystack.replace(/[\s+]|%20/g, "");
      return compact.includes(digits) || compact.includes(badDigits);
    });
    expect(leaks.map((r) => r.url)).toEqual([]);
    expect(requests.length).toBeGreaterThan(0);
    expect(leads).toHaveLength(1); // to'lov bosqichida forma endpoint'lariga hech narsa ketmadi
    const stored = await page.evaluate(() => JSON.stringify([{ ...sessionStorage }, { ...localStorage }, document.cookie]));
    expect(stored.replace(/\s/g, "")).not.toContain(digits);
    expect(stored).toMatch(/status\W+paid/); // bron saqlangan, lekin kartasiz
  });

  test("step 1 warns and blocks when the party exceeds the seats of a newly picked date", async ({ page }) => {
    await page.goto("/uz/book/azerbaijan-7-wonders?date=2026-10-26&adults=4&children=2");
    await expect(page.getByRole("group", { name: "Kattalar" }).locator(".stepper__value")).toHaveText("4");
    // 12 oktabrda 4 ta o'rin — 6 kishi sig'maydi
    // DATE-DEPENDENT: 2026-10-12 sanasi o'tib ketgan — radio endi yo'q, test shu yerda yiqiladi.
    await page.getByRole("radio", { name: /12–17 oktabr 2026/ }).check({ force: true });
    await expect(page.getByRole("alert").filter({ hasText: "Tanlangan sanada faqat 4 o'rin bor" })).toBeVisible();
    const next = page.getByRole("button", { name: "Davom etish" });
    await expect(next).toHaveAttribute("aria-disabled", "true");
    await clickEvenIfAriaDisabled(next);
    await expect(page.getByRole("heading", { name: "Sana va o'rinlarni tanlang" })).toBeVisible();
    // Bolalarni kamaytirgach yo'l ochiladi
    const minus = page.getByRole("button", { name: "Bolalar: Kamaytirish" });
    await minus.click();
    await minus.click();
    await expect(page.getByText("Tanlangan sanada faqat 4 o'rin bor")).toBeHidden();
    await next.click();
    await expect(page.getByRole("heading", { name: "Sayohatchilar ma'lumoti" })).toBeVisible();
    await expect(page.getByRole("group", { name: /Kattalar sayohatchi$/ })).toHaveCount(4);
  });
});

/**
 * Bron ustasini 1 kattalar bilan 3-qadamgacha (aloqa va roziliklar) to'ldiradi; "Bronni tasdiqlash" tugmasini qaytaradi.
 * Sana — 2026-11-26 (14 o'rin): narx tekshirilmaydi, shuning uchun eng uzoq ochiq sana olingan.
 */
async function wizardToStep3(page: Page) {
  await page.goto("/uz/book/azerbaijan-7-wonders?date=2026-11-26&adults=1&children=0");
  await page.getByRole("button", { name: "Davom etish" }).click();
  const adult = page.getByRole("group", { name: "1. Kattalar sayohatchi" });
  await adult.getByLabel("Ism (lotin)").fill("ISLOM");
  await adult.getByLabel("Familiya (lotin)").fill("KARIMOV");
  await adult.getByLabel("Tug'ilgan sana").fill("1990-05-15");
  await adult.getByLabel("Pasport raqami").fill("AB1234567");
  await page.getByRole("button", { name: "Davom etish" }).click();
  await expect(page.getByRole("heading", { name: "Aloqa ma'lumotlari" })).toBeFocused();
  await page.getByLabel("Telefon").fill("901234567");
  await page.getByLabel("Email").fill("qa@example.com");
  await page.getByRole("checkbox", { name: /Ommaviy oferta/ }).check();
  await page.getByRole("checkbox", { name: /Shaxsiy ma'lumotlarimni/ }).check();
  return page.getByRole("button", { name: "Bronni tasdiqlash" });
}

const storedBookings = (page: Page) =>
  page.evaluate(() => Object.keys(sessionStorage).filter((key) => key.startsWith("rt.booking.")));

test.describe("booking submit errors", () => {
  test("429 / 400 / 503 / network error keep the wizard on step 3 with an explanation; retry then succeeds", async ({
    page,
  }) => {
    test.slow();
    const confirm = await wizardToStep3(page);
    const alert = page.getByRole("alert").filter({ hasText: /Bronni|Juda ko'p/ });

    for (const [status, json, message, contactLink] of [
      [429, { error: "rate_limited" }, "Juda ko'p urinish. 10 daqiqadan keyin qayta urinib ko'ring", true],
      [400, { error: "invalid", fields: { totalUzs: "total mismatch" } }, "Bronni yaratib bo'lmadi: narx yoki bo'sh o'rinlar o'zgargan", false],
      [503, { error: "unavailable" }, "Bronni saqlab bo'lmadi — aloqa uzildi", true],
      // 200, lekin bron raqami yo'q/yaroqsiz — mijoz o'zi raqam o'ylab topmaydi
      [200, { ok: true }, "Bronni saqlab bo'lmadi — aloqa uzildi", true],
      [200, { ok: true, bookingId: "../../etc" }, "Bronni saqlab bo'lmadi — aloqa uzildi", true],
    ] as const) {
      await page.context().unrouteAll({ behavior: "wait" });
      const leads = await mockLeads(page, { status, json });
      await confirm.click();
      await expect(alert).toHaveCount(1);
      await expect(alert).toContainText(message);
      await expect(alert.getByRole("link", { name: "menejerga yozing" })).toHaveCount(contactLink ? 1 : 0);
      if (contactLink) await expect(alert.getByRole("link")).toHaveAttribute("href", "/uz/contact");
      // 3-qadamda qoladi, kiritilgan ma'lumot saqlangan, bron yaratilmagan
      await expect(page.getByRole("heading", { name: "Aloqa ma'lumotlari" })).toBeVisible();
      await expect(page.getByRole("heading", { name: "O'rin band qilindi" })).toHaveCount(0);
      await expect(page.getByLabel("Email")).toHaveValue("qa@example.com");
      await expect(confirm).not.toHaveAttribute("aria-disabled", "true");
      expect(leads).toHaveLength(1);
      expect(await storedBookings(page)).toEqual([]);
    }

    // Tarmoq xatosi (so'rov umuman yetib bormadi)
    await page.context().unrouteAll({ behavior: "wait" });
    await page.context().route("**/api/booking", (route) => route.abort("internetdisconnected"));
    await confirm.click();
    await expect(alert).toContainText("Bronni saqlab bo'lmadi — aloqa uzildi");
    await expect(page.getByRole("heading", { name: "Aloqa ma'lumotlari" })).toBeVisible();

    // Qayta urinish muvaffaqiyatli: xato yo'qoladi, 4-qadam, bron raqami serverdan
    await page.context().unrouteAll({ behavior: "wait" });
    const leads = await mockLeads(page);
    await confirm.click();
    await expect(page.getByRole("heading", { name: "O'rin band qilindi" })).toBeVisible();
    await expect(alert).toHaveCount(0);
    const issued = (leads[0].response as { bookingId: string }).bookingId;
    await expect(page.locator("dl").filter({ hasText: "Bron raqami" }).locator("dd").first()).toHaveText(issued);
    expect(await storedBookings(page)).toEqual([`rt.booking.${issued}`]);
  });

  test("a slow server is not hit twice by a double click", async ({ page }) => {
    const confirm = await wizardToStep3(page);
    let posts = 0;
    await page.context().route("**/api/booking", async (route) => {
      posts++;
      const body = route.request().postDataJSON() as Record<string, unknown>;
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, bookingId: "RV-2026-45678", amountUzs: body.totalUzs, holdUntil: Date.now() + 1_800_000 }),
      });
    });
    await confirm.dblclick();
    await expect(confirm).toHaveAttribute("aria-busy", "true");
    await expect(page.getByRole("heading", { name: "O'rin band qilindi" })).toBeVisible();
    expect(posts).toBe(1);
    // payToken kelmasa (eski server) — havola kalitsiz
    await expect(page.getByRole("link", { name: "To'lovga o'tish" })).toHaveAttribute("href", "/uz/pay/RV-2026-45678");
  });
});

// ═══ d. To'lov: xato yo'llari ══════════════════════════════════════════════
test.describe("payment failure paths", () => {
  test("wrong code → inline error; 000000 → declined; 999999 → error; retry ends in success", async ({ page }) => {
    await mockLeads(page);
    const id = await seedBooking(page);
    await page.goto(`/uz/pay/${id}`);
    await expect(page.getByRole("heading", { name: "To'lov usulini tanlang" })).toBeVisible();
    await payWithDemoCard(page);

    const otp = page.getByLabel(OTP_FIELD);
    // To'liq emas
    await enterCode(page, "123");
    await expect(page.getByRole("alert").filter({ hasText: "6 xonali kodni to'liq kiriting" })).toBeVisible();
    // Noto'g'ri kod — shu bosqichda qoladi, maydon xato holatida
    await otp.fill("1a2b34");
    await expect(otp).toHaveValue("1234"); // faqat raqam
    await otp.fill("123456");
    await page.getByRole("button", { name: "Tasdiqlash", exact: true }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Kod noto'g'ri. Yana bir marta urinib ko'ring." })).toBeVisible();
    await expect(otp).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByRole("heading", { name: "SMS kodni kiriting" })).toBeVisible();
    // Tahrirlash xatoni tozalaydi
    await otp.fill("0");
    await expect(page.getByRole("alert").filter({ hasText: "Kod noto'g'ri" })).toHaveCount(0);

    // 000000 → rad etildi
    await enterCode(page, "000000");
    await expect(page.getByRole("heading", { name: "To'lov amalga oshmadi" })).toBeFocused();
    await expect(page.locator("main")).toContainText(/Kartada mablag' yetarli emas\. Bron hali (29|30) daqiqa saqlanadi\./);
    await expect(page.getByText("Nima qilish kerak")).toBeVisible();
    await expect(page.getByRole("link", { name: "Menejer bilan bog'lanish" })).toHaveAttribute("href", "/uz/contact");

    // Qayta urinish → karta bosqichi (kiritilgan karta saqlangan) → 999999 → texnik xato
    await page.getByRole("button", { name: "Qayta urinish" }).click();
    await expect(page.getByRole("heading", { name: "To'lov usulini tanlang" })).toBeVisible();
    await expect(page.getByRole("timer")).toBeVisible();
    await page.getByRole("button", { name: /^To'lash \d/ }).click();
    await expect(otp).toHaveValue("");
    await enterCode(page, "999999");
    await expect(page.getByRole("heading", { name: "Texnik xatolik" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await expect(page.locator("main")).toContainText("Bank bilan aloqa uzildi");

    // Xatodan keyin qayta urinish muvaffaqiyatli tugaydi
    await page.getByRole("button", { name: "Qayta urinish" }).click();
    await page.getByRole("button", { name: /^To'lash \d/ }).click();
    await enterCode(page, "111111");
    await expect(page.getByRole("heading", { name: "To'lov muvaffaqiyatli" })).toBeVisible();
    await expect(page.locator("dl:visible").filter({ hasText: "Tranzaksiya raqami" })).toContainText(/TX-\d{9}/);
  });

  test("back to card from the code step keeps the form; bank transfer shows invoice instructions", async ({
    page,
  }) => {
    const id = await seedBooking(page);
    await page.goto(`/uz/pay/${id}`);
    const demoCard = await payWithDemoCard(page);
    await page.getByRole("button", { name: "Karta ma'lumotlarini o'zgartirish" }).click();
    await expect(page.getByLabel(CARD_FIELD)).toHaveValue(demoCard);

    await page.getByRole("radio", { name: /Bank o'tkazmasi/ }).check({ force: true });
    await expect(page.getByLabel(CARD_FIELD)).toHaveCount(0);
    await expect(page.locator("main")).toContainText(`Bron raqamini ko'rsating: ${id}`);
    await expect(page.getByRole("link", { name: "Hisob-faktura so'rash" })).toHaveAttribute("href", "/uz/contact");
  });

  test("an expired hold shows the expired state with a way back to booking", async ({ page }) => {
    const id = await seedBooking(page, { holdMinutes: -1 });
    await page.goto(`/uz/pay/${id}`);
    await expect(page.getByRole("heading", { name: "To'lov vaqti tugadi" })).toBeVisible();
    await expect(page.getByLabel(CARD_FIELD)).toHaveCount(0);
    await expect(page.getByRole("timer")).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Sanani qaytadan tanlash" })).toHaveAttribute(
      "href",
      "/uz/book/azerbaijan-7-wonders",
    );
  });

  test("unknown but well-formed reference shows the not-found state", async ({ page }) => {
    const res = await page.goto("/uz/pay/RV-2026-99999");
    expect(res?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: "Bron topilmadi" })).toBeVisible();
    await expect(page.locator("main")).toContainText("RV-2026-99999 raqamli bron bu brauzerda topilmadi");
    await expect(page.getByLabel(CARD_FIELD)).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Turlarni ko'rish" })).toHaveAttribute("href", "/uz/tours");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });

  for (const ref of ["RV-2026-1234", "rv-2026-12345", "RV-2026-123456", "abc"]) {
    test(`malformed reference "${ref}" → 404`, async ({ page }) => {
      const res = await page.goto(`/uz/pay/${ref}`);
      expect(res?.status()).toBe(404);
      await expect(page.locator("body")).toContainText("404");
      await expect(page.getByLabel(CARD_FIELD)).toHaveCount(0);
    });
  }
});

// ═══ e. Aloqa va so'rov formalari ══════════════════════════════════════════
test.describe("contact form (ru)", () => {
  const fill = async (page: Page) => {
    await page.getByLabel("Ваше имя").fill("  Анна Каримова ");
    await page.getByLabel("Телефон").fill("+998 90 123 45 67");
    await page.getByLabel("Email").fill("anna@example.com");
    await page.getByLabel("Тема").selectOption({ label: "Бронирование и оплата" });
    await page.getByRole("textbox", { name: "Сообщение" }).fill("Тестовое сообщение QA — пожалуйста, игнорируйте.");
    await page.getByRole("checkbox", { name: /Я согласен на обработку/ }).check();
  };

  test("errors appear only after the first submit and update as fields are corrected", async ({ page }) => {
    const leads = await mockLeads(page);
    await page.goto("/ru/contact");
    const form = page.getByRole("form", { name: "Отправить сообщение" });
    const errors = form.locator(".field__error");
    const submit = form.getByRole("button", { name: "Отправить сообщение" });

    // Yuborishdan oldin noto'g'ri qiymat xato ko'rsatmaydi
    await form.getByLabel("Телефон").fill("123");
    await form.getByLabel("Email").fill("abc");
    await form.getByLabel("Ваше имя").focus();
    await expect(errors).toHaveCount(0);
    await form.getByLabel("Телефон").fill("");
    await form.getByLabel("Email").fill("");

    await submit.click();
    await expect(form.getByText("Введите имя")).toBeVisible();
    await expect(form.getByText("Введите номер телефона")).toBeVisible();
    await expect(form.getByText("Введите текст сообщения")).toBeVisible();
    await expect(form.getByText("Для продолжения дайте согласие")).toBeVisible();
    await expect(errors).toHaveCount(4);
    await expect(form.getByLabel("Ваше имя")).toBeFocused();
    await expect(form.getByLabel("Ваше имя")).toHaveAttribute("aria-invalid", "true");

    // Jonli yangilanish
    await form.getByLabel("Ваше имя").fill("Анна");
    await expect(form.getByText("Введите имя")).toBeHidden();
    await form.getByLabel("Телефон").fill("12345");
    await expect(form.getByText("Номер должен содержать минимум 9")).toBeVisible();
    await form.getByLabel("Email").fill("anna@");
    await expect(form.getByText("Введите корректный адрес email")).toBeVisible();
    await form.getByRole("textbox", { name: "Сообщение" }).fill("коротко");
    await expect(form.getByText("Напишите минимум 10 символов")).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await submit.click();
    expect(leads).toHaveLength(0); // noto'g'ri forma serverga ketmaydi

    await fill(page);
    await expect(errors).toHaveCount(0);
  });

  test("successful submit shows the success block @real", async ({ page }, testInfo) => {
    // Haqiqiy POST faqat desktopda (rate limit byudjeti); mobil loyihada so'rov ushlanadi.
    const real = !isMobile(testInfo) && !MOCK_ALL_LEADS;
    const leads = real ? [] : await mockLeads(page);
    await page.goto("/ru/contact");
    await fill(page);

    const [request] = await Promise.all([
      page.waitForRequest((r) => r.url().endsWith("/api/contact") && r.method() === "POST"),
      page.getByRole("button", { name: "Отправить сообщение" }).click(),
    ]);
    const payload = request.postDataJSON() as Record<string, unknown>;
    expect(payload).toEqual({
      name: "Анна Каримова",
      phone: "+998 90 123 45 67",
      email: "anna@example.com",
      subject: "booking",
      message: "Тестовое сообщение QA — пожалуйста, игнорируйте.",
      consent: true,
      website: "",
      locale: "ru",
    });
    if (real) {
      const response = await request.response();
      expect(response?.status(), "POST /api/contact (429 = rate limit byudjeti tugagan, 10 daqiqa kuting)").toBe(200);
      expect(await response?.json()).toEqual({ ok: true });
    } else {
      expect(leads).toHaveLength(1);
    }

    const success = page.getByRole("status").filter({ hasText: "Сообщение отправлено" });
    await expect(success).toBeVisible();
    await expect(success.getByRole("heading", { name: "Сообщение отправлено" })).toBeFocused();
    await expect(page.getByRole("form", { name: "Отправить сообщение" })).toHaveCount(0);

    // "Yana bir xabar" — bo'sh forma qaytadi, eski xatolarsiz
    await success.getByRole("button", { name: "Написать ещё одно сообщение" }).click();
    await expect(page.getByLabel("Ваше имя")).toHaveValue("");
    await expect(page.getByRole("textbox", { name: "Сообщение" })).toHaveValue("");
    await expect(page.locator("form .field__error")).toHaveCount(0);
  });

  test("server responses 429 / 500 / 400 are explained and the typed data is kept", async ({ page }) => {
    await page.goto("/ru/contact");
    for (const [status, json, message] of [
      [429, { error: "rate_limited" }, "Слишком много запросов"],
      [500, { error: "boom" }, "Не удалось отправить сообщение"],
      [400, { error: "invalid", fields: { phone: "x" } }, "Некоторые поля заполнены неверно"],
    ] as const) {
      await page.context().unrouteAll({ behavior: "wait" });
      await mockLeads(page, { status, json });
      if (status === 429) await fill(page);
      await page.getByRole("button", { name: "Отправить сообщение" }).click();
      await expect(page.getByRole("alert").filter({ hasText: message })).toBeVisible();
      await expect(page.getByRole("textbox", { name: "Сообщение" })).toHaveValue("Тестовое сообщение QA — пожалуйста, игнорируйте.");
    }
    // 400: server belgilagan maydon xato holatida
    await expect(page.getByLabel("Телефон")).toHaveAttribute("aria-invalid", "true");
  });
});

test.describe("inquiry form (en, dubai)", () => {
  test("validates after the first submit, then submits successfully @real", async ({ page }, testInfo) => {
    const real = !isMobile(testInfo) && !MOCK_ALL_LEADS;
    const leads = real ? [] : await mockLeads(page);
    await page.goto("/en/inquiry/dubai");
    const errors = page.locator("form .field__error");
    const submit = page.getByRole("button", { name: "Send request" });

    await page.getByLabel("Phone").fill("123");
    await page.getByLabel("Email").fill("nope");
    await page.getByLabel("Your name").focus();
    await expect(errors).toHaveCount(0);

    await submit.click();
    await expect(page.getByText("Enter your name (at least 2 letters)")).toBeVisible();
    await expect(page.getByText("The phone number must contain at least 9 digits")).toBeVisible();
    await expect(page.getByText("The email address is not valid")).toBeVisible();
    await expect(page.getByText("Please give your consent to continue")).toBeVisible();
    await expect(errors).toHaveCount(4);
    await expect(page.getByLabel("Your name")).toBeFocused();
    await expectNoHorizontalOverflow(page);
    if (!real) expect(leads).toHaveLength(0);

    await page.getByLabel("Your name").fill("QA Tester");
    await expect(page.getByText("Enter your name (at least 2 letters)")).toBeHidden();
    await page.getByLabel("Phone").fill("+998 90 123 45 67");
    await page.getByLabel("Email").fill("qa@example.com");
    await page.getByLabel("Approximate date").fill("early May");
    await page.getByRole("group", { name: "Number of travellers" }).getByRole("button", { name: "Increase" }).click();
    await page.getByLabel("Budget").fill("up to $1,500 per person");
    await page.getByLabel("Comment").fill("QA test request — please ignore.");
    await page.getByRole("checkbox", { name: /I consent to my personal data/ }).check();
    await expect(errors).toHaveCount(0);

    const [request] = await Promise.all([
      page.waitForRequest((r) => r.url().endsWith("/api/inquiry") && r.method() === "POST"),
      submit.click(),
    ]);
    expect(request.postDataJSON()).toEqual({
      slug: "dubai",
      locale: "en",
      name: "QA Tester",
      phone: "+998 90 123 45 67",
      email: "qa@example.com",
      date: "early May",
      travelers: 3,
      budget: "up to $1,500 per person",
      comment: "QA test request — please ignore.",
      consent: true,
      website: "",
    });
    if (real) {
      const response = await request.response();
      expect(response?.status(), "POST /api/inquiry (429 = rate limit byudjeti tugagan, 10 daqiqa kuting)").toBe(200);
    } else {
      expect(leads).toHaveLength(1);
    }

    await expect(page.getByRole("heading", { name: "Your request has been received" })).toBeFocused();
    await expect(page.getByRole("button", { name: "Send request" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Back to the tour page" })).toHaveAttribute("href", "/en/tours/dubai");
    await expect(page.getByRole("link", { name: "Back to tours" })).toHaveAttribute("href", "/en/tours");
  });

  test("rate-limited response keeps the form and explains the problem", async ({ page }) => {
    await mockLeads(page, { status: 429, json: { error: "rate_limited" } });
    await page.goto("/en/inquiry/dubai");
    await page.getByLabel("Your name").fill("QA Tester");
    await page.getByLabel("Phone").fill("+998 90 123 45 67");
    await page.getByRole("checkbox", { name: /I consent to my personal data/ }).check();
    await page.getByRole("button", { name: "Send request" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Too many requests" })).toBeVisible();
    await expect(page.getByLabel("Your name")).toHaveValue("QA Tester");
    await expect(page.getByRole("button", { name: "Send request" })).toBeEnabled();
  });
});

// ═══ f. Mobil menyu ════════════════════════════════════════════════════════
test.describe("mobile menu", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(!isMobile(testInfo), "hamburger faqat < 940px da");
  });

  test("opens, locks page scroll, closes with Esc and navigates", async ({ page }) => {
    await page.goto("/uz");
    const burger = page.getByRole("button", { name: "Menyu", exact: true });
    const drawer = page.getByRole("dialog", { name: "Menyu" });
    await expect(page.locator("header").getByRole("navigation", { name: "Asosiy navigatsiya" })).toBeHidden();
    await expect(burger).toHaveAttribute("aria-expanded", "false");

    await burger.click();
    await expect(drawer).toBeVisible();
    await expect(burger).toHaveAttribute("aria-expanded", "true");
    await expect(drawer.getByRole("link")).toHaveCount(7); // 6 havola + CTA
    await expect(drawer.getByRole("link", { name: "Bosh sahifa" })).toHaveAttribute("aria-current", "page");

    // Sahifa scroll'i bloklangan
    await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
    await page.mouse.move(180, 400);
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(250);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    // Panel butun ekranni qoplaydi
    const box = await drawer.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(360);
    expect(box?.height).toBeGreaterThanOrEqual(740);

    // Esc yopadi, scroll qaytadi
    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();
    await expect(burger).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");

    // Yopish tugmasi
    await burger.click();
    await drawer.getByRole("button", { name: "Yopish" }).click();
    await expect(drawer).toBeHidden();

    // Navigatsiya: havola bosilganda sahifa almashadi va menyu yopiladi
    await burger.click();
    await drawer.getByRole("link", { name: "Yo'nalishlar" }).click();
    await expect(page).toHaveURL(/\/uz\/destinations$/);
    await expect(drawer).toBeHidden();
    await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
    await expect(page.locator("h1")).toBeVisible();

    await page.getByRole("button", { name: "Menyu", exact: true }).click();
    await drawer.getByRole("link", { name: "Bron qilish" }).click();
    await expect(page).toHaveURL(/\/uz\/tours$/);
  });
});

test.describe("mobile menu — keyboard focus", () => {
  test("focus stays inside the open menu and returns to the menu button on close", async ({ page }, testInfo) => {
    test.skip(!isMobile(testInfo), "hamburger faqat < 940px da");
    // BUG: panel `role="dialog" aria-modal="true"` (Header.tsx), lekin fokus qamalmaydi — oxirgi havoladan keyingi
    // Tab panel ORQASIDAGI (ko'rinmaydigan) sahifa havolalariga o'tadi; Esc/Yopish dan keyin fokus «Menyu»
    // tugmasiga qaytmaydi (<body> ga tushadi). Katalogdagi filtr sheet'i (Catalog.tsx) ikkalasini ham to'g'ri qiladi.
    await page.goto("/uz");
    const burger = page.getByRole("button", { name: "Menyu", exact: true });
    await burger.click();
    const drawer = page.getByRole("dialog", { name: "Menyu" });
    await expect(drawer.getByRole("button", { name: "Yopish" })).toBeFocused();
    // Ikkala nuqson ham mustaqil tekshiriladi (soft) — bittasi tuzatilsa ham test "kutilgan xato" bo'lib qoladi.
    let escaped = false;
    for (let i = 0; i < 9 && !escaped; i++) {
      await page.keyboard.press("Tab");
      escaped = await page.evaluate(() => !document.activeElement?.closest("#mobile-menu"));
    }
    expect.soft(escaped, "Tab fokusni ochiq dialogdan tashqariga chiqardi").toBe(false);
    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();
    await expect.soft(burger, "yopilgach fokus «Menyu» tugmasiga qaytmadi").toBeFocused();
  });
});

// ═══ g. Klaviatura ═════════════════════════════════════════════════════════
test.describe("keyboard", () => {
  test("the first Tab stop is the skip link and it jumps to the main content", async ({ page }) => {
    await page.goto("/uz/tours");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Asosiy kontentga o'tish" });
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#main$/);
    // Keyingi Tab header'ga emas, asosiy kontent ichiga tushadi
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => !!document.activeElement?.closest("main"))).toBe(true);
  });

  test("tour itinerary accordion toggles with Enter and Space", async ({ page }) => {
    await page.goto(TOUR);
    const day1 = page.getByRole("button", { name: /^1-kun/ });
    const day2 = page.getByRole("button", { name: /^2-kun/ });
    const panel2 = page.getByRole("region", { name: /^2-kun/ });
    await expect(day1).toHaveAttribute("aria-expanded", "true");
    await expect(day2).toHaveAttribute("aria-expanded", "false");
    await expect(panel2).toBeHidden();

    await day2.focus();
    await page.keyboard.press("Enter");
    await expect(day2).toHaveAttribute("aria-expanded", "true");
    await expect(panel2).toBeVisible();
    await page.keyboard.press("Space");
    await expect(day2).toHaveAttribute("aria-expanded", "false");
    await expect(panel2).toBeHidden();
    await page.keyboard.press("Space");
    await expect(day2).toHaveAttribute("aria-expanded", "true");

    // Klaviatura bilan keyingi kunga o'tiladi (Tab tartibi kunlar bo'yicha)
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: /^3-kun/ })).toBeFocused();

    // "Hammasini ochish / yopish"
    const all = page.getByRole("button", { name: "Hammasini ochish" });
    await all.focus();
    await page.keyboard.press("Enter");
    const days = page.locator("ol button[aria-controls]");
    await expect(days).toHaveCount(6);
    for (const day of await days.all()) await expect(day).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByRole("button", { name: "Hammasini yopish" })).toBeFocused();
    await page.keyboard.press("Space");
    for (const day of await days.all()) await expect(day).toHaveAttribute("aria-expanded", "false");
  });

  test("FAQ accordion toggles with Enter and Space and the panel really hides", async ({ page }) => {
    await page.goto("/uz/faq");
    const first = page.getByRole("button", { name: "Qanday qilib turni bron qilaman?" });
    const second = page.getByRole("button", { name: "Qanday to'lov usullari mavjud?" });
    const panel = (button: typeof first) =>
      button.evaluate((el) => {
        const node = document.getElementById(el.getAttribute("aria-controls") ?? "");
        return !!node && node.getClientRects().length > 0;
      });

    await expect(first).toHaveAttribute("aria-expanded", "true");
    await expect(second).toHaveAttribute("aria-expanded", "false");
    expect(await panel(first)).toBe(true);
    expect(await panel(second)).toBe(false);

    await second.focus();
    await page.keyboard.press("Enter");
    await expect(second).toHaveAttribute("aria-expanded", "true");
    await expect.poll(() => panel(second)).toBe(true);
    await page.keyboard.press("Space");
    await expect(second).toHaveAttribute("aria-expanded", "false");
    await expect.poll(() => panel(second)).toBe(false);

    // Birinchi (ochiq) savol ham yopiladi
    await first.focus();
    await page.keyboard.press("Space");
    await expect(first).toHaveAttribute("aria-expanded", "false");
    await expect.poll(() => panel(first)).toBe(false);
  });
});
