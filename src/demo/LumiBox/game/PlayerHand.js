// game/PlayerHand.js
// author: Nazaryan A.K.
// github: @Sl1dee36

import { Component } from '../Lumina/js/core/Component.js';
import { BLOCK } from './blocks.js';
import { Inventory } from './Inventory.js';
import { RigidBody } from '../Lumina/js/physics/RigidBody.js';
import { BlockInteraction } from './BlockInteraction.js';
import * as THREE from 'three';
import { getOrCreateItem3DGeometry } from './utils/ItemGeometry.js';

export class PlayerHand extends Component {
    constructor(gameObject, settingsManager) {
        super(gameObject);
        this.settings = settingsManager;

        this.handContainer = new THREE.Group();
        this.currentBlockId = 0;

        // Анимации
        this.swingProgress = 0;
        this.swingSpeed = 15;
        this.isSwing = false;

        this.placeProgress = 0;
        this.placeSpeed = 20;
        this.isPlace = false;
        this.jumpOffset = 0;
        this.jumpTilt = 0;
        this.basePos = { x: 0.4, y: -0.6, z: -0.8 };
        this.bobPos = new THREE.Vector3();

        this.textureGenerator = null;
        this.materialCache = {};
    }

    start() {
        this.camera = this.engine.renderer.camera;
        this.inventory = this.gameObject.getComponent(Inventory);
        this.rigidBody = this.gameObject.getComponent(RigidBody);
        this.blockInteraction = this.gameObject.getComponent(BlockInteraction);

        this.textureGenerator = this.engine.physicsEngine.world.textureGenerator;

        this.camera.add(this.handContainer);
        this.updateMesh();
    }

    update(deltaTime) {
        const showHand = this.settings.get('showHand');
        this.handContainer.visible = showHand;
        if (!showHand) return;

        const selectedItem = this.inventory ? this.inventory.getSelectedItem() : null;
        const selectedId = selectedItem ? selectedItem.id : 0;
        if (selectedId !== this.currentBlockId) {
            this.currentBlockId = selectedId;
            this.updateMesh();
        }

        const isUIOpen = this.engine.inputManager.isUIOpen || this.engine.inputManager.isPaused;
        const isBreaking = this.engine.inputManager.isMouseButtonDown(0) && !isUIOpen;

        if (isBreaking) {
            this.isSwing = true;
        } else if (this.isSwing && this.swingProgress <= 0) {
            this.isSwing = false;
        }

        if (this.engine.inputManager.wasMouseButtonJustPressed(2) && !isUIOpen) {
            this.isPlace = true;
            this.placeProgress = 0;
        }

        this.applyAnimations(deltaTime);
    }

    getItemMaterial(textureName) {
        if (!textureName || !this.textureGenerator) return new THREE.MeshBasicMaterial({ color: 0xff00ff });
        const key = 'solid_item_' + textureName;
        if (!this.materialCache[key]) {
            const texture = this.textureGenerator.generate(textureName);
            // Плотный материал: без DoubleSide и без артефактов полупрозрачности
            this.materialCache[key] = new THREE.MeshLambertMaterial({
                map: texture,
                transparent: false,
                depthWrite: true,
                depthTest: true,
                side: THREE.FrontSide
            });
        }
        return this.materialCache[key];
    }

    getBlockMaterial(textureName) {
        if (!textureName || !this.textureGenerator) return new THREE.MeshBasicMaterial({ color: 0xff00ff });
        const key = 'block_' + textureName;
        if (!this.materialCache[key]) {
            const texture = this.textureGenerator.generate(textureName);
            const isTransparent = textureName.includes('leaves') || textureName.includes('glass') || textureName.includes('water');
            this.materialCache[key] = new THREE.MeshLambertMaterial({
                map: texture,
                transparent: isTransparent,
                alphaTest: isTransparent ? 0.1 : 0,
                depthWrite: true,
                side: THREE.FrontSide
            });
        }
        return this.materialCache[key];
    }

