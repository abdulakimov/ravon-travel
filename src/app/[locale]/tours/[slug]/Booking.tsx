"use client";

import { createContext, useContext, useEffect, useId, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CalendarCheck, Headset, Minus, Plus, Send, ShieldCheck, User } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { Departure } from "@/data/types";
import { Icon } from "@/components/Icon";
import { bookingTotal, formatDateRange, money, weekday } from "@/lib/format";
import styles from "./tour.module.css";

// Sanalar jadvali, bron kartochkasi va mobil pastki panel bitta tanlov holatini bo'lishadi.
// O'rin qoldig'i hozircha statik (src/data/tours.ts) — backend kelganda shu yerga jonli qiymat uzatiladi.

const MAX_CHILDREN = 6;
export const BOOKING_ANCHOR = "booking";

interface BookingTour {
  slug: string;
  fixedDeparture: boolean;
  priceFromUsd: number;
  departures: Departure[];
}

interface BookingState {
  tour: BookingTour;
  open: Departure[];
  selected: Departure | null;
  adults: number;
  children: number;
  selectDate: (id: string) => void;
  setAdults: (n: number) => void;
  setChildren: (n: number) => void;
}

const BookingContext = createContext<BookingState | null>(null);

function useBooking(): BookingState {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error("Booking components must be rendered inside <BookingProvider>");
  return ctx;
}

/** Sayohatchilar soni tanlangan sananing o'rin qoldig'idan oshmasligi kerak. */
function clampParty(adults: number, children: number, seats: number) {
  const a = Math.max(1, Math.min(adults, Math.max(1, seats)));
  const c = Math.max(0, Math.min(children, MAX_CHILDREN, Math.max(0, seats - a)));
  return { adults: a, children: c };
}

export function BookingProvider({ tour, children: content }: { tour: BookingTour; children: React.ReactNode }) {
  const open = useMemo(() => tour.departures.filter((d) => d.seatsLeft > 0), [tour.departures]);
  const [dateId, setDateId] = useState<string | null>(open[0]?.id ?? null);
  const [party, setParty] = useState(() => clampParty(2, 0, open[0]?.seatsLeft ?? 1));

  const selected = open.find((d) => d.id === dateId) ?? open[0] ?? null;
  const seats = selected?.seatsLeft ?? 1;

  const value: BookingState = {
    tour,
    open,
    selected,
    adults: party.adults,
    children: party.children,
    selectDate: (id) => {
      const next = open.find((d) => d.id === id);
      if (!next) return; // o'rni tugagan yoki noma'lum sana tanlanmaydi
      setDateId(next.id);
      setParty((p) => clampParty(p.adults, p.children, next.seatsLeft));
    },
    setAdults: (n) => setParty((p) => clampParty(n, p.children, seats)),
    setChildren: (n) => setParty((p) => clampParty(p.adults, n, seats)),
  };

  return <BookingContext.Provider value={value}>{content}</BookingContext.Provider>;
}

// ── Jo'nash sanalari jadvali ─────────────────────────────────────────────
export function DatesTable() {
  const t = useTranslations("tour.dates");
  const tc = useTranslations("common.tourCard");
  const locale = useLocale() as Locale;
  const { tour, selected, selectDate } = useBooking();

  return (
    <>
      <ul className={styles.dates}>
        {tour.departures.map((d) => {
          const soldOut = d.seatsLeft <= 0;
          const isSelected = selected?.id === d.id;
          const range = formatDateRange(d.from, d.to, locale);
          return (
            <li
              key={d.id}
              className={styles.dateRow}
              data-selected={isSelected ? "1" : undefined}
              data-out={soldOut ? "1" : undefined}
            >
              <span className={styles.dateMain}>
                <span className={styles.dateRange}>{range}</span>
                <span className={styles.dateWeekday}>{weekday(d.from, locale)}</span>
              </span>
              <span className={styles.seatPill} data-state={soldOut ? "out" : d.seatsLeft <= 5 ? "low" : "ok"}>
                <Icon icon={User} size={14} />
                <span>{soldOut ? t("soldOut") : tc("seatsLeft", { count: d.seatsLeft })}</span>
              </span>
              <span className={styles.datePrice}>{money(d.priceUsd, locale)}</span>
              <button
                type="button"
                className={styles.dateButton}
                disabled={soldOut}
                aria-pressed={soldOut ? undefined : isSelected}
                aria-label={`${soldOut ? t("soldOut") : isSelected ? t("selected") : t("select")}: ${range}`}
                onClick={() => selectDate(d.id)}
              >
                {soldOut ? t("soldOut") : isSelected ? t("selected") : t("select")}
              </button>
            </li>
          );
        })}
      </ul>
      <p className={styles.datesNote}>{t("note")}</p>
    </>
  );
}

