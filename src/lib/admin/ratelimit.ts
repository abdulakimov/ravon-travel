// Kirish urinishlari cheklovi (xotirada; konteyner bitta). Kalit — IP va foydalanuvchi nomi alohida.
const WINDOW_MS = 15 * 60 * 1000;
const MAX = 8;
const g = globalThis as typeof globalThis & { __ravonLoginHits?: Map<string, number[]> };
const hits = (g.__ravonLoginHits ??= new Map<string, number[]>());

export function loginBlocked(keys: string[], now = Date.now()): boolean {
  return keys.some((k) => (hits.get(k) ?? []).filter((t) => now - t < WINDOW_MS).length >= MAX);
}

export function recordLoginFailure(keys: string[], now = Date.now()) {
  for (const k of keys) {
    const recent = (hits.get(k) ?? []).filter((t) => now - t < WINDOW_MS);
    recent.push(now);
    hits.set(k, recent);
  }
  if (hits.size > 10_000) for (const k of hits.keys()) if ((hits.get(k) ?? []).every((t) => now - t >= WINDOW_MS)) hits.delete(k);
}

export function clearLoginFailures(keys: string[]) {
  for (const k of keys) hits.delete(k);
}
