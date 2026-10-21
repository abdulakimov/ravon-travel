"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight, Check, CreditCard, Info, Minus, Plus, ShieldCheck, TriangleAlert } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { Departure, Tour } from "@/data/types";
import { Icon } from "@/components/Icon";
import { bookingTotal, formatDateRange, money, weekday } from "@/lib/format";
import { tr } from "@/lib/l10n";
import { BOOKING_ID_RE, HOLD_MS, loadBooking, saveBooking, type Booking, type Traveler } from "@/lib/booking-store";
import { clockTime, localIsoDate } from "@/lib/payment";
import {
  MAX_ADULTS,
  MAX_CHILDREN,
  NOTE_MAX,
  birthDateError,
  clampParty,
  emailError,
  formatUzPhone,
  nameError,
  normalizeName,
  normalizePassport,
  parseCount,
  passportError,
  phoneError,
  type TravelerKind,
} from "@/lib/booking-validate";
import styles from "./book.module.css";

const STEP_KEYS = ["date", "travellers", "contact", "confirm"] as const;
type Step = 1 | 2 | 3 | 4;

const emptyTraveler = (): Traveler => ({ firstName: "", lastName: "", birthDate: "", passportNo: "" });
const emptyList = (n: number) => Array.from({ length: n }, emptyTraveler);

type TravelerErrors = Partial<Record<keyof Traveler, string>>;

type Draft = Omit<Booking, "id" | "status" | "createdAt" | "holdUntil">;
type SubmitError = "rate_limited" | "invalid" | "failed" | "storage";

/**
 * Bronni SERVERDA yaratadi (/api/booking): bron raqami va summani server beradi, to'lov (Click) shu
 * yozuvga tayanadi. Javobdan keyin nusxasi brauzerga ham yoziladi (to'lov sahifasida sayohatchilar uchun).
 * Pasport raqami va tug'ilgan sana serverga ATAYLAB yuborilmaydi.
 */
async function createBooking(draft: Draft): Promise<{ booking: Booking } | { error: SubmitError }> {
  let res: Response;
  try {
    res = await fetch("/api/booking", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        slug: draft.tourSlug,
        departureId: draft.departureId,
        locale: document.documentElement.lang,
        adults: draft.adults,
        children: draft.children,
        travelers: draft.travelers.map((p) => `${p.firstName} ${p.lastName}`.trim()),
        phone: draft.phone,
        email: draft.email,
        note: draft.note,
        totalUzs: draft.totalUzs,
      }),
    });
  } catch {
    return { error: "failed" };
  }
  if (res.status === 429) return { error: "rate_limited" };
  if (res.status === 400) return { error: "invalid" };
  const body = (await res.json().catch(() => null)) as { bookingId?: unknown; payToken?: unknown } | null;
  if (!res.ok || typeof body?.bookingId !== "string" || !BOOKING_ID_RE.test(body.bookingId)) return { error: "failed" };
  const payToken = typeof body.payToken === "string" && /^[\w-]{16,64}$/.test(body.payToken) ? body.payToken : undefined;

  const now = Date.now();
  // Ushlab turish muddati mijoz soatidan hisoblanadi (server soati bilan farq taymerni buzmasin).
  const booking: Booking = { ...draft, id: body.bookingId, status: "held", createdAt: now, holdUntil: now + HOLD_MS, payToken };
  saveBooking(booking);
  // Brauzer xotirasi o'chirilgan bo'lsa demo to'lov sahifasi bronni topa olmaydi — foydalanuvchiga aytamiz.
  if (!loadBooking(booking.id)) return { error: "storage" };
  return { booking };
}

