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
import { SoundManager } from '../../game/SoundManager.js';
import { TouchControls } from './core/TouchControls.js';
import { PlayerHand } from '../../game/PlayerHand.js';

function main() {
    const engine = new Engine('game-canvas');
    const settingsManager = new SettingsManager();
    const saveManager = new SaveManager();
    const soundManager = new SoundManager(settingsManager);

    engine.renderer.renderer.setPixelRatio(window.devicePixelRatio * settingsManager.get('quality'));
    engine.renderer.renderer.shadowMap.enabled = true;
    engine.renderer.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const saveCallback = () => {
        if(engine.player && engine.physicsEngine.world) {
            saveManager.saveWorld(engine.physicsEngine.world, engine.player);
        }
    };

    const uiManager = new UIManager(engine.inputManager, settingsManager, saveCallback);
    const touchControls = new TouchControls(engine.inputManager, uiManager);

    const startMenu = document.getElementById('start-menu');
    const newWorldBtn = document.getElementById('new-world-btn');
    const loadWorldBtn = document.getElementById('load-world-btn');

    if (!saveManager.hasSavedWorld()) {
        loadWorldBtn.style.display = 'none';
    }

    newWorldBtn.addEventListener('click', () => {
        if (soundManager.ctx.state === 'suspended') soundManager.ctx.resume();
        startGame(null);
    });
    
    loadWorldBtn.addEventListener('click', () => {
        if (soundManager.ctx.state === 'suspended') soundManager.ctx.resume();
        const data = saveManager.loadWorld();
        if(data) startGame(data);
    });

    function startGame(saveData) {
        startMenu.style.display = 'none';
        
        const world = new World(engine.renderer.scene, undefined, engine.renderer.renderer, settingsManager);
        engine.physicsEngine.setWorld(world);

        if (saveData) {
            world.loadData(saveData.world, engine.renderer.renderer);
        } else {
            world.generate();
        }

        const player = new GameObject('Player');
        player.addComponent(RigidBody, { bodyType: 'dynamic' });
        player.addComponent(BoxCollider, new THREE.Vector3(0.6, 1.8, 0.6));
        player.addComponent(PlayerController, settingsManager, soundManager);
        
        const inventory = player.addComponent(Inventory, uiManager);
        player.addComponent(PlayerHand, settingsManager);
        player.addComponent(BlockInteraction, world, soundManager);

        if (saveData && saveData.player) {
            player.transform.position.fromArray(saveData.player.position);
            if (saveData.player.rotation) player.transform.rotation.fromArray(saveData.player.rotation);
            inventory.loadData(saveData.player.inventory);
            
            const rb = player.getComponent(RigidBody);
            if (rb) {
                rb.physicsPosition.copy(player.transform.position);
                rb.prevPhysicsPosition.copy(player.transform.position);
            }
        } else {
            const spawnX = 8; 
            const spawnZ = 8;
            world.generateChunkData(0, 0);
            const height = world.getTerrainHeight(spawnX, spawnZ);
            const spawnY = height + 3;
            player.transform.position.set(spawnX, spawnY, spawnZ);
            const rb = player.getComponent(RigidBody);
            if (rb) {
                rb.physicsPosition = new THREE.Vector3(spawnX, spawnY, spawnZ);
                rb.prevPhysicsPosition = new THREE.Vector3(spawnX, spawnY, spawnZ);
                rb.velocity.set(0, 0, 0);
            }
        }
        
        engine.addGameObject(player);
        engine.setPlayer(player);

        const sky = new GameObject('Sky');
        sky.addComponent(DayNightCycle, settingsManager);
        engine.addGameObject(sky);

        const updater = new GameObject('WorldUpdater');
        updater.update = () => {
            world.update(player.transform.position, engine.renderer.camera);
        };
        
        engine.addGameObject(updater);

        document.addEventListener('keydown', (e) => {
            if (e.code === 'KeyE') {
                uiManager.toggleInventory();
            }
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