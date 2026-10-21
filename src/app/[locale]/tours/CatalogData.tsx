"use client";

import { createContext, useContext } from "react";
import type { Category, Country, Tour } from "@/data/types";
import type { FilterContext } from "./filters";

// Katalog ma'lumoti serverdan (src/lib/content.ts) keladi va client komponentlarga context orqali uzatiladi.

export interface CatalogData extends FilterContext {
  /** E'lon qilingan turlar, joriy sanaga nisbatan (liveTour), rank tartibida */
  tours: Tour[];
  countries: Record<string, Country>;
  categories: Record<string, Category>;
}

const Ctx = createContext<CatalogData | null>(null);

export function CatalogDataProvider({ value, children }: { value: CatalogData; children: React.ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCatalogData(): CatalogData {
  const v = useContext(Ctx);
  if (!v) throw new Error("CatalogDataProvider missing");
  return v;
}
