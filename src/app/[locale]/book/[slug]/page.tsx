import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getTour, openDepartures, tours } from "@/data/tours";
import { tr } from "@/lib/l10n";
import { BookingWizard } from "./BookingWizard";
import styles from "./book.module.css";

type Params = Promise<{ locale: string; slug: string }>;

/** Onlayn bron faqat sanasi belgilangan va kamida bitta ochiq sanasi bor turlar uchun. */
const isBookable = (slug: string) => {
  const tour = getTour(slug);
  return Boolean(tour && tour.fixedDeparture && openDepartures(tour).length > 0);
};

// So'rov vaqtida render: jo'nab ketgan sanalar taklif qilinmasligi uchun (getTour joriy sanani hisobga oladi).
export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return tours.filter((t) => isBookable(t.slug)).map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params;
  const tour = getTour(slug);
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

  const tour = getTour(slug);
  if (!tour) notFound();
  // "So'rov bo'yicha" yoki o'rni qolmagan tur — so'rov formasiga
  if (!isBookable(slug)) redirect({ href: `/inquiry/${slug}`, locale });

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
      <BookingWizard tour={tour} />
    </Suspense>
  );
}
