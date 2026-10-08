import type { L10n } from "./types";
import { site } from "@/config/site";

// Yuridik hujjatlar (TZ L12, §4.9): foydalanish shartlari (ommaviy oferta), maxfiylik siyosati,
// bekor qilish siyosati. Matn shu yerda uch tilda saqlanadi; sahifa — src/components/LegalPage.tsx.
// Kompaniya nomi faqat site.ts dan olinadi: yuridik nom berilgach hujjatlar o'zi yangilanadi.

export type LegalSlug = "terms" | "privacy" | "cancellation";

export type LegalBlock =
  | { kind: "p"; text: L10n }
  | { kind: "list"; items: L10n[] }
  | { kind: "table"; caption: L10n; head: [L10n, L10n]; rows: [L10n, L10n][] };

export interface LegalSection {
  /** Anchor id (URL'da barqaror, tilga bog'liq emas). */
  id: string;
  title: L10n;
  blocks: LegalBlock[];
}

export interface LegalDoc {
  slug: LegalSlug;
  title: L10n;
  description: L10n;
  intro: L10n;
  /** ISO sana (YYYY-MM-DD). */
  effective: string;
  updated: string;
  sections: LegalSection[];
}

const l = (uz: string, ru: string, en: string): L10n => ({ uz, ru, en });
const p = (uz: string, ru: string, en: string): LegalBlock => ({ kind: "p", text: l(uz, ru, en) });
const list = (...items: L10n[]): LegalBlock => ({ kind: "list", items });

const co = site.legalName ?? site.name;
const web = site.domain;
const mail = site.email;

// Hujjatlar e'lon qilingan sana. Matn o'zgarganda `UPDATED` yangilanadi.
const EFFECTIVE = "2026-10-08";
const UPDATED = "2026-10-08";

/** Qaytarish muddati (ish kunlari) — bekor qilish siyosati va FAQ uchun yagona manba. */
export const REFUND_DAYS = { min: 5, max: 10 } as const;

/** TZ §4.9 majburiy jadvali — bekor qilish siyosati va FAQ shu ro'yxatdan o'qiydi. */
export const cancellationTiers: { period: L10n; fee: L10n }[] = [
  {
    period: l("60 kundan ko'p", "Более 60 дней", "More than 60 days"),
    fee: l(
      "Faqat oldindan to'lov — tur narxining 30%",
      "Только предоплата — 30% стоимости тура",
      "The prepayment only — 30% of the tour price",
    ),
  },
  {
    period: l("30–60 kun", "30–60 дней", "30–60 days"),
    fee: l("Tur narxining 50%", "50% стоимости тура", "50% of the tour price"),
  },
  {
    period: l("15–29 kun", "15–29 дней", "15–29 days"),
    fee: l("Tur narxining 75%", "75% стоимости тура", "75% of the tour price"),
  },
  {
    period: l("15 kundan kam", "Менее 15 дней", "Fewer than 15 days"),
    fee: l(
      "Tur narxining 100% (qaytarilmaydi)",
      "100% стоимости тура (не возвращается)",
      "100% of the tour price (non-refundable)",
    ),
  },
];

