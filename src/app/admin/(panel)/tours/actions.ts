"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { failure, type ActionState } from "@/lib/admin/action-state";
import { audit } from "@/lib/admin/audit";
import { UserError } from "@/lib/admin/errors";
import { requireAction } from "@/lib/admin/guard";
import { listOrders } from "@/lib/admin/orders-admin";
import { tourSchema } from "@/lib/admin/schemas";
import { getTaxonomy, updateDoc, type TourRecord } from "@/lib/content";

/** Bronlari bor turlar (slug). Navbatdan TASHQARIDA o'qiladi — to'lovlar admin saqlashini kutib qolmasin. */
const slugsWithOrders = async () => new Set((await listOrders()).map((o) => o.tourSlug));
/** Faol (to'lov kutayotgan yoki to'langan) bronlari bor sanalar: "slug|sana". */
const activeDepartures = async () =>
  new Set((await listOrders()).filter((o) => o.status === "awaiting" || o.status === "paid").map((o) => `${o.tourSlug}|${o.departureId}`));

export async function saveTour(_p: ActionState, form: FormData): Promise<ActionState> {
  let createdId: string | null = null;
  try {
    const user = await requireAction("admin");
    let raw: unknown;
    try {
      raw = JSON.parse(String(form.get("payload") ?? ""));
    } catch {
      throw new UserError("Forma ma'lumoti o'qilmadi.");
    }
    const input = tourSchema.parse(raw);
    const tax = await getTaxonomy();
    if (!tax.countryIds.includes(input.country)) throw new UserError("Mamlakat topilmadi.");
    if (!tax.categoryIds.includes(input.category)) throw new UserError("Toifa topilmadi.");

    const departures = [...input.departures]
      .sort((a, b) => a.from.localeCompare(b.from))
      .map((d) => ({ id: d.from, from: d.from, to: d.to, seatsLeft: d.seatsLeft, priceUzs: d.priceUzs, seatsOrig: d.seatsOrig }));
    // Kartochkadagi "dan" narx va o'rin: sanasi bor turda sanalardan hisoblanadi (liveTour ham shunday qiladi)
    const priceFromUzs = input.fixedDeparture && departures.length ? Math.min(...departures.map((d) => d.priceUzs)) : input.priceFromUzs;

    let renamedFrom: string | undefined;
    const booked = await slugsWithOrders();
    const activeDeps = await activeDepartures();
    await updateDoc("tours", async (doc) => {
      if (doc.tours.some((t) => t.slug === input.slug && t.id !== input.id)) throw new UserError("Bu slug boshqa turda band.");
      const base = {
        slug: input.slug,
        country: input.country,
        category: input.category,
        days: input.days,
        nights: input.nights,
        priceFromUzs,
        fixedDeparture: input.fixedDeparture,
        top: input.top,
        rank: input.rank,
        seatsLeft: input.fixedDeparture ? (departures.find((d) => d.seatsLeft > 0)?.seatsLeft ?? null) : null,
        image: input.image,
        title: input.title,
        summary: input.summary,
        departures: input.fixedDeparture ? departures.map((d) => ({ id: d.id, from: d.from, to: d.to, seatsLeft: d.seatsLeft, priceUzs: d.priceUzs })) : [],
        published: input.published,
        detail: input.detail,
        updatedAt: new Date().toISOString(),
      };
      if (input.id) {
        const i = doc.tours.findIndex((t) => t.id === input.id);
        if (i < 0) throw new UserError("Tur topilmadi (o'chirilgan bo'lishi mumkin).");
        // Faol bronlari bor sanani o'chirib/o'zgartirib bo'lmaydi (bron va to'lov shu sanaga bog'langan)
        const keptIds = new Set(base.departures.map((d) => d.id));
        const lost = doc.tours[i].departures.filter((d) => activeDeps.has(`${doc.tours[i].slug}|${d.id}`) && !keptIds.has(d.id));
        if (lost.length)
          throw new UserError(`Bu sanalarga bronlar bor — o'chirib yoki o'zgartirib bo'lmaydi: ${lost.map((d) => d.from).join(", ")}. O'rinni 0 qilib qo'yishingiz mumkin.`);
        // Forma ochiq turganda to'lovlar o'rinni kamaytirgan bo'lishi mumkin: admin o'zgartirmagan o'rin soni
        // serverdagi joriy qiymatda qoladi (eski forma qiymati to'lovni "qaytarib yubormasin").
        for (const d of base.departures) {
          const cur = doc.tours[i].departures.find((x) => x.id === d.id);
          const sent = departures.find((x) => x.id === d.id);
          if (cur && sent?.seatsOrig !== undefined && sent.seatsLeft === sent.seatsOrig) d.seatsLeft = cur.seatsLeft;
        }
        if (doc.tours[i].slug !== input.slug) {
          if (booked.has(doc.tours[i].slug)) throw new UserError("Bu turga bronlar bor — slugni o'zgartirib bo'lmaydi.");
          renamedFrom = doc.tours[i].slug;
        }
        doc.tours[i] = { ...doc.tours[i], ...base };
      } else {
        let id = input.slug.slice(0, 50);
        while (doc.tours.some((t) => t.id === id)) id = `${input.slug.slice(0, 44)}-${Math.random().toString(36).slice(2, 6)}`;
        const rec: TourRecord = { id, ...base };
        doc.tours.push(rec);
        createdId = id;
      }
    });
    await audit(user, createdId ? "tour_create" : "tour_update", createdId ?? input.id, renamedFrom ? `slug ${renamedFrom} → ${input.slug}` : input.slug);
    if (!createdId) {
      refresh();
      return { ok: "Saqlandi. Saytda darhol ko'rinadi." };
    }
  } catch (err) {
    return failure(err, "saveTour");
  }
  redirect(`/tours/${createdId}?created=1`);
}

