// game/Mob.js
// author: Nazaryan A.K.
// github: @Sl1dee36

import * as THREE from 'three';
import { BLOCK } from './blocks.js';

export class Mob {
    constructor(type, world, x, y, z) {
        this.type = type;
        this.world = world;
        this.isDead = false;

        this.position = new THREE.Vector3(x, y, z);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.rotationY = Math.random() * Math.PI * 2;

        this.walkTimer = 0;
        this.walkSpeed = (type === 'chicken') ? 1.8 : ((type === 'zombie' || type === 'skeleton') ? 2.8 : 2.0);
        this.isHostile = (type === 'zombie' || type === 'skeleton');

        // Здоровье
        if (type === 'chicken') this.hp = 4;
        else if (type === 'pig' || type === 'cow') this.hp = 10;
        else this.hp = 20;
        this.maxHp = this.hp;

        // Горение на солнце
        this.isOnFire = false;
        this.burnTimer = 0;
        this.damageFlashTimer = 0;

        this.legs = [];
        this.arms = [];
        this.head = null;
        this.fireMesh = null;

        this.mesh = this.createMesh();
        this.mesh.position.copy(this.position);
        this.world.scene.add(this.mesh);
    }

    createMesh() {
        const group = new THREE.Group();
        const mat = (col) => new THREE.MeshLambertMaterial({ color: col });

        if (this.type === 'chicken') {
            const body = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.45), mat(0xffffff));
            body.position.y = 0.35;
            group.add(body);

