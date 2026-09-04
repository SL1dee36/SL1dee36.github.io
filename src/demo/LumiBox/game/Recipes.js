// author: Nazaryan A.K. 
// github: @Sl1dee36

import { BLOCK } from './blocks.js';

export const RECIPES = {
    crafting: [
        // Доски из бревен
        { result: { id: BLOCK.PLANKS, count: 4 }, pattern: [[BLOCK.OAK_LOG]] },
        { result: { id: BLOCK.BIRCH_PLANKS, count: 4 }, pattern: [[BLOCK.BIRCH_LOG]] },
        { result: { id: BLOCK.ACACIA_PLANKS, count: 4 }, pattern: [[BLOCK.ACACIA_LOG]] },
        { result: { id: BLOCK.DARK_OAK_PLANKS, count: 4 }, pattern: [[BLOCK.DARK_OAK_LOG]] },
        
        // Палки
        { result: { id: BLOCK.STICK, count: 4 }, pattern: [[BLOCK.PLANKS], [BLOCK.PLANKS]] },
        { result: { id: BLOCK.STICK, count: 4 }, pattern: [[BLOCK.BIRCH_PLANKS], [BLOCK.BIRCH_PLANKS]] },
        { result: { id: BLOCK.STICK, count: 4 }, pattern: [[BLOCK.ACACIA_PLANKS], [BLOCK.ACACIA_PLANKS]] },
        { result: { id: BLOCK.STICK, count: 4 }, pattern: [[BLOCK.DARK_OAK_PLANKS], [BLOCK.DARK_OAK_PLANKS]] },
        
        // Верстаки
        { result: { id: BLOCK.CRAFTING_TABLE, count: 1 }, pattern: [
            [BLOCK.PLANKS, BLOCK.PLANKS],
            [BLOCK.PLANKS, BLOCK.PLANKS]
        ]},
        { result: { id: BLOCK.CRAFTING_TABLE, count: 1 }, pattern: [
            [BLOCK.BIRCH_PLANKS, BLOCK.BIRCH_PLANKS],
            [BLOCK.BIRCH_PLANKS, BLOCK.BIRCH_PLANKS]
        ]},
        { result: { id: BLOCK.CRAFTING_TABLE, count: 1 }, pattern: [
            [BLOCK.ACACIA_PLANKS, BLOCK.ACACIA_PLANKS],
            [BLOCK.ACACIA_PLANKS, BLOCK.ACACIA_PLANKS]
        ]},
        { result: { id: BLOCK.CRAFTING_TABLE, count: 1 }, pattern: [
            [BLOCK.DARK_OAK_PLANKS, BLOCK.DARK_OAK_PLANKS],
            [BLOCK.DARK_OAK_PLANKS, BLOCK.DARK_OAK_PLANKS]
        ]},

        // Факелы (Уголь + Палка)
        { result: { id: BLOCK.TORCH, count: 4 }, pattern: [
            [BLOCK.COAL],
            [BLOCK.STICK]
        ]},

        // Ведро (3 железных слитка V-образно)
        { result: { id: BLOCK.BUCKET, count: 1 }, pattern: [
            [BLOCK.IRON_INGOT, BLOCK.AIR, BLOCK.IRON_INGOT],
            [BLOCK.AIR, BLOCK.IRON_INGOT, BLOCK.AIR]
        ]},

        // Двери (6 досок / слитков: 2 колонки по 3)
        { result: { id: BLOCK.OAK_DOOR_ITEM, count: 3 }, pattern: [
            [BLOCK.PLANKS, BLOCK.PLANKS],
            [BLOCK.PLANKS, BLOCK.PLANKS],
            [BLOCK.PLANKS, BLOCK.PLANKS]
        ]},
        { result: { id: BLOCK.BIRCH_DOOR_ITEM, count: 3 }, pattern: [
            [BLOCK.BIRCH_PLANKS, BLOCK.BIRCH_PLANKS],
            [BLOCK.BIRCH_PLANKS, BLOCK.BIRCH_PLANKS],
            [BLOCK.BIRCH_PLANKS, BLOCK.BIRCH_PLANKS]
        ]},
        { result: { id: BLOCK.DARK_OAK_DOOR_ITEM, count: 3 }, pattern: [
            [BLOCK.DARK_OAK_PLANKS, BLOCK.DARK_OAK_PLANKS],
            [BLOCK.DARK_OAK_PLANKS, BLOCK.DARK_OAK_PLANKS],
            [BLOCK.DARK_OAK_PLANKS, BLOCK.DARK_OAK_PLANKS]
        ]},
        { result: { id: BLOCK.IRON_DOOR_ITEM, count: 3 }, pattern: [
            [BLOCK.IRON_INGOT, BLOCK.IRON_INGOT],
            [BLOCK.IRON_INGOT, BLOCK.IRON_INGOT],
            [BLOCK.IRON_INGOT, BLOCK.IRON_INGOT]
        ]},

        // Люки (6 досок: 3 колонки по 2)
        { result: { id: BLOCK.OAK_TRAPDOOR, count: 2 }, pattern: [
            [BLOCK.PLANKS, BLOCK.PLANKS, BLOCK.PLANKS],
            [BLOCK.PLANKS, BLOCK.PLANKS, BLOCK.PLANKS]
        ]},
        { result: { id: BLOCK.BIRCH_TRAPDOOR, count: 2 }, pattern: [
            [BLOCK.BIRCH_PLANKS, BLOCK.BIRCH_PLANKS, BLOCK.BIRCH_PLANKS],
            [BLOCK.BIRCH_PLANKS, BLOCK.BIRCH_PLANKS, BLOCK.BIRCH_PLANKS]
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

        // Деревянные инструменты (Дуб, Берёза, Акация, Тёмный дуб)
        { result: { id: BLOCK.WOODEN_PICKAXE, count: 1 }, pattern: [
            [BLOCK.PLANKS, BLOCK.PLANKS, BLOCK.PLANKS],
            [BLOCK.AIR, BLOCK.STICK, BLOCK.AIR],
            [BLOCK.AIR, BLOCK.STICK, BLOCK.AIR]
        ]},
        { result: { id: BLOCK.WOODEN_PICKAXE, count: 1 }, pattern: [
            [BLOCK.BIRCH_PLANKS, BLOCK.BIRCH_PLANKS, BLOCK.BIRCH_PLANKS],
            [BLOCK.AIR, BLOCK.STICK, BLOCK.AIR],
            [BLOCK.AIR, BLOCK.STICK, BLOCK.AIR]
        ]},
        { result: { id: BLOCK.WOODEN_PICKAXE, count: 1 }, pattern: [
            [BLOCK.ACACIA_PLANKS, BLOCK.ACACIA_PLANKS, BLOCK.ACACIA_PLANKS],
            [BLOCK.AIR, BLOCK.STICK, BLOCK.AIR],
            [BLOCK.AIR, BLOCK.STICK, BLOCK.AIR]
        ]},
        { result: { id: BLOCK.WOODEN_PICKAXE, count: 1 }, pattern: [
            [BLOCK.DARK_OAK_PLANKS, BLOCK.DARK_OAK_PLANKS, BLOCK.DARK_OAK_PLANKS],
            [BLOCK.AIR, BLOCK.STICK, BLOCK.AIR],
            [BLOCK.AIR, BLOCK.STICK, BLOCK.AIR]
        ]},

        { result: { id: BLOCK.WOODEN_AXE, count: 1 }, pattern: [
            [BLOCK.PLANKS, BLOCK.PLANKS, BLOCK.AIR],
            [BLOCK.PLANKS, BLOCK.STICK, BLOCK.AIR],
            [BLOCK.AIR, BLOCK.STICK, BLOCK.AIR]
        ]},
        { result: { id: BLOCK.WOODEN_AXE, count: 1 }, pattern: [
            [BLOCK.BIRCH_PLANKS, BLOCK.BIRCH_PLANKS, BLOCK.AIR],
            [BLOCK.BIRCH_PLANKS, BLOCK.STICK, BLOCK.AIR],
            [BLOCK.AIR, BLOCK.STICK, BLOCK.AIR]
        ]},
        { result: { id: BLOCK.WOODEN_AXE, count: 1 }, pattern: [
            [BLOCK.ACACIA_PLANKS, BLOCK.ACACIA_PLANKS, BLOCK.AIR],
            [BLOCK.ACACIA_PLANKS, BLOCK.STICK, BLOCK.AIR],
            [BLOCK.AIR, BLOCK.STICK, BLOCK.AIR]
        ]},
        { result: { id: BLOCK.WOODEN_AXE, count: 1 }, pattern: [
            [BLOCK.DARK_OAK_PLANKS, BLOCK.DARK_OAK_PLANKS, BLOCK.AIR],
            [BLOCK.DARK_OAK_PLANKS, BLOCK.STICK, BLOCK.AIR],
            [BLOCK.AIR, BLOCK.STICK, BLOCK.AIR]
        ]},

        { result: { id: BLOCK.WOODEN_SHOVEL, count: 1 }, pattern: [
            [BLOCK.AIR, BLOCK.PLANKS, BLOCK.AIR],
            [BLOCK.AIR, BLOCK.STICK, BLOCK.AIR],
            [BLOCK.AIR, BLOCK.STICK, BLOCK.AIR]
        ]},
        { result: { id: BLOCK.WOODEN_SHOVEL, count: 1 }, pattern: [
            [BLOCK.AIR, BLOCK.BIRCH_PLANKS, BLOCK.AIR],
            [BLOCK.AIR, BLOCK.STICK, BLOCK.AIR],
            [BLOCK.AIR, BLOCK.STICK, BLOCK.AIR]
        ]},
        { result: { id: BLOCK.WOODEN_SHOVEL, count: 1 }, pattern: [
            [BLOCK.AIR, BLOCK.ACACIA_PLANKS, BLOCK.AIR],
            [BLOCK.AIR, BLOCK.STICK, BLOCK.AIR],
            [BLOCK.AIR, BLOCK.STICK, BLOCK.AIR]
        ]},
        { result: { id: BLOCK.WOODEN_SHOVEL, count: 1 }, pattern: [
            [BLOCK.AIR, BLOCK.DARK_OAK_PLANKS, BLOCK.AIR],
            [BLOCK.AIR, BLOCK.STICK, BLOCK.AIR],
            [BLOCK.AIR, BLOCK.STICK, BLOCK.AIR]
        ]},

        // Каменные инструменты
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

        // Железные инструменты
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
        [BLOCK.BIRCH_LOG]: BLOCK.COAL,
        [BLOCK.ACACIA_LOG]: BLOCK.COAL,
        [BLOCK.DARK_OAK_LOG]: BLOCK.COAL,
        [BLOCK.IRON_ORE]: BLOCK.IRON_INGOT,
    },

    fuels: {
        [BLOCK.OAK_LOG]: 300,
        [BLOCK.BIRCH_LOG]: 300,
        [BLOCK.ACACIA_LOG]: 300,
        [BLOCK.DARK_OAK_LOG]: 300,
        [BLOCK.PLANKS]: 300,
        [BLOCK.BIRCH_PLANKS]: 300,
        [BLOCK.ACACIA_PLANKS]: 300,
        [BLOCK.DARK_OAK_PLANKS]: 300,
        [BLOCK.STICK]: 100,
        [BLOCK.COAL]: 1600,
        [BLOCK.WOODEN_PICKAXE]: 200,
        [BLOCK.WOODEN_AXE]: 200,
        [BLOCK.WOODEN_SHOVEL]: 200,
        [BLOCK.CRAFTING_TABLE]: 300,
        [BLOCK.OAK_DOOR_ITEM]: 200,
        [BLOCK.BIRCH_DOOR_ITEM]: 200,
        [BLOCK.DARK_OAK_DOOR_ITEM]: 200,
        [BLOCK.OAK_TRAPDOOR]: 300,
        [BLOCK.BIRCH_TRAPDOOR]: 300,
        [BLOCK.TORCH]: 100
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