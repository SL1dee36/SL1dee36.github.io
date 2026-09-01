// Lumina/js/core/GameObject.js
// author: Nazaryan A.K.
// github: @Sl1dee36

import * as THREE from 'three';

export class GameObject {
    constructor(name = 'GameObject') {
        this.name = name;
        this.transform = new THREE.Object3D();
        this.components = [];
        this.engine = null;
    }

    addComponent(ComponentClass, ...args) {
        const component = new ComponentClass(this, ...args);
        this.components.push(component);
        if (this.engine) {
            component.engine = this.engine;
            component.start();
        }
        return component;
    }

    getComponent(componentClassOrName) {
        if (!componentClassOrName) return null;
        if (typeof componentClassOrName === 'string') {
            return this.components.find(c => c.constructor.name === componentClassOrName || c.name === componentClassOrName);
        }
        return this.components.find(c => c instanceof componentClassOrName);
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