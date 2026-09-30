let _surfPointsCache = null;
let _celestialGlowGrad = null;
let _celestialGlowKey = '';
/* ==========================================================
   LUMIBOT FISHING - RENDERER.JS
   Рендеринг пейзажа озера, гор, лодки, удилища, лески и поплавка
   ========================================================== */

/* ==========================================================
   ПЕЙЗАЖ ОЗЕРА, ГОРЫ, ПУЗЫРЬКИ И УДОЧКА
   ========================================================== */
// Звезды ночного неба над озером с органическим мерцанием
let lakeStars = [];
function initLakeStars(w = width, waterTop = (height || 800) * 0.44) {
  lakeStars = [];
  const starCount = Math.max(24, Math.min(42, Math.round((w || 400) / 18)));
  for (let i = 0; i < starCount; i++) {
    lakeStars.push({
      relX: Math.random(),
      relY: Math.random() * 0.38,
      size: 0.8 + Math.random() * 1.3,
      twinkleSpeed: 1.5 + Math.random() * 3.0,
      phase: Math.random() * Math.PI * 2
    });
  }
}

// Отрисовка динамически мерцающих звезд (Single-Path Batching: 1 draw call вместо 150)
function drawTwinklingStars(ctx, w, waterTop, nowSec) {
  if (lakeStars.length === 0) initLakeStars(w, waterTop);

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  for (let i = 0; i < lakeStars.length; i++) {
    const s = lakeStars[i];
    const sx = s.relX * w;
    const sy = s.relY * waterTop;
    const pulse = 0.6 + 0.4 * Math.sin(nowSec * s.twinkleSpeed + s.phase);
    const r = s.size * pulse;
    ctx.moveTo(sx + r, sy);
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
  }
  ctx.fill();
}

// Редкий след падающей звезды
let meteor = null;
let meteorTimer = 8 + Math.random() * 12;

// Отрисовка живых процедурных облаков над озером (Zero-Allocation: кэш градиентов облаков)
let _cloudGradCirrus = null;
let _cloudGradCumulus = null;
let _cloudGradColorsKey = "";

function drawDynamicClouds(ctx, w, waterTop) {
  const env = window.EnvironmentManager;
  if (!env || !env.clouds || env.clouds.length === 0) return;

  const colors = (env.getCloudColors) ? env.getCloudColors() : {
    top: "rgba(255, 255, 255, 0.85)",
    bot: "rgba(203, 213, 225, 0.70)",
    rim: "rgba(255, 255, 255, 0.40)"
  };

  const colorsKey = `${colors.top}_${colors.bot}`;
  if (_cloudGradColorsKey !== colorsKey || !_cloudGradCirrus) {
    _cloudGradColorsKey = colorsKey;

    const gCirrus = ctx.createLinearGradient(0, -28 * 0.55, 0, 28 * 0.55);
    gCirrus.addColorStop(0, colors.top);
    gCirrus.addColorStop(0.72, colors.bot);
    gCirrus.addColorStop(1, colors.bot);
    _cloudGradCirrus = gCirrus;

    const gCumulus = ctx.createLinearGradient(0, -56 * 0.55, 0, 56 * 0.55);
    gCumulus.addColorStop(0, colors.top);
    gCumulus.addColorStop(0.72, colors.bot);
    gCumulus.addColorStop(1, colors.bot);
    _cloudGradCumulus = gCumulus;
  }

  ctx.save();
  for (let i = 0; i < env.clouds.length; i++) {
    const c = env.clouds[i];
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.scale(c.scale, c.scale);
    ctx.globalAlpha = c.opacity;

    // Использование закешированного градиента без аллокаций
    ctx.fillStyle = c.layer === "cirrus" ? _cloudGradCirrus : _cloudGradCumulus;

    const isPerf = typeof qualityMode !== 'undefined' && qualityMode === 'perf';
    // Отрисовка органических пуфов облака
    ctx.beginPath();
    for (let p = 0; p < c.puffs.length; p++) {
      const pf = c.puffs[p];
      ctx.moveTo(pf.dx + pf.rx, pf.dy);
      ctx.ellipse(pf.dx, pf.dy, pf.rx, pf.ry, 0, 0, Math.PI * 2);
    }
    ctx.fill();

    // Мягкая световая кромка по верхнему краю кучевого облака (в обычном режиме)
    if (!isPerf && c.layer !== "cirrus") {
      ctx.strokeStyle = colors.rim;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let p = 0; p < c.puffs.length; p++) {
        const pf = c.puffs[p];
        if (pf.dy < 4) {
          ctx.ellipse(pf.dx, pf.dy, pf.rx * 0.94, pf.ry * 0.94, 0, Math.PI * 1.12, Math.PI * 1.88);
        }
      }
      ctx.stroke();
    }

    ctx.restore();
  }
  ctx.restore();
}

// Математически точный расчет водной поверхности (без срезов и ступеней на краях)
function getWaterSurfaceY(x, offset = 0, scale = 1.0) {
  const baseWaterY = height * 0.44;
  const w1 = Math.sin(x * 0.012 + waveOffset * 0.9 + offset) * 5.2 * scale;
  const w2 = Math.cos(x * 0.024 - waveOffset * 0.7 + offset * 0.6) * 2.8 * scale;
  const w3 = Math.sin(x * 0.004 + waveOffset * 0.3) * 1.8;
  return baseWaterY + w1 + w2 + w3;
}

// Вспомогательная функция отрисовки отдельного крутого альпийского пика
// Вспомогательный детерминированный хэш для генерации органической топографии скал
function _mtHash(n) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

