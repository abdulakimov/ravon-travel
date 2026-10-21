"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { RotateCw } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Icon } from "@/components/Icon";
import { Rule } from "@/components/Brand";

// Client xatosi (masalan deploy'dan keyin eski tab'dagi ChunkLoadError) uchun lokalizatsiya qilingan sahifa.
export default function ErrorPage({ error }: { error: Error & { digest?: string } }) {
  const t = useTranslations("common");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container section" style={{ textAlign: "center", maxWidth: 640 }}>
      <Rule />
      <h1 style={{ fontSize: "var(--text-page-h1)", margin: "18px 0 14px" }}>{t("error.title")}</h1>
      <p style={{ color: "var(--text-3)", marginBottom: 28 }}>{t("error.text")}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
        <button type="button" className="btn btn--primary" onClick={() => window.location.reload()}>
          <Icon icon={RotateCw} size={16} />
          {t("error.retry")}
        </button>
        <Link href="/contact" className="btn btn--secondary">
          {t("nav.contact")}
        </Link>
      </div>
    </div>
  );
}
