/* ==========================================================
   LUMIBOT FISHING - SCRIPTS.JS
   Логика интерфейса, данных, профиля, магазина и Supabase
   ========================================================== */

// Глобальные флаги состояния сцены и игры (разделяемые с fisher.js)
var gameState = "IDLE";
var isHomeScene = false;

/* ==========================================================
       КОНФИГУРАЦИЯ SUPABASE
       Укажите ваши Project URL и Anon Key из Supabase Settings -> API
       ========================================================== */
    const SUPABASE_URL = "https://povytwsehggffkerfpyf.supabase.co";
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvdnl0d3NlaGdnZmZrZXJmcHlmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDE4MzY3MiwiZXhwIjoyMTA1NzU5NjcyfQ.jztX29d1heLgQjONtIstCf5-tKt4LDLfiN7iRW-b3ec";

    // Инициализация Supabase Client
    let supabaseClient = null;
    if (window.supabase && SUPABASE_URL && !SUPABASE_URL.includes("your-supabase-project")) {
      try {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
          }
        });
        console.log("Supabase подключен успешно");
      } catch (err) {
        console.warn("Не удалось инициализировать Supabase:", err);
      }
    } else {
      console.log("Работа в автономном демо-режиме");
    }

    // Telegram WebApp SDK интеграция
    const tg = window.Telegram?.WebApp;
    if (tg) {
      try {
        tg.ready();
        tg.expand();
        if (tg.setHeaderColor) tg.setHeaderColor('#07131e');
        if (tg.setBackgroundColor) tg.setBackgroundColor('#07131e');
      } catch (e) {
        console.error(e);
      }
    }

    // Извлечение данных пользователя и чата
    const urlParams = new URLSearchParams(window.location.search);
    const chatIdParam = urlParams.get('chat_id') || (tg?.initDataUnsafe?.start_param ? tg.initDataUnsafe.start_param.replace('chat_', '') : null);
    const currentChatId = chatIdParam ? parseInt(chatIdParam, 10) : null;

    const tgUser = tg?.initDataUnsafe?.user || {
      id: 99999901,
      first_name: "Гость",
      username: "fisherman_guest"
    };

    // Каталог удочек и спиннингов
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
        levelReq: 1,
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
        levelReq: 2,
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
        levelReq: 3,
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
        levelReq: 4,
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
        levelReq: 5,
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
        levelReq: 6,
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
        levelReq: 7,
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
        levelReq: 8,
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
        levelReq: 1,
        price: 90,
        dangerBuffer: 1.4,
        spoolColor: '#cbd5e1',
        desc: "Надежный монофил. 1.4 сек запаса на исправление ошибки натяжения."
      },
      mono_heavy: {
        id: "mono_heavy",
        name: "Усиленный монофил 0.28мм",
        levelReq: 2,
        price: 220,
        dangerBuffer: 1.7,
        spoolColor: '#86efac',
        desc: "Толстая эластичная леска с амортизацией. 1.7 сек буфера."
      },
      fluoro: {
        id: "fluoro",
        name: "Флюорокарбон Stealth 0.35мм",
        levelReq: 3,
        price: 400,
        dangerBuffer: 2.1,
        spoolColor: '#5eead4',
        desc: "Невидима в чистой таёжной воде. 2.1 сек запаса в критической зоне."
      },
      braided_4x: {
        id: "braided_4x",
        name: "Плетёный шнур 4X Камуфляж",
        levelReq: 4,
        price: 750,
        dangerBuffer: 2.6,
        spoolColor: '#4ade80',
        desc: "Плотное 4-жильное плетение без растяжения. 2.6 сек запаса."
      },
      braided: {
        id: "braided",
        name: "Плетёный шнур Pro 8X",
        levelReq: 5,
        price: 1300,
        dangerBuffer: 3.2,
        spoolColor: '#38bdf8',
        desc: "Сверхгладкий 8-жильный японский шнур. 3.2 сек запаса на исправление!"
      },
      titanium_leader: {
        id: "titanium_leader",
        name: "Шнур с титановым поводком",
        levelReq: 6,
        price: 2200,
        dangerBuffer: 3.9,
        spoolColor: '#c084fc',
        desc: "Щучьи зубы бессильны против титана. 3.9 сек запаса до обрыва."
      },
      nanofil_trophy: {
        id: "nanofil_trophy",
        name: "Нанонить «Стальной Шёлк»",
        levelReq: 7,
        price: 3800,
        dangerBuffer: 4.7,
        spoolColor: '#facc15',
        desc: "Экстремальная прочность микроволокон. 4.7 сек запаса!"
      },
      mythic_cord: {
        id: "mythic_cord",
        name: "Мифический корд «Драконья Жила»",
        levelReq: 8,
        price: 6500,
        dangerBuffer: 5.8,
        spoolColor: '#f43f5e',
        desc: "Древний плетёный корд. 5.8 сек абсолютной стойкости к перегрузкам."
      }
    };

    // Состояние игрока
    const player = {
      id: tgUser.id,
      name: tgUser.first_name || tgUser.username || "Рыбак",
      username: tgUser.username || "",
      balance: 100,
      xp: 0,
      level: 1,
      soundEnabled: true,
      fatigue: 0,
      // Игровая статистика
      fishCaught: 0,
      fishSold: 0,
      totalEarned: 0,
      // Снаряжение
      rodId: "bamboo",
      lineId: "mono",
      ownedRods: ["bamboo"],
      ownedLines: ["mono"],
      ownedMethods: ["float"],
      unlockedBaits: ["worm"],
      baits: {
        worm: 20
      },
      // Садок и трофеи
      livewell: [],
      bestCatch: { name: "", weight: 0, rarity: "" },
      caughtSpecies: {}
    };
    window.player = player;

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
        levelReq: 2,
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
        levelReq: 4,
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
        levelReq: 6,
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
        levelReq: 2,
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
        levelReq: 4,
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
        levelReq: 2,
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
        levelReq: 3,
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
        levelReq: 5,
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
        levelReq: 7,
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
        levelReq: 4,
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
        levelReq: 5,
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
        levelReq: 6,
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
        levelReq: 8,
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
        levelReq: 6,
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
        levelReq: 7,
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
        levelReq: 9,
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
        levelReq: 10,
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
        levelReq: 2,
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
    let currentBaitKey = "worm";

    /* ==========================================================
       СИНТЕЗАТОР ЗВУКОВ (WEB AUDIO API)
       ========================================================== */
    class SoundEngine {
      constructor() {
        this.ctx = null;
      }
      init() {
        if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
          this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume();
        }
      }
      playSplash() {
        if (!player.soundEnabled) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(70, now + 0.25);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
      }
      playBite() {
        if (!player.soundEnabled) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.setValueAtTime(800, now + 0.08);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
      }
      playFeederBell() {
        if (!player.soundEnabled) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        // Звон бубенца / колокольчика донки
        [1046.5, 1318.5, 1567.98].forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const time = now + idx * 0.07;
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, time);
          gain.gain.setValueAtTime(0.2, time);
          gain.gain.exponentialRampToValueAtTime(0.001, time + 0.32);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(time);
          osc.stop(time + 0.33);
        });
      }
      playSpinningReel() {
        if (!player.soundEnabled) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        // Быстрый треск спиннинговой катушки при твичинге
        for (let i = 0; i < 3; i++) {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const time = now + i * 0.035;
          osc.type = 'square';
          osc.frequency.setValueAtTime(1100 + Math.random() * 400, time);
          gain.gain.setValueAtTime(0.05, time);
          gain.gain.exponentialRampToValueAtTime(0.001, time + 0.025);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(time);
          osc.stop(time + 0.025);
        }
      }
      playFlyStrike() {
        if (!player.soundEnabled) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        // Поверхностный хлопок и заглатывание мушки
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(620, now);
        osc.frequency.exponentialRampToValueAtTime(160, now + 0.16);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.18);
        setTimeout(() => this.playSplash(), 70);
      }
      playReelClick() {
        if (!player.soundEnabled) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(800 + Math.random() * 400, now);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.02);
      }
      playSuccess() {
        if (!player.soundEnabled) return;
        this.init();
        if (!this.ctx) return;
        const notes = [440, 554, 659, 880];
        notes.forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const time = this.ctx.currentTime + idx * 0.09;
          osc.frequency.setValueAtTime(freq, time);
          gain.gain.setValueAtTime(0.2, time);
          gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(time);
          osc.stop(time + 0.25);
        });
      }
      playFail() {
        if (!player.soundEnabled) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.35);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
      }
      playSleep() {
        if (!player.soundEnabled) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        [220, 277.18, 329.63, 440].forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const time = now + idx * 0.12;
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, time);
          gain.gain.setValueAtTime(0.08, time);
          gain.gain.exponentialRampToValueAtTime(0.001, time + 0.8);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(time);
          osc.stop(time + 0.85);
        });
      }
    }
    const sound = new SoundEngine();

    // Виброотклик Haptic Feedback
    function triggerHaptic(type) {
      if (!tg?.HapticFeedback) return;
      try {
        // HapticFeedback доступен только в Telegram WebApp 6.1+
        if (typeof tg.isVersionAtLeast === 'function') {
          if (!tg.isVersionAtLeast('6.1')) return;
        } else if (tg.version) {
          const parts = tg.version.toString().split('.').map(Number);
          const major = parts[0] || 0;
          const minor = parts[1] || 0;
          if (major < 6 || (major === 6 && minor < 1)) return;
        } else {
          return;
        }

        if (type === 'light' || type === 'medium' || type === 'heavy') {
          tg.HapticFeedback.impactOccurred(type);
        } else if (type === 'success' || type === 'error' || type === 'warning') {
          tg.HapticFeedback.notificationOccurred(type);
        }
      } catch (e) {
        // Игнорируем в средах без поддержки хаптики
      }
    }

