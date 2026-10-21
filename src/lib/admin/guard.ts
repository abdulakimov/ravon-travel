import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { UserError } from "./errors";
import { decodeSession, SESSION_COOKIE } from "./session";
import { findUser, roleAtLeast, type AdminUser, type Role } from "./users";

// Har bir admin sahifasi, Server Action va route handler SHU yerdan o'tadi (proxy.ts dagi yo'naltirish
// xavfsizlik chegarasi emas). Tekshiruv: 1) so'rov admin host'idan, 2) imzolangan sessiya, 3) foydalanuvchi
// faol va sessiya versiyasi mos, 4) rol yetarli.

/** `admin.` bilan boshlanadigan host (admin.ravontravel.uz; lokal: admin.localhost:3100). */
export function isAdminHost(host: string | null | undefined): boolean {
  return Boolean(host && host.toLowerCase().split(":")[0].startsWith("admin."));
}

/** nginx `Host $host` ni o'zi qo'yadi; X-Forwarded-Host'ga ishonilmaydi (mijoz soxtalashtirishi mumkin). */
export async function requestHost(): Promise<string | null> {
  return (await headers()).get("host");
}

export async function currentUser(): Promise<AdminUser | null> {
  if (!isAdminHost(await requestHost())) return null;
  const session = decodeSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) return null;
  const user = await findUser(session.uid);
  if (!user || user.disabled || user.sessionVersion !== session.ver) return null;
  return user;
}

/**
 * Sahifalar uchun. Admin host bo'lmasa — 404; kirmagan — /login; parolni almashtirishi shart — /account.
 * Rol yetmasa — bosh sahifaga.
 */
export async function requirePage(min: Role = "manager", opts: { allowMustChange?: boolean } = {}): Promise<AdminUser> {
  if (!isAdminHost(await requestHost())) notFound();
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.mustChangePassword && !opts.allowMustChange) redirect("/account?first=1");
  if (!roleAtLeast(user.role, min)) redirect("/");
  return user;
}

export class AdminAuthError extends UserError {}

/** Server Action va route handler'lar uchun: xato tashlaydi (redirect emas). */
export async function requireAction(min: Role = "manager", opts: { allowMustChange?: boolean } = {}): Promise<AdminUser> {
  const user = await currentUser();
  if (!user) throw new AdminAuthError("Sessiya tugagan. Qaytadan kiring.");
  if (user.mustChangePassword && !opts.allowMustChange) throw new AdminAuthError("Avval parolni almashtiring.");
  if (!roleAtLeast(user.role, min)) throw new AdminAuthError("Bu amal uchun ruxsat yo'q.");
  return user;
}
