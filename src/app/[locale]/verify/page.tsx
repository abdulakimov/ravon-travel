import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BadgeCheck, SearchX } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { getTour } from "@/data/tours";
import { Icon } from "@/components/Icon";
import { BOOKING_ID_RE } from "@/lib/booking-constants";
import { formatDate, formatDateRange, money } from "@/lib/format";
import { tr } from "@/lib/l10n";
import { formatVerifyCode, readOrder, verifyMatches } from "@/lib/orders";
import styles from "./verify.module.css";

// Chek haqiqiyligini tekshirish: chekdagi QR shu sahifani `?id=<bron>&c=<kod>` bilan ochadi,
// yoki bron raqami va kod qo'lda kiritiladi. Faqat serverdagi ma'lumot ko'rsatiladi — chekdagi
// matnni soxtalashtirib bo'lmaydi. Noto'g'ri kod, noma'lum yoki to'lanmagan bron — bir xil javob.

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return { robots: { index: false } };
  const t = await getTranslations({ locale, namespace: "verify" });
  return { title: t("meta.title"), robots: { index: false, follow: false } };
}

const one = (v: string | string[] | undefined) => (typeof v === "string" ? v.trim().slice(0, 40) : "");

/** To'lov vaqti Toshkent bo'yicha (server soat mintaqasidan qat'i nazar). */
function tashkent(ms: number): { date: string; time: string } {
  const d = new Date(ms);
  return {
    date: new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tashkent" }).format(d),
    time: new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Tashkent", hour: "2-digit", minute: "2-digit" }).format(d),
  };
}

export default async function VerifyPage({ params, searchParams }: Props) {
  const { locale: raw } = await params;
  if (!hasLocale(routing.locales, raw)) notFound();
  const locale = raw as Locale;
  setRequestLocale(locale);
  const t = await getTranslations("verify");
  const tc = await getTranslations("common");

  const query = await searchParams;
  const id = one(query.id).toUpperCase();
  const code = one(query.c);
  const asked = id !== "" || code !== "";

  const order = BOOKING_ID_RE.test(id) ? await readOrder(id).catch(() => null) : null;
  const valid = order !== null && verifyMatches(order, code);
  const tour = valid ? getTour(order.tourSlug, "0000-00-00") : undefined;
  const departure = tour?.departures.find((d) => d.id === order?.departureId);
  const paid = valid && order.paidAt ? tashkent(order.paidAt) : null;
  const paydoc = valid ? order.transactions.find((x) => x.status === "confirmed")?.clickPaydocId : undefined;

  return (
    <>
      <section className="page-banner">
        <div className="container container--md page-banner__inner">
          <nav className="breadcrumb breadcrumb--light" aria-label={tc("nav.breadcrumb")}>
            <Link href="/">{tc("nav.home")}</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{t("meta.title")}</span>
          </nav>
          <h1>{t("banner.title")}</h1>
          <p>{t("banner.lead")}</p>
        </div>
      </section>

      <div className={`container container--md ${styles.wrap}`}>
        {asked && valid && order && (
          <section className={styles.result} data-ok="1" aria-labelledby="verify-result">
            <div className={styles.resultHead}>
              <Icon icon={BadgeCheck} size={30} strokeWidth={2} />
              <div>
                <h2 id="verify-result">{t("valid.title")}</h2>
                <p>{t("valid.text")}</p>
              </div>
            </div>
            <dl className={styles.dl}>
              <div>
                <dt>{t("fields.bookingNo")}</dt>
                <dd>{order.id}</dd>
              </div>
              <div>
                <dt>{t("fields.code")}</dt>
                <dd className={styles.mono}>{formatVerifyCode(order.verifyCode ?? "")}</dd>
              </div>
              {tour && (
                <div>
                  <dt>{t("fields.tour")}</dt>
                  <dd>{tr(tour.title, locale)}</dd>
                </div>
              )}
              {departure && (
                <div>
                  <dt>{t("fields.dates")}</dt>
                  <dd>{formatDateRange(departure.from, departure.to, locale)}</dd>
                </div>
              )}
              <div>
                <dt>{t("fields.amount")}</dt>
                <dd>{money(order.amountUzs, locale)}</dd>
              </div>
              {paid && (
                <div>
                  <dt>{t("fields.paidAt")}</dt>
                  <dd>
                    {formatDate(paid.date, locale)} · {paid.time}
                  </dd>
                </div>
              )}
              <div>
                <dt>{t("fields.method")}</dt>
                <dd>
                  Click{paydoc ? ` · ${paydoc}` : ""}
                </dd>
              </div>
              <div>
                <dt>{t("fields.travellers")}</dt>
                <dd>
                  {order.travelers && order.travelers.length > 0 ? (
                    <ol className={styles.people}>
                      {order.travelers.map((name, i) => (
                        <li key={i}>
                          {name} <span>· {i < order.adults ? t("adult") : t("child")}</span>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    t("people", { count: order.adults + order.children })
                  )}
                </dd>
              </div>
            </dl>
            <p className={styles.note}>{t("valid.note")}</p>
          </section>
        )}

        {asked && !valid && (
          <section className={styles.result} aria-labelledby="verify-result">
            <div className={styles.resultHead}>
              <Icon icon={SearchX} size={30} strokeWidth={2} />
              <div>
                <h2 id="verify-result">{t("invalid.title")}</h2>
                <p>{t("invalid.text")}</p>
              </div>
            </div>
          </section>
        )}

        <form method="get" className={styles.form} aria-label={t("form.aria")}>
          <h2 className={styles.formTitle}>{asked ? t("form.again") : t("form.title")}</h2>
          <div className={styles.fields}>
            <div className="field">
              <label className="field__label" htmlFor="verify-id">
                {t("form.id")}
              </label>
              <input
                id="verify-id"
                name="id"
                className="input input--mono"
                placeholder="RV-2026-12345"
                defaultValue={asked && !valid ? id : ""}
                required
                pattern="[Rr][Vv]-\d{4}-\d{5}"
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="verify-code">
                {t("form.code")}
              </label>
              <input
                id="verify-code"
                name="c"
                className="input input--mono"
                placeholder="XXXX-XXXX-XXXX"
                defaultValue={asked && !valid ? code : ""}
                required
                autoComplete="off"
                spellCheck={false}
                autoCapitalize="characters"
              />
            </div>
          </div>
          <button type="submit" className="btn btn--primary">
            {t("form.submit")}
          </button>
          <p className={styles.hint}>{t("form.hint")}</p>
        </form>
      </div>
    </>
  );
}
