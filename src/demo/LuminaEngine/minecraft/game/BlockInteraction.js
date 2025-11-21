// game/BlockInteraction.js
import { Component } from '../Lumina/js/core/Component.js';
import { Inventory } from './Inventory.js';
import { BLOCK } from './blocks.js';
import * as THREE from 'three';
import { BoxCollider } from '../Lumina/js/physics/Colliders.js';

export class BlockInteraction extends Component {
    constructor(gameObject, world) {
        super(gameObject);
        this.world = world;
        this.camera = null;
        this.inventory = null;
        this.reach = 5; // Дальность 5 блоков

        this.blockOutline = null;
        this.targetBlock = null; // { x, y, z }
        this.placePosition = null; // { x, y, z }
    }

    start() {
        this.camera = this.engine.renderer.camera;
        this.inventory = this.gameObject.getComponent(Inventory);

        // Оптимизированная рамка
        const geometry = new THREE.BoxGeometry(1.01, 1.01, 1.01);
        const edges = new THREE.EdgesGeometry(geometry);
        const material = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
        this.blockOutline = new THREE.LineSegments(edges, material);
        this.blockOutline.visible = false;
        this.engine.renderer.scene.add(this.blockOutline);
    }

    update(deltaTime) {
        if (!this.engine.inputManager.isPointerLocked()) {
             this.blockOutline.visible = false;
            return;
        }

        // 1. Voxel Raycast (Быстрый поиск блока)
        this.performRaycast();

        if (this.targetBlock) {
            this.blockOutline.visible = true;
            this.blockOutline.position.set(
                this.targetBlock.x + 0.5,
                this.targetBlock.y + 0.5,
                this.targetBlock.z + 0.5
            );

            if (this.engine.inputManager.wasMouseButtonJustPressed(0)) {
                this.breakBlock();
            }

            if (this.engine.inputManager.wasMouseButtonJustPressed(2)) {
                this.placeBlock();
            }
        } else {
            this.blockOutline.visible = false;
        }
    }

    // Алгоритм DDA (Digital Differential Analyzer)
    performRaycast() {
        const start = new THREE.Vector3();
        const dir = new THREE.Vector3();
        this.camera.getWorldPosition(start);
        this.camera.getWorldDirection(dir);

        let x = Math.floor(start.x);
        let y = Math.floor(start.y);
        let z = Math.floor(start.z);

        const stepX = Math.sign(dir.x);
        const stepY = Math.sign(dir.y);
        const stepZ = Math.sign(dir.z);

        const tDeltaX = stepX !== 0 ? Math.abs(1 / dir.x) : Infinity;
        const tDeltaY = stepY !== 0 ? Math.abs(1 / dir.y) : Infinity;
        const tDeltaZ = stepZ !== 0 ? Math.abs(1 / dir.z) : Infinity;

        let tMaxX = stepX > 0 ? (Math.floor(start.x) + 1 - start.x) * tDeltaX : (start.x - Math.floor(start.x)) * tDeltaX;
        let tMaxY = stepY > 0 ? (Math.floor(start.y) + 1 - start.y) * tDeltaY : (start.y - Math.floor(start.y)) * tDeltaY;
        let tMaxZ = stepZ > 0 ? (Math.floor(start.z) + 1 - start.z) * tDeltaZ : (start.z - Math.floor(start.z)) * tDeltaZ;

        let lastSide = null; // 0:x, 1:y, 2:z (откуда пришли)
        
        this.targetBlock = null;
        this.placePosition = null;

        // Шагаем по вокселям
        for (let i = 0; i < this.reach * 2; i++) { // *2 для запаса шагов
            // Проверяем блок
            const blockId = this.world.getVoxel(x, y, z);
            
            // Если блок твердый и не вода (пока воды нет, но на будущее)
            if (blockId !== BLOCK.AIR) {
                const props = BLOCK.get(blockId);
                // Пропускаем только совсем неосязаемые блоки (если такие будут)
                
                // Проверяем реальную дистанцию
                const dist = Math.sqrt((x+0.5-start.x)**2 + (y+0.5-start.y)**2 + (z+0.5-start.z)**2);
                if (dist > this.reach) break;

                this.targetBlock = { x, y, z };
                
                // Вычисляем позицию установки (предыдущий шаг)
                this.placePosition = { x, y, z };
                if (lastSide === 0) this.placePosition.x -= stepX;
                else if (lastSide === 1) this.placePosition.y -= stepY;
                else if (lastSide === 2) this.placePosition.z -= stepZ;
                
                return; // Нашли блок
            }

            // Шаг DDA
            if (tMaxX < tMaxY) {
                if (tMaxX < tMaxZ) {
                    x += stepX;
                    tMaxX += tDeltaX;
                    lastSide = 0;
                } else {
                    z += stepZ;
                    tMaxZ += tDeltaZ;
                    lastSide = 2;
                }
            } else {
                if (tMaxY < tMaxZ) {
                    y += stepY;
                    tMaxY += tDeltaY;
                    lastSide = 1;
                } else {
                    z += stepZ;
                    tMaxZ += tDeltaZ;
                    lastSide = 2;
                }
            }
        }
    }

