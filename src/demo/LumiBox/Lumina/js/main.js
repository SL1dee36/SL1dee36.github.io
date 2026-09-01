// Lumina/js/main.js
// author: Nazaryan A.K.
// github: @Sl1dee36

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
import { TouchControls } from '../../game/TouchControls.js';
import { PlayerHand } from '../../game/PlayerHand.js';
import { ResourcePackLoader } from '../../game/ResourcePackLoader.js';
import { ModuleManager } from '../../game/ModuleManager.js';

function main() {
    const engine = new Engine('game-canvas');
    const settingsManager = new SettingsManager();
    const saveManager = new SaveManager();
    const soundManager = new SoundManager(settingsManager);

    engine.renderer.renderer.setPixelRatio(window.devicePixelRatio * settingsManager.get('quality'));
    engine.renderer.renderer.shadowMap.enabled = true;
    engine.renderer.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    let activeWorldMeta = null;

    const saveCallback = () => {
        if (engine.player && engine.physicsEngine.world && activeWorldMeta) {
            saveManager.saveWorld(activeWorldMeta.id, engine.physicsEngine.world, engine.player, activeWorldMeta.gameMode);
        }
    };

    const uiManager = new UIManager(engine.inputManager, settingsManager, saveCallback);
    new TouchControls(engine.inputManager, uiManager);

    // --- DOM Elements ---
    const mainMenuScreen = document.getElementById('main-menu-screen');
    const worldsMenuScreen = document.getElementById('worlds-menu-screen');
    const createWorldScreen = document.getElementById('create-world-screen');
    const worldsListContainer = document.getElementById('worlds-list');

    const singleplayerBtn = document.getElementById('menu-singleplayer-btn');
    const menuOptionsBtn = document.getElementById('menu-options-btn');
    const menuQuitBtn = document.getElementById('menu-quit-btn');

    const worldPlayBtn = document.getElementById('world-play-btn');
    const worldCreateBtn = document.getElementById('world-create-btn');
    const worldDeleteBtn = document.getElementById('world-delete-btn');
    const worldBackBtn = document.getElementById('world-back-btn');

    const createWorldConfirmBtn = document.getElementById('create-world-confirm-btn');
    const createWorldCancelBtn = document.getElementById('create-world-cancel-btn');
    const newWorldNameInput = document.getElementById('new-world-name');
    const newWorldSeedInput = document.getElementById('new-world-seed');
    const newWorldModeBtn = document.getElementById('new-world-mode-btn');

    let selectedWorldId = null;
    let newWorldGameMode = 'survival';

    // 1. Главный экран
    singleplayerBtn.onclick = () => {
        renderWorldsList();
        uiManager.showScreen(worldsMenuScreen);
    };

    menuOptionsBtn.onclick = () => {
        uiManager.updateOptionsUI();
        uiManager.showScreen(uiManager.optionsMenu);
    };

    menuQuitBtn.onclick = () => {
        if (confirm("Close LuminaCraft?")) {
            window.close();
            document.body.innerHTML = "<div style='display:flex;justify-content:center;align-items:center;height:100vh;font-size:24px;'>Game Closed.</div>";
        }
    };

    // 2. Список миров
    function renderWorldsList() {
        worldsListContainer.innerHTML = '';
        selectedWorldId = null;
        worldPlayBtn.disabled = true;
        worldDeleteBtn.disabled = true;

        const list = saveManager.getWorldsList();
        if (list.length === 0) {
            worldsListContainer.innerHTML = "<div style='color:#888;text-align:center;margin-top:40px;'>No worlds found.<br>Create a new one!</div>";
            return;
        }

        list.forEach(w => {
            const item = document.createElement('div');
            item.className = 'world-item';
            const dateStr = new Date(w.lastPlayed || w.createdAt).toLocaleDateString();
            const modeName = w.gameMode === 'creative' ? 'Creative Mode' : 'Survival Mode';

            item.innerHTML = `
                <div class="world-item-title">${w.name}</div>
                <div class="world-item-desc">${modeName} (${dateStr})</div>
            `;

            item.onclick = () => {
                document.querySelectorAll('.world-item').forEach(el => el.classList.remove('selected'));
                item.classList.add('selected');
                selectedWorldId = w.id;
                worldPlayBtn.disabled = false;
                worldDeleteBtn.disabled = false;
            };

            worldsListContainer.appendChild(item);
        });
    }

    worldPlayBtn.onclick = async () => {
        if (!selectedWorldId) return;
        const list = saveManager.getWorldsList();
        const meta = list.find(w => w.id === selectedWorldId);
        if (!meta) return;

        const data = saveManager.loadWorld(selectedWorldId);
        await startGame(meta, data);
    };

    worldCreateBtn.onclick = () => {
        newWorldNameInput.value = 'New World';
        newWorldSeedInput.value = '';
        newWorldGameMode = 'survival';
        newWorldModeBtn.textContent = 'Mode: Survival';
        uiManager.showScreen(createWorldScreen);
    };

    worldDeleteBtn.onclick = () => {
        if (!selectedWorldId) return;
        if (confirm("Are you sure you want to delete this world?")) {
            saveManager.deleteWorld(selectedWorldId);
            renderWorldsList();
        }
    };

    worldBackBtn.onclick = () => {
        uiManager.showScreen(mainMenuScreen);
    };

    // 3. Создание нового мира
    newWorldModeBtn.onclick = () => {
        newWorldGameMode = newWorldGameMode === 'survival' ? 'creative' : 'survival';
        newWorldModeBtn.textContent = newWorldGameMode === 'creative' ? 'Mode: Creative' : 'Mode: Survival';
    };

    createWorldConfirmBtn.onclick = async () => {
        const name = newWorldNameInput.value.trim() || 'New World';
        const seedStr = newWorldSeedInput.value.trim();
        const meta = saveManager.createWorld(name, seedStr, newWorldGameMode);
        await startGame(meta, null);
    };

    createWorldCancelBtn.onclick = () => {
        renderWorldsList();
        uiManager.showScreen(worldsMenuScreen);
    };

    // 4. Запуск игрового мира
    async function startGame(worldMeta, saveData) {
        activeWorldMeta = worldMeta;
        uiManager.closeAllMenus();

        if (soundManager.ctx.state === 'suspended') soundManager.ctx.resume();

        const world = new World(engine.renderer.scene, worldMeta.seed, engine.renderer.renderer, settingsManager);
        
        // --- Загрузка модулей .lumibench (source и подключенных модов) ---
        const moduleManager = new ModuleManager(world.atlas, world.textureGenerator);
        await moduleManager.loadModules(['source']);
        world.reloadMaterials();

        engine.physicsEngine.setWorld(world);

        if (saveData && saveData.world) {
            world.loadData(saveData.world, engine.renderer.renderer);
        } else {
            world.generate();
        }

        const player = new GameObject('Player');
        player.addComponent(RigidBody, { bodyType: 'dynamic' });
        player.addComponent(BoxCollider, new THREE.Vector3(0.6, 1.8, 0.6));

        const controller = player.addComponent(PlayerController, settingsManager, soundManager);
        controller.setGameMode(worldMeta.gameMode);

        const inventory = player.addComponent(Inventory, uiManager);
        player.addComponent(PlayerHand, settingsManager);
        player.addComponent(BlockInteraction, world, soundManager);

        if (saveData && saveData.player) {
            player.transform.position.fromArray(saveData.player.position);
            if (saveData.player.rotation) player.transform.rotation.fromArray(saveData.player.rotation);
            if (saveData.player.inventory) inventory.loadData(saveData.player.inventory);
            if (saveData.player.hp !== undefined) controller.hp = saveData.player.hp;

            const rb = player.getComponent(RigidBody);
            if (rb) {
                rb.physicsPosition.copy(player.transform.position);
                rb.prevPhysicsPosition.copy(player.transform.position);
            }
        } else {
            const spawnX = 8, spawnZ = 8;
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

        uiManager.updateHeartsHUD(controller.hp, controller.maxHp);

        const sky = new GameObject('Sky');
        sky.addComponent(DayNightCycle, settingsManager);
        engine.addGameObject(sky);

        const updater = new GameObject('WorldUpdater');
        updater.update = (dt) => {
            world.update(player.transform.position, engine.renderer.camera, dt);
        };
        engine.addGameObject(updater);

        const rpLoader = new ResourcePackLoader(world.textureGenerator, world, uiManager);
        window.addEventListener('dragover', (e) => e.preventDefault());
        window.addEventListener('drop', async (e) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file && file.name.endsWith('.zip')) {
                await rpLoader.loadZip(file);
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.code === 'KeyE') {
                uiManager.toggleInventory();
            }
            if (e.code === 'KeyQ' && !engine.inputManager.isUIOpen) {
                const selected = inventory.getSelectedItem();
                if (selected) {
                    const dropCount = e.ctrlKey ? selected.count : 1;
                    uiManager.dropItemIntoWorld({ id: selected.id, count: dropCount });
                    inventory.removeItemFromSelectedSlot(dropCount);
                }
            }
            if (e.code === 'Escape') {
                if (engine.inputManager.isUIOpen) {
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