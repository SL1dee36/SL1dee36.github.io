import { Component } from '../Lumina/js/core/Component.js';
import { BLOCK } from './blocks.js';
import { RECIPES } from './Recipes.js';

export class Inventory extends Component {
    constructor(gameObject, uiManager) {
        super(gameObject);
        this.uiManager = uiManager;
        
        this.hotbar = new Array(9).fill(null);
        this.main = new Array(27).fill(null);
        this.crafting2x2 = new Array(4).fill(null);
        this.craftingResult = null;

        this.activeContainerType = null; 
        this.activeContainerKey = null; 
        this.containerGrid = null; 
        this.containerResult = null;
        
        this.containerExtra = {}; 
        
        this.blockEntities = {}; 

        this.selectedSlot = 0;
    }

    start() {
        this.addItem(BLOCK.WOODEN_PICKAXE, 1);
        this.addItem(BLOCK.OAK_LOG, 16);
        this.addItem(BLOCK.COBBLESTONE, 16);
        this.addItem(BLOCK.CRAFTING_TABLE, 1);
        this.addItem(BLOCK.FURNACE, 1);
        this.addItem(BLOCK.COAL, 32);
        this.addItem(BLOCK.IRON_ORE, 16);
        this.addItem(BLOCK.SAND, 16);
        
        this.uiManager.setInventory(this);
    }

    update(deltaTime) {
        for (const key in this.blockEntities) {
            this.updateFurnaceLogic(this.blockEntities[key], deltaTime);
        }

        if (this.activeContainerType === 'furnace' && this.uiManager.inputManager.isInventoryOpen) {
             this.uiManager.updateInventoryWindow();
        }

        if (!this.uiManager.isInventoryOpen) {
            const scroll = this.engine.inputManager.getScrollDelta();
            if (scroll !== 0) {
                this.selectedSlot = (this.selectedSlot + scroll + 9) % 9;
                this.uiManager.updateHotbarHUD();
            }
            
            for(let i = 1; i <= 9; i++) {
                if(this.engine.inputManager.wasKeyJustPressed(`Digit${i}`)) {
                    this.selectedSlot = i - 1;
                    this.uiManager.updateHotbarHUD();
                }
            }
        }
    }

    updateFurnaceLogic(data, dt) {
        const input = data.grid[0];
        const fuel = data.grid[1];
        let changed = false;

        if (data.burnTime > 0) {
            data.burnTime -= dt * 20; 
            if(data.burnTime < 0) data.burnTime = 0;
            changed = true;
        }

        const recipeOutput = input ? RECIPES.smelting[input.id] : null;

        if (data.burnTime <= 0 && recipeOutput && fuel && RECIPES.fuels[fuel.id]) {
            const outSlot = data.grid[2];
            if (!outSlot || (outSlot.id === recipeOutput && outSlot.count < 64)) {
                data.maxBurnTime = RECIPES.fuels[fuel.id];
                data.burnTime = data.maxBurnTime;
                fuel.count--;
                if(fuel.count <= 0) data.grid[1] = null;
                changed = true;
            }
        }

        if (data.burnTime > 0 && recipeOutput) {
            const outSlot = data.grid[2];
            if (!outSlot || (outSlot.id === recipeOutput && outSlot.count < 64)) {
                data.cookTime += dt * 20;
                if (data.cookTime >= 200) { 
                    data.cookTime = 0;
                    input.count--;
                    if(input.count <= 0) data.grid[0] = null;

                    if (!data.grid[2]) {
                        data.grid[2] = { id: recipeOutput, count: 1 };
                    } else {
                        data.grid[2].count++;
                    }
                }
                changed = true;
            } else {
                data.cookTime = 0;
            }
        } else {
            if(data.cookTime > 0) {
                data.cookTime = 0;
                changed = true;
            }
        }
        return changed;
    }

    openContainer(type, key = null) {
        this.activeContainerType = type;
        this.activeContainerKey = key;

        if (type === 'workbench') {
            this.containerGrid = new Array(9).fill(null);
            this.containerResult = null;
            this.containerExtra = {}; 
        } else if (type === 'furnace') {
            if (!key) return; 
            
            if (!this.blockEntities[key]) {
                this.blockEntities[key] = {
                    grid: new Array(3).fill(null),
                    burnTime: 0,
                    maxBurnTime: 0,
                    cookTime: 0
                };
            }
            this.activeFurnaceData = this.blockEntities[key]; 
            this.containerGrid = this.activeFurnaceData.grid;
            this.containerExtra = this.activeFurnaceData; 
        }
    }

    closeContainer() {
        if (!this.activeContainerType) return;
        
        if (this.activeContainerType === 'workbench') {
            for(let i=0; i<9; i++) {
                if(this.containerGrid[i]) this.addItem(this.containerGrid[i].id, this.containerGrid[i].count);
            }
        }

        this.activeContainerType = null;
        this.activeContainerKey = null;
        this.containerGrid = null;
        this.containerResult = null;
        this.containerExtra = {}; 
        this.activeFurnaceData = null;
    }

    checkCrafting(grid, width) {
        const result = RECIPES.findCraftingRecipe(grid, width);
        if (result) {
            return { id: result.id, count: result.count };
        }
        return null;
    }

    addItem(blockId, count = 1) {
        let remaining = count;
        remaining = this._addToStacks(this.hotbar, blockId, remaining);
        if (remaining > 0) remaining = this._addToStacks(this.main, blockId, remaining);
        if (remaining > 0) remaining = this._addToEmpty(this.hotbar, blockId, remaining);
        if (remaining > 0) remaining = this._addToEmpty(this.main, blockId, remaining);
        this.uiManager.updateAll();
        return remaining === 0;
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

    getSelectedItem() { return this.hotbar[this.selectedSlot]; }
    
    removeItemFromSelectedSlot(count = 1) {
        const item = this.getSelectedItem();
        if (item) {
            item.count -= count;
            if (item.count <= 0) this.hotbar[this.selectedSlot] = null;
            this.uiManager.updateHotbarHUD();
            return true;
        }
        return false;
    }

    getData() {
        return {
            hotbar: this.hotbar,
            main: this.main,
            selectedSlot: this.selectedSlot,
            blockEntities: this.blockEntities
        };
    }
    
    loadData(data) {
        if (!data) return;
        this.hotbar = data.hotbar || new Array(9).fill(null);
        this.main = data.main || new Array(27).fill(null);
        this.selectedSlot = data.selectedSlot || 0;
        this.blockEntities = data.blockEntities || {};
        this.uiManager.updateAll();
    }
}