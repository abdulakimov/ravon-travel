import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

// Har bir sahifa guruhi o'z namespace fayliga ega: messages/<locale>/<namespace>.json
export const namespaces = [
  "common",
  "home",
  "catalog",
  "tour",
  "booking",
  "payment",
  "about",
  "contact",
  "inquiry",
  "destinations",
  "blog",
  "faq",
  "legal",
  "notFound",
] as const;

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  const entries = await Promise.all(
    namespaces.map(async (ns) => [ns, (await import(`../../messages/${locale}/${ns}.json`)).default] as const),
  );

  return { locale, messages: Object.fromEntries(entries) };
});
