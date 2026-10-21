"use server";

import { randomBytes } from "node:crypto";
import { refresh } from "next/cache";
import { failure, type ActionState } from "@/lib/admin/action-state";
import { audit } from "@/lib/admin/audit";
import { UserError } from "@/lib/admin/errors";
import { requireAction } from "@/lib/admin/guard";
import { hashPassword, ROLE_LABEL, USERNAME_RE, updateUsers, type Role } from "@/lib/admin/users";

/** Vaqtinchalik parol: 14 belgi, harf+raqam (birinchi kirishda almashtirish majburiy). */
const tempPassword = () => `${randomBytes(9).toString("base64url").replace(/[-_]/g, "x")}7k`;
const role = (v: FormDataEntryValue | null): Role => {
  const r = String(v ?? "");
  if (!Object.hasOwn(ROLE_LABEL, r)) throw new UserError("Noto'g'ri rol.");
  return r as Role;
};

export async function createUser(_p: ActionState, form: FormData): Promise<ActionState> {
  try {
    const me = await requireAction("owner");
    const username = String(form.get("username") ?? "").trim().toLowerCase();
    const name = String(form.get("name") ?? "").trim().slice(0, 80);
    if (!USERNAME_RE.test(username)) throw new UserError("Login: 3–32 belgi, kichik lotin harflari, raqam, . _ -");
    if (!name) throw new UserError("Ismni kiriting.");
    const r = role(form.get("role"));
    const password = tempPassword();
    const passwordHash = await hashPassword(password);
    await updateUsers((users) => {
      if (users.some((u) => u.username === username)) throw new UserError("Bu login band.");
      users.push({
        id: randomBytes(8).toString("hex"),
        username,
        name,
        role: r,
        passwordHash,
        sessionVersion: 1,
        mustChangePassword: true,
        disabled: false,
        createdAt: Date.now(),
      });
    });
    await audit(me, "user_create", username, r);
    refresh();
    return { ok: `Foydalanuvchi yaratildi. Vaqtinchalik parol (faqat hozir ko'rinadi): ${password}` };
  } catch (err) {
    return failure(err, "createUser");
  }
}

export async function updateUser(_p: ActionState, form: FormData): Promise<ActionState> {
  try {
    const me = await requireAction("owner");
    const id = String(form.get("id") ?? "");
    const op = String(form.get("op") ?? "");
    let extra = "";
    let target = "";
    const hash = op === "reset" ? await hashPassword((extra = tempPassword())) : "";
    await updateUsers((users) => {
      const u = users.find((x) => x.id === id);
      if (!u) throw new UserError("Foydalanuvchi topilmadi.");
      target = u.username;
      if (op === "role") {
        u.role = role(form.get("role"));
        u.name = String(form.get("name") ?? u.name).trim().slice(0, 80) || u.name;
      } else if (op === "disable") {
        if (u.id === me.id) throw new UserError("O'zingizni bloklay olmaysiz.");
        u.disabled = true;
        u.sessionVersion += 1;
      } else if (op === "enable") {
        u.disabled = false;
      } else if (op === "reset") {
        if (u.id === me.id) throw new UserError("O'z parolingizni «Mening hisobim» sahifasida almashtiring.");
        u.passwordHash = hash;
        u.mustChangePassword = true;
        u.sessionVersion += 1;
      } else if (op === "logout") {
        u.sessionVersion += 1;
      } else if (op === "delete") {
        if (u.id === me.id) throw new UserError("O'zingizni o'chira olmaysiz.");
        if (form.get("confirm") !== u.username) throw new UserError("Tasdiqlash uchun loginni aynan yozing.");
        users.splice(users.indexOf(u), 1);
      } else throw new UserError("Noma'lum amal.");
    });
    await audit(me, `user_${op}`, target);
    refresh();
    if (op === "reset") return { ok: `Yangi vaqtinchalik parol (faqat hozir ko'rinadi): ${extra}` };
    return { ok: "Saqlandi." };
  } catch (err) {
    return failure(err, "updateUser");
  }
}
