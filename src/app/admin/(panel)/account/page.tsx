import type { Metadata } from "next";
import { requirePage } from "@/lib/admin/guard";
import { ROLE_LABEL } from "@/lib/admin/users";
import { ActionForm } from "../../_ui/ActionForm";
import { PageHead, fmtDateTime } from "../../_ui/ui";
import { changePassword } from "./actions";

export const metadata: Metadata = { title: "Mening hisobim" };

export default async function AccountPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requirePage("manager", { allowMustChange: true });
  const first = (await searchParams).first === "1" || user.mustChangePassword;
  return (
    <>
      <PageHead title="Mening hisobim" description={`${user.name} · ${user.username} · ${ROLE_LABEL[user.role]}`} />
      <div className="grid-2">
        <section className="card card-pad">
          {first && (
            <p className="alert warn" style={{ marginTop: 0 }}>
              Xavfsizlik uchun boshlang&apos;ich parolni o&apos;zingizning parolingizga almashtiring.
            </p>
          )}
          <ActionForm action={changePassword} submit="Parolni almashtirish">
            <label className="field">
              <span>Joriy parol</span>
              <input className="input" type="password" name="current" autoComplete="current-password" required maxLength={200} />
            </label>
            <label className="field">
              <span>Yangi parol</span>
              <input className="input" type="password" name="next" autoComplete="new-password" required minLength={10} maxLength={200} />
              <small>Kamida 10 belgi, harf va raqam bo&apos;lsin.</small>
            </label>
            <label className="field">
              <span>Yangi parol (takror)</span>
              <input className="input" type="password" name="repeat" autoComplete="new-password" required minLength={10} maxLength={200} />
            </label>
          </ActionForm>
        </section>
        <section className="card card-pad">
          <dl className="kv">
            <dt>Oxirgi kirish</dt>
            <dd>{fmtDateTime(user.lastLoginAt)}</dd>
            <dt>Yaratilgan</dt>
            <dd>{fmtDateTime(user.createdAt)}</dd>
          </dl>
        </section>
      </div>
    </>
  );
}
