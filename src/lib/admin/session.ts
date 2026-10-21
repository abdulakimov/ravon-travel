import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

// Admin sessiyasi: imzolangan cookie (HMAC-SHA256, kalit — ADMIN_SESSION_SECRET).
// Cookie host-only (Domain yo'q, "__Host-" prefiksi), HttpOnly, Secure, SameSite=Strict.
// Bekor qilish: foydalanuvchining sessionVersion'i oshirilsa — eski cookie'lar yaroqsiz.

export const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const PROD = process.env.NODE_ENV === "production";
/** Lokal (http://localhost) da "__Host-" prefiksi Secure talab qiladi — dev'da oddiy nom. */
export const SESSION_COOKIE = PROD ? "__Host-ravon_admin" : "ravon_admin";

const g = globalThis as typeof globalThis & { __ravonDevSessionSecret?: string };

function secret(): string {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (s && s.length >= 32) return s;
  if (PROD) throw new Error("ADMIN_SESSION_SECRET is missing or shorter than 32 characters");
  // Dev: jarayon davomida o'zgarmas tasodifiy kalit (restart'da sessiyalar tugaydi)
  return (g.__ravonDevSessionSecret ??= randomBytes(32).toString("hex"));
}

export interface SessionPayload {
  uid: string;
  ver: number;
  /** muddati (ms) */
  exp: number;
}

const sign = (data: string) => createHmac("sha256", secret()).update(data).digest("base64url");

export function encodeSession(p: SessionPayload): string {
  const body = Buffer.from(JSON.stringify(p)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function decodeSession(raw: string | undefined, now = Date.now()): SessionPayload | null {
  if (!raw || raw.length > 512) return null;
  const [body, mac] = raw.split(".");
  if (!body || !mac) return null;
  const expected = Buffer.from(sign(body));
  const got = Buffer.from(mac);
  if (expected.length !== got.length || !timingSafeEqual(expected, got)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
    if (typeof p.uid !== "string" || typeof p.ver !== "number" || typeof p.exp !== "number") return null;
    return p.exp > now ? p : null;
  } catch {
    return null;
  }
}

export const sessionCookieOptions = (maxAgeSec: number) => ({
  httpOnly: true,
  secure: PROD,
  sameSite: "strict" as const,
  path: "/",
  maxAge: maxAgeSec,
});
