/* ==========================================================
   LUMIBOT FISHING - LIVEWELLUI.JS
   Интерфейс сеточного садка (Resident Evil style)
   ========================================================== */

    /* ==========================================================
       САДОК: СЕТОЧНЫЙ ТЕТРИС-ИНВЕНТАРЬ (RESIDENT EVIL STYLE)
       ========================================================== */
    const livewellModal = document.getElementById("livewellModal");
    const openLivewellBtn = document.getElementById("openLivewellBtn");
    const closeLivewellBtn = document.getElementById("closeLivewellBtn");
    const rotateGridItemBtn = document.getElementById("rotateGridItemBtn");
    const discardGridItemBtn = document.getElementById("discardGridItemBtn");

    let selectedLivewellItem = null;

    function getCellBgForRarity(rarity) {
      switch (rarity) {
        case 'Legendary': return 'rgba(245, 158, 11, 0.35)';
        case 'Epic': return 'rgba(168, 85, 247, 0.3)';
        case 'Rare': return 'rgba(6, 182, 212, 0.28)';
        default: return 'rgba(148, 163, 184, 0.2)';
      }
    }

    let draggedLivewellItem = null;
    let dragGrabOffsetX = 0;
    let dragGrabOffsetY = 0;

    function clearDragPreview() {
      const gridContainer = document.getElementById("livewellInventoryGrid");
      if (!gridContainer) return;
      gridContainer.querySelectorAll(".drag-valid, .drag-invalid").forEach(el => {
        el.classList.remove("drag-valid", "drag-invalid");
      });
    }

    function updateDragPreview(originX, originY, item) {
      clearDragPreview();
      const gridContainer = document.getElementById("livewellInventoryGrid");
      if (!gridContainer || !item || typeof GridInventory === 'undefined') return;

      const shape = item.gridShape || GridInventory.getItemGridShape(item);
      const cleanMap = GridInventory.buildGridMap(player.livewell, item.id);
      const canPlace = GridInventory.canPlace(cleanMap, shape, originX, originY);
      const cls = canPlace ? "drag-valid" : "drag-invalid";

      const rows = shape.length;
      const cols = shape[0].length;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (shape[r][c] === 1) {
            const gx = originX + c;
            const gy = originY + r;
            if (gx >= 0 && gx < GridInventory.COLS && gy >= 0 && gy < GridInventory.ROWS) {
              const targetEl = gridContainer.querySelector(`.inv-cell[data-x="${gx}"][data-y="${gy}"]`);
              if (targetEl) targetEl.classList.add(cls);
            }
          }
        }
      }
    }

    function executeMoveItem(item, targetX, targetY) {
      if (!item || typeof GridInventory === 'undefined') return false;
      const shape = item.gridShape || GridInventory.getItemGridShape(item);
      const cleanMap = GridInventory.buildGridMap(player.livewell, item.id);

      if (GridInventory.canPlace(cleanMap, shape, targetX, targetY)) {
        item.gridX = targetX;
        item.gridY = targetY;
        triggerHaptic("medium");
        savePlayerLocal();
        renderLivewell();
        return true;
      } else {
        triggerHaptic("error");
        showToast("Невозможно поместить: ячейки заняты или выходят за край!");
        renderLivewell();
        return false;
      }
    }

    let _gridDelegationInitialized = false;

    function initGridDelegationOnce() {
      const gridContainer = document.getElementById("livewellInventoryGrid");
      if (!gridContainer || _gridDelegationInitialized) return;
      _gridDelegationInitialized = true;

      // Клик (выбор / перемещение)
      gridContainer.addEventListener("click", (e) => {
        const cell = e.target.closest(".inv-cell");
        if (!cell || typeof GridInventory === 'undefined') return;
        const c = parseInt(cell.dataset.x, 10);
        const r = parseInt(cell.dataset.y, 10);
        const gridMap = GridInventory.buildGridMap(player.livewell);
        const item = gridMap[r][c];

        if (item) {
          selectedLivewellItem = item;
          updateSelectedItemControls();
          renderLivewell();
          triggerHaptic("light");
        } else if (selectedLivewellItem) {
          executeMoveItem(selectedLivewellItem, c, r);
        }
      });

      // Подсветка одинаковых ячеек рыбы при наведении
      gridContainer.addEventListener("mouseover", (e) => {
        const cell = e.target.closest(".inv-cell");
        if (!cell || draggedLivewellItem) return;
        const itemId = cell.dataset.itemId;
        if (itemId) {
          gridContainer.querySelectorAll(`[data-item-id="${itemId}"]`).forEach(el => el.classList.add("hover-item"));
        }
      });

      gridContainer.addEventListener("mouseout", (e) => {
        const cell = e.target.closest(".inv-cell");
        if (!cell) return;
        gridContainer.querySelectorAll(".hover-item").forEach(el => el.classList.remove("hover-item"));
      });

      // Десктопный Drag & Drop
      gridContainer.addEventListener("dragstart", (e) => {
        const cell = e.target.closest(".inv-cell");
        if (!cell || typeof GridInventory === 'undefined') return;
        const c = parseInt(cell.dataset.x, 10);
        const r = parseInt(cell.dataset.y, 10);
        const gridMap = GridInventory.buildGridMap(player.livewell);
        const item = gridMap[r][c];
        if (!item) {
          e.preventDefault();
          return;
        }
        draggedLivewellItem = item;
        selectedLivewellItem = item;
        dragGrabOffsetX = c - item.gridX;
        dragGrabOffsetY = r - item.gridY;
        e.dataTransfer.setData("text/plain", String(item.id));
        e.dataTransfer.effectAllowed = "move";
        gridContainer.querySelectorAll(`[data-item-id="${item.id}"]`).forEach(el => el.classList.add("dragging"));
        updateSelectedItemControls();
      });

      gridContainer.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (!draggedLivewellItem) return;
        const cell = e.target.closest(".inv-cell");
        if (!cell) return;
        const c = parseInt(cell.dataset.x, 10);
        const r = parseInt(cell.dataset.y, 10);
        updateDragPreview(c - dragGrabOffsetX, r - dragGrabOffsetY, draggedLivewellItem);
      });

      gridContainer.addEventListener("drop", (e) => {
        e.preventDefault();
        if (!draggedLivewellItem) return;
        const cell = e.target.closest(".inv-cell");
        if (!cell) return;
        const c = parseInt(cell.dataset.x, 10);
        const r = parseInt(cell.dataset.y, 10);
        executeMoveItem(draggedLivewellItem, c - dragGrabOffsetX, r - dragGrabOffsetY);
        clearDragPreview();
        draggedLivewellItem = null;
      });

      gridContainer.addEventListener("dragend", () => {
        clearDragPreview();
        draggedLivewellItem = null;
        gridContainer.querySelectorAll(".dragging").forEach(el => el.classList.remove("dragging"));
      });

      // Мобильный / Touch Drag
      gridContainer.addEventListener("pointerdown", (e) => {
        if (e.pointerType === "mouse" || typeof GridInventory === 'undefined') return;
        const cell = e.target.closest(".inv-cell");
        if (!cell) return;
        const c = parseInt(cell.dataset.x, 10);
        const r = parseInt(cell.dataset.y, 10);
        const gridMap = GridInventory.buildGridMap(player.livewell);
        const item = gridMap[r][c];
        if (!item) return;

        let touchMoved = false;
        const startX = e.clientX;
        const startY = e.clientY;
        const itemToDrag = item;
        const grabX = c - itemToDrag.gridX;
        const grabY = r - itemToDrag.gridY;

        function onPointerMove(pe) {
          const dist = Math.hypot(pe.clientX - startX, pe.clientY - startY);
          if (dist > 8) {
            touchMoved = true;
            draggedLivewellItem = itemToDrag;
            selectedLivewellItem = itemToDrag;
            const under = document.elementFromPoint(pe.clientX, pe.clientY);
            const underCell = under ? under.closest(".inv-cell") : null;
            if (underCell) {
              const uc = parseInt(underCell.dataset.x, 10);
              const ur = parseInt(underCell.dataset.y, 10);
              updateDragPreview(uc - grabX, ur - grabY, itemToDrag);
            }
          }
        }

        function onPointerUp(pe) {
          window.removeEventListener("pointermove", onPointerMove);
          window.removeEventListener("pointerup", onPointerUp);
          window.removeEventListener("pointercancel", onPointerUp);
          if (touchMoved && draggedLivewellItem) {
            const under = document.elementFromPoint(pe.clientX, pe.clientY);
            const underCell = under ? under.closest(".inv-cell") : null;
            if (underCell) {
              const uc = parseInt(underCell.dataset.x, 10);
              const ur = parseInt(underCell.dataset.y, 10);
              executeMoveItem(draggedLivewellItem, uc - grabX, ur - grabY);
            }
            clearDragPreview();
            draggedLivewellItem = null;
          }
        }

        window.addEventListener("pointermove", onPointerMove);
        window.addEventListener("pointerup", onPointerUp);
        window.addEventListener("pointercancel", onPointerUp);
      });
    }

    function renderLivewell() {
      const cellCountEl = document.getElementById("livewellCellCount");
      const summaryCount = document.getElementById("livewellSummaryCount");
      const gridContainer = document.getElementById("livewellInventoryGrid");

      if (!gridContainer || typeof GridInventory === 'undefined') return;
      initGridDelegationOnce();

      const occupied = GridInventory.getOccupiedCellsCount(player.livewell);
      if (cellCountEl) cellCountEl.textContent = occupied;
      if (summaryCount) summaryCount.textContent = `${player.livewell.length} шт.`;

      const gridMap = GridInventory.buildGridMap(player.livewell);
      gridContainer.innerHTML = '';

      // Создаем фрагмент для единовременной вставки всех 48 ячеек
      const fragment = document.createDocumentFragment();

      for (let r = 0; r < GridInventory.ROWS; r++) {
        for (let c = 0; c < GridInventory.COLS; c++) {
          const cell = document.createElement("div");
          cell.className = "inv-cell";
          cell.dataset.x = c;
          cell.dataset.y = r;

          const itemAtCell = gridMap[r][c];
          if (itemAtCell) {
            cell.classList.add("occupied");
            cell.dataset.itemId = itemAtCell.id;
            cell.setAttribute("draggable", "true");

            if (selectedLivewellItem && selectedLivewellItem.id === itemAtCell.id) {
              cell.classList.add("selected");
            }
            cell.style.background = getCellBgForRarity(itemAtCell.rarity);

            // Главная опорная ячейка рыбы (gridX, gridY)
            if (itemAtCell.gridX === c && itemAtCell.gridY === r) {
              const label = document.createElement("div");
              label.className = "inv-cell-content";
              const shortName = itemAtCell.name.length > 5 ? itemAtCell.name.slice(0, 4) + '…' : itemAtCell.name;
              label.innerHTML = `<span style="color:${itemAtCell.color || '#fff'};font-weight:700;">${shortName}</span><span style="font-size:8px;color:#94a3b8;">${itemAtCell.weight}k</span>`;
              cell.appendChild(label);
            } else {
              const dot = document.createElement("div");
              dot.className = "inv-cell-connector";
              cell.appendChild(dot);
            }
          }

          fragment.appendChild(cell);
        }
      }

      gridContainer.appendChild(fragment);
      updateSelectedItemControls();
    }

    function updateSelectedItemControls() {
      const nameEl = document.getElementById("selectedItemName");
      const subEl = document.getElementById("selectedItemSub");
      if (!rotateGridItemBtn || !discardGridItemBtn) return;

      if (!selectedLivewellItem) {
        if (nameEl) nameEl.textContent = "Нажмите на рыбу в садке";
        if (subEl) subEl.textContent = "Перетаскивайте или двигайте ячейки";
        rotateGridItemBtn.disabled = true;
        discardGridItemBtn.disabled = true;
        return;
      }

      const shape = selectedLivewellItem.gridShape || GridInventory.getItemGridShape(selectedLivewellItem);
      const cellsCount = GridInventory.countShapeCells(shape);

      if (nameEl) nameEl.textContent = `${selectedLivewellItem.name} (${selectedLivewellItem.weight} кг)`;
      if (subEl) subEl.textContent = `Форма: ${cellsCount} яч. | Цена у скупщика: ${selectedLivewellItem.price} C`;
      rotateGridItemBtn.disabled = false;
      discardGridItemBtn.disabled = false;
    }

    function tryMoveSelectedItem(targetX, targetY) {
      if (!selectedLivewellItem) return;
      executeMoveItem(selectedLivewellItem, targetX, targetY);
    }

    function rotateSelectedItem() {
      if (!selectedLivewellItem || typeof GridInventory === 'undefined') return;
      const currentShape = selectedLivewellItem.gridShape || GridInventory.getItemGridShape(selectedLivewellItem);
      const rotated = GridInventory.rotateMatrix(currentShape);
      const gridMap = GridInventory.buildGridMap(player.livewell, selectedLivewellItem.id);

      let bestX = selectedLivewellItem.gridX;
      let bestY = selectedLivewellItem.gridY;
      let fits = false;

      const offsets = [
        [0, 0], [-1, 0], [0, -1], [1, 0], [0, 1], [-2, 0], [0, -2], [1, -1], [-1, 1]
      ];

      for (const [ox, oy] of offsets) {
        const tx = selectedLivewellItem.gridX + ox;
        const ty = selectedLivewellItem.gridY + oy;
        if (GridInventory.canPlace(gridMap, rotated, tx, ty)) {
          bestX = tx;
          bestY = ty;
          fits = true;
          break;
        }
      }

      if (fits) {
        selectedLivewellItem.gridX = bestX;
        selectedLivewellItem.gridY = bestY;
        selectedLivewellItem.gridShape = rotated;
        triggerHaptic("medium");
        savePlayerLocal();
        renderLivewell();
        showToast("Предмет повёрнут на 90°");
      } else {
        triggerHaptic("error");
        showToast("Недостаточно места для поворота предмета!");
      }
    }

    function discardSelectedItem() {
      if (!selectedLivewellItem) return;
      const itemName = selectedLivewellItem.name;
      const index = player.livewell.findIndex(i => i.id === selectedLivewellItem.id);
      if (index !== -1) {
        const discarded = player.livewell.splice(index, 1)[0];
        selectedLivewellItem = null;
        triggerHaptic("heavy");
        savePlayerLocal();
        updatePlayerHUD();
        renderLivewell();
        showToast(`[${discarded.name}] выпущена обратно в озеро.`);
      }
    }

    if (rotateGridItemBtn) rotateGridItemBtn.addEventListener("click", rotateSelectedItem);
    if (discardGridItemBtn) discardGridItemBtn.addEventListener("click", discardSelectedItem);

    // Горячие клавиши (R - повернуть, Delete - выпустить, стрелки - атлас)
    window.addEventListener("keydown", (e) => {
      if (livewellModal && livewellModal.classList.contains("active")) {
        if (e.key === "r" || e.key === "R" || e.key === "к" || e.key === "К") {
          e.preventDefault();
          rotateSelectedItem();
        } else if (e.key === "Delete" || e.key === "Backspace") {
          e.preventDefault();
          discardSelectedItem();
        } else if (e.key === "Escape") {
          window.FrameNav.close("livewellModal");
        }
      }

      if (atlasModal && atlasModal.classList.contains("active")) {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          if (window.AtlasBook) window.AtlasBook.prevPage();
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          if (window.AtlasBook) window.AtlasBook.nextPage();
        } else if (e.key === "Escape") {
          window.FrameNav.close("atlasModal");
        }
      }
    });

    if (openLivewellBtn) {
      openLivewellBtn.addEventListener("click", openLivewell);
    }

    if (closeLivewellBtn) {
      closeLivewellBtn.addEventListener("click", () => {
        window.FrameNav.close("livewellModal");
      });
    }




function openLivewell() {
  window.FrameNav.open("livewellModal", () => {
    if (typeof renderLivewell === 'function') renderLivewell();
  });
}
window.renderLivewell = renderLivewell;
window.renderLivewellModal = renderLivewell;
window.openLivewell = openLivewell;
