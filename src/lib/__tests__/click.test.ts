import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

// Modullar import qilinishidan OLDIN: bronlar va log'lar vaqtinchalik katalogga yozilsin
// (yo'llar modul yuklanganda o'qiladi — shuning uchun dinamik import).
const dir = mkdtempSync(join(tmpdir(), "ravon-click-test-"));
process.env.ORDERS_DIR = join(dir, "orders");
process.env.CLICK_LOG_FILE = join(dir, "click.ndjson");
process.env.LEADS_FILE = join(dir, "leads.ndjson");
process.env.CONTENT_DIR = join(dir, "content"); // seed turlar (dev'dagi tahrirlar testga ta'sir qilmasin)

const { ClickError, PREPARE_GRACE_MS, clickConfig, clickPOST, expectedSign, handleClick } = await import("../click");
const { createOrder, publicStatus, readOrder, saveOrder, tokenMatches, withOrdersLock, formatVerifyCode, maskName, normalizeVerifyCode, verifyMatches, newVerifyCode } = await import("../orders");
const { BOOKING_ID_RE } = await import("../booking-constants");
type ClickConfig = import("../click").ClickConfig;

const config: ClickConfig = { serviceId: "12345", merchantId: "678", secretKey: "s3cr3t", merchantUserId: null };
// 2026-10-01 12:00 Toshkent — "azerbaijan-7-wonders" ning 2026-10-26 sanasi hali oldinda.
const T0 = Date.UTC(2026, 9, 1, 7, 0, 0);
const AMOUNT = 18_220_000;

const md5 = (s: string) => createHash("md5").update(s).digest("hex");

async function newOrder(now = T0) {
  return createOrder(
    { tourSlug: "azerbaijan-7-wonders", departureId: "2026-10-26", adults: 2, children: 0, locale: "uz", amountUzs: AMOUNT },
    now,
  );
}

let trans = 1_000_000;
function prepareForm(orderId: string, o: { amount?: string; clickTransId?: string; error?: string; action?: string } = {}) {
  const p: Record<string, string> = {
    click_trans_id: o.clickTransId ?? String(++trans),
    service_id: config.serviceId,
    click_paydoc_id: String(9_000_000 + trans),
    merchant_trans_id: orderId,
    amount: o.amount ?? String(AMOUNT),
    action: o.action ?? "0",
    error: o.error ?? "0",
    error_note: "Success",
    sign_time: "2026-10-01 12:00:00",
  };
  p.sign_string = md5(p.click_trans_id + p.service_id + config.secretKey + p.merchant_trans_id + p.amount + p.action + p.sign_time);
  return p;
}

function completeForm(prep: Record<string, string>, prepareId: number | string, o: { error?: string; amount?: string } = {}) {
  const p: Record<string, string> = {
    ...prep,
    action: "1",
    merchant_prepare_id: String(prepareId),
    error: o.error ?? "0",
    amount: o.amount ?? prep.amount,
  };
  p.sign_string = md5(
    p.click_trans_id + p.service_id + config.secretKey + p.merchant_trans_id + p.merchant_prepare_id + p.amount + p.action + p.sign_time,
  );
  return p;
}

const run = (p: Record<string, string>, now = T0 + 60_000) => handleClick(new URLSearchParams(p), config, now);

// Har test bron to'laydi va sana o'rinlarini kamaytiradi — o'rin tekshiruvi (payable) testlar orasida tugab qolmasin
const contentStore = await import("../content");
await contentStore.updateDoc("tours", (doc) => {
  const dep = doc.tours.find((t) => t.slug === "azerbaijan-7-wonders")!.departures.find((d) => d.id === "2026-10-26")!;
  dep.seatsLeft = 999;
});

describe("clickConfig", () => {
  it("is null until service id, merchant id and secret key are all set", () => {
    expect(clickConfig({})).toBeNull();
    expect(clickConfig({ CLICK_SERVICE_ID: "1", CLICK_MERCHANT_ID: "2" })).toBeNull();
    expect(clickConfig({ CLICK_SERVICE_ID: "1", CLICK_MERCHANT_ID: "2", CLICK_SECRET_KEY: "x" })).toEqual({
      serviceId: "1",
      merchantId: "2",
      secretKey: "x",
      merchantUserId: null,
    });
  });
});