/** Yorliq + input + xato (aria-invalid / aria-describedby bilan). */
function TextField({
  id,
  label,
  error,
  mono = false,
  className = "",
  ...input
}: {
  id: string;
  label: string;
  error?: string;
  mono?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={`field ${className}`}>
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className={mono ? "input input--mono" : "input"}
        aria-required="true"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-err` : undefined}
        {...input}
      />
      {error && (
        <span id={`${id}-err`} className="field__error">
          {error}
        </span>
      )}
    </div>
  );
}

function Counter({
  label,
  hint,
  value,
  onChange,
  min,
  canIncrease,
  decLabel,
  incLabel,
}: {
  label: string;
  hint: string;
  value: number;
  onChange: (next: number) => void;
  min: number;
  canIncrease: boolean;
  decLabel: string;
  incLabel: string;
}) {
  return (
    <div className={styles.partyRow} role="group" aria-label={label}>
      <span className={styles.partyLabel}>
        <span className={styles.partyName}>{label}</span>
        <span className={styles.partyHint}>{hint}</span>
      </span>
      <span className={`stepper ${styles.counter}`}>
        <button
          type="button"
          className="stepper__btn"
          aria-label={`${label}: ${decLabel}`}
          disabled={value <= min}
          onClick={() => onChange(value - 1)}
        >
          <Icon icon={Minus} size={16} strokeWidth={2.2} />
        </button>
        <span className="stepper__value" aria-live="polite">
          {value}
        </span>
        <button
          type="button"
          className="stepper__btn"
          aria-label={`${label}: ${incLabel}`}
          disabled={!canIncrease}
          onClick={() => onChange(value + 1)}
        >
          <Icon icon={Plus} size={16} strokeWidth={2.2} />
        </button>
      </span>
    </div>
  );
}

/** `categoryLabel` — toifa nomi (tarjima qilingan), serverdan. */
export function BookingWizard({ tour, categoryLabel }: { tour: Tour; categoryLabel: string }) {
  const t = useTranslations("booking");
  const locale = useLocale() as Locale;
  const search = useSearchParams();
  const uid = useId();

  const departures = tour.departures;

  // Boshlang'ich tanlov: ?date=<departureId>&adults=N&children=M (noto'g'ri qiymatlar tuzatiladi)
  const [selection, setSelection] = useState(() => {
    const open = departures.filter((d) => d.seatsLeft > 0);
    const dep = open.find((d) => d.id === search.get("date")) ?? open[0] ?? departures[0];
    const party = clampParty(
      parseCount(search.get("adults"), 2),
      parseCount(search.get("children"), 0),
      dep?.seatsLeft ?? 1,
    );
    return { depId: dep?.id ?? "", ...party };
  });
  const { depId, adults, children } = selection;

  const [step, setStep] = useState<Step>(1);
  const [adultForms, setAdultForms] = useState(() => emptyList(MAX_ADULTS));
  const [childForms, setChildForms] = useState(() => emptyList(MAX_CHILDREN));
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [offer, setOffer] = useState(false);
  const [personalData, setPersonalData] = useState(false);
  const [attempted, setAttempted] = useState<{ 2: boolean; 3: boolean }>({ 2: false, 3: false });
  const [booking, setBooking] = useState<Booking | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<SubmitError | null>(null);
  // "Bugun" faqat validatsiyada ishlatiladi (markup'ga tushmaydi).
  const [today] = useState(() => localIsoDate(Date.now()));

  const headingRef = useRef<HTMLHeadingElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const mounted = useRef(false);

  // Qadam almashganda fokus yangi qadam sarlavhasiga o'tadi (klaviatura va ekran o'quvchilar uchun).
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  const dep: Departure | undefined = departures.find((d) => d.id === depId);
  if (!dep) return null; // server kamida bitta ochiq sana borligini kafolatlaydi

  const pax = adults + children;
  const over = pax > dep.seatsLeft;
  const total = bookingTotal(dep.priceUzs, adults, children);
  const adultsSum = adults * dep.priceUzs;
  const range = formatDateRange(dep.from, dep.to, locale);
  const title = tr(tour.title, locale);

  const travelers: { kind: TravelerKind; index: number; data: Traveler }[] = [
    ...adultForms.slice(0, adults).map((data, index) => ({ kind: "adult" as const, index, data })),
    ...childForms.slice(0, children).map((data, index) => ({ kind: "child" as const, index, data })),
  ];

  // ── Validatsiya (xatolar qadamning birinchi "Davom etish"idan keyin ko'rsatiladi, so'ng jonli) ──
  const travelerErrors: TravelerErrors[] = travelers.map(({ kind, data }) => {
    const errors: TravelerErrors = {};
    const first = nameError(data.firstName);
    if (first) errors.firstName = first === "required" ? t("errors.firstNameRequired") : t("errors.latin");
    const last = nameError(data.lastName);
    if (last) errors.lastName = last === "required" ? t("errors.lastNameRequired") : t("errors.latin");
    const birth = birthDateError(data.birthDate, kind, dep.from, today);
    if (birth) {
      errors.birthDate = {
        required: t("errors.birthRequired"),
        invalid: t("errors.birthInvalid"),
        future: t("errors.birthFuture"),
        adultAge: t("errors.adultAge"),
        childAge: t("errors.childAge"),
      }[birth];
    }
    const passport = passportError(data.passportNo);
    if (passport) errors.passportNo = passport === "required" ? t("errors.passportRequired") : t("errors.passportFormat");
    return errors;
  });
  const step2Valid = travelerErrors.every((e) => Object.keys(e).length === 0);

  const phoneErr = phoneError(phone);
  const emailErr = emailError(email);
  const contactErrors = {
    phone: phoneErr ? (phoneErr === "required" ? t("errors.phoneRequired") : t("errors.phoneFormat")) : undefined,
    email: emailErr ? (emailErr === "required" ? t("errors.emailRequired") : t("errors.emailFormat")) : undefined,
  };
  const consentsOk = offer && personalData;
  const step3Valid = !phoneErr && !emailErr && consentsOk;

  const show2 = attempted[2];
  const show3 = attempted[3];

  const focusFirstInvalid = () => {
    requestAnimationFrame(() => {
      formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
    });
  };

  const setParty = (nextAdults: number, nextChildren: number) =>
    setSelection((s) => ({
      ...s,
      adults: Math.min(MAX_ADULTS, Math.max(1, nextAdults)),
      children: Math.min(MAX_CHILDREN, Math.max(0, nextChildren)),
    }));

  const updateTraveler = (kind: TravelerKind, index: number, patch: Partial<Traveler>) => {
    const set = kind === "adult" ? setAdultForms : setChildForms;
    set((list) => list.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const confirmBooking = async () => {
    if (submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    const result = await createBooking({
      tourSlug: tour.slug,
      departureId: dep.id,
      adults,
      children,
      travelers: travelers.map(({ data }) => ({
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        birthDate: data.birthDate,
        passportNo: data.passportNo,
      })),
      phone,
      email: email.trim(),
      note: note.trim(),
      consents: { offer, personalData },
      totalUzs: total,
    });
    setSubmitting(false);
    if ("error" in result) {
      setSubmitError(result.error);
      return;
    }
    setBooking(result.booking);
    setStep(4);
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (step === 1) {
      if (!over) setStep(2);
    } else if (step === 2) {
      setAttempted((a) => ({ ...a, 2: true }));
      if (step2Valid) setStep(3);
      else focusFirstInvalid();
    } else if (step === 3) {
      setAttempted((a) => ({ ...a, 3: true }));
      if (step3Valid) void confirmBooking();
      else focusFirstInvalid();
    }
  };

  const stepper = (
    <ol className={styles.steps} aria-label={t("steps.aria")}>
      {STEP_KEYS.map((key, i) => {
        const n = i + 1;
        const state = n < step ? "done" : n === step ? "current" : "todo";
        return (
          <li key={key} className={styles.step} data-state={state} aria-current={state === "current" ? "step" : undefined}>
            <span className={styles.stepNum} aria-hidden="true">
              {state === "done" ? <Icon icon={Check} size={16} strokeWidth={2.6} /> : n}
            </span>
            <span className={styles.stepText}>
              <span className={styles.stepLabel}>{t("steps.label", { n })}</span>
              <span className={styles.stepTitle}>
                {t(`steps.${key}`)}
                {state === "done" && <span className="sr-only"> — {t("steps.done")}</span>}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );

  return (
    <div className={styles.page}>
      <section className={styles.head}>
        <div className={styles.headInner}>
          <h1 className={styles.h1}>{t("h1")}</h1>
          {stepper}
        </div>
      </section>

      <div className={styles.cols}>
        <form ref={formRef} className={styles.main} onSubmit={onSubmit} noValidate>
          {step === 1 && (
            <section className={`${styles.section} ${styles.sectionWide}`}>
              <div>
                <h2 ref={headingRef} tabIndex={-1} className={styles.h2}>
                  {t("date.title")}
                </h2>
                <p className={styles.lead}>{t("date.lead")}</p>
              </div>

              <fieldset className={styles.fieldset}>
                <legend className="sr-only">{t("date.legend")}</legend>
                <div className={styles.dates}>
                  {departures.map((d) => {
                    const out = d.seatsLeft <= 0;
                    return (
                      <label key={d.id} className={styles.date}>
                        <input
                          type="radio"
                          className="sr-only"
                          name="departure"
                          value={d.id}
                          checked={d.id === depId}
                          disabled={out}
                          onChange={() => setSelection((s) => ({ ...s, depId: d.id }))}
                        />
                        <span className={styles.radio} aria-hidden="true" />
                        <span className={styles.dateText}>
                          <span className={styles.dateRange}>{formatDateRange(d.from, d.to, locale)}</span>
                          <span className={styles.dateSub}>{weekday(d.from, locale)}</span>
                        </span>
                        <span className={styles.seatPill} data-level={out ? "out" : d.seatsLeft <= 5 ? "low" : "ok"}>
                          {out ? t("date.soldOut") : t("date.seatsLeft", { count: d.seatsLeft })}
                        </span>
                        <span className={styles.datePrice}>{money(d.priceUzs, locale)}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <fieldset className={styles.fieldset}>
                <legend className="sr-only">{t("date.partyLegend")}</legend>
                <div className={styles.party}>
                  <Counter
                    label={t("date.adults")}
                    hint={t("date.adultsHint")}
                    value={adults}
                    min={1}
                    canIncrease={adults < MAX_ADULTS && pax < dep.seatsLeft}
                    onChange={(n) => setParty(n, children)}
                    decLabel={t("date.decrease")}
                    incLabel={t("date.increase")}
                  />
                  <Counter
                    label={t("date.children")}
                    hint={t("date.childrenHint")}
                    value={children}
                    min={0}
                    canIncrease={children < MAX_CHILDREN && pax < dep.seatsLeft}
                    onChange={(n) => setParty(adults, n)}
                    decLabel={t("date.decrease")}
                    incLabel={t("date.increase")}
                  />
                </div>
              </fieldset>

              {over && (
                <p className={`notice notice--warn ${styles.warn}`} role="alert" id={`${uid}-seats`}>
                  <Icon icon={TriangleAlert} size={17} strokeWidth={2} style={{ marginTop: 2 }} />
                  <span>{t("date.seatWarning", { count: dep.seatsLeft })}</span>
                </p>
              )}
            </section>
          )}

          {step === 2 && (
            <section className={styles.section}>
              <div>
                <h2 ref={headingRef} tabIndex={-1} className={styles.h2}>
                  {t("travellers.title")}
                </h2>
                <p className={styles.lead}>{t("travellers.lead")}</p>
              </div>

              {travelers.map(({ kind, index, data }, i) => {
                const errors = show2 ? travelerErrors[i] : {};
                const id = `${uid}-${kind}-${index}`;
                return (
                  <fieldset key={`${kind}-${index}`} className={`${styles.fieldset} ${styles.box} ${styles.traveller}`}>
                    <legend className="sr-only">
                      {i + 1}. {kind === "adult" ? t("travellers.adult") : t("travellers.child")}
                    </legend>
                    <span className={styles.travellerHead} aria-hidden="true">
                      <span className={styles.travellerNum}>{i + 1}</span>
                      <span className={styles.travellerLabel}>
                        {kind === "adult" ? t("travellers.adult") : t("travellers.child")}
                      </span>
                    </span>
                    <div className={styles.grid4}>
                      <TextField
                        id={`${id}-first`}
                        label={t("travellers.firstName")}
                        type="text"
                        placeholder={kind === "child" ? "AZIZA" : "ISLOM"}
                        autoComplete="off"
                        autoCapitalize="characters"
                        spellCheck={false}
                        value={data.firstName}
                        error={errors.firstName}
                        onChange={(e) => updateTraveler(kind, index, { firstName: normalizeName(e.target.value) })}
                      />
                      <TextField
                        id={`${id}-last`}
                        label={t("travellers.lastName")}
                        type="text"
                        placeholder="KARIMOV"
                        autoComplete="off"
                        autoCapitalize="characters"
                        spellCheck={false}
                        value={data.lastName}
                        error={errors.lastName}
                        onChange={(e) => updateTraveler(kind, index, { lastName: normalizeName(e.target.value) })}
                      />
                      <TextField
                        id={`${id}-birth`}
                        label={t("travellers.birthDate")}
                        type="date"
                        autoComplete="off"
                        value={data.birthDate}
                        error={errors.birthDate}
                        onChange={(e) => updateTraveler(kind, index, { birthDate: e.target.value })}
                      />
                      <TextField
                        id={`${id}-passport`}
                        label={t("travellers.passport")}
                        type="text"
                        mono
                        placeholder="AB1234567"
                        autoComplete="off"
                        autoCapitalize="characters"
                        spellCheck={false}
                        maxLength={12}
                        value={data.passportNo}
                        error={errors.passportNo}
                        onChange={(e) => updateTraveler(kind, index, { passportNo: normalizePassport(e.target.value) })}
                      />
                    </div>
                  </fieldset>
                );
              })}
            </section>
          )}

          {step === 3 && (
            <section className={styles.section}>
              <div>
                <h2 ref={headingRef} tabIndex={-1} className={styles.h2}>
                  {t("contact.title")}
                </h2>
                <p className={styles.lead}>{t("contact.lead")}</p>
              </div>

              <div className={`${styles.box} ${styles.grid2}`}>
                <TextField
                  id={`${uid}-phone`}
                  label={t("contact.phone")}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="+998 __ ___ __ __"
                  value={phone}
                  error={show3 ? contactErrors.phone : undefined}
                  onChange={(e) => setPhone(formatUzPhone(e.target.value))}
                />
                <TextField
                  id={`${uid}-email`}
                  label={t("contact.email")}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="name@example.com"
                  maxLength={120}
                  value={email}
                  error={show3 ? contactErrors.email : undefined}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <div className={`field ${styles.full}`}>
                  <label className="field__label" htmlFor={`${uid}-note`}>
                    {t("contact.note")}
                  </label>
                  <textarea
                    id={`${uid}-note`}
                    className={`textarea ${styles.note}`}
                    rows={3}
                    maxLength={NOTE_MAX}
                    placeholder={t("contact.notePlaceholder")}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.consents}>
                <div className={styles.consent}>
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={offer}
                      aria-required="true"
                      aria-invalid={show3 && !offer ? true : undefined}
                      aria-describedby={show3 && !offer ? `${uid}-offer-err` : undefined}
                      onChange={(e) => setOffer(e.target.checked)}
                    />
                    <span>
                      {t.rich("contact.consentOffer", {
                        terms: (chunks) => (
                          <Link href="/terms" target="_blank">
                            {chunks}
                          </Link>
                        ),
                        cancel: (chunks) => (
                          <Link href="/cancellation" target="_blank">
                            {chunks}
                          </Link>
                        ),
                      })}
                    </span>
                  </label>
                  {show3 && !offer && (
                    <span id={`${uid}-offer-err`} className={`field__error ${styles.consentError}`}>
                      {t("errors.consentRequired")}
                    </span>
                  )}
                </div>
                <div className={styles.consent}>
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={personalData}
                      aria-required="true"
                      aria-invalid={show3 && !personalData ? true : undefined}
                      aria-describedby={show3 && !personalData ? `${uid}-data-err` : undefined}
                      onChange={(e) => setPersonalData(e.target.checked)}
                    />
                    <span>
                      {t.rich("contact.consentData", {
                        privacy: (chunks) => (
                          <Link href="/privacy" target="_blank">
                            {chunks}
                          </Link>
                        ),
                      })}
                    </span>
                  </label>
                  {show3 && !personalData && (
                    <span id={`${uid}-data-err`} className={`field__error ${styles.consentError}`}>
                      {t("errors.consentRequired")}
                    </span>
                  )}
                </div>
              </div>

              {submitError && (
                <p className="notice notice--error" role="alert">
                  <Icon icon={TriangleAlert} size={17} strokeWidth={2} style={{ marginTop: 2 }} />
                  <span>
                    {t.rich(`errors.submit.${submitError}`, {
                      contact: (chunks) => <Link href="/contact">{chunks}</Link>,
                    })}
                  </span>
                </p>
              )}
            </section>
          )}

          {step === 4 && booking && (
            <section className={`${styles.section} ${styles.sectionTight}`}>
              <div className={styles.banner}>
                <span className={styles.bannerIcon}>
                  <Icon icon={Check} size={24} strokeWidth={2.4} />
                </span>
                <div className={styles.bannerText}>
                  <h2 ref={headingRef} tabIndex={-1} className={styles.bannerTitle}>
                    {t("done.bannerTitle")}
                  </h2>
                  <p className={styles.bannerSub}>{t("done.bannerText")}</p>
                </div>
              </div>

              <div className={`${styles.box} ${styles.details}`}>
                <h3 className={styles.h3}>{t("done.detailsTitle")}</h3>
                <dl className={styles.dl}>
                  <div>
                    <dt>{t("done.bookingNo")}</dt>
                    <dd className={styles.mono}>{booking.id}</dd>
                  </div>
                  <div>
                    <dt>{t("done.tour")}</dt>
                    <dd>{title}</dd>
                  </div>
                  <div>
                    <dt>{t("done.date")}</dt>
                    <dd>{range}</dd>
                  </div>
                  <div>
                    <dt>{t("done.travellers")}</dt>
                    <dd>{t("done.people", { count: pax })}</dd>
                  </div>
                  <div>
                    <dt>{t("done.deadline")}</dt>
                    <dd>{t("done.deadlineValue", { time: clockTime(booking.holdUntil) })}</dd>
                  </div>
                </dl>
              </div>

              <div className={styles.info}>
                <Icon icon={Info} size={18} style={{ marginTop: 2 }} />
                <p>{t("done.info")}</p>
              </div>
            </section>
          )}

          <div className={styles.actions}>
            {step > 1 && step < 4 && (
              <button
                type="button"
                className={`btn btn--secondary ${styles.back}`}
                onClick={() => setStep((s) => (s - 1) as Step)}
              >
                <Icon icon={ArrowLeft} size={16} />
                <span>{t("nav.back")}</span>
              </button>
            )}

            {step < 4 && (
              <button
                type="submit"
                className={`btn btn--primary ${styles.cta}`}
                aria-disabled={(step === 1 && over) || (step === 3 && (!consentsOk || submitting)) ? true : undefined}
                aria-busy={step === 3 && submitting ? true : undefined}
                aria-describedby={
                  step === 3 && !consentsOk ? `${uid}-blocked` : step === 1 && over ? `${uid}-seats` : undefined
                }
              >
                <span>{step === 3 ? t("nav.confirm") : t("nav.next")}</span>
                <Icon icon={ArrowRight} size={16} />
              </button>
            )}

            {step === 4 && booking && (
              <Link
                href={booking.payToken ? `/pay/${booking.id}?k=${encodeURIComponent(booking.payToken)}` : `/pay/${booking.id}`}
                className={`btn btn--accent ${styles.cta}`}
              >
                <Icon icon={CreditCard} size={17} />
                <span>{t("nav.toPayment")}</span>
              </Link>
            )}

            {step === 3 && !consentsOk && (
              <span id={`${uid}-blocked`} className={styles.hint}>
                {t("contact.blockedHint")}
              </span>
            )}
            {step === 2 && show2 && !step2Valid && (
              <span className={styles.hint} role="status">
                {t("errors.summary")}
              </span>
            )}
          </div>
        </form>

        <aside className={styles.side} aria-label={t("summary.aria")}>
          <div className={styles.summary}>
            <div className={styles.summaryHead}>
              <span className={styles.thumb}>
                <Image src={tour.image} alt="" fill sizes="74px" />
              </span>
              <span className={styles.summaryTitleBox}>
                <span className={styles.summaryCat}>{categoryLabel}</span>
                <span className={styles.summaryTitle}>{title}</span>
              </span>
            </div>
            <div className={styles.summaryBody}>
              <span className={styles.row}>
                <span>{t("summary.adults", { count: adults })}</span>
                <span>{money(adultsSum, locale)}</span>
              </span>
              {children > 0 && (
                <span className={styles.row}>
                  <span>{t("summary.children", { count: children })}</span>
                  <span>{money(total - adultsSum, locale)}</span>
                </span>
              )}
              <span className={styles.row}>
                <span>{t("summary.date")}</span>
                <span>{range}</span>
              </span>
              <span className={styles.total}>
                <span className={styles.totalLabel}>{t("summary.total")}</span>
                <span className={styles.totalValue}>{money(total, locale)}</span>
              </span>
              <span className={styles.free}>
                <Icon icon={ShieldCheck} size={15} />
                <span>{t("summary.free")}</span>
              </span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