// ── Foydalanish shartlari (ommaviy oferta) ─────────────────────────────────
const terms: LegalDoc = {
  slug: "terms",
  title: l("Foydalanish shartlari", "Условия использования", "Terms of use"),
  description: l(
    "Ravon Travel saytidan foydalanish va tur xizmatlarini ko'rsatish shartlari — ommaviy oferta: bron, to'lov, tomonlarning majburiyatlari va javobgarligi.",
    "Условия использования сайта Ravon Travel и оказания туристических услуг — публичная оферта: бронирование, оплата, обязанности и ответственность сторон.",
    "Terms for using the Ravon Travel website and for the provision of travel services — a public offer covering booking, payment, and the duties and liability of the parties.",
  ),
  intro: l(
    `Ushbu hujjat ${co} (keyingi o'rinlarda — «Operator») tomonidan ${web} sayti orqali tur xizmatlarini ko'rsatish shartlarini belgilaydi va O'zbekiston Respublikasi Fuqarolik kodeksiga muvofiq ommaviy oferta hisoblanadi. Saytda bron qilish yoki to'lovni amalga oshirish ushbu shartlarni to'liq qabul qilishni (aksept) anglatadi.`,
    `Настоящий документ определяет условия оказания туристических услуг ${co} (далее — «Оператор») через сайт ${web} и в соответствии с Гражданским кодексом Республики Узбекистан является публичной офертой. Оформление бронирования или оплата на сайте означает полное принятие (акцепт) этих условий.`,
    `This document sets out the terms on which ${co} (the "Operator") provides travel services through the website ${web}. Under the Civil Code of the Republic of Uzbekistan it constitutes a public offer. Making a booking or a payment on the website means full acceptance of these terms.`,
  ),
  effective: EFFECTIVE,
  updated: UPDATED,
  sections: [
    {
      id: "tomonlar",
      title: l("Umumiy qoidalar va tomonlar", "Общие положения и стороны", "General provisions and parties"),
      blocks: [
        p(
          `Operator — ${co}, chiquvchi turizm yo'nalishida turoperatorlik faoliyatini yurituvchi tashkilot. Turist — saytda tur bron qilgan yoki so'rov yuborgan, shuningdek uning nomidan bronga kiritilgan har bir yo'lovchi.`,
          `Оператор — ${co}, организация, осуществляющая туроператорскую деятельность в сфере выездного туризма. Турист — лицо, оформившее на сайте бронирование или запрос, а также каждый путешественник, включённый в бронирование от его имени.`,
          `The Operator is ${co}, an organisation carrying out tour-operator activity in outbound tourism. The Tourist is the person who makes a booking or sends a request on the website, together with every traveller included in that booking.`,
        ),
        p(
          "Bronni rasmiylashtiruvchi shaxs 18 yoshga to'lgan bo'lishi va bronga kiritilgan barcha yo'lovchilar nomidan harakat qilish vakolatiga ega ekanini tasdiqlaydi. Voyaga yetmaganlar faqat ota-onasi yoki qonuniy vakili hamrohligida yoki ularning yozma roziligi bilan sayohat qiladi.",
          "Лицо, оформляющее бронирование, подтверждает, что ему исполнилось 18 лет и что оно вправе действовать от имени всех путешественников, включённых в бронирование. Несовершеннолетние путешествуют только в сопровождении родителей или законных представителей либо с их письменного согласия.",
          "The person making the booking confirms that they are at least 18 years old and are authorised to act on behalf of all travellers in the booking. Minors travel only when accompanied by a parent or legal guardian, or with their written consent.",
        ),
        p(
          "Ushbu shartlar Maxfiylik siyosati va Bekor qilish siyosati bilan birgalikda qo'llanadi; ular shartnomaning ajralmas qismidir.",
          "Настоящие условия применяются вместе с Политикой конфиденциальности и Политикой отмены, которые являются неотъемлемой частью договора.",
          "These terms apply together with the Privacy policy and the Cancellation policy, which form an integral part of the contract.",
        ),
      ],
    },
    {
      id: "predmet",
      title: l("Shartnoma predmeti", "Предмет договора", "Subject of the contract"),
      blocks: [
        p(
          "Operator Turistga saytdagi tur sahifasida ko'rsatilgan tur paketini — dasturga kiritilgan tashish, joylashtirish, transfer, ekskursiya va boshqa xizmatlar majmuini — taqdim etish majburiyatini oladi, Turist esa ushbu xizmatlar haqini to'lash majburiyatini oladi.",
          "Оператор обязуется предоставить Туристу турпакет, указанный на странице тура на сайте, — комплекс включённых в программу услуг по перевозке, размещению, трансферу, экскурсиям и иных услуг, а Турист обязуется оплатить эти услуги.",
          "The Operator undertakes to provide the Tourist with the tour package described on the tour page of the website — the set of transport, accommodation, transfer, excursion and other services included in the programme — and the Tourist undertakes to pay for those services.",
        ),
        p(
          "Tur tarkibi, marshruti, muddati, narxga kiradigan va kirmaydigan xizmatlar har bir turning sahifasida alohida ko'rsatiladi. Sahifada sanab o'tilmagan xizmatlar tur narxiga kirmaydi.",
          "Состав тура, маршрут, продолжительность, включённые и не включённые в стоимость услуги указываются на странице каждого тура. Услуги, не перечисленные на странице, в стоимость тура не входят.",
          "The content of a tour, its itinerary, duration, and the services included in and excluded from the price are listed on each tour page. Services not listed there are not part of the tour price.",
        ),
        p(
          "Saytda ikki turdagi mahsulot mavjud: sanasi belgilangan turlar (saytda onlayn bron qilinadi va to'lanadi) hamda so'rov bo'yicha turlar (Turist so'rov qoldiradi, shartlar va narx mas'ul mutaxassis bilan kelishiladi va alohida shartnomada qayd etiladi).",
          "На сайте представлены два вида продуктов: туры с фиксированной датой (бронируются и оплачиваются онлайн на сайте) и туры по запросу (Турист оставляет запрос, условия и цена согласовываются с ответственным специалистом и фиксируются в отдельном договоре).",
          "The website offers two kinds of product: fixed-departure tours (booked and paid for online) and on-request tours (the Tourist sends a request; the terms and price are agreed with a specialist and recorded in a separate contract).",
        ),
      ],
    },
    {
      id: "bron-tolov",
      title: l("Bron qilish va to'lov", "Бронирование и оплата", "Booking and payment"),
      blocks: [
        list(
          l(
            "Turist tur sanasini, yo'lovchilar sonini tanlaydi va yo'lovchilar hamda aloqa ma'lumotlarini kiritadi. Ma'lumotlar xorijga chiqish pasportidagi yozuvlarga to'liq mos bo'lishi shart.",
            "Турист выбирает дату тура и число путешественников, указывает данные путешественников и контактные данные. Данные должны полностью совпадать с записями в заграничном паспорте.",
            "The Tourist chooses the departure date and number of travellers and enters the travellers' and contact details. The details must match the travel passports exactly.",
          ),
          l(
            "To'lov saytda bank kartasi (Humo, Uzcard, Visa, Mastercard) orqali amalga oshiriladi; to'lovni litsenziyalangan to'lov tashkiloti qayta ishlaydi.",
            "Оплата производится на сайте банковской картой (Humo, Uzcard, Visa, Mastercard); платёж обрабатывает лицензированная платёжная организация.",
            "Payment is made on the website by bank card (Humo, Uzcard, Visa, Mastercard); the payment is processed by a licensed payment provider.",
          ),
          l(
            "Bron to'lov muvaffaqiyatli o'tgan va Operator uni tasdiqlagan paytdan boshlab tuzilgan hisoblanadi. Tasdiq bron raqami bilan ekranda ko'rsatiladi va Turist ko'rsatgan aloqa vositasiga yuboriladi.",
            "Бронирование считается оформленным с момента успешной оплаты и подтверждения Оператором. Подтверждение с номером бронирования показывается на экране и направляется на указанный Туристом контакт.",
            "A booking is concluded once payment has gone through and the Operator has confirmed it. The confirmation with the booking reference is shown on screen and sent to the contact details provided by the Tourist.",
          ),
          l(
            "Tanlangan sanaga o'rinlar soni cheklangan. To'lov yakunlanmaguncha o'rin band qilinmaydi va narx kafolatlanmaydi.",
            "Количество мест на выбранную дату ограничено. До завершения оплаты место не закрепляется и цена не гарантируется.",
            "Seats on a given departure are limited. Until payment is completed, no seat is held and the price is not guaranteed.",
          ),
        ),
        p(
          "Agar Operator to'langan bronni tasdiqlay olmasa (masalan, o'rin qolmagan bo'lsa), to'langan summa Turistga to'liq qaytariladi.",
          "Если Оператор не может подтвердить оплаченное бронирование (например, не осталось мест), уплаченная сумма возвращается Туристу полностью.",
          "If the Operator cannot confirm a paid booking (for example, because no seats remain), the amount paid is refunded to the Tourist in full.",
        ),
      ],
    },
    {
      id: "narxlar",
      title: l("Narxlar", "Цены", "Prices"),
      blocks: [
        p(
          "Narxlar saytda bir kishi uchun AQSH dollarida ko'rsatiladi; so'mdagi summa ma'lumot uchun beriladi. To'lov O'zbekiston so'mida, to'lov sahifasida ko'rsatilgan yakuniy summa bo'yicha amalga oshiriladi.",
          "Цены на сайте указаны за одного человека в долларах США; сумма в сумах приводится справочно. Оплата производится в узбекских сумах в размере итоговой суммы, показанной на странице оплаты.",
          "Prices on the website are shown per person in US dollars; the amount in Uzbek soum is given for reference. Payment is made in Uzbek soum for the final amount shown on the payment page.",
        ),
        p(
          "«dan» so'zi bilan ko'rsatilgan narx — eng arzon sana bo'yicha boshlang'ich narx. Aniq narx tanlangan sana va yo'lovchilar tarkibiga bog'liq bo'lib, to'lovdan oldin bron sahifasida ko'rsatiladi.",
          "Цена с пометкой «от» — начальная цена по самой недорогой дате. Точная стоимость зависит от выбранной даты и состава путешественников и показывается на странице бронирования до оплаты.",
          'A price marked "from" is the starting price for the cheapest departure. The exact price depends on the chosen date and the travellers in the booking and is shown on the booking page before payment.',
        ),
        p(
          "To'langan bronning narxi keyinchalik Operator tomonidan bir tomonlama oshirilmaydi. Viza yig'imlari, shaxsiy xarajatlar va tur sahifasida «narxga kirmaydi» deb ko'rsatilgan xizmatlar alohida to'lanadi.",
          "Стоимость оплаченного бронирования впоследствии не повышается Оператором в одностороннем порядке. Визовые сборы, личные расходы и услуги, указанные на странице тура как не включённые в стоимость, оплачиваются отдельно.",
          'The price of a paid booking is not subsequently increased unilaterally by the Operator. Visa fees, personal expenses and services listed on the tour page as "not included" are paid separately.',
        ),
      ],
    },
    {
      id: "turist",
      title: l("Turistning huquq va majburiyatlari", "Права и обязанности Туриста", "Rights and duties of the Tourist"),
      blocks: [
        p("Turist quyidagi huquqlarga ega:", "Турист вправе:", "The Tourist has the right to:"),
        list(
          l(
            "tur, uning dasturi, narxga kiradigan xizmatlar, kirish va viza qoidalari haqida to'liq va ishonchli ma'lumot olish;",
            "получать полную и достоверную информацию о туре, его программе, включённых услугах, правилах въезда и визовых требованиях;",
            "receive full and accurate information about the tour, its programme, the included services, and entry and visa rules;",
          ),
          l(
            "to'langan xizmatlarni tur sahifasida ko'rsatilgan hajm va sifatda olish;",
            "получить оплаченные услуги в объёме и качестве, указанных на странице тура;",
            "receive the paid services in the scope and quality described on the tour page;",
          ),
          l(
            "Bekor qilish siyosatida belgilangan tartibda turdan voz kechish va pulni qaytarib olish;",
            "отказаться от тура и получить возврат в порядке, установленном Политикой отмены;",
            "cancel the tour and obtain a refund as set out in the Cancellation policy;",
          ),
          l(
            "xizmat sifati bo'yicha Operatorga murojaat qilish va yozma javob olish.",
            "обращаться к Оператору по вопросам качества услуг и получать письменный ответ.",
            "raise concerns about service quality with the Operator and receive a written reply.",
          ),
        ),
        p("Turist quyidagilarga majbur:", "Турист обязан:", "The Tourist must:"),
        list(
          l(
            "o'zi va hamrohlari haqida to'g'ri va to'liq ma'lumot berish;",
            "предоставить точные и полные сведения о себе и своих спутниках;",
            "provide accurate and complete information about themselves and their companions;",
          ),
          l(
            "amal qilish muddati yetarli bo'lgan xorijga chiqish pasportiga, zarur bo'lsa — viza va boshqa ruxsatnomalarga ega bo'lish;",
            "иметь заграничный паспорт с достаточным сроком действия, а при необходимости — визу и иные разрешения;",
            "hold a travel passport with sufficient validity and, where required, a visa and other permits;",
          ),
          l(
            "jo'nash vaqti va joyiga o'z vaqtida kelish, tashuvchi, mehmonxona va gid qoidalariga rioya qilish;",
            "своевременно прибывать к месту и времени отправления, соблюдать правила перевозчика, отеля и гида;",
            "arrive on time at the place of departure and follow the rules of carriers, hotels and guides;",
          ),
          l(
            "borilayotgan davlatning qonunlari, bojxona va sanitariya qoidalari hamda mahalliy urf-odatlarni hurmat qilish;",
            "соблюдать законы, таможенные и санитарные правила страны пребывания и уважать местные обычаи;",
            "comply with the laws, customs and health regulations of the destination country and respect local customs;",
          ),
          l(
            "sayohatga ta'sir qilishi mumkin bo'lgan sog'liq holati yoki boshqa holatlar haqida Operatorni oldindan xabardor qilish.",
            "заранее сообщать Оператору о состоянии здоровья и иных обстоятельствах, которые могут повлиять на поездку.",
            "tell the Operator in advance about any health condition or other circumstance that may affect the trip.",
          ),
        ),
      ],
    },
    {
      id: "operator",
      title: l("Operatorning huquq va majburiyatlari", "Права и обязанности Оператора", "Rights and duties of the Operator"),
      blocks: [
        p("Operator quyidagilarga majbur:", "Оператор обязан:", "The Operator must:"),
        list(
          l(
            "tasdiqlangan bron bo'yicha tur sahifasida ko'rsatilgan xizmatlarni tashkil etish;",
            "организовать услуги, указанные на странице тура, по подтверждённому бронированию;",
            "arrange the services described on the tour page for every confirmed booking;",
          ),
          l(
            "sayohatdan oldin Turistga jo'nash vaqti, uchrashuv joyi, kerakli hujjatlar va aloqa uchun mas'ul shaxs haqida ma'lumot berish;",
            "до поездки сообщить Туристу время отправления, место встречи, перечень необходимых документов и контакт ответственного лица;",
            "before the trip, give the Tourist the departure time, meeting point, list of required documents and the contact of the person responsible;",
          ),
          l(
            "dasturdagi muhim o'zgarishlar haqida Turistni imkon qadar tez xabardor qilish;",
            "как можно скорее сообщать Туристу о существенных изменениях программы;",
            "inform the Tourist of any significant change to the programme as soon as possible;",
          ),
          l(
            "Turistning shaxsga doir ma'lumotlarini Maxfiylik siyosatiga muvofiq himoya qilish.",
            "защищать персональные данные Туриста в соответствии с Политикой конфиденциальности.",
            "protect the Tourist's personal data in accordance with the Privacy policy.",
          ),
        ),
        p("Operator quyidagi huquqlarga ega:", "Оператор вправе:", "The Operator may:"),
        list(
          l(
            "zarurat tug'ilganda mehmonxona, transport yoki ekskursiyani teng yoki yuqoriroq toifadagisiga almashtirish, bunda tur narxi oshirilmaydi;",
            "при необходимости заменить отель, транспорт или экскурсию на равноценные или более высокой категории без увеличения стоимости тура;",
            "where necessary, replace a hotel, transport or excursion with one of the same or a higher category at no extra cost;",
          ),
          l(
            "Turist noto'g'ri ma'lumot bergan yoki to'lovni amalga oshirmagan hollarda bronni tasdiqlamaslik;",
            "не подтверждать бронирование, если Турист предоставил недостоверные данные или не произвёл оплату;",
            "decline to confirm a booking if the Tourist has given false information or has not paid;",
          ),
          l(
            "guruh xavfsizligiga tahdid soladigan yoki qonunni buzadigan Turistga keyingi xizmat ko'rsatishni to'xtatish.",
            "прекратить дальнейшее обслуживание Туриста, который угрожает безопасности группы или нарушает закон.",
            "stop providing further services to a Tourist who endangers the group or breaks the law.",
          ),
        ),
      ],
    },
    {
      id: "bekor-qilish",
      title: l("Bekor qilish va pul qaytarish", "Отмена и возврат средств", "Cancellation and refunds"),
      blocks: [
        p(
          "Turist tasdiqlangan brondan istalgan vaqtda voz kechishi mumkin. Ushlab qolinadigan summa sayohat boshlanishiga qolgan muddatga bog'liq va Bekor qilish siyosatida belgilangan. Tur Operator tashabbusi bilan bekor qilinganda Turistga o'sha hujjatda ko'rsatilgan variantlar taklif etiladi.",
          "Турист может отказаться от подтверждённого бронирования в любое время. Удерживаемая сумма зависит от срока до начала поездки и определена в Политике отмены. При отмене тура по инициативе Оператора Туристу предлагаются варианты, указанные в том же документе.",
          "The Tourist may cancel a confirmed booking at any time. The amount retained depends on how long remains before the trip starts and is set out in the Cancellation policy. If the Operator cancels a tour, the Tourist is offered the options listed in that document.",
        ),
      ],
    },
    {
      id: "javobgarlik",
      title: l("Javobgarlik", "Ответственность", "Liability"),
      blocks: [
        p(
          "Operator shartnoma majburiyatlarini bajarmaganligi yoki lozim darajada bajarmaganligi uchun O'zbekiston Respublikasi qonunchiligiga muvofiq javob beradi. Ushbu shartlarning hech bir bandi iste'molchining qonunda belgilangan huquqlarini cheklamaydi.",
          "Оператор несёт ответственность за неисполнение или ненадлежащее исполнение обязательств по договору в соответствии с законодательством Республики Узбекистан. Ни одно из положений настоящих условий не ограничивает права потребителя, установленные законом.",
          "The Operator is liable for failure to perform, or improper performance of, its contractual obligations in accordance with the legislation of the Republic of Uzbekistan. Nothing in these terms limits the rights that consumers have by law.",
        ),
        p("Operator quyidagilar uchun javobgar emas:", "Оператор не несёт ответственности за:", "The Operator is not liable for:"),
        list(
          l(
            "elchixona yoki chegara xizmatlarining viza berishni rad etishi, kirish yoki chiqishga ruxsat bermasligi;",
            "отказ посольства или пограничных служб в выдаче визы, во въезде или выезде;",
            "a refusal by an embassy or border authority to issue a visa or to allow entry or exit;",
          ),
          l(
            "Turist noto'g'ri ma'lumot bergani, hujjatlari yaroqsizligi yoki jo'nashga kechikkani oqibatlari;",
            "последствия предоставления Туристом недостоверных данных, недействительности его документов или опоздания к отправлению;",
            "the consequences of the Tourist giving incorrect information, holding invalid documents or being late for departure;",
          ),
          l(
            "tashuvchilar tomonidan reyslarning kechiktirilishi yoki bekor qilinishi — bunday hollarda tashuvchining qoidalari va xalqaro tashish qoidalari qo'llanadi, Operator esa muqobil yechim topishda yordam beradi;",
            "задержку или отмену рейсов перевозчиками — в таких случаях применяются правила перевозчика и международных перевозок, а Оператор помогает найти альтернативное решение;",
            "delays or cancellations of flights by carriers — in such cases the carrier's rules and international carriage rules apply, and the Operator helps to find an alternative;",
          ),
          l(
            "Turistning shaxsiy buyumlari yo'qolishi yoki shikastlanishi, agar bu Operator aybi bilan sodir bo'lmagan bo'lsa.",
            "утрату или повреждение личных вещей Туриста, если это произошло не по вине Оператора.",
            "loss of or damage to the Tourist's personal belongings where this was not caused by the Operator.",
          ),
        ),
        p(
          "Turist uchinchi shaxslarga, mehmonxona yoki tashuvchiga o'z aybi bilan yetkazgan zarar uchun o'zi javob beradi.",
          "Турист самостоятельно отвечает за ущерб, причинённый по его вине третьим лицам, отелю или перевозчику.",
          "The Tourist is personally responsible for any damage they cause to third parties, a hotel or a carrier.",
        ),
      ],
    },
    {
      id: "fors-major",
      title: l("Fors-major", "Форс-мажор", "Force majeure"),
      blocks: [
        p(
          "Tomonlar majburiyatlarni bajarmaganlik uchun javobgarlikdan ozod etiladi, agar bu ularning irodasiga bog'liq bo'lmagan favqulodda holatlar — tabiiy ofatlar, epidemiya, harbiy harakatlar, ommaviy tartibsizliklar, davlat organlarining qarorlari, chegaralar yoki havo hududining yopilishi — oqibatida yuz bergan bo'lsa.",
          "Стороны освобождаются от ответственности за неисполнение обязательств, если оно вызвано чрезвычайными обстоятельствами, не зависящими от их воли: стихийными бедствиями, эпидемией, военными действиями, массовыми беспорядками, решениями государственных органов, закрытием границ или воздушного пространства.",
          "The parties are released from liability for non-performance caused by extraordinary circumstances beyond their control: natural disasters, epidemics, military action, civil unrest, decisions of state authorities, or the closure of borders or airspace.",
        ),
        p(
          "Bunday holatga duch kelgan tomon ikkinchi tomonni imkon qadar tez xabardor qiladi. Operator Turistga sanani ko'chirish, boshqa tur tanlash yoki amalda sarflanmagan mablag'ni qaytarish variantlarini taklif etadi.",
          "Сторона, столкнувшаяся с такими обстоятельствами, как можно скорее уведомляет другую сторону. Оператор предлагает Туристу перенос даты, другой тур или возврат фактически не израсходованных средств.",
          "The affected party notifies the other as soon as possible. The Operator offers the Tourist a change of date, another tour, or a refund of the funds that were not actually spent.",
        ),
      ],
    },
    {
      id: "nizolar",
      title: l("Nizolar va qo'llaniladigan huquq", "Споры и применимое право", "Disputes and governing law"),
      blocks: [
        p(
          `Ushbu shartlarga O'zbekiston Respublikasi qonunchiligi, jumladan Fuqarolik kodeksi, «Turizm to'g'risida»gi va «Iste'molchilarning huquqlarini himoya qilish to'g'risida»gi qonunlar qo'llanadi.`,
          "К настоящим условиям применяется законодательство Республики Узбекистан, в том числе Гражданский кодекс, законы «О туризме» и «О защите прав потребителей».",
          'These terms are governed by the legislation of the Republic of Uzbekistan, including the Civil Code and the laws "On Tourism" and "On Protection of Consumer Rights".',
        ),
        p(
          `Xizmat bo'yicha e'tirozlar yozma shaklda ${mail} manziliga yuboriladi; e'tirozda bron raqami va holat tavsifi ko'rsatiladi. Operator murojaatni qonunchilikda belgilangan muddatda ko'rib chiqadi va yozma javob beradi.`,
          `Претензии по услугам направляются в письменной форме на адрес ${mail} с указанием номера бронирования и описания ситуации. Оператор рассматривает обращение в срок, установленный законодательством, и даёт письменный ответ.`,
          `Complaints about services are sent in writing to ${mail}, stating the booking reference and a description of the situation. The Operator reviews each complaint within the period set by law and replies in writing.`,
        ),
        p(
          "Muzokaralar yo'li bilan hal etilmagan nizolar O'zbekiston Respublikasining vakolatli sudida ko'rib chiqiladi.",
          "Споры, не урегулированные путём переговоров, рассматриваются компетентным судом Республики Узбекистан.",
          "Disputes not settled by negotiation are heard by the competent court of the Republic of Uzbekistan.",
        ),
      ],
    },
    {
      id: "ozgarishlar",
      title: l("Shartlarning o'zgarishi", "Изменение условий", "Changes to these terms"),
      blocks: [
        p(
          "Operator ushbu shartlarga o'zgartirish kiritishi mumkin. Yangi tahrir saytda e'lon qilingan paytdan kuchga kiradi; sahifa boshida oxirgi o'zgartirish sanasi ko'rsatiladi. Allaqachon to'langan bronlarga bron paytida amalda bo'lgan tahrir qo'llanadi.",
          "Оператор вправе вносить изменения в настоящие условия. Новая редакция вступает в силу с момента публикации на сайте; дата последнего изменения указана в начале страницы. К уже оплаченным бронированиям применяется редакция, действовавшая на момент бронирования.",
          "The Operator may amend these terms. A new version takes effect when it is published on the website; the date of the last change is shown at the top of the page. Bookings that have already been paid are governed by the version in force at the time of booking.",
        ),
        p(
          `Shartlar bo'yicha savollar uchun: ${mail}.`,
          `По вопросам, связанным с условиями: ${mail}.`,
          `Questions about these terms: ${mail}.`,
        ),
      ],
    },
  ],
};

