import type { Metadata } from "next";
import { readAudit } from "@/lib/admin/audit";
import { requirePage } from "@/lib/admin/guard";
import { Empty, PageHead, fmtDateTime } from "../../_ui/ui";

export const metadata: Metadata = { title: "Harakatlar jurnali" };

const ACTION_LABEL: Record<string, string> = {
  login: "Kirdi",
  login_failed: "Kirish muvaffaqiyatsiz",
  logout: "Chiqdi",
  password_changed: "Parolni almashtirdi",
  order_handled: "Bron: ko'rib chiqildi",
  order_unhandled: "Bron: belgi olib tashlandi",
  order_note: "Bron: izoh",
  order_cancel: "Bron: bekor qilindi",
  order_refunded: "Bron: pul qaytarildi",
  click_status: "Click: holat so'raldi",
  click_reversal: "Click: pul qaytarish",
  lead_update: "Murojaat yangilandi",
  tour_create: "Tur yaratildi",
  tour_update: "Tur o'zgartirildi",
  tour_delete: "Tur o'chirildi",
  tour_duplicate: "Tur nusxalandi",
  taxonomy_update: "Yo'nalishlar o'zgartirildi",
  post_create: "Maqola yaratildi",
  post_update: "Maqola o'zgartirildi",
  post_delete: "Maqola o'chirildi",
  faq_update: "Savol-javob o'zgartirildi",
  settings_update: "Sozlamalar o'zgartirildi",
  media_upload: "Rasm yuklandi",
  media_delete: "Rasm o'chirildi",
  user_create: "Foydalanuvchi yaratildi",
  user_role: "Foydalanuvchi o'zgartirildi",
  user_disable: "Foydalanuvchi bloklandi",
  user_enable: "Foydalanuvchi blokdan chiqarildi",
  user_reset: "Parol tiklandi",
  user_logout: "Sessiyalar yopildi",
  user_delete: "Foydalanuvchi o'chirildi",
};

export default async function AuditPage() {
  await requirePage("admin");
  const entries = await readAudit(400);
  return (
    <>
      <PageHead title="Harakatlar jurnali" description="Panelda kim, qachon va nima qilgani (oxirgi 400 ta yozuv)." />
      <div className="card table-wrap">
        {entries.length === 0 ? (
          <Empty>Yozuv yo&apos;q.</Empty>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Vaqt</th>
                <th>Foydalanuvchi</th>
                <th>Amal</th>
                <th>Obyekt</th>
                <th>Tafsilot</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => (
                <tr key={i}>
                  <td className="nowrap">{fmtDateTime(e.at)}</td>
                  <td className="mono">{e.user}</td>
                  <td>{ACTION_LABEL[e.action] ?? e.action}</td>
                  <td className="mono">{e.target ?? "—"}</td>
                  <td className="muted">{e.detail ?? ""}</td>
                  <td className="mono muted">{e.ip ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
