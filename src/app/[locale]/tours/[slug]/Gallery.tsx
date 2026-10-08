"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import styles from "./tour.module.css";

export interface GalleryImage {
  src: string;
  alt: string;
}

const MAX_THUMBS = 4;

/** Asosiy rasm + 4 tagacha kichik rasm; kichik rasm bosilsa asosiy bilan o'rin almashadi. */
export function Gallery({ images }: { images: GalleryImage[] }) {
  const t = useTranslations("tour.gallery");
  const [main, setMain] = useState(0);
  const current = images[main] ?? images[0];
  const thumbs = images.map((img, index) => ({ ...img, index })).filter((img) => img.index !== main).slice(0, MAX_THUMBS);

  return (
    <div className={styles.gallery} data-thumbs={thumbs.length} role="group" aria-label={t("label")}>
      <div className={styles.galleryMain}>
        <Image
          key={current.src}
          src={current.src}
          alt={current.alt}
          fill
          priority={main === 0}
          sizes="(min-width: 1280px) 820px, (min-width: 760px) 68vw, 100vw"
          className={styles.galleryImg}
        />
        <span className={styles.galleryCaption} aria-live="polite">
          {current.alt}
        </span>
      </div>

      {thumbs.length > 0 && (
        <div className={styles.thumbs}>
          {thumbs.map((img, slot) => (
            // Kalit — o'rin (slot): bosilgandan keyin tugma DOM'da qoladi va klaviatura fokusi yo'qolmaydi.
            <button
              key={slot}
              type="button"
              className={styles.thumb}
              onClick={() => setMain(img.index)}
              aria-label={t("show", { alt: img.alt })}
            >
              <Image
                src={img.src}
                alt=""
                fill
                sizes="(min-width: 1280px) 190px, (min-width: 760px) 16vw, 25vw"
                className={styles.galleryImg}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
