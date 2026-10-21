import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

// Click to'lovi ↔ o'rinlar soni ↔ admin holatlari (bekor qilish, pul qaytarish) — HTTP qatlami orqali (clickPOST).
// clickPOST soatni o'zi oladi (Date.now()) — shuning uchun uzoq kelajakdagi (2099) sana fixture sifatida qo'shiladi.
const dir = mkdtempSync(join(tmpdir(), "ravon-click-seats-test-"));
process.env.ORDERS_DIR = join(dir, "orders");
process.env.CONTENT_DIR = join(dir, "content");
process.env.ADMIN_DIR = join(dir, "admin");
process.env.LEADS_FILE = join(dir, "leads.ndjson");
process.env.CLICK_LOG_FILE = join(dir, "click.ndjson");
process.env.CLICK_SERVICE_ID = "12345";
process.env.CLICK_MERCHANT_ID = "678";
process.env.CLICK_SECRET_KEY = "s3cr3t";

const { ClickError, clickPOST } = await import("../click");
const orders = await import("../orders");
const content = await import("../content");
const ordersAdmin = await import("../admin/orders-admin");
const { withDataLock } = await import("../fsdb");

const SECRET = "s3cr3t";
const SLUG = "azerbaijan-7-wonders";
const DEP = "2099-01-10";
const AMOUNT = 20_000_000;
const md5 = (s: string) => createHash("md5").update(s).digest("hex");

async function setSeats(n: number) {
  await content.updateDoc("tours", (doc) => {
    const t = doc.tours.find((x) => x.slug === SLUG)!;
    t.published = true;
    t.departures = t.departures.filter((d) => d.id !== DEP);
    t.departures.push({ id: DEP, from: DEP, to: "2099-01-16", seatsLeft: n, priceUzs: AMOUNT / 2 });
  });
}
const seats = async () =>
  (await content.getTourRecords()).find((t) => t.slug === SLUG)!.departures.find((d) => d.id === DEP)!.seatsLeft;

let trans = 5_000_000;
function prepareForm(orderId: string) {
  const p: Record<string, string> = {
    click_trans_id: String(++trans),
    service_id: "12345",
    click_paydoc_id: String(9_000_000 + trans),
    merchant_trans_id: orderId,
    amount: String(AMOUNT),
    action: "0",
    error: "0",
    error_note: "Success",
    sign_time: "2099-01-01 12:00:00",
  };
  p.sign_string = md5(p.click_trans_id + p.service_id + SECRET + p.merchant_trans_id + p.amount + p.action + p.sign_time);
  return p;
}
function completeForm(prep: Record<string, string>, prepareId: string | number, error = "0") {
  const p: Record<string, string> = { ...prep, action: "1", merchant_prepare_id: String(prepareId), error };
  p.sign_string = md5(
    p.click_trans_id + p.service_id + SECRET + p.merchant_trans_id + p.merchant_prepare_id + p.amount + p.action + p.sign_time,
  );
  return p;
}

/** clickPOST + navbatni bo'shatish (fon yozuvlari — lead xabari va h.k. — tugasin, keyin tekshiramiz). */
async function post(p: Record<string, string>) {
  const res = await clickPOST(
    new Request("http://localhost/api/click/complete", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(p).toString(),
    }),
  );
  await withDataLock(async () => undefined);
  return (await res.json()) as Record<string, string | number>;
}

const newOrder = (adults = 2, children = 0) =>
  orders.createOrder({ tourSlug: SLUG, departureId: DEP, adults, children, locale: "uz", amountUzs: AMOUNT });

async function prepared(order: { id: string }) {
  const prep = prepareForm(order.id);
  const r = await post(prep);
  expect(r.error).toBe(ClickError.SUCCESS);
  return { prep, prepareId: r.merchant_prepare_id };
}

beforeAll(async () => {
  await setSeats(10);
});