// Реалистичный альпийский пик с естественной топографией, скальными гранями и ледниковыми кулуарами
function drawRealisticAlpinePeak(ctx, summitX, summitY, leftBaseX, rightBaseX, ridgeX, baseDepth, snowDepth = 0.42, seed = 1) {
  const H = baseDepth - summitY;
  const leftW = summitX - leftBaseX;
  const rightW = rightBaseX - summitX;

  // 1. Построение естественного изломанного гребня (Arête) от вершины к подножию
  const ridgeSteps = 7;
  const ridgePts = [{ x: summitX, y: summitY }];
  for (let i = 1; i < ridgeSteps; i++) {
    const t = i / ridgeSteps;
    const n = _mtHash(seed * 17 + i * 3.7);
    const kinkX = (n - 0.5) * (14 + t * 24);
    const kinkY = (_mtHash(seed * 23 + i * 5.1) - 0.5) * 6;
    const rx = summitX + (ridgeX - summitX) * t + kinkX;
    const ry = summitY + H * t + kinkY;
    ridgePts.push({ x: rx, y: ry });
  }
  ridgePts.push({ x: ridgeX, y: baseDepth });

  // 2. Изломанный левый контур (теневой склон с естественными уступами)
  const leftSteps = 6;
  const leftPts = [{ x: summitX, y: summitY }];
  for (let i = 1; i < leftSteps; i++) {
    const t = i / leftSteps;
    const n = _mtHash(seed * 31 + i * 4.3);
    const stepX = (n - 0.5) * (16 + t * 20);
    const lx = summitX - leftW * t + stepX;
    const ly = summitY + H * t;
    leftPts.push({ x: lx, y: ly });
  }
  leftPts.push({ x: leftBaseX, y: baseDepth });

  // 3. Изломанный правый контур (освещенный склон со скальными ступенями)
  const rightSteps = 6;
  const rightPts = [{ x: summitX, y: summitY }];
  for (let i = 1; i < rightSteps; i++) {
    const t = i / rightSteps;
    const n = _mtHash(seed * 47 + i * 4.7);
    const stepX = (n - 0.5) * (16 + t * 20);
    const rx = summitX + rightW * t + stepX;
    const ry = summitY + H * t;
    rightPts.push({ x: rx, y: ry });
  }
  rightPts.push({ x: rightBaseX, y: baseDepth });

  // --- БАЗОВЫЙ МОНОЛИТНЫЙ КОРПУС СКАЛЫ (гарантирует отсутствие щелей) ---
  ctx.fillStyle = "#071320";
  ctx.beginPath();
  ctx.moveTo(summitX, summitY);
  for (let i = 1; i < leftPts.length; i++) ctx.lineTo(leftPts[i].x, leftPts[i].y);
  ctx.lineTo(rightBaseX, baseDepth);
  for (let i = rightPts.length - 2; i >= 0; i--) ctx.lineTo(rightPts[i].x, rightPts[i].y);
  ctx.closePath();
  ctx.fill();

  // --- ТЕНЕВАЯ ГРАНЬ (Левая сторона пика) ---
  // Основной глубокий сланцевый градиент тени
  const shadowGrad = ctx.createLinearGradient(leftBaseX, summitY, ridgeX, baseDepth);
  shadowGrad.addColorStop(0, "#0a1726");
  shadowGrad.addColorStop(0.5, "#081320");
  shadowGrad.addColorStop(1, "#050d18");
  ctx.fillStyle = shadowGrad;
  ctx.beginPath();
  ctx.moveTo(summitX, summitY);
  for (let i = 1; i < leftPts.length; i++) ctx.lineTo(leftPts[i].x, leftPts[i].y);
  ctx.lineTo(ridgePts[ridgePts.length - 1].x, baseDepth);
  for (let i = ridgePts.length - 2; i >= 0; i--) ctx.lineTo(ridgePts[i].x, ridgePts[i].y);
  ctx.closePath();
  ctx.fill();

  // Вторичный темный кулуар/желоб на теневом склоне
  const shadowCouloirX1 = summitX - leftW * 0.28;
  const shadowCouloirX2 = leftBaseX + leftW * 0.35;
  ctx.fillStyle = "#040912";
  ctx.beginPath();
  ctx.moveTo(summitX, summitY + H * 0.12);
  ctx.lineTo(shadowCouloirX1, summitY + H * 0.45);
  ctx.lineTo(shadowCouloirX2, baseDepth);
  ctx.lineTo(shadowCouloirX2 + leftW * 0.15, baseDepth);
  ctx.lineTo(shadowCouloirX1 + leftW * 0.08, summitY + H * 0.42);
  ctx.closePath();
  ctx.fill();

  // Отраженный свет неба на дальнем ребре тени
  ctx.fillStyle = "rgba(22, 42, 66, 0.35)";
  ctx.beginPath();
  ctx.moveTo(summitX, summitY);
  for (let i = 1; i < Math.floor(leftPts.length * 0.7); i++) ctx.lineTo(leftPts[i].x, leftPts[i].y);
  ctx.lineTo(summitX - leftW * 0.45, summitY + H * 0.65);
  ctx.closePath();
  ctx.fill();

  // --- ОСВЕЩЕННАЯ ГРАНЬ (Правая сторона пика) ---
  // Основной тон освещенного альпийского камня
  const litGrad = ctx.createLinearGradient(ridgeX, summitY, rightBaseX, baseDepth);
  litGrad.addColorStop(0, "#193554");
  litGrad.addColorStop(0.5, "#1f3e64");
  litGrad.addColorStop(1, "#142944");
  ctx.fillStyle = litGrad;
  ctx.beginPath();
  ctx.moveTo(summitX, summitY);
  for (let i = 1; i < ridgePts.length; i++) ctx.lineTo(ridgePts[i].x, ridgePts[i].y);
  for (let i = rightPts.length - 1; i >= 0; i--) ctx.lineTo(rightPts[i].x, rightPts[i].y);
  ctx.closePath();
  ctx.fill();

  // Выступающий скальный контрфорс / ребро, ловящее яркий свет
  const ribGrad = ctx.createLinearGradient(summitX, summitY, rightBaseX, baseDepth);
  ribGrad.addColorStop(0, "rgba(44, 82, 126, 0.85)");
  ribGrad.addColorStop(0.6, "rgba(35, 68, 106, 0.7)");
  ribGrad.addColorStop(1, "rgba(20, 42, 68, 0)");
  ctx.fillStyle = ribGrad;
  ctx.beginPath();
  ctx.moveTo(summitX, summitY + H * 0.05);
  ctx.lineTo(summitX + rightW * 0.32, summitY + H * 0.48);
  ctx.lineTo(summitX + rightW * 0.52, baseDepth);
  ctx.lineTo(summitX + rightW * 0.36, baseDepth);
  ctx.lineTo(summitX + rightW * 0.18, summitY + H * 0.44);
  ctx.closePath();
  ctx.fill();

  // Вторичный скальный уступ на освещенной грани
  ctx.fillStyle = "rgba(56, 102, 154, 0.45)";
  ctx.beginPath();
  ctx.moveTo(summitX + rightW * 0.15, summitY + H * 0.22);
  ctx.lineTo(summitX + rightW * 0.42, summitY + H * 0.62);
  ctx.lineTo(summitX + rightW * 0.36, summitY + H * 0.66);
  ctx.lineTo(summitX + rightW * 0.10, summitY + H * 0.26);
  ctx.closePath();
  ctx.fill();

  // --- СКАЛЬНЫЕ ПЛАСТЫ И СТРАТЫ (Геологическая текстура камня) ---
  ctx.lineWidth = 1.0;
  for (let s = 1; s <= 7; s++) {
    const t = 0.18 + s * 0.11;
    const yLevel = summitY + H * t;

    // Пласты на освещенной стороне
    const sxLit = summitX + (ridgeX - summitX) * t + 8;
    const exLit = Math.min(rightBaseX - 10, sxLit + rightW * (0.28 + _mtHash(seed + s * 3) * 0.35));
    ctx.strokeStyle = "rgba(224, 242, 254, 0.08)";
    ctx.beginPath();
    ctx.moveTo(sxLit, yLevel);
    ctx.lineTo(exLit, yLevel + 4 + _mtHash(seed + s) * 6);
    ctx.stroke();

    // Трещины и уступы на теневой стороне
    const sxShad = summitX + (ridgeX - summitX) * t - 6;
    const exShad = Math.max(leftBaseX + 10, sxShad - leftW * (0.22 + _mtHash(seed * 2 + s) * 0.3));
    ctx.strokeStyle = "rgba(2, 6, 23, 0.28)";
    ctx.beginPath();
    ctx.moveTo(sxShad, yLevel);
    ctx.lineTo(exShad, yLevel + 3 + _mtHash(seed * 3 + s) * 5);
    ctx.stroke();
  }

  // --- РЕАЛИСТИЧНЫЕ ЛЕДНИКОВЫЕ ШАПКИ И СНЕЖНЫЕ КУЛУАРЫ ---
  const snowH = H * snowDepth;

  // 1. Теневой снег (холодный альпийский синевато-серый)
  ctx.fillStyle = "#546882";
  ctx.beginPath();
  ctx.moveTo(summitX, summitY);
  // Вдоль левого гребня вниз
  const leftSnowIdx = Math.max(1, Math.floor(leftPts.length * snowDepth * 1.05));
  for (let i = 1; i <= leftSnowIdx; i++) ctx.lineTo(leftPts[i].x, leftPts[i].y);
  // Органическая зубчатая кромка снежника с языками таяния
  const midLeftSnowX = summitX - leftW * snowDepth * 0.55;
  const midLeftSnowY = summitY + snowH * 1.15;
  ctx.lineTo(midLeftSnowX - 8, midLeftSnowY - 14);
  ctx.lineTo(midLeftSnowX + 6, midLeftSnowY + 12); // язык снега вниз
  ctx.lineTo(midLeftSnowX + 16, midLeftSnowY - 8);
  // К центральному гребню
  const ridgeSnowIdx = Math.max(1, Math.floor(ridgePts.length * snowDepth * 1.12));
  ctx.lineTo(ridgePts[ridgeSnowIdx].x - 2, ridgePts[ridgeSnowIdx].y + 6);
  // Вверх по центральному гребню
  for (let i = ridgeSnowIdx - 1; i >= 0; i--) ctx.lineTo(ridgePts[i].x, ridgePts[i].y);
  ctx.closePath();
  ctx.fill();

  // 2. Освещенный снег (сверкающий альпийский белый)
  const snowLitGrad = ctx.createLinearGradient(summitX, summitY, summitX + rightW * 0.5, summitY + snowH);
  snowLitGrad.addColorStop(0, "#f8fafc");
  snowLitGrad.addColorStop(0.65, "#e2e8f0");
  snowLitGrad.addColorStop(1, "#cbd5e1");
  ctx.fillStyle = snowLitGrad;
  ctx.beginPath();
  ctx.moveTo(summitX, summitY);
  // Вниз по центральному гребню
  for (let i = 1; i <= ridgeSnowIdx; i++) ctx.lineTo(ridgePts[i].x, ridgePts[i].y);
  // Зубчатая нижняя кромка снежника на освещенном склоне с кулуарами
  const midRightSnowX = summitX + rightW * snowDepth * 0.55;
  const midRightSnowY = summitY + snowH * 1.12;
  ctx.lineTo(ridgePts[ridgeSnowIdx].x + 12, ridgePts[ridgeSnowIdx].y + 16); // кулуар вдоль гребня
  ctx.lineTo(midRightSnowX - 6, midRightSnowY + 8);
  ctx.lineTo(midRightSnowX + 14, midRightSnowY + 22); // глубокий язык ледника
  ctx.lineTo(midRightSnowX + 26, midRightSnowY - 4);
  // Вдоль правого склона вверх
  const rightSnowIdx = Math.max(1, Math.floor(rightPts.length * snowDepth * 1.05));
  ctx.lineTo(rightPts[rightSnowIdx].x, rightPts[rightSnowIdx].y);
  for (let i = rightSnowIdx - 1; i >= 0; i--) ctx.lineTo(rightPts[i].x, rightPts[i].y);
  ctx.closePath();
  ctx.fill();

  // 3. Выносные ледниковые кулуары (снег, сползающий по ущельям далеко вниз)
  // Главный центральный кулуар
  ctx.fillStyle = "rgba(226, 232, 240, 0.88)";
  ctx.beginPath();
  const cTopX = ridgePts[ridgeSnowIdx].x + 4;
  const cTopY = ridgePts[ridgeSnowIdx].y + 12;
  ctx.moveTo(cTopX - 3, cTopY);
  ctx.lineTo(cTopX + 5, cTopY + H * 0.14);
  ctx.lineTo(cTopX + 2, cTopY + H * 0.28);
  ctx.lineTo(cTopX - 2, cTopY + H * 0.28);
  ctx.lineTo(cTopX - 1, cTopY + H * 0.12);
  ctx.closePath();
  ctx.fill();

  // Боковой снежный кулуар на освещенном склоне
  ctx.fillStyle = "rgba(203, 213, 225, 0.75)";
  ctx.beginPath();
  const c2TopX = midRightSnowX + 12;
  const c2TopY = midRightSnowY + 18;
  ctx.moveTo(c2TopX - 2, c2TopY);
  ctx.lineTo(c2TopX + 6, c2TopY + H * 0.16);
  ctx.lineTo(c2TopX + 3, c2TopY + H * 0.17);
  ctx.lineTo(c2TopX - 3, c2TopY + H * 0.05);
  ctx.closePath();
  ctx.fill();

  // Каровый ледник (островок снега на нижней скальной полке)
  ctx.fillStyle = "rgba(226, 232, 240, 0.82)";
  ctx.beginPath();
  const shelfX = summitX + rightW * 0.40;
  const shelfY = summitY + H * 0.68;
  ctx.ellipse(shelfX, shelfY, 14 + rightW * 0.05, 4.5, 0.12, 0, Math.PI * 2);
  ctx.fill();

  // 4. Острая сияющая кромка снежного гребня (Arête Highlight)
  ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
  ctx.lineWidth = 1.2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(summitX, summitY);
  for (let i = 1; i <= Math.min(ridgePts.length - 1, ridgeSnowIdx + 1); i++) {
    ctx.lineTo(ridgePts[i].x, ridgePts[i].y);
  }
  ctx.stroke();
}

