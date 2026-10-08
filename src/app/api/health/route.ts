// Konteyner healthcheck'i va deploy'dan keyingi tekshiruv uchun.
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ status: "ok" }, { headers: { "cache-control": "no-store" } });
}
