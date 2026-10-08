// Kompaniya ma'lumotlari uchun yagona manba.
// Handoff'da bular `{...}` placeholder edi — haqiqiy qiymat kelganda FAQAT shu fayl o'zgaradi.
// `null` = hali berilmagan → saytda "Rasmiylashtirilmoqda" / "Tez orada" ko'rinadi.

export const site = {
  name: "Ravon Travel",
  domain: "ravontravel.uz",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://ravontravel.uz",

  legalName: null as string | null, // {LEGAL_NAME}
  stir: null as string | null, // {STIR}
  postalAddress: null as string | null, // {POSTAL_ADDRESS}
  phone: null as string | null, // {PHONE} — xalqaro formatda: +998901234567
  email: "info@ravontravel.uz",
  bankName: null as string | null, // {BANK_NAME}
  bankAccount: null as string | null, // {BANK_ACCOUNT}

  licenseNo: null as string | null, // {LICENSE_NO} — null bo'lsa "Rasmiylashtirilmoqda"
  licenseDate: null as string | null,

  team: {
    director: null as string | null, // {DIRECTOR_NAME}
    manager: null as string | null, // {MANAGER_NAME}
    specialist: null as string | null, // {SPECIALIST_NAME}
    accountant: null as string | null, // {ACCOUNTANT_NAME}
  },

  // Du–Sha 09:00–19:00 (UTC+5) — matni messages/common.json → workingHours
  social: {
    telegram: null as string | null,
    instagram: null as string | null,
    whatsapp: null as string | null,
  },

  // Xarita embed URL (Google/Yandex). null → "xarita tez orada" joyi ko'rsatiladi.
  mapEmbedUrl: null as string | null,

  // Namuna kurs (handoff). Productionda API'dan olinadi.
  uzsRate: 12650,
} as const;

export type Site = typeof site;
