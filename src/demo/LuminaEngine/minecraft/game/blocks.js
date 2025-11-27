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
    
    // Items / Tools
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
        1: { name: 'bedrock', isBreakable: false, isSolid: true, isTransparent: false, texture: 'gen:bedrock' },
        2: { name: 'stone', isSolid: true, isTransparent: false, texture: 'gen:stone', drop: 3 },
        3: { name: 'cobblestone', isSolid: true, isTransparent: false, texture: 'gen:cobblestone'},
        4: { name: 'dirt', isSolid: true, isTransparent: false, texture: 'gen:dirt' },
        5: { name: 'grass', isSolid: true, isTransparent: false, texture: { top: 'gen:grass_top', bottom: 'gen:dirt', side: 'gen:grass_side' }, drop: 4 },
        6: { name: 'oak_log', isSolid: true, isTransparent: false, texture: { top: 'gen:log_top', bottom: 'gen:log_top', side: 'gen:log_side' } },
        7: { name: 'oak_leaves', isTransparent: true, isSolid: true, texture: 'gen:leaves' },
        8: { name: 'coal_ore', isSolid: true, isTransparent: false, texture: 'gen:coal_ore', drop: 100 },
        9: { name: 'iron_ore', isSolid: true, isTransparent: false, texture: 'gen:iron_ore', drop: 9 }, 
        10: { name: 'glass', isTransparent: true, isSolid: true, texture: 'gen:glass', isBreakable: true, drop: 0 },
        11: { name: 'planks', isSolid: true, isTransparent: false, texture: 'gen:planks'},
        12: { name: 'sand', isSolid: true, isTransparent: false, texture: 'gen:sand', falling: true },
        13: { name: 'water', isTransparent: true, isSolid: false, texture: 'gen:water'},
        14: { name: 'gravel', isSolid: true, isTransparent: false, texture: 'gen:gravel', falling: true },
        15: { name: 'sandstone', isSolid: true, isTransparent: false, texture: { top: 'gen:sandstone_top', bottom: 'gen:sandstone_bottom', side: 'gen:sandstone_side' } },
        16: { name: 'crafting_table', isSolid: true, isTransparent: false, texture: { top: 'gen:crafting_table_top', bottom: 'gen:planks', side: 'gen:crafting_table_side', front: 'gen:crafting_table_front' } },
        17: { name: 'furnace', isSolid: true, isTransparent: false, texture: { top: 'gen:furnace_top', bottom: 'gen:cobblestone', side: 'gen:furnace_side', front: 'gen:furnace_front' } },

        // Items - isSolid: false, isTransparent: true (effectively)
        100: { name: 'coal', isItem: true, texture: 'gen:item_coal' },
        101: { name: 'iron_ingot', isItem: true, texture: 'gen:item_iron_ingot' },
        102: { name: 'stick', isItem: true, texture: 'gen:item_stick' },
        
        // Tools
        200: { name: 'wooden_pickaxe', isItem: true, texture: 'gen:tool_wood_pick' },
        201: { name: 'wooden_axe', isItem: true, texture: 'gen:tool_wood_axe' },
        202: { name: 'wooden_shovel', isItem: true, texture: 'gen:tool_wood_shovel' },
        203: { name: 'stone_pickaxe', isItem: true, texture: 'gen:tool_stone_pick' },
        204: { name: 'stone_axe', isItem: true, texture: 'gen:tool_stone_axe' },
        205: { name: 'stone_shovel', isItem: true, texture: 'gen:tool_stone_shovel' },
        206: { name: 'iron_pickaxe', isItem: true, texture: 'gen:tool_iron_pick' },
        207: { name: 'iron_axe', isItem: true, texture: 'gen:tool_iron_axe' },
        208: { name: 'iron_shovel', isItem: true, texture: 'gen:tool_iron_shovel' },
    },

    get(id) {
        return this.properties[id] || { isSolid: false, isTransparent: true };
    }
};