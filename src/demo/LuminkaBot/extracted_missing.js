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

window.sellLivewellFishFromShop = function (idx) {
  sellLivewellFish(idx);
  renderShopTab("sell");
};

window.sellAllThroughMerchant = function () {
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

window.buyRod = function (rodId) {
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

window.equipRod = function (rodId) {
  if (!player.ownedRods.includes(rodId)) return;
  player.rodId = rodId;
  triggerHaptic("light");
  updateTensionSafeZoneUI();
  savePlayerLocal();
  syncUserStatsToSupabase();
  renderShopTab("rods");
  showToast(`Надета: ${RODS[rodId].name}`);
};

window.buyLine = function (lineId) {
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

window.equipLine = function (lineId) {
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

  // Прогресс Атласа видов
  const caughtCount = Object.keys(player.caughtSpecies || {}).length;
  const progressBadge = document.getElementById("fishdexProgressBadge");
  if (progressBadge) {
    progressBadge.textContent = `${caughtCount} / ${FISH_DATABASE.length}`;
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
  const filtered = FISH_DATABASE.filter(f => currentFishdexFilter === "all" || f.rarity === currentFishdexFilter);
  grid.innerHTML = filtered.map(fish => {
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

