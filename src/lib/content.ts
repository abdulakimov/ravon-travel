import { join } from "node:path";
import { site } from "@/config/site";
import { categories as seedCategories, countries as seedCountries, tours as seedTours } from "@/data/tours";
import { tourDetails as seedDetails } from "@/data/tour-details";
import { posts as seedPosts, type BlogPost } from "@/data/blog";
import { faq as seedFaq, type FaqItem } from "@/data/faq";
import type { Category, Country, Tour, TourDetail } from "@/data/types";
import { CONTENT_DIR, readJson, withDataLock, writeJson } from "./fsdb";
import { liveTour, todayIso } from "./tour-utils";

// Sayt kontentining YAGONA manbai (server). Admin panel shu yerga yozadi, sayt shu yerdan o'qiydi.
// Fayllar: /data/content/{tours,taxonomy,posts,faq,settings}.json. Fayl hali yo'q bo'lsa — src/data/*
// dagi statik ma'lumot boshlang'ich nusxa (seed) sifatida ishlatiladi; birinchi admin saqlashida faylga yoziladi.
// DIQQAT: @/data/{tours,tour-details,blog,faq} ni FAQAT shu modul import qiladi (test bilan tekshiriladi).
// Qaytarilgan obyektlar kesh bilan umumiy — o'zgartirmang (admin funksiyalari structuredClone qiladi).

export type { BlogPost, FaqItem };

export interface TourRecord extends Tour {
  /** false → saytda ko'rinmaydi (qoralama yoki yashirilgan) */
  published: boolean;
  detail: TourDetail | null;
  updatedAt?: string;
}
export interface PostRecord extends BlogPost {
  published: boolean;
  updatedAt?: string;
}
export interface CountryRecord extends Country {
  id: string;
}
export interface CategoryRecord extends Category {
  id: string;
}
export interface Taxonomy {
  countries: CountryRecord[];
  categories: CategoryRecord[];
}

/** Admin paneldan tahrirlanadigan kompaniya ma'lumotlari. `null` → saytda "Rasmiylashtirilmoqda" / yashiriladi. */
export interface Settings {
  legalName: string | null;
  stir: string | null;
  postalAddress: string | null;
  phone: string | null;
  email: string;
  bankName: string | null;
  bankAccount: string | null;
  mfo: string | null;
  licenseNo: string | null;
  licenseDate: string | null;
  licenseAuthority: string | null;
  team: { director: string | null; manager: string | null; specialist: string | null; accountant: string | null };
  social: { telegram: string | null; instagram: string | null; whatsapp: string | null };
  mapEmbedUrl: string | null;
}

interface Docs {
  tours: { tours: TourRecord[] };
  taxonomy: Taxonomy;
  posts: { posts: PostRecord[] };
  faq: { items: FaqItem[] };
  settings: Settings;
}
type DocName = keyof Docs;

const SEED: { [K in DocName]: () => Docs[K] } = {
  tours: () => ({
    tours: seedTours.map((t) => ({ ...t, published: true, detail: seedDetails[t.id] ?? null })),
  }),
  taxonomy: () => ({
    countries: Object.entries(seedCountries).map(([id, c]) => ({ id, ...c })),
    categories: Object.entries(seedCategories).map(([id, c]) => ({ id, ...c })),
  }),
  posts: () => ({ posts: seedPosts.map((p) => ({ ...p, published: true })) }),
  faq: () => ({ items: seedFaq }),
  settings: () => ({
    legalName: site.legalName,
    stir: site.stir,
    postalAddress: site.postalAddress,
    phone: site.phone,
    email: site.email,
    bankName: site.bankName,
    bankAccount: site.bankAccount,
    mfo: site.mfo,
    licenseNo: site.licenseNo,
    licenseDate: site.licenseDate,
    licenseAuthority: site.licenseAuthority,
    team: { ...site.team },
    social: { ...site.social },
    mapEmbedUrl: site.mapEmbedUrl,
  }),
};

const g = globalThis as typeof globalThis & { __ravonSeedCache?: Map<string, unknown> };
const seedCache = (g.__ravonSeedCache ??= new Map());
const fileOf = (name: DocName) => join(CONTENT_DIR, `${name}.json`);

async function readDoc<K extends DocName>(name: K): Promise<Docs[K]> {
  try {
    const doc = await readJson<Docs[K]>(fileOf(name));
    if (doc !== undefined) return doc;
  } catch (err) {
    // Buzilgan fayl saytni yiqitmasin: seed ko'rsatiladi, log baland ovozda xabar beradi.
    console.error(JSON.stringify({ event: "content_read_failed", doc: name, error: String(err) }));
  }
  if (!seedCache.has(name)) seedCache.set(name, SEED[name]());
  return seedCache.get(name) as Docs[K];
}

/**
 * Admin uchun: hujjatni navbat ichida o'qiydi, nusxasini `mutate` ga beradi va atomar yozadi.
 * `mutate` xato tashlasa — hech narsa yozilmaydi.
 */
