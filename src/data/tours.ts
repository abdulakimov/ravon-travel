import type { CategoryId, CountryId, Departure, L10n, Tour } from "./types";

// Namuna ma'lumot (handoff prototipidan). Narx va sanalar yakuniy emas —
// backend/CMS ulanganida shu modul API chaqiruviga almashtiriladi.

export const countries: Record<CountryId, { name: L10n; image: string }> = {
  az: { name: { uz: "Ozarbayjon", ru: "Азербайджан", en: "Azerbaijan" }, image: "/img/dest-az.jpg" },
  ge: { name: { uz: "Gruziya", ru: "Грузия", en: "Georgia" }, image: "/img/dest-ge.jpg" },
  ae: { name: { uz: "BAA", ru: "ОАЭ", en: "UAE" }, image: "/img/dest-ae.jpg" },
  cn: { name: { uz: "Xitoy", ru: "Китай", en: "China" }, image: "/img/dest-cn.jpg" },
  my: { name: { uz: "Malayziya", ru: "Малайзия", en: "Malaysia" }, image: "/img/dest-my-kl.jpg" },
  bg: { name: { uz: "Bolgariya", ru: "Болгария", en: "Bulgaria" }, image: "/img/dest-bg.jpg" },
  gr: { name: { uz: "Yunoniston", ru: "Греция", en: "Greece" }, image: "/img/dest-gr.jpg" },
  qa: { name: { uz: "Qatar", ru: "Катар", en: "Qatar" }, image: "/img/dest-qa.jpg" },
  kg: { name: { uz: "Qirg'iziston", ru: "Кыргызстан", en: "Kyrgyzstan" }, image: "/img/tour-kg.jpg" },
};

export const countryIds = Object.keys(countries) as CountryId[];

export const categories: Record<CategoryId, { name: L10n }> = {
  historical: { name: { uz: "Tarixiy turlar", ru: "Исторические туры", en: "Historical tours" } },
  nature: { name: { uz: "Tabiat turlari", ru: "Природные туры", en: "Nature tours" } },
  beach: { name: { uz: "Plyaj dam olish", ru: "Пляжный отдых", en: "Beach holidays" } },
  wellness: { name: { uz: "Davolanish turlari", ru: "Лечебные туры", en: "Wellness tours" } },
  cruise: { name: { uz: "Kruiz", ru: "Круизы", en: "Cruises" } },
};

export const categoryIds = Object.keys(categories) as CategoryId[];

const dep = (from: string, to: string, seatsLeft: number, priceUsd: number): Departure => ({
  id: from,
  from,
  to,
  seatsLeft,
  priceUsd,
});

