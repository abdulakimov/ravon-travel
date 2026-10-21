import { getTranslations } from "next-intl/server";
import { CreditCard } from "lucide-react";
import { SiInstagram, SiTelegram, SiWhatsapp } from "@icons-pack/react-simple-icons";
import { Link } from "@/i18n/navigation";
import { site } from "@/config/site";
import { Icon } from "./Icon";
import { Logo } from "./Brand";
import styles from "./Footer.module.css";

export async function Footer() {
  const t = await getTranslations("common");

  const socials = [
    { label: "Telegram", href: site.social.telegram, Glyph: SiTelegram },
    { label: "Instagram", href: site.social.instagram, Glyph: SiInstagram },
    { label: "WhatsApp", href: site.social.whatsapp, Glyph: SiWhatsapp },
  ];

  // Litsenziya talabi (TZ L4–L6): rekvizit qatori har sahifada. Berilmagan maydon ko'rsatilmaydi.
  const legal: { label: string; value: string }[] = [
    ...(site.stir ? [{ label: t("footer.stir"), value: site.stir }] : []),
    ...(site.postalAddress ? [{ label: t("footer.address"), value: site.postalAddress }] : []),
    { label: t("footer.hours"), value: t("workingHours") },
    {
      label: t("footer.licenseLine"),
      value: site.licenseNo
        ? [`№ ${site.licenseNo}`, site.licenseDate, site.licenseAuthority].filter(Boolean).join(", ")
        : t("pending"),
    },
    { label: t("footer.licensedDirection"), value: t("outbound") },
    ...(site.phone ? [{ label: t("footer.phone"), value: site.phone }] : []),
    { label: t("footer.email"), value: site.email },
  ];

  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.cols}>
          <div className={styles.brand}>
            <Logo variant="stacked" height={118} inverse />
            <p className={styles.tagline}>{t("footer.tagline")}</p>
            <div className={styles.socials}>
              {socials.map(({ label, href, Glyph }) =>
                href ? (
                  <a key={label} href={href} aria-label={label} className={styles.social} target="_blank" rel="noopener noreferrer">
                    <Glyph size={17} color="currentColor" aria-hidden="true" />
                  </a>
                ) : (
                  <Link key={label} href="/contact" aria-label={label} className={styles.social}>
                    <Glyph size={17} color="currentColor" aria-hidden="true" />
                  </Link>
                ),
              )}
            </div>
          </div>

          <nav className={styles.col} aria-label={t("footer.navigation")}>
            <h2 className={styles.heading}>{t("footer.navigation")}</h2>
            <Link href="/">{t("nav.home")}</Link>
            <Link href="/tours">{t("nav.tours")}</Link>
            <Link href="/destinations">{t("nav.destinations")}</Link>
            <Link href="/blog">{t("nav.blog")}</Link>
          </nav>

          <nav className={styles.col} aria-label={t("footer.company")}>
            <h2 className={styles.heading}>{t("footer.company")}</h2>
            <Link href="/about">{t("nav.about")}</Link>
            <Link href="/about#litsenziya">{t("footer.license")}</Link>
            <Link href="/about#jamoa">{t("footer.team")}</Link>
            <Link href="/about#rekvizitlar">{t("footer.requisites")}</Link>
            <Link href="/contact">{t("nav.contact")}</Link>
          </nav>

          <nav className={styles.col} aria-label={t("footer.help")}>
            <h2 className={styles.heading}>{t("footer.help")}</h2>
            <Link href="/faq">{t("footer.faq")}</Link>
            <Link href="/terms">{t("footer.terms")}</Link>
            <Link href="/privacy">{t("footer.privacy")}</Link>
            <Link href="/cancellation">{t("footer.cancellation")}</Link>
          </nav>
        </div>

        <dl className={styles.legal}>
          {site.legalName && <div className={styles.legalName}>{site.legalName}</div>}
          {legal.map((row) => (
            <div key={row.label} className={styles.legalRow}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>

        <div className={styles.bottom}>
          <span>{t("footer.copyright", { year: 2026 })}</span>
          <span className={styles.pay}>
            <Icon icon={CreditCard} size={15} />
            <span>Humo · Uzcard · Visa · Mastercard</span>
          </span>
        </div>

        <p className={styles.credit}>{t("footer.photoCredit")}</p>
      </div>
    </footer>
  );
}
