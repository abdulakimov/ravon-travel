import { randomBytes, scrypt as scryptCb, timingSafeEqual, type ScryptOptions } from "node:crypto";
import { join } from "node:path";
import { ADMIN_DIR, readJson, withDataLock, writeJson } from "../fsdb";

// Admin foydalanuvchilari: /data/admin/users.json. Parol — scrypt (N=2^15, r=8, p=1), tuz 16 bayt.
// Birinchi ishga tushishda foydalanuvchi yo'q bo'lsa — `ADMIN_INITIAL_PASSWORD` (serverdagi .env) bilan
// "admin" egasi yaratiladi va birinchi kirishda parolni almashtirish MAJBURIY.

export type Role = "owner" | "admin" | "manager";

/** Rollar: owner — hammasi (foydalanuvchilar ham); admin — hammasi, foydalanuvchilardan tashqari; manager — bron/murojaatlar. */
export const ROLE_LABEL: Record<Role, string> = { owner: "Egasi", admin: "Administrator", manager: "Menejer" };
const RANK: Record<Role, number> = { manager: 1, admin: 2, owner: 3 };
export const roleAtLeast = (role: Role, min: Role) => RANK[role] >= RANK[min];

export interface AdminUser {
  id: string;
  username: string;
  name: string;
  role: Role;
  passwordHash: string;
  /** Oshirilsa — foydalanuvchining barcha sessiyalari bekor bo'ladi (parol almashganda, chiqib ketishda). */
  sessionVersion: number;
  mustChangePassword: boolean;
  disabled: boolean;
  createdAt: number;
  lastLoginAt?: number;
}

export type PublicUser = Omit<AdminUser, "passwordHash">;
export function toPublic(user: AdminUser): PublicUser {
  const u: Partial<AdminUser> = { ...user };
  delete u.passwordHash;
  return u as PublicUser;
}

const FILE = () => join(ADMIN_DIR, "users.json");
const N = 1 << 15;
const SCRYPT: ScryptOptions = { N, r: 8, p: 1, maxmem: 128 * N * 8 * 2 };

function scrypt(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scryptCb(password.normalize("NFKC"), salt, 64, SCRYPT, (err, key) => (err ? reject(err) : resolve(key))),
  );
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt);
  return `scrypt$${N}$8$1$${salt.toString("base64url")}$${key.toString("base64url")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algo, n, r, p, salt, hash] = stored.split("$");
  if (algo !== "scrypt" || Number(n) !== N || r !== "8" || p !== "1" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64url");
  const key = await scrypt(password, Buffer.from(salt, "base64url"));
  return key.length === expected.length && timingSafeEqual(key, expected);
}

/** Parol siyosati: kamida 10 belgi, harf va raqam. Xato matni yoki null. */
export function passwordProblem(password: string): string | null {
  if (password.length < 10) return "Parol kamida 10 belgidan iborat bo'lsin.";
  if (password.length > 200) return "Parol juda uzun.";
  if (!/[A-Za-zА-Яа-яЁё]/.test(password) || !/\d/.test(password)) return "Parolda harf ham, raqam ham bo'lsin.";
  return null;
}

export const USERNAME_RE = /^[a-z0-9][a-z0-9._-]{2,31}$/;

interface UsersDoc {
  users: AdminUser[];
}

let bootstrapping: Promise<void> | null = null;

/** Foydalanuvchilar ro'yxati; bo'sh bo'lsa — .env dagi boshlang'ich parol bilan egasini yaratadi. */
export async function listUsers(): Promise<AdminUser[]> {
  const doc = await readJson<UsersDoc>(FILE());
  if (doc?.users.length) return doc.users;
  const initial = process.env.ADMIN_INITIAL_PASSWORD;
  if (!initial) return [];
  bootstrapping ??= withDataLock(async () => {
    const again = await readJson<UsersDoc>(FILE());
    if (again?.users.length) return;
    const owner: AdminUser = {
      id: randomBytes(8).toString("hex"),
      username: "admin",
      name: "Administrator",
      role: "owner",
      passwordHash: await hashPassword(initial),
      sessionVersion: 1,
      mustChangePassword: true,
      disabled: false,
      createdAt: Date.now(),
    };
    await writeJson(FILE(), { users: [owner] } satisfies UsersDoc);
    console.log(JSON.stringify({ event: "admin_bootstrap", username: owner.username }));
  }).finally(() => {
    bootstrapping = null;
  });
  await bootstrapping;
  return (await readJson<UsersDoc>(FILE()))?.users ?? [];
}

export async function findUser(id: string): Promise<AdminUser | undefined> {
  return (await listUsers()).find((u) => u.id === id);
}

export async function findByUsername(username: string): Promise<AdminUser | undefined> {
  const name = username.trim().toLowerCase();
  return (await listUsers()).find((u) => u.username === name);
}

/** Foydalanuvchilar hujjatini navbat ichida o'zgartiradi. `mutate` xato tashlasa — hech narsa yozilmaydi. */
export async function updateUsers<R>(mutate: (users: AdminUser[]) => R | Promise<R>): Promise<R> {
  await listUsers(); // bootstrap tugagan bo'lsin
  return withDataLock(async () => {
    const doc = structuredClone((await readJson<UsersDoc>(FILE())) ?? { users: [] });
    const result = await mutate(doc.users);
    if (!doc.users.some((u) => u.role === "owner" && !u.disabled)) throw new Error("Kamida bitta faol egasi qolishi kerak.");
    await writeJson(FILE(), doc);
    return result;
  });
}
