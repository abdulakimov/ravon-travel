import type { Metadata } from "next";
import Link from "next/link";
import { requirePage } from "@/lib/admin/guard";
import { LEAD_KIND_LABEL, LEAD_STATE_LABEL, listLeads, type Lead, type LeadKind, type LeadState } from "@/lib/admin/leads-admin";
import { Badge, Empty, PageHead, STATE_TONE, fmtDateTime } from "../../_ui/ui";

export const metadata: Metadata = { title: "Murojaatlar" };


/** Ro'yxatdagi qisqa mazmun: ism, telefon va asosiy matn. */
function summary(l: Lead): { who: string; phone: string; text: string } {
  const d = l.data;
  const s = (v: unknown) => (v === undefined || v === null ? "" : String(v));
  const travelers = Array.isArray(d.travelers) ? (d.travelers as unknown[]).map(String) : [];
  const who = s(d.name) || travelers[0] || "—";
  const text =
    l.kind === "booking" || l.kind === "payment"
      ? [s(d.bookingId), s(d.slug ?? d.tour)].filter(Boolean).join(" · ")
      : l.kind === "inquiry"
        ? [s(d.slug), s(d.date), s(d.message ?? d.note)].filter(Boolean).join(" · ")
        : s(d.message ?? d.topic);
  return { who, phone: s(d.phone), text: text.slice(0, 120) };
}

export default async function LeadsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requirePage("manager");
  const sp = await searchParams;
  const state = (sp.s === "all" || (sp.s && Object.hasOwn(LEAD_STATE_LABEL, sp.s)) ? sp.s : "new") as LeadState | "all";
  const kind = (sp.k && Object.hasOwn(LEAD_KIND_LABEL, sp.k) ? sp.k : "") as LeadKind | "";
  const all = await listLeads();
  const rows = all.filter((l) => (state === "all" || l.state === state) && (!kind || l.kind === kind));
  const tabs: { key: LeadState | "all"; label: string }[] = [
    ...(Object.keys(LEAD_STATE_LABEL) as LeadState[]).map((k) => ({ key: k, label: LEAD_STATE_LABEL[k] })),
    { key: "all", label: "Hammasi" },
  ];
  const qs = (s: string, k: string) => `/leads?s=${s}${k ? `&k=${k}` : ""}`;

  return (
    <>
      <PageHead title="Murojaatlar" description="Aloqa formasi, tur so'rovlari, bronlar va to'lov xabarlari." />
      <div className="toolbar">
        <nav className="tabs" aria-label="Holat">
          {tabs.map((t) => (
            <Link key={t.key} href={qs(t.key, kind)} aria-current={state === t.key ? "page" : undefined}>
              {t.label} <span className="muted">{all.filter((l) => (t.key === "all" || l.state === t.key) && (!kind || l.kind === kind)).length}</span>
            </Link>
          ))}
        </nav>
        <nav className="tabs" aria-label="Turi" style={{ marginLeft: "auto" }}>
          <Link href={qs(state, "")} aria-current={!kind ? "page" : undefined}>
            Barchasi
          </Link>
          {(Object.keys(LEAD_KIND_LABEL) as LeadKind[]).map((k) => (
            <Link key={k} href={qs(state, k)} aria-current={kind === k ? "page" : undefined}>
              {LEAD_KIND_LABEL[k]}
            </Link>
          ))}
        </nav>
      </div>
      <div className="card table-wrap">
        {rows.length === 0 ? (
          <Empty>Murojaat yo&apos;q.</Empty>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Vaqt</th>
                <th>Turi</th>
                <th>Kim</th>
                <th>Telefon</th>
                <th>Mazmun</th>
                <th>Holat</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((l) => {
                const s = summary(l);
                return (
                  <tr key={l.id}>
                    <td className="nowrap">
                      <Link className="row-link" href={`/leads/${l.id}`}>
                        {fmtDateTime(l.receivedAt)}
                      </Link>
                    </td>
                    <td>{LEAD_KIND_LABEL[l.kind] ?? l.kind}</td>
                    <td>{s.who}</td>
                    <td className="nowrap">{s.phone || "—"}</td>
                    <td className="muted">{s.text || "—"}</td>
                    <td>
                      <Badge tone={STATE_TONE[l.state]}>{LEAD_STATE_LABEL[l.state]}</Badge>
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
