/* ==========================================================
   LUMIBOT FISHING - DICE.JS
   «Таёжные кости» (Dice)
   ========================================================== */


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


window.renderDiceTab = renderDiceTab;
