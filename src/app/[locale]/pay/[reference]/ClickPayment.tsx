"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, Check, Clock, CreditCard, Download, LoaderCircle, RotateCw, ShieldCheck, Smartphone, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getTour } from "@/data/tours";
import { site } from "@/config/site";
import { Icon } from "@/components/Icon";
import { Logo } from "@/components/Brand";
import { formatDate, formatDateRange, money } from "@/lib/format";
import { tr } from "@/lib/l10n";
import { loadBooking, type Traveler } from "@/lib/booking-store";
import { clockTime, formatCountdown, localIsoDate } from "@/lib/payment";
import type { PublicStatus } from "@/lib/orders";
import styles from "./pay.module.css";

// Haqiqiy to'lov: Click (https://docs.click.uz). Karta ma'lumotlari faqat Click sahifasida/oynasida
// kiritiladi — bu komponent va bizning server ularni hech qachon ko'rmaydi.
// "To'landi" holati FAQAT serverdan keladi (Click → /api/click/complete → bron fayli); brauzerga ishonilmaydi.

export interface OrderView {
  status: PublicStatus;
  amountUzs: number;
  holdUntil: number;
  paidAt: number | null;
  paydocId: string | null;
  tourSlug: string;
  departureId: string;
  adults: number;
  children: number;
}

export interface ClickPublicConfig {
  serviceId: string;
  merchantId: string;
  merchantUserId: string | null;
}

const CHECKOUT_SRC = "https://my.click.uz/pay/checkout.js";
const POLL_MS = 3000;
const POLL_LIMIT_MS = 2 * 60 * 1000;

type ClickCheckoutData = { status: number };
declare global {
  interface Window {
    createPaymentRequest?: (params: Record<string, string>, callback: (data: ClickCheckoutData) => void) => void;
  }
}

let checkoutPromise: Promise<void> | null = null;
/** Click oynasi skripti faqat "Karta bilan to'lash" bosilganda yuklanadi. */
function loadCheckout(): Promise<void> {
  if (window.createPaymentRequest) return Promise.resolve();
  checkoutPromise ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = CHECKOUT_SRC;
    script.async = true;
    script.onload = () => (window.createPaymentRequest ? resolve() : reject(new Error("no createPaymentRequest")));
    script.onerror = () => reject(new Error("checkout.js failed to load"));
    document.head.appendChild(script);
  }).catch((err) => {
    checkoutPromise = null; // keyingi bosishda qayta urinib ko'radi
    throw err;
  });
  return checkoutPromise;
}

/** Click sahifasiga o'tish havolasi (https://docs.click.uz/click-button). */
export function clickPayUrl(config: ClickPublicConfig, reference: string, amountUzs: number, returnUrl: string): string {
  const params = new URLSearchParams({
    service_id: config.serviceId,
    merchant_id: config.merchantId,
    amount: String(amountUzs),
    transaction_param: reference,
    return_url: returnUrl,
  });
  if (config.merchantUserId) params.set("merchant_user_id", config.merchantUserId);
  return `https://my.click.uz/services/pay?${params}`;
}

type Mode = "idle" | "checking" | "pending";