// ── Sanagich ─────────────────────────────────────────────────────────────
function Stepper({
  label,
  hint,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  const t = useTranslations("tour.booking");
  return (
    <div className={styles.stepRow} role="group" aria-label={label}>
      <span className={styles.stepLabel}>
        <span className={styles.stepName}>{label}</span>
        <span className={styles.stepHint}>{hint}</span>
      </span>
      <span className={`stepper ${styles.stepper}`}>
        <button
          type="button"
          className="stepper__btn"
          onClick={() => onChange(value - 1)}
          disabled={value <= min}
          aria-label={t("decrease", { label })}
        >
          <Icon icon={Minus} size={16} strokeWidth={2.2} />
        </button>
        <span className="stepper__value" aria-live="polite" aria-atomic="true">
          {value}
        </span>
        <button
          type="button"
          className="stepper__btn"
          onClick={() => onChange(value + 1)}
          disabled={value >= max}
          aria-label={t("increase", { label })}
        >
          <Icon icon={Plus} size={16} strokeWidth={2.2} />
        </button>
      </span>
    </div>
  );
}

// ── Bron kartochkasi ─────────────────────────────────────────────────────
export function BookingCard() {
  const t = useTranslations("tour");
  const tc = useTranslations("common.tourCard");
  const locale = useLocale() as Locale;
  const uid = useId();
  const { tour, open, selected, adults, children, selectDate, setAdults, setChildren } = useBooking();

  const price = selected?.priceUsd ?? tour.priceFromUsd;
  const header = (
    <div className={styles.bookHead}>
      <span className={styles.bookHeadLabel}>{tc("perPerson")}</span>
      <span className={styles.bookHeadPrice}>{money(price, locale)}</span>
    </div>
  );

  // "So'rov bo'yicha" tur: sana tanlanmaydi — so'rov formasiga yo'naltiriladi.
  if (!tour.fixedDeparture) {
    return (
      <div className={styles.book}>
        {header}
        <div className={styles.bookBody}>
          <p className={styles.bookText}>{t("request.text")}</p>
          <Link href={`/inquiry/${tour.slug}`} className="btn btn--accent btn--lg btn--block">
            <Icon icon={Send} size={17} />
            <span>{t("request.cta")}</span>
          </Link>
          <span className={styles.bookNote}>
            <Icon icon={ShieldCheck} size={15} className={styles.bookNoteIcon} />
            <span>{t("request.note")}</span>
          </span>
        </div>
      </div>
    );
  }

  // Sanasi bor tur, lekin hamma sanada o'rin tugagan.
  if (!selected) {
    return (
      <div className={styles.book}>
        {header}
        <div className={styles.bookBody}>
          <p className="notice notice--warn">{t("booking.allSoldOut")}</p>
          <Link href="/contact" className="btn btn--secondary btn--block">
            <Icon icon={Headset} size={16} />
            <span>{t("specialist.ask")}</span>
          </Link>
        </div>
      </div>
    );
  }

  const seats = selected.seatsLeft;
  const total = bookingTotal(price, adults, children);
  const adultsSum = bookingTotal(price, adults, 0);
  const atLimit = adults + children >= seats;
  const dateSelectId = `${uid}-date`;

  return (
    <div className={styles.book}>
      {header}
      <div className={styles.bookBody}>
        <div className={styles.bookField}>
          <label className={styles.bookLabel} htmlFor={dateSelectId}>
            {t("booking.date")}
          </label>
          <select
            id={dateSelectId}
            className={`select ${styles.bookSelect}`}
            value={selected.id}
            onChange={(e) => selectDate(e.target.value)}
          >
            {open.map((d) => (
              <option key={d.id} value={d.id}>
                {formatDateRange(d.from, d.to, locale)} · {tc("seatsLeft", { count: d.seatsLeft })}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.bookTravellers}>
          <span className={styles.bookLabel}>{t("booking.travellers")}</span>
          <Stepper
            label={t("booking.adults")}
            hint={t("booking.adultsHint")}
            value={adults}
            min={1}
            max={Math.max(1, seats - children)}
            onChange={setAdults}
          />
          <Stepper
            label={t("booking.children")}
            hint={t("booking.childrenHint")}
            value={children}
            min={0}
            max={Math.min(MAX_CHILDREN, Math.max(0, seats - adults))}
            onChange={setChildren}
          />
          {atLimit && (
            <p className={styles.bookLimit} role="status">
              {t("booking.limit", { count: seats })}
            </p>
          )}
        </div>

        <div className={styles.bookSum} aria-live="polite">
          <span className={styles.bookSumRow}>
            <span>{t("booking.adultsLine", { count: adults })}</span>
            <span className={styles.bookSumValue}>{money(adultsSum, locale)}</span>
          </span>
          {children > 0 && (
            <span className={styles.bookSumRow}>
              <span>{t("booking.childrenLine", { count: children })}</span>
              <span className={styles.bookSumValue}>{money(total - adultsSum, locale)}</span>
            </span>
          )}
          <span className={styles.bookTotal}>
            <span className={styles.bookTotalLabel}>{t("booking.total")}</span>
            <span className={styles.bookTotalValue}>{money(total, locale)}</span>
          </span>
        </div>

        <Link
          href={{
            pathname: `/book/${tour.slug}`,
            query: { date: selected.id, adults: String(adults), children: String(children) },
          }}
          className="btn btn--accent btn--lg btn--block"
        >
          <Icon icon={CalendarCheck} size={17} />
          <span>{t("booking.cta")}</span>
        </Link>

        <span className={styles.bookNote}>
          <Icon icon={ShieldCheck} size={15} className={styles.bookNoteIcon} />
          <span>{t("booking.note")}</span>
        </span>
      </div>
    </div>
  );
}

// ── Mobil yopishqoq pastki panel (< 1040px, TZ §8.1) ─────────────────────
export function MobileBar() {
  const t = useTranslations("tour");
  const tc = useTranslations("common.tourCard");
  const locale = useLocale() as Locale;
  const { tour, selected } = useBooking();
  // Bron kartochkasi ekranda ko'rinib turganda panel takror bo'lmasligi uchun yashiriladi.
  const [cardVisible, setCardVisible] = useState(false);

  useEffect(() => {
    const card = document.getElementById(BOOKING_ANCHOR);
    if (!card || typeof IntersectionObserver !== "function") return;
    const io = new IntersectionObserver((entries) => setCardVisible(entries.some((e) => e.isIntersecting)), {
      rootMargin: "-80px 0px -96px 0px",
    });
    io.observe(card);
    return () => io.disconnect();
  }, []);

  const price = selected?.priceUsd ?? tour.priceFromUsd;
  const bookable = tour.fixedDeparture && selected;

  return (
    <div className={styles.bar} data-hidden={cardVisible ? "1" : undefined} inert={cardVisible}>
      <span className={styles.barPrice}>
        <span className={styles.barValue}>{money(price, locale)}</span>
        <span className={styles.barLabel}>{tc("perPerson")}</span>
      </span>
      {bookable ? (
        <a href={`#${BOOKING_ANCHOR}`} className={`btn btn--accent ${styles.barCta}`}>
          <Icon icon={CalendarCheck} size={17} />
          <span>{t("booking.cta")}</span>
        </a>
      ) : tour.fixedDeparture ? (
        <a href={`#${BOOKING_ANCHOR}`} className={`btn btn--secondary ${styles.barCta}`}>
          {t("dates.soldOut")}
        </a>
      ) : (
        <Link href={`/inquiry/${tour.slug}`} className={`btn btn--accent ${styles.barCta}`}>
          <Icon icon={Send} size={17} />
          <span>{t("request.cta")}</span>
        </Link>
      )}
    </div>
  );
}
