import { createHash, timingSafeEqual } from "node:crypto";
import { appendFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getTour } from "./content";
import { todayIso } from "./tour-utils";
import { recordLead } from "./leads";
import { newVerifyCode, nextSeq, readOrder, saveOrder, withOrdersLock, type Order } from "./orders";

// Click SHOP API (https://docs.click.uz/shop-api/requests): Click serveri bizga ikki marta POST qiladi —
//   Prepare  (action=0): "bu buyurtma bormi, summa to'g'rimi?" → merchant_prepare_id
//   Complete (action=1): "pul yechildi" (yoki error<0 — yechilmadi) → merchant_confirm_id
// So'rov: application/x-www-form-urlencoded. Javob: JSON, har doim HTTP 200 (xato `error` maydonida).
// Mijozning brauzeridan kelgan "to'landi" signaliga hech qachon ishonilmaydi — faqat imzolangan Complete.

export interface ClickConfig {
  serviceId: string;
  merchantId: string;
  secretKey: string;
  merchantUserId: string | null;
}

/** Uchala majburiy qiymat .env da bo'lsa — Click yoqilgan; aks holda sayt demo rejimida qoladi. */
export function clickConfig(env: Record<string, string | undefined> = process.env): ClickConfig | null {
  const serviceId = env.CLICK_SERVICE_ID?.trim();
  const merchantId = env.CLICK_MERCHANT_ID?.trim();
  const secretKey = env.CLICK_SECRET_KEY?.trim();
  if (!serviceId || !merchantId || !secretKey) return null;
  return { serviceId, merchantId, secretKey, merchantUserId: env.CLICK_MERCHANT_USER_ID?.trim() || null };
}

export const ClickError = {
  SUCCESS: 0,
  SIGN_FAILED: -1,
  BAD_AMOUNT: -2,
  ACTION_NOT_FOUND: -3,
  ALREADY_PAID: -4,
  ORDER_NOT_FOUND: -5,
  TRANSACTION_NOT_FOUND: -6,
  UPDATE_FAILED: -7,
  BAD_REQUEST: -8,
  CANCELLED: -9,
} as const;

// Hujjatdagi matnlar aynan shunday (Click test dasturi ham shularni kutadi).
const NOTES: Record<number, string> = {
  0: "Success",
  [-1]: "SIGN CHECK FAILED!",
  [-2]: "Incorrect parameter amount",
  [-3]: "Action not found",
  [-4]: "Already paid",
  [-5]: "User does not exist",
  [-6]: "Transaction does not exist",
  [-7]: "Failed to update user",
  [-8]: "Error in request from click",
  [-9]: "Transaction cancelled",
};

/** Prepare'dan keyin ham 30 daqiqalik ushlab turish tugagan bo'lsa — Click sahifasida to'lov uchun qo'shimcha vaqt. */
export const PREPARE_GRACE_MS = 10 * 60 * 1000;

export type ClickResponse = Record<string, string | number>;

const md5 = (s: string) => createHash("md5").update(s, "utf8").digest("hex");

/**
 * Imzo Click yuborgan XOM satrlardan quriladi (masalan `amount` = "1000.00" bo'lsa aynan shunday) —
 * songa aylantirib qayta yozilsa imzo buziladi.
 */
export function expectedSign(p: Record<string, string>, secretKey: string): string {
  const prepareId = p.action === "1" ? p.merchant_prepare_id : "";
  return md5(
    p.click_trans_id + p.service_id + secretKey + p.merchant_trans_id + prepareId + p.amount + p.action + p.sign_time,
  );
}

function signValid(p: Record<string, string>, secretKey: string): boolean {
  const expected = Buffer.from(expectedSign(p, secretKey), "utf8");
  const given = Buffer.from(p.sign_string.toLowerCase(), "utf8");
  return given.length === expected.length && timingSafeEqual(given, expected);
}

