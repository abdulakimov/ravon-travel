import { describe, expect, it } from "vitest";
import { categoryIds, countryIds, getTour, liveTour, openDepartures, similarTours, todayIso, tours } from "../../data/tours";

// Namuna ma'lumot shu sanaga nisbatan tuzilgan — testlar soatga bog'liq bo'lmasin.
const TODAY = "2026-10-08";

describe("tour data integrity", () => {
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
        expect(d.priceUsd).toBeGreaterThan(0);
        const span = (Date.parse(d.to) - Date.parse(d.from)) / 86_400_000 + 1;
        expect(span).toBe(t.days);
      }
      expect(t.nights).toBe(t.days - 1);
    }
  });

  it("card shows the cheapest open departure price and the nearest open departure's seats", () => {
    for (const t of tours.filter((x) => x.fixedDeparture)) {
      const open = openDepartures(t, TODAY);
      expect(t.priceFromUsd).toBe(Math.min(...open.map((d) => d.priceUsd)));
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
    expect(later.priceFromUsd).toBe(690);
    expect(later.seatsLeft).toBe(14);
    const over = liveTour(az, "2027-01-01");
    expect(over.departures).toHaveLength(0);
    expect(over.seatsLeft).toBeNull();
  });

  it("uses the Tashkent calendar day", () => {
    expect(todayIso(new Date("2026-10-11T19:30:00Z"))).toBe("2026-10-12"); // UTC+5
    expect(todayIso(new Date("2026-10-11T18:30:00Z"))).toBe("2026-10-11");
  });
});

describe("lookups", () => {
  it("getTour returns undefined for unknown slugs", () => {
    expect(getTour("nope")).toBeUndefined();
    expect(getTour("dubai")?.id).toBe("ae-dubai");
  });

  it("similarTours never includes the tour itself", () => {
    for (const t of tours) {
      const sim = similarTours(t);
      expect(sim).toHaveLength(3);
      expect(sim.map((s) => s.id)).not.toContain(t.id);
    }
  });
});