// Дальний панорамный хребет (устраняет любые просветы и создает колоссальную глубину горизонта)
function drawBackMountainRidge(ctx, w, waterTop, baseDepth) {
  ctx.save();

  // Глубокий атмосферный градиент дальнего хребта
  const ridgeGrad = ctx.createLinearGradient(0, waterTop * 0.28, 0, baseDepth);
  ridgeGrad.addColorStop(0, "#081a2c");
  ridgeGrad.addColorStop(0.45, "#061524");
  ridgeGrad.addColorStop(1, "#040e18");
  ctx.fillStyle = ridgeGrad;
  ctx.beginPath();
  ctx.moveTo(-100, baseDepth);

  // Многовершинный зубчатый профиль дальнего горизонта
  const step = 14;
  const count = Math.ceil((w + 200) / step);
  const ridgePoints = [];
  for (let i = 0; i <= count; i++) {
    const x = -100 + i * step;
    // Сложная органическая суперпозиция гармоник для естественной скалистой гряды
    const w1 = Math.sin(x * 0.0038 + 0.3) * (waterTop * 0.18);
    const w2 = Math.cos(x * 0.0084 + 1.4) * (waterTop * 0.11);
    const w3 = Math.sin(x * 0.019 - 0.9) * (waterTop * 0.06);
    const w4 = Math.abs(Math.sin(x * 0.042 + 2.1)) * (waterTop * 0.04);
    const ridgeY = waterTop * 0.50 + w1 + w2 + w3 - w4;
    ridgePoints.push({ x, y: ridgeY });
    ctx.lineTo(x, ridgeY);
  }
  ctx.lineTo(w + 100, baseDepth);
  ctx.closePath();
  ctx.fill();

  // Заснеженные пики и скальные гребни дальнего хребта
  ctx.strokeStyle = "rgba(186, 215, 238, 0.38)";
  ctx.lineWidth = 1.6;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  let inSnow = false;
  for (let i = 0; i < ridgePoints.length; i++) {
    const pt = ridgePoints[i];
    if (pt.y < waterTop * 0.51) {
      if (!inSnow) {
        ctx.moveTo(pt.x, pt.y);
        inSnow = true;
      } else {
        ctx.lineTo(pt.x, pt.y);
      }
    } else {
      inSnow = false;
    }
  }
  ctx.stroke();

  // Атмосферная дымка дальнего плана
  const backHaze = ctx.createLinearGradient(0, waterTop * 0.42, 0, waterTop * 0.72);
  backHaze.addColorStop(0, "rgba(8, 26, 44, 0)");
  backHaze.addColorStop(1, "rgba(8, 26, 44, 0.42)");
  ctx.fillStyle = backHaze;
  ctx.fillRect(-100, waterTop * 0.42, w + 200, waterTop * 0.30);

  ctx.restore();
}

