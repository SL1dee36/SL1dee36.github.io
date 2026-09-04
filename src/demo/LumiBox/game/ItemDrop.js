// game/ItemDrop.js
// author: Nazaryan A.K.
// github: @Sl1dee36

import * as THREE from 'three';
import { BLOCK } from './blocks.js';
import { Inventory } from './Inventory.js';
import { getOrCreateItem3DGeometry } from './utils/ItemGeometry.js';

export class ItemDrop {
    constructor(world, x, y, z, blockId, count = 1, velocity = null) {
        this.world = world;
        this.blockId = blockId;
        this.count = count;

        this.position = new THREE.Vector3(x, y, z);
        this.prevPosition = this.position.clone();
        
        // Начальный импульс выброса
        this.velocity = velocity ? velocity.clone() : new THREE.Vector3(
            (Math.random() - 0.5) * 2.5,
            3.5,
            (Math.random() - 0.5) * 2.5
        );

        this.isGrounded = false;
        this.isInWater = false;
        this.isPickedUp = false;

        this.spawnTime = performance.now();
        this.pickupDelay = 0.6; // Задержка перед возможностью подбора (сек)
        
        // Случайный угол лежания на земле
        this.groundYaw = Math.random() * Math.PI * 2;

        this.mesh = this.createMesh();
        this.world.scene.add(this.mesh);
        this.updateMeshTransform(1.0);
    }

    createMesh() {
        const props = BLOCK.get(this.blockId);
        let texKey = '';
        if (typeof props.texture === 'object') {
            texKey = props.texture.front || props.texture.side || props.texture.top;
        } else {
            texKey = props.texture;
        }

        const texture = this.world.textureGenerator.generate(texKey);
        let geometry;
        let material;

        if (props.isItem) {
            geometry = new THREE.PlaneGeometry(0.3, 0.3);
            material = new THREE.MeshLambertMaterial({
                map: texture,
                transparent: true,
                alphaTest: 0.2,
                side: THREE.DoubleSide
            });
        } else {
            geometry = new THREE.BoxGeometry(0.25, 0.25, 0.25);
            material = new THREE.MeshLambertMaterial({
                map: texture,
                transparent: !!props.isTransparent,
                alphaTest: props.isTransparent ? 0.2 : 0
            });
        }

        if (props.isItem || props.isPlant) {
            const canvas = this.world.textureGenerator.getCanvas(texKey);
            // Размер 0.35, толщина 0.35 / 16
            geometry = getOrCreateItem3DGeometry(canvas, 0.35, 0.35 / 16);
            material = new THREE.MeshLambertMaterial({
                map: texture,
                transparent: true,
                alphaTest: 0.1
            });
        }

        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        return mesh;
    }

    fixedUpdate(dt, player) {
        if (this.isPickedUp) return;

        this.prevPosition.copy(this.position);

        const bx = Math.floor(this.position.x);
        const by = Math.floor(this.position.y);
        const bz = Math.floor(this.position.z);

        this.isInWater = this.world.isWater(bx, by, bz);

        // 1. Физика в воде (плавучесть и течение)
        if (this.isInWater) {
            this.isGrounded = false;
            this.velocity.y += (1.5 - this.velocity.y) * 4.0 * dt; // Всплытие/плавучесть
            this.velocity.x *= 0.85;
            this.velocity.z *= 0.85;

            // Вычисление направления течения воды по соседним блокам
            const flow = this.calculateWaterFlow(bx, by, bz);
            this.velocity.x += flow.x * 3.5 * dt;
            this.velocity.z += flow.z * 3.5 * dt;
        } else {
            // 2. Обычная гравитация и сопротивление воздуха
            if (!this.isGrounded) {
                this.velocity.y -= 20.0 * dt;
                this.velocity.x *= 0.96;
                this.velocity.z *= 0.96;
            } else {
                this.velocity.x *= 0.6;
                this.velocity.z *= 0.6;
            }
        }

        // 3. Интеграция позиции и коллизии с блоками мира
        this.stepPhysics(dt);

        // 4. Проверка опоры (если блок под предметом сломали — начинаем падать)
        if (this.isGrounded) {
            const groundCheckY = Math.floor(this.position.y - 0.05);
            if (!this.world.isSolid(Math.floor(this.position.x), groundCheckY, Math.floor(this.position.z))) {
                this.isGrounded = false;
            }
        }

        // 5. Логика притяжения и подбора игроком
        const age = (performance.now() - this.spawnTime) / 1000;
        if (age > this.pickupDelay && player) {
            const pPos = player.transform.position;
            const dist = this.position.distanceTo(pPos);

            // Радиус подбора (1.8м)
            if (dist < 1.8) {
                const toPlayer = new THREE.Vector3().subVectors(pPos, this.position).normalize();
                this.position.addScaledVector(toPlayer, Math.max(3.0, (2.0 - dist) * 8.0) * dt);
                this.isGrounded = false;

                // Подбор в инвентарь (0.6м)
                if (dist < 0.6) {
                    const inv = player.getComponent(Inventory) || player.getComponent('Inventory');
                    if (inv) {
                        const added = inv.addItem(this.blockId, this.count);
                        if (added) {
                            if (player.getComponent('PlayerController')?.soundManager) {
                                player.getComponent('PlayerController').soundManager.playStep();
                            }
                            this.destroy();
                            this.isPickedUp = true;
                        }
                    }
                }
            }
        }
    }