const FIELDS = [
  "click_trans_id",
  "service_id",
  "click_paydoc_id",
  "merchant_trans_id",
  "amount",
  "action",
  "error",
  "sign_time",
  "sign_string",
] as const;

const DIGITS = /^\d{1,20}$/;

/** Shakl tekshiruvi. Noto'g'ri bo'lsa — null (javob: -8). */
function parseParams(form: URLSearchParams): Record<string, string> | null {
  const p: Record<string, string> = {};
  for (const key of [...FIELDS, "merchant_prepare_id", "error_note"]) p[key] = (form.get(key) ?? "").trim();
  if (FIELDS.some((key) => key !== "error" && p[key] === "")) return null;
  if (!DIGITS.test(p.click_trans_id) || !DIGITS.test(p.service_id) || !DIGITS.test(p.click_paydoc_id)) return null;
  if (!/^-?\d{1,6}$/.test(p.error || "0") || !/^\d{1,3}$/.test(p.action)) return null;
  if (!/^\d{1,15}(\.\d{1,2})?$/.test(p.amount) || !/^[0-9a-fA-F]{32}$/.test(p.sign_string)) return null;
  if (p.merchant_trans_id.length > 64 || p.sign_time.length > 32) return null;
  if (p.action === "1" && !DIGITS.test(p.merchant_prepare_id)) return null;
  return p;
}

/** Katta sonlarni yo'qotmaslik uchun: xavfsiz butun bo'lsa — son, aks holda satr. */
const idOut = (raw: string): string | number => {
  const n = Number(raw);
  return Number.isSafeInteger(n) ? n : raw;
};

const amountMatches = (raw: string, order: Order) => Math.abs(Number(raw) - order.amountUzs) < 0.01;

/** To'lanadigan bron: muddati (va Click uchun qo'shimcha vaqt) o'tmagan va sana hali jo'nab ketmagan. */
async function payable(order: Order, now: number): Promise<boolean> {
  if (now >= order.holdUntil + PREPARE_GRACE_MS) return false;
  const tour = await getTour(order.tourSlug, todayIso(new Date(now)));
  const departure = tour?.departures.find((d) => d.id === order.departureId);
  return Boolean(departure);
}

export interface Paid {
  order: Order;
  clickTransId: string;
  clickPaydocId: string;
}

/**
 * Click so'rovini qayta ishlaydi. `onPaid` — to'lov birinchi marta tasdiqlanganda (lock tashqarisida) chaqiriladi.
 * Takroriy so'rovlar (Click qayta yuborsa) bir xil javob oladi va holatni ikki marta o'zgartirmaydi.
 */
