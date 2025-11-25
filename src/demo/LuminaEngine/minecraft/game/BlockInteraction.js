import { Component } from '../Lumina/js/core/Component.js';
import { Inventory } from './Inventory.js';
import { BLOCK } from './blocks.js';
import * as THREE from 'three';
import { BoxCollider } from '../Lumina/js/physics/Colliders.js';

export class BlockInteraction extends Component {
    constructor(gameObject, world, soundManager) {
        super(gameObject);
        this.world = world;
        this.soundManager = soundManager;
        this.camera = null;
        this.inventory = null;
        this.reach = 5;

        this.blockOutline = null;
        this.targetBlock = null; 
        this.placePosition = null;

        this.isBreaking = false;
        this.breakProgress = 0;
        this.breakSpeed = 1.5;
        this.breakOverlay = null;
        this.breakTextures = [];
    }

    start() {
        this.camera = this.engine.renderer.camera;
        this.inventory = this.gameObject.getComponent(Inventory);

        const geometry = new THREE.BoxGeometry(1.005, 1.005, 1.005);
        const edges = new THREE.EdgesGeometry(geometry);
        const material = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
        this.blockOutline = new THREE.LineSegments(edges, material);
        this.blockOutline.visible = false;
        this.engine.renderer.scene.add(this.blockOutline);

        const overlayGeo = new THREE.BoxGeometry(1.01, 1.01, 1.01);
        const overlayMat = new THREE.MeshBasicMaterial({ 
            transparent: true, opacity: 0.8, depthWrite: false, depthTest: true, polygonOffset: true, polygonOffsetFactor: -1,
        });
        this.breakOverlay = new THREE.Mesh(overlayGeo, overlayMat);
        this.breakOverlay.visible = false;
        this.engine.renderer.scene.add(this.breakOverlay);

        for(let i=0; i<10; i++) this.breakTextures.push(this.createCrackTexture(i));
    }