// ── Maxfiylik siyosati ─────────────────────────────────────────────────────
const privacy: LegalDoc = {
  slug: "privacy",
  title: l("Maxfiylik siyosati", "Политика конфиденциальности", "Privacy policy"),
  description: l(
    "Ravon Travel shaxsga doir ma'lumotlarni qanday to'plashi, ishlatishi, saqlashi va himoya qilishi hamda sizning huquqlaringiz haqida.",
    "О том, как Ravon Travel собирает, использует, хранит и защищает персональные данные, и о ваших правах.",
    "How Ravon Travel collects, uses, stores and protects personal data, and what rights you have.",
  ),
  intro: l(
    `Ushbu siyosat ${co} (keyingi o'rinlarda — «Operator») ${web} sayti orqali olingan shaxsga doir ma'lumotlarni qanday qayta ishlashini tushuntiradi. Siyosat O'zbekiston Respublikasining 2019-yil 2-iyuldagi «Shaxsga doir ma'lumotlar to'g'risida»gi O'RQ-547-son Qonuniga muvofiq tuzilgan.`,
    `Настоящая политика объясняет, как ${co} (далее — «Оператор») обрабатывает персональные данные, полученные через сайт ${web}. Политика составлена в соответствии с Законом Республики Узбекистан «О персональных данных» от 2 июля 2019 года № ЗРУ-547.`,
    `This policy explains how ${co} (the "Operator") processes personal data received through the website ${web}. It has been drawn up in accordance with the Law of the Republic of Uzbekistan "On Personal Data" No. ZRU-547 of 2 July 2019.`,
  ),
  effective: EFFECTIVE,
  updated: UPDATED,
  sections: [
    {
      id: "malumotlar",
      title: l("Qanday ma'lumotlarni to'playmiz", "Какие данные мы собираем", "What data we collect"),
      blocks: [
        p(
          "Biz faqat siz o'zingiz taqdim etgan va xizmat ko'rsatish uchun zarur bo'lgan ma'lumotlarni to'playmiz:",
          "Мы собираем только те данные, которые вы предоставляете сами и которые необходимы для оказания услуг:",
          "We collect only the data that you provide yourself and that is needed to provide our services:",
        ),
        list(
          l(
            "aloqa va so'rov formalari: ism, telefon raqami, email (ixtiyoriy), xabar matni va tanlangan mavzu;",
            "формы обратной связи и запроса: имя, номер телефона, email (по желанию), текст сообщения и выбранная тема;",
            "contact and request forms: name, phone number, email (optional), the text of your message and the chosen subject;",
          ),
          l(
            "bron qilishda: har bir yo'lovchining familiyasi va ismi, tug'ilgan sanasi, xorijga chiqish pasporti ma'lumotlari hamda bron egasining aloqa ma'lumotlari;",
            "при бронировании: фамилия и имя каждого путешественника, дата рождения, данные заграничного паспорта, а также контактные данные заказчика;",
            "when booking: each traveller's first and last name, date of birth and travel-passport details, plus the contact details of the person booking;",
          ),
          l(
            "texnik ma'lumotlar: IP-manzil, so'rov vaqti va brauzer turi — saytning xavfsizligi va barqaror ishlashi uchun server jurnallarida.",
            "технические данные: IP-адрес, время запроса и тип браузера — в журналах сервера для безопасности и стабильной работы сайта.",
            "technical data: IP address, time of request and browser type — kept in server logs for the security and stable operation of the website.",
          ),
        ),
        p(
          "Biz irqi, diniy e'tiqodi, sog'lig'i kabi maxsus toifadagi ma'lumotlarni so'ramaymiz. Agar sayohat uchun sog'liq holati haqida ma'lumot zarur bo'lsa, uni faqat sizning roziligingiz bilan va faqat shu sayohatni tashkil etish uchun ishlatamiz.",
          "Мы не запрашиваем данные специальных категорий — о расе, религиозных убеждениях, здоровье. Если для поездки нужны сведения о состоянии здоровья, мы используем их только с вашего согласия и только для организации этой поездки.",
          "We do not ask for special-category data such as race, religious belief or health. If health information is needed for a trip, we use it only with your consent and only to arrange that trip.",
        ),
      ],
    },
    {
      id: "maqsadlar",
      title: l("Ma'lumotlardan foydalanish maqsadlari", "Цели обработки данных", "Why we use your data"),
      blocks: [
        list(
          l(
            "so'rovingizga javob berish va siz bilan bog'lanish;",
            "чтобы ответить на ваш запрос и связаться с вами;",
            "to answer your request and get in touch with you;",
          ),
          l(
            "bronni rasmiylashtirish va tur xizmatlarini tashkil etish: chipta, mehmonxona, transfer, viza ko'magi;",
            "чтобы оформить бронирование и организовать услуги тура: билеты, отель, трансфер, визовую поддержку;",
            "to make your booking and arrange the tour services: tickets, hotel, transfers and visa support;",
          ),
          l(
            "to'lovni qabul qilish va pulni qaytarish;",
            "чтобы принять оплату и оформить возврат;",
            "to take payment and process refunds;",
          ),
          l(
            "qonunchilikda belgilangan buxgalteriya va hisobot majburiyatlarini bajarish;",
            "чтобы исполнять установленные законом обязанности по бухгалтерскому учёту и отчётности;",
            "to meet accounting and reporting obligations set by law;",
          ),
          l(
            "saytni suiiste'mol va avtomatik hujumlardan himoya qilish.",
            "чтобы защищать сайт от злоупотреблений и автоматизированных атак.",
            "to protect the website from abuse and automated attacks.",
          ),
        ),
        p(
          "Ma'lumotlaringizni reklama maqsadida uchinchi shaxslarga sotmaymiz va bermaymiz. Reklama xabarlarini faqat alohida roziligingiz bo'lsagina yuboramiz.",
          "Мы не продаём и не передаём ваши данные третьим лицам в рекламных целях. Рекламные сообщения отправляем только при наличии отдельного согласия.",
          "We do not sell or pass your data to third parties for advertising. We send marketing messages only if you have given separate consent.",
        ),
      ],
    },
    {
      id: "huquqiy-asos",
      title: l("Qayta ishlashning huquqiy asosi", "Правовые основания обработки", "Legal basis for processing"),
      blocks: [
        p(
          "Ma'lumotlar «Shaxsga doir ma'lumotlar to'g'risida»gi Qonunga muvofiq quyidagi asoslarda qayta ishlanadi:",
          "Данные обрабатываются в соответствии с Законом «О персональных данных» на следующих основаниях:",
          'Data is processed in accordance with the Law "On Personal Data" on the following grounds:',
        ),
        list(
          l(
            "sizning roziligingiz — formani yuborishda yoki bron qilishda tegishli katakchani belgilash orqali beriladi;",
            "ваше согласие — даётся отметкой соответствующего поля при отправке формы или бронировании;",
            "your consent — given by ticking the relevant box when you submit a form or make a booking;",
          ),
          l(
            "siz taraf bo'lgan shartnomani tuzish va bajarish zarurati;",
            "необходимость заключения и исполнения договора, стороной которого вы являетесь;",
            "the need to conclude and perform a contract to which you are a party;",
          ),
          l(
            "Operator zimmasiga qonunchilik bilan yuklangan majburiyatlarni bajarish.",
            "исполнение обязанностей, возложенных на Оператора законодательством.",
            "compliance with obligations imposed on the Operator by law.",
          ),
        ),
        p(
          "Boshqa yo'lovchilar ma'lumotlarini kiritayotganda siz ularning roziligini olganingizni tasdiqlaysiz.",
          "Указывая данные других путешественников, вы подтверждаете, что получили их согласие.",
          "When you enter other travellers' details, you confirm that you have their consent.",
        ),
      ],
    },
    {
      id: "saqlash",
      title: l("Saqlash va himoya", "Хранение и защита", "Storage and protection"),
      blocks: [
        p(
          "Ma'lumotlar himoyalangan aloqa kanali (HTTPS) orqali uzatiladi. Ularga faqat so'rovingiz yoki broningiz bilan ishlaydigan xodimlar kira oladi; ular maxfiylikni saqlash majburiyatini olgan.",
          "Данные передаются по защищённому каналу связи (HTTPS). Доступ к ним имеют только сотрудники, работающие с вашим запросом или бронированием; они обязаны соблюдать конфиденциальность.",
          "Data is transmitted over a secure connection (HTTPS). Only staff who handle your request or booking have access to it, and they are bound by confidentiality.",
        ),
        p(
          "Ma'lumotlar qayta ishlash maqsadiga erishish uchun zarur bo'lgan muddat davomida, shuningdek qonunchilikda hujjatlarni saqlash uchun belgilangan muddat davomida saqlanadi. Muddat tugagach yoki roziligingizni qaytarib olganingizda — qonun saqlashni talab qilmasa — ma'lumotlar o'chiriladi yoki egasizlantiriladi.",
          "Данные хранятся в течение срока, необходимого для достижения целей обработки, а также срока, установленного законодательством для хранения документов. По его истечении или при отзыве согласия — если закон не требует хранения — данные удаляются или обезличиваются.",
          "Data is kept for as long as needed for the purposes for which it is processed, and for the period the law requires documents to be kept. After that, or when you withdraw consent — unless the law requires retention — the data is deleted or anonymised.",
        ),
        p(
          "O'zbekiston Respublikasi fuqarolarining shaxsga doir ma'lumotlarini qayta ishlash va saqlash qonunchilik talablariga muvofiq amalga oshiriladi.",
          "Обработка и хранение персональных данных граждан Республики Узбекистан осуществляются в соответствии с требованиями законодательства.",
          "The personal data of citizens of the Republic of Uzbekistan is processed and stored in line with the requirements of the legislation.",
        ),
      ],
    },
    {
      id: "karta",
      title: l("Bank kartasi ma'lumotlari", "Данные банковских карт", "Bank card data"),
      blocks: [
        p(
          "Karta ma'lumotlari — karta raqami, amal qilish muddati, CVV/CVC kodi va SMS-kod — himoyalangan ulanish orqali to'g'ridan-to'g'ri litsenziyalangan to'lov tashkilotiga uzatiladi. Ular hech qachon bizning serverimizga yuborilmaydi va bizda saqlanmaydi.",
          "Данные карты — номер, срок действия, код CVV/CVC и SMS-код — передаются по защищённому соединению напрямую лицензированной платёжной организации. Они никогда не отправляются на наш сервер и не хранятся у нас.",
          "Card data — the card number, expiry date, CVV/CVC code and SMS code — is passed over a secure connection directly to a licensed payment provider. It is never sent to our server and is never stored by us.",
        ),
        p(
          "Biz to'lov tashkilotidan faqat to'lov natijasini olamiz: holati, summasi, vaqti va tranzaksiya identifikatori.",
          "От платёжной организации мы получаем только результат оплаты: статус, сумму, время и идентификатор транзакции.",
          "From the payment provider we receive only the outcome of the payment: its status, amount, time and transaction identifier.",
        ),
      ],
    },
    {
      id: "uchinchi-shaxslar",
      title: l("Uchinchi shaxslarga berish", "Передача третьим лицам", "Sharing with third parties"),
      blocks: [
        p(
          "Ma'lumotlaringiz faqat sayohatingizni tashkil etish uchun zarur bo'lgan hajmda quyidagilarga beriladi:",
          "Ваши данные передаются только в объёме, необходимом для организации поездки:",
          "Your data is shared only to the extent needed to arrange your trip, with:",
        ),
        list(
          l(
            "aviakompaniyalar va boshqa tashuvchilar, mehmonxonalar, qabul qiluvchi hamkorlar va gidlar;",
            "авиакомпаниям и другим перевозчикам, отелям, принимающим партнёрам и гидам;",
            "airlines and other carriers, hotels, local partners and guides;",
          ),
          l(
            "sug'urta kompaniyalari va viza markazlari yoki elchixonalar — tegishli xizmat buyurtma qilinganda;",
            "страховым компаниям, визовым центрам или посольствам — если заказана соответствующая услуга;",
            "insurance companies and visa centres or embassies — where that service has been ordered;",
          ),
          l(
            "to'lov tashkiloti — to'lovni amalga oshirish uchun;",
            "платёжной организации — для проведения оплаты;",
            "the payment provider — to process the payment;",
          ),
          l(
            "davlat organlari — faqat qonunchilikda nazarda tutilgan hollarda va tartibda.",
            "государственным органам — только в случаях и в порядке, предусмотренных законодательством.",
            "state authorities — only in the cases and manner provided for by law.",
          ),
        ),
        p(
          "Chiquvchi turizm xizmatlari xorijda ko'rsatilgani sababli yo'lovchi ma'lumotlari borilayotgan davlatdagi xizmat ko'rsatuvchilarga uzatiladi. Bron qilish orqali siz sayohatni tashkil etish uchun zarur bo'lgan bunday transchegaraviy uzatishga rozilik bildirasiz.",
          "Поскольку услуги выездного туризма оказываются за рубежом, данные путешественников передаются поставщикам услуг в стране пребывания. Оформляя бронирование, вы соглашаетесь на такую трансграничную передачу, необходимую для организации поездки.",
          "Because outbound travel services are delivered abroad, travellers' data is passed to service providers in the destination country. By making a booking you agree to this cross-border transfer, which is necessary to arrange the trip.",
        ),
      ],
    },
    {
      id: "cookie",
      title: l("Cookie va brauzer xotirasi", "Cookie и хранилище браузера", "Cookies and browser storage"),
      blocks: [
        p(
          "Sayt faqat ishlashi uchun zarur bo'lgan texnik vositalardan foydalanadi: tanlangan tilni eslab qolish uchun cookie va tugallanmagan bron ma'lumotlarini brauzeringiz xotirasida vaqtincha saqlash. Reklama va kuzatuv cookie'laridan foydalanmaymiz.",
          "Сайт использует только технические средства, необходимые для его работы: cookie для запоминания выбранного языка и временное хранение данных незавершённого бронирования в памяти вашего браузера. Рекламные и отслеживающие cookie мы не используем.",
          "The website uses only the technical means needed for it to work: a cookie that remembers your chosen language, and temporary storage of an unfinished booking in your browser. We do not use advertising or tracking cookies.",
        ),
      ],
    },
    {
      id: "huquqlar",
      title: l("Sizning huquqlaringiz", "Ваши права", "Your rights"),
      blocks: [
        p("Siz quyidagi huquqlarga egasiz:", "Вы вправе:", "You have the right to:"),
        list(
          l(
            "o'zingiz haqingizda qanday ma'lumotlar qayta ishlanayotganini bilish va ularning nusxasini olish;",
            "узнать, какие данные о вас обрабатываются, и получить их копию;",
            "know what data about you is being processed and obtain a copy of it;",
          ),
          l(
            "noto'g'ri yoki eskirgan ma'lumotlarni tuzatishni talab qilish;",
            "потребовать исправления неточных или устаревших данных;",
            "ask for inaccurate or outdated data to be corrected;",
          ),
          l(
            "roziligingizni qaytarib olish, ma'lumotlarni qayta ishlashni to'xtatish yoki ularni o'chirishni talab qilish — qonun ularni saqlashni talab qilmaydigan hollarda;",
            "отозвать согласие, потребовать прекратить обработку или удалить данные — если закон не обязывает их хранить;",
            "withdraw your consent and ask for processing to stop or for the data to be deleted — where the law does not require it to be kept;",
          ),
          l(
            "huquqlaringiz buzilgan deb hisoblasangiz, shaxsga doir ma'lumotlar subyektlarining huquqlarini himoya qilish bo'yicha vakolatli davlat organiga yoki sudga murojaat qilish.",
            "обратиться в уполномоченный государственный орган по защите прав субъектов персональных данных или в суд, если считаете, что ваши права нарушены.",
            "complain to the authorised state body for the protection of personal-data subjects' rights, or to a court, if you believe your rights have been infringed.",
          ),
        ),
        p(
          "Rozilikni qaytarib olish undan oldin amalga oshirilgan qayta ishlashning qonuniyligiga ta'sir qilmaydi. Tasdiqlangan bron bo'yicha zarur ma'lumotlarni o'chirish sayohatni tashkil etishni imkonsiz qilishi mumkin.",
          "Отзыв согласия не влияет на законность обработки, выполненной до него. Удаление данных, необходимых по подтверждённому бронированию, может сделать организацию поездки невозможной.",
          "Withdrawing consent does not affect the lawfulness of processing carried out before it. Deleting data that is needed for a confirmed booking may make it impossible to arrange the trip.",
        ),
      ],
    },
    {
      id: "aloqa",
      title: l("Aloqa va siyosatning o'zgarishi", "Контакты и изменение политики", "Contact and changes to this policy"),
      blocks: [
        p(
          `Shaxsga doir ma'lumotlar bo'yicha har qanday so'rovni ${mail} manziliga yuboring. So'rovni qonunchilikda belgilangan muddatda ko'rib chiqamiz va javob beramiz.`,
          `Любые запросы, связанные с персональными данными, направляйте на адрес ${mail}. Мы рассмотрим запрос и ответим в срок, установленный законодательством.`,
          `Send any request about your personal data to ${mail}. We will review it and reply within the period set by law.`,
        ),
        p(
          "Ushbu siyosat yangilanishi mumkin. Yangi tahrir saytda e'lon qilingan paytdan kuchga kiradi; oxirgi o'zgartirish sanasi sahifa boshida ko'rsatiladi.",
          "Настоящая политика может обновляться. Новая редакция вступает в силу с момента публикации на сайте; дата последнего изменения указана в начале страницы.",
          "This policy may be updated. A new version takes effect when it is published on the website; the date of the last change is shown at the top of the page.",
        ),
      ],
    },
  ],
};

