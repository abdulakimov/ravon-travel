import { NextResponse } from "next/server";
import type { z } from "zod";

// Aloqa va so'rov formalari uchun umumiy server ishlovchisi:
// origin tekshiruvi → rate limit → hajm cheklovi → zod validatsiya → honeypot → yetkazish.
// Yetkazish: server log'i (har doim) + LEAD_WEBHOOK_URL berilgan bo'lsa JSON POST (CRM/Telegram ko'prigi).

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const MAX_BODY_BYTES = 16 * 1024;
const MAX_TRACKED_IPS = 5000;

// Bitta konteyner uchun xotiradagi hisoblagich yetarli (bitta replika). Ko'p replikada Redis kerak bo'ladi.
const hits = new Map<string, number[]>();

function clientIp(req: Request): string {
  // nginx X-Real-IP ni o'zi qo'yadi (mijoz soxtalashtira olmaydi); XFF faqat zaxira.
  return (
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",").pop()?.trim() ??
    "unknown"
  );
}

export function rateLimited(ip: string, now = Date.now()): boolean {
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > MAX_TRACKED_IPS) {
    for (const [key, times] of hits) {
      if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(key);
    }
    // Hali ham to'la bo'lsa (hujum) — eng eski yozuvlarni tashlaymiz, xotira cheklangan qoladi
    while (hits.size > MAX_TRACKED_IPS) hits.delete(hits.keys().next().value as string);
  }
  return false;
}

function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // brauzer bo'lmagan mijoz (curl) — CSRF xavfi yo'q
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

async function deliver(kind: string, data: unknown): Promise<void> {
  const url = process.env.LEAD_WEBHOOK_URL;
  if (!url) return;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ kind, receivedAt: new Date().toISOString(), data }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`lead webhook responded ${res.status}`);
}

/**
 * @param schema  zod sxema; `website` maydoni honeypot sifatida ajratib olinadi (sxemada bo'lmasin).
 * Javob: 200 {ok:true} · 400 {error:"invalid", fields} · 403 · 413 · 429 · 502
 */
export async function handleLead<T extends z.ZodType>(req: Request, kind: "contact" | "inquiry" | "booking", schema: T) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const ip = clientIp(req);
  if (rateLimited(ip)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429, headers: { "retry-after": "600" } });
  }

  const raw = await req.text().catch(() => "");
  if (raw.length > MAX_BODY_BYTES) return NextResponse.json({ error: "too_large" }, { status: 413 });

  let body: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("not an object");
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid", fields: {} }, { status: 400 });
  }

  // Honeypot: odam ko'rmaydigan maydon to'ldirilgan bo'lsa — bot. Jim "ok" qaytaramiz.
  const { website, ...payload } = body;
  if (typeof website === "string" && website.trim() !== "") return NextResponse.json({ ok: true });

  const result = schema.safeParse(payload);
  if (!result.success) {
    const fields: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = String(issue.path[0] ?? "_");
      fields[key] ??= issue.message;
    }
    return NextResponse.json({ error: "invalid", fields }, { status: 400 });
  }

  // Log'da shaxsiy ma'lumot to'liq yozilmaydi — faqat tur va vaqt; to'liq yozuv webhook'ga ketadi.
  console.info(JSON.stringify({ event: "lead", kind, at: new Date().toISOString(), delivered: Boolean(process.env.LEAD_WEBHOOK_URL) }));
  if (!process.env.LEAD_WEBHOOK_URL) {
    // Webhook sozlanmagan: xabar yo'qolmasligi uchun to'liq yozuv konteyner log'ida qoladi.
    console.info(JSON.stringify({ event: "lead_payload", kind, data: result.data }));
    return NextResponse.json({ ok: true });
  }

  try {
    await deliver(kind, result.data);
  } catch (err) {
    console.error(JSON.stringify({ event: "lead_delivery_failed", kind, error: String(err), data: result.data }));
    return NextResponse.json({ error: "delivery_failed" }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