    createCrackTexture(stage) {
        const canvas = document.createElement('canvas');
        canvas.width = 64; canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0,0,64,64);
        if (stage >= 0) {
            ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.lineWidth = 4; ctx.beginPath();
            const count = (stage + 1) * 1.5;
            for(let i=0; i<count; i++) {
                const angle = (i / count) * Math.PI * 2;
                ctx.moveTo(32, 32);
                ctx.lineTo(32 + Math.cos(angle) * 30, 32 + Math.sin(angle) * 30);
            }
            ctx.stroke();
        }
        const tex = new THREE.CanvasTexture(canvas);
        tex.magFilter = THREE.NearestFilter;
        return tex;
    }

    update(deltaTime) {
        if (this.engine.inputManager.isInventoryOpen || this.engine.inputManager.isPaused) {
             this.resetBreaking();
             return;
        }

        this.performRaycast();

        if (this.targetBlock) {
            this.blockOutline.visible = true;
            this.blockOutline.position.set(this.targetBlock.x + 0.5, this.targetBlock.y + 0.5, this.targetBlock.z + 0.5);

            if (this.engine.inputManager.isMouseButtonDown(0)) {
                this.updateBreakingProcess(deltaTime);
            } else {
                this.breakProgress = 0;
                this.breakOverlay.visible = false;
            }

            if (this.engine.inputManager.wasMouseButtonJustPressed(2)) {
                if (!this.interactBlock()) {
                    this.placeBlock();
                }
            }
        } else {
            this.resetBreaking();
        }
    }

    resetBreaking() {
        this.blockOutline.visible = false;
        this.breakOverlay.visible = false;
        this.breakProgress = 0;
    }

    updateBreakingProcess(deltaTime) {
        const blockId = this.world.getVoxel(this.targetBlock.x, this.targetBlock.y, this.targetBlock.z);
        const props = BLOCK.get(blockId);
        if (props.isBreakable === false) return;

        let hardness = 1.0; 
        if (blockId === BLOCK.STONE || blockId === BLOCK.COBBLESTONE) hardness = 3.0;
        if (blockId === BLOCK.OAK_LOG || blockId === BLOCK.PLANKS) hardness = 2.0;
        
        const heldItem = this.inventory.getSelectedItem();
        let multiplier = 1;
        if(heldItem) {
             const toolId = heldItem.id;
             if ([BLOCK.WOODEN_PICKAXE, BLOCK.STONE_PICKAXE, BLOCK.IRON_PICKAXE].includes(toolId) && [BLOCK.STONE, BLOCK.COBBLESTONE, BLOCK.COAL_ORE, BLOCK.IRON_ORE, BLOCK.FURNACE].includes(blockId)) {
                 if (toolId === BLOCK.WOODEN_PICKAXE) multiplier = 2;
                 if (toolId === BLOCK.STONE_PICKAXE) multiplier = 4;
                 if (toolId === BLOCK.IRON_PICKAXE) multiplier = 6;
             }
             if ([BLOCK.WOODEN_AXE, BLOCK.STONE_AXE, BLOCK.IRON_AXE].includes(toolId) && [BLOCK.OAK_LOG, BLOCK.PLANKS, BLOCK.CRAFTING_TABLE].includes(blockId)) {
                 multiplier = 3;
             }
             if ([BLOCK.WOODEN_SHOVEL, BLOCK.STONE_SHOVEL, BLOCK.IRON_SHOVEL].includes(toolId) && [BLOCK.DIRT, BLOCK.GRASS, BLOCK.SAND, BLOCK.GRAVEL].includes(blockId)) {
                 multiplier = 3;
             }
        }

        const rate = (1 / hardness) * this.breakSpeed * multiplier;
        this.breakProgress += rate * deltaTime;

        if (this.breakProgress > 0) {
            this.breakOverlay.visible = true;
            this.breakOverlay.position.copy(this.blockOutline.position);
            const stage = Math.floor(this.breakProgress * 10);
            if (stage >= 0 && stage < 10) {
                this.breakOverlay.material.map = this.breakTextures[stage];
                this.breakOverlay.material.needsUpdate = true;
            }
        }

        if (this.breakProgress >= 1.0) {
            this.breakBlock();
            this.breakProgress = 0;
        }
    }

    performRaycast() {
        const start = new THREE.Vector3();
        const dir = new THREE.Vector3();
        this.camera.getWorldPosition(start);
        this.camera.getWorldDirection(dir);
        let x = Math.floor(start.x), y = Math.floor(start.y), z = Math.floor(start.z);
        const stepX = Math.sign(dir.x), stepY = Math.sign(dir.y), stepZ = Math.sign(dir.z);
        const tDeltaX = stepX !== 0 ? Math.abs(1 / dir.x) : Infinity;
        const tDeltaY = stepY !== 0 ? Math.abs(1 / dir.y) : Infinity;
        const tDeltaZ = stepZ !== 0 ? Math.abs(1 / dir.z) : Infinity;
        let tMaxX = stepX > 0 ? (Math.floor(start.x) + 1 - start.x) * tDeltaX : (start.x - Math.floor(start.x)) * tDeltaX;
        let tMaxY = stepY > 0 ? (Math.floor(start.y) + 1 - start.y) * tDeltaY : (start.y - Math.floor(start.y)) * tDeltaY;
        let tMaxZ = stepZ > 0 ? (Math.floor(start.z) + 1 - start.z) * tDeltaZ : (start.z - Math.floor(start.z)) * tDeltaZ;
        let lastSide = null;
        
        this.targetBlock = null;
        this.placePosition = null;

        for (let i = 0; i < this.reach * 2; i++) {
            const blockId = this.world.getVoxel(x, y, z);
            if (blockId !== BLOCK.AIR) {
                if (Math.sqrt((x+0.5-start.x)**2 + (y+0.5-start.y)**2 + (z+0.5-start.z)**2) > this.reach) break;
                this.targetBlock = { x, y, z };
                this.placePosition = { x, y, z };
                if (lastSide === 0) this.placePosition.x -= stepX;
                else if (lastSide === 1) this.placePosition.y -= stepY;
                else if (lastSide === 2) this.placePosition.z -= stepZ;
                return;
            }
            if (tMaxX < tMaxY) {
                if (tMaxX < tMaxZ) { x += stepX; tMaxX += tDeltaX; lastSide = 0; } else { z += stepZ; tMaxZ += tDeltaZ; lastSide = 2; }
            } else {
                if (tMaxY < tMaxZ) { y += stepY; tMaxY += tDeltaY; lastSide = 1; } else { z += stepZ; tMaxZ += tDeltaZ; lastSide = 2; }
            }
        }
    }

    breakBlock() {
        if (!this.targetBlock) return;
        const { x, y, z } = this.targetBlock;
        const blockId = this.world.getVoxel(x, y, z);
        const props = BLOCK.get(blockId);
        
        if (props.isBreakable !== false) {
            this.world.setVoxel(x, y, z, BLOCK.AIR);
            const dropId = (props.drop !== undefined) ? props.drop : blockId;
            if (dropId !== 0) this.inventory.addItem(dropId, 1);
            if (this.soundManager) this.soundManager.playBreak(blockId);
            
            // Clean up block entity if destroyed (Furnace)
            const key = `${x},${y},${z}`;
            if (this.inventory.blockEntities[key]) {
                // Drop items inside furnace
                const fe = this.inventory.blockEntities[key];
                fe.grid.forEach(i => { if(i) this.inventory.addItem(i.id, i.count); });
                delete this.inventory.blockEntities[key];
            }
        }
    }

    interactBlock() {
        if(!this.targetBlock) return false;
        const {x,y,z} = this.targetBlock;
        const id = this.world.getVoxel(x,y,z);
        const key = `${x},${y},${z}`;
        
        if (id === BLOCK.CRAFTING_TABLE) {
            this.inventory.openContainer('workbench');
            this.inventory.uiManager.toggleInventory(true);
            return true;
        } else if (id === BLOCK.FURNACE) {
            this.inventory.openContainer('furnace', key); // Pass location
            this.inventory.uiManager.toggleInventory(true);
            return true;
        }
        return false;
    }

    placeBlock() {
        if (!this.placePosition) return;
        const { x, y, z } = this.placePosition;
        const selectedItem = this.inventory.getSelectedItem();
        
        if (selectedItem) {
            const props = BLOCK.get(selectedItem.id);
            if (props.isItem) return; 

            const collider = this.gameObject.getComponent(BoxCollider);
            const pPos = this.gameObject.transform.position;
            const pBox = new THREE.Box3().setFromCenterAndSize(pPos, collider.size);
            const bBox = new THREE.Box3(new THREE.Vector3(x+0.1,y+0.1,z+0.1), new THREE.Vector3(x+0.9,y+0.9,z+0.9));
            if (pBox.intersectsBox(bBox) && props.isSolid !== false) return;

            this.world.setVoxel(x, y, z, selectedItem.id);
            this.inventory.removeItemFromSelectedSlot(1);
            if (this.soundManager) this.soundManager.playPlace(selectedItem.id);
        }
    }
}