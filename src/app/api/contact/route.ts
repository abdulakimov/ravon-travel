import { z } from "zod";
import { handleLead } from "@/lib/leads";
import { locales } from "@/i18n/routing";
import { CONTACT_LIMITS as L, CONTACT_SUBJECTS } from "@/app/[locale]/contact/subjects";

// Qat'iy sxema: noma'lum maydon rad etiladi (honeypot `website` ni handleLead oldindan ajratib oladi).
const schema = z.strictObject({
  name: z.string().trim().min(1).max(L.name),
  phone: z
    .string()
    .trim()
    .max(L.phone)
    .refine((v) => v.replace(/\D/g, "").length >= L.phoneMinDigits),
  email: z
    .string()
    .trim()
    .max(L.email)
    .pipe(z.union([z.literal(""), z.email()]))
    .optional(),
  subject: z.enum(CONTACT_SUBJECTS),
  message: z.string().trim().min(L.messageMin).max(L.message),
  consent: z.literal(true),
  // Menejer qaysi tilda javob berishini bilishi uchun
  locale: z.enum(locales).optional(),
});

export async function POST(req: Request) {
  return handleLead(req, "contact", schema);
}
