// game/UIManager.js
import { BLOCK } from './blocks.js';

export class UIManager {
    constructor() {
        this.hotbarElement = document.getElementById('hotbar');
        this.inventoryElement = document.getElementById('inventory');
        this.mainInventoryGrid = document.getElementById('main-inventory-grid');
        this.hotbarInventoryGrid = document.getElementById('hotbar-inventory-grid');
        this.inventoryVisible = false;
    }

    toggleInventory() {
        this.inventoryVisible = !this.inventoryVisible;
        this.inventoryElement.style.display = this.inventoryVisible ? 'block' : 'none';
        if (this.inventoryVisible) {
            document.exitPointerLock();
        }
    }

    updateHotbar(hotbarData, selectedSlot) {
        this.hotbarElement.innerHTML = '';
        for (let i = 0; i < 9; i++) {
            const slot = document.createElement('div');
            slot.className = 'hotbar-slot';
            if (i === selectedSlot) {
                slot.classList.add('selected');
            }

            const item = hotbarData[i];
            if (item) {
                const blockProps = BLOCK.get(item.id);
                const texture = typeof blockProps.texture === 'object' ? blockProps.texture.side : blockProps.texture;
                slot.style.backgroundImage = `url(textures/${texture})`;
                
                const count = document.createElement('div');
                count.className = 'item-count';
                count.textContent = item.count > 1 ? item.count : '';
                slot.appendChild(count);
            }
            this.hotbarElement.appendChild(slot);
        }
    }
    
    updateInventory(inventoryData, hotbarData) {
        // This is simplified, just showing the grid for now. Full drag-drop is complex.
        this.mainInventoryGrid.innerHTML = '';
        for(let i = 0; i < 27; i++) {
            const slot = document.createElement('div');
            slot.className = 'hotbar-slot';
            this.mainInventoryGrid.appendChild(slot);
        }
        
        this.hotbarInventoryGrid.innerHTML = '';
        for (let i = 0; i < 9; i++) {
            const slot = document.createElement('div');
            slot.className = 'hotbar-slot';
             const item = hotbarData[i];
            if (item) {
                const blockProps = BLOCK.get(item.id);
                const texture = typeof blockProps.texture === 'object' ? blockProps.texture.side : blockProps.texture;
                slot.style.backgroundImage = `url(textures/${texture})`;
            }
            this.hotbarInventoryGrid.appendChild(slot);
        }
    }
}