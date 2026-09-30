/* ==========================================================
   LUMIBOT FISHING - STATE.JS
   Глобальное состояние игры и данные игрока
   ========================================================== */

// Глобальные флаги состояния сцены и игры (разделяемые с fisher.js)
var gameState = "IDLE";
var isHomeScene = false;
var currentFishingMethod = "float";
var currentBaitKey = "worm";


    



    const player = {
      id: tgUser.id,
      name: tgUser.first_name || tgUser.username || "Рыбак",
      username: tgUser.username || "",
      balance: 100,
      xp: 0,
      level: 1,
      soundEnabled: true,
      fatigue: 0,
      // Игровая статистика
      fishCaught: 0,
      fishSold: 0,
      totalEarned: 0,
      // Снаряжение
      rodId: "bamboo",
      lineId: "mono",
      ownedRods: ["bamboo"],
      ownedLines: ["mono"],
      ownedMethods: ["float"],
      unlockedBaits: ["worm"],
      baits: {
        worm: 20
      },
      // Садок и трофеи
      livewell: [],
      bestCatch: { name: "", weight: 0, rarity: "" },
      caughtSpecies: {}
    };
    window.player = player;


window.gameState = gameState;
window.isHomeScene = isHomeScene;
window.currentBaitKey = currentBaitKey;
window.currentFishingMethod = currentFishingMethod;
window.player = player;

var activeFish = null;
var activeFishWeight = 0;
window.activeFish = activeFish;
window.activeFishWeight = activeFishWeight;

function checkLevelUp() {
  const oldLevel = player.level;
  player.level = 1 + Math.floor(Math.sqrt(player.xp / 50));
  if (player.level > oldLevel) {
    if (typeof updateMethodsUI === "function") updateMethodsUI();
    if (typeof renderShopTab === "function" && typeof currentShopTab !== "undefined") {
      renderShopTab(currentShopTab);
    }
    showToast("Новый уровень: " + player.level + "!");
  }
}
window.checkLevelUp = checkLevelUp;

var _toastTimeout = null;
function showToast(text) {
  const toast = document.getElementById("statusToast");
  if (!toast) return;
  toast.textContent = text;
  toast.classList.add("visible");
  if (_toastTimeout) clearTimeout(_toastTimeout);
  _toastTimeout = setTimeout(() => {
    toast.classList.remove("visible");
  }, 2500);
}
window.showToast = showToast;
