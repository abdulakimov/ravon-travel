// Kirish urinishlari cheklovi (xotirada; konteyner bitta). Kalit — IP va foydalanuvchi nomi alohida.
const WINDOW_MS = 15 * 60 * 1000;
/** Kalit bo'yicha chegara: "ip+login" — 8, "ip" — 30. Faqat login bo'yicha qattiq blok YO'Q
 *  (aks holda begona odam egasini 15 daqiqaga bloklab qo'ya olardi). */
const limitFor = (key: string) => (key.startsWith("ip:") ? 30 : 8);
const g = globalThis as typeof globalThis & { __ravonLoginHits?: Map<string, number[]> };
const hits = (g.__ravonLoginHits ??= new Map<string, number[]>());

export function loginBlocked(keys: string[], now = Date.now()): boolean {
  return keys.some((k) => (hits.get(k) ?? []).filter((t) => now - t < WINDOW_MS).length >= limitFor(k));
}

export function recordLoginFailure(keys: string[], now = Date.now()) {
  for (const k of keys) {
    const recent = (hits.get(k) ?? []).filter((t) => now - t < WINDOW_MS);
    recent.push(now);
    hits.set(k, recent);
  }
  if (hits.size > 10_000) for (const k of hits.keys()) if ((hits.get(k) ?? []).every((t) => now - t >= WINDOW_MS)) hits.delete(k);
}

/** Muvaffaqiyatli kirishda: shu urinish uchun oldindan band qilingan yozuvni olib tashlaydi. */
export function clearLoginFailures(keys: string[]) {
  for (const k of keys) {
    const list = hits.get(k);
    if (!list) continue;
    list.pop();
    if (k.startsWith("iu:") || list.length === 0) hits.delete(k);
  }
}

// scrypt (~32 MB, ~100 ms) libuv pool'ini egallaydi — u saytning fayl I/O'si va Click callback'lari bilan umumiy.
// Bir vaqtda ko'pi bilan 2 ta parol tekshiruvi; qolganlari darhol "band" javobini oladi.
const MAX_CONCURRENT = 2;
const gs = globalThis as typeof globalThis & { __ravonScryptActive?: number };
export async function withPasswordSlot<T>(fn: () => Promise<T>): Promise<T | "busy"> {
  if ((gs.__ravonScryptActive ?? 0) >= MAX_CONCURRENT) return "busy";
  gs.__ravonScryptActive = (gs.__ravonScryptActive ?? 0) + 1;
  try {
    return await fn();
  } finally {
    gs.__ravonScryptActive = (gs.__ravonScryptActive ?? 1) - 1;
  }
}
