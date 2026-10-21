"use server";

import { refresh as refreshRouter } from "next/cache";
import { BOOKING_ID_RE } from "@/lib/booking-constants";
import { failure, type ActionState } from "@/lib/admin/action-state";
import { audit } from "@/lib/admin/audit";
import { paymentStatus, paymentStatusByOrder, reversePayment } from "@/lib/admin/click-merchant";
import { UserError } from "@/lib/admin/errors";
import { requireAction } from "@/lib/admin/guard";
import { cancelOrder, markRefunded, markReversalRequested, setHandled, setNote } from "@/lib/admin/orders-admin";
import { readOrder } from "@/lib/orders";

const orderId = (form: FormData) => {
  const id = String(form.get("id") ?? "");
  if (!BOOKING_ID_RE.test(id)) throw new UserError("Noto'g'ri bron raqami.");
  return id;
};

export async function toggleHandled(_p: ActionState, form: FormData): Promise<ActionState> {
  try {
    const user = await requireAction("manager");
    const id = orderId(form);
    const handled = form.get("handled") === "1";
    await setHandled(id, handled);
    await audit(user, handled ? "order_handled" : "order_unhandled", id);
    refreshRouter(); // sahifalar keshsiz — joriy sahifani yangilash kifoya
    return { ok: handled ? "Ko'rib chiqildi deb belgilandi." : "Belgi olib tashlandi." };
  } catch (err) {
    return failure(err, "toggleHandled");
  }
}

export async function saveNote(_p: ActionState, form: FormData): Promise<ActionState> {
  try {
    const user = await requireAction("manager");
    const id = orderId(form);
    await setNote(id, String(form.get("note") ?? ""));
    await audit(user, "order_note", id);
    refreshRouter(); // sahifalar keshsiz — joriy sahifani yangilash kifoya
    return { ok: "Izoh saqlandi." };
  } catch (err) {
    return failure(err, "saveNote");
  }
}

export async function cancel(_p: ActionState, form: FormData): Promise<ActionState> {
  try {
    const user = await requireAction("manager");
    const id = orderId(form);
    if (form.get("confirm") !== id) throw new UserError("Tasdiqlash uchun bron raqamini aynan yozing.");
    await cancelOrder(id, user.username);
    await audit(user, "order_cancel", id);
    refreshRouter(); // sahifalar keshsiz — joriy sahifani yangilash kifoya
    return { ok: "Bron bekor qilindi." };
  } catch (err) {
    return failure(err, "cancel");
  }
}

export async function refunded(_p: ActionState, form: FormData): Promise<ActionState> {
  try {
    const user = await requireAction("admin");
    const id = orderId(form);
    if (form.get("confirm") !== id) throw new UserError("Tasdiqlash uchun bron raqamini aynan yozing.");
    await markRefunded(id, user.username);
    await audit(user, "order_refunded", id);
    refreshRouter(); // sahifalar keshsiz — joriy sahifani yangilash kifoya
    return { ok: "Pul qaytarilgan deb belgilandi. Chek endi haqiqiy emas, o'rinlar qaytarildi." };
  } catch (err) {
    return failure(err, "refunded");
  }
}

export async function clickStatus(_p: ActionState, form: FormData): Promise<ActionState> {
  try {
    const user = await requireAction("manager");
    const id = orderId(form);
    const order = await readOrder(id);
    if (!order) throw new UserError("Bron topilmadi.");
    // Faqat shu bronning o'z to'lovi (formadagi qiymatga ishonilmaydi — boshqa to'lovlarni so'rab bo'lmasin)
    const paydoc = (order.transactions.find((t) => t.status === "confirmed") ?? order.transactions.at(-1))?.clickPaydocId ?? "";
    const data = paydoc
      ? await paymentStatus(paydoc)
      : await paymentStatusByOrder(id, new Date(order.createdAt).toISOString().slice(0, 10));
    await audit(user, "click_status", id, paydoc || "by_order");
    return { ok: "Click javobi:", data };
  } catch (err) {
    return failure(err, "clickStatus");
  }
}

export async function clickReverse(_p: ActionState, form: FormData): Promise<ActionState> {
  try {
    const user = await requireAction("admin");
    const id = orderId(form);
    if (form.get("confirm") !== id) throw new UserError("Tasdiqlash uchun bron raqamini aynan yozing.");
    const order = await readOrder(id);
    if (!order || order.status !== "paid") throw new UserError("Faqat to'langan bron uchun.");
    const tx = order.transactions.find((t) => t.status === "confirmed");
    if (!tx) throw new UserError("Tasdiqlangan Click tranzaksiyasi topilmadi.");
    await markReversalRequested(id);
    let data: Record<string, unknown>;
    try {
      data = await reversePayment(tx.clickPaydocId);
    } catch (err) {
      await audit(user, "click_reversal", id, `no_answer: ${err instanceof Error ? err.message : "error"}`);
      return {
        error:
          "Click javob bermadi — pul qaytarilgan bo'lishi ham mumkin. Qayta urinishdan oldin «Click'dagi holatni tekshirish» ni bosing.",
      };
    }
    await audit(user, "click_reversal", id, `error_code=${String(data.error_code)}`);
    if (Number(data.error_code) !== 0) return { error: `Click qaytarmadi: ${String(data.error_note ?? data.error_code)}`, data };
    await markRefunded(id, user.username);
    refreshRouter(); // sahifalar keshsiz — joriy sahifani yangilash kifoya
    return { ok: "Pul Click orqali qaytarildi va bron \"qaytarilgan\" deb belgilandi.", data };
  } catch (err) {
    return failure(err, "clickReverse");
  }
}
