import { Component } from '../Lumina/js/core/Component.js';
import { BLOCK } from './blocks.js';
import { Inventory } from './Inventory.js';
import { RigidBody } from '../Lumina/js/physics/RigidBody.js';
import { BlockInteraction } from './BlockInteraction.js';
import * as THREE from 'three';
import { TextureGenerator } from './TextureGenerator.js';

export class PlayerHand extends Component {
    constructor(gameObject, settingsManager) {
        super(gameObject);
        this.settings = settingsManager;
        
        this.handContainer = new THREE.Group();
        this.currentBlockId = 0;
        
        // Animation States
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
        
        this.textureGenerator = new TextureGenerator();
        this.materialCache = {};
    }

    start() {
        this.camera = this.engine.renderer.camera;
        this.inventory = this.gameObject.getComponent(Inventory);
        this.rigidBody = this.gameObject.getComponent(RigidBody);
        this.blockInteraction = this.gameObject.getComponent(BlockInteraction);

        this.camera.add(this.handContainer);
        this.updateMesh();
    }

    update(deltaTime) {
        const showHand = this.settings.get('showHand');
        this.handContainer.visible = showHand;

        if (!showHand) return;

        const selectedItem = this.inventory.getSelectedItem();
        const selectedId = selectedItem ? selectedItem.id : 0;

        if (selectedId !== this.currentBlockId) {
            this.currentBlockId = selectedId;
            this.updateMesh();
        }

        // --- Logic for Animations ---
        // 1. Break / Hit Animation
        // Check if user is holding button OR if BlockInteraction is actively breaking
        const isBreaking = this.engine.inputManager.isMouseButtonDown(0);
        
        if (isBreaking) {
            // Loop swing while holding
            this.isSwing = true;
        } else if (this.isSwing && this.swingProgress <= 0) {
            // Stop if released and cycle finished
            this.isSwing = false;
        }

        // 2. Place Animation
        if (this.engine.inputManager.wasMouseButtonJustPressed(2)) {
            this.isPlace = true;
            this.placeProgress = 0;
        }

        this.applyAnimations(deltaTime);
    }

    getMaterial(textureName) {
        if (!textureName) return new THREE.MeshBasicMaterial({ color: 0xff00ff });

        if (!this.materialCache[textureName]) {
            const texture = this.textureGenerator.generate(textureName);
            const isTransparent = textureName.includes('leaves') || textureName.includes('glass') || textureName.includes('water') || textureName.includes('item') || textureName.includes('tool');
            
            this.materialCache[textureName] = new THREE.MeshLambertMaterial({ 
                map: texture,
                transparent: true,
                alphaTest: 0.1,
                side: THREE.DoubleSide
            });
        }
        return this.materialCache[textureName];
    }

    updateMesh() {
        while(this.handContainer.children.length > 0){ 
            const obj = this.handContainer.children[0];
            this.handContainer.remove(obj);
            if(obj.geometry) obj.geometry.dispose();
        }

        // Arm
        const armGroup = new THREE.Group();
        const armGeo = new THREE.BoxGeometry(0.25, 0.8, 0.25);
        const armMat = new THREE.MeshLambertMaterial({ color: 0xaa8866 });
        const armMesh = new THREE.Mesh(armGeo, armMat);
        
        armMesh.rotation.x = -Math.PI / 8;
        armMesh.rotation.z = Math.PI / 16;
        armMesh.position.set(0.3, -0.2, 0.2);
        
        armMesh.castShadow = true;
        armMesh.receiveShadow = true;
        armGroup.add(armMesh);

        // Item
        if (this.currentBlockId !== 0) {
            const props = BLOCK.get(this.currentBlockId);
            
            if (props.isItem) {
                const mat = this.getMaterial(props.texture);
                const planeGeo = new THREE.PlaneGeometry(0.5, 0.5);
                const itemMesh = new THREE.Mesh(planeGeo, mat);
                
                armMesh.add(itemMesh);
                
                itemMesh.position.set(-0.1, 0.5, 0.1);
                itemMesh.rotation.x = 0;
                itemMesh.rotation.y = Math.PI / 2;
                itemMesh.rotation.z = Math.PI / 9;
                itemMesh.scale.set(1.2, 1.2, 1.2);

            } else if (props.texture) {
                const itemGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
                let materials = [];

                if (typeof props.texture === 'object') {
                    const matSide = this.getMaterial(props.texture.side);
                    const matTop = this.getMaterial(props.texture.top);
                    const matBottom = this.getMaterial(props.texture.bottom);
                    const matFront = props.texture.front ? this.getMaterial(props.texture.front) : matSide;
                    materials = [matSide, matSide, matTop, matBottom, matFront, matSide];
                } else {
                    const mat = this.getMaterial(props.texture);
                    materials = [mat, mat, mat, mat, mat, mat];
                }

                const itemMesh = new THREE.Mesh(itemGeo, materials);
                itemMesh.castShadow = true;
                armMesh.add(itemMesh);
                itemMesh.position.set(-0.1, 0.4, 0.1); 
                itemMesh.rotation.y = Math.PI / 4; 
            }
        }

        this.handContainer.add(armGroup);
    }

    applyAnimations(deltaTime) {
        let rotX = 0;
        let rotY = 0;
        let animY = 0;
        let animZ = 0;

        const speed = Math.sqrt(this.rigidBody.velocity.x**2 + this.rigidBody.velocity.z**2);
        const time = performance.now() / 1000;

        // 1. Walk Bobbing
        if (speed > 0.5 && this.rigidBody.isGrounded) {
            this.bobPos.x = Math.cos(time * 8) * 0.01;
            this.bobPos.y = Math.sin(time * 16) * 0.01;
        } else {
            this.bobPos.x = THREE.MathUtils.lerp(this.bobPos.x, 0, deltaTime * 10);
            this.bobPos.y = THREE.MathUtils.lerp(this.bobPos.y, 0, deltaTime * 10);
        }

        // 2. Jump/Fall Inertia
        const targetJumpOffset = -Math.max(-0.2, Math.min(0.2, this.rigidBody.velocity.y * 0.015));
        this.jumpOffset = THREE.MathUtils.lerp(this.jumpOffset, targetJumpOffset, deltaTime * 5);
        this.jumpTilt = THREE.MathUtils.lerp(this.jumpTilt, targetJumpOffset * 2, deltaTime * 5);

        // 3. Swing Animation (Attack / Break)
        if (this.isSwing) {
            this.swingProgress += deltaTime * this.swingSpeed;
            if (this.swingProgress >= Math.PI) {
                // Check if we should keep swinging (mouse held)
                if (this.engine.inputManager.isMouseButtonDown(0)) {
                    this.swingProgress = 0; // Reset for next cycle
                } else {
                    this.isSwing = false;
                    this.swingProgress = 0;
                }
            }
            
            // Simple sine wave swing
            const sin = Math.sin(this.swingProgress);
            rotX -= sin * 1.2;
            rotY -= sin * 0.6;
            animZ -= sin * 0.8;
            animY -= sin * 0.2;
        }

        // 4. Place Animation (Quick dip)
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