import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { legalDocs } from "@/data/legal";
import { tr } from "@/lib/l10n";
import { alternates } from "@/lib/seo";
import { LegalPage } from "@/components/LegalPage";
import { getSettings } from "@/lib/content";
import { fillLegal } from "@/lib/legal-fill";

type Props = { params: Promise<{ locale: string }> };

const doc = legalDocs.terms;

// Kompaniya nomi/email admin sozlamalaridan — so'rov vaqtida render.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const settings = await getSettings();
  return {
    title: fillLegal(tr(doc.title, locale as Locale), settings),
    description: fillLegal(tr(doc.description, locale as Locale), settings),
    alternates: alternates(locale, "/terms"),
  };
}

export default async function TermsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <LegalPage doc={doc} locale={locale as Locale} />;
}
