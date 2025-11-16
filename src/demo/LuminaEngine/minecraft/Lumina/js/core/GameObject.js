// Lumina/js/core/GameObject.js

import * as THREE from 'three';

export class GameObject {
    constructor(name = 'GameObject') {
        this.name = name;
        this.transform = new THREE.Object3D();
        this.components = [];
        this.engine = null;
    }

    // <<-- ПОЛНОСТЬЮ ЗАМЕНИТЕ ЭТОТ МЕТОД
    addComponent(ComponentClass, ...args) {
        // '...args' собирает все дополнительные аргументы в массив 'args'
        // Например: player.addComponent(PlayerController, mazeGrid, mazeSize)
        // -> ComponentClass = PlayerController
        // -> args = [mazeGrid, mazeSize]

        // '...args' здесь "раскрывает" массив обратно в отдельные аргументы
        // new PlayerController(this, mazeGrid, mazeSize)
        const component = new ComponentClass(this, ...args);
        
        this.components.push(component);
        return component;
    }
    
    getComponent(ComponentClass) {
        return this.components.find(c => c instanceof ComponentClass);
    }

    start() {
        this.components.forEach(c => {
            c.engine = this.engine;
            c.start();
        });
    }

    update(deltaTime) {
        this.components.forEach(c => c.update(deltaTime));
    }
}