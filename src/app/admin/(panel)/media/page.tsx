import type { Metadata } from "next";
import { requirePage } from "@/lib/admin/guard";
import { listMedia } from "@/lib/media";
import { ActionForm } from "../../_ui/ActionForm";
import { Empty, PageHead, fmtDateTime } from "../../_ui/ui";
import { MediaUploadBar } from "./UploadBar";
import { usedImages } from "@/lib/admin/media-usage";
import { removeMedia } from "./actions";

export const metadata: Metadata = { title: "Rasmlar" };

export default async function MediaPage() {
  await requirePage("admin");
  const [items, used] = await Promise.all([listMedia(), usedImages()]);
  return (
    <>
      <PageHead
        title="Rasmlar"
        description="Turlar, blog va yo'nalishlar uchun rasmlar. JPEG, PNG yoki WebP, 10 MB gacha — avtomatik siqiladi."
        actions={<MediaUploadBar />}
      />
      {items.length === 0 ? (
        <div className="card">
          <Empty>Hali rasm yuklanmagan.</Empty>
        </div>
      ) : (
        <div className="media-grid">
          {items.map((m) => {
            const inUse = used.has(m.url);
            return (
              <div key={m.id} className="media-item">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/media/opt/${m.id}-384.webp`} alt="" loading="lazy" />
                <div className="meta">
                  <div style={{ color: "var(--text)" }}>{m.name}</div>
                  <div className="mono">{m.url}</div>
                  <div>
                    {m.width}×{m.height} · {(m.bytes / 1024).toFixed(0)} KB · {fmtDateTime(m.createdAt)}
                  </div>
                  {inUse ? (
                    <span className="badge success" style={{ marginTop: 6 }}>
                      Saytda ishlatilmoqda
                    </span>
                  ) : (
                    <div style={{ marginTop: 6 }}>
                      <ActionForm action={removeMedia} submit="O'chirish" tone="danger" inline>
                        <input type="hidden" name="id" value={m.id} />
                      </ActionForm>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