// Заснеженные альпийские вершины озера (трехъярусная реалистичная горная система)
function drawAlpineMountains(ctx, w, waterTop, baseDepth = waterTop + 55) {
  ctx.save();

  // 1. Отрисовка дальнего сплошного хребта
  drawBackMountainRidge(ctx, w, waterTop, baseDepth);

  // 2. Средний ярус гор (Midground Alpine Peaks), заполняющий долины между передними пиками
  const refW = Math.min(w, 480);
  const centerX = w * 0.5;
  const originX = centerX - refW * 0.5;

  // 2. Средний ярус гор (Midground Alpine Peaks) — широкие величественные седловины и отроги
  const midPeaks = [
    {
      summit: { x: originX + refW * 0.33, y: waterTop * 0.32 },
      leftBase: originX - refW * 0.05,
      rightBase: originX + refW * 0.70,
      ridge: originX + refW * 0.30,
      snowDepth: 0.42,
      seed: 7
    },
    {
      summit: { x: originX + refW * 0.69, y: waterTop * 0.30 },
      leftBase: originX + refW * 0.35,
      rightBase: originX + refW * 1.05,
      ridge: originX + refW * 0.66,
      snowDepth: 0.40,
      seed: 13
    }
  ];

  midPeaks.forEach(p => {
    drawRealisticAlpinePeak(ctx, p.summit.x, p.summit.y, p.leftBase, p.rightBase, p.ridge, baseDepth, p.snowDepth, p.seed);
  });

  // Легкая воздушная прослойка между средним и передним планом
  const midHaze = ctx.createLinearGradient(0, waterTop * 0.48, 0, waterTop * 0.78);
  midHaze.addColorStop(0, "rgba(10, 28, 48, 0)");
  midHaze.addColorStop(1, "rgba(10, 28, 48, 0.42)");
  ctx.fillStyle = midHaze;
  ctx.fillRect(-80, waterTop * 0.48, w + 160, waterTop * 0.30);

  // 3. Главные доминирующие альпийские пики (Foreground Dominant Massif) — монументальные массивы
  const mainPeaks = [
    {
      summit: { x: originX + refW * 0.16, y: waterTop * 0.34 },
      leftBase: originX - refW * 0.30,
      rightBase: originX + refW * 0.54,
      ridge: originX + refW * 0.14,
      snowDepth: 0.38,
      seed: 3
    },
    {
      summit: { x: originX + refW * 0.50, y: waterTop * 0.22 },
      leftBase: originX + refW * 0.04,
      rightBase: originX + refW * 0.96,
      ridge: originX + refW * 0.47,
      snowDepth: 0.42,
      seed: 1
    },
    {
      summit: { x: originX + refW * 0.84, y: waterTop * 0.33 },
      leftBase: originX + refW * 0.46,
      rightBase: originX + refW * 1.30,
      ridge: originX + refW * 0.81,
      snowDepth: 0.38,
      seed: 5
    }
  ];

  // Боковые фланговые пики слева (гарантируют перекрытие до левой границы экрана на любых дисплеях)
  const peakWidth = Math.max(190, refW * 0.55);
  let curRight = originX + refW * 0.20;
  let stepIdx = 0;
  while (curRight > -140) {
    const curLeft = curRight - peakWidth;
    const summitX = curLeft + peakWidth * 0.52;
    const summitY = waterTop * (0.31 + (stepIdx % 3) * 0.04);
    const ridgeX = summitX - peakWidth * 0.04;
    drawRealisticAlpinePeak(ctx, summitX, summitY, curLeft, curRight, ridgeX, baseDepth, 0.38, 20 + stepIdx);
    curRight -= peakWidth * 0.65;
    stepIdx++;
  }

  // Боковые фланговые пики справа (гарантируют перекрытие до правой границы экрана на любых дисплеях)
  let curLeft = originX + refW * 0.80;
  stepIdx = 0;
  while (curLeft < w + 140) {
    const curRight = curLeft + peakWidth;
    const summitX = curLeft + peakWidth * 0.48;
    const summitY = waterTop * (0.32 + (stepIdx % 3) * 0.05);
    const ridgeX = summitX + peakWidth * 0.03;
    drawRealisticAlpinePeak(ctx, summitX, summitY, curLeft, curRight, ridgeX, baseDepth, 0.39, 40 + stepIdx);
    curLeft += peakWidth * 0.65;
    stepIdx++;
  }

  // Три центральных доминирующих пика
  mainPeaks.forEach(p => {
    drawRealisticAlpinePeak(ctx, p.summit.x, p.summit.y, p.leftBase, p.rightBase, p.ridge, baseDepth, p.snowDepth, p.seed);
  });

  // 4. Мягкая атмосферная дымка долины у подножия перед таежным лесом
  const valleyHaze = ctx.createLinearGradient(0, waterTop * 0.65, 0, waterTop + 18);
  valleyHaze.addColorStop(0, "rgba(12, 32, 54, 0)");
  valleyHaze.addColorStop(0.65, "rgba(12, 32, 54, 0.55)");
  valleyHaze.addColorStop(1, "rgba(8, 22, 38, 0.85)");
  ctx.fillStyle = valleyHaze;
  ctx.fillRect(-100, waterTop * 0.65, w + 200, waterTop * 0.35 + 25);

  ctx.restore();
}

function drawMidForestRidge(ctx, w, waterTop, baseDepth = waterTop + 55) {
  ctx.save();
  ctx.fillStyle = '#061320';
  ctx.beginPath();
  ctx.moveTo(-30, baseDepth);

  const treeStep = 8;
  const count = Math.ceil((w + 60) / treeStep);
  for (let i = 0; i <= count; i++) {
    const x = -30 + i * treeStep;
    const baseRidgeY = waterTop * (0.86 + Math.sin(x * 0.007) * 0.05 + Math.cos(x * 0.018) * 0.02);
    const treeHeight = 10 + Math.abs(Math.sin(x * 0.28 + 1.2)) * 16;
    const peakY = baseRidgeY - treeHeight;

    ctx.lineTo(x - 2, baseRidgeY);
    ctx.lineTo(x, peakY);
    ctx.lineTo(x + 2, baseRidgeY);
  }

  ctx.lineTo(w + 30, baseDepth);
  ctx.closePath();
  ctx.fill();

  // Монолитная темная береговая полоса дальнего берега (гарантирует отсутствие любых просветов неба под водой)
  ctx.fillStyle = '#030910';
  ctx.fillRect(-30, waterTop - 2, w + 60, baseDepth - waterTop + 4);

  ctx.restore();
}

// Ближние скалистые мысы по бокам озера (основание уходит под воду)
function drawLakeCapes(ctx, w, waterTop, baseDepth = waterTop + 55) {
  ctx.save();
  ctx.fillStyle = '#03080e';

  const capeW = Math.min(w * 0.24, 120);
  const leftMid = capeW * 0.55;

  // Левый мыс
  ctx.beginPath();
  ctx.moveTo(0, waterTop - 18);
  ctx.quadraticCurveTo(leftMid, waterTop - 6, capeW, waterTop + 8);
  ctx.lineTo(capeW - 6, baseDepth);
  ctx.lineTo(0, baseDepth);
  ctx.closePath();
  ctx.fill();

  // Силуэты сосен на левом мысу
  const leftPines = [capeW * 0.25, capeW * 0.52, capeW * 0.76];
  leftPines.forEach((px, idx) => {
    const py = waterTop - 4 + idx * 3;
    const ph = 18 + idx * 5;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px - 4, py);
    ctx.lineTo(px, py - ph);
    ctx.lineTo(px + 4, py);
    ctx.closePath();
    ctx.fill();
  });

  // Правый мыс
  const rightStart = w - capeW;
  const rightMid = w - capeW * 0.45;
  ctx.beginPath();
  ctx.moveTo(w, waterTop - 15);
  ctx.quadraticCurveTo(rightMid, waterTop - 4, rightStart + 10, waterTop + 10);
  ctx.lineTo(rightStart + 16, baseDepth);
  ctx.lineTo(w, baseDepth);
  ctx.closePath();
  ctx.fill();

  // Силуэты сосен на правом мысу
  const rightPines = [w - capeW * 0.35, w - capeW * 0.65];
  rightPines.forEach((px, idx) => {
    const py = waterTop - 3 + idx * 4;
    const ph = 19 + idx * 4;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px - 4, py);
    ctx.lineTo(px, py - ph);
    ctx.lineTo(px + 4, py);
    ctx.closePath();
    ctx.fill();
  });

  ctx.restore();
}

