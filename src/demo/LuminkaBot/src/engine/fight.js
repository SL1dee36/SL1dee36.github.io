/* ==========================================================
   LUMIBOT FISHING - FIGHT.JS
   Мини-игра вываживания, натяжение лески, стамина рыбы и прицел
   ========================================================== */

/* ==========================================================
   ЛОГИКА МИНИ-ИГРЫ ВЫВАЖИВАНИЯ (УТОМЛЕНИЕ И ПАРИРОВАНИЕ РЫВКОВ)
   ========================================================== */
const reelBtn = document.getElementById("reelBtn");
const fightTouchZone = document.getElementById("fightTouchZone");
const fishFightTargetEl = document.getElementById("fishFightTarget");
const rodControlReticleEl = document.getElementById("rodControlReticle");
const fightPromptEl = document.getElementById("fightStatePrompt");
const fightPromptTextEl = document.getElementById("fightPromptText");
const targetLockLabelEl = document.getElementById("targetLockLabel");
const staminaProgressBarEl = document.getElementById("staminaProgressBar");
const staminaProgressTextEl = document.getElementById("staminaProgressText");
const tensionBarEl = document.getElementById("tensionBar");
const tensionNeedleEl = document.getElementById("tensionNeedle");
const catchProgressBarEl = document.getElementById("catchProgressBar");
const catchProgressTextEl = document.getElementById("catchProgressText");

let lastTensionInt = -1;
let lastProgressInt = -1;
let lastStaminaInt = -1;
let lastTargetTransform = "";
let lastReticleTransform = "";

function setReelHold(holding) {
  if (gameState !== "REELING") return;
  isReelHolding = holding;
  if (holding) {
    reelBtn.classList.add("holding");
    sound.playReelClick();
    triggerHaptic("light");
  } else {
    reelBtn.classList.remove("holding");
  }
}

reelBtn.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  setReelHold(true);
});
window.addEventListener("pointerup", () => setReelHold(false));
window.addEventListener("pointercancel", () => setReelHold(false));

let dangerTimer = 0;
let slackTimer = 0;

// Переменные состояния динамической борьбы и выносливости рыбы
let fishStamina = 100;
let fishFightPhase = "FIGHTING"; // "FIGHTING" | "TIRED"
let targetRingX = 0;
let targetRingY = 0;
let targetVelocityX = 0;
let targetVelocityY = 0;
let targetWaypointTimer = 0;
let playerControlX = 0;
let playerControlY = 0;
let isTargetLocked = false;
let tiredTimer = 0;
let fightHapticTimer = 0;
let fightFatigueAcc = 0;
let fightFatigueTimer = 0;

function flushPendingFightFatigue() {
  if (fightFatigueAcc > 0 && typeof addPlayerFatigue === 'function') {
    addPlayerFatigue(fightFatigueAcc);
  }
  fightFatigueAcc = 0;
  fightFatigueTimer = 0;
}
window.flushPendingFightFatigue = flushPendingFightFatigue;

function updatePlayerControlPos(clientX, clientY) {
  if (gameState !== "REELING") return;
  const localX = clientX - (canvasLeft + gameArea.left);
  const localY = clientY - (canvasTop + gameArea.top);
  playerControlX = Math.max(25, Math.min(gameArea.width - 25, localX));
  playerControlY = Math.max(gameArea.height * 0.35, Math.min(gameArea.height * 0.82, localY));
}

if (fightTouchZone) {
  fightTouchZone.addEventListener("pointerdown", (e) => {
    try {
      e.target.setPointerCapture(e.pointerId);
    } catch (_) { }
    updatePlayerControlPos(e.clientX, e.clientY);
  });
  fightTouchZone.addEventListener("pointermove", (e) => {
    if (e.buttons > 0 || e.pointerType === "touch" || e.pointerType === "pen") {
      updatePlayerControlPos(e.clientX, e.clientY);
    }
  }, { passive: true });
}

