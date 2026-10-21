"use client";

import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleAlert,
  Clock,
  CreditCard,
  Download,
  FileText,
  Lock,
  RotateCw,
  ShieldCheck,
  TriangleAlert,
  X,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getTour } from "@/data/tours";
import { site } from "@/config/site";
import { Icon } from "@/components/Icon";
import { Logo } from "@/components/Brand";
import { formatDate, formatDateRange, money } from "@/lib/format";
import { tr } from "@/lib/l10n";
import { loadBooking, updateBooking } from "@/lib/booking-store";
import { formatUzPhone, phoneError } from "@/lib/booking-validate";
import {
  DEMO_CARD,
  DEMO_CODES,
  OTP_LENGTH,
  OTP_TTL_MS,
  PAYMENT_METHODS,
  RESEND_COOLDOWN_MS,
  cardNumberError,
  clockTime,
  demoOutcome,
  expiryError,
  formatCardNumber,
  formatCountdown,
  formatExpiry,
  formatOtp,
  lastFour,
  localIsoDate,
  newTransactionId,
  type PaymentMethod,
} from "@/lib/payment";
import styles from "./pay.module.css";

// ── Bron holatiga obuna ────────────────────────────────────────────────────
// sessionStorage o'zgarishi shu oynada hodisa bermaydi, shuning uchun har yozuvdan keyin
// versiya oshiriladi. Serverda va hydration paytida -1 → skeleton (hydration mismatch bo'lmaydi).
let storeVersion = 0;
const storeListeners = new Set<() => void>();
const subscribeStore = (listener: () => void) => {
  storeListeners.add(listener);
  return () => {
    storeListeners.delete(listener);
  };
};
const getStoreVersion = () => storeVersion;
const getServerVersion = () => -1;
const notifyStore = () => {
  storeVersion += 1;
  storeListeners.forEach((listener) => listener());
};

const METHOD_TAG: Record<PaymentMethod, string> = { humo: "HUMO · UZCARD", visa: "VISA · MC", bank: "B2B" };

type OtpError = "otp_incomplete" | "otp_invalid" | "otp_expired";
type Failure = "declined" | "error";
type View = "loading" | "missing" | "card" | "otp" | "success" | "declined" | "expired" | "error";

function InlineError({
  id,
  children,
  className = "",
  alert = false,
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
  alert?: boolean;
}) {
  return (
    <span id={id} className={`${styles.inlineError} ${className}`} role={alert ? "alert" : undefined}>
      <Icon icon={CircleAlert} size={16} strokeWidth={2} />
      <span>{children}</span>
    </span>
  );
}

