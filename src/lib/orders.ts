import { randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { mkdir, open, readFile, rename, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { BOOKING_ID_RE, HOLD_MS } from "./booking-constants";

// To'lov uchun bronlarning SERVERDAGI nusxasi (Click Prepare/Complete shunga tayanadi).
// Har bron — /data/orders/<id>.json (bind-mount, deploy'dan omon qoladi). Konteyner bitta,
// shuning uchun barcha yozuvlar bitta jarayon ichidagi navbat (mutex) orqali ketma-ket bajariladi.
// Bu yerda shaxsiy ma'lumot YO'Q: ism, telefon, pasport — faqat leads.ndjson da (menejer uchun).

export type OrderStatus = "awaiting" | "paid" | "cancelled";

export interface ClickTransaction {
  clickTransId: string;
  clickPaydocId: string;
  prepareId: number;
  confirmId?: number;
  status: "prepared" | "confirmed" | "cancelled";
  preparedAt: number;
  finishedAt?: number;
}

export interface Order {
  id: string; // RV-YYYY-NNNNN
  tourSlug: string;
  departureId: string;
  adults: number;
  children: number;
  locale: string;
  /** Bron paytida qotirilgan summa (butun so'm). Click shu summani yechadi. */
  amountUzs: number;
  status: OrderStatus;
  createdAt: number;
  holdUntil: number;
  paidAt?: number;
  /**
   * To'lov sahifasi kaliti (128 bit). Bron raqami 5 xonali — taxmin qilish oson, shuning uchun sahifa va
   * holat endpoint'i faqat `?k=<payToken>` bilan ochiladi. Faqat mijozga qaytariladi, log/xabarga yozilmaydi.
   */
  payToken: string;
  transactions: ClickTransaction[];
}

const ORDERS_DIR =
  process.env.ORDERS_DIR ?? (process.env.NODE_ENV === "production" ? "/data/orders" : join(tmpdir(), "ravon-orders"));
const SEQ_FILE = () => join(ORDERS_DIR, "_seq.json");

// Navbat globalThis'da: Next har route uchun modulni alohida bundle qilsa ham (/api/booking va /api/click/*)
// jarayonda BITTA navbat bo'ladi.
const g = globalThis as typeof globalThis & { __ravonOrdersQueue?: Promise<unknown> };

/** Barcha o'zgartirishlar shu navbatdan o'tadi: o'qish → tekshirish → yozish orasida poyga bo'lmaydi. */
export function withOrdersLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = (g.__ravonOrdersQueue ?? Promise.resolve()).then(fn, fn);
  g.__ravonOrdersQueue = run.catch(() => undefined);
  return run;
}

/** `?k=` kalitini doimiy vaqtda solishtiradi. */
export function tokenMatches(order: Order, token: string | null | undefined): boolean {
  if (typeof token !== "string" || !order.payToken) return false;
  const a = Buffer.from(token, "utf8");
  const b = Buffer.from(order.payToken, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

const fileFor = (id: string) => {
  // Fayl nomi faqat qat'iy formatdagi ID'dan — yo'l bilan o'ynash (../) imkonsiz.
  if (!BOOKING_ID_RE.test(id)) throw new Error("invalid order id");
  return join(ORDERS_DIR, `${id}.json`);
};

async function writeAtomic(path: string, data: unknown): Promise<void> {
  await mkdir(ORDERS_DIR, { recursive: true, mode: 0o700 });
  const tmp = `${path}.${process.pid}.${Date.now()}.tmp`;
  try {
    const fh = await open(tmp, "w", 0o600);
    try {
      await fh.writeFile(JSON.stringify(data));
      await fh.sync(); // to'lov holati: tok o'chsa ham bo'sh fayl qolmasin
    } finally {
      await fh.close();
    }
    await rename(tmp, path); // bir fayl tizimida atomar: yarim yozilgan fayl hech qachon o'qilmaydi
  } catch (err) {
    await unlink(tmp).catch(() => undefined); // disk to'lganda chala fayl qolib, vaziyatni og'irlashtirmasin
    throw err;
  }
}

export async function readOrder(id: string): Promise<Order | null> {
  if (!BOOKING_ID_RE.test(id)) return null;
  try {
    return JSON.parse(await readFile(fileFor(id), "utf8")) as Order;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}

/** Faqat `withOrdersLock` ichidan chaqiriladi. */
export async function saveOrder(order: Order): Promise<void> {
  await writeAtomic(fileFor(order.id), order);
}

/** Click `merchant_prepare_id` / `merchant_confirm_id` uchun o'suvchi butun son. Faqat lock ichida. */
export async function nextSeq(): Promise<number> {
  let current = 0;
  try {
    const seq = Number(JSON.parse(await readFile(SEQ_FILE(), "utf8")).seq);
    if (!Number.isSafeInteger(seq) || seq < 0) throw new SyntaxError("bad seq value");
    current = seq;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      if (!(err instanceof SyntaxError)) throw err;
      // Fayl buzilgan: hisoblagichni joriy soniyadan davom ettiramiz — oldingi (kichik) qiymatlardan katta,
      // 2038 yilgacha int32 ga sig'adi. Aks holda barcha to'lovlar to'xtab qolardi.
      current = Math.floor(Date.now() / 1000);
      console.error(JSON.stringify({ event: "orders_seq_recovered", seq: current, error: String(err) }));
    }
  }
  const next = current + 1;
  await writeAtomic(SEQ_FILE(), { seq: next });
  return next;
}

export interface NewOrder {
  tourSlug: string;
  departureId: string;
  adults: number;
  children: number;
  locale: string;
  amountUzs: number;
}

/** Bron raqamini SERVER beradi (takrorlanmaydi) va bronni saqlaydi. */
export function createOrder(input: NewOrder, now = Date.now()): Promise<Order> {
  return withOrdersLock(async () => {
    const year = new Date(now).getFullYear();
    for (let attempt = 0; attempt < 20; attempt++) {
      const id = `RV-${year}-${String(randomInt(0, 100000)).padStart(5, "0")}`;
      if (await readOrder(id)) continue;
      const order: Order = {
        id,
        ...input,
        status: "awaiting",
        createdAt: now,
        holdUntil: now + HOLD_MS,
        payToken: randomBytes(16).toString("base64url"),
        transactions: [],
      };
      await saveOrder(order);
      return order;
    }
    throw new Error("could not allocate a booking id");
  });
}

/** Mijozga ko'rsatiladigan holat: muddati o'tgan, to'lanmagan bron — `expired`. */
export type PublicStatus = OrderStatus | "expired";

export function publicStatus(order: Order, now = Date.now()): PublicStatus {
  if (order.status !== "awaiting") return order.status;
  // Click'da to'lov boshlangan (Prepare o'tgan) bo'lsa, Complete kelguncha muddat tugadi demaymiz.
  if (order.transactions.some((t) => t.status === "prepared")) return "awaiting";
  return now >= order.holdUntil ? "expired" : "awaiting";
}
