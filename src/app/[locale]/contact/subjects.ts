// Aloqa formasi mavzulari — forma (client) va /api/contact sxemasi (server) uchun yagona manba.
// Yorliqlar: messages/<locale>/contact.json → form.subjects.<key>
export const CONTACT_SUBJECTS = ["tour", "custom", "booking", "other"] as const;
export type ContactSubject = (typeof CONTACT_SUBJECTS)[number];

export const CONTACT_LIMITS = {
  name: 100,
  phone: 32,
  phoneMinDigits: 9,
  email: 254,
  messageMin: 10,
  message: 2000,
} as const;
