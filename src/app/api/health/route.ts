import { access, constants, readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { ADMIN_DIR, CONTENT_DIR, MEDIA_DIR } from "@/lib/fsdb";
import { ORDERS_DIR } from "@/lib/orders";

// Konteyner healthcheck'i (sayoz: faqat jarayon tirikmi) va deploy tekshiruvi (`?deep=1`):
// /data papkalariga yozish mumkinligi va kontent fayllari to'g'ri JSON ekanini tekshiradi.
// Xato tafsiloti javobda yo'q (ochiq endpoint) — faqat log'da.
export const dynamic = "force-dynamic";

async function deepCheck(): Promise<string[]> {
  const problems: string[] = [];
  for (const [name, dir] of [["orders", ORDERS_DIR], ["content", CONTENT_DIR], ["admin", ADMIN_DIR], ["media", MEDIA_DIR]] as const) {
    try {
      await access(/* turbopackIgnore: true */ dir, constants.W_OK);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") problems.push(`${name}: ${(err as NodeJS.ErrnoException).code}`);
    }
  }
  try {
    for (const f of await readdir(/* turbopackIgnore: true */ CONTENT_DIR)) {
      if (!f.endsWith(".json")) continue;
      try {
        JSON.parse(await readFile(join(/* turbopackIgnore: true */ CONTENT_DIR, f), "utf8"));
      } catch {
        problems.push(`content/${f}: unreadable`);
      }
    }
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") problems.push(`content: ${(err as NodeJS.ErrnoException).code}`);
  }
  return problems;
}

export async function GET(req: Request) {
  const headers = { "cache-control": "no-store" };
  if (new URL(req.url).searchParams.get("deep") !== "1") return Response.json({ status: "ok" }, { headers });
  const problems = await deepCheck();
  if (problems.length) {
    console.error(JSON.stringify({ event: "health_deep_failed", problems }));
    return Response.json({ status: "degraded" }, { status: 503, headers });
  }
  return Response.json({ status: "ok" }, { headers });
}
