import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

// Kontent ombori: seed fallback, buzilgan fayl, kesh izchilligi, nusxa xavfsizligi, parallel yozuvlar.
// Yo'llar modul yuklanganda o'qiladi — env avval, import keyin.
const dir = mkdtempSync(join(tmpdir(), "ravon-content-store-test-"));
const CONTENT_DIR = join(dir, "content"); // hali mavjud emas — seed fallback
process.env.CONTENT_DIR = CONTENT_DIR;

let content: typeof import("../content");
let fsdb: typeof import("../fsdb");
beforeAll(async () => {
  content = await import("../content");
  fsdb = await import("../fsdb");
});

const SLUG = "azerbaijan-7-wonders";
const DEP = "2026-11-26";
const seatsOf = async (slug = SLUG, dep = DEP) =>
  (await content.getTourRecords()).find((t) => t.slug === slug)!.departures.find((d) => d.id === dep)!.seatsLeft;

describe("seed fallback", () => {
  it("serves the seed when the content directory does not exist, without creating files", async () => {
    expect(existsSync(CONTENT_DIR)).toBe(false);
    expect((await content.getTourRecords()).length).toBeGreaterThan(0);
    expect((await content.getPosts()).length).toBeGreaterThan(0);
    expect((await content.getFaq()).length).toBeGreaterThan(0);
    expect((await content.getSettings()).email).toMatch(/@/);
    expect((await content.getTaxonomy()).countryIds.length).toBeGreaterThan(0);
    expect(existsSync(CONTENT_DIR)).toBe(false);
  });
});

