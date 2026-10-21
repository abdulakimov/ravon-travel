import { mkdir, open, readFile, rename, stat, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

// Fayl "bazasi": /data (host'dagi bind-mount, deploy va restart'dan omon qoladi).
// Konteyner BITTA — barcha yozuvlar bitta jarayon ichidagi navbat orqali ketma-ket bajariladi.
// Navbat va kesh globalThis'da: Next har route'ni alohida bundle qilsa ham jarayonda bitta bo'ladi.

const PROD = process.env.NODE_ENV === "production";

/** Kontent (turlar, blog, sozlamalar…) — admin paneldan tahrirlanadi. */
export const CONTENT_DIR = process.env.CONTENT_DIR ?? (PROD ? "/data/content" : join(tmpdir(), "ravon-content"));
/** Admin: foydalanuvchilar, audit jurnali, murojaat holatlari. */
export const ADMIN_DIR = process.env.ADMIN_DIR ?? (PROD ? "/data/admin" : join(tmpdir(), "ravon-admin"));
/** Yuklangan rasmlar. */
export const MEDIA_DIR = process.env.MEDIA_DIR ?? (PROD ? "/data/media" : join(tmpdir(), "ravon-media"));

const g = globalThis as typeof globalThis & {
  __ravonOrdersQueue?: Promise<unknown>;
  __ravonJsonCache?: Map<string, { mtimeMs: number; size: number; value: unknown }>;
};

/**
 * Barcha /data o'zgartirishlari shu navbatdan o'tadi (bronlar, kontent, admin).
 * Kalit tarixiy sabab bilan `__ravonOrdersQueue` — orders.ts ham shu navbatni ishlatadi.
 * DIQQAT: navbat ichidan yana withDataLock chaqirilmaydi (o'zini kutib qoladi).
 */
export function withDataLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = (g.__ravonOrdersQueue ?? Promise.resolve()).then(fn, fn);
  g.__ravonOrdersQueue = run.catch(() => undefined);
  return run;
}

/** Atomar yozish: tmp + fsync + rename. Yarim yozilgan fayl hech qachon o'qilmaydi. */
export async function writeAtomic(path: string, data: string | Buffer, mode = 0o600): Promise<void> {
  await mkdir(dirname(path), { recursive: true, mode: 0o700 });
  const tmp = `${path}.${process.pid}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}.tmp`;
  try {
    const fh = await open(tmp, "w", mode);
    try {
      await fh.writeFile(data);
      await fh.sync();
    } finally {
      await fh.close();
    }
    await rename(tmp, path);
  } catch (err) {
    await unlink(tmp).catch(() => undefined);
    throw err;
  }
}

const cache = (g.__ravonJsonCache ??= new Map());

/**
 * JSON faylni o'qiydi; fayl o'zgarmagan bo'lsa (mtime + hajm) xotiradagi nusxani qaytaradi.
 * Fayl yo'q bo'lsa — `undefined`. Buzilgan JSON — xato (jim yutib yuborilmaydi).
 */
export async function readJson<T>(path: string): Promise<T | undefined> {
  let st;
  try {
    st = await stat(path);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      cache.delete(path);
      return undefined;
    }
    throw err;
  }
  const hit = cache.get(path);
  if (hit && hit.mtimeMs === st.mtimeMs && hit.size === st.size) return hit.value as T;
  const value = JSON.parse(await readFile(path, "utf8")) as T;
  cache.set(path, { mtimeMs: st.mtimeMs, size: st.size, value });
  return value;
}

/** JSON'ni atomar yozadi va keshni yangilaydi. Faqat `withDataLock` ichidan chaqiring. */
export async function writeJson(path: string, value: unknown): Promise<void> {
  await writeAtomic(path, JSON.stringify(value, null, 1));
  cache.delete(path);
}
