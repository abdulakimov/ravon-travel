"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { audit } from "@/lib/admin/audit";
import { isAdminHost } from "@/lib/admin/guard";
import { clearLoginFailures, loginBlocked, recordLoginFailure, withPasswordSlot } from "@/lib/admin/ratelimit";
import { encodeSession, SESSION_COOKIE, SESSION_TTL_MS, sessionCookieOptions } from "@/lib/admin/session";
import { findByUsername, updateUsers, USERNAME_RE, verifyPassword } from "@/lib/admin/users";

export interface LoginState {
  error?: string;
  /** Forma qayta tiklanganda login maydoni bo'shab qolmasin */
  username?: string;
}

// Mavjud bo'lmagan foydalanuvchi uchun ham bir xil vaqt sarflansin (nomlarni taxmin qilib bo'lmasin).
const DUMMY_HASH = "scrypt$32768$8$1$AAAAAAAAAAAAAAAAAAAAAA$" + "A".repeat(86);

export async function login(_prev: LoginState, form: FormData): Promise<LoginState> {
  const h = await headers();
  if (!isAdminHost(h.get("host"))) return { error: "Noto'g'ri manzil." };
  const username = String(form.get("username") ?? "").trim().toLowerCase().slice(0, 64);
  const password = String(form.get("password") ?? "").slice(0, 200);
  const ip = h.get("x-real-ip") ?? "local";
  const keys = [`ip:${ip}`, `iu:${ip}:${username}`];

  if (loginBlocked(keys)) return { error: "Juda ko'p urinish. 15 daqiqadan keyin qayta urinib ko'ring.", username };
  if (!username || !password) return { error: "Login va parolni kiriting.", username };

  // Urinish tekshiruvdan OLDIN hisobga olinadi — parallel so'rovlar chegarani chetlab o'tolmaydi.
  recordLoginFailure(keys);
  const user = await findByUsername(username);
  const ok = await withPasswordSlot(() => verifyPassword(password, user?.passwordHash ?? DUMMY_HASH));
  if (ok === "busy") return { error: "Server band. Bir necha soniyadan keyin qayta urinib ko'ring.", username };
  if (!user || !ok || user.disabled) {
    // Login maydoniga parol yozib yuborilgan bo'lishi mumkin — faqat to'g'ri ko'rinishdagi loginlar jurnalga yoziladi.
    await audit(USERNAME_RE.test(username) ? username : "?", "login_failed");
    return { error: "Login yoki parol noto'g'ri.", username };
  }

  clearLoginFailures(keys);
  await updateUsers((users) => {
    const u = users.find((x) => x.id === user.id);
    if (u) u.lastLoginAt = Date.now();
  });
  (await cookies()).set(
    SESSION_COOKIE,
    encodeSession({ uid: user.id, ver: user.sessionVersion, exp: Date.now() + SESSION_TTL_MS }),
    sessionCookieOptions(SESSION_TTL_MS / 1000),
  );
  await audit(user, "login");
  redirect(user.mustChangePassword ? "/account?first=1" : "/");
}