    breakBlock() {
        if (!this.targetBlock) return;
        const { x, y, z } = this.targetBlock;
        const blockId = this.world.getVoxel(x, y, z);
        
        if (BLOCK.get(blockId).isBreakable !== false) {
            this.world.setVoxel(x, y, z, BLOCK.AIR);
            this.inventory.addItem(blockId, 1);
            this.updateSurroundingRegions(x, z);
            // Сбрасываем цель, чтобы не удалить следующий блок в том же клике (опционально)
            this.targetBlock = null; 
        }
    }

    placeBlock() {
        if (!this.placePosition) return;
        const { x, y, z } = this.placePosition;
        
        const selectedItem = this.inventory.getSelectedItem();
        if (selectedItem) {
            // Проверка коллизии (не ставим блок в голову)
            const collider = this.gameObject.getComponent(BoxCollider);
            if (collider) {
                const pPos = this.gameObject.transform.position;
                const pBox = new THREE.Box3().setFromCenterAndSize(pPos, collider.size);
                const bBox = new THREE.Box3(new THREE.Vector3(x,y,z), new THREE.Vector3(x+1,y+1,z+1));
                
                // Чуть уменьшаем хитбокс блока для установки, чтобы было удобнее
                bBox.expandByScalar(-0.01); 

                if (pBox.intersectsBox(bBox) && BLOCK.get(selectedItem.id).isSolid !== false) {
                    return;
                }
            }

            this.world.setVoxel(x, y, z, selectedItem.id);
            this.inventory.removeItemFromSelectedSlot(1);
            this.updateSurroundingRegions(x, z);
        }
    }
    
    updateSurroundingRegions(worldX, worldZ) {
        const CHUNK_SIZE = 8;
        const REGION_SIZE = 4;
        const REGION_WIDTH = REGION_SIZE * CHUNK_SIZE;

        const regionX = Math.floor(worldX / REGION_WIDTH);
        const regionZ = Math.floor(worldZ / REGION_WIDTH);

        const regionsToUpdate = new Set();
        const currentRegion = this.world.getRegion(regionX, regionZ);
        if (currentRegion) regionsToUpdate.add(currentRegion);

        let localX = worldX % REGION_WIDTH; if (localX < 0) localX += REGION_WIDTH;
        let localZ = worldZ % REGION_WIDTH; if (localZ < 0) localZ += REGION_WIDTH;

        if (localX === 0) {
            const n = this.world.getRegion(regionX - 1, regionZ);
            if(n) regionsToUpdate.add(n);
        }
        if (localX === REGION_WIDTH - 1) {
            const n = this.world.getRegion(regionX + 1, regionZ);
            if(n) regionsToUpdate.add(n);
        }
        if (localZ === 0) {
            const n = this.world.getRegion(regionX, regionZ - 1);
            if(n) regionsToUpdate.add(n);
        }
        if (localZ === REGION_WIDTH - 1) {
            const n = this.world.getRegion(regionX, regionZ + 1);
            if(n) regionsToUpdate.add(n);
        }

        regionsToUpdate.forEach(r => r.needsUpdate = true);
    }
}