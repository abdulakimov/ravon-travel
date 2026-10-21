import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePage } from "@/lib/admin/guard";
import { LEAD_KIND_LABEL, LEAD_STATE_LABEL, listLeads, type LeadState } from "@/lib/admin/leads-admin";
import { ActionForm } from "../../../_ui/ActionForm";
import { Badge, PageHead, STATE_TONE, fmtDateTime } from "../../../_ui/ui";
import { updateLead } from "../actions";

export const metadata: Metadata = { title: "Murojaat" };

const FIELD_LABEL: Record<string, string> = {
  name: "Ism",
  phone: "Telefon",
  email: "Email",
  message: "Xabar",
  topic: "Mavzu",
  slug: "Tur",
  tour: "Tur",
  date: "Sana",
  travelers: "Sayohatchilar",
  budget: "Byudjet",
  note: "Izoh",
  bookingId: "Bron raqami",
  amountUzs: "Summa (so'm)",
  departureId: "Jo'nash sanasi",
  adults: "Kattalar",
  children: "Bolalar",
  totalUzs: "Jami (so'm)",
  locale: "Til",
  clickTransId: "Click trans",
  clickPaydocId: "Click paydoc",
  warning: "Ogohlantirish",
};

export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePage("manager");
  const { id } = await params;
  if (!/^[0-9a-f]{16}$/.test(id)) notFound();
  const lead = (await listLeads()).find((l) => l.id === id);
  if (!lead) notFound();
  const entries = Object.entries(lead.data).filter(([k, v]) => k !== "consent" && v !== "" && v !== null && v !== undefined);
  const bookingId = typeof lead.data.bookingId === "string" ? lead.data.bookingId : null;

  return (
    <>
      <PageHead
        crumbs={[{ href: "/leads", label: "Murojaatlar" }]}
        title={LEAD_KIND_LABEL[lead.kind] ?? lead.kind}
        description={
          <>
            {fmtDateTime(lead.receivedAt)} · <Badge tone={STATE_TONE[lead.state]}>{LEAD_STATE_LABEL[lead.state]}</Badge>
            {lead.updatedBy && <span className="muted"> · {lead.updatedBy}</span>}
          </>
        }
        actions={bookingId ? <Link className="btn" href={`/orders/${bookingId}`}>Bronni ochish</Link> : undefined}
      />
      <div className="grid-main">
        <section className="card card-pad">
          <dl className="kv">
            {entries.map(([k, v]) => (
              <div key={k} style={{ display: "contents" }}>
                <dt>{FIELD_LABEL[k] ?? k}</dt>
                <dd style={{ whiteSpace: "pre-wrap" }}>
                  {k === "phone" ? (
                    <a href={`tel:${String(v).replace(/[^\d+]/g, "")}`}>{String(v)}</a>
                  ) : k === "email" ? (
                    <a href={`mailto:${String(v)}`}>{String(v)}</a>
                  ) : Array.isArray(v) ? (
                    v.map(String).join(", ")
                  ) : typeof v === "object" ? (
                    JSON.stringify(v)
                  ) : (
                    String(v)
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </section>
        <section className="card card-pad">
          <ActionForm action={updateLead} submit="Saqlash">
            <input type="hidden" name="id" value={lead.id} />
            <label className="field">
              <span>Holat</span>
              <select className="select" name="state" defaultValue={lead.state}>
                {(Object.keys(LEAD_STATE_LABEL) as LeadState[]).map((s) => (
                  <option key={s} value={s}>
                    {LEAD_STATE_LABEL[s]}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Ichki izoh</span>
              <textarea className="textarea" name="note" defaultValue={lead.note ?? ""} maxLength={2000} />
            </label>
          </ActionForm>
        </section>
      </div>
    </>
  );
}