describe("seats after a confirmed Click payment", () => {
  it("are decremented once by the party size, and not again on a Click retry", async () => {
    await setSeats(10);
    const order = await newOrder(2, 1);
    const { prep, prepareId } = await prepared(order);
    expect(await seats()).toBe(10); // Prepare o'rin olmaydi
    expect((await post(completeForm(prep, prepareId))).error).toBe(ClickError.SUCCESS);
    expect(await seats()).toBe(7);
    expect((await post(completeForm(prep, prepareId))).error).toBe(ClickError.ALREADY_PAID);
    expect(await seats()).toBe(7);
  });

  it("are untouched when Click reports a failed charge (error < 0)", async () => {
    await setSeats(10);
    const order = await newOrder();
    const { prep, prepareId } = await prepared(order);
    expect((await post(completeForm(prep, prepareId, "-5017"))).error).toBe(ClickError.CANCELLED);
    expect(await seats()).toBe(10);
    expect((await orders.readOrder(order.id))!.status).toBe("awaiting");
  });

  it("are decremented only once on a double payment (two transactions both charged)", async () => {
    await setSeats(10);
    const order = await newOrder();
    const a = await prepared(order);
    const b = await prepared(order);
    expect((await post(completeForm(a.prep, a.prepareId))).error).toBe(ClickError.SUCCESS);
    expect((await post(completeForm(b.prep, b.prepareId))).error).toBe(ClickError.ALREADY_PAID);
    expect(await seats()).toBe(8);
  });

  it("are restored when the admin marks the paid order refunded; the order then refuses new payments", async () => {
    await setSeats(10);
    const order = await newOrder();
    const { prep, prepareId } = await prepared(order);
    await post(completeForm(prep, prepareId));
    expect(await seats()).toBe(8);
    await ordersAdmin.markRefunded(order.id, "admin");
    expect(await seats()).toBe(10);
    await expect(ordersAdmin.markRefunded(order.id, "admin")).rejects.toBeInstanceOf(ordersAdmin.OrderActionError);
    expect(await seats()).toBe(10);
    expect((await post(prepareForm(order.id))).error).toBe(ClickError.CANCELLED);
  });

  it("a refunded order with a still-open transaction gets -9 on Complete and stays refunded", async () => {
    await setSeats(10);
    const order = await newOrder();
    const a = await prepared(order);
    const b = await prepared(order);
    await post(completeForm(a.prep, a.prepareId));
    await ordersAdmin.markRefunded(order.id, "admin");
    expect((await post(completeForm(b.prep, b.prepareId))).error).toBe(ClickError.CANCELLED);
    const stored = (await orders.readOrder(order.id))!;
    expect(stored.status).toBe("refunded");
    expect(stored.transactions.find((t) => t.prepareId === Number(b.prepareId))!.status).toBe("cancelled");
    expect(await seats()).toBe(10);
  });

  it("a Click retry repairs seats that were not applied (e.g. crash between payment and seat write) — exactly once", async () => {
    await setSeats(10);
    const order = await newOrder();
    const { prep, prepareId } = await prepared(order);
    await post(completeForm(prep, prepareId));
    expect((await orders.readOrder(order.id))!.seatsApplied).toBe(true);
    // Simulyatsiya: to'lov yozilgan, o'rin yozilmagan
    await orders.withOrdersLock(async () => {
      const o = (await orders.readOrder(order.id))!;
      o.seatsApplied = false;
      await orders.saveOrder(o);
    });
    await setSeats(10);
    expect((await post(completeForm(prep, prepareId))).error).toBe(ClickError.ALREADY_PAID);
    expect(await seats()).toBe(8);
    expect((await post(completeForm(prep, prepareId))).error).toBe(ClickError.ALREADY_PAID);
    expect(await seats()).toBe(8);
  });

  it("refunding a paid order whose seats were never applied does not inflate seats", async () => {
    await setSeats(10);
    const order = await newOrder();
    await orders.withOrdersLock(async () => {
      const o = (await orders.readOrder(order.id))!;
      o.status = "paid"; // seatsApplied yo'q
      await orders.saveOrder(o);
    });
    await ordersAdmin.markRefunded(order.id, "admin");
    expect(await seats()).toBe(10);
  });

  it("an unreadable tours file does not block the payment; seats are applied by the next Click retry", async () => {
    await setSeats(10);
    const order = await newOrder();
    const { prep, prepareId } = await prepared(order);
    const file = join(process.env.CONTENT_DIR!, "tours.json");
    const good = readFileSync(file, "utf8");
    writeFileSync(file, "{ broken");
    const done = await post(completeForm(prep, prepareId));
    expect(done.error).toBe(ClickError.SUCCESS); // pul yechilgan — to'lov tasdiqlanadi
    const stored = (await orders.readOrder(order.id))!;
    expect(stored.status).toBe("paid");
    expect(stored.seatsApplied).toBeFalsy();
    expect(readFileSync(file, "utf8")).toBe("{ broken"); // seed bilan ustidan yozilmagan
    writeFileSync(file, good);
    await post(completeForm(prep, prepareId));
    expect(await seats()).toBe(8);
  });

  it("an admin-cancelled order: Prepare -9, Complete -9, seats untouched", async () => {
    await setSeats(10);
    const order = await newOrder();
    const { prep, prepareId } = await prepared(order);
    await ordersAdmin.cancelOrder(order.id, "admin");
    expect((await post(completeForm(prep, prepareId))).error).toBe(ClickError.CANCELLED);
    expect((await post(prepareForm(order.id))).error).toBe(ClickError.CANCELLED);
    expect(await seats()).toBe(10);
    expect((await orders.readOrder(order.id))!.status).toBe("cancelled");
  });
});

// ── Mahsulot qarorlari (2026-10-21) ─────────────────────────────────────────────────────────────────────
describe("seat and visibility rules", () => {
  it("refuses Prepare when the departure no longer has seats for the party (no overbooking)", async () => {
    await setSeats(2);
    const first = await newOrder(2);
    const second = await newOrder(2);
    const a = await prepared(first);
    await post(completeForm(a.prep, a.prepareId));
    expect(await seats()).toBe(0);
    expect((await post(prepareForm(second.id))).error).toBe(ClickError.CANCELLED);
    expect(await seats()).toBe(0);
  });

  it("a refund returns exactly the seats that were taken (no inflation after clamping)", async () => {
    await setSeats(2);
    const order = await newOrder(2);
    const { prep, prepareId } = await prepared(order);
    await post(completeForm(prep, prepareId));
    expect(await seats()).toBe(0);
    expect((await orders.readOrder(order.id))!.seatsTaken).toBe(2);
    await ordersAdmin.markRefunded(order.id, "admin");
    expect(await seats()).toBe(2);
  });

  it("hiding a tour does not block payment of bookings already made on it", async () => {
    await setSeats(10);
    const order = await newOrder();
    await content.updateDoc("tours", (doc) => {
      doc.tours.find((x) => x.slug === SLUG)!.published = false;
    });
    expect((await post(prepareForm(order.id))).error).toBe(ClickError.SUCCESS);
    await setSeats(10); // qayta e'lon qiladi
  });
});
