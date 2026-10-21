import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { currentUser, isAdminHost, requestHost } from "@/lib/admin/guard";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Kirish" };

export default async function LoginPage() {
  if (!isAdminHost(await requestHost())) notFound();
  if (await currentUser()) redirect("/");
  return (
    <main className="auth">
      <div className="auth-card">
        {/* eslint-disable-next-line @next/next/no-img-element -- SVG logo */}
        <img src="/brand/ravon-horizontal-on-light.svg" alt="Ravon Travel" height={40} style={{ height: 40, width: "auto" }} />
        <h1>Boshqaruv paneli</h1>
        <p className="muted" style={{ margin: 0 }}>
          Davom etish uchun tizimga kiring.
        </p>
        <LoginForm />
      </div>
    </main>
  );
}
