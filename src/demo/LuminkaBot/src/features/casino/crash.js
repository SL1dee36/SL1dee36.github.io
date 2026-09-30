/* ==========================================================
   LUMIBOT FISHING - CRASH.JS
   «Таёжная Ракета» (Крэш / Lucky Rocket)
   ========================================================== */


  /* ==========================================================
     ТАБ 5: КРАШ («ТАЁЖНАЯ РАКЕТА» / LUCKY ROCKET)
     ========================================================== */
  let crashState = 'idle'; // 'idle', 'flying', 'cashed_out', 'crashed'
  let crashMultiplier = 1.00;
  let crashTarget = 1.00;
  let crashStartTime = 0;
  let crashAnimId = null;
  let crashHistory = [1.85, 2.40, 1.15, 3.80, 1.45];
  let crashCurrentBet = 50;
  let crashCashedMult = 1.00;
  let crashParticles = [];
  let crashStars = [];
  let crashCanvas = null;
  let crashCtx = null;

  function initCrashStars(w, h) {
    crashStars = [];
    for (let i = 0; i < 30; i++) {
      crashStars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        speed: 0.5 + Math.random() * 1.5,
        size: 0.8 + Math.random() * 1.5,
        alpha: 0.3 + Math.random() * 0.7
      });
    }
  }

  function renderCrashTab() {
    tabViewport.innerHTML = `
      <div class="crash-container">
        <div class="slots-header">
          <div class="slots-title">Краш «Таёжная Ракета»</div>
          <div class="slots-desc">Следи за взлётом ракеты и забери выигрыш до крушения!</div>
        </div>

        <!-- История прошлых раундов -->
        <div class="crash-history-row" id="crashHistoryRow">
          ${renderCrashHistoryHtml()}
        </div>

        <!-- Canvas экран полета -->
        <div class="crash-canvas-wrapper" id="crashCanvasWrapper">
          <canvas class="crash-canvas" id="crashCanvas" width="340" height="190"></canvas>
          <div class="crash-hud-overlay">
            <div class="crash-mult-counter" id="crashMultCounter">1.00x</div>
            <div class="crash-status-sub" id="crashStatusSub">Ожидание старта</div>
          </div>
        </div>

        ${renderBetBar(bet => {
          crashCurrentBet = bet;
          const sub = document.querySelector("#crashActionBtn .btn-sub");
          if (sub) sub.textContent = `Ставка: ${bet} C`;
        })}

        <div class="crash-actions" id="crashActionsContainer">
          <button class="action-btn casino-spin-btn" id="crashActionBtn">
            <span class="btn-text">ЗАПУСК РАКЕТЫ</span>
            <span class="btn-sub">Ставка: ${currentBet} C</span>
          </button>
        </div>
      </div>
    `;

    bindBetBarEvents(bet => {
      crashCurrentBet = bet;
      const sub = document.querySelector("#crashActionBtn .btn-sub");
      if (sub) sub.textContent = `Ставка: ${bet} C`;
    });

    crashCanvas = document.getElementById("crashCanvas");
    if (crashCanvas) {
      crashCtx = crashCanvas.getContext("2d");
      initCrashStars(crashCanvas.width, crashCanvas.height);
      drawCrashStaticScene();
    }

    const launchBtn = document.getElementById("crashActionBtn");
    if (launchBtn) launchBtn.onclick = startCrashRound;
  }

  function renderCrashHistoryHtml() {
    return crashHistory.map(m => {
      let cls = 'low';
      if (m >= 10.0) cls = 'jackpot';
      else if (m >= 4.0) cls = 'high';
      else if (m >= 2.0) cls = 'mid';
      return `<span class="crash-hist-pill ${cls}">x${m.toFixed(2)}</span>`;
    }).join('');
  }

  function drawCrashStaticScene() {
    if (!crashCtx || !crashCanvas) return;
    const w = crashCanvas.width;
    const h = crashCanvas.height;

    crashCtx.clearRect(0, 0, w, h);

    // Звездное небо
    crashCtx.fillStyle = "#070c18";
    crashCtx.fillRect(0, 0, w, h);

    // Сетка
    crashCtx.strokeStyle = "rgba(56, 189, 248, 0.08)";
    crashCtx.lineWidth = 1;
    for (let x = 40; x < w; x += 50) {
      crashCtx.beginPath();
      crashCtx.moveTo(x, 0);
      crashCtx.lineTo(x, h);
      crashCtx.stroke();
    }
    for (let y = 30; y < h; y += 40) {
      crashCtx.beginPath();
      crashCtx.moveTo(0, y);
      crashCtx.lineTo(w, y);
      crashCtx.stroke();
    }

    // Звезды
    for (const s of crashStars) {
      crashCtx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
      crashCtx.beginPath();
      crashCtx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      crashCtx.fill();
    }

    // Стартовая позиция ракеты
    drawRocketSprite(crashCtx, 30, h - 30, -Math.PI / 4, 1.0);
  }

  function drawRocketSprite(ctx, x, y, angle, scale = 1.0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(scale, scale);

    // Пламя реактивного двигателя
    ctx.beginPath();
    ctx.moveTo(-16, -4);
    ctx.lineTo(-28 - Math.random() * 8, 0);
    ctx.lineTo(-16, 4);
    ctx.closePath();
    ctx.fillStyle = Math.random() > 0.5 ? "#f97316" : "#facc15";
    ctx.fill();

    // Корпус ракеты (обтекаемый белый с золотым носом)
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.quadraticCurveTo(8, -8, -12, -7);
    ctx.lineTo(-14, 7);
    ctx.quadraticCurveTo(8, 8, 18, 0);
    ctx.closePath();
    ctx.fillStyle = "#f8fafc";
    ctx.fill();
    ctx.strokeStyle = "#0284c7";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Носовой обтекатель
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.quadraticCurveTo(12, -5, 6, -5);
    ctx.lineTo(6, 5);
    ctx.quadraticCurveTo(12, 5, 18, 0);
    ctx.closePath();
    ctx.fillStyle = "#0284c7";
    ctx.fill();

    // Крылья / стабилизаторы
    ctx.beginPath();
    ctx.moveTo(-8, -7);
    ctx.lineTo(-16, -14);
    ctx.lineTo(-12, -4);
    ctx.closePath();
    ctx.fillStyle = "#dc2626";
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-8, 7);
    ctx.lineTo(-16, 14);
    ctx.lineTo(-12, 4);
    ctx.closePath();
    ctx.fillStyle = "#dc2626";
    ctx.fill();

    // Иллюминатор
    ctx.beginPath();
    ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = "#38bdf8";
    ctx.fill();
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  }

  function startCrashRound() {
    if (crashState === 'flying') return;
    if (!deductBet(currentBet)) return;

    crashCurrentBet = currentBet;
    crashState = 'flying';
    crashMultiplier = 1.00;
    crashStartTime = Date.now();
    crashParticles = [];

    // Генерация точки крушения
    const r = Math.random();
    if (r < 0.04) {
      crashTarget = 1.00 + Math.random() * 0.05;
    } else {
      const raw = 0.965 / (1.0 - r);
      crashTarget = Math.max(1.06, Math.min(100.0, raw));
    }

    if (window.sound && window.sound.playRocketLaunch) window.sound.playRocketLaunch();
    if (window.triggerHaptic) window.triggerHaptic("medium");

    document.querySelectorAll(".bet-chip-btn").forEach(b => b.disabled = true);

    const actionContainer = document.getElementById("crashActionsContainer");
    if (actionContainer) {
      actionContainer.innerHTML = `
        <button class="action-btn casino-spin-btn cashout-btn" id="crashCashoutBtn">
          <span class="btn-text">ЗАБРАТЬ</span>
          <span class="btn-sub" id="crashCashoutSub">+${crashCurrentBet} C</span>
        </button>
      `;
      const cashoutBtn = document.getElementById("crashCashoutBtn");
      if (cashoutBtn) cashoutBtn.onclick = cashoutCrash;
    }

    const counter = document.getElementById("crashMultCounter");
    const sub = document.getElementById("crashStatusSub");
    if (counter) {
      counter.className = "crash-mult-counter";
      counter.textContent = "1.00x";
    }
    if (sub) sub.textContent = "Ракета набирает высоту!";

    runCrashLoop();
  }

  function runCrashLoop() {
    if (crashState !== 'flying' && crashState !== 'cashed_out') return;

    const elapsed = (Date.now() - crashStartTime) / 1000;
    crashMultiplier = 1.00 + 0.09 * Math.pow(elapsed, 1.45) + 0.04 * elapsed;

    const counter = document.getElementById("crashMultCounter");
    const cashoutSub = document.getElementById("crashCashoutSub");

    if (counter) {
      counter.textContent = `${crashMultiplier.toFixed(2)}x`;
      if (crashMultiplier >= 10.0) counter.style.color = "#e879f9";
      else if (crashMultiplier >= 4.0) counter.style.color = "#facc15";
      else if (crashMultiplier >= 2.0) counter.style.color = "#4ade80";
      else counter.style.color = "#38bdf8";
    }

    if (crashState === 'flying' && cashoutSub) {
      const potWin = Math.floor(crashCurrentBet * crashMultiplier);
      cashoutSub.textContent = `Кэшаут: +${potWin} C`;
    }

    drawCrashFrame();

    if (crashMultiplier >= crashTarget) {
      crashExplode();
      return;
    }

    crashAnimId = requestAnimationFrame(runCrashLoop);
  }

  function drawCrashFrame() {
    if (!crashCtx || !crashCanvas) return;
    const w = crashCanvas.width;
    const h = crashCanvas.height;

    crashCtx.clearRect(0, 0, w, h);

    // Небо
    crashCtx.fillStyle = "#070c18";
    crashCtx.fillRect(0, 0, w, h);

    // Сетка
    crashCtx.strokeStyle = "rgba(56, 189, 248, 0.08)";
    crashCtx.lineWidth = 1;
    for (let x = 40; x < w; x += 50) {
      crashCtx.beginPath();
      crashCtx.moveTo(x, 0);
      crashCtx.lineTo(x, h);
      crashCtx.stroke();
    }
    for (let y = 30; y < h; y += 40) {
      crashCtx.beginPath();
      crashCtx.moveTo(0, y);
      crashCtx.lineTo(w, y);
      crashCtx.stroke();
    }

    // Движение звезд
    for (const s of crashStars) {
      s.x -= s.speed * (1.0 + crashMultiplier * 0.2);
      s.y += s.speed * 0.4;
      if (s.x < 0) s.x = w;
      if (s.y > h) s.y = 0;

      crashCtx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
      crashCtx.beginPath();
      crashCtx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      crashCtx.fill();
    }

    // Вычисление траектории
    const startX = 25;
    const startY = h - 25;
    const progress = Math.min(1.0, (crashMultiplier - 1.0) / Math.max(3.0, crashTarget * 0.95));

    const currX = startX + (w - 60) * progress;
    const currY = startY - (h - 60) * Math.pow(progress, 0.85);

    // Заполнение под траекторией
    const grad = crashCtx.createLinearGradient(0, currY, 0, startY);
    grad.addColorStop(0, "rgba(56, 189, 248, 0.25)");
    grad.addColorStop(1, "rgba(56, 189, 248, 0.0)");

    crashCtx.beginPath();
    crashCtx.moveTo(startX, startY);
    crashCtx.quadraticCurveTo(startX + (currX - startX) * 0.5, startY, currX, currY);
    crashCtx.lineTo(currX, startY);
    crashCtx.closePath();
    crashCtx.fillStyle = grad;
    crashCtx.fill();

    // Линия траектории
    crashCtx.beginPath();
    crashCtx.moveTo(startX, startY);
    crashCtx.quadraticCurveTo(startX + (currX - startX) * 0.5, startY, currX, currY);
    crashCtx.strokeStyle = "#38bdf8";
    crashCtx.lineWidth = 3.5;
    crashCtx.stroke();

    // Частицы шлейфа
    if (Math.random() > 0.2) {
      crashParticles.push({
        x: currX - 8,
        y: currY + 4,
        vx: -1.5 - Math.random() * 2,
        vy: 1.0 + Math.random() * 1.5,
        life: 1.0,
        color: Math.random() > 0.5 ? '#f97316' : '#facc15'
      });
    }

    for (let i = crashParticles.length - 1; i >= 0; i--) {
      const p = crashParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.05;
      if (p.life <= 0) {
        crashParticles.splice(i, 1);
        continue;
      }
      crashCtx.fillStyle = p.color;
      crashCtx.globalAlpha = p.life;
      crashCtx.beginPath();
      crashCtx.arc(p.x, p.y, 2.5 * p.life, 0, Math.PI * 2);
      crashCtx.fill();
      crashCtx.globalAlpha = 1.0;
    }

    // Ракета
    const angle = -0.65;
    drawRocketSprite(crashCtx, currX, currY, angle, 1.05);
  }

  function cashoutCrash() {
    if (crashState !== 'flying') return;
    crashState = 'cashed_out';
    crashCashedMult = crashMultiplier;

    const winAmount = Math.floor(crashCurrentBet * crashCashedMult);
    awardWin(winAmount, 25);

    if (window.sound && window.sound.playSlotWin) window.sound.playSlotWin();
    if (window.triggerHaptic) window.triggerHaptic("success");
    if (window.showToast) window.showToast(`Кэшаут успешен! Забрано +${winAmount} C (x${crashCashedMult.toFixed(2)})!`);

    const actionContainer = document.getElementById("crashActionsContainer");
    if (actionContainer) {
      actionContainer.innerHTML = `
        <button class="action-btn casino-spin-btn" disabled style="background:#059669;opacity:0.9;">
          <span class="btn-text">ВЫИГРЫШ ЗАБРАН!</span>
          <span class="btn-sub">+${winAmount} C (x${crashCashedMult.toFixed(2)})</span>
        </button>
      `;
    }

    const sub = document.getElementById("crashStatusSub");
    if (sub) sub.textContent = `Вы успели! Выигрыш зафиксирован: +${winAmount} C`;
  }

  function crashExplode() {
    if (crashAnimId) {
      cancelAnimationFrame(crashAnimId);
      crashAnimId = null;
    }
    crashState = 'crashed';

    if (crashCtx && crashCanvas) {
      const w = crashCanvas.width;
      const h = crashCanvas.height;
      crashCtx.fillStyle = "rgba(239, 68, 68, 0.4)";
      crashCtx.fillRect(0, 0, w, h);
    }

    const wrapper = document.getElementById("crashCanvasWrapper");
    if (wrapper) {
      wrapper.classList.add("canvas-shake");
      setTimeout(() => wrapper.classList.remove("canvas-shake"), 400);
    }

    const counter = document.getElementById("crashMultCounter");
    const sub = document.getElementById("crashStatusSub");

    if (counter) {
      counter.className = "crash-mult-counter crashed";
      counter.textContent = `💥 x${crashTarget.toFixed(2)}`;
      counter.style.color = "#ef4444";
    }
    if (sub) sub.textContent = `Крушение ракеты на x${crashTarget.toFixed(2)}`;

    if (window.sound && window.sound.playMineExplosion) window.sound.playMineExplosion();
    if (window.triggerHaptic) window.triggerHaptic("error");

    crashHistory.unshift(Number(crashTarget.toFixed(2)));
    if (crashHistory.length > 6) crashHistory.pop();
    const histEl = document.getElementById("crashHistoryRow");
    if (histEl) histEl.innerHTML = renderCrashHistoryHtml();

    setTimeout(() => {
      document.querySelectorAll(".bet-chip-btn").forEach(b => b.disabled = false);
      const actionContainer = document.getElementById("crashActionsContainer");
      if (actionContainer) {
        actionContainer.innerHTML = `
          <button class="action-btn casino-spin-btn" id="crashActionBtn">
            <span class="btn-text">ЗАПУСК РАКЕТЫ</span>
            <span class="btn-sub">Ставка: ${currentBet} C</span>
          </button>
        `;
        const launchBtn = document.getElementById("crashActionBtn");
        if (launchBtn) launchBtn.onclick = startCrashRound;
      }
      if (sub) sub.textContent = "Испытай удачу снова!";
      drawCrashStaticScene();
    }, 1500);
  }


window.renderCrashTab = renderCrashTab;
