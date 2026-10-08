import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { MessageCircle } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { faq } from "@/data/faq";
import { tr } from "@/lib/l10n";
import { alternates } from "@/lib/seo";
import { Icon } from "@/components/Icon";
import { Reveal } from "@/components/Reveal";
import { FaqAccordion, type FaqEntry } from "./FaqAccordion";
import styles from "./faq.module.css";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "faq.meta" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: alternates(locale, "/faq"),
  };
}

export default async function FaqPage({ params }: Props) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);
  const t = await getTranslations("faq");
  const tc = await getTranslations("common");

  const items: FaqEntry[] = faq.map((item) => ({
    id: item.id,
    question: tr(item.question, locale),
    paragraphs: item.answer.map((text) => tr(text, locale)),
    list: item.list?.map((text) => tr(text, locale)),
    link: item.link && { href: item.link.href, label: tr(item.link.label, locale) },
  }));

  // schema.org FAQPage (TZ §8.4). `<` qochiriladi — JSON ichidan </script> chiqib ketmasin.
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: locale,
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: [...item.paragraphs, ...(item.list ?? [])].join(" ") },
    })),
  }).replace(/</g, "\\u003c");

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />

      <section className="page-banner">
        <div className="container container--md page-banner__inner">
          <nav className="breadcrumb breadcrumb--light" aria-label={tc("nav.breadcrumb")}>
            <Link href="/">{tc("nav.home")}</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{t("meta.title")}</span>
          </nav>
          <h1>{t("banner.title")}</h1>
          <p>{t("banner.lead")}</p>
        </div>
      </section>

      <div className={`container container--text ${styles.wrap}`}>
        <FaqAccordion items={items} />

        <Reveal className={styles.cta}>
          <div>
            <h2>{t("cta.title")}</h2>
            <p>{t("cta.text")}</p>
          </div>
          <Link href="/contact" className="btn btn--primary">
            <Icon icon={MessageCircle} size={17} />
            <span>{t("cta.button")}</span>
          </Link>
        </Reveal>
      </div>
    </>
  );
}
