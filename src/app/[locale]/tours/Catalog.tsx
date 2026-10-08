"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowDown, ListFilter, RotateCw, X, ZoomOut } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { PRICE_MAX, PRICE_MIN, categories, categoryIds, countries, countryIds, toursByRank } from "@/data/tours";
import { Icon } from "@/components/Icon";
import { TourCard } from "@/components/TourCard";
import { money } from "@/lib/format";
import { tr } from "@/lib/l10n";
import {
  DURATIONS,
  PAGE_SIZE,
  PRICE_STEP,
  SORTS,
  applyFilters,
  hasActiveFilters,
  parseFilters,
  serializeFilters,
  type Filters,
  type Sort,
} from "./filters";
import styles from "./catalog.module.css";

const SORT_KEY: Record<Sort, "popular" | "priceAsc" | "priceDesc" | "daysAsc"> = {
  popular: "popular",
  "price-asc": "priceAsc",
  "price-desc": "priceDesc",
  "days-asc": "daysAsc",
};

const DESKTOP_QUERY = "(min-width: 1000px)";
const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Bannerdagi jonli hisoblagich: "N tur topildi". */
export function ResultCount({ query }: { query: string }) {
  const t = useTranslations("catalog");
  const count = useMemo(() => applyFilters(toursByRank, parseFilters(query)).length, [query]);
  return (
    <p className={styles.counter} role="status">
      <span className={styles.counterNum}>{count}</span>
      <span className={styles.counterLabel}>{t("found", { count })}</span>
    </p>
  );
}

/**
 * Katalog (filtr + natijalar). `query` — URL'ning query qismi (`?`siz).
 * O'zi `useSearchParams` chaqirmaydi, shuning uchun `query=""` bilan serverda
 * to'liq render bo'ladi (Suspense fallback = default ro'yxat, SEO uchun).
 */
