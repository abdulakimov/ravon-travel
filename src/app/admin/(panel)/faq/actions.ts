"use server";

import { refresh } from "next/cache";
import { failure, type ActionState } from "@/lib/admin/action-state";
import { audit } from "@/lib/admin/audit";
import { UserError } from "@/lib/admin/errors";
import { requireAction } from "@/lib/admin/guard";
import { faqSchema } from "@/lib/admin/schemas";
import { updateDoc } from "@/lib/content";

export async function saveFaq(_p: ActionState, form: FormData): Promise<ActionState> {
  try {
    const user = await requireAction("admin");
    let raw: unknown;
    try {
      raw = JSON.parse(String(form.get("payload") ?? ""));
    } catch {
      throw new UserError("Forma ma'lumoti o'qilmadi.");
    }
    const items = faqSchema.parse(raw).map((i) => ({ ...i, list: i.list?.length ? i.list : undefined, link: i.link?.label.uz ? i.link : undefined }));
    const ids = items.map((i) => i.id);
    if (new Set(ids).size !== ids.length) throw new UserError("Savol ID'lari takrorlanmasin.");
    await updateDoc("faq", (doc) => {
      doc.items = items;
    });
    await audit(user, "faq_update", undefined, `${items.length} savol`);
    refresh();
    return { ok: "Saqlandi." };
  } catch (err) {
    return failure(err, "saveFaq");
  }
}
