"use client";

import { useState } from "react";
import { ArrowRight, Plus } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Icon } from "@/components/Icon";
import styles from "./faq.module.css";

export type FaqEntry = {
  id: string;
  question: string;
  paragraphs: string[];
  list?: string[];
  link?: { href: string; label: string };
};

// Akkordeon: sarlavha ichida <button aria-expanded aria-controls> + role="region" panel.
// JS'siz barcha javoblar ochiq ko'rinadi (yopish faqat html.js bo'lganda CSS orqali ishlaydi).
export function FaqAccordion({ items }: { items: FaqEntry[] }) {
  const [open, setOpen] = useState<ReadonlySet<string>>(() => new Set(items.slice(0, 1).map((i) => i.id)));

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className={styles.list}>
      {items.map((item) => {
        const isOpen = open.has(item.id);
        return (
          <div key={item.id} id={item.id} className={styles.item} data-open={isOpen}>
            <h2 className={styles.heading}>
              <button
                type="button"
                id={`faq-q-${item.id}`}
                className={styles.trigger}
                aria-expanded={isOpen}
                aria-controls={`faq-a-${item.id}`}
                onClick={() => toggle(item.id)}
              >
                <span>{item.question}</span>
                <span className={styles.sign}>
                  <Icon icon={Plus} size={18} />
                </span>
              </button>
            </h2>
            <div id={`faq-a-${item.id}`} role="region" aria-labelledby={`faq-q-${item.id}`} className={styles.panel}>
              {item.paragraphs.map((text) => (
                <p key={text}>{text}</p>
              ))}
              {item.list && (
                <ul>
                  {item.list.map((text) => (
                    <li key={text}>{text}</li>
                  ))}
                </ul>
              )}
              {item.link && (
                <Link href={item.link.href} className={styles.more}>
                  <span>{item.link.label}</span>
                  <Icon icon={ArrowRight} size={15} />
                </Link>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
