# Ravon Travel

Chiquvchi turizm bo'yicha turoperator sayti — <https://ravontravel.uz>. Uch tilda (uz / ru / en):
turlar katalogi, tur tafsiloti, onlayn bron (4 qadam), to'lov (demo rejim), biz haqimizda
(litsenziya · jamoa · rekvizitlar), aloqa, huquqiy hujjatlar, FAQ, blog.

- Loyiha qoidalari va tuzilma: [`CLAUDE.md`](CLAUDE.md)
- Dizayn spetsifikatsiyasi: [`design_handoff_ravon_travel/README.md`](design_handoff_ravon_travel/README.md)
- Texnik topshiriq (litsenziya talablari): [`design_handoff_ravon_travel/reference/TZ.md`](design_handoff_ravon_travel/reference/TZ.md)
- Deploy: [`docs/DEPLOY.md`](docs/DEPLOY.md)

## Ishga tushirish

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # unit testlar
npm run build      # production build
```

## Haqiqiy ma'lumotlarni kiritish

| Nima | Qayerda |
|---|---|
| Yuridik nom, STIR, manzil, telefon, bank, litsenziya, jamoa ismlari, ijtimoiy tarmoqlar, xarita | `src/config/site.ts` |
| Turlar, narxlar, jo'nash sanalari | `src/data/tours.ts`, `src/data/tour-details.ts` |
| Blog maqolalari | `src/data/blog.ts` |
| Huquqiy hujjatlar matni | `src/data/legal.ts` |
| Interfeys matnlari | `messages/<til>/<bo'lim>.json` |
| Fotolar | `public/img/` |

## Hali qilinmagan (backend kerak)

Real to'lov shlyuzi (Atmos/Payme/Click), bron bazasi va real vaqtdagi o'rin qoldig'i, email/SMS,
vaucher PDF, foydalanuvchi kabineti, admin panel — `CLAUDE.md` → "Hozirgi cheklovlar".
