import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight, CalendarCheck, Check, ChevronRight, CircleCheck, CircleX, Clock, Headset, MapPin, Minus, Star, Users } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { site } from "@/config/site";
import { categories, countries, getTour, similarTours, tours } from "@/data/tours";
import { getTourDetail } from "@/data/tour-details";
import { Icon } from "@/components/Icon";
import { Reveal } from "@/components/Reveal";
import { TourCard } from "@/components/TourCard";
import { money } from "@/lib/format";
import { tr } from "@/lib/l10n";
import { alternates } from "@/lib/seo";
import { BOOKING_ANCHOR, BookingCard, BookingProvider, DatesTable, MobileBar } from "./Booking";
import { Gallery } from "./Gallery";
import { Itinerary } from "./Itinerary";
import styles from "./tour.module.css";

type Props = { params: Promise<{ locale: string; slug: string }> };

export const dynamicParams = false;

// So'rov vaqtida render: jo'nab ketgan sanalar taklif qilinmasligi uchun (getTour joriy sanani hisobga oladi).
export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return tours.map((tour) => ({ slug: tour.slug }));
}

const OG_LOCALE: Record<Locale, string> = { uz: "uz_UZ", ru: "ru_RU", en: "en_US" };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = rawLocale as Locale;
  const tour = getTour(slug);
  if (!tour) notFound();

  const t = await getTranslations({ locale, namespace: "tour.meta" });
  const title = tr(tour.title, locale);
  const description = `${tr(tour.summary, locale)} ${t("tail", {
    days: tour.days,
    nights: tour.nights,
    price: money(tour.priceFromUzs, locale),
  })}`;
  const path = `/tours/${tour.slug}`;

  return {
    title,
    description,
    alternates: alternates(locale, path),
    // Sahifa `openGraph`i layout'nikini to'liq almashtiradi — umumiy maydonlar qayta beriladi.
    openGraph: {
      type: "website",
      siteName: site.name,
      locale: OG_LOCALE[locale] ?? OG_LOCALE.uz,
      title,
      description,
      url: `${site.url}/${locale}${path}`,
      images: [{ url: tour.image, alt: title }],
    },
    twitter: { card: "summary_large_image", title, description, images: [tour.image] },
  };
}

/** `</script>` orqali chiqib ketishning oldini olish uchun `<` kodlanadi. */
const jsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");

/** "Ism Familiya" → "IF"; ism berilmagan bo'lsa brend qisqartmasi. */
function initials(name: string | null): string {
  if (!name) return "RV";
  const letters = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
  return letters || "RV";
}

