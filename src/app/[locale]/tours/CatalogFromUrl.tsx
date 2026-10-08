"use client";

import { useSearchParams } from "next/navigation";
import { Catalog, ResultCount } from "./Catalog";

/** URL query'ni o'qiydigan yupqa o'ram — sahifada `<Suspense>` ichida turadi. */
export function CatalogFromUrl() {
  const searchParams = useSearchParams();
  return <Catalog query={searchParams.toString()} />;
}

export function ResultCountFromUrl() {
  const searchParams = useSearchParams();
  return <ResultCount query={searchParams.toString()} />;
}