describe("expectedSign", () => {
  it("follows the documented field order for prepare and complete", () => {
    const p = { click_trans_id: "1", service_id: "2", merchant_trans_id: "RV-2026-00001", amount: "1000.00", action: "0", sign_time: "t" };
    expect(expectedSign(p, "K")).toBe(md5("12KRV-2026-000011000.000t"));
    expect(expectedSign({ ...p, action: "1", merchant_prepare_id: "7" }, "K")).toBe(md5("12KRV-2026-0000171000.001t"));
  });
});

describe("orders", () => {
  it("issues unique server-side booking ids and fixes the amount", async () => {
    const a = await newOrder();
    const b = await newOrder();
    expect(a.id).toMatch(BOOKING_ID_RE);
    expect(a.id).not.toBe(b.id);
    expect((await readOrder(a.id))?.amountUzs).toBe(AMOUNT);
    expect(publicStatus(a, T0)).toBe("awaiting");
    expect(publicStatus(a, a.holdUntil)).toBe("expired");
  });

  it("rejects malformed ids without touching the file system", async () => {
    expect(await readOrder("../../etc/passwd")).toBeNull();
  });

  it("gives every order a 128-bit url-safe pay token and compares it exactly", async () => {
    const a = await newOrder();
    const b = await newOrder();
    expect(a.payToken).toMatch(/^[A-Za-z0-9_-]{22}$/);
    expect(a.payToken).not.toBe(b.payToken);
    expect(tokenMatches(a, a.payToken)).toBe(true);
    expect(tokenMatches(a, b.payToken)).toBe(false);
    expect(tokenMatches(a, a.payToken.toUpperCase() === a.payToken ? a.payToken.toLowerCase() : a.payToken.toUpperCase())).toBe(false);
    expect(tokenMatches(a, a.payToken + "x")).toBe(false);
    expect(tokenMatches(a, "")).toBe(false);
    expect(tokenMatches(a, null)).toBe(false);
    expect(tokenMatches(a, undefined)).toBe(false);
    // Kalitsiz eski yozuv hech qanday kalit bilan ochilmaydi
    expect(tokenMatches({ ...a, payToken: "" }, "")).toBe(false);
  });

  it("keeps an order whose Click payment has started 'awaiting' past the hold; a cancelled attempt does not", async () => {
    const order = await newOrder();
    const late = order.holdUntil + 60_000;
    const tx = { clickTransId: "1", clickPaydocId: "2", prepareId: 1, preparedAt: T0 };
    expect(publicStatus({ ...order, transactions: [{ ...tx, status: "prepared" }] }, late)).toBe("awaiting");
    expect(publicStatus({ ...order, transactions: [{ ...tx, status: "cancelled" }] }, late)).toBe("expired");
    expect(publicStatus({ ...order, status: "paid" }, late)).toBe("paid");
    expect(publicStatus({ ...order, status: "cancelled" }, T0)).toBe("cancelled");
  });

  it("the lock keeps serving after a task throws", async () => {
    await expect(withOrdersLock(async () => Promise.reject(new Error("boom")))).rejects.toThrow("boom");
    expect(await withOrdersLock(async () => 42)).toBe(42);
  });

  it("surfaces a corrupt order file as an error instead of 'not found'", async () => {
    const order = await newOrder();
    writeFileSync(join(process.env.ORDERS_DIR!, `${order.id}.json`), "{broken");
    await expect(readOrder(order.id)).rejects.toThrow();
    await saveOrder(order); // tiklash — boshqa testlarga ta'sir qilmasin
  });
});

