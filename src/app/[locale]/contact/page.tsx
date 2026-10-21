import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Clock, Mail, MapPin, Phone, type LucideIcon } from "lucide-react";
import { SiInstagram, SiTelegram, SiWhatsapp } from "@icons-pack/react-simple-icons";
import { getSettings } from "@/lib/content";
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

// Aloqa ma'lumotlari admin sozlamalaridan — so'rov vaqtida render.
export const dynamic = "force-dynamic";

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const settings = await getSettings();
  const t = await getTranslations("contact");
  const tc = await getTranslations("common");

  // TZ L4 (ish vaqti) va L5 (manzil). Berilmagan telefon yashiriladi; manzil o'rnida — "Rasmiylashtirilmoqda".
  const details: Detail[] = [
    ...(settings.phone
      ? [{ icon: Phone, label: t("details.phone"), value: settings.phone, href: `tel:${settings.phone.replace(/[^\d+]/g, "")}` }]
      : []),
    ...(settings.email ? [{ icon: Mail, label: t("details.email"), value: settings.email, href: `mailto:${settings.email}` }] : []),
    { icon: Clock, label: t("details.hours"), value: tc("workingHours") },
    {
      icon: MapPin,
      label: t("details.address"),
      value: settings.postalAddress ?? tc("pending"),
      pending: settings.postalAddress === null,
    },
  ];

  const messengers = [
    { label: "Telegram", href: settings.social.telegram, Glyph: SiTelegram },
    { label: "WhatsApp", href: settings.social.whatsapp, Glyph: SiWhatsapp },
    { label: "Instagram", href: settings.social.instagram, Glyph: SiInstagram },
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
          <ContactForm email={settings.email} />
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

          {settings.mapEmbedUrl ? (
            <section className={styles.map} aria-labelledby="contact-map-title">
              <h2 id="contact-map-title" className="sr-only">
                {t("map.title")}
              </h2>
              <iframe
                src={settings.mapEmbedUrl}
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
