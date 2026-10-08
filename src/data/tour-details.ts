import type { ItineraryDay, L10n, TourDetail } from "./types";

// Tur tafsiloti sahifasi kontenti (kalit = tour.id).
// `az-7` — handoff prototipidan aynan olingan; qolgan 9 tur shu shablon bo'yicha yozilgan namuna
// kontent (marshrut, mehmonxona toifasi va shartlar shartnoma oldidan menejer tomonidan tasdiqlanadi).
// DIQQAT: bu fayl faqat server komponentlarda import qilinadi — brauzerga jo'natilmaydi.

const l = (uz: string, ru: string, en: string): L10n => ({ uz, ru, en });
const day = (title: L10n, text: L10n, tags: L10n[]): ItineraryDay => ({ title, text, tags });

// ── Teglar ───────────────────────────────────────────────────────────────
const T = {
  transfer: l("Transfer", "Трансфер", "Transfer"),
  flight: l("Parvoz", "Перелёт", "Flight"),
  boulevard: l("Bulvar", "Бульвар", "Boulevard"),
  unesco: l("YUNESKO", "ЮНЕСКО", "UNESCO"),
  guided: l("Gid bilan", "С гидом", "Guided"),
  coach: l("Avtobus", "Автобус", "Coach"),
  museum: l("Muzey", "Музей", "Museum"),
  halfDay: l("Yarim kun", "Полдня", "Half day"),
  fullDay: l("To'liq kun", "Весь день", "Full day"),
  freeTime: l("Erkin vaqt", "Свободное время", "Free time"),
  mountains: l("Tog'lar", "Горы", "Mountains"),
  longDrive: l("Uzoq yo'l", "Долгая дорога", "Long drive"),
  shopping: l("Xarid", "Шопинг", "Shopping"),
  beach: l("Plyaj", "Пляж", "Beach"),
  lake: l("Ko'l", "Озеро", "Lake"),
  nature: l("Tabiat", "Природа", "Nature"),
  hotSprings: l("Issiq buloqlar", "Горячие источники", "Hot springs"),
  oldTown: l("Eski shahar", "Старый город", "Old town"),
  cityTour: l("Shahar sayri", "Обзорная экскурсия", "City tour"),
  panorama: l("Panorama", "Панорама", "Panorama"),
  desert: l("Cho'l", "Пустыня", "Desert"),
  jeep: l("Jip-safari", "Джип-сафари", "4×4 safari"),
  dinner: l("Kechki ovqat", "Ужин", "Dinner"),
  boat: l("Qayiq sayri", "Прогулка на катере", "Boat trip"),
  ship: l("Layner", "Лайнер", "Cruise ship"),
  island: l("Orol", "Остров", "Island"),
  seaDay: l("Dengizda", "В море", "At sea"),
  treatment: l("Muolaja", "Процедуры", "Treatments"),
  doctor: l("Shifokor", "Врач", "Doctor"),
  rest: l("Dam olish", "Отдых", "Rest"),
  train: l("Tezyurar poyezd", "Скоростной поезд", "High-speed train"),
  cableCar: l("Kanat yo'li", "Канатная дорога", "Cable car"),
  hiking: l("Piyoda sayr", "Пешая прогулка", "Walking"),
  domesticFlight: l("Ichki reys", "Внутренний рейс", "Domestic flight"),
  market: l("Bozor", "Базар", "Market"),
  cuisine: l("Milliy oshxona", "Местная кухня", "Local cuisine"),
  optional: l("Ixtiyoriy", "По желанию", "Optional"),
} as const;

// ── Takrorlanadigan qatorlar ─────────────────────────────────────────────
const INC = {
  transfers: l(
    "Barcha aeroport va shahar transferlari",
    "Все аэропортовые и городские трансферы",
    "All airport and city transfers",
  ),
  excursions: l(
    "Programmadagi barcha ekskursiyalar va kirish chiptalari",
    "Все экскурсии по программе и входные билеты",
    "All scheduled excursions and entry tickets",
  ),
  guide: l("O'zbek va rus tilida gid xizmati", "Услуги гида на узбекском и русском", "Guide services in Uzbek and Russian"),
  guideRu: l(
    "Rus tilida so'zlashuvchi gid xizmati",
    "Услуги русскоговорящего гида",
    "Russian-speaking guide services",
  ),
  insurance: l("Tibbiy sug'urta", "Медицинская страховка", "Medical insurance"),
};

const EXC = {
  meals: l("Tushlik va kechki ovqat", "Обеды и ужины", "Lunches and dinners"),
  personal: l("Shaxsiy xarajatlar va sovg'alar", "Личные расходы и сувениры", "Personal expenses and souvenirs"),
  optional: l(
    "Ixtiyoriy qo'shimcha ekskursiyalar",
    "Дополнительные экскурсии по желанию",
    "Optional extra excursions",
  ),
  single: l(
    "Bir kishilik xonaga qo'shimcha to'lov",
    "Доплата за одноместное размещение",
    "Single-room supplement",
  ),
  tips: l("Chaevoy va gid uchun rag'bat", "Чаевые и вознаграждение гиду", "Tips and gratuities"),
  visaFee: l(
    "Viza yig'imi (agar talab qilinsa)",
    "Визовый сбор (если требуется)",
    "Visa fee (if required)",
  ),
  touristTax: l(
    "Mehmonxonada to'lanadigan turistik yig'im",
    "Туристический сбор, оплачиваемый в отеле",
    "Tourist tax payable at the hotel",
  ),
};

const NOTE = {
  visaManager: l(
    "Amaldagi viza qoidalarini bron qilishdan oldin menejerimiz aniqlab beradi.",
    "Актуальные визовые правила наш менеджер уточняет до бронирования.",
    "Current visa rules are confirmed by our manager before booking.",
  ),
  visaManagerRequest: l(
    "Amaldagi viza qoidalarini so'rovingizni tasdiqlashdan oldin menejerimiz aniqlab beradi.",
    "Актуальные визовые правила наш менеджер уточняет до подтверждения заявки.",
    "Current visa rules are confirmed by our manager before your request is finalised.",
  ),
  passport6: l(
    "Pasport amal qilish muddati qaytish sanasidan kamida 6 oy ortiq bo'lishi kerak.",
    "Паспорт должен быть действителен минимум 6 месяцев после даты возвращения.",
    "Your passport must be valid for at least six months after the return date.",
  ),
  cancelFixed: l(
    "Jo'nashga 21 kun qolganda bepul bekor qilinadi. Keyin shartlar qo'llaniladi.",
    "Бесплатная отмена за 21 день до выезда. Далее применяются условия.",
    "Free cancellation up to 21 days before departure; conditions apply after that.",
  ),
  cancelRequest: l(
    "Bekor qilish shartlari individual dasturga bog'liq — tasdiqlash vaqtida yozma ravishda beriladi.",
    "Условия отмены зависят от индивидуальной программы — мы сообщаем их письменно при подтверждении.",
    "Cancellation terms depend on the individual programme and are given in writing on confirmation.",
  ),
};

