import { z } from "zod";

// Admin formalarining server tomonidagi tekshiruvi (brauzerga ishonilmaydi).
// Matnlar uch tilda: o'zbekcha majburiy, ruscha/inglizcha bo'sh bo'lsa saytda o'zbekchasi ko'rsatiladi.

const text = (max: number) => z.string().trim().max(max);

export const l10n = (max: number, required = true) =>
  z.object({
    uz: required ? text(max).min(1, "o'zbekcha matn majburiy") : text(max),
    ru: text(max),
    en: text(max),
  });

/** Sayt ichidagi rasm yo'li: /img/<nom>.jpg yoki yuklangan /media/<id>.jpg */
export const imagePath = z
  .string()
  .trim()
  // Katta-kichik harf farqlanadi: /media yo'nalishi va image-loader faqat kichik harfli nomlarni taniydi
  .regex(/^\/(img\/[\w.-]+\.(jpe?g|png|webp)|media\/\d{8}-[0-9a-f]{8}\.jpg)$/, "rasm yo'li noto'g'ri");

export const slug = z
  .string()
  .trim()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "faqat kichik lotin harflari, raqam va chiziqcha");

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "sana YYYY-MM-DD")
  .refine((v) => {
    const d = new Date(`${v}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
  }, "bunday sana yo'q");
const som = z.number().int().min(0).max(10_000_000_000);

export const departureSchema = z
  .object({
    from: isoDate,
    to: isoDate,
    seatsLeft: z.number().int().min(0).max(999),
    /** Forma ochilgandagi qiymat: o'zgartirilmagan bo'lsa serverdagi joriy (to'lovlar kamaytirgan) qiymat saqlanadi */
    seatsOrig: z.number().int().min(0).max(999).optional(),
    priceUzs: som.min(1, "narx 0 bo'lmasin"),
  })
  .refine((d) => d.to >= d.from, { message: "qaytish sanasi jo'nashdan oldin", path: ["to"] });

export const tourDetailSchema = z.object({
  route: l10n(200),
  groupSize: z.object({ min: z.number().int().min(1).max(500), max: z.number().int().min(1).max(500) }),
  about: z.array(l10n(3000)).max(12),
  gallery: z.array(z.object({ src: imagePath, alt: l10n(200, false) })).max(16),
  itinerary: z
    .array(z.object({ title: l10n(200), text: l10n(3000), tags: z.array(l10n(80)).max(10) }))
    .max(40),
  included: z.array(l10n(300)).max(40),
  excluded: z.array(l10n(300)).max(40),
  notes: z.object({ visa: l10n(1000, false), passport: l10n(1000, false), cancellation: l10n(1000, false) }),
});

export const tourSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]{2,60}$/).optional(),
    slug,
    country: z.string().min(1),
    category: z.string().min(1),
    days: z.number().int().min(1).max(90),
    nights: z.number().int().min(0).max(90),
    priceFromUzs: som,
    fixedDeparture: z.boolean(),
    top: z.boolean(),
    rank: z.number().int().min(1).max(9999),
    image: imagePath,
    title: l10n(160),
    summary: l10n(500),
    published: z.boolean(),
    departures: z.array(departureSchema).max(80),
    detail: tourDetailSchema,
  })
  .superRefine((t, ctx) => {
    const ids = new Set<string>();
    t.departures.forEach((d, i) => {
      if (ids.has(d.from)) ctx.addIssue({ code: "custom", path: ["departures", i, "from"], message: "bu sana takrorlangan" });
      ids.add(d.from);
    });
    if (t.detail.groupSize.min > t.detail.groupSize.max)
      ctx.addIssue({ code: "custom", path: ["detail", "groupSize"], message: "min > max" });
  });
export type TourInput = z.infer<typeof tourSchema>;

export const countrySchema = z.object({
  id: z.string().trim().regex(/^[a-z0-9-]{2,30}$/, "ID: 2–30 ta kichik lotin harfi/raqam"),
  name: l10n(80),
  image: imagePath,
  home: z.boolean(),
});
export const categorySchema = z.object({
  id: z.string().trim().regex(/^[a-z0-9-]{2,30}$/, "ID: 2–30 ta kichik lotin harfi/raqam"),
  name: l10n(80),
});

export const postSchema = z.object({
  originalSlug: z.string().optional(),
  slug,
  date: isoDate,
  readMinutes: z.number().int().min(1).max(120),
  image: imagePath,
  imageAlt: l10n(200, false),
  title: l10n(200),
  excerpt: l10n(500),
  intro: l10n(3000),
  sections: z
    .array(
      z.object({
        id: z.string().trim().regex(/^[a-z0-9-]{1,60}$/, "bo'lim ID: kichik lotin harflari va chiziqcha"),
        heading: l10n(200),
        paragraphs: z.array(l10n(4000)).max(20),
        list: z.array(l10n(400)).max(30).optional(),
      }),
    )
    .max(30),
  published: z.boolean(),
});
export type PostInput = z.infer<typeof postSchema>;

export const faqSchema = z
  .array(
    z.object({
      id: z.string().trim().regex(/^[a-z0-9-]{1,40}$/, "ID: kichik lotin harflari va chiziqcha"),
      question: l10n(300),
      answer: z.array(l10n(3000)).min(1).max(10),
      list: z.array(l10n(400)).max(20).optional(),
      link: z
        .object({ href: z.enum(["/tours", "/contact", "/privacy", "/cancellation"]), label: l10n(80) })
        .optional(),
    }),
  )
  .max(60);

const nullableText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v));
const url = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .refine((v) => v === "" || /^https:\/\/[^\s"'<>]+$/.test(v), "https:// bilan boshlanuvchi havola")
    .transform((v) => (v === "" ? null : v));

export const settingsSchema = z.object({
  legalName: nullableText(200),
  stir: nullableText(20),
  postalAddress: nullableText(300),
  phone: z
    .string()
    .trim()
    .max(24)
    .refine((v) => v === "" || (/^\+?[\d\s()-]{9,20}$/.test(v) && v.replace(/\D/g, "").length >= 9), "telefon: +998 90 123 45 67")
    .transform((v) => (v === "" ? null : v.replace(/[\s()-]/g, ""))),
  email: z.email().max(120),
  bankName: nullableText(200),
  bankAccount: nullableText(40),
  mfo: nullableText(10),
  licenseNo: nullableText(60),
  licenseDate: nullableText(30),
  licenseAuthority: nullableText(200),
  team: z.object({
    director: nullableText(120),
    manager: nullableText(120),
    specialist: nullableText(120),
    accountant: nullableText(120),
  }),
  social: z.object({ telegram: url(200), instagram: url(200), whatsapp: url(200) }),
  mapEmbedUrl: url(1000).refine(
    (v) => v === null || /^https:\/\/(www\.google\.com\/maps\/embed|yandex\.(uz|com)\/map-widget)/.test(v),
    "faqat Google Maps yoki Yandex xarita embed havolasi",
  ),
});
