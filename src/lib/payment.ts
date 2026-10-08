// To'lov formasi uchun sof (framework'siz) yordamchi funksiyalar — unit-test qilinadi.
// DIQQAT: bu yerdagi hech bir funksiya karta ma'lumotini saqlamaydi, log qilmaydi va tarmoqqa yubormaydi.

export type PaymentMethod = "humo" | "visa" | "bank";
export const PAYMENT_METHODS: PaymentMethod[] = ["humo", "visa", "bank"];

export const CARD_DIGITS = 16;
export const OTP_LENGTH = 6;
/** "Kodni qayta yuborish" tugmasi qayta faollashguncha kutish. */
export const RESEND_COOLDOWN_MS = 60 * 1000;
/** SMS kod amal qilish muddati (TZ §6.2 `otp_expired`). */
export const OTP_TTL_MS = 5 * 60 * 1000;

export const onlyDigits = (value: string): string => value.replace(/\D/g, "");

/** `8600123456789012` → `8600 1234 5678 9012` (faqat raqam, ko'pi bilan 16 ta). */
export function formatCardNumber(input: string): string {
  const digits = onlyDigits(input).slice(0, CARD_DIGITS);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

/** Luhn nazorat yig'indisi. Bo'sh yoki raqam bo'lmagan satr — false. */
export function luhnValid(value: string): boolean {
  const digits = onlyDigits(value);
  if (digits.length === 0 || digits.length !== value.replace(/\s/g, "").length) return false;
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = digits.charCodeAt(i) - 48;
    if (double) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    double = !double;
  }
  return sum % 10 === 0;
}

export type CardNumberError = "card_incomplete" | "card_invalid";

export function cardNumberError(value: string): CardNumberError | null {
  const digits = onlyDigits(value);
  if (digits.length < CARD_DIGITS) return "card_incomplete";
  // Bir xil raqamlardan iborat (0000…) raqam Luhn'dan o'tadi, lekin karta emas.
  if (/^(\d)\1+$/.test(digits)) return "card_invalid";
  return luhnValid(digits) ? null : "card_invalid";
}

/** `1228` → `12/28`; oy birinchi raqami 2–9 bo'lsa `0` qo'shiladi (`5` → `05`). */
export function formatExpiry(input: string): string {
  let digits = onlyDigits(input).slice(0, 4);
  if (digits.length === 1 && digits > "1") digits = "0" + digits;
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

export function parseExpiry(value: string): { month: number; year: number } | null {
  const m = /^(\d{2})\/(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const month = Number(m[1]);
  if (month < 1 || month > 12) return null;
  return { month, year: 2000 + Number(m[2]) };
}

export type ExpiryError = "expiry_invalid" | "card_expired";

/** Karta ko'rsatilgan oyning oxirigacha amal qiladi. `now` — joriy yil va oy (1–12). */
export function expiryError(value: string, now: { year: number; month: number }): ExpiryError | null {
  const exp = parseExpiry(value);
  if (!exp) return "expiry_invalid";
  if (exp.year < now.year || (exp.year === now.year && exp.month < now.month)) return "card_expired";
  // 20 yildan uzoq muddat — xato terilgan
  if (exp.year > now.year + 20) return "expiry_invalid";
  return null;
}

export const formatOtp = (input: string): string => onlyDigits(input).slice(0, OTP_LENGTH);

/**
 * DEMO natija qoidalari (haqiqiy shlyuz ulanmaguncha). Sahifadagi demo ogohlantirishida ham shu yozilgan:
 * `111111` → muvaffaqiyat · `000000` → rad etildi (mablag' yetarli emas) ·
 * `999999` → texnik xato (bank bilan aloqa uzildi) · boshqa kod → `otp_invalid`.
 */
export type DemoOutcome = "success" | "declined" | "error" | "otp_invalid";
export const DEMO_CODES = { success: "111111", declined: "000000", error: "999999" } as const;

export function demoOutcome(code: string): DemoOutcome {
  if (code === DEMO_CODES.success) return "success";
  if (code === DEMO_CODES.declined) return "declined";
  if (code === DEMO_CODES.error) return "error";
  return "otp_invalid";
}

/** Qolgan vaqt `M:SS` ko'rinishida (manfiy qiymat → `0:00`). */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

/** `TX-885203914` — 9 xonali; `random` [0,1) oralig'idagi son qaytaradi. */
export function newTransactionId(random: () => number = Math.random): string {
  const n = Math.min(999_999_999, Math.floor(random() * 1_000_000_000));
  return `TX-${String(n).padStart(9, "0")}`;
}

/** Karta raqamining oxirgi 4 raqami (faqat joriy sessiyada ko'rsatish uchun; saqlanmaydi). */
export const lastFour = (value: string): string => onlyDigits(value).slice(-4);

const pad2 = (n: number) => String(n).padStart(2, "0");

/** Epoch ms → mahalliy `YYYY-MM-DD` (format.ts `formatDate` uchun kirish). */
export function localIsoDate(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** Epoch ms → mahalliy `HH:MM`. */
export function clockTime(ms: number): string {
  const d = new Date(ms);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** Demo ogohlantirishida ko'rsatiladigan sinov kartasi (Luhn'dan o'tadi, haqiqiy karta emas). */
export const DEMO_CARD = "8600 1234 5678 9012";
