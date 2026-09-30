/* ==========================================================
   LUMIBOT FISHING - STORAGE.JS
   Локальное хранилище LocalStorage и оптимизированное сохранение прогресса
   (Debounced I/O, Flush on Unload, Zero Frame Drops)
   ========================================================== */

/* ==========================================================
   ЛОКАЛЬНОЕ ХРАНИЛИЩЕ И СИНХРОНИЗАЦИЯ
   ========================================================== */
let _saveTimeout = null;
let _isSavePending = false;

function _writePlayerToDisk() {
  if (!player || !player.id) return;
  try {
    const payload = {
      balance: player.balance,
      xp: player.xp,
      level: player.level,
      fishCaught: player.fishCaught,
      fishSold: player.fishSold,
      totalEarned: player.totalEarned,
      rodId: player.rodId,
      lineId: player.lineId,
      methodId: currentFishingMethod,
      baitKey: currentBaitKey,
      ownedRods: player.ownedRods,
      ownedLines: player.ownedLines,
      ownedMethods: player.ownedMethods || ["float"],
      unlockedBaits: player.unlockedBaits || ["worm"],
      baits: player.baits || { worm: 20 },
      fatigue: typeof player.fatigue === 'number' ? Math.max(0, Math.min(100, Math.round(player.fatigue))) : 0,
      livewell: player.livewell,
      bestCatch: player.bestCatch,
      caughtSpecies: player.caughtSpecies
    };
    localStorage.setItem(`lumibot_player_${player.id}`, JSON.stringify(payload));
    _isSavePending = false;
  } catch (e) {
    console.warn("Ошибка сохранения в localStorage:", e);
  }
}

/**
 * Оптимизированное сохранение прогресса:
 * По умолчанию дебаунсится (800ms), предотвращая 60 IO-блокировок в секунду.
 * При immediate = true пишется немедленно.
 */
function savePlayerLocal(immediate = false) {
  _isSavePending = true;
  if (immediate) {
    if (_saveTimeout) {
      clearTimeout(_saveTimeout);
      _saveTimeout = null;
    }
    _writePlayerToDisk();
    return;
  }

  if (!_saveTimeout) {
    _saveTimeout = setTimeout(() => {
      _saveTimeout = null;
      _writePlayerToDisk();
    }, 800);
  }
}

function flushSavePlayerLocal() {
  if (_saveTimeout) {
    clearTimeout(_saveTimeout);
    _saveTimeout = null;
  }
  if (_isSavePending) {
    _writePlayerToDisk();
  }
}

function loadPlayerLocal() {
  try {
    const raw = localStorage.getItem(`lumibot_player_${player.id}`);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (saved) {
      if (typeof saved.balance === 'number') player.balance = saved.balance;
      if (typeof saved.xp === 'number') player.xp = saved.xp;
      if (typeof saved.level === 'number') player.level = saved.level;
      if (typeof saved.fatigue === 'number') player.fatigue = Math.max(0, Math.min(100, saved.fatigue));
      if (typeof saved.fishCaught === 'number') player.fishCaught = saved.fishCaught;
      if (typeof saved.fishSold === 'number') player.fishSold = saved.fishSold;
      if (typeof saved.totalEarned === 'number') player.totalEarned = saved.totalEarned;
      if (saved.rodId && RODS[saved.rodId]) player.rodId = saved.rodId;
      if (saved.lineId && LINES[saved.lineId]) player.lineId = saved.lineId;
      if (Array.isArray(saved.ownedMethods) && saved.ownedMethods.length) {
        player.ownedMethods = saved.ownedMethods;
      } else {
        player.ownedMethods = ["float"];
      }
      if (saved.methodId && FISHING_METHODS[saved.methodId] && player.ownedMethods.includes(saved.methodId)) {
        currentFishingMethod = saved.methodId;
      } else {
        currentFishingMethod = player.ownedMethods[0] || "float";
      }
      if (Array.isArray(saved.unlockedBaits) && saved.unlockedBaits.length) {
        player.unlockedBaits = saved.unlockedBaits;
      } else {
        player.unlockedBaits = ["worm"];
      }
      if (saved.baits && typeof saved.baits === 'object') {
        player.baits = saved.baits;
      } else {
        player.baits = { worm: 20 };
      }
      if (typeof player.baits.worm !== 'number') {
        player.baits.worm = 20;
      }
      if (saved.baitKey && BAITS[saved.baitKey]) currentBaitKey = saved.baitKey;
      if (Array.isArray(saved.ownedRods)) player.ownedRods = saved.ownedRods;
      if (Array.isArray(saved.lines)) player.ownedLines = saved.ownedLines;
      if (Array.isArray(saved.ownedLines)) player.ownedLines = saved.ownedLines;
      if (Array.isArray(saved.livewell)) {
        player.livewell = saved.livewell;
        if (typeof GridInventory !== 'undefined') {
          const placed = [];
          player.livewell.forEach(item => {
            if (typeof item.gridX !== 'number' || typeof item.gridY !== 'number') {
              const place = GridInventory.autoPlaceItem(placed, item);
              if (place) {
                item.gridX = place.x;
                item.gridY = place.y;
                item.gridShape = place.shape;
                placed.push(item);
              }
            } else {
              placed.push(item);
            }
          });
          player.livewell = placed;
        }
      }
      if (saved.bestCatch && saved.bestCatch.weight) player.bestCatch = saved.bestCatch;
      if (saved.caughtSpecies) {
        player.caughtSpecies = saved.caughtSpecies;
        Object.keys(player.caughtSpecies).forEach(id => {
          if (!player.caughtSpecies[id].discoveredVariations) {
            player.caughtSpecies[id].discoveredVariations = { base: true };
          }
        });
      }
      window.player = player;
    }
  } catch (e) {
    console.warn("Ошибка чтения localStorage:", e);
  }
}

// Гарантированное сохранение при закрытии, сворачивании или смене вкладки
window.addEventListener("beforeunload", flushSavePlayerLocal);
window.addEventListener("pagehide", flushSavePlayerLocal);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) flushSavePlayerLocal();
});

window.savePlayerLocal = savePlayerLocal;
window.flushSavePlayerLocal = flushSavePlayerLocal;
window.loadPlayerLocal = loadPlayerLocal;
