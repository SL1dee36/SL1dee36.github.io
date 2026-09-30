/* ==========================================================
   LUMIBOT FISHING - AMBIENT.JS
   Живые рыбки в воде (Ambient Living Fishes)
   Оптимизировано: Zero GPU Filter Pipeline Flushes, Soft Depth Halo
   ========================================================== */

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
  for (let i = 0; i < ambientFishes.length; i++) {
    const f = ambientFishes[i];
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
  for (let i = 0; i < ambientFishes.length; i++) {
    const f = ambientFishes[i];
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

    // Оптический эффект глубины и мягкая полупрозрачность в толще воды
    const depthNorm = Math.max(0, Math.min(1.0, (f.depthRel - 0.44) / 0.46));
    const effectiveAlpha = f.alpha * (1.0 - depthNorm * 0.32);
    ctx.globalAlpha = effectiveAlpha;

    // Рассеянный ореол для глубинных силуэтов (эффект водной дымки без дорогого ctx.filter)
    const isDeep = f.type === 1 || depthNorm > 0.32;
    if (isDeep) {
      ctx.fillStyle = f.color;
      ctx.globalAlpha = effectiveAlpha * 0.42;
      ctx.beginPath();
      ctx.ellipse(0, 0, f.length * 0.70, f.bodyWidth * 0.82, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = effectiveAlpha;
    }

    // Тело рыбы
    ctx.fillStyle = f.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, f.length * 0.5, f.bodyWidth * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    if (f.type === 2) {
      ctx.strokeStyle = "rgba(251, 191, 36, 0.4)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

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

window.ambientFishes = ambientFishes;
window.initAmbientFishes = initAmbientFishes;
window.scareAmbientFishes = scareAmbientFishes;
window.updateAndDrawAmbientFishes = updateAndDrawAmbientFishes;
