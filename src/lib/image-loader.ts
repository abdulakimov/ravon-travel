// next/image uchun loader: oldindan tayyorlangan WebP fayllarga yo'naltiradi. Serverda ish vaqtida rasm
// qayta ishlanmaydi (/_next/image ishlatilmaydi).
//   /img/<nom>.jpg   → build vaqtida (scripts/optimize-images.mjs) → /img/opt/<nom>-<w>.webp
//   /media/<id>.jpg  → admin panelda yuklanganda (src/lib/media.ts)  → /media/opt/<id>-<w>.webp
import { IMAGE_WIDTHS as WIDTHS } from "./image-widths";

export default function imageLoader({ src, width }: { src: string; width: number }): string {
  const w = WIDTHS.find((x) => x >= width) ?? WIDTHS[WIDTHS.length - 1];
  const local = /^\/img\/([^/]+)\.(?:jpe?g|png)$/i.exec(src);
  if (local) return `/img/opt/${local[1]}-${w}.webp`;
  const media = /^\/media\/(\d{8}-[0-9a-f]{8})\.jpg$/.exec(src);
  if (media) return `/media/opt/${media[1]}-${w}.webp`;
  return src; // boshqa manbalar (SVG, tashqi URL) o'zgarishsiz
}