export async function deleteTour(_p: ActionState, form: FormData): Promise<ActionState> {
  try {
    const user = await requireAction("admin");
    const id = String(form.get("id") ?? "");
    const confirm = String(form.get("confirm") ?? "");
    const booked = await slugsWithOrders();
    await updateDoc("tours", async (doc) => {
      const t = doc.tours.find((x) => x.id === id);
      if (!t) throw new UserError("Tur topilmadi.");
      if (confirm !== t.slug) throw new UserError("Tasdiqlash uchun slugni aynan yozing.");
      if (booked.has(t.slug)) throw new UserError("Bu turga bronlar bor — o'chirib bo'lmaydi. O'rniga saytdan yashiring.");
      doc.tours = doc.tours.filter((x) => x.id !== id);
    });
    await audit(user, "tour_delete", id);
  } catch (err) {
    return failure(err, "deleteTour");
  }
  redirect("/tours");
}

export async function duplicateTour(_p: ActionState, form: FormData): Promise<ActionState> {
  let newId = "";
  try {
    const user = await requireAction("admin");
    const id = String(form.get("id") ?? "");
    await updateDoc("tours", (doc) => {
      const t = doc.tours.find((x) => x.id === id);
      if (!t) throw new UserError("Tur topilmadi.");
      let slug = `${t.slug}-nusxa`;
      for (let n = 2; doc.tours.some((x) => x.slug === slug); n++) slug = `${t.slug}-nusxa-${n}`;
      newId = slug.slice(0, 60);
      for (let n = 2; doc.tours.some((x) => x.id === newId); n++) newId = `${slug.slice(0, 55)}-${n}`;
      doc.tours.push({ ...structuredClone(t), id: newId, slug, published: false, rank: Math.max(...doc.tours.map((x) => x.rank)) + 1, updatedAt: new Date().toISOString() });
    });
    await audit(user, "tour_duplicate", id, newId);
  } catch (err) {
    return failure(err, "duplicateTour");
  }
  redirect(`/tours/${newId}`);
}
