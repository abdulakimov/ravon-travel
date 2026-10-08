import type { L10n } from "./types";
import { REFUND_DAYS, cancellationTiers } from "./legal";

// Savol-javob (TZ §4.8 — 8 ta majburiy savol). Bekor qilish to'lovlari legal.ts dagi
// jadvaldan olinadi — FAQ va Bekor qilish siyosati bir-biriga zid bo'lib qolmaydi.

export interface FaqItem {
  id: string;
  question: L10n;
  answer: L10n[];
  list?: L10n[];
  link?: { href: "/tours" | "/contact" | "/privacy" | "/cancellation"; label: L10n };
}

const l = (uz: string, ru: string, en: string): L10n => ({ uz, ru, en });

export const faq: FaqItem[] = [
  {
    id: "bron",
    question: l("Qanday qilib turni bron qilaman?", "Как забронировать тур?", "How do I book a tour?"),
    answer: [
      l(
        "«Sanasi bor» belgili turlar saytning o'zida bron qilinadi: tur sahifasida «Bron qilish» tugmasini bosing, sanani va yo'lovchilar sonini tanlang, yo'lovchilar ma'lumotlarini pasportdagidek kiriting va karta bilan to'lang. To'lovdan so'ng bron raqami bilan tasdiq olasiz.",
        "Туры с пометкой «С датой» бронируются прямо на сайте: нажмите «Забронировать» на странице тура, выберите дату и число путешественников, укажите их данные как в паспорте и оплатите картой. После оплаты вы получите подтверждение с номером бронирования.",
        'Tours marked "Fixed departure" are booked right on the website: press "Book now" on the tour page, choose the date and number of travellers, enter their details as in their passports, and pay by card. After payment you receive a confirmation with a booking reference.',
      ),
      l(
        "«So'rov bo'yicha» turlar uchun tur sahifasidan so'rov qoldiring — mas'ul mutaxassis siz bilan bog'lanib, sana va narxni kelishib oladi.",
        "Для туров «По запросу» оставьте запрос на странице тура — ответственный специалист свяжется с вами и согласует даты и стоимость.",
        'For "On request" tours, send a request from the tour page — a specialist will contact you to agree the dates and the price.',
      ),
    ],
    link: { href: "/tours", label: l("Turlarni ko'rish", "Смотреть туры", "Browse tours") },
  },
  {
    id: "tolov",
    question: l("Qanday to'lov usullari mavjud?", "Какие способы оплаты доступны?", "What payment methods are available?"),
    answer: [
      l(
        "To'lov saytda bank kartasi orqali qabul qilinadi: Humo, Uzcard, Visa va Mastercard. To'lovni litsenziyalangan to'lov tashkiloti qayta ishlaydi va u SMS-kod bilan tasdiqlanadi.",
        "Оплата принимается на сайте банковской картой: Humo, Uzcard, Visa и Mastercard. Платёж обрабатывает лицензированная платёжная организация, он подтверждается SMS-кодом.",
        "We take payment on the website by bank card: Humo, Uzcard, Visa and Mastercard. The payment is processed by a licensed payment provider and confirmed with an SMS code.",
      ),
      l(
        "Narxlar AQSH dollarida ko'rsatiladi, to'lov esa so'mda — to'lov sahifasida ko'rsatilgan yakuniy summa bo'yicha amalga oshiriladi.",
        "Цены указаны в долларах США, а оплата производится в сумах — в размере итоговой суммы, показанной на странице оплаты.",
        "Prices are shown in US dollars, while payment is made in Uzbek soum for the final amount shown on the payment page.",
      ),
    ],
  },
  {
    id: "bekor-qilish",
    question: l(
      "Bron qilingan turni bekor qilsam bo'ladimi?",
      "Можно ли отменить забронированный тур?",
      "Can I cancel a tour I have booked?",
    ),
    answer: [
      l(
        "Ha, bronni istalgan vaqtda bekor qilishingiz mumkin. Ushlab qolinadigan summa sayohat boshlanishiga qancha vaqt qolganiga bog'liq:",
        "Да, бронирование можно отменить в любое время. Удерживаемая сумма зависит от того, сколько осталось до начала поездки:",
        "Yes, you can cancel a booking at any time. The fee depends on how long remains before the trip starts:",
      ),
    ],
    list: [
      ...cancellationTiers.map((tier) =>
        l(`${tier.period.uz} — ${tier.fee.uz}`, `${tier.period.ru} — ${tier.fee.ru}`, `${tier.period.en} — ${tier.fee.en}`),
      ),
      l(
        `Qaytariladigan summa ${REFUND_DAYS.min}–${REFUND_DAYS.max} ish kuni ichida to'lov qilingan kartaga o'tkaziladi. Tur biz tomondan bekor qilinsa — pul to'liq qaytariladi yoki boshqa tur taklif etiladi.`,
        `Сумма возврата перечисляется на карту, с которой была оплата, в течение ${REFUND_DAYS.min}–${REFUND_DAYS.max} рабочих дней. Если тур отменяем мы — возвращаем деньги полностью или предлагаем другой тур.`,
        `The refund is paid to the card you paid with within ${REFUND_DAYS.min}–${REFUND_DAYS.max} business days. If we cancel the tour, you get a full refund or the offer of another tour.`,
      ),
    ],
    link: {
      href: "/cancellation",
      label: l("Bekor qilish siyosati", "Политика отмены", "Cancellation policy"),
    },
  },
  {
    id: "viza",
    question: l("Viza olishda yordam berasizmi?", "Помогаете ли вы с визой?", "Do you help with visas?"),
    answer: [
      l(
        "Ha. Har bir tur sahifasida shu yo'nalish uchun viza kerak yoki kerak emasligi ko'rsatilgan. Viza talab qilinsa, mas'ul mutaxassis kerakli hujjatlar ro'yxatini beradi va ularni tayyorlash hamda topshirishda yordam beradi.",
        "Да. На странице каждого тура указано, нужна ли виза для этого направления. Если виза требуется, ответственный специалист даст список документов и поможет их подготовить и подать.",
        "Yes. Each tour page says whether a visa is needed for that destination. If one is required, your specialist gives you the list of documents and helps you prepare and submit them.",
      ),
      l(
        "Viza berish to'g'risidagi qarorni elchixona qabul qiladi, shuning uchun hujjatlarni oldindan topshirishni tavsiya qilamiz. Viza yig'imi, agar tur sahifasida boshqacha ko'rsatilmagan bo'lsa, alohida to'lanadi.",
        "Решение о выдаче визы принимает посольство, поэтому советуем подавать документы заранее. Визовый сбор оплачивается отдельно, если на странице тура не указано иное.",
        "The decision to issue a visa is made by the embassy, so we recommend applying well in advance. The visa fee is paid separately unless the tour page says otherwise.",
      ),
    ],
  },
  {
    id: "narx",
    question: l("Tur narxiga nima kiradi?", "Что входит в стоимость тура?", "What does the tour price include?"),
    answer: [
      l(
        "Har bir turning sahifasida «Narxga kiradi» va «Narxga kirmaydi» ro'yxatlari bor — aniq tarkib o'sha yerda. Odatda paketga dasturdagi aviaparvoz, mehmonxona, transfer va ekskursiyalar kiradi.",
        "На странице каждого тура есть списки «Включено» и «Не включено» — точный состав указан там. Обычно в пакет входят перелёт, отель, трансфер и экскурсии по программе.",
        'Every tour page has "Included" and "Not included" lists — that is where the exact content is. A package usually covers the flight, hotel, transfers and the excursions in the programme.',
      ),
      l(
        "Shaxsiy xarajatlar, dasturdan tashqari ekskursiyalar va sahifada sanab o'tilmagan xizmatlar alohida to'lanadi. Narx bir kishi uchun ko'rsatiladi va to'lovdan keyin o'zgarmaydi.",
        "Личные расходы, экскурсии вне программы и услуги, не перечисленные на странице, оплачиваются отдельно. Цена указана за одного человека и после оплаты не меняется.",
        "Personal expenses, excursions outside the programme and services not listed on the page are paid separately. The price is per person and does not change after you pay.",
      ),
    ],
  },
  {
    id: "individual",
    question: l("Individual marshrut tuzasizmi?", "Составляете ли вы индивидуальные маршруты?", "Do you build custom itineraries?"),
    answer: [
      l(
        "Ha. Aloqa sahifasida «Individual tur so'rovi» mavzusini tanlab, yo'nalish, sanalar, kishilar soni va taxminiy byudjetni yozing. Mas'ul mutaxassis marshrut va narxni tayyorlab, siz bilan bog'lanadi.",
        "Да. На странице контактов выберите тему «Запрос индивидуального тура» и укажите направление, даты, число человек и примерный бюджет. Ответственный специалист подготовит маршрут и стоимость и свяжется с вами.",
        'Yes. On the contact page choose the subject "Custom tour request" and tell us the destination, dates, number of people and approximate budget. A specialist will prepare an itinerary and a price and get back to you.',
      ),
      l(
        "Individual tur shartlari va narxi alohida shartnomada qayd etiladi.",
        "Условия и стоимость индивидуального тура фиксируются в отдельном договоре.",
        "The terms and price of a custom tour are set out in a separate contract.",
      ),
    ],
    link: { href: "/contact", label: l("So'rov yuborish", "Отправить запрос", "Send a request") },
  },
  {
    id: "xavfsizlik",
    question: l(
      "To'lov xavfsizmi? Karta ma'lumotlarim saqlanadimi?",
      "Безопасна ли оплата? Сохраняются ли данные моей карты?",
      "Is payment secure? Do you store my card details?",
    ),
    answer: [
      l(
        "Karta ma'lumotlari — raqami, amal qilish muddati, CVV kodi va SMS-kod — bizning serverimizga yuborilmaydi va bizda saqlanmaydi. Ular himoyalangan ulanish orqali to'g'ridan-to'g'ri litsenziyalangan to'lov tashkilotiga uzatiladi.",
        "Данные карты — номер, срок действия, код CVV и SMS-код — не передаются на наш сервер и не хранятся у нас. Они направляются по защищённому соединению напрямую лицензированной платёжной организации.",
        "Your card details — number, expiry date, CVV code and SMS code — are not sent to our server and are not stored by us. They go over a secure connection directly to a licensed payment provider.",
      ),
      l(
        "Biz faqat to'lov natijasini olamiz: holati, summasi va tranzaksiya raqami. Sayt himoyalangan HTTPS ulanishi orqali ishlaydi.",
        "Мы получаем только результат оплаты: статус, сумму и номер транзакции. Сайт работает по защищённому соединению HTTPS.",
        "We receive only the outcome of the payment: its status, amount and transaction number. The website runs over a secure HTTPS connection.",
      ),
    ],
    link: {
      href: "/privacy",
      label: l("Maxfiylik siyosati", "Политика конфиденциальности", "Privacy policy"),
    },
  },
  {
    id: "sugurta",
    question: l("Sug'urta kiradimi?", "Входит ли страховка?", "Is insurance included?"),
    answer: [
      l(
        "Bu turga bog'liq: sug'urta narxga kirsa, u tur sahifasidagi «Narxga kiradi» ro'yxatida ko'rsatiladi. Ro'yxatda bo'lmasa, mas'ul mutaxassis so'rovingiz bo'yicha sayohat sug'urtasini qo'shimcha haq evaziga rasmiylashtirib beradi.",
        "Это зависит от тура: если страховка входит в стоимость, она указана в списке «Включено» на странице тура. Если её там нет, ответственный специалист оформит туристическую страховку по вашему запросу за дополнительную плату.",
        'It depends on the tour: if insurance is part of the price, it appears in the "Included" list on the tour page. If it is not listed, your specialist can arrange travel insurance on request for an additional charge.',
      ),
      l(
        "Xorijga har qanday sayohat uchun tibbiy sug'urta bo'lishini tavsiya qilamiz; ayrim davlatlarga kirish uchun u majburiy.",
        "Мы рекомендуем иметь медицинскую страховку в любой зарубежной поездке; для въезда в некоторые страны она обязательна.",
        "We recommend having medical insurance for any trip abroad; some countries require it for entry.",
      ),
    ],
  },
];
