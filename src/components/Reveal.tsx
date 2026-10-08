"use client";

import { useEffect, useRef } from "react";

// Scroll'da paydo bo'lish: faqat ekran ostidagi elementlar yashiriladi, birinchi
// ekrandagilar darhol ko'rinadi. 2.5s zaxira — hech narsa ko'rinmay qolmaydi.
export function Reveal({
  children,
  className,
  as: Tag = "div",
  ...rest
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "li" | "article";
} & React.HTMLAttributes<HTMLElement>) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const show = () => el.setAttribute("data-revealed", "1");
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      typeof IntersectionObserver !== "function" ||
      el.getBoundingClientRect().top <= window.innerHeight * 0.92
    ) {
      el.setAttribute("data-instant", "1");
      show();
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          show();
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.05 },
    );
    io.observe(el);
    const fallback = window.setTimeout(show, 3200);
    return () => {
      io.disconnect();
      window.clearTimeout(fallback);
    };
  }, []);

  return (
    // @ts-expect-error — polimorf teg uchun ref turi
    <Tag ref={ref} className={className ? `reveal ${className}` : "reveal"} {...rest}>
      {children}
    </Tag>
  );
}
