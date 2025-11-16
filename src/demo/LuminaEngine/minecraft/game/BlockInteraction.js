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
        this.raycaster = new THREE.Raycaster();
        this.reach = 5;

        this.blockOutline = null;
    }

    start() {
        this.camera = this.engine.renderer.camera;
        this.inventory = this.gameObject.getComponent(Inventory);

        const outlineGeometry = new THREE.BoxGeometry(1.002, 1.002, 1.002);
        const outlineMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: true, transparent: true, opacity: 0.5 });
        this.blockOutline = new THREE.Mesh(outlineGeometry, outlineMaterial);
        this.blockOutline.visible = false;
        this.engine.renderer.scene.add(this.blockOutline);
    }

    update(deltaTime) {
        if (!this.engine.inputManager.isPointerLocked()) {
             this.blockOutline.visible = false;
            return;
        }

        this.raycaster.setFromCamera({ x: 0, y: 0 }, this.camera);
        
        // Теперь мы пересекаем меши регионов, а не чанков
        const regionMeshes = Object.values(this.world.regions).map(r => r.mesh).filter(m => m);
        const intersects = this.raycaster.intersectObjects(regionMeshes);

        if (intersects.length > 0 && intersects[0].distance < this.reach) {
            const intersect = intersects[0];
            
            const breakPos = intersect.point.clone().addScaledVector(intersect.face.normal, -0.5).floor();
            const placePos = intersect.point.clone().addScaledVector(intersect.face.normal, 0.5).floor();

            this.blockOutline.position.set(breakPos.x + 0.5, breakPos.y + 0.5, breakPos.z + 0.5);
            this.blockOutline.visible = true;

            if (this.engine.inputManager.wasMouseButtonJustPressed(0)) {
                this.breakBlock(breakPos);
            }

            if (this.engine.inputManager.wasMouseButtonJustPressed(2)) {
                this.placeBlock(placePos);
            }
        } else {
            this.blockOutline.visible = false;
        }
    }

    breakBlock(pos) {
        const blockId = this.world.getVoxel(pos.x, pos.y, pos.z);
        if (blockId !== BLOCK.AIR && BLOCK.get(blockId).isBreakable !== false) {
            this.world.setVoxel(pos.x, pos.y, pos.z, BLOCK.AIR);
            this.inventory.addItem(blockId, 1);
            this.updateSurroundingRegions(pos.x, pos.z);
        }
    }

    placeBlock(pos) {
        const selectedItem = this.inventory.getSelectedItem();
        if (selectedItem) {
            const playerCollider = this.gameObject.getComponent(BoxCollider);
            if (!playerCollider) return;

            const playerPos = this.gameObject.transform.position;
            const playerBox = new THREE.Box3().setFromCenterAndSize(playerPos, playerCollider.size);
            
            const blockBox = new THREE.Box3(
                new THREE.Vector3(pos.x, pos.y, pos.z),
                new THREE.Vector3(pos.x + 1, pos.y + 1, pos.z + 1)
            );

            if (playerBox.intersectsBox(blockBox)) {
                return;
            }

            this.world.setVoxel(pos.x, pos.y, pos.z, selectedItem.id);
            this.inventory.removeItemFromSelectedSlot(1);
            this.updateSurroundingRegions(pos.x, pos.z);
        }
    }
    
    // Новая функция для обновления регионов
    updateSurroundingRegions(worldX, worldZ) {
        const CHUNK_SIZE = 16; // Должно совпадать с World.js
        const REGION_SIZE = 4;  // Должно совпадать с World.js
        const REGION_WIDTH_IN_BLOCKS = REGION_SIZE * CHUNK_SIZE;

        const regionsToUpdate = new Set();
        
        // Определяем регион, в котором находится измененный блок
        const centerRegionX = Math.floor(worldX / REGION_WIDTH_IN_BLOCKS);
        const centerRegionZ = Math.floor(worldZ / REGION_WIDTH_IN_BLOCKS);

        const centerRegion = this.world.getRegion(centerRegionX, centerRegionZ);
        if (centerRegion) regionsToUpdate.add(centerRegion);
        
        // Координаты блока внутри региона
        const localX = worldX - centerRegionX * REGION_WIDTH_IN_BLOCKS;
        const localZ = worldZ - centerRegionZ * REGION_WIDTH_IN_BLOCKS;

        // Если блок находится на границе региона, нужно обновить и соседний регион,
        // так как видимость граней изменилась для обоих.
        if (localX === 0) {
            const neighbor = this.world.getRegion(centerRegionX - 1, centerRegionZ);
            if (neighbor) regionsToUpdate.add(neighbor);
        } else if (localX === REGION_WIDTH_IN_BLOCKS - 1) {
            const neighbor = this.world.getRegion(centerRegionX + 1, centerRegionZ);
            if (neighbor) regionsToUpdate.add(neighbor);
        }
        
        if (localZ === 0) {
            const neighbor = this.world.getRegion(centerRegionX, centerRegionZ - 1);
            if (neighbor) regionsToUpdate.add(neighbor);
        } else if (localZ === REGION_WIDTH_IN_BLOCKS - 1) {
            const neighbor = this.world.getRegion(centerRegionX, centerRegionZ + 1);
            if (neighbor) regionsToUpdate.add(neighbor);
        }
        
        regionsToUpdate.forEach(region => region.needsUpdate = true);
    }
}