import type { Metadata } from "next";
import Link from "next/link";
import { requirePage } from "@/lib/admin/guard";
import { getTaxonomy, getTourRecords } from "@/lib/content";
import { todayIso } from "@/lib/tour-utils";
import { Badge, Empty, PageHead, fmtDate, fmtSom } from "../../_ui/ui";

export const metadata: Metadata = { title: "Turlar" };

export default async function ToursAdmin() {
  await requirePage("admin");
  const [tours, tax] = await Promise.all([getTourRecords(), getTaxonomy()]);
  const today = todayIso();
  return (
    <>
      <PageHead
        title="Turlar"
        description="Saytdagi turlar, sanalar, narxlar va o'rinlar. O'zgarishlar saytda darhol ko'rinadi."
        actions={
          <Link className="btn primary" href="/tours/new">
            + Yangi tur
          </Link>
        }
      />
      <div className="card table-wrap">
        {tours.length === 0 ? (
          <Empty>Tur yo&apos;q.</Empty>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th className="num">#</th>
                <th />
                <th>Nomi</th>
                <th>Mamlakat / toifa</th>
                <th>Turi</th>
                <th>Keyingi sana</th>
                <th className="num">Narx (dan)</th>
                <th>Holat</th>
              </tr>
            </thead>
            <tbody>
              {tours.map((t) => {
                const future = t.departures.filter((d) => d.from > today).sort((a, b) => a.from.localeCompare(b.from));
                const next = future.find((d) => d.seatsLeft > 0);
                const price = t.fixedDeparture && future.some((d) => d.seatsLeft > 0) ? Math.min(...future.filter((d) => d.seatsLeft > 0).map((d) => d.priceUzs)) : t.priceFromUzs;
                return (
                  <tr key={t.id}>
                    <td className="num muted">{t.rank}</td>
                    <td>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img className="thumb" src={t.image.replace(/^\/img\/(.+)\.(jpe?g|png)$/i, "/img/opt/$1-384.webp").replace(/^\/media\/(.+)\.jpg$/, "/media/opt/$1-384.webp")} alt="" />
                    </td>
                    <td>
                      <Link className="row-link" href={`/tours/${t.id}`}>
                        {t.title.uz}
                      </Link>
                      <div className="muted mono" style={{ fontSize: 12 }}>
                        {t.slug}
                      </div>
                    </td>
                    <td>
                      {tax.countries[t.country]?.name.uz ?? t.country}
                      <div className="muted">{tax.categories[t.category]?.name.uz ?? t.category}</div>
                    </td>
                    <td>{t.fixedDeparture ? "Sanasi bor" : "So'rov bo'yicha"}</td>
                    <td className="nowrap">
                      {!t.fixedDeparture ? (
                        "—"
                      ) : next ? (
                        <>
                          {fmtDate(next.from)} <span className="muted">· {next.seatsLeft} o&apos;rin</span>
                        </>
                      ) : (
                        <Badge tone="danger">Sana yo&apos;q</Badge>
                      )}
                    </td>
                    <td className="num">{fmtSom(price)}</td>
                    <td>
                      {t.published ? <Badge tone="success">Saytda</Badge> : <Badge>Yashirin</Badge>} {t.top && <Badge tone="warn">TOP</Badge>}
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
