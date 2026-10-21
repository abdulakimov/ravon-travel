import type { MetadataRoute } from "next";
import { locales } from "@/i18n/routing";
import { site } from "@/config/site";
import { getPosts, liveToursByRank } from "@/lib/content";

// Har bir ommaviy sahifa × 3 til, hreflang muqobillari bilan (TZ §8.4).
// Bron/to'lov/so'rov oqimlari indekslanmaydi (robots.ts).
const STATIC_PATHS = [
  "",
  "/tours",
  "/destinations",
  "/blog",
  "/about",
  "/contact",
  "/faq",
  "/terms",
  "/privacy",
  "/cancellation",
] as const;

type Entry = MetadataRoute.Sitemap[number];

function entries(path: string, extra: Pick<Entry, "changeFrequency" | "priority" | "lastModified">): Entry[] {
  const languages = {
    ...Object.fromEntries(locales.map((l) => [l, `${site.url}/${l}${path}`])),
    "x-default": `${site.url}/uz${path}`,
  };
  return locales.map((locale) => ({
    url: `${site.url}/${locale}${path}`,
    alternates: { languages },
    ...extra,
  }));
}

// Turlar va maqolalar admin paneldan qo'shiladi — sitemap har so'rovda yangidan quriladi.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [tours, posts] = await Promise.all([liveToursByRank(), getPosts()]);
  return [
    ...STATIC_PATHS.flatMap((path) =>
      entries(path, {
        changeFrequency: path === "" || path === "/tours" ? "weekly" : "monthly",
        priority: path === "" ? 1 : path === "/tours" ? 0.9 : 0.6,
      }),
    ),
    ...tours.flatMap((tour) => entries(`/tours/${tour.slug}`, { changeFrequency: "weekly", priority: 0.8 })),
    ...posts.flatMap((post) =>
      entries(`/blog/${post.slug}`, { changeFrequency: "monthly", priority: 0.5, lastModified: post.date }),
    ),
  ];
}