function failFishing(reason) {
      gameState = "IDLE";
      document.getElementById("reelingOverlay").classList.remove("active");
      document.getElementById("swipeHint").style.display = "flex";
      document.getElementById("bottomBar").style.display = "flex";
      const reelBtn = document.getElementById("reelBtn");
      if (reelBtn) reelBtn.classList.remove("highlight-pull");

      sound.playFail();
      triggerHaptic("error");
      showToast(reason);
    }

    let lastCatchData = null;

    function winFishing() {
      gameState = "CAUGHT";
      document.getElementById("reelingOverlay").classList.remove("active");
      const reelBtn = document.getElementById("reelBtn");
      if (reelBtn) reelBtn.classList.remove("highlight-pull");

      sound.playSuccess();
      triggerHaptic("success");

      // Расчет награды и опыта с учетом модификаторов
      const weightMultiplier = (activeFish && activeFish.min_weight) ? (activeFishWeight / activeFish.min_weight) : 1.0;
      const baseReward = (activeFish && activeFish.base_price) ? activeFish.base_price : 30;
      const reward = (activeFish && typeof activeFish.price === 'number')
        ? activeFish.price
        : Math.round(baseReward * (0.8 + weightMultiplier * 0.3));
      const xpGained = Math.round(reward * 0.6);

      // Опыт и уровень начисляются сразу
      const oldLevel = player.level;
      player.fishCaught++;
      player.xp += xpGained;
      player.level = 1 + Math.floor(Math.sqrt(player.xp / 50));
      if (player.level > oldLevel && typeof updateMethodsUI === 'function') {
        updateMethodsUI();
      }

      // Обновление рекорда и атласа видов
      if (!player.bestCatch || !player.bestCatch.weight || activeFishWeight > player.bestCatch.weight) {
        player.bestCatch = {
          name: activeFish.name,
          weight: activeFishWeight,
          rarity: activeFish.rarity
        };
      }

      if (!player.caughtSpecies[activeFish.id]) {
        player.caughtSpecies[activeFish.id] = {
          maxWeight: activeFishWeight,
          count: 1,
          discoveredVariations: { base: true }
        };
      } else {
        player.caughtSpecies[activeFish.id].count++;
        if (activeFishWeight > player.caughtSpecies[activeFish.id].maxWeight) {
          player.caughtSpecies[activeFish.id].maxWeight = activeFishWeight;
        }
        if (!player.caughtSpecies[activeFish.id].discoveredVariations) {
          player.caughtSpecies[activeFish.id].discoveredVariations = { base: true };
        }
      }

      if (activeFish.mutation && activeFish.mutation.id) {
        player.caughtSpecies[activeFish.id].discoveredVariations[activeFish.mutation.id] = true;
      }

      lastCatchData = {
        fish: activeFish,
        weight: activeFishWeight,
        reward: reward,
        xp: xpGained
      };

      updatePlayerHUD();
      savePlayerLocal();

      // Отрисовка рыбы в превью
      drawPreviewFish(activeFish);

      // Наполнение карточки победы
      const modalRarity = document.getElementById("modalRarity");
      modalRarity.className = `rarity-pill rarity-${activeFish.rarity}`;
      modalRarity.textContent = activeFish.rarity;
      document.getElementById("modalFishName").textContent = activeFish.name;
      document.getElementById("modalWeight").textContent = `${activeFishWeight} кг`;
      document.getElementById("modalCoins").textContent = `+${reward} монет`;
      document.getElementById("modalXP").textContent = `+${xpGained} XP`;

      // Динамические бейджи мутаций, среды и титула
      const badgesRow = document.getElementById("modalBadgesRow");
      if (badgesRow) {
        badgesRow.innerHTML = "";
        if (activeFish.environment) {
          badgesRow.innerHTML += `<span class="badge-pill badge-env">${activeFish.environment.name}</span>`;
        }
        if (activeFish.mutation) {
          const mutClass = activeFish.mutation.id === 'radioactive' ? 'radioactive' : (activeFish.mutation.id === 'golden' ? 'golden' : '');
          badgesRow.innerHTML += `<span class="badge-pill badge-mutation ${mutClass}">${activeFish.mutation.name}</span>`;
        }
        if (activeFish.title) {
          badgesRow.innerHTML += `<span class="badge-pill badge-title">${activeFish.title.title}</span>`;
        }
      }

      // Чипы свойств (сытность семьи, яд, топливо)
      const propsRow = document.getElementById("modalPropertiesRow");
      if (propsRow) {
        propsRow.innerHTML = "";
        if (activeFish.isLootbox) {
          propsRow.innerHTML += `<span class="prop-chip prop-chest"><span class="chip-svg">${SVG_ICONS.chest}</span>Ларец с ценностями</span>`;
        }
        if (activeFish.fuelValue > 0) {
          propsRow.innerHTML += `<span class="prop-chip prop-fuel"><span class="chip-svg">${SVG_ICONS.fuel}</span>Дрова для очага (+${activeFish.fuelValue})</span>`;
        }
        if (activeFish.poison) {
          propsRow.innerHTML += `<span class="prop-chip prop-poison"><span class="chip-svg">${SVG_ICONS.hazard}</span>Ядовито (не для еды)</span>`;
        } else if (activeFish.edible) {
          propsRow.innerHTML += `<span class="prop-chip prop-edible"><span class="chip-svg">${SVG_ICONS.edible}</span>Сытность: +${activeFish.hungerValue || 25}</span>`;
        }
      }

      // Переключение кнопки "В садок" / "Открыть ларец"
      const addLivewellBtn = document.getElementById("addToLivewellBtn");
      const openChestBtn = document.getElementById("openChestBtn");
      if (activeFish.isLootbox) {
        if (openChestBtn) openChestBtn.style.display = "block";
        if (addLivewellBtn) addLivewellBtn.style.display = "none";
      } else {
        if (openChestBtn) openChestBtn.style.display = "none";
        if (addLivewellBtn) addLivewellBtn.style.display = "block";
      }

      document.getElementById("catchModal").classList.add("active");
    }

    let dbHasStatsColumns = false;

// Отрисовка превью сущности через модульный анатомический Canvas-рендер
    function drawPreviewFish(fish) {
      const pCanvas = document.getElementById("previewFishCanvas");
      if (!pCanvas) return;
      if (typeof ProceduralFishRenderer !== 'undefined') {
        ProceduralFishRenderer.drawPreview(pCanvas, fish);
        return;
      }
      const pCtx = pCanvas.getContext("2d");
      pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);

      const cx = pCanvas.width / 2;
      const cy = pCanvas.height / 2;
      const bodyType = typeof fish.bodyType === 'number' ? fish.bodyType : 0;

      pCtx.save();
      pCtx.shadowColor = fish.color;
      pCtx.shadowBlur = bodyType === 4 ? 22 : 12;

      // 1. Форма туловища в зависимости от типа рыбы
      pCtx.fillStyle = fish.color;
      pCtx.beginPath();
      if (bodyType === 0) {
        // Высокотелая озерная (Карась, Лещ, Карп, Линь)
        pCtx.ellipse(cx, cy, 34, 21, 0, 0, Math.PI * 2);
      } else if (bodyType === 1) {
        // Хищник / лосось (Окунь, Судак, Форель, Хариус)
        pCtx.ellipse(cx, cy, 38, 16, 0, 0, Math.PI * 2);
      } else if (bodyType === 2) {
        // Стремительная торпеда (Щука, Таймень, Жерех, Осетр)
        pCtx.ellipse(cx, cy, 44, 13, 0, 0, Math.PI * 2);
      } else if (bodyType === 3) {
        // Донный гигант / сом (Сом, Налим, Белуга)
        pCtx.ellipse(cx - 3, cy, 40, 16, 0, 0, Math.PI * 2);
      } else {
        // Легендарная мифическая (Золотая Рыбка, Царь-Рыба, Лунный Лосось)
        pCtx.ellipse(cx, cy, 36, 18, 0, 0, Math.PI * 2);
      }
      pCtx.fill();

      // Светлое брюшко
      const bellyGrad = pCtx.createLinearGradient(cx, cy, cx, cy + 20);
      bellyGrad.addColorStop(0, "rgba(255, 255, 255, 0)");
      bellyGrad.addColorStop(1, "rgba(255, 255, 255, 0.4)");
      pCtx.fillStyle = bellyGrad;
      pCtx.fill();

      // 2. Спинной плавник
      pCtx.fillStyle = bodyType === 4 ? "rgba(255, 255, 255, 0.75)" : "rgba(255, 255, 255, 0.4)";
      pCtx.beginPath();
      if (bodyType === 1) {
        // Высокий колючий гребень (Окунь, Судак, Хариус)
        pCtx.moveTo(cx - 14, cy - 15);
        pCtx.lineTo(cx - 2, cy - 27);
        pCtx.lineTo(cx + 10, cy - 24);
        pCtx.lineTo(cx + 18, cy - 13);
      } else if (bodyType === 2) {
        // Сдвинут назад к хвосту (Щука)
        pCtx.moveTo(cx - 26, cy - 11);
        pCtx.lineTo(cx - 18, cy - 19);
        pCtx.lineTo(cx - 10, cy - 12);
      } else if (bodyType === 4) {
        // Пышный полупрозрачный парус
        pCtx.moveTo(cx - 18, cy - 17);
        pCtx.bezierCurveTo(cx - 5, cy - 32, cx + 15, cy - 28, cx + 22, cy - 14);
      } else {
        // Классический
        pCtx.moveTo(cx - 10, cy - 19);
        pCtx.lineTo(cx + 4, cy - 25);
        pCtx.lineTo(cx + 14, cy - 18);
      }
      pCtx.closePath();
      pCtx.fill();

      // 3. Хвостовой плавник
      pCtx.fillStyle = fish.color;
      pCtx.beginPath();
      if (bodyType === 4) {
        // Роскошный вуалевый хвост
        pCtx.moveTo(cx - 30, cy);
        pCtx.bezierCurveTo(cx - 55, cy - 24, cx - 62, cy - 10, cx - 58, 0);
        pCtx.bezierCurveTo(cx - 62, cy + 10, cx - 55, cy + 24, cx - 30, cy);
      } else if (bodyType === 3) {
        // Сомовий округлый хвост
        pCtx.moveTo(cx - 32, cy - 7);
        pCtx.lineTo(cx - 52, cy - 10);
        pCtx.lineTo(cx - 54, cy + 10);
        pCtx.lineTo(cx - 32, cy + 7);
      } else {
        // V-образный раздвоенный хвост
        pCtx.moveTo(cx - 32, cy);
        pCtx.lineTo(cx - 54, cy - 15);
        pCtx.lineTo(cx - 45, cy);
        pCtx.lineTo(cx - 54, cy + 15);
      }
      pCtx.closePath();
      pCtx.fill();

      // 4. Усы для донных сомов и осетров
      if (bodyType === 3 || fish.id === 23) {
        pCtx.strokeStyle = "rgba(255, 255, 255, 0.85)";
        pCtx.lineWidth = 1.6;
        pCtx.beginPath();
        pCtx.moveTo(cx + 32, cy);
        pCtx.quadraticCurveTo(cx + 44, cy - 6, cx + 40, cy + 16);
        pCtx.stroke();
        pCtx.beginPath();
        pCtx.moveTo(cx + 28, cy + 5);
        pCtx.quadraticCurveTo(cx + 38, cy + 14, cx + 30, cy + 20);
        pCtx.stroke();
      }

      // 5. Глаз
      pCtx.fillStyle = "#fff";
      pCtx.beginPath();
      const eyeX = bodyType === 2 ? cx + 28 : cx + 22;
      const eyeY = cy - 4;
      pCtx.arc(eyeX, eyeY, 4, 0, Math.PI * 2);
      pCtx.fill();
      pCtx.fillStyle = "#000";
      pCtx.beginPath();
      pCtx.arc(eyeX + 1, eyeY, 2, 0, Math.PI * 2);
      pCtx.fill();

      // 6. Узор/полоски/крапинки
      if (bodyType === 1) {
        pCtx.strokeStyle = "rgba(0, 0, 0, 0.22)";
        pCtx.lineWidth = 2;
        for (let s = -12; s <= 12; s += 8) {
          pCtx.beginPath();
          pCtx.moveTo(cx + s, cy - 14);
          pCtx.lineTo(cx + s - 3, cy + 6);
          pCtx.stroke();
        }
      } else if (bodyType === 4) {
        pCtx.fillStyle = "#fff";
        pCtx.beginPath();
        pCtx.arc(cx - 6, cy - 4, 2, 0, Math.PI * 2);
        pCtx.arc(cx + 8, cy + 3, 1.5, 0, Math.PI * 2);
        pCtx.arc(cx - 16, cy + 4, 1.8, 0, Math.PI * 2);
        pCtx.fill();
      }

      pCtx.restore();
    }

