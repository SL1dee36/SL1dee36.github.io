/* ==========================================================
   LUMIBOT FISHING - SLOTS.JS
   Слоты «Таёжный Джекпот»
   ========================================================== */


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


window.renderSlotsTab = renderSlotsTab;
