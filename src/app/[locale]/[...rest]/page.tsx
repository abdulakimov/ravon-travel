import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

// Til prefiksi ostidagi har qanday noma'lum manzil → lokalizatsiya qilingan 404 ([locale]/not-found.tsx).
type Props = { params: Promise<{ locale: string; rest: string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "notFound" });
  return { title: t("metaTitle"), robots: { index: false } };
}

export default async function CatchAllPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  notFound();
}
