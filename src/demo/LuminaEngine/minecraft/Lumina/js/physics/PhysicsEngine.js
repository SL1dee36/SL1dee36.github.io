// Lumina/js/physics/PhysicsEngine.js
import { BoxCollider } from './Colliders.js';
import { BLOCK } from '../../../game/blocks.js';
import * as THREE from 'three';

export class PhysicsEngine {
    constructor() {
        this.rigidBodies = [];
        this.gravity = new THREE.Vector3(0, -20, 0); // Гравитация чуть сильнее для резкости
        this.world = null;
        
        this.fixedTimeStep = 1 / 30;
        this.timeAccumulator = 0;
        this.maxStepsPerFrame = 5;
    }

    setWorld(world) {
        this.world = world;
    }

    addRigidBody(body) {
        this.rigidBodies.push(body);
        body.physicsPosition = body.transform.position.clone();
        body.prevPhysicsPosition = body.transform.position.clone();
    }

    update(deltaTime) {
        if (!this.world) return;

        this.timeAccumulator += deltaTime;
        if (this.timeAccumulator > 0.2) this.timeAccumulator = 0.2;

        while (this.timeAccumulator >= this.fixedTimeStep) {
            this.savePreviousPositions();
            this.stepPhysics(this.fixedTimeStep);
            this.timeAccumulator -= this.fixedTimeStep;
        }

        const alpha = this.timeAccumulator / this.fixedTimeStep;
        this.interpolatePositions(alpha);
    }

    savePreviousPositions() {
        this.rigidBodies.forEach(body => {
            if (!body.physicsPosition) {
                body.physicsPosition = body.transform.position.clone();
                body.prevPhysicsPosition = body.transform.position.clone();
            }
            body.prevPhysicsPosition.copy(body.physicsPosition);
        });
    }

    interpolatePositions(alpha) {
        this.rigidBodies.forEach(body => {
            if (body.bodyType === 'dynamic' && body.physicsPosition) {
                body.transform.position.lerpVectors(body.prevPhysicsPosition, body.physicsPosition, alpha);
            }
        });
    }

    stepPhysics(dt) {
        this.rigidBodies.forEach(body => {
            if (body.bodyType === 'dynamic') {
                this.updateBody(body, dt);
            }
        });
    }

    updateBody(body, dt) {
        const collider = body.gameObject.getComponent(BoxCollider);
        if (!collider) return;
        
        if (!body.physicsPosition) body.physicsPosition = body.transform.position.clone();

        // Трение (немного уменьшил, чтобы не прилипал)
        body.velocity.x *= 0.92;
        body.velocity.z *= 0.92;
        body.velocity.addScaledVector(this.gravity, dt);

        const pos = body.physicsPosition;
        const boxSize = collider.size;
        const epsilon = 0.001;

        // --- Y Axis ---
        body.isGrounded = false;
        pos.y += body.velocity.y * dt;
        
        let box = new THREE.Box3().setFromCenterAndSize(pos, boxSize);
        let collisions = this.getCollidingBlocks(box);

        for (const block of collisions) {
            const pen = this.getPenetrationY(box, block);
            if (Math.abs(pen) > epsilon) {
                pos.y += pen;
                box.translate(new THREE.Vector3(0, pen, 0));
                
                if (pen > 0 && body.velocity.y <= 0) {
                    body.isGrounded = true;
                    body.velocity.y = 0;
                } else if (pen < 0 && body.velocity.y > 0) {
                    body.velocity.y = 0;
                }
            }
        }

        // Уменьшаем размер бокса по Y чуть-чуть для проверки стен,
        // чтобы не цепляться за пол ногами и за потолок головой
        const wallCheckSize = boxSize.clone();
        wallCheckSize.y -= 0.05; 

        // --- X Axis ---
        const potentialX = pos.x + body.velocity.x * dt;
        // Создаем бокс для проверки X, но чуть приподнятый снизу
        box = new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(potentialX, pos.y, pos.z), wallCheckSize);
        collisions = this.getCollidingBlocks(box);

        let hitX = false;
        for (const block of collisions) {
            const pen = this.getPenetrationX(box, block);
            if (Math.abs(pen) > epsilon) {
                // Если мы просто идем в стену -> останавливаемся
                hitX = true;
                body.velocity.x = 0;
                // Выталкиваем ровно до границы блока
                pos.x = potentialX + pen;
                break; 
            }
        }
        if (!hitX) pos.x = potentialX;

        // --- Z Axis ---
        const potentialZ = pos.z + body.velocity.z * dt;
        box = new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(pos.x, pos.y, potentialZ), wallCheckSize);
        collisions = this.getCollidingBlocks(box);

        let hitZ = false;
        for (const block of collisions) {
            const pen = this.getPenetrationZ(box, block);
            if (Math.abs(pen) > epsilon) {
                hitZ = true;
                body.velocity.z = 0;
                pos.z = potentialZ + pen;
                break;
            }
        }
        if (!hitZ) pos.z = potentialZ;
    }

    getCollidingBlocks(playerBox) {
        const boxes = [];
        // Добавляем небольшой отступ (skin width), чтобы ловить блоки чуть раньше
        const minX = Math.floor(playerBox.min.x + 0.01);
        const maxX = Math.ceil(playerBox.max.x - 0.01);
        const minY = Math.floor(playerBox.min.y + 0.01);
        const maxY = Math.ceil(playerBox.max.y - 0.01);
        const minZ = Math.floor(playerBox.min.z + 0.01);
        const maxZ = Math.ceil(playerBox.max.z - 0.01);

        for (let y = minY; y < maxY; y++) {
            for (let z = minZ; z < maxZ; z++) {
                for (let x = minX; x < maxX; x++) {
                    const id = this.world.getVoxel(x, y, z);
                    const props = BLOCK.get(id);
                    if (props.isSolid) {
                        boxes.push(new THREE.Box3(
                            new THREE.Vector3(x, y, z),
                            new THREE.Vector3(x + 1, y + 1, z + 1)
                        ));
                    }
                }
            }
        }
        return boxes;
    }

    getPenetrationY(a, b) {
        const o = Math.min(a.max.y, b.max.y) - Math.max(a.min.y, b.min.y);
        if (o <= 0) return 0;
        return (a.min.y + a.max.y) / 2 < (b.min.y + b.max.y) / 2 ? -o : o;
    }
    getPenetrationX(a, b) {
        const o = Math.min(a.max.x, b.max.x) - Math.max(a.min.x, b.min.x);
        if (o <= 0) return 0;
        return (a.min.x + a.max.x) / 2 < (b.min.x + b.max.x) / 2 ? -o : o;
    }
    getPenetrationZ(a, b) {
        const o = Math.min(a.max.z, b.max.z) - Math.max(a.min.z, b.min.z);
        if (o <= 0) return 0;
        return (a.min.z + a.max.z) / 2 < (b.min.z + b.max.z) / 2 ? -o : o;
    }
}