// Подводные световые лучи (мягкое рассеивание света через градиенты без тяжелых шейдеров, 60 FPS)
function drawUnderwaterLightRays(ctx, w, waterTop, h, celestialBody, nowSec) {
  if (!celestialBody || (celestialBody.type === "sun" && celestialBody.alpha !== undefined && celestialBody.alpha < 0.08)) return;
  if (typeof qualityMode !== 'undefined' && qualityMode === 'perf') return;

  const isSun = celestialBody.type === "sun";
  const sourceX = celestialBody.x;
  const rayCount = isSun ? 3 : 2;

  const baseAlpha = isSun ? 0.05 : 0.025;
  const rgb = isSun ? "254, 240, 138" : "202, 237, 255";

  for (let r = 0; r < rayCount; r++) {
    const angleOffset = (r - (rayCount - 1) * 0.5) * 0.14 + Math.sin(nowSec * 0.35 + r * 1.5) * 0.03;
    const topW = 28 + r * 10;
    const botW = 85 + r * 26;
    const rx = sourceX + (r - (rayCount - 1) * 0.5) * 52;
    const pulse = 0.7 + 0.3 * Math.sin(nowSec * 0.6 + r * 2.1);
    const alpha = (baseAlpha * pulse).toFixed(3);

    ctx.fillStyle = `rgba(${rgb}, ${alpha})`;
    ctx.beginPath();
    ctx.moveTo(rx - topW * 0.5, waterTop);
    ctx.lineTo(rx + topW * 0.5, waterTop);
    ctx.lineTo(rx + angleOffset * (h - waterTop) + botW * 0.5, h);
    ctx.lineTo(rx + angleOffset * (h - waterTop) - botW * 0.5, h);
    ctx.closePath();
    ctx.fill();
  }
}

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

    // Лопание на поверхности воды (O(1) swap-pop)
    if (b.y <= surfY + 2) {
      const lastB = underwaterBubbles.pop();
      if (i < underwaterBubbles.length) {
        underwaterBubbles[i] = lastB;
      }
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

    // Рисуем объемный мягкий 3D-пузырек
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

  // Обновление и отрисовка микроволн лопания (O(1) swap-pop)
  for (let i = surfaceRipples.length - 1; i >= 0; i--) {
    const r = surfaceRipples[i];
    r.r += 14 * dt;
    r.alpha -= 1.1 * dt;
    if (r.alpha <= 0 || r.r >= r.maxR) {
      const lastR = surfaceRipples.pop();
      if (i < surfaceRipples.length) {
        surfaceRipples[i] = lastR;
      }
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
    const playerShiftX = (playerControlX - w * 0.5) * 0.22;
    const playerShiftY = (playerControlY - h * 0.55) * 0.16;
    bendX = 35 + tensionFactor * 72 - playerShiftX;
    bendY = 28 + tensionFactor * 76 + playerShiftY;
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

  // 2. Отрисовка бланка удилища (8 сегментов для снижения draw calls)
  const numSegments = 8;
  for (let i = 1; i < numSegments; i++) {
    const tA = i / numSegments;
    const tB = (i + 1) / numSegments;
    const ptA = getRodPt(tA);
    const ptB = getRodPt(tB);
    const widthA = 7.5 * (1 - tA * 0.7);

    let baseColor = (rod && rod.blankColor) ? rod.blankColor : '#d97706';
    let highlightColor = (rod && rod.highlightColor) ? rod.highlightColor : '#fbbf24';
    let shadowColor = (rod && rod.shadowColor) ? rod.shadowColor : '#78350f';

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
  const spoolLineColor = (line && line.spoolColor) ? line.spoolColor : (player.lineId === 'braided' ? '#38bdf8' : player.lineId === 'fluoro' ? '#a7f3d0' : '#f8fafc');
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

    // Неоновый светлячок на кончике (ночная подсветка без тяжелого shadowBlur)
    ctx.fillStyle = isNibbling ? 'rgba(239, 68, 68, 0.28)' : 'rgba(34, 197, 94, 0.28)';
    ctx.beginPath();
    ctx.arc(vibration * 0.5, 0, 6.5, 0, Math.PI * 2);
    ctx.fill();
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

// Отрисовка статического пейзажа на оффскрин-холстах (вызывается только при ресайзе/смене геометрии)
function renderStaticBackground(w, waterTop) {
  if (!bgSkyCtx || !bgLandscapeCtx) return;
  const baseDepth = waterTop + 55;
  bgSkyCtx.clearRect(0, 0, w, waterTop + 8);
  bgLandscapeCtx.clearRect(0, 0, w, baseDepth + 10);

  // 1. Небо (на оффскрин-холст неба, если используется)
  const skyGrad = bgSkyCtx.createLinearGradient(0, 0, 0, waterTop);
  skyGrad.addColorStop(0, '#030712');
  skyGrad.addColorStop(0.35, '#0b192c');
  skyGrad.addColorStop(0.75, '#122c48');
  skyGrad.addColorStop(1, '#1b4164');
  bgSkyCtx.fillStyle = skyGrad;
  bgSkyCtx.fillRect(0, 0, w, waterTop + 2);

  // 2. Ландшафт на оффскрин-холст ландшафта (сплошной глубокий базис, уходящий под воду)
  drawAlpineMountains(bgLandscapeCtx, w, waterTop, baseDepth);
  drawMidForestRidge(bgLandscapeCtx, w, waterTop, baseDepth);
  drawLakeCapes(bgLandscapeCtx, w, waterTop, baseDepth);

  bgNeedsRedraw = false;
}

let _casinoBgGrad = null;
let _casinoGlowGold = null;
let _casinoGlowPurple = null;
let _casinoGradH = 0;

function renderCasinoAtmosphere(ctx, w, h, dt) {
  if (_casinoGradH !== h || !_casinoBgGrad) {
    _casinoGradH = h;
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#0a0518');
    bgGrad.addColorStop(0.4, '#0f0826');
    bgGrad.addColorStop(0.8, '#0b1622');
    bgGrad.addColorStop(1, '#050a12');
    _casinoBgGrad = bgGrad;

    const glowGold = ctx.createRadialGradient(w * 0.2, h * 0.25, 10, w * 0.2, h * 0.25, w * 0.45);
    glowGold.addColorStop(0, 'rgba(245, 158, 11, 0.12)');
    glowGold.addColorStop(1, 'rgba(245, 158, 11, 0)');
    _casinoGlowGold = glowGold;

    const glowPurple = ctx.createRadialGradient(w * 0.8, h * 0.4, 10, w * 0.8, h * 0.4, w * 0.5);
    glowPurple.addColorStop(0, 'rgba(168, 85, 247, 0.14)');
    glowPurple.addColorStop(1, 'rgba(168, 85, 247, 0)');
    _casinoGlowPurple = glowPurple;
  }

  ctx.fillStyle = _casinoBgGrad;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = _casinoGlowGold;
  ctx.beginPath();
  ctx.arc(w * 0.2, h * 0.25, w * 0.45, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = _casinoGlowPurple;
  ctx.beginPath();
  ctx.arc(w * 0.8, h * 0.4, w * 0.5, 0, Math.PI * 2);
  ctx.fill();
}

// Кэш градиентов неба и воды для исключения повторного создания объектов в каждом кадре (60 FPS)
let _dynSkyGrad = null;
let _dynSkyKey = "";
function getCachedSkyGrad(ctx, waterTop, sky) {
  const key = `${sky.c0}_${sky.c1}_${sky.c2}_${sky.c3}_${(waterTop | 0)}`;
  if (_dynSkyGrad && _dynSkyKey === key) return _dynSkyGrad;
  _dynSkyKey = key;
  const grad = ctx.createLinearGradient(0, 0, 0, waterTop + 6);
  grad.addColorStop(0, sky.c0);
  grad.addColorStop(0.35, sky.c1);
  grad.addColorStop(0.75, sky.c2);
  grad.addColorStop(1, sky.c3);
  _dynSkyGrad = grad;
  return grad;
}

let _dynWaterGrad = null;
let _dynWaterKey = "";
function getCachedWaterGrad(ctx, waterTop, height, envWater) {
  const cTop = envWater ? envWater.topColor : "#0a3250";
  const cBot = envWater ? envWater.bottomColor : "#041424";
  const key = `${cTop}_${cBot}_${(waterTop | 0)}_${(height | 0)}`;
  if (_dynWaterGrad && _dynWaterKey === key) return _dynWaterGrad;
  _dynWaterKey = key;
  const grad = ctx.createLinearGradient(0, waterTop - 12, 0, height);
  grad.addColorStop(0, cTop);
  grad.addColorStop(0.38, cBot);
  grad.addColorStop(1, "#020710");
  _dynWaterGrad = grad;
  return grad;
}

let _dynDepthWashGrad = null;
let _dynDepthWashKey = "";
function getCachedDepthWashGrad(ctx, waterTop, height) {
  const key = `${(waterTop | 0)}_${(height | 0)}`;
  if (_dynDepthWashGrad && _dynDepthWashKey === key) return _dynDepthWashGrad;
  _dynDepthWashKey = key;
  const hWash = (height - waterTop) * 0.35;
  const grad = ctx.createLinearGradient(0, waterTop, 0, waterTop + hWash);
  grad.addColorStop(0, "rgba(56, 189, 248, 0.08)");
  grad.addColorStop(1, "rgba(56, 189, 248, 0)");
  _dynDepthWashGrad = grad;
  return grad;
}

/* ==========================================================
   ЛОКАЛИЗОВАННЫЕ ОЗЕРНЫЕ МИНИ-ВОЛНЫ (LAKE WAVELETS)
   Легкая рябь, пробегающая на мелких участках глади и плавно исчезающая
   Zero-Allocation: фиксированный пул из 12 объектов без GC-нагрузки
   ========================================================== */
const MAX_LAKE_WAVELETS = 12;
const lakeWavelets = [];

function initSingleWavelet(wv, w, waterTop, h, isFirst = false) {
  wv.active = true;
  wv.depthRel = 0.04 + Math.random() * 0.90; // Распределение по глубине от горизонта до лодки
  // Перспективное сжатие: ближе к горизонту плотнее
  const perspectiveY = Math.pow(wv.depthRel, 1.4);
  wv.baseY = waterTop + 6 + perspectiveY * (h - waterTop - 25);
  wv.x = Math.random() * (w + 40) - 20;

  // Скорость бега волны с ветром (слегка быстрее на переднем плане)
  wv.speedX = 14 + wv.depthRel * 18 + (Math.random() - 0.5) * 6;

  // Длина мини-волны в перспективе: от 22px на горизонте до 95px вблизи
  wv.length = 22 + wv.depthRel * 70 + Math.random() * 15;

  // Высота гребешка волны: тонкая дуга от 1.2px до 3.8px
  wv.crestH = 1.2 + wv.depthRel * 2.6;

  // Длительность жизни пробежки волны: 1.6 - 3.2 сек
  wv.duration = 1.6 + Math.random() * 1.6;
  wv.age = isFirst ? Math.random() * wv.duration : 0;

  // Внутренняя волновая частота и фаза
  wv.phase = Math.random() * Math.PI * 2;
  wv.oscSpeed = 2.8 + Math.random() * 1.6;

  // 1 или 2 гребня в цуге волны
  wv.hasDoubleCrest = Math.random() < 0.55;
  wv.cooldown = 0;
}

function initLakeWavelets(w, waterTop, h) {
  lakeWavelets.length = 0;
  for (let i = 0; i < MAX_LAKE_WAVELETS; i++) {
    const wv = {
      active: false,
      depthRel: 0,
      baseY: 0,
      x: 0,
      speedX: 0,
      length: 0,
      crestH: 0,
      duration: 1,
      age: 0,
      phase: 0,
      oscSpeed: 3,
      hasDoubleCrest: false,
      cooldown: i * 0.22 + Math.random() * 0.4
    };
    initSingleWavelet(wv, w, waterTop, h, true);
    lakeWavelets.push(wv);
  }
}

function updateAndDrawLakeWavelets(ctx, dt, w, waterTop, h, env, nowSec) {
  if (lakeWavelets.length === 0) {
    initLakeWavelets(w, waterTop, h);
  }

  const celestialBody = (env && env.getCelestialBody) ? env.getCelestialBody(w, waterTop) : null;
  const lightSourceX = celestialBody ? celestialBody.x : w * 0.75;
  const isSun = celestialBody && celestialBody.type === "sun";
  const gameHour = env ? env.gameTimeHours : 12;

  // Определение цветовой гаммы бликов волн под текущее время суток
  let baseR = 224, baseG = 242, baseB = 254; // День: чистый небесный отблеск
  if (gameHour >= 18.0 && gameHour < 21.0) {
    baseR = 254; baseG = 215; baseB = 170; // Закат: золотисто-розовый отблеск
  } else if (gameHour >= 21.0 || gameHour < 5.0) {
    baseR = 186; baseG = 230; baseB = 253; // Ночь: лунно-бирюзовый серебристый отблеск
  } else if (gameHour >= 5.0 && gameHour < 8.0) {
    baseR = 253; baseG = 230; baseB = 190; // Рассвет: нежный персиковый
  }

  const isPerf = typeof qualityMode !== 'undefined' && qualityMode === 'perf';
  const waveCount = isPerf ? 6 : lakeWavelets.length;
  for (let i = 0; i < waveCount; i++) {
    const wv = lakeWavelets[i];
    if (!wv.active) {
      wv.cooldown -= dt;
      if (wv.cooldown <= 0) {
        initSingleWavelet(wv, w, waterTop, h, false);
      }
      continue;
    }

    wv.age += dt;
    if (wv.age >= wv.duration) {
      wv.active = false;
      wv.cooldown = 0.4 + Math.random() * 1.8; // Пауза перед появлением новой ряби на озере
      continue;
    }

    // Плавное рождение, пробежка и растворение: sin^1.6(progress * PI)
    const progress = wv.age / wv.duration;
    const envelope = Math.sin(progress * Math.PI);
    const alphaNorm = Math.pow(Math.max(0, envelope), 1.6);
    if (alphaNorm < 0.01) continue;

    // Смещение по X (бег волны по ветру)
    wv.x += wv.speedX * dt;

    // Мягкое вертикальное покачивание на глади
    const curY = wv.baseY + Math.sin(nowSec * wv.oscSpeed + wv.phase) * (0.8 + wv.depthRel * 1.4);

    // Усиление блика, если волна пробегает через дорожку света от солнца или луны
    const distToLight = Math.abs(wv.x - lightSourceX);
    const inLightTrack = distToLight < 95;
    const lightMultiplier = inLightTrack ? (1.0 + (1.0 - distToLight / 95) * 0.8) : 1.0;

    let r = baseR, g = baseG, b = baseB;
    if (inLightTrack && isSun) {
      r = 254; g = 249; b = 195; // Золотистый солнечный гребешок
    }

    const maxAlpha = (0.28 + wv.depthRel * 0.35) * lightMultiplier;
    const finalAlpha = Math.min(0.9, alphaNorm * maxAlpha);

    const halfL = wv.length * 0.5;
    const crestH = wv.crestH * (0.7 + 0.3 * envelope);

    const strokeRgb = (inLightTrack && isSun) ? "rgb(254, 249, 195)" : `rgb(${r}, ${g}, ${b})`;

    // 1. Тонкая нижняя теневая кайма для объемности ряби (в обычном режиме)
    if (!isPerf) {
      ctx.strokeStyle = "#020617";
      ctx.globalAlpha = finalAlpha * 0.35;
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(wv.x - halfL, curY + 1.2);
      ctx.quadraticCurveTo(wv.x, curY + 1.2 - crestH * 0.4, wv.x + halfL, curY + 1.2);
      ctx.stroke();
    }

    // 2. Основной светящийся гребешок водной ряби
    ctx.strokeStyle = strokeRgb;
    ctx.globalAlpha = finalAlpha;
    ctx.lineWidth = Math.max(0.8, (0.8 + wv.depthRel * 0.8));
    ctx.beginPath();
    ctx.moveTo(wv.x - halfL, curY);
    ctx.quadraticCurveTo(wv.x, curY - crestH, wv.x + halfL, curY);
    ctx.stroke();

    // 3. Дополнительный эхо-гребешок чуть позади (только в обычном режиме)
    if (!isPerf && wv.hasDoubleCrest) {
      const echoL = halfL * 0.65;
      const echoX = wv.x - (wv.speedX > 0 ? 5 : -5);
      const echoY = curY + 2.8 + wv.depthRel * 1.5;

      ctx.globalAlpha = finalAlpha * 0.55;
      ctx.lineWidth = Math.max(0.6, (0.6 + wv.depthRel * 0.5));
      ctx.beginPath();
      ctx.moveTo(echoX - echoL, echoY);
      ctx.quadraticCurveTo(echoX, echoY - crestH * 0.6, echoX + echoL, echoY);
      ctx.stroke();
    }
    ctx.globalAlpha = 1.0;
  }
}

let _lastModalRenderTime = 0;
let _lastRenderTimestamp = 0;
let _fpsFramesCount = 0;
let _fpsLastReportTime = performance.now();
let currentFPS = 60;

function render(timestamp) {
  // Защита от дубликатов того же кадра RAF
  if (timestamp && timestamp === _lastRenderTimestamp) {
    requestAnimationFrame(render);
    return;
  }
  _lastRenderTimestamp = timestamp || performance.now();
  const now = performance.now();
  const dt = Math.min(0.05, (now - lastFrameTime) / 1000);
  lastFrameTime = now;

  // Измерение реального FPS (раз в 400мс)
  _fpsFramesCount++;
  if (now - _fpsLastReportTime >= 400) {
    currentFPS = Math.round((_fpsFramesCount * 1000) / (now - _fpsLastReportTime));
    _fpsFramesCount = 0;
    _fpsLastReportTime = now;
    const settingsFps = document.getElementById('settingsFpsDisplay');
    if (settingsFps) settingsFps.textContent = `${currentFPS} FPS`;
  }

  // 1. Пауза при неактивной/свернутой вкладке (100% экономия ресурсов)
  if (document.hidden) {
    requestAnimationFrame(render);
    return;
  }

  // 2. Если открыто Казино - рендерим только атмосферу казино и пропускаем физику озера
  if (typeof isCasinoScene !== 'undefined' && isCasinoScene) {
    ctx.clearRect(0, 0, width, height);
    renderCasinoAtmosphere(ctx, width, height, dt);
    requestAnimationFrame(render);
    return;
  }

  // 3. Полное отключение рендеринга канваса при открытых фреймах (0 FPS / 0% CPU)
  if (window._isCanvasPaused) {
    requestAnimationFrame(render);
    return;
  }

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

  // 0. Обновление менеджера времени и погоды
  if (window.EnvironmentManager) {
    window.EnvironmentManager.update(dt, width, waterTop);
  }

  // 1. Динамический градиент неба (плавный 24-часовой переход)
  const env = window.EnvironmentManager;
  const sky = (env && env.getSkyColors)
    ? env.getSkyColors(waterTop)
    : { c0: "#020612", c1: "#071324", c2: "#0d2038", c3: "#122a46" };

  ctx.fillStyle = getCachedSkyGrad(ctx, waterTop, sky);
  ctx.fillRect(0, 0, width, waterTop + 8);

  // Небесные тела (Солнце или Луна) с плавным восходом, зенитом и закатом
  let celestialBody = null;
  if (env && env.getCelestialBody) {
    celestialBody = env.getCelestialBody(width, waterTop);
    if (celestialBody && (celestialBody.alpha === undefined || celestialBody.alpha > 0.01)) {
      ctx.save();
      if (celestialBody.alpha !== undefined) ctx.globalAlpha = celestialBody.alpha;

      // Мягкий ореол (Кэширование градиента)
      const glowR = celestialBody.radius * 3.8;
      const glowKey = `${(celestialBody.x | 0)}_${(celestialBody.y | 0)}_${celestialBody.type}`;
      if (_celestialGlowKey !== glowKey || !_celestialGlowGrad) {
        _celestialGlowKey = glowKey;
        const glow = ctx.createRadialGradient(celestialBody.x, celestialBody.y, celestialBody.radius * 0.4, celestialBody.x, celestialBody.y, glowR);
        glow.addColorStop(0, celestialBody.glowColor);
        glow.addColorStop(1, "rgba(0, 0, 0, 0)");
        _celestialGlowGrad = glow;
      }
      ctx.fillStyle = _celestialGlowGrad;
      ctx.beginPath();
      ctx.arc(celestialBody.x, celestialBody.y, glowR, 0, Math.PI * 2);
      ctx.fill();

      // Диск
      ctx.fillStyle = celestialBody.color;
      ctx.beginPath();
      ctx.arc(celestialBody.x, celestialBody.y, celestialBody.radius, 0, Math.PI * 2);
      ctx.fill();

      // Если Луна — лунные моря
      if (celestialBody.type === "moon") {
        ctx.fillStyle = "#e2d87e";
        ctx.beginPath();
        ctx.arc(celestialBody.x - 3.5, celestialBody.y - 2.5, 4.2, 0, Math.PI * 2);
        ctx.arc(celestialBody.x + 2.8, celestialBody.y + 3.2, 3.8, 0, Math.PI * 2);
        ctx.arc(celestialBody.x - 2.5, celestialBody.y + 5, 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // 2. Мерцание звёзд (видны ночью и в сумерках)
  const nowSec = performance.now() * 0.001;
  const gameHour = env ? env.gameTimeHours : 0;
  let starAlpha = 1.0;
  if (gameHour >= 4.5 && gameHour < 7.5) {
    starAlpha = Math.max(0, 1.0 - (gameHour - 4.5) / 3.0);
  } else if (gameHour >= 7.5 && gameHour < 19.5) {
    starAlpha = 0.0;
  } else if (gameHour >= 19.5 && gameHour < 22.0) {
    starAlpha = (gameHour - 19.5) / 2.5;
  }

  if (starAlpha > 0.02) {
    ctx.save();
    ctx.globalAlpha = starAlpha;
    drawTwinklingStars(ctx, width, waterTop, nowSec);
    ctx.restore();
  }

  // 2.5. Динамические процедурные облака над горным пейзажем
  drawDynamicClouds(ctx, width, waterTop);

  // 3. Статический фон гор, тайги и мысов (с глубоким базисом под воду)
  if (bgNeedsRedraw || !bgLandscapeCanvas) {
    renderStaticBackground(width, waterTop);
  }
  const landscapeExtra = 55;
  ctx.drawImage(bgLandscapeCanvas, 0, 0, width, waterTop + landscapeExtra);

  // Световой фильтр времени суток поверх гор (плавно интерполированный)
  const ambientWash = (env && env.getAmbientWash)
    ? env.getAmbientWash()
    : "rgba(3, 7, 18, 0.18)";

  ctx.fillStyle = ambientWash;
  ctx.fillRect(0, 0, width, waterTop + landscapeExtra);

  // Падающая звезда (метеор) поверх статического фона
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

  // 2. Вода (Оптимизировано: шаг 24px, кэш вершин, исключение избыточных слоев)
  const envWater = (env && env.getWaterColors) ? env.getWaterColors(waterTop, height) : null;
  const deepGrad = getCachedWaterGrad(ctx, waterTop, height, envWater);
  const waveStep = 24; // 24px вместо 12px (сокращение вычислений вдвое при идеальной гладкости)
  const waveStepCount = Math.ceil(width / waveStep);

  if (!_surfPointsCache || _surfPointsCache.length < waveStepCount + 1) {
    _surfPointsCache = new Float32Array(waveStepCount + 2);
  }

  ctx.fillStyle = deepGrad;
  ctx.beginPath();
  ctx.moveTo(0, height);
  for (let i = 0; i <= waveStepCount; i++) {
    const curX = Math.min(width, i * waveStep);
    const curY = getWaterSurfaceY(curX, 0, 1.0);
    _surfPointsCache[i] = curY;
    ctx.lineTo(curX, curY);
  }
  ctx.lineTo(width, height);
  ctx.closePath();
  ctx.fill();

  // Мягкое диффузное размытие под водой
  ctx.fillStyle = getCachedDepthWashGrad(ctx, waterTop, height);
  ctx.fillRect(0, waterTop, width, (height - waterTop) * 0.35);

  // Живые рыбки под водой
  updateAndDrawAmbientFishes(dt);

  // Подводные пузырьки и микроволны лопания
  updateAndDrawBubbles(dt, waterTop);

  // Подводные рассеянные световые лучи (мягкое глубинное размытие)
  drawUnderwaterLightRays(ctx, width, waterTop, height, celestialBody, nowSec);

  // Локализованные озерные мини-волны (пробегают на участках глади и плавно исчезают)
  updateAndDrawLakeWavelets(ctx, dt, width, waterTop, height, env, nowSec);

  // Живая световая дорожка под небесным телом с мягким диффузным ореолом (без тяжелых шейдеров)
  const lightSourceX = celestialBody ? celestialBody.x : width * 0.75;
  const isSun = celestialBody && celestialBody.type === "sun";
  const isPerfMode = typeof qualityMode !== 'undefined' && qualityMode === 'perf';
  const trackCount = isPerfMode ? 4 : 7;
  const rgb = isSun ? "254, 240, 138" : "224, 242, 254";
  ctx.fillStyle = `rgb(${rgb})`;

  for (let j = 0; j < trackCount; j++) {
    const trackY = waterTop + 10 + j * (isPerfMode ? 36 : 24);
    if (trackY > height * 0.88) break;
    const progress = j / trackCount;
    const trackWidth = 24 + progress * 70;
    const trackWaveShift = Math.sin(trackY * 0.025 + waveOffset * 0.6) * (5 + progress * 8);
    const curX = lightSourceX + trackWaveShift;
    const alpha = (1 - progress * 0.7) * (0.22 + Math.sin(waveOffset * 0.8 + j * 0.4) * 0.07);

    ctx.globalAlpha = Math.max(0.04, alpha * 0.75);
    ctx.beginPath();
    ctx.ellipse(curX, trackY, trackWidth * 0.48, 2.2 + progress * 1.0, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1.0;

  // Отрисовка погодных частиц (Дождь, круги на воде, туман, гроза)
  if (env) {
    // 1. Круги на воде от капель
    if (env.waterRings && env.waterRings.length > 0) {
      ctx.save();
      for (const ring of env.waterRings) {
        ctx.strokeStyle = `rgba(224, 242, 254, ${Math.max(0, ring.alpha)})`;
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.ellipse(ring.x, ring.y, ring.r, ring.r * 0.28, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 2. Туман над озером
    if ((env.weather === "fog" || env.weather === "rain") && env.fogVolumes) {
      ctx.save();
      for (const f of env.fogVolumes) {
        const fx = f.relX * width;
        const fy = f.relY * height;
        const grad = ctx.createRadialGradient(fx, fy, f.radiusX * 0.15, fx, fy, f.radiusX);
        grad.addColorStop(0, `rgba(203, 213, 225, ${f.baseAlpha})`);
        grad.addColorStop(1, "rgba(203, 213, 225, 0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(fx, fy, f.radiusX, f.radiusY, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 3. Капли дождя
    if ((env.weather === "rain" || env.weather === "storm") && env.rainParticles) {
      ctx.save();
      ctx.strokeStyle = env.weather === "storm" ? "rgba(224, 242, 254, 0.45)" : "rgba(203, 213, 225, 0.35)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (const p of env.rainParticles) {
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + p.wind * 0.025, p.y + p.len);
      }
      ctx.stroke();
      ctx.restore();
    }

    // 4. Вспышка молнии
    if (env.lightningFlash > 0.01) {
      ctx.fillStyle = `rgba(255, 255, 255, ${env.lightningFlash * 0.45})`;
      ctx.fillRect(0, 0, width, height);
    }
  }


  // Тонкая светлая кромка гребня (Zero-Math: используем готовые точки _surfPointsCache)
  ctx.strokeStyle = 'rgb(202, 237, 255)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i <= waveStepCount; i++) {
    const curX = Math.min(width, i * waveStep);
    const curY = _surfPointsCache[i];
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
      const envMods = (window.EnvironmentManager && window.EnvironmentManager.getFishingModifiers)
        ? window.EnvironmentManager.getFishingModifiers()
        : { biteSpeedMult: 1.0 };
      const waitTime = (bait.waitMin + Math.random() * (bait.waitMax - bait.waitMin)) / (bait.speedMultiplier * (method.biteSpeedMult || 1.0) * (envMods.biteSpeedMult || 1.0));
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
  ctx.save();
  ctx.translate(gameArea.left, gameArea.top);
  const rodInfo = drawDetailedRod(ctx, gameArea.width, gameArea.height, dt, gameState, tension);
  ctx.restore();
  rodInfo.tipX += gameArea.left;
  rodInfo.tipY += gameArea.top;

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
      particles[i] = particles[particles.length - 1];
      particles.pop();
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
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    lastFrameTime = performance.now();
  }
});

requestAnimationFrame(render);
initAmbientFishes();


window.initLakeStars = initLakeStars;
