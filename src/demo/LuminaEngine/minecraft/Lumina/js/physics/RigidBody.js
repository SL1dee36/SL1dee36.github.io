// Lumina/js/physics/RigidBody.js
import { Component } from '../core/Component.js';
import * as THREE from 'three';

export class RigidBody extends Component {
    constructor(gameObject, options = {}) {
        super(gameObject);
        this.bodyType = options.bodyType || 'dynamic';
        this.velocity = new THREE.Vector3();
        this.isGrounded = false;
        
        // Добавляем поля для интерполяции
        this.physicsPosition = null; 
        this.prevPhysicsPosition = null;
    }

    start() {
        // Инициализируем позиции при старте
        this.physicsPosition = this.transform.position.clone();
        this.prevPhysicsPosition = this.transform.position.clone();
        
        this.engine.physicsEngine.addRigidBody(this);
    }
}