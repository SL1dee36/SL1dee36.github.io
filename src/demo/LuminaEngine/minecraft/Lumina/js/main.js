// Lumina/js/main.js
import * as THREE from 'three';
import { Engine } from './core/Engine.js';
import { GameObject } from './core/GameObject.js';
import { PlayerController } from '../../game/PlayerController.js';
import { RigidBody } from './physics/RigidBody.js';
import { BoxCollider } from './physics/Colliders.js';
import { World } from '../../game/World.js';
import { Inventory } from '../../game/Inventory.js';
import { UIManager } from '../../game/UIManager.js';
import { BlockInteraction } from '../../game/BlockInteraction.js';
import { DayNightCycle } from '../../game/DayNightCycle.js';
import { SaveManager } from '../../game/SaveManager.js';

function main() {
    const engine = new Engine('game-canvas');
    const uiManager = new UIManager();
    const saveManager = new SaveManager();

    const startMenu = document.getElementById('start-menu');
    const newWorldBtn = document.getElementById('new-world-btn');
    const loadWorldBtn = document.getElementById('load-world-btn');

    loadWorldBtn.disabled = !saveManager.hasSavedWorld();

    newWorldBtn.addEventListener('click', () => {
        startGame(null);
    });

    loadWorldBtn.addEventListener('click', () => {
        const saveData = saveManager.loadWorld();
        if (saveData) {
            startGame(saveData);
        } else {
            alert("Ошибка загрузки мира!");
        }
    });

    function startGame(saveData) {
        startMenu.style.display = 'none';

        // --- ИЗМЕНЕНИЕ: Передаем renderer в конструктор World ---
        // Наш новый GPUWorldGenerator требует прямого доступа к экземпляру
        // THREE.WebGLRenderer для выполнения закадрового рендеринга.
        const world = new World(engine.renderer.scene, undefined, engine.renderer.renderer);
        engine.physicsEngine.setWorld(world);

        if (saveData) {
            // --- ИЗМЕНЕНИЕ: Передаем renderer также и в loadData ---
            // Это нужно, чтобы при загрузке мира GPUWorldGenerator был
            // пересоздан с правильным seed'ом.
            world.loadData(saveData.world, engine.renderer.renderer);
        } else {
            world.generate();
        }

        // --- Create Player ---
        const player = new GameObject('Player');
        player.addComponent(RigidBody, { bodyType: 'dynamic' });
        player.addComponent(BoxCollider, new THREE.Vector3(0.6, 1.8, 0.6));
        player.addComponent(PlayerController);
        const inventory = player.addComponent(Inventory, uiManager);
        player.addComponent(BlockInteraction, world);
        
        // --- Логика безопасного спавна ---
        if (saveData && saveData.player) {
            player.transform.position.fromArray(saveData.player.position);
            player.transform.rotation.fromArray(saveData.player.rotation);
            inventory.loadData(saveData.player.inventory);
        } else {
            const spawnX = 8;
            const spawnZ = 8;
            let spawnY = 128; 
            let groundFound = false;

            while(spawnY > 0) {
                const blockId = world.getVoxel(spawnX, spawnY, spawnZ);
                if (blockId !== 0) {
                    groundFound = true;
                    break;
                }
                spawnY--;
            }

            if (!groundFound) {
                console.warn(`Не найдена земля в точке ${spawnX},${spawnZ}. Создаем платформу.`);
                spawnY = 64;
                for(let dx = -1; dx <= 1; dx++) {
                    for(let dz = -1; dz <= 1; dz++) {
                        world.setVoxel(spawnX + dx, spawnY, spawnZ + dz, 4); 
                        const chunkToUpdate = world.getChunk(Math.floor((spawnX + dx) / 16), Math.floor((spawnZ + dz) / 16));
                        if(chunkToUpdate) chunkToUpdate.needsUpdate = true;
                    }
                }
            }
            
            player.transform.position.set(spawnX + 0.5, spawnY + 2, spawnZ + 0.5);
        }
        
        engine.addGameObject(player);
        engine.setPlayer(player);

        // --- Create Sky Manager ---
        const skyManager = new GameObject('SkyManager');
        skyManager.addComponent(DayNightCycle);
        engine.addGameObject(skyManager);

        // --- Add world update to the game loop ---
        const worldUpdater = new GameObject('WorldUpdater');
        worldUpdater.update = world.update.bind(world);
        engine.addGameObject(worldUpdater);

        // --- Setup Auto-Save and Inventory toggle ---
        document.addEventListener('keydown', (e) => {
            if (e.code === 'KeyE') {
                uiManager.toggleInventory();
            }
            if (e.code === 'KeyP') {
                saveManager.saveWorld(world, player);
            }
        });

        // Start the engine
        engine.start();
    }
}

main();