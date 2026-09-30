/* ==========================================================
   LUMIBOT FISHING - WHEEL.JS
   «Колесо Фортуны» (до x25)
   ========================================================== */


  /* ==========================================================
     КОНФИГУРАЦИЯ КОЛЕСА ФОРТУНЫ
     ========================================================== */
  const WHEEL_SECTORS = [
    { label: 'x0', mult: 0, color: '#1e293b', text: '#94a3b8' },
    { label: 'x1.5', mult: 1.5, color: '#0369a1', text: '#bae6fd' },
    { label: 'x0.5', mult: 0.5, color: '#334155', text: '#cbd5e1' },
    { label: 'x2', mult: 2.0, color: '#059669', text: '#a7f3d0' },
    { label: 'x0', mult: 0, color: '#1e293b', text: '#94a3b8' },
    { label: 'x3', mult: 3.0, color: '#d97706', text: '#fef08a' },
    { label: 'x1.2', mult: 1.2, color: '#0284c7', text: '#e0f2fe' },
    { label: 'x5', mult: 5.0, color: '#7c3aed', text: '#ede9fe' },
    { label: 'x0', mult: 0, color: '#1e293b', text: '#94a3b8' },
    { label: 'x2', mult: 2.0, color: '#059669', text: '#a7f3d0' },
    { label: 'x10', mult: 10.0, color: '#dc2626', text: '#fee2e2' },
    { label: '👑 x25', mult: 25.0, color: '#eab308', text: '#422006', isJackpot: true }
  ];

  let isSpinningWheel = false;
  let currentWheelAngle = 0;



  /* ==========================================================
     ТАБ 2: КОЛЕСО ФОРТУНЫ
     ========================================================== */
  function renderWheelTab() {
    tabViewport.innerHTML = `
      <div class="wheel-tab-container">
        <div class="wheel-header">
          <div class="slots-title">Колесо Фортуны</div>
          <div class="slots-desc">Крутите колесо и умножайте ставку до x25!</div>
        </div>

        <div class="wheel-wrapper">
          <div class="wheel-pointer">▼</div>
          <canvas id="wheelCanvas" width="300" height="300"></canvas>
          <div class="wheel-center-pin">🪙</div>
        </div>

        <div class="slot-status-banner" id="wheelStatusBanner">Сделайте ставку и крутите колесо</div>

        ${renderBetBar()}

        <div class="slots-actions">
          <button class="action-btn casino-spin-btn" id="wheelSpinBtn">
            <span class="btn-text">КРУТИТЬ КОЛЕСО</span>
            <span class="btn-sub">Ставка: <span id="wheelBtnBet">${currentBet}</span> C</span>
          </button>
        </div>
      </div>
    `;

    bindBetBarEvents((newBet) => {
      const btnBet = document.getElementById("wheelBtnBet");
      if (btnBet) btnBet.textContent = newBet;
    });

    drawWheel(currentWheelAngle);

    const spinBtn = document.getElementById("wheelSpinBtn");
    if (spinBtn) {
      spinBtn.onclick = () => spinWheel();
    }
  }

  function drawWheel(angleOffset = 0) {
    const canvas = document.getElementById("wheelCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const radius = cx - 8;
    const numSectors = WHEEL_SECTORS.length;
    const arc = (Math.PI * 2) / numSectors;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angleOffset);

    // Отрисовка секторов
    WHEEL_SECTORS.forEach((sec, i) => {
      const startAngle = i * arc;
      const endAngle = startAngle + arc;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();

      ctx.fillStyle = sec.color;
      ctx.fill();

      // Золотой ободок сектора
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Текст сектора
      ctx.save();
      ctx.rotate(startAngle + arc / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = sec.text;
      ctx.font = sec.isJackpot ? 'bold 13px sans-serif' : 'bold 12px sans-serif';
      ctx.fillText(sec.label, radius - 16, 4);
      ctx.restore();
    });

    // Наружный декоративный золотой обод с заклепками
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 4;
    ctx.stroke();

    for (let j = 0; j < numSectors; j++) {
      const dotAngle = j * arc;
      const dx = Math.cos(dotAngle) * (radius - 2);
      const dy = Math.sin(dotAngle) * (radius - 2);
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(dx, dy, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function spinWheel() {
    if (isSpinningWheel) return;
    if (!deductBet(currentBet)) return;

    isSpinningWheel = true;
    const spinBtn = document.getElementById("wheelSpinBtn");
    const banner = document.getElementById("wheelStatusBanner");
    if (spinBtn) spinBtn.disabled = true;
    if (banner) {
      banner.className = "slot-status-banner spinning";
      banner.textContent = "Колесо крутится...";
    }

    // Случайный сектор назначения
    const numSectors = WHEEL_SECTORS.length;
    const sectorArc = (Math.PI * 2) / numSectors;
    const targetSectorIndex = Math.floor(Math.random() * numSectors);

    // Указатель находится вверху (на 12 часов, -PI/2)
    // Чтобы целевой сектор оказался под указателем:
    // angleOffset = (3 * Math.PI / 2) - (targetSectorIndex * sectorArc + sectorArc / 2)
    const targetAngleOnCircle = (3 * Math.PI / 2) - (targetSectorIndex * sectorArc + sectorArc / 2);
    const fullRotations = (4 + Math.floor(Math.random() * 3)) * (Math.PI * 2);
    const totalSpinDelta = fullRotations + ((targetAngleOnCircle - (currentWheelAngle % (Math.PI * 2)) + (Math.PI * 2)) % (Math.PI * 2));

    const startAngle = currentWheelAngle;
    const endAngle = startAngle + totalSpinDelta;
    const duration = 3200; // ms
    const startTime = performance.now();
    let lastTickIndex = -1;

    function animateWheel(now) {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Плавная кубическая функция замедления
      const easeOut = 1 - Math.pow(1 - progress, 3.2);

      currentWheelAngle = startAngle + (endAngle - startAngle) * easeOut;
      drawWheel(currentWheelAngle);

      // Звуковые щелчки при прохождении секторов
      const currentSector = Math.floor((currentWheelAngle / sectorArc) % numSectors);
      if (currentSector !== lastTickIndex) {
        lastTickIndex = currentSector;
        if (window.sound && window.sound.playWheelTick) window.sound.playWheelTick();
        if (window.triggerHaptic) window.triggerHaptic("light");
      }

      if (progress < 1) {
        requestAnimationFrame(animateWheel);
      } else {
        isSpinningWheel = false;
        if (spinBtn) spinBtn.disabled = false;
        evaluateWheelResult(targetSectorIndex);
      }
    }

    requestAnimationFrame(animateWheel);
  }

  function evaluateWheelResult(sectorIndex) {
    const sec = WHEEL_SECTORS[sectorIndex];
    const banner = document.getElementById("wheelStatusBanner");

    if (sec.mult > 0) {
      const payout = Math.round(currentBet * sec.mult);
      awardWin(payout, sec.isJackpot ? 100 : 25);

      if (sec.isJackpot) {
        if (banner) {
          banner.className = "slot-status-banner jackpot";
          banner.textContent = `👑 ДЖЕКПОТ КОЛЕСА! +${payout} C (${sec.label})!`;
        }
        if (window.sound && window.sound.playJackpot) window.sound.playJackpot();
        if (window.triggerHaptic) window.triggerHaptic("heavy");
      } else {
        if (banner) {
          banner.className = "slot-status-banner win";
          banner.textContent = `ВЫИГРЫШ! Сектор ${sec.label}: +${payout} C!`;
        }
        if (window.sound && window.sound.playSlotWin) window.sound.playSlotWin();
        if (window.triggerHaptic) window.triggerHaptic("success");
      }
    } else {
      if (banner) {
        banner.className = "slot-status-banner lose";
        banner.textContent = "Сектор x0! Ставка сгорела. Попробуйте еще раз!";
      }
      if (window.triggerHaptic) window.triggerHaptic("error");
    }
  }


window.renderWheelTab = renderWheelTab;