export async function handleClick(
  form: URLSearchParams,
  config: ClickConfig,
  now = Date.now(),
): Promise<{ response: ClickResponse; paid?: Paid; doublePayment?: Paid }> {
  const p = parseParams(form);
  const base = (error: number, extra: ClickResponse = {}): ClickResponse => ({
    click_trans_id: p ? idOut(p.click_trans_id) : idOut(form.get("click_trans_id") ?? ""),
    merchant_trans_id: p?.merchant_trans_id ?? form.get("merchant_trans_id") ?? "",
    ...extra,
    error,
    error_note: NOTES[error],
  });

  if (!p) return { response: base(ClickError.BAD_REQUEST) };
  if (!signValid(p, config.secretKey)) return { response: base(ClickError.SIGN_FAILED) };
  if (p.service_id !== config.serviceId) return { response: base(ClickError.BAD_REQUEST) };
  if (p.action !== "0" && p.action !== "1") return { response: base(ClickError.ACTION_NOT_FOUND) };

  const clickError = Number(p.error || "0");

  return withOrdersLock(async () => {
    const order = await readOrder(p.merchant_trans_id);
    if (!order) return { response: base(ClickError.ORDER_NOT_FOUND) };

    // ── Prepare ──────────────────────────────────────────────────────────────
    if (p.action === "0") {
      const existing = order.transactions.find((t) => t.clickTransId === p.click_trans_id);
      if (existing?.status === "confirmed" || order.status === "paid") return { response: base(ClickError.ALREADY_PAID) };
      if (existing?.status === "cancelled" || order.status === "cancelled") return { response: base(ClickError.CANCELLED) };
      if (!amountMatches(p.amount, order)) return { response: base(ClickError.BAD_AMOUNT) };
      if (existing) return { response: base(ClickError.SUCCESS, { merchant_prepare_id: existing.prepareId }) };
      if (clickError < 0 || !(await payable(order, now))) return { response: base(ClickError.CANCELLED) };

      const prepareId = await nextSeq();
      order.transactions.push({
        clickTransId: p.click_trans_id,
        clickPaydocId: p.click_paydoc_id,
        prepareId,
        status: "prepared",
        preparedAt: now,
      });
      await saveOrder(order);
      return { response: base(ClickError.SUCCESS, { merchant_prepare_id: prepareId }) };
    }

    // ── Complete ─────────────────────────────────────────────────────────────
    const tx = order.transactions.find((t) => t.prepareId === Number(p.merchant_prepare_id));
    if (!tx || tx.clickTransId !== p.click_trans_id) return { response: base(ClickError.TRANSACTION_NOT_FOUND) };
    if (tx.status === "confirmed")
      return { response: base(ClickError.ALREADY_PAID, { merchant_confirm_id: tx.confirmId ?? 0 }) };
    if (tx.status === "cancelled") return { response: base(ClickError.CANCELLED) };
    if (!amountMatches(p.amount, order)) return { response: base(ClickError.BAD_AMOUNT) };

    if (clickError < 0) {
      // Click: pul yechilmadi → tranzaksiyani bekor qilamiz va -9 qaytaramiz. Bron o'zi ochiq qoladi —
      // mijoz qaytadan to'lashi mumkin.
      tx.status = "cancelled";
      tx.finishedAt = now;
      await saveOrder(order);
      return { response: base(ClickError.CANCELLED) };
    }

    if (order.status === "paid") {
      // Ikkinchi tranzaksiya ham pul yechgan (juda kam uchraydi) — menejer qo'lda qaytarishi kerak.
      console.error(JSON.stringify({ event: "click_double_payment", order: order.id, clickTransId: tx.clickTransId }));
      return { response: base(ClickError.ALREADY_PAID), doublePayment: { order, clickTransId: tx.clickTransId, clickPaydocId: tx.clickPaydocId } };
    }

    // Pul yechilgan — yozish vaqtinchalik xato bersa (disk band) bir necha marta qayta urinamiz.
    const confirmId = await persistWithRetry(async () => {
      const id = tx.confirmId ?? (await nextSeq());
      tx.confirmId = id;
      tx.status = "confirmed";
      tx.finishedAt = now;
      order.status = "paid";
      order.paidAt = now;
      order.verifyCode ??= newVerifyCode();
      await saveOrder(order);
      return id;
    }, order.id);
    return {
      response: base(ClickError.SUCCESS, { merchant_confirm_id: confirmId }),
      paid: { order, clickTransId: tx.clickTransId, clickPaydocId: tx.clickPaydocId },
    };
  });
}

async function persistWithRetry<T>(fn: () => Promise<T>, orderId: string, attempts = 3): Promise<T> {
  for (let i = 1; ; i++) {
    try {
      return await fn();
    } catch (err) {
      console.error(JSON.stringify({ event: "click_complete_persist_failed", order: orderId, attempt: i, error: String(err) }));
      if (i >= attempts) throw err;
      await new Promise((r) => setTimeout(r, 150 * i));
    }
  }
}

// ── HTTP qatlami ─────────────────────────────────────────────────────────────

