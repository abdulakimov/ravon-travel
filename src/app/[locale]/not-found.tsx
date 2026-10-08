import { getTranslations } from "next-intl/server";
import { Compass, House } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Icon } from "@/components/Icon";
import styles from "./not-found.module.css";

// Lokalizatsiya qilingan 404. notFound() chaqirilganda (shu jumladan [...rest] orqali
// noma'lum manzillarda) layout ichida chiziladi — Header/Footer saqlanadi.
export default async function NotFound() {
  const t = await getTranslations("notFound");
  const tc = await getTranslations("common");

  return (
    <section className={`container ${styles.wrap}`}>
      <p className={styles.code} aria-hidden="true">
        404
      </p>
      {/* Brend motivi — «Ravon to'lqini» */}
      <svg className={styles.wave} viewBox="0 0 120 14" aria-hidden="true" focusable="false">
        <path d="M2 7c9.7-6.6 19.3-6.6 29 0s19.3 6.6 29 0 19.3-6.6 29 0 19.3 6.6 29 0" />
      </svg>
      <h1 className={styles.title}>{t("title")}</h1>
      <p className={styles.text}>{t("text")}</p>
      <div className={styles.actions}>
        <Link href="/" className="btn btn--primary">
          <Icon icon={House} size={17} />
          <span>{tc("actions.backHome")}</span>
        </Link>
        <Link href="/tours" className="btn btn--secondary">
          <Icon icon={Compass} size={17} />
          <span>{tc("actions.viewTours")}</span>
        </Link>
      </div>
    </section>
  );
}