    updateMesh() {
        while (this.handContainer.children.length > 0) {
            const obj = this.handContainer.children[0];
            this.handContainer.remove(obj);
            if (obj.geometry) obj.geometry.dispose();
        }

        // Рука игрока (отключен receiveShadow для предотвращения теневого шума)
        const armGroup = new THREE.Group();
        const armGeo = new THREE.BoxGeometry(0.25, 0.8, 0.25);
        const armMat = new THREE.MeshLambertMaterial({ color: 0xaa8866 });
        const armMesh = new THREE.Mesh(armGeo, armMat);

        armMesh.rotation.x = -Math.PI / 8;
        armMesh.rotation.z = Math.PI / 16;
        armMesh.position.set(0.3, -0.2, 0.2);
        armMesh.castShadow = false;
        armMesh.receiveShadow = false;
        armGroup.add(armMesh);

        // Предмет / Блок в руке
        if (this.currentBlockId !== 0 && this.textureGenerator) {
            const props = BLOCK.get(this.currentBlockId);

            if (props.isItem) {
                const mat = this.getItemMaterial(props.texture);
                const canvas = this.textureGenerator.getCanvas(props.texture);
                const item3DGeo = getOrCreateItem3DGeometry(canvas, 0.5, 0.5 / 16);
                const itemMesh = new THREE.Mesh(item3DGeo, mat);

                // Отключаем наложение теней внутри вьюмодели
                itemMesh.castShadow = false;
                itemMesh.receiveShadow = false;
                armMesh.add(itemMesh);

                itemMesh.position.set(-0.1, 0.5, 0.1);
                itemMesh.rotation.x = 0;
                itemMesh.rotation.y = Math.PI / 2;
                itemMesh.rotation.z = Math.PI / 4;
                itemMesh.scale.set(1.2, 1.2, 1.2);
            } else if (props.texture) {
                const itemGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
                let materials = [];
                if (typeof props.texture === 'object') {
                    const matSide = this.getBlockMaterial(props.texture.side || props.texture.front);
                    const matTop = this.getBlockMaterial(props.texture.top);
                    const matBottom = this.getBlockMaterial(props.texture.bottom || props.texture.top);
                    const matFront = props.texture.front ? this.getBlockMaterial(props.texture.front) : matSide;
                    materials = [matSide, matSide, matTop, matBottom, matFront, matSide];
                } else {
                    const mat = this.getBlockMaterial(props.texture);
                    materials = [mat, mat, mat, mat, mat, mat];
                }
                const itemMesh = new THREE.Mesh(itemGeo, materials);
                itemMesh.castShadow = false;
                itemMesh.receiveShadow = false;
                armMesh.add(itemMesh);
                itemMesh.position.set(-0.1, 0.4, 0.1);
                itemMesh.rotation.y = Math.PI / 4;
            }
        }

        this.handContainer.add(armGroup);
    }

    applyAnimations(deltaTime) {
        let rotX = 0, rotY = 0, animY = 0, animZ = 0;

        const speed = this.rigidBody
            ? Math.sqrt(this.rigidBody.velocity.x ** 2 + this.rigidBody.velocity.z ** 2)
            : 0;
        const time = performance.now() / 1000;

        if (speed > 0.5 && this.rigidBody && this.rigidBody.isGrounded) {
            this.bobPos.x = Math.cos(time * 8) * 0.01;
            this.bobPos.y = Math.sin(time * 16) * 0.01;
        } else {
            this.bobPos.x = THREE.MathUtils.lerp(this.bobPos.x, 0, deltaTime * 10);
            this.bobPos.y = THREE.MathUtils.lerp(this.bobPos.y, 0, deltaTime * 10);
        }

        const velY = this.rigidBody ? this.rigidBody.velocity.y : 0;
        const targetJumpOffset = -Math.max(-0.2, Math.min(0.2, velY * 0.015));
        this.jumpOffset = THREE.MathUtils.lerp(this.jumpOffset, targetJumpOffset, deltaTime * 5);
        this.jumpTilt = THREE.MathUtils.lerp(this.jumpTilt, targetJumpOffset * 2, deltaTime * 5);

        if (this.isSwing) {
            this.swingProgress += deltaTime * this.swingSpeed;
            if (this.swingProgress >= Math.PI) {
                if (this.engine.inputManager.isMouseButtonDown(0)) {
                    this.swingProgress = 0;
                } else {
                    this.isSwing = false;
                    this.swingProgress = 0;
                }
            }

            const sin = Math.sin(this.swingProgress);
            rotX -= sin * 1.2;
            rotY -= sin * 0.6;
            animZ -= sin * 0.8;
            animY -= sin * 0.2;
        }

        if (this.isPlace) {
            this.placeProgress += deltaTime * this.placeSpeed;
            if (this.placeProgress >= Math.PI) {
                this.isPlace = false;
                this.placeProgress = 0;
            } else {
                const sin = Math.sin(this.placeProgress);
                rotX -= sin * 0.5;
                animY -= sin * 0.2;
                animZ += sin * 0.2;
            }
        }

        this.handContainer.position.set(
            this.basePos.x + this.bobPos.x,
            this.basePos.y + this.bobPos.y + animY + this.jumpOffset,
            this.basePos.z + animZ
        );
        this.handContainer.rotation.set(rotX + this.jumpTilt, rotY, 0);
    }
}