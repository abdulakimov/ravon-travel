import type { Locale } from "@/i18n/routing";
import type { L10n } from "@/data/types";

/** Tarjima: tanlangan til bo'sh bo'lsa (admin to'ldirmagan) — o'zbekcha; qiymat yo'q bo'lsa — bo'sh satr. */
export const tr = (value: L10n | undefined, locale: Locale): string => (value ? value[locale] || value.uz || "" : "");