describe("prepare", () => {
  it("accepts a valid request and is idempotent for a repeated click_trans_id", async () => {
    const order = await newOrder();
    const p = prepareForm(order.id);
    const first = await run(p);
    expect(first.response).toMatchObject({ error: 0, error_note: "Success", merchant_trans_id: order.id });
    expect(typeof first.response.merchant_prepare_id).toBe("number");
    const again = await run(p);
    expect(again.response.merchant_prepare_id).toBe(first.response.merchant_prepare_id);
    expect((await readOrder(order.id))?.transactions).toHaveLength(1);
  });

  it("returns the same prepare id for concurrent duplicates", async () => {
    const order = await newOrder();
    const p = prepareForm(order.id);
    const [a, b] = await Promise.all([run(p), run(p)]);
    expect(a.response.merchant_prepare_id).toBe(b.response.merchant_prepare_id);
    expect((await readOrder(order.id))?.transactions).toHaveLength(1);
  });

  it("verifies the signature against the raw amount string", async () => {
    const order = await newOrder();
    expect((await run(prepareForm(order.id, { amount: `${AMOUNT}.00` }))).response.error).toBe(0);
  });

  it("rejects a bad signature (-1)", async () => {
    const order = await newOrder();
    const p = { ...prepareForm(order.id), sign_string: "0".repeat(32) };
    expect((await run(p)).response).toMatchObject({ error: ClickError.SIGN_FAILED, error_note: "SIGN CHECK FAILED!" });
  });

  it("rejects a tampered amount even if only the amount changes (-1)", async () => {
    const order = await newOrder();
    const p = { ...prepareForm(order.id), amount: "1000" };
    expect((await run(p)).response.error).toBe(ClickError.SIGN_FAILED);
  });

  it("rejects a wrong amount (-2)", async () => {
    const order = await newOrder();
    expect((await run(prepareForm(order.id, { amount: "1000" }))).response.error).toBe(ClickError.BAD_AMOUNT);
  });

  it("rejects an unknown action (-3)", async () => {
    const order = await newOrder();
    expect((await run(prepareForm(order.id, { action: "5" }))).response.error).toBe(ClickError.ACTION_NOT_FOUND);
  });

  it("rejects an unknown order (-5)", async () => {
    expect((await run(prepareForm("RV-2026-99999"))).response).toMatchObject({
      error: ClickError.ORDER_NOT_FOUND,
      error_note: "User does not exist",
    });
  });

  it("rejects missing or malformed fields and a foreign service id (-8)", async () => {
    const order = await newOrder();
    const p = prepareForm(order.id);
    const missing: Record<string, string> = { ...p };
    delete missing.sign_time;
    expect((await run(missing)).response.error).toBe(ClickError.BAD_REQUEST);
    expect((await run({ ...p, click_trans_id: "abc" })).response.error).toBe(ClickError.BAD_REQUEST);

    const foreign: Record<string, string> = { ...p, service_id: "999" };
    foreign.sign_string = md5(
      foreign.click_trans_id + foreign.service_id + config.secretKey + foreign.merchant_trans_id + foreign.amount + foreign.action + foreign.sign_time,
    );
    expect((await run(foreign)).response.error).toBe(ClickError.BAD_REQUEST);
  });

  it("refuses a new payment once the hold and the grace period are over (-9)", async () => {
    const order = await newOrder();
    const late = order.holdUntil + PREPARE_GRACE_MS + 1;
    expect((await run(prepareForm(order.id), late)).response.error).toBe(ClickError.CANCELLED);
  });

  it("refuses a departure that has already left (-9)", async () => {
    const order = await newOrder();
    // bron yangi, lekin "bugun" — jo'nash kunidan keyin
    expect((await run(prepareForm(order.id), Date.UTC(2026, 9, 27))).response.error).toBe(ClickError.CANCELLED);
  });
});

describe("admin-closed orders", () => {
  it("an order cancelled by the admin after Prepare gets -9 on Complete and never becomes paid", async () => {
    const order = await newOrder();
    const prep = prepareForm(order.id);
    const prepareId = (await run(prep)).response.merchant_prepare_id;
    await withOrdersLock(async () => {
      const o = (await readOrder(order.id))!;
      o.status = "cancelled";
      await saveOrder(o);
    });
    const done = await run(completeForm(prep, prepareId));
    expect(done.response.error).toBe(ClickError.CANCELLED);
    expect(done.paid).toBeUndefined();
    const stored = (await readOrder(order.id))!;
    expect(stored.status).toBe("cancelled");
    expect(stored.transactions[0].status).toBe("cancelled");
    // yangi to'lov ham ochilmaydi
    expect((await run(prepareForm(order.id))).response.error).toBe(ClickError.CANCELLED);
  });

  it("a refunded order shows as cancelled to the customer and its receipt no longer verifies", async () => {
    const order = await newOrder();
    const prep = prepareForm(order.id);
    const prepareId = (await run(prep)).response.merchant_prepare_id;
    await run(completeForm(prep, prepareId));
    const paid = (await readOrder(order.id))!;
    expect(verifyMatches(paid, paid.verifyCode)).toBe(true);
    paid.status = "refunded";
    expect(verifyMatches(paid, paid.verifyCode)).toBe(false);
    expect(publicStatus(paid)).toBe("cancelled");
    await withOrdersLock(() => saveOrder(paid));
    expect((await run(prepareForm(order.id))).response.error).toBe(ClickError.CANCELLED);
  });
});

