/* ==========================================================
   LUMIBOT FISHING - SHOP.JS
   Модуль магазина снастей, приманок и скупки улова
   ========================================================== */

    /* ==========================================================
       МОДУЛЬ МАГАЗИНА СНАСТЕЙ И УЛУЧШЕНИЙ
       ========================================================== */
    const shopModal = document.getElementById("shopModal");
    const openShopBtn = document.getElementById("openShopBtn");
    const closeShopBtn = document.getElementById("closeShopBtn");
    let currentShopTab = "sell";
    let merchantDialogueTimer = null;

    function setMerchantState(state, text) {
      const mouth = document.getElementById("merchantMouth");
      const mouthGroup = document.getElementById("merchantMouthGroup");
      const speech = document.getElementById("merchantSpeech");

      if (!mouth || !mouthGroup) return;

      if (state === "talking") {
        mouthGroup.classList.add("talking");
        mouth.classList.remove("mouth-smiling");
        mouth.classList.remove("mouth-idle");
        mouth.setAttribute("d", "M46 58 Q50 63 54 58 Q50 60 46 58");
        mouth.setAttribute("fill", "#1e293b");
        mouth.setAttribute("stroke", "#1e293b");
      } else if (state === "smiling") {
        mouthGroup.classList.remove("talking");
        mouth.classList.remove("mouth-idle");
        mouth.classList.add("mouth-smiling");
        mouth.setAttribute("d", "M44 57 Q50 65 56 57");
        mouth.setAttribute("fill", "none");
        mouth.setAttribute("stroke", "#0f172a");
      } else {
        mouthGroup.classList.remove("talking");
        mouth.classList.remove("mouth-smiling");
        mouth.classList.add("mouth-idle");
        mouth.setAttribute("d", "M46 59 Q50 59 54 59");
        mouth.setAttribute("fill", "none");
        mouth.setAttribute("stroke", "#334155");
      }

      if (speech && text) {
        speech.textContent = text;
      }

      if (merchantDialogueTimer) clearTimeout(merchantDialogueTimer);
      if (state !== "idle") {
        merchantDialogueTimer = setTimeout(() => {
          setMerchantState("idle");
        }, 3000);
      }
    }
    window.setMerchantState = setMerchantState;


    function sellLivewellFish(idx) {
      if (idx < 0 || idx >= player.livewell.length) return;
      const fish = player.livewell.splice(idx, 1)[0];
      const dynamic = getFishDynamicPrice(fish);
      player.balance += dynamic.price;
      player.totalEarned += dynamic.price;
      player.fishSold++;
      recordFishSale(fish.fishId || fish.id, 1);
      triggerHaptic("medium");
      updatePlayerHUD();
      savePlayerLocal();
      syncUserStatsToSupabase();
      showToast(`Продано на скупке: ${fish.name} (+${dynamic.price} C) [${dynamic.label}]`);
      setMerchantState("smiling", `Добротная рыба! Принял ${fish.name} за +${dynamic.price} C.`);
    }

    function renderShopTab(tabKey) {
      currentShopTab = tabKey;
      document.querySelectorAll("#shopModal .tab-bar .tab-btn").forEach(b => {
        b.classList.toggle("active", b.dataset.shoptab === tabKey);
      });

      const tabPhrases = {
        sell: "Принимаю свежую рыбу по честному курсу. Показывай улов!",
        methods: "Выбирай способ под водоём: поплавок, спиннинг, фидер или нахлыст.",
        baits: "Приманка решает всё! Без доброй насадки и клёва не жди.",
        rods: "Удилище выбирай по уровню. Чем прочнее комлевая часть, тем проще удержать трофей.",
        lines: "Леска должна держать рывок, проверяй запас прочности."
      };
      if (tabPhrases[tabKey]) {
        setMerchantState("talking", tabPhrases[tabKey]);
      }

      const container = document.getElementById("shopTabContent");
      if (!container) return;

      if (tabKey === "sell") {
        const totalWorth = player.livewell.reduce((sum, item) => sum + getFishDynamicPrice(item).price, 0);
        const totalGlobalSales = Object.values(marketSales).reduce((sum, v) => sum + (typeof v === 'number' ? v : 0), 0);
        const isDataReady = totalGlobalSales >= 12;

        if (player.livewell.length === 0) {
          container.innerHTML = `
            <div class="market-info-bar">
              <span>${isDataReady ? 'Динамическая скупка активна (спрос и предложение)' : 'Сбор статистики цен: продано ' + totalGlobalSales + '/12 рыб'}</span>
              <span>Всего сдано: <b>${totalGlobalSales} шт.</b></span>
            </div>
            <div style="text-align:center;padding:30px 10px;color:#64748b;font-size:13px;">
              Торговец ждет улов! Ваш садок пуст.<br><br>
              Поймайте рыбу и принесите её на скупку.
            </div>
          `;
        } else {
          container.innerHTML = `
            <div class="market-info-bar">
              <span>${isDataReady ? 'Динамическая скупка: цены зависят от частоты продаж' : 'Сбор статистики цен: продано ' + totalGlobalSales + '/12 рыб (базовые цены)'}</span>
              <span>Всего сдано: <b>${totalGlobalSales} шт.</b></span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-size:12px;color:#94a3b8;">
              <span>Рыб в садке: ${player.livewell.length} шт.</span>
              <span style="color:#fef08a;font-weight:700;">Итого: ${totalWorth} C</span>
            </div>
            <button class="action-btn" onclick="sellAllThroughMerchant()" style="margin-bottom:12px;padding:10px;">Продать всё оптом (+${totalWorth} C)</button>
            <div style="display:flex;flex-direction:column;gap:8px;">
              ${player.livewell.map((item, idx) => {
                const dynamic = getFishDynamicPrice(item);
                return `
                <div class="livewell-item">
                  <div class="livewell-item-meta">
                    <div class="livewell-item-name">
                      ${item.name}
                      <span class="rarity-pill rarity-${item.rarity}" style="font-size:9px;padding:1px 6px;">${item.rarity}</span>
                      <span class="price-trend-tag trend-${dynamic.trend}">${dynamic.label}</span>
                    </div>
                    <div class="livewell-item-sub">Вес: ${item.weight} кг | Цена: <b style="color:#fde047;">${dynamic.price} C</b> <span style="opacity:0.6;">(база: ${item.price} C)</span></div>
                  </div>
                  <button class="mini-sell-btn" onclick="sellLivewellFishFromShop(${idx})">Сдать +${dynamic.price} C</button>
                </div>
              `;
              }).join('')}
            </div>
          `;
        }
      } else if (tabKey === "methods") {
        container.innerHTML = Object.values(FISHING_METHODS).map(m => {
          const isEquipped = currentFishingMethod === m.id;
          const isOwned = player.ownedMethods.includes(m.id);
          const meetsLevel = player.level >= (m.levelReq || 1);
          const canAfford = player.balance >= m.price;

          let btnHtml = '';
          if (isEquipped) {
            btnHtml = `<button class="buy-btn equipped">Выбран</button>`;
          } else if (isOwned) {
            btnHtml = `<button class="buy-btn" onclick="equipMethod('${m.id}')">Выбрать</button>`;
          } else if (!meetsLevel) {
            btnHtml = `<button class="buy-btn locked" title="Требуется уровень ${m.levelReq}">🔒 Ур. ${m.levelReq}</button>`;
          } else if (!canAfford) {
            btnHtml = `<button class="buy-btn locked" title="Недостаточно монет">Купить ${m.price} C</button>`;
          } else {
            btnHtml = `<button class="buy-btn" onclick="buyMethod('${m.id}')">Купить ${m.price} C</button>`;
          }

          return `
            <div class="shop-card">
              <div class="shop-card-head">
                <div style="display:flex;align-items:center;gap:6px;">
                  <span style="display:inline-flex;color:#38bdf8;">${m.iconSvg || ''}</span>
                  <span class="shop-card-title">${m.name}</span>
                </div>
                <span class="shop-price">${m.price === 0 ? "Базовый" : m.price + " C"}</span>
              </div>
              <div class="shop-card-desc">${m.desc}</div>
              <div class="shop-card-actions">
                <div style="display:flex;align-items:center;gap:6px;">
                  <span class="req-badge ${meetsLevel ? 'ok' : ''}">Ур. ${m.levelReq || 1}</span>
                  <span style="font-size:11px;color:#38bdf8;">Клёв: x${m.biteSpeedMult}</span>
                </div>
                ${btnHtml}
              </div>
            </div>
          `;
        }).join('');
      } else if (tabKey === "rods") {
        container.innerHTML = Object.values(RODS).map(rod => {
          const isEquipped = player.rodId === rod.id;
          const isOwned = player.ownedRods.includes(rod.id);
          const meetsLevel = player.level >= (rod.levelReq || 1);
          const canAfford = player.balance >= rod.price;

          let btnHtml = '';
          if (isEquipped) {
            btnHtml = `<button class="buy-btn equipped">Надето</button>`;
          } else if (isOwned) {
            btnHtml = `<button class="buy-btn" onclick="equipRod('${rod.id}')">Надеть</button>`;
          } else if (!meetsLevel) {
            btnHtml = `<button class="buy-btn locked" title="Требуется уровень ${rod.levelReq}">🔒 Ур. ${rod.levelReq}</button>`;
          } else if (!canAfford) {
            btnHtml = `<button class="buy-btn locked" title="Недостаточно монет">Купить ${rod.price} C</button>`;
          } else {
            btnHtml = `<button class="buy-btn" onclick="buyRod('${rod.id}')">Купить ${rod.price} C</button>`;
          }

          return `
            <div class="shop-card">
              <div class="shop-card-head">
                <span class="shop-card-title">${rod.name}</span>
                <span class="shop-price">${rod.price === 0 ? "Базовая" : rod.price + " C"}</span>
              </div>
              <div class="shop-card-desc">${rod.desc}</div>
              <div class="shop-card-actions">
                <div style="display:flex;align-items:center;gap:6px;">
                  <span class="req-badge ${meetsLevel ? 'ok' : ''}">Ур. ${rod.levelReq || 1}</span>
                  <span style="font-size:11px;color:#38bdf8;">Зона: ${rod.safeZoneMin}%-${rod.safeZoneMax}%</span>
                </div>
                ${btnHtml}
              </div>
            </div>
          `;
        }).join('');
      } else if (tabKey === "lines") {
        container.innerHTML = Object.values(LINES).map(line => {
          const isEquipped = player.lineId === line.id;
          const isOwned = player.ownedLines.includes(line.id);
          const meetsLevel = player.level >= (line.levelReq || 1);
          const canAfford = player.balance >= line.price;

          let btnHtml = '';
          if (isEquipped) {
            btnHtml = `<button class="buy-btn equipped">Надето</button>`;
          } else if (isOwned) {
            btnHtml = `<button class="buy-btn" onclick="equipLine('${line.id}')">Надеть</button>`;
          } else if (!meetsLevel) {
            btnHtml = `<button class="buy-btn locked" title="Требуется уровень ${line.levelReq}">🔒 Ур. ${line.levelReq}</button>`;
          } else if (!canAfford) {
            btnHtml = `<button class="buy-btn locked" title="Недостаточно монет">Купить ${line.price} C</button>`;
          } else {
            btnHtml = `<button class="buy-btn" onclick="buyLine('${line.id}')">Купить ${line.price} C</button>`;
          }

          return `
            <div class="shop-card">
              <div class="shop-card-head">
                <span class="shop-card-title">${line.name}</span>
                <span class="shop-price">${line.price === 0 ? "Базовая" : line.price + " C"}</span>
              </div>
              <div class="shop-card-desc">${line.desc}</div>
              <div class="shop-card-actions">
                <div style="display:flex;align-items:center;gap:6px;">
                  <span class="req-badge ${meetsLevel ? 'ok' : ''}">Ур. ${line.levelReq || 1}</span>
                  <span style="font-size:11px;color:#38bdf8;">Запас: ${line.dangerBuffer} сек</span>
                </div>
                ${btnHtml}
              </div>
            </div>
          `;
        }).join('');
      } else if (tabKey === "baits") {
        if (!Array.isArray(player.unlockedBaits)) player.unlockedBaits = ["worm"];
        if (!player.baits || typeof player.baits !== 'object') player.baits = { worm: 20 };

        const methodSections = [
          { method: "float", title: "🪱 Поплавочные наживки", list: ["worm", "corn", "dough", "bloodworm"] },
          { method: "spinning", title: "🎣 Спиннинговые приманки", list: ["lure_spoon", "lure_spinner", "lure_jig", "lure_wobbler"] },
          { method: "feeder", title: "🔔 Фидерные смеси и насадки", list: ["maggot", "feeder_mix", "boilie", "live_bait"] },
          { method: "fly", title: "🪰 Нахлыстовые мушки", list: ["mayfly", "dry_fly", "nymph", "streamer"] }
        ];

        let html = '';
        methodSections.forEach(sec => {
          html += `<div class="shop-category-header">${sec.title}</div>`;
          sec.list.forEach(baitKey => {
            const bait = BAITS[baitKey];
            if (!bait) return;

            const isUnlocked = player.unlockedBaits.includes(baitKey);
            const count = player.baits[baitKey] || 0;
            const meetsLevel = player.level >= (bait.levelReq || 1);
            const canAffordUnlock = player.balance >= bait.unlockPrice;
            const canAffordPack = player.balance >= bait.packPrice;

            let btnHtml = '';
            if (!isUnlocked) {
              if (!meetsLevel) {
                btnHtml = `<button class="buy-btn locked" title="Требуется уровень ${bait.levelReq}">🔒 Ур. ${bait.levelReq}</button>`;
              } else if (!canAffordUnlock) {
                btnHtml = `<button class="buy-btn locked" title="Недостаточно монет">Открыть ${bait.unlockPrice} C</button>`;
              } else {
                btnHtml = `<button class="buy-btn" onclick="unlockBait('${baitKey}')">Открыть ${bait.unlockPrice === 0 ? "Бесплатно" : bait.unlockPrice + " C"}</button>`;
              }
            } else {
              if (!canAffordPack) {
                btnHtml = `<button class="buy-btn locked" title="Недостаточно монет">Закупка +${bait.packCount} шт. (${bait.packPrice} C)</button>`;
              } else {
                btnHtml = `<button class="buy-btn" onclick="buyBaitPack('${baitKey}')">Закупка +${bait.packCount} шт. (${bait.packPrice} C)</button>`;
              }
            }

            const methodName = (FISHING_METHODS[bait.method]?.name) || bait.method;
            const priceTag = !isUnlocked
              ? (bait.unlockPrice === 0 ? "Бесплатно" : bait.unlockPrice + " C")
              : (bait.packPrice + " C / " + bait.packCount + " шт.");

            html += `
              <div class="shop-card">
                <div class="shop-card-head">
                  <div style="display:flex;align-items:center;gap:6px;">
                    <span style="display:inline-flex;color:#38bdf8;">${bait.iconSvg || ''}</span>
                    <span class="shop-card-title">${bait.name}</span>
                    <span class="bait-method-badge">${methodName}</span>
                  </div>
                  <span class="shop-price">${priceTag}</span>
                </div>
                <div class="shop-card-desc">${bait.desc}</div>
                <div class="shop-card-actions">
                  <div style="display:flex;align-items:center;gap:8px;">
                    <span class="req-badge ${meetsLevel ? 'ok' : ''}">Ур. ${bait.levelReq || 1}</span>
                    <span class="bait-stock-tag ${count === 0 ? 'zero' : ''}">В наличии: <b>${count} шт.</b></span>
                  </div>
                  ${btnHtml}
                </div>
              </div>
            `;
          });
        });
        container.innerHTML = html;
      }
    }

    window.sellLivewellFishFromShop = function(idx) {
      sellLivewellFish(idx);
      renderShopTab("sell");
    };

    window.sellAllThroughMerchant = function() {
      if (player.livewell.length === 0) return;
      const count = player.livewell.length;
      let total = 0;
      player.livewell.forEach(f => {
        const dynamic = getFishDynamicPrice(f);
        total += dynamic.price;
        recordFishSale(f.fishId || f.id, 1);
      });
      player.balance += total;
      player.totalEarned += total;
      player.fishSold += count;
      player.livewell = [];

      triggerHaptic("success");
      if (window.sound && typeof window.sound.playSuccess === "function") {
        try { window.sound.playSuccess(); } catch (e) {}
      }
      updatePlayerHUD();
      savePlayerLocal();
      syncUserStatsToSupabase();
      renderShopTab("sell");
      showToast(`Торговец выкупил ${count} рыб по рыночным ценам за +${total} C!`);
      setMerchantState("smiling", `Богатый улов оптом! Монеты пересчитаны (+${total} C).`);
    };

    window.buyMethod = function(methodId) {
      const method = FISHING_METHODS[methodId];
      if (!method) return;
      if (player.level < (method.levelReq || 1)) {
        showToast(`Нужен Уровень ${method.levelReq} для открытия!`);
        setMerchantState("talking", `Рановато для способа «${method.name}». Нужен ${method.levelReq} уровень!`);
        return;
      }
      if (player.balance < method.price) {
        showToast(`Недостаточно монет: требуется ${method.price} C`);
        setMerchantState("talking", "Монет не хватает на покупку способа ловли.");
        return;
      }
      player.balance -= method.price;
      if (!player.ownedMethods.includes(methodId)) {
        player.ownedMethods.push(methodId);
      }
      currentFishingMethod = methodId;

      triggerHaptic("success");
      if (window.sound && typeof window.sound.playSuccess === "function") {
        try { window.sound.playSuccess(); } catch (e) {}
      }
      updatePlayerHUD();
      updateMethodsUI();
      savePlayerLocal();
      syncUserStatsToSupabase();
      renderShopTab("methods");
      showToast(`Открыт способ ловли: ${method.name}!`);
      setMerchantState("smiling", `По рукам! Осваивай ${method.name} на открытой воде.`);
    };

    window.equipMethod = function(methodId) {
      if (!player.ownedMethods.includes(methodId)) return;
      currentFishingMethod = methodId;
      triggerHaptic("light");
      updateMethodsUI();
      savePlayerLocal();
      syncUserStatsToSupabase();
      renderShopTab("methods");
      showToast(`Выбран способ ловли: ${FISHING_METHODS[methodId].name}`);
    };

    window.buyRod = function(rodId) {
      const rod = RODS[rodId];
      if (!rod) return;
      if (player.level < (rod.levelReq || 1)) {
        showToast(`Нужен Уровень ${rod.levelReq} для покупки этой удочки!`);
        setMerchantState("talking", `Бланк «${rod.name}» требует ${rod.levelReq} уровень. Наберись опыта!`);
        return;
      }
      if (player.balance < rod.price) {
        showToast(`Недостаточно монет: требуется ${rod.price} C`);
        setMerchantState("talking", "Не хватает монет в кошельке. Порыбачь ещё немного!");
        return;
      }
      player.balance -= rod.price;
      player.ownedRods.push(rodId);
      player.rodId = rodId;

      triggerHaptic("success");
      if (window.sound && typeof window.sound.playSuccess === "function") {
        try { window.sound.playSuccess(); } catch (e) {}
      }
      updatePlayerHUD();
      updateTensionSafeZoneUI();
      savePlayerLocal();
      syncUserStatsToSupabase();
      renderShopTab("rods");
      showToast(`Куплена удочка: ${rod.name}!`);
      setMerchantState("smiling", `Отличный выбор! С бланком «${rod.name}» никакой трофей не сорвется.`);
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
      if (!line) return;
      if (player.level < (line.levelReq || 1)) {
        showToast(`Нужен Уровень ${line.levelReq} для покупки этой лески!`);
        setMerchantState("talking", `Для лески «${line.name}» нужен ${line.levelReq} уровень.`);
        return;
      }
      if (player.balance < line.price) {
        showToast(`Недостаточно монет: требуется ${line.price} C`);
        setMerchantState("talking", "Маловато монет для покупки этой лески.");
        return;
      }
      player.balance -= line.price;
      player.ownedLines.push(lineId);
      player.lineId = lineId;

      triggerHaptic("success");
      if (window.sound && typeof window.sound.playSuccess === "function") {
        try { window.sound.playSuccess(); } catch (e) {}
      }
      updatePlayerHUD();
      savePlayerLocal();
      syncUserStatsToSupabase();
      renderShopTab("lines");
      showToast(`Куплена леска: ${line.name}!`);
      setMerchantState("smiling", `Держи бобину «${line.name}»! С ней перегрузки не страшны.`);
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

    function openShopModalWithTab(tabKey) {
      if (!shopModal) return;
      window.FrameNav.open("shopModal", () => {
        renderShopTab(tabKey || "baits");
      });
    }
    window.openShopModalWithTab = openShopModalWithTab;

    window.unlockBait = function(baitKey) {
      const bait = BAITS[baitKey];
      if (!bait) return;
      if (player.level < (bait.levelReq || 1)) {
        showToast(`Нужен Уровень ${bait.levelReq} для открытия наживки «${bait.name}»!`);
        setMerchantState("talking", `Секрет насадки «${bait.name}» откроется на ${bait.levelReq} уровне.`);
        return;
      }
      if (player.balance < bait.unlockPrice) {
        showToast(`Недостаточно монет: требуется ${bait.unlockPrice} C`);
        setMerchantState("talking", "Не хватает монет на рецепт этой приманки.");
        return;
      }
      player.balance -= bait.unlockPrice;
      if (!Array.isArray(player.unlockedBaits)) player.unlockedBaits = ["worm"];
      if (!player.unlockedBaits.includes(baitKey)) {
        player.unlockedBaits.push(baitKey);
      }
      if (!player.baits) player.baits = {};
      player.baits[baitKey] = (player.baits[baitKey] || 0) + (bait.packCount || 10);

      // Если метод ловли совпадает, выбираем открытую наживку
      if (bait.method === currentFishingMethod) {
        currentBaitKey = baitKey;
      }

      triggerHaptic("success");
      if (window.sound && typeof window.sound.playSuccess === "function") {
        try { window.sound.playSuccess(); } catch (e) {}
      }
      updatePlayerHUD();
      renderBaitsUI();
      savePlayerLocal();
      syncUserStatsToSupabase();
      renderShopTab("baits");
      showToast(`Наживка «${bait.name}» открыта! (+${bait.packCount} шт.)`);
      setMerchantState("smiling", `Рецепт освоен! Насадка «${bait.name}» готова к рыбалке.`);
    };

    window.buyBaitPack = function(baitKey) {
      const bait = BAITS[baitKey];
      if (!bait) return;
      if (!player.unlockedBaits || !player.unlockedBaits.includes(baitKey)) {
        showToast(`Сначала необходимо открыть наживку «${bait.name}»!`);
        setMerchantState("talking", "Сначала изучи эту наживку.");
        return;
      }
      if (player.balance < bait.packPrice) {
        showToast(`Недостаточно монет: требуется ${bait.packPrice} C`);
        setMerchantState("talking", "Не хватает монет на покупку связки наживки.");
        return;
      }
      player.balance -= bait.packPrice;
      if (!player.baits) player.baits = {};
      player.baits[baitKey] = (player.baits[baitKey] || 0) + (bait.packCount || 10);

      triggerHaptic("success");
      if (window.sound && typeof window.sound.playSuccess === "function") {
        try { window.sound.playSuccess(); } catch (e) {}
      }
      updatePlayerHUD();
      renderBaitsUI();
      savePlayerLocal();
      syncUserStatsToSupabase();
      renderShopTab("baits");
      showToast(`Закуплено: «${bait.name}» +${bait.packCount} шт. (всего: ${player.baits[baitKey]} шт.)`);
      setMerchantState("smiling", `Запас пополнен! Пусть на «${bait.name}» клюет трофейная рыба.`);
    };

    document.querySelectorAll("#shopModal .tab-bar .tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        renderShopTab(btn.dataset.shoptab);
        triggerHaptic("light");
      });
    });

    if (openShopBtn) {
      openShopBtn.addEventListener("click", () => {
        window.FrameNav.open("shopModal", () => {
          renderShopTab(currentShopTab);
        });
      });
    }

    if (closeShopBtn) {
      closeShopBtn.addEventListener("click", () => {
        window.FrameNav.close("shopModal");
      });
    }



window.renderShopTab = renderShopTab;
window.sellLivewellFish = sellLivewellFish;
