import { describe, expect, it } from "vitest";
import {
  ageOn,
  birthDateError,
  clampParty,
  emailError,
  formatUzPhone,
  isValidIsoDate,
  nameError,
  normalizeName,
  normalizePassport,
  parseCount,
  passportError,
  phoneError,
  uzPhoneDigits,
} from "../booking-validate";

describe("names", () => {
  it("normalizes to passport style", () => {
    expect(normalizeName("islom")).toBe("ISLOM");
    expect(normalizeName("o‘ktam")).toBe("O'KTAM");
    expect(normalizeName("anna   maria")).toBe("ANNA MARIA");
    expect(normalizeName("a".repeat(60))).toHaveLength(40);
  });
  it("accepts latin names with apostrophe, hyphen and space", () => {
    expect(nameError("ISLOM")).toBeNull();
    expect(nameError("O'KTAM")).toBeNull();
    expect(nameError("ANNA-MARIA")).toBeNull();
    expect(nameError("ABDU RAHMON")).toBeNull();
    expect(nameError("  Karimov ")).toBeNull();
  });
  it("rejects empty, cyrillic, digits and stray punctuation", () => {
    expect(nameError("")).toBe("required");
    expect(nameError("   ")).toBe("required");
    expect(nameError("ИСЛОМ")).toBe("latin");
    expect(nameError("ISLOM1")).toBe("latin");
    expect(nameError("-ISLOM")).toBe("latin");
    expect(nameError("ISLOM-")).toBe("latin");
    expect(nameError("IS--LOM")).toBe("latin");
    expect(nameError("ŞAHIN")).toBe("latin");
  });
});

describe("passport", () => {
  it("uppercases and strips separators", () => {
    expect(normalizePassport("ab 1234567")).toBe("AB1234567");
    expect(normalizePassport("ab-123-45-67-89")).toBe("AB1234567");
    expect(normalizePassport("аб1234567")).toBe("1234567");
  });
  it("validates the AB1234567 pattern", () => {
    expect(passportError("AB1234567")).toBeNull();
    expect(passportError("")).toBe("required");
    expect(passportError("AB123456")).toBe("format");
    expect(passportError("A12345678")).toBe("format");
    expect(passportError("ABC123456")).toBe("format");
    expect(passportError("ab1234567")).toBe("format");
    expect(passportError("AB12345678")).toBe("format");
  });
});

describe("dates and age", () => {
  it("validates ISO dates including leap years", () => {
    expect(isValidIsoDate("2024-02-29")).toBe(true);
    expect(isValidIsoDate("2026-02-29")).toBe(false);
    expect(isValidIsoDate("2026-13-01")).toBe(false);
    expect(isValidIsoDate("2026-04-31")).toBe(false);
    expect(isValidIsoDate("2026-4-1")).toBe(false);
    expect(isValidIsoDate("")).toBe(false);
  });
  it("computes full years on a given day", () => {
    expect(ageOn("2014-10-26", "2026-10-26")).toBe(12);
    expect(ageOn("2014-10-27", "2026-10-26")).toBe(11);
    expect(ageOn("2014-11-01", "2026-10-26")).toBe(11);
    expect(ageOn("2024-02-29", "2026-02-28")).toBe(1);
    expect(ageOn("2024-02-29", "2026-03-01")).toBe(2);
    expect(ageOn("bad", "2026-03-01")).toBeNull();
  });

  const dep = "2026-10-26";
  const today = "2026-10-08";

  it("requires a real past date", () => {
    expect(birthDateError("", "adult", dep, today)).toBe("required");
    expect(birthDateError("2026-02-30", "adult", dep, today)).toBe("invalid");
    expect(birthDateError("1800-01-01", "adult", dep, today)).toBe("invalid");
    expect(birthDateError(today, "adult", dep, today)).toBe("future");
    expect(birthDateError("2027-01-01", "child", dep, today)).toBe("future");
  });
  it("adults must be 12+ on the departure date", () => {
    expect(birthDateError("1990-05-05", "adult", dep, today)).toBeNull();
    expect(birthDateError("2014-10-26", "adult", dep, today)).toBeNull(); // jo'nash kuni 12 ga to'ladi
    expect(birthDateError("2014-10-27", "adult", dep, today)).toBe("adultAge");
    expect(birthDateError("2020-01-01", "adult", dep, today)).toBe("adultAge");
  });
  it("children must be 2–11 on the departure date", () => {
    expect(birthDateError("2020-01-01", "child", dep, today)).toBeNull();
    expect(birthDateError("2024-10-26", "child", dep, today)).toBeNull(); // aynan 2 yosh
    expect(birthDateError("2024-10-27", "child", dep, today)).toBe("childAge"); // hali 1 yosh
    expect(birthDateError("2014-10-27", "child", dep, today)).toBeNull(); // hali 11 yosh
    expect(birthDateError("2014-10-26", "child", dep, today)).toBe("childAge"); // 12 ga to'lgan
  });
});

