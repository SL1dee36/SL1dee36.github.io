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
import { SettingsManager } from '../../game/SettingsManager.js';
import { PlayerHand } from '../../game/PlayerHand.js';

function main() {
    const engine = new Engine('game-canvas');
    const settingsManager = new SettingsManager();
    const saveManager = new SaveManager();

    engine.renderer.renderer.setPixelRatio(window.devicePixelRatio * settingsManager.get('quality'));

    const saveCallback = () => {
        if(engine.player && engine.physicsEngine.world) {
            saveManager.saveWorld(engine.physicsEngine.world, engine.player);
        }
    };

    const uiManager = new UIManager(engine.inputManager, settingsManager, saveCallback);
    
    const startMenu = document.getElementById('start-menu');
    const newWorldBtn = document.getElementById('new-world-btn');
    const loadWorldBtn = document.getElementById('load-world-btn');

    if (!saveManager.hasSavedWorld()) loadWorldBtn.style.display = 'none';

    newWorldBtn.addEventListener('click', () => startGame(null));
    loadWorldBtn.addEventListener('click', () => {
        const data = saveManager.loadWorld();
        if(data) startGame(data);
    });

    function startGame(saveData) {
        startMenu.style.display = 'none';
        
        const world = new World(engine.renderer.scene, undefined, engine.renderer.renderer, settingsManager);
        engine.physicsEngine.setWorld(world);

        // Создаем игрока
        const player = new GameObject('Player');
        player.addComponent(RigidBody, { bodyType: 'dynamic' });
        player.addComponent(BoxCollider, new THREE.Vector3(0.6, 1.8, 0.6));
        player.addComponent(PlayerController, settingsManager);
        const inventory = player.addComponent(Inventory, uiManager);
        player.addComponent(PlayerHand, settingsManager);
        player.addComponent(BlockInteraction, world);
        
        engine.addGameObject(player);
        engine.setPlayer(player);

        if (saveData) {
            // Загружаем мир и игрока
            world.loadData(saveData.world, engine.renderer.renderer);
            if (saveData.player) {
                player.transform.position.fromArray(saveData.player.position);
                if (player.getComponent(RigidBody).physicsPosition) {
                    player.getComponent(RigidBody).physicsPosition.fromArray(saveData.player.position);
                    player.getComponent(RigidBody).prevPhysicsPosition.fromArray(saveData.player.position);
                }
                if (saveData.player.rotation) player.transform.rotation.fromArray(saveData.player.rotation);
                inventory.loadData(saveData.player.inventory);
            }
        } else {
            // Генерируем новый мир
            world.generate();
            
            // === СПАВН НА ЗЕМЛЕ ===
            const spawnX = 8;
            const spawnZ = 8;
            let spawnY = 100;
            
            // Ищем твердый блок сверху вниз
            // (Примечание: world.generate() уже заполнил данные чанков вокруг 0,0)
            while (spawnY > 0 && world.getVoxel(spawnX, spawnY, spawnZ) === 0) {
                spawnY--;
            }
            
            // Ставим игрока на 2 блока выше земли
            const finalY = spawnY + 2;
            player.transform.position.set(spawnX, finalY, spawnZ);
            
            // Важно обновить и физическую позицию!
            if (player.getComponent(RigidBody)) {
                player.getComponent(RigidBody).physicsPosition = new THREE.Vector3(spawnX, finalY, spawnZ);
                player.getComponent(RigidBody).prevPhysicsPosition = new THREE.Vector3(spawnX, finalY, spawnZ);
            }
        }

        const sky = new GameObject('Sky');
        sky.addComponent(DayNightCycle, settingsManager);
        engine.addGameObject(sky);

        const updater = new GameObject('WorldUpdater');
        updater.update = () => world.update(player.transform.position);
        engine.addGameObject(updater);

        document.addEventListener('keydown', (e) => {
            if (e.code === 'KeyE') uiManager.toggleInventory();
            if (e.code === 'Escape') {
                if (engine.inputManager.isInventoryOpen) {
                    uiManager.toggleInventory();
                } else if (!engine.inputManager.isPointerLocked() && !engine.inputManager.isPaused) {
                    engine.inputManager.setPaused(true);
                }
            }
        });

        engine.start();
    }
}

main();