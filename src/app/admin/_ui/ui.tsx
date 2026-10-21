import Link from "next/link";

// Admin panelning umumiy kichik komponentlari (server).

export function PageHead({
  title,
  description,
  crumbs,
  actions,
}: {
  title: string;
  description?: React.ReactNode;
  crumbs?: { href: string; label: string }[];
  actions?: React.ReactNode;
}) {
  return (
    <header className="page-head">
      <div>
        {crumbs && (
          <div className="crumbs">
            {crumbs.map((c, i) => (
              <span key={c.href}>
                {i > 0 && " / "}
                <Link href={c.href}>{c.label}</Link>
              </span>
            ))}
          </div>
        )}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="actions">{actions}</div>}
    </header>
  );
}

export type Tone = "success" | "warn" | "danger" | "info" | "neutral";

/** Murojaat holati ranglari */
export const STATE_TONE: Record<"new" | "in_progress" | "done" | "spam", Tone> = { new: "warn", in_progress: "info", done: "success", spam: "neutral" };

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: React.ReactNode }) {
  return <span className={`badge ${tone === "neutral" ? "" : tone}`}>{children}</span>;
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="empty">{children}</div>;
}

/** Sana-vaqt (Toshkent), admin uchun ixcham: 21.10.2026 14:05 */
export function fmtDateTime(ms: number | string | undefined | null): string {
  if (ms === undefined || ms === null || ms === "") return "—";
  const d = typeof ms === "number" ? new Date(ms) : new Date(ms);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Asia/Tashkent",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/** YYYY-MM-DD → 21.10.2026 */
export function fmtDate(iso: string | undefined | null): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}.${m}.${y}`;
}

/** 11 260 000 so'm */
export function fmtSom(n: number | undefined | null): string {
  if (n === undefined || n === null || !Number.isFinite(n)) return "—";
  return `${Math.round(n).toLocaleString("ru-RU").replace(/ /g, " ")} so'm`;
}

/** Server render vaqti (ms). Server komponentlar har so'rovda qayta render bo'ladi. */
export const nowMs = () => Date.now();
