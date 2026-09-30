/* ==========================================================
   LUMIBOT FISHING - CANVAS.JS
   Холст, DPR, масштабирование и Offscreen-буферы фона
   ========================================================== */

/* ==========================================================
   CANVAS И РЕНДЕРИНГ МИРА
   ========================================================== */
const canvas = document.getElementById("fishCanvas");
const ctx = canvas.getContext("2d");
let dpr = 1.0;
let qualityMode = (function() {
  try { return localStorage.getItem('lumibot_quality_mode') || 'perf'; } catch(_) { return 'perf'; }
})();
let renderScale = 1.0;
let width = 0;
let height = 0;

function getTargetMaxDimension() {
  if (qualityMode === 'perf') return 960;
  if (qualityMode === 'balanced') return 1280;
  return 4096;
}

function updateQualityUI() {
  const cards = {
    perf: document.getElementById('optPerfCard'),
    balanced: document.getElementById('optBalancedCard'),
    max: document.getElementById('optMaxCard')
  };
  const badges = {
    perf: document.getElementById('optPerfBadge'),
    balanced: document.getElementById('optBalancedBadge'),
    max: document.getElementById('optMaxBadge')
  };

  ['perf', 'balanced', 'max'].forEach(mode => {
    const card = cards[mode];
    const badge = badges[mode];
    const isActive = (qualityMode === mode);
    if (card) card.classList.toggle('active', isActive);
    if (badge) badge.textContent = isActive ? 'Активно' : 'Выбрать';
  });

  const fpsEl = document.getElementById('settingsFpsDisplay');
  if (fpsEl && typeof currentFPS !== 'undefined') {
    fpsEl.textContent = `${currentFPS} FPS`;
  }
}

function setQualityMode(mode) {
  qualityMode = mode;
  try { localStorage.setItem('lumibot_quality_mode', mode); } catch(_) {}
  window.qualityMode = mode;
  resizeCanvas();
  updateQualityUI();
  if (typeof showToast === 'function') {
    const titles = {
      perf: 'Режим графики: «Быстро» (макс. FPS)',
      balanced: 'Режим графики: «Баланс» (HD 720p)',
      max: 'Режим графики: «Максимум» (1:1 нативно)'
    };
    showToast(titles[mode] || mode);
  }
}

function cycleQualityMode() {
  if (qualityMode === 'perf') setQualityMode('balanced');
  else if (qualityMode === 'balanced') setQualityMode('max');
  else setQualityMode('perf');
}

// Оптимизация: Offscreen Canvases для статического пейзажа
let bgSkyCanvas = null;
let bgSkyCtx = null;
let bgLandscapeCanvas = null;
let bgLandscapeCtx = null;
let bgNeedsRedraw = true;
let canvasLeft = 0;
let canvasTop = 0;
let cachedWaterGrad = null;

// Геометрия центрированной вертикальной игровой зоны (макс. 1280px в длину)
let gameArea = {
  left: 0,
  top: 0,
  width: 0,
  height: 0
};

function updateGameArea() {
  const maxUIWidth = 500;
  const maxUIHeight = 1280;
  const uiW = Math.min(width, maxUIWidth);
  const uiH = Math.min(height, maxUIHeight);
  gameArea.width = uiW;
  gameArea.height = uiH;
  gameArea.left = (width - uiW) / 2;
  gameArea.top = (height - uiH) / 2;
}

function updateCanvasBounds() {
  if (canvas) {
    const rect = canvas.getBoundingClientRect();
    canvasLeft = rect.left;
    canvasTop = rect.top;
  }
}

function resizeCanvas() {
  const maxDim = getTargetMaxDimension();
  width = window.innerWidth;
  height = window.innerHeight;
  const screenMax = Math.max(width, height);
  renderScale = Math.min(1.0, maxDim / screenMax);
  window.renderScale = renderScale;

  canvas.width = Math.round(width * renderScale);
  canvas.height = Math.round(height * renderScale);
  ctx.resetTransform?.();
  ctx.scale(renderScale, renderScale);

  updateGameArea();

  // Подготовка оффскрин-холстов: 1. Небо и луна, 2. Нерастянутые горы и лес
  if (!bgSkyCanvas) {
    bgSkyCanvas = document.createElement("canvas");
    bgSkyCtx = bgSkyCanvas.getContext("2d");
  }
  if (!bgLandscapeCanvas) {
    bgLandscapeCanvas = document.createElement("canvas");
    bgLandscapeCtx = bgLandscapeCanvas.getContext("2d");
  }

  const waterTop = height * 0.44;
  const bw = Math.round(width * renderScale);
  const landscapeExtra = 60; // Дополнительная глубина для берега и гор под водой
  const bh = Math.round((waterTop + landscapeExtra) * renderScale);

  bgSkyCanvas.width = bw;
  bgSkyCanvas.height = Math.round((waterTop + 8) * renderScale);
  bgSkyCtx.resetTransform?.();
  bgSkyCtx.scale(renderScale, renderScale);

  bgLandscapeCanvas.width = bw;
  bgLandscapeCanvas.height = bh;
  bgLandscapeCtx.resetTransform?.();
  bgLandscapeCtx.scale(renderScale, renderScale);

  bgNeedsRedraw = true;

  // Кешируем градиент толщи воды, избегая аллокаций каждый кадр
  cachedWaterGrad = ctx.createLinearGradient(0, waterTop, 0, height);
  cachedWaterGrad.addColorStop(0, '#0a3250');
  cachedWaterGrad.addColorStop(0.35, '#062038');
  cachedWaterGrad.addColorStop(0.7, '#041424');
  cachedWaterGrad.addColorStop(1, '#020a14');

  updateCanvasBounds();
}
window.addEventListener("resize", resizeCanvas);
window.addEventListener("scroll", updateCanvasBounds, { passive: true });
resizeCanvas();
updateQualityUI();
document.addEventListener("DOMContentLoaded", updateQualityUI);

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
activeFish = null;
activeFishWeight = 0;
window.activeFish = null;
window.activeFishWeight = 0;

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
  if (typeof scareAmbientFishes === "function") scareAmbientFishes(x, y); else if (window.scareAmbientFishes) window.scareAmbientFishes(x, y);
}



window.canvas = canvas;
window.ctx = ctx;
window.qualityMode = qualityMode;
window.renderScale = renderScale;
window.setQualityMode = setQualityMode;
window.cycleQualityMode = cycleQualityMode;
window.updateQualityUI = updateQualityUI;

