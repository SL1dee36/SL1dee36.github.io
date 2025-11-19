// game/Inventory.js
import { Component } from '../Lumina/js/core/Component.js';
import { BLOCK } from './blocks.js';

export class Inventory extends Component {
    constructor(gameObject, uiManager) {
        super(gameObject);
        this.uiManager = uiManager;
        
        // Данные
        this.hotbar = new Array(9).fill(null);
        this.main = new Array(27).fill(null);
        
        this.selectedSlot = 0;
    }

    start() {
        // Стартовый набор
        this.addItem(BLOCK.STONE, 64);
        this.addItem(BLOCK.DIRT, 64);
        this.addItem(BLOCK.OAK_LOG, 16);
        this.addItem(BLOCK.OAK_LEAVES, 32);
        this.addItem(BLOCK.GRASS, 10);
        
        this.uiManager.setInventory(this);
    }

    update(deltaTime) {
        // Прокрутка колесиком (только если инвентарь закрыт)
        if (!this.uiManager.isInventoryOpen) {
            const scroll = this.engine.inputManager.getScrollDelta();
            if (scroll !== 0) {
                this.selectedSlot = (this.selectedSlot + scroll + 9) % 9;
                this.uiManager.updateHotbarHUD();
            }
            
            // Цифры 1-9
            for(let i = 1; i <= 9; i++) {
                if(this.engine.inputManager.wasKeyJustPressed(`Digit${i}`)) {
                    this.selectedSlot = i - 1;
                    this.uiManager.updateHotbarHUD();
                }
            }
        }
    }

    addItem(blockId, count = 1) {
        let remaining = count;

        // 1. Пытаемся добавить в существующие стаки (сначала хотбар, потом мейн)
        remaining = this._addToStacks(this.hotbar, blockId, remaining);
        if (remaining > 0) remaining = this._addToStacks(this.main, blockId, remaining);

        // 2. Если осталось, кладем в пустые слоты
        if (remaining > 0) remaining = this._addToEmpty(this.hotbar, blockId, remaining);
        if (remaining > 0) remaining = this._addToEmpty(this.main, blockId, remaining);

        this.uiManager.updateAll();
        return remaining === 0; // Вернет true, если все влезло
    }

    _addToStacks(container, id, amount) {
        for(let i = 0; i < container.length; i++) {
            if (amount <= 0) break;
            if (container[i] && container[i].id === id && container[i].count < 64) {
                const space = 64 - container[i].count;
                const toAdd = Math.min(space, amount);
                container[i].count += toAdd;
                amount -= toAdd;
            }
        }
        return amount;
    }

    _addToEmpty(container, id, amount) {
        for(let i = 0; i < container.length; i++) {
            if (amount <= 0) break;
            if (container[i] === null) {
                const toAdd = Math.min(64, amount);
                container[i] = { id: id, count: toAdd };
                amount -= toAdd;
            }
        }
        return amount;
    }

    getSelectedItem() {
        return this.hotbar[this.selectedSlot];
    }
    
    removeItemFromSelectedSlot(count = 1) {
        const item = this.getSelectedItem();
        if (item) {
            item.count -= count;
            if (item.count <= 0) {
                this.hotbar[this.selectedSlot] = null;
            }
            this.uiManager.updateHotbarHUD();
            return true;
        }
        return false;
    }

    getData() {
        return {
            hotbar: this.hotbar,
            main: this.main,
            selectedSlot: this.selectedSlot
        };
    }
    
    loadData(data) {
        if (!data) return;
        this.hotbar = data.hotbar || new Array(9).fill(null);
        this.main = data.main || new Array(27).fill(null);
        this.selectedSlot = data.selectedSlot || 0;
        this.uiManager.updateAll();
    }
}