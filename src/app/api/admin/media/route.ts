import { NextResponse } from "next/server";
import { audit } from "@/lib/admin/audit";
import { isAdminHost, requireAction } from "@/lib/admin/guard";
import { UserError } from "@/lib/admin/errors";
import { MAX_UPLOAD_BYTES, MediaError, saveUpload } from "@/lib/media";

// Rasm yuklash (admin). Server Action emas — 1 MB chegarasidan katta fayllar uchun.
// Himoya: admin host + sessiya + rol, Origin == Host (CSRF), hajm chegarasi, sharp orqali qayta kodlash.
export async function POST(req: Request) {
  const host = req.headers.get("host");
  if (!isAdminHost(host)) return new NextResponse("Not found", { status: 404 });
  const origin = req.headers.get("origin");
  try {
    if (!origin || new URL(origin).host !== host) return NextResponse.json({ error: "Ruxsat yo'q." }, { status: 403 });
  } catch {
    return NextResponse.json({ error: "Ruxsat yo'q." }, { status: 403 });
  }
  try {
    const user = await requireAction("admin");
    if (Number(req.headers.get("content-length") ?? 0) > MAX_UPLOAD_BYTES + 64 * 1024) {
      return NextResponse.json({ error: "Fayl 10 MB dan katta." }, { status: 413 });
    }
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Fayl tanlanmagan." }, { status: 400 });
    if (file.size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: "Fayl 10 MB dan katta." }, { status: 413 });
    const item = await saveUpload(Buffer.from(await file.arrayBuffer()), file.name, user.username);
    await audit(user, "media_upload", item.id, item.name);
    return NextResponse.json({ item }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    if (err instanceof MediaError || err instanceof UserError) return NextResponse.json({ error: err.message }, { status: 400 });
    console.error(JSON.stringify({ event: "media_upload_failed", error: String(err) }));
    return NextResponse.json({ error: "Yuklashda xato." }, { status: 500 });
  }
}
