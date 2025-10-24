// Lumina/js/physics/PhysicsEngine.js

import { Collider, BoxCollider } from './Colliders.js';
import { BLOCK } from '../../../game/blocks.js';
import * as THREE from 'three';

export class PhysicsEngine {
    constructor() {
        this.rigidBodies = [];
        this.gravity = new THREE.Vector3(0, -20, 0); // Увеличим гравитацию для "отзывчивости"
        this.world = null;
    }

    setWorld(world) {
        this.world = world;
    }

    addRigidBody(body) {
        this.rigidBodies.push(body);
    }

    update(deltaTime) {
        if (!this.world) return;

        this.rigidBodies.forEach(body => {
            if (body.bodyType === 'dynamic') {
                // Применяем гравитацию
                body.velocity.y += this.gravity.y * deltaTime;

                // Применяем скорость к позиции
                body.transform.position.add(body.velocity.clone().multiplyScalar(deltaTime));
                
                // Сбрасываем состояние "на земле" перед проверкой
                body.isGrounded = false;
            }
        });

        // Итерации для более стабильного разрешения столкновений
        const iterations = 5;
        for (let i = 0; i < iterations; i++) {
            this.rigidBodies.forEach(body => {
                if (body.bodyType === 'dynamic') {
                    this.resolveBodyVsWorld(body);
                }
            });
        }
    }

    resolveBodyVsWorld(body) {
        const collider = body.gameObject.getComponent(BoxCollider);
        if (!collider) return;

        const pos = body.transform.position;
        const halfSize = collider.halfSize;

        // Создаем AABB (Axis-Aligned Bounding Box) для игрока
        const bodyAABB = new THREE.Box3(
            pos.clone().sub(halfSize),
            pos.clone().add(halfSize)
        );

        // Получаем координаты вокселей, которые могут пересекаться с игроком
        const minX = Math.floor(bodyAABB.min.x);
        const maxX = Math.ceil(bodyAABB.max.x);
        const minY = Math.floor(bodyAABB.min.y);
        const maxY = Math.ceil(bodyAABB.max.y);
        const minZ = Math.floor(bodyAABB.min.z);
        const maxZ = Math.ceil(bodyAABB.max.z);

        // Проверяем каждый потенциально конфликтующий воксель
        for (let y = minY; y < maxY; y++) {
            for (let z = minZ; z < maxZ; z++) {
                for (let x = minX; x < maxX; x++) {
                    const blockId = this.world.getVoxel(x, y, z);
                    const blockProps = BLOCK.get(blockId);

                    if (blockProps.isSolid) {
                        // Этот блок твердый, проверяем столкновение
                        const blockAABB = new THREE.Box3(
                            new THREE.Vector3(x, y, z),
                            new THREE.Vector3(x + 1, y + 1, z + 1)
                        );
                        
                        if (bodyAABB.intersectsBox(blockAABB)) {
                            // Есть столкновение, вычисляем вектор проникновения
                            const penetration = this.getPenetrationVector(bodyAABB, blockAABB);
                            
                            // Смещаем игрока, чтобы убрать проникновение
                            pos.add(penetration);

                            // Обновляем AABB игрока после смещения
                            bodyAABB.min.add(penetration);
                            bodyAABB.max.add(penetration);

                            // Если столкнулись с полом/потолком, гасим вертикальную скорость
                            if (Math.abs(penetration.y) > 0) {
                                body.velocity.y = 0;
                                // Если столкнулись с полом (вытолкнули вверх), значит стоим на земле
                                if (penetration.y > 0) {
                                    body.isGrounded = true;
                                }
                            }
                            // Если столкнулись со стеной, гасим горизонтальную скорость в этом направлении
                             if (Math.abs(penetration.x) > 0) body.velocity.x = 0;
                             if (Math.abs(penetration.z) > 0) body.velocity.z = 0;
                        }
                    }
                }
            }
        }
    }
    
    getPenetrationVector(boxA, boxB) {
        const overlap = new THREE.Vector3(
            Math.min(boxA.max.x, boxB.max.x) - Math.max(boxA.min.x, boxB.min.x),
            Math.min(boxA.max.y, boxB.max.y) - Math.max(boxA.min.y, boxB.min.y),
            Math.min(boxA.max.z, boxB.max.z) - Math.max(boxA.min.z, boxB.min.z)
        );

        const centerA = new THREE.Vector3();
        boxA.getCenter(centerA);
        const centerB = new THREE.Vector3();
        boxB.getCenter(centerB);
        const delta = centerA.sub(centerB);

        const penetration = new THREE.Vector3();
        if (overlap.x < overlap.y && overlap.x < overlap.z) {
            penetration.x = overlap.x * Math.sign(delta.x);
        } else if (overlap.y < overlap.z) {
            penetration.y = overlap.y * Math.sign(delta.y);
        } else {
            penetration.z = overlap.z * Math.sign(delta.z);
        }
        
        return penetration;
    }
}