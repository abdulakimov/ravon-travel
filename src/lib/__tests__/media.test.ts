import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { beforeAll, describe, expect, it } from "vitest";

// Rasm yuklash: qayta kodlash, o'lcham chegarasi, EXIF, noto'g'ri fayllar, /media yo'l tekshiruvi.
const dir = mkdtempSync(join(tmpdir(), "ravon-media-test-"));
const MEDIA_DIR = join(dir, "media");
process.env.MEDIA_DIR = MEDIA_DIR;

let media: typeof import("../media");
let WIDTHS: readonly number[];
beforeAll(async () => {
  media = await import("../media");
  WIDTHS = (await import("../image-widths")).IMAGE_WIDTHS;
});

const solid = (width: number, height: number, alpha = false) =>
  sharp({ create: { width, height, channels: alpha ? 4 : 3, background: alpha ? { r: 10, g: 120, b: 60, alpha: 0.5 } : "#2a7" } });

describe("saveUpload", () => {
  it("re-encodes a JPEG into a master + one WebP per width and records it in the index", async () => {
    const input = await solid(1000, 600).jpeg().toBuffer();
    const item = await media.saveUpload(input, "Boku <script>.jpg", "admin");
    expect(item.id).toMatch(media.MEDIA_ID_RE);
    expect(item.url).toBe(`/media/${item.id}.jpg`);
    expect(item).toMatchObject({ width: 1000, height: 600, by: "admin" });
    expect(item.name).not.toMatch(/[<>]/);
    expect(existsSync(join(MEDIA_DIR, `${item.id}.jpg`))).toBe(true);
    for (const w of WIDTHS) {
      const p = join(MEDIA_DIR, "opt", `${item.id}-${w}.webp`);
      expect(existsSync(p), p).toBe(true);
      const meta = await sharp(readFileSync(p)).metadata();
      expect(meta.format).toBe("webp");
      expect(meta.width).toBe(Math.min(w, 1000)); // kattalashtirilmaydi
    }
    expect((await media.listMedia()).map((m) => m.id)).toContain(item.id);
  });

  it("accepts PNG with alpha and flattens the JPEG master", async () => {
    const item = await media.saveUpload(await solid(300, 300, true).png().toBuffer(), "logo.png", "admin");
    const meta = await sharp(readFileSync(join(MEDIA_DIR, `${item.id}.jpg`))).metadata();
    expect(meta.format).toBe("jpeg");
    expect(meta.hasAlpha).toBe(false);
  });

  it("caps the master at 2400px on the long edge", async () => {
    const item = await media.saveUpload(await solid(3600, 1800).jpeg().toBuffer(), "wide.jpg", "admin");
    expect(item.width).toBe(2400);
    expect(item.height).toBe(1200);
  });

  it("applies EXIF orientation and strips metadata", async () => {
    const input = await solid(400, 200).jpeg().withMetadata({ orientation: 6 }).toBuffer();
    const item = await media.saveUpload(input, "phone.jpg", "admin");
    expect([item.width, item.height]).toEqual([200, 400]);
    const meta = await sharp(readFileSync(join(MEDIA_DIR, `${item.id}.jpg`))).metadata();
    expect(meta.exif).toBeUndefined();
    expect(meta.orientation).toBeUndefined();
  });

  it("rejects empty, oversize, non-image, SVG and GIF uploads with a user-facing MediaError", async () => {
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><script>alert(1)</script></svg>');
    const gif = await solid(10, 10).gif().toBuffer();
    const cases: [string, Buffer][] = [
      ["empty", Buffer.alloc(0)],
      ["oversize", Buffer.alloc(media.MAX_UPLOAD_BYTES + 1)],
      ["text", Buffer.from("<html><body>hi</body></html>")],
      ["svg", svg],
      ["gif", gif],
    ];
    for (const [name, buf] of cases) await expect(media.saveUpload(buf, `${name}.jpg`, "admin"), name).rejects.toBeInstanceOf(media.MediaError);
  });

  it("never leaves a file behind for a rejected upload", async () => {
    const before = (await media.listMedia()).length;
    await expect(media.saveUpload(Buffer.from("nope"), "x.jpg", "admin")).rejects.toThrow();
    expect((await media.listMedia()).length).toBe(before);
  });

  it("rejects an image over the 60 MP pixel limit with a MediaError (decompression-bomb guard)", async () => {
    const huge = await solid(10_000, 7_000).png({ compressionLevel: 9 }).toBuffer(); // 70 MP > 60 MP
    expect(huge.length).toBeLessThan(media.MAX_UPLOAD_BYTES);
    await expect(media.saveUpload(huge, "huge.png", "admin")).rejects.toBeInstanceOf(media.MediaError);
  });

  // BUG (media.ts saveUpload): kesilgan (truncated) JPEG — metadata() sarlavhani o'qiydi, keyingi dekodlash
  // "VipsJpeg: premature end of JPEG image" oddiy Error tashlaydi (try/catch faqat metadata() atrofida) →
  // /api/admin/media 500 "Yuklashda xato." qaytaradi, 400 + "Rasm o'qilmadi" emas.
  it("rejects a truncated JPEG with a MediaError", async () => {
    const full = await solid(800, 800).jpeg().toBuffer();
    await expect(media.saveUpload(full.subarray(0, Math.floor(full.length / 3)), "cut.jpg", "admin")).rejects.toBeInstanceOf(
      media.MediaError,
    );
  });

  it("a truncated JPEG at least leaves no files or index entry behind", async () => {
    const before = (await media.listMedia()).length;
    const full = await solid(800, 800).jpeg().toBuffer();
    await expect(media.saveUpload(full.subarray(0, Math.floor(full.length / 3)), "cut.jpg", "admin")).rejects.toThrow();
    expect((await media.listMedia()).length).toBe(before);
  });
});

