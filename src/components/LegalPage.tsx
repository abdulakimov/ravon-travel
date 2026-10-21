import { getTranslations } from "next-intl/server";
import { ArrowRight, ArrowUp, Info } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getSettings } from "@/lib/content";
import { fillLegal } from "@/lib/legal-fill";
import { legalDocs, legalSlugs, type LegalBlock, type LegalDoc } from "@/data/legal";
import { formatDate } from "@/lib/format";
import { tr } from "@/lib/l10n";
import type { L10n } from "@/data/types";
import { Icon } from "./Icon";
import styles from "./LegalPage.module.css";

// Uchta yuridik sahifa uchun yagona shablon (TZ §4.9): banner + sanalar · yon mundarija ·
// raqamlangan bo'limlar · "yuqoriga" · boshqa hujjatlarga havolalar.

function Block({ block, T }: { block: LegalBlock; T: (v: L10n) => string }) {
  if (block.kind === "p") return <p>{T(block.text)}</p>;
  if (block.kind === "list") {
    return (
      <ul>
        {block.items.map((item) => (
          <li key={item.uz}>{T(item)}</li>
        ))}
      </ul>
    );
  }
  return (
    <div className="table-wrap">
      <table className="table">
        <caption className="sr-only">{T(block.caption)}</caption>
        <thead>
          <tr>
            {block.head.map((cell) => (
              <th key={cell.uz} scope="col">
                {T(cell)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map(([period, fee]) => (
            <tr key={period.uz}>
              <th scope="row" className={styles.rowHead}>
                {T(period)}
              </th>
              <td>{T(fee)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export async function LegalPage({ doc, locale }: { doc: LegalDoc; locale: Locale }) {
  const t = await getTranslations("legal");
  const tc = await getTranslations("common");
  const settings = await getSettings();
  const T = (v: L10n): string => fillLegal(tr(v, locale), settings);
  const title = T(doc.title);
  const others = legalSlugs.filter((slug) => slug !== doc.slug).map((slug) => legalDocs[slug]);

  return (
    <>
      <section className="page-banner">
        <div className="container container--md page-banner__inner">
          <nav className="breadcrumb breadcrumb--light" aria-label={tc("nav.breadcrumb")}>
            <Link href="/">{tc("nav.home")}</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{title}</span>
          </nav>
          <h1>{title}</h1>
          <dl className={styles.dates}>
            <div>
              <dt>{t("effective")}</dt>
              <dd>
                <time dateTime={doc.effective}>{formatDate(doc.effective, locale)}</time>
              </dd>
            </div>
            <div>
              <dt>{t("updated")}</dt>
              <dd>
                <time dateTime={doc.updated}>{formatDate(doc.updated, locale)}</time>
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <div className={`container container--md ${styles.layout}`}>
        <nav className={styles.toc} aria-labelledby="legal-toc-title">
          <h2 id="legal-toc-title" className={styles.tocTitle}>
            {t("toc")}
          </h2>
          <ol className={styles.tocList}>
            {doc.sections.map((section, i) => (
              <li key={section.id}>
                <a href={`#${section.id}`}>
                  <span className={styles.tocNum}>{i + 1}.</span>
                  <span>{T(section.title)}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <article className={styles.body}>
          <div className="prose">
            {settings.licenseNo === null && (
              <p className={`notice notice--info ${styles.notice}`}>
                <Icon icon={Info} size={18} />
                <span>{t("pendingNotice")}</span>
              </p>
            )}
            <p className={styles.intro}>{T(doc.intro)}</p>

            {doc.sections.map((section, i) => (
              <section key={section.id} aria-labelledby={section.id} className={styles.section}>
                <h2 id={section.id}>
                  <span className={styles.num}>{i + 1}.</span> {T(section.title)}
                </h2>
                {section.blocks.map((block, j) => (
                  <Block key={j} block={block} T={T} />
                ))}
              </section>
            ))}
          </div>

          <a href="#main" className={styles.top}>
            <Icon icon={ArrowUp} size={16} />
            <span>{tc("actions.backToTop")}</span>
          </a>

          <aside className={styles.others} aria-labelledby="legal-others-title">
            <h2 id="legal-others-title" className={styles.othersTitle}>
              {t("otherDocs")}
            </h2>
            <ul className={styles.othersList}>
              {others.map((other) => (
                <li key={other.slug}>
                  <Link href={`/${other.slug}`} className={styles.other}>
                    <span>{T(other.title)}</span>
                    <Icon icon={ArrowRight} size={16} />
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        </article>
      </div>
    </>
  );
}