export const tours: Tour[] = [
  {
    id: "az-7",
    slug: "azerbaijan-7-wonders",
    country: "az",
    category: "historical",
    days: 6,
    nights: 5,
    priceFromUsd: 690,
    fixedDeparture: true,
    top: true,
    rank: 1,
    seatsLeft: 4,
    image: "/img/tour-az.jpg",
    title: {
      uz: "Ozarbayjon — «7 mo'jiza» ekskursiyasi",
      ru: "Азербайджан — экскурсия «7 чудес»",
      en: "Azerbaijan — the '7 Wonders' tour",
    },
    summary: {
      uz: "Baku, Gobustan, Yanardag va Atashgah — olti kunda yettita noyob makon.",
      ru: "Баку, Гобустан, Янардаг и Атешгях — семь уникальных мест за шесть дней.",
      en: "Baku, Gobustan, Yanardag and Ateshgah — seven unique sites in six days.",
    },
    departures: [
      dep("2026-10-12", "2026-10-17", 4, 720),
      dep("2026-10-26", "2026-10-31", 9, 720),
      dep("2026-11-09", "2026-11-14", 0, 690),
      dep("2026-11-26", "2026-12-01", 14, 690),
    ],
  },
  {
    id: "kg-issyk",
    slug: "issyk-kul",
    country: "kg",
    category: "nature",
    days: 8,
    nights: 7,
    priceFromUsd: 470,
    fixedDeparture: true,
    top: true,
    rank: 2,
    seatsLeft: 12,
    image: "/img/tour-kg.jpg",
    title: {
      uz: "Issiq-Ko'l — Qirg'iziston tog' dengizi",
      ru: "Иссык-Куль — горное море Кыргызстана",
      en: "Issyk-Kul — Kyrgyzstan's mountain sea",
    },
    summary: {
      uz: "Tyan-Shan tog'lari ichidagi sho'r ko'l, mahalliy oshxona va issiq buloqlar.",
      ru: "Солёное озеро в Тянь-Шане, местная кухня и горячие источники.",
      en: "A salt lake in the Tian Shan, local cuisine and hot springs.",
    },
    departures: [
      dep("2026-10-18", "2026-10-25", 12, 470),
      dep("2026-11-01", "2026-11-08", 16, 470),
      dep("2027-05-16", "2027-05-23", 20, 490),
    ],
  },
  {
    id: "ae-dubai",
    slug: "dubai",
    country: "ae",
    category: "beach",
    days: 8,
    nights: 7,
    priceFromUsd: 1375,
    fixedDeparture: false,
    top: true,
    rank: 3,
    seatsLeft: null,
    image: "/img/tour-ae.jpg",
    title: {
      uz: "Dubay — Hashamatli BAA sayohati",
      ru: "Дубай — роскошное путешествие по ОАЭ",
      en: "Dubai — a luxury UAE escape",
    },
    summary: {
      uz: "Burj Xalifa, cho'l safari va Palm Jumeyra — yetti kechalik shahar dam olishi.",
      ru: "Бурдж-Халифа, сафари по дюнам и Палм-Джумейра — семь ночей в городе.",
      en: "Burj Khalifa, a desert safari and Palm Jumeirah — seven nights in the city.",
    },
    departures: [],
  },
  {
    id: "gr-cruise",
    slug: "greek-islands-cruise",
    country: "gr",
    category: "cruise",
    days: 8,
    nights: 7,
    priceFromUsd: 1650,
    fixedDeparture: true,
    top: true,
    rank: 4,
    seatsLeft: 3,
    image: "/img/dest-gr.jpg",
    title: {
      uz: "Yunoniston orollari kruizi",
      ru: "Круиз по греческим островам",
      en: "Greek islands cruise",
    },
    summary: {
      uz: "Egey dengizi bo'ylab kruiz: Santorini, Mikonos va Krit orollari.",
      ru: "Круиз по Эгейскому морю: Санторини, Миконос и Крит.",
      en: "An Aegean cruise: Santorini, Mykonos and Crete.",
    },
    departures: [
      dep("2026-10-24", "2026-10-31", 3, 1650),
      dep("2027-04-24", "2027-05-01", 10, 1690),
      dep("2027-05-15", "2027-05-22", 14, 1750),
    ],
  },
  {
    id: "ge-batumi",
    slug: "georgia-batumi-tbilisi",
    country: "ge",
    category: "historical",
    days: 8,
    nights: 7,
    priceFromUsd: 1100,
    fixedDeparture: true,
    top: false,
    rank: 5,
    seatsLeft: 9,
    image: "/img/tour-ge.jpg",
    title: {
      uz: "Gruziya — Batumi, Bakuriani va Tbilisi",
      ru: "Грузия — Батуми, Бакуриани и Тбилиси",
      en: "Georgia — Batumi, Bakuriani and Tbilisi",
    },
    summary: {
      uz: "Qora dengiz qirg'og'idagi Batumi, tog' kurorti Bakuriani va qadimiy Tbilisi.",
      ru: "Батуми на Чёрном море, горный курорт Бакуриани и старый Тбилиси.",
      en: "Seaside Batumi, the Bakuriani mountain resort and old Tbilisi.",
    },
    departures: [
      dep("2026-10-20", "2026-10-27", 9, 1100),
      dep("2026-11-10", "2026-11-17", 0, 1100),
      dep("2026-12-27", "2027-01-03", 7, 1240),
    ],
  },
  {
    id: "bg-sunny",
    slug: "bulgaria-sunny-beach",
    country: "bg",
    category: "beach",
    days: 8,
    nights: 7,
    priceFromUsd: 890,
    fixedDeparture: true,
    top: false,
    rank: 6,
    seatsLeft: 6,
    image: "/img/dest-bg.jpg",
    title: {
      uz: "Bolgariya — Quyoshli plyaj va Nesebar",
      ru: "Болгария — Солнечный берег и Несебр",
      en: "Bulgaria — Sunny Beach and Nessebar",
    },
    summary: {
      uz: "Qora dengizdagi qumli plyajlar va YUNESKO ro'yxatidagi qadimiy Nesebar.",
      ru: "Песчаные пляжи Чёрного моря и древний Несебр из списка ЮНЕСКО.",
      en: "Black Sea sand and the UNESCO-listed old town of Nessebar.",
    },
    departures: [
      dep("2027-06-05", "2027-06-12", 6, 890),
      dep("2027-06-19", "2027-06-26", 18, 920),
      dep("2027-07-10", "2027-07-17", 22, 980),
    ],
  },
  {
    id: "az-naftalan",
    slug: "naftalan",
    country: "az",
    category: "wellness",
    days: 7,
    nights: 6,
    priceFromUsd: 680,
    fixedDeparture: false,
    top: false,
    rank: 7,
    seatsLeft: null,
    image: "/img/tour-naftalan.jpg",
    title: {
      uz: "Naftalan — Davolanish va sog'lomlashtirish turi",
      ru: "Нафталан — лечебно-оздоровительный тур",
      en: "Naftalan — health and wellness tour",
    },
    summary: {
      uz: "Ozarbayjondagi tabiiy neft vannalari — tayanch-harakat tizimi uchun.",
      ru: "Природные нефтяные ванны в Азербайджане — для опорно-двигательной системы.",
      en: "Azerbaijan's natural oil baths — for the musculoskeletal system.",
    },
    departures: [],
  },
  {
    id: "cn-avatar",
    slug: "china-avatar-guangzhou",
    country: "cn",
    category: "nature",
    days: 8,
    nights: 7,
    priceFromUsd: 1520,
    fixedDeparture: false,
    top: false,
    rank: 8,
    seatsLeft: null,
    image: "/img/tour-cn.jpg",
    title: {
      uz: "Xitoy — «Avatar» tog'lari va Guangzhou",
      ru: "Китай — горы «Аватар» и Гуанчжоу",
      en: "China — the 'Avatar' mountains and Guangzhou",
    },
    summary: {
      uz: "«Avatar» filmiga ilhom bergan Zhangjiajie tog'lari va zamonaviy Guangzhou.",
      ru: "Горы Чжанцзяцзе, вдохновившие фильм «Аватар», и современный Гуанчжоу.",
      en: "The Zhangjiajie mountains that inspired 'Avatar', plus modern Guangzhou.",
    },
    departures: [],
  },
  {
    id: "my-kl",
    slug: "malaysia-kuala-lumpur-langkawi",
    country: "my",
    category: "beach",
    days: 9,
    nights: 8,
    priceFromUsd: 1290,
    fixedDeparture: false,
    top: false,
    rank: 9,
    seatsLeft: null,
    image: "/img/dest-my-kl.jpg",
    title: {
      uz: "Malayziya — Kuala-Lumpur va Langkavi",
      ru: "Малайзия — Куала-Лумпур и Лангкави",
      en: "Malaysia — Kuala Lumpur and Langkawi",
    },
    summary: {
      uz: "Petronas minoralari, tropik o'rmon va Langkavi orolidagi plyajlar.",
      ru: "Башни Петронас, тропический лес и пляжи острова Лангкави.",
      en: "The Petronas Towers, rainforest and the beaches of Langkawi.",
    },
    departures: [],
  },
  {
    id: "qa-doha",
    slug: "qatar-doha",
    country: "qa",
    category: "historical",
    days: 5,
    nights: 4,
    priceFromUsd: 980,
    fixedDeparture: false,
    top: false,
    rank: 10,
    seatsLeft: null,
    image: "/img/dest-qa.jpg",
    title: {
      uz: "Qatar — Doha shahri va cho'l",
      ru: "Катар — Доха и пустыня",
      en: "Qatar — Doha and the desert",
    },
    summary: {
      uz: "Souq Waqif bozori, Islom san'ati muzeyi va cho'ldagi ichki dengiz.",
      ru: "Базар Сук-Вакиф, Музей исламского искусства и внутреннее море в пустыне.",
      en: "Souq Waqif, the Museum of Islamic Art and the desert inland sea.",
    },
    departures: [],
  },
];

