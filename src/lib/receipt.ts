import QRCode from "qrcode";
import { site } from "@/config/site";

// Chek haqiqiyligini tekshirish: QR → /<locale>/verify?id=<bron>&c=<kod>. Faqat serverda (qrcode client bundle'ga tushmaydi).

export function verifyUrl(locale: string, id: string, code: string): string {
  const params = new URLSearchParams({ id, c: code });
  return `${site.url}/${locale}/verify?${params}`;
}

/** QR'ni SVG satr sifatida qaytaradi (o'lchamni CSS beradi). Kodning o'zi bizniki — XSS manbai emas. */
export async function qrSvg(url: string): Promise<string> {
  return QRCode.toString(url, { type: "svg", errorCorrectionLevel: "M", margin: 1, color: { dark: "#002f1a" /* = --ink */, light: "#ffffff" } });
}
