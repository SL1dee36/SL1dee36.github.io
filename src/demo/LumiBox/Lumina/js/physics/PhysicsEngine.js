// Lumina/js/physics/PhysicsEngine.js
// author: Nazaryan A.K.
// github: @Sl1dee36

import { BoxCollider } from './Colliders.js';
import * as THREE from 'three';

export class PhysicsEngine {
    constructor() {
        this.rigidBodies = [];
        this.gravity = new THREE.Vector3(0, -22, 0);
        this.world = null;
    }

    setWorld(world) { this.world = world; }

    addRigidBody(body) {
        this.rigidBodies.push(body);
        body.physicsPosition = body.transform.position.clone();
        body.prevPhysicsPosition = body.transform.position.clone();
    }

    // Сохранение позиций перед шагом физики для плавной интерполяции
    savePreviousPositions() {
        for (let i = 0; i < this.rigidBodies.length; i++) {
            const body = this.rigidBodies[i];
            if (!body.physicsPosition) {
                body.physicsPosition = body.transform.position.clone();
                body.prevPhysicsPosition = body.transform.position.clone();
            }
            body.prevPhysicsPosition.copy(body.physicsPosition);
        }
    }

    // Интерполяция координат между тиками для мониторов с высокой частотой (144Hz+)
    interpolatePositions(alpha) {
        for (let i = 0; i < this.rigidBodies.length; i++) {
            const body = this.rigidBodies[i];
            if (body.bodyType === 'dynamic' && body.physicsPosition && body.prevPhysicsPosition) {
                body.transform.position.lerpVectors(body.prevPhysicsPosition, body.physicsPosition, alpha);
            }
        }
    }

    stepPhysics(dt) {
        this.savePreviousPositions();
        for (let i = 0; i < this.rigidBodies.length; i++) {
            const body = this.rigidBodies[i];
            if (body.bodyType === 'dynamic') {
                this.updateBody(body, dt);
            }
        }
    }

    updateBody(body, dt) {
        const collider = body.gameObject.getComponent(BoxCollider);
        if (!collider) return;
        if (!body.physicsPosition) {
            body.physicsPosition = body.transform.position.clone();
            body.prevPhysicsPosition = body.transform.position.clone();
        }

        const pos = body.physicsPosition;

        const isHeadWater = this.world.isWater(Math.floor(pos.x), Math.floor(pos.y + 1.2), Math.floor(pos.z));
        const isLegsWater = this.world.isWater(Math.floor(pos.x), Math.floor(pos.y), Math.floor(pos.z));
        body.isInWater = (isHeadWater || isLegsWater);

        if (body.isInWater) {
            body.velocity.y *= 0.9;
            body.velocity.addScaledVector(this.gravity, dt * 0.25);
        } else {
            body.velocity.addScaledVector(this.gravity, dt);
        }

        const boxSize = collider.size;
        const epsilon = 0.001;

        // Ось Y
        body.isGrounded = false;
        pos.y += body.velocity.y * dt;

        let box = new THREE.Box3().setFromCenterAndSize(pos, boxSize);
        let collisions = this.getCollidingBlocks(box);
        for (let i = 0; i < collisions.length; i++) {
            const block = collisions[i];
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

        const wallCheckSize = boxSize.clone();
        wallCheckSize.y -= 0.1;

        // Ось X
        const potentialX = pos.x + body.velocity.x * dt;
        box = new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(potentialX, pos.y, pos.z), wallCheckSize);
        collisions = this.getCollidingBlocks(box);
        let hitX = false;
        for (let i = 0; i < collisions.length; i++) {
            const pen = this.getPenetrationX(box, collisions[i]);
            if (Math.abs(pen) > epsilon) {
                hitX = true;
                body.velocity.x = 0;
                pos.x = potentialX + pen;
                break;
            }
        }
        if (!hitX) pos.x = potentialX;

        // Ось Z
        const potentialZ = pos.z + body.velocity.z * dt;
        box = new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(pos.x, pos.y, potentialZ), wallCheckSize);
        collisions = this.getCollidingBlocks(box);
        let hitZ = false;
        for (let i = 0; i < collisions.length; i++) {
            const pen = this.getPenetrationZ(box, collisions[i]);
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
        const minX = Math.floor(playerBox.min.x + 0.01), maxX = Math.ceil(playerBox.max.x - 0.01);
        const minY = Math.floor(playerBox.min.y + 0.01), maxY = Math.ceil(playerBox.max.y - 0.01);
        const minZ = Math.floor(playerBox.min.z + 0.01), maxZ = Math.ceil(playerBox.max.z - 0.01);
        for (let y = minY; y < maxY; y++) {
            for (let z = minZ; z < maxZ; z++) {
                for (let x = minX; x < maxX; x++) {
                    if (this.world.isSolid(x, y, z)) {
                        boxes.push(new THREE.Box3(new THREE.Vector3(x, y, z), new THREE.Vector3(x + 1, y + 1, z + 1)));
                    }
                }
            }
        }
        return boxes;
    }

    getPenetrationY(a, b) {
        const o = Math.min(a.max.y, b.max.y) - Math.max(a.min.y, b.min.y);
        return o <= 0 ? 0 : ((a.min.y + a.max.y) / 2 < (b.min.y + b.max.y) / 2 ? -o : o);
    }

    getPenetrationX(a, b) {
        const o = Math.min(a.max.x, b.max.x) - Math.max(a.min.x, b.min.x);
        return o <= 0 ? 0 : ((a.min.x + a.max.x) / 2 < (b.min.x + b.max.x) / 2 ? -o : o);
    }

    getPenetrationZ(a, b) {
        const o = Math.min(a.max.z, b.max.z) - Math.max(a.min.z, b.min.z);
        return o <= 0 ? 0 : ((a.min.z + a.max.z) / 2 < (b.min.z + b.max.z) / 2 ? -o : o);
    }
}