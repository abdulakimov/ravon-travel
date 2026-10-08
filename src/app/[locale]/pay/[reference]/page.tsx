import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { BOOKING_ID_RE } from "@/lib/booking-constants";
import { PaymentFlow } from "./PaymentFlow";

type Params = Promise<{ locale: string; reference: string }>;


export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return { robots: { index: false } };
  const t = await getTranslations({ locale, namespace: "payment" });
  return { title: t("meta.title"), robots: { index: false, follow: false } };
}

export default async function PayPage({ params }: { params: Params }) {
  const { locale, reference } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  if (!BOOKING_ID_RE.test(reference)) notFound();
  setRequestLocale(locale);

  // Bron brauzerda (sessionStorage) saqlanadi — shuning uchun yuklash client komponentda.
  return <PaymentFlow reference={reference} />;
}
