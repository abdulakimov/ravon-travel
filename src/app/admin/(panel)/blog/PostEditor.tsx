"use client";

import { useActionState, useState } from "react";
import type { ActionState } from "@/lib/admin/action-state";
import { MediaPicker } from "../../_ui/MediaPicker";
import { L10nInput, L10nList, ListEditor, NumberInput, SaveBar, emptyL10n, type L10n } from "../../_ui/fields";
import { savePost } from "./actions";

export interface PostForm {
  originalSlug?: string;
  slug: string;
  date: string;
  readMinutes: number;
  image: string;
  imageAlt: L10n;
  title: L10n;
  excerpt: L10n;
  intro: L10n;
  sections: { id: string; heading: L10n; paragraphs: L10n[]; list?: L10n[] }[];
  published: boolean;
}

export function PostEditor({ initial }: { initial: PostForm }) {
  const [p, setP] = useState(initial);
  const [state, action, pending] = useActionState<ActionState, FormData>(savePost, {});
  const set = <K extends keyof PostForm>(k: K, v: PostForm[K]) => setP((x) => ({ ...x, [k]: v }));
  return (
    <form action={action} className="stack" noValidate>
      <input type="hidden" name="payload" value={JSON.stringify(p)} />
      <section className="card card-pad form">
        <div className="row">
          <label className="field">
            <span>Slug (manzil) *</span>
            <input className="input mono" value={p.slug} onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} />
            <small>ravontravel.uz/uz/blog/{p.slug || "…"}</small>
          </label>
          <label className="field">
            <span>Sana *</span>
            <input className="input" type="date" value={p.date} onChange={(e) => set("date", e.target.value)} />
          </label>
          <NumberInput label="O'qish vaqti (daqiqa)" value={p.readMinutes} min={1} max={120} onChange={(v) => set("readMinutes", v)} />
        </div>
        <label className="check">
          <input type="checkbox" checked={p.published} onChange={(e) => set("published", e.target.checked)} /> Saytda e&apos;lon qilingan
        </label>
        <L10nInput label="Sarlavha" value={p.title} onChange={(v) => set("title", v)} />
        <L10nInput label="Qisqa matn (ro'yxatda)" value={p.excerpt} onChange={(v) => set("excerpt", v)} multiline rows={2} />
        <MediaPicker label="Muqova rasmi *" value={p.image} onChange={(v) => set("image", v)} />
        <L10nInput label="Rasm izohi" value={p.imageAlt} onChange={(v) => set("imageAlt", v)} required={false} />
        <L10nInput label="Kirish" value={p.intro} onChange={(v) => set("intro", v)} multiline rows={4} />
      </section>
      <section className="card card-pad">
        <ListEditor
          items={p.sections}
          onChange={(v) => set("sections", v)}
          make={(): PostForm["sections"][number] => ({ id: `bolim-${p.sections.length + 1}`, heading: emptyL10n(), paragraphs: [emptyL10n()] })}
          addLabel="Bo'lim qo'shish"
          itemLabel={(i) => `${i + 1}-bo'lim`}
          render={(s, update) => (
            <>
              <label className="field">
                <span>Bo&apos;lim ID (mundarija havolasi)</span>
                <input className="input mono" value={s.id} onChange={(e) => update({ ...s, id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} />
              </label>
              <L10nInput label="Sarlavha" value={s.heading} onChange={(v) => update({ ...s, heading: v })} />
              <L10nList label="Paragraflar" items={s.paragraphs} onChange={(v) => update({ ...s, paragraphs: v })} multiline addLabel="Paragraf qo'shish" />
              <L10nList label="Ro'yxat (ixtiyoriy)" items={s.list ?? []} onChange={(v) => update({ ...s, list: v })} addLabel="Band qo'shish" />
            </>
          )}
        />
      </section>
      <SaveBar pending={pending} state={state} />
    </form>
  );
}
