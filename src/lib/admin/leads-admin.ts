import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { cache } from "react";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { ADMIN_DIR, readJson, withDataLock, writeJson } from "../fsdb";

// Admin: murojaatlar (aloqa, so'rov, bron, to'lov xabarlari) — /data/leads.ndjson dan o'qiladi.
// Fayl faqat qo'shiladi (sayt yozadi); holat va izohlar alohida: /data/admin/lead-status.json.
// ID — qator mazmunining xeshi (fayl o'zgarmaydi, shuning uchun barqaror).

const LEADS_FILE =
  process.env.LEADS_FILE ?? (process.env.NODE_ENV === "production" ? "/data/leads.ndjson" : join(tmpdir(), "ravon-leads.ndjson"));
const STATUS_FILE = () => join(ADMIN_DIR, "lead-status.json");

export type LeadKind = "contact" | "inquiry" | "booking" | "payment";
export type LeadState = "new" | "in_progress" | "done" | "spam";
export const LEAD_STATE_LABEL: Record<LeadState, string> = {
  new: "Yangi",
  in_progress: "Ishlanmoqda",
  done: "Yakunlandi",
  spam: "Spam",
};
export const LEAD_KIND_LABEL: Record<LeadKind, string> = {
  contact: "Aloqa formasi",
  inquiry: "Tur so'rovi",
  booking: "Bron",
  payment: "To'lov",
};

export interface Lead {
  id: string;
  kind: LeadKind;
  receivedAt: string;
  data: Record<string, unknown>;
  state: LeadState;
  note?: string;
  updatedBy?: string;
}

interface StatusDoc {
  items: Record<string, { state: LeadState; note?: string; updatedBy?: string; updatedAt: number }>;
}

type Parsed = { id: string; kind: LeadKind; receivedAt: string; data: Record<string, unknown> };
const gl = globalThis as typeof globalThis & { __ravonLeadsParsed?: { mtimeMs: number; size: number; rows: Parsed[] } };

/** leads.ndjson ni o'qiydi va tahlil qiladi; fayl o'zgarmagan bo'lsa (mtime+hajm) — xotiradagi natija. */
async function parsedLeads(): Promise<Parsed[]> {
  let st;
  try {
    st = await stat(/* turbopackIgnore: true */ LEADS_FILE);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
  const hit = gl.__ravonLeadsParsed;
  if (hit && hit.mtimeMs === st.mtimeMs && hit.size === st.size) return hit.rows;
  const raw = await readFile(/* turbopackIgnore: true */ LEADS_FILE, "utf8");
  const rows: Parsed[] = [];
  let skipped = 0;
  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    try {
      const rec = JSON.parse(line) as { kind: LeadKind; receivedAt: string; data: Record<string, unknown> };
      rows.push({ id: createHash("sha256").update(line).digest("hex").slice(0, 16), kind: rec.kind, receivedAt: rec.receivedAt, data: rec.data ?? {} });
    } catch {
      skipped++; // buzilgan qator (masalan disk to'lganda chala yozilgan)
    }
  }
  if (skipped) console.error(JSON.stringify({ event: "leads_lines_skipped", count: skipped }));
  gl.__ravonLeadsParsed = { mtimeMs: st.mtimeMs, size: st.size, rows };
  return rows;
}

/** Murojaatlar (yangisi birinchi) holat/izohlari bilan. Bir so'rov ichida bir marta (React cache). */
export const listLeads = cache(async function listLeads(): Promise<Lead[]> {
  const [rows, statusDoc] = await Promise.all([parsedLeads(), readJson<StatusDoc>(STATUS_FILE())]);
  const status = statusDoc?.items ?? {};
  const leads: Lead[] = [];
  for (const rec of rows) {
    {
      const id = rec.id;
      const st = status[id];
      // To'lov xabarlari — ma'lumot uchun; standart holat "yakunlandi" (bron sahifasida ishlanadi).
      const fallback: LeadState = rec.kind === "payment" ? "done" : "new";
      const state = st && Object.hasOwn(LEAD_STATE_LABEL, st.state) ? st.state : fallback;
      leads.push({ id, kind: rec.kind, receivedAt: rec.receivedAt, data: rec.data, state, note: st?.note, updatedBy: st?.updatedBy });
    }
  }
  return leads.reverse();
});

export async function setLeadState(id: string, state: LeadState, note: string | undefined, by: string) {
  if (!/^[0-9a-f]{16}$/.test(id)) throw new Error("bad lead id");
  if (!Object.hasOwn(LEAD_STATE_LABEL, state)) throw new Error("bad lead state");
  await withDataLock(async () => {
    const doc = structuredClone((await readJson<StatusDoc>(STATUS_FILE())) ?? { items: {} });
    const prev = doc.items[id];
    doc.items[id] = {
      state,
      note: note === undefined ? prev?.note : note.trim().slice(0, 2000) || undefined,
      updatedBy: by,
      updatedAt: Date.now(),
    };
    await writeJson(STATUS_FILE(), doc);
  });
}

/** Bron raqami bo'yicha mijoz ma'lumoti (ism, telefon, email) — bron sahifasi uchun. */
export async function bookingLead(bookingId: string): Promise<Lead | undefined> {
  return (await listLeads()).find((l) => l.kind === "booking" && l.data.bookingId === bookingId);
}