describe("complete", () => {
  it("confirms the payment once and reports -4 on a retry", async () => {
    const order = await newOrder();
    const prep = prepareForm(order.id);
    const prepareId = (await run(prep)).response.merchant_prepare_id;

    const done = await run(completeForm(prep, prepareId));
    expect(done.response).toMatchObject({ error: 0, merchant_trans_id: order.id });
    expect(typeof done.response.merchant_confirm_id).toBe("number");
    expect(done.paid?.order.id).toBe(order.id);
    const stored = await readOrder(order.id);
    expect(stored?.status).toBe("paid");
    expect(publicStatus(stored!)).toBe("paid");

    const retry = await run(completeForm(prep, prepareId));
    expect(retry.response.error).toBe(ClickError.ALREADY_PAID);
    expect(retry.paid).toBeUndefined();

    // To'langan bronga yangi to'lov ochilmaydi
    expect((await run(prepareForm(order.id))).response.error).toBe(ClickError.ALREADY_PAID);
  });

  it("still confirms after the hold has expired — the money is already taken", async () => {
    const order = await newOrder();
    const prep = prepareForm(order.id);
    const prepareId = (await run(prep)).response.merchant_prepare_id;
    const done = await run(completeForm(prep, prepareId), order.holdUntil + 60 * 60 * 1000);
    expect(done.response.error).toBe(0);
  });

  it("rejects an unknown prepare id or a foreign click_trans_id (-6)", async () => {
    const order = await newOrder();
    const prep = prepareForm(order.id);
    const prepareId = (await run(prep)).response.merchant_prepare_id;
    expect((await run(completeForm(prep, 987654321))).response.error).toBe(ClickError.TRANSACTION_NOT_FOUND);
    const other = prepareForm(order.id); // boshqa click_trans_id, lekin shu prepare_id
    expect((await run(completeForm(other, prepareId))).response.error).toBe(ClickError.TRANSACTION_NOT_FOUND);
  });

  it("cancels the transaction when Click reports a failure (-9) and lets the customer retry", async () => {
    const order = await newOrder();
    const prep = prepareForm(order.id);
    const prepareId = (await run(prep)).response.merchant_prepare_id;
    const failed = await run(completeForm(prep, prepareId, { error: "-5017" }));
    expect(failed.response).toMatchObject({ error: ClickError.CANCELLED, error_note: "Transaction cancelled" });
    expect(failed.paid).toBeUndefined();
    expect((await run(completeForm(prep, prepareId))).response.error).toBe(ClickError.CANCELLED);
    expect((await readOrder(order.id))?.status).toBe("awaiting");

    const retry = prepareForm(order.id);
    expect((await run(retry)).response.error).toBe(0);
  });

  it("accepts an upper-case signature", async () => {
    const order = await newOrder();
    const p = prepareForm(order.id);
    expect((await run({ ...p, sign_string: p.sign_string.toUpperCase() })).response.error).toBe(0);
  });

  it("a second transaction completing after the order is paid gets -4 and is not reported as a new payment", async () => {
    const order = await newOrder();
    const first = prepareForm(order.id);
    const second = prepareForm(order.id);
    const id1 = (await run(first)).response.merchant_prepare_id;
    const id2 = (await run(second)).response.merchant_prepare_id;
    expect(id2).not.toBe(id1);
    expect((await run(completeForm(first, id1))).paid).toBeDefined();
    const double = await run(completeForm(second, id2));
    expect(double.response.error).toBe(ClickError.ALREADY_PAID);
    expect(double.paid).toBeUndefined();
    const stored = await readOrder(order.id);
    expect(stored?.status).toBe("paid");
    expect(stored?.transactions.find((t) => t.prepareId === id1)?.status).toBe("confirmed");
  });

  it("rejects a wrong amount on complete (-2)", async () => {
    const order = await newOrder();
    const prep = prepareForm(order.id);
    const prepareId = (await run(prep)).response.merchant_prepare_id;
    expect((await run(completeForm(prep, prepareId, { amount: "1000" }))).response.error).toBe(ClickError.BAD_AMOUNT);
  });
});

