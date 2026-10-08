// Ravon Travel — shared translation dictionary + page helpers (UZ source -> RU/EN)
(function () {
  const DICT = {
    // ---- chrome
    "Bosh sahifa": { ru: "Главная", en: "Home" },
    "Turlar": { ru: "Туры", en: "Tours" },
    "Yo'nalishlar": { ru: "Направления", en: "Destinations" },
    "Blog": { ru: "Блог", en: "Blog" },
    "Biz haqimizda": { ru: "О нас", en: "About us" },
    "Aloqa": { ru: "Контакты", en: "Contact" },
    "Bron qilish": { ru: "Забронировать", en: "Book now" },
    "Menyu": { ru: "Меню", en: "Menu" },
    "Yopish": { ru: "Закрыть", en: "Close" },
    "Chiquvchi turizm bo'yicha litsenziyalangan turoperator.": { ru: "Лицензированный туроператор по выездному туризму.", en: "Licensed tour operator for outbound tourism." },
    "Navigatsiya": { ru: "Навигация", en: "Navigation" },
    "Kompaniya": { ru: "Компания", en: "Company" },
    "Yordam": { ru: "Помощь", en: "Help" },
    "Litsenziya": { ru: "Лицензия", en: "Licence" },
    "Jamoa": { ru: "Команда", en: "Team" },
    "Rekvizitlar": { ru: "Реквизиты", en: "Company details" },
    "Savol-javob": { ru: "Вопросы и ответы", en: "FAQ" },
    "Foydalanish shartlari": { ru: "Условия использования", en: "Terms of use" },
    "Maxfiylik siyosati": { ru: "Политика конфиденциальности", en: "Privacy policy" },
    "Bekor qilish siyosati": { ru: "Политика отмены", en: "Cancellation policy" },
    "© 2026 Ravon Travel. Barcha huquqlar himoyalangan.": { ru: "© 2026 Ravon Travel. Все права защищены.", en: "© 2026 Ravon Travel. All rights reserved." },

    // ---- catalogue chrome
    "Turlar katalogi": { ru: "Каталог туров", en: "Tour catalogue" },
    "Barcha turlar": { ru: "Все туры", en: "All tours" },
    "Chiquvchi turizm — O'zbekistondan xorijga tayyor turlar. Narx, muddat va marshrut oldindan belgilangan.": { ru: "Выездной туризм — готовые туры из Узбекистана за рубеж. Цена, срок и маршрут определены заранее.", en: "Outbound tourism — ready-made tours from Uzbekistan. Price, duration and itinerary are set in advance." },
    "Filtrlar": { ru: "Фильтры", en: "Filters" },
    "Filtrlarni tozalash": { ru: "Сбросить фильтры", en: "Clear filters" },
    "Tozalash": { ru: "Сбросить", en: "Clear" },
    "Yo'nalish": { ru: "Направление", en: "Destination" },
    "Kategoriya": { ru: "Категория", en: "Category" },
    "Narx oralig'i": { ru: "Ценовой диапазон", en: "Price range" },
    "Muddat": { ru: "Длительность", en: "Duration" },
    "Faqat sanasi belgilangan turlar": { ru: "Только туры с фиксированной датой", en: "Fixed-departure tours only" },
    "Saralash": { ru: "Сортировка", en: "Sort by" },
    "Ommabop": { ru: "Популярные", en: "Popular" },
    "Narx: arzondan": { ru: "Цена: по возрастанию", en: "Price: low to high" },
    "Narx: qimmatdan": { ru: "Цена: по убыванию", en: "Price: high to low" },
    "Muddat: qisqadan": { ru: "Длительность: по возрастанию", en: "Duration: shortest first" },
    "tur topildi": { ru: "туров найдено", en: "tours found" },
    "Hech qanday tur topilmadi": { ru: "Туры не найдены", en: "No tours found" },
    "Tanlangan filtrlar bo'yicha mos tur yo'q. Filtrlarni kengaytirib ko'ring yoki biz bilan bog'laning — sizga individual tur tuzamiz.": { ru: "По выбранным фильтрам туров нет. Расширьте фильтры или свяжитесь с нами — составим индивидуальный тур.", en: "No tours match these filters. Try widening them, or contact us and we'll build a custom tour." },
    "Individual tur so'rash": { ru: "Запросить индивидуальный тур", en: "Request a custom tour" },
    "kun": { ru: "дней", en: "days" },
    "Sanasi bor": { ru: "С датой", en: "Fixed departure" },
    "So'rov bo'yicha": { ru: "По запросу", en: "On request" },
    "Batafsil": { ru: "Подробнее", en: "Details" },
    "1 kishi uchun · dan": { ru: "за человека · от", en: "per person · from" },
    "o'rin qoldi": { ru: "мест осталось", en: "seats left" },
    "Barchasi": { ru: "Все", en: "All" },
    "Istalgan": { ru: "Любая", en: "Any" },
    "gacha": { ru: "до", en: "up to" },
    "Ko'rsatilmoqda": { ru: "Показано", en: "Showing" },

    // ---- categories
    "Tarixiy turlar": { ru: "Исторические туры", en: "Historical tours" },
    "Tabiat turlari": { ru: "Природные туры", en: "Nature tours" },
    "Plyaj dam olish": { ru: "Пляжный отдых", en: "Beach holidays" },
    "Davolanish turlari": { ru: "Лечебные туры", en: "Wellness tours" },
    "Kruiz": { ru: "Круизы", en: "Cruises" },

    // ---- countries
    "Ozarbayjon": { ru: "Азербайджан", en: "Azerbaijan" },
    "Gruziya": { ru: "Грузия", en: "Georgia" },
    "BAA": { ru: "ОАЭ", en: "UAE" },
    "Xitoy": { ru: "Китай", en: "China" },
    "Malayziya": { ru: "Малайзия", en: "Malaysia" },
    "Bolgariya": { ru: "Болгария", en: "Bulgaria" },
    "Yunoniston": { ru: "Греция", en: "Greece" },
    "Qatar": { ru: "Катар", en: "Qatar" },
    "Qirg'iziston": { ru: "Кыргызстан", en: "Kyrgyzstan" },

    // ---- tours
    "Ozarbayjon — «7 mo'jiza» ekskursiyasi": { ru: "Азербайджан — экскурсия «7 чудес»", en: "Azerbaijan — the '7 Wonders' tour" },
    "Baku, Gobustan, Yanardag va Atashgah — olti kunda yettita noyob makon.": { ru: "Баку, Гобустан, Янардаг и Атешгях — семь уникальных мест за шесть дней.", en: "Baku, Gobustan, Yanardag and Ateshgah — seven unique sites in six days." },
    "Naftalan — Davolanish va sog'lomlashtirish turi": { ru: "Нафталан — лечебно-оздоровительный тур", en: "Naftalan — health and wellness tour" },
    "Ozarbayjondagi tabiiy neft vannalari — tayanch-harakat tizimi uchun.": { ru: "Природные нефтяные ванны в Азербайджане — для опорно-двигательной системы.", en: "Azerbaijan's natural oil baths — for the musculoskeletal system." },
    "Xitoy — «Avatar» tog'lari va Guangzhou": { ru: "Китай — горы «Аватар» и Гуанчжоу", en: "China — the 'Avatar' mountains and Guangzhou" },
    "«Avatar» filmiga ilhom bergan Zhangjiajie tog'lari va zamonaviy Guangzhou.": { ru: "Горы Чжанцзяцзе, вдохновившие фильм «Аватар», и современный Гуанчжоу.", en: "The Zhangjiajie mountains that inspired 'Avatar', plus modern Guangzhou." },
    "Dubay — Hashamatli BAA sayohati": { ru: "Дубай — роскошное путешествие по ОАЭ", en: "Dubai — a luxury UAE escape" },
    "Burj Xalifa, cho'l safari va Palm Jumeyra — yetti kechalik shahar dam olishi.": { ru: "Бурдж-Халифа, сафари по дюнам и Палм-Джумейра — семь ночей в городе.", en: "Burj Khalifa, a desert safari and Palm Jumeirah — seven nights in the city." },
    "Gruziya — Batumi, Bakuriani va Tbilisi": { ru: "Грузия — Батуми, Бакуриани и Тбилиси", en: "Georgia — Batumi, Bakuriani and Tbilisi" },
    "Qora dengiz qirg'og'idagi Batumi, tog' kurorti Bakuriani va qadimiy Tbilisi.": { ru: "Батуми на Чёрном море, горный курорт Бакуриани и старый Тбилиси.", en: "Seaside Batumi, the Bakuriani mountain resort and old Tbilisi." },
    "Issiq-Ko'l — Qirg'iziston tog' dengizi": { ru: "Иссык-Куль — горное море Кыргызстана", en: "Issyk-Kul — Kyrgyzstan's mountain sea" },
    "Tyan-Shan tog'lari ichidagi sho'r ko'l, mahalliy oshxona va issiq buloqlar.": { ru: "Солёное озеро в Тянь-Шане, местная кухня и горячие источники.", en: "A salt lake in the Tian Shan, local cuisine and hot springs." },
    "Malayziya — Kuala-Lumpur va Langkavi": { ru: "Малайзия — Куала-Лумпур и Лангкави", en: "Malaysia — Kuala Lumpur and Langkawi" },
    "Petronas minoralari, tropik o'rmon va Langkavi orolidagi plyajlar.": { ru: "Башни Петронас, тропический лес и пляжи острова Лангкави.", en: "The Petronas Towers, rainforest and the beaches of Langkawi." },
    "Bolgariya — Quyoshli plyaj va Nesebar": { ru: "Болгария — Солнечный берег и Несебр", en: "Bulgaria — Sunny Beach and Nessebar" },
    "Qora dengizdagi qumli plyajlar va YUNESKO ro'yxatidagi qadimiy Nesebar.": { ru: "Песчаные пляжи Чёрного моря и древний Несебр из списка ЮНЕСКО.", en: "Black Sea sand and the UNESCO-listed old town of Nessebar." },
    "Yunoniston orollari kruizi": { ru: "Круиз по греческим островам", en: "Greek islands cruise" },
    "Egey dengizi bo'ylab kruiz: Santorini, Mikonos va Krit orollari.": { ru: "Круиз по Эгейскому морю: Санторини, Миконос и Крит.", en: "An Aegean cruise: Santorini, Mykonos and Crete." },
    "Qatar — Doha shahri va cho'l": { ru: "Катар — Доха и пустыня", en: "Qatar — Doha and the desert" },
    "Souq Waqif bozori, Islom san'ati muzeyi va cho'ldagi ichki dengiz.": { ru: "Базар Сук-Вакиф, Музей исламского искусства и внутреннее море в пустыне.", en: "Souq Waqif, the Museum of Islamic Art and the desert inland sea." }
  };

  const MONTHS = {
    uz: ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"],
    ru: ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"],
    en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
  };

  const UZS_RATE = 12650;

  const RT = {
    DICT: DICT,
    UZS_RATE: UZS_RATE,

    t(uz, locale) {
      if (!uz) return uz;
      if (locale === "uz" || !locale) return uz;
      const row = DICT[uz];
      return row && row[locale] ? row[locale] : uz;
    },

    money(usd, currency, locale) {
      if (currency !== "UZS") return "$" + Number(usd).toLocaleString("en-US");
      const som = Math.round(Number(usd) * UZS_RATE / 1000) * 1000;
      const suffix = locale === "ru" ? " сум" : locale === "en" ? " UZS" : " so'm";
      return som.toLocaleString("ru-RU").replace(/\u00a0/g, " ") + suffix;
    },

    date(iso, locale) {
      const d = new Date(iso + "T00:00:00");
      const m = MONTHS[locale || "uz"][d.getMonth()];
      if (locale === "en") return d.getDate() + " " + m + " " + d.getFullYear();
      return d.getDate() + " " + m + " " + d.getFullYear();
    },

    // static chrome translation: walks leaf text nodes, remembering the UZ source
    applyLocale(root, locale) {
      if (!root) return;
      document.documentElement.setAttribute("lang", locale);
      root.querySelectorAll("*").forEach(el => {
        if (el.children.length) return;
        if (el.tagName.indexOf("-") > -1) return;
        if (el.hasAttribute("data-no-i18n")) return;
        if (el.closest("[data-no-i18n]")) return;
        let orig = el.getAttribute("data-uz");
        if (orig === null) {
          orig = (el.textContent || "").trim();
          if (!orig) return;
          el.setAttribute("data-uz", orig);
        }
        el.textContent = RT.t(orig, locale);
      });
      root.querySelectorAll("[aria-label]").forEach(el => {
        let orig = el.getAttribute("data-uz-aria");
        if (orig === null) {
          orig = el.getAttribute("aria-label");
          el.setAttribute("data-uz-aria", orig);
        }
        el.setAttribute("aria-label", RT.t(orig, locale));
      });
      root.querySelectorAll("[data-i18n-ph]").forEach(el => {
        el.setAttribute("placeholder", RT.t(el.getAttribute("data-i18n-ph"), locale));
      });
    },

    applyLangButtons(root, locale) {
      if (!root) return;
      root.querySelectorAll("[data-lang]").forEach(btn => {
        const on = btn.dataset.lang === locale;
        btn.style.background = on ? "#0A66E8" : "transparent";
        btn.style.color = on ? "#FFFFFF" : "#5C5C5C";
        btn.setAttribute("aria-pressed", on ? "true" : "false");
      });
    },

    // [data-vp="mobile"|"desktop"] with [data-vpd] display value
    applyViewport(root, breakpoint) {
      if (!root) return;
      const mobile = window.innerWidth < (breakpoint || 940);
      root.querySelectorAll("[data-vp]").forEach(el => {
        const wantsMobile = el.dataset.vp === "mobile";
        el.style.display = wantsMobile === mobile ? (el.dataset.vpd || "flex") : "none";
      });
    },

    isMobile(breakpoint) { return window.innerWidth < (breakpoint || 940); },

    // reveal-on-scroll that can never leave content invisible
    initReveal(root, store) {
      if (!root) return;
      const show = el => { el.setAttribute("data-revealed", "1"); el.style.opacity = ""; el.style.transform = ""; };
      const all = Array.from(root.querySelectorAll("[data-reveal]"));
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { all.forEach(show); return; }
      const vh = window.innerHeight;
      const hidden = all.filter(el => !el.hasAttribute("data-revealed") && el.getBoundingClientRect().top > vh * 0.92);
      all.filter(el => hidden.indexOf(el) < 0).forEach(show);
      hidden.forEach(el => {
        el.style.opacity = "0";
        el.style.transform = "translateY(22px)";
        el.style.transition = "opacity 0.7s cubic-bezier(0.4,0,0.2,1), transform 0.7s cubic-bezier(0.4,0,0.2,1)";
      });
      if (!hidden.length) return;
      if (typeof IntersectionObserver === "function") {
        const io = new IntersectionObserver(entries => {
          entries.forEach(e => { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } });
        }, { rootMargin: "0px 0px -6% 0px", threshold: 0.05 });
        hidden.forEach(el => io.observe(el));
        if (store) store.io = io;
      }
      const tid = setTimeout(() => {
        hidden.forEach(el => { if (el.getBoundingClientRect().top < vh * 1.4) show(el); });
        const tid2 = setTimeout(() => hidden.forEach(show), 2500);
        if (store) store.t2 = tid2;
      }, 700);
      if (store) store.t1 = tid;
    },

    stopReveal(store) {
      if (!store) return;
      if (store.io) store.io.disconnect();
      clearTimeout(store.t1);
      clearTimeout(store.t2);
    }
  };

  window.RT = RT;
})();
