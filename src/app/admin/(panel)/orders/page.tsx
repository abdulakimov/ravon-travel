import type { Metadata } from "next";
import Link from "next/link";
import { requirePage } from "@/lib/admin/guard";
import { listOrders } from "@/lib/admin/orders-admin";
import { getTourRecords } from "@/lib/content";
import { publicStatus, type Order } from "@/lib/orders";
import { Badge, Empty, PageHead, fmtDate, fmtDateTime, fmtSom } from "../../_ui/ui";
import { orderStatusView } from "../../_ui/order-status";

export const metadata: Metadata = { title: "Bronlar" };

type Filter = "all" | "new" | "paid" | "awaiting" | "closed";
const FILTERS: { key: Filter; label: string }[] = [
  { key: "new", label: "Yangi to'lovlar" },
  { key: "paid", label: "To'langan" },
  { key: "awaiting", label: "To'lov kutilmoqda" },
  { key: "closed", label: "Bekor / qaytarilgan" },
  { key: "all", label: "Hammasi" },
];

const match = (o: Order, f: Filter) => {
  const s = publicStatus(o);
  if (f === "new") return o.status === "paid" && !o.handled;
  if (f === "paid") return o.status === "paid";
  if (f === "awaiting") return s === "awaiting";
  if (f === "closed") return o.status === "cancelled" || o.status === "refunded";
  return true;
};

export default async function OrdersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requirePage("manager");
  const sp = await searchParams;
  const filter = (FILTERS.some((f) => f.key === sp.f) ? sp.f : "all") as Filter;
  const q = (sp.q ?? "").trim().toUpperCase().slice(0, 40);
  const [orders, tours] = await Promise.all([listOrders(), getTourRecords()]);
  const titles = new Map(tours.map((t) => [t.slug, t.title.uz]));
  const rows = orders.filter((o) => match(o, filter)).filter((o) => !q || o.id.includes(q) || (titles.get(o.tourSlug) ?? "").toUpperCase().includes(q));
  const counts = Object.fromEntries(FILTERS.map((f) => [f.key, orders.filter((o) => match(o, f.key)).length]));

  return (
    <>
      <PageHead title="Bronlar" description="Saytdan qilingan bronlar va Click to'lovlari." />
      <div className="toolbar">
        <nav className="tabs" aria-label="Holat bo'yicha">
          {FILTERS.map((f) => (
            <Link key={f.key} href={`/orders?f=${f.key}${q ? `&q=${encodeURIComponent(q)}` : ""}`} aria-current={filter === f.key ? "page" : undefined}>
              {f.label} <span className="muted">{counts[f.key]}</span>
            </Link>
          ))}
        </nav>
        <form style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <input type="hidden" name="f" value={filter} />
          <input className="input" name="q" defaultValue={q} placeholder="Bron raqami yoki tur…" aria-label="Qidirish" />
          <button className="btn" type="submit">
            Qidirish
          </button>
        </form>
      </div>

      <div className="card table-wrap">
        {rows.length === 0 ? (
          <Empty>Bu bo&apos;limda bron yo&apos;q.</Empty>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Bron №</th>
                <th>Yaratilgan</th>
                <th>Tur</th>
                <th>Jo&apos;nash</th>
                <th className="num">Kishi</th>
                <th className="num">Summa</th>
                <th>Holat</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => {
                const st = orderStatusView(o);
                return (
                  <tr key={o.id}>
                    <td className="nowrap">
                      <Link className="row-link mono" href={`/orders/${o.id}`}>
                        {o.id}
                      </Link>
                      {o.status === "paid" && !o.handled && (
                        <>
                          {" "}
                          <Badge tone="warn">yangi</Badge>
                        </>
                      )}
                    </td>
                    <td className="nowrap">{fmtDateTime(o.createdAt)}</td>
                    <td>{titles.get(o.tourSlug) ?? o.tourSlug}</td>
                    <td className="nowrap">{fmtDate(o.departureId)}</td>
                    <td className="num">{o.adults + o.children}</td>
                    <td className="num">{fmtSom(o.amountUzs)}</td>
                    <td>
                      <Badge tone={st.tone}>{st.label}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