describe("clickPOST (HTTP)", () => {
  it("answers JSON with HTTP 200 and logs the exchange; -8 while Click is not configured", async () => {
    vi.stubEnv("CLICK_SERVICE_ID", "");
    const res = await clickPOST(
      new Request("http://x/api/click/prepare", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: "action=0",
      }),
    );
    vi.unstubAllEnvs();
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ error: ClickError.BAD_REQUEST });
    expect(readFileSync(process.env.CLICK_LOG_FILE!, "utf8")).toContain("click not configured");
  });

  it("treats a body over 8 KB as an empty request (-8)", async () => {
    vi.stubEnv("CLICK_SERVICE_ID", config.serviceId);
    vi.stubEnv("CLICK_MERCHANT_ID", config.merchantId);
    vi.stubEnv("CLICK_SECRET_KEY", config.secretKey);
    const order = await newOrder();
    const form = new URLSearchParams({ ...prepareForm(order.id), padding: "x".repeat(9 * 1024) });
    const res = await clickPOST(new Request("http://x/api/click/prepare", { method: "POST", body: form }));
    vi.unstubAllEnvs();
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ error: ClickError.BAD_REQUEST });
    expect((await readOrder(order.id))?.transactions).toHaveLength(0);
  });

  it("processes a signed form body end to end", async () => {
    vi.stubEnv("CLICK_SERVICE_ID", config.serviceId);
    vi.stubEnv("CLICK_MERCHANT_ID", config.merchantId);
    vi.stubEnv("CLICK_SECRET_KEY", config.secretKey);
    const order = await createOrder({
      tourSlug: "bulgaria-sunny-beach",
      departureId: "2027-07-10",
      adults: 1,
      children: 0,
      locale: "uz",
      amountUzs: AMOUNT,
    });
    const res = await clickPOST(
      new Request("http://x/api/click/prepare", { method: "POST", body: new URLSearchParams(prepareForm(order.id)) }),
    );
    vi.unstubAllEnvs();
    expect(await res.json()).toMatchObject({ error: 0, merchant_trans_id: order.id });
  });
});

describe("receipt verification", () => {
  it("masks traveller names to first name + last initial", () => {
    expect(maskName("ISLOM KARIMOV")).toBe("ISLOM K.");
    expect(maskName("  ANNA   MARIA  LEE ")).toBe("ANNA L.");
    expect(maskName("MADINA")).toBe("MADINA");
    expect(maskName("")).toBe("");
  });

  it("issues 12-char Crockford codes and normalises typed input", () => {
    const code = newVerifyCode();
    expect(code).toMatch(/^[0-9A-HJKMNP-TV-Z]{12}$/);
    expect(formatVerifyCode("ABCD1234WXYZ")).toBe("ABCD-1234-WXYZ");
    expect(normalizeVerifyCode(" abcd-1234 wxyz ")).toBe("ABCD1234WXYZ");
    expect(normalizeVerifyCode("O1LI")).toBe("0111");
  });

  it("stores masked names and gives a verify code only once the payment is confirmed", async () => {
    const order = await createOrder(
      {
        tourSlug: "azerbaijan-7-wonders",
        departureId: "2026-10-26",
        adults: 1,
        children: 0,
        locale: "uz",
        amountUzs: AMOUNT,
        travelers: ["ISLOM KARIMOV"],
      },
      T0,
    );
    expect(order.travelers).toEqual(["ISLOM K."]);
    expect(JSON.stringify(await readOrder(order.id))).not.toContain("KARIMOV");
    expect(order.verifyCode).toBeUndefined();

    const prep = prepareForm(order.id);
    const prepareId = (await run(prep)).response.merchant_prepare_id;
    expect((await readOrder(order.id))?.verifyCode).toBeUndefined();
    await run(completeForm(prep, prepareId));
    const paid = (await readOrder(order.id))!;
    expect(paid.verifyCode).toMatch(/^[0-9A-HJKMNP-TV-Z]{12}$/);

    expect(verifyMatches(paid, paid.verifyCode)).toBe(true);
    expect(verifyMatches(paid, formatVerifyCode(paid.verifyCode!).toLowerCase())).toBe(true);
    expect(verifyMatches(paid, "AAAA-AAAA-AAAA")).toBe(false);
    expect(verifyMatches(paid, "")).toBe(false);
    expect(verifyMatches(paid, null)).toBe(false);
    expect(verifyMatches({ ...paid, status: "awaiting" }, paid.verifyCode)).toBe(false);

    // Takroriy Complete kodni almashtirmaydi (chop etilgan chek eskirib qolmasin)
    await run(completeForm(prep, prepareId));
    expect((await readOrder(order.id))?.verifyCode).toBe(paid.verifyCode);
  });
});
