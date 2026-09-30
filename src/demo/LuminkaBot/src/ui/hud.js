/* ==========================================================
   LUMIBOT FISHING - HUD.JS
   Верхний HUD игрока, выбор приманок, стили ловли и звуковая кнопка
   ========================================================== */

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

    let _hudEls = null;
    const _hudCache = {
      name: null,
      level: null,
      balance: null,
      xpPct: -1,
      livewellLen: -1,
      fatigue: -1,
      fatigueClass: null,
      vigActive: null,
      vigOpacity: null,
      envStr: null
    };

    function _initHudElements() {
      if (_hudEls) return _hudEls;
      _hudEls = {
        name: document.getElementById("playerName"),
        level: document.getElementById("playerLevel"),
        balance: document.getElementById("playerBalance"),
        xpBar: document.getElementById("xpBar"),
        badge: document.getElementById("livewellCountBadge"),
        homeBadge: document.getElementById("homeLivewellCount"),
        fatiguePill: document.getElementById("fatigueHudPill"),
        fatigueText: document.getElementById("fatigueText"),
        vignette: document.getElementById("fatigueVignetteOverlay"),
        envTimeText: document.getElementById("envTimeText"),
        envWeatherIcon: document.getElementById("envWeatherIcon"),
        envHudPill: document.getElementById("envHudPill")
      };
      return _hudEls;
    }

    function updatePlayerHUD() {
      const els = _initHudElements();
      if (!els.name) return;

      if (player.name !== _hudCache.name) {
        _hudCache.name = player.name;
        els.name.textContent = player.name;
      }
      if (player.level !== _hudCache.level) {
        _hudCache.level = player.level;
        els.level.textContent = player.level;
      }
      if (player.balance !== _hudCache.balance) {
        _hudCache.balance = player.balance;
        els.balance.textContent = player.balance;
      }

      const nextLevelXp = Math.pow(player.level, 2) * 50;
      const prevLevelXp = Math.pow(player.level - 1, 2) * 50;
      const progressPercent = Math.min(100, Math.max(0, Math.round(((player.xp - prevLevelXp) / (nextLevelXp - prevLevelXp)) * 100)));
      if (progressPercent !== _hudCache.xpPct) {
        _hudCache.xpPct = progressPercent;
        els.xpBar.style.width = `${progressPercent}%`;
      }

      // Счетчик рыбы в садке
      const lwLen = player.livewell ? player.livewell.length : 0;
      if (lwLen !== _hudCache.livewellLen) {
        _hudCache.livewellLen = lwLen;
        if (els.badge) els.badge.textContent = lwLen;
        if (els.homeBadge) els.homeBadge.textContent = lwLen;
      }

      // Индикатор усталости игрока
      const currentFatigue = Math.max(0, Math.min(100, Math.round(player.fatigue || 0)));
      if (currentFatigue !== _hudCache.fatigue) {
        _hudCache.fatigue = currentFatigue;
        if (els.fatigueText) els.fatigueText.textContent = `${currentFatigue}%`;

        let fClass = "hud-pill-btn fatigue-pill ";
        if (currentFatigue >= 90) fClass += "fatigue-critical";
        else if (currentFatigue >= 80) fClass += "fatigue-tired";
        else if (currentFatigue >= 50) fClass += "fatigue-warn";
        else fClass += "fatigue-good";

        if (fClass !== _hudCache.fatigueClass && els.fatiguePill) {
          _hudCache.fatigueClass = fClass;
          els.fatiguePill.className = fClass;
        }

        // Потемнение в глазах (>80% усталости)
        if (els.vignette) {
          if (currentFatigue >= 80) {
            const vigOpacity = Math.min(0.92, 0.40 + ((currentFatigue - 80) / 20) * 0.52).toFixed(2);
            if (_hudCache.vigOpacity !== vigOpacity) {
              _hudCache.vigOpacity = vigOpacity;
              els.vignette.style.opacity = vigOpacity;
            }
            if (_hudCache.vigActive !== true) {
              _hudCache.vigActive = true;
              els.vignette.classList.add("active");
            }
          } else {
            if (_hudCache.vigActive !== false) {
              _hudCache.vigActive = false;
              els.vignette.style.opacity = "0";
              els.vignette.classList.remove("active");
            }
          }
        }
      }

      // Виджет времени суток и погоды
      if (window.EnvironmentManager && els.envTimeText && els.envWeatherIcon) {
        const info = window.EnvironmentManager.getHUDInfo();
        const envKey = `${info.timeStr}_${info.weatherName}`;
        if (envKey !== _hudCache.envStr) {
          _hudCache.envStr = envKey;
          els.envTimeText.textContent = `${info.timeStr} • ${info.weatherName}`;
          els.envWeatherIcon.innerHTML = info.iconSvg;
        }

        if (els.envHudPill && !els.envHudPill._hasListener) {
          els.envHudPill._hasListener = true;
          els.envHudPill.addEventListener("click", () => {
            const currentInfo = window.EnvironmentManager.getHUDInfo();
            if (typeof showToast === "function") {
              showToast(`${currentInfo.timeStr} • ${currentInfo.phaseName} • ${currentInfo.weatherName}. ${currentInfo.bonusText}`);
            }
            if (typeof triggerHaptic === "function") triggerHaptic("light");
          });
        }
      }
    }

    // Добавление усталости и проверка эффектов


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


window.updateTensionSafeZoneUI = updateTensionSafeZoneUI;
window.updatePlayerHUD = updatePlayerHUD;
window.renderBaitsUI = renderBaitsUI;
window.updateMethodsUI = updateMethodsUI;
window.initMethodAndBaitsUI = initMethodAndBaitsUI;
window.showLureTwitchButton = showLureTwitchButton;