export function ClickPayment({
  reference,
  order: initial,
  click,
  payToken,
  returnUrl,
  returned,
}: {
  reference: string;
  order: OrderView | null;
  click: ClickPublicConfig;
  /** Holat endpoint'i uchun kalit (`?k=`); bron topilmasa null. */
  payToken: string | null;
  returnUrl: string;
  /** Click sahifasidan qaytildi (`?return=1`) — darhol holatni tekshiramiz. */
  returned: boolean;
}) {
  const t = useTranslations("payment");
  const locale = useLocale() as Locale;

  const [order, setOrder] = useState(initial);
  const [now, setNow] = useState<number | null>(null);
  const [mode, setMode] = useState<Mode>(returned && initial?.status === "awaiting" ? "checking" : "idle");
  const [widgetError, setWidgetError] = useState<"load" | "failed" | null>(null);
  const [opening, setOpening] = useState(false);
  const pollUntil = useRef(0);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Sayohatchilar ro'yxati (vaucher uchun) faqat shu brauzerda bo'ladi; bo'lmasa vaucher ismlarsiz.
  // Mount'dan keyin o'qiladi — server HTML'i bilan farq (hydration mismatch) bo'lmasin.
  const [travelers, setTravelers] = useState<Traveler[] | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = window.setTimeout(() => {
      tick();
      setTravelers(loadBooking(reference)?.travelers ?? null);
    }, 0);
    const timer = window.setInterval(tick, 1000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, [reference]);

  const refresh = useCallback(async () => {
    try {
      if (!payToken) return;
      const res = await fetch(`/api/payment/${reference}?k=${encodeURIComponent(payToken)}`, { cache: "no-store" });
      if (!res.ok) return;
      const body = (await res.json()) as { status?: PublicStatus; paidAt?: number | null };
      if (!body.status) return;
      setOrder((o) => (o ? { ...o, status: body.status!, paidAt: body.paidAt ?? o.paidAt } : o));
    } catch {
      // tarmoq xatosi — keyingi so'rovda qayta urinadi
    }
  }, [reference, payToken]);

  // Tekshirish rejimi: har 3 soniyada server holatini so'raymiz, 2 daqiqadan keyin "hali tasdiqlanmadi".
  useEffect(() => {
    if (mode !== "checking" || order?.status !== "awaiting") return;
    if (pollUntil.current === 0) pollUntil.current = Date.now() + POLL_LIMIT_MS; // ?return=1 bilan ochilganda
    const timer = window.setInterval(() => {
      if (Date.now() > pollUntil.current) {
        setMode("pending");
        return;
      }
      void refresh();
    }, POLL_MS);
    const first = window.setTimeout(() => void refresh(), 0); // birinchi so'rov darhol
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, [mode, order?.status, refresh]);

  // Kalitsiz ochildi (Click return_url'dagi `?k=` ni tushirib qoldirgan yoki tarixdan ochilgan) —
  // shu brauzerda bron bo'lsa, kalit bilan qayta ochamiz.
  useEffect(() => {
    if (initial || payToken) return;
    const stored = loadBooking(reference)?.payToken;
    const url = new URL(window.location.href);
    if (stored && !url.searchParams.get("k")) {
      url.searchParams.set("k", stored);
      url.searchParams.set("return", "1");
      window.location.replace(url.toString());
    }
  }, [initial, payToken, reference]);

  const startChecking = () => {
    pollUntil.current = Date.now() + POLL_LIMIT_MS;
    setMode("checking");
  };

  const status = order?.status;
  useEffect(() => {
    if (status && status !== "awaiting") headingRef.current?.focus();
  }, [status]);

  const tour = order ? getTour(order.tourSlug, "0000-00-00") : undefined; // o'tgan sana bo'lsa ham topilsin
  const departure = order && tour ? tour.departures.find((d) => d.id === order.departureId) : undefined;

  const head = (timer: React.ReactNode) => (
    <section className={styles.head}>
      <div className={styles.headInner}>
        <div>
          <h1 className={styles.h1}>{t("h1")}</h1>
          <p className={styles.ref}>
            <span>{t("bookingNo")}</span>
            <span className={styles.refId}>{reference}</span>
          </p>
        </div>
        {timer}
      </div>
    </section>
  );

  if (!order || !tour || !departure) {
    return (
      <div className={styles.page}>
        {head(null)}
        <div className={styles.cols}>
          <section className={`${styles.section} ${styles.sectionResult}`}>
            <div className={styles.result}>
              <span className={styles.resultIcon}>
                <Icon icon={X} size={28} strokeWidth={2.4} />
              </span>
              <div className={styles.resultText}>
                <h2 className={styles.resultTitle}>{t("notFound.title")}</h2>
                <p className={styles.resultBody}>{t("click.notFound", { id: reference })}</p>
              </div>
            </div>
            <div className={styles.todo}>
              <span className={styles.todoLabel}>{t("result.whatToDo")}</span>
              <ul className={styles.list}>
                {(["step2", "step3"] as const).map((key) => (
                  <li key={key}>
                    <Icon icon={ArrowRight} size={16} strokeWidth={2} />
                    <span>{t(`notFound.${key}`)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className={styles.resultActions}>
              <Link href="/tours" className={`btn btn--primary ${styles.cta} ${styles.ctaBold}`}>
                <span>{t("notFound.cta")}</span>
                <Icon icon={ArrowRight} size={16} />
              </Link>
              <Link href="/contact" className={`btn btn--secondary ${styles.cta} ${styles.outline}`}>
                {t("actions.manager")}
              </Link>
            </div>
          </section>
        </div>
      </div>
    );
  }

  const amount = money(order.amountUzs, locale);
  const title = tr(tour.title, locale);
  const range = formatDateRange(departure.from, departure.to, locale);
  const pax = order.adults + order.children;
  const paid = order.status === "paid";
  const remaining = now === null ? null : order.holdUntil - now;
  // Taymer tugadi va to'lov boshlanmagan — yangi to'lov ochilmaydi (server ham qabul qilmaydi).
  const closed =
    order.status === "expired" ||
    order.status === "cancelled" ||
    (!paid && mode === "idle" && remaining !== null && remaining <= 0);
  const paidAt = order.paidAt ?? now ?? order.holdUntil;
  const paidAtLabel = `${formatDate(localIsoDate(paidAt), locale)} · ${clockTime(paidAt)}`;
  const payUrl = clickPayUrl(click, reference, order.amountUzs, returnUrl);

  const payByCard = async () => {
    setWidgetError(null);
    setOpening(true);
    try {
      await loadCheckout();
    } catch {
      setOpening(false);
      setWidgetError("load");
      return;
    }
    setOpening(false);
    const params: Record<string, string> = {
      service_id: click.serviceId,
      merchant_id: click.merchantId,
      amount: String(order.amountUzs),
      transaction_param: reference,
    };
    if (click.merchantUserId) params.merchant_user_id = click.merchantUserId;
    window.createPaymentRequest?.(params, (data) => {
      // status: <0 xato · 0 yaratildi · 1 jarayonda · 2 muvaffaqiyatli (yakuniy so'z — serverda)
      if (data.status < 0) setWidgetError("failed");
      else if (data.status > 0) startChecking();
    });
  };

  const showTimer = !paid && !closed && remaining !== null;

  return (
    <div className={styles.page}>
      {head(
        showTimer && (
          <div className={styles.hold}>
            <Icon icon={Clock} size={17} strokeWidth={1.9} />
            <span className={styles.holdText}>
              <span className={styles.holdLabel}>{t("hold")}</span>
              <span className={styles.timer} role="timer" aria-label={t("holdAria", { time: formatCountdown(remaining ?? 0) })}>
                {formatCountdown(remaining ?? 0)}
              </span>
            </span>
          </div>
        ),
      )}

      <div className={styles.cols} data-side="1">
        <div className={styles.main}>
          {!paid && !closed && mode === "idle" && (
            <section className={styles.section}>
              <div>
                <h2 ref={headingRef} tabIndex={-1} className={styles.h2}>
                  {t("method.title")}
                </h2>
                <p className={styles.lead}>{t("click.lead")}</p>
              </div>

              <div className={styles.methods}>
                <div className={styles.payOption}>
                  <span className={styles.methodTag}>CLICK</span>
                  <span className={styles.methodName}>{t("click.app.name")}</span>
                  <span className={styles.methodNote}>{t("click.app.note")}</span>
                  <a href={payUrl} className={`btn btn--accent ${styles.optionBtn}`}>
                    <Icon icon={Smartphone} size={17} />
                    <span>{t("click.app.cta")}</span>
                  </a>
                </div>
                <div className={styles.payOption}>
                  <span className={styles.methodTag}>UZCARD · HUMO</span>
                  <span className={styles.methodName}>{t("click.card.name")}</span>
                  <span className={styles.methodNote}>{t("click.card.note")}</span>
                  <button
                    type="button"
                    className={`btn btn--primary ${styles.optionBtn}`}
                    onClick={() => void payByCard()}
                    aria-busy={opening || undefined}
                    disabled={opening}
                  >
                    <Icon icon={opening ? LoaderCircle : CreditCard} size={17} className={opening ? styles.spin : undefined} />
                    <span>{t("click.card.cta")}</span>
                  </button>
                </div>
              </div>

              {widgetError && (
                <p className="notice notice--error" role="alert">
                  <Icon icon={X} size={17} strokeWidth={2} style={{ marginTop: 2 }} />
                  <span>{t(widgetError === "load" ? "click.loadError" : "click.failed")}</span>
                </p>
              )}

              <div className={styles.trust}>
                <span>
                  <Icon icon={ShieldCheck} size={15} />
                  <span>{t("click.trust")}</span>
                </span>
                <span>
                  <Icon icon={Check} size={15} />
                  <span>{t("click.amountFixed", { amount })}</span>
                </span>
              </div>
            </section>
          )}

          {!paid && !closed && mode !== "idle" && (
            <section className={`${styles.section} ${styles.sectionResult}`}>
              <div className={styles.result}>
                <span className={styles.resultIcon}>
                  <Icon
                    icon={mode === "checking" ? LoaderCircle : Clock}
                    size={28}
                    strokeWidth={2.2}
                    className={mode === "checking" ? styles.spin : undefined}
                  />
                </span>
                <div className={styles.resultText} role="status">
                  <h2 ref={headingRef} tabIndex={-1} className={styles.resultTitle}>
                    {t(mode === "checking" ? "click.checking.title" : "click.pending.title")}
                  </h2>
                  <p className={styles.resultBody}>
                    {t(mode === "checking" ? "click.checking.text" : "click.pending.text")}
                  </p>
                </div>
              </div>
              {mode === "pending" && (
                <div className={styles.resultActions}>
                  <button type="button" className={`btn btn--primary ${styles.cta} ${styles.ctaBold}`} onClick={startChecking}>
                    <Icon icon={RotateCw} size={16} strokeWidth={1.9} />
                    <span>{t("click.pending.recheck")}</span>
                  </button>
                  <button
                    type="button"
                    className={`btn btn--secondary ${styles.cta} ${styles.outline}`}
                    onClick={() => setMode("idle")}
                  >
                    {t("actions.retry")}
                  </button>
                  <Link href="/contact" className={`btn btn--secondary ${styles.cta} ${styles.outline}`}>
                    {t("actions.manager")}
                  </Link>
                </div>
              )}
            </section>
          )}

          {paid && (
            <section className={`${styles.section} ${styles.sectionResult}`}>
              <div className={styles.result} data-ok="1">
                <span className={styles.resultIcon}>
                  <Icon icon={Check} size={28} strokeWidth={2.4} />
                </span>
                <div className={styles.resultText}>
                  <h2 ref={headingRef} tabIndex={-1} className={styles.resultTitle}>
                    {t("result.success.title")}
                  </h2>
                  <p className={styles.resultBody}>{t("click.successText")}</p>
                </div>
              </div>

              <div className={styles.receipt}>
                <h3 className={styles.h3}>{t("receipt.title")}</h3>
                <dl className={styles.dl}>
                  <div>
                    <dt>{t("receipt.amount")}</dt>
                    <dd>{amount}</dd>
                  </div>
                  <div>
                    <dt>{t("receipt.method")}</dt>
                    <dd>Click</dd>
                  </div>
                  {order.paydocId && (
                    <div>
                      <dt>{t("receipt.transaction")}</dt>
                      <dd>{order.paydocId}</dd>
                    </div>
                  )}
                  <div>
                    <dt>{t("receipt.datetime")}</dt>
                    <dd>{paidAtLabel}</dd>
                  </div>
                </dl>
                <div className={styles.receiptActions}>
                  <button type="button" className={`btn btn--primary ${styles.receiptBtn}`} onClick={() => window.print()}>
                    <Icon icon={Download} size={16} />
                    <span>{t("receipt.voucher")}</span>
                  </button>
                  <Link href="/" className={`btn btn--secondary ${styles.receiptBtn} ${styles.outline}`}>
                    {t("receipt.home")}
                  </Link>
                </div>
              </div>
            </section>
          )}

          {closed && (
            <section className={`${styles.section} ${styles.sectionResult}`}>
              <div className={styles.result}>
                <span className={styles.resultIcon}>
                  <Icon icon={X} size={28} strokeWidth={2.4} />
                </span>
                <div className={styles.resultText}>
                  <h2 ref={headingRef} tabIndex={-1} className={styles.resultTitle}>
                    {t("result.expired.title")}
                  </h2>
                  <p className={styles.resultBody}>{t("result.expired.text")}</p>
                </div>
              </div>
              <div className={styles.todo}>
                <span className={styles.todoLabel}>{t("result.whatToDo")}</span>
                <ul className={styles.list}>
                  {[t("result.steps.pickDate"), t("result.steps.manager")].map((text) => (
                    <li key={text}>
                      <Icon icon={ArrowRight} size={16} strokeWidth={2} />
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className={styles.resultActions}>
                <Link href={`/book/${tour.slug}`} className={`btn btn--primary ${styles.cta} ${styles.ctaBold}`}>
                  <Icon icon={RotateCw} size={16} strokeWidth={1.9} />
                  <span>{t("actions.pickDate")}</span>
                </Link>
                <Link href="/contact" className={`btn btn--secondary ${styles.cta} ${styles.outline}`}>
                  {t("actions.manager")}
                </Link>
              </div>
            </section>
          )}
        </div>

        <aside className={styles.side} aria-label={t("summary.aria")}>
          <div className={styles.summary}>
            <div className={styles.summaryHead}>
              <span className={styles.dueLabel}>{t(paid ? "click.paidLabel" : "summary.due")}</span>
              <span className={styles.dueValue}>{amount}</span>
            </div>
            <div className={styles.summaryBody}>
              <span className={styles.row}>
                <span>{t("summary.tour")}</span>
                <span>{title}</span>
              </span>
              <span className={styles.row}>
                <span>{t("summary.date")}</span>
                <span>{range}</span>
              </span>
              <span className={styles.row}>
                <span>{t("summary.travellers")}</span>
                <span>{t("summary.people", { count: pax })}</span>
              </span>
              <span className={styles.row}>
                <span>{t("summary.bookingNo")}</span>
                <span>{reference}</span>
              </span>
              <span className={styles.cards}>
                <Icon icon={CreditCard} size={15} />
                <span>{t("click.cards")}</span>
              </span>
            </div>
          </div>
        </aside>
      </div>

      {/* Chop etish uchun vaucher — ekranda ko'rinmaydi, faqat `@media print` da. */}
      {paid && (
        <div className={styles.voucher} aria-hidden="true">
          <div className={styles.voucherHead}>
            <div>
              <Logo emblem={34} size={17} />
              <h2 className={styles.voucherTitle}>{t("voucher.title")}</h2>
            </div>
          </div>
          <dl className={styles.voucherGrid}>
            <div>
              <dt>{t("voucher.bookingNo")}</dt>
              <dd>{reference}</dd>
            </div>
            <div>
              <dt>{t("voucher.tour")}</dt>
              <dd>{title}</dd>
            </div>
            <div>
              <dt>{t("voucher.dates")}</dt>
              <dd>{range}</dd>
            </div>
            <div>
              <dt>{t("voucher.amount")}</dt>
              <dd>{amount}</dd>
            </div>
            <div>
              <dt>{t("voucher.paidAt")}</dt>
              <dd>{paidAtLabel}</dd>
            </div>
            {order.paydocId && (
              <div>
                <dt>{t("voucher.transaction")}</dt>
                <dd>{order.paydocId}</dd>
              </div>
            )}
          </dl>
          {travelers && travelers.length > 0 && (
            <>
              <p className={styles.voucherLabel}>{t("voucher.travellers")}</p>
              <table className={styles.voucherTable}>
                <tbody>
                  {travelers.map((person, i) => (
                    <tr key={i}>
                      <td>
                        {i + 1}. {person.lastName} {person.firstName}
                      </td>
                      <td>
                        {i < order.adults ? t("voucher.adult") : t("voucher.child")} · {formatDate(person.birthDate, locale)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
          <p className={styles.voucherFoot}>
            {t("voucher.contact")}: {site.name} · {site.domain} · {site.email}
            {site.phone ? ` · ${site.phone}` : ""}
          </p>
        </div>
      )}
    </div>
  );
}
