"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";

// Admin formalari uchun boshqariladigan (controlled) maydonlar.

import { emptyL10n, type L10n } from "./l10n";
export { emptyL10n, type L10n };

const LANGS = ["uz", "ru", "en"] as const;

/** Uch tilli maydon: UZ majburiy, RU/EN bo'sh bo'lsa saytda o'zbekchasi ko'rsatiladi. */
export function L10nInput({
  label,
  value,
  onChange,
  multiline = false,
  rows = 3,
  required = true,
  hint,
}: {
  label: string;
  value: L10n;
  onChange: (v: L10n) => void;
  multiline?: boolean;
  rows?: number;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div className="field">
      <span>
        {label}
        {required && <span className="muted"> *</span>}
      </span>
      <div className="l10n">
        {LANGS.map((lang) => (
          <div key={lang} className="l10n-row">
            <span className="l10n-tag">{lang.toUpperCase()}</span>
            {multiline ? (
              <textarea
                className="textarea"
                rows={rows}
                value={value[lang]}
                onChange={(e) => onChange({ ...value, [lang]: e.target.value })}
                required={required && lang === "uz"}
                aria-label={`${label} (${lang})`}
              />
            ) : (
              <input
                className="input"
                value={value[lang]}
                onChange={(e) => onChange({ ...value, [lang]: e.target.value })}
                required={required && lang === "uz"}
                aria-label={`${label} (${lang})`}
              />
            )}
          </div>
        ))}
      </div>
      {hint && <small>{hint}</small>}
    </div>
  );
}

/** Ro'yxat boshqaruvi: qo'shish, o'chirish, yuqoriga/pastga. */
export function ListEditor<T>({
  items,
  onChange,
  make,
  render,
  addLabel,
  itemLabel,
  max = 100,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  make: () => T;
  render: (item: T, update: (v: T) => void, index: number) => React.ReactNode;
  addLabel: string;
  itemLabel: (index: number) => string;
  max?: number;
}) {
  const move = (i: number, d: -1 | 1) => {
    const next = items.slice();
    [next[i], next[i + d]] = [next[i + d], next[i]];
    onChange(next);
  };
  return (
    <div className="stack" style={{ gap: 10 }}>
      {items.map((item, i) => (
        <div key={i} className="list-item">
          <div className="list-item-head">
            <span>{itemLabel(i)}</span>
            <span style={{ display: "flex", gap: 4 }}>
              <button type="button" className="btn sm ghost" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Yuqoriga">
                <ArrowUp size={15} aria-hidden="true" />
              </button>
              <button type="button" className="btn sm ghost" disabled={i === items.length - 1} onClick={() => move(i, 1)} aria-label="Pastga">
                <ArrowDown size={15} aria-hidden="true" />
              </button>
              <button type="button" className="btn sm ghost" onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label="O'chirish">
                <Trash2 size={15} aria-hidden="true" />
              </button>
            </span>
          </div>
          {render(item, (v) => onChange(items.map((x, j) => (j === i ? v : x))), i)}
        </div>
      ))}
      {items.length < max && (
        <div>
          <button type="button" className="btn sm" onClick={() => onChange([...items, make()])}>
            <Plus size={15} aria-hidden="true" /> {addLabel}
          </button>
        </div>
      )}
    </div>
  );
}

/** Uch tilli matnlar ro'yxati (paragraflar, "narxga kiradi" bandlari va h.k.). */
export function L10nList({
  label,
  items,
  onChange,
  multiline = false,
  addLabel = "Qo'shish",
  max,
}: {
  label: string;
  items: L10n[];
  onChange: (v: L10n[]) => void;
  multiline?: boolean;
  addLabel?: string;
  max?: number;
}) {
  return (
    <fieldset className="group">
      <legend>{label}</legend>
      <ListEditor
        items={items}
        onChange={onChange}
        make={emptyL10n}
        max={max}
        addLabel={addLabel}
        itemLabel={(i) => `${i + 1}.`}
        render={(item, update) => <L10nInput label="Matn" value={item} onChange={update} multiline={multiline} />}
      />
    </fieldset>
  );
}

export function NumberInput({
  label,
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  hint?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        className="input"
        type="number"
        inputMode="numeric"
        value={Number.isFinite(value) ? value : ""}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
      />
      {hint && <small>{hint}</small>}
    </label>
  );
}

/** JSON yuboruvchi forma natijasi + saqlash tugmasi (yopishqoq pastki panel). */
export function SaveBar({ pending, state, label = "Saqlash" }: { pending: boolean; state: { ok?: string; error?: string }; label?: string }) {
  return (
    <div className="sticky-foot form-foot">
      <button type="submit" className="btn primary" disabled={pending} aria-busy={pending || undefined}>
        {pending ? "Saqlanmoqda…" : label}
      </button>
      {state.ok && (
        <span className="alert success" role="status">
          {state.ok}
        </span>
      )}
      {state.error && (
        <span className="alert error" role="alert">
          {state.error}
        </span>
      )}
    </div>
  );
}
