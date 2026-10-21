import type { CategoryId, CountryId, Tour } from "@/data/types";
import { PRICE_STEP, type PriceBounds } from "@/lib/tour-utils";

// Katalog filtri holati URL query'da yashaydi (ulashish / "orqaga" tugmasi / SEO).
//   ?country=az,ge&category=beach&maxPrice=15000000&duration=7-8&fixed=1&sort=price-asc
// O'qishda har bir qiymat oq ro'yxat bo'yicha tekshiriladi — noma'lum qiymat e'tiborsiz qoldiriladi.

export const PAGE_SIZE = 6;
export { PRICE_STEP };

/** Filtr oq ro'yxatlari va narx chegaralari — admin paneldagi ma'lumotdan (server beradi). */
export interface FilterContext {
  countryIds: readonly string[];
  categoryIds: readonly string[];
  price: PriceBounds;
}

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

export function defaultFilters(ctx: FilterContext): Filters {
  return { countries: [], categories: [], maxPrice: ctx.price.max, duration: null, fixedOnly: false, sort: "popular" };
}

/** `a,b,c` → oq ro'yxatdagi, takrorlanmaydigan qiymatlar (ro'yxat tartibida). */
function pickList<T extends string>(raw: string | null, allowed: readonly T[]): T[] {
  if (!raw) return [];
  const wanted = new Set(raw.split(",").map((s) => s.trim().toLowerCase()));
  return allowed.filter((id) => wanted.has(id));
}

export function clampPrice(value: number, ctx: FilterContext): number {
  if (!Number.isFinite(value)) return ctx.price.max;
  const stepped = Math.round(value / PRICE_STEP) * PRICE_STEP;
  return Math.min(ctx.price.max, Math.max(ctx.price.min, stepped));
}

export function parseFilters(query: string, ctx: FilterContext): Filters {
  const sp = new URLSearchParams(query);
  const duration = sp.get("duration")?.replace(" ", "+") ?? null; // `9+` kodlanmagan bo'lsa "+" bo'shliqqa aylanadi
  const sort = sp.get("sort");
  const price = sp.get("maxPrice");
  return {
    countries: pickList(sp.get("country"), ctx.countryIds),
    categories: pickList(sp.get("category"), ctx.categoryIds),
    maxPrice: price && /^\d{1,10}$/.test(price) ? clampPrice(Number(price), ctx) : ctx.price.max,
    duration: (DURATIONS as readonly string[]).includes(duration ?? "") ? (duration as Duration) : null,
    fixedOnly: sp.get("fixed") === "1",
    sort: (SORTS as readonly string[]).includes(sort ?? "") ? (sort as Sort) : "popular",
  };
}

/** Kanonik query (default qiymatlar tushirib qoldiriladi). Qiymatlar oq ro'yxatdan — faqat `+` kodlanadi. */
export function serializeFilters(f: Filters, ctx: FilterContext): string {
  const parts: string[] = [];
  if (f.countries.length) parts.push(`country=${f.countries.join(",")}`);
  if (f.categories.length) parts.push(`category=${f.categories.join(",")}`);
  if (f.maxPrice < ctx.price.max) parts.push(`maxPrice=${f.maxPrice}`);
  if (f.duration) parts.push(`duration=${f.duration.replace("+", "%2B")}`);
  if (f.fixedOnly) parts.push("fixed=1");
  if (f.sort !== "popular") parts.push(`sort=${f.sort}`);
  return parts.join("&");
}

export function matchesFilters(tour: Tour, f: Filters, ctx: FilterContext): boolean {
  if (f.countries.length && !f.countries.includes(tour.country)) return false;
  if (f.categories.length && !f.categories.includes(tour.category)) return false;
  // Default (eng yuqori) qiymatda narx cheklovi yo'q — chegaradan qimmat tur ham ko'rinadi.
  if (f.maxPrice < ctx.price.max && tour.priceFromUzs > f.maxPrice) return false;
  if (f.fixedOnly && !tour.fixedDeparture) return false;
  if (f.duration === "5-6" && !(tour.days >= 5 && tour.days <= 6)) return false;
  if (f.duration === "7-8" && !(tour.days >= 7 && tour.days <= 8)) return false;
  if (f.duration === "9+" && tour.days < 9) return false;
  return true;
}

export function applyFilters(all: Tour[], f: Filters, ctx: FilterContext): Tour[] {
  return all
    .filter((t) => matchesFilters(t, f, ctx))
    .sort((a, b) => {
      if (f.sort === "price-asc") return a.priceFromUzs - b.priceFromUzs || a.rank - b.rank;
      if (f.sort === "price-desc") return b.priceFromUzs - a.priceFromUzs || a.rank - b.rank;
      if (f.sort === "days-asc") return a.days - b.days || a.rank - b.rank;
      return a.rank - b.rank;
    });
}

export function hasActiveFilters(f: Filters, ctx: FilterContext): boolean {
  return (
    f.countries.length > 0 || f.categories.length > 0 || f.maxPrice < ctx.price.max || f.duration !== null || f.fixedOnly
  );
}
