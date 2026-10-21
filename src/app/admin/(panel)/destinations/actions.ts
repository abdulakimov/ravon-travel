"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { failure, type ActionState } from "@/lib/admin/action-state";
import { audit } from "@/lib/admin/audit";
import { UserError } from "@/lib/admin/errors";
import { requireAction } from "@/lib/admin/guard";
import { categorySchema, countrySchema } from "@/lib/admin/schemas";
import { getTourRecords, updateDoc } from "@/lib/content";

const payloadSchema = z.object({ countries: z.array(countrySchema).max(80), categories: z.array(categorySchema).max(40) });

export async function saveTaxonomy(_p: ActionState, form: FormData): Promise<ActionState> {
  try {
    const user = await requireAction("admin");
    let raw: unknown;
    try {
      raw = JSON.parse(String(form.get("payload") ?? ""));
    } catch {
      throw new UserError("Forma ma'lumoti o'qilmadi.");
    }
    const input = payloadSchema.parse(raw);
    for (const [list, what] of [[input.countries, "mamlakat"], [input.categories, "toifa"]] as const) {
      const ids = list.map((x) => x.id);
      const dup = ids.find((id, i) => ids.indexOf(id) !== i);
      if (dup) throw new UserError(`"${dup}" ID takrorlangan (${what}).`);
    }
    const tours = await getTourRecords();
    const usedC = new Set(tours.map((t) => t.country));
    const usedK = new Set(tours.map((t) => t.category));
    const missingC = [...usedC].filter((id) => !input.countries.some((c) => c.id === id));
    const missingK = [...usedK].filter((id) => !input.categories.some((c) => c.id === id));
    if (missingC.length) throw new UserError(`Turlarda ishlatilgan mamlakatni o'chirib bo'lmaydi: ${missingC.join(", ")}.`);
    if (missingK.length) throw new UserError(`Turlarda ishlatilgan toifani o'chirib bo'lmaydi: ${missingK.join(", ")}.`);
    await updateDoc("taxonomy", (doc) => {
      doc.countries = input.countries.map(({ id, name, image, home }) => ({ id, name, image, ...(home ? {} : { home: false }) }));
      doc.categories = input.categories;
    });
    await audit(user, "taxonomy_update", undefined, `${input.countries.length} mamlakat, ${input.categories.length} toifa`);
    refresh();
    return { ok: "Saqlandi." };
  } catch (err) {
    return failure(err, "saveTaxonomy");
  }
}
