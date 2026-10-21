import { describe, expect, it } from "vitest";
import { departureSchema, imagePath, l10n, settingsSchema, slug, tourSchema } from "../admin/schemas";

// Admin formalarining server tekshiruvi — chegaraviy holatlar.

const L = (uz: string, ru = "", en = "") => ({ uz, ru, en });

const validTour = () => ({
  slug: "test-tour",
  country: "az",
  category: "excursion",
  days: 7,
  nights: 6,
  priceFromUzs: 10_000_000,
  fixedDeparture: true,
  top: false,
  rank: 5,
  image: "/img/baku.jpg",
  title: L("Sarlavha"),
  summary: L("Qisqa"),
  published: true,
  departures: [
    { from: "2099-01-10", to: "2099-01-16", seatsLeft: 5, priceUzs: 10_000_000 },
    { from: "2099-02-10", to: "2099-02-16", seatsLeft: 0, priceUzs: 11_000_000 },
  ],
  detail: {
    route: L("Boku"),
    groupSize: { min: 2, max: 20 },
    about: [],
    gallery: [],
    itinerary: [],
    included: [],
    excluded: [],
    notes: { visa: L(""), passport: L(""), cancellation: L("") },
  },
});

const validSettings = () => ({
  legalName: "",
  stir: "",
  postalAddress: "",
  phone: "",
  email: "info@ravontravel.uz",
  bankName: "",
  bankAccount: "",
  mfo: "",
  licenseNo: "",
  licenseDate: "",
  licenseAuthority: "",
  team: { director: "", manager: "", specialist: "", accountant: "" },
  social: { telegram: "", instagram: "", whatsapp: "" },
  mapEmbedUrl: "",
});

describe("l10n", () => {
  it("requires Uzbek (whitespace-only is empty) but allows empty RU/EN", () => {
    const s = l10n(10);
    expect(s.safeParse(L("   ")).success).toBe(false);
    expect(s.parse(L("  Salom ", "", ""))).toEqual(L("Salom"));
    expect(s.safeParse(L("x".repeat(11))).success).toBe(false);
    expect(l10n(10, false).safeParse(L("")).success).toBe(true);
  });
});

describe("slug", () => {
  it("accepts kebab-case only", () => {
    expect(slug.safeParse("baku-7").success).toBe(true);
    for (const bad of ["Baku", "baku--7", "-baku", "baku-", "b", "baku_7", "boku/../x", "bakú"])
      expect(slug.safeParse(bad).success, bad).toBe(false);
  });
});

describe("departureSchema", () => {
  const dep = (from: string, to: string) => ({ from, to, seatsLeft: 1, priceUzs: 1 });

  it("rejects a return before departure; same-day is allowed", () => {
    const r = departureSchema.safeParse(dep("2099-01-10", "2099-01-09"));
    expect(r.success).toBe(false);
    expect(r.error!.issues[0].path).toEqual(["to"]);
    expect(departureSchema.safeParse(dep("2099-01-10", "2099-01-10")).success).toBe(true);
  });

  it("rejects zero price, negative or fractional seats and malformed dates", () => {
    expect(departureSchema.safeParse({ ...dep("2099-01-10", "2099-01-12"), priceUzs: 0 }).success).toBe(false);
    expect(departureSchema.safeParse({ ...dep("2099-01-10", "2099-01-12"), seatsLeft: -1 }).success).toBe(false);
    expect(departureSchema.safeParse({ ...dep("2099-01-10", "2099-01-12"), seatsLeft: 1.5 }).success).toBe(false);
    expect(departureSchema.safeParse(dep("10.01.2099", "2099-01-12")).success).toBe(false);
  });

  // BUG: isoDate faqat shaklni tekshiradi — mavjud bo'lmagan sanalar o'tib ketadi.
  it("rejects calendar-impossible dates (2026-02-30, 2026-13-01)", () => {
    expect(departureSchema.safeParse(dep("2026-02-30", "2026-03-02")).success).toBe(false);
    expect(departureSchema.safeParse(dep("2026-13-01", "2026-13-05")).success).toBe(false);
  });
});

describe("tourSchema", () => {
  it("accepts a valid tour", () => {
    expect(tourSchema.safeParse(validTour()).success).toBe(true);
  });

  it("flags a duplicated departure date at the duplicate's index", () => {
    const t = validTour();
    t.departures.push({ from: "2099-01-10", to: "2099-01-17", seatsLeft: 1, priceUzs: 1 });
    const r = tourSchema.safeParse(t);
    expect(r.success).toBe(false);
    expect(r.error!.issues.map((i) => i.path)).toContainEqual(["departures", 2, "from"]);
  });

  it("rejects group size min > max", () => {
    const t = validTour();
    t.detail.groupSize = { min: 10, max: 2 };
    const r = tourSchema.safeParse(t);
    expect(r.success).toBe(false);
    expect(r.error!.issues[0].path).toEqual(["detail", "groupSize"]);
  });

  it("rejects bad ids, empty taxonomy and out-of-range numbers", () => {
    expect(tourSchema.safeParse({ ...validTour(), id: "../etc" }).success).toBe(false);
    expect(tourSchema.safeParse({ ...validTour(), country: "" }).success).toBe(false);
    expect(tourSchema.safeParse({ ...validTour(), days: 0 }).success).toBe(false);
    expect(tourSchema.safeParse({ ...validTour(), rank: 0 }).success).toBe(false);
    expect(tourSchema.safeParse({ ...validTour(), priceFromUzs: -1 }).success).toBe(false);
  });
});

