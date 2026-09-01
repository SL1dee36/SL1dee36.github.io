// Lumina/js/core/Engine.js
// author: Nazaryan A.K. 
// github: @Sl1dee36

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

        // Фиксированный тик (20 тиков в секунду, dt = 0.05s)
        this.fixedDeltaTime = 1 / 20;
        this.accumulator = 0;
    }

    setPlayer(gameObject) { this.player = gameObject; }
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

    gameLoop(currentTime = 0) {
        const frameTime = Math.min((currentTime - this.lastTime) / 1000, 0.25);
        this.lastTime = currentTime;

        this.frameCount++;
        if (currentTime > this.fpsLastUpdate + 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.fpsLastUpdate = currentTime;
        }

        // Накопление времени для тиков
        this.accumulator += frameTime;
        while (this.accumulator >= this.fixedDeltaTime) {
            this.fixedUpdate(this.fixedDeltaTime);
            this.accumulator -= this.fixedDeltaTime;
        }

        // Интерполяция рендера между тиками
        const alpha = this.accumulator / this.fixedDeltaTime;
        this.physicsEngine.interpolatePositions(alpha);

        // Кадровое обновление (камера, эффекты, анимации рук)
        this.gameObjects.forEach(go => go.update(frameTime));
        this.renderer.render();

        let worldStats = this.physicsEngine.world ? this.physicsEngine.world.getStats() : null;
        this.renderer.updateUI(this.fps, this.player ? this.player.transform : null, worldStats, this.renderer.renderer.info.render);

        this.inputManager.lateUpdate();
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    fixedUpdate(fixedDt) {
        // 1. Физика сущностей
        this.physicsEngine.stepPhysics(fixedDt);

        // 2. Логика мира (песок, гравий, вода, выброшенные предметы)
        if (this.physicsEngine.world) {
            this.physicsEngine.world.fixedTick(fixedDt, this.player);
        }

        // 3. Компоненты с фиксированным обновлением (печи, инвентарь)
        this.gameObjects.forEach(go => {
            if (go.fixedUpdate) go.fixedUpdate(fixedDt);
            go.components.forEach(c => {
                if (c.fixedUpdate) c.fixedUpdate(fixedDt);
            });
        });
    }
}