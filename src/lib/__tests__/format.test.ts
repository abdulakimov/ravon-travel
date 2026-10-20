import { describe, expect, it } from "vitest";
import { bookingTotal, formatDate, formatDateRange, money, weekday } from "../format";

describe("money", () => {
  const nb = (s: string) => s.replace(/ /g, "\u00a0");

  it("formats soum with non-breaking group separators and a per-locale suffix", () => {
    expect(money(17_390_000)).toBe(nb("17 390 000 so'm"));
    expect(money(17_390_000, "ru")).toBe(nb("17 390 000 сум"));
    expect(money(17_390_000, "en")).toBe(nb("17 390 000 UZS"));
  });

  it("rounds to whole soum and handles small and zero amounts", () => {
    expect(money(999)).toBe(nb("999 so'm"));
    expect(money(1000.4)).toBe(nb("1 000 so'm"));
    expect(money(0)).toBe(nb("0 so'm"));
  });
});

describe("dates", () => {
  it("formats a single date per locale", () => {
    expect(formatDate("2026-08-12", "uz")).toBe("12 avgust 2026");
    expect(formatDate("2026-08-12", "ru")).toBe("12 августа 2026");
    expect(formatDate("2026-08-12", "en")).toBe("12 August 2026");
  });

  it("collapses a range within one month", () => {
    expect(formatDateRange("2026-10-12", "2026-10-17", "uz")).toBe("12–17 oktabr 2026");
  });

  it("keeps both months when the range crosses a month or a year", () => {
    expect(formatDateRange("2026-11-26", "2026-12-01", "uz")).toBe("26 noyabr – 1 dekabr 2026");
    expect(formatDateRange("2026-12-27", "2027-01-03", "en")).toBe("27 December 2026 – 3 January 2027");
  });

  it("computes the weekday independent of the machine time zone", () => {
    expect(weekday("2026-10-12", "uz")).toBe("Dushanba");
    expect(weekday("2026-11-26", "uz")).toBe("Payshanba");
    expect(weekday("2026-10-12", "en")).toBe("Monday");
  });
});

describe("bookingTotal", () => {
  it("charges children 75% and returns whole soum", () => {
    expect(bookingTotal(9_110_000, 2, 0)).toBe(18_220_000);
    expect(bookingTotal(9_110_000, 2, 1)).toBe(25_052_500); // 18 220 000 + 6 832 500
    expect(bookingTotal(8_730_001, 1, 1)).toBe(15_277_502); // 8 730 001 + 6 547 500.75 → yaxlitlanadi
  });
});
