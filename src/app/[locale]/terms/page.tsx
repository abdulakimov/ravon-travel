import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { legalDocs } from "@/data/legal";
import { tr } from "@/lib/l10n";
import { alternates } from "@/lib/seo";
import { LegalPage } from "@/components/LegalPage";

type Props = { params: Promise<{ locale: string }> };

const doc = legalDocs.terms;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: tr(doc.title, locale as Locale),
    description: tr(doc.description, locale as Locale),
    alternates: alternates(locale, "/terms"),
  };
}

export default async function TermsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <LegalPage doc={doc} locale={locale as Locale} />;
}
