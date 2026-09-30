/* ==========================================================
   LUMIBOT FISHING - MODALS.JS
   Менеджер навигации между фреймами (FrameNav) и управление сценами
   ========================================================== */

window.FrameNav = {
  stack: [],

  // Переход вперед (справа налево): текущий фрейм уходит влево (-100%), новый заезжает справа (+100% -> 0)
  open(frameId, onOpen) {
    const targetModal = typeof frameId === "string" ? document.getElementById(frameId) : frameId;
    if (!targetModal) return;

    const id = targetModal.id;

    // При открытии первого фрейма МГНОВЕННО замораживаем канвас озера и включаем защитный бэкдроп
    if (this.stack.length === 0) {
      window._isCanvasPaused = true;
      const canvas = document.getElementById("fishCanvas");
      if (canvas) canvas.classList.add("canvas-hidden");

      const uiLayer = document.getElementById("game-ui-layer");
      if (uiLayer) uiLayer.classList.add("ui-hidden");

      const backdrop = document.getElementById("frameNavBackdrop");
      if (backdrop) backdrop.classList.add("active");

      const bottomBar = document.getElementById("bottomBar");
      if (bottomBar) bottomBar.style.display = "none";
      const swipeHint = document.getElementById("swipeHint");
      if (swipeHint) swipeHint.style.display = "none";
    }

    // Текущий активный фрейм сдвигается влево (slide-left: 0 -> -100%)
    if (this.stack.length > 0) {
      const currentId = this.stack[this.stack.length - 1];
      const currentModal = document.getElementById(currentId);
      if (currentModal && currentModal !== targetModal) {
        currentModal.classList.remove("active");
        currentModal.classList.add("slide-left");
      }
    }

    // Послойный z-index для чистого наложения фреймов без малейших зазоров
    const nextDepth = this.stack.length + 1;
    targetModal.style.zIndex = 50 + nextDepth;

    // Новый фрейм выезжает справа налево в центр (+100% -> 0)
    targetModal.classList.remove("slide-left");
    void targetModal.offsetWidth; // Force reflow для надёжного срабатывания CSS-анимации
    targetModal.classList.add("active");

    if (this.stack[this.stack.length - 1] !== id) {
      this.stack.push(id);
    }

    if (typeof onOpen === "function") onOpen();
    if (typeof triggerHaptic === "function") triggerHaptic("light");
  },

  // Возврат назад (слева направо): ТОЛЬКО при нажатии на кнопку закрытия!
  close(frameId, onClose) {
    if (this.stack.length === 0) return;

    let targetModal = null;
    if (frameId) {
      targetModal = typeof frameId === "string" ? document.getElementById(frameId) : frameId;
    } else {
      const topId = this.stack[this.stack.length - 1];
      targetModal = document.getElementById(topId);
    }

    if (!targetModal) return;
    const id = targetModal.id;

    // Убираем закрываемый фрейм из стека
    const idx = this.stack.lastIndexOf(id);
    if (idx !== -1) {
      this.stack.splice(idx, 1);
    } else {
      this.stack.pop();
    }

    // Закрываемый фрейм уезжает вправо (0 -> +100%)
    targetModal.classList.remove("active");
    targetModal.classList.remove("slide-left");

    // Если в стеке остался предыдущий фрейм - возвращаем его слева (-100% -> 0)
    if (this.stack.length > 0) {
      const prevId = this.stack[this.stack.length - 1];
      const prevModal = document.getElementById(prevId);
      if (prevModal) {
        prevModal.classList.remove("slide-left");
        void prevModal.offsetWidth;
        prevModal.classList.add("active");
      }
    } else {
      // Все фреймы закрыты: возвращаемся на озеро
      window._isCanvasPaused = false;
      const canvas = document.getElementById("fishCanvas");
      if (canvas) canvas.classList.remove("canvas-hidden");

      const uiLayer = document.getElementById("game-ui-layer");
      if (uiLayer) uiLayer.classList.remove("ui-hidden");

      const backdrop = document.getElementById("frameNavBackdrop");
      if (backdrop) backdrop.classList.remove("active");

      if (typeof lastFrameTime !== "undefined") lastFrameTime = performance.now();

      if (typeof isHomeScene !== "undefined") isHomeScene = false;
      if (typeof isCasinoScene !== "undefined") isCasinoScene = false;

      if (typeof gameState !== "undefined" && gameState === "IDLE") {
        const bottomBar = document.getElementById("bottomBar");
        if (bottomBar) bottomBar.style.display = "flex";
        const swipeHint = document.getElementById("swipeHint");
        if (swipeHint) swipeHint.style.display = "flex";
      }
    }

    if (typeof onClose === "function") onClose();
    if (typeof triggerHaptic === "function") triggerHaptic("light");
  },

  // Полное закрытие всех фреймов
  closeAll() {
    this.stack.forEach(id => {
      const m = document.getElementById(id);
      if (m) {
        m.classList.remove("active");
        m.classList.remove("slide-left");
      }
    });
    this.stack = [];

    window._isCanvasPaused = false;
    const canvas = document.getElementById("fishCanvas");
    if (canvas) canvas.classList.remove("canvas-hidden");

    const uiLayer = document.getElementById("game-ui-layer");
    if (uiLayer) uiLayer.classList.remove("ui-hidden");

    const backdrop = document.getElementById("frameNavBackdrop");
    if (backdrop) backdrop.classList.remove("active");

    if (typeof lastFrameTime !== "undefined") lastFrameTime = performance.now();

    if (typeof isHomeScene !== "undefined") isHomeScene = false;
    if (typeof isCasinoScene !== "undefined") isCasinoScene = false;

    if (typeof gameState !== "undefined" && gameState === "IDLE") {
      const bottomBar = document.getElementById("bottomBar");
      if (bottomBar) bottomBar.style.display = "flex";
      const swipeHint = document.getElementById("swipeHint");
      if (swipeHint) swipeHint.style.display = "flex";
    }
  },

  getCurrent() {
    return this.stack.length > 0 ? this.stack[this.stack.length - 1] : null;
  }
};

/* ==========================================================
   ЛОКАЦИЯ КАЗИНО «ЗОЛОТОЙ КРЮЧОК»
   ========================================================== */
const casinoModal = document.getElementById("casinoModal");
const openCasinoBtn = document.getElementById("openCasinoBtn");
const closeCasinoBtn = document.getElementById("closeCasinoBtn");
const homeGoCasinoBtn = document.getElementById("homeGoCasinoBtn");

function openCasinoScene() {
  if (typeof isCasinoScene !== "undefined") isCasinoScene = true;
  window.FrameNav.open("casinoModal", () => {
    if (window.CasinoManager && typeof window.CasinoManager.open === "function") {
      window.CasinoManager.open();
    }
  });
}

function closeCasinoScene() {
  if (window.CasinoManager && window.CasinoManager.cleanup) {
    window.CasinoManager.cleanup();
  }
  if (typeof isCasinoScene !== "undefined") isCasinoScene = false;
  window.FrameNav.close("casinoModal");
}

if (openCasinoBtn) openCasinoBtn.addEventListener("click", openCasinoScene);
if (closeCasinoBtn) closeCasinoBtn.addEventListener("click", closeCasinoScene);
if (homeGoCasinoBtn) homeGoCasinoBtn.addEventListener("click", openCasinoScene);

if (casinoModal) {
  casinoModal.addEventListener("click", (e) => {
    if (e.target === casinoModal) closeCasinoScene();
  });
}

window.openCasinoScene = openCasinoScene;
window.closeCasinoScene = closeCasinoScene;
