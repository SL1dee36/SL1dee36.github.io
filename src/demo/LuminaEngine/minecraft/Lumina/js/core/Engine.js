// Lumina/js/core/Engine.js

import { Renderer } from './Renderer.js';
import { InputManager } from './InputManager.js';
import { PhysicsEngine } from '../physics/PhysicsEngine.js';
import * as THREE from 'three';

export class Engine {
    constructor(canvasId) {
        this.renderer = new Renderer(canvasId);
        this.inputManager = new InputManager(this.renderer.domElement);
        this.physicsEngine = new PhysicsEngine();
        this.gameObjects = [];
        this.player = null;
        
        this.lastTime = 0;
        this.fps = 0;
        this.frameCount = 0;
        this.fpsLastUpdate = 0;

        // Cache for debug material
        this.depthMaterial = new THREE.MeshDepthMaterial();
    }
    
    setPlayer(gameObject) {
        this.player = gameObject;
    }

    addGameObject(gameObject) {
        this.gameObjects.push(gameObject);
        this.renderer.scene.add(gameObject.transform);
        gameObject.engine = this;
    }

    start() {
        this.gameObjects.forEach(go => go.start());
        this.lastTime = performance.now();
        this.fpsLastUpdate = this.lastTime;
        this.gameLoop();
    }

    setRenderMode(mode) {
        // Проверяем, загружен ли мир
        if (!this.physicsEngine.world) return;
        const worldMaterials = this.physicsEngine.world.materials;
        const scene = this.renderer.scene;

        // Сброс глобального оверрайда (для карты глубины)
        scene.overrideMaterial = null;

        if (mode === 'wireframe') {
            // Включаем сетку на всех материалах блоков
            worldMaterials.forEach(m => m.wireframe = true);
            console.log("Render Mode: Wireframe");
        } 
        else if (mode === 'depth') {
            // Выключаем сетку, чтобы не мешала
            worldMaterials.forEach(m => m.wireframe = false);
            // Включаем глобальный материал глубины
            scene.overrideMaterial = this.depthMaterial;
            console.log("Render Mode: Depth Map");
        } 
        else {
            // Normal / Original
            worldMaterials.forEach(m => m.wireframe = false);
            console.log("Render Mode: Original");
        }
    }

    gameLoop(currentTime = 0) {
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        this.frameCount++;
        if (currentTime > this.fpsLastUpdate + 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.fpsLastUpdate = currentTime;
        }
        
        // --- DEBUG KEYS ---
        if (this.inputManager.wasKeyJustPressed('KeyU')) {
            this.setRenderMode('wireframe');
        }
        if (this.inputManager.wasKeyJustPressed('KeyI')) {
            this.setRenderMode('depth');
        }
        if (this.inputManager.wasKeyJustPressed('KeyO')) {
            this.setRenderMode('normal');
        }
        // ------------------

        this.physicsEngine.update(deltaTime);
        this.gameObjects.forEach(go => go.update(deltaTime));
        this.renderer.render();

        let worldStats = null;
        if (this.physicsEngine.world) {
            worldStats = this.physicsEngine.world.getStats();
        }
        const renderStats = this.renderer.renderer.info.render;

        this.renderer.updateUI(this.fps, this.player ? this.player.transform : null, worldStats, renderStats);
        
        this.inputManager.lateUpdate();
        requestAnimationFrame(this.gameLoop.bind(this));
    }
}