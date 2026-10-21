"use client";

import { useActionState, useState } from "react";
import type { ActionState } from "@/lib/admin/action-state";
import { L10nInput, L10nList, ListEditor, SaveBar, emptyL10n, type L10n } from "../../_ui/fields";
import { saveFaq } from "./actions";

type Href = "/tours" | "/contact" | "/privacy" | "/cancellation";
export interface FaqForm {
  id: string;
  question: L10n;
  answer: L10n[];
  list?: L10n[];
  link?: { href: Href; label: L10n };
}
const HREFS: { href: Href; label: string }[] = [
  { href: "/tours", label: "Turlar katalogi" },
  { href: "/contact", label: "Aloqa" },
  { href: "/privacy", label: "Maxfiylik siyosati" },
  { href: "/cancellation", label: "Bekor qilish siyosati" },
];

export function FaqEditor({ initial }: { initial: FaqForm[] }) {
  const [items, setItems] = useState(initial);
  const [state, action, pending] = useActionState<ActionState, FormData>(saveFaq, {});
  return (
    <form action={action} className="stack" noValidate>
      <input type="hidden" name="payload" value={JSON.stringify(items)} />
      <section className="card card-pad">
        <ListEditor
          items={items}
          onChange={setItems}
          make={(): FaqForm => ({ id: `savol-${items.length + 1}`, question: emptyL10n(), answer: [emptyL10n()] })}
          addLabel="Savol qo'shish"
          itemLabel={(i) => `${i + 1}. ${items[i].question.uz || "Yangi savol"}`}
          render={(f, update) => (
            <>
              <label className="field">
                <span>ID</span>
                <input className="input mono" value={f.id} onChange={(e) => update({ ...f, id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} />
              </label>
              <L10nInput label="Savol" value={f.question} onChange={(v) => update({ ...f, question: v })} />
              <L10nList label="Javob (paragraflar)" items={f.answer} onChange={(v) => update({ ...f, answer: v })} multiline addLabel="Paragraf qo'shish" />
              <L10nList label="Ro'yxat (ixtiyoriy)" items={f.list ?? []} onChange={(v) => update({ ...f, list: v })} addLabel="Band qo'shish" />
              <fieldset className="group">
                <legend>Havola (ixtiyoriy)</legend>
                <label className="field">
                  <span>Sahifa</span>
                  <select
                    className="select"
                    value={f.link?.href ?? ""}
                    onChange={(e) =>
                      update({ ...f, link: e.target.value ? { href: e.target.value as Href, label: f.link?.label ?? emptyL10n() } : undefined })
                    }
                  >
                    <option value="">— havolasiz —</option>
                    {HREFS.map((h) => (
                      <option key={h.href} value={h.href}>
                        {h.label}
                      </option>
                    ))}
                  </select>
                </label>
                {f.link && <L10nInput label="Havola matni" value={f.link.label} onChange={(v) => update({ ...f, link: { ...f.link!, label: v } })} />}
              </fieldset>
            </>
          )}
        />
      </section>
      <SaveBar pending={pending} state={state} />
    </form>
  );
}
