// Logo 1b «Ufq» va «Ravon to'lqini» motivi — brend qo'llanmasidan aynan ko'chirilgan SVG.

export function Emblem({ size = 40, inverse = false }: { size?: number; inverse?: boolean }) {
  const disc = inverse ? "#FFFFFF" : "#0A66E8";
  const wave = inverse ? "#0A66E8" : "#FFFFFF";
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" style={{ flex: "none", display: "block" }}>
      <circle cx="24" cy="24" r="24" fill={disc} />
      <path d="M14.5 26.5a9.5 9.5 0 0 1 19 0z" fill="#FFC233" />
      <path d="M9 31.6c5-3.2 10-3.2 15 0s10 3.2 15 0" fill="none" stroke={wave} strokeWidth="2.6" strokeLinecap="round" />
      <path
        d="M15 37c3-1.9 6-1.9 9 0s6 1.9 9 0"
        fill="none"
        stroke={wave}
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  );
}

export function Logo({
  emblem = 40,
  size = 20,
  inverse = false,
}: {
  emblem?: number;
  /** «RAVON» yozuvi o'lchami (px); «TRAVEL» ≈ 0.42× */
  size?: number;
  inverse?: boolean;
}) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 11 }}>
      <Emblem size={emblem} inverse={inverse} />
      <span style={{ display: "flex", flexDirection: "column", gap: 5, lineHeight: 1 }}>
        <span style={{ fontSize: size, fontWeight: 800, letterSpacing: "0.2em", color: inverse ? "#FFFFFF" : "#0B1B33" }}>
          RAVON
        </span>
        <span
          style={{
            fontSize: Math.round(size * 0.425 * 10) / 10,
            fontWeight: 700,
            letterSpacing: "0.66em",
            color: inverse ? "#FFC233" : "#0A66E8",
          }}
        >
          TRAVEL
        </span>
      </span>
    </span>
  );
}

export function Wave({ color = "#FFC233" }: { color?: string }) {
  return (
    <svg width="30" height="10" viewBox="0 0 30 10" aria-hidden="true" style={{ flex: "none" }}>
      <path
        d="M1 5c3.2-3.4 6.4-3.4 9.6 0s6.4 3.4 9.6 0 6.4-3.4 9.6 0"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
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
      <Wave />
      <span>{children}</span>
    </Tag>
  );
}
