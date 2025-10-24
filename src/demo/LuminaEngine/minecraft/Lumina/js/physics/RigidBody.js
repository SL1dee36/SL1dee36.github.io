// Lumina/js/physics/RigidBody.js

import { Component } from '../core/Component.js';
import * as THREE from 'three';

export class RigidBody extends Component {
    constructor(gameObject, options = {}) {
        super(gameObject);
        
        // 'dynamic' - объект, подверженный гравитации и столкновениям
        // 'static' - объект, который не двигается
        this.bodyType = options.bodyType || 'dynamic';
        
        // Скорость объекта
        this.velocity = new THREE.Vector3();

        // Находится ли объект на земле (для прыжков)
        this.isGrounded = false;
    }

    start() {
        this.engine.physicsEngine.addRigidBody(this);
    }
}
