/* ==========================================================
   LUMIBOT FISHING - CASINO.JS
   Локация Казино «Золотой Крючок»
   Слоты, Колесо Фортуны, Минное поле (Mines) и интеграция с ботом
   ========================================================== */

(function () {
  'use strict';

  // Состояние казино
  let currentTab = "slots";
  let currentBet = 50;
  const AVAILABLE_BETS = [10, 25, 50, 100, 250, 500];

  // Ссылки на элементы UI
  let tabViewport = null;
  let balanceEl = null;

  /* ==========================================================
     КОНФИГУРАЦИЯ И СИМВОЛЫ СЛОТОВ
     ========================================================== */
  const SLOT_SYMBOLS = [
    { id: 'cherry', icon: '🍒', name: 'Вишни', mult3: 2, mult2: 1.2, weight: 35 },
    { id: 'fish', icon: '🐟', name: 'Рыбка', mult3: 3, mult2: 1.2, weight: 28 },
    { id: 'crayfish', icon: '🦞', name: 'Рак', mult3: 5, mult2: 1.5, weight: 20 },
    { id: 'lure', icon: '🎣', name: 'Блесна', mult3: 8, mult2: 1.5, weight: 15 },
    { id: 'coins', icon: '💰', name: 'Мешок монет', mult3: 15, mult2: 2.0, weight: 10 },
    { id: 'diamond', icon: '💎', name: 'Алмаз', mult3: 30, mult2: 3.0, weight: 6 },
    { id: 'seven', icon: '7️⃣', name: 'Семёрка', mult3: 60, mult2: 5.0, weight: 3 },
    { id: 'crown', icon: '👑', name: 'Золотой Осётр', mult3: 200, mult2: 10.0, weight: 1 }
  ];

  // Взвешенный рандомайзер символа
  function getRandomSlotSymbol() {
    const totalWeight = SLOT_SYMBOLS.reduce((sum, s) => sum + s.weight, 0);
    let rand = Math.random() * totalWeight;
    for (const sym of SLOT_SYMBOLS) {
      if (rand < sym.weight) return sym;
      rand -= sym.weight;
    }
    return SLOT_SYMBOLS[0];
  }

  let isSpinningSlots = false;
  let slotReels = [
    { el: null, current: SLOT_SYMBOLS[0] },
    { el: null, current: SLOT_SYMBOLS[1] },
    { el: null, current: SLOT_SYMBOLS[2] }
  ];

  /* ==========================================================
     КОНФИГУРАЦИЯ КОЛЕСА ФОРТУНЫ
     ========================================================== */
  const WHEEL_SECTORS = [
    { label: 'x0', mult: 0, color: '#1e293b', text: '#94a3b8' },
    { label: 'x1.5', mult: 1.5, color: '#0369a1', text: '#bae6fd' },
    { label: 'x0.5', mult: 0.5, color: '#334155', text: '#cbd5e1' },
    { label: 'x2', mult: 2.0, color: '#059669', text: '#a7f3d0' },
    { label: 'x0', mult: 0, color: '#1e293b', text: '#94a3b8' },
    { label: 'x3', mult: 3.0, color: '#d97706', text: '#fef08a' },
    { label: 'x1.2', mult: 1.2, color: '#0284c7', text: '#e0f2fe' },
    { label: 'x5', mult: 5.0, color: '#7c3aed', text: '#ede9fe' },
    { label: 'x0', mult: 0, color: '#1e293b', text: '#94a3b8' },
    { label: 'x2', mult: 2.0, color: '#059669', text: '#a7f3d0' },
    { label: 'x10', mult: 10.0, color: '#dc2626', text: '#fee2e2' },
    { label: '👑 x25', mult: 25.0, color: '#eab308', text: '#422006', isJackpot: true }
  ];

  let isSpinningWheel = false;
  let currentWheelAngle = 0;

  /* ==========================================================
     КОНФИГУРАЦИЯ МИННОГО ПОЛЯ (MINES 5x5)
     ========================================================== */
  const MINES_GRID_SIZE = 25; // 5x5
  let minesCount = 3;
  let minesGameActive = false;
  let minesField = []; // array of { isMine: bool, revealed: bool }
  let minesCurrentMultiplier = 1.0;
  let safeRevealedCount = 0;

  /* ==========================================================
     УПРАВЛЕНИЕ БАЛАНСОМ И ХЕЛПЕРЫ
     ========================================================== */
  function getBalance() {
    return (window.player && typeof window.player.balance === 'number') ? window.player.balance : 0;
  }

  function updateBalanceDisplay() {
    const bal = getBalance();
    if (balanceEl) balanceEl.textContent = bal;
    const hudBal = document.getElementById("playerBalance");
    if (hudBal) hudBal.textContent = bal;
  }

  function deductBet(amount) {
    if (getBalance() < amount) {
      if (window.showToast) window.showToast("Недостаточно монет для ставки!");
      if (window.triggerHaptic) window.triggerHaptic("error");
      return false;
    }
    window.player.balance -= amount;
    updateBalanceDisplay();
    if (window.savePlayerLocal) window.savePlayerLocal();
    if (window.syncUserStatsToSupabase) window.syncUserStatsToSupabase();
    return true;
  }

  function awardWin(amount, xp = 15) {
    if (amount <= 0) return;
    window.player.balance += amount;
    if (typeof window.player.xp === 'number') {
      window.player.xp += xp;
      // Проверка повышения уровня
      const nextLevelXp = Math.pow(window.player.level, 2) * 50;
      if (window.player.xp >= nextLevelXp) {
        window.player.level += 1;
        if (window.showToast) window.showToast(`Уровень повышен до ${window.player.level}!`);
      }
    }
    updateBalanceDisplay();
    if (window.updatePlayerHUD) window.updatePlayerHUD();
    if (window.savePlayerLocal) window.savePlayerLocal();
    if (window.syncUserStatsToSupabase) window.syncUserStatsToSupabase();
  }

  /* ==========================================================
     ИНИЦИАЛИЗАЦИЯ И РЕНДЕРИНГ ТАБОВ КАЗИНО
     ========================================================== */
  function cleanupActiveGames() {
    if (typeof crashAnimId !== 'undefined' && crashAnimId) {
      cancelAnimationFrame(crashAnimId);
      crashAnimId = null;
    }
    if (typeof bjDealerTimer !== 'undefined' && bjDealerTimer) {
      clearTimeout(bjDealerTimer);
      bjDealerTimer = null;
    }
    if (typeof diceIntervalId !== 'undefined' && diceIntervalId) {
      clearInterval(diceIntervalId);
      diceIntervalId = null;
    }
  }

  function initCasino() {
    tabViewport = document.getElementById("casinoTabContent");
    balanceEl = document.getElementById("casinoPlayerBalance");
    updateBalanceDisplay();

    // Привязка вкладок
    document.querySelectorAll(".casino-tab-btn").forEach(btn => {
      btn.onclick = () => {
        const tab = btn.dataset.casinotab;
        if (tab === currentTab) return;
        cleanupActiveGames();
        document.querySelectorAll(".casino-tab-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentTab = tab;
        renderActiveTab();
        if (window.triggerHaptic) window.triggerHaptic("light");
      };
    });

    renderActiveTab();
  }

  function renderActiveTab() {
    if (!tabViewport) return;

    cleanupActiveGames();

    if (currentTab === "slots") {
      renderSlotsTab();
    } else if (currentTab === "wheel") {
      renderWheelTab();
    } else if (currentTab === "mines") {
      renderMinesTab();
    } else if (currentTab === "blackjack") {
      renderBlackjackTab();
    } else if (currentTab === "crash") {
      renderCrashTab();
    } else if (currentTab === "dice") {
      renderDiceTab();
    } else if (currentTab === "bot") {
      renderBotTab();
    }
  }

  /* ==========================================================
     СЕЛЕКТОР СТАВОК (ОБЩИЙ ДЛЯ ВСЕХ ИГР)
     ========================================================== */
  function renderBetBar(onBetChange = null) {
    return `
      <div class="casino-bet-bar">
        <div class="bet-label">
          <span>Ставка:</span>
          <strong id="casinoBetDisplay">${currentBet} C</strong>
        </div>
        <div class="bet-buttons">
          ${AVAILABLE_BETS.map(b => `
            <button class="bet-chip-btn ${currentBet === b ? 'active' : ''}" data-bet="${b}">
              ${b}
            </button>
          `).join('')}
          <button class="bet-chip-btn max-bet" data-bet="max">MAX</button>
        </div>
      </div>
    `;
  }

  function bindBetBarEvents(onBetChange = null) {
    document.querySelectorAll(".bet-chip-btn").forEach(btn => {
      btn.onclick = () => {
        const val = btn.dataset.bet;
        if (val === 'max') {
          currentBet = Math.max(10, Math.min(5000, getBalance()));
        } else {
          currentBet = parseInt(val, 10);
        }
        document.querySelectorAll(".bet-chip-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const disp = document.getElementById("casinoBetDisplay");
        if (disp) disp.textContent = `${currentBet} C`;
        if (window.sound && window.sound.playChipBet) window.sound.playChipBet();
        if (window.triggerHaptic) window.triggerHaptic("light");
        if (onBetChange) onBetChange(currentBet);
      };
    });
  }

  /* ==========================================================
     ТАБ 1: СЛОТЫ «ТАЁЖНЫЙ ДЖЕКПОТ»
     ========================================================== */
  function renderSlotsTab() {
    tabViewport.innerHTML = `
      <div class="slots-container">
        <div class="slots-header">
          <div class="slots-title">Слоты «Таёжный Джекпот»</div>
          <div class="slots-desc">Собери 3 одинаковых символа или Золотого Осётра для Джекпота!</div>
        </div>

        <!-- Корпус слот-машины -->
        <div class="slot-machine">
          <div class="slot-reels-window">
            <div class="slot-payline-indicator"></div>
            <div class="slot-reel" id="slotReel0"><span class="reel-symbol">${slotReels[0].current.icon}</span></div>
            <div class="slot-reel" id="slotReel1"><span class="reel-symbol">${slotReels[1].current.icon}</span></div>
            <div class="slot-reel" id="slotReel2"><span class="reel-symbol">${slotReels[2].current.icon}</span></div>
          </div>
          <div class="slot-status-banner" id="slotStatusBanner">Испытай удачу!</div>
        </div>

        ${renderBetBar()}

        <div class="slots-actions">
          <button class="action-btn casino-spin-btn" id="slotSpinBtn">
            <span class="btn-text">КРУТИТЬ</span>
            <span class="btn-sub">Ставка: <span id="slotBtnBet">${currentBet}</span> C</span>
          </button>
        </div>

        <!-- Таблица выплат -->
        <div class="slots-paytable-wrapper">
          <div class="paytable-title">Коэффициенты выплат (x3 в ряд)</div>
          <div class="paytable-grid">
            ${SLOT_SYMBOLS.slice().reverse().map(s => `
              <div class="paytable-item ${s.id === 'crown' ? 'jackpot-item' : ''}">
                <span class="pt-icon">${s.icon}</span>
                <span class="pt-name">${s.name}</span>
                <span class="pt-mult">x${s.mult3}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    bindBetBarEvents((newBet) => {
      const btnBet = document.getElementById("slotBtnBet");
      if (btnBet) btnBet.textContent = newBet;
    });

    slotReels[0].el = document.getElementById("slotReel0");
    slotReels[1].el = document.getElementById("slotReel1");
    slotReels[2].el = document.getElementById("slotReel2");

    const spinBtn = document.getElementById("slotSpinBtn");
    if (spinBtn) {
      spinBtn.onclick = () => spinSlots();
    }
  }

  function spinSlots() {
    if (isSpinningSlots) return;

    if (!deductBet(currentBet)) return;

    isSpinningSlots = true;
    const spinBtn = document.getElementById("slotSpinBtn");
    const banner = document.getElementById("slotStatusBanner");
    if (spinBtn) spinBtn.disabled = true;
    if (banner) {
      banner.className = "slot-status-banner spinning";
      banner.textContent = "Барабаны вращаются...";
    }

    if (window.sound && window.sound.playSlotSpin) window.sound.playSlotSpin();
    if (window.triggerHaptic) window.triggerHaptic("medium");

    // Запускаем анимацию быстрого мелькания
    slotReels.forEach(r => {
      if (r.el) r.el.classList.add("blur-spinning");
    });

    const spinIntervals = slotReels.map((reel, idx) => {
      return setInterval(() => {
        const rand = getRandomSlotSymbol();
        reel.el.innerHTML = `<span class="reel-symbol">${rand.icon}</span>`;
      }, 70 + idx * 15);
    });

    // Определяем результат заранее
    const results = [getRandomSlotSymbol(), getRandomSlotSymbol(), getRandomSlotSymbol()];

    // Останавливаем барабаны поочередно
    const stopDelays = [700, 1150, 1600];

    stopDelays.forEach((delay, idx) => {
      setTimeout(() => {
        clearInterval(spinIntervals[idx]);
        const reel = slotReels[idx];
        reel.current = results[idx];
        if (reel.el) {
          reel.el.classList.remove("blur-spinning");
          reel.el.innerHTML = `<span class="reel-symbol pop-in">${reel.current.icon}</span>`;
        }
        if (window.sound && window.sound.playSlotReelStop) window.sound.playSlotReelStop();
        if (window.triggerHaptic) window.triggerHaptic("light");

        // Финал после остановки 3-го барабана
        if (idx === 2) {
          evaluateSlotResult(results);
          isSpinningSlots = false;
          if (spinBtn) spinBtn.disabled = false;
        }
      }, delay);
    });
  }

  function evaluateSlotResult(results) {
    const banner = document.getElementById("slotStatusBanner");
    const [s1, s2, s3] = results;

    // 1. Проверка на 3 одинаковых
    if (s1.id === s2.id && s2.id === s3.id) {
      const sym = s1;
      const payout = Math.round(currentBet * sym.mult3);
      const isJackpot = sym.id === 'crown';

      awardWin(payout, isJackpot ? 100 : 35);

      if (isJackpot) {
        if (banner) {
          banner.className = "slot-status-banner jackpot";
          banner.textContent = `👑 ДЖЕКПОТ! +${payout} C (x${sym.mult3})!`;
        }
        if (window.sound && window.sound.playJackpot) window.sound.playJackpot();
        if (window.triggerHaptic) window.triggerHaptic("heavy");
      } else {
        if (banner) {
          banner.className = "slot-status-banner win";
          banner.textContent = `ВЫИГРЫШ! +${payout} C (x${sym.mult3})!`;
        }
        if (window.sound && window.sound.playSlotWin) window.sound.playSlotWin();
        if (window.triggerHaptic) window.triggerHaptic("success");
      }
      return;
    }

    // 2. Проверка на 2 одинаковых
    let pairSym = null;
    if (s1.id === s2.id || s1.id === s3.id) pairSym = s1;
    else if (s2.id === s3.id) pairSym = s2;

    if (pairSym && pairSym.mult2) {
      const payout = Math.round(currentBet * pairSym.mult2);
      awardWin(payout, 15);
      if (banner) {
        banner.className = "slot-status-banner win-small";
        banner.textContent = `Пара ${pairSym.icon}! +${payout} C (x${pairSym.mult2})`;
      }
      if (window.sound && window.sound.playSlotWin) window.sound.playSlotWin();
      if (window.triggerHaptic) window.triggerHaptic("medium");
      return;
    }

    // Проигрыш
    if (banner) {
      banner.className = "slot-status-banner lose";
      banner.textContent = "Не повезло. Попробуйте еще раз!";
    }
  }

  /* ==========================================================
     ТАБ 2: КОЛЕСО ФОРТУНЫ
     ========================================================== */
  function renderWheelTab() {
    tabViewport.innerHTML = `
      <div class="wheel-tab-container">
        <div class="wheel-header">
          <div class="slots-title">Колесо Фортуны</div>
          <div class="slots-desc">Крутите колесо и умножайте ставку до x25!</div>
        </div>

        <div class="wheel-wrapper">
          <div class="wheel-pointer">▼</div>
          <canvas id="wheelCanvas" width="300" height="300"></canvas>
          <div class="wheel-center-pin">🪙</div>
        </div>

        <div class="slot-status-banner" id="wheelStatusBanner">Сделайте ставку и крутите колесо</div>

        ${renderBetBar()}

        <div class="slots-actions">
          <button class="action-btn casino-spin-btn" id="wheelSpinBtn">
            <span class="btn-text">КРУТИТЬ КОЛЕСО</span>
            <span class="btn-sub">Ставка: <span id="wheelBtnBet">${currentBet}</span> C</span>
          </button>
        </div>
      </div>
    `;

    bindBetBarEvents((newBet) => {
      const btnBet = document.getElementById("wheelBtnBet");
      if (btnBet) btnBet.textContent = newBet;
    });

    drawWheel(currentWheelAngle);

    const spinBtn = document.getElementById("wheelSpinBtn");
    if (spinBtn) {
      spinBtn.onclick = () => spinWheel();
    }
  }

  function drawWheel(angleOffset = 0) {
    const canvas = document.getElementById("wheelCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const radius = cx - 8;
    const numSectors = WHEEL_SECTORS.length;
    const arc = (Math.PI * 2) / numSectors;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angleOffset);

    // Отрисовка секторов
    WHEEL_SECTORS.forEach((sec, i) => {
      const startAngle = i * arc;
      const endAngle = startAngle + arc;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();

      ctx.fillStyle = sec.color;
      ctx.fill();

      // Золотой ободок сектора
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Текст сектора
      ctx.save();
      ctx.rotate(startAngle + arc / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = sec.text;
      ctx.font = sec.isJackpot ? 'bold 13px sans-serif' : 'bold 12px sans-serif';
      ctx.fillText(sec.label, radius - 16, 4);
      ctx.restore();
    });

    // Наружный декоративный золотой обод с заклепками
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 4;
    ctx.stroke();

    for (let j = 0; j < numSectors; j++) {
      const dotAngle = j * arc;
      const dx = Math.cos(dotAngle) * (radius - 2);
      const dy = Math.sin(dotAngle) * (radius - 2);
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(dx, dy, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function spinWheel() {
    if (isSpinningWheel) return;
    if (!deductBet(currentBet)) return;

    isSpinningWheel = true;
    const spinBtn = document.getElementById("wheelSpinBtn");
    const banner = document.getElementById("wheelStatusBanner");
    if (spinBtn) spinBtn.disabled = true;
    if (banner) {
      banner.className = "slot-status-banner spinning";
      banner.textContent = "Колесо крутится...";
    }

    // Случайный сектор назначения
    const numSectors = WHEEL_SECTORS.length;
    const sectorArc = (Math.PI * 2) / numSectors;
    const targetSectorIndex = Math.floor(Math.random() * numSectors);

    // Указатель находится вверху (на 12 часов, -PI/2)
    // Чтобы целевой сектор оказался под указателем:
    // angleOffset = (3 * Math.PI / 2) - (targetSectorIndex * sectorArc + sectorArc / 2)
    const targetAngleOnCircle = (3 * Math.PI / 2) - (targetSectorIndex * sectorArc + sectorArc / 2);
    const fullRotations = (4 + Math.floor(Math.random() * 3)) * (Math.PI * 2);
    const totalSpinDelta = fullRotations + ((targetAngleOnCircle - (currentWheelAngle % (Math.PI * 2)) + (Math.PI * 2)) % (Math.PI * 2));

    const startAngle = currentWheelAngle;
    const endAngle = startAngle + totalSpinDelta;
    const duration = 3200; // ms
    const startTime = performance.now();
    let lastTickIndex = -1;

    function animateWheel(now) {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Плавная кубическая функция замедления
      const easeOut = 1 - Math.pow(1 - progress, 3.2);

      currentWheelAngle = startAngle + (endAngle - startAngle) * easeOut;
      drawWheel(currentWheelAngle);

      // Звуковые щелчки при прохождении секторов
      const currentSector = Math.floor((currentWheelAngle / sectorArc) % numSectors);
      if (currentSector !== lastTickIndex) {
        lastTickIndex = currentSector;
        if (window.sound && window.sound.playWheelTick) window.sound.playWheelTick();
        if (window.triggerHaptic) window.triggerHaptic("light");
      }

      if (progress < 1) {
        requestAnimationFrame(animateWheel);
      } else {
        isSpinningWheel = false;
        if (spinBtn) spinBtn.disabled = false;
        evaluateWheelResult(targetSectorIndex);
      }
    }

    requestAnimationFrame(animateWheel);
  }

  function evaluateWheelResult(sectorIndex) {
    const sec = WHEEL_SECTORS[sectorIndex];
    const banner = document.getElementById("wheelStatusBanner");

    if (sec.mult > 0) {
      const payout = Math.round(currentBet * sec.mult);
      awardWin(payout, sec.isJackpot ? 100 : 25);

      if (sec.isJackpot) {
        if (banner) {
          banner.className = "slot-status-banner jackpot";
          banner.textContent = `👑 ДЖЕКПОТ КОЛЕСА! +${payout} C (${sec.label})!`;
        }
        if (window.sound && window.sound.playJackpot) window.sound.playJackpot();
        if (window.triggerHaptic) window.triggerHaptic("heavy");
      } else {
        if (banner) {
          banner.className = "slot-status-banner win";
          banner.textContent = `ВЫИГРЫШ! Сектор ${sec.label}: +${payout} C!`;
        }
        if (window.sound && window.sound.playSlotWin) window.sound.playSlotWin();
        if (window.triggerHaptic) window.triggerHaptic("success");
      }
    } else {
      if (banner) {
        banner.className = "slot-status-banner lose";
        banner.textContent = "Сектор x0! Ставка сгорела. Попробуйте еще раз!";
      }
      if (window.triggerHaptic) window.triggerHaptic("error");
    }
  }

  /* ==========================================================
     ТАБ 3: МИННОЕ ПОЛЕ (MINES 5x5)
     ========================================================== */
  function renderMinesTab() {
    tabViewport.innerHTML = `
      <div class="mines-tab-container">
        <div class="mines-header">
          <div class="slots-title">Минное поле (Mines)</div>
          <div class="slots-desc">Открывайте драгоценности 💎 и забирайте кэшаут до взрыва мины 💣!</div>
        </div>

        <!-- Верхняя информационная панель игры -->
        <div class="mines-info-card">
          <div class="mines-stat-box">
            <span class="ms-lbl">Множитель:</span>
            <span class="ms-val gold" id="minesMultiplier">x1.00</span>
          </div>
          <div class="mines-stat-box">
            <span class="ms-lbl">Возможный куш:</span>
            <span class="ms-val green" id="minesPotentialWin">${currentBet} C</span>
          </div>
          <div class="mines-stat-box">
            <span class="ms-lbl">Мин на поле:</span>
            <span class="ms-val" id="minesCountDisplay">${minesCount}</span>
          </div>
        </div>

        <!-- Игровая сетка 5х5 -->
        <div class="mines-grid" id="minesGrid">
          <!-- Генерируется ниже -->
        </div>

        <div class="mines-settings-row" id="minesSettingsRow">
          <div class="mines-count-selector">
            <span style="font-size:12px;color:#94a3b8;margin-right:6px;">Количество мин:</span>
            <div class="mine-btn-group">
              ${[1, 3, 5, 10].map(m => `
                <button class="mine-count-btn ${minesCount === m ? 'active' : ''}" data-mines="${m}">
                  ${m}
                </button>
              `).join('')}
            </div>
          </div>
        </div>

        ${renderBetBar()}

        <div class="slots-actions">
          <button class="action-btn casino-spin-btn" id="minesActionBtn">
            <span class="btn-text" id="minesActionText">НАЧАТЬ ИГРУ</span>
            <span class="btn-sub" id="minesActionSub">Ставка: ${currentBet} C</span>
          </button>
        </div>
      </div>
    `;

    bindBetBarEvents((newBet) => {
      if (!minesGameActive) {
        const sub = document.getElementById("minesActionSub");
        if (sub) sub.textContent = `Ставка: ${newBet} C`;
        const potWin = document.getElementById("minesPotentialWin");
        if (potWin) potWin.textContent = `${newBet} C`;
      }
    });

    // Привязка селектора количества мин
    document.querySelectorAll(".mine-count-btn").forEach(btn => {
      btn.onclick = () => {
        if (minesGameActive) return;
        minesCount = parseInt(btn.dataset.mines, 10);
        document.querySelectorAll(".mine-count-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const disp = document.getElementById("minesCountDisplay");
        if (disp) disp.textContent = minesCount;
        if (window.sound && window.sound.playChipBet) window.sound.playChipBet();
        if (window.triggerHaptic) window.triggerHaptic("light");
      };
    });

    initMinesGridVisual();

    const actionBtn = document.getElementById("minesActionBtn");
    if (actionBtn) {
      actionBtn.onclick = () => handleMinesAction();
    }
  }

  function initMinesGridVisual() {
    const grid = document.getElementById("minesGrid");
    if (!grid) return;
    grid.innerHTML = "";
    for (let i = 0; i < MINES_GRID_SIZE; i++) {
      const tile = document.createElement("button");
      tile.className = "mine-tile";
      tile.dataset.index = i;
      tile.innerHTML = `<span class="tile-inner">❓</span>`;
      tile.onclick = () => onMineTileClick(i);
      grid.appendChild(tile);
    }
  }

  function handleMinesAction() {
    if (!minesGameActive) {
      // Старт новой игры
      if (!deductBet(currentBet)) return;

      minesGameActive = true;
      safeRevealedCount = 0;
      minesCurrentMultiplier = 1.0;

      // Генерируем поле
      minesField = Array.from({ length: MINES_GRID_SIZE }, () => ({ isMine: false, revealed: false }));
      let placedMines = 0;
      while (placedMines < minesCount) {
        const idx = Math.floor(Math.random() * MINES_GRID_SIZE);
        if (!minesField[idx].isMine) {
          minesField[idx].isMine = true;
          placedMines++;
        }
      }

      initMinesGridVisual();

      // Блокируем смену настроек и ставок
      const settingsRow = document.getElementById("minesSettingsRow");
      if (settingsRow) settingsRow.style.opacity = "0.4";
      document.querySelectorAll(".bet-chip-btn").forEach(b => b.disabled = true);

      // Обновляем кнопку действия
      const btn = document.getElementById("minesActionBtn");
      const text = document.getElementById("minesActionText");
      const sub = document.getElementById("minesActionSub");
      if (btn) btn.classList.add("cashout-btn");
      if (text) text.textContent = "ЗАБРАТЬ ВЫИГРЫШ";
      if (sub) sub.textContent = `Кэшаут: ${currentBet} C`;

      if (window.sound && window.sound.playChipBet) window.sound.playChipBet();
      if (window.triggerHaptic) window.triggerHaptic("medium");
      if (window.showToast) window.showToast("Игра началась! Открывайте плитки без мин.");
    } else {
      // Кэшаут выигрыша игроком
      cashoutMines();
    }
  }

  function onMineTileClick(index) {
    if (!minesGameActive) {
      if (window.showToast) window.showToast("Нажмите «НАЧАТЬ ИГРУ», чтобы сделать ставку!");
      return;
    }

    const tile = minesField[index];
    if (tile.revealed) return;

    tile.revealed = true;
    const tileEl = document.querySelector(`.mine-tile[data-index="${index}"]`);

    if (tile.isMine) {
      // ВЗРЫВ МИНЫ!
      minesGameActive = false;
      if (tileEl) {
        tileEl.classList.add("mine-exploded");
        tileEl.innerHTML = `<span class="tile-inner">💥</span>`;
      }

      if (window.sound && window.sound.playMineExplosion) window.sound.playMineExplosion();
      if (window.triggerHaptic) window.triggerHaptic("heavy");
      if (window.showToast) window.showToast("БАБАХ! Вы наступили на мину. Ставка сгорела!");

      // Вскрываем оставшиеся мины
      revealAllMines();
      resetMinesControls();
    } else {
      // БЕЗОПАСНАЯ ПЛИТКА (АЛМАЗ)
      safeRevealedCount++;
      if (tileEl) {
        tileEl.classList.add("safe-gem");
        tileEl.innerHTML = `<span class="tile-inner">💎</span>`;
      }

      // Расчет нового множителя
      // Формула вероятности: P = (25 - revealed - mines) / (25 - revealed)
      const remainingTiles = MINES_GRID_SIZE - (safeRevealedCount - 1);
      const safeRemaining = remainingTiles - minesCount;
      const stepMultiplier = (remainingTiles / safeRemaining) * 0.985;
      minesCurrentMultiplier = Number((minesCurrentMultiplier * stepMultiplier).toFixed(2));

      const potWin = Math.round(currentBet * minesCurrentMultiplier);

      const multEl = document.getElementById("minesMultiplier");
      const potEl = document.getElementById("minesPotentialWin");
      const sub = document.getElementById("minesActionSub");

      if (multEl) multEl.textContent = `x${minesCurrentMultiplier.toFixed(2)}`;
      if (potEl) potEl.textContent = `${potWin} C`;
      if (sub) sub.textContent = `Кэшаут: +${potWin} C`;

      if (window.sound && window.sound.playMineReveal) window.sound.playMineReveal();
      if (window.triggerHaptic) window.triggerHaptic("medium");

      // Победа при открытии всех безопасных плиток
      if (safeRevealedCount === MINES_GRID_SIZE - minesCount) {
        cashoutMines();
      }
    }
  }

  function cashoutMines() {
    if (!minesGameActive) return;
    minesGameActive = false;

    const winAmount = Math.round(currentBet * minesCurrentMultiplier);
    awardWin(winAmount, 20 + safeRevealedCount * 5);

    if (window.sound && window.sound.playSlotWin) window.sound.playSlotWin();
    if (window.triggerHaptic) window.triggerHaptic("success");
    if (window.showToast) window.showToast(`Кэшаут успешен! Забрано +${winAmount} C!`);

    revealAllMines();
    resetMinesControls();
  }

  function revealAllMines() {
    minesField.forEach((tile, idx) => {
      const tileEl = document.querySelector(`.mine-tile[data-index="${idx}"]`);
      if (tileEl) {
        tileEl.disabled = true;
        if (tile.isMine && !tileEl.classList.contains("mine-exploded")) {
          tileEl.classList.add("revealed-mine");
          tileEl.innerHTML = `<span class="tile-inner">💣</span>`;
        } else if (!tile.isMine && !tile.revealed) {
          tileEl.style.opacity = "0.5";
          tileEl.innerHTML = `<span class="tile-inner" style="font-size:12px;">💎</span>`;
        }
      }
    });
  }

  function resetMinesControls() {
    const settingsRow = document.getElementById("minesSettingsRow");
    if (settingsRow) settingsRow.style.opacity = "1";
    document.querySelectorAll(".bet-chip-btn").forEach(b => b.disabled = false);

    const btn = document.getElementById("minesActionBtn");
    const text = document.getElementById("minesActionText");
    const sub = document.getElementById("minesActionSub");

    if (btn) btn.classList.remove("cashout-btn");
    if (text) text.textContent = "НАЧАТЬ ИГРУ";
    if (sub) sub.textContent = `Ставка: ${currentBet} C`;
  }

  /* ==========================================================
     ТАБ 4: БЛЭКДЖЕК (21 ОЧКО)
     ========================================================== */
  const BJ_SUITS = [
    { symbol: '♠', color: 'black' },
    { symbol: '♣', color: 'black' },
    { symbol: '♥', color: 'red' },
    { symbol: '♦', color: 'red' }
  ];
  const BJ_RANKS = [
    { rank: '2', val: 2 }, { rank: '3', val: 3 }, { rank: '4', val: 4 },
    { rank: '5', val: 5 }, { rank: '6', val: 6 }, { rank: '7', val: 7 },
    { rank: '8', val: 8 }, { rank: '9', val: 9 }, { rank: '10', val: 10 },
    { rank: 'J', val: 10 }, { rank: 'Q', val: 10 }, { rank: 'K', val: 10 },
    { rank: 'A', val: 11 }
  ];

  let bjDeck = [];
  let bjPlayerHand = [];
  let bjDealerHand = [];
  let bjState = 'idle'; // 'idle', 'playing', 'dealer_turn', 'ended'
  let bjCurrentBet = 50;
  let bjDealerHidden = true;
  let bjDealerTimer = null;

  function createBlackjackDeck() {
    const deck = [];
    for (const s of BJ_SUITS) {
      for (const r of BJ_RANKS) {
        deck.push({ rank: r.rank, val: r.val, suit: s.symbol, isRed: s.color === 'red' });
      }
    }
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }

  function getCardFromDeck() {
    if (!bjDeck || bjDeck.length < 6) {
      bjDeck = createBlackjackDeck();
    }
    return bjDeck.pop();
  }

  function calculateHandScore(hand, hideSecond = false) {
    if (!hand || hand.length === 0) return { total: 0, isSoft: false, isBlackjack: false };
    if (hideSecond && hand.length >= 2) {
      const first = hand[0];
      return { total: first.val, isSoft: first.rank === 'A', isBlackjack: false };
    }
    let total = 0;
    let aces = 0;
    for (const c of hand) {
      total += c.val;
      if (c.rank === 'A') aces++;
    }
    while (total > 21 && aces > 0) {
      total -= 10;
      aces--;
    }
    const isBlackjack = (hand.length === 2 && total === 21);
    return { total, isSoft: aces > 0, isBlackjack };
  }

  function renderCardMarkup(card, hidden = false) {
    if (hidden) {
      return `
        <div class="bj-card card-back">
          <div class="card-back-pattern">
            <span class="cb-icon">🎣</span>
          </div>
        </div>
      `;
    }
    return `
      <div class="bj-card ${card.isRed ? 'card-red' : 'card-black'}">
        <div class="card-corner top-left">
          <span class="card-val">${card.rank}</span>
          <span class="card-suit-sm">${card.suit}</span>
        </div>
        <div class="card-center-suit">${card.suit}</div>
        <div class="card-corner bottom-right">
          <span class="card-val">${card.rank}</span>
          <span class="card-suit-sm">${card.suit}</span>
        </div>
      </div>
    `;
  }

  function updateBlackjackUI(statusMsg = null, statusClass = "") {
    const dealerCardsEl = document.getElementById("bjDealerCards");
    const playerCardsEl = document.getElementById("bjPlayerCards");
    const dealerScoreEl = document.getElementById("bjDealerScore");
    const playerScoreEl = document.getElementById("bjPlayerScore");
    const statusBannerEl = document.getElementById("bjStatusBanner");
    const actionsEl = document.getElementById("bjActionsContainer");

    if (dealerCardsEl) {
      dealerCardsEl.innerHTML = bjDealerHand.map((c, i) =>
        renderCardMarkup(c, bjDealerHidden && i === 1)
      ).join('');
    }
    if (playerCardsEl) {
      playerCardsEl.innerHTML = bjPlayerHand.map(c => renderCardMarkup(c, false)).join('');
    }

    const dScore = calculateHandScore(bjDealerHand, bjDealerHidden);
    const pScore = calculateHandScore(bjPlayerHand, false);

    if (dealerScoreEl) {
      dealerScoreEl.textContent = bjDealerHand.length === 0 ? "0" : (bjDealerHidden && bjDealerHand.length >= 2 ? `${dScore.total} + ?` : `${dScore.total}`);
    }
    if (playerScoreEl) {
      playerScoreEl.textContent = bjPlayerHand.length === 0 ? "0" : `${pScore.total}`;
    }

    if (statusBannerEl && statusMsg !== null) {
      statusBannerEl.textContent = statusMsg;
      statusBannerEl.className = "bj-status-banner " + statusClass;
    }

    if (actionsEl) {
      if (bjState === 'idle' || bjState === 'ended') {
        actionsEl.innerHTML = `
          <button class="action-btn casino-spin-btn" id="bjDealBtn">
            <span class="btn-text">РАЗДАТЬ КАРТЫ</span>
            <span class="btn-sub">Ставка: ${currentBet} C</span>
          </button>
        `;
        const dealBtn = document.getElementById("bjDealBtn");
        if (dealBtn) dealBtn.onclick = startBlackjackRound;
      } else if (bjState === 'playing') {
        const canDouble = (bjPlayerHand.length === 2 && getBalance() >= bjCurrentBet);
        actionsEl.innerHTML = `
          <div class="bj-play-actions">
            <button class="bj-action-btn hit-btn" id="bjHitBtn">
              <span class="btn-icon">➕</span>
              <span>ВЗЯТЬ</span>
            </button>
            <button class="bj-action-btn stand-btn" id="bjStandBtn">
              <span class="btn-icon">✋</span>
              <span>ХВАТИТ</span>
            </button>
            <button class="bj-action-btn double-btn" id="bjDoubleBtn" ${canDouble ? '' : 'disabled'}>
              <span class="btn-icon">⚡</span>
              <span>x2 ДАБЛ</span>
            </button>
          </div>
        `;
        const hitBtn = document.getElementById("bjHitBtn");
        const standBtn = document.getElementById("bjStandBtn");
        const doubleBtn = document.getElementById("bjDoubleBtn");

        if (hitBtn) hitBtn.onclick = blackjackHit;
        if (standBtn) standBtn.onclick = blackjackStand;
        if (doubleBtn && canDouble) doubleBtn.onclick = blackjackDouble;
      } else if (bjState === 'dealer_turn') {
        actionsEl.innerHTML = `
          <div class="bj-play-actions">
            <button class="bj-action-btn stand-btn" disabled style="width:100%;opacity:0.8;">
              <span>Ход дилера...</span>
            </button>
          </div>
        `;
      }
    }
  }

  function renderBlackjackTab() {
    tabViewport.innerHTML = `
      <div class="blackjack-container">
        <div class="slots-header">
          <div class="slots-title">Блэкджек (21 Очко)</div>
          <div class="slots-desc">Обыграй дилера: набери очков ближе к 21 без перебора!</div>
        </div>

        <div class="bj-table">
          <div class="bj-hand-section bj-dealer-area">
            <div class="bj-hand-label">
              <span>ДИЛЕР</span>
              <span class="bj-score-badge" id="bjDealerScore">0</span>
            </div>
            <div class="bj-cards-row" id="bjDealerCards">
              <div class="card-placeholder-text">Карты дилера</div>
            </div>
          </div>

          <div class="bj-status-banner" id="bjStatusBanner">Сделайте ставку и нажмите «Раздать»</div>

          <div class="bj-hand-section bj-player-area">
            <div class="bj-cards-row" id="bjPlayerCards">
              <div class="card-placeholder-text">Ваши карты</div>
            </div>
            <div class="bj-hand-label">
              <span>ВЫ</span>
              <span class="bj-score-badge" id="bjPlayerScore">0</span>
            </div>
          </div>
        </div>

        ${renderBetBar(bet => {
          bjCurrentBet = bet;
          const sub = document.querySelector("#bjDealBtn .btn-sub");
          if (sub) sub.textContent = `Ставка: ${bet} C`;
        })}

        <div class="bj-actions" id="bjActionsContainer">
          <button class="action-btn casino-spin-btn" id="bjDealBtn">
            <span class="btn-text">РАЗДАТЬ КАРТЫ</span>
            <span class="btn-sub">Ставка: ${currentBet} C</span>
          </button>
        </div>
      </div>
    `;

    bindBetBarEvents(bet => {
      bjCurrentBet = bet;
      const sub = document.querySelector("#bjDealBtn .btn-sub");
      if (sub) sub.textContent = `Ставка: ${bet} C`;
    });

    const dealBtn = document.getElementById("bjDealBtn");
    if (dealBtn) dealBtn.onclick = startBlackjackRound;

    if (bjPlayerHand.length > 0 || bjDealerHand.length > 0) {
      updateBlackjackUI();
    }
  }

  function startBlackjackRound() {
    if (bjState === 'playing' || bjState === 'dealer_turn') return;
    if (!deductBet(currentBet)) return;

    bjCurrentBet = currentBet;
    bjDeck = createBlackjackDeck();
    bjPlayerHand = [getCardFromDeck(), getCardFromDeck()];
    bjDealerHand = [getCardFromDeck(), getCardFromDeck()];
    bjDealerHidden = true;
    bjState = 'playing';

    if (window.sound && window.sound.playCardDeal) window.sound.playCardDeal();
    if (window.triggerHaptic) window.triggerHaptic("medium");

    document.querySelectorAll(".bet-chip-btn").forEach(b => b.disabled = true);

    const pScore = calculateHandScore(bjPlayerHand, false);
    const dScore = calculateHandScore(bjDealerHand, false);

    if (pScore.isBlackjack) {
      bjDealerHidden = false;
      if (dScore.isBlackjack) {
        bjState = 'ended';
        awardWin(bjCurrentBet, 10);
        updateBlackjackUI("Ничья! У обоих Блэкджек (21). Ставка возвращена.", "status-push");
        if (window.sound && window.sound.playCardFlip) window.sound.playCardFlip();
      } else {
        bjState = 'ended';
        const win = Math.floor(bjCurrentBet * 2.5);
        awardWin(win, 30);
        updateBlackjackUI(`🌟 БЛЭКДЖЕК! Натуральные 21 очко! +${win} C`, "status-win");
        if (window.sound && window.sound.playJackpot) window.sound.playJackpot();
        if (window.triggerHaptic) window.triggerHaptic("success");
      }
      document.querySelectorAll(".bet-chip-btn").forEach(b => b.disabled = false);
      return;
    }

    updateBlackjackUI("Ваш ход! Возьмите карту, остановитесь или удвойте.");
  }

  function blackjackHit() {
    if (bjState !== 'playing') return;
    bjPlayerHand.push(getCardFromDeck());
    if (window.sound && window.sound.playCardDeal) window.sound.playCardDeal();
    if (window.triggerHaptic) window.triggerHaptic("light");

    const pScore = calculateHandScore(bjPlayerHand, false);
    if (pScore.total > 21) {
      bjDealerHidden = false;
      bjState = 'ended';
      updateBlackjackUI(`💥 ПЕРЕБОР (${pScore.total})! Вы проиграли ставку.`, "status-lose");
      if (window.sound && window.sound.playFail) window.sound.playFail();
      if (window.triggerHaptic) window.triggerHaptic("error");
      document.querySelectorAll(".bet-chip-btn").forEach(b => b.disabled = false);
    } else if (pScore.total === 21) {
      blackjackStand();
    } else {
      updateBlackjackUI(`У вас ${pScore.total}. Еще карту?`);
    }
  }

  function blackjackDouble() {
    if (bjState !== 'playing' || bjPlayerHand.length !== 2) return;
    if (getBalance() < bjCurrentBet) {
      if (window.showToast) window.showToast("Недостаточно монет для удвоения!");
      return;
    }
    if (!deductBet(bjCurrentBet)) return;
    bjCurrentBet *= 2;

    bjPlayerHand.push(getCardFromDeck());
    if (window.sound && window.sound.playCardDeal) window.sound.playCardDeal();
    if (window.triggerHaptic) window.triggerHaptic("medium");

    const pScore = calculateHandScore(bjPlayerHand, false);
    if (pScore.total > 21) {
      bjDealerHidden = false;
      bjState = 'ended';
      updateBlackjackUI(`💥 ПЕРЕБОР (${pScore.total})! Удвоенная ставка сгорела.`, "status-lose");
      if (window.sound && window.sound.playFail) window.sound.playFail();
      if (window.triggerHaptic) window.triggerHaptic("error");
      document.querySelectorAll(".bet-chip-btn").forEach(b => b.disabled = false);
    } else {
      blackjackStand();
    }
  }

  function blackjackStand() {
    if (bjState !== 'playing') return;
    bjState = 'dealer_turn';
    bjDealerHidden = false;
    if (window.sound && window.sound.playCardFlip) window.sound.playCardFlip();
    updateBlackjackUI("Дилер открывает карты...");

    runDealerTurn();
  }

  function runDealerTurn() {
    const dScore = calculateHandScore(bjDealerHand, false);
    const pScore = calculateHandScore(bjPlayerHand, false);

    if (dScore.total < 17) {
      bjDealerTimer = setTimeout(() => {
        bjDealerHand.push(getCardFromDeck());
        if (window.sound && window.sound.playCardDeal) window.sound.playCardDeal();
        updateBlackjackUI("Дилер добирает карту...");
        runDealerTurn();
      }, 550);
    } else {
      bjState = 'ended';
      document.querySelectorAll(".bet-chip-btn").forEach(b => b.disabled = false);

      if (dScore.total > 21) {
        const win = bjCurrentBet * 2;
        awardWin(win, 20);
        updateBlackjackUI(`🎉 ДИЛЕР ПЕРЕБРАЛ (${dScore.total})! ВЫ ПОБЕДИЛИ! +${win} C`, "status-win");
        if (window.sound && window.sound.playSuccess) window.sound.playSuccess();
        if (window.triggerHaptic) window.triggerHaptic("success");
      } else if (pScore.total > dScore.total) {
        const win = bjCurrentBet * 2;
        awardWin(win, 20);
        updateBlackjackUI(`🏆 ПОБЕДА! ${pScore.total} против ${dScore.total}. Выигрыш: +${win} C`, "status-win");
        if (window.sound && window.sound.playSuccess) window.sound.playSuccess();
        if (window.triggerHaptic) window.triggerHaptic("success");
      } else if (dScore.total > pScore.total) {
        updateBlackjackUI(`Дилер победил: ${dScore.total} против ${pScore.total}.`, "status-lose");
        if (window.sound && window.sound.playFail) window.sound.playFail();
        if (window.triggerHaptic) window.triggerHaptic("light");
      } else {
        awardWin(bjCurrentBet, 10);
        updateBlackjackUI(`Ничья (${pScore.total} = ${dScore.total})! Ставка возвращена.`, "status-push");
        if (window.sound && window.sound.playSuccess) window.sound.playSuccess();
      }
    }
  }

  /* ==========================================================
     ТАБ 5: КРАШ («ТАЁЖНАЯ РАКЕТА» / LUCKY ROCKET)
     ========================================================== */
  let crashState = 'idle'; // 'idle', 'flying', 'cashed_out', 'crashed'
  let crashMultiplier = 1.00;
  let crashTarget = 1.00;
  let crashStartTime = 0;
  let crashAnimId = null;
  let crashHistory = [1.85, 2.40, 1.15, 3.80, 1.45];
  let crashCurrentBet = 50;
  let crashCashedMult = 1.00;
  let crashParticles = [];
  let crashStars = [];
  let crashCanvas = null;
  let crashCtx = null;

  function initCrashStars(w, h) {
    crashStars = [];
    for (let i = 0; i < 30; i++) {
      crashStars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        speed: 0.5 + Math.random() * 1.5,
        size: 0.8 + Math.random() * 1.5,
        alpha: 0.3 + Math.random() * 0.7
      });
    }
  }

  function renderCrashTab() {
    tabViewport.innerHTML = `
      <div class="crash-container">
        <div class="slots-header">
          <div class="slots-title">Краш «Таёжная Ракета»</div>
          <div class="slots-desc">Следи за взлётом ракеты и забери выигрыш до крушения!</div>
        </div>

        <!-- История прошлых раундов -->
        <div class="crash-history-row" id="crashHistoryRow">
          ${renderCrashHistoryHtml()}
        </div>

        <!-- Canvas экран полета -->
        <div class="crash-canvas-wrapper" id="crashCanvasWrapper">
          <canvas class="crash-canvas" id="crashCanvas" width="340" height="190"></canvas>
          <div class="crash-hud-overlay">
            <div class="crash-mult-counter" id="crashMultCounter">1.00x</div>
            <div class="crash-status-sub" id="crashStatusSub">Ожидание старта</div>
          </div>
        </div>

        ${renderBetBar(bet => {
          crashCurrentBet = bet;
          const sub = document.querySelector("#crashActionBtn .btn-sub");
          if (sub) sub.textContent = `Ставка: ${bet} C`;
        })}

        <div class="crash-actions" id="crashActionsContainer">
          <button class="action-btn casino-spin-btn" id="crashActionBtn">
            <span class="btn-text">ЗАПУСК РАКЕТЫ</span>
            <span class="btn-sub">Ставка: ${currentBet} C</span>
          </button>
        </div>
      </div>
    `;

    bindBetBarEvents(bet => {
      crashCurrentBet = bet;
      const sub = document.querySelector("#crashActionBtn .btn-sub");
      if (sub) sub.textContent = `Ставка: ${bet} C`;
    });

    crashCanvas = document.getElementById("crashCanvas");
    if (crashCanvas) {
      crashCtx = crashCanvas.getContext("2d");
      initCrashStars(crashCanvas.width, crashCanvas.height);
      drawCrashStaticScene();
    }

    const launchBtn = document.getElementById("crashActionBtn");
    if (launchBtn) launchBtn.onclick = startCrashRound;
  }

  function renderCrashHistoryHtml() {
    return crashHistory.map(m => {
      let cls = 'low';
      if (m >= 10.0) cls = 'jackpot';
      else if (m >= 4.0) cls = 'high';
      else if (m >= 2.0) cls = 'mid';
      return `<span class="crash-hist-pill ${cls}">x${m.toFixed(2)}</span>`;
    }).join('');
  }

  function drawCrashStaticScene() {
    if (!crashCtx || !crashCanvas) return;
    const w = crashCanvas.width;
    const h = crashCanvas.height;

    crashCtx.clearRect(0, 0, w, h);

    // Звездное небо
    crashCtx.fillStyle = "#070c18";
    crashCtx.fillRect(0, 0, w, h);

    // Сетка
    crashCtx.strokeStyle = "rgba(56, 189, 248, 0.08)";
    crashCtx.lineWidth = 1;
    for (let x = 40; x < w; x += 50) {
      crashCtx.beginPath();
      crashCtx.moveTo(x, 0);
      crashCtx.lineTo(x, h);
      crashCtx.stroke();
    }
    for (let y = 30; y < h; y += 40) {
      crashCtx.beginPath();
      crashCtx.moveTo(0, y);
      crashCtx.lineTo(w, y);
      crashCtx.stroke();
    }

    // Звезды
    for (const s of crashStars) {
      crashCtx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
      crashCtx.beginPath();
      crashCtx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      crashCtx.fill();
    }

    // Стартовая позиция ракеты
    drawRocketSprite(crashCtx, 30, h - 30, -Math.PI / 4, 1.0);
  }

  function drawRocketSprite(ctx, x, y, angle, scale = 1.0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(scale, scale);

    // Пламя реактивного двигателя
    ctx.beginPath();
    ctx.moveTo(-16, -4);
    ctx.lineTo(-28 - Math.random() * 8, 0);
    ctx.lineTo(-16, 4);
    ctx.closePath();
    ctx.fillStyle = Math.random() > 0.5 ? "#f97316" : "#facc15";
    ctx.fill();

    // Корпус ракеты (обтекаемый белый с золотым носом)
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.quadraticCurveTo(8, -8, -12, -7);
    ctx.lineTo(-14, 7);
    ctx.quadraticCurveTo(8, 8, 18, 0);
    ctx.closePath();
    ctx.fillStyle = "#f8fafc";
    ctx.fill();
    ctx.strokeStyle = "#0284c7";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Носовой обтекатель
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.quadraticCurveTo(12, -5, 6, -5);
    ctx.lineTo(6, 5);
    ctx.quadraticCurveTo(12, 5, 18, 0);
    ctx.closePath();
    ctx.fillStyle = "#0284c7";
    ctx.fill();

    // Крылья / стабилизаторы
    ctx.beginPath();
    ctx.moveTo(-8, -7);
    ctx.lineTo(-16, -14);
    ctx.lineTo(-12, -4);
    ctx.closePath();
    ctx.fillStyle = "#dc2626";
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-8, 7);
    ctx.lineTo(-16, 14);
    ctx.lineTo(-12, 4);
    ctx.closePath();
    ctx.fillStyle = "#dc2626";
    ctx.fill();

    // Иллюминатор
    ctx.beginPath();
    ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = "#38bdf8";
    ctx.fill();
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  }

  function startCrashRound() {
    if (crashState === 'flying') return;
    if (!deductBet(currentBet)) return;

    crashCurrentBet = currentBet;
    crashState = 'flying';
    crashMultiplier = 1.00;
    crashStartTime = Date.now();
    crashParticles = [];

    // Генерация точки крушения
    const r = Math.random();
    if (r < 0.04) {
      crashTarget = 1.00 + Math.random() * 0.05;
    } else {
      const raw = 0.965 / (1.0 - r);
      crashTarget = Math.max(1.06, Math.min(100.0, raw));
    }

    if (window.sound && window.sound.playRocketLaunch) window.sound.playRocketLaunch();
    if (window.triggerHaptic) window.triggerHaptic("medium");

    document.querySelectorAll(".bet-chip-btn").forEach(b => b.disabled = true);

    const actionContainer = document.getElementById("crashActionsContainer");
    if (actionContainer) {
      actionContainer.innerHTML = `
        <button class="action-btn casino-spin-btn cashout-btn" id="crashCashoutBtn">
          <span class="btn-text">ЗАБРАТЬ</span>
          <span class="btn-sub" id="crashCashoutSub">+${crashCurrentBet} C</span>
        </button>
      `;
      const cashoutBtn = document.getElementById("crashCashoutBtn");
      if (cashoutBtn) cashoutBtn.onclick = cashoutCrash;
    }

    const counter = document.getElementById("crashMultCounter");
    const sub = document.getElementById("crashStatusSub");
    if (counter) {
      counter.className = "crash-mult-counter";
      counter.textContent = "1.00x";
    }
    if (sub) sub.textContent = "Ракета набирает высоту!";

    runCrashLoop();
  }

  function runCrashLoop() {
    if (crashState !== 'flying' && crashState !== 'cashed_out') return;

    const elapsed = (Date.now() - crashStartTime) / 1000;
    crashMultiplier = 1.00 + 0.09 * Math.pow(elapsed, 1.45) + 0.04 * elapsed;

    const counter = document.getElementById("crashMultCounter");
    const cashoutSub = document.getElementById("crashCashoutSub");

    if (counter) {
      counter.textContent = `${crashMultiplier.toFixed(2)}x`;
      if (crashMultiplier >= 10.0) counter.style.color = "#e879f9";
      else if (crashMultiplier >= 4.0) counter.style.color = "#facc15";
      else if (crashMultiplier >= 2.0) counter.style.color = "#4ade80";
      else counter.style.color = "#38bdf8";
    }

    if (crashState === 'flying' && cashoutSub) {
      const potWin = Math.floor(crashCurrentBet * crashMultiplier);
      cashoutSub.textContent = `Кэшаут: +${potWin} C`;
    }

    drawCrashFrame();

    if (crashMultiplier >= crashTarget) {
      crashExplode();
      return;
    }

    crashAnimId = requestAnimationFrame(runCrashLoop);
  }

  function drawCrashFrame() {
    if (!crashCtx || !crashCanvas) return;
    const w = crashCanvas.width;
    const h = crashCanvas.height;

    crashCtx.clearRect(0, 0, w, h);

    // Небо
    crashCtx.fillStyle = "#070c18";
    crashCtx.fillRect(0, 0, w, h);

    // Сетка
    crashCtx.strokeStyle = "rgba(56, 189, 248, 0.08)";
    crashCtx.lineWidth = 1;
    for (let x = 40; x < w; x += 50) {
      crashCtx.beginPath();
      crashCtx.moveTo(x, 0);
      crashCtx.lineTo(x, h);
      crashCtx.stroke();
    }
    for (let y = 30; y < h; y += 40) {
      crashCtx.beginPath();
      crashCtx.moveTo(0, y);
      crashCtx.lineTo(w, y);
      crashCtx.stroke();
    }

    // Движение звезд
    for (const s of crashStars) {
      s.x -= s.speed * (1.0 + crashMultiplier * 0.2);
      s.y += s.speed * 0.4;
      if (s.x < 0) s.x = w;
      if (s.y > h) s.y = 0;

      crashCtx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
      crashCtx.beginPath();
      crashCtx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      crashCtx.fill();
    }

    // Вычисление траектории
    const startX = 25;
    const startY = h - 25;
    const progress = Math.min(1.0, (crashMultiplier - 1.0) / Math.max(3.0, crashTarget * 0.95));

    const currX = startX + (w - 60) * progress;
    const currY = startY - (h - 60) * Math.pow(progress, 0.85);

    // Заполнение под траекторией
    const grad = crashCtx.createLinearGradient(0, currY, 0, startY);
    grad.addColorStop(0, "rgba(56, 189, 248, 0.25)");
    grad.addColorStop(1, "rgba(56, 189, 248, 0.0)");

    crashCtx.beginPath();
    crashCtx.moveTo(startX, startY);
    crashCtx.quadraticCurveTo(startX + (currX - startX) * 0.5, startY, currX, currY);
    crashCtx.lineTo(currX, startY);
    crashCtx.closePath();
    crashCtx.fillStyle = grad;
    crashCtx.fill();

    // Линия траектории
    crashCtx.beginPath();
    crashCtx.moveTo(startX, startY);
    crashCtx.quadraticCurveTo(startX + (currX - startX) * 0.5, startY, currX, currY);
    crashCtx.strokeStyle = "#38bdf8";
    crashCtx.lineWidth = 3.5;
    crashCtx.stroke();

    // Частицы шлейфа
    if (Math.random() > 0.2) {
      crashParticles.push({
        x: currX - 8,
        y: currY + 4,
        vx: -1.5 - Math.random() * 2,
        vy: 1.0 + Math.random() * 1.5,
        life: 1.0,
        color: Math.random() > 0.5 ? '#f97316' : '#facc15'
      });
    }

    for (let i = crashParticles.length - 1; i >= 0; i--) {
      const p = crashParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.05;
      if (p.life <= 0) {
        crashParticles.splice(i, 1);
        continue;
      }
      crashCtx.fillStyle = p.color;
      crashCtx.globalAlpha = p.life;
      crashCtx.beginPath();
      crashCtx.arc(p.x, p.y, 2.5 * p.life, 0, Math.PI * 2);
      crashCtx.fill();
      crashCtx.globalAlpha = 1.0;
    }

    // Ракета
    const angle = -0.65;
    drawRocketSprite(crashCtx, currX, currY, angle, 1.05);
  }

  function cashoutCrash() {
    if (crashState !== 'flying') return;
    crashState = 'cashed_out';
    crashCashedMult = crashMultiplier;

    const winAmount = Math.floor(crashCurrentBet * crashCashedMult);
    awardWin(winAmount, 25);

    if (window.sound && window.sound.playSlotWin) window.sound.playSlotWin();
    if (window.triggerHaptic) window.triggerHaptic("success");
    if (window.showToast) window.showToast(`Кэшаут успешен! Забрано +${winAmount} C (x${crashCashedMult.toFixed(2)})!`);

    const actionContainer = document.getElementById("crashActionsContainer");
    if (actionContainer) {
      actionContainer.innerHTML = `
        <button class="action-btn casino-spin-btn" disabled style="background:#059669;opacity:0.9;">
          <span class="btn-text">ВЫИГРЫШ ЗАБРАН!</span>
          <span class="btn-sub">+${winAmount} C (x${crashCashedMult.toFixed(2)})</span>
        </button>
      `;
    }

    const sub = document.getElementById("crashStatusSub");
    if (sub) sub.textContent = `Вы успели! Выигрыш зафиксирован: +${winAmount} C`;
  }

  function crashExplode() {
    if (crashAnimId) {
      cancelAnimationFrame(crashAnimId);
      crashAnimId = null;
    }
    crashState = 'crashed';

    if (crashCtx && crashCanvas) {
      const w = crashCanvas.width;
      const h = crashCanvas.height;
      crashCtx.fillStyle = "rgba(239, 68, 68, 0.4)";
      crashCtx.fillRect(0, 0, w, h);
    }

    const wrapper = document.getElementById("crashCanvasWrapper");
    if (wrapper) {
      wrapper.classList.add("canvas-shake");
      setTimeout(() => wrapper.classList.remove("canvas-shake"), 400);
    }

    const counter = document.getElementById("crashMultCounter");
    const sub = document.getElementById("crashStatusSub");

    if (counter) {
      counter.className = "crash-mult-counter crashed";
      counter.textContent = `💥 x${crashTarget.toFixed(2)}`;
      counter.style.color = "#ef4444";
    }
    if (sub) sub.textContent = `Крушение ракеты на x${crashTarget.toFixed(2)}`;

    if (window.sound && window.sound.playMineExplosion) window.sound.playMineExplosion();
    if (window.triggerHaptic) window.triggerHaptic("error");

    crashHistory.unshift(Number(crashTarget.toFixed(2)));
    if (crashHistory.length > 6) crashHistory.pop();
    const histEl = document.getElementById("crashHistoryRow");
    if (histEl) histEl.innerHTML = renderCrashHistoryHtml();

    setTimeout(() => {
      document.querySelectorAll(".bet-chip-btn").forEach(b => b.disabled = false);
      const actionContainer = document.getElementById("crashActionsContainer");
      if (actionContainer) {
        actionContainer.innerHTML = `
          <button class="action-btn casino-spin-btn" id="crashActionBtn">
            <span class="btn-text">ЗАПУСК РАКЕТЫ</span>
            <span class="btn-sub">Ставка: ${currentBet} C</span>
          </button>
        `;
        const launchBtn = document.getElementById("crashActionBtn");
        if (launchBtn) launchBtn.onclick = startCrashRound;
      }
      if (sub) sub.textContent = "Испытай удачу снова!";
      drawCrashStaticScene();
    }, 1500);
  }

  /* ==========================================================
     ТАБ 6: ТАЁЖНЫЕ КОСТИ (DICE)
     ========================================================== */
  const DICE_BET_OPTIONS = [
    { id: 'under7', label: 'Меньше 7', mult: 2.00, hint: 'Сумма 2..6', icon: '⬇️' },
    { id: 'exact7', label: 'Ровно 7', mult: 5.80, hint: 'Сумма 7 (x5.8)', icon: '🎯' },
    { id: 'over7', label: 'Больше 7', mult: 2.00, hint: 'Сумма 8..12', icon: '⬆️' },
    { id: 'even', label: 'Чётное', mult: 1.95, hint: '2, 4, 6..12', icon: '⚖️' },
    { id: 'odd', label: 'Нечётное', mult: 1.95, hint: '3, 5, 7..11', icon: '🎲' },
    { id: 'double', label: 'Дубль', mult: 6.00, hint: '1-1, 2-2..6-6', icon: '✨' }
  ];

  let currentDiceBetType = 'under7';
  let isRollingDice = false;
  let diceValues = [3, 4];
  let diceHistory = [7, 10, 4, 8, 6];
  let diceIntervalId = null;

  function renderDicePipsHtml(val) {
    const pipsByVal = {
      1: [5],
      2: [1, 9],
      3: [1, 5, 9],
      4: [1, 3, 7, 9],
      5: [1, 3, 5, 7, 9],
      6: [1, 4, 7, 3, 6, 9]
    };
    const active = pipsByVal[val] || [5];
    let html = '';
    for (let pos = 1; pos <= 9; pos++) {
      if (active.includes(pos)) {
        html += `<span class="pip pos-${pos}"></span>`;
      } else {
        html += `<span class="pip-empty"></span>`;
      }
    }
    return html;
  }

  function renderDiceTab() {
    tabViewport.innerHTML = `
      <div class="dice-container">
        <div class="slots-header">
          <div class="slots-title">Таёжные Кости (Dice)</div>
          <div class="slots-desc">Выбери исход, сделай ставку и бросай пару кубиков!</div>
        </div>

        <!-- Арена для кубиков -->
        <div class="dice-arena">
          <div class="dice-cube" id="diceCube1" data-val="${diceValues[0]}">
            ${renderDicePipsHtml(diceValues[0])}
          </div>
          <div class="dice-sum-display" id="diceSumDisplay">
            Сумма: <strong>${diceValues[0] + diceValues[1]}</strong>
          </div>
          <div class="dice-cube" id="diceCube2" data-val="${diceValues[1]}">
            ${renderDicePipsHtml(diceValues[1])}
          </div>
        </div>

        <div class="dice-status-banner" id="diceStatusBanner">Выберите ставку и нажмите «Бросить кости»</div>

        <!-- Сетка вариантов ставок -->
        <div class="dice-options-grid">
          ${DICE_BET_OPTIONS.map(opt => `
            <button class="dice-bet-card ${currentDiceBetType === opt.id ? 'active' : ''}" data-type="${opt.id}">
              <div class="dbc-icon">${opt.icon}</div>
              <div class="dbc-label">${opt.label}</div>
              <div class="dbc-mult">x${opt.mult.toFixed(2)}</div>
              <div class="dbc-hint">${opt.hint}</div>
            </button>
          `).join('')}
        </div>

        ${renderBetBar(bet => {
          const sub = document.querySelector("#diceRollBtn .btn-sub");
          if (sub) sub.textContent = `Ставка: ${bet} C`;
        })}

        <div class="dice-actions">
          <button class="action-btn casino-spin-btn" id="diceRollBtn">
            <span class="btn-text">БРОСИТЬ КОСТИ</span>
            <span class="btn-sub">Ставка: ${currentBet} C</span>
          </button>
        </div>

        <!-- История бросков -->
        <div class="dice-history-row" id="diceHistoryRow">
          <span style="font-size:10px;color:#94a3b8;margin-right:6px;align-self:center;">История:</span>
          ${diceHistory.map(s => `<span class="dice-hist-pill">${s}</span>`).join('')}
        </div>
      </div>
    `;

    bindBetBarEvents(bet => {
      const sub = document.querySelector("#diceRollBtn .btn-sub");
      if (sub) sub.textContent = `Ставка: ${bet} C`;
    });

    document.querySelectorAll(".dice-bet-card").forEach(btn => {
      btn.onclick = () => {
        if (isRollingDice) return;
        currentDiceBetType = btn.dataset.type;
        document.querySelectorAll(".dice-bet-card").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        if (window.sound && window.sound.playChipBet) window.sound.playChipBet();
        if (window.triggerHaptic) window.triggerHaptic("light");
      };
    });

    const rollBtn = document.getElementById("diceRollBtn");
    if (rollBtn) rollBtn.onclick = rollDice;
  }

  function rollDice() {
    if (isRollingDice) return;
    if (!deductBet(currentBet)) return;

    isRollingDice = true;
    document.querySelectorAll(".bet-chip-btn").forEach(b => b.disabled = true);
    document.querySelectorAll(".dice-bet-card").forEach(b => b.disabled = true);
    const rollBtn = document.getElementById("diceRollBtn");
    if (rollBtn) rollBtn.disabled = true;

    const d1El = document.getElementById("diceCube1");
    const d2El = document.getElementById("diceCube2");
    const sumEl = document.getElementById("diceSumDisplay");
    const statusBanner = document.getElementById("diceStatusBanner");

    if (d1El) d1El.classList.add("dice-rolling");
    if (d2El) d2El.classList.add("dice-rolling");
    if (statusBanner) {
      statusBanner.textContent = "Кости брошены...";
      statusBanner.className = "dice-status-banner";
    }

    if (window.sound && window.sound.playDiceRoll) window.sound.playDiceRoll();
    if (window.triggerHaptic) window.triggerHaptic("medium");

    let ticks = 0;
    diceIntervalId = setInterval(() => {
      ticks++;
      const rand1 = Math.floor(Math.random() * 6) + 1;
      const rand2 = Math.floor(Math.random() * 6) + 1;
      if (d1El) d1El.innerHTML = renderDicePipsHtml(rand1);
      if (d2El) d2El.innerHTML = renderDicePipsHtml(rand2);
      if (sumEl) sumEl.innerHTML = `Сумма: <strong>${rand1 + rand2}</strong>`;

      if (ticks >= 10) {
        clearInterval(diceIntervalId);
        diceIntervalId = null;

        const final1 = Math.floor(Math.random() * 6) + 1;
        const final2 = Math.floor(Math.random() * 6) + 1;
        diceValues = [final1, final2];

        if (d1El) {
          d1El.classList.remove("dice-rolling");
          d1El.innerHTML = renderDicePipsHtml(final1);
        }
        if (d2El) {
          d2El.classList.remove("dice-rolling");
          d2El.innerHTML = renderDicePipsHtml(final2);
        }

        const sum = final1 + final2;
        const isDouble = (final1 === final2);
        if (sumEl) {
          sumEl.innerHTML = `Сумма: <strong>${sum}</strong> ${isDouble ? '<span style="color:#fef08a;">✨</span>' : ''}`;
        }

        let won = false;
        if (currentDiceBetType === 'under7' && sum < 7) won = true;
        else if (currentDiceBetType === 'exact7' && sum === 7) won = true;
        else if (currentDiceBetType === 'over7' && sum > 7) won = true;
        else if (currentDiceBetType === 'even' && sum % 2 === 0) won = true;
        else if (currentDiceBetType === 'odd' && sum % 2 !== 0) won = true;
        else if (currentDiceBetType === 'double' && isDouble) won = true;

        const opt = DICE_BET_OPTIONS.find(o => o.id === currentDiceBetType);

        if (won) {
          const winAmount = Math.floor(currentBet * opt.mult);
          awardWin(winAmount, 18);
          if (statusBanner) {
            statusBanner.textContent = `🎉 ВЫИГРЫШ: +${winAmount} C! (Выпало ${sum} ${isDouble ? '— ДУБЛЬ!' : ''})`;
            statusBanner.className = "dice-status-banner status-win";
          }
          if (window.sound && window.sound.playSuccess) window.sound.playSuccess();
          if (window.triggerHaptic) window.triggerHaptic("success");
        } else {
          if (statusBanner) {
            statusBanner.textContent = `Выпало ${sum} (${final1} + ${final2}): Ставка не сыграла.`;
            statusBanner.className = "dice-status-banner status-lose";
          }
          if (window.sound && window.sound.playFail) window.sound.playFail();
          if (window.triggerHaptic) window.triggerHaptic("light");
        }

        diceHistory.unshift(sum);
        if (diceHistory.length > 6) diceHistory.pop();
        const histEl = document.getElementById("diceHistoryRow");
        if (histEl) {
          histEl.innerHTML = `
            <span style="font-size:10px;color:#94a3b8;margin-right:6px;align-self:center;">История:</span>
            ${diceHistory.map(s => `<span class="dice-hist-pill">${s}</span>`).join('')}
          `;
        }

        isRollingDice = false;
        document.querySelectorAll(".bet-chip-btn").forEach(b => b.disabled = false);
        document.querySelectorAll(".dice-bet-card").forEach(b => b.disabled = false);
        if (rollBtn) rollBtn.disabled = false;
      }
    }, 75);
  }

  /* ==========================================================
     ТАБ 7: ИНТЕГРАЦИЯ С ТЕЛЕГРАМ БОТОМ КАЗИНО
     ========================================================== */
  function renderBotTab() {
    tabViewport.innerHTML = `
      <div class="bot-casino-container">
        <div class="slots-header">
          <div class="slots-title">Казино в Telegram Боте</div>
          <div class="slots-desc">Синхронизированный баланс и классические азартные игры в диалоге бота LumiBot!</div>
        </div>

        <div class="bot-games-grid">
          <div class="bot-game-card">
            <div class="bgc-icon">🃏</div>
            <div class="bgc-title">Блэкджек (21 Очко)</div>
            <div class="bgc-desc">Интерактивная битва с дилером, сплит, дабл и блэкджек 3:2.</div>
          </div>
          <div class="bot-game-card">
            <div class="bgc-icon">🎡</div>
            <div class="bgc-title">Европейская Рулетка</div>
            <div class="bgc-desc">Ставки на красное/черное, дюжины, чет/нечет и точные числа.</div>
          </div>
          <div class="bot-game-card">
            <div class="bgc-icon">🎯</div>
            <div class="bgc-title">Спорт: Дартс и Боулинг</div>
            <div class="bgc-desc">Соревнования на меткость с анимацией Telegram Dice.</div>
          </div>
        </div>

        <div class="bot-open-box">
          <p style="font-size:12px;color:#94a3b8;margin-bottom:14px;">
            Все выигрыши и баланс едины между WebApp игрой и Telegram ботом.
          </p>
          <button class="action-btn" id="openTelegramBotCasinoBtn" style="padding:14px;background:linear-gradient(135deg,#0284c7,#0369a1);">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:8px;"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            Открыть лобби казино в Боте
          </button>
        </div>
      </div>
    `;

    const openBotBtn = document.getElementById("openTelegramBotCasinoBtn");
    if (openBotBtn) {
      openBotBtn.onclick = () => {
        if (window.triggerHaptic) window.triggerHaptic("medium");
        const tg = window.Telegram?.WebApp;
        if (tg) {
          try {
            tg.close();
          } catch (e) {
            console.warn(e);
          }
        } else {
          if (window.showToast) window.showToast("Доступно при запуске внутри Telegram");
        }
      };
    }
  }

  // Публичный интерфейс
  window.CasinoManager = {
    open: function () {
      initCasino();
    },
    updateBalance: function () {
      updateBalanceDisplay();
    },
    cleanup: function () {
      cleanupActiveGames();
    }
  };

  window.initCasino = initCasino;
})();
