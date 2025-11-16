// game/PlayerController.js
import { Component } from '../Lumina/js/core/Component.js';
import { RigidBody } from '../Lumina/js/physics/RigidBody.js';
import * as THREE from 'three';

export class PlayerController extends Component {
    constructor(gameObject) {
        super(gameObject);
        this.camera = null;
        this.rigidBody = null;

        this.moveSpeed = 4.0;
        this.runSpeed = 7.0;
        this.crouchSpeed = 2.0;
        this.jumpForce = 8;

        this.mouseSensitivity = 0.002;

        this.isCrouching = false;
        this.standHeight = 0.8;
        this.crouchHeight = 0.6;
    }

    start() {
        this.rigidBody = this.gameObject.getComponent(RigidBody);
        if (!this.rigidBody) {
            console.error("PlayerController requires a RigidBody component.");
            return;
        }

        this.camera = this.engine.renderer.camera;
        this.transform.add(this.camera);
        this.camera.position.y = this.standHeight;
    }

    update(deltaTime) {
        // --- Защита от падения в пустоту ---
        if (this.transform.position.y < -8) {
            // Если игрок упал слишком низко, телепортируем его на точку спавна
            // В более сложной игре здесь можно было бы вызывать метод респавна
            this.transform.position.set(8.5, 70, 8.5);
            this.rigidBody.velocity.set(0, 0, 0); // Сбрасываем скорость, чтобы остановить падение
            return; // Пропускаем остальную логику в этом кадре
        }
        
        if (!this.engine.inputManager.isPointerLocked()) {
            this.rigidBody.velocity.x = 0;
            this.rigidBody.velocity.z = 0;
            return;
        }

        // Camera rotation
        const mouseDelta = this.engine.inputManager.getMouseDelta();
        this.transform.rotateY(-mouseDelta.x * this.mouseSensitivity);
        this.camera.rotateX(-mouseDelta.y * this.mouseSensitivity);

        // Clamp camera pitch
        const maxPitch = Math.PI / 2 * 0.99;
        this.camera.rotation.x = THREE.MathUtils.clamp(this.camera.rotation.x, -maxPitch, maxPitch);

        // Movement
        const input = this.engine.inputManager;
        const moveDirection = new THREE.Vector3();
        if (input.isKeyDown('KeyW')) moveDirection.z -= 1;
        if (input.isKeyDown('KeyS')) moveDirection.z += 1;
        if (input.isKeyDown('KeyA')) moveDirection.x -= 1;
        if (input.isKeyDown('KeyD')) moveDirection.x += 1;

        if (moveDirection.lengthSq() > 0) {
            moveDirection.normalize().applyQuaternion(this.transform.quaternion);
        }

        // Speed modification
        this.isCrouching = input.isKeyDown('ControlLeft');
        const isRunning = input.isKeyDown('ShiftLeft') && !this.isCrouching;
        const currentSpeed = this.isCrouching ? this.crouchSpeed : (isRunning ? this.runSpeed : this.moveSpeed);
        
        this.rigidBody.velocity.x = moveDirection.x * currentSpeed;
        this.rigidBody.velocity.z = moveDirection.z * currentSpeed;

        // Crouching height adjust
        const targetHeight = this.isCrouching ? this.crouchHeight : this.standHeight;
        this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, targetHeight, deltaTime * 10);

        // Jumping
        if (input.wasKeyJustPressed('Space') && this.rigidBody.isGrounded) {
            this.rigidBody.velocity.y = this.jumpForce;
        }
    }
}