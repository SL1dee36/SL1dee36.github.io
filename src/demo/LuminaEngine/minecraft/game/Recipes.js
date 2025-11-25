import { BLOCK } from './blocks.js';

export const RECIPES = {
    crafting: [
        { result: { id: BLOCK.PLANKS, count: 4 }, pattern: [[BLOCK.OAK_LOG]] },
        
        { result: { id: BLOCK.STICK, count: 4 }, pattern: [[BLOCK.PLANKS], [BLOCK.PLANKS]] },
        
        { result: { id: BLOCK.CRAFTING_TABLE, count: 1 }, pattern: [
            [BLOCK.PLANKS, BLOCK.PLANKS],
            [BLOCK.PLANKS, BLOCK.PLANKS]
        ]},
        
        { result: { id: BLOCK.SANDSTONE, count: 1 }, pattern: [
            [BLOCK.SAND, BLOCK.SAND],
            [BLOCK.SAND, BLOCK.SAND]
        ]},

        { result: { id: BLOCK.FURNACE, count: 1 }, pattern: [
            [BLOCK.COBBLESTONE, BLOCK.COBBLESTONE, BLOCK.COBBLESTONE],
            [BLOCK.COBBLESTONE, BLOCK.AIR, BLOCK.COBBLESTONE],
            [BLOCK.COBBLESTONE, BLOCK.COBBLESTONE, BLOCK.COBBLESTONE]
        ]},

        { result: { id: BLOCK.WOODEN_PICKAXE, count: 1 }, pattern: [
            [BLOCK.PLANKS, BLOCK.PLANKS, BLOCK.PLANKS],
            [BLOCK.AIR, BLOCK.STICK, BLOCK.AIR],
            [BLOCK.AIR, BLOCK.STICK, BLOCK.AIR]
        ]},
        { result: { id: BLOCK.WOODEN_AXE, count: 1 }, pattern: [
            [BLOCK.PLANKS, BLOCK.PLANKS, BLOCK.AIR],
            [BLOCK.PLANKS, BLOCK.STICK, BLOCK.AIR],
            [BLOCK.AIR, BLOCK.STICK, BLOCK.AIR]
        ]},
        { result: { id: BLOCK.WOODEN_SHOVEL, count: 1 }, pattern: [
            [BLOCK.AIR, BLOCK.PLANKS, BLOCK.AIR],
            [BLOCK.AIR, BLOCK.STICK, BLOCK.AIR],
            [BLOCK.AIR, BLOCK.STICK, BLOCK.AIR]
        ]},

        { result: { id: BLOCK.STONE_PICKAXE, count: 1 }, pattern: [
            [BLOCK.COBBLESTONE, BLOCK.COBBLESTONE, BLOCK.COBBLESTONE],
            [BLOCK.AIR, BLOCK.STICK, BLOCK.AIR],
            [BLOCK.AIR, BLOCK.STICK, BLOCK.AIR]
        ]},
        { result: { id: BLOCK.STONE_AXE, count: 1 }, pattern: [
            [BLOCK.COBBLESTONE, BLOCK.COBBLESTONE, BLOCK.AIR],
            [BLOCK.COBBLESTONE, BLOCK.STICK, BLOCK.AIR],
            [BLOCK.AIR, BLOCK.STICK, BLOCK.AIR]
        ]},
        { result: { id: BLOCK.STONE_SHOVEL, count: 1 }, pattern: [
            [BLOCK.AIR, BLOCK.COBBLESTONE, BLOCK.AIR],
            [BLOCK.AIR, BLOCK.STICK, BLOCK.AIR],
            [BLOCK.AIR, BLOCK.STICK, BLOCK.AIR]
        ]},

        { result: { id: BLOCK.IRON_PICKAXE, count: 1 }, pattern: [
            [BLOCK.IRON_INGOT, BLOCK.IRON_INGOT, BLOCK.IRON_INGOT],
            [BLOCK.AIR, BLOCK.STICK, BLOCK.AIR],
            [BLOCK.AIR, BLOCK.STICK, BLOCK.AIR]
        ]},
        { result: { id: BLOCK.IRON_AXE, count: 1 }, pattern: [
            [BLOCK.IRON_INGOT, BLOCK.IRON_INGOT, BLOCK.AIR],
            [BLOCK.IRON_INGOT, BLOCK.STICK, BLOCK.AIR],
            [BLOCK.AIR, BLOCK.STICK, BLOCK.AIR]
        ]},
        { result: { id: BLOCK.IRON_SHOVEL, count: 1 }, pattern: [
            [BLOCK.AIR, BLOCK.IRON_INGOT, BLOCK.AIR],
            [BLOCK.AIR, BLOCK.STICK, BLOCK.AIR],
            [BLOCK.AIR, BLOCK.STICK, BLOCK.AIR]
        ]}
    ],

    smelting: {
        [BLOCK.SAND]: BLOCK.GLASS,
        [BLOCK.COBBLESTONE]: BLOCK.STONE,
        [BLOCK.OAK_LOG]: BLOCK.COAL, 
        [BLOCK.IRON_ORE]: BLOCK.IRON_INGOT,
    },

    fuels: {
        [BLOCK.OAK_LOG]: 300, 
        [BLOCK.PLANKS]: 300,
        [BLOCK.STICK]: 100,
        [BLOCK.COAL]: 1600,
        [BLOCK.WOODEN_PICKAXE]: 200,
        [BLOCK.WOODEN_AXE]: 200,
        [BLOCK.WOODEN_SHOVEL]: 200,
        [BLOCK.CRAFTING_TABLE]: 300
    },

    findCraftingRecipe(grid, width) {
        let minX = width, minY = width, maxX = 0, maxY = 0;
        let hasItems = false;
        
        for(let i=0; i<grid.length; i++) {
            if(grid[i]) {
                const x = i % width;
                const y = Math.floor(i / width);
                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
                hasItems = true;
            }
        }

        if(!hasItems) return null;

        const pW = maxX - minX + 1;
        const pH = maxY - minY + 1;

        for (const recipe of this.crafting) {
            const rH = recipe.pattern.length;
            const rW = recipe.pattern[0].length;

            if (pW !== rW || pH !== rH) continue;

            let match = true;
            for(let y=0; y<pH; y++) {
                for(let x=0; x<pW; x++) {
                    const slotId = grid[(minY + y) * width + (minX + x)]?.id || BLOCK.AIR;
                    const reqId = recipe.pattern[y][x];
                    if (slotId !== reqId) {
                        match = false;
                        break;
                    }
                }
                if(!match) break;
            }

            if (match) return recipe.result;
        }
        return null;
    }
};