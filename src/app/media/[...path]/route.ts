import { readMediaFile } from "@/lib/media";

// Admin paneldan yuklangan rasmlar: /media/<id>.jpg va /media/opt/<id>-<w>.webp (o'zgarmas — 1 yil kesh).
export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const file = await readMediaFile((await params).path);
  if (!file) return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  return new Response(new Uint8Array(file.body), {
    headers: {
      "Content-Type": file.type,
      "Content-Length": String(file.body.length),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
