// game/PlayerHand.js
import { Component } from '../Lumina/js/core/Component.js';
import { BLOCK } from './blocks.js';
import { Inventory } from './Inventory.js';
import { RigidBody } from '../Lumina/js/physics/RigidBody.js';
import * as THREE from 'three';

export class PlayerHand extends Component {
    constructor(gameObject, settingsManager) {
        super(gameObject);
        this.settings = settingsManager;
        
        // Основной контейнер, который мы будем вращать/качать
        this.handContainer = new THREE.Group();
        
        this.currentBlockId = 0;
        
        // Анимации
        this.isSwing = false;
        this.swingTime = 0;
        this.isPlace = false;
        this.placeTime = 0;
        
        // Базовая позиция всей системы "Рука + Предмет" относительно камеры
        // Чуть правее и ниже центра
        this.basePos = { x: 0.4, y: -0.7, z: -0.6 }; 
        
        this.bobPos = new THREE.Vector3();
        this.textureLoader = new THREE.TextureLoader();
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

        // Триггеры
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
            const texture = this.textureLoader.load(`textures/${textureName}`);
            texture.magFilter = THREE.NearestFilter;
            texture.minFilter = THREE.NearestFilter;
            texture.colorSpace = THREE.SRGBColorSpace;
            
            const isTransparent = textureName.includes('leaves') || textureName.includes('glass');
            
            this.materialCache[textureName] = new THREE.MeshLambertMaterial({ 
                map: texture,
                transparent: isTransparent,
                alphaTest: isTransparent ? 0.5 : 0
            });
        }
        return this.materialCache[textureName];
    }

    updateMesh() {
        // Очищаем контейнер полностью
        while(this.handContainer.children.length > 0){ 
            const obj = this.handContainer.children[0];
            this.handContainer.remove(obj);
            if(obj.geometry) obj.geometry.dispose();
            // Материалы кэшированы, их не трогаем
        }

        // 1. Создаем ГРУППУ РУКИ (она будет содержать меш руки и меш предмета)
        const armGroup = new THREE.Group();

        // 2. Создаем МЕШ РУКИ (Стива) - он есть всегда
        const armGeo = new THREE.BoxGeometry(0.2, 0.7, 0.2);
        const armMat = new THREE.MeshLambertMaterial({ color: 0xaa8866 });
        const armMesh = new THREE.Mesh(armGeo, armMat);
        
        // Применяем настройки позиции руки, которые вы просили
        armMesh.rotation.x = -Math.PI / 4;
        armMesh.rotation.z = Math.PI / 16;
        armMesh.position.set(0.2, 0.1, 0.0);
        
        armMesh.castShadow = true;
        armMesh.receiveShadow = true;

        // Добавляем руку в группу
        armGroup.add(armMesh);


        // 3. Если есть предмет, создаем его и крепим к руке
        const props = BLOCK.get(this.currentBlockId);
        
        if (this.currentBlockId !== 0 && props.texture) {
            const itemGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3); // Маленький блок
            let materials = [];

            if (typeof props.texture === 'object') {
                const matSide = this.getMaterial(props.texture.side);
                const matTop = this.getMaterial(props.texture.top);
                const matBottom = this.getMaterial(props.texture.bottom);
                materials = [matSide, matSide, matTop, matBottom, matSide, matSide];
            } else {
                const mat = this.getMaterial(props.texture);
                materials = [mat, mat, mat, mat, mat, mat];
            }

            const itemMesh = new THREE.Mesh(itemGeo, materials);
            itemMesh.castShadow = true;
            
            // === ПОЗИЦИОНИРОВАНИЕ БЛОКА В РУКЕ ===
            // Нам нужно сдвинуть блок так, чтобы он был "в кулаке" у armMesh.
            // Поскольку armMesh наклонен, блок тоже нужно наклонить/сдвинуть.
            
            // Крепим блок прямо к мешу руки! Так он будет вращаться вместе с ней.
            armMesh.add(itemMesh);

            // Смещаем относительно центра руки (к кисти)
            itemMesh.position.set(-0.1, 0.4, 0.1); 
            
            // Немного доворачиваем блок, чтобы он смотрел прямо
            itemMesh.rotation.x = Math.PI / 4; 
            itemMesh.rotation.y = Math.PI / 4; 
        }

        // Добавляем всю конструкцию в главный контейнер
        this.handContainer.add(armGroup);
    }

    applyAnimations(deltaTime) {
        let rotX = 0;
        let rotY = 0;
        let animY = 0;
        let animZ = 0;

        // Sway / Bobbing
        const speed = Math.sqrt(this.rigidBody.velocity.x**2 + this.rigidBody.velocity.z**2);
        const time = performance.now() / 1000;

        if (speed > 0.5 && this.rigidBody.isGrounded) {
            this.bobPos.x = Math.cos(time * 8) * 0.015;
            this.bobPos.y = Math.sin(time * 16) * 0.015;
        } else {
            this.bobPos.x = THREE.MathUtils.lerp(this.bobPos.x, 0, deltaTime * 10);
            this.bobPos.y = THREE.MathUtils.lerp(this.bobPos.y, 0, deltaTime * 10);
        }

        // Swing (Удар)
        if (this.isSwing) {
            this.swingTime += deltaTime * 15;
            if (this.swingTime > Math.PI) {
                this.isSwing = false;
                this.swingTime = 0;
            }
            const sin = Math.sin(this.swingTime);
            rotX -= sin * 0.8;
            rotY -= sin * 0.3;
            animZ -= sin * 0.2;
        }

        // Place (Установка)
        if (this.isPlace) {
            this.placeTime += deltaTime * 20;
            if (this.placeTime > Math.PI) {
                this.isPlace = false;
                this.placeTime = 0;
            }
            const sin = Math.sin(this.placeTime);
            rotX -= sin * 0.4;
            animY -= sin * 0.1;
        }

        // Применяем все трансформации к главному контейнеру
        this.handContainer.position.set(
            this.basePos.x + this.bobPos.x,
            this.basePos.y + this.bobPos.y + animY,
            this.basePos.z + animZ
        );

        this.handContainer.rotation.set(rotX, rotY, 0);
    }
}