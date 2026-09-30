/* ==========================================================
   LUMIBOT FISHING - CATCHMODAL.JS
   Окно победы при поимке рыбы, предпросмотр добычи и действия с уловом
   ========================================================== */

function failFishing(reason) {
  if (typeof flushPendingFightFatigue === "function") flushPendingFightFatigue();
  if (typeof flushSavePlayerLocal === "function") flushSavePlayerLocal();
  gameState = "IDLE";
  const reelingOverlay = document.getElementById("reelingOverlay");
  if (reelingOverlay) reelingOverlay.classList.remove("active");
  const swipeHint = document.getElementById("swipeHint");
  if (swipeHint) swipeHint.style.display = "flex";
  const bottomBar = document.getElementById("bottomBar");
  if (bottomBar) bottomBar.style.display = "flex";
  const reelBtn = document.getElementById("reelBtn");
  if (reelBtn) reelBtn.classList.remove("highlight-pull");

  if (window.sound && typeof window.sound.playFail === "function") {
    try { window.sound.playFail(); } catch (e) {}
  }
  if (typeof triggerHaptic === "function") triggerHaptic("error");
  if (typeof showToast === "function") showToast(reason || "Сход рыбы!");
}

let lastCatchData = null;

function winFishing() {
  if (typeof flushPendingFightFatigue === "function") flushPendingFightFatigue();
  if (typeof flushSavePlayerLocal === "function") flushSavePlayerLocal();
  gameState = "CAUGHT";
  const reelingOverlay = document.getElementById("reelingOverlay");
  if (reelingOverlay) reelingOverlay.classList.remove("active");
  const reelBtn = document.getElementById("reelBtn");
  if (reelBtn) reelBtn.classList.remove("highlight-pull");

  if (window.sound && typeof window.sound.playSuccess === "function") {
    try { window.sound.playSuccess(); } catch (e) {}
  }
  if (typeof triggerHaptic === "function") triggerHaptic("success");

  const fish = window.activeFish || activeFish;
  const weight = window.activeFishWeight || activeFishWeight || (fish ? (fish.min_weight || 0.5) : 0.5);

  if (!fish) {
    if (typeof showToast === "function") showToast("Улов сорвался!");
    gameState = "IDLE";
    return;
  }

  // Расчет награды и опыта с учетом модификаторов
  const weightMultiplier = fish.min_weight ? (weight / fish.min_weight) : 1.0;
  const baseReward = fish.base_price || 30;
  const reward = (typeof fish.price === "number")
    ? fish.price
    : Math.round(baseReward * (0.8 + weightMultiplier * 0.3));
  const xpGained = Math.round(reward * 0.6);

  // Опыт и уровень начисляются сразу
  const oldLevel = player.level;
  player.fishCaught = (player.fishCaught || 0) + 1;
  player.xp = (player.xp || 0) + xpGained;
  player.level = 1 + Math.floor(Math.sqrt(player.xp / 50));
  if (player.level > oldLevel && typeof updateMethodsUI === "function") {
    updateMethodsUI();
  }

  // Обновление рекорда и атласа видов
  if (!player.bestCatch || !player.bestCatch.weight || weight > player.bestCatch.weight) {
    player.bestCatch = {
      name: fish.name,
      weight: weight,
      rarity: fish.rarity
    };
  }

  if (!player.caughtSpecies) player.caughtSpecies = {};
  if (!player.caughtSpecies[fish.id]) {
    player.caughtSpecies[fish.id] = {
      maxWeight: weight,
      count: 1,
      discoveredVariations: { base: true }
    };
  } else {
    player.caughtSpecies[fish.id].count = (player.caughtSpecies[fish.id].count || 0) + 1;
    if (weight > (player.caughtSpecies[fish.id].maxWeight || 0)) {
      player.caughtSpecies[fish.id].maxWeight = weight;
    }
    if (!player.caughtSpecies[fish.id].discoveredVariations) {
      player.caughtSpecies[fish.id].discoveredVariations = { base: true };
    }
  }

  if (fish.mutation && fish.mutation.id) {
    player.caughtSpecies[fish.id].discoveredVariations[fish.mutation.id] = true;
  }

  lastCatchData = {
    fish: fish,
    weight: weight,
    reward: reward,
    xp: xpGained
  };

  if (typeof updatePlayerHUD === "function") updatePlayerHUD();
  if (typeof savePlayerLocal === "function") savePlayerLocal();

  // Отрисовка рыбы в превью
  try {
    drawPreviewFish(fish);
  } catch (err) {
    console.warn("Fish preview draw error:", err);
  }

  // Наполнение карточки победы
  const modalRarity = document.getElementById("modalRarity");
  if (modalRarity) {
    modalRarity.className = `rarity-pill rarity-${fish.rarity}`;
    modalRarity.textContent = fish.rarity;
  }
  const modalFishName = document.getElementById("modalFishName");
  if (modalFishName) modalFishName.textContent = fish.name;
  const modalWeight = document.getElementById("modalWeight");
  if (modalWeight) modalWeight.textContent = `${weight} кг`;
  const modalCoins = document.getElementById("modalCoins");
  if (modalCoins) modalCoins.textContent = `+${reward} монет`;
  const modalXP = document.getElementById("modalXP");
  if (modalXP) modalXP.textContent = `+${xpGained} XP`;

  // Динамические бейджи мутаций, среды и титула
  const badgesRow = document.getElementById("modalBadgesRow");
  if (badgesRow) {
    badgesRow.innerHTML = "";
    if (fish.environment) {
      badgesRow.innerHTML += `<span class="badge-pill badge-env">${fish.environment.name}</span>`;
    }
    if (fish.mutation) {
      const mutClass = fish.mutation.id === "radioactive" ? "radioactive" : (fish.mutation.id === "golden" ? "golden" : "");
      badgesRow.innerHTML += `<span class="badge-pill badge-mutation ${mutClass}">${fish.mutation.name}</span>`;
    }
    if (fish.title) {
      badgesRow.innerHTML += `<span class="badge-pill badge-title">${fish.title.title}</span>`;
    }
  }

  // Чипы свойств (сытность семьи, яд, топливо)
  const icons = window.SVG_ICONS || (typeof SVG_ICONS !== "undefined" ? SVG_ICONS : {});
  const propsRow = document.getElementById("modalPropertiesRow");
  if (propsRow) {
    propsRow.innerHTML = "";
    if (fish.isLootbox) {
      propsRow.innerHTML += `<span class="prop-chip prop-chest"><span class="chip-svg">${icons.chest || ""}</span>Ларец с ценностями</span>`;
    }
    if (fish.fuelValue > 0) {
      propsRow.innerHTML += `<span class="prop-chip prop-fuel"><span class="chip-svg">${icons.fuel || ""}</span>Дрова для очага (+${fish.fuelValue})</span>`;
    }
    if (fish.poison) {
      propsRow.innerHTML += `<span class="prop-chip prop-poison"><span class="chip-svg">${icons.hazard || ""}</span>Ядовито (не для еды)</span>`;
    } else if (fish.edible) {
      propsRow.innerHTML += `<span class="prop-chip prop-edible"><span class="chip-svg">${icons.edible || ""}</span>Сытность: +${fish.hungerValue || 25}</span>`;
    }
  }

  // Переключение кнопки "В садок" / "Открыть ларец"
  const addLivewellBtn = document.getElementById("addToLivewellBtn");
  const openChestBtn = document.getElementById("openChestBtn");
  if (fish.isLootbox) {
    if (openChestBtn) openChestBtn.style.display = "block";
    if (addLivewellBtn) addLivewellBtn.style.display = "none";
  } else {
    if (openChestBtn) openChestBtn.style.display = "none";
    if (addLivewellBtn) addLivewellBtn.style.display = "block";
  }

  const catchModal = document.getElementById("catchModal");
  if (catchModal) window.FrameNav.open("catchModal");
}

