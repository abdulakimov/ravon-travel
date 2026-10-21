"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { audit } from "@/lib/admin/audit";
import { currentUser } from "@/lib/admin/guard";
import { SESSION_COOKIE } from "@/lib/admin/session";
import { updateUsers } from "@/lib/admin/users";

export async function logout() {
  const user = await currentUser();
  (await cookies()).delete(SESSION_COOKIE);
  if (user) {
    // Sessiya serverda ham bekor qilinadi: cookie nusxasi (o'g'irlangan bo'lsa ham) endi ishlamaydi.
    await updateUsers((users) => {
      const u = users.find((x) => x.id === user.id);
      if (u) u.sessionVersion += 1;
    }).catch((err) => console.error(JSON.stringify({ event: "logout_revoke_failed", error: String(err) })));
    await audit(user, "logout");
  }
  redirect("/login");
}
