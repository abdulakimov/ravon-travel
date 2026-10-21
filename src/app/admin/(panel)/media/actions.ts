"use server";

import { refresh } from "next/cache";
import { failure, type ActionState } from "@/lib/admin/action-state";
import { audit } from "@/lib/admin/audit";
import { UserError } from "@/lib/admin/errors";
import { requireAction } from "@/lib/admin/guard";
import { usedImages } from "@/lib/admin/media-usage";
import { deleteMedia, listMedia, type MediaItem } from "@/lib/media";

export interface Library {
  uploads: MediaItem[];
  site: string[];
}

/** Rasm tanlagich uchun: yuklanganlar + saytdagi mavjud (statik) rasmlar. */
export async function libraryAction(): Promise<Library> {
  await requireAction("admin");
  const [uploads, used] = await Promise.all([listMedia(), usedImages()]);
  return { uploads, site: [...used].filter((u) => u.startsWith("/img/")).sort() };
}

export async function removeMedia(_p: ActionState, form: FormData): Promise<ActionState> {
  try {
    const user = await requireAction("admin");
    const id = String(form.get("id") ?? "");
    if ((await usedImages()).has(`/media/${id}.jpg`)) throw new UserError("Rasm saytda ishlatilmoqda — avval uni almashtiring.");
    await deleteMedia(id);
    await audit(user, "media_delete", id);
    refresh();
    return { ok: "O'chirildi." };
  } catch (err) {
    return failure(err, "removeMedia");
  }
}
