# Admin panel — qisqa qo'llanma

Manzil: **https://admin.ravontravel.uz** · Til: o'zbekcha · Texnik tafsilotlar: `docs/DEPLOY.md` → "Admin panel".

## Rollar

| Rol | Nima qila oladi |
|-----|-----------------|
| Egasi (owner) | hammasi + foydalanuvchilarni boshqarish |
| Administrator | bronlar, murojaatlar, turlar, blog, yo'nalishlar, savol-javob, rasmlar, sozlamalar, jurnal |
| Menejer | faqat bronlar va murojaatlar |

## Bo'limlar

- **Bosh sahifa** — bugungi va oylik tushum, ko'rib chiqilmagan to'lovlar, yangi murojaatlar, yaqin jo'nashlar.
  Sanasi tugagan turlar haqida ogohlantirish ham shu yerda.
- **Bronlar** — saytdan qilingan har bir bron. Bron sahifasida: mijoz telefoni va ismlari, Click tranzaksiyalari,
  "Ko'rib chiqildi" belgisi, ichki izoh, mijozga yuboriladigan to'lov havolasi, chekni tekshirish havolasi.
  - *Bekor qilish* — faqat to'lanmagan bron. Mijoz Click'da to'lovni boshlagan bo'lsa, Click uni bekor qiladi.
  - *Pul qaytarildi* — Click kabinetida pul qaytarilgandan keyin belgilang: chek QR'i endi "haqiqiy emas", o'rinlar qaytadi.
  - *Click orqali qaytarish* — pulni panelning o'zidan qaytaradi (faqat joriy oy to'lovlari, bekor qilib bo'lmaydi).
  - "To'landi" holatini qo'lda qo'yib bo'lmaydi — uni faqat Click tasdiqlaydi.
- **Murojaatlar** — aloqa formasi, tur so'rovlari, bronlar. Holat: Yangi → Ishlanmoqda → Yakunlandi (yoki Spam) + izoh.
- **Turlar** — nom, tavsif, rasm, narx, sanalar va bo'sh o'rinlar, dastur (kunlar), narxga kiradi/kirmaydi, galereya.
  "Saytda ko'rinadi" belgisi olib tashlansa tur saytdan yashiriladi (eski bronlar ishlayveradi).
  O'rinlar to'lov tasdiqlanganda avtomatik kamayadi.
- **Yo'nalishlar** — mamlakatlar (rasm, bosh sahifada ko'rsatish) va tur toifalari.
- **Blog**, **Savol-javob** — uch tilda. Ruscha/inglizcha bo'sh qolsa saytda o'zbekchasi chiqadi.
- **Rasmlar** — JPEG/PNG/WebP, 10 MB gacha; avtomatik siqiladi. Saytda ishlatilayotgan rasmni o'chirib bo'lmaydi.
- **Sozlamalar** — telefon, email, manzil, rekvizitlar, litsenziya, jamoa, ijtimoiy tarmoqlar, xarita.
- **Foydalanuvchilar** (faqat egasi) — xodim qo'shish (vaqtinchalik parol bir marta ko'rsatiladi), rol, bloklash,
  parolni tiklash, barcha qurilmalardan chiqarish.
- **Harakatlar jurnali** — kim, qachon, nima o'zgartirgani.

Barcha o'zgarishlar saytda **darhol** ko'rinadi (qayta deploy kerak emas).
