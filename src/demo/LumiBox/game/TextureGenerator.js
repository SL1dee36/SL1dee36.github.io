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
        this.nextFreeTileIndex = 96; // rows 0..5 (96 tiles) reserved for source-atlas
        this.registeredCanvases = new Map();
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
        const eps = 0.0001; // Защита от швов и зазоров между блоками при сэмплировании

        for (const name in coordMap) {
            const [tx, ty] = coordMap[name];
            const clean = this.normalizeKey(name);

            const u0 = tx * uStep + eps;
            const u1 = (tx + 1) * uStep - eps;
            const v1 = 1 - (ty * vStep) - eps;
            const v0 = 1 - ((ty + 1) * vStep) + eps;

            const uvInfo = { u0, v0, u1, v1, tileX: tx, tileY: ty };
            this.uvMap[clean] = uvInfo;
            this.uvMap[name] = uvInfo;
            this.uvMap[`source:${clean}`] = uvInfo;
            this.uvMap[`gen:${clean}`] = uvInfo;
            GLOBAL_TILE_MAP[clean] = [tx, ty];
            GLOBAL_TILE_MAP[name] = [tx, ty];
        }

        // Всегда восстанавливаем все зарегистрированные процедурные текстуры
        for (const [clean, sourceCanvas] of this.registeredCanvases.entries()) {
            const info = this.uvMap[clean];
            if (info) {
                const px = info.tileX * this.tileSize;
                const py = info.tileY * this.tileSize;
                this.ctx.clearRect(px, py, this.tileSize, this.tileSize);
                this.ctx.drawImage(sourceCanvas, px, py, this.tileSize, this.tileSize);
            }
        }

        if (this.texture) {
            this.texture.needsUpdate = true;
        }
        return this.buildTexture();
    }

    registerTexture(name, sourceCanvas) {
        const clean = this.normalizeKey(name);
        this.registeredCanvases.set(clean, sourceCanvas);

        let info = this.uvMap[clean];
        let tileX, tileY;

        if (info && info.tileX !== undefined) {
            tileX = info.tileX;
            tileY = info.tileY;
        } else {
            const tileIndex = this.nextFreeTileIndex++;
            tileX = tileIndex % this.tilesPerRow;
            tileY = Math.floor(tileIndex / this.tilesPerRow);

            const uStep = this.tileSize / this.atlasSize;
            const vStep = this.tileSize / this.atlasSize;
            const eps = 0.0001;

            const u0 = tileX * uStep + eps;
            const u1 = (tileX + 1) * uStep - eps;
            const v1 = 1 - (tileY * vStep) - eps;
            const v0 = 1 - ((tileY + 1) * vStep) + eps;

            info = { u0, v0, u1, v1, tileX, tileY };
            this.uvMap[clean] = info;
            this.uvMap[name] = info;
            this.uvMap[`source:${clean}`] = info;
            this.uvMap[`gen:${clean}`] = info;
            GLOBAL_TILE_MAP[clean] = [tileX, tileY];
            GLOBAL_TILE_MAP[name] = [tileX, tileY];
        }

        const px = tileX * this.tileSize;
        const py = tileY * this.tileSize;
        this.ctx.clearRect(px, py, this.tileSize, this.tileSize);
        this.ctx.drawImage(sourceCanvas, px, py, this.tileSize, this.tileSize);

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

        const coords = GLOBAL_TILE_MAP[clean];
        if (GLOBAL_ATLAS_CANVAS && coords) {
            const canvas = document.createElement('canvas');
            canvas.width = this.size;
            canvas.height = this.size;
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = false;

            const [tx, ty] = coords;
            ctx.drawImage(GLOBAL_ATLAS_CANVAS, tx * this.size, ty * this.size, this.size, this.size, 0, 0, this.size, this.size);
            this.canvasCache[clean] = canvas;
            return canvas;
        }

        const proc = this.canvasCache[clean];
        if (proc) return proc;

        return this.createMissingTexture();
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

export function registerAllProceduralTextures(atlas, texGen) {
    // Все текстуры перенесены в канонический атлас source-atlas.png и манифест source.lumibench
}