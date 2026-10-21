import Link from "next/link";

export default function AdminNotFound() {
  return (
    <div className="auth">
      <div className="auth-card">
        <h1>Sahifa topilmadi</h1>
        <p className="muted">Manzil noto&apos;g&apos;ri yoki yozuv o&apos;chirilgan.</p>
        <Link href="/" className="btn primary">
          Bosh sahifa
        </Link>
      </div>
    </div>
  );
}
