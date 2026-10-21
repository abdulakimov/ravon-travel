import { mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeAll, describe, expect, it, vi } from "vitest";

// Admin kirish chegarasi: guard.currentUser (host + imzolangan cookie + versiya + bloklangan), egasi himoyasi,
// login rate-limit, bronlar admin amallarining chegaraviy holatlari.
const req = vi.hoisted(() => ({ host: "admin.ravontravel.uz" as string | null, cookie: undefined as string | undefined }));
vi.mock("next/headers", () => ({
  headers: async () => new Headers(req.host ? { host: req.host } : {}),
  cookies: async () => ({ get: () => (req.cookie === undefined ? undefined : { value: req.cookie }) }),
}));

const dir = mkdtempSync(join(tmpdir(), "ravon-admin-auth-test-"));
process.env.ADMIN_DIR = join(dir, "admin");
process.env.CONTENT_DIR = join(dir, "content");
process.env.ORDERS_DIR = join(dir, "orders");
process.env.LEADS_FILE = join(dir, "leads.ndjson");
process.env.ADMIN_INITIAL_PASSWORD = "Initial-pass-2026";

const session = await import("../admin/session");
const users = await import("../admin/users");
const guard = await import("../admin/guard");
const rl = await import("../admin/ratelimit");
const { UserError } = await import("../admin/errors");
const orders = await import("../orders");
const ordersAdmin = await import("../admin/orders-admin");
const leadsAdmin = await import("../admin/leads-admin");

let owner: import("../admin/users").AdminUser;
const login = (u: { id: string; sessionVersion: number }, exp = Date.now() + 60_000) => {
  req.cookie = session.encodeSession({ uid: u.id, ver: u.sessionVersion, exp });
};
const fresh = async (id: string) => (await users.findUser(id))!;

async function addUser(username: string, role: import("../admin/users").Role) {
  const id = `id-${username}`;
  await users.updateUsers((list) => {
    list.push({
      id,
      username,
      name: username,
      role,
      passwordHash: "x",
      sessionVersion: 1,
      mustChangePassword: false,
      disabled: false,
      createdAt: Date.now(),
    });
  });
  return fresh(id);
}

beforeAll(async () => {
  [owner] = await users.listUsers();
});

describe("guard.currentUser", () => {
  it("accepts a valid cookie on the admin host", async () => {
    req.host = "admin.ravontravel.uz";
    login(owner);
    expect((await guard.currentUser())?.id).toBe(owner.id);
  });

  it("returns null on the public host, without a cookie, with an expired or forged cookie", async () => {
    login(owner);
    req.host = "ravontravel.uz";
    expect(await guard.currentUser()).toBeNull();
    req.host = null;
    expect(await guard.currentUser()).toBeNull();
    req.host = "admin.ravontravel.uz";
    req.cookie = undefined;
    expect(await guard.currentUser()).toBeNull();
    login(owner, Date.now() - 1);
    expect(await guard.currentUser()).toBeNull();
    req.cookie = "garbage.value";
    expect(await guard.currentUser()).toBeNull();
    login({ id: "no-such-user", sessionVersion: 1 });
    expect(await guard.currentUser()).toBeNull();
  });

  it("a sessionVersion bump (logout / password reset) invalidates existing cookies", async () => {
    const m = await addUser("menejer1", "manager");
    login(m);
    expect((await guard.currentUser())?.id).toBe(m.id);
    await users.updateUsers((list) => {
      list.find((u) => u.id === m.id)!.sessionVersion += 1;
    });
    expect(await guard.currentUser()).toBeNull();
    login(await fresh(m.id));
    expect((await guard.currentUser())?.id).toBe(m.id);
  });

  it("a disabled user is locked out even with a current-version cookie", async () => {
    const m = await addUser("menejer2", "manager");
    login(m);
    await users.updateUsers((list) => {
      list.find((u) => u.id === m.id)!.disabled = true;
    });
    expect(await guard.currentUser()).toBeNull();
  });

  it("requireAction enforces roles and the forced password change", async () => {
    const m = await addUser("menejer3", "manager");
    login(m);
    await expect(guard.requireAction("manager")).resolves.toMatchObject({ id: m.id });
    await expect(guard.requireAction("admin")).rejects.toBeInstanceOf(guard.AdminAuthError);
    login(owner); // bootstrap egasi: mustChangePassword = true
    await expect(guard.requireAction("manager")).rejects.toThrow(/parol/i);
    await expect(guard.requireAction("owner", { allowMustChange: true })).resolves.toMatchObject({ id: owner.id });
    req.cookie = undefined;
    await expect(guard.requireAction()).rejects.toBeInstanceOf(guard.AdminAuthError);
  });
});

