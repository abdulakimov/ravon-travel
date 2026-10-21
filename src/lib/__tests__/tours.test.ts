import { mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { categories, countries, tours } from "../../data/tours";
import { liveTour, openDepartures, priceBounds, todayIso } from "../tour-utils";

// Kontent ombori bo'sh vaqtinchalik katalogda — seed (src/data) ishlatiladi. Modul env'dan keyin yuklanadi.
const CONTENT_DIR = mkdtempSync(join(tmpdir(), "ravon-content-test-"));
process.env.CONTENT_DIR = CONTENT_DIR;
let content: typeof import("../content");
beforeAll(async () => {
  content = await import("../content");
});

// Namuna ma'lumot shu sanaga nisbatan tuzilgan — testlar soatga bog'liq bo'lmasin.
const TODAY = "2026-10-08";
const countryIds = Object.keys(countries);
const categoryIds = Object.keys(categories);

describe("tour seed data integrity", () => {
  it("has unique ids, slugs and ranks", () => {
    for (const key of ["id", "slug", "rank"] as const) {
      expect(new Set(tours.map((t) => t[key])).size).toBe(tours.length);
    }
  });

  it("uses URL-safe slugs and known taxonomy", () => {
    for (const t of tours) {
      expect(t.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(countryIds).toContain(t.country);
      expect(categoryIds).toContain(t.category);
      for (const l of ["uz", "ru", "en"] as const) {
        expect(t.title[l].length).toBeGreaterThan(0);
        expect(t.summary[l].length).toBeGreaterThan(0);
      }
    }
  });

  it("fixed tours have departures and on-request tours have none (TZ §3)", () => {
    for (const t of tours) {
      if (t.fixedDeparture) expect(t.departures.length).toBeGreaterThan(0);
      else expect(t.departures).toHaveLength(0);
    }
    // Litsenziya L2+L3: kamida 2–3 ta tur saytda bron qilinadigan bo'lishi shart
    expect(tours.filter((t) => t.fixedDeparture && openDepartures(t, TODAY).length > 0).length).toBeGreaterThanOrEqual(3);
  });

  it("departures are consistent with the tour", () => {
    for (const t of tours) {
      for (const d of t.departures) {
        expect(d.id).toBe(d.from);
        expect(d.to > d.from).toBe(true);
        expect(d.seatsLeft).toBeGreaterThanOrEqual(0);
        expect(d.priceUzs).toBeGreaterThan(0);
        const span = (Date.parse(d.to) - Date.parse(d.from)) / 86_400_000 + 1;
        expect(span).toBe(t.days);
      }
      expect(t.nights).toBe(t.days - 1);
    }
  });

  it("card shows the cheapest open departure price and the nearest open departure's seats", () => {
    for (const t of tours.filter((x) => x.fixedDeparture)) {
      const open = openDepartures(t, TODAY);
      expect(t.priceFromUzs).toBe(Math.min(...open.map((d) => d.priceUzs)));
      expect(t.seatsLeft).toBe(open[0].seatsLeft);
    }
  });
});

describe("departures in the past", () => {
  const az = tours.find((t) => t.id === "az-7")!;

  it("are not offered once the departure day has come", () => {
    expect(openDepartures(az, "2026-10-11").map((d) => d.id)).toContain("2026-10-12");
    expect(openDepartures(az, "2026-10-12").map((d) => d.id)).not.toContain("2026-10-12");
    expect(liveTour(az, "2026-10-20").departures.map((d) => d.id)).toEqual(["2026-10-26", "2026-11-09", "2026-11-26"]);
  });

  it("recompute card price and seats from what is left", () => {
    const later = liveTour(az, "2026-11-20");
    expect(later.priceFromUzs).toBe(8_730_000);
    expect(later.seatsLeft).toBe(14);
    const over = liveTour(az, "2027-01-01");
    expect(over.departures).toHaveLength(0);
    expect(over.seatsLeft).toBeNull();
  });

  it("list cards (home, catalogue) follow the same rule as the detail page", async () => {
    for (const today of ["2026-10-08", "2026-10-12", "2026-10-25", "2027-08-01"]) {
      for (const card of await content.liveToursByRank(today)) {
        const detail = (await content.getTour(card.slug, today))!;
        expect(card).toEqual(detail);
        const open = openDepartures(detail, today);
        expect(card.seatsLeft).toBe(open[0]?.seatsLeft ?? null);
        expect(card.departures.every((d) => d.from > today)).toBe(true);
      }
    }
    expect((await content.liveToursByRank("2026-10-12")).find((t) => t.id === "az-7")!.seatsLeft).toBe(9);
  });

  it("uses the Tashkent calendar day", () => {
    expect(todayIso(new Date("2026-10-11T19:30:00Z"))).toBe("2026-10-12"); // UTC+5
    expect(todayIso(new Date("2026-10-11T18:30:00Z"))).toBe("2026-10-11");
  });
});

describe("content store lookups", () => {
  it("getTour returns undefined for unknown slugs", async () => {
    expect(await content.getTour("nope")).toBeUndefined();
    expect((await content.getTour("dubai"))?.id).toBe("ae-dubai");
  });

  it("similarTours never includes the tour itself", async () => {
    for (const t of tours) {
      const sim = await content.similarTours(t);
      expect(sim).toHaveLength(3);
      expect(sim.map((s) => s.id)).not.toContain(t.id);
    }
  });

  it("every seeded tour has its detail page content", async () => {
    for (const t of tours) expect(await content.getTourDetail(t.id)).toBeDefined();
  });

  it("admin edits are visible immediately and unpublished tours disappear from the site", async () => {
    await content.updateDoc("tours", (doc) => {
      const dubai = doc.tours.find((t) => t.slug === "dubai")!;
      dubai.published = false;
      const az = doc.tours.find((t) => t.id === "az-7")!;
      az.title.uz = "Yangi nom";
    });
    expect(await content.getTour("dubai")).toBeUndefined();
    expect((await content.getTourAnyState("dubai"))?.id).toBe("ae-dubai"); // eski bronlar uchun
    expect((await content.getTour("azerbaijan-7-wonders", TODAY))?.title.uz).toBe("Yangi nom");
    // Seed o'zgarmagan (kesh nusxasi emas, fayl yozilgan)
    expect(tours.find((t) => t.id === "az-7")!.title.uz).not.toBe("Yangi nom");
    const saved = JSON.parse(readFileSync(join(CONTENT_DIR, "tours.json"), "utf8"));
    expect(saved.tours.find((t: { id: string }) => t.id === "az-7").title.uz).toBe("Yangi nom");
  });

  it("a corrupt content file falls back to the seed instead of crashing the site", async () => {
    writeFileSync(join(CONTENT_DIR, "faq.json"), "{ not json");
    const items = await content.getFaq();
    expect(items.length).toBeGreaterThan(0);
  });

  it("a failed mutation writes nothing", async () => {
    await expect(
      content.updateDoc("settings", (doc) => {
        doc.phone = "+998900000000";
        throw new Error("validation failed");
      }),
    ).rejects.toThrow("validation failed");
    expect((await content.getSettings()).phone).toBeNull();
  });
});

describe("catalogue price filter", async () => {
  const { applyFilters, parseFilters } = await import("@/app/[locale]/tours/filters");
  const ctx = (list: { priceFromUzs: number }[]) => ({ countryIds, categoryIds, price: priceBounds(list) });

  it("shows every tour at the default (maximum) price", async () => {
    const list = (await import("../content")).liveToursByRank("2026-10-25");
    const all = await list;
    // Admin bitta turni yashirgan (yuqoridagi test) — e'lon qilinganlarning hammasi ko'rinadi
    expect(applyFilters(all, parseFilters("", ctx(all)), ctx(all))).toHaveLength(all.length);
  });

  it("widens the slider when a tour is priced above the default maximum", () => {
    const bounds = priceBounds([{ priceFromUzs: 31_200_000 }, { priceFromUzs: 4_100_000 }]);
    expect(bounds).toEqual({ min: 4_000_000, max: 31_500_000 });
  });
});

describe("single source of truth", () => {
  // Statik seed fayllarni FAQAT content.ts import qiladi: aks holda admin o'zgarishi bir joyda ko'rinib,
  // boshqa joyda (masalan bron narxi tekshiruvida) eski qiymat ishlatilardi.
  const SEED_IMPORT = /from\s+["'](@\/data|\.{1,2}(\/\.\.)*\/data)\/(tours|tour-details|blog|faq)["']/;
  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const p = join(dir, name);
      return statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(name) ? [p] : [];
    });

  it("only src/lib/content.ts imports the seed data", () => {
    const root = join(__dirname, "..", "..");
    const offenders = walk(root)
      .filter((f) => !f.includes("__tests__") && !f.endsWith(join("lib", "content.ts")) && !f.includes(join("src", "data")))
      .filter((f) => SEED_IMPORT.test(readFileSync(f, "utf8")));
    expect(offenders).toEqual([]);
  });
});
