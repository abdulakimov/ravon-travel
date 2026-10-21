import { appendFile, mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { headers } from "next/headers";
import { ADMIN_DIR } from "../fsdb";
import type { AdminUser } from "./users";

// Admin harakatlari jurnali: /data/admin/audit.ndjson (kim, qachon, nima qildi). Faqat qo'shiladi.
// Parol, token kabi maxfiy qiymatlar `detail` ga YOZILMAYDI.

const FILE = () => join(ADMIN_DIR, "audit.ndjson");

export interface AuditEntry {
  at: string;
  user: string;
  action: string;
  target?: string;
  detail?: string;
  ip?: string;
}

export async function audit(user: Pick<AdminUser, "username"> | string, action: string, target?: string, detail?: string) {
  let ip: string | undefined;
  try {
    ip = (await headers()).get("x-real-ip") ?? undefined;
  } catch {
    ip = undefined; // so'rov kontekstidan tashqarida
  }
  const entry: AuditEntry = {
    at: new Date().toISOString(),
    user: typeof user === "string" ? user : user.username,
    action,
    ...(target ? { target } : {}),
    ...(detail ? { detail: detail.slice(0, 500) } : {}),
    ...(ip ? { ip } : {}),
  };
  try {
    await mkdir(ADMIN_DIR, { recursive: true, mode: 0o700 });
    await appendFile(FILE(), JSON.stringify(entry) + "\n", { mode: 0o600 });
  } catch (err) {
    console.error(JSON.stringify({ event: "audit_write_failed", error: String(err), ...entry }));
  }
}

/** Oxirgi yozuvlar (yangisi birinchi). */
export async function readAudit(limit = 300): Promise<AuditEntry[]> {
  try {
    const lines = (await readFile(FILE(), "utf8")).trim().split("\n").filter(Boolean);
    return lines
      .slice(-limit)
      .reverse()
      .flatMap((l) => {
        try {
          return [JSON.parse(l) as AuditEntry];
        } catch {
          return [];
        }
      });
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}