describe("session decoding edge cases", () => {
  it("rejects payloads with the wrong field types even when correctly signed", () => {
    // encodeSession tipni tekshirmaydi — imzolangan, lekin noto'g'ri shakl
    const bad = session.encodeSession({ uid: 1, ver: "1", exp: Date.now() + 1000 } as unknown as import("../admin/session").SessionPayload);
    expect(session.decodeSession(bad)).toBeNull();
    const noExp = session.encodeSession({ uid: "u", ver: 1 } as unknown as import("../admin/session").SessionPayload);
    expect(session.decodeSession(noExp)).toBeNull();
  });

  it("expiry is exclusive at exactly `exp`", () => {
    const exp = 1_000_000;
    const raw = session.encodeSession({ uid: "u", ver: 1, exp });
    expect(session.decodeSession(raw, exp - 1)).not.toBeNull();
    expect(session.decodeSession(raw, exp)).toBeNull();
  });
});

describe("last active owner", () => {
  it("cannot be demoted, disabled or deleted while alone; can once a second owner exists", async () => {
    await expect(
      users.updateUsers((list) => {
        list.find((u) => u.id === owner.id)!.role = "admin";
      }),
    ).rejects.toThrow();
    await expect(
      users.updateUsers((list) => {
        list.splice(list.findIndex((u) => u.id === owner.id), 1);
      }),
    ).rejects.toThrow();
    expect((await fresh(owner.id)).role).toBe("owner");

    // Bloklangan egasi "faol egasi" hisoblanmaydi
    const second = await addUser("ikkinchi", "owner");
    await expect(
      users.updateUsers((list) => {
        list.find((u) => u.id === second.id)!.disabled = true;
        list.find((u) => u.id === owner.id)!.disabled = true;
      }),
    ).rejects.toThrow();

    await users.updateUsers((list) => {
      list.find((u) => u.id === second.id)!.role = "admin";
    });
    expect((await fresh(second.id)).role).toBe("admin");
  });

  // BUG (users.ts updateUsers): oddiy Error tashlanadi → failure() uni "Kutilmagan xato" deb ko'rsatadi,
  // egasi esa nima uchun rad etilganini bilmaydi. UserError bo'lishi kerak.
  it("rejection is a user-facing UserError (shown with its message in the admin form)", async () => {
    await expect(
      users.updateUsers((list) => {
        list.find((u) => u.id === owner.id)!.role = "manager";
      }),
    ).rejects.toBeInstanceOf(UserError);
  });
});

describe("login rate limit", () => {
  // Kalitlar login action'dagidek: `ip:<ip>` (30) va `iu:<ip>:<login>` (8).
  const t0 = 1_700_000_000_000;

  it("blocks an ip+login pair after 8 failures, other logins from that IP still allowed", () => {
    const keys = ["ip:203.0.113.9", "iu:203.0.113.9:admin"];
    for (let i = 0; i < 7; i++) rl.recordLoginFailure(keys, t0 + i);
    expect(rl.loginBlocked(keys, t0 + 10)).toBe(false);
    rl.recordLoginFailure(keys, t0 + 8);
    expect(rl.loginBlocked(keys, t0 + 10)).toBe(true);
    expect(rl.loginBlocked(["ip:203.0.113.9", "iu:203.0.113.9:boshqa"], t0 + 10)).toBe(false);
    // Boshqa IP'dan o'sha login bloklanmagan (begona odam egasini bloklab qo'ya olmaydi)
    expect(rl.loginBlocked(["ip:198.51.100.1", "iu:198.51.100.1:admin"], t0 + 10)).toBe(false);
    // 15 daqiqadan keyin ochiladi
    expect(rl.loginBlocked(keys, t0 + 8 + 15 * 60 * 1000)).toBe(false);
  });

  it("blocks a whole IP after 30 failures across different logins", () => {
    for (let i = 0; i < 30; i++) rl.recordLoginFailure(["ip:192.0.2.7", `iu:192.0.2.7:u${i}`], t0 + i);
    expect(rl.loginBlocked(["ip:192.0.2.7", "iu:192.0.2.7:yangi"], t0 + 40)).toBe(true);
  });

  it("a successful login clears the ip+login counter and refunds one ip attempt", () => {
    const keys = ["ip:203.0.113.50", "iu:203.0.113.50:admin"];
    for (let i = 0; i < 8; i++) rl.recordLoginFailure(keys, t0 + i);
    expect(rl.loginBlocked(keys, t0 + 10)).toBe(true);
    rl.clearLoginFailures(keys);
    expect(rl.loginBlocked(keys, t0 + 10)).toBe(false);
    // ip hisoblagichidan faqat oxirgi (shu muvaffaqiyatli) urinish olib tashlanadi
    for (let i = 0; i < 23; i++) rl.recordLoginFailure(["ip:203.0.113.50"], t0 + 20 + i);
    expect(rl.loginBlocked(["ip:203.0.113.50"], t0 + 50)).toBe(true); // 7 + 23 = 30
  });

  it("withPasswordSlot allows at most 2 concurrent checks", async () => {
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    const a = rl.withPasswordSlot(() => gate.then(() => "a"));
    const b = rl.withPasswordSlot(() => gate.then(() => "b"));
    expect(await rl.withPasswordSlot(async () => "c")).toBe("busy");
    release();
    expect([await a, await b]).toEqual(["a", "b"]);
    expect(await rl.withPasswordSlot(async () => "d")).toBe("d");
  });
});

