"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { audit } from "@/lib/admin/audit";
import { currentUser } from "@/lib/admin/guard";
import { SESSION_COOKIE } from "@/lib/admin/session";

export async function logout() {
  const user = await currentUser();
  (await cookies()).delete(SESSION_COOKIE);
  if (user) await audit(user, "logout");
  redirect("/login");
}
