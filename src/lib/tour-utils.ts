import type { Departure, Tour } from "@/data/types";

// Turlar ustida sof (ma'lumotsiz) hisob-kitoblar — server va brauzerda bir xil ishlaydi.
// Ma'lumotning o'zi src/lib/content.ts da (server); bu modul uni import QILMAYDI.

/** Narx filtri uchun minimal chegaralar (turlar narxi bundan chiqsa, chegara kengayadi). */
export const PRICE_MIN = 5_000_000;
export const PRICE_MAX = 23_000_000;
export const PRICE_STEP = 500_000;

/** Bugungi sana Toshkent vaqti bo'yicha (YYYY-MM-DD). */
export function todayIso(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tashkent" }).format(now);
}

/**
 * Turning "jonli" ko'rinishi: jo'nab ketgan (bugun yoki undan oldingi) sanalar olib tashlanadi,
 * kartochka narxi va o'rin soni qolgan sanalardan qayta hisoblanadi.
 */
export function liveTour<T extends Tour>(tour: T, today = todayIso()): T {
  if (!tour.fixedDeparture) return tour;
  const departures = tour.departures.filter((d) => d.from > today).sort((a, b) => a.from.localeCompare(b.from));
  const open = departures.filter((d) => d.seatsLeft > 0);
  return {
    ...tour,
    departures,
    seatsLeft: open[0]?.seatsLeft ?? null,
    priceFromUzs: open.length ? Math.min(...open.map((d) => d.priceUzs)) : tour.priceFromUzs,
  };
}

/** Bron qilish mumkin bo'lgan (o'rni bor) sanalar. */
export function openDepartures(tour: Tour, today = todayIso()): Departure[] {
  return tour.departures.filter((d) => d.seatsLeft > 0 && d.from > today);
}

export interface PriceBounds {
  min: number;
  max: number;
}

/** Katalog narx slayderi chegaralari: standart oraliq, turlar narxi undan chiqsa — kengaytiriladi. */
export function priceBounds(tours: Pick<Tour, "priceFromUzs">[]): PriceBounds {
  const prices = tours.map((t) => t.priceFromUzs).filter((p) => Number.isFinite(p) && p > 0);
  if (!prices.length) return { min: PRICE_MIN, max: PRICE_MAX };
  return {
    min: Math.min(PRICE_MIN, Math.floor(Math.min(...prices) / PRICE_STEP) * PRICE_STEP),
    max: Math.max(PRICE_MAX, Math.ceil(Math.max(...prices) / PRICE_STEP) * PRICE_STEP),
  };
}
