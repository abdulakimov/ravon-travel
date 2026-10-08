import { appendFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { NextResponse } from "next/server";
import type { z } from "zod";

// Aloqa va so'rov formalari uchun umumiy server ishlovchisi:
// origin tekshiruvi → rate limit → hajm cheklovi → zod validatsiya → honeypot → yetkazish.
// Yetkazish: /data/leads.ndjson fayliga yoziladi (doimiy) + Telegram (TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID)
// va/yoki LEAD_WEBHOOK_URL (JSON POST) — qaysi biri sozlangan bo'lsa.

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const MAX_BODY_BYTES = 16 * 1024;
const MAX_TRACKED_IPS = 5000;
// Productionda /data — host'dagi bind-mount. Lokal ishlab chiqishda vaqtinchalik katalog.
const LEADS_FILE =
  process.env.LEADS_FILE ?? (process.env.NODE_ENV === "production" ? "/data/leads.ndjson" : join(tmpdir(), "ravon-leads.ndjson"));

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

/** IPv6'da mijozga odatda butun /64 beriladi — manzilni almashtirib chetlab o'tilmasin. */
export function ipBucket(ip: string): string {
  return ip.includes(":") ? ip.toLowerCase().split(":").slice(0, 4).join(":") : ip;
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

const KIND_TITLE: Record<string, string> = {
  contact: "✉️ Aloqa formasi",
  inquiry: "🧭 Tur so'rovi",
  booking: "🎫 Yangi bron",
};

/** Telegram xabari matni (oddiy matn — parse_mode yo'q, shuning uchun escape kerak emas). */
export function telegramText(kind: string, data: unknown): string {
  const lines = [KIND_TITLE[kind] ?? kind, ""];
  for (const [key, value] of Object.entries((data ?? {}) as Record<string, unknown>)) {
    if (value === "" || value == null || key === "consent") continue;
    lines.push(`${key}: ${Array.isArray(value) ? value.join(", ") : String(value)}`);
  }
  return lines.join("\n").slice(0, 3900); // Telegram limiti 4096
}

const leadChannelsConfigured = () =>
  Boolean(process.env.LEAD_WEBHOOK_URL || (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID));

/** Sozlangan kanallarga yuboradi: Telegram (bot token + chat id) va/yoki umumiy webhook. */
async function deliver(kind: string, data: unknown): Promise<void> {
  const jobs: Promise<void>[] = [];
  const post = async (name: string, url: string, body: unknown) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      redirect: "error",
      signal: AbortSignal.timeout(8000),
    });
    // Xato matniga URL qo'shilmaydi — unda bot tokeni bor.
    if (!res.ok) throw new Error(`${name} responded ${res.status}`);
  };

  const { TELEGRAM_BOT_TOKEN: token, TELEGRAM_CHAT_ID: chatId, LEAD_WEBHOOK_URL: webhook } = process.env;
  if (token && chatId) {
    jobs.push(
      post("telegram", `https://api.telegram.org/bot${token}/sendMessage`, {
        chat_id: chatId,
        text: telegramText(kind, data),
        disable_web_page_preview: true,
      }).catch((err) => {
        // fetch xatosi URL'ni (tokenni) o'z ichiga olishi mumkin — log'ga faqat umumiy sabab
        throw new Error(err instanceof Error && err.message.startsWith("telegram responded") ? err.message : "telegram request failed");
      }),
    );
  }
  if (webhook) jobs.push(post("lead webhook", webhook, { kind, receivedAt: new Date().toISOString(), data }));

  const results = await Promise.allSettled(jobs);
  const failed = results.filter((r): r is PromiseRejectedResult => r.status === "rejected");
  // Kamida bitta kanal yetkazgan bo'lsa — yetkazildi; qolgan xatolar log'da ko'rinadi.
  if (failed.length === results.length) throw new Error(failed.map((f) => String(f.reason)).join("; "));
  for (const f of failed) console.error(JSON.stringify({ event: "lead_channel_failed", kind, error: String(f.reason) }));
}

/**
 * @param schema  zod sxema; `website` maydoni honeypot sifatida ajratib olinadi (sxemada bo'lmasin).
 * Javob: 200 {ok:true} · 400 {error:"invalid", fields} · 403 · 413 · 429 · 502
 */
export async function handleLead<T extends z.ZodType>(req: Request, kind: "contact" | "inquiry" | "booking", schema: T) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  // Har forma turi alohida hisoblanadi: aloqa formasini ko'p yuborish bron xabarini bloklamaydi.
  if (rateLimited(`${kind}:${ipBucket(clientIp(req))}`)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429, headers: { "retry-after": "600" } });
  }

  if (Number(req.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "too_large" }, { status: 413 });
  }
  const raw = await req.text().catch(() => "");
  if (Buffer.byteLength(raw) > MAX_BODY_BYTES) return NextResponse.json({ error: "too_large" }, { status: 413 });

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
    // PII'siz: rad etilgan so'rovlar (masalan narx o'zgargandagi bron) ko'rinib tursin.
    console.warn(JSON.stringify({ event: "lead_rejected", kind, fields: Object.keys(fields) }));
    return NextResponse.json({ error: "invalid", fields }, { status: 400 });
  }

  // 1) Avval DISKKA: /data — host'dagi bind-mount, deploy va restart'dan omon qoladi.
  //    Bu xabarning asosiy nusxasi; shaxsiy ma'lumot konteyner log'iga yozilmaydi.
  const record = { kind, receivedAt: new Date().toISOString(), data: result.data };
  let stored = false;
  try {
    await appendFile(LEADS_FILE, JSON.stringify(record) + "\n", { mode: 0o600 });
    stored = true;
  } catch (err) {
    console.error(JSON.stringify({ event: "lead_store_failed", kind, error: String(err) }));
  }

  // 2) Keyin webhook (sozlangan bo'lsa). Diskka yozilgan bo'lsa webhook xatosi mijozga xato emas.
  let delivered = false;
  if (leadChannelsConfigured()) {
    try {
      await deliver(kind, result.data);
      delivered = true;
    } catch (err) {
      console.error(JSON.stringify({ event: "lead_delivery_failed", kind, error: String(err), stored }));
    }
  }

  if (!stored && !delivered) {
    // Hech qayerga saqlanmadi: yo'qotmaslik uchun oxirgi chora — log'ga to'liq yozuv, mijozga xato.
    console.error(JSON.stringify({ event: "lead_payload", ...record }));
    return NextResponse.json({ error: "delivery_failed" }, { status: 502 });
  }
  console.info(JSON.stringify({ event: "lead", kind, at: record.receivedAt, stored, delivered }));
  return NextResponse.json({ ok: true });
}