describe("orders admin edge cases", () => {
  const SLUG = "azerbaijan-7-wonders";
  const newOrder = () => orders.createOrder({ tourSlug: SLUG, departureId: "2026-11-26", adults: 1, children: 0, locale: "uz", amountUzs: 1 });

  it("listOrders skips corrupt and foreign files instead of failing the whole page", async () => {
    const ok = await newOrder();
    mkdirSync(process.env.ORDERS_DIR!, { recursive: true });
    writeFileSync(join(process.env.ORDERS_DIR!, "RV-2026-99999.json"), "{ broken");
    writeFileSync(join(process.env.ORDERS_DIR!, "notes.json"), "{}");
    const list = await ordersAdmin.listOrders();
    expect(list.map((o) => o.id)).toContain(ok.id);
    expect(list.map((o) => o.id)).not.toContain("RV-2026-99999");
    expect(list.every((o) => /^RV-/.test(o.id))).toBe(true);
  });

  it("setNote trims, caps at 2000 chars and clears on whitespace", async () => {
    const o = await newOrder();
    expect((await ordersAdmin.setNote(o.id, "  qo'ng'iroq  ")).adminNote).toBe("qo'ng'iroq");
    expect((await ordersAdmin.setNote(o.id, "x".repeat(3000))).adminNote).toHaveLength(2000);
    expect((await ordersAdmin.setNote(o.id, "   ")).adminNote).toBeUndefined();
    expect((await orders.readOrder(o.id))!.adminNote).toBeUndefined();
  });

  it("actions on an unknown or malformed id fail with a user-facing error", async () => {
    await expect(ordersAdmin.setHandled("RV-2026-00000", true)).rejects.toBeInstanceOf(ordersAdmin.OrderActionError);
    await expect(ordersAdmin.cancelOrder("../../etc/passwd", "admin")).rejects.toBeInstanceOf(ordersAdmin.OrderActionError);
  });

  it("a cancelled order cannot be refunded and a refunded one cannot be cancelled", async () => {
    const a = await newOrder();
    await ordersAdmin.cancelOrder(a.id, "admin");
    await expect(ordersAdmin.markRefunded(a.id, "admin")).rejects.toBeInstanceOf(ordersAdmin.OrderActionError);
    const stored = (await orders.readOrder(a.id))!;
    expect(stored).toMatchObject({ status: "cancelled", closedBy: "admin" });
    expect(typeof stored.closedAt).toBe("number");
  });
});

describe("leads admin edge cases", () => {
  it("ids are stable across appends and states survive new leads", async () => {
    const line = (i: number) => JSON.stringify({ kind: "contact", receivedAt: `2026-10-20T10:00:0${i}.000Z`, data: { name: `N${i}` } });
    writeFileSync(process.env.LEADS_FILE!, `${line(1)}\n${line(2)}\n`);
    const first = await leadsAdmin.listLeads();
    const target = first.find((l) => l.data.name === "N1")!;
    await leadsAdmin.setLeadState(target.id, "spam", undefined, "admin");
    writeFileSync(process.env.LEADS_FILE!, `${line(1)}\n${line(2)}\n${line(3)}\n`);
    const again = await leadsAdmin.listLeads();
    expect(again.map((l) => l.data.name)).toEqual(["N3", "N2", "N1"]);
    expect(again.find((l) => l.id === target.id)).toMatchObject({ state: "spam", data: { name: "N1" } });
  });

  it("note handling: undefined keeps the old note, blank clears it", async () => {
    const [lead] = await leadsAdmin.listLeads();
    await leadsAdmin.setLeadState(lead.id, "in_progress", "birinchi", "admin");
    await leadsAdmin.setLeadState(lead.id, "done", undefined, "admin");
    expect((await leadsAdmin.listLeads()).find((l) => l.id === lead.id)).toMatchObject({ state: "done", note: "birinchi" });
    await leadsAdmin.setLeadState(lead.id, "done", "   ", "admin");
    expect((await leadsAdmin.listLeads()).find((l) => l.id === lead.id)!.note).toBeUndefined();
  });

  it("bookingLead finds the booking lead by its booking id", async () => {
    writeFileSync(
      process.env.LEADS_FILE!,
      JSON.stringify({ kind: "payment", receivedAt: "2026-10-20T10:00:00.000Z", data: { bookingId: "RV-2026-00042" } }) +
        "\n" +
        JSON.stringify({ kind: "booking", receivedAt: "2026-10-20T09:00:00.000Z", data: { bookingId: "RV-2026-00042", name: "Ali" } }) +
        "\n",
    );
    expect((await leadsAdmin.bookingLead("RV-2026-00042"))?.data.name).toBe("Ali");
    expect(await leadsAdmin.bookingLead("RV-2026-00043")).toBeUndefined();
  });
});
