"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, Minus, Plus, Send, TriangleAlert } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Icon } from "@/components/Icon";
import { emailError } from "@/lib/booking-validate";
import styles from "./inquiry.module.css";

const FIELDS = ["name", "phone", "email", "date", "travelers", "budget", "comment", "consent"] as const;
type FieldKey = (typeof FIELDS)[number];
type FormError = "invalid" | "rateLimited" | "server" | "network";

const MAX_TRAVELERS = 50;
const isField = (key: string): key is FieldKey => (FIELDS as readonly string[]).includes(key);

export function InquiryForm({ slug }: { slug: string }) {
  const t = useTranslations("inquiry");
  const locale = useLocale();
  const uid = useId();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [date, setDate] = useState("");
  const [travelers, setTravelers] = useState(2);
  const [budget, setBudget] = useState("");
  const [comment, setComment] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot

  const [attempted, setAttempted] = useState(false);
  const [serverFields, setServerFields] = useState<FieldKey[]>([]);
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [formError, setFormError] = useState<FormError | null>(null);

  const formRef = useRef<HTMLFormElement>(null);
  const successRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (status === "sent") successRef.current?.focus();
  }, [status]);

  // Mijoz tomonidagi tekshiruv server sxemasi (src/app/api/inquiry/route.ts) bilan bir xil qoidalar.
  const invalid: Partial<Record<FieldKey, boolean>> = {
    name: name.trim().length < 2,
    phone: phone.replace(/\D/g, "").length < 9,
    email: emailError(email, false) !== null,
    consent: !consent,
  };
  const hasClientErrors = Object.values(invalid).some(Boolean);

  const errorFor = (key: FieldKey): string | undefined =>
    (attempted && invalid[key]) || serverFields.includes(key) ? t(`errors.${key}`) : undefined;

  const clearServer = (key: FieldKey) => setServerFields((list) => list.filter((item) => item !== key));

  const aria = (key: FieldKey) => {
    const error = errorFor(key);
    return {
      "aria-invalid": error ? (true as const) : undefined,
      "aria-describedby": error ? `${uid}-${key}-err` : undefined,
    };
  };
  const errorNode = (key: FieldKey, className = "") => {
    const error = errorFor(key);
    return error ? (
      <span id={`${uid}-${key}-err`} className={`field__error ${className}`}>
        {error}
      </span>
    ) : null;
  };

  const focusFirstInvalid = () => {
    requestAnimationFrame(() => {
      formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
    });
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (status === "sending") return;
    setAttempted(true);
    setFormError(null);
    if (hasClientErrors) {
      focusFirstInvalid();
      return;
    }

    setStatus("sending");
    try {
      const res = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          slug,
          locale,
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          date: date.trim(),
          travelers,
          budget: budget.trim(),
          comment: comment.trim(),
          consent,
          website,
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (res.ok) {
        setStatus("sent");
        return;
      }

      setStatus("idle");
      if (res.status === 400) {
        // Server matni (zod, inglizcha) ko'rsatilmaydi — faqat maydon kalitlari ishlatiladi.
        const data: unknown = await res.json().catch(() => null);
        const fields =
          data && typeof data === "object" && "fields" in data && data.fields && typeof data.fields === "object"
            ? Object.keys(data.fields)
            : [];
        const known = fields.filter(isField);
        setServerFields(known);
        setFormError("invalid");
        if (known.length > 0) focusFirstInvalid();
      } else if (res.status === 429) {
        setFormError("rateLimited");
      } else {
        setFormError("server");
      }
    } catch {
      setStatus("idle");
      setFormError("network");
    }
  };

  if (status === "sent") {
    return (
      <div className={styles.success}>
        <span className={styles.successIcon}>
          <Icon icon={Check} size={28} strokeWidth={2.4} />
        </span>
        <h2 ref={successRef} tabIndex={-1} className={styles.successTitle}>
          {t("success.title")}
        </h2>
        <p className={styles.successText}>{t("success.text")}</p>
        <div className={styles.successActions}>
          <Link href="/tours" className={`btn btn--accent ${styles.successBtn}`}>
            {t("success.tours")}
          </Link>
          <Link href={`/tours/${slug}`} className={`btn btn--ghost ${styles.successBtn}`}>
            {t("success.tour")}
          </Link>
        </div>
      </div>
    );
  }

  const sending = status === "sending";

  return (
    <form ref={formRef} className={styles.card} onSubmit={onSubmit} noValidate>
      <div>
        <h2 className={styles.h2}>{t("form.title")}</h2>
        <p className={styles.sub}>{t("form.required")}</p>
      </div>

      {/* Maydonlarda `name` yo'q: JS ulanmasdan Enter bosilsa ham shaxsiy ma'lumot URL'ga (GET) tushmaydi. */}
      <div className={styles.grid}>
        <div className="field">
          <label className="field__label" htmlFor={`${uid}-name`}>
            {t("form.name")}{" "}
            <span className={styles.req} aria-hidden="true">
              *
            </span>
          </label>
          <input
            id={`${uid}-name`}
            className="input"
            type="text"
            autoComplete="name"
            maxLength={80}
            placeholder={t("form.namePlaceholder")}
            value={name}
            aria-required="true"
            {...aria("name")}
            onChange={(e) => {
              setName(e.target.value);
              clearServer("name");
            }}
          />
          {errorNode("name")}
        </div>

        <div className="field">
          <label className="field__label" htmlFor={`${uid}-phone`}>
            {t("form.phone")}{" "}
            <span className={styles.req} aria-hidden="true">
              *
            </span>
          </label>
          <input
            id={`${uid}-phone`}
            className="input"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            maxLength={24}
            placeholder="+998 __ ___ __ __"
            value={phone}
            aria-required="true"
            {...aria("phone")}
            onChange={(e) => {
              setPhone(e.target.value.replace(/[^+\d\s()-]/g, ""));
              clearServer("phone");
            }}
          />
          {errorNode("phone")}
        </div>

        <div className="field">
          <label className="field__label" htmlFor={`${uid}-email`}>
            {t("form.email")}
          </label>
          <input
            id={`${uid}-email`}
            className="input"
            type="email"
            inputMode="email"
            autoComplete="email"
            maxLength={120}
            placeholder="siz@example.com"
            value={email}
            {...aria("email")}
            onChange={(e) => {
              setEmail(e.target.value);
              clearServer("email");
            }}
          />
          {errorNode("email")}
        </div>

        <div className="field">
          <label className="field__label" htmlFor={`${uid}-date`}>
            {t("form.date")}
          </label>
          <input
            id={`${uid}-date`}
            className="input"
            type="text"
            autoComplete="off"
            maxLength={60}
            placeholder={t("form.datePlaceholder")}
            value={date}
            {...aria("date")}
            onChange={(e) => {
              setDate(e.target.value);
              clearServer("date");
            }}
          />
          {errorNode("date")}
        </div>

        <div className="field" role="group" aria-labelledby={`${uid}-travelers`}>
          <span className="field__label" id={`${uid}-travelers`}>
            {t("form.travelers")}
          </span>
          <span className={`stepper ${styles.counter}`}>
            <button
              type="button"
              className="stepper__btn"
              aria-label={t("form.decrease")}
              disabled={travelers <= 1}
              onClick={() => setTravelers((n) => Math.max(1, n - 1))}
            >
              <Icon icon={Minus} size={16} strokeWidth={2.2} />
            </button>
            <span className="stepper__value" aria-live="polite">
              {travelers}
            </span>
            <button
              type="button"
              className="stepper__btn"
              aria-label={t("form.increase")}
              disabled={travelers >= MAX_TRAVELERS}
              onClick={() => setTravelers((n) => Math.min(MAX_TRAVELERS, n + 1))}
            >
              <Icon icon={Plus} size={16} strokeWidth={2.2} />
            </button>
          </span>
          {errorNode("travelers")}
        </div>

        <div className="field">
          <label className="field__label" htmlFor={`${uid}-budget`}>
            {t("form.budget")}
          </label>
          <input
            id={`${uid}-budget`}
            className="input"
            type="text"
            autoComplete="off"
            maxLength={60}
            placeholder={t("form.budgetPlaceholder")}
            value={budget}
            {...aria("budget")}
            onChange={(e) => {
              setBudget(e.target.value);
              clearServer("budget");
            }}
          />
          {errorNode("budget")}
        </div>

        <div className={`field ${styles.full}`}>
          <label className="field__label" htmlFor={`${uid}-comment`}>
            {t("form.comment")}
          </label>
          <textarea
            id={`${uid}-comment`}
            className="textarea"
            rows={4}
            maxLength={1000}
            placeholder={t("form.commentPlaceholder")}
            value={comment}
            {...aria("comment")}
            onChange={(e) => {
              setComment(e.target.value);
              clearServer("comment");
            }}
          />
          {errorNode("comment")}
        </div>
      </div>

      {/* Honeypot — botlar to'ldiradi, server jim "ok" qaytaradi */}
      <div className={styles.trap} aria-hidden="true">
        <label htmlFor={`${uid}-website`}>{t("form.website")}</label>
        <input
          id={`${uid}-website`}
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      <div className={styles.consent}>
        <label className="check">
          <input
            type="checkbox"
            checked={consent}
            aria-required="true"
            {...aria("consent")}
            onChange={(e) => {
              setConsent(e.target.checked);
              clearServer("consent");
            }}
          />
          <span>
            {t.rich("form.consent", {
              privacy: (chunks) => (
                <Link href="/privacy" target="_blank">
                  {chunks}
                </Link>
              ),
            })}{" "}
            <span className={styles.req} aria-hidden="true">
              *
            </span>
          </span>
        </label>
        {errorNode("consent", styles.consentError)}
      </div>

      {formError && (
        <p className="notice notice--error" role="alert">
          <Icon icon={TriangleAlert} size={17} strokeWidth={2} style={{ marginTop: 2 }} />
          <span>{t(`errors.${formError}`)}</span>
        </p>
      )}

      <div className={styles.submitRow}>
        <button type="submit" className={`btn btn--primary ${styles.submit}`} disabled={sending} aria-busy={sending}>
          <Icon icon={Send} size={17} />
          <span>{sending ? t("form.sending") : t("form.submit")}</span>
        </button>
        <span className={styles.note}>{t("form.note")}</span>
      </div>
    </form>
  );
}
