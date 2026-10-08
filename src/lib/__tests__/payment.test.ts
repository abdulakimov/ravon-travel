import { describe, expect, it } from "vitest";
import {
  cardNumberError,
  clockTime,
  demoOutcome,
  expiryError,
  formatCardNumber,
  formatCountdown,
  formatExpiry,
  formatOtp,
  lastFour,
  localIsoDate,
  luhnValid,
  newTransactionId,
  parseExpiry,
} from "../payment";

describe("formatCardNumber", () => {
  it("groups digits by four", () => {
    expect(formatCardNumber("8600123456789012")).toBe("8600 1234 5678 9012");
    expect(formatCardNumber("86001")).toBe("8600 1");
    expect(formatCardNumber("8600")).toBe("8600");
  });
  it("drops non-digits and anything past 16 digits", () => {
    expect(formatCardNumber("8600-1234 abcd 5678 9012 999")).toBe("8600 1234 5678 9012");
    expect(formatCardNumber("")).toBe("");
    expect(formatCardNumber("abc")).toBe("");
  });
  it("is idempotent", () => {
    const once = formatCardNumber("4242424242424242");
    expect(formatCardNumber(once)).toBe(once);
  });
});

describe("luhnValid", () => {
  it("accepts known valid numbers", () => {
    expect(luhnValid("4242424242424242")).toBe(true);
    expect(luhnValid("4242 4242 4242 4242")).toBe(true);
    expect(luhnValid("8600123456789012")).toBe(true);
    expect(luhnValid("79927398713")).toBe(true);
  });
  it("rejects a single changed digit and garbage", () => {
    expect(luhnValid("4242424242424243")).toBe(false);
    expect(luhnValid("8600123456789013")).toBe(false);
    expect(luhnValid("")).toBe(false);
    expect(luhnValid("4242-4242-4242-4242")).toBe(false);
    expect(luhnValid("abcd")).toBe(false);
  });
});

describe("cardNumberError", () => {
  it("reports incomplete numbers first", () => {
    expect(cardNumberError("")).toBe("card_incomplete");
    expect(cardNumberError("8600 1234 5678 901")).toBe("card_incomplete");
  });
  it("reports Luhn failures and repeated digits", () => {
    expect(cardNumberError("8600 1234 5678 9010")).toBe("card_invalid");
    expect(cardNumberError("0000 0000 0000 0000")).toBe("card_invalid");
  });
  it("passes a valid number", () => {
    expect(cardNumberError("8600 1234 5678 9012")).toBeNull();
    expect(cardNumberError("4242424242424242")).toBeNull();
  });
});

describe("expiry", () => {
  it("formats MM/YY while typing", () => {
    expect(formatExpiry("1")).toBe("1");
    expect(formatExpiry("12")).toBe("12");
    expect(formatExpiry("122")).toBe("12/2");
    expect(formatExpiry("1228")).toBe("12/28");
    expect(formatExpiry("12/28")).toBe("12/28");
    expect(formatExpiry("12/2899")).toBe("12/28");
    expect(formatExpiry("5")).toBe("05");
    expect(formatExpiry("")).toBe("");
  });
  it("parses only complete, real months", () => {
    expect(parseExpiry("12/28")).toEqual({ month: 12, year: 2028 });
    expect(parseExpiry("01/30")).toEqual({ month: 1, year: 2030 });
    expect(parseExpiry("13/28")).toBeNull();
    expect(parseExpiry("00/28")).toBeNull();
    expect(parseExpiry("12/2")).toBeNull();
    expect(parseExpiry("1228")).toBeNull();
  });
  it("validates against the current month", () => {
    const now = { year: 2026, month: 10 };
    expect(expiryError("10/26", now)).toBeNull(); // amal qilish oyi hali tugamagan
    expect(expiryError("11/26", now)).toBeNull();
    expect(expiryError("01/27", now)).toBeNull();
    expect(expiryError("09/26", now)).toBe("card_expired");
    expect(expiryError("12/25", now)).toBe("card_expired");
    expect(expiryError("13/27", now)).toBe("expiry_invalid");
    expect(expiryError("", now)).toBe("expiry_invalid");
    expect(expiryError("12/", now)).toBe("expiry_invalid");
    expect(expiryError("12/99", now)).toBe("expiry_invalid");
  });
});

describe("otp + demo outcome", () => {
  it("keeps six digits", () => {
    expect(formatOtp("12a3 4567")).toBe("123456");
    expect(formatOtp("")).toBe("");
  });
  it("maps demo codes", () => {
    expect(demoOutcome("111111")).toBe("success");
    expect(demoOutcome("000000")).toBe("declined");
    expect(demoOutcome("999999")).toBe("error");
    expect(demoOutcome("123456")).toBe("otp_invalid");
    expect(demoOutcome("11111")).toBe("otp_invalid");
    expect(demoOutcome("")).toBe("otp_invalid");
  });
});

describe("formatCountdown", () => {
  it("formats M:SS and rounds partial seconds up", () => {
    expect(formatCountdown(30 * 60 * 1000)).toBe("30:00");
    expect(formatCountdown(29 * 60 * 1000 + 45 * 1000)).toBe("29:45");
    expect(formatCountdown(59_001)).toBe("1:00");
    expect(formatCountdown(9000)).toBe("0:09");
    expect(formatCountdown(1)).toBe("0:01");
  });
  it("never goes negative", () => {
    expect(formatCountdown(0)).toBe("0:00");
    expect(formatCountdown(-5000)).toBe("0:00");
  });
});

describe("misc helpers", () => {
  it("builds a 9-digit transaction id", () => {
    expect(newTransactionId(() => 0)).toBe("TX-000000000");
    expect(newTransactionId(() => 0.885203914)).toBe("TX-885203914");
    expect(newTransactionId(() => 0.9999999999999)).toMatch(/^TX-\d{9}$/);
    expect(newTransactionId()).toMatch(/^TX-\d{9}$/);
  });
  it("returns the last four digits", () => {
    expect(lastFour("8600 1234 5678 9012")).toBe("9012");
    expect(lastFour("12")).toBe("12");
  });
  it("formats local date and time", () => {
    const ms = new Date(2026, 9, 12, 14, 38, 5).getTime();
    expect(localIsoDate(ms)).toBe("2026-10-12");
    expect(clockTime(ms)).toBe("14:38");
    expect(clockTime(new Date(2026, 0, 1, 0, 5).getTime())).toBe("00:05");
  });
});