export const toursByRank = [...tours].sort((a, b) => a.rank - b.rank);

/** Bugungi sana Toshkent vaqti bo'yicha (YYYY-MM-DD). */
export function todayIso(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tashkent" }).format(now);
}

/**
 * Turning "jonli" ko'rinishi: jo'nab ketgan (bugun yoki undan oldingi) sanalar olib tashlanadi,
 * kartochka narxi va o'rin soni qolgan sanalardan qayta hisoblanadi.
 */
export function liveTour(tour: Tour, today = todayIso()): Tour {
  if (!tour.fixedDeparture) return tour;
  const departures = tour.departures.filter((d) => d.from > today);
  const open = departures.filter((d) => d.seatsLeft > 0);
  return {
    ...tour,
    departures,
    seatsLeft: open[0]?.seatsLeft ?? null,
    priceFromUsd: open.length ? Math.min(...open.map((d) => d.priceUsd)) : tour.priceFromUsd,
  };
}

/** Ro'yxatlar (bosh sahifa, katalog) uchun: har bir tur joriy sanaga nisbatan. */
export function liveToursByRank(today = todayIso()): Tour[] {
  return toursByRank.map((t) => liveTour(t, today));
}

/** Slug bo'yicha tur — har doim joriy sanaga nisbatan (o'tgan sanalarsiz). */
export function getTour(slug: string, today = todayIso()): Tour | undefined {
  const tour = tours.find((t) => t.slug === slug);
  return tour && liveTour(tour, today);
}

export function toursInCountry(country: CountryId): Tour[] {
  return tours.filter((t) => t.country === country);
}

export function similarTours(tour: Tour, limit = 3): Tour[] {
  const score = (t: Tour) => (t.category === tour.category ? 2 : 0) + (t.country === tour.country ? 1 : 0);
  return liveToursByRank()
    .filter((t) => t.id !== tour.id)
    .sort((a, b) => score(b) - score(a) || a.rank - b.rank)
    .slice(0, limit);
}

/** Bron qilish mumkin bo'lgan (o'rni bor) sanalar. */
export function openDepartures(tour: Tour, today = todayIso()): Departure[] {
  return tour.departures.filter((d) => d.seatsLeft > 0 && d.from > today);
}

export const PRICE_MIN = 400;
export const PRICE_MAX = 1700;
