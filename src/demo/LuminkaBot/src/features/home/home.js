/* ==========================================================
   LUMIBOT FISHING - HOME.JS
   Хижина рыбака, камин, отдых, готовка рыбы на печи и сон
   ========================================================== */

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

      const fatigueEl = document.getElementById("cabinFatigueDisplay");
      if (fatigueEl) {
        fatigueEl.textContent = Math.round(player.fatigue || 0) + "%";
      }

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
      window.FrameNav.open("homeModal", () => {
        renderHome();
      });
    }

    function closeHomeScene() {
      isHomeScene = false;
      window.FrameNav.close("homeModal");
      showToast("Вы на озере. Смахните вверх для заброса");
    }

    if (openHomeBtn) openHomeBtn.addEventListener("click", openHomeScene);
    if (closeHomeBtn) closeHomeBtn.addEventListener("click", closeHomeScene);
    if (homeGoFishingBtn) homeGoFishingBtn.addEventListener("click", closeHomeScene);

    if (homeGoMerchantBtn) {
      homeGoMerchantBtn.addEventListener("click", () => {
        window.FrameNav.open("shopModal", () => {
          if (typeof renderShopTab === "function") renderShopTab(currentShopTab);
        });
      });
    }

    if (homeGoLivewellBtn) {
      homeGoLivewellBtn.addEventListener("click", () => {
        window.FrameNav.open("livewellModal", () => {
          if (typeof renderLivewell === "function") renderLivewell();
        });
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

      // Сбрасываем усталость и наступает бодрое утро (06:30)
      player.fatigue = 0;
      if (window.EnvironmentManager) {
        window.EnvironmentManager.setTime(6.5);
        if (window.EnvironmentManager.weather === "storm") {
          window.EnvironmentManager.setWeather("clear");
        }
      }
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



    // Управление окном настроек графики из Хижины
    const cabinSettingsBtn = document.getElementById("cabinSettingsBtn");
    const settingsModal = document.getElementById("settingsModal");
    const closeSettingsBtn = document.getElementById("closeSettingsBtn");

    function openSettingsModal() {
      window.FrameNav.open("settingsModal", () => {
        if (typeof updateQualityUI === "function") updateQualityUI();
      });
    }

    function closeSettingsModal() {
      window.FrameNav.close("settingsModal");
    }

    if (cabinSettingsBtn) cabinSettingsBtn.addEventListener("click", openSettingsModal);
    if (closeSettingsBtn) closeSettingsBtn.addEventListener("click", closeSettingsModal);

window.openSettingsModal = openSettingsModal;
window.closeSettingsModal = closeSettingsModal;
window.renderHome = renderHome;
window.openHomeScene = openHomeScene;
window.closeHomeScene = closeHomeScene;
window.sleepAtHome = sleepAtHome;