/* ==========================================================
       ОТПРАВКА ДАННЫХ В SUPABASE
       ========================================================== */
    async function saveCatchToSupabase(fishId, weight, reward, xp) {
      if (!supabaseClient) {
        console.log("Локальный режим: сохранение пропущено.");
        return;
      }

      try {
        if (dbHasStatsColumns) {
          // Попытка вызова атомарной RPC функции log_catch
          const { data, error } = await supabaseClient.rpc('log_catch', {
            p_user_id: player.id,
            p_username: player.username || player.name,
            p_chat_id: currentChatId || null,
            p_fish_id: fishId,
            p_weight: weight,
            p_reward: reward,
            p_xp: xp
          });

          if (!error) {
            console.log("Улов успешно сохранен через RPC:", data);
            return;
          }
          console.warn("RPC log_catch не сработал, сохраняем через прямые таблицы:", error);
        }

        // Fallback: запись в catches напрямую
        await supabaseClient.from('catches').insert([{
          user_id: player.id,
          chat_id: currentChatId,
          fish_id: fishId,
          weight: weight,
          reward: reward,
          is_announced: false
        }]);

        // Обновление пользователя (гарантированные базовые поля)
        await supabaseClient.from('users').upsert({
          id: player.id,
          username: player.username || player.name,
          balance: player.balance,
          xp: player.xp,
          level: player.level
        });
      } catch (err) {
        console.error("Ошибка сохранения в Supabase:", err);
      }
    }

    /* ==========================================================
       ЛОКАЛЬНОЕ ХРАНИЛИЩЕ И СИНХРОНИЗАЦИЯ
       ========================================================== */
    function savePlayerLocal() {
      try {
        const payload = {
          balance: player.balance,
          xp: player.xp,
          level: player.level,
          fishCaught: player.fishCaught,
          fishSold: player.fishSold,
          totalEarned: player.totalEarned,
          rodId: player.rodId,
          lineId: player.lineId,
          methodId: currentFishingMethod,
          baitKey: currentBaitKey,
          ownedRods: player.ownedRods,
          ownedLines: player.ownedLines,
          ownedMethods: player.ownedMethods || ["float"],
          unlockedBaits: player.unlockedBaits || ["worm"],
          baits: player.baits || { worm: 20 },
          fatigue: typeof player.fatigue === 'number' ? Math.max(0, Math.min(100, Math.round(player.fatigue))) : 0,
          livewell: player.livewell,
          bestCatch: player.bestCatch,
          caughtSpecies: player.caughtSpecies
        };
        localStorage.setItem(`lumibot_player_${player.id}`, JSON.stringify(payload));
      } catch (e) {
        console.warn("Ошибка сохранения в localStorage:", e);
      }
    }

    function loadPlayerLocal() {
      try {
        const raw = localStorage.getItem(`lumibot_player_${player.id}`);
        if (!raw) return;
        const saved = JSON.parse(raw);
        if (saved) {
          if (typeof saved.balance === 'number') player.balance = saved.balance;
          if (typeof saved.xp === 'number') player.xp = saved.xp;
          if (typeof saved.level === 'number') player.level = saved.level;
          if (typeof saved.fatigue === 'number') player.fatigue = Math.max(0, Math.min(100, saved.fatigue));
          if (typeof saved.fishCaught === 'number') player.fishCaught = saved.fishCaught;
          if (typeof saved.fishSold === 'number') player.fishSold = saved.fishSold;
          if (typeof saved.totalEarned === 'number') player.totalEarned = saved.totalEarned;
          if (saved.rodId && RODS[saved.rodId]) player.rodId = saved.rodId;
          if (saved.lineId && LINES[saved.lineId]) player.lineId = saved.lineId;
          if (Array.isArray(saved.ownedMethods) && saved.ownedMethods.length) {
            player.ownedMethods = saved.ownedMethods;
          } else {
            player.ownedMethods = ["float"];
          }
          if (saved.methodId && FISHING_METHODS[saved.methodId] && player.ownedMethods.includes(saved.methodId)) {
            currentFishingMethod = saved.methodId;
          } else {
            currentFishingMethod = player.ownedMethods[0] || "float";
          }
          if (Array.isArray(saved.unlockedBaits) && saved.unlockedBaits.length) {
            player.unlockedBaits = saved.unlockedBaits;
          } else {
            player.unlockedBaits = ["worm"];
          }
          if (saved.baits && typeof saved.baits === 'object') {
            player.baits = saved.baits;
          } else {
            player.baits = { worm: 20 };
          }
          if (typeof player.baits.worm !== 'number') {
            player.baits.worm = 20;
          }
          if (saved.baitKey && BAITS[saved.baitKey]) currentBaitKey = saved.baitKey;
          if (Array.isArray(saved.ownedRods)) player.ownedRods = saved.ownedRods;
          if (Array.isArray(saved.ownedLines)) player.ownedLines = saved.ownedLines;
          if (Array.isArray(saved.livewell)) {
            player.livewell = saved.livewell;
            if (typeof GridInventory !== 'undefined') {
              const placed = [];
              player.livewell.forEach(item => {
                if (typeof item.gridX !== 'number' || typeof item.gridY !== 'number') {
                  const place = GridInventory.autoPlaceItem(placed, item);
                  if (place) {
                    item.gridX = place.x;
                    item.gridY = place.y;
                    item.gridShape = place.shape;
                    placed.push(item);
                  }
                } else {
                  placed.push(item);
                }
              });
              player.livewell = placed;
            }
          }
          if (saved.bestCatch && saved.bestCatch.weight) player.bestCatch = saved.bestCatch;
          if (saved.caughtSpecies) {
            player.caughtSpecies = saved.caughtSpecies;
            Object.keys(player.caughtSpecies).forEach(id => {
              if (!player.caughtSpecies[id].discoveredVariations) {
                player.caughtSpecies[id].discoveredVariations = { base: true };
              }
            });
          }
          window.player = player;
        }
      } catch (e) {
        console.warn("Ошибка чтения localStorage:", e);
      }
    }

    async function syncUserStatsToSupabase() {
      if (!supabaseClient) return;
      try {
        if (dbHasStatsColumns) {
          const { error } = await supabaseClient.from('users').upsert({
            id: player.id,
            username: player.username || player.name,
            balance: player.balance,
            xp: player.xp,
            level: player.level,
            fish_caught: player.fishCaught,
            fish_sold: player.fishSold,
            total_earned: player.totalEarned,
            current_rod_id: player.rodId,
            current_line_id: player.lineId,
            fatigue: Math.round(player.fatigue || 0)
          });
          if (!error) return;
          console.warn("Ошибка расширенной синхронизации:", error);
        }

        // Базовый профиль, гарантированно работающий до выполнения SQL-миграции
        await supabaseClient.from('users').upsert({
          id: player.id,
          username: player.username || player.name,
          balance: player.balance,
          xp: player.xp,
          level: player.level
        });
      } catch (err) {
        console.warn("Не удалось синхронизировать статистику с Supabase:", err);
      }
    }

    // Загрузка начальных данных пользователя из Supabase
    async function loadUserData() {
      loadPlayerLocal();
      updatePlayerHUD();
      updateTensionSafeZoneUI();

      if (!supabaseClient) return;
      try {
        const { data, error } = await supabaseClient
          .from('users')
          .select('*')
          .eq('id', player.id)
          .maybeSingle();

        if (data && !error) {
          if ('fish_caught' in data) {
            dbHasStatsColumns = true;
          }
          player.balance = data.balance ?? player.balance;
          player.xp = data.xp ?? player.xp;
          player.level = data.level ?? player.level;
          player.fishCaught = Math.max(player.fishCaught, data.fish_caught ?? 0);
          player.fishSold = Math.max(player.fishSold, data.fish_sold ?? 0);
          player.totalEarned = Math.max(player.totalEarned, data.total_earned ?? 0);
          if (typeof data.fatigue === 'number') {
            player.fatigue = Math.max(0, Math.min(100, data.fatigue));
            updatePlayerHUD();
          }

          if (data.current_rod_id && RODS[data.current_rod_id]) {
            player.rodId = data.current_rod_id;
            if (!player.ownedRods.includes(data.current_rod_id)) player.ownedRods.push(data.current_rod_id);
          }
          if (data.current_line_id && LINES[data.current_line_id]) {
            player.lineId = data.current_line_id;
            if (!player.ownedLines.includes(data.current_line_id)) player.ownedLines.push(data.current_line_id);
          }

          // Загрузка статистики скупки рыбы для глобального рынка цен
          try {
            const { data: marketData } = await supabaseClient.from('market_sales').select('fish_id, total_sold');
            if (marketData && marketData.length > 0) {
              marketData.forEach(row => {
                marketSales[row.fish_id] = Math.max(marketSales[row.fish_id] || 0, Number(row.total_sold) || 0);
              });
              try { localStorage.setItem("lumibot_market_sales", JSON.stringify(marketSales)); } catch (e) {}
            }
          } catch (mErr) {
            console.log("Таблица market_sales еще не создана или оффлайн");
          }

          // Загрузка истории вылова для заполнения FishDex
          const { data: catchesData } = await supabaseClient
            .from('catches')
            .select('fish_id, weight, reward')
            .eq('user_id', player.id);

          if (catchesData && catchesData.length > 0) {
            for (const c of catchesData) {
              const fish = FISH_DATABASE.find(f => f.id === c.fish_id);
              if (!fish) continue;
              if (!player.bestCatch || !player.bestCatch.weight || c.weight > player.bestCatch.weight) {
                player.bestCatch = { name: fish.name, weight: c.weight, rarity: fish.rarity };
              }
              if (!player.caughtSpecies[c.fish_id]) {
                player.caughtSpecies[c.fish_id] = { maxWeight: c.weight, count: 1 };
              } else {
                player.caughtSpecies[c.fish_id].count++;
                if (c.weight > player.caughtSpecies[c.fish_id].maxWeight) {
                  player.caughtSpecies[c.fish_id].maxWeight = c.weight;
                }
              }
            }
          }

          savePlayerLocal();
          updatePlayerHUD();
          updateTensionSafeZoneUI();
        } else if (!error && !data) {
          // Пользователя еще нет в базе, регистрируем
          await supabaseClient.from('users').upsert({
            id: player.id,
            username: player.username || player.name,
            balance: player.balance,
            xp: player.xp,
            level: player.level,
            fish_caught: player.fishCaught,
            fish_sold: player.fishSold,
            total_earned: player.totalEarned,
            current_rod_id: player.rodId,
            current_line_id: player.lineId
          });
        }
      } catch (e) {
        console.warn("Не удалось загрузить пользователя из БД:", e);
      }
    }

