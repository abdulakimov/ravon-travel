"use server";

import { refresh } from "next/cache";
import { failure, type ActionState } from "@/lib/admin/action-state";
import { audit } from "@/lib/admin/audit";
import { UserError } from "@/lib/admin/errors";
import { requireAction } from "@/lib/admin/guard";
import { LEAD_STATE_LABEL, setLeadState, type LeadState } from "@/lib/admin/leads-admin";

export async function updateLead(_p: ActionState, form: FormData): Promise<ActionState> {
  try {
    const user = await requireAction("manager");
    const id = String(form.get("id") ?? "");
    const state = String(form.get("state") ?? "") as LeadState;
    if (!Object.hasOwn(LEAD_STATE_LABEL, state)) throw new UserError("Noto'g'ri holat.");
    const note = form.has("note") ? String(form.get("note")) : undefined;
    await setLeadState(id, state, note, user.username);
    await audit(user, "lead_update", id, state);
    refresh();
    return { ok: "Saqlandi." };
  } catch (err) {
    return failure(err, "updateLead");
  }
}
