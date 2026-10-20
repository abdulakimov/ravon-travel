import { z } from "zod";
import { getTour } from "@/data/tours";
import { locales } from "@/i18n/routing";
import { bookingTotal } from "@/lib/format";
import { handleLead } from "@/lib/leads";
import { createOrder } from "@/lib/orders";

// Bronni tasdiqlash: 1) serverda to'lov uchun bron yaratiladi (raqam va so'mdagi summa SERVER'da
// belgilanadi — Click shu yozuvga qarab to'lovni qabul qiladi), 2) menejerga xabar ketadi.
// Javob: {ok, bookingId, amountUzs, holdUntil, payToken}.
// Ataylab MINIMAL: pasport raqami va tug'ilgan sana yuborilmaydi (log/webhook'ga tushmasin),
// karta ma'lumoti esa umuman hech qayerga yuborilmaydi.
const text = (max: number) => z.string().trim().max(max);

const schema = z
  .strictObject({
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
    totalUzs: z.number().int().positive().max(10_000_000_000),
  })
  .superRefine((data, ctx) => {
    const departure = getTour(data.slug)?.departures.find((d) => d.id === data.departureId);
    if (!departure) ctx.addIssue({ code: "custom", path: ["departureId"], message: "unknown departure" });
    else if (data.adults + data.children > departure.seatsLeft)
      ctx.addIssue({ code: "custom", path: ["adults"], message: "not enough seats" });
    // Narx mijozga ishonib olinmaydi — tur ma'lumotidan qayta hisoblanadi.
    else if (data.totalUzs !== bookingTotal(departure.priceUzs, data.adults, data.children))
      ctx.addIssue({ code: "custom", path: ["totalUzs"], message: "total mismatch" });
    if (data.travelers.length !== data.adults + data.children)
      ctx.addIssue({ code: "custom", path: ["travelers"], message: "traveller count mismatch" });
  });

export async function POST(req: Request) {
  return handleLead(req, "booking", schema, {
    accept: async (data) => {
      const order = await createOrder({
        tourSlug: data.slug,
        departureId: data.departureId,
        adults: data.adults,
        children: data.children,
        locale: data.locale ?? "uz",
        // superRefine allaqachon tekshirdi: totalUzs === tur ma'lumotidan hisoblangan summa
        amountUzs: data.totalUzs,
      });
      return {
        record: { bookingId: order.id, amountUzs: order.amountUzs },
        // payToken faqat mijozga: to'lov sahifasi havolasida (?k=) ishlatiladi, log va Telegram'ga tushmaydi.
        response: { bookingId: order.id, amountUzs: order.amountUzs, holdUntil: order.holdUntil, payToken: order.payToken },
      };
    },
  });
}