export const tourDetails: Record<string /* tour.id */, TourDetail> = {
  // ── Ozarbayjon — «7 mo'jiza» (prototipdan aynan) ───────────────────────
  "az-7": {
    route: l("Baku · Gobustan · Quba", "Баку · Гобустан · Губа", "Baku · Gobustan · Quba"),
    groupSize: { min: 12, max: 16 },
    about: [
      l(
        "Olti kunda Ozarbayjonning yettita eng mashhur makonini ko'ramiz: Baku ichki shahri, Qiz qalasi, Gobustan qoyatosh rasmlari, palchiq vulqonlari, abadiy yonayotgan Yanardag, Atashgah ibodatxonasi va Heydar Aliyev markazi.",
        "За шесть дней вы увидите семь главных мест Азербайджана: Ичери-шехер, Девичью башню, петроглифы Гобустана, грязевые вулканы, вечно горящий Янардаг, храм Атешгях и Центр Гейдара Алиева.",
        "In six days you'll see Azerbaijan's seven headline sights: Baku's old city, the Maiden Tower, the Gobustan petroglyphs, mud volcanoes, the ever-burning Yanar Dag, the Ateshgah temple and the Heydar Aliyev Center.",
      ),
      l(
        "Guruh 12–16 kishidan iborat, o'zbek va rus tilida so'zlashadigan gid bilan. Barcha transferlar va ekskursiyalar narxga kiritilgan — sizdan faqat chipta va mehmonxona tashvishisiz sayohat qilish talab etiladi.",
        "Группа из 12–16 человек с гидом, говорящим на узбекском и русском. Все трансферы и экскурсии включены в цену — вам остаётся только путешествовать.",
        "Groups of 12–16 with a guide speaking Uzbek and Russian. All transfers and excursions are included — all you have to do is travel.",
      ),
    ],
    gallery: [
      { src: "/img/tour-az.jpg", alt: l("Ichar-shahar, Baku", "Ичери-шехер, Баку", "Old city, Baku") },
      { src: "/img/az-maiden.jpg", alt: l("Qiz qalasi", "Девичья башня", "Maiden Tower") },
      {
        src: "/img/az-gobustan.jpg",
        alt: l("Gobustan qoyatosh rasmlari", "Петроглифы Гобустана", "Gobustan petroglyphs"),
      },
      {
        src: "/img/az-yanardag.jpg",
        alt: l("Yanardag — abadiy olov", "Янардаг — вечный огонь", "Yanar Dag — the eternal fire"),
      },
      { src: "/img/blog-1.jpg", alt: l("Heydar Aliyev markazi", "Центр Гейдара Алиева", "Heydar Aliyev Center") },
    ],
    itinerary: [
      day(
        l("Toshkent → Baku, joylashish", "Ташкент → Баку, размещение", "Tashkent → Baku, check-in"),
        l(
          "Ertalabki parvoz, Heydar Aliyev aeroportida kutib olish va mehmonxonaga transfer. Kechqurun Kaspiy bo'yidagi Bulvar bo'ylab tanishuv sayri.",
          "Утренний перелёт, встреча в аэропорту Гейдара Алиева и трансфер в отель. Вечером — знакомство с Приморским бульваром.",
          "Morning flight, meet-and-greet at Heydar Aliyev airport and hotel transfer. In the evening, a first walk along the Caspian boulevard.",
        ),
        [T.transfer, T.boulevard],
      ),
      day(
        l("Baku ichki shahri va Qiz qalasi", "Ичери-шехер и Девичья башня", "Baku old city and the Maiden Tower"),
        l(
          "YUNESKO ro'yxatidagi Ichar-shahar, Shirvonshohlar saroyi, Qiz qalasi va Alanglovchi minoralar panoramasi. Tushdan keyin Heydar Aliyev markazi.",
          "Ичери-шехер из списка ЮНЕСКО, Дворец Ширваншахов, Девичья башня и панорама Flame Towers. После обеда — Центр Гейдара Алиева.",
          "The UNESCO-listed old city, the Shirvanshahs' Palace, the Maiden Tower and the Flame Towers panorama. The Heydar Aliyev Center after lunch.",
        ),
        [T.unesco, T.guided],
      ),
      day(
        l(
          "Gobustan qoyatoshlari va palchiq vulqonlari",
          "Гобустан и грязевые вулканы",
          "Gobustan petroglyphs and mud volcanoes",
        ),
        l(
          "Baku'dan 60 km janubda — 40 mingga yaqin qoyatosh rasmi va dunyodagi palchiq vulqonlarining yarmi shu hududda joylashgan.",
          "В 60 км к югу от Баку — около 40 тысяч петроглифов и половина всех грязевых вулканов мира.",
          "Sixty kilometres south of Baku: some 40,000 rock carvings and half the world's mud volcanoes.",
        ),
        [T.coach, T.museum],
      ),
      day(
        l("Yanardag va Atashgah ibodatxonasi", "Янардаг и храм Атешгях", "Yanar Dag and the Ateshgah temple"),
        l(
          "Ming yildan ortiq yonib turgan tabiiy gaz olovi va olovga sig'inuvchilarning Atashgah ibodatxonasi. Kechqurun erkin vaqt.",
          "Природный газовый огонь, горящий больше тысячи лет, и храм огнепоклонников Атешгях. Вечер свободный.",
          "A natural gas fire burning for over a thousand years, plus the fire-worshippers' temple at Ateshgah. Free evening.",
        ),
        [T.halfDay, T.freeTime],
      ),
      day(
        l(
          "Quba va Xinaliq tog' qishlog'i",
          "Губа и горное село Хыналыг",
          "Quba and the mountain village of Khinalug",
        ),
        l(
          "Kavkaz tog'lari ichidagi 2350 m balandlikdagi qadimiy Xinaliq qishlog'i va Quba shahridagi gilam ustaxonalari.",
          "Древнее село Хыналыг на высоте 2350 м в Кавказских горах и ковровые мастерские Губы.",
          "The ancient village of Khinalug at 2,350 m in the Caucasus, and Quba's carpet workshops.",
        ),
        [T.mountains, T.longDrive],
      ),
      day(
        l("Erkin vaqt va Baku → Toshkent", "Свободное время и Баку → Ташкент", "Free time and Baku → Tashkent"),
        l(
          "Ertalab sovg'a xaridlari uchun erkin vaqt, keyin aeroportga transfer va Toshkentga qaytish.",
          "Утром свободное время для покупок, затем трансфер в аэропорт и возвращение в Ташкент.",
          "A free morning for shopping, then an airport transfer and the flight home.",
        ),
        [T.shopping, T.transfer],
      ),
    ],
    included: [
      l(
        "Toshkent–Baku–Toshkent aviachiptalari",
        "Авиабилеты Ташкент–Баку–Ташкент",
        "Tashkent–Baku–Tashkent flights",
      ),
      l(
        "4* mehmonxonada 5 kecha, nonushta bilan",
        "5 ночей в отеле 4* с завтраками",
        "Five nights in a 4* hotel with breakfast",
      ),
      INC.transfers,
      INC.excursions,
      INC.guide,
      INC.insurance,
    ],
    excluded: [EXC.meals, EXC.personal, EXC.optional, EXC.single, EXC.tips],
    notes: {
      visa: l(
        "O'zbekiston fuqarolari uchun Ozarbayjonga viza talab qilinmaydi.",
        "Гражданам Узбекистана виза в Азербайджан не требуется.",
        "Uzbek citizens do not need a visa for Azerbaijan.",
      ),
      passport: l(
        "Pasport amal qilish muddati qaytish sanasidan kamida 3 oy ortiq bo'lishi kerak.",
        "Паспорт должен быть действителен минимум 3 месяца после даты возвращения.",
        "Your passport must be valid for at least three months after the return date.",
      ),
      cancellation: NOTE.cancelFixed,
    },
  },

  // ── Issiq-Ko'l ─────────────────────────────────────────────────────────
  "kg-issyk": {
    route: l("Bishkek · Cho'lpon-Ota · Qoraqo'l", "Бишкек · Чолпон-Ата · Каракол", "Bishkek · Cholpon-Ata · Karakol"),
    groupSize: { min: 10, max: 18 },
    about: [
      l(
        "Sakkiz kunda Issiq-Ko'lni to'liq aylanib chiqamiz: shimoliy qirg'oqdagi Cho'lpon-Ota kurorti, Grigoryev darasi, Qoraqo'l shahri, Jeti-O'g'uz qizil qoyalari va janubiy qirg'oqdagi «Ertak» kanyoni.",
        "За восемь дней мы объедем Иссык-Куль целиком: курорт Чолпон-Ата на северном берегу, Григорьевское ущелье, Каракол, красные скалы Джети-Огуз и каньон «Сказка» на южном берегу.",
        "Eight days and a full loop of Issyk-Kul: the Cholpon-Ata resort on the north shore, Grigoriev Gorge, Karakol, the red rocks of Jeti-Oguz and the Skazka canyon on the south shore.",
      ),
      l(
        "Dastur osoyishta: har kuni bitta asosiy ekskursiya va ko'l bo'yida dam olish uchun vaqt. Guruh 10–18 kishi, gid o'zbek va rus tilida so'zlashadi. Tog'da havo tez o'zgaradi — issiq kiyim olishni maslahat beramiz.",
        "Программа спокойная: одна основная экскурсия в день и время для отдыха у озера. Группа 10–18 человек, гид говорит на узбекском и русском. Погода в горах меняется быстро — советуем взять тёплую одежду.",
        "The pace is easy: one main excursion a day, with time left for the lakeshore. Groups of 10–18 with a guide speaking Uzbek and Russian. Mountain weather changes quickly, so pack a warm layer.",
      ),
    ],
    gallery: [
      {
        src: "/img/tour-kg.jpg",
        alt: l("Issiq-Ko'l plyaji va Tyan-Shan tog'lari", "Пляж Иссык-Куля и горы Тянь-Шаня", "Issyk-Kul beach and the Tian Shan"),
      },
      {
        src: "/img/blog-2.jpg",
        alt: l("Issiq-Ko'l qirg'og'i", "Побережье Иссык-Куля", "The Issyk-Kul shoreline"),
      },
    ],
    itinerary: [
      day(
        l("Toshkent → Bishkek, joylashish", "Ташкент → Бишкек, размещение", "Tashkent → Bishkek, check-in"),
        l(
          "Bishkekka parvoz, aeroportda kutib olish va mehmonxonaga transfer. Kechqurun Ala-Too maydoni va Dubovy bog'i bo'ylab tanishuv sayri.",
          "Перелёт в Бишкек, встреча в аэропорту и трансфер в отель. Вечером — прогулка по площади Ала-Тоо и Дубовому парку.",
          "Flight to Bishkek, airport meet-and-greet and hotel transfer. An evening stroll around Ala-Too Square and Oak Park.",
        ),
        [T.flight, T.transfer],
      ),
      day(
        l("Burana minorasi va Cho'lpon-Ota", "Башня Бурана и Чолпон-Ата", "Burana Tower and Cholpon-Ata"),
        l(
          "Yo'lda XI asrga oid Burana minorasi va tosh haykallar muzeyi. Boom darasi orqali ko'lning shimoliy qirg'og'iga yetib boramiz va pansionatga joylashamiz.",
          "По дороге — башня Бурана XI века и музей каменных изваяний. Через Боомское ущелье приезжаем на северный берег озера и размещаемся в пансионате.",
          "En route: the 11th-century Burana Tower and its open-air museum of stone figures. Through Boom Gorge to the north shore and check-in at the lakeside resort.",
        ),
        [T.coach, T.museum],
      ),
      day(
        l("Cho'lpon-Ota petrogliflari va ko'l", "Петроглифы Чолпон-Аты и озеро", "Cholpon-Ata petroglyphs and the lake"),
        l(
          "Ertalab ochiq osmon ostidagi qoyatosh rasmlari muzeyi. Tushdan keyin plyajda dam olish yoki ixtiyoriy kema sayri.",
          "Утром — музей петроглифов под открытым небом. После обеда отдых на пляже или прогулка на теплоходе по желанию.",
          "The open-air petroglyph museum in the morning. Afternoon on the beach, or an optional boat trip.",
        ),
        [T.halfDay, T.lake],
      ),
      day(
        l("Grigoryev darasi", "Григорьевское ущелье", "Grigoriev Gorge"),
        l(
          "Archazor bilan qoplangan Chong-Oqsuv darasiga sayohat: tog' daryosi, o'tovlar va milliy taomlar bilan tushlik (ixtiyoriy).",
          "Поездка в ущелье Чон-Ак-Суу, поросшее тянь-шаньской елью: горная река, юрты и обед с блюдами национальной кухни (по желанию).",
          "A day in the spruce-lined Chon-Ak-Suu gorge: a mountain river, yurts and an optional lunch of local dishes.",
        ),
        [T.mountains, T.nature],
      ),
      day(
        l("Qoraqo'l shahri", "Город Каракол", "The town of Karakol"),
        l(
          "Ko'lning sharqiy chekkasiga o'tamiz. Mixsiz qurilgan yog'och Dungan masjidi, Muqaddas Uch Birlik cherkovi va Prjevalskiy muzeyi.",
          "Переезжаем на восточный край озера. Деревянная Дунганская мечеть, построенная без гвоздей, Свято-Троицкий собор и музей Пржевальского.",
          "On to the lake's eastern end. The wooden Dungan Mosque built without nails, Holy Trinity Cathedral and the Przhevalsky Museum.",
        ),
        [T.cityTour, T.museum],
      ),
      day(
        l(
          "Jeti-O'g'uz qoyalari va issiq buloqlar",
          "Скалы Джети-Огуз и горячие источники",
          "Jeti-Oguz rocks and hot springs",
        ),
        l(
          "«Yetti ho'kiz» va «Singan yurak» qizil qoyalari, tushdan keyin Oqsuv issiq mineral buloqlarida cho'milish.",
          "Красные скалы «Семь быков» и «Разбитое сердце», после обеда — купание в горячих минеральных источниках Ак-Суу.",
          "The red 'Seven Bulls' and 'Broken Heart' rocks, then an afternoon soak in the Ak-Suu hot mineral springs.",
        ),
        [T.nature, T.hotSprings],
      ),
      day(
        l(
          "Janubiy qirg'oq, «Ertak» kanyoni → Bishkek",
          "Южный берег, каньон «Сказка» → Бишкек",
          "South shore, Skazka canyon → Bishkek",
        ),
        l(
          "Rang-barang gil qoyali «Ertak» kanyoni va janubiy qirg'oqdagi to'xtashlar. Kechqurun Bishkekka qaytamiz.",
          "Каньон «Сказка» с разноцветными глиняными скалами и остановки на южном берегу. Вечером возвращаемся в Бишкек.",
          "The multicoloured clay formations of Skazka canyon and stops along the south shore. Back to Bishkek by evening.",
        ),
        [T.hiking, T.longDrive],
      ),
      day(
        l("Bishkek → Toshkent", "Бишкек → Ташкент", "Bishkek → Tashkent"),
        l(
          "Ertalab O'sh bozorida sovg'a xaridi uchun erkin vaqt, keyin aeroportga transfer va Toshkentga parvoz.",
          "Утром свободное время для покупок на Ошском базаре, затем трансфер в аэропорт и вылет в Ташкент.",
          "A free morning for souvenirs at Osh Bazaar, then the airport transfer and flight to Tashkent.",
        ),
        [T.market, T.transfer],
      ),
    ],
    included: [
      l(
        "Toshkent–Bishkek–Toshkent aviachiptalari",
        "Авиабилеты Ташкент–Бишкек–Ташкент",
        "Tashkent–Bishkek–Tashkent flights",
      ),
      l(
        "Mehmonxona va ko'l bo'yidagi pansionatda 7 kecha, nonushta bilan",
        "7 ночей в отеле и пансионате у озера с завтраками",
        "Seven nights in a hotel and a lakeside resort with breakfast",
      ),
      INC.transfers,
      INC.excursions,
      INC.guide,
      INC.insurance,
    ],
    excluded: [EXC.meals, EXC.personal, EXC.optional, EXC.single, EXC.tips],
    notes: { visa: NOTE.visaManager, passport: NOTE.passport6, cancellation: NOTE.cancelFixed },
  },

  // ── Dubay ──────────────────────────────────────────────────────────────
  "ae-dubai": {
    route: l("Dubay · Abu-Dabi", "Дубай · Абу-Даби", "Dubai · Abu Dhabi"),
    groupSize: { min: 2, max: 10 },
    about: [
      l(
        "Yetti kecha Dubayda: Burj Xalifa kuzatuv maydonchasi, eski shahar bozorlari, cho'lda jip-safari, Abu-Dabiga bir kunlik sayohat va Palm Jumeyra qirg'og'ida dam olish.",
        "Семь ночей в Дубае: смотровая площадка Бурдж-Халифа, базары старого города, джип-сафари в пустыне, однодневная поездка в Абу-Даби и отдых на побережье Палм-Джумейры.",
        "Seven nights in Dubai: the Burj Khalifa observation deck, the old-town souks, a 4×4 desert safari, a day trip to Abu Dhabi and beach time on Palm Jumeirah.",
      ),
      l(
        "Bu tur so'rov bo'yicha tuziladi: sana, mehmonxona toifasi va ekskursiyalar ro'yxatini o'zingiz tanlaysiz. Quyidagi marshrut — namuna dastur, ko'rsatilgan narx 4* mehmonxona va ikki kishilik xona uchun hisoblangan.",
        "Тур составляется по запросу: даты, категорию отеля и набор экскурсий вы выбираете сами. Маршрут ниже — примерная программа, цена рассчитана для отеля 4* при двухместном размещении.",
        "This tour is built on request: you choose the dates, hotel category and excursions. The itinerary below is a sample programme; the price shown is based on a 4* hotel and double occupancy.",
      ),
    ],
    gallery: [
      { src: "/img/tour-ae.jpg", alt: l("Dubay Marina", "Дубай Марина", "Dubai Marina") },
      {
        src: "/img/hero-dubai.jpg",
        alt: l("Burj Xalifa va Dubay siluetlari", "Бурдж-Халифа и силуэт Дубая", "Burj Khalifa and the Dubai skyline"),
      },
      {
        src: "/img/dest-ae.jpg",
        alt: l("Palm Jumeyra — havodan ko'rinish", "Палм-Джумейра с высоты", "Palm Jumeirah from the air"),
      },
      { src: "/img/blog-3.jpg", alt: l("Dubay favvorasi", "Фонтан Дубай", "The Dubai Fountain") },
    ],
    itinerary: [
      day(
        l("Toshkent → Dubay, joylashish", "Ташкент → Дубай, размещение", "Tashkent → Dubai, check-in"),
        l(
          "Dubayga parvoz, aeroportda kutib olish va mehmonxonaga transfer. Kechqurun dam olish.",
          "Перелёт в Дубай, встреча в аэропорту и трансфер в отель. Вечер для отдыха.",
          "Flight to Dubai, airport meet-and-greet and hotel transfer. Evening at leisure.",
        ),
        [T.flight, T.transfer],
      ),
      day(
        l("Eski Dubay va bozorlar", "Старый Дубай и базары", "Old Dubai and the souks"),
        l(
          "Al-Fahidi tarixiy mahallasi, Dubay ko'rfazi orqali an'anaviy «abra» qayig'ida o'tish, Oltin va Ziravorlar bozorlari.",
          "Исторический квартал Аль-Фахиди, переправа через Дубайский залив на традиционной лодке «абра», Золотой рынок и Рынок специй.",
          "The Al Fahidi historical district, a traditional abra crossing of Dubai Creek, and the Gold and Spice Souks.",
        ),
        [T.cityTour, T.market],
      ),
      day(
        l("Burj Xalifa va Dubay favvorasi", "Бурдж-Халифа и Фонтан Дубай", "Burj Khalifa and the Dubai Fountain"),
        l(
          "Dunyoning eng baland binosidagi kuzatuv maydonchasi, Dubai Mall va kechqurun musiqali favvora tomoshasi.",
          "Смотровая площадка самого высокого здания в мире, Dubai Mall и вечернее шоу поющих фонтанов.",
          "The observation deck of the world's tallest building, Dubai Mall and the evening fountain show.",
        ),
        [T.panorama, T.shopping],
      ),
      day(
        l("Cho'l safari", "Сафари в пустыне", "Desert safari"),
        l(
          "Tushgacha erkin vaqt. Tushdan keyin jiplarda qum barxanlari bo'ylab sayr, quyosh botishi va badaviylar lagerida kechki ovqat.",
          "До обеда свободное время. После обеда — поездка на джипах по барханам, закат и ужин в бедуинском лагере.",
          "A free morning. In the afternoon, dune driving by 4×4, sunset and dinner at a Bedouin-style camp.",
        ),
        [T.jeep, T.dinner],
      ),
      day(
        l("Abu-Dabi — bir kunlik sayohat", "Абу-Даби — поездка на день", "Abu Dhabi day trip"),
        l(
          "Shayx Zoid masjidi, Kornish qirg'og'i va Qasr al-Vatan saroyi. Kechqurun Dubayga qaytish.",
          "Мечеть шейха Зайда, набережная Корниш и дворец Каср-аль-Ватан. Вечером возвращение в Дубай.",
          "Sheikh Zayed Grand Mosque, the Corniche and the Qasr Al Watan palace. Back to Dubai in the evening.",
        ),
        [T.fullDay, T.guided],
      ),
      day(
        l("Palm Jumeyra va plyaj", "Палм-Джумейра и пляж", "Palm Jumeirah and the beach"),
        l(
          "Sun'iy orol bo'ylab monorels, Atlantis oldidagi sohil va tushdan keyin plyajda dam olish.",
          "Монорельс по искусственному острову, набережная у отеля Atlantis и отдых на пляже после обеда.",
          "The monorail along the man-made island, the promenade by Atlantis and an afternoon on the beach.",
        ),
        [T.beach, T.halfDay],
      ),
      day(
        l("Dubay Marina — erkin kun", "Дубай Марина — свободный день", "Dubai Marina — free day"),
        l(
          "Xarid va dam olish uchun erkin kun. Xohishga ko'ra — Marina bo'ylab yaxtada sayr yoki akvapark.",
          "Свободный день для покупок и отдыха. По желанию — прогулка на яхте по Марине или аквапарк.",
          "A free day for shopping and rest. Optional: a yacht cruise around the Marina or a water park.",
        ),
        [T.freeTime, T.optional],
      ),
      day(
        l("Dubay → Toshkent", "Дубай → Ташкент", "Dubai → Tashkent"),
        l(
          "Mehmonxonadan chiqish, aeroportga transfer va Toshkentga parvoz.",
          "Выселение из отеля, трансфер в аэропорт и вылет в Ташкент.",
          "Hotel check-out, airport transfer and the flight to Tashkent.",
        ),
        [T.transfer, T.flight],
      ),
    ],
    included: [
      l(
        "Toshkent–Dubay–Toshkent aviachiptalari",
        "Авиабилеты Ташкент–Дубай–Ташкент",
        "Tashkent–Dubai–Tashkent flights",
      ),
      l(
        "4* mehmonxonada 7 kecha, nonushta bilan",
        "7 ночей в отеле 4* с завтраками",
        "Seven nights in a 4* hotel with breakfast",
      ),
      INC.transfers,
      l(
        "Namuna dasturdagi ekskursiyalar: shahar sayri, cho'l safari, Abu-Dabi",
        "Экскурсии примерной программы: обзорная, сафари в пустыне, Абу-Даби",
        "Sample-programme excursions: city tour, desert safari, Abu Dhabi",
      ),
      INC.guideRu,
      INC.insurance,
    ],
    excluded: [
      EXC.meals,
      l(
        "Burj Xalifa kuzatuv maydonchasiga chipta",
        "Билет на смотровую площадку Бурдж-Халифа",
        "Burj Khalifa observation deck ticket",
      ),
      EXC.touristTax,
      EXC.visaFee,
      EXC.personal,
      EXC.single,
    ],
    notes: { visa: NOTE.visaManagerRequest, passport: NOTE.passport6, cancellation: NOTE.cancelRequest },
  },

  // ── Yunoniston orollari kruizi ─────────────────────────────────────────
  "gr-cruise": {
    route: l(
      "Afina · Mikonos · Santorini · Krit · Rodos",
      "Афины · Миконос · Санторини · Крит · Родос",
      "Athens · Mykonos · Santorini · Crete · Rhodes",
    ),
    groupSize: { min: 10, max: 20 },
    about: [
      l(
        "Egey dengizi bo'ylab besh kechalik kruiz va Afinada ikki kecha: Akropol, Mikonosning oq ko'chalari, Santorini kalderasi, Kritdagi Knoss saroyi va Rodosning ritsarlar shahri.",
        "Пять ночей в круизе по Эгейскому морю и две ночи в Афинах: Акрополь, белые улочки Миконоса, кальдера Санторини, Кносский дворец на Крите и рыцарский город Родоса.",
        "Five nights cruising the Aegean plus two in Athens: the Acropolis, the white lanes of Mykonos, the Santorini caldera, the Palace of Knossos on Crete and the knights' city of Rhodes.",
      ),
      l(
        "Laynerda kayuta, kuniga uch mahal ovqat va ko'ngilochar dastur narxga kiradi. Guruhni Toshkentdan rus tilida so'zlashuvchi hamroh kuzatib boradi. Portlarga kirish tartibi ob-havoga qarab kruiz kompaniyasi tomonidan o'zgartirilishi mumkin.",
        "Каюта на лайнере, трёхразовое питание и развлекательная программа входят в цену. Группу из Ташкента сопровождает русскоговорящий представитель. Порядок заходов в порты может быть изменён круизной компанией из-за погоды.",
        "Your cabin, three meals a day and on-board entertainment are included. A Russian-speaking tour leader travels with the group from Tashkent. The cruise line may change the order of port calls because of the weather.",
      ),
    ],
    gallery: [
      { src: "/img/dest-gr.jpg", alt: l("Oia qishlog'i, Santorini", "Деревня Ия, Санторини", "Oia village, Santorini") },
      {
        src: "/img/cta.jpg",
        alt: l("Santorini kalderasidagi kruiz layneri", "Круизный лайнер в кальдере Санторини", "A cruise ship in the Santorini caldera"),
      },
    ],
    itinerary: [
      day(
        l("Toshkent → Afina, joylashish", "Ташкент → Афины, размещение", "Tashkent → Athens, check-in"),
        l(
          "Afinaga parvoz (bitta to'xtash bilan), aeroportda kutib olish va mehmonxonaga transfer. Kechqurun Plaka mahallasida erkin vaqt.",
          "Перелёт в Афины (с одной пересадкой), встреча в аэропорту и трансфер в отель. Вечером свободное время в районе Плака.",
          "Flight to Athens (one connection), airport meet-and-greet and hotel transfer. A free evening in the Plaka district.",
        ),
        [T.flight, T.transfer],
      ),
      day(
        l("Akropol va laynerga chiqish", "Акрополь и посадка на лайнер", "The Acropolis and embarkation"),
        l(
          "Ertalab Akropol, Parfenon va Akropol muzeyi. Tushdan keyin Pirey portiga transfer, laynerga joylashish va suzib ketish.",
          "Утром — Акрополь, Парфенон и Музей Акрополя. После обеда трансфер в порт Пирей, посадка на лайнер и отплытие.",
          "The Acropolis, the Parthenon and the Acropolis Museum in the morning. Afternoon transfer to the port of Piraeus, embarkation and sail-away.",
        ),
        [T.unesco, T.ship],
      ),
      day(
        l("Mikonos", "Миконос", "Mykonos"),
        l(
          "Oq uylar va shamol tegirmonlari oroli. Xora shaharchasi, «Kichik Venetsiya» sohili va plyajda erkin vaqt.",
          "Остров белых домов и ветряных мельниц. Городок Хора, набережная «Маленькая Венеция» и свободное время на пляже.",
          "The island of whitewashed houses and windmills: Chora town, the Little Venice waterfront and free time on the beach.",
        ),
        [T.island, T.freeTime],
      ),
      day(
        l("Santorini", "Санторини", "Santorini"),
        l(
          "Kaldera ustidagi Fira va Oia shaharchalari, ko'k gumbazli cherkovlar va mashhur quyosh botishi manzarasi.",
          "Городки Фира и Ия над кальдерой, церкви с синими куполами и знаменитый вид на закат.",
          "The clifftop towns of Fira and Oia above the caldera, blue-domed churches and the famous sunset view.",
        ),
        [T.island, T.panorama],
      ),
      day(
        l("Krit: Iraklion va Knoss saroyi", "Крит: Ираклион и Кносский дворец", "Crete: Heraklion and the Palace of Knossos"),
        l(
          "Minoy sivilizatsiyasining markazi — Knoss saroyi xarobalari, so'ng Iraklion eski shahri va Venetsiya qal'asi.",
          "Центр минойской цивилизации — руины Кносского дворца, затем старый город Ираклиона и венецианская крепость.",
          "The heart of Minoan civilisation — the ruins of Knossos — followed by Heraklion's old town and Venetian fortress.",
        ),
        [T.guided, T.museum],
      ),
      day(
        l("Rodos", "Родос", "Rhodes"),
        l(
          "YUNESKO ro'yxatidagi o'rta asr Rodos shahri: Ritsarlar ko'chasi, Buyuk magistrlar saroyi va qadimiy port.",
          "Средневековый город Родос из списка ЮНЕСКО: улица Рыцарей, дворец Великих магистров и старинная гавань.",
          "The UNESCO-listed medieval city of Rhodes: the Street of the Knights, the Palace of the Grand Master and the old harbour.",
        ),
        [T.unesco, T.oldTown],
      ),
      day(
        l("Dengizda kun va Afinaga qaytish", "День в море и возвращение в Афины", "A day at sea and return to Athens"),
        l(
          "Kun bo'yi layner palubasida dam olish. Kechqurun Pireyga qaytamiz va Afinadagi mehmonxonaga transfer.",
          "День отдыха на палубе лайнера. Вечером прибываем в Пирей, трансфер в отель в Афинах.",
          "A day relaxing on deck. Arrival in Piraeus in the evening and transfer to the hotel in Athens.",
        ),
        [T.seaDay, T.rest],
      ),
      day(
        l("Afina → Toshkent", "Афины → Ташкент", "Athens → Tashkent"),
        l(
          "Nonushtadan so'ng aeroportga transfer va Toshkentga parvoz (bitta to'xtash bilan).",
          "После завтрака трансфер в аэропорт и перелёт в Ташкент (с одной пересадкой).",
          "After breakfast, the airport transfer and flight to Tashkent (one connection).",
        ),
        [T.transfer, T.flight],
      ),
    ],
    included: [
      l(
        "Toshkent–Afina–Toshkent aviachiptalari",
        "Авиабилеты Ташкент–Афины–Ташкент",
        "Tashkent–Athens–Tashkent flights",
      ),
      l(
        "Afinada 4* mehmonxonada 2 kecha, nonushta bilan",
        "2 ночи в отеле 4* в Афинах с завтраками",
        "Two nights in a 4* hotel in Athens with breakfast",
      ),
      l(
        "Laynerda 5 kecha: ichki kayuta, kuniga uch mahal ovqat",
        "5 ночей на лайнере: внутренняя каюта, трёхразовое питание",
        "Five nights on board: inside cabin, three meals a day",
      ),
      l("Port yig'imlari", "Портовые сборы", "Port charges"),
      l(
        "Afinada Akropol ekskursiyasi va barcha transferlar",
        "Экскурсия на Акрополь в Афинах и все трансферы",
        "The Acropolis tour in Athens and all transfers",
      ),
      INC.insurance,
    ],
    excluded: [
      l(
        "Shengen vizasi yig'imi va hujjat rasmiylashtirish",
        "Сбор за шенгенскую визу и оформление документов",
        "Schengen visa fee and document handling",
      ),
      l(
        "Orollardagi qirg'oq ekskursiyalari",
        "Береговые экскурсии на островах",
        "Shore excursions on the islands",
      ),
      l(
        "Laynerdagi ichimliklar va xizmat haqi",
        "Напитки на борту и сервисный сбор",
        "On-board drinks and service charges",
      ),
      l(
        "Derazali yoki balkonli kayutaga qo'shimcha to'lov",
        "Доплата за каюту с окном или балконом",
        "Supplement for an outside or balcony cabin",
      ),
      EXC.personal,
    ],
    notes: {
      visa: l(
        "Yunonistonga Shengen vizasi talab qilinadi. Hujjatlar ro'yxati va topshirish muddatlarini bron qilishdan oldin menejerimiz aniqlab beradi.",
        "Для поездки в Грецию нужна шенгенская виза. Список документов и сроки подачи наш менеджер уточняет до бронирования.",
        "A Schengen visa is required for Greece. Our manager confirms the document list and application deadlines before booking.",
      ),
      passport: NOTE.passport6,
      cancellation: NOTE.cancelFixed,
    },
  },

  // ── Gruziya ────────────────────────────────────────────────────────────
  "ge-batumi": {
    route: l("Tbilisi · Bakuriani · Batumi", "Тбилиси · Бакуриани · Батуми", "Tbilisi · Bakuriani · Batumi"),
    groupSize: { min: 12, max: 18 },
    about: [
      l(
        "Gruziyani sharqdan g'arbga kesib o'tamiz: qadimiy Tbilisi va Mtsxeta, Kichik Kavkazdagi Bakuriani tog' kurorti, Borjomi mineral suvlari va Qora dengiz bo'yidagi Batumi.",
        "Пересекаем Грузию с востока на запад: старый Тбилиси и Мцхета, горный курорт Бакуриани на Малом Кавказе, минеральные воды Боржоми и Батуми на берегу Чёрного моря.",
        "Across Georgia from east to west: old Tbilisi and Mtskheta, the Bakuriani mountain resort in the Lesser Caucasus, the mineral waters of Borjomi and Batumi on the Black Sea.",
      ),
      l(
        "Guruh 12–18 kishi, gid o'zbek va rus tilida so'zlashadi. Uch shaharda yetti kecha — har bir joyda shoshilmasdan sayr qilish uchun yetarli vaqt qoladi.",
        "Группа 12–18 человек, гид говорит на узбекском и русском. Семь ночей в трёх городах — в каждом хватает времени на неспешные прогулки.",
        "Groups of 12–18 with a guide speaking Uzbek and Russian. Seven nights across three bases, with enough time in each to explore unhurried.",
      ),
    ],
    gallery: [
      { src: "/img/tour-ge.jpg", alt: l("Batumi — shahar va dengiz", "Батуми — город и море", "Batumi — the city and the sea") },
      { src: "/img/dest-ge.jpg", alt: l("Tbilisi panoramasi", "Панорама Тбилиси", "Tbilisi panorama") },
    ],
    itinerary: [
      day(
        l("Toshkent → Tbilisi, joylashish", "Ташкент → Тбилиси, размещение", "Tashkent → Tbilisi, check-in"),
        l(
          "Tbilisiga parvoz, aeroportda kutib olish va mehmonxonaga transfer. Kechqurun Rustaveli shohko'chasi bo'ylab sayr.",
          "Перелёт в Тбилиси, встреча в аэропорту и трансфер в отель. Вечером прогулка по проспекту Руставели.",
          "Flight to Tbilisi, airport meet-and-greet and hotel transfer. An evening walk along Rustaveli Avenue.",
        ),
        [T.flight, T.transfer],
      ),
      day(
        l("Qadimiy Tbilisi", "Старый Тбилиси", "Old Tbilisi"),
        l(
          "Metexi cherkovi, kanat yo'lida Nariqal'a qal'asiga ko'tarilish, Abanotubani oltingugurtli hammomlari va Tinchlik ko'prigi.",
          "Храм Метехи, подъём по канатной дороге к крепости Нарикала, серные бани Абанотубани и мост Мира.",
          "Metekhi Church, the cable car up to Narikala Fortress, the Abanotubani sulphur baths and the Bridge of Peace.",
        ),
        [T.oldTown, T.guided],
      ),
      day(
        l("Mtsxeta va Bakurianiga yo'l", "Мцхета и дорога в Бакуриани", "Mtskheta and the road to Bakuriani"),
        l(
          "Gruziyaning qadimiy poytaxti Mtsxeta: Jvari monastiri va Svetitsxoveli sobori. Tushdan keyin tog' kurorti Bakurianiga yetib boramiz.",
          "Древняя столица Грузии Мцхета: монастырь Джвари и собор Светицховели. После обеда приезжаем на горный курорт Бакуриани.",
          "Georgia's ancient capital, Mtskheta: Jvari Monastery and Svetitskhoveli Cathedral. On to the Bakuriani mountain resort in the afternoon.",
        ),
        [T.unesco, T.coach],
      ),
      day(
        l("Bakuriani va Borjomi", "Бакуриани и Боржоми", "Bakuriani and Borjomi"),
        l(
          "Ertalab Bakurianida kanat yo'li va tog' manzaralari. Tushdan keyin Borjomi markaziy bog'i va mineral suv bulog'i.",
          "Утром канатная дорога и горные виды в Бакуриани. После обеда — Центральный парк Боржоми и источник минеральной воды.",
          "A cable-car ride and mountain views in Bakuriani in the morning. Borjomi Central Park and its mineral spring after lunch.",
        ),
        [T.mountains, T.cableCar],
      ),
      day(
        l("Kutaisi orqali Batumiga", "В Батуми через Кутаиси", "To Batumi via Kutaisi"),
        l(
          "Yo'lda Kutaisi yaqinidagi Prometey g'ori. Kechqurun Batumiga yetib kelamiz va mehmonxonaga joylashamiz.",
          "По дороге — пещера Прометея под Кутаиси. Вечером приезжаем в Батуми и размещаемся в отеле.",
          "Prometheus Cave near Kutaisi on the way. Arrival in Batumi and hotel check-in in the evening.",
        ),
        [T.nature, T.longDrive],
      ),
      day(
        l("Batumi shahri", "Город Батуми", "The city of Batumi"),
        l(
          "Dengiz bo'yi bulvari, «Ali va Nino» haykali, Yevropa maydoni va Piazza. Kechqurun raqsga tushuvchi favvoralar.",
          "Приморский бульвар, скульптура «Али и Нино», площадь Европы и Пьяцца. Вечером — танцующие фонтаны.",
          "The seaside boulevard, the Ali and Nino sculpture, Europe Square and the Piazza. The dancing fountains in the evening.",
        ),
        [T.cityTour, T.boulevard],
      ),
      day(
        l("Batumi botanika bog'i va erkin vaqt", "Батумский ботанический сад и свободное время", "Batumi Botanical Garden and free time"),
        l(
          "Ertalab dengiz ustidagi botanika bog'i. Tushdan keyin plyajda dam olish yoki ixtiyoriy Maxunseti sharsharasiga sayohat.",
          "Утром — ботанический сад над морем. После обеда отдых на пляже или поездка к водопаду Махунцети по желанию.",
          "The clifftop botanical garden in the morning. Afternoon on the beach, or an optional trip to the Makhuntseti waterfall.",
        ),
        [T.halfDay, T.freeTime],
      ),
      day(
        l("Batumi → Toshkent", "Батуми → Ташкент", "Batumi → Tashkent"),
        l(
          "Nonushtadan so'ng aeroportga transfer va Toshkentga parvoz.",
          "После завтрака трансфер в аэропорт и вылет в Ташкент.",
          "After breakfast, the airport transfer and flight to Tashkent.",
        ),
        [T.transfer, T.flight],
      ),
    ],
    included: [
      l(
        "Toshkent–Tbilisi va Batumi–Toshkent aviachiptalari",
        "Авиабилеты Ташкент–Тбилиси и Батуми–Ташкент",
        "Tashkent–Tbilisi and Batumi–Tashkent flights",
      ),
      l(
        "4* mehmonxonalarda 7 kecha, nonushta bilan (Tbilisi 2, Bakuriani 2, Batumi 3)",
        "7 ночей в отелях 4* с завтраками (Тбилиси 2, Бакуриани 2, Батуми 3)",
        "Seven nights in 4* hotels with breakfast (Tbilisi 2, Bakuriani 2, Batumi 3)",
      ),
      INC.transfers,
      INC.excursions,
      INC.guide,
      INC.insurance,
    ],
    excluded: [EXC.meals, EXC.personal, EXC.optional, EXC.single, EXC.tips],
    notes: { visa: NOTE.visaManager, passport: NOTE.passport6, cancellation: NOTE.cancelFixed },
  },

  // ── Bolgariya ──────────────────────────────────────────────────────────
  "bg-sunny": {
    route: l("Burgas · Quyoshli plyaj · Nesebar", "Бургас · Солнечный берег · Несебр", "Burgas · Sunny Beach · Nessebar"),
    groupSize: { min: 10, max: 20 },
    about: [
      l(
        "Qora dengizning sakkiz kilometrlik qumli sohilida yetti kecha. Dastur asosan plyaj dam olishidan iborat, unga uchta ekskursiya qo'shilgan: YUNESKO ro'yxatidagi qadimiy Nesebar, Sozopol va Burgas.",
        "Семь ночей на восьмикилометровом песчаном пляже Чёрного моря. Программа в основном пляжная, к ней добавлены три экскурсии: древний Несебр из списка ЮНЕСКО, Созополь и Бургас.",
        "Seven nights on an eight-kilometre stretch of Black Sea sand. Mostly a beach holiday, with three excursions added: UNESCO-listed Nessebar, Sozopol and Burgas.",
      ),
      l(
        "Oilaviy dam olish uchun qulay: dengiz sayoz, mehmonxona plyajdan piyoda masofada, ovqatlanish «hammasi kiritilgan» tizimida. Guruhni rus tilida so'zlashuvchi vakil kutib oladi.",
        "Удобно для семейного отдыха: море мелкое, отель в пешей доступности от пляжа, питание по системе «всё включено». Группу встречает русскоговорящий представитель.",
        "Well suited to families: shallow water, a hotel within walking distance of the beach and all-inclusive meals. A Russian-speaking representative meets the group.",
      ),
    ],
    gallery: [
      {
        src: "/img/dest-bg.jpg",
        alt: l("Bolgariyaning Qora dengiz sohili", "Черноморское побережье Болгарии", "Bulgaria's Black Sea coast"),
      },
    ],
    itinerary: [
      day(
        l("Toshkent → Burgas, joylashish", "Ташкент → Бургас, размещение", "Tashkent → Burgas, check-in"),
        l(
          "Burgasga parvoz, aeroportda kutib olish va Quyoshli plyajdagi mehmonxonaga transfer (taxminan 30 km).",
          "Перелёт в Бургас, встреча в аэропорту и трансфер в отель на Солнечном берегу (около 30 км).",
          "Flight to Burgas, airport meet-and-greet and transfer to the hotel in Sunny Beach (about 30 km).",
        ),
        [T.flight, T.transfer],
      ),
      day(
        l("Plyajda birinchi kun", "Первый день на пляже", "First day on the beach"),
        l(
          "Ertalab vakil bilan tanishuv uchrashuvi, so'ng kun bo'yi dengiz va plyaj.",
          "Утром информационная встреча с представителем, затем весь день — море и пляж.",
          "A welcome briefing with the representative in the morning, then a full day of sea and sand.",
        ),
        [T.beach, T.rest],
      ),
      day(
        l("Qadimiy Nesebar", "Древний Несебр", "Ancient Nessebar"),
        l(
          "Yarim orolda joylashgan uch ming yillik shahar: Vizantiya cherkovlari, yog'och uylar va tor tosh ko'chalar.",
          "Город на полуострове с трёхтысячелетней историей: византийские церкви, деревянные дома и узкие мощёные улочки.",
          "A three-thousand-year-old town on a peninsula: Byzantine churches, timber houses and narrow cobbled lanes.",
        ),
        [T.unesco, T.halfDay],
      ),
      day(
        l("Erkin kun", "Свободный день", "Free day"),
        l(
          "Plyajda dam olish. Xohishga ko'ra — akvapark yoki dengizda qayiq sayri.",
          "Отдых на пляже. По желанию — аквапарк или морская прогулка на катере.",
          "A day on the beach. Optional: a water park or a boat trip.",
        ),
        [T.beach, T.optional],
      ),
      day(
        l("Sozopol", "Созополь", "Sozopol"),
        l(
          "Bolgariya sohilidagi eng qadimiy shaharlardan biri: eski shahar, qal'a devorlari va baliqchilar porti.",
          "Один из древнейших городов болгарского побережья: старый город, крепостные стены и рыбацкая гавань.",
          "One of the oldest towns on the Bulgarian coast: the old quarter, the fortress walls and the fishing harbour.",
        ),
        [T.oldTown, T.coach],
      ),
      day(
        l("Burgas va Dengiz bog'i", "Бургас и Приморский парк", "Burgas and the Sea Garden"),
        l(
          "Burgas markazi, dengiz bo'yidagi bog' va ko'prik-pirs. Tushdan keyin xarid uchun erkin vaqt.",
          "Центр Бургаса, Приморский парк и мост-пирс. После обеда свободное время для покупок.",
          "Central Burgas, the Sea Garden and the pier. Free time for shopping in the afternoon.",
        ),
        [T.halfDay, T.shopping],
      ),
      day(
        l("Plyajda so'nggi kun", "Последний день на пляже", "Last day on the beach"),
        l(
          "Dengiz bo'yida osoyishta kun va kechqurun sohil bo'ylab sayr.",
          "Спокойный день у моря и вечерняя прогулка по набережной.",
          "An unhurried day by the sea and an evening stroll along the promenade.",
        ),
        [T.beach, T.freeTime],
      ),
      day(
        l("Burgas → Toshkent", "Бургас → Ташкент", "Burgas → Tashkent"),
        l(
          "Mehmonxonadan chiqish, aeroportga transfer va Toshkentga parvoz.",
          "Выселение из отеля, трансфер в аэропорт и вылет в Ташкент.",
          "Hotel check-out, airport transfer and the flight to Tashkent.",
        ),
        [T.transfer, T.flight],
      ),
    ],
    included: [
      l(
        "Toshkent–Burgas–Toshkent aviachiptalari",
        "Авиабилеты Ташкент–Бургас–Ташкент",
        "Tashkent–Burgas–Tashkent flights",
      ),
      l(
        "4* mehmonxonada 7 kecha, «hammasi kiritilgan» ovqatlanish",
        "7 ночей в отеле 4*, питание «всё включено»",
        "Seven nights in a 4* hotel, all-inclusive",
      ),
      l("Aeroport transferlari", "Трансферы из аэропорта и обратно", "Airport transfers"),
      l(
        "Nesebar, Sozopol va Burgas ekskursiyalari",
        "Экскурсии в Несебр, Созополь и Бургас",
        "Excursions to Nessebar, Sozopol and Burgas",
      ),
      INC.guideRu,
      INC.insurance,
    ],
    excluded: [
      l(
        "Viza yig'imi va hujjat rasmiylashtirish",
        "Визовый сбор и оформление документов",
        "Visa fee and document handling",
      ),
      l(
        "Plyajdagi shezlong va soyabon ijarasi",
        "Аренда шезлонгов и зонтов на пляже",
        "Sunbed and parasol hire on the beach",
      ),
      EXC.optional,
      EXC.personal,
      EXC.single,
    ],
    notes: {
      visa: l(
        "Bolgariyaga viza talab qilinadi. Hujjatlar ro'yxati va topshirish muddatlarini bron qilishdan oldin menejerimiz aniqlab beradi.",
        "Для поездки в Болгарию нужна виза. Список документов и сроки подачи наш менеджер уточняет до бронирования.",
        "A visa is required for Bulgaria. Our manager confirms the document list and application deadlines before booking.",
      ),
      passport: NOTE.passport6,
      cancellation: NOTE.cancelFixed,
    },
  },

  // ── Naftalan ───────────────────────────────────────────────────────────
  "az-naftalan": {
    route: l("Baku · Naftalan · Ganja", "Баку · Нафталан · Гянджа", "Baku · Naftalan · Ganja"),
    groupSize: { min: 1, max: 8 },
    about: [
      l(
        "Naftalan — Ozarbayjonning g'arbidagi kurort shahri bo'lib, u yerda tabiiy naftalan nefti bilan vannalar qabul qilinadi. Dastur sanatoriyda besh kecha davolanish kursi va Bakuda bir kechani o'z ichiga oladi.",
        "Нафталан — курортный город на западе Азербайджана, где принимают ванны с природной нафталановой нефтью. Программа включает пять ночей лечебного курса в санатории и одну ночь в Баку.",
        "Naftalan is a spa town in western Azerbaijan known for baths in its natural naftalan oil. The programme combines a five-night treatment course at a sanatorium with one night in Baku.",
      ),
      l(
        "Muolajalar ro'yxati va soni birinchi kuni sanatoriy shifokori tomonidan belgilanadi. Naftalan vannalariga qarshi ko'rsatmalar mavjud — so'rov yuborishdan oldin o'z shifokoringiz bilan maslahatlashing. Kurs muddatini 10 yoki 14 kechagacha uzaytirish mumkin.",
        "Перечень и количество процедур в первый день назначает врач санатория. У нафталановых ванн есть противопоказания — перед отправкой заявки посоветуйтесь со своим врачом. Курс можно продлить до 10 или 14 ночей.",
        "The sanatorium doctor prescribes the treatments on day one. Naftalan baths have contraindications, so please consult your own doctor before sending a request. The course can be extended to 10 or 14 nights.",
      ),
    ],
    gallery: [
      {
        src: "/img/tour-naftalan.jpg",
        alt: l("Naftalan kurortidagi bog'", "Парк на курорте Нафталан", "A park in the Naftalan resort"),
      },
      { src: "/img/dest-az.jpg", alt: l("Baku — Favvoralar maydoni", "Баку — площадь Фонтанов", "Baku — Fountain Square") },
      { src: "/img/tour-az.jpg", alt: l("Ichar-shahar, Baku", "Ичери-шехер, Баку", "Old city, Baku") },
    ],
    itinerary: [
      day(
        l("Toshkent → Baku → Naftalan", "Ташкент → Баку → Нафталан", "Tashkent → Baku → Naftalan"),
        l(
          "Bakuga parvoz, aeroportda kutib olish va Naftalanga transfer (taxminan 330 km). Sanatoriyga joylashish.",
          "Перелёт в Баку, встреча в аэропорту и трансфер в Нафталан (около 330 км). Размещение в санатории.",
          "Flight to Baku, airport meet-and-greet and transfer to Naftalan (about 330 km). Check-in at the sanatorium.",
        ),
        [T.flight, T.longDrive],
      ),
      day(
        l("Shifokor ko'rigi va birinchi muolajalar", "Приём врача и первые процедуры", "Doctor's consultation and first treatments"),
        l(
          "Ertalab shifokor ko'rigi va shaxsiy davolanish rejasi. Tushdan keyin birinchi muolajalar.",
          "Утром осмотр врача и индивидуальный план лечения. После обеда — первые процедуры.",
          "A morning consultation and a personal treatment plan. First treatments in the afternoon.",
        ),
        [T.doctor, T.treatment],
      ),
      day(
        l("Davolanish kuni", "День лечения", "Treatment day"),
        l(
          "Reja bo'yicha naftalan vannalari va fizioterapiya. Bo'sh vaqtda kurort bog'ida sayr.",
          "Нафталановые ванны и физиотерапия по плану. В свободное время — прогулки по курортному парку.",
          "Naftalan baths and physiotherapy as prescribed, with free time for walks in the resort park.",
        ),
        [T.treatment, T.rest],
      ),
      day(
        l("Muolajalar va Ganjaga sayohat", "Процедуры и поездка в Гянджу", "Treatments and a trip to Ganja"),
        l(
          "Ertalabki muolajalardan so'ng ixtiyoriy ravishda Ganjaga yarim kunlik sayohat: Nizomiy maqbarasi va «Shisha uy».",
          "После утренних процедур — поездка в Гянджу на полдня по желанию: мавзолей Низами и «Бутылочный дом».",
          "After the morning treatments, an optional half-day trip to Ganja: the Nizami Mausoleum and the Bottle House.",
        ),
        [T.treatment, T.optional],
      ),
      day(
        l("Davolanish kuni", "День лечения", "Treatment day"),
        l(
          "Muolajalar davom etadi. Kechqurun dam olish.",
          "Продолжение процедур. Вечером отдых.",
          "Treatments continue. A quiet evening.",
        ),
        [T.treatment, T.rest],
      ),
      day(
        l("Yakuniy muolajalar va Bakuga yo'l", "Заключительные процедуры и дорога в Баку", "Final treatments and the road to Baku"),
        l(
          "Ertalab so'nggi muolajalar va shifokor tavsiyalari. Tushdan keyin Bakuga transfer, kechqurun Dengiz bo'yi bulvarida sayr.",
          "Утром последние процедуры и рекомендации врача. После обеда трансфер в Баку, вечером прогулка по Приморскому бульвару.",
          "Last treatments and the doctor's recommendations in the morning. Afternoon transfer to Baku and an evening walk along the seafront boulevard.",
        ),
        [T.treatment, T.longDrive],
      ),
      day(
        l("Baku ichki shahri va Toshkentga qaytish", "Ичери-шехер и возвращение в Ташкент", "Baku old city and return to Tashkent"),
        l(
          "Ertalab Ichar-shahar bo'ylab qisqa sayr, so'ng aeroportga transfer va Toshkentga parvoz.",
          "Утром короткая прогулка по Ичери-шехеру, затем трансфер в аэропорт и вылет в Ташкент.",
          "A short morning walk through the old city, then the airport transfer and flight to Tashkent.",
        ),
        [T.oldTown, T.transfer],
      ),
    ],
    included: [
      l(
        "Toshkent–Baku–Toshkent aviachiptalari",
        "Авиабилеты Ташкент–Баку–Ташкент",
        "Tashkent–Baku–Tashkent flights",
      ),
      l(
        "Sanatoriyda 5 kecha, kuniga uch mahal ovqat bilan",
        "5 ночей в санатории с трёхразовым питанием",
        "Five nights at the sanatorium with three meals a day",
      ),
      l(
        "Bakuda 4* mehmonxonada 1 kecha, nonushta bilan",
        "1 ночь в отеле 4* в Баку с завтраком",
        "One night in a 4* hotel in Baku with breakfast",
      ),
      l(
        "Shifokor ko'rigi va tayinlangan asosiy muolajalar",
        "Приём врача и назначенные базовые процедуры",
        "Doctor's consultation and the prescribed core treatments",
      ),
      l(
        "Baku–Naftalan–Baku transferlari",
        "Трансферы Баку–Нафталан–Баку",
        "Baku–Naftalan–Baku transfers",
      ),
      INC.insurance,
    ],
    excluded: [
      l(
        "Qo'shimcha pullik muolajalar va tahlillar",
        "Дополнительные платные процедуры и анализы",
        "Extra paid treatments and lab tests",
      ),
      l("Ganjaga ekskursiya", "Экскурсия в Гянджу", "The Ganja excursion"),
      l("Bakuda tushlik va kechki ovqat", "Обеды и ужины в Баку", "Lunches and dinners in Baku"),
      EXC.personal,
      EXC.single,
    ],
    notes: {
      visa: l(
        "O'zbekiston fuqarolari uchun Ozarbayjonga viza talab qilinmaydi.",
        "Гражданам Узбекистана виза в Азербайджан не требуется.",
        "Uzbek citizens do not need a visa for Azerbaijan.",
      ),
      passport: l(
        "Pasport amal qilish muddati qaytish sanasidan kamida 3 oy ortiq bo'lishi kerak.",
        "Паспорт должен быть действителен минимум 3 месяца после даты возвращения.",
        "Your passport must be valid for at least three months after the return date.",
      ),
      cancellation: NOTE.cancelRequest,
    },
  },

  // ── Xitoy ──────────────────────────────────────────────────────────────
  "cn-avatar": {
    route: l("Guangzhou · Zhangjiajie · Tyanmen", "Гуанчжоу · Чжанцзяцзе · Тяньмэнь", "Guangzhou · Zhangjiajie · Tianmen"),
    groupSize: { min: 6, max: 14 },
    about: [
      l(
        "«Avatar» filmidagi uchar qoyalarga ilhom bergan Zhangjiajie milliy o'rmon bog'ida to'rt kecha va Marvarid daryosi bo'yidagi Guangzhou megapolisida uch kecha.",
        "Четыре ночи в национальном лесном парке Чжанцзяцзе, чьи скалы вдохновили парящие горы «Аватара», и три ночи в мегаполисе Гуанчжоу на Жемчужной реке.",
        "Four nights in Zhangjiajie National Forest Park, whose pillars inspired the floating mountains of 'Avatar', and three in Guangzhou on the Pearl River.",
      ),
      l(
        "Dasturda piyoda yurish ko'p: zinapoyalar, kuzatuv maydonchalari va shisha ko'priklar. Qulay poyabzal oling. Tur so'rov bo'yicha tuziladi — sana va mehmonxona toifasi siz bilan kelishiladi.",
        "В программе много ходьбы: лестницы, смотровые площадки и стеклянные мосты. Возьмите удобную обувь. Тур составляется по запросу — даты и категорию отеля согласуем с вами.",
        "Expect plenty of walking: stairways, viewing platforms and glass bridges. Bring comfortable shoes. The tour is built on request — dates and hotel category are agreed with you.",
      ),
    ],
    gallery: [
      {
        src: "/img/tour-cn.jpg",
        alt: l("Zhangjiajie qoya ustunlari", "Скальные столбы Чжанцзяцзе", "The sandstone pillars of Zhangjiajie"),
      },
      {
        src: "/img/dest-cn.jpg",
        alt: l("Guangzhou va Kanton minorasi", "Гуанчжоу и телебашня Кантон", "Guangzhou and the Canton Tower"),
      },
    ],
    itinerary: [
      day(
        l("Toshkent → Guangzhou, joylashish", "Ташкент → Гуанчжоу, размещение", "Tashkent → Guangzhou, check-in"),
        l(
          "Guangzhouga parvoz, aeroportda kutib olish va mehmonxonaga transfer. Kechqurun dam olish.",
          "Перелёт в Гуанчжоу, встреча в аэропорту и трансфер в отель. Вечер для отдыха.",
          "Flight to Guangzhou, airport meet-and-greet and hotel transfer. Evening at leisure.",
        ),
        [T.flight, T.transfer],
      ),
      day(
        l("Guangzhou shahri", "Город Гуанчжоу", "The city of Guangzhou"),
        l(
          "Chen urug'i akademiyasi, mustamlaka davri me'morchiligi saqlangan Shamyan oroli va Kanton minorasi. Kechqurun Marvarid daryosida kema sayri.",
          "Академия клана Чэнь, остров Шамянь с колониальной архитектурой и телебашня Кантон. Вечером — прогулка на теплоходе по Жемчужной реке.",
          "The Chen Clan Ancestral Hall, colonial-era Shamian Island and the Canton Tower. An evening cruise on the Pearl River.",
        ),
        [T.cityTour, T.boat],
      ),
      day(
        l("Guangzhou → Zhangjiajie", "Гуанчжоу → Чжанцзяцзе", "Guangzhou → Zhangjiajie"),
        l(
          "Tezyurar poyezdda Zhangjiajiega yo'l. Vulingyuan hududidagi mehmonxonaga joylashish va kechki sayr.",
          "Переезд в Чжанцзяцзе на скоростном поезде. Размещение в отеле в районе Улинъюань и вечерняя прогулка.",
          "High-speed train to Zhangjiajie. Check-in at a hotel in the Wulingyuan area and an evening walk.",
        ),
        [T.train, T.transfer],
      ),
      day(
        l("Yuanjiajie — «Avatar» tog'lari", "Юаньцзяцзе — горы «Аватара»", "Yuanjiajie — the 'Avatar' mountains"),
        l(
          "Qoya ichidagi Baylun lifti, «Avatar Halleluya» ustuni va «Osmon ostidagi birinchi ko'prik» tabiiy arkasi.",
          "Лифт Байлун в скале, столб «Аватар Аллилуйя» и природная арка «Первый мост под небесами».",
          "The Bailong Elevator built into the cliff, the Avatar Hallelujah pillar and the natural arch known as the First Bridge under Heaven.",
        ),
        [T.unesco, T.hiking],
      ),
      day(
        l("Tyanszi tog'i va Oltin qamchi soyi", "Гора Тяньцзы и ручей Золотого кнута", "Tianzi Mountain and Golden Whip Stream"),
        l(
          "Kanat yo'lida Tyanszi tog'iga ko'tarilish va panoramalar. Tushdan keyin dara tubidagi soy bo'ylab yengil piyoda sayr.",
          "Подъём по канатной дороге на гору Тяньцзы и панорамы. После обеда — лёгкая прогулка вдоль ручья по дну ущелья.",
          "A cable car up Tianzi Mountain for the panoramas, then an easy afternoon walk along the stream on the gorge floor.",
        ),
        [T.cableCar, T.nature],
      ),
      day(
        l("Tyanmen tog'i", "Гора Тяньмэнь", "Tianmen Mountain"),
        l(
          "Dunyodagi eng uzun kanat yo'llaridan biri, qoya chetidagi shisha yo'lak va «Osmon darvozasi» g'origa olib chiquvchi 999 zinapoya.",
          "Одна из самых длинных канатных дорог в мире, стеклянная тропа над обрывом и 999 ступеней к пещере «Небесные врата».",
          "One of the world's longest cable-car rides, the glass skywalk along the cliff and the 999 steps up to Heaven's Gate cave.",
        ),
        [T.cableCar, T.panorama],
      ),
      day(
        l("Zhangjiajie → Guangzhou", "Чжанцзяцзе → Гуанчжоу", "Zhangjiajie → Guangzhou"),
        l(
          "Guangzhouga qaytish. Tushdan keyin Pekin yo'li piyodalar ko'chasida xarid uchun erkin vaqt.",
          "Возвращение в Гуанчжоу. После обеда свободное время для покупок на пешеходной улице Пекин-роуд.",
          "Return to Guangzhou. Free time for shopping on the Beijing Road pedestrian street in the afternoon.",
        ),
        [T.train, T.shopping],
      ),
      day(
        l("Guangzhou → Toshkent", "Гуанчжоу → Ташкент", "Guangzhou → Tashkent"),
        l(
          "Mehmonxonadan chiqish, aeroportga transfer va Toshkentga parvoz.",
          "Выселение из отеля, трансфер в аэропорт и вылет в Ташкент.",
          "Hotel check-out, airport transfer and the flight to Tashkent.",
        ),
        [T.transfer, T.flight],
      ),
    ],
    included: [
      l(
        "Toshkent–Guangzhou–Toshkent aviachiptalari",
        "Авиабилеты Ташкент–Гуанчжоу–Ташкент",
        "Tashkent–Guangzhou–Tashkent flights",
      ),
      l(
        "4* mehmonxonalarda 7 kecha, nonushta bilan (Guangzhou 3, Zhangjiajie 4)",
        "7 ночей в отелях 4* с завтраками (Гуанчжоу 3, Чжанцзяцзе 4)",
        "Seven nights in 4* hotels with breakfast (Guangzhou 3, Zhangjiajie 4)",
      ),
      l(
        "Guangzhou–Zhangjiajie–Guangzhou tezyurar poyezd chiptalari",
        "Билеты на скоростной поезд Гуанчжоу–Чжанцзяцзе–Гуанчжоу",
        "Guangzhou–Zhangjiajie–Guangzhou high-speed train tickets",
      ),
      l(
        "Milliy bog'ga kirish chiptalari, kanat yo'llari va Baylun lifti",
        "Входные билеты в национальный парк, канатные дороги и лифт Байлун",
        "National park entry, cable cars and the Bailong Elevator",
      ),
      INC.guideRu,
      INC.insurance,
    ],
    excluded: [EXC.meals, EXC.visaFee, EXC.personal, EXC.single, EXC.tips],
    notes: { visa: NOTE.visaManagerRequest, passport: NOTE.passport6, cancellation: NOTE.cancelRequest },
  },

  // ── Malayziya ──────────────────────────────────────────────────────────
  "my-kl": {
    route: l("Kuala-Lumpur · Putrajaya · Langkavi", "Куала-Лумпур · Путраджая · Лангкави", "Kuala Lumpur · Putrajaya · Langkawi"),
    groupSize: { min: 2, max: 12 },
    about: [
      l(
        "Sakkiz kecha ikki xil Malayziyada: to'rt kecha osmono'par binolar va ko'cha taomlari shahri Kuala-Lumpurda, to'rt kecha Andaman dengizidagi Langkavi orolida — plyaj, mangra o'rmonlari va tog' ustidagi osma ko'prik.",
        "Восемь ночей в двух разных Малайзиях: четыре — в Куала-Лумпуре, городе небоскрёбов и уличной еды, и четыре — на острове Лангкави в Андаманском море: пляж, мангровые леса и подвесной мост над горами.",
        "Eight nights in two very different Malaysias: four in Kuala Lumpur, a city of skyscrapers and street food, and four on Langkawi in the Andaman Sea — beach, mangroves and a sky bridge above the hills.",
      ),
      l(
        "Tur so'rov bo'yicha tuziladi. Langkavidagi kunlar sonini ko'paytirish yoki mehmonxona toifasini o'zgartirish mumkin — menejer narxni qayta hisoblab beradi. Tropik iqlim: yil bo'yi issiq va nam, yengil kiyim va quyoshdan himoya vositalari kerak bo'ladi.",
        "Тур составляется по запросу. Можно добавить дней на Лангкави или изменить категорию отеля — менеджер пересчитает стоимость. Климат тропический: круглый год жарко и влажно, понадобятся лёгкая одежда и защита от солнца.",
        "The tour is built on request. You can add days on Langkawi or change the hotel category and our manager will requote. The climate is tropical — hot and humid all year — so bring light clothing and sun protection.",
      ),
    ],
    gallery: [
      {
        src: "/img/dest-my-kl.jpg",
        alt: l("Petronas minoralari, Kuala-Lumpur", "Башни Петронас, Куала-Лумпур", "The Petronas Towers, Kuala Lumpur"),
      },
    ],
    itinerary: [
      day(
        l("Toshkent → Kuala-Lumpur, joylashish", "Ташкент → Куала-Лумпур, размещение", "Tashkent → Kuala Lumpur, check-in"),
        l(
          "Kuala-Lumpurga parvoz, aeroportda kutib olish va mehmonxonaga transfer. Kechqurun dam olish.",
          "Перелёт в Куала-Лумпур, встреча в аэропорту и трансфер в отель. Вечер для отдыха.",
          "Flight to Kuala Lumpur, airport meet-and-greet and hotel transfer. Evening at leisure.",
        ),
        [T.flight, T.transfer],
      ),
      day(
        l("Kuala-Lumpur shahri", "Город Куала-Лумпур", "The city of Kuala Lumpur"),
        l(
          "Mustaqillik maydoni, Milliy masjid, Xitoy mahallasi va KLCC bog'idan Petronas minoralari manzarasi.",
          "Площадь Независимости, Национальная мечеть, Чайна-таун и вид на башни Петронас из парка KLCC.",
          "Merdeka Square, the National Mosque, Chinatown and the view of the Petronas Towers from KLCC Park.",
        ),
        [T.cityTour, T.guided],
      ),
      day(
        l("Batu g'orlari", "Пещеры Бату", "Batu Caves"),
        l(
          "Ohaktosh qoyadagi g'or ibodatxonasiga olib chiquvchi 272 rangli zinapoya. Tushdan keyin Markaziy bozor va erkin vaqt.",
          "272 разноцветные ступени к пещерному храму в известняковой скале. После обеда — Центральный рынок и свободное время.",
          "The 272 rainbow steps up to the cave temple in a limestone cliff. Central Market and free time in the afternoon.",
        ),
        [T.halfDay, T.market],
      ),
      day(
        l("Putrajaya va erkin vaqt", "Путраджая и свободное время", "Putrajaya and free time"),
        l(
          "Ma'muriy poytaxt Putrajaya: ko'l bo'yidagi pushti Putra masjidi va hukumat kvartali. Kechqurun Bukit Bintang ko'chasida xarid.",
          "Административная столица Путраджая: розовая мечеть Путра у озера и правительственный квартал. Вечером — шопинг на улице Букит-Бинтанг.",
          "The administrative capital, Putrajaya: the pink Putra Mosque on the lake and the government quarter. Evening shopping on Bukit Bintang.",
        ),
        [T.halfDay, T.shopping],
      ),
      day(
        l("Kuala-Lumpur → Langkavi", "Куала-Лумпур → Лангкави", "Kuala Lumpur → Langkawi"),
        l(
          "Langkaviga ichki reys (taxminan bir soat), mehmonxonaga transfer va Chenang plyajida birinchi oqshom.",
          "Внутренний рейс на Лангкави (около часа), трансфер в отель и первый вечер на пляже Ченанг.",
          "A domestic flight to Langkawi (about an hour), hotel transfer and a first evening on Cenang Beach.",
        ),
        [T.domesticFlight, T.beach],
      ),
      day(
        l("Kanat yo'li va Osmon ko'prigi", "Канатная дорога и Небесный мост", "The cable car and the Sky Bridge"),
        l(
          "Machinchang tog'iga kanat yo'li, 660 metr balandlikdagi egri osma ko'prik va Yetti quduq sharsharasi.",
          "Канатная дорога на гору Мачинчанг, изогнутый подвесной мост на высоте 660 метров и водопад «Семь колодцев».",
          "The cable car up Mount Machinchang, the curved suspension bridge 660 metres up and the Seven Wells waterfall.",
        ),
        [T.cableCar, T.panorama],
      ),
      day(
        l("Kilim mangra o'rmonlari", "Мангровые леса Килим", "The Kilim mangroves"),
        l(
          "YUNESKO geoparki bo'ylab qayiqda sayr: mangra o'rmonlari, ohaktosh qoyalar va burgutlar.",
          "Прогулка на лодке по геопарку ЮНЕСКО: мангровые леса, известняковые скалы и орлы.",
          "A boat trip through the UNESCO geopark: mangroves, limestone cliffs and eagles.",
        ),
        [T.boat, T.nature],
      ),
      day(
        l("Plyajda erkin kun", "Свободный день на пляже", "Free day on the beach"),
        l(
          "Dengiz bo'yida dam olish. Xohishga ko'ra — qo'shni orollarga qayiq sayri.",
          "Отдых у моря. По желанию — морская прогулка по соседним островам.",
          "A day by the sea. Optional: an island-hopping boat trip.",
        ),
        [T.beach, T.optional],
      ),
      day(
        l("Langkavi → Kuala-Lumpur → Toshkent", "Лангкави → Куала-Лумпур → Ташкент", "Langkawi → Kuala Lumpur → Tashkent"),
        l(
          "Aeroportga transfer, Kuala-Lumpurga ichki reys va Toshkentga parvoz.",
          "Трансфер в аэропорт, внутренний рейс в Куала-Лумпур и перелёт в Ташкент.",
          "Airport transfer, the domestic flight to Kuala Lumpur and the flight on to Tashkent.",
        ),
        [T.domesticFlight, T.flight],
      ),
    ],
    included: [
      l(
        "Toshkent–Kuala-Lumpur–Toshkent aviachiptalari",
        "Авиабилеты Ташкент–Куала-Лумпур–Ташкент",
        "Tashkent–Kuala Lumpur–Tashkent flights",
      ),
      l(
        "Kuala-Lumpur–Langkavi–Kuala-Lumpur ichki reyslari",
        "Внутренние рейсы Куала-Лумпур–Лангкави–Куала-Лумпур",
        "Kuala Lumpur–Langkawi–Kuala Lumpur domestic flights",
      ),
      l(
        "4* mehmonxonalarda 8 kecha, nonushta bilan (Kuala-Lumpur 4, Langkavi 4)",
        "8 ночей в отелях 4* с завтраками (Куала-Лумпур 4, Лангкави 4)",
        "Eight nights in 4* hotels with breakfast (Kuala Lumpur 4, Langkawi 4)",
      ),
      INC.transfers,
      l(
        "Namuna dasturdagi ekskursiyalar va kirish chiptalari",
        "Экскурсии примерной программы и входные билеты",
        "Sample-programme excursions and entry tickets",
      ),
      INC.insurance,
    ],
    excluded: [EXC.meals, EXC.touristTax, EXC.optional, EXC.personal, EXC.single],
    notes: { visa: NOTE.visaManagerRequest, passport: NOTE.passport6, cancellation: NOTE.cancelRequest },
  },

  // ── Qatar ──────────────────────────────────────────────────────────────
  "qa-doha": {
    route: l("Doha · Xor al-Adaid", "Доха · Хор-эль-Удейд", "Doha · Khor Al Adaid"),
    groupSize: { min: 2, max: 10 },
    about: [
      l(
        "To'rt kecha Dohada: Souq Waqif bozori, Islom san'ati muzeyi, Katara madaniy qishlog'i va cho'l dengizga tutashgan Xor al-Adaid ichki dengiziga jip-safari.",
        "Четыре ночи в Дохе: базар Сук-Вакиф, Музей исламского искусства, культурная деревня Катара и джип-сафари к внутреннему морю Хор-эль-Удейд, где пустыня встречается с морем.",
        "Four nights in Doha: Souq Waqif, the Museum of Islamic Art, Katara Cultural Village and a 4×4 safari to Khor Al Adaid, the inland sea where the desert meets the water.",
      ),
      l(
        "Qisqa va ixcham dastur — uzoq ta'til ololmaydiganlar uchun qulay. Tur so'rov bo'yicha tuziladi, sanani o'zingiz tanlaysiz. Oktabrdan aprelgacha bo'lgan davr eng qulay: yozda kunduzi juda issiq bo'ladi.",
        "Короткая и компактная программа — удобно тем, кто не может взять длинный отпуск. Тур составляется по запросу, даты вы выбираете сами. Лучшее время — с октября по апрель: летом днём очень жарко.",
        "A short, compact programme — handy if you can't take a long break. The tour is built on request and you choose the dates. October to April is the best time; summer days are very hot.",
      ),
    ],
    gallery: [
      {
        src: "/img/dest-qa.jpg",
        alt: l("Doha — «Marvarid» orolidagi marina", "Доха — марина на острове «Жемчужина»", "Doha — the marina at The Pearl"),
      },
    ],
    itinerary: [
      day(
        l("Toshkent → Doha, joylashish", "Ташкент → Доха, размещение", "Tashkent → Doha, check-in"),
        l(
          "Dohaga parvoz, aeroportda kutib olish va mehmonxonaga transfer. Kechqurun Kornish qirg'og'ida sayr.",
          "Перелёт в Доху, встреча в аэропорту и трансфер в отель. Вечером прогулка по набережной Корниш.",
          "Flight to Doha, airport meet-and-greet and hotel transfer. An evening walk along the Corniche.",
        ),
        [T.flight, T.transfer],
      ),
      day(
        l("Souq Waqif va Islom san'ati muzeyi", "Сук-Вакиф и Музей исламского искусства", "Souq Waqif and the Museum of Islamic Art"),
        l(
          "Ertalab Islom san'ati muzeyi va uning bog'i. Kechqurun Souq Waqif: ziravorlar, matolar va lochinlar bozori.",
          "Утром — Музей исламского искусства и его парк. Вечером Сук-Вакиф: специи, ткани и соколиный рынок.",
          "The Museum of Islamic Art and its park in the morning. Souq Waqif in the evening: spices, textiles and the falcon market.",
        ),
        [T.museum, T.market],
      ),
      day(
        l("Cho'l va ichki dengiz", "Пустыня и внутреннее море", "The desert and the inland sea"),
        l(
          "Jiplarda Mesaid qum barxanlari bo'ylab Xor al-Adaid ichki dengiziga. Qirg'oqda dam olish va quyosh botishi.",
          "На джипах по барханам Месаида к внутреннему морю Хор-эль-Удейд. Отдых на берегу и закат.",
          "By 4×4 across the Mesaieed dunes to the Khor Al Adaid inland sea. Time on the shore and sunset.",
        ),
        [T.desert, T.jeep],
      ),
      day(
        l("Katara, «Marvarid» va Milliy muzey", "Катара, «Жемчужина» и Национальный музей", "Katara, The Pearl and the National Museum"),
        l(
          "Katara madaniy qishlog'i, «Marvarid» sun'iy orolidagi marina va «cho'l atirguli» shaklidagi Qatar Milliy muzeyi.",
          "Культурная деревня Катара, марина на искусственном острове «Жемчужина» и Национальный музей Катара в форме «розы пустыни».",
          "Katara Cultural Village, the marina on the man-made island of The Pearl and the desert-rose-shaped National Museum of Qatar.",
        ),
        [T.cityTour, T.museum],
      ),
      day(
        l("Doha → Toshkent", "Доха → Ташкент", "Doha → Tashkent"),
        l(
          "Mehmonxonadan chiqish, aeroportga transfer va Toshkentga parvoz.",
          "Выселение из отеля, трансфер в аэропорт и вылет в Ташкент.",
          "Hotel check-out, airport transfer and the flight to Tashkent.",
        ),
        [T.transfer, T.flight],
      ),
    ],
    included: [
      l(
        "Toshkent–Doha–Toshkent aviachiptalari",
        "Авиабилеты Ташкент–Доха–Ташкент",
        "Tashkent–Doha–Tashkent flights",
      ),
      l(
        "4* mehmonxonada 4 kecha, nonushta bilan",
        "4 ночи в отеле 4* с завтраками",
        "Four nights in a 4* hotel with breakfast",
      ),
      INC.transfers,
      l(
        "Shahar ekskursiyalari va cho'lga jip-safari",
        "Городские экскурсии и джип-сафари в пустыню",
        "City tours and the 4×4 desert safari",
      ),
      INC.guideRu,
      INC.insurance,
    ],
    excluded: [EXC.meals, EXC.visaFee, EXC.optional, EXC.personal, EXC.single],
    notes: { visa: NOTE.visaManagerRequest, passport: NOTE.passport6, cancellation: NOTE.cancelRequest },
  },
};

export function getTourDetail(tourId: string): TourDetail | undefined {
  return tourDetails[tourId];
}
