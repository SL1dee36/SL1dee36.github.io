/* ==========================================================
   LUMIBOT FISHING - FATIGUE.JS
   Система усталости, виньетка, обморок и утреннее пробуждение
   ========================================================== */

let isCollapsing = false;
function addPlayerFatigue(amount) {
  if (isCollapsing) return;
  const prevFatigue = player.fatigue || 0;
  player.fatigue = Math.max(0, Math.min(100, prevFatigue + amount));

  const prevInt = Math.round(prevFatigue);
  const nextInt = Math.round(player.fatigue);
  if (prevInt !== nextInt) {
    updatePlayerHUD();
  }
  savePlayerLocal(false);

  // Предупреждающие тосты при переходе порогов
  if (prevFatigue < 80 && player.fatigue >= 80) {
    showToast("⚠️ В глазах начинает темнеть... Усталость выше 80%!");
    triggerHaptic("warning");
  } else if (prevFatigue < 90 && player.fatigue >= 90) {
    showToast("⚠️ Руки слабеют и дрожат! Усталость выше 90%!");
    triggerHaptic("error");
  }

  // Проверка на обморок при усталости >95% (вероятность 50%)
  if (player.fatigue >= 95 && Math.random() < 0.50) {
    triggerCollapseEvent();
  }
}
window.addPlayerFatigue = addPlayerFatigue;

// Событие обморока от переутомления и утреннего ограбления
function triggerCollapseEvent() {
  if (isCollapsing) return;
  isCollapsing = true;

  // Прерываем текущую рыбалку
  if (typeof gameState !== 'undefined') gameState = "IDLE";
  const reelingOverlay = document.getElementById("reelingOverlay");
  if (reelingOverlay) reelingOverlay.classList.remove("active");
  const bottomBar = document.getElementById("bottomBar");
  if (bottomBar) bottomBar.style.display = "none";
  const swipeHint = document.getElementById("swipeHint");
  if (swipeHint) swipeHint.style.display = "none";

  triggerHaptic("heavy");
  if (sound && sound.playFailure) sound.playFailure();

  const collapseModal = document.getElementById("collapseModal");
  const collapseTitle = document.getElementById("collapseTitle");
  const collapseText = document.getElementById("collapseText");
  const collapseLossReport = document.getElementById("collapseLossReport");
  const collapseWakeUpBtn = document.getElementById("collapseWakeUpBtn");

  // Вероятность 40% быть ограбленным к утру
  const wasRobbed = Math.random() < 0.40;
  let stolenSummary = [];

  if (wasRobbed) {
    // 1. Кража монет
    if (player.balance > 15) {
      const stolenCoins = Math.min(player.balance, Math.max(10, Math.floor(player.balance * (0.25 + Math.random() * 0.25))));
      player.balance = Math.max(0, player.balance - stolenCoins);
      stolenSummary.push(`• Монеты: -${stolenCoins} C`);
    }
    // 2. Кража рыбы из садка
    if (player.livewell.length > 0) {
      const stealCount = Math.min(player.livewell.length, Math.floor(1 + Math.random() * 3));
      player.livewell.splice(0, stealCount);
      stolenSummary.push(`• Рыба из садка: -${stealCount} шт.`);
    }
    // 3. Кража приманок
    if (player.baits && player.baits[currentBaitKey] && player.baits[currentBaitKey] > 8) {
      const stolenBaitCount = Math.min(player.baits[currentBaitKey], Math.floor(4 + Math.random() * 5));
      player.baits[currentBaitKey] -= stolenBaitCount;
      const bName = BAITS[currentBaitKey] ? BAITS[currentBaitKey].name : "Приманка";
      stolenSummary.push(`• Наживка «${bName}»: -${stolenBaitCount} шт.`);
    }
  }

  if (collapseModal) {
    if (wasRobbed && stolenSummary.length > 0) {
      if (collapseTitle) {
        collapseTitle.textContent = "⚠️ ВАС ОГРАБИЛИ НА РАССВЕТЕ!";
        collapseTitle.style.color = "#f87171";
      }
      if (collapseText) {
        collapseText.textContent = "Вы потеряли сознание от предельной усталости прямо на берегу. Пока вы лежали без чувств в темноте, недоброжелатели обчистили ваши карманы и садок!";
      }
      if (collapseLossReport) {
        collapseLossReport.innerHTML = `<strong>Похищенное имущество:</strong><br>${stolenSummary.join('<br>')}`;
        collapseLossReport.style.display = "block";
      }
    } else {
      if (collapseTitle) {
        collapseTitle.textContent = "🌅 СЧАСТЛИВОЕ СПАСЕНИЕ НА РАССВЕТЕ";
        collapseTitle.style.color = "#38bdf8";
      }
      if (collapseText) {
        collapseText.textContent = "Вы рухнули без сил на берегу озера. К счастью, старый таёжный егерь заметил вас на рассвете и доставил к теплому костру. Все ваши снасти и улов в полной сохранности!";
      }
      if (collapseLossReport) {
        collapseLossReport.style.display = "none";
      }
    }
    window.FrameNav.open("collapseModal");
  }

  // Восстановление сил после пробуждения (15% - легкое недомогание)
  player.fatigue = 15;
  updatePlayerHUD();
  if (typeof flushSavePlayerLocal === 'function') {
    flushSavePlayerLocal();
  } else {
    savePlayerLocal(true);
  }

  if (collapseWakeUpBtn) {
    collapseWakeUpBtn.onclick = () => {
      isCollapsing = false;
      window.FrameNav.close("collapseModal");
      showToast("Вы пришли в себя. Отдохните в Хижине, чтобы полностью восстановить силы!");
      triggerHaptic("medium");
    };
  }
}

window.addPlayerFatigue = addPlayerFatigue;
window.triggerCollapseEvent = triggerCollapseEvent;
