/* ==========================================================
   LUMIBOT FISHING - GEAR.JS
   Каталог снастей: удочки, лески, наживки и методы ловли
   ========================================================== */

    const RODS = {
      bamboo: {
        id: "bamboo",
        name: "Бамбуковая удочка",
        levelReq: 1,
        price: 0,
        speedBonus: 1.0,
        safeZoneMin: 25,
        safeZoneMax: 75,
        rareBonus: 0,
        blankColor: '#d97706',
        highlightColor: '#fbbf24',
        shadowColor: '#78350f',
        desc: "Базовое удилище из речного бамбука. Простое и надежное."
      },
      spinning_beginner: {
        id: "spinning_beginner",
        name: "Спиннинг «Ветерок 1.8м»",
        levelReq: 3,
        price: 160,
        speedBonus: 1.10,
        safeZoneMin: 23,
        safeZoneMax: 77,
        rareBonus: 4,
        blankColor: '#0284c7',
        highlightColor: '#38bdf8',
        shadowColor: '#0369a1',
        desc: "Лёгкий стеклопластиковый спиннинг для начинающих рыболовов."
      },
      carbon: {
        id: "carbon",
        name: "Карбоновый спиннинг Pro",
        levelReq: 6,
        price: 420,
        speedBonus: 1.20,
        safeZoneMin: 20,
        safeZoneMax: 80,
        rareBonus: 8,
        blankColor: '#1e293b',
        highlightColor: '#38bdf8',
        shadowColor: '#090d16',
        desc: "Быстрый строй бланка IM7, +20% к скорости вываживания хищника."
      },
      spinning_pike: {
        id: "spinning_pike",
        name: "Щучий спиннинг «Хищник-М»",
        levelReq: 10,
        price: 900,
        speedBonus: 1.28,
        safeZoneMin: 18,
        safeZoneMax: 82,
        rareBonus: 14,
        blankColor: '#15803d',
        highlightColor: '#4ade80',
        shadowColor: '#14532d',
        desc: "Усиленный комлевый спиннинг для агрессивного твичинга зубастой щуки."
      },
      spinning_heavy: {
        id: "spinning_heavy",
        name: "Джиг-спиннинг «Тайфун»",
        levelReq: 15,
        price: 1750,
        speedBonus: 1.38,
        safeZoneMin: 16,
        safeZoneMax: 84,
        rareBonus: 20,
        blankColor: '#b91c1c',
        highlightColor: '#f87171',
        shadowColor: '#7f1d1d',
        desc: "Мощный джиговый бланк. Уверенно гасит сопротивление судаков и сомов."
      },
      spinning_berkley: {
        id: "spinning_berkley",
        name: "Спиннинг «Сибирский Таймень»",
        levelReq: 21,
        price: 3100,
        speedBonus: 1.50,
        safeZoneMin: 14,
        safeZoneMax: 86,
        rareBonus: 28,
        blankColor: '#475569',
        highlightColor: '#94a3b8',
        shadowColor: '#1e293b',
        desc: "Высокомодульный композит для вываживания речных гигантов и лососей."
      },
      titanium: {
        id: "titanium",
        name: "Титановый спиннинг «Predator-X»",
        levelReq: 28,
        price: 5200,
        speedBonus: 1.65,
        safeZoneMin: 12,
        safeZoneMax: 88,
        rareBonus: 38,
        blankColor: '#64748b',
        highlightColor: '#cbd5e1',
        shadowColor: '#334155',
        desc: "Титановые пропускные кольца, непревзойденный контроль и дальность."
      },
      spinning_aurora: {
        id: "spinning_aurora",
        name: "Спиннинг «Северное Сияние»",
        levelReq: 36,
        price: 8500,
        speedBonus: 1.80,
        safeZoneMin: 10,
        safeZoneMax: 90,
        rareBonus: 50,
        blankColor: '#7c3aed',
        highlightColor: '#c084fc',
        shadowColor: '#4c1d95',
        desc: "Светящийся в сумерках мифический бланк. Завораживает трофейную рыбу."
      },
      gold_master: {
        id: "gold_master",
        name: "Золотой Мастер Pro",
        levelReq: 45,
        price: 14000,
        speedBonus: 2.00,
        safeZoneMin: 8,
        safeZoneMax: 92,
        rareBonus: 65,
        blankColor: '#eab308',
        highlightColor: '#fef08a',
        shadowColor: '#a16207',
        desc: "Шедевр ручной работы! Максимальная зона контроля и скорость подмотки."
      }
    };

    // Каталог лесок


    const LINES = {
      mono_light: {
        id: "mono_light",
        name: "Нейлон 0.16мм (Ультра)",
        levelReq: 1,
        price: 0,
        dangerBuffer: 1.0,
        spoolColor: '#f1f5f9',
        desc: "Тончайшая леска. 1.0 сек запаса прочности в критической зоне."
      },
      mono: {
        id: "mono",
        name: "Монофил Classic 0.22мм",
        levelReq: 2,
        price: 90,
        dangerBuffer: 1.4,
        spoolColor: '#cbd5e1',
        desc: "Надежный монофил. 1.4 сек запаса на исправление ошибки натяжения."
      },
      mono_heavy: {
        id: "mono_heavy",
        name: "Усиленный монофил 0.28мм",
        levelReq: 5,
        price: 220,
        dangerBuffer: 1.7,
        spoolColor: '#86efac',
        desc: "Толстая эластичная леска с амортизацией. 1.7 сек буфера."
      },
      fluoro: {
        id: "fluoro",
        name: "Флюорокарбон Stealth 0.35мм",
        levelReq: 9,
        price: 400,
        dangerBuffer: 2.1,
        spoolColor: '#5eead4',
        desc: "Невидима в чистой таёжной воде. 2.1 сек запаса в критической зоне."
      },
      braided_4x: {
        id: "braided_4x",
        name: "Плетёный шнур 4X Камуфляж",
        levelReq: 14,
        price: 750,
        dangerBuffer: 2.6,
        spoolColor: '#4ade80',
        desc: "Плотное 4-жильное плетение без растяжения. 2.6 сек запаса."
      },
      braided: {
        id: "braided",
        name: "Плетёный шнур Pro 8X",
        levelReq: 20,
        price: 1300,
        dangerBuffer: 3.2,
        spoolColor: '#38bdf8',
        desc: "Сверхгладкий 8-жильный японский шнур. 3.2 сек запаса на исправление!"
      },
      titanium_leader: {
        id: "titanium_leader",
        name: "Шнур с титановым поводком",
        levelReq: 27,
        price: 2200,
        dangerBuffer: 3.9,
        spoolColor: '#c084fc',
        desc: "Щучьи зубы бессильны против титана. 3.9 сек запаса до обрыва."
      },
      nanofil_trophy: {
        id: "nanofil_trophy",
        name: "Нанонить «Стальной Шёлк»",
        levelReq: 35,
        price: 3800,
        dangerBuffer: 4.7,
        spoolColor: '#facc15',
        desc: "Экстремальная прочность микроволокон. 4.7 сек запаса!"
      },
      mythic_cord: {
        id: "mythic_cord",
        name: "Мифический корд «Драконья Жила»",
        levelReq: 44,
        price: 6500,
        dangerBuffer: 5.8,
        spoolColor: '#f43f5e',
        desc: "Древний плетёный корд. 5.8 сек абсолютной стойкости к перегрузкам."
      }
    };

    // Состояние игрока



    /* ==========================================================
       КАТАЛОГ РЫБЫ И СУЩНОСТЕЙ (МОДУЛЬНАЯ ИНТЕГРАЦИЯ)
       ========================================================== */
    const FISH_DATABASE = (typeof ENTITY_DATA !== 'undefined' && Array.isArray(ENTITY_DATA.FISH_SPECIES))
      ? ENTITY_DATA.FISH_SPECIES
      : [];

    function getEntityById(id) {
      if (typeof ENTITY_DATA !== 'undefined') {
        const fish = ENTITY_DATA.FISH_SPECIES.find(f => f.id === id);
        if (fish) return fish;
        const beast = ENTITY_DATA.BEAST_SPECIES.find(b => b.id === id);
        if (beast) return beast;
        const junk = ENTITY_DATA.JUNK_ITEMS.find(j => j.id === id);
        if (junk) return junk;
      }
      return FISH_DATABASE.find(f => f.id === id) || null;
    }



    /* ==========================================================
       SVG ИКОНКИ ДЛЯ СПОСОБОВ ЛОВЛИ И ПРИМАНОК
       ========================================================== */
    const SVG_ICONS = {
      float: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="7"></circle><path d="M12 2v3M12 19v3"></path><path d="M5 12h14"></path></svg>`,
      spinning: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`,
      feeder: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>`,
      fly: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path><line x1="16" y1="8" x2="2" y2="22"></line><line x1="17.5" y1="15" x2="9" y2="15"></line></svg>`,
      worm: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19c2-3 4-2 7-5s2-5 5-6 4 1 4 4-2 5-6 6-5 2-10 1z"></path></svg>`,
      corn: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="12" rx="6" ry="9"></ellipse><line x1="12" y1="3" x2="12" y2="21"></line><line x1="7" y1="10" x2="17" y2="10"></line><line x1="7" y1="14" x2="17" y2="14"></line></svg>`,
      dough: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"></circle><circle cx="9" cy="10" r="1" fill="currentColor"></circle><circle cx="15" cy="11" r="1" fill="currentColor"></circle></svg>`,
      bloodworm: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a5 5 0 0 0-5 5c0 4 5 13 5 13s5-9 5-13a5 5 0 0 0-5-5z"></path></svg>`,
      lure_spoon: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C8 2 5 6 5 11c0 6 7 11 7 11s7-5 7-11c0-5-3-9-7-9z"></path></svg>`,
      lure_spinner: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M12 3v6M12 15v6M3 12h6M15 12h6"></path></svg>`,
      lure_wobbler: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6z"></path><circle cx="16" cy="12" r="1.5"></circle></svg>`,
      lure_jig: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="4"></circle><path d="M12 8c4 0 7 2 7 6s-3 6-7 6"></path></svg>`,
      feeder_mix: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11c0 5 4 9 9 9s9-4 9-9H3z"></path><line x1="3" y1="11" x2="21" y2="11"></line></svg>`,
      boilie: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="7"></circle></svg>`,
      maggot: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="12" rx="4" ry="7" transform="rotate(30 12 12)"></ellipse></svg>`,
      live_bait: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12c3-4 8-4 13 0-5 4-10 4-13 0z"></path><polygon points="17 12 21 9 21 15 17 12"></polygon></svg>`,
      dry_fly: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 2 20 20M7 3l4 4-2 3-5-2zM17 13l4 4-5 2-2-3z"></path></svg>`,
      nymph: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v16M8 8l8 8M16 8l-8 8"></path></svg>`,
      streamer: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 3s-6 2-10 7-5 11-5 11 6-2 10-7 5-11 5-11z"></path></svg>`,
      mayfly: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M6 8a6 6 0 0 1 12 0c0 4-6 8-6 8s-6-4-6-8z"></path></svg>`,
      chest: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>`,
      fuel: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>`,
      hazard: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
      edible: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>`
    };



    /* ==========================================================
       СПОСОБЫ ЛОВЛИ (FISHING METHODS)
       ========================================================== */
    const FISHING_METHODS = {
      float: {
        id: "float",
        name: "Поплавок",
        levelReq: 1,
        price: 0,
        iconSvg: SVG_ICONS.float,
        desc: "Классическая ловля с поплавком. Озерная и речная рыба всех горизонтов.",
        biteSpeedMult: 1.0,
        rareBonus: 0,
        baits: ["worm", "corn", "dough", "bloodworm"]
      },
      spinning: {
        id: "spinning",
        name: "Спиннинг",
        levelReq: 4,
        price: 250,
        iconSvg: SVG_ICONS.spinning,
        desc: "Активная проводка приманки! Приманивает стремительных и яростных хищников.",
        biteSpeedMult: 1.25,
        rareBonus: 8,
        baits: ["lure_spoon", "lure_spinner", "lure_wobbler", "lure_jig"]
      },
      feeder: {
        id: "feeder",
        name: "Фидер",
        levelReq: 12,
        price: 600,
        iconSvg: SVG_ICONS.feeder,
        desc: "Донная снасть с кормушкой и бубенцом. Охота за донными исполинами!",
        biteSpeedMult: 0.95,
        rareBonus: 10,
        baits: ["feeder_mix", "boilie", "maggot", "live_bait"]
      },
      fly: {
        id: "fly",
        name: "Нахлыст",
        levelReq: 22,
        price: 1200,
        iconSvg: SVG_ICONS.fly,
        desc: "Изящная ловля на плавающую мушку. Верховая рыба и ценные лососевые.",
        biteSpeedMult: 1.15,
        rareBonus: 12,
        baits: ["dry_fly", "nymph", "streamer", "mayfly"]
      }
    };
    window.FISHING_METHODS = FISHING_METHODS;
    var currentFishingMethod = "float";

    // Каталог всех наживок и приманок с уровневой прогрессией и ценами закупки


    const BAITS = {
      // Поплавочные
      worm: {
        id: "worm",
        name: "Червь",
        levelReq: 1,
        unlockPrice: 0,
        packPrice: 50,
        packCount: 10,
        desc: "Классическая наживка. Любимое лакомство карасей, плотвы и окуней.",
        iconSvg: SVG_ICONS.worm,
        method: "float",
        waitMin: 3500,
        waitMax: 6500,
        speedMultiplier: 1.0,
        rarityWeights: { Common: 70, Rare: 24, Epic: 5.5, Legendary: 0.5 }
      },
      corn: {
        id: "corn",
        name: "Кукуруза",
        levelReq: 3,
        unlockPrice: 100,
        packPrice: 120,
        packCount: 10,
        desc: "Сладкие консервированные зерна. Манят золотистого карася, амура и карпа.",
        iconSvg: SVG_ICONS.corn,
        method: "float",
        waitMin: 2500,
        waitMax: 5000,
        speedMultiplier: 1.35,
        rarityWeights: { Common: 78, Rare: 19, Epic: 2.7, Legendary: 0.3 }
      },
      dough: {
        id: "dough",
        name: "Тесто",
        levelReq: 3,
        unlockPrice: 250,
        packPrice: 250,
        packCount: 10,
        desc: "Ароматное сдобное тесто с анисом. Мгновенный клёв стайной озерной рыбы.",
        iconSvg: SVG_ICONS.dough,
        method: "float",
        waitMin: 2200,
        waitMax: 4600,
        speedMultiplier: 1.45,
        rarityWeights: { Common: 82, Rare: 16, Epic: 1.8, Legendary: 0.2 }
      },
      bloodworm: {
        id: "bloodworm",
        name: "Мотыль",
        levelReq: 7,
        unlockPrice: 500,
        packPrice: 550,
        packCount: 10,
        desc: "Красные личинки комара-дергуна. Повышенный шанс редкой донной рыбы.",
        iconSvg: SVG_ICONS.bloodworm,
        method: "float",
        waitMin: 3000,
        waitMax: 5600,
        speedMultiplier: 1.15,
        rarityWeights: { Common: 60, Rare: 31, Epic: 8.2, Legendary: 0.8 }
      },

      // Спиннинговые
      lure_spoon: {
        id: "lure_spoon",
        name: "Колебалка",
        levelReq: 4,
        unlockPrice: 250,
        packPrice: 350,
        packCount: 5,
        desc: "Тяжелая колеблющаяся блесна. Классика для щуки и крупного окуня.",
        iconSvg: SVG_ICONS.lure_spoon,
        method: "spinning",
        waitMin: 3800,
        waitMax: 7000,
        speedMultiplier: 1.0,
        rarityWeights: { Common: 30, Rare: 46, Epic: 21, Legendary: 3.0 }
      },
      lure_spinner: {
        id: "lure_spinner",
        name: "Вертушка",
        levelReq: 8,
        unlockPrice: 550,
        packPrice: 700,
        packCount: 5,
        desc: "Вращающийся лепесток с мощной вибрацией. Провоцирует любого хищника.",
        iconSvg: SVG_ICONS.lure_spinner,
        method: "spinning",
        waitMin: 3000,
        waitMax: 6000,
        speedMultiplier: 1.25,
        rarityWeights: { Common: 40, Rare: 42, Epic: 16, Legendary: 2.0 }
      },
      lure_jig: {
        id: "lure_jig",
        name: "Твистер",
        levelReq: 16,
        unlockPrice: 1200,
        packPrice: 1500,
        packCount: 5,
        desc: "Мягкий силиконовый твистер для придонной ступенчатой проводки на судака.",
        iconSvg: SVG_ICONS.lure_jig,
        method: "spinning",
        waitMin: 2800,
        waitMax: 5200,
        speedMultiplier: 1.3,
        rarityWeights: { Common: 35, Rare: 45, Epic: 18, Legendary: 2.0 }
      },
      lure_wobbler: {
        id: "lure_wobbler",
        name: "Воблер",
        levelReq: 25,
        unlockPrice: 2800,
        packPrice: 3500,
        packCount: 5,
        desc: "Шедевр спиннинга! Собственная игра выманивает трофейную щуку и тайменя.",
        iconSvg: SVG_ICONS.lure_wobbler,
        method: "spinning",
        waitMin: 3500,
        waitMax: 6500,
        speedMultiplier: 1.1,
        rarityWeights: { Common: 20, Rare: 45, Epic: 29, Legendary: 6.0 }
      },

      // Фидерные
      maggot: {
        id: "maggot",
        name: "Опарыш",
        levelReq: 10,
        unlockPrice: 450,
        packPrice: 600,
        packCount: 10,
        desc: "Живые активные личинки. Универсальная насадка для ловли леща и синца со дна.",
        iconSvg: SVG_ICONS.maggot,
        method: "feeder",
        waitMin: 2600,
        waitMax: 5200,
        speedMultiplier: 1.35,
        rarityWeights: { Common: 65, Rare: 27, Epic: 7.3, Legendary: 0.7 }
      },
      feeder_mix: {
        id: "feeder_mix",
        name: "Прикормка",
        levelReq: 13,
        unlockPrice: 900,
        packPrice: 1100,
        packCount: 10,
        desc: "Питательная смесь злаков и жмыха. Собирает стаи рыбы со всего омута.",
        iconSvg: SVG_ICONS.feeder_mix,
        method: "feeder",
        waitMin: 3600,
        waitMax: 6600,
        speedMultiplier: 1.1,
        rarityWeights: { Common: 50, Rare: 34, Epic: 14, Legendary: 2.0 }
      },
      boilie: {
        id: "boilie",
        name: "Бойлы",
        levelReq: 19,
        unlockPrice: 1800,
        packPrice: 2200,
        packCount: 10,
        desc: "Крупные протеиновые шарики. Оружие против огромных трофейных карпов и сазанов.",
        iconSvg: SVG_ICONS.boilie,
        method: "feeder",
        waitMin: 4600,
        waitMax: 8200,
        speedMultiplier: 0.9,
        rarityWeights: { Common: 25, Rare: 42, Epic: 27, Legendary: 6.0 }
      },
      live_bait: {
        id: "live_bait",
        name: "Живец",
        levelReq: 32,
        unlockPrice: 4500,
        packPrice: 5500,
        packCount: 5,
        desc: "Живой малёк на тяжелой оснастке. Приманка для глубоководных сомов и налимов.",
        iconSvg: SVG_ICONS.live_bait,
        method: "feeder",
        waitMin: 5000,
        waitMax: 9200,
        speedMultiplier: 0.8,
        rarityWeights: { Common: 15, Rare: 40, Epic: 37, Legendary: 8.0 }
      },

      // Нахлыстовые
      mayfly: {
        id: "mayfly",
        name: "Поденка",
        levelReq: 22,
        unlockPrice: 1500,
        packPrice: 1800,
        packCount: 5,
        desc: "Крылатая поденка. Идеальна для верховой охоты на хариуса и быстрых голавлей.",
        iconSvg: SVG_ICONS.mayfly,
        method: "fly",
        waitMin: 2400,
        waitMax: 4800,
        speedMultiplier: 1.4,
        rarityWeights: { Common: 45, Rare: 40, Epic: 13, Legendary: 2.0 }
      },
      dry_fly: {
        id: "dry_fly",
        name: "Сухая мушка",
        levelReq: 28,
        unlockPrice: 3200,
        packPrice: 4000,
        packCount: 5,
        desc: "Плавающая перьевая мушка. Высокий шанс поклёвки благородной ручьевой форели.",
        iconSvg: SVG_ICONS.dry_fly,
        method: "fly",
        waitMin: 2800,
        waitMax: 5600,
        speedMultiplier: 1.25,
        rarityWeights: { Common: 35, Rare: 45, Epic: 17, Legendary: 3.0 }
      },
      nymph: {
        id: "nymph",
        name: "Нимфа",
        levelReq: 36,
        unlockPrice: 7000,
        packPrice: 8500,
        packCount: 5,
        desc: "Тяжелая мушка для средних глубин. Ловит редких арктических гольцов и лосося.",
        iconSvg: SVG_ICONS.nymph,
        method: "fly",
        waitMin: 3200,
        waitMax: 6200,
        speedMultiplier: 1.15,
        rarityWeights: { Common: 25, Rare: 48, Epic: 22, Legendary: 5.0 }
      },
      streamer: {
        id: "streamer",
        name: "Стример",
        levelReq: 42,
        unlockPrice: 12000,
        packPrice: 15000,
        packCount: 5,
        desc: "Легендарная крупная мушка из блестящего люрекса. Экстремальный шанс легендарных монстров!",
        iconSvg: SVG_ICONS.streamer,
        method: "fly",
        waitMin: 3800,
        waitMax: 7200,
        speedMultiplier: 1.0,
        rarityWeights: { Common: 18, Rare: 44, Epic: 31, Legendary: 7.0 }
      },

      // Fallback алиасы
      lure: {
        id: "lure_spoon",
        name: "Колебалка",
        levelReq: 4,
        unlockPrice: 250,
        packPrice: 350,
        packCount: 5,
        desc: "Колеблющаяся блесна.",
        iconSvg: SVG_ICONS.lure_spoon,
        method: "spinning",
        waitMin: 4000,
        waitMax: 7000,
        speedMultiplier: 1.0,
        rarityWeights: { Common: 35, Rare: 45, Epic: 16, Legendary: 4.0 }
      }
    };
    window.BAITS = BAITS;


window.RODS = RODS;
window.LINES = LINES;
window.FISH_DATABASE = FISH_DATABASE;
window.SVG_ICONS = SVG_ICONS;
window.FISHING_METHODS = FISHING_METHODS;
window.BAITS = BAITS;
