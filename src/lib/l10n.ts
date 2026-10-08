import type { Locale } from "@/i18n/routing";
import type { L10n } from "@/data/types";

export const tr = (value: L10n, locale: Locale): string => value[locale] ?? value.uz;