const CLICK_LOG =
  process.env.CLICK_LOG_FILE ?? (process.env.NODE_ENV === "production" ? "/data/click.ndjson" : join(tmpdir(), "ravon-click.ndjson"));
const MAX_BODY_BYTES = 8 * 1024;

/** Click tavsiyasi: har so'rov va javob log qilinadi (muammoni tez topish uchun). Kartaga oid ma'lumot bu yerda yo'q. */
async function logExchange(entry: Record<string, unknown>): Promise<void> {
  try {
    await appendFile(CLICK_LOG, JSON.stringify(entry) + "\n", { mode: 0o600 });
  } catch (err) {
    console.error(JSON.stringify({ event: "click_log_failed", error: String(err) }));
  }
}

const json = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json; charset=utf-8" } });

/** `/api/click/prepare` va `/api/click/complete` uchun umumiy POST ishlovchisi. */
export async function clickPOST(req: Request): Promise<Response> {
  const config = clickConfig();
  const ip = req.headers.get("x-real-ip") ?? "unknown";
  const started = Date.now();
  const at = new Date(started).toISOString();

  const raw = await req.text().catch(() => "");
  const form = new URLSearchParams(Buffer.byteLength(raw) > MAX_BODY_BYTES ? "" : raw);
  const params = Object.fromEntries(form);

  if (!config) {
    const response = { error: ClickError.BAD_REQUEST, error_note: NOTES[ClickError.BAD_REQUEST] };
    await logExchange({ at, ip, response, note: "click not configured" });
    return json(response);
  }

  let result: Awaited<ReturnType<typeof handleClick>>;
  try {
    result = await handleClick(form, config);
  } catch (err) {
    console.error(JSON.stringify({ event: "click_handler_failed", error: String(err) }));
    result = {
      response: {
        click_trans_id: params.click_trans_id ?? "",
        merchant_trans_id: params.merchant_trans_id ?? "",
        error: ClickError.UPDATE_FAILED,
        error_note: NOTES[ClickError.UPDATE_FAILED],
      },
    };
  }
  const error = result.response.error;
  // Imzosi yo'q/yaroqsiz so'rovlar to'liq yozilmaydi — begona POST'lar bilan diskni to'ldirib bo'lmasin.
  const trusted = error !== ClickError.SIGN_FAILED && error !== ClickError.BAD_REQUEST;
  await logExchange(
    trusted ? { at, ip, params, response: result.response } : { at, ip, rejected: error, bytes: Buffer.byteLength(raw) },
  );
  console.info(
    JSON.stringify({
      event: result.paid ? "click_paid" : "click",
      action: params.action?.slice(0, 3),
      order: trusted ? params.merchant_trans_id : undefined,
      clickTransId: trusted ? params.click_trans_id : undefined,
      amount: trusted ? params.amount : undefined,
      error,
      ms: Date.now() - started,
    }),
  );

  if (result.doublePayment) {
    const { order, clickTransId, clickPaydocId } = result.doublePayment;
    void recordLead("payment", {
      warning: "IKKINCHI TO'LOV — bron allaqachon to'langan, pulni qaytarish kerak",
      bookingId: order.id,
      amountUzs: order.amountUzs,
      clickTransId,
      clickPaydocId,
    }).catch((err) => console.error(JSON.stringify({ event: "payment_notify_failed", error: String(err) })));
  }

  if (result.paid) {
    const { order, clickTransId, clickPaydocId } = result.paid;
    // Menejerga xabar: yozuv/yetkazish xatosi Click javobiga ta'sir qilmaydi (pul allaqachon yechilgan).
    void recordLead("payment", {
      bookingId: order.id,
      amountUzs: order.amountUzs,
      tour: order.tourSlug,
      departureId: order.departureId,
      clickTransId,
      clickPaydocId,
    }).catch((err) => console.error(JSON.stringify({ event: "payment_notify_failed", error: String(err) })));
  }
  return json(result.response);
}
