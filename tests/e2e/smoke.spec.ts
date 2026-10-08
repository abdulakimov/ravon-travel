import { expect, test } from "@playwright/test";

const locales = ["uz", "ru", "en"] as const;

const pages = [
  "",
  "/tours",
  "/tours/azerbaijan-7-wonders",
  "/tours/dubai",
  "/destinations",
  "/blog",
  "/about",
  "/contact",
  "/faq",
  "/terms",
  "/privacy",
  "/cancellation",
  "/book/azerbaijan-7-wonders",
  "/inquiry/dubai",
];

for (const locale of locales) {
  for (const path of pages) {
    test(`/${locale}${path} renders correctly`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("console", (m) => {
        if (m.type() === "error") errors.push(m.text());
      });

      const res = await page.goto(`/${locale}${path}`);
      expect(res?.status()).toBe(200);

      // TZ L1: har tilda <html lang> to'g'ri
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      // Bitta <h1>
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("h1")).toBeVisible();
      // Header va footer (litsenziya qatori bilan) har sahifada
      await expect(page.locator("header").first()).toBeVisible();
      await expect(page.locator("footer")).toContainText("Humo · Uzcard · Visa · Mastercard");
      // Tarjima qilinmagan kalit yoki placeholder ko'rinmasin
      const text = await page.locator("body").innerText();
      expect(text).not.toMatch(/\{[A-Z_]{3,}\}/);
      expect(text).not.toMatch(/\b(common|home|catalog|tour|booking|payment|about|contact|inquiry|legal|faq|blog)\.[a-zA-Z]+\.[a-zA-Z]+/);

      // TZ L10: gorizontal scroll yo'q (360px loyihasida ham)
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(1);

      expect(errors, errors.join("\n")).toEqual([]);
    });
  }
}

test("root redirects to a locale", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/(uz|ru|en)$/);
});

test("hreflang alternates are present on indexable pages", async ({ page }) => {
  await page.goto("/uz/tours");
  for (const l of [...locales, "x-default"]) {
    await expect(page.locator(`link[rel="alternate"][hreflang="${l}"]`)).toHaveCount(1);
  }
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/uz\/tours$/);
});

test("language switcher keeps the current page", async ({ page }) => {
  await page.goto("/uz/about");
  await page.locator('header a[hreflang="ru"]').click();
  await expect(page).toHaveURL(/\/ru\/about$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
});

test("unknown page shows the localized 404", async ({ page }) => {
  const res = await page.goto("/ru/does-not-exist");
  expect(res?.status()).toBe(404);
  await expect(page.locator("body")).toContainText("404");
});

test("sitemap, robots and health respond", async ({ request }) => {
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).toContain("/uz/tours/azerbaijan-7-wonders");
  const robots = await request.get("/robots.txt");
  expect(await robots.text()).toMatch(/Sitemap:/i);
  const health = await request.get("/api/health");
  expect(await health.json()).toEqual({ status: "ok" });
});
