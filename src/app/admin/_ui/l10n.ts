// Server va client'da ishlatiladigan uch tilli matn turi (fields.tsx — faqat client).
export type L10n = { uz: string; ru: string; en: string };
export const emptyL10n = (): L10n => ({ uz: "", ru: "", en: "" });
