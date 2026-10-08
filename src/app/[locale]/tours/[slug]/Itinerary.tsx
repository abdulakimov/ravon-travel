"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { Icon } from "@/components/Icon";
import styles from "./tour.module.css";

export interface ItineraryItem {
  title: string;
  text: string;
  tags: string[];
}

/** Kun-kun akkordeon. Barcha panellar DOM'da (yopiqlari `hidden`) — kontent qidiruv tizimlariga ko'rinadi. */
export function Itinerary({ days }: { days: ItineraryItem[] }) {
  const t = useTranslations("tour.itinerary");
  const uid = useId();
  const [open, setOpen] = useState<number[]>([0]);
  const allOpen = open.length === days.length;

  const toggle = (i: number) => setOpen((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));

  return (
    <>
      <div className={styles.sectionHead}>
        <h2 className={styles.h2}>{t("title")}</h2>
        <button
          type="button"
          className={styles.textButton}
          onClick={() => setOpen(allOpen ? [] : days.map((_, i) => i))}
          aria-expanded={allOpen}
        >
          {allOpen ? t("collapseAll") : t("expandAll")}
        </button>
      </div>

      <ol className={styles.days}>
        {days.map((day, i) => {
          const isOpen = open.includes(i);
          const btnId = `${uid}-d${i}`;
          const panelId = `${uid}-p${i}`;
          return (
            <li key={i} className={styles.day}>
              <h3 className={styles.dayHeading}>
                <button
                  type="button"
                  id={btnId}
                  className={styles.dayButton}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => toggle(i)}
                >
                  <span className={styles.dayNum} aria-hidden="true">
                    {i + 1}
                  </span>
                  <span className={styles.dayText}>
                    <span className={styles.dayLabel}>{t("day", { n: i + 1 })}</span>
                    <span className={styles.dayTitle}>{day.title}</span>
                  </span>
                  <Icon icon={ChevronDown} size={20} strokeWidth={2} className={styles.dayChevron} />
                </button>
              </h3>
              <div id={panelId} role="region" aria-labelledby={btnId} className={styles.dayPanel} hidden={!isOpen}>
                <p>{day.text}</p>
                {day.tags.length > 0 && (
                  <ul className={styles.tags}>
                    {day.tags.map((tag) => (
                      <li key={tag}>{tag}</li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </>
  );
}
