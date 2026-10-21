import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { site } from "@/config/site";
import { alternates } from "@/lib/seo";
import { ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Icon } from "@/components/Icon";
import { getTaxonomy, liveToursByRank } from "@/lib/content";
import { priceBounds } from "@/lib/tour-utils";
import { Catalog, ResultCount } from "./Catalog";
import { CatalogDataProvider } from "./CatalogData";
import { CatalogFromUrl, ResultCountFromUrl } from "./CatalogFromUrl";
import styles from "./catalog.module.css";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

// So'rov vaqtida render: kartochkalardagi sana/o'rin/narx joriy kunga mos bo'lishi uchun (liveTour).
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "catalog.meta" });
  const title = t("title");
  const description = t("description");
  return {
    title,
    description,
    // Filtrlangan ko'rinishlar (?country=…) ham shu kanonik manzilga ishora qiladi.
    alternates: alternates(locale, "/tours"),
    openGraph: {
      type: "website",
      siteName: site.name,
      locale: locale === "uz" ? "uz_UZ" : locale === "ru" ? "ru_RU" : "en_US",
      title,
      description,
      url: `${site.url}/${locale}/tours`,
      images: [{ url: "/img/hero-dubai.jpg", width: 1600, height: 900, alt: site.name }],
    },
  };
}

export default async function ToursPage({ params, searchParams }: Props) {
  const { locale } = await params;
  // Server ham URL'dagi filtrlarni qo'llaydi: filtrlangan havola ochilganda HTML darhol to'g'ri
  // ro'yxatni beradi (parseFilters noma'lum qiymatlarni tashlab yuboradi).
  const query = new URLSearchParams(
    Object.entries(await searchParams).flatMap(([key, value]) =>
      value === undefined ? [] : [[key, Array.isArray(value) ? value[0] : value]],
    ),
  ).toString();
  setRequestLocale(locale);
  const t = await getTranslations("catalog");
  const tc = await getTranslations("common");
  const [tours, taxonomy] = await Promise.all([liveToursByRank(), getTaxonomy()]);
  const data = { tours, ...taxonomy, price: priceBounds(tours) };

  return (
    <CatalogDataProvider value={data}>
      <section className="page-banner">
        <div className="container page-banner__inner">
          <nav aria-label={tc("nav.breadcrumb")} className="breadcrumb breadcrumb--light">
            <Link href="/">{tc("nav.home")}</Link>
            <Icon icon={ChevronRight} size={13} strokeWidth={2} />
            <span aria-current="page">{t("title")}</span>
          </nav>
          <div className={styles.bannerRow}>
            <div className={styles.bannerText}>
              <h1>{t("title")}</h1>
              <p>{t("lead")}</p>
            </div>
            <Suspense fallback={<ResultCount query={query} />}>
              <ResultCountFromUrl />
            </Suspense>
          </div>
        </div>
      </section>

      <Suspense fallback={<Catalog query={query} />}>
        <CatalogFromUrl />
      </Suspense>
    </CatalogDataProvider>
  );
}
