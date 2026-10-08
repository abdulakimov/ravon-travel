import { describe, expect, it } from "vitest";
import { bookingTotal, formatDate, formatDateRange, money, weekday } from "../format";

describe("money", () => {
  it("formats USD with thousands separator and no decimals", () => {
    expect(money(1375)).toBe("$1,375");
    expect(money(720, "ru")).toBe("$720");
    expect(money(540.4)).toBe("$540");
  });

  it("converts to UZS, rounds to 1000 and groups with spaces", () => {
    expect(money(1375, "uz", "UZS")).toBe("17 394 000 so'm");
    expect(money(1375, "ru", "UZS")).toBe("17 394 000 сум");
    expect(money(1375, "en", "UZS")).toBe("17 394 000 UZS");
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
  it("charges children 75% and rounds to whole dollars", () => {
    expect(bookingTotal(720, 2, 0)).toBe(1440);
    expect(bookingTotal(720, 2, 1)).toBe(1980);
    expect(bookingTotal(690, 1, 1)).toBe(1208); // 690 + 517.5 → 1207.5 → 1208
  });
});
