import { site } from "@/config/site";

// Ravon Travel logotipi — kompaniyaning haqiqiy logosidan vektorlashtirilgan (public/brand/*.svg, 2026-10-21).
// Fayl sifatida (<img>) beriladi: brauzer keshlaydi va oltin gradient ID'lari sahifada to'qnashmaydi.
// next/image ishlatilmaydi: loyiha loaderi faqat public/img/*.jpg uchun WebP yo'llarini beradi.

const LOGOS = {
  // [fayl, kenglik/balandlik nisbati] — nisbat SVG viewBox'idan
  horizontal: { light: "/brand/ravon-horizontal-on-light.svg", dark: "/brand/ravon-horizontal.svg", ratio: 2287 / 555 },
  stacked: { light: "/brand/ravon-logo-on-light.svg", dark: "/brand/ravon-logo.svg", ratio: 1556 / 1381 },
} as const;

export function Logo({
  height = 42,
  variant = "horizontal",
  inverse = false,
  alt = site.name,
}: {
  height?: number;
  /** horizontal — sarlavha/vaucher; stacked — footer va katta joylar */
  variant?: keyof typeof LOGOS;
  /** To'q (yashil) fonda — asl oltin gradient; aks holda och fon uchun to'q oltin */
  inverse?: boolean;
  /** Havola ichida bo'lsa va havolaning o'z aria-label'i bo'lsa — "" bering. Balandlikni CSS'da `--logo-h` bilan o'zgartirish mumkin. */
  alt?: string;
}) {
  const logo = LOGOS[variant];
  return (
    // eslint-disable-next-line @next/next/no-img-element -- SVG logo, optimizatsiya kerak emas
    <img
      src={inverse ? logo.dark : logo.light}
      alt={alt}
      width={Math.round(height * logo.ratio)}
      height={height}
      style={{ display: "block", flex: "none", height: `var(--logo-h, ${height}px)`, width: "auto" }}
      decoding="async"
    />
  );
}

/** Brend chizig'i: logodagi «— TRAVEL —» chiziqlari va tog' cho'qqisi motivi (eyebrow, xato sahifasi). */
export function Rule({ color = "var(--accent)" }: { color?: string }) {
  return (
    <svg width="30" height="10" viewBox="0 0 30 10" aria-hidden="true" style={{ flex: "none" }}>
      <path
        d="M1 8h9.5L15 2.5 19.5 8H29"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function Eyebrow({
  children,
  tone = "primary",
  as: Tag = "span",
}: {
  children: React.ReactNode;
  tone?: "primary" | "light" | "accent";
  as?: "span" | "p" | "div";
}) {
  const cls = tone === "primary" ? "eyebrow" : `eyebrow eyebrow--${tone}`;
  return (
    <Tag className={cls}>
      <Rule />
      <span>{children}</span>
    </Tag>
  );
}
