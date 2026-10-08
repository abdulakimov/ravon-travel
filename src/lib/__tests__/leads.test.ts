import { describe, expect, it } from "vitest";
import { ipBucket, rateLimited } from "../leads";

describe("rate limiting", () => {
  it("allows 5 requests per window and blocks the 6th", () => {
    const now = 1_000_000;
    for (let i = 0; i < 5; i++) expect(rateLimited("t1", now + i)).toBe(false);
    expect(rateLimited("t1", now + 10)).toBe(true);
    expect(rateLimited("other", now + 10)).toBe(false);
  });

  it("frees the bucket after the window passes", () => {
    const now = 5_000_000;
    for (let i = 0; i < 5; i++) rateLimited("t2", now);
    expect(rateLimited("t2", now + 1)).toBe(true);
    expect(rateLimited("t2", now + 10 * 60 * 1000 + 1)).toBe(false);
  });

  it("buckets IPv6 by /64 and leaves IPv4 intact", () => {
    expect(ipBucket("2001:DB8:1:2:aaaa:bbbb:cccc:dddd")).toBe("2001:db8:1:2");
    expect(ipBucket("2001:db8:1:2::1")).toBe(ipBucket("2001:db8:1:2:ffff::9"));
    expect(ipBucket("203.0.113.7")).toBe("203.0.113.7");
  });
});

describe("telegramText", () => {
  it("renders a readable message and skips empty fields and consent", async () => {
    const { telegramText } = await import("../leads");
    const text = telegramText("booking", {
      bookingId: "RV-2026-00042",
      travelers: ["ALI VALIYEV", "VALI ALIYEV"],
      phone: "+998 90 123 45 67",
      email: "",
      totalUsd: 1440,
      consent: true,
    });
    expect(text).toContain("Yangi bron");
    expect(text).toContain("bookingId: RV-2026-00042");
    expect(text).toContain("travelers: ALI VALIYEV, VALI ALIYEV");
    expect(text).not.toContain("email");
    expect(text).not.toContain("consent");
  });

  it("stays under the Telegram message limit", async () => {
    const { telegramText } = await import("../leads");
    expect(telegramText("contact", { message: "x".repeat(10_000) }).length).toBeLessThanOrEqual(3900);
  });
});
