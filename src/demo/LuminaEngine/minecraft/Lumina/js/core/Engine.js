// Lumina/js/core/Engine.js

import { Renderer } from './Renderer.js';
import { InputManager } from './InputManager.js';
import { PhysicsEngine } from '../physics/PhysicsEngine.js';

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

    gameLoop(currentTime = 0) {
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        this.frameCount++;
        if (currentTime > this.fpsLastUpdate + 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.fpsLastUpdate = currentTime;
        }
        
        this.physicsEngine.update(deltaTime);
        this.gameObjects.forEach(go => go.update(deltaTime));
        this.renderer.render();
        this.renderer.updateUI(this.fps, this.player ? this.player.transform : null);
        this.inputManager.lateUpdate();
        requestAnimationFrame(this.gameLoop.bind(this));
    }
}