export function PaymentFlow({ reference }: { reference: string }) {
  const t = useTranslations("payment");
  const locale = useLocale() as Locale;
  const uid = useId();

  const version = useSyncExternalStore(subscribeStore, getStoreVersion, getServerVersion);
  // undefined — hali o'qilmagan (SSR / hydration); null — topilmadi.
  const booking = useMemo(() => (version < 0 ? undefined : loadBooking(reference)), [version, reference]);

  // Joriy vaqt faqat mount'dan keyin (interval ichida) o'rnatiladi.
  const [now, setNow] = useState<number | null>(null);

  // DIQQAT: karta raqami, muddat va SMS kod FAQAT shu komponent holatida (xotirada) yashaydi.
  // Ular sessionStorage/localStorage/URL/log'ga yozilmaydi, tarmoqqa yuborilmaydi va komponent
  // yo'q bo'lganda (unmount) holat bilan birga yo'qoladi; muvaffaqiyatli to'lovdan keyin darhol tozalanadi.
  const [method, setMethod] = useState<PaymentMethod>("humo");
  const [card, setCard] = useState("");
  const [expiry, setExpiry] = useState("");
  const [code, setCode] = useState("");
  const [phoneInput, setPhoneInput] = useState<string | null>(null);
  const [cardLastFour, setCardLastFour] = useState("");

  const [stage, setStage] = useState<1 | 2>(1);
  const [attempted, setAttempted] = useState(false);
  const [otpError, setOtpError] = useState<OtpError | null>(null);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [codeSentAt, setCodeSentAt] = useState<number | null>(null);
  const [resent, setResent] = useState(false);

  const headingRef = useRef<HTMLHeadingElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const previousView = useRef<View>("loading");

  // Soat: har soniyada yangilanadi; muddat tugasa bron `expired` qilinadi.
  useEffect(() => {
    const tick = () => {
      const current = Date.now();
      setNow(current);
      const stored = loadBooking(reference);
      if (stored && stored.status === "held" && current >= stored.holdUntil) {
        updateBooking(reference, { status: "expired" });
        notifyStore();
      }
    };
    const first = window.setTimeout(tick, 0);
    const timer = window.setInterval(tick, 1000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, [reference]);

  const tour = booking ? getTour(booking.tourSlug, "0000-00-00") /* bron qilingan sana o'tib ketgan bo'lsa ham topilsin */ : undefined;
  const departure = booking && tour ? tour.departures.find((d) => d.id === booking.departureId) : undefined;

  let view: View;
  if (booking === undefined || now === null) view = "loading";
  else if (booking === null || !tour || !departure) view = "missing";
  else if (booking.status === "paid") view = "success";
  else if (booking.status !== "held" || now >= booking.holdUntil) view = "expired";
  else if (failure) view = failure;
  else view = stage === 1 ? "card" : "otp";

  // Bosqich/holat almashganda fokus yangi sarlavhaga o'tadi (birinchi yuklanishdan tashqari).
  useEffect(() => {
    if (previousView.current !== view && previousView.current !== "loading") headingRef.current?.focus();
    previousView.current = view;
  }, [view]);

  // Sarlavha, bosqichlar va taymer bitta qatorda — sahifa noutbuk ekraniga to'liq sig'sin.
  const head = (timer: React.ReactNode, stages: React.ReactNode = null) => (
    <section className={styles.head}>
      <div className={styles.headInner}>
        <div>
          <h1 className={styles.h1}>{t("h1")}</h1>
          <p className={styles.ref}>
            <span>{t("bookingNo")}</span>
            <span className={styles.refId}>{reference}</span>
          </p>
        </div>
        {stages}
        {timer}
      </div>
    </section>
  );

  if (view === "loading") {
    return (
      <div className={styles.page}>
        {head(null)}
        <div className={styles.cols}>
          <div className={styles.skeleton} role="status">
            <span />
            <span />
            <span />
            <span className="sr-only">{t("loading")}</span>
          </div>
        </div>
      </div>
    );
  }

  if (view === "missing" || !booking || !tour || !departure || now === null) {
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
                <p className={styles.resultBody}>{t("notFound.text", { id: reference })}</p>
              </div>
            </div>
            <div className={styles.todo}>
              <span className={styles.todoLabel}>{t("result.whatToDo")}</span>
              <ul className={styles.list}>
                {(["step1", "step2", "step3"] as const).map((key) => (
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

  // ── Bu yerdan boshlab bron mavjud ─────────────────────────────────────────
  const remaining = booking.holdUntil - now;
  const title = tr(tour.title, locale);
  const range = formatDateRange(departure.from, departure.to, locale);
  const pax = booking.adults + booking.children;
  const amount = money(booking.totalUzs, locale);
  const phone = phoneInput ?? booking.phone;

  const today = new Date(now);
  const cardErr = cardNumberError(card);
  const expiryErr = expiryError(expiry, { year: today.getFullYear(), month: today.getMonth() + 1 });
  const phoneErr = phoneError(phone);
  const cardValid = !cardErr && !expiryErr && !phoneErr;

  // `now` soniyada bir yangilanadi va `codeSentAt` dan biroz orqada qolishi mumkin — shuning uchun yuqoridan cheklanadi.
  const cooldown =
    codeSentAt === null
      ? 0
      : Math.min(RESEND_COOLDOWN_MS / 1000, Math.max(0, Math.ceil((codeSentAt + RESEND_COOLDOWN_MS - now) / 1000)));
  const done = view === "success" || view === "declined" || view === "expired" || view === "error";
  const isBank = method === "bank";

  const focusFirstInvalid = () => {
    requestAnimationFrame(() => {
      formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
    });
  };

  const submitCard = () => {
    setAttempted(true);
    if (!cardValid) {
      focusFirstInvalid();
      return;
    }
    setCode("");
    setOtpError(null);
    setResent(false);
    setCodeSentAt(Date.now());
    setStage(2);
  };

  const confirmCode = () => {
    if (code.length < OTP_LENGTH) {
      setOtpError("otp_incomplete");
      return;
    }
    const current = Date.now();
    if (current >= booking.holdUntil) {
      updateBooking(reference, { status: "expired" });
      notifyStore();
      return;
    }
    if (codeSentAt !== null && current - codeSentAt > OTP_TTL_MS) {
      setCode("");
      setOtpError("otp_expired");
      return;
    }
    const outcome = demoOutcome(code);
    if (outcome === "otp_invalid") {
      setOtpError("otp_invalid");
      return;
    }
    if (outcome === "success") {
      // Bronga faqat usul nomi, tranzaksiya raqami va vaqt yoziladi — karta ma'lumoti EMAS.
      updateBooking(reference, {
        status: "paid",
        payment: { method, transactionId: newTransactionId(), paidAt: current },
      });
      setCardLastFour(lastFour(card));
      setCard("");
      setExpiry("");
      setCode("");
      notifyStore();
      return;
    }
    setCode("");
    setFailure(outcome);
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (view === "card" && !isBank) submitCard();
    else if (view === "otp") confirmCode();
  };

  const resend = () => {
    setCode("");
    setOtpError(null);
    setResent(true);
    setCodeSentAt(Date.now());
  };

  const backToCard = () => {
    setCode("");
    setOtpError(null);
    setFailure(null);
    setStage(1);
  };

  const showCardError = attempted && cardErr;
  const showExpiryError = attempted && expiryErr;
  const showPhoneError = attempted && phoneErr;

  const paidMethod = booking.payment?.method === "visa" ? t("receipt.methodVisa") : t("receipt.methodHumo");
  const paidAt = booking.payment?.paidAt ?? now;
  const paidAtLabel = `${formatDate(localIsoDate(paidAt), locale)} · ${clockTime(paidAt)}`;

  const contactLink = (chunks: React.ReactNode) => <Link href="/contact">{chunks}</Link>;
  const mono = (chunks: React.ReactNode) => <code>{chunks}</code>;

  const recovery: Record<Exclude<View, "loading" | "missing" | "card" | "otp" | "success">, readonly string[]> = {
    declined: [t("result.steps.balance"), t("result.steps.bankOnline"), t("result.steps.manager")],
    expired: [t("result.steps.pickDate"), t("result.steps.manager")],
    error: [t("result.steps.later"), t("result.steps.bankOnline"), t("result.steps.manager")],
  };

  const stageState = (n: 1 | 2) => {
    const current = done ? 2 : stage;
    if (n === current) return "current";
    return n < current ? "done" : "todo";
  };

  return (
    <div className={styles.page}>
      {head(
        !done && (
          <div className={styles.hold}>
            <Icon icon={Clock} size={17} strokeWidth={1.9} />
            <span className={styles.holdText}>
              <span className={styles.holdLabel}>{t("hold")}</span>
              <span className={styles.timer} role="timer" aria-label={t("holdAria", { time: formatCountdown(remaining) })}>
                {formatCountdown(remaining)}
              </span>
            </span>
          </div>
        ),
        <ol className={styles.stages} aria-label={t("stages.aria")}>
          {([1, 2] as const).map((n) => {
            const state = stageState(n);
            return (
              <li key={n} className={styles.stage} data-state={state} aria-current={state === "current" ? "step" : undefined}>
                <span className={styles.stageNum} aria-hidden="true">
                  {state === "done" ? <Icon icon={Check} size={14} strokeWidth={2.6} /> : n}
                </span>
                <span className={styles.stageTitle}>
                  {n === 1 ? t("stages.card") : t("stages.confirm")}
                  {state === "done" && <span className="sr-only"> — {t("stages.done")}</span>}
                </span>
              </li>
            );
          })}
        </ol>,
      )}

      <div className={styles.cols} data-side="1">
        {/* Halol ogohlantirish: to'lov demo rejimida. Desktopda o'ng ustunda (xulosa ostida), mobilda tepada. */}
        <div className={`notice notice--warn ${styles.demo}`} role="note">
          <Icon icon={TriangleAlert} size={17} strokeWidth={2} style={{ marginTop: 2 }} />
          <div className={styles.demoBody}>
            <span className={styles.demoTitle}>{t("demo.title")}</span>
            <p>{t.rich(view === "success" ? "demo.paid" : "demo.text", { contact: contactLink })}</p>
            {!done && (
              <>
                <span className={styles.demoRulesTitle}>{t("demo.rulesTitle")}</span>
                <ul className={styles.demoRules}>
                  <li>{t.rich("demo.card", { card: DEMO_CARD, mono })}</li>
                  <li>{t.rich("demo.success", { code: DEMO_CODES.success, mono })}</li>
                  <li>{t.rich("demo.declined", { code: DEMO_CODES.declined, mono })}</li>
                  <li>{t.rich("demo.error", { code: DEMO_CODES.error, mono })}</li>
                  <li>{t("demo.other")}</li>
                </ul>
              </>
            )}
          </div>
        </div>
        <form ref={formRef} className={styles.main} onSubmit={onSubmit} noValidate>
          {view === "card" && (
            <section className={styles.section}>
              <div>
                <h2 ref={headingRef} tabIndex={-1} className={styles.h2}>
                  {t("method.title")}
                </h2>
                <p className={styles.lead}>{t("method.lead")}</p>
              </div>

              <fieldset className={styles.fieldset}>
                <legend className="sr-only">{t("method.legend")}</legend>
                <div className={styles.methods}>
                  {PAYMENT_METHODS.map((id) => (
                    <label key={id} className={styles.method}>
                      <input
                        type="radio"
                        className="sr-only"
                        name="method"
                        value={id}
                        checked={method === id}
                        onChange={() => setMethod(id)}
                      />
                      <span className={styles.methodTag}>{METHOD_TAG[id]}</span>
                      <span className={styles.methodName}>{t(`method.${id}.name`)}</span>
                      <span className={styles.methodNote}>{t(`method.${id}.note`)}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {isBank ? (
                <div className={styles.cardBox}>
                  <span className={styles.boxLabel}>{t("bank.title")}</span>
                  <p className={styles.bankText}>{t("bank.text")}</p>
                  <ul className={styles.list}>
                    <li>
                      <Icon icon={ArrowRight} size={16} strokeWidth={2} />
                      <span>{t("bank.step1", { id: reference })}</span>
                    </li>
                    <li>
                      <Icon icon={ArrowRight} size={16} strokeWidth={2} />
                      <span>{t("bank.step2")}</span>
                    </li>
                    <li>
                      <Icon icon={ArrowRight} size={16} strokeWidth={2} />
                      <span>{t("bank.step3")}</span>
                    </li>
                  </ul>
                </div>
              ) : (
                <>
                  <div className={styles.cardBox}>
                    <span className={styles.cardHead}>
                      <span className={styles.boxLabel}>{t("card.title")}</span>
                      <span className={styles.cardBadge}>
                        <Icon icon={Lock} size={14} strokeWidth={1.9} />
                        <span>{t("card.badge")}</span>
                      </span>
                    </span>

                    {/* Karta maydonlarida `name` yo'q — forma hech qachon ularni serverga/URL'ga olib chiqmaydi. */}
                    <div className="field">
                      <label className="field__label" htmlFor={`${uid}-card`}>
                        {t("card.number")}
                      </label>
                      <input
                        id={`${uid}-card`}
                        className={`input ${styles.cardInput} ${styles.cardNumber}`}
                        type="text"
                        inputMode="numeric"
                        autoComplete="cc-number"
                        placeholder="8600 0000 0000 0000"
                        maxLength={19}
                        value={card}
                        aria-required="true"
                        aria-invalid={showCardError ? true : undefined}
                        aria-describedby={showCardError ? `${uid}-card-err` : undefined}
                        onChange={(e) => setCard(formatCardNumber(e.target.value))}
                      />
                      {showCardError && <InlineError id={`${uid}-card-err`}>{t(`errors.${cardErr}`)}</InlineError>}
                    </div>

                    <div className={styles.cardGrid}>
                      <div className="field">
                        <label className="field__label" htmlFor={`${uid}-exp`}>
                          {t("card.expiry")}
                        </label>
                        <input
                          id={`${uid}-exp`}
                          className={`input ${styles.cardInput}`}
                          type="text"
                          inputMode="numeric"
                          autoComplete="cc-exp"
                          placeholder="MM/YY"
                          maxLength={5}
                          value={expiry}
                          aria-required="true"
                          aria-invalid={showExpiryError ? true : undefined}
                          aria-describedby={showExpiryError ? `${uid}-exp-err` : undefined}
                          onChange={(e) => {
                            const next = e.target.value;
                            // O'chirishda "0" qayta qo'shilib qolmasligi uchun faqat uzayganda formatlanadi.
                            setExpiry(next.length < expiry.length ? next.replace(/[^\d/]/g, "") : formatExpiry(next));
                          }}
                        />
                        {showExpiryError && <InlineError id={`${uid}-exp-err`}>{t(`errors.${expiryErr}`)}</InlineError>}
                      </div>
                      <div className="field">
                        <label className="field__label" htmlFor={`${uid}-phone`}>
                          {t("card.phone")}
                        </label>
                        <input
                          id={`${uid}-phone`}
                          className={`input ${styles.phoneInput}`}
                          type="tel"
                          inputMode="tel"
                          autoComplete="tel"
                          placeholder="+998 __ ___ __ __"
                          value={phone}
                          aria-required="true"
                          aria-invalid={showPhoneError ? true : undefined}
                          aria-describedby={showPhoneError ? `${uid}-phone-err` : undefined}
                          onChange={(e) => setPhoneInput(formatUzPhone(e.target.value))}
                        />
                        {showPhoneError && (
                          <InlineError id={`${uid}-phone-err`}>
                            {t(phoneErr === "required" ? "errors.phone_required" : "errors.phone_format")}
                          </InlineError>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className={styles.trust}>
                    <span>
                      <Icon icon={ShieldCheck} size={15} />
                      <span>{t("card.trustPrivacy")}</span>
                    </span>
                    <span>
                      <Icon icon={Check} size={15} />
                      <span>{t("card.trustVoucher")}</span>
                    </span>
                  </div>
                </>
              )}
            </section>
          )}

          {view === "otp" && (
            <section className={styles.section}>
              <div>
                <h2 ref={headingRef} tabIndex={-1} className={styles.h2}>
                  {t("otp.title")}
                </h2>
                <p className={styles.lead}>{t("otp.hint", { phone })}</p>
              </div>

              <div className={styles.otpBox}>
                <div className={`field ${styles.otpField}`}>
                  <label className="field__label" htmlFor={`${uid}-otp`}>
                    {t("otp.label")}
                  </label>
                  <input
                    id={`${uid}-otp`}
                    className={`input ${styles.otpInput}`}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="······"
                    maxLength={OTP_LENGTH}
                    value={code}
                    aria-required="true"
                    aria-invalid={otpError ? true : undefined}
                    aria-describedby={otpError ? `${uid}-otp-err` : undefined}
                    onChange={(e) => {
                      setCode(formatOtp(e.target.value));
                      setOtpError(null);
                    }}
                  />
                </div>

                {otpError && (
                  <InlineError id={`${uid}-otp-err`} className={styles.otpError} alert>
                    {t(`errors.${otpError}`)}
                  </InlineError>
                )}

                <span className={styles.resendRow}>
                  <button type="button" className={styles.resend} disabled={cooldown > 0} onClick={resend}>
                    {t("otp.resend")}
                  </button>
                  <span className={styles.resendHint}>
                    <span role="status">{resent ? t("otp.resent") : ""}</span>
                    {resent && cooldown > 0 ? " · " : ""}
                    {cooldown > 0 && <span>{t("otp.resendIn", { seconds: cooldown })}</span>}
                  </span>
                </span>
              </div>
            </section>
          )}

          {view === "success" && (
            <section className={`${styles.section} ${styles.sectionResult}`}>
              <div className={styles.result} data-ok="1" data-celebrate="1">
                <span className={styles.resultIcon}>
                  <Icon icon={Check} size={28} strokeWidth={2.4} />
                </span>
                <div className={styles.resultText}>
                  <h2 ref={headingRef} tabIndex={-1} className={styles.resultTitle}>
                    {t("result.success.title")}
                  </h2>
                  <p className={styles.resultBody}>{t("result.success.text")}</p>
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
                    <dd>
                      {paidMethod}
                      {cardLastFour && ` ·· ${cardLastFour}`}
                    </dd>
                  </div>
                  <div>
                    <dt>{t("receipt.transaction")}</dt>
                    <dd>{booking.payment?.transactionId}</dd>
                  </div>
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

          {(view === "declined" || view === "expired" || view === "error") && (
            <section className={`${styles.section} ${styles.sectionResult}`}>
              <div className={styles.result}>
                <span className={styles.resultIcon}>
                  <Icon icon={X} size={28} strokeWidth={2.4} />
                </span>
                <div className={styles.resultText}>
                  <h2 ref={headingRef} tabIndex={-1} className={styles.resultTitle}>
                    {t(`result.${view}.title`)}
                  </h2>
                  <p className={styles.resultBody}>
                    {view === "declined"
                      ? t("result.declined.text", { minutes: Math.max(1, Math.ceil(remaining / 60000)) })
                      : t(`result.${view}.text`)}
                  </p>
                </div>
              </div>

              <div className={styles.todo}>
                <span className={styles.todoLabel}>{t("result.whatToDo")}</span>
                <ul className={styles.list}>
                  {recovery[view].map((text) => (
                    <li key={text}>
                      <Icon icon={ArrowRight} size={16} strokeWidth={2} />
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className={styles.resultActions}>
                {view === "expired" ? (
                  <Link href={`/book/${tour.slug}`} className={`btn btn--primary ${styles.cta} ${styles.ctaBold}`}>
                    <Icon icon={RotateCw} size={16} strokeWidth={1.9} />
                    <span>{t("actions.pickDate")}</span>
                  </Link>
                ) : (
                  <button type="button" className={`btn btn--primary ${styles.cta} ${styles.ctaBold}`} onClick={backToCard}>
                    <Icon icon={RotateCw} size={16} strokeWidth={1.9} />
                    <span>{t("actions.retry")}</span>
                  </button>
                )}
                <Link href="/contact" className={`btn btn--secondary ${styles.cta} ${styles.outline}`}>
                  {t("actions.manager")}
                </Link>
              </div>
            </section>
          )}

          {!done && (
            <div className={styles.actions}>
              {view === "otp" && (
                <button type="button" className={`btn btn--secondary ${styles.back} ${styles.outline}`} onClick={backToCard}>
                  <Icon icon={ArrowLeft} size={16} />
                  <span>{t("otp.change")}</span>
                </button>
              )}
              {view === "card" && isBank ? (
                <Link href="/contact" className={`btn btn--accent ${styles.pay}`}>
                  <Icon icon={FileText} size={17} />
                  <span>{t("bank.cta")}</span>
                </Link>
              ) : (
                <button type="submit" className={`btn btn--accent ${styles.pay}`}>
                  <Icon icon={Lock} size={17} />
                  <span>{view === "card" ? t("actions.pay", { amount }) : t("actions.confirm")}</span>
                </button>
              )}
            </div>
          )}
        </form>

        <aside className={styles.side} aria-label={t("summary.aria")}>
          <div className={styles.summary}>
            <div className={styles.summaryHead}>
              <span className={styles.dueLabel}>{t("summary.due")}</span>
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
                <span>{booking.id}</span>
              </span>
              <span className={styles.cards}>
                <Icon icon={CreditCard} size={15} />
                <span>{t("summary.cards")}</span>
              </span>
            </div>
          </div>
        </aside>
      </div>

      {/* Chop etish uchun vaucher — ekranda ko'rinmaydi, faqat `@media print` da. */}
      {view === "success" && booking.payment && (
        <div className={styles.voucher} aria-hidden="true">
          <div className={styles.voucherMark}>{t("voucher.demo")}</div>
          <div className={styles.voucherHead}>
            <div>
              <Logo height={34} />
              <h2 className={styles.voucherTitle}>{t("voucher.title")}</h2>
            </div>
            <span className={styles.voucherDemo}>{t("voucher.demo")}</span>
          </div>
          <p className={styles.voucherNote}>{t("voucher.demoNote")}</p>
          <dl className={styles.voucherGrid}>
            <div>
              <dt>{t("voucher.bookingNo")}</dt>
              <dd>{booking.id}</dd>
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
            <div>
              <dt>{t("voucher.transaction")}</dt>
              <dd>{booking.payment.transactionId}</dd>
            </div>
          </dl>
          <p className={styles.voucherLabel}>{t("voucher.travellers")}</p>
          <table className={styles.voucherTable}>
            <tbody>
              {booking.travelers.map((person, i) => (
                <tr key={i}>
                  <td>
                    {i + 1}. {person.lastName} {person.firstName}
                  </td>
                  <td>
                    {i < booking.adults ? t("voucher.adult") : t("voucher.child")} ·{" "}
                    {formatDate(person.birthDate, locale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className={styles.voucherFoot}>
            {t("voucher.contact")}: {site.name} · {site.domain} · {site.email}
            {site.phone ? ` · ${site.phone}` : ""}
          </p>
        </div>
      )}
    </div>
  );
}
