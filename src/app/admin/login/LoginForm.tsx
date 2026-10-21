"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  return (
    <form action={action} className="form" style={{ marginTop: 18 }}>
      {state.error && (
        <p className="alert error" role="alert">
          {state.error}
        </p>
      )}
      <label className="field">
        <span>Login</span>
        <input className="input" name="username" autoComplete="username" required autoFocus maxLength={64} defaultValue={state.username} key={state.username ?? ""} />
      </label>
      <label className="field">
        <span>Parol</span>
        <input className="input" name="password" type="password" autoComplete="current-password" required maxLength={200} />
      </label>
      <button className="btn primary" type="submit" disabled={pending} aria-busy={pending || undefined}>
        {pending ? "Tekshirilmoqda…" : "Kirish"}
      </button>
    </form>
  );
}
