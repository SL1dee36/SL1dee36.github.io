/* ==========================================================
   LUMIBOT FISHING - PHYSICS.JS
   Обработка жестов заброса удочки и игровая математика
   ========================================================== */

/* ==========================================================
   ОБРАБОТКА ЖЕСТОВ (СВАЙП ЗАБРОСА)
   ========================================================== */
let touchStartY = 0;
let touchStartX = 0;
let touchStartTime = 0;

function handleStart(x, y) {
  if (gameState !== "IDLE") return;
  touchStartX = x;
  touchStartY = y;
  touchStartTime = Date.now();
}

function handleEnd(x, y) {
  if (gameState !== "IDLE") return;
  const dy = touchStartY - y;
  const dx = x - touchStartX;
  const dt = Math.max(1, Date.now() - touchStartTime);

  // Свайп снизу вверх (dy > 40px)
  if (dy > 50 && dt < 600) {
    const velocity = dy / dt;
    executeCast(velocity, dx);
  }
}

canvas.addEventListener("touchstart", (e) => {
  const t = e.touches[0];
  handleStart(t.clientX, t.clientY);
}, { passive: true });

canvas.addEventListener("touchend", (e) => {
  const t = e.changedTouches[0];
  handleEnd(t.clientX, t.clientY);
}, { passive: true });

canvas.addEventListener("mousedown", (e) => handleStart(e.clientX, e.clientY));
canvas.addEventListener("mouseup", (e) => handleEnd(e.clientX, e.clientY));

function executeCast(velocity, dx) {
  // Проверка запаса выбранной наживки
  const baitCount = (player && player.baits && typeof player.baits[currentBaitKey] === 'number')
    ? player.baits[currentBaitKey]
    : 0;

  if (baitCount <= 0) {
    const baitObj = (typeof BAITS !== 'undefined' && BAITS[currentBaitKey]) ? BAITS[currentBaitKey] : null;
    const baitName = baitObj ? baitObj.name : "Наживка";
    // Requirement 5: Убрано открытие торговца из панели снастей
    showToast(`Наживка «${baitName}» закончилась! Пополните запасы в Хижине.`);
    triggerHaptic("error");
    return;
  }

  // Requirement 6: Каждый заброс повышает усталость игрока (+2.5%)
  if (typeof addPlayerFatigue === 'function') {
    addPlayerFatigue(2.5);
  }

  gameState = "CASTING";
  document.getElementById("swipeHint").style.display = "none";
  document.getElementById("bottomBar").style.display = "none";
  if (typeof showLureTwitchButton === 'function') showLureTwitchButton(false);

  triggerHaptic("light");

  const power = Math.min(Math.max(velocity, 0.3), 2.0);
  bobber.startX = gameArea.left + gameArea.width * 0.78;
  bobber.startY = gameArea.top + gameArea.height * 0.76;

  // Нормализуем силу от 0 до 1
  const normPower = Math.min(1, Math.max(0, (power - 0.3) / 1.5));

  // Водная гладь строго в пределах игровой зоны по вертикали
  const waterNear = gameArea.top + gameArea.height * 0.70;
  const waterFar = gameArea.top + gameArea.height * 0.50;
  bobber.targetY = waterNear - normPower * (waterNear - waterFar);

  // Горизонталь в пределах 25% .. 75% ширины игровой зоны
  const centerX = gameArea.left + gameArea.width * 0.5;
  bobber.targetX = Math.min(Math.max(centerX + dx * 0.4, gameArea.left + gameArea.width * 0.25), gameArea.left + gameArea.width * 0.75);

  bobber.arcHeight = 70 + normPower * 80;
  bobber.progress = 0;
  bobber.flightDuration = Math.round(35 + normPower * 15);

  if (currentFishingMethod === "spinning") {
    showToast("Заброс спиннинговой приманки...");
  } else if (currentFishingMethod === "feeder") {
    showToast("Заброс тяжелой донной кормушки...");
  } else if (currentFishingMethod === "fly") {
    showToast("Взмах шнура, летит мушка...");
  } else {
    showToast("Летит поплавок...");
  }
}

// Интерактивная проводка (твичинг) для спиннинга
window.onLureTwitch = function () {
  if (gameState !== "WAITING" || currentFishingMethod !== "spinning") return;
  sound.playSpinningReel();
  triggerHaptic("medium");

  // Блеск и вспышки блесны в воде
  for (let i = 0; i < 6; i++) {
    particles.push({
      x: bobber.x + (Math.random() - 0.5) * 18,
      y: bobber.y + (Math.random() - 0.5) * 10,
      vx: (Math.random() - 0.5) * 3,
      vy: -1 - Math.random() * 2,
      rad: 1.5 + Math.random() * 2,
      life: 0.6,
      color: "#fef08a"
    });
  }

  showToast("Твич! Игра блесны в толще воды...");

  // 45% шанс спровоцировать хищника на немедленный рывок
  if (Math.random() < 0.45) {
    clearTimeout(stateTimer);
    stateTimer = setTimeout(() => {
      triggerNibble();
    }, 260);
  }
};

/* ==========================================================
   ВЫБОР РЫБЫ И ИГРОВАЯ МАТЕМАТИКА
   ========================================================== */
function rollFish() {
  if (typeof EntityGenerator !== 'undefined') {
    const rolled = EntityGenerator.rollCatch(currentFishingMethod, currentBaitKey);
    if (rolled) {
      return { fish: rolled, weight: rolled.weight };
    }
  }

  // Запасной fallback
  const fallback = (typeof FISH_DATABASE !== 'undefined' && FISH_DATABASE.length)
    ? FISH_DATABASE[0]
    : { id: 1, name: "Карась серебряный", rarity: "Common", min_weight: 0.15, max_weight: 1.20, base_price: 25, color: "#94a3b8", bodyType: 0 };
  return { fish: fallback, weight: 0.5 };
}



window.rollFish = rollFish;