// ── Bekor qilish siyosati ──────────────────────────────────────────────────
const cancellation: LegalDoc = {
  slug: "cancellation",
  title: l("Bekor qilish siyosati", "Политика отмены", "Cancellation policy"),
  description: l(
    "Turni bekor qilish tartibi: sayohatgacha qolgan muddatga qarab ushlab qolinadigan summa, Operator tomonidan bekor qilish va pul qaytarish muddati.",
    "Порядок отмены тура: удерживаемая сумма в зависимости от срока до поездки, отмена со стороны Оператора и сроки возврата средств.",
    "How tour cancellations work: the fee depending on how long remains before the trip, cancellation by the Operator, and refund times.",
  ),
  intro: l(
    `Ushbu siyosat ${co} (keyingi o'rinlarda — «Operator») saytida to'langan bronni bekor qilish va pulni qaytarish tartibini belgilaydi hamda Foydalanish shartlarining (ommaviy ofertaning) ajralmas qismi hisoblanadi.`,
    `Настоящая политика определяет порядок отмены бронирования, оплаченного на сайте ${co} (далее — «Оператор»), и возврата средств и является неотъемлемой частью Условий использования (публичной оферты).`,
    `This policy sets out how a booking paid for on the website of ${co} (the "Operator") is cancelled and refunded. It forms an integral part of the Terms of use (public offer).`,
  ),
  effective: EFFECTIVE,
  updated: UPDATED,
  sections: [
    {
      id: "tartib",
      title: l("Bronni qanday bekor qilish mumkin", "Как отменить бронирование", "How to cancel a booking"),
      blocks: [
        p(
          `Bronni bekor qilish uchun ${mail} manziliga yozma ariza yuboring. Arizada bron raqami, bron egasining familiyasi va ismi hamda bekor qilinayotgan yo'lovchilar ko'rsatiladi.`,
          `Чтобы отменить бронирование, направьте письменное заявление на адрес ${mail}. В заявлении укажите номер бронирования, фамилию и имя заказчика и путешественников, для которых отменяется поездка.`,
          `To cancel a booking, send a written request to ${mail}. State the booking reference, the first and last name of the person who booked, and the travellers being cancelled.`,
        ),
        p(
          "Bekor qilish sanasi — Operator arizani olgan kun. Ish vaqtidan tashqari yoki dam olish kuni kelgan ariza keyingi ish kuni olingan hisoblanadi. Arizani olganimizni yozma ravishda tasdiqlaymiz.",
          "Датой отмены считается день получения заявления Оператором. Заявление, поступившее в нерабочее время или в выходной день, считается полученным на следующий рабочий день. Получение заявления мы подтверждаем письменно.",
          "The cancellation date is the day the Operator receives the request. A request received outside business hours or on a day off is treated as received on the next business day. We confirm receipt in writing.",
        ),
      ],
    },
    {
      id: "tolovlar",
      title: l("Turist tomonidan bekor qilish to'lovlari", "Удержания при отмене Туристом", "Fees when the Tourist cancels"),
      blocks: [
        p(
          "Ushlab qolinadigan summa bekor qilish sanasidan sayohat boshlanadigan kungacha qolgan kalendar kunlar soniga bog'liq:",
          "Удерживаемая сумма зависит от числа календарных дней от даты отмены до дня начала поездки:",
          "The fee depends on the number of calendar days between the cancellation date and the day the trip starts:",
        ),
        {
          kind: "table",
          caption: l("Bekor qilish to'lovlari jadvali", "Таблица удержаний при отмене", "Cancellation fee table"),
          head: [
            l("Sayohatdan oldingi muddat", "Срок до начала поездки", "Time before the trip"),
            l("Bekor qilish to'lovi", "Удержание при отмене", "Cancellation fee"),
          ],
          rows: cancellationTiers.map((tier) => [tier.period, tier.fee]),
        },
        p(
          "To'langan summaning bekor qilish to'lovidan oshgan qismi Turistga qaytariladi. Sayohatga kelmaslik (no-show) yoki boshlangan turni to'xtatish 15 kundan kam muddatdagi bekor qilishga tenglashtiriladi.",
          "Часть уплаченной суммы, превышающая удержание, возвращается Туристу. Неявка на поездку (no-show) или прерывание начавшегося тура приравниваются к отмене менее чем за 15 дней.",
          "Any part of the amount paid that exceeds the fee is refunded to the Tourist. A no-show, or leaving a tour after it has started, is treated as a cancellation made fewer than 15 days before the trip.",
        ),
        p(
          "Bronning bir qismi (ayrim yo'lovchilar) bekor qilinganda to'lov faqat shu yo'lovchilar ulushidan hisoblanadi.",
          "При частичной отмене (для отдельных путешественников) удержание рассчитывается только с доли этих путешественников.",
          "If only some travellers in a booking are cancelled, the fee is calculated only on those travellers' share.",
        ),
      ],
    },
    {
      id: "operator",
      title: l("Operator tomonidan bekor qilish", "Отмена со стороны Оператора", "Cancellation by the Operator"),
      blocks: [
        p(
          "Agar tur Operator tashabbusi bilan bekor qilinsa (masalan, guruh to'lmagan yoki xizmat ko'rsatuvchi xizmatni bekor qilgan bo'lsa), Turist o'z xohishiga ko'ra quyidagilardan birini tanlaydi:",
          "Если тур отменяется по инициативе Оператора (например, не набрана группа или поставщик отменил услугу), Турист по своему выбору получает одно из следующего:",
          "If the Operator cancels a tour (for example, because the group has not filled or a supplier has cancelled a service), the Tourist chooses one of the following:",
        ),
        list(
          l(
            "to'langan summani to'liq, hech qanday ushlab qolishlarsiz qaytarib olish;",
            "полный возврат уплаченной суммы без каких-либо удержаний;",
            "a full refund of the amount paid, with no deductions;",
          ),
          l(
            "boshqa sanaga yoki boshqa turga o'tish — narx farqi qaytariladi yoki qo'shimcha to'lanadi;",
            "перенос на другую дату или замену на другой тур — с возвратом или доплатой разницы в цене;",
            "a move to another date or another tour — with the price difference refunded or paid;",
          ),
          l(
            "to'langan summa miqdorida kelgusi tur uchun kredit.",
            "кредит на будущий тур в размере уплаченной суммы.",
            "a credit for a future tour equal to the amount paid.",
          ),
        ),
        p(
          "Bekor qilish haqida Turistni imkon qadar tez, bronda ko'rsatilgan aloqa vositalari orqali xabardor qilamiz.",
          "Об отмене мы сообщаем Туристу как можно скорее по контактам, указанным в бронировании.",
          "We tell the Tourist about a cancellation as soon as possible, using the contact details given in the booking.",
        ),
      ],
    },
    {
      id: "qaytarish",
      title: l("Pulni qaytarish tartibi va muddati", "Порядок и сроки возврата", "How and when refunds are paid"),
      blocks: [
        p(
          `Qaytariladigan summa ariza qabul qilingan (yoki Turist variantni tanlagan) kundan boshlab ${REFUND_DAYS.min}–${REFUND_DAYS.max} ish kuni ichida to'lov amalga oshirilgan bank kartasiga o'tkaziladi. Mablag'ning kartaga kelib tushish vaqti karta chiqargan bankka ham bog'liq.`,
          `Сумма возврата перечисляется на банковскую карту, с которой была произведена оплата, в течение ${REFUND_DAYS.min}–${REFUND_DAYS.max} рабочих дней со дня получения заявления (или выбора Туристом варианта). Срок зачисления средств зависит также от банка, выпустившего карту.`,
          `The refund is paid to the bank card used for the payment within ${REFUND_DAYS.min}–${REFUND_DAYS.max} business days of the request being received (or of the Tourist choosing an option). How quickly the money reaches the card also depends on the card-issuing bank.`,
        ),
        p(
          "Qaytarish to'lov amalga oshirilgan valyutada — O'zbekiston so'mida, to'langan summa asosida hisoblanadi.",
          "Возврат рассчитывается в валюте платежа — узбекских сумах, исходя из уплаченной суммы.",
          "Refunds are calculated in the currency of payment — Uzbek soum — on the basis of the amount paid.",
        ),
      ],
    },
    {
      id: "ozgartirish",
      title: l("Bronni o'zgartirish", "Изменение бронирования", "Changing a booking"),
      blocks: [
        p(
          "Sanani ko'chirish yoki yo'lovchini almashtirish uchun mas'ul mutaxassisga murojaat qiling. O'zgartirish bo'sh o'rin mavjud bo'lsa va xizmat ko'rsatuvchilar (aviakompaniya, mehmonxona) qoidalari bunga yo'l qo'ysa amalga oshiriladi; ularning amaldagi xarajatlari Turist hisobidan qoplanadi va oldindan ma'lum qilinadi.",
          "Чтобы перенести дату или заменить путешественника, обратитесь к ответственному специалисту. Изменение возможно при наличии свободных мест и если это допускают правила поставщиков (авиакомпании, отеля); их фактические расходы оплачивает Турист, о сумме мы сообщаем заранее.",
          "To move the date or replace a traveller, contact your specialist. A change is possible if seats are available and the suppliers' rules (airline, hotel) allow it; their actual costs are borne by the Tourist and are communicated in advance.",
        ),
      ],
    },
    {
      id: "alohida-holatlar",
      title: l("Alohida holatlar", "Особые случаи", "Special cases"),
      blocks: [
        list(
          l(
            "So'rov bo'yicha (individual) turlar uchun bekor qilish shartlari alohida shartnomada belgilanishi mumkin; bunday holda shartnoma shartlari ustun turadi.",
            "Для туров по запросу (индивидуальных) условия отмены могут быть установлены отдельным договором; в этом случае приоритет имеют условия договора.",
            "For on-request (custom) tours, cancellation terms may be set in a separate contract; in that case the contract terms prevail.",
          ),
          l(
            "Viza rad etilishi Turist tomonidan bekor qilish hisoblanadi va yuqoridagi jadval bo'yicha hisob-kitob qilinadi; rad javobi haqida darhol xabar bering — qancha erta xabar bersangiz, qaytariladigan summa shuncha ko'p bo'ladi.",
            "Отказ в визе считается отменой со стороны Туриста и рассчитывается по таблице выше; сообщите об отказе сразу — чем раньше вы сообщите, тем больше сумма возврата.",
            "A visa refusal counts as cancellation by the Tourist and is settled under the table above; tell us about a refusal straight away — the earlier you do, the larger the refund.",
          ),
          l(
            "Fors-major holatlarida Foydalanish shartlarining tegishli bo'limi qo'llanadi.",
            "При форс-мажорных обстоятельствах применяется соответствующий раздел Условий использования.",
            "In force majeure situations, the relevant section of the Terms of use applies.",
          ),
        ),
        p(
          "Ushbu siyosatning hech bir bandi iste'molchining O'zbekiston Respublikasi qonunchiligida belgilangan huquqlarini cheklamaydi.",
          "Ни одно из положений настоящей политики не ограничивает права потребителя, установленные законодательством Республики Узбекистан.",
          "Nothing in this policy limits the rights that consumers have under the legislation of the Republic of Uzbekistan.",
        ),
      ],
    },
  ],
};

export const legalDocs: Record<LegalSlug, LegalDoc> = { terms, privacy, cancellation };
export const legalSlugs = Object.keys(legalDocs) as LegalSlug[];
