// game/PlayerController.js
// author: Nazaryan A.K.
// github: @Sl1dee36

import { Component } from '../Lumina/js/core/Component.js';
import { RigidBody } from '../Lumina/js/physics/RigidBody.js';
import * as THREE from 'three';

export class PlayerController extends Component {
    constructor(gameObject, settingsManager, soundManager) {
        super(gameObject);
        this.settings = settingsManager;
        this.soundManager = soundManager;
        this.camera = null;
        this.rigidBody = null;

        this.gameMode = 'survival'; // 'survival' | 'creative'
        this.hp = 20;
        this.maxHp = 20;

        this.moveSpeed = 4.5;
        this.runSpeed = 7.5;
        this.flySpeed = 10.0;
        this.jumpForce = 7.5;
        this.pitch = 0;

        // Полет в креативе
        this.isFlying = false;
        this.lastSpacePressTime = 0;

        // Камера
        this.cameraBaseHeight = 0.8;
        this.bobDistance = 0;
        this.bobIntensity = 0;
        this.currentRoll = 0;
        this.jumpTilt = 0;
        this.prevFallVelocity = 0;
    }

    setGameMode(mode) {
        this.gameMode = mode;
        if (mode === 'survival') {
            this.isFlying = false;
        }
    }

    start() {
        this.rigidBody = this.gameObject.getComponent(RigidBody);
        this.camera = this.engine.renderer.camera;
        this.transform.add(this.camera);
        this.camera.position.set(0, this.cameraBaseHeight, 0);
        this.camera.rotation.order = 'YXZ';
    }

    takeDamage(amount) {
        if (this.gameMode === 'creative') return;
        this.hp = Math.max(0, this.hp - amount);
        const uiManager = this.engine.player?.getComponent('Inventory')?.uiManager;
        if (uiManager) uiManager.updateHeartsHUD(this.hp, this.maxHp);

        if (this.hp <= 0) {
            this.respawn();
        }
    }

    respawn() {
        this.hp = this.maxHp;
        const respawnPos = new THREE.Vector3(8, 120, 8);
        this.transform.position.copy(respawnPos);
        if (this.rigidBody.physicsPosition) {
            this.rigidBody.physicsPosition.copy(respawnPos);
            this.rigidBody.prevPhysicsPosition.copy(respawnPos);
        }
        this.rigidBody.velocity.set(0, 0, 0);
        const uiManager = this.engine.player?.getComponent('Inventory')?.uiManager;
        if (uiManager) uiManager.updateHeartsHUD(this.hp, this.maxHp);
    }

    setRenderMode(mode) {
        const world = this.engine.physicsEngine.world;
        if (!world || !world.materials) return;
        const scene = this.engine.renderer.scene;
        scene.overrideMaterial = null;

        if (mode === 'wireframe') {
            world.materials.forEach(m => { if (m) m.wireframe = true; });
        } else if (mode === 'depth') {
            world.materials.forEach(m => { if (m) m.wireframe = false; });
            if (!this.depthMaterial) this.depthMaterial = new THREE.MeshDepthMaterial();
            scene.overrideMaterial = this.depthMaterial;
        } else {
            world.materials.forEach(m => { if (m) m.wireframe = false; });
        }
    }

