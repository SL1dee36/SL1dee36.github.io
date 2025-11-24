// game/blocks.js
import * as THREE from 'three';

export const BLOCK = {
    AIR: 0,
    BEDROCK: 1,
    STONE: 2,
    COBBLESTONE: 3,
    DIRT: 4,
    GRASS: 5,
    OAK_LOG: 6,
    OAK_LEAVES: 7,
    COAL_ORE: 8,
    IRON_ORE: 9,
    
    properties: {
        0: { name: 'air', isTransparent: true, isSolid: false },
        1: { name: 'bedrock', isBreakable: false, isSolid: true, texture: 'bedrock.png' },
        2: { name: 'stone', isSolid: true, texture: 'stone.png' },
        3: { name: 'cobblestone', isSolid: true, texture: 'cobblestone.png'},
        4: { name: 'dirt', isSolid: true, texture: 'dirt.png' },
        5: { name: 'grass', isSolid: true, texture: { top: 'grass_top.png', bottom: 'dirt.png', side: 'grass_side.png' } },
        6: { name: 'oak_log', isSolid: true, texture: { top: 'oak_log_top.png', bottom: 'oak_log_top.png', side: 'oak_log.png' } },
        7: { name: 'oak_leaves', isTransparent: true, isSolid: true, texture: 'oak_leaves.png' },
        8: { name: 'coal_ore', isSolid: true, texture: 'coal_ore.png'},
        9: { name: 'iron_ore', isSolid: true, texture: 'iron_ore.png'}
    },

    get(id) {
        // Возвращаем пустой объект с isSolid: false для неизвестных ID
        return this.properties[id] || { isSolid: false };
    }
};