// game/UIManager.js
import { BLOCK } from './blocks.js';

export class UIManager {
    constructor(inputManager, settingsManager, saveManagerCallback) {
        this.inputManager = inputManager;
        this.settings = settingsManager;
        this.saveAndQuitCallback = saveManagerCallback;

        this.hotbarElement = document.getElementById('hotbar');
        this.inventoryElement = document.getElementById('inventory');
        this.dragIcon = document.getElementById('drag-icon');
        
        this.pauseMenu = document.getElementById('pause-menu');
        this.optionsMenu = document.getElementById('options-menu');
        this.statsMenu = document.getElementById('stats-menu');
        
        this.inventoryComponent = null;
        this.cursorItem = null;

        this.initPauseMenu();
        this.initOptionsMenu();
        this.initInventoryDrag();
        
        // Обратная связь от InputManager
        this.inputManager.onPauseToggle = (paused) => {
            if (paused) {
                this.showScreen(this.pauseMenu);
            } else {
                this.closeAllMenus();
            }
        };
    }
    
    setInventory(inv) { this.inventoryComponent = inv; this.updateAll(); }

    showScreen(screenElement) {
        this.pauseMenu.style.display = 'none';
        this.optionsMenu.style.display = 'none';
        this.statsMenu.style.display = 'none';
        
        if (screenElement) {
            screenElement.style.display = 'flex';
            document.exitPointerLock();
        }
    }

    closeAllMenus() {
        this.pauseMenu.style.display = 'none';
        this.optionsMenu.style.display = 'none';
        this.statsMenu.style.display = 'none';
    }

    toggleInventory() {
        if (this.inputManager.isPaused) return;

        const isOpen = !this.inputManager.isInventoryOpen;
        this.inputManager.isInventoryOpen = isOpen;

        if (isOpen) {
            this.inventoryElement.style.display = 'block';
            document.exitPointerLock();
            this.updateAll();
        } else {
            this.inventoryElement.style.display = 'none';
            if (this.cursorItem) {
                this.inventoryComponent.addItem(this.cursorItem.id, this.cursorItem.count);
                this.cursorItem = null;
                this.updateCursorIcon();
            }
            // Возвращаем захват на Canvas
            this.inputManager.lock();
        }
    }

    initPauseMenu() {
        document.getElementById('resume-btn').onclick = () => {
            // 1. Скрываем меню визуально сразу, чтобы не было мерцания
            this.closeAllMenus(); 
            
            // 2. Говорим менеджеру, что пауза снята (это важно для логики)
            this.inputManager.isPaused = false; 
            
            // 3. Запрашиваем захват мыши на Canvas с небольшой задержкой,
            // чтобы браузер успел обработать клик и смену фокуса
            setTimeout(() => {
                this.inputManager.lock();
            }, 10);
        };
        
        document.getElementById('options-btn').onclick = () => {
            this.updateOptionsUI();
            this.showScreen(this.optionsMenu);
        };
        
        document.getElementById('stats-btn').onclick = () => {
            this.updateStatsUI();
            this.showScreen(this.statsMenu);
        };
        
        document.getElementById('save-quit-btn').onclick = () => {
            if (this.saveAndQuitCallback) this.saveAndQuitCallback();
            location.reload();
        };
    }

    initOptionsMenu() {
        const bindRange = (id, settingKey, displayId) => {
            const el = document.getElementById(id);
            const display = document.getElementById(displayId);
            el.value = this.settings.get(settingKey);
            display.textContent = el.value;
            el.oninput = (e) => {
                const val = parseFloat(e.target.value);
                this.settings.set(settingKey, val);
                display.textContent = val;
            };
        };

        bindRange('opt-render-dist', 'renderDistance', 'val-render-dist');
        bindRange('opt-quality', 'quality', 'val-quality');
        bindRange('opt-time-speed', 'timeSpeed', 'val-time-speed');
        bindRange('opt-sensitivity', 'sensitivity', 'val-sensitivity');

        const handBtn = document.getElementById('opt-show-hand');
        handBtn.textContent = this.settings.get('showHand') ? 'ON' : 'OFF';
        handBtn.onclick = () => {
            const newVal = !this.settings.get('showHand');
            this.settings.set('showHand', newVal);
            handBtn.textContent = newVal ? 'ON' : 'OFF';
        };

        document.getElementById('options-back-btn').onclick = () => {
            this.showScreen(this.pauseMenu);
        };
    }
    
