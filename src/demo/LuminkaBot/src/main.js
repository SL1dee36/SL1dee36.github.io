/* ==========================================================
   LUMIBOT FISHING - MAIN.JS
   Входная точка инициализации игры
   ========================================================== */

document.addEventListener("DOMContentLoaded", () => {
  console.log("Инициализация LumiBot Fishing...");
  if (window.updateTensionSafeZoneUI) window.updateTensionSafeZoneUI();
  if (window.updatePlayerHUD) window.updatePlayerHUD();
  if (window.loadUserData) window.loadUserData();
  if (window.initMethodAndBaitsUI) window.initMethodAndBaitsUI();
  console.log("LumiBot Fishing готов к игре!");
});