            const head = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.25, 0.2), mat(0xffffff));
            head.position.set(0, 0.55, 0.2);
            group.add(head);
            this.head = head;

            const beak = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.12), mat(0xffaa00));
            beak.position.set(0, 0.52, 0.32);
            group.add(beak);

            const wattle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.08), mat(0xdd2222));
            wattle.position.set(0, 0.44, 0.25);
            group.add(wattle);

            const legMat = mat(0xffaa00);
            const legL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.25, 0.06), legMat);
            legL.position.set(-0.08, 0.125, 0);
            const legR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.25, 0.06), legMat);
            legR.position.set(0.08, 0.125, 0);
            group.add(legL, legR);
            this.legs.push(legL, legR);
        } else if (this.type === 'pig') {
            const body = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.55, 0.9), mat(0xf598a6));
            body.position.y = 0.55;
            group.add(body);

            const head = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.42), mat(0xf598a6));
            head.position.set(0, 0.65, 0.52);
            group.add(head);
            this.head = head;

            const snout = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.1), mat(0xe87a8c));
            snout.position.set(0, 0.6, 0.74);
            group.add(snout);

            const legMat = mat(0xf598a6);
            const p = [[-0.22, 0.25], [0.22, 0.25], [-0.22, -0.25], [0.22, -0.25]];
            for (let i = 0; i < 4; i++) {
                const leg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.35, 0.18), legMat);
                leg.position.set(p[i][0], 0.175, p[i][1]);
                group.add(leg);
                this.legs.push(leg);
            }
        } else if (this.type === 'cow') {
            const body = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.75, 1.15), mat(0x523d2e));
            body.position.y = 0.75;
            group.add(body);

            const head = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.45), mat(0x523d2e));
            head.position.set(0, 0.95, 0.65);
            group.add(head);
            this.head = head;

            const hornMat = mat(0xd0d0d0);
            const hornL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.15, 0.08), hornMat);
            hornL.position.set(-0.25, 1.2, 0.65);
            const hornR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.15, 0.08), hornMat);
            hornR.position.set(0.25, 1.2, 0.65);
            group.add(hornL, hornR);

            const legMat = mat(0x403024);
            const p = [[-0.25, 0.35], [0.25, 0.35], [-0.25, -0.35], [0.25, -0.35]];
            for (let i = 0; i < 4; i++) {
                const leg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.5, 0.2), legMat);
                leg.position.set(p[i][0], 0.25, p[i][1]);
                group.add(leg);
                this.legs.push(leg);
            }
        } else if (this.type === 'zombie') {
            // Тело зомби
            const body = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.68, 0.26), mat(0x009999));
            body.position.y = 0.95;
            group.add(body);

            const head = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.42), mat(0x3e753b));
            head.position.set(0, 1.45, 0);
            group.add(head);
            this.head = head;

            // Вытянутые вперед руки
            const armMat = mat(0x3e753b);
            const armL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.6, 0.16), armMat);
            armL.position.set(-0.32, 1.15, 0.25);
            armL.rotation.x = Math.PI / 2;
            const armR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.6, 0.16), armMat);
            armR.position.set(0.32, 1.15, 0.25);
            armR.rotation.x = Math.PI / 2;
            group.add(armL, armR);
            this.arms.push(armL, armR);

            const legMat = mat(0x283882);
            const legL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.68, 0.2), legMat);
            legL.position.set(-0.12, 0.34, 0);
            const legR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.68, 0.2), legMat);
            legR.position.set(0.12, 0.34, 0);
            group.add(legL, legR);
            this.legs.push(legL, legR);
        } else if (this.type === 'skeleton') {
            const body = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.65, 0.2), mat(0xc2c8cc));
            body.position.y = 0.95;
            group.add(body);

            const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), mat(0xd4dade));
            head.position.set(0, 1.45, 0);
            group.add(head);
            this.head = head;

            const boneMat = mat(0xc2c8cc);
            const armL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.6, 0.12), boneMat);
            armL.position.set(-0.28, 1.15, 0.2);
            armL.rotation.x = Math.PI / 2;
            const armR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.6, 0.12), boneMat);
            armR.position.set(0.28, 1.15, 0.2);
            armR.rotation.x = Math.PI / 2;
            group.add(armL, armR);
            this.arms.push(armL, armR);

            const legL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.68, 0.14), boneMat);
            legL.position.set(-0.11, 0.34, 0);
            const legR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.68, 0.14), boneMat);
            legR.position.set(0.11, 0.34, 0);
            group.add(legL, legR);
            this.legs.push(legL, legR);
        }

        // Огонь для дневного горения зомби и скелетов
        const fireGeo = new THREE.BoxGeometry(0.55, 0.8, 0.55);
        const fireMat = new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.6, wireframe: true });
        this.fireMesh = new THREE.Mesh(fireGeo, fireMat);
        this.fireMesh.position.y = 1.0;
        this.fireMesh.visible = false;
        group.add(this.fireMesh);

        group.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        return group;
    }

    takeDamage(amount, knockbackSource = null) {
        if (this.isDead) return;
        this.hp -= amount;
        this.damageFlashTimer = 0.2;

        if (knockbackSource) {
            const kb = new THREE.Vector3().subVectors(this.position, knockbackSource).normalize();
            this.velocity.x += kb.x * 5.5;
            this.velocity.y += 3.5;
            this.velocity.z += kb.z * 5.5;
        }

        if (this.hp <= 0) {
            this.die();
        }
    }

    die() {
        if (this.isDead) return;
        this.isDead = true;

        // Дроп предметов
        const p = this.position;
        if (this.type === 'cow') {
            this.world.spawnItemDrop(p.x, p.y + 0.5, p.z, BLOCK.RAW_BEEF, 1 + Math.floor(Math.random() * 2));
        } else if (this.type === 'pig') {
            this.world.spawnItemDrop(p.x, p.y + 0.5, p.z, BLOCK.RAW_PORKCHOP, 1 + Math.floor(Math.random() * 2));
        } else if (this.type === 'chicken') {
            this.world.spawnItemDrop(p.x, p.y + 0.5, p.z, BLOCK.RAW_CHICKEN, 1);
            this.world.spawnItemDrop(p.x, p.y + 0.5, p.z, BLOCK.FEATHER, Math.floor(Math.random() * 2));
        } else if (this.type === 'zombie') {
            this.world.spawnItemDrop(p.x, p.y + 0.5, p.z, BLOCK.ROTTEN_FLESH, 1 + Math.floor(Math.random() * 2));
        } else if (this.type === 'skeleton') {
            this.world.spawnItemDrop(p.x, p.y + 0.5, p.z, BLOCK.BONE, 1 + Math.floor(Math.random() * 2));
        }

        this.dispose();
    }

    dispose() {
        if (this.mesh && this.mesh.parent) {
            this.mesh.parent.remove(this.mesh);
        }
    }

    update(dt, playerPos) {
        if (this.isDead) return;

        // 1. Горение на солнце (Зомби и Скелет горят днём под открытым небом)
        if (this.isHostile) {
            const isDay = (this.world.sunBrightness > 0.4);
            const inWater = this.world.isWater(Math.floor(this.position.x), Math.floor(this.position.y), Math.floor(this.position.z));

            if (isDay && !inWater) {
                // Проверяем открытое небо над мобом
                const topY = this.world.getTerrainHeight(Math.floor(this.position.x), Math.floor(this.position.z));
                const underOpenSky = (this.position.y >= topY - 0.5);

                if (underOpenSky) {
                    this.isOnFire = true;
                    this.burnTimer += dt;
                    if (this.burnTimer >= 0.8) {
                        this.burnTimer = 0;
                        this.takeDamage(1);
                    }
                } else {
                    this.isOnFire = false;
                }
            } else {
                this.isOnFire = false;
            }
            this.fireMesh.visible = this.isOnFire;
        }

        // 2. ИИ перемещения
        let moveX = 0, moveZ = 0;
        const distToPlayer = playerPos ? this.position.distanceTo(playerPos) : 999;

        if (this.isHostile && distToPlayer < 16 && distToPlayer > 1.2) {
            // Агрессивное преследование игрока
            const dir = new THREE.Vector3().subVectors(playerPos, this.position);
            dir.y = 0;
            dir.normalize();
            this.rotationY = Math.atan2(dir.x, dir.z);
            moveX = dir.x * this.walkSpeed;
            moveZ = dir.z * this.walkSpeed;
        } else {
            // Случайное блуждание
            this.walkTimer -= dt;
            if (this.walkTimer <= 0) {
                this.walkTimer = 2.0 + Math.random() * 3.0;
                this.isWalking = Math.random() > 0.35;
                if (this.isWalking) {
                    this.rotationY += (Math.random() - 0.5) * 1.8;
                }
            }
            if (this.isWalking) {
                moveX = Math.sin(this.rotationY) * (this.walkSpeed * 0.6);
                moveZ = Math.cos(this.rotationY) * (this.walkSpeed * 0.6);
            }
        }

        // 3. Физика и гравитация
        this.velocity.y -= 18.0 * dt;
        this.position.x += (moveX + this.velocity.x) * dt;
        this.position.z += (moveZ + this.velocity.z) * dt;
        this.position.y += this.velocity.y * dt;

        this.velocity.x *= Math.pow(0.2, dt);
        this.velocity.z *= Math.pow(0.2, dt);

        // Столкновения с воксельным миром
        const gx = Math.floor(this.position.x);
        const gy = Math.floor(this.position.y);
        const gz = Math.floor(this.position.z);

        if (this.world.isSolid(gx, gy, gz)) {
            // Если перед мобом блок высотой 1, моб делает шаг наверх (авто-прыжок)
            if (!this.world.isSolid(gx, gy + 1, gz) && !this.world.isSolid(gx, gy + 2, gz)) {
                this.position.y = gy + 1.0;
                this.velocity.y = 0;
            } else {
                this.position.y = gy + 1.0;
                this.velocity.y = 0;
            }
        } else if (this.world.isSolid(gx, gy - 1, gz)) {
            this.position.y = gy;
            this.velocity.y = 0;
        }

        // 4. Анимация ходьбы
        const isMoving = (Math.abs(moveX) > 0.1 || Math.abs(moveZ) > 0.1);
        if (isMoving) {
            const cycle = performance.now() * 0.008;
            for (let i = 0; i < this.legs.length; i++) {
                this.legs[i].rotation.x = Math.sin(cycle + (i % 2) * Math.PI) * 0.6;
            }
        } else {
            for (let i = 0; i < this.legs.length; i++) this.legs[i].rotation.x = 0;
        }

        // Мигание красным при уроне
        if (this.damageFlashTimer > 0) {
            this.damageFlashTimer -= dt;
            this.mesh.traverse(child => {
                if (child.isMesh && child.material && child !== this.fireMesh) {
                    child.material.color.setRGB(1.0, 0.2, 0.2);
                }
            });
        }

        this.mesh.position.copy(this.position);
        this.mesh.rotation.y = this.rotationY;
    }
}
