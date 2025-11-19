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

function main() {
    const engine = new Engine('game-canvas');
    const settingsManager = new SettingsManager();
    const saveManager = new SaveManager();

    // Применяем качество при старте
    engine.renderer.renderer.setPixelRatio(window.devicePixelRatio * settingsManager.get('quality'));

    // Коллбек для сохранения, передаем в UI
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
        
        // Передаем settingsManager в World
        const world = new World(engine.renderer.scene, undefined, engine.renderer.renderer, settingsManager);
        engine.physicsEngine.setWorld(world);

        if (saveData) world.loadData(saveData.world, engine.renderer.renderer);
        else world.generate();

        // Player
        const player = new GameObject('Player');
        player.addComponent(RigidBody, { bodyType: 'dynamic' });
        player.addComponent(BoxCollider, new THREE.Vector3(0.6, 1.8, 0.6));
        // Передаем settingsManager в контроллер
        player.addComponent(PlayerController, settingsManager);
        const inventory = player.addComponent(Inventory, uiManager);
        player.addComponent(BlockInteraction, world);

        if (saveData && saveData.player) {
            player.transform.position.fromArray(saveData.player.position);
            if (saveData.player.rotation) player.transform.rotation.fromArray(saveData.player.rotation);
            inventory.loadData(saveData.player.inventory);
        } else {
            player.transform.position.set(8, 80, 8);
        }
        
        engine.addGameObject(player);
        engine.setPlayer(player);

        // Sky
        const sky = new GameObject('Sky');
        sky.addComponent(DayNightCycle, settingsManager);
        engine.addGameObject(sky);

        // Updater
        const updater = new GameObject('WorldUpdater');
        updater.update = () => world.update(player.transform.position);
        engine.addGameObject(updater);

        // Inputs
        document.addEventListener('keydown', (e) => {
            if (e.code === 'KeyE') uiManager.toggleInventory();
            if (e.code === 'Escape') {
                // Если инвентарь открыт - закрываем
                if (engine.inputManager.isInventoryOpen) {
                    uiManager.toggleInventory();
                } 
                // Если пауза не активна (и инвентарь закрыт) - InputManager сам откроет паузу через pointerlockchange
                // Но если курсор уже был отпущен, принудительно ставим паузу
                else if (!engine.inputManager.isPointerLocked() && !engine.inputManager.isPaused) {
                    engine.inputManager.setPaused(true);
                }
            }
        });

        engine.start();
    }
}

main();