export function updateDoc<K extends DocName, R = void>(name: K, mutate: (doc: Docs[K]) => R | Promise<R>): Promise<R> {
  return withDataLock(async () => {
    const draft = structuredClone(await readDoc(name));
    const result = await mutate(draft);
    await writeJson(fileOf(name), draft);
    return result;
  });
}

/** Admin uchun: hujjatning tahrirlanadigan nusxasi. */
export async function readDocCopy<K extends DocName>(name: K): Promise<Docs[K]> {
  return structuredClone(await readDoc(name));
}

// ── Taksonomiya ───────────────────────────────────────────────────────────

export async function getTaxonomy() {
  const doc = await readDoc("taxonomy");
  return {
    countries: Object.fromEntries(doc.countries.map(({ id, ...c }) => [id, c])) as Record<string, Country>,
    countryIds: doc.countries.map((c) => c.id),
    categories: Object.fromEntries(doc.categories.map(({ id, ...c }) => [id, c])) as Record<string, Category>,
    categoryIds: doc.categories.map((c) => c.id),
  };
}
export type TaxonomyView = Awaited<ReturnType<typeof getTaxonomy>>;

// ── Turlar ────────────────────────────────────────────────────────────────

/** Admin yozuvidan saytga ko'rinadigan tur (published/detail/updatedAt'siz). */
export function publicTour(rec: TourRecord): Tour {
  const tour: Partial<TourRecord> = { ...rec };
  delete tour.published;
  delete tour.detail;
  delete tour.updatedAt;
  return tour as Tour;
}
const stripRecord = publicTour;

/** Barcha turlar (admin), rank bo'yicha. */
export async function getTourRecords(): Promise<TourRecord[]> {
  const doc = await readDoc("tours");
  return [...doc.tours].sort((a, b) => a.rank - b.rank);
}

async function publishedTours(): Promise<Tour[]> {
  return (await getTourRecords()).filter((t) => t.published).map(stripRecord);
}

/** Ro'yxatlar (bosh sahifa, katalog) uchun: e'lon qilingan turlar joriy sanaga nisbatan. */
export async function liveToursByRank(today = todayIso()): Promise<Tour[]> {
  return (await publishedTours()).map((t) => liveTour(t, today));
}

/** Slug bo'yicha e'lon qilingan tur — joriy sanaga nisbatan (o'tgan sanalarsiz). */
export async function getTour(slug: string, today = todayIso()): Promise<Tour | undefined> {
  const tour = (await publishedTours()).find((t) => t.slug === slug);
  return tour && liveTour(tour, today);
}

/**
 * Slug bo'yicha tur — e'lon qilinmagan bo'lsa ham, o'tgan sanalari bilan.
 * Mavjud bronlar uchun (to'lov sahifasi, chek tekshiruvi): tur keyin yashirilsa ham chek ochilishi kerak.
 */
export async function getTourAnyState(slug: string): Promise<Tour | undefined> {
  const rec = (await getTourRecords()).find((t) => t.slug === slug);
  return rec && stripRecord(rec);
}

export async function getTourDetail(tourId: string): Promise<TourDetail | undefined> {
  return (await getTourRecords()).find((t) => t.id === tourId)?.detail ?? undefined;
}

export async function toursInCountry(country: string): Promise<Tour[]> {
  return (await publishedTours()).filter((t) => t.country === country);
}

export async function similarTours(tour: Tour, limit = 3): Promise<Tour[]> {
  const score = (t: Tour) => (t.category === tour.category ? 2 : 0) + (t.country === tour.country ? 1 : 0);
  return (await liveToursByRank())
    .filter((t) => t.id !== tour.id)
    .sort((a, b) => score(b) - score(a) || a.rank - b.rank)
    .slice(0, limit);
}

// ── Blog ──────────────────────────────────────────────────────────────────

/** E'lon qilingan maqolalar, yangisi birinchi. */
export async function getPosts(): Promise<BlogPost[]> {
  const doc = await readDoc("posts");
  return doc.posts
    .filter((p) => p.published)
    .map((rec) => {
      const post: Partial<PostRecord> = { ...rec };
      delete post.published;
      delete post.updatedAt;
      return post as BlogPost;
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function getPost(slug: string): Promise<BlogPost | undefined> {
  return (await getPosts()).find((p) => p.slug === slug);
}

export async function otherPosts(slug: string, limit = 2): Promise<BlogPost[]> {
  return (await getPosts()).filter((p) => p.slug !== slug).slice(0, limit);
}

export async function getPostRecords(): Promise<PostRecord[]> {
  const doc = await readDoc("posts");
  return [...doc.posts].sort((a, b) => b.date.localeCompare(a.date));
}

// ── FAQ va sozlamalar ─────────────────────────────────────────────────────

export async function getFaq(): Promise<FaqItem[]> {
  return (await readDoc("faq")).items;
}

export async function getSettings(): Promise<Settings> {
  return readDoc("settings");
}
