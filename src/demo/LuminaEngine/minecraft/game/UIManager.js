import { BLOCK } from './blocks.js';
import { TextureGenerator } from './TextureGenerator.js';

export class UIManager {
    constructor(inputManager, settingsManager, saveManagerCallback) {
        this.inputManager = inputManager;
        this.settings = settingsManager;
        this.saveAndQuitCallback = saveManagerCallback;
        
        this.texGen = new TextureGenerator();
        this.iconCache = {}; 
        this.inventoryComponent = null;
        this.cursorItem = null;

        // Mobile State
        this.selectedSlotIndex = -1;
        this.selectedSlotType = null;
        this.touchTimer = null;
        this.longPressTriggered = false;
        this.touchStartX = 0;
        this.touchStartY = 0;

        this.bindHTMLElements();
        this.initPauseMenu();
        this.initOptionsMenu();
        this.initCursorTracking();

        this.inputManager.onPauseToggle = (paused) => { 
            if (paused) this.showScreen(this.pauseMenu); 
            else this.closeAllMenus(); 
        };
    }

    bindHTMLElements() {
        this.hotbarElement = document.getElementById('hotbar');
        this.inventoryElement = document.getElementById('inventory');
        
        this.dragIcon = document.getElementById('drag-icon');
        // Critical for smooth transform positioning
        this.dragIcon.style.position = 'fixed';
        this.dragIcon.style.top = '0';
        this.dragIcon.style.left = '0';
        this.dragIcon.style.pointerEvents = 'none';
        this.dragIcon.style.zIndex = '9999';
        // Remove transition for cursor tracking to prevent "lag" feeling
        this.dragIcon.style.transition = 'none'; 
        this.dragIcon.style.display = 'none';

        this.pauseMenu = document.getElementById('pause-menu');
        this.optionsMenu = document.getElementById('options-menu');
        this.statsMenu = document.getElementById('stats-menu');
    }

    setInventory(inv) { 
        this.inventoryComponent = inv; 
        this.updateAll(); 
    }

    showScreen(el) { 
        this.closeAllMenus();
        if(el){ 
            el.style.display = 'flex'; 
            document.exitPointerLock(); 
        } 
    }
    
    closeAllMenus() { 
        this.pauseMenu.style.display = 'none'; 
        this.optionsMenu.style.display = 'none'; 
        this.statsMenu.style.display = 'none'; 
    }

    toggleInventory(externalOpen = false) {
        if(this.inputManager.isPaused) return;
        
        if (externalOpen) {
            this.inputManager.isInventoryOpen = true;
        } else {
            this.inputManager.isInventoryOpen = !this.inputManager.isInventoryOpen;
        }

        if(this.inputManager.isInventoryOpen){ 
            this.inventoryElement.style.display = 'block'; 
            document.exitPointerLock(); 
            this.updateInventoryWindow(); 
        } else { 
            this.inventoryElement.style.display = 'none'; 
            
            if(this.cursorItem){
                this.inventoryComponent.addItem(this.cursorItem.id, this.cursorItem.count); 
                this.cursorItem = null; 
            } 
            
            for(let i=0; i<4; i++) {
                if(this.inventoryComponent.crafting2x2[i]) {
                    this.inventoryComponent.addItem(this.inventoryComponent.crafting2x2[i].id, this.inventoryComponent.crafting2x2[i].count);
                    this.inventoryComponent.crafting2x2[i] = null;
                }
            }
            this.inventoryComponent.craftingResult = null;

            if(this.inventoryComponent.activeContainerType) {
                this.inventoryComponent.closeContainer();
            }

            this.selectedSlotIndex = -1;
            this.selectedSlotType = null;

            this.updateCursorIcon();
            this.inputManager.lock(); 
        }
    }

    initCursorTracking() { 
        const updatePos = (x, y) => {
             if(this.cursorItem) {
                 // Using transform translates relative to 0,0 (fixed position)
                 // Offset by 25px (half icon size roughly) to center it
                 this.dragIcon.style.transform = `translate(${x - 20}px, ${y - 20}px) scale(1.1)`;
             }
        };

        document.addEventListener('mousemove', (e) => {
            if(this.cursorItem) updatePos(e.clientX, e.clientY);
        }); 

        // Important: Track touch movement so icon follows finger on mobile too
        document.addEventListener('touchmove', (e) => {
            if(this.inputManager.isInventoryOpen && this.cursorItem) {
                 const t = e.touches[0];
                 updatePos(t.clientX, t.clientY);
            }
        }, {passive: true});
    }

