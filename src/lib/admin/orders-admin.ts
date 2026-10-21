import { readdir } from "node:fs/promises";
import { cache } from "react";
import { join } from "node:path";
import { BOOKING_ID_RE } from "../booking-constants";
import { readJson } from "../fsdb";
import { ORDERS_DIR, readOrder, saveOrder, withOrdersLock, type Order } from "../orders";
import { adjustSeatsLocked } from "../content";
import { UserError } from "./errors";

// Admin: bronlar ro'yxati va qo'lda bajariladigan amallar. Har bir o'zgarish bron qulfi ichida.
// "To'landi" holatini qo'lda o'rnatish ATAYLAB yo'q — uni faqat imzolangan Click Complete o'rnatadi.

/** Barcha bronlar (yangisi birinchi). Bir so'rov ichida bir marta o'qiladi (React cache). */
export const listOrders = cache(async function listOrders(): Promise<Order[]> {
  let names: string[];
  try {
    names = await readdir(ORDERS_DIR);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
  const ids = names.filter((n) => n.endsWith(".json")).map((n) => n.slice(0, -5)).filter((id) => BOOKING_ID_RE.test(id));
  const orders = await Promise.all(
    ids.map((id) =>
      readJson<Order>(join(ORDERS_DIR, `${id}.json`)).catch((err) => {
        console.error(JSON.stringify({ event: "admin_order_read_failed", id, error: String(err) }));
        return undefined;
      }),
    ),
  );
  return orders.filter((o): o is Order => Boolean(o)).sort((a, b) => b.createdAt - a.createdAt);
});

export class OrderActionError extends UserError {}

async function mutate(id: string, fn: (order: Order) => void | Promise<void>): Promise<Order> {
  return withOrdersLock(async () => {
    const order = await readOrder(id);
    if (!order) throw new OrderActionError("Bron topilmadi.");
    await fn(order);
    await saveOrder(order);
    return order;
  });
}

export function setHandled(id: string, handled: boolean) {
  return mutate(id, (o) => {
    o.handled = handled;
  });
}

/** Click reversal so'rovidan OLDIN belgilanadi — javob yo'qolsa ham izi qoladi. */
export function markReversalRequested(id: string) {
  return mutate(id, (o) => {
    if (o.status !== "paid") throw new OrderActionError("Faqat to'langan bron uchun.");
    o.reversalRequestedAt = Date.now();
  });
}

export function setNote(id: string, note: string) {
  return mutate(id, (o) => {
    o.adminNote = note.trim().slice(0, 2000) || undefined;
  });
}

/**
 * To'lanmagan bronni bekor qilish. Click'da to'lov boshlangan (Prepare) bo'lsa — keyingi Complete -9 oladi va
 * Click to'lovni o'zi bekor qiladi.
 */
export function cancelOrder(id: string, by: string) {
  return mutate(id, (o) => {
    if (o.status !== "awaiting") throw new OrderActionError("Faqat to'lanmagan bronni bekor qilish mumkin.");
    o.status = "cancelled";
    o.closedAt = Date.now();
    o.closedBy = by;
  });
}

/**
 * To'langan bronni "pul qaytarildi" deb belgilash (Click kabinetida yoki API orqali qaytarilgandan keyin).
 * Chek tekshiruvda endi haqiqiy chiqmaydi; o'rinlar sanaga qaytariladi.
 */
export function markRefunded(id: string, by: string): Promise<Order> {
  return mutate(id, async (o) => {
    if (o.status !== "paid") throw new OrderActionError("Faqat to'langan bronni qaytarilgan deb belgilash mumkin.");
    o.status = "refunded";
    o.closedAt = Date.now();
    o.closedBy = by;
    if (o.seatsApplied) {
      // Navbat ichida, bron bilan birga: o'rinlar qaytariladi
      await adjustSeatsLocked(o.tourSlug, o.departureId, o.seatsTaken ?? o.adults + o.children).catch((err) =>
        console.error(JSON.stringify({ event: "seats_restore_failed", order: id, error: String(err) })),
      );
      o.seatsApplied = false;
      o.seatsTaken = 0;
    }
  });
}
