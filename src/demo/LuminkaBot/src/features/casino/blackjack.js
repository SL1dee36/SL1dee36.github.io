/* ==========================================================
   LUMIBOT FISHING - BLACKJACK.JS
   «21 Очко» (Таёжный Блэкджек)
   ========================================================== */


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


window.renderBlackjackTab = renderBlackjackTab;