    updateOptionsUI() {
        document.getElementById('opt-render-dist').value = this.settings.get('renderDistance');
        document.getElementById('val-render-dist').textContent = this.settings.get('renderDistance');
    }

    updateStatsUI() {
        const el = document.getElementById('stats-content');
        const pos = this.inventoryComponent.gameObject.transform.position;
        el.innerHTML = `
            Position: ${pos.x.toFixed(0)}, ${pos.y.toFixed(0)}, ${pos.z.toFixed(0)}<br>
            Biome: Plains<br>
            Seed: ${this.inventoryComponent.engine.physicsEngine.world.seed.toFixed(0)}
        `;
        document.getElementById('stats-back-btn').onclick = () => this.showScreen(this.pauseMenu);
    }

    initInventoryDrag() {
        document.addEventListener('mousemove', (e) => {
            if (this.cursorItem) {
                this.dragIcon.style.left = (e.pageX + 10) + 'px';
                this.dragIcon.style.top = (e.pageY + 10) + 'px';
            }
        });
    }

    createSlotElement(item, index, isHotbar, onClick) {
        const slot = document.createElement('div');
        slot.className = 'slot';
        if (isHotbar && !this.inputManager.isInventoryOpen) slot.className += ' hotbar-slot';
        if (isHotbar && !this.inputManager.isInventoryOpen && index === this.inventoryComponent.selectedSlot) {
            slot.classList.add('selected');
        }

        if (item) {
            const blockProps = BLOCK.get(item.id);
            const texture = typeof blockProps.texture === 'object' ? blockProps.texture.side : blockProps.texture;
            slot.style.backgroundImage = `url(textures/${texture})`;
            if (item.count > 1) slot.innerHTML = `<div class="item-count">${item.count}</div>`;
        }

        slot.onmousedown = (e) => {
            if (this.inputManager.isInventoryOpen) {
                e.stopPropagation();
                onClick(index);
            }
        };
        return slot;
    }

    updateAll() {
        if (!this.inventoryComponent) return;
        this.updateHotbarHUD();
        if (this.inputManager.isInventoryOpen) {
            this.updateInventoryWindow();
            this.updateCursorIcon();
        }
    }

    updateCursorIcon() {
        if (this.cursorItem) {
            this.dragIcon.style.display = 'block';
            const blockProps = BLOCK.get(this.cursorItem.id);
            const texture = typeof blockProps.texture === 'object' ? blockProps.texture.side : blockProps.texture;
            this.dragIcon.style.backgroundImage = `url(textures/${texture})`;
            this.dragIcon.innerHTML = this.cursorItem.count > 1 ? `<div class="item-count">${this.cursorItem.count}</div>` : '';
        } else {
            this.dragIcon.style.display = 'none';
        }
    }

    updateHotbarHUD() {
        this.hotbarElement.innerHTML = '';
        const hotbar = this.inventoryComponent.hotbar;
        for (let i = 0; i < 9; i++) {
            this.hotbarElement.appendChild(this.createSlotElement(hotbar[i], i, true, () => {}));
        }
    }

    updateInventoryWindow() {
        const mainGrid = document.getElementById('main-inventory-grid');
        const hotbarGrid = document.getElementById('hotbar-inventory-grid');
        mainGrid.innerHTML = '';
        hotbarGrid.innerHTML = '';

        for (let i = 0; i < 27; i++) {
            mainGrid.appendChild(this.createSlotElement(this.inventoryComponent.main[i], i, false, (idx) => this.handleSlotClick('main', idx)));
        }
        for (let i = 0; i < 9; i++) {
            hotbarGrid.appendChild(this.createSlotElement(this.inventoryComponent.hotbar[i], i, true, (idx) => this.handleSlotClick('hotbar', idx)));
        }
    }

    handleSlotClick(type, index) {
        const container = type === 'main' ? this.inventoryComponent.main : this.inventoryComponent.hotbar;
        const clicked = container[index];

        if (!this.cursorItem) {
            if (clicked) {
                this.cursorItem = clicked;
                container[index] = null;
            }
        } else {
            if (!clicked) {
                container[index] = this.cursorItem;
                this.cursorItem = null;
            } else {
                if (clicked.id === this.cursorItem.id) {
                    const space = 64 - clicked.count;
                    const add = Math.min(space, this.cursorItem.count);
                    clicked.count += add;
                    this.cursorItem.count -= add;
                    if (this.cursorItem.count <= 0) this.cursorItem = null;
                } else {
                    const temp = container[index];
                    container[index] = this.cursorItem;
                    this.cursorItem = temp;
                }
            }
        }
        this.updateAll();
    }
}