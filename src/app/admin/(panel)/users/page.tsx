import type { Metadata } from "next";
import { requirePage } from "@/lib/admin/guard";
import { listUsers, ROLE_LABEL, type Role } from "@/lib/admin/users";
import { ActionForm } from "../../_ui/ActionForm";
import { Badge, PageHead, fmtDateTime } from "../../_ui/ui";
import { createUser, updateUser } from "./actions";

export const metadata: Metadata = { title: "Foydalanuvchilar" };

const ROLE_HINT: Record<Role, string> = {
  owner: "hammasi, shu jumladan foydalanuvchilar",
  admin: "bronlar, kontent, sozlamalar",
  manager: "faqat bronlar va murojaatlar",
};

function RoleSelect({ value }: { value?: Role }) {
  return (
    <select className="select" name="role" defaultValue={value ?? "manager"}>
      {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
        <option key={r} value={r}>
          {ROLE_LABEL[r]} — {ROLE_HINT[r]}
        </option>
      ))}
    </select>
  );
}

export default async function UsersPage() {
  const me = await requirePage("owner");
  const users = await listUsers();
  return (
    <>
      <PageHead title="Foydalanuvchilar" description="Panelga kira oladigan xodimlar va ularning huquqlari." />
      <div className="grid-main">
        <div className="stack">
          {users.map((u) => (
            <section key={u.id} className="card card-pad stack" style={{ gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                <div>
                  <strong style={{ color: "var(--ink)" }}>{u.name}</strong> <span className="muted mono">{u.username}</span>{" "}
                  {u.id === me.id && <Badge tone="info">siz</Badge>} {u.disabled && <Badge tone="danger">bloklangan</Badge>}{" "}
                  {u.mustChangePassword && <Badge tone="warn">parolni almashtirishi kerak</Badge>}
                  <div className="muted" style={{ fontSize: 12.5 }}>
                    Oxirgi kirish: {fmtDateTime(u.lastLoginAt)} · yaratilgan {fmtDateTime(u.createdAt)}
                  </div>
                </div>
                <Badge tone={u.role === "owner" ? "success" : "neutral"}>{ROLE_LABEL[u.role]}</Badge>
              </div>
              <ActionForm action={updateUser} submit="Saqlash" tone="plain" inline>
                <input type="hidden" name="id" value={u.id} />
                <input type="hidden" name="op" value="role" />
                <input className="input" name="name" defaultValue={u.name} aria-label="Ism" style={{ width: 200 }} />
                <RoleSelect value={u.role} />
              </ActionForm>
              {u.id !== me.id && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-start" }}>
                  <ActionForm action={updateUser} submit="Parolni tiklash" tone="plain" inline>
                    <input type="hidden" name="id" value={u.id} />
                    <input type="hidden" name="op" value="reset" />
                  </ActionForm>
                  <ActionForm action={updateUser} submit="Barcha qurilmalardan chiqarish" tone="plain" inline>
                    <input type="hidden" name="id" value={u.id} />
                    <input type="hidden" name="op" value="logout" />
                  </ActionForm>
                  <ActionForm action={updateUser} submit={u.disabled ? "Blokdan chiqarish" : "Bloklash"} tone={u.disabled ? "plain" : "danger"} inline>
                    <input type="hidden" name="id" value={u.id} />
                    <input type="hidden" name="op" value={u.disabled ? "enable" : "disable"} />
                  </ActionForm>
                  <details>
                    <summary className="btn sm danger">O&apos;chirish…</summary>
                    <div style={{ marginTop: 8 }}>
                      <ActionForm action={updateUser} submit="Butunlay o'chirish" tone="danger" confirmText={u.username}>
                        <input type="hidden" name="id" value={u.id} />
                        <input type="hidden" name="op" value="delete" />
                      </ActionForm>
                    </div>
                  </details>
                </div>
              )}
            </section>
          ))}
        </div>
        <section className="card card-pad">
          <h2 style={{ fontSize: 15, marginBottom: 12 }}>Yangi foydalanuvchi</h2>
          <ActionForm action={createUser} submit="Yaratish">
            <label className="field">
              <span>Ism</span>
              <input className="input" name="name" required maxLength={80} />
            </label>
            <label className="field">
              <span>Login</span>
              <input className="input mono" name="username" required pattern="[a-z0-9][a-z0-9._-]{2,31}" maxLength={32} />
              <small>kichik lotin harflari, raqam, . _ -</small>
            </label>
            <label className="field">
              <span>Rol</span>
              <RoleSelect />
            </label>
            <small className="hint">Vaqtinchalik parol yaratiladi va bir marta ko&apos;rsatiladi — xodimga xavfsiz yo&apos;l bilan yuboring.</small>
          </ActionForm>
        </section>
      </div>
    </>
  );
}
