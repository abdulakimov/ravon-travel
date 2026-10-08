import type { CategoryId, CountryId, Tour } from "@/data/types";
import { PRICE_MAX, PRICE_MIN, categoryIds, countryIds } from "@/data/tours";

// Katalog filtri holati URL query'da yashaydi (ulashish / "orqaga" tugmasi / SEO).
//   ?country=az,ge&category=beach&maxPrice=1200&duration=7-8&fixed=1&sort=price-asc
// O'qishda har bir qiymat oq ro'yxat bo'yicha tekshiriladi — noma'lum qiymat e'tiborsiz qoldiriladi.

export const PAGE_SIZE = 6;
export const PRICE_STEP = 50;

export const DURATIONS = ["5-6", "7-8", "9+"] as const;
export type Duration = (typeof DURATIONS)[number];

export const SORTS = ["popular", "price-asc", "price-desc", "days-asc"] as const;
export type Sort = (typeof SORTS)[number];

export interface Filters {
  countries: CountryId[];
  categories: CategoryId[];
  maxPrice: number;
  duration: Duration | null;
  fixedOnly: boolean;
  sort: Sort;
}

export const DEFAULT_FILTERS: Filters = {
  countries: [],
  categories: [],
  maxPrice: PRICE_MAX,
  duration: null,
  fixedOnly: false,
  sort: "popular",
};

/** `a,b,c` → oq ro'yxatdagi, takrorlanmaydigan qiymatlar (ro'yxat tartibida). */
function pickList<T extends string>(raw: string | null, allowed: readonly T[]): T[] {
  if (!raw) return [];
  const wanted = new Set(raw.split(",").map((s) => s.trim().toLowerCase()));
  return allowed.filter((id) => wanted.has(id));
}

export function clampPrice(value: number): number {
  if (!Number.isFinite(value)) return PRICE_MAX;
  const stepped = Math.round(value / PRICE_STEP) * PRICE_STEP;
  return Math.min(PRICE_MAX, Math.max(PRICE_MIN, stepped));
}

export function parseFilters(query: string): Filters {
  const sp = new URLSearchParams(query);
  const duration = sp.get("duration")?.replace(" ", "+") ?? null; // `9+` kodlanmagan bo'lsa "+" bo'shliqqa aylanadi
  const sort = sp.get("sort");
  const price = sp.get("maxPrice");
  return {
    countries: pickList(sp.get("country"), countryIds),
    categories: pickList(sp.get("category"), categoryIds),
    maxPrice: price && /^\d{1,6}$/.test(price) ? clampPrice(Number(price)) : PRICE_MAX,
    duration: (DURATIONS as readonly string[]).includes(duration ?? "") ? (duration as Duration) : null,
    fixedOnly: sp.get("fixed") === "1",
    sort: (SORTS as readonly string[]).includes(sort ?? "") ? (sort as Sort) : "popular",
  };
}

/** Kanonik query (default qiymatlar tushirib qoldiriladi). Qiymatlar oq ro'yxatdan — faqat `+` kodlanadi. */
export function serializeFilters(f: Filters): string {
  const parts: string[] = [];
  if (f.countries.length) parts.push(`country=${f.countries.join(",")}`);
  if (f.categories.length) parts.push(`category=${f.categories.join(",")}`);
  if (f.maxPrice < PRICE_MAX) parts.push(`maxPrice=${f.maxPrice}`);
  if (f.duration) parts.push(`duration=${f.duration.replace("+", "%2B")}`);
  if (f.fixedOnly) parts.push("fixed=1");
  if (f.sort !== "popular") parts.push(`sort=${f.sort}`);
  return parts.join("&");
}

export function matchesFilters(tour: Tour, f: Filters): boolean {
  if (f.countries.length && !f.countries.includes(tour.country)) return false;
  if (f.categories.length && !f.categories.includes(tour.category)) return false;
  if (tour.priceFromUsd > f.maxPrice) return false;
  if (f.fixedOnly && !tour.fixedDeparture) return false;
  if (f.duration === "5-6" && !(tour.days >= 5 && tour.days <= 6)) return false;
  if (f.duration === "7-8" && !(tour.days >= 7 && tour.days <= 8)) return false;
  if (f.duration === "9+" && tour.days < 9) return false;
  return true;
}

export function applyFilters(all: Tour[], f: Filters): Tour[] {
  return all
    .filter((t) => matchesFilters(t, f))
    .sort((a, b) => {
      if (f.sort === "price-asc") return a.priceFromUsd - b.priceFromUsd || a.rank - b.rank;
      if (f.sort === "price-desc") return b.priceFromUsd - a.priceFromUsd || a.rank - b.rank;
      if (f.sort === "days-asc") return a.days - b.days || a.rank - b.rank;
      return a.rank - b.rank;
    });
}

export function hasActiveFilters(f: Filters): boolean {
  return (
    f.countries.length > 0 || f.categories.length > 0 || f.maxPrice < PRICE_MAX || f.duration !== null || f.fixedOnly
  );
}
