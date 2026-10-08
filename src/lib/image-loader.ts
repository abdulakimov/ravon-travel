// next/image uchun loader: build vaqtida tayyorlangan WebP fayllarga yo'naltiradi
// (scripts/optimize-images.mjs). Serverda ish vaqtida rasm qayta ishlanmaydi.
const WIDTHS = [384, 640, 828, 1200]; // scripts/optimize-images.mjs bilan bir xil

export default function imageLoader({ src, width }: { src: string; width: number }): string {
  const match = /^\/img\/([^/]+)\.(?:jpe?g|png)$/i.exec(src);
  if (!match) return src; // boshqa manbalar (SVG, tashqi URL) o'zgarishsiz
  const w = WIDTHS.find((x) => x >= width) ?? WIDTHS[WIDTHS.length - 1];
  return `/img/opt/${match[1]}-${w}.webp`;
}
