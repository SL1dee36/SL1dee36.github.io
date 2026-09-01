// game/ModuleManager.js
// author: Nazaryan A.K.
// github: @Sl1dee36

import { BLOCK } from './blocks.js';
import { RECIPES } from './Recipes.js';

export class ModuleManager {
    constructor(textureAtlas, textureGenerator) {
        this.atlas = textureAtlas;
        this.texGen = textureGenerator;
        this.loadedModules = new Map();
    }

    async loadModules(moduleNames = ['source']) {
        for (const name of moduleNames) {
            await this.loadModuleFromPath(`game/src/${name}.lumibench`);
        }
    }

    async loadModuleFromPath(path) {
        try {
            const res = await fetch(path);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            await this.registerModule(data);
        } catch (err) {
            console.error(`Failed to load module from ${path}:`, err);
        }
    }

    async registerModule(moduleData) {
        const modId = moduleData.id || 'source';

        // 1. Загрузка изображения атласа
        const atlasPath = `game/src/${moduleData.atlas || `${modId}-atlas.png`}`;
        const atlasImg = await this.loadImage(atlasPath);

        // 2. Применение координат тайлов
        if (moduleData.textures) {
            this.atlas.applyAtlasImage(atlasImg, moduleData.textures);
        }

        // 3. Регистрация блоков
        if (Array.isArray(moduleData.blocks)) {
            moduleData.blocks.forEach(b => {
                BLOCK[b.name.toUpperCase()] = b.id;
                BLOCK.properties[b.id] = { ...b };
            });
        }

        // 4. Регистрация предметов
        if (Array.isArray(moduleData.items)) {
            moduleData.items.forEach(it => {
                BLOCK[it.name.toUpperCase()] = it.id;
                BLOCK.properties[it.id] = { ...it };
            });
        }

        // 5. Регистрация рецептов
        if (moduleData.recipes) {
            if (Array.isArray(moduleData.recipes.crafting)) {
                RECIPES.crafting.push(...moduleData.recipes.crafting);
            }
            if (moduleData.recipes.smelting) {
                Object.assign(RECIPES.smelting, moduleData.recipes.smelting);
            }
            if (moduleData.recipes.fuels) {
                Object.assign(RECIPES.fuels, moduleData.recipes.fuels);
            }
        }

        this.loadedModules.set(modId, moduleData);
        this.atlas.buildTexture();
    }

    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = (e) => reject(new Error(`Failed to load atlas image: ${src}`));
            img.src = src;
        });
    }
}