import { randomBytes } from "node:crypto";
import { readFile, unlink } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { MEDIA_DIR, readJson, withDataLock, writeAtomic, writeJson } from "./fsdb";
import { IMAGE_WIDTHS } from "./image-widths";
import { UserError } from "./admin/errors";

// Admin paneldan yuklangan rasmlar: /data/media/<id>.jpg (asl nusxa, ≤2400px) + /data/media/opt/<id>-<w>.webp.
// Har bir fayl sharp orqali QAYTA KODLANADI (EXIF/metadata o'chadi, faqat JPEG/PNG/WebP qabul qilinadi —
// SVG/HTML yuklab bo'lmaydi). Saytda `/media/<id>.jpg` sifatida ishlatiladi (image-loader WebP'ga yo'naltiradi).

export const MEDIA_ID_RE = /^\d{8}-[0-9a-f]{8}$/;
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const MAX_EDGE = 2400;
const INDEX = () => join(/* turbopackIgnore: true */ MEDIA_DIR, "index.json");

export interface MediaItem {
  id: string;
  url: string;
  name: string;
  width: number;
  height: number;
  bytes: number;
  createdAt: number;
  by: string;
}

export class MediaError extends UserError {}

export async function listMedia(): Promise<MediaItem[]> {
  return ((await readJson<{ items: MediaItem[] }>(INDEX()))?.items ?? []).slice().sort((a, b) => b.createdAt - a.createdAt);
}

// Bir vaqtda bitta yuklash (sharp xotirasi ~ yuzlab MB bo'lishi mumkin; server ulashilgan).
sharp.concurrency(1);
sharp.cache(false);
const gm = globalThis as typeof globalThis & { __ravonUploadBusy?: boolean };
const MAX_PIXELS = 40_000_000;

export async function saveUpload(input: Buffer, originalName: string, by: string): Promise<MediaItem> {
  if (gm.__ravonUploadBusy) throw new MediaError("Boshqa rasm yuklanmoqda — biroz kutib qayta urinib ko'ring.");
  gm.__ravonUploadBusy = true;
  try {
    return await processUpload(input, originalName, by);
  } catch (err) {
    if (err instanceof MediaError) throw err;
    // sharp dekodlashda yiqildi (chala/buzilgan fayl) — foydalanuvchi xatosi, server xatosi emas
    if (err instanceof Error && /vips|jpeg|png|webp|image|Input/i.test(err.message)) {
      throw new MediaError("Rasm o'qilmadi (fayl buzilgan yoki chala). Boshqa faylni yuklang.");
    }
    throw err;
  } finally {
    gm.__ravonUploadBusy = false;
  }
}

async function processUpload(input: Buffer, originalName: string, by: string): Promise<MediaItem> {
  if (input.length === 0) throw new MediaError("Fayl bo'sh.");
  if (input.length > MAX_UPLOAD_BYTES) throw new MediaError("Fayl 10 MB dan katta.");
  let meta;
  try {
    meta = await sharp(input, { limitInputPixels: MAX_PIXELS }).metadata();
  } catch {
    throw new MediaError("Rasm o'qilmadi. JPEG, PNG yoki WebP yuklang.");
  }
  if (!meta.format || !["jpeg", "png", "webp"].includes(meta.format)) throw new MediaError("Faqat JPEG, PNG yoki WebP rasm.");

  const day = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const id = `${day}-${randomBytes(4).toString("hex")}`;
  const base = sharp(input, { limitInputPixels: MAX_PIXELS }).rotate();
  const master = await base
    .clone()
    .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
    .flatten({ background: "#ffffff" })
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer({ resolveWithObject: true });
  await writeAtomic(join(/* turbopackIgnore: true */ MEDIA_DIR, `${id}.jpg`), master.data, 0o644);
  // WebP o'lchamlari kichraytirilgan asl nusxadan (≤2400px) — to'liq o'lchamli manbani qayta-qayta ochmaslik uchun
  for (const width of IMAGE_WIDTHS) {
    let out: Buffer | undefined;
    for (const quality of [72, 60, 48]) {
      out = await sharp(master.data).resize({ width, withoutEnlargement: true }).webp({ quality, effort: 4 }).toBuffer();
      if (out.length <= 220 * 1024) break;
    }
    await writeAtomic(join(/* turbopackIgnore: true */ MEDIA_DIR, "opt", `${id}-${width}.webp`), out!, 0o644);
  }
  const item: MediaItem = {
    id,
    url: `/media/${id}.jpg`,
    name: originalName.replace(/[^\w.\- ()]/g, "_").slice(0, 120) || "rasm",
    width: master.info.width,
    height: master.info.height,
    bytes: master.data.length,
    createdAt: Date.now(),
    by,
  };
  await withDataLock(async () => {
    const doc = structuredClone((await readJson<{ items: MediaItem[] }>(INDEX())) ?? { items: [] });
    doc.items.push(item);
    await writeJson(INDEX(), doc);
  });
  return item;
}

export async function deleteMedia(id: string): Promise<void> {
  if (!MEDIA_ID_RE.test(id)) throw new MediaError("Noto'g'ri rasm ID.");
  await withDataLock(async () => {
    const doc = structuredClone((await readJson<{ items: MediaItem[] }>(INDEX())) ?? { items: [] });
    doc.items = doc.items.filter((i) => i.id !== id);
    await writeJson(INDEX(), doc);
  });
  const files = [`${id}.jpg`, ...IMAGE_WIDTHS.map((w) => join("opt", `${id}-${w}.webp`))];
  await Promise.all(files.map((f) => unlink(join(/* turbopackIgnore: true */ MEDIA_DIR, f)).catch(() => undefined)));
}

/** /media/<...> so'rovi uchun fayl: faqat qat'iy nomlar (yo'l bilan o'ynab bo'lmaydi). */
export async function readMediaFile(parts: string[]): Promise<{ body: Buffer; type: string } | null> {
  let rel: string | null = null;
  let type = "";
  if (parts.length === 1 && /^\d{8}-[0-9a-f]{8}\.jpg$/.test(parts[0])) {
    rel = parts[0];
    type = "image/jpeg";
  } else if (parts.length === 2 && parts[0] === "opt" && /^\d{8}-[0-9a-f]{8}-\d{3,4}\.webp$/.test(parts[1])) {
    rel = join("opt", parts[1]);
    type = "image/webp";
  }
  if (!rel) return null;
  try {
    return { body: await readFile(join(/* turbopackIgnore: true */ MEDIA_DIR, rel)), type };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}
