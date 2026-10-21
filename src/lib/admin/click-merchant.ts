import { createHash } from "node:crypto";
import { clickConfig } from "../click";
import { UserError } from "./errors";

// Click Merchant API (https://docs.click.uz/merchant-api): to'lov holatini tekshirish va qaytarish (reversal).
// Auth: `merchant_user_id:sha1(timestamp + secret_key):timestamp`. Kalitlar faqat serverdagi .env da.

const BASE = "https://api.click.uz/v2/merchant";

export class MerchantApiError extends UserError {}

function auth() {
  const cfg = clickConfig();
  if (!cfg) throw new MerchantApiError("Click sozlanmagan (.env).");
  if (!cfg.merchantUserId) throw new MerchantApiError("CLICK_MERCHANT_USER_ID .env da yo'q.");
  const ts = Math.floor(Date.now() / 1000).toString();
  const digest = createHash("sha1").update(ts + cfg.secretKey).digest("hex");
  return { cfg, header: `${cfg.merchantUserId}:${digest}:${ts}` };
}

async function call(method: "GET" | "DELETE", path: string): Promise<Record<string, unknown>> {
  const { header } = auth();
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: { Accept: "application/json", "Content-Type": "application/json", Auth: header },
      redirect: "error",
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });
  } catch (err) {
    throw new MerchantApiError(`Click API bilan bog'lanib bo'lmadi (${err instanceof Error ? err.name : "error"}).`);
  }
  const text = await res.text();
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new MerchantApiError(`Click API javobi tushunarsiz (HTTP ${res.status}).`);
  }
  if (!res.ok && body.error_code === undefined) throw new MerchantApiError(`Click API: HTTP ${res.status}.`);
  return body;
}

const id = (v: string) => {
  if (!/^\d{1,20}$/.test(v)) throw new MerchantApiError("Noto'g'ri to'lov ID.");
  return v;
};

/** Click to'lov ID (click_paydoc_id) bo'yicha holat. */
export async function paymentStatus(paymentId: string) {
  const { cfg } = auth();
  return call("GET", `/payment/status/${cfg.serviceId}/${id(paymentId)}`);
}

/** Bron raqami (merchant_trans_id) va sana bo'yicha — Complete yetib kelmagan holatlar uchun. */
export async function paymentStatusByOrder(orderId: string, dateIso: string) {
  const { cfg } = auth();
  if (!/^RV-\d{4}-\d{5}$/.test(orderId) || !/^\d{4}-\d{2}-\d{2}$/.test(dateIso)) throw new MerchantApiError("Noto'g'ri parametr.");
  return call("GET", `/payment/status_by_mti/${cfg.serviceId}/${orderId}/${dateIso}`);
}

/** To'lovni qaytarish (faqat joriy oyda muvaffaqiyatli bo'lgan to'lovlar). QAYTARIB BO'LMAYDI. */
export async function reversePayment(paymentId: string) {
  const { cfg } = auth();
  return call("DELETE", `/payment/reversal/${cfg.serviceId}/${id(paymentId)}`);
}