    initPauseMenu() { 
        document.getElementById('resume-btn').onclick = () => { this.closeAllMenus(); this.inputManager.isPaused = false; setTimeout(() => this.inputManager.lock(), 10); };
        document.getElementById('options-btn').onclick = () => { this.updateOptionsUI(); this.showScreen(this.optionsMenu); };
        document.getElementById('stats-btn').onclick = () => { this.updateStatsUI(); this.showScreen(this.statsMenu); };
        document.getElementById('save-quit-btn').onclick = () => { if(this.saveAndQuitCallback) this.saveAndQuitCallback(); location.reload(); };
    }
    initOptionsMenu() {
        const bindSlider = (id, k, d, f) => {
            const el = document.getElementById(id);
            if(!el) return;
            el.value = this.settings.get(k);
            el.oninput = (e) => { this.settings.set(k, parseFloat(e.target.value)); document.getElementById(d).textContent = f ? f(e.target.value) : e.target.value; };
        };
        bindSlider('opt-render-dist', 'renderDistance', 'val-render-dist');
        document.getElementById('options-back-btn').onclick = () => this.showScreen(this.pauseMenu);
    }
    updateOptionsUI() { }
    updateStatsUI() { }

    getBlockIconUrl(blockId) {
        if (this.iconCache[blockId]) return this.iconCache[blockId];
        const p = BLOCK.get(blockId);
        let texKey = '';
        if (typeof p.texture === 'object') texKey = p.texture.front || p.texture.side; 
        else texKey = p.texture;
        if (!texKey) return '';
        const texture = this.texGen.generate(texKey);
        const dataUrl = texture.image.toDataURL();
        this.iconCache[blockId] = dataUrl;
        return dataUrl;
    }
    
    createSlotElement(item, i, type, clickHandler) {
        const s = document.createElement('div'); 
        s.className = 'slot';
        
        if (type === 'hotbar_hud' && i === this.inventoryComponent.selectedSlot) s.classList.add('selected');
        if (type === 'result') s.style.backgroundColor = '#8b8b6b';

        // Highlighting for Mobile Selection
        if (this.inputManager.isMobile() && this.selectedSlotIndex === i && this.selectedSlotType === type) {
            s.style.borderColor = '#ffff00';
            s.style.boxShadow = '0 0 4px #ffff00';
        }

        if(item) { 
            const url = this.getBlockIconUrl(item.id);
            s.style.backgroundImage = `url(${url})`; 
            if(item.count > 1) s.innerHTML = `<div class="item-count">${item.count}</div>`; 
        }
        
        // --- PC Interaction ---
        s.onmousedown = (e) => {
            if(!this.inputManager.isInventoryOpen && type !== 'hotbar_hud') return;
            e.preventDefault(); 
            e.stopPropagation();
            if(clickHandler) clickHandler(i, e.button === 2);
            
            // Immediate visual update for cursor
            if(this.cursorItem) {
                this.dragIcon.style.display = 'block';
                this.dragIcon.style.transform = `translate(${e.clientX - 20}px, ${e.clientY - 20}px) scale(1.1)`;
            }
        };

        // --- Mobile Interaction ---
        s.ontouchstart = (e) => {
            if(!this.inputManager.isInventoryOpen) return;
            // Don't prevent default immediately to allow scrolling, but here we likely want to prevent
            // e.preventDefault(); 
            
            const touch = e.touches[0];
            this.touchStartX = touch.clientX;
            this.touchStartY = touch.clientY;
            this.longPressTriggered = false;

            // Start Long Press Timer (for Splitting)
            this.touchTimer = setTimeout(() => {
                this.longPressTriggered = true;
                if (navigator.vibrate) navigator.vibrate(30); // Haptic feedback
                this.handleMobileLongPress(type, i);
            }, 500);
        };

        s.ontouchend = (e) => {
            if(!this.inputManager.isInventoryOpen) return;
            
            // Cancel timer if finger lifted early
            if (this.touchTimer) clearTimeout(this.touchTimer);

            // Calculate movement to ignore swipes
            const touch = e.changedTouches[0];
            const dx = Math.abs(touch.clientX - this.touchStartX);
            const dy = Math.abs(touch.clientY - this.touchStartY);

            if (dx < 10 && dy < 10) {
                // If it wasn't a long press, it's a Tap
                if (!this.longPressTriggered) {
                    e.preventDefault(); // Prevent click emulation
                    this.handleMobileTap(type, i);
                }
            }
        };

        return s;
    }

