import { notFound, redirect } from "next/navigation";
import { currentUser, isAdminHost, requestHost } from "@/lib/admin/guard";
import { ROLE_LABEL } from "@/lib/admin/users";
import { navCounts } from "@/lib/admin/stats";
import { Nav } from "../_ui/Nav";
import { logout } from "./actions";

// Panel qobig'i: yon menyu + ish maydoni. Kirish huquqi har bir sahifada ham alohida tekshiriladi.
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  if (!isAdminHost(await requestHost())) notFound();
  const user = await currentUser();
  if (!user) redirect("/login");
  const counts = await navCounts().catch(() => ({ orders: 0, leads: 0 }));

  return (
    <div className="shell">
      <Nav
        role={user.role}
        counts={counts}
        footer={
          <>
            <strong>{user.name}</strong>
            <span>
              {user.username} · {ROLE_LABEL[user.role]}
            </span>
            <form action={logout}>
              <button type="submit">Chiqish</button>
            </form>
          </>
        }
      />
      <main className="main" id="main">
        {children}
      </main>
    </div>
  );
}
