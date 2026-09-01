// game/blocks.js
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
    GLASS: 10,
    PLANKS: 11,
    SAND: 12,
    WATER: 13,
    GRAVEL: 14,
    SANDSTONE: 15,
    CRAFTING_TABLE: 16,
    FURNACE: 17,
    TALL_GRASS: 18,
    DOUBLE_TALL_GRASS_BOTTOM: 19,
    DOUBLE_TALL_GRASS_TOP: 20,

    COAL: 100,
    IRON_INGOT: 101,
    STICK: 102,
    WOODEN_PICKAXE: 200,
    WOODEN_AXE: 201,
    WOODEN_SHOVEL: 202,
    STONE_PICKAXE: 203,
    STONE_AXE: 204,
    STONE_SHOVEL: 205,
    IRON_PICKAXE: 206,
    IRON_AXE: 207,
    IRON_SHOVEL: 208,

    properties: {
        0: { name: 'air', isTransparent: true, isSolid: false },
        13: { name: 'water', isTransparent: true, isSolid: false, texture: 'gen:water' }
    },

    nextDynamicId: 300,

    register(def) {
        let id = def.id;
        if (!id) {
            id = this.nextDynamicId++;
        }
        this[def.name.toUpperCase()] = id;
        this.properties[id] = { ...def, id };
        return id;
    },

    get(id) {
        return this.properties[id] || { isSolid: false, isTransparent: true };
    }
};