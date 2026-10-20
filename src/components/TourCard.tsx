import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, CalendarCheck, Star, Users } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { Tour } from "@/data/types";
import { categories } from "@/data/tours";
import { money } from "@/lib/format";
import { tr } from "@/lib/l10n";
import { Icon } from "./Icon";
import styles from "./TourCard.module.css";

// Server va client komponentlarda bir xil ishlaydi (hook'lar next-intl'da universal).
export function TourCard({ tour, priority = false }: { tour: Tour; priority?: boolean }) {
  const t = useTranslations("common.tourCard");
  const locale = useLocale() as Locale;

  return (
    <Link href={`/tours/${tour.slug}`} className={`card card--hover ${styles.card}`}>
      <div className={styles.media}>
        <Image
          src={tour.image}
          alt=""
          fill
          sizes="(min-width: 1000px) 400px, (min-width: 640px) 50vw, 100vw"
          className={styles.img}
          priority={priority}
        />
        <div className={styles.badges}>
          {tour.top && (
            <span className="badge badge--top">
              <Icon icon={Star} size={12} fill="currentColor" strokeWidth={0} />
              {t("top")}
            </span>
          )}
          {tour.fixedDeparture ? (
            <span className="badge badge--fixed">
              <Icon icon={CalendarCheck} size={12} />
              {t("fixed")}
            </span>
          ) : (
            <span className="badge badge--request">{t("request")}</span>
          )}
        </div>
      </div>

      <div className={styles.body}>
        <div className={styles.meta}>
          <span>{tr(categories[tour.category].name, locale)}</span>
          <span>{t("days", { count: tour.days })}</span>
        </div>
        <h3 className={styles.title}>{tr(tour.title, locale)}</h3>
        <p className={styles.summary}>{tr(tour.summary, locale)}</p>

        {tour.seatsLeft != null && (
          <span className={`${styles.seats} ${tour.seatsLeft <= 5 ? styles.seatsLow : ""}`}>
            <Icon icon={Users} size={13} />
            {t("seatsLeft", { count: tour.seatsLeft })}
          </span>
        )}

        <div className={styles.foot}>
          <span className={styles.priceBox}>
            <span className={styles.price}>{money(tour.priceFromUzs, locale)}</span>
            <span className={styles.per}>{t("perPerson")}</span>
          </span>
          <span className={styles.more}>
            {t("details")}
            <Icon icon={ArrowRight} size={16} />
          </span>
        </div>
      </div>
    </Link>
  );
}