window.addEventListener("pointermove", (e) => {
  if (gameState === "REELING") {
    if (e.target !== reelBtn && !reelBtn.contains(e.target)) {
      updatePlayerControlPos(e.clientX, e.clientY);
    }
  }
}, { passive: true });

function startReelingPhase() {
  gameState = "REELING";
  tension = 45;
  catchProgress = 15;
  dangerTimer = 0;
  slackTimer = 0;
  fishFightDir = 1;
  fishFightIntensity = 1.0;
  fishFightChangeTimer = 0;

  const roll = rollFish();
  activeFish = roll.fish;
  activeFishWeight = roll.weight;
  window.activeFish = roll.fish;
  window.activeFishWeight = roll.weight;

  // Списание 1 единицы наживки при хватке рыбы
  if (player && player.baits && typeof player.baits[currentBaitKey] === 'number') {
    player.baits[currentBaitKey] = Math.max(0, player.baits[currentBaitKey] - 1);
    if (typeof savePlayerLocal === 'function') savePlayerLocal();
    if (typeof renderBaitsUI === 'function') renderBaitsUI();
  }

  // Инициализация утомления и координат
  fishStamina = 100;
  fishFightPhase = "FIGHTING";
  tiredTimer = 0;
  fightFatigueAcc = 0;
  fightFatigueTimer = 0;
  isTargetLocked = false;
  fightHapticTimer = 0;
  lastTensionInt = -1;
  lastProgressInt = -1;
  lastStaminaInt = -1;
  lastTargetTransform = "";
  lastReticleTransform = "";

  targetRingX = gameArea.width * 0.5;
  targetRingY = gameArea.height * 0.56;
  targetVelocityX = (Math.random() > 0.5 ? 1 : -1) * 70;
  targetVelocityY = (Math.random() - 0.5) * 35;
  targetWaypointTimer = 0;

  playerControlX = gameArea.width * 0.5;
  playerControlY = gameArea.height * 0.56;

  fishVisual.x = bobber.x;
  fishVisual.y = bobber.y + 50;
  fishVisual.color = activeFish.color;

  if (staminaProgressBarEl) staminaProgressBarEl.style.width = "100%";
  if (staminaProgressTextEl) staminaProgressTextEl.textContent = "100%";
  if (fightPromptEl) fightPromptEl.classList.remove("tired");
  if (fightPromptTextEl) fightPromptTextEl.textContent = "РЫВОК! УДЕРЖИВАЙ РЫБУ!";
  if (reelBtn) reelBtn.classList.remove("highlight-pull");
  if (fishFightTargetEl) {
    fishFightTargetEl.style.transform = `translate3d(${targetRingX}px, ${targetRingY}px, 0)`;
    fishFightTargetEl.classList.remove("tired", "locked-on");
  }
  if (rodControlReticleEl) {
    rodControlReticleEl.style.transform = `translate3d(${playerControlX}px, ${playerControlY}px, 0)`;
    rodControlReticleEl.classList.remove("locked-on");
  }

  document.getElementById("reelingOverlay").classList.add("active");
  triggerHaptic("heavy");
  showToast("Рыба на крючке! Удерживай кончик удочки на рыбе!");
}

