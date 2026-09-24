/* ==========================================================
   LUMIBOT FISHING - FISHER.JS
   Игровой движок, физика рыбалки и Canvas-рендеринг
   ========================================================== */

/* ==========================================================
   CANVAS И РЕНДЕРИНГ МИРА
   ========================================================== */
const canvas = document.getElementById("fishCanvas");
const ctx = canvas.getContext("2d");
let dpr = window.devicePixelRatio || 1;
let width = 0;
let height = 0;

function resizeCanvas() {
  dpr = window.devicePixelRatio || 1;
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.resetTransform?.();
  ctx.scale(dpr, dpr);
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// Состояния игры: IDLE, CASTING, WAITING, NIBBLE, REELING, CAUGHT
gameState = "IDLE";
let stateTimer = 0;

// Параметры поплавка и заброса
const bobber = {
  x: 0,
  y: 0,
  targetX: 0,
  targetY: 0,
  startX: 0,
  startY: 0,
  arcHeight: 120,
  progress: 0,
  flightDuration: 60,
  submerged: false,
  sinkOffset: 0,
  bobAngle: 0
};

// Физика вываживания
let tension = 50; // 0..100
let catchProgress = 0; // 0..100
let isReelHolding = false;
let fishFightDir = 1;
let fishFightIntensity = 1;
let fishFightChangeTimer = 0;

// Текущая пойманная рыба
let activeFish = null;
let activeFishWeight = 0;

// Процедурная рыба в воде
const fishVisual = {
  x: 0,
  y: 0,
  angle: 0,
  tailOsc: 0,
  length: 70,
  width: 25,
  color: "#38bdf8"
};

// Брызги и частицы
const particles = [];
const underwaterBubbles = [];
const surfaceRipples = [];

function spawnBubble(x, y, type = "ambient", customSpeed = null) {
  const radius = type === "ambient" ? (1.5 + Math.random() * 2.0) : (1.0 + Math.random() * 1.6);
  const speedY = customSpeed !== null ? customSpeed : (16 + Math.random() * 20);
  underwaterBubbles.push({
    baseX: x,
    y: y,
    radius: radius,
    speedY: speedY,
    wobblePhase: Math.random() * Math.PI * 2,
    wobbleFreq: 2 + Math.random() * 3,
    wobbleAmp: 1.2 + Math.random() * 2.0,
    alpha: 0.6 + Math.random() * 0.35
  });
}

function createSplash(x, y, count = 8) {
  sound.playSplash();
  for (let i = 0; i < count; i++) {
    const angle = Math.PI + (Math.random() - 0.5) * Math.PI * 1.2;
    const spd = 2 + Math.random() * 5;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd,
      rad: 2 + Math.random() * 3,
      life: 1.0,
      color: "rgba(224, 242, 254, 0.8)"
    });
  }
  scareAmbientFishes(x, y);
}

/* ==========================================================
   ЖИВЫЕ РЫБКИ В ВОДЕ (AMBIENT LIVING FISHES)
   ========================================================== */
const ambientFishes = [];
const AMBIENT_FISH_COUNT = 9;

function initAmbientFishes() {
  ambientFishes.length = 0;
  for (let i = 0; i < AMBIENT_FISH_COUNT; i++) {
    let type = 0;
    if (i === 0) {
      type = 2; // Редкая Золотая Рыбка (светящаяся)
    } else if (i === 1 || i === 2) {
      type = 1; // Глубинный хищник (темный силуэт)
    }

    const dir = Math.random() > 0.5 ? 1 : -1;
    const depthRel = 0.46 + Math.random() * 0.42;

    let length = 18 + Math.random() * 10;
    let bodyWidth = 6 + Math.random() * 4;
    let color = "#38bdf8";
    let baseSpeed = 0.35 + Math.random() * 0.35;
    let alpha = 0.35 + Math.random() * 0.2;

    if (type === 1) {
      length = 42 + Math.random() * 16;
      bodyWidth = 12 + Math.random() * 5;
      color = "#1e293b";
      baseSpeed = 0.18 + Math.random() * 0.18;
      alpha = 0.28;
    } else if (type === 2) {
      length = 26;
      bodyWidth = 11;
      color = "#fbbf24";
      baseSpeed = 0.32;
      alpha = 0.75;
    }

    ambientFishes.push({
      type,
      x: Math.random() * (width || 400),
      depthRel,
      y: depthRel * (height || 800),
      dir,
      speed: baseSpeed,
      baseSpeed,
      length,
      bodyWidth,
      color,
      alpha,
      tailOsc: Math.random() * Math.PI * 2,
      tailSpeed: 3.5 + Math.random() * 3,
      scaredTimer: 0
    });
  }
}

function scareAmbientFishes(splashX, splashY) {
  for (const f of ambientFishes) {
    const dx = f.x - splashX;
    const dy = f.y - splashY;
    const dist = Math.hypot(dx, dy);
    if (dist < 180) {
      f.scaredTimer = 2.4;
      f.dir = dx < 0 ? -1 : 1;
      f.speed = f.baseSpeed * 3.6;
    }
  }
}

