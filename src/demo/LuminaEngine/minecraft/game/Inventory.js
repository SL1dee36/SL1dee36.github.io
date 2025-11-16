// game/Inventory.js
import { Component } from '../Lumina/js/core/Component.js';
import { BLOCK } from './blocks.js';

export class Inventory extends Component {
    constructor(gameObject, uiManager) {
        super(gameObject);
        this.uiManager = uiManager;
        this.hotbar = new Array(9).fill(null);
        this.inventory = new Array(27).fill(null); // 3 rows of 9
        this.selectedSlot = 0;
    }

    start() {
        // Give player some starting blocks
        this.addItem(BLOCK.STONE, 64);
        this.addItem(BLOCK.DIRT, 64);
        this.addItem(BLOCK.OAK_LOG, 64);
        this.addItem(BLOCK.OAK_LEAVES, 64);
        this.updateUI();
    }

    update(deltaTime) {
        const input = this.engine.inputManager;

        // Hotbar selection with scroll wheel
        const scroll = input.getScrollDelta();
        if (scroll !== 0) {
            this.selectedSlot = (this.selectedSlot - scroll + this.hotbar.length) % this.hotbar.length;
            this.updateUI();
        }
        
        // Hotbar selection with number keys
        for(let i = 1; i <= 9; i++) {
            if(input.wasKeyJustPressed(`Digit${i}`)) {
                this.selectedSlot = i - 1;
                this.updateUI();
            }
        }
    }

    addItem(blockId, count = 1) {
        // First, try to stack in hotbar
        for(let i = 0; i < this.hotbar.length; i++) {
            if(this.hotbar[i] && this.hotbar[i].id === blockId && this.hotbar[i].count < 64) {
                this.hotbar[i].count += count;
                this.updateUI();
                return true;
            }
        }
        // Then try empty slot in hotbar
        for(let i = 0; i < this.hotbar.length; i++) {
            if(this.hotbar[i] === null) {
                this.hotbar[i] = { id: blockId, count: count };
                this.updateUI();
                return true;
            }
        }
        // TODO: Add to main inventory
        console.warn("Main inventory is not implemented for adding items yet.");
        return false;
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
            this.updateUI();
            return true;
        }
        return false;
    }

    updateUI() {
        this.uiManager.updateHotbar(this.hotbar, this.selectedSlot);
        this.uiManager.updateInventory(this.inventory, this.hotbar);
    }
    
    getData() {
        return {
            hotbar: this.hotbar,
            inventory: this.inventory
        };
    }
    
    loadData(data) {
        this.hotbar = data.hotbar || new Array(9).fill(null);
        this.inventory = data.inventory || new Array(27).fill(null);
        this.updateUI();
    }
}