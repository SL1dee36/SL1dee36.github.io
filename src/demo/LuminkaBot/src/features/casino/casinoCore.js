/* ==========================================================
   LUMIBOT FISHING - CASINOCORE.JS
   Хаб Казино «Золотой Крючок», баланс, ставки и переключение игр
   ========================================================== */

var currentCasinoTab = "slots";
var currentTab = "slots";
var currentBet = 50;
var AVAILABLE_BETS = [10, 25, 50, 100, 250, 500];

var tabViewport = null;
var balanceEl = null;



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



function changeBalance(delta, reason) {
  if (delta < 0) {
    return deductBet(-delta);
  } else {
    awardWin(delta);
    return true;
  }
}

function switchCasinoTab(tab) {
  if (tab === currentTab) return;
  cleanupActiveGames();
  document.querySelectorAll(".casino-tab-btn").forEach(b => {
    b.classList.toggle("active", b.dataset.casinotab === tab);
  });
  currentTab = tab;
  window.currentTab = tab;
  renderActiveTab();
}

window.currentBet = currentBet;
window.AVAILABLE_BETS = AVAILABLE_BETS;
window.getBalance = getBalance;
window.updateBalanceDisplay = updateBalanceDisplay;
window.changeBalance = changeBalance;
window.deductBet = deductBet;
window.awardWin = awardWin;
window.renderBetBar = renderBetBar;
window.switchCasinoTab = switchCasinoTab;
window.renderActiveTab = renderActiveTab;
window.initCasino = initCasino;
window.cleanupActiveGames = cleanupActiveGames;
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
