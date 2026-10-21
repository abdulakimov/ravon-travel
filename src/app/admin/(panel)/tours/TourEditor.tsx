"use client";

import { useActionState, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { ActionState } from "@/lib/admin/action-state";
import { MediaPicker } from "../../_ui/MediaPicker";
import { L10nInput, L10nList, ListEditor, NumberInput, SaveBar, emptyL10n, type L10n } from "../../_ui/fields";
import { saveTour } from "./actions";

export interface DepartureForm {
  from: string;
  to: string;
  seatsLeft: number;
  /** Forma ochilgandagi qiymat (server shu bilan solishtiradi) */
  seatsOrig?: number;
  priceUzs: number;
}
export interface TourForm {
  id?: string;
  slug: string;
  country: string;
  category: string;
  days: number;
  nights: number;
  priceFromUzs: number;
  fixedDeparture: boolean;
  top: boolean;
  rank: number;
  image: string;
  title: L10n;
  summary: L10n;
  published: boolean;
  departures: DepartureForm[];
  detail: {
    route: L10n;
    groupSize: { min: number; max: number };
    about: L10n[];
    gallery: { src: string; alt: L10n }[];
    itinerary: { title: L10n; text: L10n; tags: L10n[] }[];
    included: L10n[];
    excluded: L10n[];
    notes: { visa: L10n; passport: L10n; cancellation: L10n };
  };
}

const TABS = [
  ["main", "Asosiy"],
  ["dates", "Sanalar va narx"],
  ["detail", "Tafsilot"],
  ["days", "Dastur (kunlar)"],
  ["gallery", "Galereya"],
] as const;
type Tab = (typeof TABS)[number][0];

const addDays = (iso: string, n: number) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

export function TourEditor({
  initial,
  countries,
  categories,
  today,
  slugLocked,
}: {
  initial: TourForm;
  countries: { id: string; name: string }[];
  categories: { id: string; name: string }[];
  today: string;
  /** Turga bronlar bor — slugni o'zgartirib bo'lmaydi */
  slugLocked: boolean;
}) {
  const [t, setT] = useState<TourForm>(initial);
  const [tab, setTab] = useState<Tab>("main");
  const [state, action, pending] = useActionState<ActionState, FormData>(saveTour, {});
  const set = <K extends keyof TourForm>(k: K, v: TourForm[K]) => setT((x) => ({ ...x, [k]: v }));
  const setDetail = <K extends keyof TourForm["detail"]>(k: K, v: TourForm["detail"][K]) =>
    setT((x) => ({ ...x, detail: { ...x.detail, [k]: v } }));

  return (
    <form action={action} className="stack" noValidate>
      <input type="hidden" name="payload" value={JSON.stringify(t)} />
      <nav className="tabs" aria-label="Bo'limlar">
        {TABS.map(([key, label]) => (
          <a
            key={key}
            href={`#${key}`}
            aria-current={tab === key ? "page" : undefined}
            onClick={(e) => {
              e.preventDefault();
              setTab(key);
            }}
          >
            {label}
          </a>
        ))}
      </nav>

      <div className="card card-pad form" hidden={tab !== "main"}>
        <div className="row">
          <label className="field">
            <span>Slug (manzil) *</span>
            <input
              className="input mono"
              value={t.slug}
              onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
              required
              readOnly={slugLocked}
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
            />
            <small>{slugLocked ? "Bu turga bronlar bor — manzilni o'zgartirib bo'lmaydi." : `ravontravel.uz/uz/tours/${t.slug || "…"}`}</small>
          </label>
          <label className="field">
            <span>Mamlakat *</span>
            <select className="select" value={t.country} onChange={(e) => set("country", e.target.value)} required>
              <option value="">—</option>
              {countries.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Toifa *</span>
            <select className="select" value={t.category} onChange={(e) => set("category", e.target.value)} required>
              <option value="">—</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <L10nInput label="Nomi" value={t.title} onChange={(v) => set("title", v)} />
        <L10nInput label="Qisqa tavsif (kartochkada)" value={t.summary} onChange={(v) => set("summary", v)} multiline rows={2} />
        <MediaPicker label="Asosiy rasm *" value={t.image} onChange={(v) => set("image", v)} />
        <div className="row">
          <NumberInput label="Kun" value={t.days} min={1} max={90} onChange={(v) => setT((x) => ({ ...x, days: v, nights: Math.max(0, v - 1) }))} />
          <NumberInput label="Kecha" value={t.nights} min={0} max={90} onChange={(v) => set("nights", v)} />
          <NumberInput label="Tartib (1 = eng ommabop)" value={t.rank} min={1} max={9999} onChange={(v) => set("rank", v)} />
        </div>
        <div className="row" style={{ alignItems: "center" }}>
          <label className="check">
            <input type="checkbox" checked={t.published} onChange={(e) => set("published", e.target.checked)} /> Saytda ko&apos;rinadi
          </label>
          <label className="check">
            <input type="checkbox" checked={t.top} onChange={(e) => set("top", e.target.checked)} /> «TOP» belgisi
          </label>
          <label className="check">
            <input type="checkbox" checked={t.fixedDeparture} onChange={(e) => set("fixedDeparture", e.target.checked)} /> Sanasi belgilangan
            (onlayn bron va to&apos;lov)
          </label>
        </div>
      </div>

      <div className="card card-pad form" hidden={tab !== "dates"}>
        {t.fixedDeparture ? (
          <>
            <p className="hint" style={{ margin: 0 }}>
              Mijoz shu sanalardan birini tanlab bron qiladi va to&apos;laydi. O&apos;rinlar to&apos;lov tasdiqlanganda avtomatik kamayadi. O&apos;tgan
              sanalar saytda ko&apos;rinmaydi.
            </p>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Jo&apos;nash</th>
                    <th>Qaytish</th>
                    <th>Bo&apos;sh o&apos;rin</th>
                    <th>Narx (1 kishi, so&apos;m)</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {t.departures.map((d, i) => {
                    const upd = (patch: Partial<DepartureForm>) =>
                      set(
                        "departures",
                        t.departures.map((x, j) => (j === i ? { ...x, ...patch } : x)),
                      );
                    const past = d.from && d.from <= today;
                    return (
                      <tr key={i} style={past ? { opacity: 0.55 } : undefined}>
                        <td>
                          <input
                            className="input"
                            type="date"
                            value={d.from}
                            required
                            onChange={(e) => {
                              const from = e.target.value;
                              const autoTo = d.from ? addDays(d.from, t.days - 1) : "";
                              upd({ from, to: !d.to || d.to === autoTo ? (from ? addDays(from, t.days - 1) : "") : d.to });
                            }}
                          />
                          {past && <small className="muted">o&apos;tgan</small>}
                        </td>
                        <td>
                          <input className="input" type="date" value={d.to} min={d.from} required onChange={(e) => upd({ to: e.target.value })} />
                        </td>
                        <td style={{ width: 120 }}>
                          <input className="input" type="number" min={0} max={999} value={d.seatsLeft} onChange={(e) => upd({ seatsLeft: Number(e.target.value) })} />
                        </td>
                        <td style={{ width: 200 }}>
                          <input className="input" type="number" min={1} step={10000} value={d.priceUzs} onChange={(e) => upd({ priceUzs: Number(e.target.value) })} />
                        </td>
                        <td>
                          <button type="button" className="btn sm ghost" aria-label="Sanani o'chirish" onClick={() => set("departures", t.departures.filter((_, j) => j !== i))}>
                            <Trash2 size={15} aria-hidden="true" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div>
              <button
                type="button"
                className="btn sm"
                onClick={() => {
                  const last = t.departures.at(-1);
                  const from = last?.from && last.from > today ? addDays(last.from, 14) : addDays(today, 14);
                  set("departures", [...t.departures, { from, to: addDays(from, t.days - 1), seatsLeft: last?.seatsLeft || 15, priceUzs: last?.priceUzs || t.priceFromUzs || 0 }]);
                }}
              >
                <Plus size={15} aria-hidden="true" /> Sana qo&apos;shish
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="hint" style={{ margin: 0 }}>
              «So&apos;rov bo&apos;yicha» tur: saytda so&apos;rov formasi chiqadi, narx — «…dan» ko&apos;rinishida.
            </p>
            <NumberInput label="Narx (1 kishi, so'mdan)" value={t.priceFromUzs} min={0} step={10000} onChange={(v) => set("priceFromUzs", v)} />
          </>
        )}
      </div>

      <div className="card card-pad form" hidden={tab !== "detail"}>
        <L10nInput label="Marshrut (shaharlar)" value={t.detail.route} onChange={(v) => setDetail("route", v)} hint="Masalan: Baku · Gobustan · Quba" />
        <div className="row">
          <NumberInput label="Guruh: kamida" value={t.detail.groupSize.min} min={1} onChange={(v) => setDetail("groupSize", { ...t.detail.groupSize, min: v })} />
          <NumberInput label="Guruh: ko'pi bilan" value={t.detail.groupSize.max} min={1} onChange={(v) => setDetail("groupSize", { ...t.detail.groupSize, max: v })} />
        </div>
        <L10nList label="Tur haqida (paragraflar)" items={t.detail.about} onChange={(v) => setDetail("about", v)} multiline addLabel="Paragraf qo'shish" />
        <L10nList label="Narxga kiradi" items={t.detail.included} onChange={(v) => setDetail("included", v)} addLabel="Band qo'shish" />
        <L10nList label="Narxga kirmaydi" items={t.detail.excluded} onChange={(v) => setDetail("excluded", v)} addLabel="Band qo'shish" />
        <fieldset className="group">
          <legend>Muhim ma&apos;lumot</legend>
          <L10nInput label="Viza" value={t.detail.notes.visa} onChange={(v) => setDetail("notes", { ...t.detail.notes, visa: v })} multiline rows={2} required={false} />
          <L10nInput label="Pasport" value={t.detail.notes.passport} onChange={(v) => setDetail("notes", { ...t.detail.notes, passport: v })} multiline rows={2} required={false} />
          <L10nInput label="Bekor qilish" value={t.detail.notes.cancellation} onChange={(v) => setDetail("notes", { ...t.detail.notes, cancellation: v })} multiline rows={2} required={false} />
        </fieldset>
      </div>

      <div className="card card-pad form" hidden={tab !== "days"}>
        <ListEditor
          items={t.detail.itinerary}
          onChange={(v) => setDetail("itinerary", v)}
          make={() => ({ title: emptyL10n(), text: emptyL10n(), tags: [] })}
          addLabel="Kun qo'shish"
          itemLabel={(i) => `${i + 1}-kun`}
          max={40}
          render={(day, update) => (
            <>
              <L10nInput label="Sarlavha" value={day.title} onChange={(v) => update({ ...day, title: v })} />
              <L10nInput label="Matn" value={day.text} onChange={(v) => update({ ...day, text: v })} multiline />
              <L10nList label="Teglar" items={day.tags} onChange={(v) => update({ ...day, tags: v })} addLabel="Teg qo'shish" max={10} />
            </>
          )}
        />
      </div>

      <div className="card card-pad form" hidden={tab !== "gallery"}>
        <ListEditor
          items={t.detail.gallery}
          onChange={(v) => setDetail("gallery", v)}
          make={() => ({ src: "", alt: emptyL10n() })}
          addLabel="Rasm qo'shish"
          itemLabel={(i) => `${i + 1}-rasm`}
          max={16}
          render={(g, update) => (
            <>
              <MediaPicker value={g.src} onChange={(v) => update({ ...g, src: v })} />
              <L10nInput label="Rasm izohi" value={g.alt} onChange={(v) => update({ ...g, alt: v })} required={false} />
            </>
          )}
        />
      </div>

      <SaveBar pending={pending} state={state} />
    </form>
  );
}