    // Mobile: Tap to Select / Move / Place All
    handleMobileTap(type, index) {
        // If we have a cursor item (dragged/picked up), Tap acts like Left Click (Place All)
        if (this.cursorItem) {
            this.handleSlotClick(type, index, false);
            this.selectedSlotIndex = -1; 
            return;
        }

        const list = this.getListByType(type);
        const item = list[index];

        // 1. Select Slot
        if (this.selectedSlotIndex === -1) {
            if (item) {
                this.selectedSlotType = type;
                this.selectedSlotIndex = index;
            }
        } 
        // 2. Deselect if same
        else if (this.selectedSlotIndex === index && this.selectedSlotType === type) {
            this.selectedSlotIndex = -1;
            this.selectedSlotType = null;
        } 
        // 3. Move/Swap if different slot tapped
        else {
            this.executeMobileMove(type, index);
        }

        this.updateAll();
    }

    // Mobile: Long Press to Split / Place One
    handleMobileLongPress(type, index) {
        // Behaves like Right Click
        // 1. If holding nothing -> Split stack in half
        // 2. If holding something -> Place one
        
        // We reuse the existing logic, forcing isRightClick = true
        this.handleSlotClick(type, index, true);
        
        // Reset selection visual to avoid confusion
        this.selectedSlotIndex = -1; 
        this.selectedSlotType = null;
    }

    executeMobileMove(targetType, targetIndex) {
        const sourceList = this.getListByType(this.selectedSlotType);
        const targetList = this.getListByType(targetType);

        if (!sourceList || !targetList) return;

        const sourceItem = sourceList[this.selectedSlotIndex];
        const targetItem = targetList[targetIndex];

        if (!sourceItem) {
            this.selectedSlotIndex = -1; 
            return;
        }

        // Logic similar to PC handleSlotClick but direct source->target without cursor
        if (!targetItem) {
            // Move to empty
            targetList[targetIndex] = sourceItem;
            sourceList[this.selectedSlotIndex] = null;
        } else {
            // Target occupied
            if (sourceItem.id === targetItem.id) {
                // Stack
                const space = 64 - targetItem.count;
                const add = Math.min(space, sourceItem.count);
                targetItem.count += add;
                sourceItem.count -= add;
                if (sourceItem.count <= 0) sourceList[this.selectedSlotIndex] = null;
            } else {
                // Swap
                targetList[targetIndex] = sourceItem;
                sourceList[this.selectedSlotIndex] = targetItem;
            }
        }

        this.selectedSlotIndex = -1;
        this.selectedSlotType = null;
        this.recalcRecipes(this.selectedSlotType);
        this.recalcRecipes(targetType);
    }

    updateAll() { 
        if(!this.inventoryComponent) return; 
        this.updateHotbarHUD(); 
        if(this.inputManager.isInventoryOpen){
            this.updateInventoryWindow();
            this.updateCursorIcon();
        } 
    }

    updateCursorIcon() { 
        if(this.cursorItem){
            this.dragIcon.style.display = 'block'; 
            const url = this.getBlockIconUrl(this.cursorItem.id);
            this.dragIcon.style.backgroundImage = `url(${url})`; 
            this.dragIcon.innerHTML = this.cursorItem.count > 1 ? `<div class="item-count">${this.cursorItem.count}</div>` : ''; 
        } else {
            this.dragIcon.style.display = 'none';
        } 
    }

    updateHotbarHUD() { 
        this.hotbarElement.innerHTML = ''; 
        for(let i=0; i<9; i++) {
            this.hotbarElement.appendChild(this.createSlotElement(this.inventoryComponent.hotbar[i], i, 'hotbar_hud')); 
        }
    }

