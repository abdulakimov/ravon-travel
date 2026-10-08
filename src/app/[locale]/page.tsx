import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  ArrowRight,
  CreditCard,
  Globe,
  Headset,
  Languages,
  Layers,
  MapPin,
  Plane,
  ShieldCheck,
  Tag,
  type LucideIcon,
} from "lucide-react";
import { SiTelegram } from "@icons-pack/react-simple-icons";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { site } from "@/config/site";
import { categoryIds, countryIds, liveToursByRank, tours } from "@/data/tours";
import { postsByDate } from "@/data/blog";
import { alternates } from "@/lib/seo";
import { Eyebrow } from "@/components/Brand";
import { Icon } from "@/components/Icon";
import { Reveal } from "@/components/Reveal";
import { TourCard } from "@/components/TourCard";
import { DestinationCard } from "./destinations/_components/DestinationCard";
import { PostCard } from "./blog/_components/PostCard";
import styles from "./home.module.css";

type Props = { params: Promise<{ locale: string }> };

// So'rov vaqtida render: kartochkalardagi sana/o'rin/narx joriy kunga mos bo'lishi uchun (liveTour).
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "common.meta" });
  return {
    title: { absolute: t("title") },
    description: t("description"),
    alternates: alternates(locale, "/"),
  };
}

// Bosh sahifadagi yo'nalishlar — prototipdagi 8 ta davlat (Qirg'iziston /destinations da).
const homeCountries = countryIds.filter((id) => id !== "kg");

