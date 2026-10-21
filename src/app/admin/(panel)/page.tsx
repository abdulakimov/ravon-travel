import type { Metadata } from "next";
import Link from "next/link";
import { requirePage } from "@/lib/admin/guard";
import { LEAD_KIND_LABEL, LEAD_STATE_LABEL, listLeads } from "@/lib/admin/leads-admin";
import { listOrders } from "@/lib/admin/orders-admin";
import { getTourRecords } from "@/lib/content";
import { publicStatus } from "@/lib/orders";
import { todayIso } from "@/lib/tour-utils";
import { orderStatusView } from "../_ui/order-status";
import { Badge, Empty, PageHead, STATE_TONE, fmtDate, fmtDateTime, fmtSom, nowMs } from "../_ui/ui";

export const metadata: Metadata = { title: "Bosh sahifa" };

const DAY = 86_400_000;

export default async function Dashboard() {
  const user = await requirePage("manager");
  const [orders, leads, tours] = await Promise.all([listOrders(), listLeads(), getTourRecords()]);
  const now = nowMs();
  const today = todayIso();
  const monthStart = `${today.slice(0, 7)}-01`;
  const paid = orders.filter((o) => o.status === "paid" && o.paidAt);
  const paidDay = (o: { paidAt?: number }) => todayIso(new Date(o.paidAt ?? 0));
  const sum = (list: { amountUzs: number }[]) => list.reduce((s, o) => s + o.amountUzs, 0);
  const paidToday = paid.filter((o) => paidDay(o) === today);
  const paidMonth = paid.filter((o) => paidDay(o) >= monthStart);
  const awaiting = orders.filter((o) => publicStatus(o, now) === "awaiting");
  const newLeads = leads.filter((l) => l.state === "new");
  const unhandled = paid.filter((o) => !o.handled);
  const titles = new Map(tours.map((t) => [t.slug, t.title.uz]));

  // Yaqin 45 kundagi jo'nashlar (e'lon qilingan, sanasi belgilangan turlar)
  const horizon = new Date(now + 45 * DAY).toISOString().slice(0, 10);
  const upcoming = tours
    .filter((t) => t.published && t.fixedDeparture)
    .flatMap((t) => t.departures.filter((d) => d.from > today && d.from <= horizon).map((d) => ({ t, d })))
    .sort((a, b) => a.d.from.localeCompare(b.d.from))
    .slice(0, 8);
  // Kelajakda sanasi qolmagan, lekin "sanasi bor" turlar — admin yangi sana qo'shishi kerak
  const stale = tours.filter((t) => t.published && t.fixedDeparture && !t.departures.some((d) => d.from > today && d.seatsLeft > 0));

  return (
    <>
      <PageHead title={`Xush kelibsiz, ${user.name}`} description={`Bugun: ${fmtDate(today)}`} />

      {stale.length > 0 && (
        <p className="alert warn" style={{ marginTop: 0 }}>
          {stale.length} ta turda bron qilinadigan sana qolmagan: {stale.map((t) => t.title.uz).join(", ")}.{" "}
          <Link href="/tours">Sanalarni yangilash →</Link>
        </p>
      )}

      <div className="stats">
        <div className="card stat">
          <div className="stat-label">Bugun to&apos;langan</div>
          <div className="stat-value">{fmtSom(sum(paidToday))}</div>
          <div className="stat-note">{paidToday.length} ta bron</div>
        </div>
        <div className="card stat">
          <div className="stat-label">Shu oy</div>
          <div className="stat-value">{fmtSom(sum(paidMonth))}</div>
          <div className="stat-note">{paidMonth.length} ta to&apos;lov</div>
        </div>
        <Link href="/orders?f=new" className="card stat" style={{ textDecoration: "none" }}>
          <div className="stat-label">Ko&apos;rib chiqilmagan to&apos;lovlar</div>
          <div className="stat-value">{unhandled.length}</div>
          <div className="stat-note">{awaiting.length} ta bron to&apos;lov kutmoqda</div>
        </Link>
        <Link href="/leads?s=new" className="card stat" style={{ textDecoration: "none" }}>
          <div className="stat-label">Yangi murojaatlar</div>
          <div className="stat-value">{newLeads.length}</div>
          <div className="stat-note">jami {leads.length}</div>
        </Link>
      </div>

      <div className="grid-main">
        <section className="card">
          <div className="card-head">
            <h2>So&apos;nggi bronlar</h2>
            <Link href="/orders">Hammasi →</Link>
          </div>
          <div className="table-wrap">
            {orders.length === 0 ? (
              <Empty>Hali bron yo&apos;q.</Empty>
            ) : (
              <table className="table">
                <tbody>
                  {orders.slice(0, 8).map((o) => {
                    const st = orderStatusView(o);
                    return (
                      <tr key={o.id}>
                        <td>
                          <Link className="row-link mono" href={`/orders/${o.id}`}>
                            {o.id}
                          </Link>
                        </td>
                        <td>{titles.get(o.tourSlug) ?? o.tourSlug}</td>
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
        </section>

        <div className="stack">
          <section className="card">
            <div className="card-head">
              <h2>Yangi murojaatlar</h2>
              <Link href="/leads">Hammasi →</Link>
            </div>
            {newLeads.length === 0 ? (
              <Empty>Yangi murojaat yo&apos;q.</Empty>
            ) : (
              <table className="table">
                <tbody>
                  {newLeads.slice(0, 6).map((l) => (
                    <tr key={l.id}>
                      <td>
                        <Link className="row-link" href={`/leads/${l.id}`}>
                          {LEAD_KIND_LABEL[l.kind]}
                        </Link>
                        <div className="muted">{fmtDateTime(l.receivedAt)}</div>
                      </td>
                      <td>
                        <Badge tone={STATE_TONE[l.state]}>{LEAD_STATE_LABEL[l.state]}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className="card">
            <div className="card-head">
              <h2>Yaqin jo&apos;nashlar</h2>
            </div>
            {upcoming.length === 0 ? (
              <Empty>45 kun ichida jo&apos;nash yo&apos;q.</Empty>
            ) : (
              <table className="table">
                <tbody>
                  {upcoming.map(({ t, d }) => (
                    <tr key={`${t.id}-${d.id}`}>
                      <td className="nowrap">{fmtDate(d.from)}</td>
                      <td>{t.title.uz}</td>
                      <td className="num">
                        <Badge tone={d.seatsLeft === 0 ? "danger" : d.seatsLeft <= 3 ? "warn" : "neutral"}>{d.seatsLeft} o&apos;rin</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
