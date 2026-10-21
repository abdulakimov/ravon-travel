"use client";

import { useActionState, useState } from "react";
import type { ActionState } from "@/lib/admin/action-state";
import { MediaPicker } from "../../_ui/MediaPicker";
import { L10nInput, ListEditor, SaveBar, emptyL10n, type L10n } from "../../_ui/fields";
import { saveTaxonomy } from "./actions";

interface CountryRow {
  id: string;
  name: L10n;
  image: string;
  home: boolean;
  isNew?: boolean;
}
interface CategoryRow {
  id: string;
  name: L10n;
  isNew?: boolean;
}

export function TaxonomyEditor({
  countries: c0,
  categories: k0,
  counts,
}: {
  countries: CountryRow[];
  categories: CategoryRow[];
  counts: Record<string, number>;
}) {
  const [countries, setCountries] = useState(c0);
  const [categories, setCategories] = useState(k0);
  const [state, action, pending] = useActionState<ActionState, FormData>(saveTaxonomy, {});
  const payload = JSON.stringify({
    countries: countries.map(({ id, name, image, home }) => ({ id, name, image, home })),
    categories: categories.map(({ id, name }) => ({ id, name })),
  });
  const idField = (value: string, isNew: boolean | undefined, onChange: (v: string) => void) => (
    <label className="field">
      <span>ID (katalog filtrida, URL&apos;da)</span>
      <input
        className="input mono"
        value={value}
        readOnly={!isNew}
        onChange={(e) => onChange(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
        placeholder="masalan: tr"
      />
      {!isNew && <small>ID o&apos;zgarmaydi (turlar unga bog&apos;langan).</small>}
    </label>
  );

  return (
    <form action={action} className="stack" noValidate>
      <input type="hidden" name="payload" value={payload} />
      <section className="card">
        <div className="card-head">
          <h2>Mamlakatlar (yo&apos;nalishlar)</h2>
        </div>
        <div className="card-pad">
          <ListEditor
            items={countries}
            onChange={setCountries}
            make={() => ({ id: "", name: emptyL10n(), image: "", home: true, isNew: true })}
            addLabel="Mamlakat qo'shish"
            itemLabel={(i) => `${countries[i].name.uz || "Yangi mamlakat"} · ${counts[`c:${countries[i].id}`] ?? 0} ta tur`}
            render={(c, update) => (
              <>
                <div className="row">
                  {idField(c.id, c.isNew, (v) => update({ ...c, id: v }))}
                  <label className="check" style={{ alignSelf: "end", paddingBottom: 10 }}>
                    <input type="checkbox" checked={c.home} onChange={(e) => update({ ...c, home: e.target.checked })} /> Bosh sahifada ko&apos;rsatish
                  </label>
                </div>
                <L10nInput label="Nomi" value={c.name} onChange={(v) => update({ ...c, name: v })} />
                <MediaPicker label="Rasm" value={c.image} onChange={(v) => update({ ...c, image: v })} />
              </>
            )}
          />
        </div>
      </section>
      <section className="card">
        <div className="card-head">
          <h2>Tur toifalari</h2>
        </div>
        <div className="card-pad">
          <ListEditor
            items={categories}
            onChange={setCategories}
            make={() => ({ id: "", name: emptyL10n(), isNew: true })}
            addLabel="Toifa qo'shish"
            itemLabel={(i) => `${categories[i].name.uz || "Yangi toifa"} · ${counts[`k:${categories[i].id}`] ?? 0} ta tur`}
            render={(k, update) => (
              <div className="row">
                {idField(k.id, k.isNew, (v) => update({ ...k, id: v }))}
                <div style={{ gridColumn: "span 2" }}>
                  <L10nInput label="Nomi" value={k.name} onChange={(v) => update({ ...k, name: v })} />
                </div>
              </div>
            )}
          />
        </div>
      </section>
      <SaveBar pending={pending} state={state} />
    </form>
  );
}