describe("deleteMedia", () => {
  it("removes the master, all variants and the index entry; rejects bad ids", async () => {
    const item = await media.saveUpload(await solid(500, 500).jpeg().toBuffer(), "del.jpg", "admin");
    await media.deleteMedia(item.id);
    expect(existsSync(join(MEDIA_DIR, `${item.id}.jpg`))).toBe(false);
    for (const w of WIDTHS) expect(existsSync(join(MEDIA_DIR, "opt", `${item.id}-${w}.webp`))).toBe(false);
    expect((await media.listMedia()).some((m) => m.id === item.id)).toBe(false);
    await expect(media.deleteMedia("../index")).rejects.toBeInstanceOf(media.MediaError);
    await expect(media.deleteMedia("20261020-ABCDEF01")).rejects.toBeInstanceOf(media.MediaError);
  });
});

describe("readMediaFile", () => {
  it("serves only strictly named masters and variants", async () => {
    const item = await media.saveUpload(await solid(700, 400).jpeg().toBuffer(), "r.jpg", "admin");
    expect((await media.readMediaFile([`${item.id}.jpg`]))?.type).toBe("image/jpeg");
    expect((await media.readMediaFile(["opt", `${item.id}-640.webp`]))?.type).toBe("image/webp");
    expect(await media.readMediaFile(["opt", `${item.id}-999.webp`])).toBeNull(); // yo'q kenglik
    expect(await media.readMediaFile(["20000101-00000000.jpg"])).toBeNull(); // yo'q fayl
  });

  it("refuses traversal, the index file, extra segments and upper-case names", async () => {
    mkdirSync(MEDIA_DIR, { recursive: true });
    writeFileSync(join(dir, "secret.jpg"), "secret");
    for (const parts of [
      ["index.json"],
      ["..", "secret.jpg"],
      ["../secret.jpg"],
      ["opt", "..", "index.json"],
      ["opt", "20261020-abcdef01-640.webp", "x"],
      ["20261020-ABCDEF01.jpg"],
      ["20261020-abcdef01.JPG"],
      ["20261020-abcdef01.jpg%00"],
      ["x", "20261020-abcdef01.jpg"],
      [],
    ])
      expect(await media.readMediaFile(parts), parts.join("/")).toBeNull();
  });
});
