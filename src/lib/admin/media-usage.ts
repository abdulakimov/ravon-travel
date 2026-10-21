import { getPostRecords, getTaxonomy, getTourRecords } from "../content";

/** Saytda hozir ishlatilayotgan barcha rasm yo'llari (turlar, galereya, yo'nalishlar, blog). */
export async function usedImages(): Promise<Set<string>> {
  const [tours, tax, posts] = await Promise.all([getTourRecords(), getTaxonomy(), getPostRecords()]);
  const set = new Set<string>();
  for (const t of tours) {
    set.add(t.image);
    for (const g of t.detail?.gallery ?? []) set.add(g.src);
  }
  for (const c of Object.values(tax.countries)) set.add(c.image);
  for (const p of posts) set.add(p.image);
  return set;
}
