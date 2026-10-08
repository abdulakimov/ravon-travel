// Bron formasi uchun sof (framework'siz) validatorlar — unit-test qilinadi.
// Har bir validator xato KODI qaytaradi (yoki null); matn `messages/*/booking.json → errors` da.

export const MAX_ADULTS = 8;
export const MAX_CHILDREN = 6;
export const ADULT_MIN_AGE = 12;
export const CHILD_MIN_AGE = 2;
export const CHILD_MAX_AGE = 11;
export const NAME_MAX = 40;
export const NOTE_MAX = 500;

export type TravelerKind = "adult" | "child";

// ── Ism / familiya ─────────────────────────────────────────────────────────
const NAME_RE = /^[A-Z]+(?:[ '-][A-Z]+)*$/;

/** Pasportdagi kabi: bosh harflar, apostrof variantlari bitta `'` ga keltiriladi. */
export function normalizeName(input: string): string {
  return input
    .replace(/[‘’ʻʼ`]/g, "'")
    .replace(/\s+/g, " ")
    .toUpperCase()
    .slice(0, NAME_MAX);
}

export type NameError = "required" | "latin";

export function nameError(value: string): NameError | null {
  const v = value.trim();
  if (!v) return "required";
  return NAME_RE.test(v.toUpperCase()) ? null : "latin";
}

// ── Pasport ────────────────────────────────────────────────────────────────
const PASSPORT_RE = /^[A-Z]{2}\d{7}$/;

/** `ab 1234567` → `AB1234567` (faqat lotin harfi va raqam, 9 belgi). */
export function normalizePassport(input: string): string {
  return input
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 9);
}

export type PassportError = "required" | "format";

export function passportError(value: string): PassportError | null {
  const v = value.trim();
  if (!v) return "required";
  return PASSPORT_RE.test(v) ? null : "format";
}

// ── Sana va yosh ───────────────────────────────────────────────────────────
// ISO satr (YYYY-MM-DD) qo'lda ajratiladi — vaqt zonasi ta'sir qilmaydi.
function isoParts(iso: string): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  if (m < 1 || m > 12 || d < 1) return null;
  const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  const daysInMonth = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];
  return d <= daysInMonth ? { y, m, d } : null;
}

export const isValidIsoDate = (iso: string): boolean => isoParts(iso) !== null;

/** `on` sanasida to'liq yosh; sanalardan biri noto'g'ri bo'lsa — null. */
export function ageOn(birthIso: string, onIso: string): number | null {
  const b = isoParts(birthIso);
  const o = isoParts(onIso);
  if (!b || !o) return null;
  const hadBirthday = o.m > b.m || (o.m === b.m && o.d >= b.d);
  return o.y - b.y - (hadBirthday ? 0 : 1);
}

export type BirthDateError = "required" | "invalid" | "future" | "adultAge" | "childAge";

/**
 * Tug'ilgan sana bugundan oldin bo'lishi va jo'nash kunidagi yosh toifaga mos kelishi kerak:
 * kattalar 12+, bolalar 2–11.
 */
export function birthDateError(
  birthIso: string,
  kind: TravelerKind,
  departureIso: string,
  todayIso: string,
): BirthDateError | null {
  if (!birthIso) return "required";
  if (!isValidIsoDate(birthIso)) return "invalid";
  if (birthIso >= todayIso) return "future";
  const age = ageOn(birthIso, departureIso);
  if (age === null || age > 120) return "invalid";
  if (kind === "adult") return age >= ADULT_MIN_AGE ? null : "adultAge";
  return age >= CHILD_MIN_AGE && age <= CHILD_MAX_AGE ? null : "childAge";
}

// ── Telefon (+998 __ ___ __ __) ────────────────────────────────────────────
/** Mamlakat kodisiz 9 ta raqam (`901234567`). */
export function uzPhoneDigits(input: string): string {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("998") && (input.trim().startsWith("+") || digits.length > 9)) digits = digits.slice(3);
  return digits.slice(0, 9);
}

/** Terilayotgan qiymatni `+998 90 123 45 67` niqobiga keltiradi; raqam yo'q bo'lsa — bo'sh satr. */
export function formatUzPhone(input: string): string {
  const d = uzPhoneDigits(input);
  if (!d) return "";
  const groups = [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean);
  return `+998 ${groups.join(" ")}`;
}

export type PhoneError = "required" | "format";

export function phoneError(value: string): PhoneError | null {
  const d = uzPhoneDigits(value);
  if (!d) return "required";
  return d.length === 9 ? null : "format";
}

// ── Email ──────────────────────────────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;

export type EmailError = "required" | "format";

export function emailError(value: string, required = true): EmailError | null {
  const v = value.trim();
  if (!v) return required ? "required" : null;
  return v.length <= 120 && EMAIL_RE.test(v) ? null : "format";
}

// ── Kishilar soni ──────────────────────────────────────────────────────────
/** Query'dagi sonni xavfsiz o'qiydi: butun son bo'lmasa — `fallback`. */
export function parseCount(raw: string | null | undefined, fallback: number): number {
  if (raw == null || !/^\d{1,3}$/.test(raw.trim())) return fallback;
  return Number(raw.trim());
}

/**
 * Kattalar 1..8, bolalar 0..6, jami ≤ seatsLeft. Ortiqchasi avval bolalardan, keyin kattalardan olinadi.
 * (seatsLeft < 1 bo'lsa ham kamida 1 kattalar qoladi — bunday sana tanlanmaydi.)
 */
export function clampParty(adults: number, children: number, seatsLeft: number): { adults: number; children: number } {
  const int = (n: number) => (Number.isFinite(n) ? Math.trunc(n) : 0);
  let a = Math.min(MAX_ADULTS, Math.max(1, int(adults)));
  let c = Math.min(MAX_CHILDREN, Math.max(0, int(children)));
  const seats = Math.max(1, int(seatsLeft));
  if (a + c > seats) c = Math.max(0, seats - a);
  if (a + c > seats) a = seats;
  return { adults: a, children: c };
}
