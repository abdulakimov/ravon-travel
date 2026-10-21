import { publicStatus, type Order } from "@/lib/orders";
import type { Tone } from "./ui";

/** Admin uchun bron holati: matn va rang. */
export function orderStatusView(o: Order): { label: string; tone: Tone } {
  const s = o.status === "refunded" ? "refunded" : publicStatus(o);
  switch (s) {
    case "paid":
      return { label: "To'langan", tone: "success" };
    case "awaiting":
      return { label: o.transactions.some((t) => t.status === "prepared") ? "Click'da to'lanmoqda" : "To'lov kutilmoqda", tone: "warn" };
    case "expired":
      return { label: "Muddati o'tgan", tone: "neutral" };
    case "cancelled":
      return { label: "Bekor qilingan", tone: "danger" };
    case "refunded":
      return { label: "Pul qaytarilgan", tone: "info" };
  }
}
