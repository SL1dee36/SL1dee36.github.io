/* ==========================================================
   LUMIBOT FISHING - MINES.JS
   «Минное поле» (Mines 5x5)
   ========================================================== */


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


window.renderMinesTab = renderMinesTab;