export function Catalog({ query }: { query: string }) {
  const t = useTranslations("catalog");
  const tc = useTranslations("common");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const uid = useId();

  // URL — haqiqat manbai. `pending` — router.replace tugaguncha UI darhol javob berishi uchun
  // optimistik qatlam; URL o'zgargach (shu jumladan "orqaga" tugmasi) o'z-o'zidan bekor bo'ladi.
  const parsed = useMemo(() => parseFilters(query), [query]);
  const [pending, setPending] = useState<{ from: string; filters: Filters } | null>(null);
  const filters = pending && pending.from === query ? pending.filters : parsed;
  const canonical = serializeFilters(filters);

  const results = useMemo(() => applyFilters(toursByRank, filters), [filters]);
  const count = results.length;

  // Filtr/saralash o'zgarsa sahifalash 6 ga qaytadi (effektsiz — kalit bo'yicha hosil qilinadi).
  const [page, setPage] = useState({ key: canonical, shown: PAGE_SIZE });
  const shown = page.key === canonical ? page.shown : PAGE_SIZE;

  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const update = useCallback(
    (patch: Partial<Filters>, debounceMs = 0) => {
      const next = { ...filters, ...patch };
      setPending({ from: query, filters: next });
      const qs = serializeFilters(next);
      const go = () => router.replace(qs ? `/tours?${qs}` : "/tours", { scroll: false });
      window.clearTimeout(timer.current);
      if (debounceMs > 0) timer.current = window.setTimeout(go, debounceMs);
      else go();
    },
    [filters, query, router],
  );

  const toggle = <K extends "countries" | "categories">(key: K, id: Filters[K][number]) => {
    const list = filters[key] as string[];
    const order = (key === "countries" ? countryIds : categoryIds) as string[];
    const next = list.includes(id) ? list.filter((x) => x !== id) : order.filter((x) => x === id || list.includes(x));
    update({ [key]: next } as Partial<Filters>);
  };

  const clearAll = () =>
    update({ countries: [], categories: [], maxPrice: PRICE_MAX, duration: null, fixedOnly: false });

  const tourCounts = useMemo(() => {
    const byCountry = new Map<string, number>();
    const byCategory = new Map<string, number>();
    for (const tour of toursByRank) {
      byCountry.set(tour.country, (byCountry.get(tour.country) ?? 0) + 1);
      byCategory.set(tour.category, (byCategory.get(tour.category) ?? 0) + 1);
    }
    return { byCountry, byCategory };
  }, []);

  // Chip = olib tashlanganda qo'llanadigan o'zgarish (patch).
  const chips: { key: string; label: string; patch: Partial<Filters> }[] = [
    ...filters.countries.map((id) => ({
      key: `c-${id}`,
      label: tr(countries[id].name, locale),
      patch: { countries: filters.countries.filter((x) => x !== id) },
    })),
    ...filters.categories.map((id) => ({
      key: `k-${id}`,
      label: tr(categories[id].name, locale),
      patch: { categories: filters.categories.filter((x) => x !== id) },
    })),
  ];
  if (filters.duration) {
    chips.push({
      key: "duration",
      label: t("filters.durationChip", { range: filters.duration.replace("-", "–") }),
      patch: { duration: null },
    });
  }
  if (filters.maxPrice < PRICE_MAX) {
    chips.push({
      key: "price",
      label: t("filters.upToPlain", { price: money(filters.maxPrice, locale) }),
      patch: { maxPrice: PRICE_MAX },
    });
  }
  if (filters.fixedOnly) {
    chips.push({ key: "fixed", label: tc("tourCard.fixed"), patch: { fixedOnly: false } });
  }

  // ── Mobil sheet (< 1000px) ────────────────────────────────────────────
  const [sheetOpen, setSheetOpen] = useState(false);
  const sheetRef = useRef<HTMLElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!sheetOpen) return;
    const sheet = sheetRef.current;
    const trigger = triggerRef.current;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setSheetOpen(false);
        return;
      }
      if (e.key !== "Tab" || !sheet) return;
      const items = Array.from(sheet.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (!sheet.contains(active)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    // Ekran kengaysa sheet yon panelga aylanadi — modal holat yopiladi.
    const mq = window.matchMedia(DESKTOP_QUERY);
    const onWide = (e: MediaQueryListEvent) => {
      if (e.matches) setSheetOpen(false);
    };
    document.addEventListener("keydown", onKey);
    mq.addEventListener("change", onWide);
    return () => {
      document.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onWide);
      document.body.style.overflow = prevOverflow;
      // Fokus sheetni ochgan tugmaga qaytadi (desktopda u yashirin — fokus o'tmaydi)
      if (trigger && trigger.offsetParent !== null) trigger.focus();
    };
  }, [sheetOpen]);

  const priceId = `${uid}-price`;
  const sheetTitleId = `${uid}-filters`;
  const sortId = `${uid}-sort`;

  return (
    <div className={`container ${styles.layout}`}>
        {sheetOpen && <div className={styles.scrim} onClick={() => setSheetOpen(false)} aria-hidden="true" />}

        <aside
          ref={sheetRef}
          className={styles.aside}
          data-open={sheetOpen ? "1" : undefined}
          role={sheetOpen ? "dialog" : undefined}
          aria-modal={sheetOpen ? true : undefined}
          aria-labelledby={sheetTitleId}
        >
          <div className={styles.panel}>
            <div className={styles.panelHead}>
              <h2 className={styles.panelTitle} id={sheetTitleId}>
                <Icon icon={ListFilter} size={16} />
                <span>{t("filters.title")}</span>
              </h2>
              <span className={styles.panelActions}>
                <button type="button" className={styles.clear} onClick={clearAll} disabled={!hasActiveFilters(filters)}>
                  {t("filters.clear")}
                </button>
                <button
                  type="button"
                  ref={closeRef}
                  className={styles.sheetClose}
                  onClick={() => setSheetOpen(false)}
                  aria-label={tc("nav.close")}
                >
                  <Icon icon={X} size={18} strokeWidth={2} />
                </button>
              </span>
            </div>

            <div className={styles.panelBody}>
              <div className={styles.group} role="group" aria-labelledby={`${uid}-dest`}>
                <span className={`meta-label ${styles.groupTitle}`} id={`${uid}-dest`}>
                  {t("filters.destination")}
                </span>
                {countryIds.map((id) => (
                  <label key={id} className={styles.option}>
                    <input
                      type="checkbox"
                      checked={filters.countries.includes(id)}
                      onChange={() => toggle("countries", id)}
                    />
                    <span className={styles.optionLabel}>{tr(countries[id].name, locale)}</span>
                    <span className={styles.optionCount}>{tourCounts.byCountry.get(id) ?? 0}</span>
                  </label>
                ))}
              </div>

              <div className={`${styles.group} ${styles.divided}`} role="group" aria-labelledby={`${uid}-cat`}>
                <span className={`meta-label ${styles.groupTitle}`} id={`${uid}-cat`}>
                  {t("filters.category")}
                </span>
                {categoryIds.map((id) => (
                  <label key={id} className={styles.option}>
                    <input
                      type="checkbox"
                      checked={filters.categories.includes(id)}
                      onChange={() => toggle("categories", id)}
                    />
                    <span className={styles.optionLabel}>{tr(categories[id].name, locale)}</span>
                    <span className={styles.optionCount}>{tourCounts.byCategory.get(id) ?? 0}</span>
                  </label>
                ))}
              </div>

              <div className={`${styles.price} ${styles.divided}`}>
                <label className="meta-label" htmlFor={priceId}>
                  {t("filters.price")}
                </label>
                <output className={styles.priceValue} htmlFor={priceId}>
                  {t.rich("filters.upTo", {
                    price: money(filters.maxPrice, locale),
                    b: (chunks) => <span className={styles.priceNum}>{chunks}</span>,
                  })}
                </output>
                <input
                  id={priceId}
                  type="range"
                  min={PRICE_MIN}
                  max={PRICE_MAX}
                  step={PRICE_STEP}
                  value={filters.maxPrice}
                  onChange={(e) => update({ maxPrice: Number(e.target.value) }, 160)}
                  aria-valuetext={t("filters.upToPlain", { price: money(filters.maxPrice, locale) })}
                />
              </div>

              <div className={`${styles.duration} ${styles.divided}`}>
                <span className="meta-label" id={`${uid}-dur`}>
                  {t("filters.duration")}
                </span>
                <div role="group" aria-labelledby={`${uid}-dur`} className={styles.segments}>
                  <button
                    type="button"
                    className={styles.segment}
                    aria-pressed={filters.duration === null}
                    onClick={() => update({ duration: null })}
                  >
                    {t("filters.any")}
                  </button>
                  {DURATIONS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      className={styles.segment}
                      aria-pressed={filters.duration === d}
                      aria-label={t("filters.durationChip", { range: d.replace("-", "–") })}
                      onClick={() => update({ duration: d })}
                    >
                      {d.replace("-", "–")}
                    </button>
                  ))}
                </div>
              </div>

              <label className={`${styles.fixed} ${styles.divided}`}>
                <input
                  type="checkbox"
                  checked={filters.fixedOnly}
                  onChange={() => update({ fixedOnly: !filters.fixedOnly })}
                />
                <span>{t("filters.fixedOnly")}</span>
              </label>
            </div>
          </div>

          <button type="button" className={styles.apply} onClick={() => setSheetOpen(false)}>
            {t("filters.showing", { count })}
          </button>
        </aside>

        <div className={styles.main}>
          <div className={styles.toolbar}>
            <button
              type="button"
              ref={triggerRef}
              className={styles.openFilters}
              onClick={() => setSheetOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={sheetOpen}
            >
              <Icon icon={ListFilter} size={16} />
              <span>{t("filters.title")}</span>
            </button>

            <ul className={styles.chips} aria-label={t("filters.active")}>
              {chips.map((chip) => (
                <li key={chip.key}>
                  <button
                    type="button"
                    className={styles.chip}
                    onClick={() => update(chip.patch)}
                    aria-label={t("filters.remove", { label: chip.label })}
                  >
                    <span>{chip.label}</span>
                    <Icon icon={X} size={14} strokeWidth={2.2} />
                  </button>
                </li>
              ))}
            </ul>

            <div className={styles.sort}>
              <label htmlFor={sortId}>{t("sort.label")}</label>
              <select
                id={sortId}
                className={styles.sortSelect}
                value={filters.sort}
                onChange={(e) => update({ sort: e.target.value as Sort })}
              >
                {SORTS.map((s) => (
                  <option key={s} value={s}>
                    {t(`sort.${SORT_KEY[s]}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {count > 0 ? (
            <>
              {/* Barcha natijalar DOM'da (SEO); `shown` dan keyingilari "Ko'proq yuklash"gacha yashirin. */}
              <ul className="card-grid">
                {results.map((tour, i) => (
                  <li key={tour.id} hidden={i >= shown} className={styles.cell}>
                    <TourCard tour={tour} priority={i < 2} />
                  </li>
                ))}
              </ul>
              {count > shown && (
                <button
                  type="button"
                  className={styles.more}
                  onClick={() => setPage({ key: canonical, shown: shown + PAGE_SIZE })}
                >
                  <span>{t("loadMore")}</span>
                  <Icon icon={ArrowDown} size={16} />
                </button>
              )}
            </>
          ) : (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>
                <Icon icon={ZoomOut} size={28} strokeWidth={1.6} />
              </span>
              <h2 className={styles.emptyTitle}>{t("empty.title")}</h2>
              <p className={styles.emptyText}>{t("empty.text")}</p>
              <div className={styles.emptyActions}>
                <button type="button" className="btn btn--primary" onClick={clearAll}>
                  <Icon icon={RotateCw} size={16} />
                  <span>{t("empty.clear")}</span>
                </button>
                <Link href="/contact" className={`btn ${styles.emptyLink}`}>
                  {t("empty.custom")}
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
  );
}
