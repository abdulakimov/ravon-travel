import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Clock, Mail, MapPin, Phone, type LucideIcon } from "lucide-react";
import { SiInstagram, SiTelegram, SiWhatsapp } from "@icons-pack/react-simple-icons";
import { site } from "@/config/site";
import { alternates } from "@/lib/seo";
import { Eyebrow } from "@/components/Brand";
import { Icon } from "@/components/Icon";
import { ContactForm } from "./ContactForm";
import styles from "./contact.module.css";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact.meta" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: alternates(locale, "/contact"),
  };
}

type Detail = { icon: LucideIcon; label: string; value: string; href?: string; pending?: boolean };

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("contact");
  const tc = await getTranslations("common");

  // TZ L4 (ish vaqti) va L5 (manzil). Berilmagan telefon yashiriladi; manzil o'rnida — "Rasmiylashtirilmoqda".
  const details: Detail[] = [
    ...(site.phone
      ? [{ icon: Phone, label: t("details.phone"), value: site.phone, href: `tel:${site.phone.replace(/[^\d+]/g, "")}` }]
      : []),
    ...(site.email ? [{ icon: Mail, label: t("details.email"), value: site.email, href: `mailto:${site.email}` }] : []),
    { icon: Clock, label: t("details.hours"), value: tc("workingHours") },
    {
      icon: MapPin,
      label: t("details.address"),
      value: site.postalAddress ?? tc("pending"),
      pending: site.postalAddress === null,
    },
  ];

  const messengers = [
    { label: "Telegram", href: site.social.telegram, Glyph: SiTelegram },
    { label: "WhatsApp", href: site.social.whatsapp, Glyph: SiWhatsapp },
    { label: "Instagram", href: site.social.instagram, Glyph: SiInstagram },
  ];

  return (
    <>
      <section className={`page-banner ${styles.banner}`}>
        <div className={`container container--md ${styles.bannerInner}`}>
          <Eyebrow tone="light" as="div">
            {t("banner.eyebrow")}
          </Eyebrow>
          <h1 className={styles.bannerTitle}>{t("banner.title")}</h1>
          <p className={styles.bannerLead}>{t("banner.lead")}</p>
        </div>
      </section>

      <div className={`container container--md ${styles.cols}`}>
        <section className={styles.main}>
          <ContactForm email={site.email} />
        </section>

        <aside className={styles.aside}>
          <section className={styles.panel} aria-labelledby="contact-details-title">
            <h2 id="contact-details-title" className={`${styles.panelTitle} ${styles.panelHead}`}>
              {t("details.title")}
            </h2>
            <dl className={styles.details}>
              {details.map((d) => (
                <div key={d.label} className={styles.detail}>
                  <span className={styles.detailIcon} aria-hidden="true">
                    <Icon icon={d.icon} size={18} />
                  </span>
                  <dt>{d.label}</dt>
                  <dd className={d.pending ? styles.pending : undefined}>
                    {d.href ? <a href={d.href}>{d.value}</a> : d.value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section className={`${styles.panel} ${styles.messengers}`} aria-labelledby="contact-messengers-title">
            <h2 id="contact-messengers-title" className={styles.panelTitle}>
              {t("messengers.title")}
            </h2>
            <ul className={styles.tiles}>
              {messengers.map(({ label, href, Glyph }) => (
                <li key={label}>
                  {href ? (
                    <a href={href} className={styles.tile} target="_blank" rel="noopener noreferrer">
                      <Glyph size={17} color="currentColor" aria-hidden="true" />
                      <span>{label}</span>
                    </a>
                  ) : (
                    <span className={`${styles.tile} ${styles.tileOff}`}>
                      <Glyph size={17} color="currentColor" aria-hidden="true" />
                      <span>{label}</span>
                      <span className={styles.soon}>{tc("soon")}</span>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>

          {site.mapEmbedUrl ? (
            <section className={styles.map} aria-labelledby="contact-map-title">
              <h2 id="contact-map-title" className="sr-only">
                {t("map.title")}
              </h2>
              <iframe
                src={site.mapEmbedUrl}
                title={t("map.iframeTitle")}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </section>
          ) : (
            <section className={styles.mapEmpty} aria-labelledby="contact-map-title">
              <span className={styles.mapIcon}>
                <Icon icon={MapPin} size={20} />
              </span>
              <h2 id="contact-map-title" className={styles.mapTitle}>
                {t("map.title")}
              </h2>
              <p>{t("map.text")}</p>
            </section>
          )}
        </aside>
      </div>
    </>
  );
}
