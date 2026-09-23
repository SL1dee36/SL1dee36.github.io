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

    // Каталог удочек
    const RODS = {
      bamboo: {
        id: "bamboo",
        name: "Бамбуковая удочка",
        price: 0,
        speedBonus: 1.0,
        safeZoneMin: 25,
        safeZoneMax: 75,
        rareBonus: 0,
        desc: "Базовое удилище из речного бамбука. Простое и надежное."
      },
      carbon: {
        id: "carbon",
        name: "Карбоновый спиннинг",
        price: 350,
        speedBonus: 1.15,
        safeZoneMin: 22,
        safeZoneMax: 78,
        rareBonus: 6,
        desc: "+15% к скорости вываживания, шире безопасная зона контроля."
      },
      titanium: {
        id: "titanium",
        name: "Титановый фидер",
        price: 1200,
        speedBonus: 1.30,
        safeZoneMin: 18,
        safeZoneMax: 82,
        rareBonus: 15,
        desc: "+30% скорость подмотки, +15% шанс редкой рыбы, широкая зона."
      },
      gold_master: {
        id: "gold_master",
        name: "Золотой Мастер Pro",
        price: 3500,
        speedBonus: 1.55,
        safeZoneMin: 15,
        safeZoneMax: 85,
        rareBonus: 30,
        desc: "Шедевр! +55% скорость, +30% шанс трофеев, огромная зона контроля."
      }
    };

    // Каталог лесок
    const LINES = {
      mono: {
        id: "mono",
        name: "Монофил 0.2мм",
        price: 0,
        dangerBuffer: 1.2,
        desc: "Стандартная леска. 1.2 сек запаса в критической зоне до обрыва."
      },
      fluoro: {
        id: "fluoro",
        name: "Флюорокарбон 0.35мм",
        price: 250,
        dangerBuffer: 1.8,
        desc: "Невидима в воде и устойчива. 1.8 сек запаса в критической зоне."
      },
      braided: {
        id: "braided",
        name: "Плетеный шнур Pro",
        price: 800,
        dangerBuffer: 2.6,
        desc: "Сверхпрочный 8-жильный шнур. 2.6 сек запаса на исправление ошибки!"
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
      // Игровая статистика
      fishCaught: 0,
      fishSold: 0,
      totalEarned: 0,
      // Снаряжение
      rodId: "bamboo",
      lineId: "mono",
      ownedRods: ["bamboo"],
      ownedLines: ["mono"],
      // Садок и трофеи
      livewell: [],
      bestCatch: { name: "", weight: 0, rarity: "" },
      caughtSpecies: {}
    };

    /* ==========================================================
       КАТАЛОГ РЫБЫ (ЛОКАЛЬНЫЙ FALLBACK И СИНХРОНИЗАЦИЯ)
       ========================================================== */
    const FISH_DATABASE = [
      { id: 1, name: "Карась", rarity: "Common", min_weight: 0.20, max_weight: 1.20, base_price: 25, color: "#94a3b8", bodyType: 0 },
      { id: 2, name: "Окунь", rarity: "Common", min_weight: 0.25, max_weight: 1.80, base_price: 40, color: "#84cc16", bodyType: 1 },
      { id: 3, name: "Плотва", rarity: "Common", min_weight: 0.15, max_weight: 0.90, base_price: 20, color: "#a3e635", bodyType: 0 },
      { id: 4, name: "Лещ", rarity: "Rare", min_weight: 0.80, max_weight: 4.20, base_price: 95, color: "#eab308", bodyType: 0 },
      { id: 5, name: "Судак", rarity: "Rare", min_weight: 1.20, max_weight: 6.50, base_price: 160, color: "#06b6d4", bodyType: 1 },
      { id: 6, name: "Щука", rarity: "Epic", min_weight: 2.50, max_weight: 14.00, base_price: 380, color: "#10b981", bodyType: 2 },
      { id: 7, name: "Сом", rarity: "Epic", min_weight: 8.00, max_weight: 55.00, base_price: 850, color: "#64748b", bodyType: 3 },
      { id: 8, name: "Осетр", rarity: "Legendary", min_weight: 15.00, max_weight: 85.00, base_price: 2400, color: "#f59e0b", bodyType: 2 },
      { id: 9, name: "Золотая Рыбка", rarity: "Legendary", min_weight: 0.40, max_weight: 2.50, base_price: 5000, color: "#ec4899", bodyType: 0 }
    ];

    // Настройки приманок
    const BAITS = {
      worm: {
        name: "Червь",
        speedMultiplier: 1.0,
        waitMin: 4000,
        waitMax: 7000,
        rarityWeights: { Common: 70, Rare: 25, Epic: 4.5, Legendary: 0.5 }
      },
      corn: {
        name: "Кукуруза",
        speedMultiplier: 1.4,
        waitMin: 2500,
        waitMax: 5000,
        rarityWeights: { Common: 80, Rare: 18, Epic: 1.8, Legendary: 0.2 }
      },
      lure: {
        name: "Блесна",
        speedMultiplier: 0.7,
        waitMin: 6000,
        waitMax: 10000,
        rarityWeights: { Common: 35, Rare: 45, Epic: 16, Legendary: 4.0 }
      }
    };
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

      sound.playFail();
      triggerHaptic("error");
      showToast(reason);
    }

    let lastCatchData = null;

    function winFishing() {
      gameState = "CAUGHT";
      document.getElementById("reelingOverlay").classList.remove("active");

      sound.playSuccess();
      triggerHaptic("success");

      // Расчет награды и опыта
      const weightMultiplier = activeFishWeight / activeFish.min_weight;
      const reward = Math.round(activeFish.base_price * (0.8 + weightMultiplier * 0.3));
      const xpGained = Math.round(reward * 0.6);

      // Опыт и уровень начисляются сразу
      player.fishCaught++;
      player.xp += xpGained;
      player.level = 1 + Math.floor(Math.sqrt(player.xp / 50));

      // Обновление рекорда и атласа видов
      if (!player.bestCatch || !player.bestCatch.weight || activeFishWeight > player.bestCatch.weight) {
        player.bestCatch = {
          name: activeFish.name,
          weight: activeFishWeight,
          rarity: activeFish.rarity
        };
      }

      if (!player.caughtSpecies[activeFish.id]) {
        player.caughtSpecies[activeFish.id] = { maxWeight: activeFishWeight, count: 1 };
      } else {
        player.caughtSpecies[activeFish.id].count++;
        if (activeFishWeight > player.caughtSpecies[activeFish.id].maxWeight) {
          player.caughtSpecies[activeFish.id].maxWeight = activeFishWeight;
        }
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

      document.getElementById("catchModal").classList.add("active");
    }

    let dbHasStatsColumns = false;

// Отрисовка превью рыбы в модальном окне
    function drawPreviewFish(fish) {
      const pCanvas = document.getElementById("previewFishCanvas");
      const pCtx = pCanvas.getContext("2d");
      pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);

      const cx = pCanvas.width / 2;
      const cy = pCanvas.height / 2;

      pCtx.save();
      pCtx.shadowColor = fish.color;
      pCtx.shadowBlur = 14;

      // Форма рыбы
      pCtx.fillStyle = fish.color;
      pCtx.beginPath();
      pCtx.ellipse(cx, cy, 38, 18, 0, 0, Math.PI * 2);
      pCtx.fill();

      // Плавники
      pCtx.fillStyle = "rgba(255, 255, 255, 0.4)";
      pCtx.beginPath();
      pCtx.moveTo(cx - 5, cy + 8);
      pCtx.lineTo(cx - 15, cy + 18);
      pCtx.lineTo(cx + 2, cy + 12);
      pCtx.fill();

      // Хвост
      pCtx.fillStyle = fish.color;
      pCtx.beginPath();
      pCtx.moveTo(cx - 32, cy);
      pCtx.lineTo(cx - 52, cy - 14);
      pCtx.lineTo(cx - 44, cy);
      pCtx.lineTo(cx - 52, cy + 14);
      pCtx.closePath();
      pCtx.fill();

      // Глаз
      pCtx.fillStyle = "#fff";
      pCtx.beginPath();
      pCtx.arc(cx + 22, cy - 4, 4, 0, Math.PI * 2);
      pCtx.fill();
      pCtx.fillStyle = "#000";
      pCtx.beginPath();
      pCtx.arc(cx + 23, cy - 4, 2, 0, Math.PI * 2);
      pCtx.fill();

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
          ownedRods: player.ownedRods,
          ownedLines: player.ownedLines,
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
          if (typeof saved.fishCaught === 'number') player.fishCaught = saved.fishCaught;
          if (typeof saved.fishSold === 'number') player.fishSold = saved.fishSold;
          if (typeof saved.totalEarned === 'number') player.totalEarned = saved.totalEarned;
          if (saved.rodId && RODS[saved.rodId]) player.rodId = saved.rodId;
          if (saved.lineId && LINES[saved.lineId]) player.lineId = saved.lineId;
          if (Array.isArray(saved.ownedRods)) player.ownedRods = saved.ownedRods;
          if (Array.isArray(saved.ownedLines)) player.ownedLines = saved.ownedLines;
          if (Array.isArray(saved.livewell)) player.livewell = saved.livewell;
          if (saved.bestCatch && saved.bestCatch.weight) player.bestCatch = saved.bestCatch;
          if (saved.caughtSpecies) player.caughtSpecies = saved.caughtSpecies;
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
            current_line_id: player.lineId
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

          if (data.current_rod_id && RODS[data.current_rod_id]) {
            player.rodId = data.current_rod_id;
            if (!player.ownedRods.includes(data.current_rod_id)) player.ownedRods.push(data.current_rod_id);
          }
          if (data.current_line_id && LINES[data.current_line_id]) {
            player.lineId = data.current_line_id;
            if (!player.ownedLines.includes(data.current_line_id)) player.ownedLines.push(data.current_line_id);
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
    }

    // Переключение наживок
    document.querySelectorAll(".bait-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".bait-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentBaitKey = btn.dataset.bait;
        triggerHaptic("light");
        showToast(`Выбрана наживка: ${BAITS[currentBaitKey].name}`);
      });
    });

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
      player.livewell.push({
        id: Date.now() + Math.random(),
        fishId: lastCatchData.fish.id,
        name: lastCatchData.fish.name,
        rarity: lastCatchData.fish.rarity,
        weight: lastCatchData.weight,
        price: lastCatchData.reward,
        color: lastCatchData.fish.color
      });

      document.getElementById("catchModal").classList.remove("active");
      gameState = "IDLE";
      document.getElementById("swipeHint").style.display = "flex";
      document.getElementById("bottomBar").style.display = "flex";
      triggerHaptic("light");

      updatePlayerHUD();
      savePlayerLocal();
      saveCatchToSupabase(lastCatchData.fish.id, lastCatchData.weight, lastCatchData.reward, lastCatchData.xp);
      showToast(`Рыба [${lastCatchData.fish.name}] помещена в садок!`);
    });

    document.getElementById("instantSellBtn").addEventListener("click", () => {
      if (!lastCatchData) return;
      player.balance += lastCatchData.reward;
      player.totalEarned += lastCatchData.reward;
      player.fishSold++;

      document.getElementById("catchModal").classList.remove("active");
      gameState = "IDLE";
      document.getElementById("swipeHint").style.display = "flex";
      document.getElementById("bottomBar").style.display = "flex";
      triggerHaptic("medium");

      updatePlayerHUD();
      savePlayerLocal();
      saveCatchToSupabase(lastCatchData.fish.id, lastCatchData.weight, lastCatchData.reward, lastCatchData.xp);
      showToast(`Рыба [${lastCatchData.fish.name}] продана за +${lastCatchData.reward} C!`);
    });

    /* ==========================================================
       МОДАЛЬНОЕ ОКНО: САДОК
       ========================================================== */
    const livewellModal = document.getElementById("livewellModal");
    const openLivewellBtn = document.getElementById("openLivewellBtn");
    const closeLivewellBtn = document.getElementById("closeLivewellBtn");
    const sellAllLivewellBtn = document.getElementById("sellAllLivewellBtn");

    function renderLivewell() {
      const summaryCount = document.getElementById("livewellSummaryCount");
      const summaryWorth = document.getElementById("livewellSummaryWorth");
      const listEl = document.getElementById("livewellList");

      const totalWorth = player.livewell.reduce((sum, item) => sum + item.price, 0);
      summaryCount.textContent = `Рыб: ${player.livewell.length} шт.`;
      summaryWorth.textContent = `Ценность: ${totalWorth} C`;

      if (player.livewell.length === 0) {
        listEl.innerHTML = `<div style="text-align:center;padding:32px 16px;color:#64748b;font-size:13px;">Садок пуст. Забросьте удочку и поймайте трофей!</div>`;
        sellAllLivewellBtn.style.opacity = "0.5";
        sellAllLivewellBtn.style.pointerEvents = "none";
        sellAllLivewellBtn.textContent = "Продать всё";
      } else {
        sellAllLivewellBtn.style.opacity = "1";
        sellAllLivewellBtn.style.pointerEvents = "auto";
        sellAllLivewellBtn.textContent = `Продать всё (+${totalWorth} C)`;

        listEl.innerHTML = player.livewell.map((item, idx) => `
          <div class="livewell-item">
            <div class="livewell-item-meta">
              <div class="livewell-item-name">
                ${item.name}
                <span class="rarity-pill rarity-${item.rarity}" style="font-size:9px;padding:1px 6px;margin-left:6px;">${item.rarity}</span>
              </div>
              <div class="livewell-item-sub">Вес: ${item.weight} кг | Цена: ${item.price} C</div>
            </div>
            <button class="mini-sell-btn" onclick="sellLivewellFish(${idx})">Продать +${item.price} C</button>
          </div>
        `).join('');
      }
    }

    window.sellLivewellFish = function(index) {
      if (index < 0 || index >= player.livewell.length) return;
      const fish = player.livewell.splice(index, 1)[0];
      player.balance += fish.price;
      player.totalEarned += fish.price;
      player.fishSold++;

      triggerHaptic("light");
      sound.playSuccess();
      updatePlayerHUD();
      savePlayerLocal();
      syncUserStatsToSupabase();
      renderLivewell();
      showToast(`Продано: ${fish.name} (+${fish.price} C)`);
    };

    sellAllLivewellBtn.addEventListener("click", () => {
      if (player.livewell.length === 0) return;
      const count = player.livewell.length;
      const total = player.livewell.reduce((sum, f) => sum + f.price, 0);
      player.balance += total;
      player.totalEarned += total;
      player.fishSold += count;
      player.livewell = [];

      triggerHaptic("success");
      sound.playSuccess();
      updatePlayerHUD();
      savePlayerLocal();
      syncUserStatsToSupabase();
      renderLivewell();
      showToast(`Продано ${count} рыб на сумму +${total} C!`);
    });

    if (openLivewellBtn) {
      openLivewellBtn.addEventListener("click", () => {
        renderLivewell();
        livewellModal.classList.add("active");
        triggerHaptic("light");
      });
    }
    closeLivewellBtn.addEventListener("click", () => {
      livewellModal.classList.remove("active");
      triggerHaptic("light");
    });

    /* ==========================================================
       МОДАЛЬНОЕ ОКНО: ТОРГОВЕЦ (МАГАЗИН СНАСТЕЙ И СКУПКА)
       ========================================================== */
    const shopModal = document.getElementById("shopModal");
    const openShopBtn = document.getElementById("openShopBtn");
    const closeShopBtn = document.getElementById("closeShopBtn");
    let currentShopTab = "sell";

    function renderShopTab(tabKey) {
      currentShopTab = tabKey;
      document.querySelectorAll(".tab-bar .tab-btn").forEach(b => {
        b.classList.toggle("active", b.dataset.shoptab === tabKey);
      });

      const container = document.getElementById("shopTabContent");

      if (tabKey === "sell") {
        const totalWorth = player.livewell.reduce((sum, item) => sum + item.price, 0);
        if (player.livewell.length === 0) {
          container.innerHTML = `
            <div style="text-align:center;padding:30px 10px;color:#64748b;font-size:13px;">
              Торговец ждет улов! Ваш садок пуст.<br><br>
              Поймайте рыбу и выберите "В садок", чтобы принести её на рынок.
            </div>
          `;
        } else {
          container.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-size:12px;color:#94a3b8;">
              <span>Рыб в садке: ${player.livewell.length} шт.</span>
              <span style="color:#fef08a;font-weight:700;">Итого: ${totalWorth} C</span>
            </div>
            <button class="action-btn" onclick="sellAllThroughMerchant()" style="margin-bottom:12px;padding:10px;">Продать всё оптом (+${totalWorth} C)</button>
            <div style="display:flex;flex-direction:column;gap:8px;">
              ${player.livewell.map((item, idx) => `
                <div class="livewell-item">
                  <div class="livewell-item-meta">
                    <div class="livewell-item-name">${item.name} <span class="rarity-pill rarity-${item.rarity}" style="font-size:9px;padding:1px 6px;">${item.rarity}</span></div>
                    <div class="livewell-item-sub">Вес: ${item.weight} кг | Цена: ${item.price} C</div>
                  </div>
                  <button class="mini-sell-btn" onclick="sellLivewellFishFromShop(${idx})">Сдать +${item.price} C</button>
                </div>
              `).join('')}
            </div>
          `;
        }
      } else if (tabKey === "rods") {
        container.innerHTML = Object.values(RODS).map(rod => {
          const isEquipped = player.rodId === rod.id;
          const isOwned = player.ownedRods.includes(rod.id);
          const canAfford = player.balance >= rod.price;

          let btnHtml = '';
          if (isEquipped) {
            btnHtml = `<button class="buy-btn equipped">Надето</button>`;
          } else if (isOwned) {
            btnHtml = `<button class="buy-btn" onclick="equipRod('${rod.id}')">Надеть</button>`;
          } else {
            btnHtml = canAfford
              ? `<button class="buy-btn" onclick="buyRod('${rod.id}')">Купить ${rod.price} C</button>`
              : `<button class="buy-btn locked" title="Недостаточно монет">Купить ${rod.price} C</button>`;
          }

          return `
            <div class="shop-card">
              <div class="shop-card-head">
                <span class="shop-card-title">${rod.name}</span>
                <span class="shop-price">${rod.price === 0 ? "Базовая" : rod.price + " C"}</span>
              </div>
              <div class="shop-card-desc">${rod.desc}</div>
              <div class="shop-card-actions">
                <span style="font-size:11px;color:#38bdf8;">Зона: ${rod.safeZoneMin}%-${rod.safeZoneMax}%</span>
                ${btnHtml}
              </div>
            </div>
          `;
        }).join('');
      } else if (tabKey === "lines") {
        container.innerHTML = Object.values(LINES).map(line => {
          const isEquipped = player.lineId === line.id;
          const isOwned = player.ownedLines.includes(line.id);
          const canAfford = player.balance >= line.price;

          let btnHtml = '';
          if (isEquipped) {
            btnHtml = `<button class="buy-btn equipped">Надето</button>`;
          } else if (isOwned) {
            btnHtml = `<button class="buy-btn" onclick="equipLine('${line.id}')">Надеть</button>`;
          } else {
            btnHtml = canAfford
              ? `<button class="buy-btn" onclick="buyLine('${line.id}')">Купить ${line.price} C</button>`
              : `<button class="buy-btn locked" title="Недостаточно монет">Купить ${line.price} C</button>`;
          }

          return `
            <div class="shop-card">
              <div class="shop-card-head">
                <span class="shop-card-title">${line.name}</span>
                <span class="shop-price">${line.price === 0 ? "Базовая" : line.price + " C"}</span>
              </div>
              <div class="shop-card-desc">${line.desc}</div>
              <div class="shop-card-actions">
                <span style="font-size:11px;color:#38bdf8;">Запас: ${line.dangerBuffer} сек</span>
                ${btnHtml}
              </div>
            </div>
          `;
        }).join('');
      }
    }

    window.sellLivewellFishFromShop = function(idx) {
      sellLivewellFish(idx);
      renderShopTab("sell");
    };

    window.sellAllThroughMerchant = function() {
      if (player.livewell.length === 0) return;
      const count = player.livewell.length;
      const total = player.livewell.reduce((sum, f) => sum + f.price, 0);
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
      showToast(`Торговец выкупил ${count} рыб за +${total} C!`);
    };

    window.buyRod = function(rodId) {
      const rod = RODS[rodId];
      if (!rod || player.balance < rod.price) return;
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
      if (!line || player.balance < line.price) return;
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

    function renderHome() {
      document.getElementById("statFishCaught").textContent = player.fishCaught;
      document.getElementById("statFishSold").textContent = player.fishSold;
      document.getElementById("statTotalEarned").textContent = `${player.totalEarned} C`;
      const livewellCountEl = document.getElementById("homeLivewellCount");
      if (livewellCountEl) livewellCountEl.textContent = player.livewell.length;

      const bestTrophyEl = document.getElementById("statBestTrophy");
      if (player.bestCatch && player.bestCatch.name) {
        bestTrophyEl.textContent = `${player.bestCatch.name} (${player.bestCatch.weight} кг)`;
      } else {
        bestTrophyEl.textContent = "Пока нет";
      }

      document.getElementById("profileRodName").textContent = RODS[player.rodId] ? RODS[player.rodId].name : "Бамбуковая удочка";
      document.getElementById("profileLineName").textContent = LINES[player.lineId] ? LINES[player.lineId].name : "Монофил 0.2мм";

      // Отрисовка Атласа видов (FishDex)
      const grid = document.getElementById("profileFishdexGrid");
      grid.innerHTML = FISH_DATABASE.map(fish => {
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
              <span class="rarity-pill rarity-Common" style="font-size:8px;padding:1px 5px;opacity:0.5;">???</span>
              <div class="fishdex-name" style="margin-top:2px;">Не поймано</div>
              <div class="fishdex-weight">-</div>
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

      // Сохраняем состояние игры
      savePlayerLocal();
      syncUserStatsToSupabase();

      setTimeout(() => {
        if (sleepText) sleepText.textContent = "Наступило бодрое утро! Силы полностью восстановлены.";
        triggerHaptic("success");
      }, 1200);

      setTimeout(() => {
        sleepOverlay.classList.remove("active");
        showToast("Отличный сон! Вы полны сил для новых рекордов.");
      }, 2300);
    }

    if (homeGoSleepBtn) homeGoSleepBtn.addEventListener("click", sleepAtHome);

    closeShopBtn.addEventListener("click", () => {
      shopModal.classList.remove("active");
      triggerHaptic("light");
      if (isHomeScene) {
        renderHome();
        homeModal.classList.add("active");
      }
    });

    closeLivewellBtn.addEventListener("click", () => {
      livewellModal.classList.remove("active");
      triggerHaptic("light");
      if (isHomeScene) {
        renderHome();
        homeModal.classList.add("active");
      }
    });

    // Закрытие по клику на темный фон модальных окон
    [livewellModal, shopModal, homeModal].forEach(modal => {
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