    updateInventoryWindow() { 
        const invContainer = this.inventoryElement;
        invContainer.innerHTML = ''; 

        // -- Container Construction --
        const title = document.createElement('div');
        title.className = 'inv-title';
        title.innerText = this.inventoryComponent.activeContainerType ? 
            (this.inventoryComponent.activeContainerType === 'workbench' ? 'Crafting Table' : 'Furnace') : 'Crafting';
        invContainer.appendChild(title);

        const containerDiv = document.createElement('div');
        containerDiv.style.display = 'flex';
        containerDiv.style.justifyContent = 'center';
        containerDiv.style.alignItems = 'center';
        containerDiv.style.marginBottom = '15px';

        if (this.inventoryComponent.activeContainerType === 'workbench') {
            const gridDiv = document.createElement('div');
            gridDiv.style.display = 'grid';
            gridDiv.style.gridTemplateColumns = 'repeat(3, 44px)';
            gridDiv.className = 'inventory-grid';
            for(let i=0; i<9; i++) {
                gridDiv.appendChild(this.createSlotElement(this.inventoryComponent.containerGrid[i], i, 'container', (idx, rb) => this.handleSlotClick('container', idx, rb)));
            }
            containerDiv.appendChild(gridDiv);
            const arrow = document.createElement('div'); arrow.innerHTML = '&#10132;'; arrow.style.fontSize = '30px'; arrow.style.margin = '0 10px';
            containerDiv.appendChild(arrow);
            containerDiv.appendChild(this.createSlotElement(this.inventoryComponent.containerResult, 0, 'result', () => this.handleCraftResultClick(true)));

        } else if (this.inventoryComponent.activeContainerType === 'furnace') {
            const leftCol = document.createElement('div');
            leftCol.appendChild(this.createSlotElement(this.inventoryComponent.containerGrid[0], 0, 'container', (idx, rb) => this.handleSlotClick('container', idx, rb)));
            const fire = document.createElement('div'); fire.style.height = '30px'; fire.style.textAlign = 'center';
            if (this.inventoryComponent.containerExtra.burnTime > 0) fire.innerHTML = '🔥';
            leftCol.appendChild(fire);
            leftCol.appendChild(this.createSlotElement(this.inventoryComponent.containerGrid[1], 1, 'container', (idx, rb) => this.handleSlotClick('container', idx, rb)));
            containerDiv.appendChild(leftCol);
            const arrow = document.createElement('div'); arrow.innerHTML = '&#10132;'; arrow.style.fontSize = '30px'; arrow.style.margin = '0 20px';
            if(this.inventoryComponent.containerExtra.cookTime > 0) arrow.style.color = 'orange';
            containerDiv.appendChild(arrow);
            containerDiv.appendChild(this.createSlotElement(this.inventoryComponent.containerGrid[2], 2, 'result', (idx, rb) => this.handleSlotClick('container', idx, rb)));
        
        } else {
            const gridDiv = document.createElement('div');
            gridDiv.style.display = 'grid';
            gridDiv.style.gridTemplateColumns = 'repeat(2, 44px)';
            gridDiv.className = 'inventory-grid';
            for(let i=0; i<4; i++) {
                gridDiv.appendChild(this.createSlotElement(this.inventoryComponent.crafting2x2[i], i, 'crafting', (idx, rb) => this.handleSlotClick('crafting', idx, rb)));
            }
            containerDiv.appendChild(gridDiv);
            const arrow = document.createElement('div'); arrow.innerHTML = '&#10132;'; arrow.style.fontSize = '20px'; arrow.style.margin = '0 10px';
            containerDiv.appendChild(arrow);
            containerDiv.appendChild(this.createSlotElement(this.inventoryComponent.craftingResult, 0, 'result', () => this.handleCraftResultClick(false)));
        }
        invContainer.appendChild(containerDiv);

        const invTitle = document.createElement('div'); invTitle.className = 'inv-title'; invTitle.innerText = 'Inventory';
        invContainer.appendChild(invTitle);

        const mainGrid = document.createElement('div');
        mainGrid.className = 'inventory-grid';
        mainGrid.style.gridTemplateColumns = 'repeat(9, 44px)';
        for(let i=0; i<27; i++) {
            mainGrid.appendChild(this.createSlotElement(this.inventoryComponent.main[i], i, 'main', (idx, rb) => this.handleSlotClick('main', idx, rb)));
        }
        invContainer.appendChild(mainGrid);

        const hbTitle = document.createElement('div'); hbTitle.className = 'inv-title'; hbTitle.innerText = 'Hotbar'; hbTitle.style.marginTop = '10px';
        invContainer.appendChild(hbTitle);

        const hotbarGrid = document.createElement('div');
        hotbarGrid.className = 'inventory-grid';
        hotbarGrid.style.gridTemplateColumns = 'repeat(9, 44px)';
        for(let i=0; i<9; i++) {
            hotbarGrid.appendChild(this.createSlotElement(this.inventoryComponent.hotbar[i], i, 'hotbar', (idx, rb) => this.handleSlotClick('hotbar', idx, rb)));
        }
        invContainer.appendChild(hotbarGrid);
    }

