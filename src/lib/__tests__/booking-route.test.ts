import { chmodSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

// POST /api/booking: bron SERVERDA yaratiladi (raqam, summa, to'lov kaliti) va menejerga yoziladi.
// Yo'llar modul yuklanganda o'qiladi — shuning uchun env avval, import keyin (dinamik).
const dir = mkdtempSync(join(tmpdir(), "ravon-booking-route-"));
const ORDERS = join(dir, "orders");
const LEADS = join(dir, "leads.ndjson");
process.env.ORDERS_DIR = ORDERS;
process.env.LEADS_FILE = LEADS;

const { POST } = await import("@/app/api/booking/route");
const { GET: paymentStatus } = await import("@/app/api/payment/[id]/route");
const { readOrder } = await import("../orders");
const { bookingTotal } = await import("../format");
const { BOOKING_ID_RE, HOLD_MS } = await import("../booking-constants");

// Uzoq kelajakdagi sana — test sanaga bog'liq bo'lib qolmasin (Bolgariya, 22 o'rin, 12 400 000 so'm).
const SLUG = "bulgaria-sunny-beach";
const DEPARTURE = "2027-07-10";
const PRICE = 12_400_000;

// Rate limit (5 / 10 daqiqa / IP) modul darajasida — har so'rovga alohida IP.
let ipCounter = 0;
const nextIp = () => `10.0.${Math.floor(++ipCounter / 250)}.${ipCounter % 250}`;

const valid = (patch: Record<string, unknown> = {}) => ({
  slug: SLUG,
  departureId: DEPARTURE,
  locale: "uz",
  adults: 2,
  children: 1,
  travelers: ["ISLOM KARIMOV", "MADINA KARIMOVA", "AZIZA KARIMOVA"],
  phone: "+998 90 123 45 67",
  email: "qa@example.com",
  note: "",
  totalUzs: bookingTotal(PRICE, 2, 1),
  ...patch,
});

function post(body: unknown, headers: Record<string, string> = {}) {
  return POST(
    new Request("http://localhost/api/booking", {
      method: "POST",
      headers: { "content-type": "application/json", "x-real-ip": nextIp(), ...headers },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

const orderFiles = () => {
  try {
    return readdirSync(ORDERS).filter((f) => /^RV-\d{4}-\d{5}\.json$/.test(f));
  } catch {
    return [];
  }
};
const leadLines = () => {
  try {
    return readFileSync(LEADS, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l));
  } catch {
    return [];
  }
};

describe("POST /api/booking", () => {
  it("creates the booking on the server: id, fixed amount, hold and a pay token", async () => {
    const before = Date.now();
    const res = await post(valid());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ ok: true, amountUzs: 34_100_000 }); // 2×12 400 000 + 0.75×12 400 000 = 24 800 000 + 9 300 000
    expect(body.bookingId).toMatch(BOOKING_ID_RE);
    expect(body.holdUntil).toBeGreaterThanOrEqual(before + HOLD_MS);
    expect(body.holdUntil).toBeLessThanOrEqual(Date.now() + HOLD_MS);
    expect(body.payToken).toMatch(/^[A-Za-z0-9_-]{22}$/);

    const order = await readOrder(body.bookingId);
    expect(order).toMatchObject({
      id: body.bookingId,
      tourSlug: SLUG,
      departureId: DEPARTURE,
      adults: 2,
      children: 1,
      locale: "uz",
      amountUzs: 34_100_000,
      status: "awaiting",
      payToken: body.payToken,
      transactions: [],
    });
    // Server faylida shaxsiy ma'lumot yo'q
    const raw = readFileSync(join(ORDERS, `${body.bookingId}.json`), "utf8");
    expect(raw).not.toMatch(/KARIMOV|qa@example|\+998/);

    // Menejer yozuvi: bron raqami va summa bor, to'lov kaliti YO'Q
    const lead = leadLines().find((l) => l.data?.bookingId === body.bookingId);
    expect(lead).toMatchObject({ kind: "booking", data: { bookingId: body.bookingId, amountUzs: 34_100_000, totalUzs: 34_100_000 } });
    expect(JSON.stringify(lead)).not.toContain(body.payToken);
    expect(lead.data).not.toHaveProperty("payToken");
    expect(lead.data).not.toHaveProperty("holdUntil");
  });

  it("issues a different id and token for every booking", async () => {
    const a = await (await post(valid())).json();
    const b = await (await post(valid())).json();
    expect(a.bookingId).not.toBe(b.bookingId);
    expect(a.payToken).not.toBe(b.payToken);
  });

  it("rejects a client-chosen bookingId (strict schema) and creates nothing", async () => {
    const files = orderFiles().length;
    const res = await post(valid({ bookingId: "RV-2026-12345" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("invalid");
    expect(orderFiles()).toHaveLength(files);
  });

  it("rejects the legacy USD field", async () => {
    const { totalUzs, ...rest } = valid();
    const res = await post({ ...rest, totalUsd: Math.round(totalUzs / 12650) });
    expect(res.status).toBe(400);
  });

  it("recomputes the total from tour data: a tampered amount is 400 on totalUzs", async () => {
    const files = orderFiles().length;
    const res = await post(valid({ totalUzs: 1000 }));
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: "invalid", fields: { totalUzs: "total mismatch" } });
    expect(orderFiles()).toHaveLength(files);
  });

  it("rejects unknown departures, sold-out dates, too many travellers and a traveller count mismatch", async () => {
    expect((await post(valid({ departureId: "2027-07-11" }))).status).toBe(400);
    // 2026-11-10 Gruziya — 0 o'rin
    expect(
      (await post(valid({ slug: "georgia-batumi-tbilisi", departureId: "2026-11-10", totalUzs: bookingTotal(13_920_000, 2, 1) })))
        .status,
    ).toBe(400);
    expect((await post(valid({ travelers: ["ONE PERSON"] }))).status).toBe(400);
    expect((await post(valid({ totalUzs: 10_000_000_001 }))).status).toBe(400);
    expect((await post(valid({ totalUzs: 34_100_000.5 }))).status).toBe(400);
  });

  it("honeypot: answers a silent ok without creating a booking", async () => {
    const files = orderFiles().length;
    const res = await post({ ...valid(), website: "http://spam.example" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(orderFiles()).toHaveLength(files);
  });

  it("rejects a cross-origin browser request (403) and malformed JSON (400)", async () => {
    expect((await post(valid(), { origin: "https://evil.example" })).status).toBe(403);
    expect((await post("{not json")).status).toBe(400);
    expect((await post("[1,2]")).status).toBe(400);
  });

  it("rate-limits per IP: the 6th booking in 10 minutes is 429, another IP is unaffected", async () => {
    const ip = "203.0.113.77";
    for (let i = 0; i < 5; i++) expect((await post(valid({ totalUzs: 1 }), { "x-real-ip": ip })).status).toBe(400);
    const limited = await post(valid(), { "x-real-ip": ip });
    expect(limited.status).toBe(429);
    expect(limited.headers.get("retry-after")).toBe("600");
    expect((await post(valid(), { "x-real-ip": "203.0.113.78" })).status).toBe(200);
  });

  describe("when the order store cannot be written", () => {
    afterEach(() => chmodSync(ORDERS, 0o700));

    // root uchun chmod to'siq emas — root ostida o'tkazib yuboriladi
    it.skipIf(process.getuid?.() === 0)("answers 503 and does not record a lead for a booking that does not exist", async () => {
      mkdirSync(ORDERS, { recursive: true });
      chmodSync(ORDERS, 0o500); // o'qish mumkin, yozish yo'q → createOrder xato tashlaydi
      const leads = leadLines().length;
      const res = await post(valid());
      expect(res.status).toBe(503);
      expect(await res.json()).toEqual({ error: "unavailable" });
      expect(leadLines()).toHaveLength(leads);
    });
  });
});

describe("GET /api/payment/[id]", () => {
  const get = (id: string, k?: string) =>
    paymentStatus(new Request(`http://localhost/api/payment/${id}${k === undefined ? "" : `?k=${encodeURIComponent(k)}`}`), {
      params: Promise.resolve({ id }),
    });

  it("returns the status only with the right pay token; otherwise the same 404 as an unknown id", async () => {
    const { bookingId, payToken } = await (await post(valid())).json();
    const ok = await get(bookingId, payToken);
    expect(ok.status).toBe(200);
    expect(ok.headers.get("cache-control")).toBe("no-store");
    expect(await ok.json()).toEqual({ status: "awaiting", paidAt: null });

    const unknown = await (await get("RV-2026-00000", payToken)).json();
    for (const k of [undefined, "", payToken.slice(0, -1), payToken.slice(0, -1) + (payToken.endsWith("A") ? "B" : "A"), payToken + "x"]) {
      const res = await get(bookingId, k);
      expect(res.status).toBe(404);
      expect(await res.json()).toEqual(unknown);
    }
    expect((await get("../../etc/passwd", payToken)).status).toBe(404);
  });

  it("answers 503 when an order file is corrupt", async () => {
    const { bookingId, payToken } = await (await post(valid())).json();
    writeFileSync(join(ORDERS, `${bookingId}.json`), "{broken");
    expect((await get(bookingId, payToken)).status).toBe(503);
  });
});
