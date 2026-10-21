import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

const dir = mkdtempSync(join(tmpdir(), "ravon-admin-test-"));
process.env.ADMIN_DIR = join(dir, "admin");
process.env.CONTENT_DIR = join(dir, "content");
process.env.ORDERS_DIR = join(dir, "orders");
process.env.LEADS_FILE = join(dir, "leads.ndjson");
process.env.ADMIN_INITIAL_PASSWORD = "Initial-pass-2026";

const session = await import("../admin/session");
const users = await import("../admin/users");
const { isAdminHost } = await import("../admin/guard");
const leadsAdmin = await import("../admin/leads-admin");
const ordersAdmin = await import("../admin/orders-admin");
const orders = await import("../orders");
const content = await import("../content");

describe("session cookie", () => {
  it("round-trips and rejects tampering and expiry", () => {
    const raw = session.encodeSession({ uid: "u1", ver: 3, exp: Date.now() + 60_000 });
    expect(session.decodeSession(raw)).toMatchObject({ uid: "u1", ver: 3 });
    const [body, mac] = raw.split(".");
    const forged = Buffer.from(JSON.stringify({ uid: "owner", ver: 3, exp: Date.now() + 60_000 })).toString("base64url");
    expect(session.decodeSession(`${forged}.${mac}`)).toBeNull();
    expect(session.decodeSession(`${body}.${mac.slice(0, -2)}xx`)).toBeNull();
    expect(session.decodeSession(session.encodeSession({ uid: "u1", ver: 3, exp: Date.now() - 1 }))).toBeNull();
    expect(session.decodeSession(undefined)).toBeNull();
    expect(session.decodeSession("x".repeat(600))).toBeNull();
  });
});

describe("passwords", () => {
  it("hashes with a random salt and verifies", async () => {
    const a = await users.hashPassword("Secret-pass-1");
    const b = await users.hashPassword("Secret-pass-1");
    expect(a).not.toBe(b);
    expect(await users.verifyPassword("Secret-pass-1", a)).toBe(true);
    expect(await users.verifyPassword("secret-pass-1", a)).toBe(false);
    expect(await users.verifyPassword("x", "garbage")).toBe(false);
  });

  it("enforces a minimal policy", () => {
    expect(users.passwordProblem("short1")).not.toBeNull();
    expect(users.passwordProblem("onlyletterslong")).not.toBeNull();
    expect(users.passwordProblem("1234567890123")).not.toBeNull();
    expect(users.passwordProblem("Yaxshi-parol-7")).toBeNull();
  });
});

describe("admin host", () => {
  it("only admin.* hosts open the panel", () => {
    expect(isAdminHost("admin.ravontravel.uz")).toBe(true);
    expect(isAdminHost("admin.localhost:3100")).toBe(true);
    expect(isAdminHost("ravontravel.uz")).toBe(false);
    expect(isAdminHost("www.ravontravel.uz")).toBe(false);
    expect(isAdminHost("evil-admin.example.com")).toBe(false);
    expect(isAdminHost(null)).toBe(false);
  });
});

describe("users", () => {
  beforeAll(async () => {
    await users.listUsers();
  });

  it("bootstraps a single owner from ADMIN_INITIAL_PASSWORD who must change it", async () => {
    const list = await users.listUsers();
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ username: "admin", role: "owner", mustChangePassword: true, disabled: false });
    expect(await users.verifyPassword("Initial-pass-2026", list[0].passwordHash)).toBe(true);
    // Fayl bor — env qayta ishlatilmaydi
    expect(await users.listUsers()).toHaveLength(1);
  });

  it("never leaves the panel without an active owner", async () => {
    await expect(
      users.updateUsers((list) => {
        list[0].disabled = true;
      }),
    ).rejects.toThrow();
    expect((await users.listUsers())[0].disabled).toBe(false);
  });

  it("the stored file never contains the plain password", () => {
    expect(readFileSync(join(process.env.ADMIN_DIR!, "users.json"), "utf8")).not.toContain("Initial-pass-2026");
  });
});

describe("leads admin", () => {
  it("gives stable ids and keeps state outside the append-only file", async () => {
    const lines = [
      { kind: "contact", receivedAt: "2026-10-20T10:00:00.000Z", data: { name: "A", phone: "+998901112233", message: "Salom" } },
      { kind: "payment", receivedAt: "2026-10-20T11:00:00.000Z", data: { bookingId: "RV-2026-00001" } },
    ];
    writeFileSync(process.env.LEADS_FILE!, lines.map((l) => JSON.stringify(l)).join("\n") + "\n{broken\n");
    const first = await leadsAdmin.listLeads();
    expect(first.map((l) => l.kind)).toEqual(["payment", "contact"]); // yangisi birinchi, buzilgan qator tashlandi
    expect(first.find((l) => l.kind === "payment")!.state).toBe("done");
    const contact = first.find((l) => l.kind === "contact")!;
    expect(contact.state).toBe("new");
    await leadsAdmin.setLeadState(contact.id, "in_progress", "qo'ng'iroq qilindi", "admin");
    const again = (await leadsAdmin.listLeads()).find((l) => l.id === contact.id)!;
    expect(again).toMatchObject({ state: "in_progress", note: "qo'ng'iroq qilindi", updatedBy: "admin" });
    await expect(leadsAdmin.setLeadState("../../etc", "done", undefined, "admin")).rejects.toThrow();
  });
});

describe("orders admin", () => {
  it("cancels only unpaid orders and refunds only paid ones, restoring seats", async () => {
    const slug = "azerbaijan-7-wonders";
    const depId = "2026-11-26";
    const seats = async () =>
      (await content.getTourRecords()).find((t) => t.slug === slug)!.departures.find((d) => d.id === depId)!.seatsLeft;
    const before = await seats();
    const a = await orders.createOrder({ tourSlug: slug, departureId: depId, adults: 2, children: 0, locale: "uz", amountUzs: 1 });
    await expect(ordersAdmin.markRefunded(a.id, "admin")).rejects.toThrow();
    await ordersAdmin.cancelOrder(a.id, "admin");
    expect((await orders.readOrder(a.id))!.status).toBe("cancelled");
    await expect(ordersAdmin.cancelOrder(a.id, "admin")).rejects.toThrow();

    const b = await orders.createOrder({ tourSlug: slug, departureId: depId, adults: 1, children: 1, locale: "uz", amountUzs: 1 });
    await orders.withOrdersLock(async () => {
      const o = (await orders.readOrder(b.id))!;
      o.status = "paid";
      await orders.saveOrder(o);
    });
    await content.adjustSeats(slug, depId, -2); // to'lovda kamaygan
    expect(await seats()).toBe(before - 2);
    await ordersAdmin.markRefunded(b.id, "admin");
    expect((await orders.readOrder(b.id))!.status).toBe("refunded");
    expect(await seats()).toBe(before);
    expect((await ordersAdmin.listOrders()).map((o) => o.id)).toEqual(expect.arrayContaining([a.id, b.id]));
  });

  it("seat adjustments never go below zero", async () => {
    expect(await content.adjustSeats("azerbaijan-7-wonders", "2026-11-09", -100)).toBe(0);
    expect(await content.adjustSeats("nope", "2026-11-09", -1)).toBeNull();
  });
});
