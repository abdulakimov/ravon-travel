// Build vaqtida public/img/*.jpg dan tayyor WebP variantlarini yaratadi → public/img/opt/<nom>-<kenglik>.webp
// Sabab: ish vaqtidagi next/image optimizatsiyasi ulashilgan serverda (1 CPU limiti) har bir rasm
// uchun 2–9 soniya olardi va kesh har deploy'da tozalanardi. Endi serverda rasm qayta ishlanmaydi.
// Kengliklar src/lib/image-loader.ts va next.config.ts dagi ro'yxat bilan BIR XIL bo'lishi shart.
import { mkdir, readdir, stat } from "node:fs/promises";
import { join, parse } from "node:path";
import sharp from "sharp";

export const WIDTHS = [384, 640, 828, 1200]; // src/lib/image-widths.ts bilan bir xil
const SRC = "public/img";
const OUT = "public/img/opt";

await mkdir(OUT, { recursive: true });
let made = 0;
let bytes = 0;
for (const file of await readdir(SRC)) {
  if (!/\.(jpe?g|png)$/i.test(file)) continue;
  const { name } = parse(file);
  for (const width of WIDTHS) {
    const out = join(OUT, `${name}-${width}.webp`);
    // withoutEnlargement: manba kichik bo'lsa kattalashtirilmaydi, lekin fayl baribir yaratiladi
    // Shovqinli/batafsil fotolar juda og'ir chiqsa (>220 KB) — sifat pasaytirib qayta kodlanadi.
    let info;
    for (const quality of [72, 60, 48]) {
      info = await sharp(join(SRC, file))
        .rotate()
        .resize({ width, withoutEnlargement: true })
        .webp({ quality, effort: 5 })
        .toFile(out);
      if (info.size <= 220 * 1024) break;
    }
    made += 1;
    bytes += info.size;
  }
}
const total = (await Promise.all((await readdir(OUT)).map((f) => stat(join(OUT, f))))).reduce((a, s) => a + s.size, 0);
console.log(`optimize-images: ${made} files, ${(bytes / 1024).toFixed(0)} KB written (${(total / 1024).toFixed(0)} KB in ${OUT})`);
