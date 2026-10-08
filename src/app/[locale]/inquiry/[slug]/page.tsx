import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight, CalendarDays, Clock, Tag } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { categories, getTour, openDepartures, tours } from "@/data/tours";
import { Eyebrow } from "@/components/Brand";
import { Icon } from "@/components/Icon";
import { money } from "@/lib/format";
import { tr } from "@/lib/l10n";
import { InquiryForm } from "./InquiryForm";
import styles from "./inquiry.module.css";

type Params = Promise<{ locale: string; slug: string }>;

// So'rov vaqtida render: kartochkalardagi sana/o'rin/narx joriy kunga mos bo'lishi uchun (liveTour).
export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return tours.map((tour) => ({ slug: tour.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params;
  const tour = getTour(slug);
  if (!tour || !hasLocale(routing.locales, locale)) return { robots: { index: false } };
  const t = await getTranslations({ locale, namespace: "inquiry" });
  const name = tr(tour.title, locale);
  return {
    title: t("meta.title", { tour: name }),
    description: t("meta.description", { tour: name }),
    robots: { index: false, follow: true },
  };
}

export default async function InquiryPage({ params }: { params: Params }) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const tour = getTour(slug);
  if (!tour) notFound();

  const t = await getTranslations("inquiry");
  const tc = await getTranslations("common");
  const title = tr(tour.title, locale);
  const bookable = tour.fixedDeparture && openDepartures(tour).length > 0;

  return (
    <>
      <section className="page-banner">
        <div className="container container--md page-banner__inner">
          <nav className="breadcrumb breadcrumb--light" aria-label={tc("nav.breadcrumb")}>
            <Link href="/">{tc("nav.home")}</Link>
            <span aria-hidden="true">/</span>
            <Link href="/tours">{t("breadcrumb.tours")}</Link>
            <span aria-hidden="true">/</span>
            <Link href={`/tours/${tour.slug}`}>{title}</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{t("breadcrumb.current")}</span>
          </nav>
          <div className={styles.eyebrow}>
            <Eyebrow tone="light">{t("eyebrow")}</Eyebrow>
          </div>
          <h1>{t("h1")}</h1>
          <p>{t("lead")}</p>
        </div>
      </section>

      <div className={`container container--md ${styles.cols}`}>
        <div className={styles.main}>
          <InquiryForm slug={tour.slug} />
        </div>

        <aside className={styles.side} aria-label={t("tour.aria")}>
          <div className={styles.tour}>
            <div className={styles.media}>
              <Image src={tour.image} alt="" fill sizes="(min-width: 960px) 360px, 100vw" className={styles.img} priority />
            </div>
            <div className={styles.tourBody}>
              <span className={styles.cat}>{tr(categories[tour.category].name, locale)}</span>
              <h2 className={styles.tourTitle}>{title}</h2>
              <p className={styles.tourSummary}>{tr(tour.summary, locale)}</p>

              <dl className={styles.facts}>
                <div>
                  <dt>
                    <Icon icon={CalendarDays} size={15} />
                    {t("tour.duration")}
                  </dt>
                  <dd>{t("tour.days", { days: tour.days, nights: tour.nights })}</dd>
                </div>
                <div>
                  <dt>
                    <Icon icon={Tag} size={15} />
                    {t("tour.type")}
                  </dt>
                  <dd>{tour.fixedDeparture ? t("tour.fixed") : t("tour.onRequest")}</dd>
                </div>
                <div>
                  <dt>
                    <Icon icon={Clock} size={15} />
                    {t("tour.hours")}
                  </dt>
                  <dd>{tc("workingHours")}</dd>
                </div>
              </dl>

              <div className={styles.priceRow}>
                <span className={styles.priceLabel}>{t("tour.priceFrom")}</span>
                <span className={styles.price}>{money(tour.priceFromUsd, locale)}</span>
              </div>

              <Link href={`/tours/${tour.slug}`} className="link-arrow">
                {t("tour.details")}
                <Icon icon={ArrowRight} size={16} />
              </Link>
              {bookable && (
                <Link href={`/book/${tour.slug}`} className="btn btn--secondary btn--sm btn--block">
                  {t("tour.book")}
                </Link>
              )}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