/** schema.org TravelAgency — berilmagan (null) rekvizitlar tushirib qoldiriladi. */
function travelAgencyJsonLd(locale: string, description: string) {
  const sameAs = Object.values(site.social).filter((v): v is NonNullable<typeof v> => v != null);
  return {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    "@id": `${site.url}/#organization`,
    name: site.name,
    url: `${site.url}/${locale}`,
    description,
    image: `${site.url}/img/hero-dubai.jpg`,
    logo: `${site.url}/icon.svg`,
    email: site.email,
    areaServed: "UZ",
    availableLanguage: [...routing.locales],
    openingHours: "Mo-Sa 09:00-19:00",
    ...(site.legalName ? { legalName: site.legalName } : {}),
    ...(site.phone ? { telephone: site.phone } : {}),
    ...(site.stir ? { taxID: site.stir } : {}),
    ...(site.postalAddress
      ? { address: { "@type": "PostalAddress", streetAddress: site.postalAddress, addressCountry: "UZ" } }
      : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export default async function Home({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const tc = await getTranslations("common");

  const stats: { key: "tours" | "destinations" | "categories" | "languages"; value: number; icon: LucideIcon }[] = [
    { key: "tours", value: tours.length, icon: Plane },
    { key: "destinations", value: countryIds.length, icon: MapPin },
    { key: "categories", value: categoryIds.length, icon: Layers },
    { key: "languages", value: routing.locales.length, icon: Globe },
  ];

  const trust: { key: "licensed" | "online" | "languages"; icon: LucideIcon }[] = [
    { key: "licensed", icon: ShieldCheck },
    { key: "online", icon: CreditCard },
    { key: "languages", icon: Languages },
  ];

  const advantages: { key: "license" | "payment" | "price" | "specialist"; icon: LucideIcon }[] = [
    { key: "license", icon: ShieldCheck },
    { key: "payment", icon: CreditCard },
    { key: "price", icon: Tag },
    { key: "specialist", icon: Headset },
  ];

  const jsonLd = JSON.stringify(travelAgencyJsonLd(locale, tc("meta.description"))).replace(/</g, "\\u003c");

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className={styles.hero}>
        <Image
          src="/img/hero-dubai.jpg"
          alt={t("hero.imageAlt")}
          fill
          preload
          sizes="100vw"
          className={styles.cover}
        />
        <div className={styles.heroShade} />

        <div className={`container ${styles.heroInner}`}>
          <div className={styles.heroText}>
            <div className={styles.heroEyebrow}>
              <Eyebrow tone="accent">{t("hero.eyebrow")}</Eyebrow>
            </div>
            <h1 className={styles.heroTitle}>{t("hero.title")}</h1>
            <p className={styles.heroLead}>{t("hero.text", { count: countryIds.length })}</p>
            <div className={styles.heroActions}>
              <a href="#turlar" className={`${styles.cta} ${styles.ctaAccent} ${styles.ctaAccentHero}`}>
                {tc("actions.viewTours")}
                <Icon icon={ArrowRight} size={16} />
              </a>
              <Link href="/about" className={`${styles.cta} ${styles.ctaGlass}`}>
                {tc("nav.about")}
              </Link>
            </div>
          </div>

          <ul className={styles.trust} aria-label={t("hero.trustLabel")}>
            {trust.map(({ key, icon }) => (
              <li key={key}>
                <Icon icon={icon} size={17} />
                {t(`hero.trust.${key}`)}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Raqamlar ─────────────────────────────────────────────────────── */}
      <section className={styles.stats} aria-label={t("stats.label")}>
        <ul className={`container ${styles.statsGrid}`}>
          {stats.map(({ key, value, icon }) => (
            <Reveal as="li" key={key} className={styles.stat}>
              <span className={styles.statValue}>{value}</span>
              <span className={styles.statLabel}>
                <Icon icon={icon} size={15} />
                {t(`stats.${key}`, { count: value })}
              </span>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* ── Tanlangan turlar ─────────────────────────────────────────────── */}
      <section id="turlar" className="section">
        <div className="container">
          <Reveal className={styles.head}>
            <div className={styles.headText}>
              <div className={styles.eyebrow}>
                <Eyebrow>{t("featured.eyebrow")}</Eyebrow>
              </div>
              <h2 className={styles.h2}>{t("featured.title")}</h2>
              <p className={styles.lead}>{t("featured.text")}</p>
            </div>
            <Link href="/tours" className={styles.outline}>
              {t("featured.all", { count: tours.length })}
              <Icon icon={ArrowRight} size={16} />
            </Link>
          </Reveal>

          <div className={styles.tourGrid}>
            {liveToursByRank().slice(0, 6).map((tour) => (
              <Reveal key={tour.id}>
                <TourCard tour={tour} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Yo'nalishlar ─────────────────────────────────────────────────── */}
      <section id="yonalishlar" className={`section ${styles.skyBoth}`}>
        <div className="container">
          <Reveal className={styles.head}>
            <div className={`${styles.headText} ${styles.headTextNarrow}`}>
              <div className={styles.eyebrow}>
                <Eyebrow>{t("destinations.eyebrow")}</Eyebrow>
              </div>
              <h2 className={styles.h2}>{t("destinations.title")}</h2>
              <p className={styles.lead}>{t("destinations.text")}</p>
            </div>
            <Link href="/destinations" className={styles.outline}>
              {t("destinations.all")}
              <Icon icon={ArrowRight} size={16} />
            </Link>
          </Reveal>

          <div className={styles.destGrid}>
            {homeCountries.map((id) => (
              <Reveal key={id}>
                <DestinationCard
                  country={id}
                  label={id === "ae" ? t("destinations.aeLabel") : undefined}
                  sizes="(min-width: 1100px) 290px, (min-width: 760px) 33vw, (min-width: 500px) 50vw, 100vw"
                />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Nega aynan biz ───────────────────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <Reveal className={styles.headSolo}>
            <div className={styles.eyebrow}>
              <Eyebrow>{t("why.eyebrow")}</Eyebrow>
            </div>
            <h2 className={`${styles.h2} ${styles.h2Flush}`}>{t("why.title")}</h2>
          </Reveal>

          <div className={styles.whyGrid}>
            {advantages.map(({ key, icon }) => (
              <Reveal key={key} className={styles.whyCard}>
                <span className={styles.whyIcon}>
                  <Icon icon={icon} size={21} />
                </span>
                <h3 className={styles.whyTitle}>{t(`why.${key}.title`)}</h3>
                <p className={styles.whyText}>{t(`why.${key}.text`)}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Blog ─────────────────────────────────────────────────────────── */}
      <section id="blog" className={`section ${styles.skyTop}`}>
        <div className="container">
          <Reveal className={styles.head}>
            <div>
              <div className={styles.eyebrow}>
                <Eyebrow>{t("blog.eyebrow")}</Eyebrow>
              </div>
              <h2 className={`${styles.h2} ${styles.h2Flush}`}>{t("blog.title")}</h2>
            </div>
            <Link href="/blog" className={styles.outline}>
              {t("blog.all")}
              <Icon icon={ArrowRight} size={16} />
            </Link>
          </Reveal>

          <div className={styles.blogGrid}>
            {postsByDate.slice(0, 3).map((post) => (
              <Reveal key={post.slug}>
                <PostCard post={post} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA bandi ────────────────────────────────────────────────────── */}
      <section className={styles.band}>
        <Image src="/img/cta.jpg" alt="" fill sizes="100vw" className={`${styles.cover} ${styles.bandImg}`} />
        <div className={styles.bandShade} />
        <Reveal className={`container ${styles.bandInner}`}>
          <div className={styles.bandText}>
            <h2 className={styles.bandTitle}>{t("cta.title")}</h2>
            <p className={styles.bandLead}>{t("cta.text")}</p>
          </div>
          <div className={styles.bandActions}>
            <Link href="/contact" className={`${styles.cta} ${styles.ctaAccent} ${styles.ctaBand}`}>
              <Icon icon={Headset} size={17} />
              {tc("actions.consult")}
            </Link>
            {/* Telegram havolasi hali berilmagan bo'lsa — aloqa sahifasiga. */}
            {site.social.telegram ? (
              <a
                href={site.social.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.cta} ${styles.ctaLine} ${styles.ctaBand}`}
              >
                <SiTelegram size={16} aria-hidden="true" />
                {tc("actions.telegram")}
              </a>
            ) : (
              <Link href="/contact" className={`${styles.cta} ${styles.ctaLine} ${styles.ctaBand}`}>
                <SiTelegram size={16} aria-hidden="true" />
                {tc("actions.telegram")}
              </Link>
            )}
          </div>
        </Reveal>
      </section>
    </>
  );
}
