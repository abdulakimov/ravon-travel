"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { CalendarCheck, Menu, X } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { locales } from "@/i18n/routing";
import { Icon } from "./Icon";
import { Logo } from "./Brand";
import styles from "./Header.module.css";

const NAV = [
  { key: "home", href: "/" },
  { key: "tours", href: "/tours" },
  { key: "destinations", href: "/destinations" },
  { key: "blog", href: "/blog" },
  { key: "about", href: "/about" },
  { key: "contact", href: "/contact" },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/tours") return /^\/(tours|book|pay|inquiry)(\/|$)/.test(pathname);
  return pathname === href || pathname.startsWith(href + "/");
}

export function Header() {
  const t = useTranslations("common.nav");
  const locale = useLocale();
  const pathname = usePathname();
  const search = useSearchParams();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Mobil menyu ochiq bo'lsa: scroll bloklanadi, Esc yopadi, Tab panel ichida aylanadi,
  // yopilganda fokus hamburger tugmasiga qaytadi.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const burger = burgerRef.current;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key !== "Tab") return;
      const items = drawerRef.current?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])");
      if (!items?.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !drawerRef.current?.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !drawerRef.current?.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      burger?.focus();
    };
  }, [open]);

  // Til almashganda joriy sahifa va query (masalan katalog filtrlari) saqlanadi.
  const qs = search.toString();
  const here = qs ? `${pathname}?${qs}` : pathname;

  return (
    <>
    <header className={styles.header} data-scrolled={scrolled ? "1" : undefined}>
      <div className={`container ${styles.bar}`}>
        <Link href="/" className={styles.logo} aria-label="Ravon Travel">
          <Logo />
        </Link>

        <nav className={styles.nav} aria-label={t("main")}>
          {NAV.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={styles.navLink}
              aria-current={isActive(pathname, item.href) ? "page" : undefined}
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>

        <div className={styles.actions}>
          <div className={styles.lang} role="group" aria-label={t("language")}>
            {locales.map((l) => (
              <Link
                key={l}
                href={here}
                locale={l}
                className={styles.langBtn}
                aria-current={l === locale ? "true" : undefined}
                hrefLang={l}
                scroll={false}
              >
                {l.toUpperCase()}
              </Link>
            ))}
          </div>

          <Link href="/tours" className={`btn btn--primary btn--sm ${styles.cta}`}>
            <Icon icon={CalendarCheck} size={16} />
            <span>{t("book")}</span>
          </Link>

          <button
            ref={burgerRef}
            type="button"
            className={styles.burger}
            aria-label={t("menu")}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen(true)}
          >
            <Icon icon={Menu} size={20} />
          </button>
        </div>
      </div>
    </header>

      {/* Drawer <header>dan tashqarida: backdrop-filter ichidagi position:fixed ni qamab qo'yadi. */}
      {open && (
        <div ref={drawerRef} className={styles.drawer} id="mobile-menu" role="dialog" aria-modal="true" aria-label={t("menu")}>
          <div className={styles.drawerTop}>
            <Logo emblem={34} size={17} />
            <button type="button" className={styles.burgerClose} aria-label={t("close")} onClick={() => setOpen(false)} autoFocus>
              <Icon icon={X} size={18} />
            </button>
          </div>
          <nav className={styles.drawerNav} aria-label={t("main")}>
            {NAV.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={styles.drawerLink}
                aria-current={isActive(pathname, item.href) ? "page" : undefined}
                onClick={() => setOpen(false)}
              >
                {t(item.key)}
              </Link>
            ))}
            <Link href="/tours" className={styles.drawerCta} onClick={() => setOpen(false)}>
              {t("book")}
            </Link>
          </nav>
        </div>
      )}
    </>
  );
}
