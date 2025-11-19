// game/PlayerController.js
import { Component } from '../Lumina/js/core/Component.js';
import { RigidBody } from '../Lumina/js/physics/RigidBody.js';
import * as THREE from 'three';

export class PlayerController extends Component {
    constructor(gameObject, settingsManager) {
        super(gameObject);
        this.settings = settingsManager;
        this.camera = null;
        this.rigidBody = null;

        this.moveSpeed = 4.5;
        this.runSpeed = 7.5;
        this.jumpForce = 7;
        this.pitch = 0;
    }

    start() {
        this.rigidBody = this.gameObject.getComponent(RigidBody);
        this.camera = this.engine.renderer.camera;
        this.transform.add(this.camera);
        this.camera.position.set(0, 0.8, 0);
    }

    update(deltaTime) {
        // Респавн
        if (this.transform.position.y < -30) {
            this.transform.position.set(8, 80, 8);
            this.rigidBody.velocity.set(0, 0, 0);
        }

        // Если пауза или инвентарь - не двигаемся и не вращаем камеру
        if (this.engine.inputManager.isPaused || this.engine.inputManager.isInventoryOpen) {
            this.rigidBody.velocity.x = 0;
            this.rigidBody.velocity.z = 0;
            return;
        }

        // Получаем чувствительность из настроек
        const sensitivity = this.settings.get('sensitivity');
        const mouseDelta = this.engine.inputManager.getMouseDelta();
        
        this.transform.rotateY(-mouseDelta.x * sensitivity);
        this.pitch -= mouseDelta.y * sensitivity;
        this.pitch = Math.max(-Math.PI/2 + 0.1, Math.min(Math.PI/2 - 0.1, this.pitch));
        this.camera.rotation.x = this.pitch;

        const input = this.engine.inputManager;
        const dir = new THREE.Vector3();

        if (input.isKeyDown('KeyW')) dir.z -= 1;
        if (input.isKeyDown('KeyS')) dir.z += 1;
        if (input.isKeyDown('KeyA')) dir.x -= 1;
        if (input.isKeyDown('KeyD')) dir.x += 1;

        if (dir.lengthSq() > 0) {
            dir.normalize().applyQuaternion(this.transform.quaternion);
        }

        const speed = input.isKeyDown('ShiftLeft') ? this.runSpeed : this.moveSpeed;
        this.rigidBody.velocity.x = dir.x * speed;
        this.rigidBody.velocity.z = dir.z * speed;

        if (input.isKeyDown('Space') && this.rigidBody.isGrounded) {
            this.rigidBody.velocity.y = this.jumpForce;
            this.rigidBody.isGrounded = false;
        }
    }
}