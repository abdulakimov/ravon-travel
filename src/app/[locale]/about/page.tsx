import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight, Headset, ImageIcon, ScrollText, ShieldCheck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { locales } from "@/i18n/routing";
import { site } from "@/config/site";
import { countryIds, tours } from "@/data/tours";
import { alternates } from "@/lib/seo";
import { Eyebrow } from "@/components/Brand";
import { Icon } from "@/components/Icon";
import { Reveal } from "@/components/Reveal";
import styles from "./about.module.css";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about.meta" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: alternates(locale, "/about"),
  };
}

const TEAM = ["director", "manager", "specialist", "accountant"] as const;

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("about");
  const tc = await getTranslations("common");

  const licensed = site.licenseNo !== null;
  const pending = tc("pending");

  const stats = [
    { value: tours.length, label: t("intro.stats.tours") },
    { value: countryIds.length, label: t("intro.stats.destinations") },
    { value: locales.length, label: t("intro.stats.languages") },
  ];

  const team = TEAM.map((key) => {
    const name = site.team[key];
    const role = t(`team.members.${key}.role`);
    return { key, name, role, area: t(`team.members.${key}.area`), mono: (name ?? role).trim().charAt(0).toUpperCase() };
  });
  const teamComplete = team.every((p) => p.name !== null);

  // Rekvizitlar (TZ L9): qiymat faqat site.ts dan; null → "Rasmiylashtirilmoqda".
  const requisites: { label: string; value: string | null }[] = [
    { label: t("requisites.fields.legalName"), value: site.legalName },
    { label: t("requisites.fields.stir"), value: site.stir },
    { label: t("requisites.fields.address"), value: site.postalAddress },
    { label: t("requisites.fields.phone"), value: site.phone },
    { label: t("requisites.fields.email"), value: site.email },
    { label: t("requisites.fields.hours"), value: tc("workingHours") },
    { label: t("requisites.fields.bank"), value: site.bankName },
    { label: t("requisites.fields.account"), value: site.bankAccount },
  ];
  const requisitesComplete = requisites.every((r) => r.value !== null);

  return (
    <>
      <section className={styles.hero}>
        <Image src="/img/hero-dubai.jpg" alt="" fill priority sizes="100vw" className={styles.heroImg} />
        <span className={styles.heroShade} aria-hidden="true" />
        <div className={`container container--md ${styles.heroInner}`}>
          <Eyebrow tone="light" as="div">
            {site.name}
          </Eyebrow>
          <h1 className={styles.heroTitle}>{t("hero.title")}</h1>
          <p className={styles.heroLead}>{t("hero.lead")}</p>
        </div>
      </section>

      <section className="container container--md section--inner">
        <div className={styles.two}>
          <div className={styles.introText}>
            <Eyebrow as="div">{t("intro.eyebrow")}</Eyebrow>
            <h2 className={styles.h2}>{t("intro.title")}</h2>
            <p>{t("intro.p1")}</p>
            <p>{t("intro.p2")}</p>
            <dl className={styles.stats}>
              {stats.map((s) => (
                <div key={s.label} className={styles.stat}>
                  <dt>{s.label}</dt>
                  <dd>{s.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className={styles.gallery}>
            <span className={`${styles.shot} ${styles.shotWide}`}>
              <Image
                src="/img/tour-az.jpg"
                alt={t("intro.alt.baku")}
                fill
                sizes="(min-width: 940px) 540px, 100vw"
                className={styles.shotImg}
              />
            </span>
            <span className={styles.shot}>
              <Image
                src="/img/dest-gr.jpg"
                alt={t("intro.alt.greece")}
                fill
                sizes="(min-width: 940px) 265px, 50vw"
                className={styles.shotImg}
              />
            </span>
            <span className={styles.shot}>
              <Image
                src="/img/tour-kg.jpg"
                alt={t("intro.alt.issykKul")}
                fill
                sizes="(min-width: 940px) 265px, 50vw"
                className={styles.shotImg}
              />
            </span>
          </div>
        </div>
      </section>

      {/* TZ L6–L7: litsenziya ma'lumotlari */}
      <section id="litsenziya" className={styles.docs}>
        <div className="container container--md section--inner">
          <Reveal className={styles.head}>
            <Eyebrow as="div">{t("docs.eyebrow")}</Eyebrow>
            <h2 className={styles.h2}>{t("docs.title")}</h2>
            <p>{licensed ? t("docs.lead") : t("docs.leadPending")}</p>
          </Reveal>

          <div className={styles.docGrid}>
            <div className={styles.docCard}>
              <span className={styles.docTop}>
                <span className={styles.iconBox}>
                  <Icon icon={ShieldCheck} size={21} />
                </span>
                {licensed ? (
                  <span className={`badge badge--outline ${styles.status}`}>{t("docs.license.active")}</span>
                ) : (
                  <span className={`badge badge--warn ${styles.status}`}>{pending}</span>
                )}
              </span>
              <h3 className={styles.docTitle}>{t("docs.license.title")}</h3>
              <dl className={styles.docRows}>
                <div>
                  <dt>{t("docs.license.number")}</dt>
                  <dd className={licensed ? undefined : styles.muted}>
                    {site.licenseNo ?? t("docs.license.numberPending")}
                  </dd>
                </div>
                {site.licenseDate && (
                  <div>
                    <dt>{t("docs.license.date")}</dt>
                    <dd>{site.licenseDate}</dd>
                  </div>
                )}
                <div>
                  <dt>{t("docs.license.direction")}</dt>
                  <dd>{tc("outbound")}</dd>
                </div>
              </dl>
            </div>

            <div className={styles.docCard}>
              <span className={styles.iconBox}>
                <Icon icon={ScrollText} size={21} />
              </span>
              <h3 className={styles.docTitle}>{t("docs.offer.title")}</h3>
              <p className={styles.docText}>{t("docs.offer.text")}</p>
              <Link href="/terms" className={styles.docLink}>
                <span>{t("docs.offer.link")}</span>
                <Icon icon={ArrowRight} size={15} strokeWidth={1.9} />
              </Link>
            </div>

            <div className={`${styles.docCard} ${styles.scan}`}>
              <span className={`${styles.iconBox} ${styles.iconBoxMuted}`}>
                <Icon icon={ImageIcon} size={21} />
              </span>
              <h3 className={styles.scanTitle}>{t("docs.scan.title")}</h3>
              <p className={styles.scanText}>{t("docs.scan.text")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* TZ L8: yo'nalishlar bo'yicha mas'ul mutaxassislar */}
      <section id="jamoa" className="container container--md section--inner">
        <Reveal className={styles.head}>
          <Eyebrow as="div">{t("team.eyebrow")}</Eyebrow>
          <h2 className={styles.h2}>{t("team.title")}</h2>
          <p>{teamComplete ? t("team.lead") : t("team.leadPending")}</p>
        </Reveal>

        <ul className={styles.teamGrid}>
          {team.map((p) => (
            <Reveal as="li" key={p.key} className={styles.member}>
              <span className={styles.mono} aria-hidden="true">
                {p.mono}
              </span>
              {p.name ? (
                <span className={styles.memberName}>{p.name}</span>
              ) : (
                <span className={`badge badge--warn ${styles.status} ${styles.namePending}`}>{t("team.namePending")}</span>
              )}
              <span className={styles.memberRole}>{p.role}</span>
              <span className={styles.memberArea}>{p.area}</span>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* TZ L9: to'liq nom va rekvizitlar */}
      <section id="rekvizitlar" className={styles.requisites}>
        <div className="container container--md section--inner">
          <Reveal className={`${styles.head} ${styles.headDark}`}>
            <Eyebrow tone="light" as="div">
              {t("requisites.eyebrow")}
            </Eyebrow>
            <h2 className={styles.h2}>{t("requisites.title")}</h2>
            <p>{requisitesComplete ? t("requisites.lead") : t("requisites.leadPending", { label: pending })}</p>
          </Reveal>

          <dl className={styles.reqGrid}>
            {requisites.map((row) => (
              <div key={row.label} className={styles.reqRow}>
                <dt>{row.label}</dt>
                <dd className={row.value === null ? styles.reqPending : undefined}>{row.value ?? pending}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className={`container container--md ${styles.ctaWrap}`}>
        <Reveal className={styles.cta}>
          <div className={styles.ctaText}>
            <h2>{t("cta.title")}</h2>
            <p>{t("cta.text")}</p>
          </div>
          <div className={styles.ctaActions}>
            <Link href="/contact" className={`btn btn--primary ${styles.ctaBtn}`}>
              <Icon icon={Headset} size={17} />
              <span>{tc("actions.consult")}</span>
            </Link>
            <Link href="/tours" className={`btn btn--secondary ${styles.ctaBtn}`}>
              {tc("actions.viewTours")}
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
