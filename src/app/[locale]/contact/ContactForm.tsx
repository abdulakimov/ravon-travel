"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, Send } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Icon } from "@/components/Icon";
import { CONTACT_LIMITS as L, CONTACT_SUBJECTS, type ContactSubject } from "./subjects";
import styles from "./contact.module.css";

type Values = {
  name: string;
  phone: string;
  email: string;
  subject: ContactSubject;
  message: string;
  consent: boolean;
  website: string; // honeypot — odam ko'rmaydi
};
type Field = "name" | "phone" | "email" | "message" | "consent";
type ErrorKey =
  | "nameRequired"
  | "phoneRequired"
  | "phoneShort"
  | "emailInvalid"
  | "messageRequired"
  | "messageShort"
  | "consentRequired";
type FormError = "invalid" | "rateLimited" | "server" | "network";

const EMPTY: Values = { name: "", phone: "", email: "", subject: "tour", message: "", consent: false, website: "" };
const ORDER: Field[] = ["name", "phone", "email", "message", "consent"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Server 400 qaytarganda (mijoz tekshiruvidan o'tgan, lekin sxema rad etgan) ko'rsatiladigan xabar.
const SERVER_FALLBACK: Record<Field, ErrorKey> = {
  name: "nameRequired",
  phone: "phoneShort",
  email: "emailInvalid",
  message: "messageShort",
  consent: "consentRequired",
};

function validate(v: Values): Partial<Record<Field, ErrorKey>> {
  const e: Partial<Record<Field, ErrorKey>> = {};
  if (!v.name.trim()) e.name = "nameRequired";
  const digits = v.phone.replace(/\D/g, "");
  if (!digits) e.phone = "phoneRequired";
  else if (digits.length < L.phoneMinDigits) e.phone = "phoneShort";
  const email = v.email.trim();
  if (email && !EMAIL_RE.test(email)) e.email = "emailInvalid";
  if (!v.message.trim()) e.message = "messageRequired";
  else if (v.message.trim().length < L.messageMin) e.message = "messageShort";
  if (!v.consent) e.consent = "consentRequired";
  return e;
}

export function ContactForm({ email }: { email: string }) {
  const t = useTranslations("contact");
  const locale = useLocale();

  const [values, setValues] = useState<Values>(EMPTY);
  const [touched, setTouched] = useState(false); // xatolar birinchi "Yuborish"dan keyin ko'rinadi
  const [serverFields, setServerFields] = useState<Partial<Record<Field, true>>>({});
  const [formError, setFormError] = useState<FormError | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

  const formRef = useRef<HTMLFormElement>(null);
  const sentRef = useRef<HTMLHeadingElement>(null);
  const focusFirstInvalid = useRef(false);

  const clientErrors = touched ? validate(values) : {};
  const errorOf = (f: Field): ErrorKey | undefined => clientErrors[f] ?? (serverFields[f] ? SERVER_FALLBACK[f] : undefined);

  useEffect(() => {
    if (status === "sent") sentRef.current?.focus();
  }, [status]);

  // Xatolar chizilgandan keyin birinchi noto'g'ri maydonga fokus
  useEffect(() => {
    if (!focusFirstInvalid.current) return;
    focusFirstInvalid.current = false;
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  });

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    // Server belgilagan maydon tahrirlansa — belgisi olib tashlanadi
    if (key in serverFields) {
      setServerFields((prev) => {
        const next = { ...prev };
        delete next[key as Field];
        return next;
      });
    }
  }

  async function onSubmit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    if (status === "sending") return;
    setFormError(null);

    if (Object.keys(validate(values)).length) {
      setTouched(true);
      focusFirstInvalid.current = true;
      return;
    }

    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: values.name.trim(),
          phone: values.phone.trim(),
          email: values.email.trim(),
          subject: values.subject,
          message: values.message.trim(),
          consent: values.consent,
          website: values.website,
          locale,
        }),
      });

      if (res.ok) {
        setValues(EMPTY);
        setTouched(false);
        setServerFields({});
        setStatus("sent");
        return;
      }

      if (res.status === 400) {
        // Javob shakliga ishonmaymiz: faqat tanish maydon kalitlari olinadi, matn mijozda lokalizatsiya qilinadi.
        const body: unknown = await res.json().catch(() => null);
        const fields =
          body && typeof body === "object" && "fields" in body && body.fields && typeof body.fields === "object"
            ? Object.keys(body.fields)
            : [];
        const known = ORDER.filter((f) => fields.includes(f));
        setServerFields(Object.fromEntries(known.map((f) => [f, true])));
        setTouched(true);
        setFormError("invalid");
        focusFirstInvalid.current = known.length > 0;
      } else if (res.status === 429) {
        setFormError("rateLimited");
      } else {
        setFormError("server");
      }
    } catch {
      setFormError("network");
    }
    setStatus("idle");
  }

  if (status === "sent") {
    return (
      <div className={styles.sent} role="status">
        <span className={styles.sentMark} aria-hidden="true">
          <Icon icon={Check} size={28} strokeWidth={2.4} />
        </span>
        <h2 ref={sentRef} tabIndex={-1} className={styles.sentTitle}>
          {t("sent.title")}
        </h2>
        <p className={styles.sentText}>{t("sent.text")}</p>
        <button type="button" className={styles.again} onClick={() => setStatus("idle")}>
          {t("sent.again")}
        </button>
      </div>
    );
  }

  const describe = (f: Field) => (errorOf(f) ? `contact-${f}-error` : undefined);
  const errorText = (f: Field) => {
    const key = errorOf(f);
    return key ? (
      <span id={`contact-${f}-error`} className="field__error">
        {t(`form.errors.${key}`)}
      </span>
    ) : null;
  };
  const star = (
    <>
      {" "}
      <span className={styles.star} aria-hidden="true">
        *
      </span>
    </>
  );

  return (
    <form ref={formRef} className={styles.form} onSubmit={onSubmit} noValidate aria-labelledby="contact-form-title">
      <div>
        <h2 id="contact-form-title" className={styles.formTitle}>
          {t("form.title")}
        </h2>
        <p className={styles.formNote}>{t("form.required")}</p>
      </div>

      <div className={styles.fields}>
        <div className="field">
          <label htmlFor="contact-name" className="field__label">
            {t("form.name")}
            {star}
          </label>
          <input
            id="contact-name"
            className={`input ${styles.control}`}
            type="text"
            name="name"
            autoComplete="name"
            maxLength={L.name}
            required
            placeholder={t("form.namePlaceholder")}
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            aria-invalid={errorOf("name") ? true : undefined}
            aria-describedby={describe("name")}
          />
          {errorText("name")}
        </div>

        <div className="field">
          <label htmlFor="contact-phone" className="field__label">
            {t("form.phone")}
            {star}
          </label>
          <input
            id="contact-phone"
            className={`input ${styles.control}`}
            type="tel"
            name="phone"
            autoComplete="tel"
            inputMode="tel"
            maxLength={L.phone}
            required
            placeholder="+998 __ ___ __ __"
            value={values.phone}
            onChange={(e) => set("phone", e.target.value)}
            aria-invalid={errorOf("phone") ? true : undefined}
            aria-describedby={describe("phone")}
          />
          {errorText("phone")}
        </div>

        <div className="field">
          <label htmlFor="contact-email" className="field__label">
            {t("form.email")}
          </label>
          <input
            id="contact-email"
            className={`input ${styles.control}`}
            type="email"
            name="email"
            autoComplete="email"
            inputMode="email"
            maxLength={L.email}
            placeholder="name@example.com"
            value={values.email}
            onChange={(e) => set("email", e.target.value)}
            aria-invalid={errorOf("email") ? true : undefined}
            aria-describedby={describe("email")}
          />
          {errorText("email")}
        </div>

        <div className="field">
          <label htmlFor="contact-subject" className="field__label">
            {t("form.subject")}
          </label>
          <select
            id="contact-subject"
            className={`select ${styles.control} ${styles.subject}`}
            name="subject"
            value={values.subject}
            onChange={(e) => set("subject", e.target.value as ContactSubject)}
          >
            {CONTACT_SUBJECTS.map((key) => (
              <option key={key} value={key}>
                {t(`form.subjects.${key}`)}
              </option>
            ))}
          </select>
        </div>

        <div className={`field ${styles.wide}`}>
          <label htmlFor="contact-message" className="field__label">
            {t("form.message")}
            {star}
          </label>
          <textarea
            id="contact-message"
            className={`textarea ${styles.control}`}
            name="message"
            rows={4}
            maxLength={L.message}
            required
            placeholder={t("form.messagePlaceholder")}
            value={values.message}
            onChange={(e) => set("message", e.target.value)}
            aria-invalid={errorOf("message") ? true : undefined}
            aria-describedby={describe("message")}
          />
          {errorText("message")}
        </div>
      </div>

      {/* Honeypot: botlar to'ldiradi, odam ko'rmaydi va klaviatura bilan ham tusha olmaydi */}
      <div className={styles.trap} aria-hidden="true">
        <label htmlFor="contact-website">Website</label>
        <input
          id="contact-website"
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={values.website}
          onChange={(e) => set("website", e.target.value)}
        />
      </div>

      <div className={styles.consent}>
        <div className={`check ${styles.check}`}>
          <input
            id="contact-consent"
            type="checkbox"
            name="consent"
            required
            checked={values.consent}
            onChange={(e) => set("consent", e.target.checked)}
            aria-invalid={errorOf("consent") ? true : undefined}
            aria-describedby={describe("consent")}
          />
          <label htmlFor="contact-consent">
            {t.rich("form.consent", {
              link: (chunks) => (
                <Link href="/privacy" target="_blank">
                  {chunks}
                </Link>
              ),
            })}
          </label>
        </div>
        {errorText("consent")}
      </div>

      {formError && (
        <p className="notice notice--error" role="alert">
          {formError === "server" ? t("form.errors.server", { email }) : t(`form.errors.${formError}`)}
        </p>
      )}

      <div className={styles.actions}>
        <button type="submit" className={`btn btn--primary ${styles.submit}`} disabled={status === "sending"}>
          <Icon icon={Send} size={17} />
          <span>{status === "sending" ? t("form.sending") : t("form.submit")}</span>
        </button>
        <span className={styles.hint}>{t("form.hint")}</span>
      </div>
    </form>
  );
}
