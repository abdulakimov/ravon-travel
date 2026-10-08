import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { CountryId } from "@/data/types";
import { countries, toursInCountry } from "@/data/tours";
import { tr } from "@/lib/l10n";
import styles from "./DestinationCard.module.css";

// Yo'nalish kartochkasi (bosh sahifa va /destinations): 3:4 foto, pastdan qoplama, nom + turlar soni.
// Katalog `country` query parametrini o'qiydi.
export function DestinationCard({
  country,
  label,
  sizes = "(min-width: 1000px) 300px, (min-width: 520px) 50vw, 100vw",
}: {
  country: CountryId;
  /** Nomni almashtirish (masalan bosh sahifadagi «BAA — Dubay»). */
  label?: string;
  sizes?: string;
}) {
  const t = useTranslations("common");
  const locale = useLocale() as Locale;
  const count = toursInCountry(country).length;

  return (
    <Link href={{ pathname: "/tours", query: { country } }} className={styles.card}>
      <Image src={countries[country].image} alt="" fill sizes={sizes} className={styles.img} />
      <span className={styles.shade} />
      <span className={styles.text}>
        <span className={styles.name}>{label ?? tr(countries[country].name, locale)}</span>
        <span className={styles.count}>{t("tourCount", { count })}</span>
      </span>
    </Link>
  );
}