describe("imagePath", () => {
  it("accepts site images and uploaded media ids", () => {
    for (const ok of ["/img/baku.jpg", "/img/a.b-c_d.jpeg", "/img/x.png", "/img/x.webp", "/media/20261020-abcdef01.jpg", " /img/baku.jpg "])
      expect(imagePath.safeParse(ok).success, ok).toBe(true);
  });

  it("rejects traversal, nested paths, external URLs and malformed media ids", () => {
    for (const bad of [
      "/img/../x.jpg",
      "/img/a/b.jpg",
      "/img/x.svg",
      "img/x.jpg",
      "https://evil.example/x.jpg",
      "//evil.example/x.jpg",
      "/media/2026102-abcdef01.jpg",
      "/media/20261020-abcdef0.jpg",
      "/media/20261020-abcdef01.png",
      "/media/opt/20261020-abcdef01-640.webp",
      "/img/x.jpg?x=1",
    ])
      expect(imagePath.safeParse(bad).success, bad).toBe(false);
  });

  // BUG: regex /i bayrog'i bilan — katta harfli yo'llar o'tadi, lekin readMediaFile, /media route va
  // image-loader katta-kichik harfga sezgir: saytda singan rasm bo'ladi.
  it("rejects upper-case variants that nothing can serve", () => {
    expect(imagePath.safeParse("/MEDIA/20261020-ABCDEF01.JPG").success).toBe(false);
    expect(imagePath.safeParse("/media/20261020-ABCDEF01.jpg").success).toBe(false);
  });
});

describe("settingsSchema", () => {
  it("turns empty fields into null and normalizes the phone", () => {
    const out = settingsSchema.parse({ ...validSettings(), phone: " +998 (90) 123-45-67 ", legalName: "  " });
    expect(out.phone).toBe("+998901234567");
    expect(out.legalName).toBeNull();
    expect(out.social.telegram).toBeNull();
    expect(out.mapEmbedUrl).toBeNull();
    expect(out.team.director).toBeNull();
  });

  it("rejects malformed phones and emails", () => {
    for (const phone of ["12345", "+998 90 abc 45 67", "+".padEnd(25, "1")])
      expect(settingsSchema.safeParse({ ...validSettings(), phone }).success, phone).toBe(false);
    expect(settingsSchema.safeParse({ ...validSettings(), email: "" }).success).toBe(false);
    expect(settingsSchema.safeParse({ ...validSettings(), email: "not-an-email" }).success).toBe(false);
  });

  // BUG: faqat tinish belgilaridan iborat "telefon" regex'dan o'tadi va "" ga aylanadi (null emas, rad ham etilmaydi).
  it("does not accept a phone made only of punctuation", () => {
    for (const phone of ["---------", "(((   )))"]) {
      const r = settingsSchema.safeParse({ ...validSettings(), phone });
      // Kutilgan: rad etiladi yoki null (bo'sh) deb saqlanadi. Hozir: "" saqlanadi.
      expect(!r.success || r.data.phone === null, phone).toBe(true);
    }
  });

  it("social links must be https and free of quotes/whitespace", () => {
    const social = (telegram: string) => ({ ...validSettings(), social: { telegram, instagram: "", whatsapp: "" } });
    expect(settingsSchema.parse(social("https://t.me/ravon")).social.telegram).toBe("https://t.me/ravon");
    for (const bad of ["http://t.me/ravon", "javascript:alert(1)", 'https://t.me/"onmouseover', "https://t.me/a b", "https://", "t.me/ravon"])
      expect(settingsSchema.safeParse(social(bad)).success, bad).toBe(false);
  });

  it("map embed must be a Google Maps or Yandex widget URL", () => {
    const map = (mapEmbedUrl: string) => ({ ...validSettings(), mapEmbedUrl });
    expect(settingsSchema.safeParse(map("https://www.google.com/maps/embed?pb=!1m18")).success).toBe(true);
    expect(settingsSchema.safeParse(map("https://yandex.uz/map-widget/v1/?ll=69.2")).success).toBe(true);
    for (const bad of [
      "https://evil.example/maps/embed",
      "https://www.google.com.evil.example/maps/embed",
      "https://yandex.uz.evil.example/map-widget/",
      "http://www.google.com/maps/embed?pb=1",
      "https://www.google.com/search?q=x",
    ])
      expect(settingsSchema.safeParse(map(bad)).success, bad).toBe(false);
  });
});