function updateReeling(dt) {
  const rod = RODS[player.rodId] || RODS.bamboo;
  const line = LINES[player.lineId] || LINES.mono;
  const safeMin = (rod && typeof rod.safeZoneMin === 'number') ? rod.safeZoneMin : 25;
  const safeMax = (rod && typeof rod.safeZoneMax === 'number') ? rod.safeZoneMax : 75;

  const aggroMult = (activeFish && activeFish.aggroMultiplier) ? activeFish.aggroMultiplier : 1.0;
  const combatStyle = (activeFish && activeFish.combatStyle) ? activeFish.combatStyle : 'standard';

  // Интенсивность рывков зависит от редкости рыбы и коэффициента агрессии
  const rarityMultiplier = ({
    Common: 1.0,
    Rare: 1.25,
    Epic: 1.55,
    Legendary: 1.95
  }[activeFish ? activeFish.rarity : "Common"] || 1.0) * aggroMult;

  // Плавное повышение сложности в зависимости от уровня игрока (Requirement 3)
  const levelDifficulty = 1.0 + Math.min(Math.max(0, (player.level || 1) - 1), 10) * 0.05;
  const totalDifficulty = rarityMultiplier * levelDifficulty;

  // Requirement 6: Накопление усталости игрока в процессе вываживания (батчинг 4 раза/сек)
  if (typeof addPlayerFatigue === 'function') {
    const fightFatigueRate = (0.5 + totalDifficulty * 0.7 + (tension > 75 ? 0.6 : 0)) * dt;
    fightFatigueAcc += fightFatigueRate;
    fightFatigueTimer += dt;
    if (fightFatigueTimer >= 0.25) {
      addPlayerFatigue(fightFatigueAcc);
      fightFatigueAcc = 0;
      fightFatigueTimer = 0;
    }
  }

  // Requirement 6: При усталости >90% руки слабеют: появляется тремор прицела и штраф к подмотке
  const isWeakHands = (player && typeof player.fatigue === 'number' && player.fatigue >= 90);
  if (isWeakHands) {
    const tremorStrength = ((player.fatigue - 90) / 10) * 40;
    const timeVal = Date.now() * 0.012;
    playerControlX += (Math.sin(timeVal * 1.5) + Math.cos(timeVal * 2.1)) * tremorStrength * dt;
    playerControlY += (Math.cos(timeVal * 1.7) - Math.sin(timeVal * 2.3)) * tremorStrength * dt;
  }
  const fatiguePenalty = isWeakHands ? 0.65 : 1.0;

  // Рыба периодически меняет направление тяги для визуализации
  fishFightChangeTimer -= dt;
  if (fishFightChangeTimer <= 0) {
    fishFightDir = (Math.random() > 0.5 ? 1 : -1);
    fishFightIntensity = (0.8 + Math.random() * 0.8) * totalDifficulty;
    if (combatStyle === 'death_roll') {
      fishFightChangeTimer = 0.25 + Math.random() * 0.4;
    } else {
      fishFightChangeTimer = (0.7 + Math.random() * 1.3) / Math.max(0.7, aggroMult);
    }
  }

  // --- ЛОГИКА ФАЗЫ БОРЬБЫ И УТОМЛЕНИЯ ---
  if (fishFightPhase === "FIGHTING") {
    targetWaypointTimer -= dt;
    if (targetWaypointTimer <= 0) {
      const angle = Math.random() * Math.PI * 2;
      const baseSpeed = (120 + Math.random() * 90) * totalDifficulty;
      targetVelocityX = Math.cos(angle) * baseSpeed;
      targetVelocityY = Math.sin(angle) * (baseSpeed * 0.55);
      targetWaypointTimer = (0.45 + Math.random() * 0.75) / Math.max(0.8, totalDifficulty * 0.7);
      if (Math.random() < 0.35) {
        createSplash(targetRingX, targetRingY, 4);
      }
    }

    targetRingX += targetVelocityX * dt;
    targetRingY += targetVelocityY * dt;

    // Границы маневрирования по озеру внутри игровой зоны
    const minX = gameArea.width * 0.18;
    const maxX = gameArea.width * 0.82;
    const minY = gameArea.height * 0.46;
    const maxY = gameArea.height * 0.68;

    if (targetRingX < minX) { targetRingX = minX; targetVelocityX = Math.abs(targetVelocityX); }
    if (targetRingX > maxX) { targetRingX = maxX; targetVelocityX = -Math.abs(targetVelocityX); }
    if (targetRingY < minY) { targetRingY = minY; targetVelocityY = Math.abs(targetVelocityY); }
    if (targetRingY > maxY) { targetRingY = maxY; targetVelocityY = -Math.abs(targetVelocityY); }

    // Проверка дистанции между прицелом удилища и целью
    const distToFish = Math.hypot(playerControlX - targetRingX, playerControlY - targetRingY);
    const lockRadius = 58 + (safeMax - safeMin) * 0.25;
    isTargetLocked = distToFish <= lockRadius;
    const accuracy = isTargetLocked ? Math.max(0, 1 - (distToFish / lockRadius)) : 0;

    if (isTargetLocked) {
      // Игрок удерживает рыбу в зеленом кружке:
      // 1. Натяжение плавно увеличивается и уменьшается в безопасной зоне (живое дыхание лески и сопротивление рыбы)
      const safeCenter = (safeMin + safeMax) / 2;
      const waveAmp = (safeMax - safeMin) * 0.26;
      const dynamicWave = Math.sin(Date.now() * 0.0055) * waveAmp;
      const targetTension = safeCenter + dynamicWave + (isReelHolding ? 16 : 0);
      tension += (targetTension - tension) * 4.8 * dt;

      // Сбрасываем таймеры срыва и обрыва: пока игрок держит прицел, рыба не срывается!
      slackTimer = Math.max(0, slackTimer - dt * 4);
      dangerTimer = Math.max(0, dangerTimer - dt * 4);

      // 2. Чем лучше игрок держит прицел (accuracy от 0 до 1), тем выше прирост процента вылова!
      const progressGain = (15 + 24 * accuracy) * (rod.speedBonus || 1.0) * fatiguePenalty * dt + (isReelHolding ? 12 * (rod.speedBonus || 1.0) * fatiguePenalty * dt : 0);
      catchProgress += progressGain;

      // 3. Выносливость рыбы стремительно тает при точной фиксации
      const drainSpeed = (22 + 30 * accuracy) * (rod.speedBonus || 1.0) / Math.max(0.7, aggroMult * 0.8);
      fishStamina -= drainSpeed * dt;

      fightHapticTimer -= dt;
      if (fightHapticTimer <= 0) {
        triggerHaptic("light");
        fightHapticTimer = 0.26;
        if (Math.random() < 0.4) sound.playReelClick();
      }

      const accPct = Math.round(accuracy * 100);
      if (targetLockLabelEl) targetLockLabelEl.textContent = `🎯 УДЕРЖАНИЕ ${accPct}%`;
      if (fightPromptEl) fightPromptEl.classList.remove("tired");
      if (fightPromptTextEl) {
        if (isWeakHands) {
          fightPromptTextEl.textContent = "⚠️ РУКИ СЛАБЕЮТ! ТЯЖЕЛО УДЕРЖИВАТЬ УДОЧКУ!";
        } else {
          fightPromptTextEl.textContent = `В ЗОНЕ! ВЫВАЖИВАНИЕ (+${accPct}%)`;
        }
      }

      if (fishStamina <= 0) {
        fishStamina = 0;
        fishFightPhase = "TIRED";
        // Окно передышки (сокращается с ростом сложности)
        tiredTimer = Math.max(2.6, 5.2 - (totalDifficulty - 1.0) * 1.5);
        triggerHaptic("medium");
        sound.playSuccess();
        if (fightPromptEl) fightPromptEl.classList.add("tired");
        if (fightPromptTextEl) fightPromptTextEl.textContent = "РЫБА ВЫДОХЛАСЬ! ТЯНИ!";
        if (reelBtn) reelBtn.classList.add("highlight-pull");
        if (targetLockLabelEl) targetLockLabelEl.textContent = "ВЫДОХЛАСЬ";
        showToast("Рыба выдохлась! Крути катушку!");
      }
    } else {
      // Прицел упущен: рыба совершает рывок в сторону!
      tension += (24 * totalDifficulty) * dt;
      if (isReelHolding) {
        tension += 18 * dt;
      } else {
        tension -= 12 * dt;
      }

      // Прогресс вылова плавно теряется при потере рыбы
      catchProgress -= 4.5 * dt;
      fishStamina = Math.min(100, fishStamina + 2 * dt);

      if (targetLockLabelEl) targetLockLabelEl.textContent = "РЫВОК!";
      if (fightPromptEl) fightPromptEl.classList.remove("tired");
      if (fightPromptTextEl) fightPromptTextEl.textContent = "РЫВОК! ВЕРНИ УДОЧКУ К РЫБЕ!";
    }
  } else if (fishFightPhase === "TIRED") {
    // Фаза истощения рыбы: натяжение мягко покачивается в центре
    targetVelocityX *= 0.88;
    targetVelocityY *= 0.88;
    targetRingX += (bobber.x - targetRingX) * 0.06;
    targetRingY += (bobber.y + 35 - targetRingY) * 0.06;

    const safeCenter = (safeMin + safeMax) / 2;
    const targetTension = safeCenter + Math.sin(Date.now() * 0.004) * 8 + (isReelHolding ? 16 : -4);
    tension += (targetTension - tension) * 4.0 * dt;

    slackTimer = 0;
    dangerTimer = Math.max(0, dangerTimer - dt * 3);

    // В фазе усталости удерживание прицела или кнопки дает мощнейший прирост подмотки
    const pullSpeed = (isReelHolding ? 32 : 18) * fatiguePenalty;
    catchProgress += (pullSpeed * (rod.speedBonus || 1.0)) * dt;
    if (isReelHolding && Math.random() < 0.25) sound.playReelClick();

    tiredTimer -= dt;
    if (tiredTimer <= 0) {
      // Рыба восстанавливает дыхание и снова рвется в бой
      fishFightPhase = "FIGHTING";
      fishStamina = Math.min(75, 40 + Math.random() * 25 * rarityMultiplier);
      targetWaypointTimer = 0;
      triggerHaptic("heavy");
      sound.playBite();
      createSplash(targetRingX, targetRingY, 7);
      if (fightPromptEl) fightPromptEl.classList.remove("tired");
      if (fightPromptTextEl) fightPromptTextEl.textContent = "НОВЫЙ РЫВОК! УДЕРЖИВАЙ РЫБУ!";
      if (reelBtn) reelBtn.classList.remove("highlight-pull");
      showToast("Рыба снова рванула! Держи кончик удочки!");
    }
  }

  // Ограничители шкалы (0..100)
  tension = Math.max(0, Math.min(100, tension));
  catchProgress = Math.max(0, Math.min(100, catchProgress));

  // Буфер защиты от обрыва/срыва: тикает ТОЛЬКО когда игрок потерял рыбу
  const maxDangerTime = line.dangerBuffer;
  if (!isTargetLocked && fishFightPhase !== "TIRED") {
    if (tension >= 95) {
      dangerTimer += dt;
      if (dangerTimer > maxDangerTime) {
        failFishing("Обрыв лески! Слишком долго удерживали критическое натяжение!");
        return;
      }
    } else {
      dangerTimer = Math.max(0, dangerTimer - dt * 2);
    }

    if (tension <= 5) {
      slackTimer += dt;
      if (slackTimer > maxDangerTime) {
        failFishing("Срыв крючка! Леска провисла при потере рыбы!");
        return;
      }
    } else {
      slackTimer = Math.max(0, slackTimer - dt * 2);
    }
  } else {
    dangerTimer = Math.max(0, dangerTimer - dt * 3);
    slackTimer = Math.max(0, slackTimer - dt * 3);
  }

  // Обновление UI (с мемоизацией для устранения мутаций DOM вхолостую)
  const tensionInt = Math.round(tension);
  if (tensionInt !== lastTensionInt) {
    lastTensionInt = tensionInt;
    if (tensionBarEl) tensionBarEl.style.height = `${tensionInt}%`;
    if (tensionNeedleEl) tensionNeedleEl.style.bottom = `${tensionInt}%`;
  }

  const progressInt = Math.round(catchProgress);
  if (progressInt !== lastProgressInt) {
    lastProgressInt = progressInt;
    if (catchProgressBarEl) catchProgressBarEl.style.width = `${progressInt}%`;
    if (catchProgressTextEl) catchProgressTextEl.textContent = `${progressInt}%`;
  }

  const staminaInt = Math.round(Math.max(0, Math.min(100, fishStamina)));
  if (staminaInt !== lastStaminaInt) {
    lastStaminaInt = staminaInt;
    if (staminaProgressBarEl) staminaProgressBarEl.style.width = `${staminaInt}%`;
    if (staminaProgressTextEl) staminaProgressTextEl.textContent = `${staminaInt}%`;
  }

  const targetTrans = `translate3d(${targetRingX.toFixed(1)}px, ${targetRingY.toFixed(1)}px, 0)`;
  if (targetTrans !== lastTargetTransform && fishFightTargetEl) {
    lastTargetTransform = targetTrans;
    fishFightTargetEl.style.transform = targetTrans;
  }
  const reticleTrans = `translate3d(${playerControlX.toFixed(1)}px, ${playerControlY.toFixed(1)}px, 0)`;
  if (reticleTrans !== lastReticleTransform && rodControlReticleEl) {
    lastReticleTransform = reticleTrans;
    rodControlReticleEl.style.transform = reticleTrans;
  }

  if (fishFightTargetEl) {
    fishFightTargetEl.classList.toggle("locked-on", isTargetLocked && fishFightPhase === "FIGHTING");
    fishFightTargetEl.classList.toggle("tired", fishFightPhase === "TIRED");
  }
  if (rodControlReticleEl) {
    rodControlReticleEl.classList.toggle("locked-on", isTargetLocked && fishFightPhase === "FIGHTING");
  }

  // Физика процедурной рыбы в воде внутри игровой зоны
  fishVisual.tailOsc += 8 * dt * fishFightIntensity;
  const worldTargetX = gameArea.left + targetRingX;
  const worldTargetY = gameArea.top + targetRingY;
  fishVisual.x += (worldTargetX - fishVisual.x) * 0.12;
  fishVisual.y = worldTargetY + Math.sin(fishVisual.tailOsc) * 8;
  fishVisual.angle = (fishFightDir * 0.35) + Math.sin(fishVisual.tailOsc) * 0.15;
  bobber.x = fishVisual.x;
  bobber.y = fishVisual.y;

  // Проверка победы (100%)
  if (catchProgress >= 100) {
    winFishing();
  }
}

