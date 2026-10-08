import type { Locale } from "@/i18n/routing";
import { site } from "@/config/site";

const MONTHS: Record<Locale, string[]> = {
  uz: ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"],
  ru: ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
};

const WEEKDAYS: Record<Locale, string[]> = {
  uz: ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"],
  ru: ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"],
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
};

export type Currency = "USD" | "UZS";

/** `$1,375` yoki `17 394 000 so'm` (1000 gacha yaxlitlanadi). */
export function money(usd: number, locale: Locale = "uz", currency: Currency = "USD"): string {
  if (currency !== "UZS") return "$" + Math.round(usd).toLocaleString("en-US");
  const som = Math.round((usd * site.uzsRate) / 1000) * 1000;
  const suffix = locale === "ru" ? " сум" : locale === "en" ? " UZS" : " so'm";
  return som.toLocaleString("ru-RU").replace(/ /g, " ") + suffix;
}

// ISO sana (YYYY-MM-DD) vaqt zonasiga bog'liq bo'lmasligi uchun qo'lda ajratiladi.
function parts(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m, d };
}

/** `12 avgust 2026` / `12 августа 2026` / `12 August 2026` */
export function formatDate(iso: string, locale: Locale = "uz"): string {
  const { y, m, d } = parts(iso);
  return `${d} ${MONTHS[locale][m - 1]} ${y}`;
}

/** Bir oy ichida: `12–17 oktabr 2026`; aks holda `26 noyabr – 1 dekabr 2026`. */
export function formatDateRange(from: string, to: string, locale: Locale = "uz"): string {
  const a = parts(from);
  const b = parts(to);
  if (a.y === b.y && a.m === b.m) return `${a.d}–${b.d} ${MONTHS[locale][a.m - 1]} ${a.y}`;
  if (a.y === b.y) return `${a.d} ${MONTHS[locale][a.m - 1]} – ${b.d} ${MONTHS[locale][b.m - 1]} ${b.y}`;
  return `${formatDate(from, locale)} – ${formatDate(to, locale)}`;
}

export function weekday(iso: string, locale: Locale = "uz"): string {
  const { y, m, d } = parts(iso);
  return WEEKDAYS[locale][new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

/** Bolalar narxi — kattalar narxining 75%. */
export const CHILD_FACTOR = 0.75;

export function bookingTotal(priceUsd: number, adults: number, children: number): number {
  return Math.round(adults * priceUsd + children * priceUsd * CHILD_FACTOR);
}
