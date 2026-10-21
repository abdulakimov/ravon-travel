import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
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

export async function listLeads(): Promise<Lead[]> {
  let raw = "";
  try {
    raw = await readFile(/* turbopackIgnore: true */ LEADS_FILE, "utf8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }
  const status = (await readJson<StatusDoc>(STATUS_FILE()))?.items ?? {};
  const leads: Lead[] = [];
  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    try {
      const rec = JSON.parse(line) as { kind: LeadKind; receivedAt: string; data: Record<string, unknown> };
      const id = createHash("sha256").update(line).digest("hex").slice(0, 16);
      const st = status[id];
      // To'lov xabarlari — ma'lumot uchun; standart holat "yakunlandi" (bron sahifasida ishlanadi).
      const fallback: LeadState = rec.kind === "payment" ? "done" : "new";
      leads.push({ id, kind: rec.kind, receivedAt: rec.receivedAt, data: rec.data ?? {}, state: st?.state ?? fallback, note: st?.note, updatedBy: st?.updatedBy });
    } catch {
      // buzilgan qator — o'tkazib yuboriladi
    }
  }
  return leads.reverse();
}

export async function setLeadState(id: string, state: LeadState, note: string | undefined, by: string) {
  if (!/^[0-9a-f]{16}$/.test(id)) throw new Error("bad lead id");
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
