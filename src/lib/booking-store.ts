"use client";

// Bron holati hozircha brauzerda (sessionStorage) saqlanadi — backend yo'q.
// Backend ulanganda shu modulning funksiyalari API chaqiruvlariga almashtiriladi;
// sahifalar faqat shu interfeysga tayanadi.
// DIQQAT: bu yerga karta ma'lumotlari HECH QACHON yozilmaydi.

export interface Traveler {
  firstName: string;
  lastName: string;
  birthDate: string; // YYYY-MM-DD
  passportNo: string;
}

export type BookingStatus = "held" | "paid" | "expired" | "cancelled";

export interface Booking {
  id: string; // RV-YYYY-NNNNN
  tourSlug: string;
  departureId: string;
  adults: number;
  children: number;
  travelers: Traveler[];
  phone: string;
  email: string;
  note: string;
  consents: { offer: boolean; personalData: boolean };
  totalUsd: number;
  status: BookingStatus;
  createdAt: number; // epoch ms
  holdUntil: number; // epoch ms (createdAt + 30 daqiqa)
  payment?: { method: string; transactionId: string; paidAt: number };
}

export const HOLD_MS = 30 * 60 * 1000;
const KEY = "rt.booking.";

export function newBookingId(now = new Date()): string {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 100000;
  return `RV-${now.getFullYear()}-${String(n).padStart(5, "0")}`;
}

export const BOOKING_ID_RE = /^RV-\d{4}-\d{5}$/;

export function saveBooking(booking: Booking): void {
  try {
    sessionStorage.setItem(KEY + booking.id, JSON.stringify(booking));
  } catch {
    // sessionStorage o'chirilgan (private rejim) — oqim xotirada davom etadi
  }
}

export function loadBooking(id: string): Booking | null {
  if (!BOOKING_ID_RE.test(id)) return null;
  try {
    const raw = sessionStorage.getItem(KEY + id);
    if (!raw) return null;
    const b = JSON.parse(raw) as Booking;
    // Shaklni tekshirish: tashqaridan o'zgartirilgan/eskirgan yozuvga ishonmaymiz
    if (b?.id !== id || typeof b.holdUntil !== "number" || typeof b.totalUsd !== "number") return null;
    return b;
  } catch {
    return null;
  }
}

export function updateBooking(id: string, patch: Partial<Booking>): Booking | null {
  const current = loadBooking(id);
  if (!current) return null;
  const next = { ...current, ...patch };
  saveBooking(next);
  return next;
}
