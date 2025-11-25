// game/PlayerHand.js
import { Component } from '../Lumina/js/core/Component.js';
import { BLOCK } from './blocks.js';
import { Inventory } from './Inventory.js';
import { RigidBody } from '../Lumina/js/physics/RigidBody.js';
import * as THREE from 'three';
import { TextureGenerator } from './TextureGenerator.js';

export class PlayerHand extends Component {
    constructor(gameObject, settingsManager) {
        super(gameObject);
        this.settings = settingsManager;
        
        this.handContainer = new THREE.Group();
        this.currentBlockId = 0;
        
        this.isSwing = false; this.swingTime = 0;
        this.isPlace = false; this.placeTime = 0;
        
        this.basePos = { x: 0.4, y: -0.6, z: -0.8 }; 
        this.bobPos = new THREE.Vector3();
        
        this.textureGenerator = new TextureGenerator();
        this.materialCache = {};
    }

    start() {
        this.camera = this.engine.renderer.camera;
        this.inventory = this.gameObject.getComponent(Inventory);
        this.rigidBody = this.gameObject.getComponent(RigidBody);

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

        if (this.engine.inputManager.wasMouseButtonJustPressed(0)) {
            this.swingTime = 0;
            this.isSwing = true;
        }
        if (this.engine.inputManager.wasMouseButtonJustPressed(2)) {
            this.placeTime = 0;
            this.isPlace = true;
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
                // FLAT ITEM RENDER
                const itemGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5); // Thin box
                const mat = this.getMaterial(props.texture);
                const materials = [
                    null, null, // Left/Right (transparent)
                    null, null, // Top/Bottom
                    mat, mat    // Front/Back
                ];
                // For simplified flat look, we can just use the material on all sides or a PlaneGeometry.
                // BoxGeometry with 0.05 depth gives it a "3D pixel" feel like MC.
                // However, Box sides need UV mapping fixes or just use basic color.
                // Simplest: PlaneGeometry 
                
                // Let's use PlaneGeometry for true flatness
                const planeGeo = new THREE.PlaneGeometry(0.5, 0.5);
                const itemMesh = new THREE.Mesh(planeGeo, mat);
                
                // Attach to arm
                armMesh.add(itemMesh);
                
                // Position like a held tool
                itemMesh.position.set(-0.1, 0.6, 0.1);
                itemMesh.rotation.x = 0;
                itemMesh.rotation.y = Math.PI / 2;
                itemMesh.rotation.z = Math.PI / 4;
                itemMesh.scale.set(1.2, 1.2, 1.2);

            } else if (props.texture) {
                // BLOCK RENDER
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

        if (speed > 0.5 && this.rigidBody.isGrounded) {
            this.bobPos.x = Math.cos(time * 8) * 0.01;
            this.bobPos.y = Math.sin(time * 16) * 0.01;
        } else {
            this.bobPos.x = THREE.MathUtils.lerp(this.bobPos.x, 0, deltaTime * 10);
            this.bobPos.y = THREE.MathUtils.lerp(this.bobPos.y, 0, deltaTime * 10);
        }

        if (this.isSwing) {
            this.swingTime += deltaTime * 15;
            if (this.swingTime > Math.PI) {
                this.isSwing = false;
                this.swingTime = 0;
            }
            const sin = Math.sin(this.swingTime);
            rotX -= sin * 1.0;
            rotY -= sin * 0.5;
            animZ -= sin * 0.5;
        }

        this.handContainer.position.set(
            this.basePos.x + this.bobPos.x,
            this.basePos.y + this.bobPos.y + animY,
            this.basePos.z + animZ
        );

        this.handContainer.rotation.set(rotX, rotY, 0);
    }
}