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

    // Цветы
    DANDELION: 21,
    POPPY: 22,
    BLUE_ORCHID: 23,
    ALLIUM: 24,
    RED_TULIP: 25,
    WHITE_TULIP: 26,
    OXEYE_DAISY: 27,

    // Новые виды деревьев
    BIRCH_LOG: 28,
    BIRCH_LEAVES: 29,
    BIRCH_PLANKS: 30,
    ACACIA_LOG: 31,
    ACACIA_LEAVES: 32,
    ACACIA_PLANKS: 33,
    DARK_OAK_LOG: 34,
    DARK_OAK_LEAVES: 35,
    DARK_OAK_PLANKS: 36,

    // Двери, люки, факел
    OAK_DOOR: 37,
    BIRCH_DOOR: 38,
    DARK_OAK_DOOR: 39,
    IRON_DOOR: 40,
    OAK_TRAPDOOR: 41,
    BIRCH_TRAPDOOR: 42,
    TORCH: 43,
    SNOW_BLOCK: 44,

    COAL: 100,
    IRON_INGOT: 101,
    STICK: 102,
    OAK_DOOR_ITEM: 103,
    BIRCH_DOOR_ITEM: 104,
    DARK_OAK_DOOR_ITEM: 105,
    IRON_DOOR_ITEM: 106,
    BUCKET: 107,
    WATER_BUCKET: 108,
    RAW_BEEF: 109,
    RAW_PORKCHOP: 110,
    RAW_CHICKEN: 111,
    FEATHER: 112,
    ROTTEN_FLESH: 113,
    BONE: 114,

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
        13: { name: 'water', isTransparent: true, isSolid: false, texture: 'source:water' },

        // Цветы
        21: { id: 21, name: 'dandelion', isPlant: true, isSolid: false, isTransparent: true, texture: 'source:dandelion', drop: 21 },
        22: { id: 22, name: 'poppy', isPlant: true, isSolid: false, isTransparent: true, texture: 'source:poppy', drop: 22 },
        23: { id: 23, name: 'blue_orchid', isPlant: true, isSolid: false, isTransparent: true, texture: 'source:blue_orchid', drop: 23 },
        24: { id: 24, name: 'allium', isPlant: true, isSolid: false, isTransparent: true, texture: 'source:allium', drop: 24 },
        25: { id: 25, name: 'red_tulip', isPlant: true, isSolid: false, isTransparent: true, texture: 'source:red_tulip', drop: 25 },
        26: { id: 26, name: 'white_tulip', isPlant: true, isSolid: false, isTransparent: true, texture: 'source:white_tulip', drop: 26 },
        27: { id: 27, name: 'oxeye_daisy', isPlant: true, isSolid: false, isTransparent: true, texture: 'source:oxeye_daisy', drop: 27 },

        // Берёза
        28: { id: 28, name: 'birch_log', isSolid: true, isTransparent: false, texture: { top: 'source:birch_log_top', bottom: 'source:birch_log_top', side: 'source:birch_log_side' } },
        29: { id: 29, name: 'birch_leaves', isSolid: true, isTransparent: true, texture: 'source:birch_leaves', drop: 0 },
        30: { id: 30, name: 'birch_planks', isSolid: true, isTransparent: false, texture: 'source:birch_planks' },

        // Акация
        31: { id: 31, name: 'acacia_log', isSolid: true, isTransparent: false, texture: { top: 'source:acacia_log_top', bottom: 'source:acacia_log_top', side: 'source:acacia_log_side' } },
        32: { id: 32, name: 'acacia_leaves', isSolid: true, isTransparent: true, texture: 'source:acacia_leaves', drop: 0 },
        33: { id: 33, name: 'acacia_planks', isSolid: true, isTransparent: false, texture: 'source:acacia_planks' },

        // Тёмный дуб
        34: { id: 34, name: 'dark_oak_log', isSolid: true, isTransparent: false, texture: { top: 'source:dark_oak_log_top', bottom: 'source:dark_oak_log_top', side: 'source:dark_oak_log_side' } },
        35: { id: 35, name: 'dark_oak_leaves', isSolid: true, isTransparent: true, texture: 'source:dark_oak_leaves', drop: 0 },
        36: { id: 36, name: 'dark_oak_planks', isSolid: true, isTransparent: false, texture: 'source:dark_oak_planks' },

        // Двери
        37: { id: 37, name: 'oak_door', isDoor: true, isSolid: true, isTransparent: true, texture: { bottom: 'source:oak_door_bottom', top: 'source:oak_door_top', side: 'source:oak_door_bottom' }, drop: 103 },
        38: { id: 38, name: 'birch_door', isDoor: true, isSolid: true, isTransparent: true, texture: { bottom: 'source:birch_door_bottom', top: 'source:birch_door_top', side: 'source:birch_door_bottom' }, drop: 104 },
        39: { id: 39, name: 'dark_oak_door', isDoor: true, isSolid: true, isTransparent: true, texture: { bottom: 'source:dark_oak_door_bottom', top: 'source:dark_oak_door_top', side: 'source:dark_oak_door_bottom' }, drop: 105 },
        40: { id: 40, name: 'iron_door', isDoor: true, isSolid: true, isTransparent: true, texture: { bottom: 'source:iron_door_bottom', top: 'source:iron_door_top', side: 'source:iron_door_bottom' }, drop: 106 },

        // Люки
        41: { id: 41, name: 'oak_trapdoor', isTrapdoor: true, isSolid: true, isTransparent: true, texture: 'source:oak_trapdoor', drop: 41 },
        42: { id: 42, name: 'birch_trapdoor', isTrapdoor: true, isSolid: true, isTransparent: true, texture: 'source:birch_trapdoor', drop: 42 },

        // Факел
        43: { id: 43, name: 'torch', isPlant: true, isSolid: false, isTransparent: true, lightEmission: 14, texture: 'source:torch', drop: 43 },
        44: { id: 44, name: 'snow_block', isSolid: true, isTransparent: false, texture: 'source:snow_block', drop: 44 },

        // Предметы
        103: { id: 103, name: 'oak_door_item', isItem: true, texture: 'source:oak_door_item' },
        104: { id: 104, name: 'birch_door_item', isItem: true, texture: 'source:birch_door_item' },
        105: { id: 105, name: 'dark_oak_door_item', isItem: true, texture: 'source:dark_oak_door_item' },
        106: { id: 106, name: 'iron_door_item', isItem: true, texture: 'source:iron_door_item' },
        107: { id: 107, name: 'bucket', isItem: true, texture: 'source:bucket' },
        108: { id: 108, name: 'water_bucket', isItem: true, texture: 'source:water_bucket' },
        109: { id: 109, name: 'raw_beef', isItem: true, texture: 'source:raw_beef' },
        110: { id: 110, name: 'raw_porkchop', isItem: true, texture: 'source:raw_porkchop' },
        111: { id: 111, name: 'raw_chicken', isItem: true, texture: 'source:raw_chicken' },
        112: { id: 112, name: 'feather', isItem: true, texture: 'source:feather' },
        113: { id: 113, name: 'rotten_flesh', isItem: true, texture: 'source:rotten_flesh' },
        114: { id: 114, name: 'bone', isItem: true, texture: 'source:bone' }
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