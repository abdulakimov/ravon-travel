"use server";

import { refresh } from "next/cache";
import { failure, type ActionState } from "@/lib/admin/action-state";
import { audit } from "@/lib/admin/audit";
import { requireAction } from "@/lib/admin/guard";
import { settingsSchema } from "@/lib/admin/schemas";
import { updateDoc } from "@/lib/content";

const s = (form: FormData, k: string) => String(form.get(k) ?? "");

export async function saveSettings(_p: ActionState, form: FormData): Promise<ActionState> {
  try {
    const user = await requireAction("admin");
    const input = settingsSchema.parse({
      legalName: s(form, "legalName"),
      stir: s(form, "stir"),
      postalAddress: s(form, "postalAddress"),
      phone: s(form, "phone"),
      email: s(form, "email"),
      bankName: s(form, "bankName"),
      bankAccount: s(form, "bankAccount"),
      mfo: s(form, "mfo"),
      licenseNo: s(form, "licenseNo"),
      licenseDate: s(form, "licenseDate"),
      licenseAuthority: s(form, "licenseAuthority"),
      team: { director: s(form, "team.director"), manager: s(form, "team.manager"), specialist: s(form, "team.specialist"), accountant: s(form, "team.accountant") },
      social: { telegram: s(form, "social.telegram"), instagram: s(form, "social.instagram"), whatsapp: s(form, "social.whatsapp") },
      mapEmbedUrl: s(form, "mapEmbedUrl"),
    });
    await updateDoc("settings", (doc) => {
      Object.assign(doc, input);
    });
    await audit(user, "settings_update");
    refresh();
    return { ok: "Saqlandi. Saytda darhol ko'rinadi." };
  } catch (err) {
    return failure(err, "saveSettings");
  }
}
