import { z } from "zod";
import { getTour } from "@/data/tours";
import { locales } from "@/i18n/routing";
import { BOOKING_ID_RE } from "@/lib/booking-constants";
import { handleLead } from "@/lib/leads";

// Bron tasdiqlanganda menejerga bildirishnoma. Backend yo'qligi sababli bron o'zi brauzerda
// saqlanadi; bu endpoint faqat "menejer bog'lanadi" va'dasi bajarilishi uchun xabar yetkazadi.
// Ataylab MINIMAL: pasport raqami va tug'ilgan sana yuborilmaydi (log/webhook'ga tushmasin),
// karta ma'lumoti esa umuman hech qayerga yuborilmaydi.
const text = (max: number) => z.string().trim().max(max);

const schema = z
  .strictObject({
    bookingId: z.string().regex(BOOKING_ID_RE),
    slug: text(80),
    departureId: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    locale: z.enum(locales).optional(),
    adults: z.number().int().min(1).max(30),
    children: z.number().int().min(0).max(6),
    travelers: z.array(text(120).min(1)).min(1).max(36),
    phone: text(24)
      .regex(/^[+\d\s()-]+$/)
      .refine((value) => value.replace(/\D/g, "").length >= 9, "at least 9 digits"),
    email: z.union([z.literal(""), z.email().max(120)]).default(""),
    note: text(1000).default(""),
    totalUsd: z.number().int().positive().max(1_000_000),
  })
  .superRefine((data, ctx) => {
    const departure = getTour(data.slug)?.departures.find((d) => d.id === data.departureId);
    if (!departure) ctx.addIssue({ code: "custom", path: ["departureId"], message: "unknown departure" });
    else if (data.adults + data.children > departure.seatsLeft)
      ctx.addIssue({ code: "custom", path: ["adults"], message: "not enough seats" });
    if (data.travelers.length !== data.adults + data.children)
      ctx.addIssue({ code: "custom", path: ["travelers"], message: "traveller count mismatch" });
  });

export async function POST(req: Request) {
  return handleLead(req, "booking", schema);
}
