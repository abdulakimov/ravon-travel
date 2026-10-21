import { randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { BOOKING_ID_RE, HOLD_MS } from "./booking-constants";
import { withDataLock, writeAtomic } from "./fsdb";

// To'lov uchun bronlarning SERVERDAGI nusxasi (Click Prepare/Complete shunga tayanadi).
// Har bron — /data/orders/<id>.json (bind-mount, deploy'dan omon qoladi). Konteyner bitta,
// shuning uchun barcha yozuvlar bitta jarayon ichidagi navbat (mutex) orqali ketma-ket bajariladi.
// Shaxsiy ma'lumot MINIMAL: faqat qisqartirilgan ismlar («ISLOM K.» — chekni tekshirish uchun).
// To'liq ism, telefon, pasport, tug'ilgan sana — bu yerda yo'q (telefon/ism faqat leads.ndjson da, menejer uchun).

export type OrderStatus = "awaiting" | "paid" | "cancelled" | "refunded";

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
  /** Sayohatchilar, qisqartirilgan («ISLOM K.»): avval kattalar, keyin bolalar. Chek va tekshirish sahifasi uchun. */
  travelers?: string[];
  /**
   * Chekni tekshirish kodi (Crockford base32, 12 belgi ≈ 60 bit) — to'lov tasdiqlanganda beriladi, chekdagi QR'da.
   * payToken'dan alohida: chek uchinchi shaxsga (elchixona, ish joyi) beriladi va to'lov sahifasini ochmasligi kerak.
   */
  verifyCode?: string;
  transactions: ClickTransaction[];
  // ── Admin panel ──
  /** Menejer ko'rib chiqdi (hujjatlar yuborildi va h.k.) */
  handled?: boolean;
  /** Ichki izoh (mijozga ko'rinmaydi) */
  adminNote?: string;
  /** Bekor qilingan / pul qaytarilgan payt va kim tomonidan */
  closedAt?: number;
  closedBy?: string;
}

/** `"ISLOM KARIMOV"` → `"ISLOM K."`. Ism-familiya pasportdagidek lotin, bo'shliq bilan ajratilgan. */
export function maskName(full: string): string {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 40);
  return `${parts[0].slice(0, 40)} ${parts[parts.length - 1][0]}.`;
}

// Crockford base32: I, L, O, U yo'q — qo'lda terishda adashtirilmaydi.
const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export function newVerifyCode(): string {
  const bytes = randomBytes(12);
  return Array.from(bytes, (b) => CROCKFORD[b & 31]).join("");
}

/** `ABCD1234WXYZ` → `ABCD-1234-WXYZ` (chekda ko'rsatish uchun). */
export const formatVerifyCode = (code: string) => code.match(/.{1,4}/g)?.join("-") ?? code;

/** Foydalanuvchi kiritgan kodni me'yorlash: katta harf, chiziq/bo'shliqsiz, I/L → 1, O → 0. */
export function normalizeVerifyCode(input: string): string {
  return input
    .toUpperCase()
    .replace(/[\s-]/g, "")
    .replace(/[IL]/g, "1")
    .replace(/O/g, "0");
}

/** Faqat TO'LANGAN bron va to'g'ri kod — aks holda false (sabab oshkor qilinmaydi). */
export function verifyMatches(order: Order, input: string | null | undefined): boolean {
  if (order.status !== "paid" || !order.verifyCode || typeof input !== "string") return false;
  const a = Buffer.from(normalizeVerifyCode(input), "utf8");
  const b = Buffer.from(order.verifyCode, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

export const ORDERS_DIR =
  process.env.ORDERS_DIR ?? (process.env.NODE_ENV === "production" ? "/data/orders" : join(tmpdir(), "ravon-orders"));
const SEQ_FILE = () => join(ORDERS_DIR, "_seq.json");

/**
 * Barcha o'zgartirishlar shu navbatdan o'tadi: o'qish → tekshirish → yozish orasida poyga bo'lmaydi.
 * Navbat umumiy (fsdb.withDataLock): bronlar, kontent va admin yozuvlari bir-biri bilan ham to'qnashmaydi.
 */
export const withOrdersLock = withDataLock;

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

// to'lov holati: tmp + fsync + rename — tok o'chsa ham bo'sh yoki chala fayl qolmaydi
const writeOrderFile = (path: string, data: unknown) => writeAtomic(path, JSON.stringify(data));

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
  await writeOrderFile(fileFor(order.id), order);
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
  await writeOrderFile(SEQ_FILE(), { seq: next });
  return next;
}

export interface NewOrder {
  tourSlug: string;
  departureId: string;
  adults: number;
  children: number;
  locale: string;
  amountUzs: number;
  /** To'liq ismlar — saqlashdan oldin qisqartiriladi. */
  travelers?: string[];
}

/** Bron raqamini SERVER beradi (takrorlanmaydi) va bronni saqlaydi. */
export function createOrder(input: NewOrder, now = Date.now()): Promise<Order> {
  return withOrdersLock(async () => {
    const year = new Date(now).getFullYear();
    for (let attempt = 0; attempt < 20; attempt++) {
      const id = `RV-${year}-${String(randomInt(0, 100000)).padStart(5, "0")}`;
      if (await readOrder(id)) continue;
      const { travelers, ...rest } = input;
      const order: Order = {
        id,
        ...rest,
        travelers: travelers?.map(maskName),
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
export type PublicStatus = Exclude<OrderStatus, "refunded"> | "expired";

export function publicStatus(order: Order, now = Date.now()): PublicStatus {
  // Pul qaytarilgan bron mijozga "bekor qilingan" bo'lib ko'rinadi (chek ham haqiqiy emas — verifyMatches).
  if (order.status === "refunded") return "cancelled";
  if (order.status !== "awaiting") return order.status;
  // Click'da to'lov boshlangan (Prepare o'tgan) bo'lsa, Complete kelguncha muddat tugadi demaymiz.
  if (order.transactions.some((t) => t.status === "prepared")) return "awaiting";
  return now >= order.holdUntil ? "expired" : "awaiting";
}