describe("phone", () => {
  it("extracts nine local digits", () => {
    expect(uzPhoneDigits("+998 90 123 45 67")).toBe("901234567");
    expect(uzPhoneDigits("998901234567")).toBe("901234567");
    expect(uzPhoneDigits("901234567")).toBe("901234567");
    expect(uzPhoneDigits("998123456")).toBe("998123456"); // 9 xonali mahalliy raqam — kod emas
    expect(uzPhoneDigits("+998")).toBe("");
  });
  it("applies the +998 mask progressively", () => {
    expect(formatUzPhone("")).toBe("");
    expect(formatUzPhone("9")).toBe("+998 9");
    expect(formatUzPhone("+998 90")).toBe("+998 90");
    expect(formatUzPhone("+998 901")).toBe("+998 90 1");
    expect(formatUzPhone("+998 90 123 45 67")).toBe("+998 90 123 45 67");
    expect(formatUzPhone("+998 90 123 45 678")).toBe("+998 90 123 45 67");
    expect(formatUzPhone("+998 ")).toBe(""); // backspace bilan to'liq o'chirish
    expect(formatUzPhone("+998 99")).toBe("+998 99");
    expect(formatUzPhone("+998 998")).toBe("+998 99 8");
  });
  it("validates completeness", () => {
    expect(phoneError("+998 90 123 45 67")).toBeNull();
    expect(phoneError("")).toBe("required");
    expect(phoneError("+998")).toBe("required");
    expect(phoneError("+998 90 123 45")).toBe("format");
  });
});

describe("email", () => {
  it("accepts ordinary addresses", () => {
    expect(emailError("siz@example.com")).toBeNull();
    expect(emailError(" a.b+c@mail.co.uz ")).toBeNull();
  });
  it("rejects malformed addresses", () => {
    expect(emailError("")).toBe("required");
    expect(emailError("", false)).toBeNull();
    expect(emailError("siz@example")).toBe("format");
    expect(emailError("siz example@mail.com")).toBe("format");
    expect(emailError("@mail.com")).toBe("format");
    expect(emailError("a@b..com")).toBe("format");
    expect(emailError("a".repeat(120) + "@mail.com")).toBe("format");
  });
});

describe("party size", () => {
  it("parses query counts defensively", () => {
    expect(parseCount("3", 2)).toBe(3);
    expect(parseCount(" 4 ", 2)).toBe(4);
    expect(parseCount(null, 2)).toBe(2);
    expect(parseCount("", 2)).toBe(2);
    expect(parseCount("-1", 2)).toBe(2);
    expect(parseCount("2.5", 2)).toBe(2);
    expect(parseCount("abc", 0)).toBe(0);
    expect(parseCount("99999", 2)).toBe(2);
  });
  it("clamps to limits", () => {
    expect(clampParty(2, 1, 9)).toEqual({ adults: 2, children: 1 });
    expect(clampParty(0, 0, 9)).toEqual({ adults: 1, children: 0 });
    expect(clampParty(50, 50, 100)).toEqual({ adults: 8, children: 6 });
    expect(clampParty(NaN, -3, 9)).toEqual({ adults: 1, children: 0 });
  });
  it("never exceeds the seats left — children are trimmed first", () => {
    expect(clampParty(3, 3, 4)).toEqual({ adults: 3, children: 1 });
    expect(clampParty(4, 2, 4)).toEqual({ adults: 4, children: 0 });
    expect(clampParty(6, 2, 4)).toEqual({ adults: 4, children: 0 });
    expect(clampParty(2, 0, 0)).toEqual({ adults: 1, children: 0 });
  });
});
