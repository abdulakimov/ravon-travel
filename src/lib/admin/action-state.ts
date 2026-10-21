import { unstable_rethrow } from "next/navigation";
import { ZodError } from "zod";
import { UserError } from "./errors";

/** Server Action natijasi (formaga qaytadi). */
export interface ActionState {
  ok?: string;
  error?: string;
  data?: unknown;
}

/**
 * Xatoni forma natijasiga aylantiradi: UserError — matni bilan, zod — birinchi muammo bilan,
 * qolgani — umumiy matn (tafsilot log'da). Next'ning redirect/notFound "xatolari" qayta otiladi.
 */
export function failure(err: unknown, context: string): ActionState {
  unstable_rethrow(err);
  if (err instanceof UserError) return { error: err.message };
  if (err instanceof ZodError) {
    const issue = err.issues[0];
    const where = issue?.path.length ? `${issue.path.join(".")}: ` : "";
    return { error: `Noto'g'ri qiymat — ${where}${issue?.message ?? ""}` };
  }
  console.error(JSON.stringify({ event: "admin_action_failed", context, error: String(err) }));
  return { error: "Kutilmagan xato. Qayta urinib ko'ring yoki administratorga xabar bering." };
}
