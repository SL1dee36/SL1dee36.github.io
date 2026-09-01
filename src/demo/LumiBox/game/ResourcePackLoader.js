// game/ResourcePackLoader.js
// author: Nazaryan A.K.
// github: @Sl1dee36

export class ResourcePackLoader {
    constructor(textureGenerator, world, uiManager) {
        this.texGen = textureGenerator;
        this.world = world;
        this.uiManager = uiManager;

        // Таблица соответствия внутренних ключей и путей текстур в ресурс-паках MC
        this.textureMapping = {
            'stone': ['block/stone.png', 'blocks/stone.png'],
            'dirt': ['block/dirt.png', 'blocks/dirt.png'],
            'grass_top': ['block/grass_block_top.png', 'block/grass_top.png', 'blocks/grass_top.png'],
            'grass_side': ['block/grass_block_side.png', 'block/grass_side.png', 'blocks/grass_side.png'],
            'cobblestone': ['block/cobblestone.png', 'blocks/cobblestone.png'],
            'planks': ['block/oak_planks.png', 'block/planks_oak.png', 'blocks/planks_oak.png'],
            'log_side': ['block/oak_log.png', 'block/log_oak.png', 'blocks/log_oak.png'],
            'log_top': ['block/oak_log_top.png', 'block/log_oak_top.png', 'blocks/log_oak_top.png'],
            'bedrock': ['block/bedrock.png', 'blocks/bedrock.png'],
            'sand': ['block/sand.png', 'blocks/sand.png'],
            'gravel': ['block/gravel.png', 'blocks/gravel.png'],
            'leaves': ['block/oak_leaves.png', 'block/leaves_oak.png', 'blocks/leaves_oak.png'],
            'glass': ['block/glass.png', 'blocks/glass.png'],
            'water': ['block/water_still.png', 'blocks/water_still.png', 'block/water.png'],
            'coal_ore': ['block/coal_ore.png', 'blocks/coal_ore.png'],
            'iron_ore': ['block/iron_ore.png', 'blocks/iron_ore.png'],
            'sandstone_side': ['block/sandstone.png', 'blocks/sandstone_normal.png', 'blocks/sandstone.png'],
            'sandstone_top': ['block/sandstone_top.png', 'blocks/sandstone_top.png'],
            'sandstone_bottom': ['block/sandstone_bottom.png', 'blocks/sandstone_bottom.png'],
            'crafting_table_top': ['block/crafting_table_top.png', 'blocks/crafting_table_top.png'],
            'crafting_table_side': ['block/crafting_table_side.png', 'blocks/crafting_table_side.png'],
            'crafting_table_front': ['block/crafting_table_front.png', 'blocks/crafting_table_front.png'],
            'furnace_front': ['block/furnace_front.png', 'block/furnace_front_off.png', 'blocks/furnace_front_off.png'],
            'furnace_side': ['block/furnace_side.png', 'blocks/furnace_side.png'],
            'furnace_top': ['block/furnace_top.png', 'blocks/furnace_top.png'],
            'tall_grass': ['block/short_grass.png', 'block/grass.png', 'blocks/tallgrass.png'],
            'double_grass_bottom': ['block/tall_grass_bottom.png', 'blocks/double_plant_grass_bottom.png'],
            'double_grass_top': ['block/tall_grass_top.png', 'blocks/double_plant_grass_top.png'],
            'item_stick': ['item/stick.png', 'items/stick.png'],
            'item_coal': ['item/coal.png', 'items/coal.png'],
            'item_iron_ingot': ['item/iron_ingot.png', 'items/iron_ingot.png'],
            'tool_wood_pick': ['item/wooden_pickaxe.png', 'items/wood_pickaxe.png'],
            'tool_wood_axe': ['item/wooden_axe.png', 'items/wood_axe.png'],
            'tool_wood_shovel': ['item/wooden_shovel.png', 'items/wood_shovel.png'],
            'tool_stone_pick': ['item/stone_pickaxe.png', 'items/stone_pickaxe.png'],
            'tool_stone_axe': ['item/stone_axe.png', 'items/stone_axe.png'],
            'tool_stone_shovel': ['item/stone_shovel.png', 'items/stone_shovel.png'],
            'tool_iron_pick': ['item/iron_pickaxe.png', 'items/iron_pickaxe.png'],
            'tool_iron_axe': ['item/iron_axe.png', 'items/iron_axe.png'],
            'tool_iron_shovel': ['item/iron_shovel.png', 'items/iron_shovel.png']
        };
    }

    async loadZip(fileOrBlob) {
        if (!window.JSZip) {
            console.error('JSZip library is not loaded!');
            return false;
        }

        const zip = new JSZip();
        const content = await zip.loadAsync(fileOrBlob);
        const loadedOverrides = {};
        const prefixOptions = [
            'assets/minecraft/textures/',
            'minecraft/textures/',
            'textures/'
        ];

        for (const [internalKey, candidates] of Object.entries(this.textureMapping)) {
            let matchedFile = null;

            for (const prefix of prefixOptions) {
                for (const candidate of candidates) {
                    const fullPath = prefix + candidate;
                    const entry = content.file(new RegExp('^' + fullPath + '$', 'i'))[0];
                    if (entry) {
                        matchedFile = entry;
                        break;
                    }
                }
                if (matchedFile) break;
            }

            if (matchedFile) {
                const blob = await matchedFile.async('blob');
                const img = await this.blobToImage(blob);
                loadedOverrides[internalKey] = this.imageToCanvas(img);
            }
        }

        // Применяем текстуры к генератору и обновляем атлас
        this.texGen.applyTextureOverrides(loadedOverrides);
        if (this.world) this.world.reloadMaterials();
        if (this.uiManager) {
            this.uiManager.iconCache = {};
            this.uiManager.updateAll();
        }

        return true;
    }

    blobToImage(blob) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = URL.createObjectURL(blob);
        });
    }

    imageToCanvas(img) {
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        // Берем первый кадр 16x16 (на случай анимированных текстур mc .mcmeta)
        ctx.drawImage(img, 0, 0, 16, 16, 0, 0, 16, 16);
        return canvas;
    }
}