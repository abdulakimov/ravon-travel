import type { LucideIcon, LucideProps } from "lucide-react";

// Dizayn tizimi: 24×24 setka, 1.8px chiziq, yumaloq uchlar. Lucide default'i 2px —
// shuning uchun barcha ikonkalar shu o'ram orqali chiziladi.
export function Icon({
  icon: Glyph,
  size = 18,
  strokeWidth = 1.8,
  ...rest
}: { icon: LucideIcon } & LucideProps) {
  return (
    <Glyph
      size={size}
      strokeWidth={strokeWidth}
      aria-hidden={rest["aria-label"] ? undefined : true}
      focusable={false}
      style={{ flex: "none", ...rest.style }}
      {...rest}
    />
  );
}