/* ==========================================================
       ИНТЕРФЕЙС И СОБЫТИЯ
       ========================================================== */
    function updateTensionSafeZoneUI() {
      const rod = RODS[player.rodId] || RODS.bamboo;
      const safeZoneEl = document.querySelector(".tension-safe-zone");
      if (safeZoneEl) {
        safeZoneEl.style.bottom = `${rod.safeZoneMin}%`;
        safeZoneEl.style.height = `${rod.safeZoneMax - rod.safeZoneMin}%`;
      }
    }

    function updatePlayerHUD() {
      document.getElementById("playerName").textContent = player.name;
      document.getElementById("playerLevel").textContent = player.level;
      document.getElementById("playerBalance").textContent = player.balance;

      const nextLevelXp = Math.pow(player.level, 2) * 50;
      const prevLevelXp = Math.pow(player.level - 1, 2) * 50;
      const progressPercent = Math.min(100, Math.max(0, ((player.xp - prevLevelXp) / (nextLevelXp - prevLevelXp)) * 100));
      document.getElementById("xpBar").style.width = `${progressPercent}%`;

      // Счетчик рыбы в садке
      const badge = document.getElementById("livewellCountBadge");
      if (badge) {
        badge.textContent = player.livewell.length;
      }
      const homeBadge = document.getElementById("homeLivewellCount");
      if (homeBadge) {
        homeBadge.textContent = player.livewell.length;
      }

      // Индикатор усталости игрока
      const fatiguePill = document.getElementById("fatigueHudPill");
      const fatigueText = document.getElementById("fatigueText");
      const currentFatigue = Math.max(0, Math.min(100, Math.round(player.fatigue || 0)));

      if (fatigueText) {
        fatigueText.textContent = `${currentFatigue}%`;
      }
      if (fatiguePill) {
        fatiguePill.className = "hud-pill-btn fatigue-pill";
        if (currentFatigue >= 90) {
          fatiguePill.classList.add("fatigue-critical");
        } else if (currentFatigue >= 80) {
          fatiguePill.classList.add("fatigue-tired");
        } else if (currentFatigue >= 50) {
          fatiguePill.classList.add("fatigue-warn");
        } else {
          fatiguePill.classList.add("fatigue-good");
        }
      }

      // Потемнение в глазах (>80% усталости)
      const vignette = document.getElementById("fatigueVignetteOverlay");
      if (vignette) {
        if (currentFatigue >= 80) {
          const vigOpacity = Math.min(0.92, 0.40 + ((currentFatigue - 80) / 20) * 0.52);
          vignette.style.opacity = vigOpacity;
          vignette.classList.add("active");
        } else {
          vignette.style.opacity = "0";
          vignette.classList.remove("active");
        }
      }
    }

    // Добавление усталости и проверка эффектов
    let isCollapsing = false;
    function addPlayerFatigue(amount) {
      if (isCollapsing) return;
      const prevFatigue = player.fatigue || 0;
      player.fatigue = Math.max(0, Math.min(100, prevFatigue + amount));
      updatePlayerHUD();
      savePlayerLocal();

      // Предупреждающие тосты при переходе порогов
      if (prevFatigue < 80 && player.fatigue >= 80) {
        showToast("⚠️ В глазах начинает темнеть... Усталость выше 80%!");
        triggerHaptic("warning");
      } else if (prevFatigue < 90 && player.fatigue >= 90) {
        showToast("⚠️ Руки слабеют и дрожат! Усталость выше 90%!");
        triggerHaptic("error");
      }

      // Проверка на обморок при усталости >95% (вероятность 50%)
      if (player.fatigue >= 95 && Math.random() < 0.50) {
        triggerCollapseEvent();
      }
    }
    window.addPlayerFatigue = addPlayerFatigue;

    // Событие обморока от переутомления и утреннего ограбления
    function triggerCollapseEvent() {
      if (isCollapsing) return;
      isCollapsing = true;

      // Прерываем текущую рыбалку
      if (typeof gameState !== 'undefined') gameState = "IDLE";
      const reelingOverlay = document.getElementById("reelingOverlay");
      if (reelingOverlay) reelingOverlay.classList.remove("active");
      const bottomBar = document.getElementById("bottomBar");
      if (bottomBar) bottomBar.style.display = "none";
      const swipeHint = document.getElementById("swipeHint");
      if (swipeHint) swipeHint.style.display = "none";

      triggerHaptic("heavy");
      if (sound && sound.playFailure) sound.playFailure();

      const collapseModal = document.getElementById("collapseModal");
      const collapseTitle = document.getElementById("collapseTitle");
      const collapseText = document.getElementById("collapseText");
      const collapseLossReport = document.getElementById("collapseLossReport");
      const collapseWakeUpBtn = document.getElementById("collapseWakeUpBtn");

      // Вероятность 40% быть ограбленным к утру
      const wasRobbed = Math.random() < 0.40;
      let stolenSummary = [];

      if (wasRobbed) {
        // 1. Кража монет
        if (player.balance > 15) {
          const stolenCoins = Math.min(player.balance, Math.max(10, Math.floor(player.balance * (0.25 + Math.random() * 0.25))));
          player.balance = Math.max(0, player.balance - stolenCoins);
          stolenSummary.push(`• Монеты: -${stolenCoins} C`);
        }
        // 2. Кража рыбы из садка
        if (player.livewell.length > 0) {
          const stealCount = Math.min(player.livewell.length, Math.floor(1 + Math.random() * 3));
          player.livewell.splice(0, stealCount);
          stolenSummary.push(`• Рыба из садка: -${stealCount} шт.`);
        }
        // 3. Кража приманок
        if (player.baits && player.baits[currentBaitKey] && player.baits[currentBaitKey] > 8) {
          const stolenBaitCount = Math.min(player.baits[currentBaitKey], Math.floor(4 + Math.random() * 5));
          player.baits[currentBaitKey] -= stolenBaitCount;
          const bName = BAITS[currentBaitKey] ? BAITS[currentBaitKey].name : "Приманка";
          stolenSummary.push(`• Наживка «${bName}»: -${stolenBaitCount} шт.`);
        }
      }

      if (collapseModal) {
        if (wasRobbed && stolenSummary.length > 0) {
          if (collapseTitle) {
            collapseTitle.textContent = "⚠️ ВАС ОГРАБИЛИ НА РАССВЕТЕ!";
            collapseTitle.style.color = "#f87171";
          }
          if (collapseText) {
            collapseText.textContent = "Вы потеряли сознание от предельной усталости прямо на берегу. Пока вы лежали без чувств в темноте, недоброжелатели обчистили ваши карманы и садок!";
          }
          if (collapseLossReport) {
            collapseLossReport.innerHTML = `<strong>Похищенное имущество:</strong><br>${stolenSummary.join('<br>')}`;
            collapseLossReport.style.display = "block";
          }
        } else {
          if (collapseTitle) {
            collapseTitle.textContent = "🌅 СЧАСТЛИВОЕ СПАСЕНИЕ НА РАССВЕТЕ";
            collapseTitle.style.color = "#38bdf8";
          }
          if (collapseText) {
            collapseText.textContent = "Вы рухнули без сил на берегу озера. К счастью, старый таёжный егерь заметил вас на рассвете и доставил к теплому костру. Все ваши снасти и улов в полной сохранности!";
          }
          if (collapseLossReport) {
            collapseLossReport.style.display = "none";
          }
        }
        collapseModal.classList.add("active");
      }

      // Восстановление сил после пробуждения (15% - легкое недомогание)
      player.fatigue = 15;
      updatePlayerHUD();
      savePlayerLocal();

      if (collapseWakeUpBtn) {
        collapseWakeUpBtn.onclick = () => {
          if (collapseModal) collapseModal.classList.remove("active");
          isCollapsing = false;
          if (swipeHint) swipeHint.style.display = "flex";
          if (bottomBar) bottomBar.style.display = "flex";
          showToast("Вы пришли в себя. Отдохните в Хижине, чтобы полностью восстановить силы!");
          triggerHaptic("medium");
        };
      }
    }
    window.triggerCollapseEvent = triggerCollapseEvent;

    // Рендеринг и логика способов ловли и приманок
    function renderBaitsUI() {
      const container = document.getElementById("baitsContainer");
      if (!container) return;
      const method = FISHING_METHODS[currentFishingMethod] || FISHING_METHODS.float;
      const availableBaits = method.baits || [];

      if (!Array.isArray(player.unlockedBaits)) player.unlockedBaits = ["worm"];
      if (!player.baits || typeof player.baits !== 'object') player.baits = { worm: 20 };

      // 1. Фильтруем ТОЛЬКО открытые наживки игрока (Requirement 1)
      const unlockedMethodBaits = availableBaits.filter(baitKey => player.unlockedBaits.includes(baitKey));

      // Если текущая приманка не подходит для метода или закрыта, выбираем первую открытую
      if (!unlockedMethodBaits.includes(currentBaitKey)) {
        const firstOwnedWithStock = unlockedMethodBaits.find(k => (player.baits[k] || 0) > 0);
        currentBaitKey = firstOwnedWithStock || unlockedMethodBaits[0] || "";
      }

      // Если ни одной наживки для метода еще не открыто
      if (unlockedMethodBaits.length === 0) {
        container.innerHTML = `
          <div style="font-size:12px;color:#94a3b8;padding:10px 14px;text-align:center;width:100%;">
            🔒 Нет открытых приманок для этого способа. Откройте их в лавке торговца в Хижине.
          </div>
        `;
        return;
      }

      container.innerHTML = unlockedMethodBaits.map(baitKey => {
        const bait = BAITS[baitKey];
        if (!bait) return '';
        const count = player.baits[baitKey] || 0;
        const isActive = baitKey === currentBaitKey;
        const isZero = count <= 0;

        return `
          <button class="bait-btn ${isActive ? 'active' : ''} ${isZero ? 'empty' : ''}" data-bait="${baitKey}">
            <span class="bait-icon">${bait.iconSvg || ''}</span>
            <span class="bait-name">${bait.name}</span>
            <span class="bait-count ${isZero ? 'zero' : ''}">x${count}</span>
          </button>
        `;
      }).join('');

      container.querySelectorAll(".bait-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          const baitKey = btn.dataset.bait;
          const bait = BAITS[baitKey];
          if (!bait) return;

          const count = player.baits[baitKey] || 0;
          if (count <= 0) {
            triggerHaptic("warning");
            // Requirement 5: Убрана возможность открывать торговца из панели снастей
            showToast(`Наживка «${bait.name}» закончилась! Пополните запасы в Хижине.`);
            return;
          }

          container.querySelectorAll(".bait-btn").forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
          currentBaitKey = baitKey;
          triggerHaptic("light");
          savePlayerLocal();
          showToast(`Выбрана приманка: ${bait.name} (${count} шт.)`);
        });
      });
    }

    function updateMethodsUI() {
      if (!Array.isArray(player.ownedMethods) || player.ownedMethods.length === 0) {
        player.ownedMethods = ["float"];
      }
      if (!player.ownedMethods.includes(currentFishingMethod)) {
        currentFishingMethod = player.ownedMethods[0] || "float";
      }

      document.querySelectorAll(".method-btn").forEach(btn => {
        const methodKey = btn.dataset.method;
        const isOwned = player.ownedMethods.includes(methodKey);
        btn.classList.toggle("locked", !isOwned);
        btn.classList.toggle("active", isOwned && methodKey === currentFishingMethod);
      });

      renderBaitsUI();
    }
    window.updateMethodsUI = updateMethodsUI;

    function initMethodAndBaitsUI() {
      document.querySelectorAll(".method-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          const methodKey = btn.dataset.method;
          if (!player.ownedMethods.includes(methodKey)) {
            const m = FISHING_METHODS[methodKey];
            showToast(`Способ «${m ? m.name : methodKey}» закрыт! Требуется Ур. ${m ? m.levelReq : '?'} у торговца.`);
            return;
          }
          currentFishingMethod = methodKey;
          updateMethodsUI();
          triggerHaptic("medium");
          savePlayerLocal();
          const method = FISHING_METHODS[currentFishingMethod];
          if (method) {
            showToast(`Способ: ${method.name}. ${method.desc}`);
          }
        });
      });

      updateMethodsUI();

      const twitchBtn = document.getElementById("twitchBtn");
      if (twitchBtn) {
        twitchBtn.addEventListener("click", () => {
          if (typeof window.onLureTwitch === 'function') {
            window.onLureTwitch();
          }
        });
      }
    }

    function showLureTwitchButton(show) {
      const wrapper = document.getElementById("twitchBtnWrapper");
      if (wrapper) {
        wrapper.style.display = show ? "flex" : "none";
      }
    }

    // Звук
    const soundBtn = document.getElementById("soundBtn");
    soundBtn.addEventListener("click", () => {
      player.soundEnabled = !player.soundEnabled;
      soundBtn.innerHTML = player.soundEnabled
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`
        : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>`;
      triggerHaptic("light");
    });

    // Действия в окне победы
    document.getElementById("addToLivewellBtn").addEventListener("click", () => {
      if (!lastCatchData) return;
      const newFishItem = {
        id: Date.now() + Math.random(),
        fishId: lastCatchData.fish.id,
        name: lastCatchData.fish.name,
        rarity: lastCatchData.fish.rarity,
        weight: lastCatchData.weight,
        price: lastCatchData.reward,
        color: lastCatchData.fish.color,
        bodyType: lastCatchData.fish.bodyType,
        fuelValue: lastCatchData.fish.fuelValue || 0,
        isLootbox: !!lastCatchData.fish.isLootbox,
        isFuel: !!lastCatchData.fish.isFuel,
        isJunk: !!lastCatchData.fish.isJunk,
        isBeast: !!lastCatchData.fish.isBeast,
        edible: lastCatchData.fish.edible,
        hungerValue: lastCatchData.fish.hungerValue,
        poison: lastCatchData.fish.poison,
        mutation: lastCatchData.fish.mutation || null,
        environment: lastCatchData.fish.environment || null,
        title: lastCatchData.fish.title || null
      };

      if (typeof GridInventory !== 'undefined') {
        const place = GridInventory.autoPlaceItem(player.livewell, newFishItem);
        if (!place) {
          showToast("Садок полон! Нет места для рыбы такого размера. Освободите место!");
          triggerHaptic("error");
          return;
        }
        newFishItem.gridX = place.x;
        newFishItem.gridY = place.y;
        newFishItem.gridShape = place.shape;
      }

      player.livewell.push(newFishItem);

      document.getElementById("catchModal").classList.remove("active");
      gameState = "IDLE";
      document.getElementById("swipeHint").style.display = "flex";
      document.getElementById("bottomBar").style.display = "flex";
      triggerHaptic("light");

      updatePlayerHUD();
      savePlayerLocal();
      saveCatchToSupabase(lastCatchData.fish.id, lastCatchData.weight, lastCatchData.reward, lastCatchData.xp);
      showToast(`[${lastCatchData.fish.name}] помещен(а) в садок!`);
    });

    const openChestBtn = document.getElementById("openChestBtn");
    if (openChestBtn) {
      openChestBtn.addEventListener("click", () => {
        if (!lastCatchData || !lastCatchData.fish.isLootbox) return;
        const loot = (typeof EntityGenerator !== 'undefined')
          ? EntityGenerator.unpackChest(lastCatchData.fish)
          : { coins: lastCatchData.reward * 2, xp: lastCatchData.xp * 2, bait: "live_bait", baitCount: 3 };

        player.balance += loot.coins;
        player.totalEarned += loot.coins;
        player.xp += loot.xp;
        player.level = 1 + Math.floor(Math.sqrt(player.xp / 50));

        if (loot.bait && loot.baitCount) {
          if (!player.baits) player.baits = {};
          player.baits[loot.bait] = (player.baits[loot.bait] || 0) + loot.baitCount;
          if (!Array.isArray(player.unlockedBaits)) player.unlockedBaits = ["worm"];
          if (!player.unlockedBaits.includes(loot.bait)) player.unlockedBaits.push(loot.bait);
          renderBaitsUI();
        }

        document.getElementById("catchModal").classList.remove("active");
        gameState = "IDLE";
        document.getElementById("swipeHint").style.display = "flex";
        document.getElementById("bottomBar").style.display = "flex";
        triggerHaptic("success");
        sound.playSuccess();

        updatePlayerHUD();
        savePlayerLocal();
        showToast(`Ларец открыт: +${loot.coins} C, +${loot.xp} XP, наживка x${loot.baitCount}!`);
      });
    }

    const releaseCatchBtn = document.getElementById("releaseCatchBtn");
    if (releaseCatchBtn) {
      releaseCatchBtn.addEventListener("click", () => {
        if (!lastCatchData) return;
        // Единение с природой: отпускание рыбы даёт опыт
        player.xp += 5;
        checkLevelUp();

        document.getElementById("catchModal").classList.remove("active");
        gameState = "IDLE";
        document.getElementById("swipeHint").style.display = "flex";
        document.getElementById("bottomBar").style.display = "flex";
        triggerHaptic("medium");

        updatePlayerHUD();
        savePlayerLocal();
        showToast(`[${lastCatchData.fish.name}] отпущен(а) обратно в озеро (+5 XP)`);
      });
    }

    /* ==========================================================
       САДОК: СЕТОЧНЫЙ ТЕТРИС-ИНВЕНТАРЬ (RESIDENT EVIL STYLE)
       ========================================================== */
    const livewellModal = document.getElementById("livewellModal");
    const openLivewellBtn = document.getElementById("openLivewellBtn");
    const closeLivewellBtn = document.getElementById("closeLivewellBtn");
    const rotateGridItemBtn = document.getElementById("rotateGridItemBtn");
    const discardGridItemBtn = document.getElementById("discardGridItemBtn");

    let selectedLivewellItem = null;

    function getCellBgForRarity(rarity) {
      switch (rarity) {
        case 'Legendary': return 'rgba(245, 158, 11, 0.35)';
        case 'Epic': return 'rgba(168, 85, 247, 0.3)';
        case 'Rare': return 'rgba(6, 182, 212, 0.28)';
        default: return 'rgba(148, 163, 184, 0.2)';
      }
    }

    let draggedLivewellItem = null;
    let dragGrabOffsetX = 0;
    let dragGrabOffsetY = 0;

    function clearDragPreview() {
      const gridContainer = document.getElementById("livewellInventoryGrid");
      if (!gridContainer) return;
      gridContainer.querySelectorAll(".drag-valid, .drag-invalid").forEach(el => {
        el.classList.remove("drag-valid", "drag-invalid");
      });
    }

    function updateDragPreview(originX, originY, item) {
      clearDragPreview();
      const gridContainer = document.getElementById("livewellInventoryGrid");
      if (!gridContainer || !item || typeof GridInventory === 'undefined') return;

      const shape = item.gridShape || GridInventory.getItemGridShape(item);
      const cleanMap = GridInventory.buildGridMap(player.livewell, item.id);
      const canPlace = GridInventory.canPlace(cleanMap, shape, originX, originY);
      const cls = canPlace ? "drag-valid" : "drag-invalid";

      const rows = shape.length;
      const cols = shape[0].length;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (shape[r][c] === 1) {
            const gx = originX + c;
            const gy = originY + r;
            if (gx >= 0 && gx < GridInventory.COLS && gy >= 0 && gy < GridInventory.ROWS) {
              const targetEl = gridContainer.querySelector(`.inv-cell[data-x="${gx}"][data-y="${gy}"]`);
              if (targetEl) targetEl.classList.add(cls);
            }
          }
        }
      }
    }

    function executeMoveItem(item, targetX, targetY) {
      if (!item || typeof GridInventory === 'undefined') return false;
      const shape = item.gridShape || GridInventory.getItemGridShape(item);
      const cleanMap = GridInventory.buildGridMap(player.livewell, item.id);

      if (GridInventory.canPlace(cleanMap, shape, targetX, targetY)) {
        item.gridX = targetX;
        item.gridY = targetY;
        triggerHaptic("medium");
        savePlayerLocal();
        renderLivewell();
        return true;
      } else {
        triggerHaptic("error");
        showToast("Невозможно поместить: ячейки заняты или выходят за край!");
        renderLivewell();
        return false;
      }
    }

    function renderLivewell() {
      const cellCountEl = document.getElementById("livewellCellCount");
      const summaryCount = document.getElementById("livewellSummaryCount");
      const gridContainer = document.getElementById("livewellInventoryGrid");

      if (!gridContainer || typeof GridInventory === 'undefined') return;

      const occupied = GridInventory.getOccupiedCellsCount(player.livewell);
      if (cellCountEl) cellCountEl.textContent = occupied;
      if (summaryCount) summaryCount.textContent = `${player.livewell.length} шт.`;

      const gridMap = GridInventory.buildGridMap(player.livewell);
      gridContainer.innerHTML = '';

      // Рендерим 48 ячеек (8 колонок x 6 строк)
      for (let r = 0; r < GridInventory.ROWS; r++) {
        for (let c = 0; c < GridInventory.COLS; c++) {
          const cell = document.createElement("div");
          cell.className = "inv-cell";
          cell.dataset.x = c;
          cell.dataset.y = r;

          const itemAtCell = gridMap[r][c];
          if (itemAtCell) {
            cell.classList.add("occupied");
            cell.dataset.itemId = itemAtCell.id;
            cell.setAttribute("draggable", "true");

            if (selectedLivewellItem && selectedLivewellItem.id === itemAtCell.id) {
              cell.classList.add("selected");
            }
            cell.style.background = getCellBgForRarity(itemAtCell.rarity);

            // Главная опорная ячейка рыбы (gridX, gridY)
            if (itemAtCell.gridX === c && itemAtCell.gridY === r) {
              const label = document.createElement("div");
              label.className = "inv-cell-content";
              const shortName = itemAtCell.name.length > 5 ? itemAtCell.name.slice(0, 4) + '…' : itemAtCell.name;
              label.innerHTML = `<span style="color:${itemAtCell.color || '#fff'};font-weight:700;">${shortName}</span><span style="font-size:8px;color:#94a3b8;">${itemAtCell.weight}k</span>`;
              cell.appendChild(label);
            } else {
              const dot = document.createElement("div");
              dot.className = "inv-cell-connector";
              cell.appendChild(dot);
            }
          }

          // Выбор или перемещение по клику
          cell.addEventListener("click", () => {
            const item = gridMap[r][c];
            if (item) {
              selectedLivewellItem = item;
              updateSelectedItemControls();
              renderLivewell();
              triggerHaptic("light");
            } else if (selectedLivewellItem) {
              executeMoveItem(selectedLivewellItem, c, r);
            }
          });

          // Подсветка всех ячеек одного предмета при наведении
          cell.addEventListener("mouseenter", () => {
            const itm = gridMap[r][c];
            if (itm && !draggedLivewellItem) {
              gridContainer.querySelectorAll(`[data-item-id="${itm.id}"]`).forEach(el => el.classList.add("hover-item"));
            }
          });
          cell.addEventListener("mouseleave", () => {
            gridContainer.querySelectorAll(".hover-item").forEach(el => el.classList.remove("hover-item"));
          });

          // HTML5 Drag & Drop (Десктоп / мышь)
          cell.addEventListener("dragstart", (e) => {
            const item = gridMap[r][c];
            if (!item) {
              e.preventDefault();
              return;
            }
            draggedLivewellItem = item;
            selectedLivewellItem = item;
            dragGrabOffsetX = c - item.gridX;
            dragGrabOffsetY = r - item.gridY;
            e.dataTransfer.setData("text/plain", String(item.id));
            e.dataTransfer.effectAllowed = "move";
            gridContainer.querySelectorAll(`[data-item-id="${item.id}"]`).forEach(el => el.classList.add("dragging"));
            updateSelectedItemControls();
          });

          cell.addEventListener("dragover", (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            if (!draggedLivewellItem) return;

            const targetOriginX = c - dragGrabOffsetX;
            const targetOriginY = r - dragGrabOffsetY;
            updateDragPreview(targetOriginX, targetOriginY, draggedLivewellItem);
          });

          cell.addEventListener("drop", (e) => {
            e.preventDefault();
            if (!draggedLivewellItem) return;
            const targetOriginX = c - dragGrabOffsetX;
            const targetOriginY = r - dragGrabOffsetY;
            executeMoveItem(draggedLivewellItem, targetOriginX, targetOriginY);
            clearDragPreview();
            draggedLivewellItem = null;
          });

          cell.addEventListener("dragend", () => {
            clearDragPreview();
            draggedLivewellItem = null;
            gridContainer.querySelectorAll(".dragging").forEach(el => el.classList.remove("dragging"));
          });

          // Touch Drag (Мобильные экраны / Telegram WebApp)
          cell.addEventListener("pointerdown", (e) => {
            const item = gridMap[r][c];
            if (!item || e.pointerType === "mouse") return;
            let touchMoved = false;
            const startX = e.clientX;
            const startY = e.clientY;
            const itemToDrag = item;
            const grabX = c - itemToDrag.gridX;
            const grabY = r - itemToDrag.gridY;

            function onPointerMove(pe) {
              const dist = Math.hypot(pe.clientX - startX, pe.clientY - startY);
              if (dist > 8) {
                touchMoved = true;
                draggedLivewellItem = itemToDrag;
                selectedLivewellItem = itemToDrag;
                const under = document.elementFromPoint(pe.clientX, pe.clientY);
                const underCell = under ? under.closest(".inv-cell") : null;
                if (underCell) {
                  const uc = parseInt(underCell.dataset.x, 10);
                  const ur = parseInt(underCell.dataset.y, 10);
                  updateDragPreview(uc - grabX, ur - grabY, itemToDrag);
                }
              }
            }

            function onPointerUp(pe) {
              window.removeEventListener("pointermove", onPointerMove);
              window.removeEventListener("pointerup", onPointerUp);
              window.removeEventListener("pointercancel", onPointerUp);
              if (touchMoved && draggedLivewellItem) {
                const under = document.elementFromPoint(pe.clientX, pe.clientY);
                const underCell = under ? under.closest(".inv-cell") : null;
                if (underCell) {
                  const uc = parseInt(underCell.dataset.x, 10);
                  const ur = parseInt(underCell.dataset.y, 10);
                  executeMoveItem(draggedLivewellItem, uc - grabX, ur - grabY);
                }
                clearDragPreview();
                draggedLivewellItem = null;
              }
            }

            window.addEventListener("pointermove", onPointerMove);
            window.addEventListener("pointerup", onPointerUp);
            window.addEventListener("pointercancel", onPointerUp);
          });

          gridContainer.appendChild(cell);
        }
      }

      updateSelectedItemControls();
    }

    function updateSelectedItemControls() {
      const nameEl = document.getElementById("selectedItemName");
      const subEl = document.getElementById("selectedItemSub");
      if (!rotateGridItemBtn || !discardGridItemBtn) return;

      if (!selectedLivewellItem) {
        if (nameEl) nameEl.textContent = "Нажмите на рыбу в садке";
        if (subEl) subEl.textContent = "Перетаскивайте или двигайте ячейки";
        rotateGridItemBtn.disabled = true;
        discardGridItemBtn.disabled = true;
        return;
      }

      const shape = selectedLivewellItem.gridShape || GridInventory.getItemGridShape(selectedLivewellItem);
      const cellsCount = GridInventory.countShapeCells(shape);

      if (nameEl) nameEl.textContent = `${selectedLivewellItem.name} (${selectedLivewellItem.weight} кг)`;
      if (subEl) subEl.textContent = `Форма: ${cellsCount} яч. | Цена у скупщика: ${selectedLivewellItem.price} C`;
      rotateGridItemBtn.disabled = false;
      discardGridItemBtn.disabled = false;
    }

    function tryMoveSelectedItem(targetX, targetY) {
      if (!selectedLivewellItem) return;
      executeMoveItem(selectedLivewellItem, targetX, targetY);
    }

    function rotateSelectedItem() {
      if (!selectedLivewellItem || typeof GridInventory === 'undefined') return;
      const currentShape = selectedLivewellItem.gridShape || GridInventory.getItemGridShape(selectedLivewellItem);
      const rotated = GridInventory.rotateMatrix(currentShape);
      const gridMap = GridInventory.buildGridMap(player.livewell, selectedLivewellItem.id);

      let bestX = selectedLivewellItem.gridX;
      let bestY = selectedLivewellItem.gridY;
      let fits = false;

      const offsets = [
        [0, 0], [-1, 0], [0, -1], [1, 0], [0, 1], [-2, 0], [0, -2], [1, -1], [-1, 1]
      ];

      for (const [ox, oy] of offsets) {
        const tx = selectedLivewellItem.gridX + ox;
        const ty = selectedLivewellItem.gridY + oy;
        if (GridInventory.canPlace(gridMap, rotated, tx, ty)) {
          bestX = tx;
          bestY = ty;
          fits = true;
          break;
        }
      }

      if (fits) {
        selectedLivewellItem.gridX = bestX;
        selectedLivewellItem.gridY = bestY;
        selectedLivewellItem.gridShape = rotated;
        triggerHaptic("medium");
        savePlayerLocal();
        renderLivewell();
        showToast("Предмет повёрнут на 90°");
      } else {
        triggerHaptic("error");
        showToast("Недостаточно места для поворота предмета!");
      }
    }

    function discardSelectedItem() {
      if (!selectedLivewellItem) return;
      const itemName = selectedLivewellItem.name;
      const index = player.livewell.findIndex(i => i.id === selectedLivewellItem.id);
      if (index !== -1) {
        const discarded = player.livewell.splice(index, 1)[0];
        selectedLivewellItem = null;
        triggerHaptic("heavy");
        savePlayerLocal();
        updatePlayerHUD();
        renderLivewell();
        showToast(`[${discarded.name}] выпущена обратно в озеро.`);
      }
    }

    if (rotateGridItemBtn) rotateGridItemBtn.addEventListener("click", rotateSelectedItem);
    if (discardGridItemBtn) discardGridItemBtn.addEventListener("click", discardSelectedItem);

    // Горячие клавиши (R - повернуть, Delete - выпустить, стрелки - атлас)
    window.addEventListener("keydown", (e) => {
      if (livewellModal && livewellModal.classList.contains("active")) {
        if (e.key === "r" || e.key === "R" || e.key === "к" || e.key === "К") {
          e.preventDefault();
          rotateSelectedItem();
        } else if (e.key === "Delete" || e.key === "Backspace") {
          e.preventDefault();
          discardSelectedItem();
        } else if (e.key === "Escape") {
          livewellModal.classList.remove("active");
        }
      }

      if (atlasModal && atlasModal.classList.contains("active")) {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          if (window.AtlasBook) window.AtlasBook.prevPage();
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          if (window.AtlasBook) window.AtlasBook.nextPage();
        } else if (e.key === "Escape") {
          atlasModal.classList.remove("active");
        }
      }
    });

    if (openLivewellBtn) {
      openLivewellBtn.addEventListener("click", () => {
        renderLivewell();
        livewellModal.classList.add("active");
        triggerHaptic("light");
      });
    }

    if (closeLivewellBtn) {
      closeLivewellBtn.addEventListener("click", () => {
        livewellModal.classList.remove("active");
        triggerHaptic("light");
        if (isHomeScene) {
          renderHome();
          homeModal.classList.add("active");
        }
      });
    }


    /* ==========================================================
       ДИНАМИЧЕСКИЙ РЫНОК РЫБЫ (ЗАКОН СПРОСА И ПРЕДЛОЖЕНИЯ)
       ========================================================== */
    let marketSales = {};
    try {
      const rawMarket = localStorage.getItem("lumibot_market_sales");
      if (rawMarket) marketSales = JSON.parse(rawMarket);
      if (!marketSales || typeof marketSales !== 'object') marketSales = {};
    } catch (e) {
      marketSales = {};
    }

    function recordFishSale(fishKey, count = 1) {
      if (!fishKey) return;
      marketSales[fishKey] = (marketSales[fishKey] || 0) + count;
      try {
        localStorage.setItem("lumibot_market_sales", JSON.stringify(marketSales));
      } catch (e) {}

      if (supabaseClient) {
        supabaseClient.rpc('record_market_sale', { p_fish_id: String(fishKey), p_count: count })
          .then(({ error }) => {
            if (error) {
              supabaseClient.from('market_sales').upsert({
                fish_id: String(fishKey),
                total_sold: marketSales[fishKey],
                updated_at: new Date().toISOString()
              }).catch(() => {});
            }
          }).catch(() => {});
      }
    }

    function getFishDynamicPrice(fish) {
      const basePrice = (fish && typeof fish.price === 'number') ? fish.price : 20;
      const totalSales = Object.values(marketSales).reduce((sum, v) => sum + (typeof v === 'number' ? v : 0), 0);
      const MIN_DATA_THRESHOLD = 12; // Пока недостаточно данных, цена как сейчас (Requirement 4)

      if (totalSales < MIN_DATA_THRESHOLD) {
        return {
          price: basePrice,
          basePrice: basePrice,
          multiplier: 1.0,
          trend: 'initial',
          diffPercent: 0,
          label: 'Базовая'
        };
      }

      const fishKey = fish.fishId || fish.id || "common_fish";
      const speciesKeys = Object.keys(marketSales);
      const avgSales = totalSales / Math.max(1, speciesKeys.length);
      const currentFishSales = marketSales[fishKey] || 0;

      // Относительное отклонение от среднего:
      // Если рыбу сдают чаще среднего -> переизбыток -> цена падает (до 0.50x)
      // Если рыбу сдают реже среднего -> дефицит -> цена растет (до 1.65x)
      const diff = (avgSales - currentFishSales) / (avgSales + 6);
      const multiplier = Math.max(0.50, Math.min(1.65, 1.0 + diff * 0.55));
      const dynamicPrice = Math.max(1, Math.round(basePrice * multiplier));
      const diffPercent = Math.round((multiplier - 1.0) * 100);

      let trend = 'neutral';
      let label = '⚖️ Норма';
      if (diffPercent >= 6) {
        trend = 'up';
        label = `📈 +${diffPercent}%`;
      } else if (diffPercent <= -6) {
        trend = 'down';
        label = `📉 ${diffPercent}%`;
      }

      return {
        price: dynamicPrice,
        basePrice: basePrice,
        multiplier: multiplier,
        trend: trend,
        diffPercent: diffPercent,
        label: label
      };
    }
    window.getFishDynamicPrice = getFishDynamicPrice;

    /* ==========================================================
       МОДУЛЬ МАГАЗИНА СНАСТЕЙ И УЛУЧШЕНИЙ
       ========================================================== */
    const shopModal = document.getElementById("shopModal");
    const openShopBtn = document.getElementById("openShopBtn");
    const closeShopBtn = document.getElementById("closeShopBtn");
    let currentShopTab = "sell";

    function sellLivewellFish(idx) {
      if (idx < 0 || idx >= player.livewell.length) return;
      const fish = player.livewell.splice(idx, 1)[0];
      const dynamic = getFishDynamicPrice(fish);
      player.balance += dynamic.price;
      player.totalEarned += dynamic.price;
      player.fishSold++;
      recordFishSale(fish.fishId || fish.id, 1);
      triggerHaptic("medium");
      updatePlayerHUD();
      savePlayerLocal();
      syncUserStatsToSupabase();
      showToast(`Продано на скупке: ${fish.name} (+${dynamic.price} C) [${dynamic.label}]`);
    }

    function renderShopTab(tabKey) {
      currentShopTab = tabKey;
      document.querySelectorAll(".tab-bar .tab-btn").forEach(b => {
        b.classList.toggle("active", b.dataset.shoptab === tabKey);
      });

      const container = document.getElementById("shopTabContent");
      if (!container) return;

      if (tabKey === "sell") {
        const totalWorth = player.livewell.reduce((sum, item) => sum + getFishDynamicPrice(item).price, 0);
        const totalGlobalSales = Object.values(marketSales).reduce((sum, v) => sum + (typeof v === 'number' ? v : 0), 0);
        const isDataReady = totalGlobalSales >= 12;

        if (player.livewell.length === 0) {
          container.innerHTML = `
            <div class="market-info-bar">
              <span>${isDataReady ? 'Динамическая скупка активна (спрос и предложение)' : 'Сбор статистики цен: продано ' + totalGlobalSales + '/12 рыб'}</span>
              <span>Всего сдано: <b>${totalGlobalSales} шт.</b></span>
            </div>
            <div style="text-align:center;padding:30px 10px;color:#64748b;font-size:13px;">
              Торговец ждет улов! Ваш садок пуст.<br><br>
              Поймайте рыбу и принесите её на скупку.
            </div>
          `;
        } else {
          container.innerHTML = `
            <div class="market-info-bar">
              <span>${isDataReady ? 'Динамическая скупка: цены зависят от частоты продаж' : 'Сбор статистики цен: продано ' + totalGlobalSales + '/12 рыб (базовые цены)'}</span>
              <span>Всего сдано: <b>${totalGlobalSales} шт.</b></span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-size:12px;color:#94a3b8;">
              <span>Рыб в садке: ${player.livewell.length} шт.</span>
              <span style="color:#fef08a;font-weight:700;">Итого: ${totalWorth} C</span>
            </div>
            <button class="action-btn" onclick="sellAllThroughMerchant()" style="margin-bottom:12px;padding:10px;">Продать всё оптом (+${totalWorth} C)</button>
            <div style="display:flex;flex-direction:column;gap:8px;">
              ${player.livewell.map((item, idx) => {
                const dynamic = getFishDynamicPrice(item);
                return `
                <div class="livewell-item">
                  <div class="livewell-item-meta">
                    <div class="livewell-item-name">
                      ${item.name}
                      <span class="rarity-pill rarity-${item.rarity}" style="font-size:9px;padding:1px 6px;">${item.rarity}</span>
                      <span class="price-trend-tag trend-${dynamic.trend}">${dynamic.label}</span>
                    </div>
                    <div class="livewell-item-sub">Вес: ${item.weight} кг | Цена: <b style="color:#fde047;">${dynamic.price} C</b> <span style="opacity:0.6;">(база: ${item.price} C)</span></div>
                  </div>
                  <button class="mini-sell-btn" onclick="sellLivewellFishFromShop(${idx})">Сдать +${dynamic.price} C</button>
                </div>
              `;
              }).join('')}
            </div>
          `;
        }
      } else if (tabKey === "methods") {
        container.innerHTML = Object.values(FISHING_METHODS).map(m => {
          const isEquipped = currentFishingMethod === m.id;
          const isOwned = player.ownedMethods.includes(m.id);
          const meetsLevel = player.level >= (m.levelReq || 1);
          const canAfford = player.balance >= m.price;

          let btnHtml = '';
          if (isEquipped) {
            btnHtml = `<button class="buy-btn equipped">Выбран</button>`;
          } else if (isOwned) {
            btnHtml = `<button class="buy-btn" onclick="equipMethod('${m.id}')">Выбрать</button>`;
          } else if (!meetsLevel) {
            btnHtml = `<button class="buy-btn locked" title="Требуется уровень ${m.levelReq}">🔒 Ур. ${m.levelReq}</button>`;
          } else if (!canAfford) {
            btnHtml = `<button class="buy-btn locked" title="Недостаточно монет">Купить ${m.price} C</button>`;
          } else {
            btnHtml = `<button class="buy-btn" onclick="buyMethod('${m.id}')">Купить ${m.price} C</button>`;
          }

          return `
            <div class="shop-card">
              <div class="shop-card-head">
                <div style="display:flex;align-items:center;gap:6px;">
                  <span style="display:inline-flex;color:#38bdf8;">${m.iconSvg || ''}</span>
                  <span class="shop-card-title">${m.name}</span>
                </div>
                <span class="shop-price">${m.price === 0 ? "Базовый" : m.price + " C"}</span>
              </div>
              <div class="shop-card-desc">${m.desc}</div>
              <div class="shop-card-actions">
                <div style="display:flex;align-items:center;gap:6px;">
                  <span class="req-badge ${meetsLevel ? 'ok' : ''}">Ур. ${m.levelReq || 1}</span>
                  <span style="font-size:11px;color:#38bdf8;">Клёв: x${m.biteSpeedMult}</span>
                </div>
                ${btnHtml}
              </div>
            </div>
          `;
        }).join('');
      } else if (tabKey === "rods") {
        container.innerHTML = Object.values(RODS).map(rod => {
          const isEquipped = player.rodId === rod.id;
          const isOwned = player.ownedRods.includes(rod.id);
          const meetsLevel = player.level >= (rod.levelReq || 1);
          const canAfford = player.balance >= rod.price;

          let btnHtml = '';
          if (isEquipped) {
            btnHtml = `<button class="buy-btn equipped">Надето</button>`;
          } else if (isOwned) {
            btnHtml = `<button class="buy-btn" onclick="equipRod('${rod.id}')">Надеть</button>`;
          } else if (!meetsLevel) {
            btnHtml = `<button class="buy-btn locked" title="Требуется уровень ${rod.levelReq}">🔒 Ур. ${rod.levelReq}</button>`;
          } else if (!canAfford) {
            btnHtml = `<button class="buy-btn locked" title="Недостаточно монет">Купить ${rod.price} C</button>`;
          } else {
            btnHtml = `<button class="buy-btn" onclick="buyRod('${rod.id}')">Купить ${rod.price} C</button>`;
          }

          return `
            <div class="shop-card">
              <div class="shop-card-head">
                <span class="shop-card-title">${rod.name}</span>
                <span class="shop-price">${rod.price === 0 ? "Базовая" : rod.price + " C"}</span>
              </div>
              <div class="shop-card-desc">${rod.desc}</div>
              <div class="shop-card-actions">
                <div style="display:flex;align-items:center;gap:6px;">
                  <span class="req-badge ${meetsLevel ? 'ok' : ''}">Ур. ${rod.levelReq || 1}</span>
                  <span style="font-size:11px;color:#38bdf8;">Зона: ${rod.safeZoneMin}%-${rod.safeZoneMax}%</span>
                </div>
                ${btnHtml}
              </div>
            </div>
          `;
        }).join('');
      } else if (tabKey === "lines") {
        container.innerHTML = Object.values(LINES).map(line => {
          const isEquipped = player.lineId === line.id;
          const isOwned = player.ownedLines.includes(line.id);
          const meetsLevel = player.level >= (line.levelReq || 1);
          const canAfford = player.balance >= line.price;

          let btnHtml = '';
          if (isEquipped) {
            btnHtml = `<button class="buy-btn equipped">Надето</button>`;
          } else if (isOwned) {
            btnHtml = `<button class="buy-btn" onclick="equipLine('${line.id}')">Надеть</button>`;
          } else if (!meetsLevel) {
            btnHtml = `<button class="buy-btn locked" title="Требуется уровень ${line.levelReq}">🔒 Ур. ${line.levelReq}</button>`;
          } else if (!canAfford) {
            btnHtml = `<button class="buy-btn locked" title="Недостаточно монет">Купить ${line.price} C</button>`;
          } else {
            btnHtml = `<button class="buy-btn" onclick="buyLine('${line.id}')">Купить ${line.price} C</button>`;
          }

          return `
            <div class="shop-card">
              <div class="shop-card-head">
                <span class="shop-card-title">${line.name}</span>
                <span class="shop-price">${line.price === 0 ? "Базовая" : line.price + " C"}</span>
              </div>
              <div class="shop-card-desc">${line.desc}</div>
              <div class="shop-card-actions">
                <div style="display:flex;align-items:center;gap:6px;">
                  <span class="req-badge ${meetsLevel ? 'ok' : ''}">Ур. ${line.levelReq || 1}</span>
                  <span style="font-size:11px;color:#38bdf8;">Запас: ${line.dangerBuffer} сек</span>
                </div>
                ${btnHtml}
              </div>
            </div>
          `;
        }).join('');
      } else if (tabKey === "baits") {
        if (!Array.isArray(player.unlockedBaits)) player.unlockedBaits = ["worm"];
        if (!player.baits || typeof player.baits !== 'object') player.baits = { worm: 20 };

        const methodSections = [
          { method: "float", title: "🪱 Поплавочные наживки", list: ["worm", "corn", "dough", "bloodworm"] },
          { method: "spinning", title: "🎣 Спиннинговые приманки", list: ["lure_spoon", "lure_spinner", "lure_jig", "lure_wobbler"] },
          { method: "feeder", title: "🔔 Фидерные смеси и насадки", list: ["maggot", "feeder_mix", "boilie", "live_bait"] },
          { method: "fly", title: "🪰 Нахлыстовые мушки", list: ["mayfly", "dry_fly", "nymph", "streamer"] }
        ];

        let html = '';
        methodSections.forEach(sec => {
          html += `<div class="shop-category-header">${sec.title}</div>`;
          sec.list.forEach(baitKey => {
            const bait = BAITS[baitKey];
            if (!bait) return;

            const isUnlocked = player.unlockedBaits.includes(baitKey);
            const count = player.baits[baitKey] || 0;
            const meetsLevel = player.level >= (bait.levelReq || 1);
            const canAffordUnlock = player.balance >= bait.unlockPrice;
            const canAffordPack = player.balance >= bait.packPrice;

            let btnHtml = '';
            if (!isUnlocked) {
              if (!meetsLevel) {
                btnHtml = `<button class="buy-btn locked" title="Требуется уровень ${bait.levelReq}">🔒 Ур. ${bait.levelReq}</button>`;
              } else if (!canAffordUnlock) {
                btnHtml = `<button class="buy-btn locked" title="Недостаточно монет">Открыть ${bait.unlockPrice} C</button>`;
              } else {
                btnHtml = `<button class="buy-btn" onclick="unlockBait('${baitKey}')">Открыть ${bait.unlockPrice === 0 ? "Бесплатно" : bait.unlockPrice + " C"}</button>`;
              }
            } else {
              if (!canAffordPack) {
                btnHtml = `<button class="buy-btn locked" title="Недостаточно монет">Закупка +${bait.packCount} шт. (${bait.packPrice} C)</button>`;
              } else {
                btnHtml = `<button class="buy-btn" onclick="buyBaitPack('${baitKey}')">Закупка +${bait.packCount} шт. (${bait.packPrice} C)</button>`;
              }
            }

            const methodName = (FISHING_METHODS[bait.method]?.name) || bait.method;
            const priceTag = !isUnlocked
              ? (bait.unlockPrice === 0 ? "Бесплатно" : bait.unlockPrice + " C")
              : (bait.packPrice + " C / " + bait.packCount + " шт.");

            html += `
              <div class="shop-card">
                <div class="shop-card-head">
                  <div style="display:flex;align-items:center;gap:6px;">
                    <span style="display:inline-flex;color:#38bdf8;">${bait.iconSvg || ''}</span>
                    <span class="shop-card-title">${bait.name}</span>
                    <span class="bait-method-badge">${methodName}</span>
                  </div>
                  <span class="shop-price">${priceTag}</span>
                </div>
                <div class="shop-card-desc">${bait.desc}</div>
                <div class="shop-card-actions">
                  <div style="display:flex;align-items:center;gap:8px;">
                    <span class="req-badge ${meetsLevel ? 'ok' : ''}">Ур. ${bait.levelReq || 1}</span>
                    <span class="bait-stock-tag ${count === 0 ? 'zero' : ''}">В наличии: <b>${count} шт.</b></span>
                  </div>
                  ${btnHtml}
                </div>
              </div>
            `;
          });
        });
        container.innerHTML = html;
      }
    }

    window.sellLivewellFishFromShop = function(idx) {
      sellLivewellFish(idx);
      renderShopTab("sell");
    };

    window.sellAllThroughMerchant = function() {
      if (player.livewell.length === 0) return;
      const count = player.livewell.length;
      let total = 0;
      player.livewell.forEach(f => {
        const dynamic = getFishDynamicPrice(f);
        total += dynamic.price;
        recordFishSale(f.fishId || f.id, 1);
      });
      player.balance += total;
      player.totalEarned += total;
      player.fishSold += count;
      player.livewell = [];

      triggerHaptic("success");
      sound.playSuccess();
      updatePlayerHUD();
      savePlayerLocal();
      syncUserStatsToSupabase();
      renderShopTab("sell");
      showToast(`Торговец выкупил ${count} рыб по рыночным ценам за +${total} C!`);
    };

    window.buyMethod = function(methodId) {
      const method = FISHING_METHODS[methodId];
      if (!method) return;
      if (player.level < (method.levelReq || 1)) {
        showToast(`Нужен Уровень ${method.levelReq} для открытия!`);
        return;
      }
      if (player.balance < method.price) {
        showToast(`Недостаточно монет: требуется ${method.price} C`);
        return;
      }
      player.balance -= method.price;
      if (!player.ownedMethods.includes(methodId)) {
        player.ownedMethods.push(methodId);
      }
      currentFishingMethod = methodId;

      triggerHaptic("success");
      sound.playSuccess();
      updatePlayerHUD();
      updateMethodsUI();
      savePlayerLocal();
      syncUserStatsToSupabase();
      renderShopTab("methods");
      showToast(`Открыт способ ловли: ${method.name}!`);
    };

    window.equipMethod = function(methodId) {
      if (!player.ownedMethods.includes(methodId)) return;
      currentFishingMethod = methodId;
      triggerHaptic("light");
      updateMethodsUI();
      savePlayerLocal();
      syncUserStatsToSupabase();
      renderShopTab("methods");
      showToast(`Выбран способ ловли: ${FISHING_METHODS[methodId].name}`);
    };

    window.buyRod = function(rodId) {
      const rod = RODS[rodId];
      if (!rod) return;
      if (player.level < (rod.levelReq || 1)) {
        showToast(`Нужен Уровень ${rod.levelReq} для покупки этой удочки!`);
        return;
      }
      if (player.balance < rod.price) return;
      player.balance -= rod.price;
      player.ownedRods.push(rodId);
      player.rodId = rodId;

      triggerHaptic("success");
      sound.playSuccess();
      updatePlayerHUD();
      updateTensionSafeZoneUI();
      savePlayerLocal();
      syncUserStatsToSupabase();
      renderShopTab("rods");
      showToast(`Куплена удочка: ${rod.name}!`);
    };

    window.equipRod = function(rodId) {
      if (!player.ownedRods.includes(rodId)) return;
      player.rodId = rodId;
      triggerHaptic("light");
      updateTensionSafeZoneUI();
      savePlayerLocal();
      syncUserStatsToSupabase();
      renderShopTab("rods");
      showToast(`Надета: ${RODS[rodId].name}`);
    };

    window.buyLine = function(lineId) {
      const line = LINES[lineId];
      if (!line) return;
      if (player.level < (line.levelReq || 1)) {
        showToast(`Нужен Уровень ${line.levelReq} для покупки этой лески!`);
        return;
      }
      if (player.balance < line.price) return;
      player.balance -= line.price;
      player.ownedLines.push(lineId);
      player.lineId = lineId;

      triggerHaptic("success");
      sound.playSuccess();
      updatePlayerHUD();
      savePlayerLocal();
      syncUserStatsToSupabase();
      renderShopTab("lines");
      showToast(`Куплена леска: ${line.name}!`);
    };

    window.equipLine = function(lineId) {
      if (!player.ownedLines.includes(lineId)) return;
      player.lineId = lineId;
      triggerHaptic("light");
      savePlayerLocal();
      syncUserStatsToSupabase();
      renderShopTab("lines");
      showToast(`Надета: ${LINES[lineId].name}`);
    };

    function openShopModalWithTab(tabKey) {
      if (!shopModal) return;
      renderShopTab(tabKey || "baits");
      shopModal.classList.add("active");
      triggerHaptic("light");
    }
    window.openShopModalWithTab = openShopModalWithTab;

    window.unlockBait = function(baitKey) {
      const bait = BAITS[baitKey];
      if (!bait) return;
      if (player.level < (bait.levelReq || 1)) {
        showToast(`Нужен Уровень ${bait.levelReq} для открытия наживки «${bait.name}»!`);
        return;
      }
      if (player.balance < bait.unlockPrice) {
        showToast(`Недостаточно монет: требуется ${bait.unlockPrice} C`);
        return;
      }
      player.balance -= bait.unlockPrice;
      if (!Array.isArray(player.unlockedBaits)) player.unlockedBaits = ["worm"];
      if (!player.unlockedBaits.includes(baitKey)) {
        player.unlockedBaits.push(baitKey);
      }
      if (!player.baits) player.baits = {};
      player.baits[baitKey] = (player.baits[baitKey] || 0) + (bait.packCount || 10);

      // Если метод ловли совпадает, выбираем открытую наживку
      if (bait.method === currentFishingMethod) {
        currentBaitKey = baitKey;
      }

      triggerHaptic("success");
      sound.playSuccess();
      updatePlayerHUD();
      renderBaitsUI();
      savePlayerLocal();
      syncUserStatsToSupabase();
      renderShopTab("baits");
      showToast(`Наживка «${bait.name}» открыта! (+${bait.packCount} шт.)`);
    };

    window.buyBaitPack = function(baitKey) {
      const bait = BAITS[baitKey];
      if (!bait) return;
      if (!player.unlockedBaits || !player.unlockedBaits.includes(baitKey)) {
        showToast(`Сначала необходимо открыть наживку «${bait.name}»!`);
        return;
      }
      if (player.balance < bait.packPrice) {
        showToast(`Недостаточно монет: требуется ${bait.packPrice} C`);
        return;
      }
      player.balance -= bait.packPrice;
      if (!player.baits) player.baits = {};
      player.baits[baitKey] = (player.baits[baitKey] || 0) + (bait.packCount || 10);

      triggerHaptic("success");
      sound.playSuccess();
      updatePlayerHUD();
      renderBaitsUI();
      savePlayerLocal();
      syncUserStatsToSupabase();
      renderShopTab("baits");
      showToast(`Закуплено: «${bait.name}» +${bait.packCount} шт. (всего: ${player.baits[baitKey]} шт.)`);
    };

    document.querySelectorAll(".tab-bar .tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        renderShopTab(btn.dataset.shoptab);
        triggerHaptic("light");
      });
    });

    if (openShopBtn) {
      openShopBtn.addEventListener("click", () => {
        renderShopTab(currentShopTab);
        shopModal.classList.add("active");
        triggerHaptic("light");
      });
    }

    if (closeShopBtn) {
      closeShopBtn.addEventListener("click", () => {
        shopModal.classList.remove("active");
        triggerHaptic("light");
        if (isHomeScene) {
          renderHome();
          homeModal.classList.add("active");
        }
      });
    }

    /* ==========================================================
       МЕНЮ ДОМА (ХИЖИНА РЫБАКА) И ДЕЙСТВИЯ
       ========================================================== */
    const homeModal = document.getElementById("homeModal");
    const openHomeBtn = document.getElementById("openHomeBtn");
    const closeHomeBtn = document.getElementById("closeHomeBtn");
    const homeGoFishingBtn = document.getElementById("homeGoFishingBtn");
    const homeGoMerchantBtn = document.getElementById("homeGoMerchantBtn");
    const homeGoLivewellBtn = document.getElementById("homeGoLivewellBtn");
    const homeGoSleepBtn = document.getElementById("homeGoSleepBtn");
    const homeGoStoveBtn = document.getElementById("homeGoStoveBtn");

    function renderHome() {
      document.getElementById("statFishCaught").textContent = player.fishCaught;
      document.getElementById("statFishSold").textContent = player.fishSold;
      document.getElementById("statTotalEarned").textContent = `${player.totalEarned} C`;
      const livewellCountEl = document.getElementById("homeLivewellCount");
      if (livewellCountEl) livewellCountEl.textContent = player.livewell.length;

      // Количество дров/топлива в садке
      const fuelItems = player.livewell.filter(i => (i.fuelValue && i.fuelValue > 0) || i.isFuel);
      const fuelCountEl = document.getElementById("homeFuelCount");
      if (fuelCountEl) fuelCountEl.textContent = fuelItems.length;

      const bestTrophyEl = document.getElementById("statBestTrophy");
      if (player.bestCatch && player.bestCatch.name) {
        bestTrophyEl.textContent = `${player.bestCatch.name} (${player.bestCatch.weight} кг)`;
      } else {
        bestTrophyEl.textContent = "Пока нет";
      }

      document.getElementById("profileRodName").textContent = RODS[player.rodId] ? RODS[player.rodId].name : "Бамбуковая удочка";
      document.getElementById("profileLineName").textContent = LINES[player.lineId] ? LINES[player.lineId].name : "Монофил 0.2мм";

      // Прогресс Атласа видов (среди 116 видов)
      const caughtCount = Object.keys(player.caughtSpecies || {}).length;
      const progressBadge = document.getElementById("fishdexProgressBadge");
      if (progressBadge) {
        progressBadge.textContent = `${caughtCount} / 116`;
      }

      // Привязка фильтров FishDex
      document.querySelectorAll(".fishdex-tab-btn").forEach(btn => {
        btn.onclick = () => {
          document.querySelectorAll(".fishdex-tab-btn").forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
          currentFishdexFilter = btn.dataset.filter;
          renderFishdexCards();
          triggerHaptic("light");
        };
      });

      renderFishdexCards();
    }

    let currentFishdexFilter = "all";

    function renderFishdexCards() {
      const grid = document.getElementById("profileFishdexGrid");
      if (!grid) return;
      const ED = window.ENTITY_DATA;
      let itemsToDisplay = [];

      if (currentFishdexFilter === "beasts") {
        itemsToDisplay = (ED && ED.BEAST_SPECIES) ? ED.BEAST_SPECIES : [];
      } else if (currentFishdexFilter === "all") {
        itemsToDisplay = (ED && ED.FISH_SPECIES) ? ED.FISH_SPECIES : (window.FISH_DATABASE || []);
      } else {
        const all = [...((ED && ED.FISH_SPECIES) ? ED.FISH_SPECIES : (window.FISH_DATABASE || [])), ...((ED && ED.BEAST_SPECIES) ? ED.BEAST_SPECIES : [])];
        itemsToDisplay = all.filter(f => f.family === currentFishdexFilter || f.rarity === currentFishdexFilter);
      }

      grid.innerHTML = itemsToDisplay.map(fish => {
        const caught = player.caughtSpecies[fish.id];
        if (caught) {
          return `
            <div class="fishdex-card">
              <span class="rarity-pill rarity-${fish.rarity}" style="font-size:8px;padding:1px 5px;">${fish.rarity}</span>
              <div class="fishdex-name" style="color:${fish.color};margin-top:2px;">${fish.name}</div>
              <div class="fishdex-weight">Рекорд: ${caught.maxWeight} кг</div>
              <div style="font-size:9px;color:#94a3b8;">Выловлено: ${caught.count} шт.</div>
            </div>
          `;
        } else {
          return `
            <div class="fishdex-card locked">
              <span class="rarity-pill rarity-${fish.rarity}" style="font-size:8px;padding:1px 5px;opacity:0.4;">${fish.rarity}</span>
              <div class="fishdex-name" style="margin-top:2px;color:#94a3b8;">${fish.name}</div>
              <div class="fishdex-weight" style="color:#475569;">Не поймано</div>
            </div>
          `;
        }
      }).join('');
    }

    function openHomeScene() {
      isHomeScene = true;
      renderHome();
      homeModal.classList.add("active");
      document.getElementById("bottomBar").style.display = "none";
      document.getElementById("swipeHint").style.display = "none";
      triggerHaptic("light");
    }

    function closeHomeScene() {
      isHomeScene = false;
      homeModal.classList.remove("active");
      if (gameState === "IDLE") {
        document.getElementById("bottomBar").style.display = "flex";
        document.getElementById("swipeHint").style.display = "flex";
      }
      triggerHaptic("light");
      showToast("Вы на озере. Смахните вверх для заброса");
    }

    if (openHomeBtn) openHomeBtn.addEventListener("click", openHomeScene);
    if (closeHomeBtn) closeHomeBtn.addEventListener("click", closeHomeScene);
    if (homeGoFishingBtn) homeGoFishingBtn.addEventListener("click", closeHomeScene);

    if (homeGoMerchantBtn) {
      homeGoMerchantBtn.addEventListener("click", () => {
        homeModal.classList.remove("active");
        renderShopTab(currentShopTab);
        shopModal.classList.add("active");
        triggerHaptic("light");
      });
    }

    if (homeGoLivewellBtn) {
      homeGoLivewellBtn.addEventListener("click", () => {
        homeModal.classList.remove("active");
        renderLivewell();
        livewellModal.classList.add("active");
        triggerHaptic("light");
      });
    }

    function sleepAtHome() {
      const sleepOverlay = document.getElementById("sleepOverlay");
      const sleepText = document.getElementById("sleepText");
      if (!sleepOverlay) return;

      triggerHaptic("medium");
      sound.playSleep();

      if (sleepText) sleepText.textContent = "Рыбак сладко уснул под потрескивание дров в камине...";
      sleepOverlay.classList.add("active");

      // Сбрасываем усталость на 0% при полноценном сне в Хижине
      player.fatigue = 0;
      updatePlayerHUD();
      savePlayerLocal();
      syncUserStatsToSupabase();

      setTimeout(() => {
        if (sleepText) sleepText.textContent = "Наступило бодрое утро! Усталость полностью снята, силы восстановлены.";
        triggerHaptic("success");
      }, 1200);

      setTimeout(() => {
        sleepOverlay.classList.remove("active");
        showToast("Отличный сон! Усталость: 0%. Вы полны сил для новых рекордов.");
      }, 2300);
    }

    if (homeGoSleepBtn) homeGoSleepBtn.addEventListener("click", sleepAtHome);

    if (homeGoStoveBtn) {
      homeGoStoveBtn.addEventListener("click", () => {
        const fuelIndex = player.livewell.findIndex(item => (item.fuelValue && item.fuelValue > 0) || item.isFuel);
        if (fuelIndex === -1) {
          showToast("В садке нет брёвен или дров для печи!");
          triggerHaptic("error");
          return;
        }

        const burnedItem = player.livewell.splice(fuelIndex, 1)[0];
        const warmthBonus = Math.round((burnedItem.fuelValue || 25) * 1.5);
        player.xp += warmthBonus;
        player.level = 1 + Math.floor(Math.sqrt(player.xp / 50));

        sound.playSuccess();
        triggerHaptic("heavy");
        savePlayerLocal();
        renderHome();
        updatePlayerHUD();
        showToast(`Очаг затоплен [${burnedItem.name}]! +${warmthBonus} XP за уют.`);
      });
    }

    /* ==========================================================
       ПОЛЕВОЙ АТЛАС ВИДОВ (КНИГА ИССЛЕДОВАТЕЛЯ)
       ========================================================== */
    const atlasModal = document.getElementById("atlasModal");
    const openAtlasBtn = document.getElementById("openAtlasBtn");
    const closeAtlasBtn = document.getElementById("closeAtlasBtn");
    const homeGoAtlasBtn = document.getElementById("homeGoAtlasBtn");
    const atlasPrevBtn = document.getElementById("atlasPrevBtn");
    const atlasNextBtn = document.getElementById("atlasNextBtn");
    const atlasTocToggleBtn = document.getElementById("atlasTocToggleBtn");

    function openAtlas() {
      if (!atlasModal) return;
      window.player = player;
      const ED = window.ENTITY_DATA;
      const totalCount = ((ED && ED.FISH_SPECIES) ? ED.FISH_SPECIES.length : 100) + ((ED && ED.BEAST_SPECIES) ? ED.BEAST_SPECIES.length : 16);
      const discoveredCount = Object.keys(player.caughtSpecies || {}).length;

      const badge = document.getElementById("atlasDiscoveredBadge");
      if (badge) badge.textContent = `${discoveredCount} / ${totalCount}`;

      atlasModal.classList.add("active");
      triggerHaptic("light");

      if (window.AtlasBook) {
        window.AtlasBook.renderBookPage();
      }
    }

    function closeAtlas() {
      if (!atlasModal) return;
      atlasModal.classList.remove("active");
      triggerHaptic("light");
      if (isHomeScene) {
        renderHome();
        homeModal.classList.add("active");
      }
    }

    if (openAtlasBtn) openAtlasBtn.addEventListener("click", openAtlas);
    if (closeAtlasBtn) closeAtlasBtn.addEventListener("click", closeAtlas);
    if (homeGoAtlasBtn) {
      homeGoAtlasBtn.addEventListener("click", () => {
        homeModal.classList.remove("active");
        openAtlas();
      });
    }

    if (atlasPrevBtn) atlasPrevBtn.addEventListener("click", () => {
      if (window.AtlasBook) window.AtlasBook.prevPage();
    });
    if (atlasNextBtn) atlasNextBtn.addEventListener("click", () => {
      if (window.AtlasBook) window.AtlasBook.nextPage();
    });
    if (atlasTocToggleBtn) atlasTocToggleBtn.addEventListener("click", () => {
      if (window.AtlasBook) window.AtlasBook.toggleOverviewMode();
    });

    document.querySelectorAll("#atlasFamilyTabs .atlas-tab-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        document.querySelectorAll("#atlasFamilyTabs .atlas-tab-btn").forEach(b => b.classList.remove("active"));
        e.currentTarget.classList.add("active");
        if (window.AtlasBook) window.AtlasBook.setFamilyFilter(e.currentTarget.dataset.family);
      });
    });

    // Закрытие по клику на темный фон модальных окон
    [livewellModal, shopModal, homeModal, atlasModal].forEach(modal => {
      if (!modal) return;
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          if (modal === homeModal) {
            closeHomeScene();
          } else {
            modal.classList.remove("active");
            if (isHomeScene) {
              renderHome();
              homeModal.classList.add("active");
            }
          }
        }
      });
    });

    // Тосты статуса
    let toastTimeout;
    function showToast(text) {
      const toast = document.getElementById("statusToast");
      toast.textContent = text;
      toast.classList.add("visible");
      clearTimeout(toastTimeout);
      toastTimeout = setTimeout(() => {
        toast.classList.remove("visible");
      }, 2500);
    }

    // Инициализация при загрузке

    // Инициализация интерфейса и загрузка данных игрока
    updateTensionSafeZoneUI();
    updatePlayerHUD();
    loadUserData();
    initMethodAndBaitsUI();
