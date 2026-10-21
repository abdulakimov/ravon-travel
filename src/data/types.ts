import type { Locale } from "@/i18n/routing";

export type L10n = Record<Locale, string>;

/** Mamlakat va toifa identifikatorlari admin paneldan qo'shiladi — qat'iy ro'yxat emas (a-z, raqam, "-"). */
export type CountryId = string;
export type CategoryId = string;

export interface Country {
  name: L10n;
  image: string;
  /** Bosh sahifadagi yo'nalishlar blokida ko'rsatilsinmi (yo'q → ko'rsatiladi) */
  home?: boolean;
}

export interface Category {
  name: L10n;
}

export interface Departure {
  id: string; // = from (YYYY-MM-DD)
  from: string;
  to: string;
  seatsLeft: number;
  priceUzs: number;
}

export interface Tour {
  id: string;
  slug: string;
  country: CountryId;
  category: CategoryId;
  days: number;
  nights: number;
  priceFromUzs: number;
  /** true → "Sanasi bor": saytda bron + to'lov. false → "So'rov bo'yicha": so'rov formasi. */
  fixedDeparture: boolean;
  top: boolean;
  /** Ommaboplik tartibi (1 = eng ommabop). */
  rank: number;
  /** Kartochkadagi "N o'rin qoldi" (eng yaqin sana bo'yicha), null → ko'rsatilmaydi. */
  seatsLeft: number | null;
  image: string;
  title: L10n;
  summary: L10n;
  departures: Departure[];
}

export interface ItineraryDay {
  title: L10n;
  text: L10n;
  tags: L10n[];
}

/** Tur tafsiloti sahifasi uchun kengaytirilgan kontent (src/data/tour-details.ts). */
export interface TourDetail {
  route: L10n;
  groupSize: { min: number; max: number };
  about: L10n[]; // paragraflar
  gallery: { src: string; alt: L10n }[];
  itinerary: ItineraryDay[];
  included: L10n[];
  excluded: L10n[];
  notes: { visa: L10n; passport: L10n; cancellation: L10n };
}