let dbHasStatsColumns = false;

// Отрисовка превью сущности через модульный анатомический Canvas-рендер
    function drawPreviewFish(fish) {
      const pCanvas = document.getElementById("previewFishCanvas");
      if (!pCanvas) return;
      if (typeof ProceduralFishRenderer !== 'undefined') {
        ProceduralFishRenderer.drawPreview(pCanvas, fish);
        return;
      }
      const pCtx = pCanvas.getContext("2d");
      pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);

      const cx = pCanvas.width / 2;
      const cy = pCanvas.height / 2;
      const bodyType = typeof fish.bodyType === 'number' ? fish.bodyType : 0;

      pCtx.save();
      pCtx.shadowColor = fish.color;
      pCtx.shadowBlur = bodyType === 4 ? 22 : 12;

      // 1. Форма туловища в зависимости от типа рыбы
      pCtx.fillStyle = fish.color;
      pCtx.beginPath();
      if (bodyType === 0) {
        // Высокотелая озерная (Карась, Лещ, Карп, Линь)
        pCtx.ellipse(cx, cy, 34, 21, 0, 0, Math.PI * 2);
      } else if (bodyType === 1) {
        // Хищник / лосось (Окунь, Судак, Форель, Хариус)
        pCtx.ellipse(cx, cy, 38, 16, 0, 0, Math.PI * 2);
      } else if (bodyType === 2) {
        // Стремительная торпеда (Щука, Таймень, Жерех, Осетр)
        pCtx.ellipse(cx, cy, 44, 13, 0, 0, Math.PI * 2);
      } else if (bodyType === 3) {
        // Донный гигант / сом (Сом, Налим, Белуга)
        pCtx.ellipse(cx - 3, cy, 40, 16, 0, 0, Math.PI * 2);
      } else {
        // Легендарная мифическая (Золотая Рыбка, Царь-Рыба, Лунный Лосось)
        pCtx.ellipse(cx, cy, 36, 18, 0, 0, Math.PI * 2);
      }
      pCtx.fill();

      // Светлое брюшко
      const bellyGrad = pCtx.createLinearGradient(cx, cy, cx, cy + 20);
      bellyGrad.addColorStop(0, "rgba(255, 255, 255, 0)");
      bellyGrad.addColorStop(1, "rgba(255, 255, 255, 0.4)");
      pCtx.fillStyle = bellyGrad;
      pCtx.fill();

      // 2. Спинной плавник
      pCtx.fillStyle = bodyType === 4 ? "rgba(255, 255, 255, 0.75)" : "rgba(255, 255, 255, 0.4)";
      pCtx.beginPath();
      if (bodyType === 1) {
        // Высокий колючий гребень (Окунь, Судак, Хариус)
        pCtx.moveTo(cx - 14, cy - 15);
        pCtx.lineTo(cx - 2, cy - 27);
        pCtx.lineTo(cx + 10, cy - 24);
        pCtx.lineTo(cx + 18, cy - 13);
      } else if (bodyType === 2) {
        // Сдвинут назад к хвосту (Щука)
        pCtx.moveTo(cx - 26, cy - 11);
        pCtx.lineTo(cx - 18, cy - 19);
        pCtx.lineTo(cx - 10, cy - 12);
      } else if (bodyType === 4) {
        // Пышный полупрозрачный парус
        pCtx.moveTo(cx - 18, cy - 17);
        pCtx.bezierCurveTo(cx - 5, cy - 32, cx + 15, cy - 28, cx + 22, cy - 14);
      } else {
        // Классический
        pCtx.moveTo(cx - 10, cy - 19);
        pCtx.lineTo(cx + 4, cy - 25);
        pCtx.lineTo(cx + 14, cy - 18);
      }
      pCtx.closePath();
      pCtx.fill();

      // 3. Хвостовой плавник
      pCtx.fillStyle = fish.color;
      pCtx.beginPath();
      if (bodyType === 4) {
        // Роскошный вуалевый хвост
        pCtx.moveTo(cx - 30, cy);
        pCtx.bezierCurveTo(cx - 55, cy - 24, cx - 62, cy - 10, cx - 58, 0);
        pCtx.bezierCurveTo(cx - 62, cy + 10, cx - 55, cy + 24, cx - 30, cy);
      } else if (bodyType === 3) {
        // Сомовий округлый хвост
        pCtx.moveTo(cx - 32, cy - 7);
        pCtx.lineTo(cx - 52, cy - 10);
        pCtx.lineTo(cx - 54, cy + 10);
        pCtx.lineTo(cx - 32, cy + 7);
      } else {
        // V-образный раздвоенный хвост
        pCtx.moveTo(cx - 32, cy);
        pCtx.lineTo(cx - 54, cy - 15);
        pCtx.lineTo(cx - 45, cy);
        pCtx.lineTo(cx - 54, cy + 15);
      }
      pCtx.closePath();
      pCtx.fill();

      // 4. Усы для донных сомов и осетров
      if (bodyType === 3 || fish.id === 23) {
        pCtx.strokeStyle = "rgba(255, 255, 255, 0.85)";
        pCtx.lineWidth = 1.6;
        pCtx.beginPath();
        pCtx.moveTo(cx + 32, cy);
        pCtx.quadraticCurveTo(cx + 44, cy - 6, cx + 40, cy + 16);
        pCtx.stroke();
        pCtx.beginPath();
        pCtx.moveTo(cx + 28, cy + 5);
        pCtx.quadraticCurveTo(cx + 38, cy + 14, cx + 30, cy + 20);
        pCtx.stroke();
      }

      // 5. Глаз
      pCtx.fillStyle = "#fff";
      pCtx.beginPath();
      const eyeX = bodyType === 2 ? cx + 28 : cx + 22;
      const eyeY = cy - 4;
      pCtx.arc(eyeX, eyeY, 4, 0, Math.PI * 2);
      pCtx.fill();
      pCtx.fillStyle = "#000";
      pCtx.beginPath();
      pCtx.arc(eyeX + 1, eyeY, 2, 0, Math.PI * 2);
      pCtx.fill();

      // 6. Узор/полоски/крапинки
      if (bodyType === 1) {
        pCtx.strokeStyle = "rgba(0, 0, 0, 0.22)";
        pCtx.lineWidth = 2;
        for (let s = -12; s <= 12; s += 8) {
          pCtx.beginPath();
          pCtx.moveTo(cx + s, cy - 14);
          pCtx.lineTo(cx + s - 3, cy + 6);
          pCtx.stroke();
        }
      } else if (bodyType === 4) {
        pCtx.fillStyle = "#fff";
        pCtx.beginPath();
        pCtx.arc(cx - 6, cy - 4, 2, 0, Math.PI * 2);
        pCtx.arc(cx + 8, cy + 3, 1.5, 0, Math.PI * 2);
        pCtx.arc(cx - 16, cy + 4, 1.8, 0, Math.PI * 2);
        pCtx.fill();
      }

      pCtx.restore();
    }



    const soundBtn = document.getElementById("soundBtn");
    soundBtn.addEventListener("click", () => {
      player.soundEnabled = !player.soundEnabled;
      soundBtn.innerHTML = player.soundEnabled
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`
        : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>`;
      triggerHaptic("light");
    });

    // Действия в окне победы
    document.getElementById("addToLivewellBtn").addEventListener("click", () => {
      if (!lastCatchData) return;
      const newFishItem = {
        id: Date.now() + Math.random(),
        fishId: lastCatchData.fish.id,
        name: lastCatchData.fish.name,
        rarity: lastCatchData.fish.rarity,
        weight: lastCatchData.weight,
        price: lastCatchData.reward,
        color: lastCatchData.fish.color,
        bodyType: lastCatchData.fish.bodyType,
        fuelValue: lastCatchData.fish.fuelValue || 0,
        isLootbox: !!lastCatchData.fish.isLootbox,
        isFuel: !!lastCatchData.fish.isFuel,
        isJunk: !!lastCatchData.fish.isJunk,
        isBeast: !!lastCatchData.fish.isBeast,
        edible: lastCatchData.fish.edible,
        hungerValue: lastCatchData.fish.hungerValue,
        poison: lastCatchData.fish.poison,
        mutation: lastCatchData.fish.mutation || null,
        environment: lastCatchData.fish.environment || null,
        title: lastCatchData.fish.title || null
      };

      if (typeof GridInventory !== 'undefined') {
        const place = GridInventory.autoPlaceItem(player.livewell, newFishItem);
        if (!place) {
          showToast("Садок полон! Нет места для рыбы такого размера. Освободите место!");
          triggerHaptic("error");
          return;
        }
        newFishItem.gridX = place.x;
        newFishItem.gridY = place.y;
        newFishItem.gridShape = place.shape;
      }

      player.livewell.push(newFishItem);

      window.FrameNav.close("catchModal");
      gameState = "IDLE";
      document.getElementById("swipeHint").style.display = "flex";
      document.getElementById("bottomBar").style.display = "flex";
      triggerHaptic("light");

      updatePlayerHUD();
      savePlayerLocal();
      saveCatchToSupabase(lastCatchData.fish.id, lastCatchData.weight, lastCatchData.reward, lastCatchData.xp);
      showToast(`[${lastCatchData.fish.name}] помещен(а) в садок!`);
    });

    const openChestBtn = document.getElementById("openChestBtn");
    if (openChestBtn) {
      openChestBtn.addEventListener("click", () => {
        if (!lastCatchData || !lastCatchData.fish.isLootbox) return;
        const loot = (typeof EntityGenerator !== 'undefined')
          ? EntityGenerator.unpackChest(lastCatchData.fish)
          : { coins: lastCatchData.reward * 2, xp: lastCatchData.xp * 2, bait: "live_bait", baitCount: 3 };

        player.balance += loot.coins;
        player.totalEarned += loot.coins;
        player.xp += loot.xp;
        player.level = 1 + Math.floor(Math.sqrt(player.xp / 50));

        if (loot.bait && loot.baitCount) {
          if (!player.baits) player.baits = {};
          player.baits[loot.bait] = (player.baits[loot.bait] || 0) + loot.baitCount;
          if (!Array.isArray(player.unlockedBaits)) player.unlockedBaits = ["worm"];
          if (!player.unlockedBaits.includes(loot.bait)) player.unlockedBaits.push(loot.bait);
          renderBaitsUI();
        }

        window.FrameNav.close("catchModal");
        gameState = "IDLE";
        document.getElementById("swipeHint").style.display = "flex";
        document.getElementById("bottomBar").style.display = "flex";
        triggerHaptic("success");
        if (window.sound && typeof window.sound.playSuccess === "function") {
          try { window.sound.playSuccess(); } catch (e) {}
        }

        updatePlayerHUD();
        savePlayerLocal();
        showToast(`Ларец открыт: +${loot.coins} C, +${loot.xp} XP, наживка x${loot.baitCount}!`);
      });
    }

    const releaseCatchBtn = document.getElementById("releaseCatchBtn");
    if (releaseCatchBtn) {
      releaseCatchBtn.addEventListener("click", () => {
        if (!lastCatchData) return;
        // Единение с природой: отпускание рыбы даёт опыт
        player.xp += 5;
        if (typeof checkLevelUp === "function") {
          checkLevelUp();
        } else {
          player.level = 1 + Math.floor(Math.sqrt(player.xp / 50));
        }

        window.FrameNav.close("catchModal");
        gameState = "IDLE";
        document.getElementById("swipeHint").style.display = "flex";
        document.getElementById("bottomBar").style.display = "flex";
        triggerHaptic("medium");

        updatePlayerHUD();
        savePlayerLocal();
        showToast(`[${lastCatchData.fish.name}] отпущен(а) обратно в озеро (+5 XP)`);
      });
    }



window.failFishing = failFishing;
window.winFishing = winFishing;
window.drawPreviewFish = drawPreviewFish;