describe("copy safety", () => {
  it("mutating a readDocCopy result never leaks into the store", async () => {
    const copy = await content.readDocCopy("tours");
    copy.tours[0].title.uz = "BUZILDI";
    copy.tours[0].departures.length = 0;
    copy.tours.length = 0;
    const fresh = await content.getTourRecords();
    expect(fresh.length).toBeGreaterThan(0);
    expect(fresh.every((t) => t.title.uz !== "BUZILDI")).toBe(true);
  });

  it("a mutate that changes the draft and then throws leaves the in-memory store untouched", async () => {
    const before = await seatsOf();
    await expect(
      content.updateDoc("tours", (doc) => {
        doc.tours.find((t) => t.slug === SLUG)!.departures.find((d) => d.id === DEP)!.seatsLeft = 999;
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");
    expect(await seatsOf()).toBe(before);
    expect(existsSync(join(CONTENT_DIR, "tours.json"))).toBe(false);
  });

  it("getTourRecords returns a fresh array (sorting it does not reorder the store)", async () => {
    const a = await content.getTourRecords();
    a.reverse();
    const b = await content.getTourRecords();
    expect(b.map((t) => t.rank)).toEqual([...b.map((t) => t.rank)].sort((x, y) => x - y));
  });
});

describe("writes", () => {
  it("updateDoc returns the mutate result and persists the change", async () => {
    const res = await content.updateDoc("faq", (doc) => {
      doc.items[0].question.uz = "Yangi savol?";
      return doc.items.length;
    });
    expect(res).toBeGreaterThan(0);
    expect((await content.getFaq())[0].question.uz).toBe("Yangi savol?");
    expect(JSON.parse(readFileSync(join(CONTENT_DIR, "faq.json"), "utf8")).items[0].question.uz).toBe("Yangi savol?");
  });

  it("25 concurrent seat decrements are all applied exactly once", async () => {
    await content.adjustSeats(SLUG, DEP, 100);
    const before = await seatsOf();
    const results = await Promise.all(Array.from({ length: 25 }, () => content.adjustSeats(SLUG, DEP, -1)));
    expect(await seatsOf()).toBe(before - 25);
    // Har bir chaqiruv o'z qadamidagi qoldiqni ko'radi (ketma-ket bajarilgan)
    expect(new Set(results).size).toBe(25);
    await content.adjustSeats(SLUG, DEP, 25 - 100);
    expect(await seatsOf()).toBe(before - 100);
  });

  it("concurrent updates to different documents do not clobber each other", async () => {
    await Promise.all([
      content.updateDoc("settings", (s) => {
        s.licenseNo = "T-001";
      }),
      content.adjustSeats(SLUG, DEP, -1),
      content.updateDoc("settings", (s) => {
        s.stir = "123456789";
      }),
    ]);
    const s = await content.getSettings();
    expect(s.licenseNo).toBe("T-001");
    expect(s.stir).toBe("123456789");
    await content.adjustSeats(SLUG, DEP, 1);
  });

  it("an external edit of the file is picked up on the next read (cache keyed on mtime+size)", async () => {
    const file = join(CONTENT_DIR, "settings.json");
    const doc = JSON.parse(readFileSync(file, "utf8"));
    doc.licenseNo = "EXTERNAL-EDIT-123";
    writeFileSync(file, JSON.stringify(doc));
    expect((await content.getSettings()).licenseNo).toBe("EXTERNAL-EDIT-123");
  });

  it("the queue keeps working after a failed task", async () => {
    await expect(fsdb.withDataLock(async () => Promise.reject(new Error("x")))).rejects.toThrow("x");
    expect(await fsdb.withDataLock(async () => 42)).toBe(42);
  });
});

describe("unpublished tours", () => {
  it("are hidden from the site lists but still resolvable for existing orders", async () => {
    await content.updateDoc("tours", (doc) => {
      doc.tours.find((t) => t.slug === "dubai")!.published = false;
    });
    expect((await content.liveToursByRank("2026-10-08")).some((t) => t.slug === "dubai")).toBe(false);
    expect(await content.getTour("dubai", "2026-10-08")).toBeUndefined();
    expect((await content.toursInCountry("ae")).some((t) => t.slug === "dubai")).toBe(false);
    expect((await content.similarTours((await content.getTourAnyState("dubai"))!, 10)).some((t) => t.slug === "dubai")).toBe(false);
    const any = await content.getTourAnyState("dubai");
    expect(any).toBeDefined();
    // Saytga chiqadigan obyektda admin maydonlari yo'q
    expect(any).not.toHaveProperty("published");
    expect(any).not.toHaveProperty("detail");
    await content.updateDoc("tours", (doc) => {
      doc.tours.find((t) => t.slug === "dubai")!.published = true;
    });
  });

  it("unpublished blog posts are hidden and admin fields are stripped", async () => {
    const [first] = await content.getPostRecords();
    await content.updateDoc("posts", (doc) => {
      doc.posts.find((p) => p.slug === first.slug)!.published = false;
    });
    expect(await content.getPost(first.slug)).toBeUndefined();
    expect((await content.getPosts()).every((p) => !("published" in p))).toBe(true);
    await content.updateDoc("posts", (doc) => {
      doc.posts.find((p) => p.slug === first.slug)!.published = true;
    });
  });
});

describe("corrupt content file", () => {
  it("reads fall back to the seed instead of crashing", async () => {
    writeFileSync(join(CONTENT_DIR, "taxonomy.json"), "{ broken");
    expect((await content.getTaxonomy()).countryIds.length).toBeGreaterThan(0);
  });

  it("site reads serve the last good copy (not the seed) once a file goes bad", async () => {
    await content.updateDoc("tours", (doc) => {
      doc.tours.find((t) => t.slug === "dubai")!.title.uz = "Admin tahriri";
    });
    expect((await content.getTourAnyState("dubai"))!.title.uz).toBe("Admin tahriri");
    writeFileSync(join(CONTENT_DIR, "tours.json"), "{ broken");
    expect((await content.getTourAnyState("dubai"))!.title.uz).toBe("Admin tahriri");
  });

  // Regressiya: avval updateDoc buzilgan faylni seed + o'zgarish bilan ustidan yozardi (Click to'lovidan keyingi
  // o'rin yangilanishi admin tahrirlarini o'chirib yuborardi).
  it("updateDoc refuses to overwrite an unreadable file with the seed", async () => {
    const file = join(CONTENT_DIR, "tours.json");
    writeFileSync(file, '{ "tours": [ { "id": "admin-edited"');
    await expect(content.adjustSeats(SLUG, DEP, -1)).rejects.toThrow();
    await expect(content.updateDoc("tours", () => undefined)).rejects.toThrow();
    expect(readFileSync(file, "utf8")).toBe('{ "tours": [ { "id": "admin-edited"');
    // Qolgan hujjatlar ishlashda davom etadi
    await content.updateDoc("faq", () => undefined);
  });
});
