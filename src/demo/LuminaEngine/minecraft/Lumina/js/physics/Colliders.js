// Lumina/js/physics/Colliders.js

import { Component } from '../core/Component.js';
import * as THREE from 'three';

// Базовый класс для всех коллайдеров
export class Collider extends Component {
    constructor(gameObject) {
        super(gameObject);
        this.type = 'collider';
    }
}

export class BoxCollider extends Collider {
    constructor(gameObject, size) {
        super(gameObject);
        this.type = 'box';
        this.size = size || new THREE.Vector3(1, 1, 1);
        this.halfSize = this.size.clone().multiplyScalar(0.5);
    }
}

// --- НОВЫЙ КОЛЛАЙДЕР ДЛЯ ЛАНДШАФТА ---
export class HeightfieldCollider extends Collider {
    constructor(gameObject, geometry, segmentsX, segmentsZ) {
        super(gameObject);
        this.type = 'heightfield';
        this.geometry = geometry;
        this.segmentsX = segmentsX;
        this.segmentsZ = segmentsZ;
        this.heights = this.createHeightGrid();
        this.width = geometry.parameters.width;
        this.depth = geometry.parameters.height;
    }

    createHeightGrid() {
        const positions = this.geometry.attributes.position.array;
        const grid = [];
        for (let i = 0; i <= this.segmentsZ; i++) {
            const row = [];
            for (let j = 0; j <= this.segmentsX; j++) {
                const height = positions[(i * (this.segmentsX + 1) + j) * 3 + 2];
                row.push(height);
            }
            grid.push(row);
        }
        return grid;
    }

    getHeightAt(worldX, worldZ) {
        const u = (worldX + this.width / 2) / this.width;
        const v = ((worldZ + this.depth / 2) / this.depth);

        if (u < 0 || u > 1 || v < 0 || v > 1) {
            return -Infinity;
        }

        const gridX = u * this.segmentsX;
        const gridZ = v * this.segmentsZ;

        const x1 = Math.floor(gridX);
        const z1 = Math.floor(gridZ);

        if (x1 < 0 || x1 >= this.segmentsX || z1 < 0 || z1 >= this.segmentsZ) {
            return -Infinity;
        }

        const x2 = Math.min(x1 + 1, this.segmentsX);
        const z2 = Math.min(z1 + 1, this.segmentsZ);

        const fracX = gridX - x1;
        const fracZ = gridZ - z1;

        const h11 = this.heights[z1][x1];
        const h21 = this.heights[z1][x2];
        const h12 = this.heights[z2][x1];
        const h22 = this.heights[z2][x2];

        const ix1 = h11 * (1 - fracX) + h21 * fracX;
        const ix2 = h12 * (1 - fracX) + h22 * fracX;
        const interpolatedHeight = ix1 * (1 - fracZ) + ix2 * fracZ;

        return interpolatedHeight + this.gameObject.transform.position.y;
    }
}

export class MeshCollider extends Collider {
    constructor(gameObject, geometry) {
        super(gameObject);
        this.type = 'mesh';
        this.geometry = geometry;
        console.warn('MeshCollider is not implemented yet. It will not have any physics.');
    }
}