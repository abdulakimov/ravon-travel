import type { L10n } from "./types";

// Blog maqolalari — statik, typed kontent. CMS ulanganda shu modul API chaqiruviga almashtiriladi.
// Kirish qoidalari va narxlar ataylab ehtiyotkor yozilgan: aniq raqamlar "taxminan" deb berilgan,
// rasmiy talablar bo'yicha o'quvchi menejerga yo'naltiriladi.

export interface BlogSection {
  /** Mundarija langari — barcha tillarda bir xil. */
  id: string;
  heading: L10n;
  paragraphs: L10n[];
  list?: L10n[];
}

export interface BlogPost {
  slug: string;
  /** ISO sana (YYYY-MM-DD) */
  date: string;
  readMinutes: number;
  image: string;
  imageAlt: L10n;
  title: L10n;
  excerpt: L10n;
  intro: L10n;
  sections: BlogSection[];
}

const l = (uz: string, ru: string, en: string): L10n => ({ uz, ru, en });

export const posts: BlogPost[] = [
  {
    slug: "azerbaijan-visa-2026",
    date: "2026-08-12",
    readMinutes: 4,
    image: "/img/blog-1.jpg",
    imageAlt: l("Pasport va sayohat hujjatlari", "Паспорт и документы для поездки", "A passport and travel documents"),
    title: l(
      "Ozarbayjonga viza kerakmi? 2026-yil qoidalari",
      "Нужна ли виза в Азербайджан? Правила 2026 года",
      "Do you need a visa for Azerbaijan? 2026 rules",
    ),
    excerpt: l(
      "Qisqa javob va undan muhimroq tafsilotlar: pasport, chegaradan o'tish, ro'yxatdan o'tish va bolalar bilan sayohat.",
      "Короткий ответ и детали, которые важнее него: паспорт, пересечение границы, регистрация и поездка с детьми.",
      "The short answer, plus the details that matter more: passports, crossing the border, registration and travelling with children.",
    ),
    intro: l(
      "Baku — Toshkentdan bir necha soatlik parvoz masofasida, shuning uchun Ozarbayjon birinchi xorijiy sayohat uchun eng ko'p tanlanadigan yo'nalishlardan biri. Hujjatlar bo'yicha savollar ham shunga yarasha ko'p. Quyida — sayohatga tayyorlanayotganda bilish kerak bo'lgan asosiy narsalar.",
      "Баку находится в нескольких часах перелёта от Ташкента, поэтому Азербайджан часто выбирают для первой зарубежной поездки. Вопросов о документах тоже много. Ниже — главное, что стоит знать при подготовке.",
      "Baku is only a few hours' flight from Tashkent, which makes Azerbaijan a popular choice for a first trip abroad. It also means plenty of questions about paperwork. Here is what you should know while preparing.",
    ),
    sections: [
      {
        id: "visa",
        heading: l("Viza kerakmi?", "Нужна ли виза?", "Do you need a visa?"),
        paragraphs: [
          l(
            "Amaldagi tartibga ko'ra, O'zbekiston fuqarolari Ozarbayjonga qisqa muddatli turistik safar uchun vizasiz kiradi. Ruxsat etilgan bo'lish muddati cheklangan (odatda 90 kungacha deb ko'rsatiladi) — olti kunlik tur uchun bu yetarlidan ortiq.",
            "По действующему порядку граждане Узбекистана въезжают в Азербайджан без визы для краткосрочной туристической поездки. Разрешённый срок пребывания ограничен (обычно называют до 90 дней) — для шестидневного тура этого более чем достаточно.",
            "Under the current arrangement, citizens of Uzbekistan enter Azerbaijan without a visa for a short tourist trip. The permitted stay is limited (usually quoted as up to 90 days), which is more than enough for a six-day tour.",
          ),
          l(
            "Boshqa davlat fuqarolari uchun qoidalar farq qiladi: ko'pchilikka oldindan onlayn rasmiylashtiriladigan elektron viza kerak bo'ladi. Guruhingizda boshqa davlat pasportiga ega sayohatchi bo'lsa, buni bron paytida menejerga ayting.",
            "Для граждан других стран правила отличаются: многим нужна электронная виза, которую оформляют онлайн заранее. Если в вашей группе есть путешественник с паспортом другой страны, сообщите об этом менеджеру при бронировании.",
            "Rules differ for other nationalities: many travellers need an electronic visa arranged online in advance. If someone in your group holds a different passport, tell the manager when you book.",
          ),
          l(
            "Davlatlararo qoidalar o'zgarishi mumkin, shuning uchun har bir jo'nash oldidan amaldagi talablarni menejerimiz bilan aniqlab oling.",
            "Межгосударственные правила могут меняться, поэтому перед каждым выездом уточняйте действующие требования у нашего менеджера.",
            "Rules between countries can change, so check the current requirements with our manager before every departure.",
          ),
        ],
      },
      {
        id: "documents",
        heading: l("Qanday hujjatlar kerak", "Какие документы нужны", "Which documents you need"),
        paragraphs: [
          l(
            "Asosiy hujjat — xorijga chiqish biometrik pasporti. Rasmiy talabdan qat'i nazar, pasportning amal qilish muddati qaytish sanasidan keyin kamida olti oy bo'lishini tavsiya qilamiz: bu aviakompaniya va chegara xizmatida ortiqcha savollarning oldini oladi.",
            "Главный документ — биометрический заграничный паспорт. Независимо от формального требования рекомендуем, чтобы паспорт действовал не менее шести месяцев после даты возвращения: это избавит от лишних вопросов в авиакомпании и на границе.",
            "The key document is your biometric travel passport. Whatever the formal requirement, we recommend that it stays valid for at least six months after your return date: this avoids extra questions from the airline and at the border.",
          ),
          l(
            "Pasportdan tashqari yoningizda quyidagilar bo'lsin:",
            "Кроме паспорта, держите при себе:",
            "Besides the passport, keep these with you:",
          ),
        ],
        list: [
          l("borish va qaytish aviachiptalari", "авиабилеты туда и обратно", "your outbound and return flight tickets"),
          l(
            "mehmonxona broni yoki tur vaucheri",
            "бронь отеля или туристический ваучер",
            "a hotel booking or tour voucher",
          ),
          l(
            "sayohat davriga tibbiy sug'urta polisi",
            "полис медицинского страхования на время поездки",
            "a medical insurance policy covering the trip",
          ),
          l(
            "hujjatlarning telefondagi va qog'ozdagi nusxalari",
            "копии документов в телефоне и на бумаге",
            "copies of your documents, both on your phone and on paper",
          ),
        ],
      },
      {
        id: "border",
        heading: l("Chegaradan o'tish", "Пересечение границы", "Crossing the border"),
        paragraphs: [
          l(
            "So'nggi yillarda Ozarbayjonga yo'lovchilar asosan havo yo'li orqali kirib keladi, quruqlikdagi chegara punktlari orqali kirish esa cheklangan edi. Bizning turlarimiz Toshkent — Baku aviareysiga asoslangan, shu sababli bu cheklov sizga ta'sir qilmaydi.",
            "В последние годы пассажиры въезжают в Азербайджан в основном по воздуху, а въезд через сухопутные пункты пропуска был ограничен. Наши туры строятся на авиарейсе Ташкент — Баку, поэтому это ограничение вас не затрагивает.",
            "In recent years travellers have mostly entered Azerbaijan by air, while entry through land checkpoints has been restricted. Our tours are built around the Tashkent–Baku flight, so that restriction does not affect you.",
          ),
          l(
            "Pasport nazoratida safar maqsadi va qayerda turishingiz haqida so'rashlari mumkin. Vaucher va qaytish chiptasini qo'l yukida saqlang — javob bir daqiqadan oshmaydi.",
            "На паспортном контроле могут спросить о цели поездки и месте проживания. Держите ваучер и обратный билет в ручной клади — ответ займёт не больше минуты.",
            "At passport control you may be asked about the purpose of your visit and where you are staying. Keep the voucher and return ticket in your hand luggage and the answer takes less than a minute.",
          ),
        ],
      },
      {
        id: "registration",
        heading: l("Yashash joyi bo'yicha ro'yxatdan o'tish", "Регистрация по месту пребывания", "Registering your stay"),
        paragraphs: [
          l(
            "Ozarbayjonda belgilangan muddatdan (hozirda 15 kun deb ko'rsatiladi) uzoqroq qoladigan xorijliklar migratsiya xizmatida turar joyi bo'yicha ro'yxatdan o'tishi kerak. Mehmonxonalar buni odatda mehmon nomidan o'zlari bajaradi.",
            "Иностранцы, которые остаются в Азербайджане дольше установленного срока (сейчас называют 15 дней), должны встать на учёт по месту пребывания в миграционной службе. Отели обычно делают это за гостя сами.",
            "Foreigners who stay in Azerbaijan longer than a set period (currently quoted as 15 days) must register their place of stay with the migration service. Hotels usually do this on the guest's behalf.",
          ),
          l(
            "Olti kunlik tur uchun bu talab qo'llanilmaydi. Agar turdan keyin mustaqil qolib, xususiy kvartirada yashashni rejalashtirsangiz, ro'yxatdan o'tish tartibini uy egasi va menejerimiz bilan oldindan kelishib oling.",
            "На шестидневный тур это требование не распространяется. Если после тура вы планируете остаться самостоятельно и жить в частной квартире, заранее согласуйте порядок регистрации с хозяином жилья и нашим менеджером.",
            "This does not apply to a six-day tour. If you plan to stay on independently afterwards in a private flat, agree on how registration will be handled with your host and our manager in advance.",
          ),
        ],
      },
      {
        id: "children",
        heading: l("Bolalar bilan sayohat", "Поездка с детьми", "Travelling with children"),
        paragraphs: [
          l(
            "Har bir bolaga, yoshidan qat'i nazar, alohida xorijga chiqish pasporti kerak. Bola ota-onasidan faqat bittasi bilan yoki ularsiz safarga chiqsa, O'zbekistondan chiqishda notarial tasdiqlangan rozilik talab qilinishi mumkin.",
            "Каждому ребёнку независимо от возраста нужен отдельный заграничный паспорт. Если ребёнок едет только с одним из родителей или без них, при выезде из Узбекистана может потребоваться нотариально заверенное согласие.",
            "Every child needs their own travel passport, whatever their age. If a child travels with only one parent or without parents, a notarised consent may be required when leaving Uzbekistan.",
          ),
          l(
            "Bu hujjatlarni tayyorlash vaqt oladi, shuning uchun bron qilayotganda bolalarning yoshi va kim bilan uchishini menejerga ayting — kerakli ro'yxatni oldindan beramiz.",
            "Подготовка этих документов занимает время, поэтому при бронировании сообщите менеджеру возраст детей и с кем они летят — мы заранее дадим нужный список.",
            "These papers take time to prepare, so tell the manager the children's ages and who they are flying with when you book — we will give you the exact list in advance.",
          ),
        ],
      },
    ],
  },
  {
    slug: "issyk-kul-best-month",
    date: "2026-07-28",
    readMinutes: 6,
    image: "/img/blog-2.jpg",
    imageAlt: l(
      "Issiq-Ko'l qirg'og'i va tog'lar",
      "Берег Иссык-Куля и горы",
      "The shore of Issyk-Kul with mountains behind",
    ),
    title: l(
      "Issiq-Ko'lda dam olish: qaysi oyni tanlash kerak",
      "Отдых на Иссык-Куле: какой месяц выбрать",
      "Issyk-Kul: which month to choose",
    ),
    excerpt: l(
      "Iyundan sentabrgacha ko'l har oy boshqacha. Suv harorati, odamlar soni va narxlarni solishtiramiz — mavsumdan tashqari safarni ham unutmaymiz.",
      "С июня по сентябрь озеро каждый месяц разное. Сравниваем температуру воды, количество людей и цены — и не забываем про поездку вне сезона.",
      "From June to September the lake is different every month. We compare water temperature, crowds and prices — and look at off-season trips too.",
    ),
    intro: l(
      "Issiq-Ko'l Tyan-Shan tog'lari orasida, dengiz sathidan taxminan 1 600 metr balandlikda joylashgan. Suvi biroz sho'r, qishda ham muzlamaydi — nomi shundan. Balandlik tufayli cho'milish mavsumi qisqa, shuning uchun oyni to'g'ri tanlash dam olishning yarmini hal qiladi.",
      "Иссык-Куль лежит среди гор Тянь-Шаня на высоте около 1 600 метров над уровнем моря. Вода в нём слегка солёная и не замерзает даже зимой — отсюда и название. Из-за высоты купальный сезон короткий, поэтому правильно выбранный месяц — половина успеха.",
      "Issyk-Kul sits among the Tian Shan mountains at roughly 1,600 metres above sea level. Its water is slightly salty and does not freeze even in winter — hence the name, 'warm lake'. Because of the altitude the swimming season is short, so picking the right month is half the holiday.",
    ),
    sections: [
      {
        id: "june",
        heading: l("Iyun: yashil tog'lar va sokinlik", "Июнь: зелёные горы и тишина", "June: green mountains and quiet"),
        paragraphs: [
          l(
            "Iyunda tog' yonbag'irlari eng yashil paytida bo'ladi, qirg'oqda odam kam, mehmonxona narxlari esa mavsum cho'qqisidagidan pastroq. Suv hali salqin — odatda 16–19 °C atrofida, shuning uchun uzoq cho'milishga hamma ham tayyor emas.",
            "В июне склоны гор самые зелёные, на берегу мало людей, а цены в отелях ниже, чем в пик сезона. Вода ещё прохладная — обычно около 16–19 °C, поэтому к долгому купанию готовы не все.",
            "In June the slopes are at their greenest, the shore is uncrowded and hotel prices are below peak. The water is still cool — usually around 16–19 °C — so not everyone is ready for a long swim.",
          ),
          l(
            "Bu oy ekskursiya va piyoda sayr uchun qulay: kunduzi issiq emas, daralar va sharsharalar suvga to'la.",
            "Этот месяц удобен для экскурсий и пеших прогулок: днём не жарко, а ущелья и водопады полноводны.",
            "It is a good month for excursions and walks: days are not hot, and the gorges and waterfalls are full.",
          ),
        ],
      },
      {
        id: "july-august",
        heading: l("Iyul va avgust: mavsum cho'qqisi", "Июль и август: пик сезона", "July and August: peak season"),
        paragraphs: [
          l(
            "Suv eng iliq davri — taxminan 20–23 °C. Kunduzi havo 25–30 °C gacha isiydi, kechqurun esa tog' salqini seziladi. Barcha dam olish maskanlari, plyajlar va ko'ngilochar joylar to'liq ishlaydi.",
            "Вода в это время самая тёплая — примерно 20–23 °C. Днём воздух прогревается до 25–30 °C, а вечером чувствуется горная прохлада. Все пансионаты, пляжи и развлечения работают в полную силу.",
            "The water is at its warmest, roughly 20–23 °C. Daytime air reaches 25–30 °C, while evenings bring a mountain chill. Every resort, beach and attraction is fully open.",
          ),
          l(
            "Buning narxi bor: qirg'oq gavjum, narxlar yilning eng yuqorisi, yaxshi mehmonxonalar erta band bo'ladi. Shu oylarga mo'ljallasangiz, joyni kamida bir-ikki oy oldin bron qiling.",
            "У этого есть цена: на берегу многолюдно, цены самые высокие в году, а хорошие отели заполняются рано. Если планируете эти месяцы, бронируйте место минимум за один-два месяца.",
            "There is a price: the shore is busy, rates are the highest of the year and good hotels fill up early. If you are aiming for these months, book at least a month or two ahead.",
          ),
        ],
      },
      {
        id: "september",
        heading: l("Sentabr: baxmal mavsum", "Сентябрь: бархатный сезон", "September: the velvet season"),
        paragraphs: [
          l(
            "Sentabrning birinchi yarmida ko'l yozda to'plagan issiqligini hali saqlab turadi, sayyohlar esa sezilarli kamayadi. Narxlar pasayadi, quyosh yumshoqroq bo'ladi.",
            "В первой половине сентября озеро ещё хранит накопленное за лето тепло, а туристов становится заметно меньше. Цены снижаются, солнце становится мягче.",
            "In the first half of September the lake still holds the warmth it gathered over summer, while visitor numbers drop noticeably. Prices come down and the sun is gentler.",
          ),
          l(
            "Kechalari ancha salqinlashadi, oyning o'rtalaridan keyin esa plyajdagi ko'plab xizmatlar yopila boshlaydi. Sentabrga borsangiz, iliq kiyimni albatta oling.",
            "Ночи становятся ощутимо прохладнее, а после середины месяца многие пляжные сервисы начинают закрываться. Если едете в сентябре, обязательно возьмите тёплую одежду.",
            "Nights turn considerably cooler, and after mid-month many beach services start to close. If you go in September, do bring warm clothes.",
          ),
        ],
      },
      {
        id: "off-season",
        heading: l("Oktabrdan maygacha: mavsumdan tashqari", "С октября по май: вне сезона", "October to May: off season"),
        paragraphs: [
          l(
            "Bu davrda ko'lga cho'milish uchun emas, manzara va sog'lomlashish uchun boriladi: issiq buloqlar, tog' daralari, kuzgi ranglar va deyarli bo'm-bo'sh qirg'oq. Qishda Qorako'l yaqinida tog' chang'isi mavsumi ochiladi.",
            "В это время на озеро едут не купаться, а за видами и оздоровлением: горячие источники, горные ущелья, осенние краски и почти пустой берег. Зимой рядом с Караколом открывается горнолыжный сезон.",
            "At this time people come for scenery and wellness rather than swimming: hot springs, mountain gorges, autumn colours and an almost empty shore. In winter the ski season opens near Karakol.",
          ),
          l(
            "Bizning Issiq-Ko'l turimizning kuzgi va bahorgi sanalari aynan shunga qurilgan: issiq buloqlar, mahalliy oshxona va tabiat. Plyaj dam olishini kutayotgan bo'lsangiz, yozgi sanalarni menejerdan so'rang.",
            "Осенние и весенние даты нашего тура на Иссык-Куль построены именно на этом: горячие источники, местная кухня и природа. Если вы ждёте пляжного отдыха, спросите у менеджера о летних датах.",
            "The autumn and spring dates of our Issyk-Kul tour are built around exactly that: hot springs, local cuisine and nature. If you want a beach holiday, ask the manager about summer dates.",
          ),
        ],
      },
      {
        id: "shores",
        heading: l("Shimoliy yoki janubiy qirg'oq", "Северный или южный берег", "North shore or south shore"),
        paragraphs: [
          l(
            "Shimoliy qirg'oq (Cho'lpon-Ota, Bo'steri) — asosiy kurort hududi: qumli plyajlar, pansionatlar, kafe va ko'ngilochar joylar. Bolali oilalar va qulaylikni qadrlaydiganlar uchun mos.",
            "Северный берег (Чолпон-Ата, Бостери) — главная курортная зона: песчаные пляжи, пансионаты, кафе и развлечения. Подходит семьям с детьми и тем, кто ценит комфорт.",
            "The north shore (Cholpon-Ata, Bosteri) is the main resort area: sandy beaches, guesthouses, cafés and entertainment. It suits families with children and anyone who values comfort.",
          ),
          l(
            "Janubiy qirg'oq sokinroq va yovvoyiroq: mehmonxonalar kam, lekin manzaralar ta'sirliroq, daralar yaqinroq. Tabiat va suratga olish uchun kelganlar ko'pincha shu tomonni tanlaydi.",
            "Южный берег тише и более дикий: отелей меньше, зато пейзажи выразительнее, а ущелья ближе. Те, кто едет за природой и фотографиями, чаще выбирают эту сторону.",
            "The south shore is quieter and wilder: fewer hotels, but more dramatic landscapes and closer gorges. Those who come for nature and photography tend to choose this side.",
          ),
        ],
      },
      {
        id: "packing",
        heading: l("O'zingiz bilan nima olish kerak", "Что взять с собой", "What to pack"),
        paragraphs: [
          l(
            "Balandlik tufayli ob-havo bir kunda bir necha marta o'zgarishi mumkin, quyosh esa tekislikdagidan kuchliroq. Yilning qaysi oyida bormang, quyidagilar kerak bo'ladi:",
            "Из-за высоты погода может меняться несколько раз за день, а солнце сильнее, чем на равнине. В какой бы месяц вы ни ехали, пригодится следующее:",
            "Because of the altitude the weather can change several times a day, and the sun is stronger than on the plains. Whichever month you go, you will need:",
          ),
        ],
        list: [
          l(
            "yuqori himoyali quyoshdan saqlovchi krem va bosh kiyim",
            "солнцезащитный крем с высокой защитой и головной убор",
            "high-factor sunscreen and a hat",
          ),
          l(
            "kechqurun uchun iliq kofta yoki yengil kurtka",
            "тёплая кофта или лёгкая куртка на вечер",
            "a warm jumper or light jacket for the evenings",
          ),
          l(
            "tog' yo'laklari uchun qulay yopiq poyabzal",
            "удобная закрытая обувь для горных троп",
            "comfortable closed shoes for mountain paths",
          ),
          l(
            "cho'milish kiyimi — mavsumdan tashqarida ham, issiq buloqlar uchun",
            "купальник — даже вне сезона, для горячих источников",
            "swimwear — even off season, for the hot springs",
          ),
          l(
            "sayohat hujjatlari: qaysi hujjat bilan kirish mumkinligini jo'nashdan oldin menejerimizdan aniqlang",
            "документы для поездки: по какому документу возможен въезд, уточните у нашего менеджера перед выездом",
            "travel documents: check with our manager before departure which document you can enter with",
          ),
        ],
      },
    ],
  },
  {
    slug: "dubai-eight-days-budget",
    date: "2026-07-15",
    readMinutes: 5,
    image: "/img/blog-3.jpg",
    imageAlt: l("Dubay shahri manzarasi", "Вид на Дубай", "A view of Dubai"),
    title: l(
      "Dubayda sakkiz kun: byudjetni qanday rejalashtirish",
      "Восемь дней в Дубае: как спланировать бюджет",
      "Eight days in Dubai: planning your budget",
    ),
    excerpt: l(
      "Tur narxiga nima kiradi, joyida nimaga pul ketadi va qaysi mayda xarajatlar ko'pincha unutiladi — band-band ko'rib chiqamiz.",
      "Что входит в цену тура, на что уходят деньги на месте и какие мелкие расходы чаще всего забывают — разбираем по пунктам.",
      "What the tour price covers, where the money goes on the spot and which small costs people forget — point by point.",
    ),
    intro: l(
      "Dubayda bir xil sakkiz kun turli sayohatchilarga butunlay boshqacha summaga tushishi mumkin. Byudjetni ikki qismga bo'lish qulay: jo'nashdan oldin to'lanadigan va joyida sarflanadigan xarajatlar. Quyidagi barcha raqamlar taxminiy — ular mo'ljal uchun.",
      "Одни и те же восемь дней в Дубае могут обойтись разным путешественникам в совершенно разные суммы. Бюджет удобно делить на две части: то, что оплачивается до вылета, и то, что тратится на месте. Все цифры ниже приблизительные — это ориентир.",
      "The same eight days in Dubai can cost very different amounts for different travellers. It helps to split the budget in two: what you pay before departure and what you spend on the spot. All figures below are approximate — treat them as a guide.",
    ),
    sections: [
      {
        id: "before",
        heading: l("Jo'nashdan oldin to'lanadigan qism", "Что оплачивается до вылета", "What you pay before departure"),
        paragraphs: [
          l(
            "Tur narxi odatda eng katta xarajatlarni — parvoz, mehmonxona va transferni qamraydi. Aniq tarkib har bir turda farq qiladi, shuning uchun tur sahifasidagi «Narxga kiradi» va «Narxga kirmaydi» ro'yxatlarini diqqat bilan o'qing.",
            "Цена тура обычно покрывает самые крупные расходы — перелёт, отель и трансфер. Точный состав отличается от тура к туру, поэтому внимательно читайте списки «Входит в цену» и «Не входит в цену» на странице тура.",
            "The tour price usually covers the biggest costs: flights, hotel and transfers. The exact contents vary from tour to tour, so read the 'Included' and 'Not included' lists on the tour page carefully.",
          ),
          l(
            "Ovqatlanish turiga alohida e'tibor bering. Nonushta kiritilgan mehmonxona kunlik xarajatni sezilarli kamaytiradi; tushlik va kechki ovqatni shaharda yeyish esa ko'pincha mehmonxonadagidan arzon va qiziqroq.",
            "Отдельно обратите внимание на тип питания. Отель с завтраком заметно снижает ежедневные расходы, а обедать и ужинать в городе часто дешевле и интереснее, чем в отеле.",
            "Pay particular attention to the meal plan. A hotel with breakfast noticeably cuts daily spending, while lunch and dinner in town are often cheaper and more interesting than in the hotel.",
          ),
        ],
      },
      {
        id: "season",
        heading: l("Mavsum narxga qanday ta'sir qiladi", "Как сезон влияет на цену", "How the season affects the price"),
        paragraphs: [
          l(
            "Noyabrdan martgacha Dubayda ob-havo eng qulay, mehmonxona narxlari esa eng yuqori — ayniqsa Yangi yil ta'tili va yirik ko'rgazmalar paytida. Maydan sentabrgacha havo juda issiq (40 °C dan yuqori), lekin mehmonxonalar ancha arzon.",
            "С ноября по март в Дубае самая комфортная погода, а цены на отели самые высокие — особенно в новогодние каникулы и во время крупных выставок. С мая по сентябрь очень жарко (выше 40 °C), зато отели заметно дешевле.",
            "From November to March Dubai has its most comfortable weather and its highest hotel rates, especially over the New Year holidays and during major exhibitions. From May to September it is very hot (above 40 °C), but hotels are considerably cheaper.",
          ),
          l(
            "Aprel va oktabr — oraliq variant: dengiz iliq, narxlar mavsum cho'qqisidan past. Byudjet cheklangan bo'lsa, shu oylardan boshlab ko'ring.",
            "Апрель и октябрь — промежуточный вариант: море тёплое, а цены ниже пиковых. Если бюджет ограничен, начните поиск с этих месяцев.",
            "April and October are the middle ground: the sea is warm and prices are below peak. If your budget is tight, start by looking at these months.",
          ),
        ],
      },
      {
        id: "daily",
        heading: l("Kundalik xarajatlar: ovqat va transport", "Ежедневные расходы: еда и транспорт", "Daily costs: food and transport"),
        paragraphs: [
          l(
            "Mahalliy valyuta — dirham (AED), kursi AQSh dollariga bog'langan: bir dollar taxminan 3,67 dirham. Savdo markazidagi fud-kortda yoki oddiy kafeda tushlik odatda 30–50 dirham, o'rta darajadagi restoranda kechki ovqat bir kishiga 80–150 dirham atrofida.",
            "Местная валюта — дирхам (AED), его курс привязан к доллару США: один доллар — примерно 3,67 дирхама. Обед на фуд-корте торгового центра или в простом кафе обычно стоит 30–50 дирхамов, ужин в ресторане среднего уровня — около 80–150 дирхамов на человека.",
            "The local currency is the dirham (AED), pegged to the US dollar at about 3.67 dirhams to the dollar. Lunch at a mall food court or a simple café is typically 30–50 dirhams; dinner at a mid-range restaurant is around 80–150 dirhams per person.",
          ),
          l(
            "Shahar bo'ylab metro va avtobusda yurish eng arzon: to'lov Nol kartasi orqali, bir safar bir necha dirham turadi. Taksi qulay, ammo kuniga bir necha marta chaqirilsa, xarajat tez yig'iladi.",
            "Дешевле всего передвигаться по городу на метро и автобусах: оплата картой Nol, одна поездка стоит несколько дирхамов. Такси удобно, но если вызывать его несколько раз в день, расходы быстро накапливаются.",
            "The metro and buses are the cheapest way around: you pay with a Nol card and a ride costs a few dirhams. Taxis are convenient, but several rides a day add up quickly.",
          ),
          l(
            "Mo'ljal sifatida ko'pchilik sayohatchilar ovqat va transportga bir kishi uchun kuniga taxminan 40–70 dollar rejalashtiradi. Bu raqam odatlaringizga qarab ikki tomonga ham o'zgaradi.",
            "Как ориентир многие путешественники закладывают на еду и транспорт примерно 40–70 долларов в день на человека. Эта цифра меняется в обе стороны в зависимости от ваших привычек.",
            "As a guide, many travellers plan roughly 40–70 dollars per person per day for food and transport. That figure moves either way depending on your habits.",
          ),
        ],
      },
      {
        id: "attractions",
        heading: l("Ko'ngilochar joylar va ekskursiyalar", "Развлечения и экскурсии", "Attractions and excursions"),
        paragraphs: [
          l(
            "Byudjetning eng o'zgaruvchan qismi shu. Burj Xalifa kuzatuv maydonchasi, cho'l safari, akvaparklar va tematik parklar chiptalari sana va vaqtga qarab farq qiladi: quyosh botishi paytidagi seanslar odatda qimmatroq, oldindan onlayn xarid esa ko'pincha arzonroq.",
            "Это самая переменчивая часть бюджета. Билеты на смотровую площадку Бурдж-Халифы, сафари по пустыне, в аквапарки и тематические парки зависят от даты и времени: сеансы на закате обычно дороже, а покупка онлайн заранее часто выгоднее.",
            "This is the most variable part of the budget. Tickets for the Burj Khalifa observation deck, a desert safari, water parks and theme parks depend on date and time: sunset slots usually cost more, and buying online in advance is often cheaper.",
          ),
          l(
            "Bepul yoki deyarli bepul narsalar ham ko'p: Dubay favvorasi tomoshasi, jamoat plyajlari, eski Deyra tumani va bozorlari, ko'rfaz orqali an'anaviy «abra» qayig'ida bir-ikki dirhamga suzib o'tish.",
            "Бесплатного и почти бесплатного тоже много: шоу фонтана Дубая, общественные пляжи, старый район Дейра и его рынки, переправа через залив на традиционной лодке «абра» за пару дирхамов.",
            "There is also plenty that is free or nearly free: the Dubai Fountain show, public beaches, the old Deira district and its souks, and a crossing of the Creek on a traditional abra boat for a couple of dirhams.",
          ),
        ],
      },
      {
        id: "extras",
        heading: l("Ko'pincha unutiladigan xarajatlar", "Расходы, о которых часто забывают", "Costs people often forget"),
        paragraphs: [
          l(
            "Mehmonxonalar har bir xona uchun kechasiga «turizm dirhami» yig'imini joyida oladi — miqdori mehmonxona toifasiga bog'liq. Narxlarga 5% QQS qo'shiladi, restoranlarda esa hisobga xizmat haqi kiritilishi mumkin.",
            "Отели на месте взимают сбор «туристический дирхам» за номер за ночь — его размер зависит от категории отеля. К ценам добавляется НДС 5%, а в ресторанах в счёт может быть включён сервисный сбор.",
            "Hotels collect a 'Tourism Dirham' fee per room per night on the spot — the amount depends on the hotel's category. Prices carry 5% VAT, and restaurants may add a service charge to the bill.",
          ),
          l(
            "Ro'yxatga mobil internet (mahalliy SIM yoki eSIM), tibbiy sug'urta va sovg'alarni ham qo'shing. Kirish qoidalari va hujjatlar bo'yicha amaldagi talablarni jo'nashdan oldin menejerimizdan aniqlang.",
            "Добавьте в список мобильный интернет (местная SIM-карта или eSIM), медицинскую страховку и сувениры. Действующие правила въезда и требования к документам уточните у нашего менеджера перед вылетом.",
            "Add mobile data (a local SIM or eSIM), medical insurance and souvenirs to the list. Check the current entry rules and document requirements with our manager before you fly.",
          ),
        ],
      },
      {
        id: "tips",
        heading: l("Tejash bo'yicha amaliy maslahatlar", "Практичные советы по экономии", "Practical ways to save"),
        paragraphs: [
          l(
            "Tejash — o'zingizni cheklash degani emas, xarajatni oldindan ko'ra bilishdir:",
            "Экономить — не значит себя ограничивать; это значит видеть расходы заранее:",
            "Saving does not mean going without; it means seeing the costs coming:",
          ),
        ],
        list: [
          l(
            "nonushta kiritilgan mehmonxonani tanlang",
            "выбирайте отель с завтраком",
            "choose a hotel with breakfast included",
          ),
          l(
            "kuniga bitta pullik ko'ngilochar joy rejalashtiring, qolgan vaqtni bepul joylarga ajrating",
            "планируйте одно платное развлечение в день, а остальное время отдавайте бесплатным местам",
            "plan one paid attraction a day and give the rest of the time to free sights",
          ),
          l(
            "chiptalarni oldindan onlayn oling",
            "покупайте билеты онлайн заранее",
            "buy tickets online in advance",
          ),
          l(
            "karta deyarli hamma joyda qabul qilinadi, lekin bozor va «abra» uchun ozroq naqd pul saqlang",
            "карты принимают почти везде, но для рынков и «абры» держите немного наличных",
            "cards are accepted almost everywhere, but keep a little cash for the souks and the abra",
          ),
          l(
            "kutilmagan xarajatlar uchun byudjetning 10–15 foizini zaxirada qoldiring",
            "оставьте 10–15% бюджета в запасе на непредвиденные расходы",
            "keep 10–15% of the budget in reserve for the unexpected",
          ),
        ],
      },
    ],
  },
];

/** Yangi maqolalar birinchi. */
