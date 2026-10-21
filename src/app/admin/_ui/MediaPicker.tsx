"use client";

import { useRef, useState } from "react";
import { ImagePlus, Upload, X } from "lucide-react";
import { libraryAction, type Library } from "../(panel)/media/actions";

/** Brauzerdan rasm yuklash (/api/admin/media). Natija: yangi rasm URL'i yoki xato matni. */
export async function uploadImage(file: File): Promise<{ url?: string; error?: string }> {
  const body = new FormData();
  body.set("file", file);
  try {
    const res = await fetch("/api/admin/media", { method: "POST", body });
    const json = (await res.json()) as { item?: { url: string }; error?: string };
    return res.ok && json.item ? { url: json.item.url } : { error: json.error ?? "Yuklashda xato." };
  } catch {
    return { error: "Tarmoq xatosi." };
  }
}

export function Uploader({ onUploaded, label = "Rasm yuklash" }: { onUploaded: (url: string) => void; label?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <span style={{ display: "inline-flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          setBusy(true);
          setError(null);
          const r = await uploadImage(file);
          setBusy(false);
          if (r.url) onUploaded(r.url);
          else setError(r.error ?? "Xato");
        }}
      />
      <button type="button" className="btn sm" disabled={busy} onClick={() => input.current?.click()}>
        <Upload size={15} aria-hidden="true" /> {busy ? "Yuklanmoqda…" : label}
      </button>
      {error && <span className="alert error">{error}</span>}
    </span>
  );
}

/** Rasm maydoni: oldindan ko'rish + kutubxonadan tanlash + yuklash. */
export function MediaPicker({ value, onChange, label }: { value: string; onChange: (url: string) => void; label?: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [lib, setLib] = useState<Library | null>(null);
  const [loading, setLoading] = useState(false);

  const open = async () => {
    dialog.current?.showModal();
    setLoading(true);
    try {
      setLib(await libraryAction());
    } finally {
      setLoading(false);
    }
  };
  const pick = (url: string) => {
    onChange(url);
    dialog.current?.close();
  };

  return (
    <div className="field">
      {label && <span>{label}</span>}
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- admin oldindan ko'rish */}
        {value ? <img src={value} alt="" className="thumb" /> : <span className="thumb" />}
        <input className="input mono" style={{ flex: "1 1 220px" }} value={value} onChange={(e) => onChange(e.target.value.trim())} placeholder="/media/… yoki /img/…" />
        <button type="button" className="btn sm" onClick={open}>
          <ImagePlus size={15} aria-hidden="true" /> Tanlash
        </button>
        <Uploader onUploaded={onChange} label="Yuklash" />
      </div>
      <dialog ref={dialog} className="card" style={{ width: "min(960px, 94vw)", maxHeight: "86vh", padding: 0, border: 0 }}>
        <div className="card-head">
          <h2>Rasm tanlash</h2>
          <span style={{ display: "flex", gap: 8 }}>
            <Uploader onUploaded={pick} />
            <button type="button" className="btn sm ghost" onClick={() => dialog.current?.close()} aria-label="Yopish">
              <X size={16} aria-hidden="true" />
            </button>
          </span>
        </div>
        <div className="card-pad" style={{ overflowY: "auto", maxHeight: "calc(86vh - 60px)" }}>
          {loading && <p className="muted">Yuklanmoqda…</p>}
          {lib && (
            <>
              <h3 style={{ fontSize: 13, margin: "0 0 8px" }}>Yuklangan rasmlar</h3>
              {lib.uploads.length === 0 && <p className="muted">Hali yuklanmagan.</p>}
              <div className="media-grid">
                {lib.uploads.map((m) => (
                  <button key={m.id} type="button" className="media-item" style={{ padding: 0, cursor: "pointer", textAlign: "left" }} onClick={() => pick(m.url)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/media/opt/${m.id}-384.webp`} alt="" loading="lazy" />
                    <div className="meta">{m.name}</div>
                  </button>
                ))}
              </div>
              <h3 style={{ fontSize: 13, margin: "18px 0 8px" }}>Saytdagi rasmlar</h3>
              <div className="media-grid">
                {lib.site.map((url) => (
                  <button key={url} type="button" className="media-item" style={{ padding: 0, cursor: "pointer", textAlign: "left" }} onClick={() => pick(url)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url.replace(/^\/img\/(.+)\.(jpe?g|png)$/i, "/img/opt/$1-384.webp")} alt="" loading="lazy" />
                    <div className="meta">{url}</div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </dialog>
    </div>
  );
}
