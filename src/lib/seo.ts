import type { Metadata } from "next";
import { locales } from "@/i18n/routing";
import { site } from "@/config/site";

/** canonical + hreflang (uz/ru/en + x-default) — har bir sahifaning generateMetadata'sida ishlatiladi. */
export function alternates(locale: string, path = ""): NonNullable<Metadata["alternates"]> {
  const clean = path === "/" ? "" : path;
  return {
    canonical: `${site.url}/${locale}${clean}`,
    languages: {
      ...Object.fromEntries(locales.map((l) => [l, `${site.url}/${l}${clean}`])),
      "x-default": `${site.url}/uz${clean}`,
    },
  };
}