    getListByType(type) {
        if (type === 'main') return this.inventoryComponent.main;
        if (type === 'hotbar') return this.inventoryComponent.hotbar;
        if (type === 'crafting') return this.inventoryComponent.crafting2x2;
        if (type === 'container') return this.inventoryComponent.containerGrid;
        return null;
    }

    handleSlotClick(type, index, isRightClick) {
        const list = this.getListByType(type);
        if(!list) return;

        const clickedItem = list[index];

        // Furnace Result Slot Protection
        if (type === 'container' && this.inventoryComponent.activeContainerType === 'furnace' && index === 2) {
             if(clickedItem && !this.cursorItem) {
                 this.cursorItem = clickedItem;
                 list[index] = null;
             } else if(clickedItem && this.cursorItem && clickedItem.id === this.cursorItem.id) {
                 if(this.cursorItem.count + clickedItem.count <= 64) {
                     this.cursorItem.count += clickedItem.count;
                     list[index] = null;
                 }
             }
             this.updateAll();
             return;
        }

        if (!this.cursorItem) {
            // Pick up
            if (clickedItem) {
                if (isRightClick) {
                    const take = Math.ceil(clickedItem.count / 2);
                    this.cursorItem = { id: clickedItem.id, count: take };
                    clickedItem.count -= take;
                    if(clickedItem.count <= 0) list[index] = null;
                } else {
                    this.cursorItem = clickedItem;
                    list[index] = null;
                }
            }
        } else {
            // Place / Swap
            if (!clickedItem) {
                if (isRightClick) {
                    list[index] = { id: this.cursorItem.id, count: 1 };
                    this.cursorItem.count--;
                    if(this.cursorItem.count <= 0) this.cursorItem = null;
                } else {
                    list[index] = this.cursorItem;
                    this.cursorItem = null;
                }
            } else {
                if (clickedItem.id === this.cursorItem.id) {
                    if (isRightClick) {
                        if (clickedItem.count < 64) {
                            clickedItem.count++;
                            this.cursorItem.count--;
                            if(this.cursorItem.count <= 0) this.cursorItem = null;
                        }
                    } else {
                        const space = 64 - clickedItem.count;
                        const add = Math.min(space, this.cursorItem.count);
                        clickedItem.count += add;
                        this.cursorItem.count -= add;
                        if (this.cursorItem.count <= 0) this.cursorItem = null;
                    }
                } else {
                    if (!isRightClick) {
                        list[index] = this.cursorItem;
                        this.cursorItem = clickedItem;
                    }
                }
            }
        }
        
        this.recalcRecipes(type);
        this.updateAll();
    }

    recalcRecipes(type) {
        if (type === 'crafting' || (type === 'container' && this.inventoryComponent.activeContainerType === 'workbench')) {
            this.updateCraftingResult();
        }
    }

    updateCraftingResult() {
        const inv = this.inventoryComponent;
        if (inv.activeContainerType === 'workbench') {
            inv.containerResult = inv.checkCrafting(inv.containerGrid, 3);
        } else {
            inv.craftingResult = inv.checkCrafting(inv.crafting2x2, 2);
        }
    }

    handleCraftResultClick(isWorkbench) {
        const inv = this.inventoryComponent;
        const resultItem = isWorkbench ? inv.containerResult : inv.craftingResult;
        const grid = isWorkbench ? inv.containerGrid : inv.crafting2x2;

        if (!resultItem) return;

        if (!this.cursorItem) {
            this.cursorItem = { ...resultItem }; // Copy
            this.consumeIngredients(grid);
            this.updateCraftingResult(); 
        } else if (this.cursorItem.id === resultItem.id && this.cursorItem.count + resultItem.count <= 64) {
            this.cursorItem.count += resultItem.count;
            this.consumeIngredients(grid);
            this.updateCraftingResult();
        }
        this.updateAll();
    }

    consumeIngredients(grid) {
        for(let i=0; i<grid.length; i++) {
            if(grid[i]) {
                grid[i].count--;
                if(grid[i].count <= 0) grid[i] = null;
            }
        }
    }
}