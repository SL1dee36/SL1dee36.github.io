// game/TextureGenerator.js
// author: Nazaryan A.K.
// github: @Sl1dee36

import * as THREE from 'three';

const GLOBAL_TILE_MAP = {};
let GLOBAL_ATLAS_CANVAS = null;

export class TextureAtlas {
    constructor(tileSize = 16, atlasSize = 256) {
        this.tileSize = tileSize;
        this.atlasSize = atlasSize;
        this.tilesPerRow = Math.floor(this.atlasSize / this.tileSize);
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.atlasSize;
        this.canvas.height = this.atlasSize;
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;
        this.uvMap = {};
        this.texture = null;
        GLOBAL_ATLAS_CANVAS = this.canvas;
    }

    normalizeKey(key) {
        return (key || '').replace(/^gen:/, '').replace(/^source:/, '');
    }

    applyAtlasImage(img, coordMap) {
        this.ctx.clearRect(0, 0, this.atlasSize, this.atlasSize);
        this.ctx.drawImage(img, 0, 0, this.atlasSize, this.atlasSize);

        const uStep = this.tileSize / this.atlasSize;
        const vStep = this.tileSize / this.atlasSize;

        for (const name in coordMap) {
            const [tx, ty] = coordMap[name];
            const clean = this.normalizeKey(name);

            const u0 = tx * uStep;
            const u1 = u0 + uStep;
            const v1 = 1 - (ty * vStep);
            const v0 = v1 - vStep;

            const uvInfo = { u0, v0, u1, v1, tx, ty };
            this.uvMap[clean] = uvInfo;
            this.uvMap[name] = uvInfo;
            this.uvMap[`source:${clean}`] = uvInfo;
            this.uvMap[`gen:${clean}`] = uvInfo;
            GLOBAL_TILE_MAP[clean] = [tx, ty];
            GLOBAL_TILE_MAP[name] = [tx, ty];
        }

        if (this.texture) {
            this.texture.needsUpdate = true;
        }
        return this.buildTexture();
    }

    registerTexture(name, sourceCanvas) {
        const clean = this.normalizeKey(name);
        if (this.uvMap[clean]) return this.uvMap[clean];

        const index = Object.keys(this.uvMap).length;
        const tileX = index % this.tilesPerRow;
        const tileY = Math.floor(index / this.tilesPerRow);

        const px = tileX * this.tileSize;
        const py = tileY * this.tileSize;

        this.ctx.drawImage(sourceCanvas, px, py, this.tileSize, this.tileSize);

        const uStep = this.tileSize / this.atlasSize;
        const vStep = this.tileSize / this.atlasSize;

        const u0 = tileX * uStep;
        const u1 = u0 + uStep;
        const v1 = 1 - (tileY * vStep);
        const v0 = v1 - vStep;

        const info = { u0, v0, u1, v1, tileX, tileY };
        this.uvMap[clean] = info;
        this.uvMap[name] = info;
        this.uvMap[`source:${clean}`] = info;
        this.uvMap[`gen:${clean}`] = info;
        GLOBAL_TILE_MAP[clean] = [tileX, tileY];
        GLOBAL_TILE_MAP[name] = [tileX, tileY];

        if (this.texture) this.texture.needsUpdate = true;
        return info;
    }

    buildTexture() {
        if (!this.texture) {
            this.texture = new THREE.CanvasTexture(this.canvas);
            this.texture.magFilter = THREE.NearestFilter;
            this.texture.minFilter = THREE.NearestFilter;
            this.texture.generateMipmaps = false;
            this.texture.colorSpace = THREE.SRGBColorSpace;
        }
        this.texture.needsUpdate = true;
        return this.texture;
    }

    getUV(name) {
        const clean = this.normalizeKey(name);
        return this.uvMap[clean] || this.uvMap['stone'] || { u0: 0, v0: 0, u1: 1, v1: 1 };
    }
}

export class TextureGenerator {
    constructor() {
        this.size = 16;
        this.canvasCache = {};
    }

    normalizeKey(key) {
        return (key || '').replace(/^gen:/, '').replace(/^source:/, '');
    }

    getCanvas(type) {
        if (!type) return this.createMissingTexture();
        const clean = this.normalizeKey(String(type));

        if (this.canvasCache[clean]) return this.canvasCache[clean];

        const canvas = document.createElement('canvas');
        canvas.width = this.size;
        canvas.height = this.size;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        const coords = GLOBAL_TILE_MAP[clean];
        if (GLOBAL_ATLAS_CANVAS && coords) {
            const [tx, ty] = coords;
            ctx.drawImage(GLOBAL_ATLAS_CANVAS, tx * this.size, ty * this.size, this.size, this.size, 0, 0, this.size, this.size);
        } else {
            return this.createMissingTexture();
        }

        this.canvasCache[clean] = canvas;
        return canvas;
    }

    generate(type) {
        const canvas = this.getCanvas(type);
        const texture = new THREE.CanvasTexture(canvas);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        texture.generateMipmaps = false;
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
    }

    createMissingTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = this.size;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ff00ff';
        ctx.fillRect(0, 0, 16, 16);
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, 8, 8);
        ctx.fillRect(8, 8, 8, 8);
        return canvas;
    }
}