    update(deltaTime) {
        if (this.transform.position.y < -30) {
            this.respawn();
        }

        const input = this.engine.inputManager;
        if (input.wasKeyJustPressed('KeyU')) this.setRenderMode('wireframe');
        if (input.wasKeyJustPressed('KeyI')) this.setRenderMode('depth');
        if (input.wasKeyJustPressed('KeyO')) this.setRenderMode('normal');

        // 1. Поворот камеры
        const sensitivity = this.settings.get('sensitivity');
        const mouseDelta = input.getMouseDelta();
        this.transform.rotateY(-mouseDelta.x * sensitivity);
        this.pitch -= mouseDelta.y * sensitivity;
        this.pitch = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, this.pitch));

        // 2. Двойной клик Пробела для переключения полёта (Креатив)
        if (this.gameMode === 'creative' && input.wasKeyJustPressed('Space')) {
            const now = performance.now();
            if (now - this.lastSpacePressTime < 300) {
                this.isFlying = !this.isFlying;
                this.rigidBody.velocity.set(0, 0, 0);
                this.lastSpacePressTime = 0;
            } else {
                this.lastSpacePressTime = now;
            }
        }

        // 3. Вектор перемещения
        const moveDir = new THREE.Vector3();
        let strafe = 0;
        const joyX = input.joystickInput ? input.joystickInput.x : 0;
        const joyY = input.joystickInput ? input.joystickInput.y : 0;

        if (input.isKeyDown('KeyW') || joyY < -0.3) moveDir.z -= 1;
        if (input.isKeyDown('KeyS') || joyY > 0.3) moveDir.z += 1;
        if (input.isKeyDown('KeyA') || joyX < -0.3) { moveDir.x -= 1; strafe -= 1; }
        if (input.isKeyDown('KeyD') || joyX > 0.3) { moveDir.x += 1; strafe += 1; }

        if (moveDir.lengthSq() > 0) {
            moveDir.normalize().applyQuaternion(this.transform.quaternion);
        }

        const isSprint = input.isKeyDown('ShiftLeft') || input.isSprintingMobile;

        // 4. Физика
        if (this.isFlying) {
            const speed = isSprint ? this.flySpeed * 1.6 : this.flySpeed;
            this.rigidBody.velocity.x = moveDir.x * speed;
            this.rigidBody.velocity.z = moveDir.z * speed;

            if (input.isKeyDown('Space')) {
                this.rigidBody.velocity.y = speed;
            } else if (input.isKeyDown('ShiftLeft')) {
                this.rigidBody.velocity.y = -speed;
            } else {
                this.rigidBody.velocity.y = 0;
            }
        } else {
            const speed = isSprint ? this.runSpeed : this.moveSpeed;
            if (this.rigidBody.isInWater) {
                this.rigidBody.velocity.x = moveDir.x * speed * 0.6;
                this.rigidBody.velocity.z = moveDir.z * speed * 0.6;
            } else {
                this.rigidBody.velocity.x = moveDir.x * speed;
                this.rigidBody.velocity.z = moveDir.z * speed;
            }

            if (input.isKeyDown('Space')) {
                if (this.rigidBody.isGrounded) {
                    this.rigidBody.velocity.y = this.jumpForce;
                    this.rigidBody.isGrounded = false;
                    if (this.soundManager) this.soundManager.playJump();
                } else if (this.rigidBody.isInWater) {
                    this.rigidBody.velocity.y = this.jumpForce * 0.85;
                }
            }

            if (this.rigidBody.isGrounded && this.prevFallVelocity < -14 && this.gameMode === 'survival') {
                const damage = Math.floor((-this.prevFallVelocity - 12) * 1.5);
                if (damage > 0) this.takeDamage(damage);
            }
            this.prevFallVelocity = this.rigidBody.velocity.y;
        }

        // 5. Динамика камеры
        const horizSpeed = Math.sqrt(this.rigidBody.velocity.x ** 2 + this.rigidBody.velocity.z ** 2);
        const isMovingOnGround = horizSpeed > 0.5 && this.rigidBody.isGrounded && !this.isFlying;

        const targetIntensity = isMovingOnGround ? (isSprint ? 1.4 : 1.0) : 0.0;
        this.bobIntensity = THREE.MathUtils.lerp(this.bobIntensity, targetIntensity, deltaTime * 8);

        if (this.bobIntensity > 0.001) {
            const stepFreq = isSprint ? 12 : 9;
            this.bobDistance += deltaTime * stepFreq;
        }

        const bobY = Math.sin(this.bobDistance) * 0.035 * this.bobIntensity;
        const bobX = Math.cos(this.bobDistance * 0.5) * 0.02 * this.bobIntensity;

        const targetRoll = -strafe * (isSprint ? 0.025 : 0.015);
        this.currentRoll = THREE.MathUtils.lerp(this.currentRoll, targetRoll, deltaTime * 10);

        const targetJumpTilt = THREE.MathUtils.clamp(-this.rigidBody.velocity.y * 0.008, -0.05, 0.05);
        this.jumpTilt = THREE.MathUtils.lerp(this.jumpTilt, targetJumpTilt, deltaTime * 6);

        this.camera.position.x = bobX;
        this.camera.position.y = this.cameraBaseHeight + bobY;
        this.camera.position.z = 0;
        this.camera.rotation.set(this.pitch + this.jumpTilt, 0, this.currentRoll);
    }
}