function updateAndDrawAmbientFishes(dt) {
  for (const f of ambientFishes) {
    if (f.scaredTimer > 0) {
      f.scaredTimer -= dt;
      if (f.scaredTimer <= 0) {
        f.speed = f.baseSpeed;
      }
    }

    f.tailOsc += f.tailSpeed * (f.speed / f.baseSpeed) * dt * 4;
    f.x += f.dir * f.speed * 60 * dt;

    if (f.dir > 0 && f.x > width + 60) {
      f.x = -50;
      f.depthRel = 0.46 + Math.random() * 0.42;
    } else if (f.dir < 0 && f.x < -60) {
      f.x = width + 50;
      f.depthRel = 0.46 + Math.random() * 0.42;
    }

    const waveBob = Math.sin(f.tailOsc * 0.4) * 4;
    f.y = f.depthRel * height + waveBob;

    ctx.save();
    ctx.translate(f.x, f.y);
    if (f.dir < 0) {
      ctx.scale(-1, 1);
    }

    if (f.type === 2) {
      ctx.shadowColor = "#fbbf24";
      ctx.shadowBlur = 16;
    } else if (f.type === 1) {
      ctx.shadowColor = "#0f172a";
      ctx.shadowBlur = 6;
    }

    ctx.globalAlpha = f.alpha;

    // Тело
    ctx.fillStyle = f.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, f.length * 0.5, f.bodyWidth * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Спинной плавник
    ctx.fillStyle = f.color;
    ctx.beginPath();
    ctx.moveTo(-f.length * 0.1, -f.bodyWidth * 0.45);
    ctx.lineTo(-f.length * 0.35, -f.bodyWidth * 0.9);
    ctx.lineTo(-f.length * 0.4, -f.bodyWidth * 0.3);
    ctx.closePath();
    ctx.fill();

    // Хвост
    const tailX = -f.length * 0.5;
    const tailY = Math.sin(f.tailOsc) * (f.bodyWidth * 0.7);
    ctx.beginPath();
    ctx.moveTo(tailX * 0.8, 0);
    ctx.lineTo(tailX - f.length * 0.35, tailY - f.bodyWidth * 0.6);
    ctx.lineTo(tailX - f.length * 0.25, tailY);
    ctx.lineTo(tailX - f.length * 0.35, tailY + f.bodyWidth * 0.6);
    ctx.closePath();
    ctx.fill();

    // Глаз
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(f.length * 0.32, -f.bodyWidth * 0.15, Math.max(1, f.bodyWidth * 0.15), 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

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
  gameState = "CASTING";
  document.getElementById("swipeHint").style.display = "none";
  document.getElementById("bottomBar").style.display = "none";
  if (typeof showLureTwitchButton === 'function') showLureTwitchButton(false);

  triggerHaptic("light");

  const power = Math.min(Math.max(velocity, 0.3), 2.0);
  bobber.startX = width * 0.78;
  bobber.startY = height * 0.76;

  // Нормализуем силу от 0 до 1
  const normPower = Math.min(1, Math.max(0, (power - 0.3) / 1.5));

  // Водная гладь строго от 50% до 72% высоты экрана
  const waterNear = height * 0.70;
  const waterFar = height * 0.50;
  bobber.targetY = waterNear - normPower * (waterNear - waterFar);

  // Горизонталь в пределах 25% .. 75% ширины экрана
  bobber.targetX = Math.min(Math.max(width * 0.5 + dx * 0.4, width * 0.25), width * 0.75);

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

/* ==========================================================
   ЛОГИКА МИНИ-ИГРЫ ВЫВАЖИВАНИЯ
   ========================================================== */
const reelBtn = document.getElementById("reelBtn");

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

function startReelingPhase() {
  gameState = "REELING";
  tension = 45;
  catchProgress = 20;
  dangerTimer = 0;
  slackTimer = 0;
  fishFightDir = 1;
  fishFightIntensity = 1.0;
  fishFightChangeTimer = 0;

  const roll = rollFish();
  activeFish = roll.fish;
  activeFishWeight = roll.weight;

  fishVisual.x = bobber.x;
  fishVisual.y = bobber.y + 50;
  fishVisual.color = activeFish.color;

  document.getElementById("reelingOverlay").classList.add("active");
  triggerHaptic("heavy");
  showToast("Тяни рыбу! Держи в зелёной зоне!");
}

function updateReeling(dt) {
  const rod = RODS[player.rodId] || RODS.bamboo;
  const line = LINES[player.lineId] || LINES.mono;

  const aggroMult = (activeFish && activeFish.aggroMultiplier) ? activeFish.aggroMultiplier : 1.0;
  const combatStyle = (activeFish && activeFish.combatStyle) ? activeFish.combatStyle : 'standard';

  // Интенсивность рывков зависит от редкости рыбы и коэффициента агрессии
  const rarityMultiplier = ({
    Common: 1.0,
    Rare: 1.25,
    Epic: 1.5,
    Legendary: 1.8
  }[activeFish ? activeFish.rarity : "Common"] || 1.0) * aggroMult;

  // Рыба периодически меняет направление тяги
  fishFightChangeTimer -= dt;
  if (fishFightChangeTimer <= 0) {
    fishFightDir = (Math.random() > 0.5 ? 1 : -1);
    fishFightIntensity = (0.8 + Math.random() * 0.8) * rarityMultiplier;
    if (combatStyle === 'death_roll') {
      fishFightChangeTimer = 0.25 + Math.random() * 0.4; // частое вращение крокодила
    } else {
      fishFightChangeTimer = (0.8 + Math.random() * 1.5) / Math.max(0.7, aggroMult);
    }
  }

  // Плавное изменение натяжения (dt-базированное)
  if (isReelHolding) {
    tension += 35 * dt;
    if (Math.random() < 0.2) sound.playReelClick();
  } else {
    tension -= 28 * dt;
  }

  // Уникальные боевые стили сущностей
  let styleTensionDelta = 0;
  if (combatStyle === 'death_roll') {
    // Вращение крокодила: резкие синусоидальные скачки
    const rollSine = Math.sin(Date.now() * 0.014) * 18 * rarityMultiplier;
    styleTensionDelta = (fishFightDir * 20 * rarityMultiplier * dt) + (rollSine * dt);
  } else if (combatStyle === 'stone_sink') {
    // Уход камнем на дно: тяжелая постоянная тяга вниз к обрыву
    styleTensionDelta = (22 * rarityMultiplier * dt) + (Math.sin(Date.now() * 0.003) * 6 * dt);
  } else if (combatStyle === 'claw_snag') {
    // Зацеп клешнями/когтями: хаотичные микро-удары
    const snap = (Math.random() < 0.16 ? (Math.random() > 0.5 ? 26 : -22) : 0);
    styleTensionDelta = (snap * dt) + (fishFightDir * 12 * rarityMultiplier * dt);
  } else {
    // Стандартное поведение рыбы
    const fishSine = Math.sin(Date.now() * 0.004) * 8 * rarityMultiplier;
    styleTensionDelta = (fishFightDir * 14 * rarityMultiplier * dt) + (fishSine * dt);
  }

  tension += styleTensionDelta;

  // Ограничители шкалы (0..100)
  tension = Math.max(0, Math.min(100, tension));

  // Проверка безопасной зоны в зависимости от надетой удочки
  const safeMin = rod.safeZoneMin;
  const safeMax = rod.safeZoneMax;
  const isSafe = tension >= safeMin && tension <= safeMax;

  if (isSafe) {
    catchProgress += (13 * rod.speedBonus) * dt;
  } else {
    catchProgress -= 6 * dt;
  }
  catchProgress = Math.max(0, Math.min(100, catchProgress));

  // Буфер защиты от обрыва в зависимости от надетой лески
  const maxDangerTime = line.dangerBuffer;
  if (tension >= 95) {
    dangerTimer += dt;
    if (dangerTimer > maxDangerTime) {
      failFishing("Обрыв лески! Слишком долго удерживали натяжение!");
      return;
    }
  } else {
    dangerTimer = Math.max(0, dangerTimer - dt * 2);
  }

  if (tension <= 5) {
    slackTimer += dt;
    if (slackTimer > maxDangerTime) {
      failFishing("Срыв крючка! Леска слишком долго была провисшей!");
      return;
    }
  } else {
    slackTimer = Math.max(0, slackTimer - dt * 2);
  }

  // Обновление UI
  document.getElementById("tensionBar").style.height = `${tension}%`;
  document.getElementById("tensionNeedle").style.bottom = `${tension}%`;
  document.getElementById("catchProgressBar").style.width = `${catchProgress}%`;
  document.getElementById("catchProgressText").textContent = `${Math.round(catchProgress)}%`;

  // Физика процедурной рыбы в воде
  fishVisual.tailOsc += 8 * dt * fishFightIntensity;
  fishVisual.x += (bobber.x + fishFightDir * 35 - fishVisual.x) * 0.1;
  fishVisual.y = bobber.y + 40 + Math.sin(fishVisual.tailOsc) * 8;
  fishVisual.angle = (fishFightDir * 0.35) + Math.sin(fishVisual.tailOsc) * 0.15;

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

/* ==========================================================
   АТМОСФЕРА ДОМА И КАМИН
   ========================================================== */
let waveOffset = 0;
let lastFrameTime = performance.now();
let homeSceneTransition = 0.0;
let homeEmbers = [];

function initHomeEmbers() {
  homeEmbers = [];
  for (let i = 0; i < 28; i++) {
    homeEmbers.push({
      x: width * 0.5 + (Math.random() - 0.5) * 80,
      y: height * 0.76 + Math.random() * 30,
      vx: (Math.random() - 0.5) * 14,
      vy: -22 - Math.random() * 32,
      size: 1.5 + Math.random() * 2.5,
      maxLife: 1.4 + Math.random() * 1.6,
      life: Math.random() * 2
    });
  }
}

function renderHomeAtmosphere(ctx, w, h, dt) {
  if (homeEmbers.length === 0) initHomeEmbers();
  const now = performance.now();

  // 1. Бревенчатые стены хижины (Теплый глубокий градиент)
  const wallGrad = ctx.createLinearGradient(0, 0, 0, h * 0.72);
  wallGrad.addColorStop(0, '#1c120a');
  wallGrad.addColorStop(0.5, '#2b180d');
  wallGrad.addColorStop(1, '#381f10');
  ctx.fillStyle = wallGrad;
  ctx.fillRect(0, 0, w, h * 0.72);

  // Горизонтальные стыки брёвен
  const logHeight = 36;
  for (let y = logHeight; y < h * 0.72; y += logHeight) {
    ctx.fillStyle = 'rgba(10, 6, 3, 0.45)';
    ctx.fillRect(0, y, w, 3);
    ctx.fillStyle = 'rgba(254, 215, 170, 0.05)';
    ctx.fillRect(0, y + 3, w, 1);
  }

  // 2. Окно в ночной мир (слева)
  const winX = w * 0.08;
  const winY = h * 0.12;
  const winW = Math.min(130, w * 0.32);
  const winH = Math.min(120, h * 0.22);

  const nightSky = ctx.createLinearGradient(winX, winY, winX, winY + winH);
  nightSky.addColorStop(0, '#030712');
  nightSky.addColorStop(1, '#0c1a2e');
  ctx.fillStyle = nightSky;
  ctx.fillRect(winX, winY, winW, winH);

  // Звезды за окном
  const starCoords = [
    [0.2, 0.25], [0.35, 0.6], [0.55, 0.3], [0.75, 0.45], [0.85, 0.2], [0.45, 0.75]
  ];
  starCoords.forEach(([sx, sy], idx) => {
    const starAlpha = 0.3 + 0.7 * Math.sin(now * 0.003 + idx * 1.5);
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.1, starAlpha)})`;
    ctx.fillRect(winX + winW * sx, winY + winH * sy, 2, 2);
  });

  // Месяц
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.arc(winX + winW * 0.28, winY + winH * 0.35, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#050c18';
  ctx.beginPath();
  ctx.arc(winX + winW * 0.28 + 4, winY + winH * 0.35 - 2, 8, 0, Math.PI * 2);
  ctx.fill();

  // Деревянная рама окна
  ctx.strokeStyle = '#451a03';
  ctx.lineWidth = 4;
  ctx.strokeRect(winX, winY, winW, winH);
  ctx.beginPath();
  ctx.moveTo(winX + winW / 2, winY);
  ctx.lineTo(winX + winW / 2, winY + winH);
  ctx.moveTo(winX, winY + winH / 2);
  ctx.lineTo(winX + winW, winY + winH / 2);
  ctx.stroke();

  // 3. Стойка для удочек (на правой стене)
  const rackX = w * 0.74;
  const rackY = h * 0.16;
  ctx.fillStyle = '#451a03';
  ctx.fillRect(rackX, rackY, 6, 60);
  ctx.fillRect(rackX + 42, rackY, 6, 60);
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(rackX - 10, rackY + 20);
  ctx.lineTo(rackX + 56, rackY + 18);
  ctx.stroke();
  ctx.strokeStyle = '#0284c7';
  ctx.beginPath();
  ctx.moveTo(rackX - 14, rackY + 45);
  ctx.lineTo(rackX + 60, rackY + 43);
  ctx.stroke();

  // Настенный фонарь
  ctx.fillStyle = '#78350f';
  ctx.fillRect(w * 0.88, h * 0.08, 14, 18);
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(w * 0.88 + 3, h * 0.08 + 4, 8, 10);

  // 4. Деревянный пол
  const floorY = h * 0.72;
  const floorGrad = ctx.createLinearGradient(0, floorY, 0, h);
  floorGrad.addColorStop(0, '#1c1008');
  floorGrad.addColorStop(1, '#0f0804');
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, floorY, w, h - floorY);

  // Доски пола
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.lineWidth = 2;
  for (let px = 0; px <= w; px += 45) {
    ctx.beginPath();
    ctx.moveTo(px, floorY);
    ctx.lineTo(px + (px - w / 2) * 0.35, h);
    ctx.stroke();
  }

  // Тканый коврик перед очагом
  ctx.fillStyle = '#7c2d12';
  ctx.beginPath();
  ctx.ellipse(w * 0.5, floorY + 45, Math.min(130, w * 0.36), 24, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#b45309';
  ctx.lineWidth = 2;
  ctx.stroke();

  // 5. Камин / Очаг по центру
  const hearthW = Math.min(170, w * 0.46);
  const hearthH = 100;
  const hearthX = (w - hearthW) / 2;
  const hearthY = floorY - hearthH + 18;

  // Каменная кладка
  ctx.fillStyle = '#292524';
  ctx.fillRect(hearthX - 10, hearthY - 12, hearthW + 20, hearthH + 12);
  ctx.fillStyle = '#44403c';
  ctx.fillRect(hearthX - 16, hearthY - 16, hearthW + 32, 10);

  // Арка топки
  ctx.fillStyle = '#0c0a09';
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(hearthX, hearthY, hearthW, hearthH, [28, 28, 0, 0]);
  } else {
    ctx.rect(hearthX, hearthY, hearthW, hearthH);
  }
  ctx.fill();

  // Дрова в очаге
  ctx.fillStyle = '#271406';
  ctx.beginPath();
  ctx.ellipse(w * 0.44, hearthY + hearthH - 12, 26, 7, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(w * 0.56, hearthY + hearthH - 12, 26, 7, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Теплый отсвет камина
  const fireGlow = ctx.createRadialGradient(w * 0.5, hearthY + hearthH - 25, 10, w * 0.5, hearthY + hearthH - 25, 190);
  fireGlow.addColorStop(0, 'rgba(245, 158, 11, 0.32)');
  fireGlow.addColorStop(0.5, 'rgba(234, 88, 12, 0.12)');
  fireGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = fireGlow;
  ctx.fillRect(0, 0, w, h);

  // Пламя огня
  const fireBaseY = hearthY + hearthH - 12;
  const fireCenterX = w * 0.5;

  // Внешнее красное пламя
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.moveTo(fireCenterX - 32, fireBaseY);
  ctx.quadraticCurveTo(fireCenterX - 18 + Math.sin(now * 0.009) * 5, fireBaseY - 42, fireCenterX - 5, fireBaseY - 50 + Math.sin(now * 0.012) * 7);
  ctx.quadraticCurveTo(fireCenterX + 14 + Math.cos(now * 0.008) * 5, fireBaseY - 38, fireCenterX + 32, fireBaseY);
  ctx.closePath();
  ctx.fill();

  // Среднее оранжевое пламя
  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  ctx.moveTo(fireCenterX - 22, fireBaseY);
  ctx.quadraticCurveTo(fireCenterX - 8 + Math.cos(now * 0.011) * 4, fireBaseY - 35, fireCenterX + 2, fireBaseY - 42 + Math.sin(now * 0.015) * 5);
  ctx.quadraticCurveTo(fireCenterX + 10 + Math.sin(now * 0.01) * 4, fireBaseY - 30, fireCenterX + 22, fireBaseY);
  ctx.closePath();
  ctx.fill();

  // Внутреннее золотое пламя
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.moveTo(fireCenterX - 12, fireBaseY);
  ctx.quadraticCurveTo(fireCenterX - 3 + Math.sin(now * 0.013) * 3, fireBaseY - 24, fireCenterX, fireBaseY - 28 + Math.sin(now * 0.018) * 4);
  ctx.quadraticCurveTo(fireCenterX + 5 + Math.cos(now * 0.012) * 3, fireBaseY - 20, fireCenterX + 12, fireBaseY);
  ctx.closePath();
  ctx.fill();

  // 6. Искры и угольки
  homeEmbers.forEach(e => {
    e.life += dt;
    if (e.life >= e.maxLife) {
      e.life = 0;
      e.x = fireCenterX + (Math.random() - 0.5) * 45;
      e.y = fireBaseY - 8;
      e.vx = (Math.random() - 0.5) * 14;
      e.vy = -22 - Math.random() * 32;
    }
    e.x += e.vx * dt;
    e.y += e.vy * dt;
    const progress = e.life / e.maxLife;
    const alpha = Math.sin(progress * Math.PI) * 0.85;

    ctx.fillStyle = `rgba(251, 191, 36, ${Math.max(0, alpha)})`;
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.size * (1 - progress * 0.5), 0, Math.PI * 2);
    ctx.fill();
  });
}

/* ==========================================================
   ПЕЙЗАЖ ОЗЕРА, ГОРЫ, ПУЗЫРЬКИ И УДОЧКА
   ========================================================== */
// Звезды ночного неба над озером
let lakeStars = [];
function initLakeStars() {
  lakeStars = [];
  for (let i = 0; i < 52; i++) {
    lakeStars.push({
      relX: Math.random(),
      relY: Math.random() * 0.38,
      size: 0.8 + Math.random() * 1.5,
      twinkleSpeed: 1.2 + Math.random() * 2.8,
      phase: Math.random() * Math.PI * 2
    });
  }
}

// Редкий след падающей звезды
let meteor = null;
let meteorTimer = 8 + Math.random() * 12;

// Математически точный расчет водной поверхности (без срезов и ступеней на краях)
function getWaterSurfaceY(x, offset = 0, scale = 1.0) {
  const baseWaterY = height * 0.44;
  const w1 = Math.sin(x * 0.012 + waveOffset * 0.9 + offset) * 5.2 * scale;
  const w2 = Math.cos(x * 0.024 - waveOffset * 0.7 + offset * 0.6) * 2.8 * scale;
  const w3 = Math.sin(x * 0.004 + waveOffset * 0.3) * 1.8;
  return baseWaterY + w1 + w2 + w3;
}

// Дальние заснеженные альпийские пики
function drawAlpineMountains(ctx, w, waterTop) {
  ctx.save();

  const peaks = [
    {
      summit: { x: w * 0.18, y: waterTop * 0.36 },
      leftBase: { x: -w * 0.08, y: waterTop },
      rightBase: { x: w * 0.44, y: waterTop },
      ridge: { x: w * 0.16, y: waterTop },
      snowDepth: 0.38
    },
    {
      summit: { x: w * 0.50, y: waterTop * 0.26 },
      leftBase: { x: w * 0.22, y: waterTop },
      rightBase: { x: w * 0.78, y: waterTop },
      ridge: { x: w * 0.47, y: waterTop },
      snowDepth: 0.44
    },
    {
      summit: { x: w * 0.82, y: waterTop * 0.34 },
      leftBase: { x: w * 0.58, y: waterTop },
      rightBase: { x: w * 1.10, y: waterTop },
      ridge: { x: w * 0.80, y: waterTop },
      snowDepth: 0.36
    }
  ];

  peaks.forEach(p => {
    // Теневая грань пика
    ctx.fillStyle = '#091524';
    ctx.beginPath();
    ctx.moveTo(p.summit.x, p.summit.y);
    ctx.lineTo(p.leftBase.x, p.leftBase.y);
    ctx.lineTo(p.ridge.x, p.ridge.y);
    ctx.closePath();
    ctx.fill();

    // Освещенная луной грань пика
    ctx.fillStyle = '#172f4a';
    ctx.beginPath();
    ctx.moveTo(p.summit.x, p.summit.y);
    ctx.lineTo(p.ridge.x, p.ridge.y);
    ctx.lineTo(p.rightBase.x, p.rightBase.y);
    ctx.closePath();
    ctx.fill();

    // Снежные шапки на вершинах
    const snowY = p.summit.y + (waterTop - p.summit.y) * p.snowDepth;
    const snowLeftX = p.summit.x + (p.leftBase.x - p.summit.x) * p.snowDepth;
    const snowRightX = p.summit.x + (p.rightBase.x - p.summit.x) * p.snowDepth;
    const snowRidgeX = p.summit.x + (p.ridge.x - p.summit.x) * p.snowDepth;

    // Теневой снег
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.moveTo(p.summit.x, p.summit.y);
    ctx.lineTo(snowLeftX, snowY);
    ctx.lineTo(snowRidgeX, snowY + 6);
    ctx.closePath();
    ctx.fill();

    // Освещенный луной снег
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.moveTo(p.summit.x, p.summit.y);
    ctx.lineTo(snowRidgeX, snowY + 6);
    ctx.lineTo(snowRightX, snowY);
    ctx.closePath();
    ctx.fill();

    // Дополнительные кулуары снега
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(p.summit.x, p.summit.y + 4);
    ctx.lineTo(snowRidgeX + 4, snowY + 14);
    ctx.stroke();
  });

  // Мягкая дымка долины у подножия гор
  const hazeGrad = ctx.createLinearGradient(0, waterTop * 0.72, 0, waterTop);
  hazeGrad.addColorStop(0, 'rgba(18, 44, 72, 0)');
  hazeGrad.addColorStop(1, 'rgba(18, 44, 72, 0.75)');
  ctx.fillStyle = hazeGrad;
  ctx.fillRect(0, waterTop * 0.72, w, waterTop * 0.28);

  ctx.restore();
}

// Средний хребет с силуэтом таежного леса
function drawMidForestRidge(ctx, w, waterTop) {
  ctx.save();
  ctx.fillStyle = '#071524';
  ctx.beginPath();
  ctx.moveTo(0, waterTop);

  const treeStep = 10;
  const count = Math.ceil(w / treeStep);
  for (let i = 0; i <= count; i++) {
    const x = Math.min(w, i * treeStep);
    const baseRidgeY = waterTop * (0.84 + Math.sin(x * 0.007) * 0.07 + Math.cos(x * 0.018) * 0.03);
    const treeHeight = 7 + Math.abs(Math.sin(x * 0.3 + 1)) * 14;
    const peakY = baseRidgeY - treeHeight;

    ctx.lineTo(x - 2, baseRidgeY);
    ctx.lineTo(x, peakY);
    ctx.lineTo(x + 2, baseRidgeY);
  }

  ctx.lineTo(w, waterTop);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// Ближние скалистые лесные мысы по бокам озера
function drawLakeCapes(ctx, w, waterTop) {
  ctx.save();
  ctx.fillStyle = '#040d16';

  // Левый мыс
  ctx.beginPath();
  ctx.moveTo(0, waterTop - 15);
  ctx.quadraticCurveTo(w * 0.12, waterTop - 6, w * 0.22, waterTop + 8);
  ctx.lineTo(w * 0.20, waterTop + 14);
  ctx.quadraticCurveTo(w * 0.08, waterTop + 12, 0, waterTop + 16);
  ctx.closePath();
  ctx.fill();

  // Силуэты сосен на левом мысу
  const leftPines = [w * 0.06, w * 0.12, w * 0.17];
  leftPines.forEach((px, idx) => {
    const py = waterTop - 2 + idx * 3;
    const ph = 18 + idx * 4;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px - 4, py);
    ctx.lineTo(px, py - ph);
    ctx.lineTo(px + 4, py);
    ctx.closePath();
    ctx.fill();
  });

  // Правый мыс
  ctx.beginPath();
  ctx.moveTo(w, waterTop - 12);
  ctx.quadraticCurveTo(w * 0.90, waterTop - 4, w * 0.82, waterTop + 10);
  ctx.lineTo(w * 0.84, waterTop + 16);
  ctx.quadraticCurveTo(w * 0.92, waterTop + 14, w, waterTop + 18);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

// Отрисовка подводных пузырьков и поверхностных микроволн
function updateAndDrawBubbles(dt, waterTop) {
  // Периодический спавн глубоководных пузырьков
  if (underwaterBubbles.length < 5 && Math.random() < 0.018) {
    const bx = 25 + Math.random() * (width - 50);
    const by = height * (0.65 + Math.random() * 0.32);
    spawnBubble(bx, by, "ambient");
  }

  // Обновление и отрисовка пузырьков
  for (let i = underwaterBubbles.length - 1; i >= 0; i--) {
    const b = underwaterBubbles[i];
    b.y -= b.speedY * dt;
    b.wobblePhase += b.wobbleFreq * dt;
    const curX = b.baseX + Math.sin(b.wobblePhase) * b.wobbleAmp;
    const surfY = getWaterSurfaceY(curX, 0, 1.0);

    // Лопание на поверхности воды
    if (b.y <= surfY + 2) {
      underwaterBubbles.splice(i, 1);
      if (Math.random() < 0.6) {
        surfaceRipples.push({
          x: curX,
          y: surfY,
          r: 1.5,
          maxR: 4 + b.radius * 2.2,
          alpha: 0.7
        });
      }
      continue;
    }

    // Рисуем объемный 3D-пузырек
    ctx.save();
    ctx.fillStyle = `rgba(186, 230, 253, ${b.alpha * 0.22})`;
    ctx.strokeStyle = `rgba(224, 242, 254, ${b.alpha * 0.75})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(curX, b.y, b.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 3D-блик света в верхнем левом углу сферы
    ctx.fillStyle = `rgba(255, 255, 255, ${b.alpha * 0.9})`;
    ctx.beginPath();
    ctx.arc(curX - b.radius * 0.32, b.y - b.radius * 0.32, Math.max(0.6, b.radius * 0.28), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Обновление и отрисовка микроволн лопания
  for (let i = surfaceRipples.length - 1; i >= 0; i--) {
    const r = surfaceRipples[i];
    r.r += 14 * dt;
    r.alpha -= 1.1 * dt;
    if (r.alpha <= 0 || r.r >= r.maxR) {
      surfaceRipples.splice(i, 1);
      continue;
    }
    ctx.save();
    ctx.strokeStyle = `rgba(186, 230, 253, ${Math.max(0, r.alpha)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(r.x, r.y, r.r * 2.2, r.r * 0.65, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

// Детализированная удочка от первого лица
let reelSpinAngle = 0;
function drawDetailedRod(ctx, w, h, dt, gameState, tension) {
  const rod = RODS[player.rodId] || RODS.bamboo;
  const line = LINES[player.lineId] || LINES.mono;

  if (gameState === "REELING" && isReelHolding) {
    reelSpinAngle += (dt || 0.016) * 18;
  } else if (gameState === "CASTING") {
    reelSpinAngle += (dt || 0.016) * 22;
  }

  // 1. Координаты основания и расчет динамического прогиба
  const rodBaseX = w * 0.98;
  const rodBaseY = h + 8;

  let bendX = 16;
  let bendY = 14;
  let jitter = 0;

  if (gameState === "REELING") {
    const tensionFactor = tension / 100;
    bendX = 35 + tensionFactor * 72;
    bendY = 28 + tensionFactor * 76;
    if (tension > 75) {
      jitter = Math.sin(Date.now() * 0.06) * ((tension - 75) * 0.14);
    }
  } else if (gameState === "NIBBLE") {
    bendX = 18;
    bendY = 16 + Math.sin(Date.now() * 0.038) * 14;
  } else if (gameState === "CASTING") {
    const whip = Math.sin(bobber.progress * Math.PI);
    bendX = 18 - whip * 42;
    bendY = 15 + whip * 32;
  } else {
    bendX = 15;
    bendY = 14 + Math.sin(Date.now() * 0.002) * 3;
  }

  const rodTipX = w * 0.70 - bendX + jitter;
  const rodTipY = h * 0.60 + bendY + jitter;

  // Опорные точки кубической кривой Безье бланка
  const p0 = { x: rodBaseX, y: rodBaseY };
  const p1 = { x: w * 0.89, y: h * 0.86 };
  const p2 = { x: w * 0.80, y: h * 0.74 + bendY * 0.35 };
  const p3 = { x: rodTipX, y: rodTipY };

  function getRodPt(t) {
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;
    const t2 = t * t;
    const t3 = t2 * t;
    return {
      x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
      y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y
    };
  }

  ctx.save();

  // 2. Отрисовка бланка удилища (с сужением от комля к тюльпану)
  const numSegments = 16;
  for (let i = 3; i < numSegments; i++) {
    const tA = i / numSegments;
    const tB = (i + 1) / numSegments;
    const ptA = getRodPt(tA);
    const ptB = getRodPt(tB);
    const widthA = 7.5 * (1 - tA * 0.7);

    let baseColor = '#d97706';
    let highlightColor = '#fbbf24';
    let shadowColor = '#78350f';

    if (rod.id === 'carbon') {
      baseColor = '#1e293b';
      highlightColor = '#38bdf8';
      shadowColor = '#090d16';
    } else if (rod.id === 'titanium') {
      baseColor = '#64748b';
      highlightColor = '#cbd5e1';
      shadowColor = '#334155';
    } else if (rod.id === 'gold_master') {
      baseColor = '#eab308';
      highlightColor = '#fef08a';
      shadowColor = '#a16207';
    }

    // Теневая линия бланка
    ctx.strokeStyle = shadowColor;
    ctx.lineWidth = widthA;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(ptA.x, ptA.y);
    ctx.lineTo(ptB.x, ptB.y);
    ctx.stroke();

    // Основное тело бланка
    ctx.strokeStyle = baseColor;
    ctx.lineWidth = widthA * 0.78;
    ctx.beginPath();
    ctx.moveTo(ptA.x, ptA.y);
    ctx.lineTo(ptB.x, ptB.y);
    ctx.stroke();

    // Верхний световой блик
    ctx.strokeStyle = highlightColor;
    ctx.lineWidth = Math.max(1, widthA * 0.28);
    ctx.beginPath();
    ctx.moveTo(ptA.x - 1, ptA.y - 1);
    ctx.lineTo(ptB.x - 1, ptB.y - 1);
    ctx.stroke();

    // Бамбуковые коленья для базовой удочки
    if (rod.id === 'bamboo' && (i === 6 || i === 9 || i === 12)) {
      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.arc(ptA.x, ptA.y, widthA * 0.75, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 3. Эргономичная рукоять (Cork Grip) и катушкодержатель
  const ptHandleStart = getRodPt(0);
  const ptReelSeat = getRodPt(0.14);
  const ptForegrip = getRodPt(0.22);
  const handleAngle = Math.atan2(ptForegrip.y - ptHandleStart.y, ptForegrip.x - ptHandleStart.x);
  const normAngle = handleAngle + Math.PI / 2;

  // Нижняя часть пробковой рукояти
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 14;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(ptHandleStart.x, ptHandleStart.y);
  ctx.lineTo(ptReelSeat.x + Math.cos(handleAngle) * -12, ptReelSeat.y + Math.sin(handleAngle) * -12);
  ctx.stroke();

  // Пробковый текстурный блик
  ctx.strokeStyle = '#fde047';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(ptHandleStart.x - 2, ptHandleStart.y - 2);
  ctx.lineTo(ptReelSeat.x - 10, ptReelSeat.y - 10);
  ctx.stroke();

  // Затыльник рукояти (металлический баткап)
  ctx.fillStyle = '#475569';
  ctx.beginPath();
  ctx.arc(ptHandleStart.x, ptHandleStart.y, 8, 0, Math.PI * 2);
  ctx.fill();

  // Катушкодержатель (черный анодированный металл)
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 11;
  ctx.beginPath();
  ctx.moveTo(ptReelSeat.x - 12, ptReelSeat.y - 12);
  ctx.lineTo(ptReelSeat.x + 12, ptReelSeat.y + 12);
  ctx.stroke();

  // Зажимные металлические гайки катушкодержателя
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(ptReelSeat.x - 10, ptReelSeat.y - 10);
  ctx.lineTo(ptReelSeat.x - 6, ptReelSeat.y - 6);
  ctx.moveTo(ptReelSeat.x + 8, ptReelSeat.y + 8);
  ctx.lineTo(ptReelSeat.x + 12, ptReelSeat.y + 12);
  ctx.stroke();

  // Передний пробковый форегрип
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 11;
  ctx.beginPath();
  ctx.moveTo(ptReelSeat.x + 12, ptReelSeat.y + 12);
  ctx.lineTo(ptForegrip.x, ptForegrip.y);
  ctx.stroke();

  // 4. Спиннинговая безынерционная катушка
  const stemLength = 22;
  const stemEndX = ptReelSeat.x + Math.cos(normAngle) * stemLength;
  const stemEndY = ptReelSeat.y + Math.sin(normAngle) * stemLength;

  // Ножка катушки
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.moveTo(ptReelSeat.x, ptReelSeat.y);
  ctx.lineTo(stemEndX, stemEndY);
  ctx.stroke();

  // Корпус катушки (gearbox)
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.ellipse(stemEndX, stemEndY, 10, 8, handleAngle, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Шпуля катушки с намотанной леской
  const spoolX = stemEndX + Math.cos(handleAngle) * 11;
  const spoolY = stemEndY + Math.sin(handleAngle) * 11;

  // Задний бортик шпули
  ctx.fillStyle = '#94a3b8';
  ctx.beginPath();
  ctx.ellipse(spoolX, spoolY, 8, 12, normAngle, 0, Math.PI * 2);
  ctx.fill();

  // Намотанная леска на шпуле
  const spoolLineColor = (player.lineId === 'braided' ? '#38bdf8' : player.lineId === 'fluoro' ? '#a7f3d0' : '#f8fafc');
  ctx.fillStyle = spoolLineColor;
  ctx.beginPath();
  ctx.ellipse(spoolX + Math.cos(handleAngle) * 4, spoolY + Math.sin(handleAngle) * 4, 7, 10, normAngle, 0, Math.PI * 2);
  ctx.fill();

  // Передний бортик шпули (золотой/серебряный)
  ctx.fillStyle = '#cbd5e1';
  ctx.beginPath();
  ctx.ellipse(spoolX + Math.cos(handleAngle) * 8, spoolY + Math.sin(handleAngle) * 8, 7.5, 11, normAngle, 0, Math.PI * 2);
  ctx.fill();

  // Дужка лесоукладывателя
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(spoolX + Math.cos(handleAngle) * 6, spoolY + Math.sin(handleAngle) * 6, 12, normAngle - 1.2, normAngle + 1.2);
  ctx.stroke();

  // Рукоятка катушки с динамическим вращением при вываживании
  const crankAngle = reelSpinAngle;
  const crankR = 12;
  const knobX = stemEndX + Math.cos(crankAngle) * crankR;
  const knobY = stemEndY + Math.sin(crankAngle) * crankR;

  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(stemEndX, stemEndY);
  ctx.lineTo(knobX, knobY);
  ctx.stroke();

  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(knobX, knobY, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // 5. Пропускные кольца (Guide Rings)
  const guideFractions = [0.30, 0.52, 0.74, 1.0];
  const guidePoints = [];

  guideFractions.forEach((t, idx) => {
    const pt = getRodPt(t);
    const ptNext = getRodPt(Math.min(1.0, t + 0.05));
    const segAngle = Math.atan2(ptNext.y - pt.y, ptNext.x - pt.x);
    const segNorm = segAngle + Math.PI / 2;

    const isTip = (idx === guideFractions.length - 1);
    const ringSize = isTip ? 3.5 : (8 - idx * 1.8);
    const ringDist = isTip ? 0 : (ringSize + 2);
    const ringCenterX = pt.x + Math.cos(segNorm) * ringDist;
    const ringCenterY = pt.y + Math.sin(segNorm) * ringDist;

    guidePoints.push({ x: ringCenterX, y: ringCenterY });

    if (!isTip) {
      // Ножка крепления кольца к бланку
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(pt.x, pt.y);
      ctx.lineTo(ringCenterX, ringCenterY);
      ctx.stroke();

      // Бандажная шелковая обмотка на бланке
      ctx.fillStyle = rod.id === 'carbon' ? '#06b6d4' : rod.id === 'titanium' ? '#6366f1' : '#b45309';
      ctx.beginPath();
      ctx.ellipse(pt.x, pt.y, 4, 3, segAngle, 0, Math.PI * 2);
      ctx.fill();
    }

    // Керамическая вставка кольца (SiC)
    ctx.fillStyle = '#020617';
    ctx.beginPath();
    ctx.arc(ringCenterX, ringCenterY, ringSize * 0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  });

  // 6. Леска, проходящая сквозь кольца удилища
  const spoolExitPt = {
    x: spoolX + Math.cos(handleAngle) * 8,
    y: spoolY + Math.sin(handleAngle) * 8
  };

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(spoolExitPt.x, spoolExitPt.y);
  for (const gp of guidePoints) {
    ctx.lineTo(gp.x, gp.y);
  }
  ctx.stroke();

  // 7. Оснастка вершинки для Фидера (Квивертип и колокольчик)
  if (typeof currentFishingMethod !== 'undefined' && currentFishingMethod === 'feeder') {
    const isNibbling = gameState === 'NIBBLE';
    const vibration = isNibbling ? Math.sin(Date.now() * 0.05) * 8 : 0;

    ctx.save();
    ctx.translate(rodTipX, rodTipY);

    // Флуоресцентная яркая вершинка квивертипа (лимонно-оранжевая)
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-12 + vibration, 12);
    ctx.stroke();

    // Латунный двойной бубенец
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(vibration * 0.5, -4, 4.5, 0, Math.PI * 2);
    ctx.arc(vibration * 0.5 + 4, -8, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Неоновый светлячок на кончике (ночная подсветка)
    ctx.shadowColor = isNibbling ? '#ef4444' : '#22c55e';
    ctx.shadowBlur = isNibbling ? 22 : 10;
    ctx.fillStyle = isNibbling ? '#fca5a5' : '#86efac';
    ctx.beginPath();
    ctx.arc(vibration * 0.5, 0, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  ctx.restore();

  return {
    tipX: rodTipX,
    tipY: rodTipY
  };
}

function render() {
  const now = performance.now();
  const dt = Math.min(0.05, (now - lastFrameTime) / 1000);
  lastFrameTime = now;

  ctx.clearRect(0, 0, width, height);

  // Плавный переход между сценой Озера и Хижиной
  if (isHomeScene) {
    if (homeSceneTransition < 1.0) {
      homeSceneTransition = Math.min(1.0, homeSceneTransition + dt * 3.5);
    }
  } else {
    if (homeSceneTransition > 0.0) {
      homeSceneTransition = Math.max(0.0, homeSceneTransition - dt * 3.5);
    }
  }

  if (homeSceneTransition >= 1.0) {
    renderHomeAtmosphere(ctx, width, height, dt);
    requestAnimationFrame(render);
    return;
  }

  waveOffset += 0.012; // Спокойный, плавный темп волн озера
  const waterTop = height * 0.44;

  // 1. Небо и фон гор
  const skyGrad = ctx.createLinearGradient(0, 0, 0, waterTop);
  skyGrad.addColorStop(0, '#030712');
  skyGrad.addColorStop(0.35, '#0b192c');
  skyGrad.addColorStop(0.75, '#122c48');
  skyGrad.addColorStop(1, '#1b4164');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, waterTop);

  // Звезды
  if (lakeStars.length === 0) initLakeStars();
  lakeStars.forEach(s => {
    const starAlpha = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(now * 0.002 * s.twinkleSpeed + s.phase));
    ctx.fillStyle = `rgba(255, 255, 255, ${starAlpha})`;
    ctx.beginPath();
    ctx.arc(s.relX * width, s.relY * waterTop, s.size, 0, Math.PI * 2);
    ctx.fill();
  });

  // Падающая звезда (метеор)
  meteorTimer -= dt;
  if (meteorTimer <= 0 && !meteor) {
    meteor = {
      x: width * (0.1 + Math.random() * 0.5),
      y: waterTop * (0.05 + Math.random() * 0.25),
      vx: 180 + Math.random() * 120,
      vy: 80 + Math.random() * 60,
      life: 0.55
    };
    meteorTimer = 14 + Math.random() * 18;
  }
  if (meteor) {
    meteor.x += meteor.vx * dt;
    meteor.y += meteor.vy * dt;
    meteor.life -= dt;
    if (meteor.life <= 0) {
      meteor = null;
    } else {
      ctx.strokeStyle = `rgba(254, 240, 138, ${meteor.life * 1.4})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(meteor.x, meteor.y);
      ctx.lineTo(meteor.x - (meteor.vx * 0.12), meteor.y - (meteor.vy * 0.12));
      ctx.stroke();
    }
  }

  // Луна с мягким ореолом
  const moonX = width * 0.75;
  const moonY = height * 0.14;
  const moonR = 17;

  // Мягкий ореол луны
  const moonGlow = ctx.createRadialGradient(moonX, moonY, moonR * 0.8, moonX, moonY, moonR * 3.6);
  moonGlow.addColorStop(0, 'rgba(254, 240, 138, 0.28)');
  moonGlow.addColorStop(0.5, 'rgba(254, 240, 138, 0.08)');
  moonGlow.addColorStop(1, 'rgba(254, 240, 138, 0)');
  ctx.fillStyle = moonGlow;
  ctx.beginPath();
  ctx.arc(moonX, moonY, moonR * 3.6, 0, Math.PI * 2);
  ctx.fill();

  // Диск луны
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
  ctx.fill();

  // Лунные моря и кратеры
  ctx.fillStyle = '#e2d87e';
  ctx.beginPath();
  ctx.arc(moonX - 4, moonY - 3, 5, 0, Math.PI * 2);
  ctx.arc(moonX + 3, moonY + 4, 4.5, 0, Math.PI * 2);
  ctx.arc(moonX - 3, moonY + 6, 3, 0, Math.PI * 2);
  ctx.fill();

  // Слой 1: Дальние величественные заснеженные альпийские пики
  drawAlpineMountains(ctx, width, waterTop);

  // Слой 2: Средний хребет с силуэтом тайги и елей
  drawMidForestRidge(ctx, width, waterTop);

  // Слой 3: Ближние скалистые лесные мысы по бокам озера
  drawLakeCapes(ctx, width, waterTop);

  // 2. Вода (Многослойная шелковистая гладь без дефектов среза)
  const deepGrad = ctx.createLinearGradient(0, waterTop, 0, height);
  deepGrad.addColorStop(0, '#0a3250');
  deepGrad.addColorStop(0.35, '#062038');
  deepGrad.addColorStop(0.7, '#041424');
  deepGrad.addColorStop(1, '#020a14');

  const waveStep = 6;
  const waveStepCount = Math.ceil(width / waveStep);

  // Монолитная толща воды от кромки волн до дна холста
  ctx.fillStyle = deepGrad;
  ctx.beginPath();
  ctx.moveTo(0, height);
  for (let i = 0; i <= waveStepCount; i++) {
    const curX = Math.min(width, i * waveStep);
    const curY = getWaterSurfaceY(curX, 0, 1.0);
    ctx.lineTo(curX, curY);
  }
  ctx.lineTo(width, height);
  ctx.closePath();
  ctx.fill();

  // Световая шахта удалена для естественного вида водной толщи

  // Живые рыбки под водой (включая редких и глубоководных)
  updateAndDrawAmbientFishes(dt);

  // Подводные пузырьки и микроволны лопания
  updateAndDrawBubbles(dt, waterTop);

  // Вторичные полупрозрачные слои волн
  for (let w = 1; w <= 2; w++) {
    ctx.beginPath();
    ctx.moveTo(0, height);
    const wScale = 1.0 - w * 0.25;
    const wOffset = w * 1.8;
    for (let i = 0; i <= waveStepCount; i++) {
      const curX = Math.min(width, i * waveStep);
      const curY = getWaterSurfaceY(curX, wOffset, wScale) + w * 14;
      ctx.lineTo(curX, curY);
    }
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fillStyle = `rgba(14, 116, 144, ${0.15 - w * 0.04})`;
    ctx.fill();
  }

  // Живая лунная дорожка под диском луны
  const trackCount = 14;
  for (let j = 0; j < trackCount; j++) {
    const trackY = waterTop + 10 + j * 16;
    if (trackY > height * 0.88) break;
    const progress = j / trackCount;
    const trackWidth = 24 + progress * 65;
    const trackWaveShift = Math.sin(trackY * 0.025 + waveOffset * 0.6) * (5 + progress * 8);
    const curX = moonX + trackWaveShift;
    const alpha = (1 - progress * 0.7) * (0.20 + Math.sin(waveOffset * 0.8 + j * 0.4) * 0.06);

    ctx.fillStyle = `rgba(254, 240, 138, ${Math.max(0.04, alpha)})`;
    ctx.beginPath();
    ctx.ellipse(curX, trackY, trackWidth * 0.5, 2.2 + progress * 1.2, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Тонкая светлая кромка гребня водной поверхности
  ctx.strokeStyle = 'rgba(186, 230, 253, 0.42)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (let i = 0; i <= waveStepCount; i++) {
    const curX = Math.min(width, i * waveStep);
    const curY = getWaterSurfaceY(curX, 0, 1.0);
    if (i === 0) ctx.moveTo(0, curY);
    else ctx.lineTo(curX, curY);
  }
  ctx.stroke();

  // 3. Логика состояний
  if (gameState === "CASTING") {
    bobber.progress += 1 / bobber.flightDuration;
    const p = bobber.progress;
    bobber.x = bobber.startX + (bobber.targetX - bobber.startX) * p;
    const lineY = bobber.startY + (bobber.targetY - bobber.startY) * p;
    const arc = Math.sin(p * Math.PI) * bobber.arcHeight;
    bobber.y = lineY - arc;

    if (p >= 1) {
      bobber.progress = 1;
      bobber.x = bobber.targetX;
      bobber.y = bobber.targetY;
      createSplash(bobber.x, bobber.y, currentFishingMethod === "fly" ? 3 : 6);
      gameState = "WAITING";

      if (currentFishingMethod === "spinning") {
        if (typeof showLureTwitchButton === 'function') showLureTwitchButton(true);
        showToast("Блесна в толще воды! Нажимайте «ПРОВОДКА»");
      } else if (currentFishingMethod === "feeder") {
        showToast("Кормушка на дне. Бубенец на страже поклёвки...");
      } else if (currentFishingMethod === "fly") {
        showToast("Мушка легла на зеркало воды...");
      } else {
        showToast("Поплавок в воде. Ждем клёва...");
      }

      // Таймер поклёвки с учетом способа и наживки
      const bait = BAITS[currentBaitKey] || BAITS.worm;
      const method = (typeof FISHING_METHODS !== 'undefined' && FISHING_METHODS[currentFishingMethod]) || { biteSpeedMult: 1.0 };
      const waitTime = (bait.waitMin + Math.random() * (bait.waitMax - bait.waitMin)) / (bait.speedMultiplier * (method.biteSpeedMult || 1.0));
      clearTimeout(stateTimer);
      stateTimer = setTimeout(() => {
        triggerNibble();
      }, waitTime);
    }
  } else if (gameState === "WAITING") {
    // Покачивание на волне строго в воде
    const waveY = Math.sin(bobber.x * 0.015 + waveOffset) * 4;
    bobber.y = bobber.targetY + waveY + bobber.sinkOffset;
  } else if (gameState === "NIBBLE") {
    bobber.bobAngle = Math.sin(Date.now() * 0.03) * 0.25;
    bobber.sinkOffset = 14 + Math.sin(Date.now() * 0.02) * 5;
    if (Math.random() < 0.015) {
      spawnBubble(bobber.x + (Math.random() - 0.5) * 10, bobber.y + 10 + Math.random() * 12, "splash", 12 + Math.random() * 15);
    }
  } else if (gameState === "REELING") {
    updateReeling(dt);
    drawUnderwaterFish(fishVisual.x, fishVisual.y, fishVisual.angle, fishVisual.tailOsc, fishVisual.color);
  }

  // 4. Отрисовка детализированной удочки
  const rodInfo = drawDetailedRod(ctx, width, height, dt, gameState, tension);

  // Леска от тюльпана до поплавка
  if (gameState !== "IDLE") {
    ctx.strokeStyle = "rgba(240, 249, 255, 0.65)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(rodInfo.tipX, rodInfo.tipY);
    const midX = (rodInfo.tipX + bobber.x) / 2;
    const sag = gameState === "REELING" ? (100 - tension) * 0.25 : 22;
    const midY = Math.min(rodInfo.tipY, bobber.y) + sag;
    ctx.quadraticCurveTo(midX, midY, bobber.x, bobber.y);
    ctx.stroke();

    // Отрисовка поплавка
    drawBobber(bobber.x, bobber.y, bobber.bobAngle);

    // Индикатор поклёвки (!)
    if (gameState === "NIBBLE") {
      ctx.fillStyle = "#ef4444";
      ctx.font = "bold 26px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("!", bobber.x, bobber.y - 25);
    }
  } else {
    // В режиме ожидания: аккуратная короткая свисающая леска
    ctx.strokeStyle = "rgba(240, 249, 255, 0.5)";
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(rodInfo.tipX, rodInfo.tipY);
    ctx.lineTo(rodInfo.tipX, rodInfo.tipY + 28);
    ctx.stroke();
  }

  // 5. Отрисовка брызг частиц
  for (let i = particles.length - 1; i >= 0; i--) {
    const pt = particles[i];
    pt.x += pt.vx;
    pt.y += pt.vy;
    pt.vy += 0.18; // Гравитация
    pt.life -= 0.025;
    if (pt.life <= 0) {
      particles.splice(i, 1);
      continue;
    }
    ctx.fillStyle = pt.color;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, pt.rad * pt.life, 0, Math.PI * 2);
    ctx.fill();
  }

  // Плавный кроссфейд атмосферы хижины поверх озера при переходе
  if (homeSceneTransition > 0.0) {
    ctx.save();
    ctx.globalAlpha = homeSceneTransition;
    renderHomeAtmosphere(ctx, width, height, dt);
    ctx.restore();
  }

  requestAnimationFrame(render);
}

/* ==========================================================
   ВСПОМОГАТЕЛЬНАЯ ОТРИСОВКА (ПОПЛАВОК И РЫБЫ)
   ========================================================== */
/* ==========================================================
   ВСПОМОГАТЕЛЬНАЯ ОТРИСОВКА СНАСТЕЙ И РЫБЫ
   ========================================================== */
function drawBobber(x, y, angle = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  const method = typeof currentFishingMethod !== 'undefined' ? currentFishingMethod : 'float';

  if (method === 'spinning') {
    // Металлическая блесна / воблер в воде
    const spinPulse = Math.sin(Date.now() * 0.015);
    ctx.shadowColor = "#fef08a";
    ctx.shadowBlur = 8;

    // Тело блесны
    const lureGrad = ctx.createLinearGradient(-10, -5, 10, 5);
    lureGrad.addColorStop(0, '#f8fafc');
    lureGrad.addColorStop(0.5, '#cbd5e1');
    lureGrad.addColorStop(1, '#e2e8f0');
    ctx.fillStyle = lureGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, 10 + spinPulse * 1.5, 4, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Вращающийся лепесток блесны
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.ellipse(spinPulse * 3, -3, 6, 2.5, spinPulse * 0.8, 0, Math.PI * 2);
    ctx.fill();

    // Заводное колечко и крючок-тройник
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(9, 1);
    ctx.lineTo(15, 3);
    ctx.lineTo(13, 7);
    ctx.stroke();

    // Микро-круги ряби вокруг игры приманки
    ctx.strokeStyle = "rgba(254, 240, 138, 0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(0, 0, 12 + spinPulse * 3, 4 + spinPulse, 0, 0, Math.PI * 2);
    ctx.stroke();

  } else if (method === 'feeder') {
    // Донная сетчатая кормушка с грузом
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-7, -4, 14, 9);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1;
    ctx.strokeRect(-7, -4, 14, 9);
    ctx.beginPath();
    ctx.moveTo(-2, -4); ctx.lineTo(-2, 5);
    ctx.moveTo(3, -4); ctx.lineTo(3, 5);
    ctx.moveTo(-7, 0); ctx.lineTo(7, 0);
    ctx.stroke();

    // Свинцовая огрузка кормушки
    ctx.fillStyle = '#475569';
    ctx.fillRect(-8, 5, 16, 3);

    // Периодические микро-пузырьки от вымывания корма
    if (Math.random() < 0.06) {
      spawnBubble(x + (Math.random() - 0.5) * 8, y - 4, "ambient", 14);
    }

  } else if (method === 'fly') {
    // Искусственная сухая мушка на поверхности воды
    const flyPulse = Math.sin(Date.now() * 0.008) * 1.5;

    // Перьевые крылышки
    ctx.fillStyle = 'rgba(248, 250, 252, 0.85)';
    ctx.beginPath();
    ctx.ellipse(-2, -5 + flyPulse, 4, 2, -0.6, 0, Math.PI * 2);
    ctx.ellipse(2, -5 + flyPulse, 4, 2, 0.6, 0, Math.PI * 2);
    ctx.fill();

    // Ворсистое тельце мушки
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.ellipse(0, 0, 5, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ножки (хакл)
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-4, 0); ctx.lineTo(-7, 2);
    ctx.moveTo(-2, 0); ctx.lineTo(-4, 3);
    ctx.moveTo(2, 0); ctx.lineTo(4, 3);
    ctx.moveTo(4, 0); ctx.lineTo(7, 2);
    ctx.stroke();

    // Нежные круги ряби поверхностного натяжения
    ctx.strokeStyle = "rgba(224, 242, 254, 0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(0, 1, 10 + Math.sin(Date.now() * 0.005) * 3, 3, 0, 0, Math.PI * 2);
    ctx.stroke();

  } else {
    // Классический поплавок (Float)
    // Антенна поплавка
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -18);
    ctx.stroke();

    // Верхний яркий набалдашник
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.arc(0, -18, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Тело поплавка (верх красный, низ белый)
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.arc(0, 0, 7, Math.PI, 0);
    ctx.fill();

    ctx.fillStyle = "#f8fafc";
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI);
    ctx.fill();

    // Кольца ряби на воде
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(0, 4, 12, 4, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

// Процедурная отрисовка рыбы под водой через анатомический Canvas-рендер
function drawUnderwaterFish(x, y, angle, tailOsc, colorHex) {
  if (typeof ProceduralFishRenderer !== 'undefined' && activeFish) {
    ProceduralFishRenderer.drawUnderwater(ctx, activeFish, x, y, angle, tailOsc, 0.55);
    return;
  }

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  const bt = (activeFish && typeof activeFish.bodyType === 'number') ? activeFish.bodyType : 0;

  ctx.shadowColor = colorHex;
  ctx.shadowBlur = bt === 4 ? 20 : 10;

  // Тело рыбы
  ctx.fillStyle = colorHex;
  ctx.beginPath();
  if (bt === 0) {
    // Высокотелая (Карась, Лещ, Карп)
    ctx.ellipse(0, 0, 20, 13, 0, 0, Math.PI * 2);
  } else if (bt === 1) {
    // Окунь / Судак / Форель
    ctx.ellipse(0, 0, 22, 10, 0, 0, Math.PI * 2);
  } else if (bt === 2) {
    // Торпеда / Щука / Таймень
    ctx.ellipse(0, 0, 26, 8, 0, 0, Math.PI * 2);
  } else if (bt === 3) {
    // Сом / Налим / Белуга
    ctx.ellipse(-2, 0, 24, 11, 0, 0, Math.PI * 2);
  } else {
    // Легендарная
    ctx.ellipse(0, 0, 22, 11, 0, 0, Math.PI * 2);
  }
  ctx.fill();

  // Усы для сомов и осетров
  if (bt === 3 || (activeFish && activeFish.id === 23)) {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.quadraticCurveTo(26, -5, 24, 10);
    ctx.stroke();
  }

  // Глаз
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  const eyeX = bt === 2 ? 18 : 14;
  ctx.arc(eyeX, -3, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.arc(eyeX + 0.5, -3, 1.2, 0, Math.PI * 2);
  ctx.fill();

  // Хвост с синусоидальным изгибом
  const tailX = bt === 2 ? -24 : -20;
  const tailY = Math.sin(tailOsc) * (bt === 4 ? 12 : 8);
  ctx.beginPath();
  ctx.moveTo(tailX + 4, 0);
  ctx.lineTo(tailX - 12, tailY - 8);
  ctx.lineTo(tailX - 8, tailY);
  ctx.lineTo(tailX - 12, tailY + 8);
  ctx.closePath();
  ctx.fillStyle = colorHex;
  ctx.fill();

  ctx.restore();
}

// Запуск игрового цикла и экосистемы озера

// Запуск игрового цикла и экосистемы озера
requestAnimationFrame(render);
initAmbientFishes();
