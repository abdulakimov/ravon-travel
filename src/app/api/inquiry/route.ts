import { z } from "zod";
import { liveToursByRank } from "@/lib/content";
import { locales } from "@/i18n/routing";
import { handleLead } from "@/lib/leads";

// "So'rov bo'yicha" turlar formasi (TZ §6.3). Origin tekshiruvi, rate limit, hajm cheklovi va
// honeypot (`website`) — handleLead ichida. Bu yerda faqat qat'iy sxema.
const text = (max: number) => z.string().trim().max(max);

const makeSchema = (slugs: Set<string>) => z.strictObject({
  slug: text(80).refine((slug) => slugs.has(slug), "unknown tour"),
  locale: z.enum(locales).optional(),
  name: text(80).min(2),
  phone: text(24)
    .regex(/^[+\d\s()-]+$/)
    .refine((value) => value.replace(/\D/g, "").length >= 9, "at least 9 digits"),
  email: z.union([z.literal(""), z.email().max(120)]).default(""),
  date: text(60).default(""),
  travelers: z.number().int().min(1).max(50).default(1),
  budget: text(60).default(""),
  comment: text(1000).default(""),
  consent: z.literal(true),
});

export async function POST(req: Request) {
  const slugs = new Set((await liveToursByRank()).map((t) => t.slug));
  return handleLead(req, "inquiry", makeSchema(slugs));
}
