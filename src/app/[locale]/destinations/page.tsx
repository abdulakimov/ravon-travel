import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight, ChevronRight, Headset } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { countryIds } from "@/data/tours";
import { alternates } from "@/lib/seo";
import { Icon } from "@/components/Icon";
import { Reveal } from "@/components/Reveal";
import { DestinationCard } from "./_components/DestinationCard";
import styles from "./destinations.module.css";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "destinations.meta" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: alternates(locale, "/destinations"),
  };
}

export default async function DestinationsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("destinations");
  const tc = await getTranslations("common");

  return (
    <>
      <section className="page-banner">
        <div className="container page-banner__inner">
          <nav className="breadcrumb breadcrumb--light" aria-label={tc("nav.breadcrumb")}>
            <Link href="/">{tc("nav.home")}</Link>
            <Icon icon={ChevronRight} size={13} strokeWidth={2} />
            <span aria-current="page">{t("banner.title")}</span>
          </nav>
          <h1>{t("banner.title")}</h1>
          <p>{t("banner.text", { count: countryIds.length })}</p>
        </div>
      </section>

      <section className="section section--inner">
        <div className="container">
          <ul className={styles.grid} aria-label={t("listLabel")}>
            {countryIds.map((id) => (
              <Reveal as="li" key={id}>
                <DestinationCard country={id} sizes="(min-width: 1000px) 400px, (min-width: 660px) 50vw, 100vw" />
              </Reveal>
            ))}
          </ul>

          <Reveal className={styles.cta}>
            <div className={styles.ctaText}>
              <h2 className={styles.ctaTitle}>{t("cta.title")}</h2>
              <p className={styles.ctaLead}>{t("cta.text")}</p>
            </div>
            <div className={styles.ctaActions}>
              <Link href="/contact" className="btn btn--primary">
                <Icon icon={Headset} size={17} />
                {tc("actions.consult")}
              </Link>
              <Link href="/tours" className="btn btn--secondary">
                {t("cta.all")}
                <Icon icon={ArrowRight} size={16} />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
