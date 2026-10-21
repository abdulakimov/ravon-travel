import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getTaxonomy, getTour } from "@/lib/content";
import { openDepartures } from "@/lib/tour-utils";
import type { Tour } from "@/data/types";
import { tr } from "@/lib/l10n";
import { BookingWizard } from "./BookingWizard";
import styles from "./book.module.css";

type Params = Promise<{ locale: string; slug: string }>;

/** Onlayn bron faqat sanasi belgilangan va kamida bitta ochiq sanasi bor turlar uchun. */
const isBookable = (tour: Tour) => tour.fixedDeparture && openDepartures(tour).length > 0;

// So'rov vaqtida render: jo'nab ketgan sanalar taklif qilinmasligi va admin o'zgarishlari darhol ko'rinishi uchun.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params;
  const tour = await getTour(slug);
  if (!tour || !hasLocale(routing.locales, locale)) return { robots: { index: false } };
  const t = await getTranslations({ locale, namespace: "booking" });
  return {
    title: t("meta.title", { tour: tr(tour.title, locale) }),
    robots: { index: false, follow: false },
  };
}

export default async function BookPage({ params }: { params: Params }) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const tour = await getTour(slug);
  if (!tour) notFound();
  // "So'rov bo'yicha" yoki o'rni qolmagan tur — so'rov formasiga
  if (!isBookable(tour)) redirect({ href: `/inquiry/${slug}`, locale });

  const t = await getTranslations("booking");

  return (
    // Boshlang'ich tanlov query'dan o'qiladi (useSearchParams) — shuning uchun Suspense ichida.
    <Suspense
      fallback={
        <div className={styles.page}>
          <section className={styles.head}>
            <div className={styles.headInner}>
              <h1 className={styles.h1}>{t("h1")}</h1>
              <div className={styles.skeletonSteps} aria-hidden="true" />
            </div>
          </section>
          <div className={styles.cols}>
            <div className={styles.skeletonBody} role="status">
              <span className="sr-only">{t("loading")}</span>
            </div>
          </div>
        </div>
      }
    >
      <BookingWizard tour={tour} categoryLabel={tr((await getTaxonomy()).categories[tour.category]?.name, locale)} />
    </Suspense>
  );
}