// Фаза поклёвки
function triggerNibble() {
  if (gameState !== "WAITING") return;
  gameState = "NIBBLE";
  if (typeof showLureTwitchButton === 'function') showLureTwitchButton(false);

  if (currentFishingMethod === "feeder") {
    sound.playFeederBell();
    triggerHaptic("heavy");
    showToast("ДЗИНЬ! ПОКЛЁВКА НА ДОНКУ! ПОДСЕКАЙ!");
  } else if (currentFishingMethod === "spinning") {
    sound.playBite();
    triggerHaptic("heavy");
    createSplash(bobber.x, bobber.y, 8);
    showToast("УДАР ХИЩНИКА! ПОДСЕКАЙ!");
  } else if (currentFishingMethod === "fly") {
    sound.playFlyStrike();
    triggerHaptic("heavy");
    createSplash(bobber.x, bobber.y, 6);
    showToast("ВСПЛЕСК! ХВАТКА НА МУШКУ!");
  } else {
    sound.playBite();
    triggerHaptic("heavy");
    createSplash(bobber.x, bobber.y, 4);
    showToast("КЛЮЁТ! ПОПЛАВОК ПОТОНУЛ!");
  }

  // Окно для подсечки (1.5 сек) или авто-старт
  setTimeout(() => {
    if (gameState === "NIBBLE") {
      startReelingPhase();
    }
  }, 1000);
}