    stepPhysics(dt) {
        const radius = 0.15;
        const height = 0.25;

        // Ось Y
        this.position.y += this.velocity.y * dt;
        const currentY = this.position.y;
        const bottomY = Math.floor(currentY);

        if (this.velocity.y <= 0 && this.world.isSolid(Math.floor(this.position.x), bottomY, Math.floor(this.position.z))) {
            const surfaceY = bottomY + 1.0;
            if (currentY <= surfaceY + 0.05) {
                this.position.y = surfaceY + 0.01;
                this.velocity.y = 0;
                this.velocity.x = 0;
                this.velocity.z = 0;
                this.isGrounded = true;
            }
        }

        // Ось X
        const nextX = this.position.x + this.velocity.x * dt;
        const checkX = Math.floor(nextX + Math.sign(this.velocity.x) * radius);
        if (this.world.isSolid(checkX, Math.floor(this.position.y + 0.1), Math.floor(this.position.z))) {
            this.velocity.x = 0;
        } else {
            this.position.x = nextX;
        }

        // Ось Z
        const nextZ = this.position.z + this.velocity.z * dt;
        const checkZ = Math.floor(nextZ + Math.sign(this.velocity.z) * radius);
        if (this.world.isSolid(Math.floor(this.position.x), Math.floor(this.position.y + 0.1), checkZ)) {
            this.velocity.z = 0;
        } else {
            this.position.z = nextZ;
        }
    }

    calculateWaterFlow(x, y, z) {
        const flow = new THREE.Vector3(0, 0, 0);
        const currentMeta = this.world.getMeta(x, y, z);

        const neighbors = [
            { dx: 1, dz: 0 },
            { dx: -1, dz: 0 },
            { dx: 0, dz: 1 },
            { dx: 0, dz: -1 }
        ];

        neighbors.forEach(n => {
            const nx = x + n.dx;
            const nz = z + n.dz;
            const nVoxel = this.world.getVoxel(nx, y, nz);
            
            if (nVoxel === BLOCK.WATER) {
                const nMeta = this.world.getMeta(nx, y, nz);
                const diff = currentMeta - nMeta;
                flow.x += n.dx * diff;
                flow.z += n.dz * diff;
            } else if (nVoxel === BLOCK.AIR) {
                flow.x += n.dx * 4;
                flow.z += n.dz * 4;
            }
        });

        if (flow.lengthSq() > 0) {
            flow.normalize();
        }
        return flow;
    }

    renderUpdate(time) {
        if (this.isPickedUp) return;
        this.updateMeshTransform(1.0);
    }

    updateMeshTransform(alpha) {
        const interpolated = new THREE.Vector3().lerpVectors(this.prevPosition, this.position, alpha);
        const props = BLOCK.get(this.blockId);

        if (this.isGrounded) {
            // Предмет лежит устойчиво на плоскости
            if (props.isItem) {
                this.mesh.position.set(interpolated.x, interpolated.y + 0.02, interpolated.z);
                this.mesh.rotation.set(-Math.PI / 2, 0, this.groundYaw);
            } else {
                this.mesh.position.set(interpolated.x, interpolated.y + 0.125, interpolated.z);
                this.mesh.rotation.set(0, this.groundYaw, 0);
            }
        } else if (this.isInWater) {
            // Плавное покачивание на волнах воды
            this.mesh.position.set(interpolated.x, interpolated.y + Math.sin(performance.now() * 0.005 + interpolated.x) * 0.03, interpolated.z);
            this.mesh.rotation.y += 0.02;
            this.mesh.rotation.x = 0;
            this.mesh.rotation.z = 0;
        } else {
            // В полете
            this.mesh.position.copy(interpolated);
            this.mesh.rotation.y += 0.05;
        }
    }

    destroy() {
        this.world.scene.remove(this.mesh);
        if (this.mesh.geometry) this.mesh.geometry.dispose();
        if (this.mesh.material) {
            if (Array.isArray(this.mesh.material)) {
                this.mesh.material.forEach(m => m.dispose());
            } else {
                this.mesh.material.dispose();
            }
        }
    }
}