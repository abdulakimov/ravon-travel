"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { failure, type ActionState } from "@/lib/admin/action-state";
import { audit } from "@/lib/admin/audit";
import { UserError } from "@/lib/admin/errors";
import { requireAction } from "@/lib/admin/guard";
import { encodeSession, SESSION_COOKIE, SESSION_TTL_MS, sessionCookieOptions } from "@/lib/admin/session";
import { hashPassword, passwordProblem, updateUsers, verifyPassword } from "@/lib/admin/users";

export async function changePassword(_p: ActionState, form: FormData): Promise<ActionState> {
  let first = false;
  try {
    const user = await requireAction("manager", { allowMustChange: true });
    first = user.mustChangePassword;
    const current = String(form.get("current") ?? "");
    const next = String(form.get("next") ?? "");
    if (next !== String(form.get("repeat") ?? "")) throw new UserError("Yangi parollar bir xil emas.");
    if (!(await verifyPassword(current, user.passwordHash))) throw new UserError("Joriy parol noto'g'ri.");
    if (current === next) throw new UserError("Yangi parol eskisidan farq qilsin.");
    const problem = passwordProblem(next);
    if (problem) throw new UserError(problem);
    const hash = await hashPassword(next);
    const ver = await updateUsers((users) => {
      const u = users.find((x) => x.id === user.id);
      if (!u) throw new UserError("Foydalanuvchi topilmadi.");
      u.passwordHash = hash;
      u.mustChangePassword = false;
      u.sessionVersion += 1; // boshqa qurilmalardagi sessiyalar tugaydi
      return u.sessionVersion;
    });
    // Joriy sessiya yangi versiya bilan davom etadi
    (await cookies()).set(
      SESSION_COOKIE,
      encodeSession({ uid: user.id, ver, exp: Date.now() + SESSION_TTL_MS }),
      sessionCookieOptions(SESSION_TTL_MS / 1000),
    );
    await audit(user, "password_changed");
  } catch (err) {
    return failure(err, "changePassword");
  }
  if (first) redirect("/");
  return { ok: "Parol almashtirildi. Boshqa qurilmalardagi sessiyalar yopildi." };
}
