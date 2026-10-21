import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { site } from "@/config/site";
import { BOOKING_ID_RE } from "@/lib/booking-constants";
import { requirePage } from "@/lib/admin/guard";
import { bookingLead } from "@/lib/admin/leads-admin";
import { roleAtLeast } from "@/lib/admin/users";
import { getTourRecords } from "@/lib/content";
import { formatVerifyCode, readOrder } from "@/lib/orders";
import { verifyUrl } from "@/lib/receipt";
import { ActionForm } from "../../../_ui/ActionForm";
import { orderStatusView } from "../../../_ui/order-status";
import { Badge, PageHead, fmtDate, fmtDateTime, fmtSom } from "../../../_ui/ui";
import { cancel, clickReverse, clickStatus, refunded, saveNote, toggleHandled } from "../actions";

export const metadata: Metadata = { title: "Bron" };

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePage("manager");
  const { id } = await params;
  if (!BOOKING_ID_RE.test(id)) notFound();
  const order = await readOrder(id);
  if (!order) notFound();
  const [tours, lead] = await Promise.all([getTourRecords(), bookingLead(id)]);
  const tour = tours.find((t) => t.slug === order.tourSlug);
  const dep = tour?.departures.find((d) => d.id === order.departureId);
  const st = orderStatusView(order);
  const confirmed = order.transactions.find((t) => t.status === "confirmed");
  const payLink = `${site.url}/${order.locale}/pay/${order.id}?k=${encodeURIComponent(order.payToken)}`;
  const data = lead?.data ?? {};
  const fullNames = Array.isArray(data.travelers) ? (data.travelers as unknown[]).map(String) : [];
  const isAdmin = roleAtLeast(user.role, "admin");

  return (
    <>
      <PageHead
        crumbs={[{ href: "/orders", label: "Bronlar" }]}
        title={`Bron ${order.id}`}
        description={
          <>
            <Badge tone={st.tone}>{st.label}</Badge> {order.handled && <Badge tone="success">Ko&apos;rib chiqilgan</Badge>}
          </>
        }
      />

      <div className="grid-main">
        <div className="stack">
          <section className="card">
            <div className="card-head">
              <h2>Bron ma&apos;lumoti</h2>
            </div>
            <div className="card-pad">
              <dl className="kv">
                <dt>Tur</dt>
                <dd>
                  {tour ? (
                    <>
                      {isAdmin ? <Link href={`/tours/${tour.id}`}>{tour.title.uz}</Link> : tour.title.uz}{" "}
                      <a className="muted" href={`${site.url}/uz/tours/${tour.slug}`} target="_blank" rel="noreferrer">
                        (saytda)
                      </a>
                    </>
                  ) : (
                    order.tourSlug
                  )}
                </dd>
                <dt>Sana</dt>
                <dd>{dep ? `${fmtDate(dep.from)} — ${fmtDate(dep.to)}` : fmtDate(order.departureId)}</dd>
                <dt>Sayohatchilar</dt>
                <dd>
                  {order.adults} kattalar{order.children ? `, ${order.children} bola` : ""}
                </dd>
                <dt>Summa</dt>
                <dd>{fmtSom(order.amountUzs)}</dd>
                <dt>Yaratilgan</dt>
                <dd>{fmtDateTime(order.createdAt)}</dd>
                <dt>To&apos;lov muddati</dt>
                <dd>{fmtDateTime(order.holdUntil)}</dd>
                <dt>To&apos;langan</dt>
                <dd>{fmtDateTime(order.paidAt)}</dd>
                <dt>Til</dt>
                <dd>{order.locale.toUpperCase()}</dd>
                {order.verifyCode && (
                  <>
                    <dt>Chek kodi</dt>
                    <dd>
                      <span className="mono">{formatVerifyCode(order.verifyCode)}</span>{" "}
                      <a href={verifyUrl(order.locale, order.id, order.verifyCode)} target="_blank" rel="noreferrer">
                        tekshirish
                      </a>
                    </dd>
                  </>
                )}
                {order.reversalRequestedAt && (
                  <>
                    <dt>Qaytarish so&apos;ralgan</dt>
                    <dd>{fmtDateTime(order.reversalRequestedAt)}</dd>
                  </>
                )}
                {order.closedAt && (
                  <>
                    <dt>Yopilgan</dt>
                    <dd>
                      {fmtDateTime(order.closedAt)} · {order.closedBy}
                    </dd>
                  </>
                )}
                <dt>To&apos;lov havolasi</dt>
                <dd>
                  <input className="input mono" readOnly value={payLink} aria-label="Mijoz uchun to'lov havolasi" />
                  <small className="hint">Mijozga yuborish mumkin: shu havola bilan to&apos;lov sahifasi va chek ochiladi.</small>
                </dd>
              </dl>
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <h2>Mijoz</h2>
            </div>
            <div className="card-pad">
              {lead ? (
                <dl className="kv">
                  <dt>Telefon</dt>
                  <dd>
                    <a href={`tel:${String(data.phone ?? "").replace(/[^\d+]/g, "")}`}>{String(data.phone ?? "—")}</a>
                  </dd>
                  <dt>Email</dt>
                  <dd>{data.email ? <a href={`mailto:${String(data.email)}`}>{String(data.email)}</a> : "—"}</dd>
                  <dt>Sayohatchilar</dt>
                  <dd>{fullNames.length ? fullNames.join(", ") : (order.travelers ?? []).join(", ") || "—"}</dd>
                  <dt>Izoh</dt>
                  <dd>{String(data.note || "—")}</dd>
                  <dt>Murojaat</dt>
                  <dd>
                    <Link href={`/leads/${lead.id}`}>ochish</Link> · {fmtDateTime(lead.receivedAt)}
                  </dd>
                </dl>
              ) : (
                <p className="muted" style={{ margin: 0 }}>
                  Mijoz ma&apos;lumoti topilmadi (murojaatlar faylida yo&apos;q). Chekdagi ismlar: {(order.travelers ?? []).join(", ") || "—"}
                </p>
              )}
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <h2>Click tranzaksiyalari</h2>
            </div>
            <div className="table-wrap">
              {order.transactions.length === 0 ? (
                <p className="empty">To&apos;lov boshlanmagan.</p>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Click trans</th>
                      <th>Paydoc</th>
                      <th>Holat</th>
                      <th>Boshlangan</th>
                      <th>Yakunlangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.transactions.map((t) => (
                      <tr key={t.clickTransId}>
                        <td className="mono">{t.clickTransId}</td>
                        <td className="mono">{t.clickPaydocId}</td>
                        <td>
                          <Badge tone={t.status === "confirmed" ? "success" : t.status === "cancelled" ? "danger" : "warn"}>
                            {t.status === "confirmed" ? "tasdiqlangan" : t.status === "cancelled" ? "bekor" : "tayyorlangan"}
                          </Badge>
                        </td>
                        <td className="nowrap">{fmtDateTime(t.preparedAt)}</td>
                        <td className="nowrap">{fmtDateTime(t.finishedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>

        <div className="stack">
          <section className="card card-pad stack">
            <h2 style={{ fontSize: 15 }}>Ish holati</h2>
            <ActionForm action={toggleHandled} submit={order.handled ? "Belgini olib tashlash" : "Ko'rib chiqildi"} tone={order.handled ? "plain" : "primary"} inline>
              <input type="hidden" name="id" value={order.id} />
              <input type="hidden" name="handled" value={order.handled ? "0" : "1"} />
            </ActionForm>
            <ActionForm action={saveNote} submit="Izohni saqlash" tone="plain">
              <input type="hidden" name="id" value={order.id} />
              <label className="field">
                <span>Ichki izoh</span>
                <textarea className="textarea" name="note" defaultValue={order.adminNote ?? ""} maxLength={2000} />
              </label>
            </ActionForm>
          </section>

          <section className="card card-pad stack">
            <h2 style={{ fontSize: 15 }}>Click</h2>
            <ActionForm action={clickStatus} submit="Click'dagi holatni tekshirish" tone="plain">
              <input type="hidden" name="id" value={order.id} />
            </ActionForm>
            {order.status === "paid" && isAdmin && confirmed && (
              <details>
                <summary className="btn danger sm">Click orqali pulni qaytarish…</summary>
                <div style={{ marginTop: 10 }}>
                  <p className="alert warn" style={{ margin: "0 0 10px" }}>
                    Pul mijoz kartasiga qaytariladi. Bu amalni bekor qilib bo&apos;lmaydi. Click faqat joriy oyda qilingan to&apos;lovni qaytaradi.
                  </p>
                  <ActionForm action={clickReverse} submit="Pulni qaytarish" tone="danger" confirmText={order.id}>
                    <input type="hidden" name="id" value={order.id} />
                  </ActionForm>
                </div>
              </details>
            )}
          </section>

          {(order.status === "awaiting" || (order.status === "paid" && isAdmin)) && (
            <section className="card card-pad stack">
              <h2 style={{ fontSize: 15 }}>Bronni yopish</h2>
              {order.status === "awaiting" && (
                <>
                  <p className="hint" style={{ margin: 0 }}>
                    Bekor qilingan bronga to&apos;lab bo&apos;lmaydi. Mijoz Click&apos;da to&apos;lovni boshlagan bo&apos;lsa, Click uni bekor qiladi.
                  </p>
                  <ActionForm action={cancel} submit="Bronni bekor qilish" tone="danger" confirmText={order.id}>
                    <input type="hidden" name="id" value={order.id} />
                  </ActionForm>
                </>
              )}
              {order.status === "paid" && isAdmin && (
                <>
                  <p className="hint" style={{ margin: 0 }}>
                    Pul Click kabinetida qaytarilgan bo&apos;lsa, shu yerda belgilang: chek haqiqiy bo&apos;lmay qoladi, o&apos;rinlar sanaga qaytariladi.
                  </p>
                  <ActionForm action={refunded} submit="Pul qaytarildi deb belgilash" tone="danger" confirmText={order.id}>
                    <input type="hidden" name="id" value={order.id} />
                  </ActionForm>
                </>
              )}
            </section>
          )}
        </div>
      </div>
    </>
  );
}
