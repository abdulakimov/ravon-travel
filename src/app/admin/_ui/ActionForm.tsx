"use client";

import { startTransition, useActionState } from "react";
import type { ActionState } from "@/lib/admin/action-state";

/**
 * Server Action'ni chaqiradigan forma: natija (muvaffaqiyat/xato) forma ostida ko'rsatiladi.
 * `confirmText` berilsa — foydalanuvchi shu matnni (masalan bron raqamini) yozmaguncha tugma ishlamaydi.
 */
export function ActionForm({
  action,
  children,
  submit,
  tone = "primary",
  confirmText,
  confirmLabel,
  className = "form",
  inline = false,
}: {
  action: (prev: ActionState, form: FormData) => Promise<ActionState>;
  children?: React.ReactNode;
  submit: string;
  tone?: "primary" | "danger" | "plain";
  confirmText?: string;
  confirmLabel?: string;
  className?: string;
  inline?: boolean;
}) {
  const [state, run, pending] = useActionState<ActionState, FormData>(action, {});
  const btn = `btn ${tone === "plain" ? "" : tone} ${inline ? "sm" : ""}`;
  return (
    <form
      // onSubmit (form action emas): React formani avtomatik tozalamaydi — xato bo'lsa kiritilganlar saqlanadi
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => run(data));
      }}
      className={inline ? undefined : className} style={inline ? { display: "inline-flex", gap: 8, alignItems: "center", flexWrap: "wrap" } : undefined}>
      {children}
      {confirmText && (
        <label className="field">
          <span>{confirmLabel ?? `Tasdiqlash uchun "${confirmText}" deb yozing`}</span>
          <input className="input" name="confirm" autoComplete="off" required pattern={confirmText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} />
        </label>
      )}
      <div className={inline ? undefined : "form-foot"} style={inline ? { display: "contents" } : undefined}>
        <button type="submit" className={btn} disabled={pending} aria-busy={pending || undefined}>
          {pending ? "Bajarilmoqda…" : submit}
        </button>
        {state.ok && (
          <span className="alert success" role="status">
            {state.ok}
          </span>
        )}
        {state.error && (
          <span className="alert error" role="alert">
            {state.error}
          </span>
        )}
      </div>
      {state.data !== undefined && (
        <pre className="card card-pad mono" style={{ margin: 0, overflowX: "auto", fontSize: 12.5 }}>
          {JSON.stringify(state.data, null, 2)}
        </pre>
      )}
    </form>
  );
}
