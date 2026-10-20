import { NextResponse } from "next/server";
import { BOOKING_ID_RE } from "@/lib/booking-constants";
import { publicStatus, readOrder, tokenMatches } from "@/lib/orders";

// To'lov sahifasi Click'dan qaytgach shu yerdan holatni so'raydi. Faqat holat — shaxsiy ma'lumot yo'q
// So'rov `?k=<payToken>` bilan — bron raqamini taxmin qilish yetmaydi.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const headers = { "cache-control": "no-store" };
  if (!BOOKING_ID_RE.test(id)) return NextResponse.json({ error: "not_found" }, { status: 404, headers });
  try {
    const order = await readOrder(id);
    // Kalit noto'g'ri bo'lsa ham xuddi "topilmadi" — bron mavjudligini ham oshkor qilmaymiz.
    if (!order || !tokenMatches(order, new URL(req.url).searchParams.get("k")))
      return NextResponse.json({ error: "not_found" }, { status: 404, headers });
    return NextResponse.json({ status: publicStatus(order), paidAt: order.paidAt ?? null }, { headers });
  } catch (err) {
    console.error(JSON.stringify({ event: "payment_status_failed", error: String(err) }));
    return NextResponse.json({ error: "unavailable" }, { status: 503, headers });
  }
}