export default async function TourPage({ params }: Props) {
  const { locale: rawLocale, slug } = await params;
  const locale = rawLocale as Locale;
  setRequestLocale(locale);

  const tour = getTour(slug);
  const detail = tour && getTourDetail(tour.id);
  if (!tour || !detail) notFound();

  const t = await getTranslations("tour");
  const tc = await getTranslations("common");
  const tCatalog = await getTranslations("catalog");

  const title = tr(tour.title, locale);
  const country = tr(countries[tour.country].name, locale);
  const category = tr(categories[tour.category].name, locale);
  const pageUrl = `${site.url}/${locale}/tours/${tour.slug}`;
  const specialist = site.team.specialist;
  const specialistRole = t("specialist.role", { country });
  const related = similarTours(tour, 3);

  // Client komponentlarga faqat joriy tildagi matn uzatiladi (uch tilli kontent brauzerga ketmaydi).
  const gallery = detail.gallery.map((g) => ({ src: g.src, alt: tr(g.alt, locale) }));
  const days = detail.itinerary.map((d) => ({
    title: tr(d.title, locale),
    text: tr(d.text, locale),
    tags: d.tags.map((tag) => tr(tag, locale)),
  }));

  const tripSchema = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: title,
    description: tr(tour.summary, locale),
    url: pageUrl,
    inLanguage: locale,
    image: detail.gallery.map((g) => `${site.url}${g.src}`),
    touristType: category,
    provider: { "@type": "TravelAgency", name: site.name, url: site.url },
    itinerary: {
      "@type": "ItemList",
      numberOfItems: days.length,
      itemListElement: days.map((d, i) => ({ "@type": "ListItem", position: i + 1, name: d.title, description: d.text })),
    },
    offers: tour.fixedDeparture
      ? tour.departures.map((d) => ({
          "@type": "Offer",
          price: d.priceUzs,
          priceCurrency: "UZS",
          availability: d.seatsLeft > 0 ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
          validThrough: d.from,
          url: pageUrl,
        }))
      : { "@type": "AggregateOffer", lowPrice: tour.priceFromUzs, priceCurrency: "UZS", url: pageUrl },
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: tc("nav.home"), item: `${site.url}/${locale}` },
      { "@type": "ListItem", position: 2, name: tCatalog("title"), item: `${site.url}/${locale}/tours` },
      { "@type": "ListItem", position: 3, name: title, item: pageUrl },
    ],
  };

  return (
    <article className={styles.page}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(tripSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbSchema) }} />

      <div className={`container ${styles.crumbs}`}>
        <nav aria-label={tc("nav.breadcrumb")} className={`breadcrumb ${styles.breadcrumb}`}>
          <Link href="/">{tc("nav.home")}</Link>
          <Icon icon={ChevronRight} size={13} strokeWidth={2} />
          <Link href="/tours">{tCatalog("title")}</Link>
          <Icon icon={ChevronRight} size={13} strokeWidth={2} />
          <Link href={`/tours?country=${tour.country}`} className={styles.crumbCountry}>
            {country}
          </Link>
        </nav>
      </div>

      <header className={`container ${styles.head}`}>
        <ul className={styles.badges}>
          <li className={styles.tag} data-tone={tour.fixedDeparture ? "fixed" : "plain"}>
            {tour.fixedDeparture && <Icon icon={CalendarCheck} size={13} />}
            <span>{tour.fixedDeparture ? tc("tourCard.fixed") : tc("tourCard.request")}</span>
          </li>
          {tour.top && (
            <li className={styles.tag} data-tone="top">
              <Icon icon={Star} size={13} fill="currentColor" strokeWidth={0} />
              <span>{tc("tourCard.top")}</span>
            </li>
          )}
          <li className={styles.tag} data-tone="plain">
            {category}
          </li>
        </ul>

        <div className={styles.headRow}>
          <h1 className={styles.h1}>{title}</h1>
          <ul className={styles.meta}>
            <li>
              <Icon icon={Clock} size={16} className={styles.metaIcon} />
              <span>{t("duration", { days: tour.days, nights: tour.nights })}</span>
            </li>
            <li>
              <Icon icon={MapPin} size={16} className={styles.metaIcon} />
              <span>{tr(detail.route, locale)}</span>
            </li>
            <li>
              <Icon icon={Users} size={16} className={styles.metaIcon} />
              <span>{t("group", { min: detail.groupSize.min, max: detail.groupSize.max })}</span>
            </li>
          </ul>
        </div>
      </header>

      <div className={`container ${styles.galleryWrap}`}>
        <Gallery images={gallery} />
      </div>

      <BookingProvider
        tour={{
          slug: tour.slug,
          fixedDeparture: tour.fixedDeparture,
          priceFromUzs: tour.priceFromUzs,
          departures: tour.departures,
        }}
      >
        <div className={`container ${styles.cols}`}>
          <div className={styles.content}>
            <section aria-labelledby="tour-about">
              <h2 className={styles.h2} id="tour-about">
                {t("about")}
              </h2>
              <div className={styles.about}>
                {detail.about.map((paragraph, i) => (
                  <p key={i}>{tr(paragraph, locale)}</p>
                ))}
              </div>
            </section>

            <Reveal as="section">
              <Itinerary days={days} />
            </Reveal>

            <Reveal as="section" aria-labelledby="tour-included">
              <h2 className={`${styles.h2} ${styles.h2Gap}`} id="tour-included">
                {t("included.title")}
              </h2>
              <div className={styles.inclGrid}>
                <div className={styles.incl}>
                  <h3 className={styles.inclTitle}>
                    <Icon icon={CircleCheck} size={18} strokeWidth={2} className={styles.metaIcon} />
                    <span>{t("included.yes")}</span>
                  </h3>
                  <ul className={styles.inclList}>
                    {detail.included.map((item, i) => (
                      <li key={i}>
                        <Icon icon={Check} size={17} strokeWidth={2.2} className={styles.metaIcon} />
                        <span>{tr(item, locale)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={`${styles.incl} ${styles.inclOff}`}>
                  <h3 className={styles.inclTitle}>
                    <Icon icon={CircleX} size={18} strokeWidth={2} />
                    <span>{t("included.no")}</span>
                  </h3>
                  <ul className={styles.inclList}>
                    {detail.excluded.map((item, i) => (
                      <li key={i}>
                        <Icon icon={Minus} size={17} strokeWidth={2.2} />
                        <span>{tr(item, locale)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Reveal>

            {tour.fixedDeparture && tour.departures.length > 0 && (
              <Reveal as="section" aria-labelledby="tour-dates">
                <h2 className={`${styles.h2} ${styles.h2Gap}`} id="tour-dates">
                  {t("dates.title")}
                </h2>
                <DatesTable />
              </Reveal>
            )}

            <Reveal as="section" aria-labelledby="tour-specialist">
              <h2 className={`${styles.h2} ${styles.h2Gap}`} id="tour-specialist">
                {t("specialist.title")}
              </h2>
              <div className={styles.specialist}>
                <span className={styles.avatar} aria-hidden="true">
                  {initials(specialist)}
                </span>
                <div className={styles.specialistText}>
                  {/* Ism hali berilmagan bo'lsa (site.ts → null) faqat lavozim ko'rsatiladi */}
                  {specialist ? (
                    <>
                      <span className={styles.specialistName}>{specialist}</span>
                      <span className={styles.specialistRole}>{specialistRole}</span>
                    </>
                  ) : (
                    <span className={styles.specialistName}>{specialistRole}</span>
                  )}
                </div>
                <Link href="/contact" className={styles.ask}>
                  <Icon icon={Headset} size={16} />
                  <span>{t("specialist.ask")}</span>
                </Link>
              </div>
            </Reveal>

            <Reveal as="section" aria-labelledby="tour-info">
              <h2 className={`${styles.h2} ${styles.h2Gap}`} id="tour-info">
                {t("info.title")}
              </h2>
              <div className={styles.notes}>
                {(["visa", "passport", "cancellation"] as const).map((key) => (
                  <div key={key} className={styles.note}>
                    <h3 className={styles.noteTitle}>{t(`info.${key}`)}</h3>
                    <p>{tr(detail.notes[key], locale)}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>

          <aside id={BOOKING_ANCHOR} className={styles.side} aria-label={t("booking.title")}>
            <BookingCard />
          </aside>
        </div>

        <MobileBar />
      </BookingProvider>

      <section className={styles.similar} aria-labelledby="tour-similar">
        <div className={`container ${styles.similarInner}`}>
          <Reveal className={styles.similarHead}>
            <h2 className={styles.similarTitle} id="tour-similar">
              {t("similar.title")}
            </h2>
            <Link href="/tours" className={styles.allLink}>
              <span>{t("similar.all")}</span>
              <Icon icon={ArrowRight} size={16} />
            </Link>
          </Reveal>
          <ul className={styles.similarGrid}>
            {related.map((item) => (
              <Reveal as="li" key={item.id}>
                <TourCard tour={item} />
              </Reveal>
            ))}
          </ul>
        </div>
      </section>
    </article>
  );
}
