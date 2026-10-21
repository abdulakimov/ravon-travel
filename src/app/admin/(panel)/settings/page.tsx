import type { Metadata } from "next";
import { requirePage } from "@/lib/admin/guard";
import { getSettings } from "@/lib/content";
import { ActionForm } from "../../_ui/ActionForm";
import { PageHead } from "../../_ui/ui";
import { saveSettings } from "./actions";

export const metadata: Metadata = { title: "Sozlamalar" };

function F({ name, label, value, hint, type = "text" }: { name: string; label: string; value: string | null; hint?: string; type?: string }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input className="input" name={name} type={type} defaultValue={value ?? ""} />
      {hint && <small>{hint}</small>}
    </label>
  );
}

export default async function SettingsPage() {
  await requirePage("admin");
  const s = await getSettings();
  return (
    <>
      <PageHead
        title="Sozlamalar"
        description="Kompaniya rekvizitlari, aloqa va litsenziya. Bo'sh qoldirilgan maydon saytda «Rasmiylashtirilmoqda» yoki yashirin bo'ladi."
      />
      <ActionForm action={saveSettings} submit="Saqlash" className="stack">
        <div className="grid-2">
          <fieldset className="group card">
            <legend>Aloqa</legend>
            <F name="phone" label="Telefon" value={s.phone} hint="+998 90 123 45 67" />
            <F name="email" label="Email *" value={s.email} type="email" />
            <F name="postalAddress" label="Pochta manzili" value={s.postalAddress} />
            <F name="mapEmbedUrl" label="Xarita (embed havola)" value={s.mapEmbedUrl} hint="Google Maps → Ulashish → Xaritani joylash → src=… havolasi" />
          </fieldset>
          <fieldset className="group card">
            <legend>Rekvizitlar</legend>
            <F name="legalName" label="Yuridik nom" value={s.legalName} hint="Masalan: «RAVON TRAVEL» MCHJ — huquqiy hujjatlarda ishlatiladi" />
            <F name="stir" label="STIR (INN)" value={s.stir} />
            <F name="bankName" label="Bank" value={s.bankName} />
            <div className="row">
              <F name="bankAccount" label="Hisob raqami" value={s.bankAccount} />
              <F name="mfo" label="MFO" value={s.mfo} />
            </div>
          </fieldset>
          <fieldset className="group card">
            <legend>Litsenziya</legend>
            <F name="licenseNo" label="Litsenziya raqami" value={s.licenseNo} />
            <F name="licenseDate" label="Berilgan sana" value={s.licenseDate} />
            <F name="licenseAuthority" label="Bergan organ" value={s.licenseAuthority} />
          </fieldset>
          <fieldset className="group card">
            <legend>Jamoa</legend>
            <F name="team.director" label="Direktor" value={s.team.director} />
            <F name="team.manager" label="Menejer" value={s.team.manager} />
            <F name="team.specialist" label="Turlar bo'yicha mutaxassis" value={s.team.specialist} />
            <F name="team.accountant" label="Buxgalter" value={s.team.accountant} />
          </fieldset>
          <fieldset className="group card">
            <legend>Ijtimoiy tarmoqlar</legend>
            <F name="social.telegram" label="Telegram" value={s.social.telegram} hint="https://t.me/…" />
            <F name="social.instagram" label="Instagram" value={s.social.instagram} hint="https://instagram.com/…" />
            <F name="social.whatsapp" label="WhatsApp" value={s.social.whatsapp} hint="https://wa.me/998…" />
          </fieldset>
        </div>
      </ActionForm>
    </>
  );
}
