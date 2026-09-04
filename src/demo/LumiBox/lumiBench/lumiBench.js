import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';

const PALETTES = {
    stone: ['#1b1c20', '#242528', '#2e3036', '#383b42', '#454850', '#686c78', '#b0b8cc', '#ffffff'],
    wood: ['#2b1607', '#3d220a', '#4d2b0e', '#5c3512', '#754418', '#804c1e', '#9a6027', '#c79c65'],
    nature: ['#153b0a', '#1e521b', '#2a6917', '#429e24', '#5ecc34', '#8cf54e', '#59381f', '#d4b779'],
    ore: ['#e5b025', '#f8d957', '#fff8a8', '#2c8f8b', '#4dede2', '#a8ffff', '#d13838', '#9e25d4'],
    custom: []
};

const CANONICAL_SLOTS = {
    "bedrock": [0, 0], "stone": [1, 0], "cobblestone": [2, 0], "dirt": [3, 0],
    "grass_top": [4, 0], "grass_side": [5, 0], "log_side": [6, 0], "log_top": [7, 0],
    "leaves": [8, 0], "planks": [9, 0], "sand": [10, 0], "gravel": [11, 0],
    "coal_ore": [12, 0], "iron_ore": [13, 0], "glass": [14, 0], "water": [15, 0],

    "sandstone_side": [0, 1], "sandstone_top": [1, 1], "sandstone_bottom": [2, 1],
    "crafting_table_top": [3, 1], "crafting_table_side": [4, 1], "crafting_table_front": [5, 1],
    "furnace_front": [6, 1], "furnace_side": [7, 1], "furnace_top": [8, 1],
    "tall_grass": [9, 1], "double_grass_bottom": [10, 1], "double_grass_top": [11, 1],
    "item_stick": [12, 1], "item_coal": [13, 1], "item_iron_ingot": [14, 1], "tool_wood_pick": [15, 1],

    "tool_wood_axe": [0, 2], "tool_wood_shovel": [1, 2], "tool_stone_pick": [2, 2],
    "tool_stone_axe": [3, 2], "tool_stone_shovel": [4, 2], "tool_iron_pick": [5, 2],
    "tool_iron_axe": [6, 2], "tool_iron_shovel": [7, 2],
    "torch": [8, 2], "dandelion": [9, 2], "poppy": [10, 2], "blue_orchid": [11, 2],
    "allium": [12, 2], "red_tulip": [13, 2], "white_tulip": [14, 2], "oxeye_daisy": [15, 2],

    "birch_log_side": [0, 3], "birch_log_top": [1, 3], "birch_leaves": [2, 3], "birch_planks": [3, 3],
    "acacia_log_side": [4, 3], "acacia_log_top": [5, 3], "acacia_leaves": [6, 3], "acacia_planks": [7, 3],
    "dark_oak_log_side": [8, 3], "dark_oak_log_top": [9, 3], "dark_oak_leaves": [10, 3], "dark_oak_planks": [11, 3],
    "snow_block": [12, 3], "bucket": [13, 3], "water_bucket": [14, 3], "bone": [15, 3],

    "raw_beef": [0, 4], "raw_porkchop": [1, 4], "raw_chicken": [2, 4], "feather": [3, 4],
    "rotten_flesh": [4, 4], "oak_door_item": [5, 4], "oak_door_top": [6, 4], "oak_door_bottom": [7, 4],
    "birch_door_item": [8, 4], "birch_door_top": [9, 4], "birch_door_bottom": [10, 4],
    "dark_oak_door_item": [11, 4], "dark_oak_door_top": [12, 4], "dark_oak_door_bottom": [13, 4],
    "iron_door_item": [14, 4], "iron_door_top": [15, 4],

    "iron_door_bottom": [0, 5], "oak_trapdoor": [1, 5], "birch_trapdoor": [2, 5]
};

const CANONICAL_BLOCKS = [
    { id: 1, name: "bedrock", isSolid: true, isTransparent: false, isBreakable: false, texture: "source:bedrock" },
    { id: 2, name: "stone", isSolid: true, isTransparent: false, texture: "source:stone", drop: 3 },
    { id: 3, name: "cobblestone", isSolid: true, isTransparent: false, texture: "source:cobblestone" },
    { id: 4, name: "dirt", isSolid: true, isTransparent: false, texture: "source:dirt" },
    { id: 5, name: "grass", isSolid: true, isTransparent: false, texture: { top: "source:grass_top", bottom: "source:dirt", side: "source:grass_side" }, drop: 4 },
    { id: 6, name: "oak_log", isSolid: true, isTransparent: false, texture: { top: "source:log_top", bottom: "source:log_top", side: "source:log_side" } },
    { id: 7, name: "oak_leaves", isSolid: true, isTransparent: true, texture: "source:leaves" },
    { id: 8, name: "coal_ore", isSolid: true, isTransparent: false, texture: "source:coal_ore", drop: 100 },
    { id: 9, name: "iron_ore", isSolid: true, isTransparent: false, texture: "source:iron_ore", drop: 9 },
    { id: 10, name: "glass", isSolid: true, isTransparent: true, isBreakable: true, texture: "source:glass", drop: 0 },
    { id: 11, name: "planks", isSolid: true, isTransparent: false, texture: "source:planks" },
    { id: 12, name: "sand", isSolid: true, isTransparent: false, texture: "source:sand", falling: true },
    { id: 13, name: "water", isSolid: false, isTransparent: true, texture: "source:water" },
    { id: 14, name: "gravel", isSolid: true, isTransparent: false, texture: "source:gravel", falling: true },
    { id: 15, name: "sandstone", isSolid: true, isTransparent: false, texture: { top: "source:sandstone_top", bottom: "source:sandstone_bottom", side: "source:sandstone_side" } },
    { id: 16, name: "crafting_table", isSolid: true, isTransparent: false, texture: { top: "source:crafting_table_top", bottom: "source:planks", side: "source:crafting_table_side", front: "source:crafting_table_front" } },
    { id: 17, name: "furnace", isSolid: true, isTransparent: false, texture: { top: "source:furnace_top", bottom: "source:cobblestone", side: "source:furnace_side", front: "source:furnace_front" } },
    { id: 18, name: "tall_grass", isPlant: true, isSolid: false, isTransparent: true, texture: "source:tall_grass", drop: 0 },
    { id: 19, name: "double_tall_grass_bottom", isPlant: true, isSolid: false, isTransparent: true, texture: "source:double_grass_bottom", drop: 0 },
    { id: 20, name: "double_tall_grass_top", isPlant: true, isSolid: false, isTransparent: true, texture: "source:double_grass_top", drop: 0 },
    { id: 21, name: "dandelion", isPlant: true, isSolid: false, isTransparent: true, texture: "source:dandelion", drop: 21 },
    { id: 22, name: "poppy", isPlant: true, isSolid: false, isTransparent: true, texture: "source:poppy", drop: 22 },
    { id: 23, name: "blue_orchid", isPlant: true, isSolid: false, isTransparent: true, texture: "source:blue_orchid", drop: 23 },
    { id: 24, name: "allium", isPlant: true, isSolid: false, isTransparent: true, texture: "source:allium", drop: 24 },
    { id: 25, name: "red_tulip", isPlant: true, isSolid: false, isTransparent: true, texture: "source:red_tulip", drop: 25 },
    { id: 26, name: "white_tulip", isPlant: true, isSolid: false, isTransparent: true, texture: "source:white_tulip", drop: 26 },
    { id: 27, name: "oxeye_daisy", isPlant: true, isSolid: false, isTransparent: true, texture: "source:oxeye_daisy", drop: 27 },
    { id: 28, name: "birch_log", isSolid: true, isTransparent: false, texture: { top: "source:birch_log_top", bottom: "source:birch_log_top", side: "source:birch_log_side" } },
    { id: 29, name: "birch_leaves", isSolid: true, isTransparent: true, texture: "source:birch_leaves", drop: 0 },
    { id: 30, name: "birch_planks", isSolid: true, isTransparent: false, texture: "source:birch_planks" },
    { id: 31, name: "acacia_log", isSolid: true, isTransparent: false, texture: { top: "source:acacia_log_top", bottom: "source:acacia_log_top", side: "source:acacia_log_side" } },
    { id: 32, name: "acacia_leaves", isSolid: true, isTransparent: true, texture: "source:acacia_leaves", drop: 0 },
    { id: 33, name: "acacia_planks", isSolid: true, isTransparent: false, texture: "source:acacia_planks" },
    { id: 34, name: "dark_oak_log", isSolid: true, isTransparent: false, texture: { top: "source:dark_oak_log_top", bottom: "source:dark_oak_log_top", side: "source:dark_oak_log_side" } },
    { id: 35, name: "dark_oak_leaves", isSolid: true, isTransparent: true, texture: "source:dark_oak_leaves", drop: 0 },
    { id: 36, name: "dark_oak_planks", isSolid: true, isTransparent: false, texture: "source:dark_oak_planks" },
    { id: 37, name: "oak_door", isDoor: true, isSolid: true, isTransparent: true, texture: { bottom: "source:oak_door_bottom", top: "source:oak_door_top", side: "source:oak_door_bottom" }, drop: 103 },
    { id: 38, name: "birch_door", isDoor: true, isSolid: true, isTransparent: true, texture: { bottom: "source:birch_door_bottom", top: "source:birch_door_top", side: "source:birch_door_bottom" }, drop: 104 },
    { id: 39, name: "dark_oak_door", isDoor: true, isSolid: true, isTransparent: true, texture: { bottom: "source:dark_oak_door_bottom", top: "source:dark_oak_door_top", side: "source:dark_oak_door_bottom" }, drop: 105 },
    { id: 40, name: "iron_door", isDoor: true, isSolid: true, isTransparent: true, texture: { bottom: "source:iron_door_bottom", top: "source:iron_door_top", side: "source:iron_door_bottom" }, drop: 106 },
    { id: 41, name: "oak_trapdoor", isTrapdoor: true, isSolid: true, isTransparent: true, texture: "source:oak_trapdoor", drop: 41 },
    { id: 42, name: "birch_trapdoor", isTrapdoor: true, isSolid: true, isTransparent: true, texture: "source:birch_trapdoor", drop: 42 },
    { id: 43, name: "torch", isPlant: true, isSolid: false, isTransparent: true, lightEmission: 14, texture: "source:torch", drop: 43 },
    { id: 44, name: "snow_block", isSolid: true, isTransparent: false, texture: "source:snow_block", drop: 44 }
];

const CANONICAL_ITEMS = [
    { id: 100, name: "coal", isItem: true, texture: "source:item_coal" },
    { id: 101, name: "iron_ingot", isItem: true, texture: "source:item_iron_ingot" },
    { id: 102, name: "stick", isItem: true, texture: "source:item_stick" },
    { id: 103, name: "oak_door", isItem: true, texture: "source:oak_door_item" },
    { id: 104, name: "birch_door", isItem: true, texture: "source:birch_door_item" },
    { id: 105, name: "dark_oak_door", isItem: true, texture: "source:dark_oak_door_item" },
    { id: 106, name: "iron_door", isItem: true, texture: "source:iron_door_item" },
    { id: 107, name: "bucket", isItem: true, texture: "source:bucket" },
    { id: 108, name: "water_bucket", isItem: true, texture: "source:water_bucket" },
    { id: 109, name: "raw_beef", isItem: true, texture: "source:raw_beef" },
    { id: 110, name: "raw_porkchop", isItem: true, texture: "source:raw_porkchop" },
    { id: 111, name: "raw_chicken", isItem: true, texture: "source:raw_chicken" },
    { id: 112, name: "feather", isItem: true, texture: "source:feather" },
    { id: 113, name: "rotten_flesh", isItem: true, texture: "source:rotten_flesh" },
    { id: 114, name: "bone", isItem: true, texture: "source:bone" },
    { id: 200, name: "wooden_pickaxe", isItem: true, texture: "source:tool_wood_pick" },
    { id: 201, name: "wooden_axe", isItem: true, texture: "source:tool_wood_axe" },
    { id: 202, name: "wooden_shovel", isItem: true, texture: "source:tool_wood_shovel" },
    { id: 203, name: "stone_pickaxe", isItem: true, texture: "source:tool_stone_pick" },
    { id: 204, name: "stone_axe", isItem: true, texture: "source:tool_stone_axe" },
    { id: 205, name: "stone_shovel", isItem: true, texture: "source:tool_stone_shovel" },
    { id: 206, name: "iron_pickaxe", isItem: true, texture: "source:tool_iron_pick" },
    { id: 207, name: "iron_axe", isItem: true, texture: "source:tool_iron_axe" },
    { id: 208, name: "iron_shovel", isItem: true, texture: "source:tool_iron_shovel" }
];

class ProceduralPainter {
    speckle(ctx, c, count) {
        ctx.fillStyle = c;
        for (let i = 0; i < count; i++) {
            ctx.fillRect(Math.floor(Math.random() * 16), Math.floor(Math.random() * 16), 1, 1);
        }
    }

    paint(ctx, map, palette) {
        for (let y = 0; y < 16; y++) {
            if (!map[y]) continue;
            for (let x = 0; x < 16; x++) {
                const char = map[y][x];
                if (char && char !== ' ' && palette[char]) {
                    ctx.fillStyle = palette[char];
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
    }

    paintItem(ctx, map, palette, offX = 0, offY = 0) {
        for (let y = 0; y < map.length; y++) {
            for (let x = 0; x < map[y].length; x++) {
                const char = map[y][x];
                if (palette[char]) {
                    ctx.fillStyle = palette[char];
                    ctx.fillRect(x + offX, y + offY, 1, 1);
                }
            }
        }
    }

    generateTool(ctx, material, type) {
        let pal = {};
        if (material === 'wood') {
            pal = { '1': '#3d220a', '2': '#c79c65', '3': '#754418', '4': '#5c3512', '5': '#2b1607' };
        } else if (material === 'stone') {
            pal = { '1': '#282a2f', '2': '#454850', '3': '#686c78', '4': '#9196a6', 'S': '#804c1e', 's': '#4d2b0e', 'P': '#595d69', 'p': '#282a2f' };
        } else if (material === 'iron') {
            pal = { '1': '#31333a', '2': '#616673', '3': '#b0b8cc', '4': '#ffffff', 'S': '#804c1e', 's': '#4d2b0e', 'P': '#a6afc4', 'p': '#31333a' };
        }

        let toolMap = [];
        if (type === 'pick') {
            toolMap = [
                "      11111     ", "    1122231     ", "      11113111  ", "         13441  ",
                "          5141  ", "         545331 ", "        545 1121", "       545   121",
                "      545    131", "     545     131", "    545       11", "   545        1 ",
                "  545           ", "1545            ", "145             ", " 11             "
            ];
        } else if (type === 'axe') {
            toolMap = [
                "                ", "      12341     ", "     1344441    ", "    13444321sS  ",
                "    1244321 1Ss ", "     11321  121 ", "       11  sS 1 ", "       sS 11    ",
                "      sS        ", "     sS         ", "    sS          ", "   sS           ",
                "  sS            ", " pP             ", "pP              ", "p               "
            ];
        } else if (type === 'shovel') {
            toolMap = [
                "                ", "           1231 ", "          134431", "         1344421",
                "          13421 ", "           11sS ", "          sS 11 ", "         sS     ",
                "        sS      ", "       sS       ", "      sS        ", "     sS         ",
                "    sS          ", "   pP           ", "  pP            ", "  p             "
            ];
        }
        this.paint(ctx, toolMap, pal);
    }

    renderToCanvas(name, ctx) {
        ctx.clearRect(0, 0, 16, 16);
        switch (name) {
            case 'stone':
                this.paint(ctx, [
                    "2211222332211222", "2100123443210012", "1000013443100001", "1000122332210001",
                    "2101222222221012", "2212233223322122", "2322344334432232", "3433444444443343",
                    "3433444444443343", "2322344334432232", "2212233223322122", "2101222222221012",
                    "1000122332210001", "1000013443100001", "2100123443210012", "2211222332211222"
                ], { '0': '#4a4e57', '1': '#5e636e', '2': '#737987', '3': '#8b92a2', '4': '#a1a8b9' });
                this.speckle(ctx, '#3a3d45', 6);
                this.speckle(ctx, '#b4bcd0', 4);
                break;
            case 'dirt':
                this.paint(ctx, [
                    "1211012211012110", "2321123321123211", "1210012210012100", "0100401100401004",
                    "1211012211012110", "2321123321123211", "1210012210012100", "0100401100401004",
                    "1211012211012110", "2321123321123211", "1210012210012100", "0100401100401004",
                    "1211012211012110", "2321123321123211", "1210012210012100", "0100401100401004"
                ], { '0': '#422817', '1': '#59381f', '2': '#6f4727', '3': '#855630', '4': '#321c0e' });
                this.speckle(ctx, '#8a6039', 6);
                this.speckle(ctx, '#2b170c', 8);
                break;
            case 'grass_top':
                this.paint(ctx, [
                    "1221232112321221", "2342343223432342", "2443444334443442", "1342343223432341",
                    "2231232112321222", "3342343223432333", "2443444334443442", "1342343223432341",
                    "1221232112321221", "2342343223432342", "2443444334443442", "1342343223432341",
                    "2231232112321222", "3342343223432333", "2443444334443442", "1342343223432341"
                ], { '1': '#2d691f', '2': '#3e8825', '3': '#52a42e', '4': '#6bc33b' });
                this.speckle(ctx, '#7de044', 6);
                break;
            case 'grass_side':
                this.renderToCanvas('dirt', ctx);
                this.paint(ctx, [
                    "4444444444444444", "3434434434344344", "2323323323233233", "2313213223132132",
                    "1202102112021021", "1101101011011010", "00 00 0  00 00  "
                ], { '4': '#7de044', '3': '#52a42e', '2': '#3e8825', '1': '#204d15', '0': '#16330e' });
                break;
            case 'cobblestone':
                this.paint(ctx, [
                    "0000001111100000", "0333201444310332", "0343201444310342", "0222101333210221",
                    "0000001111100000", "1111000000111110", "1443103332014443", "1443103442014443",
                    "1332102221013332", "0000000000111110", "0000111110000000", "0332014443103332",
                    "0342014443103442", "0221013332102221", "0000011111000000", "0000000000000000"
                ], { '0': '#2b2d32', '1': '#43474f', '2': '#5c626d', '3': '#787f8d', '4': '#9aa1af' });
                break;
            case 'planks':
                this.paint(ctx, [
                    "3333333333333333", "2221222212222122", "1110111101111011", "0000000000000000",
                    "3333333333333333", "2122221222212222", "1011110111101111", "0000000000000000",
                    "3333333333333333", "2222122221222212", "1111011110111101", "0000000000000000",
                    "3333333333333333", "2212222122221222", "1101111011110111", "0000000000000000"
                ], { '3': '#c79c65', '2': '#aa7d48', '1': '#875d31', '0': '#523419' });
                ctx.fillStyle = '#3a220e';
                [1, 14].forEach(x => [1, 5, 9, 13].forEach(y => ctx.fillRect(x, y, 1, 1)));
                break;
            case 'log_side':
                this.paint(ctx, [
                    "0121001232100121", "0121001232100121", "0122101222101221", "0012100121001210",
                    "1012110121011210", "2101221011121011", "2100121001221001", "1000121001210001",
                    "0110121011210110", "0121011012210121", "0122100012100121", "0012100112100121",
                    "0012101222100121", "1012112321001210", "2101222210011210", "1000111000001100"
                ], { '0': '#29180d', '1': '#3e2615', '2': '#56371f', '3': '#724b2b' });
                break;
            case 'log_top':
                this.paint(ctx, [
                    "0000000000000000", "0111111111111110", "0122222222222210", "0123333333333210",
                    "0123444444443210", "0123433333343210", "0123434444343210", "0123434554343210",
                    "0123434554343210", "0123434444343210", "0123433333343210", "0123444444443210",
                    "0123333333333210", "0122222222222210", "0111111111111110", "0000000000000000"
                ], { '0': '#29180d', '1': '#432a17', '2': '#8c653a', '3': '#ab824e', '4': '#c9a169', '5': '#966e3b' });
                break;
            case 'leaves':
                this.paint(ctx, [
                    " 1221  12321  12", "1234311234431123", "2344322345432234", "1234311234321123",
                    " 12321  12321  1", "  121    121    ", " 12321  12321  1", "1234431123443112",
                    "2345432234543223", "1234321123432112", " 12321  12321  1", "  121    121    ",
                    " 12321  12321  12", "1234311234431123", "2344322345432234", " 1221  12321  12"
                ], { '1': '#133811', '2': '#1e521b', '3': '#2e7529', '4': '#429e3a', '5': '#63c75a' });
                break;
            case 'bedrock':
                this.paint(ctx, [
                    "0010021000100210", "0121010001210100", "1232100112321001", "0121001201210012",
                    "0010012300100123", "1000123410001234", "2100012321000123", "1000001210000012",
                    "0010021000100210", "0121010001210100", "1232100112321001", "0121001201210012",
                    "0010012300100123", "1000123410001234", "2100012321000123", "1000001210000012"
                ], { '0': '#090a0f', '1': '#151722', '2': '#26293a', '3': '#3b3f58', '4': '#565c7e' });
                break;
            case 'sand':
                this.paint(ctx, [
                    "2232212232212232", "3343323343323343", "2332212332212332", "1221101221101221",
                    "2232212232212232", "3343323343323343", "2332212332212332", "1221101221101221",
                    "2232212232212232", "3343323343323343", "2332212332212332", "1221101221101221",
                    "2232212232212232", "3343323343323343", "2332212332212332", "1221101221101221"
                ], { '0': '#bda168', '1': '#d4b779', '2': '#e5cb8f', '3': '#f3dea4', '4': '#ffecba' });
                break;
            case 'gravel':
                this.paint(ctx, [
                    "1121012211210122", "2343123423431234", "1232012312320123", "0110001201100012",
                    "1122101111221011", "2344212323442123", "1233101212331012", "0111000101110001",
                    "1121012211210122", "2343123423431234", "1232012312320123", "0110001201100012",
                    "1122101111221011", "2344212323442123", "1233101212331012", "0111000101110001"
                ], { '0': '#383b40', '1': '#4e525a', '2': '#696e79', '3': '#888f9c', '4': '#abb3c2' });
                break;
            case 'water':
                ctx.fillStyle = 'rgba(20, 110, 200, 0.7)';
                ctx.fillRect(0, 0, 16, 16);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.fillRect(2, 2, 4, 1); ctx.fillRect(10, 6, 3, 1); ctx.fillRect(4, 12, 5, 1);
                break;
            case 'glass':
                this.paint(ctx, [
                    "1111111111111111", "122            1", "1232           1", "1 232          1",
                    "1  2           1", "1              1", "1              1", "1              1",
                    "1              1", "1              1", "1           2  1", "1          232 1",
                    "1           2321", "1            221", "1              1", "1111111111111111"
                ], { '1': '#90caf9', '2': '#cbe7ff', '3': '#ffffff' });
                break;
            case 'coal_ore':
                this.renderToCanvas('stone', ctx);
                this.paint(ctx, [
                    "                ", "    1221        ", "   123321  121  ", "   230032 12321 ",
                    "   120021 23032 ", "    1221  12021 ", "           121  ", "                ",
                    "  121           ", " 12321    1221  ", " 23032   123321 ", " 12021   230032 ",
                    "  121    120021 ", "          1221  ", "                ", "                "
                ], { '0': '#111214', '1': '#22252a', '2': '#3a3f47', '3': '#5a626e' });
                break;
            case 'iron_ore':
                this.renderToCanvas('stone', ctx);
                this.paint(ctx, [
                    "                ", "    1221        ", "   123421  121  ", "   234432 12321 ",
                    "   123321 23432 ", "    1221  12321 ", "           121  ", "                ",
                    "  121           ", " 12321    1221  ", " 23432   123421 ", " 12321   234432 ",
                    "  121    123321 ", "          1221  ", "                ", "                "
                ], { '1': '#6e5648', '2': '#9e7e6b', '3': '#caa38d', '4': '#e8cfc2' });
                break;
            case 'sandstone_side':
                this.paint(ctx, [
                    "4444444444444444", "3333333333333333", "2222222222222222", "1111111111111111",
                    "3333333333333333", "2222222222222222", "2222222222222222", "1111111111111111",
                    "3333333333333333", "2222222222222222", "2222222222222222", "1111111111111111",
                    "4444444444444444", "3333333333333333", "1111111111111111", "0000000000000000"
                ], { '4': '#faeec7', '3': '#ebd79f', '2': '#dbc183', '1': '#be9f60', '0': '#947840' });
                break;
            case 'sandstone_top':
            case 'sandstone_bottom':
                this.paint(ctx, [
                    "3333333333333333", "3222222222222223", "3233333333333323", "3232222222222323",
                    "3232222222222323", "3232222222222323", "3232222222222323", "3232222222222323",
                    "3232222222222323", "3232222222222323", "3232222222222323", "3232222222222323",
                    "3232222222222323", "3233333333333323", "3222222222222223", "3333333333333333"
                ], { '3': '#faeec7', '2': '#dbc183' });
                break;
            case 'crafting_table_top':
                this.paint(ctx, [
                    "0000000000000000", "0444404444044440", "0433404334043340", "0433404334043340",
                    "0444404444044440", "0000000000000000", "0444404444044440", "0433404334043340",
                    "0433404334043340", "0444404444044440", "0000000000000000", "0444404444044440",
                    "0433404334043340", "0433404334043340", "0444404444044440", "0000000000000000"
                ], { '0': '#412511', '4': '#c99f6b', '3': '#a37644' });
                break;
            case 'crafting_table_side':
            case 'crafting_table_front':
                this.renderToCanvas('planks', ctx);
                this.paint(ctx, [
                    "0000000000000000", "0              0", "0  22          0", "0 2332   111   0",
                    "0  22   12321  0", "0   4    121   0", "0   4     4    0", "0   4     4    0",
                    "0   4     4    0", "0         4    0", "0              0", "0              0",
                    "0              0", "0              0", "0              0", "0000000000000000"
                ], { '0': '#361e0b', '1': '#43474f', '2': '#787f8d', '3': '#aab2c0', '4': '#634021' });
                break;
            case 'furnace_front':
                this.renderToCanvas('cobblestone', ctx);
                this.paint(ctx, [
                    "                ", "  000000000000  ", " 01111111111110 ", " 01          10 ",
                    " 01          10 ", " 01          10 ", " 01          10 ", " 01111111111110 ",
                    "  000000000000  ", " 01111111111110 ", " 01222222222210 ", " 01233333333210 ",
                    " 01222222222210 ", " 01111111111110 ", "  000000000000  ", "                "
                ], { '0': '#1b1c20', '1': '#2e3037', '2': '#151618', '3': '#09090a' });
                break;
            case 'furnace_side':
            case 'furnace_top':
                this.renderToCanvas('cobblestone', ctx);
                break;
            case 'tall_grass':
                this.paint(ctx, [
                    "                ", "    4      3    ", "   343    343   ", "   343    243   ",
                    "   242   2342   ", "  2342   2342   ", "  2342   1341   ", "  1341   1241   ",
                    "  1241   1241   ", " 112411 112311  ", " 112311 112311  ", " 012310 012310  ",
                    " 012210 012210  ", " 001200 001200  ", "  0010   0010   ", "   00     00    "
                ], { '4': '#8cf54e', '3': '#5ecc34', '2': '#429e24', '1': '#2a6917', '0': '#153b0a' });
                break;
            case 'double_grass_bottom':
                this.paint(ctx, [
                    "  12421   13421 ", "  12421   12421 ", "  12411   12411 ", " 112411  112411 ",
                    " 112311  112311 ", " 012310  012310 ", " 012310  012310 ", " 012210  012210 ",
                    " 012210  012210 ", " 001200  001200 ", " 001200  001200 ", "  00100   00100 ",
                    "  00100   00100 ", "   0010    0010 ", "   0000    0000 ", "    00      00  "
                ], { '4': '#8cf54e', '3': '#5ecc34', '2': '#429e24', '1': '#2a6917', '0': '#153b0a' });
                break;
            case 'double_grass_top':
                this.paint(ctx, [
                    "       4        ", "      343   3   ", "   4  343  343  ", "  343 242  242  ",
                    "  343 242 2342  ", "  242 131 2342  ", " 2342 131 1341  ", " 2342 121 1241  ",
                    " 1341 121 1241  ", " 1241 121 1231  ", " 1241 121 1231  ", " 1231 121 1231  ",
                    " 1231 121 1231  ", " 1231 121 1231  ", " 1241 121 1241  ", " 12421 1 13421  "
                ], { '4': '#9eff5e', '3': '#6ee03f', '2': '#429e24', '1': '#2a6917' });
                break;
            case 'item_stick':
                this.paintItem(ctx, [
                    "              S ", "             Ss ", "            Ss  ", "           Ss   ",
                    "          Ss    ", "         Ss     ", "        Ss      ", "       Ss       ",
                    "      Ss        ", "     Ss         ", "    Ss          ", "   Ss           ",
                    "  Ss            ", " Ss             ", "Ss              ", "s               "
                ], { 'S': '#8f5c2c', 's': '#4a2c11' });
                break;
            case 'item_coal':
                this.paintItem(ctx, [
                    "    2332        ", "   245542       ", "  24511542      ", " 2451001542     ",
                    " 2410000142     ", " 2410000142     ", "  24100142      ", "   241142       ",
                    "    2332        "
                ], { '0': '#0d0e12', '1': '#191b22', '2': '#282b36', '3': '#404556', '4': '#5c637a', '5': '#8b94b2' }, 2, 3);
                break;
            case 'item_iron_ingot':
                this.paintItem(ctx, [
                    "   34444443     ", "  3555555553    ", " 356666666553   ", " 245555555442   ",
                    " 123333333221   ", "  0111111110    "
                ], { '6': '#ffffff', '5': '#e6ebf5', '4': '#c5cddb', '3': '#9ea7b8', '2': '#6f7787', '1': '#4a505c', '0': '#2b2f38' }, 2, 5);
                break;
            case 'tool_wood_pick': this.generateTool(ctx, 'wood', 'pick'); break;
            case 'tool_wood_axe': this.generateTool(ctx, 'wood', 'axe'); break;
            case 'tool_wood_shovel': this.generateTool(ctx, 'wood', 'shovel'); break;
            case 'tool_stone_pick': this.generateTool(ctx, 'stone', 'pick'); break;
            case 'tool_stone_axe': this.generateTool(ctx, 'stone', 'axe'); break;
            case 'tool_stone_shovel': this.generateTool(ctx, 'stone', 'shovel'); break;
            case 'tool_iron_pick': this.generateTool(ctx, 'iron', 'pick'); break;
            case 'tool_iron_axe': this.generateTool(ctx, 'iron', 'axe'); break;
            case 'tool_iron_shovel': this.generateTool(ctx, 'iron', 'shovel'); break;

            case 'dandelion':
                this.paint(ctx, [
                    "................", ".....YYYY.......", "....YHHHHHY.....", "...YHYYYYYHY....",
                    "...YYYOOOYYY....", "...YYOOOOOYY....", "....YYOOOYY.....", ".....YYYYY......",
                    ".......GG.......", ".......GG.......", "......GGG.......", ".....GGgGG......",
                    "....GG.gG.......", ".......GG.......", ".......GG.......", ".......GG......."
                ], { 'H': '#ffff99', 'Y': '#fff01f', 'O': '#ff8800', 'G': '#42a81b', 'g': '#2e8010' });
                break;
            case 'poppy':
                this.paint(ctx, [
                    "................", ".....rrrr.......", "....rRRRRr......", "...rRRBBBRr.....",
                    "...rRBYYYBrr....", "....RBDDDRR.....", ".....RRDD.......", ".......GG.......",
                    ".......GG.......", "......GGG.......", ".....GG.GG......", "....GG..GG......",
                    "........GG......", ".......GGG......", "........GG......", "........GG......"
                ], { 'r': '#ff5970', 'R': '#ff1a30', 'D': '#a60018', 'B': '#2e0208', 'Y': '#ffea38', 'G': '#3da822' });
                break;
            case 'blue_orchid':
                this.paint(ctx, [
                    "................", ".....WW.........", "....WCCB...B....", "....WCCB..BCB...",
                    ".....BB..WCCB...", "......G...BB....", ".....GGG...G....", "....G.GG..GGG...",
                    "...B...GG.G.....", "..BCB...GG......", "..WCCB..GG......", "...BB..GGG......",
                    "........GG......", "........GG......", "........GG......", "........GG......"
                ], { 'W': '#b5f2ff', 'C': '#00e1ff', 'B': '#0072e6', 'G': '#3da822' });
                break;
            case 'allium':
                this.paint(ctx, [
                    "......LL........", "....LLPPLL......", "...LPMMMMPL.....", "..LPMDDDMMPL....",
                    "..LPMMDDMMPL....", "...LPMMMMPL.....", "....LLPPLL......", "......PP........",
                    ".......GG.......", ".......GG.......", "......GGG.......", ".....GG.G.......",
                    "....GG..G.......", ".......GG.......", ".......GG.......", ".......GG......."
                ], { 'L': '#ffaef8', 'P': '#e83adb', 'M': '#a810be', 'D': '#660578', 'G': '#3da822' });
                break;
            case 'red_tulip':
                this.paint(ctx, [
                    "................", ".....rr.rr......", "....rRRrRRR.....", "...rRRDRRRRr....",
                    "...RRDDDRRRR....", "...RRRDDDRRR....", "....RRDDDRR.....", ".....RRRRR......",
                    ".......gG.......", ".......GG.......", "......GGG.......", ".....GGGGG......",
                    "....GG.GGG......", ".......GG.......", ".......GG.......", ".......GG......."
                ], { 'r': '#ff6374', 'R': '#ff1a30', 'D': '#990015', 'G': '#3da822', 'g': '#66cc2e' });
                break;
            case 'white_tulip':
                this.paint(ctx, [
                    "................", ".....WW.WW......", "....WWWWWWW.....", "...WWWcWWWWW....",
                    "...WWcccWWWW....", "...WWWcccWWW....", "....WWcccWW.....", ".....WWcWW......",
                    ".......gG.......", ".......GG.......", "......GGG.......", ".....GGGGG......",
                    "....GG.GGG......", ".......GG.......", ".......GG.......", ".......GG......."
                ], { 'W': '#ffffff', 'c': '#bdd6eb', 'G': '#3da822', 'g': '#66cc2e' });
                break;
            case 'oxeye_daisy':
                this.paint(ctx, [
                    "................", ".....WWWW.......", "...WWWWWWWW.....", "..WWWWYYYYWW....",
                    "..WWWYYOOYYW....", "...WWYYYYWW.....", "....WWWWWW......", ".....WWWW.......",
                    ".......GG.......", ".......GG.......", "......GGG.......", ".....GGGGG......",
                    "....GG.GGG......", ".......GG.......", ".......GG.......", ".......GG......."
                ], { 'W': '#ffffff', 'Y': '#ffd000', 'O': '#ff8800', 'G': '#3da822' });
                break;
            case 'torch':
                this.paint(ctx, [
                    ".......YY.......", "......YHYY......", ".....YHFFHY.....", ".....YFFFFY.....",
                    "......RFFR......", ".......CC.......", ".......WW.......", ".......Ww.......",
                    ".......WW.......", ".......wW.......", ".......WW.......", ".......Ww.......",
                    ".......WW.......", ".......wW.......", ".......WW.......", "................"
                ], { 'H': '#ffffff', 'Y': '#fff438', 'F': '#ff6800', 'R': '#d61a00', 'C': '#2e2218', 'W': '#8b5a2b', 'w': '#6b4019' });
                break;
            case 'birch_log_side':
                this.paint(ctx, [
                    "WWWWwbWWWWWWWWwW", "WWWWbBbWWWWWWWWW", "WWWWwbWWWWWWWWWW", "WWWWWWWWwbWWWWWW",
                    "WWWWWWWWbBbWWWWW", "WWWWWWWWwbWWWWWW", "WbWWWWWWWWWWWWWW", "bBbWWWWWWWWWWWwb",
                    "wbWWWWWWWWWWWbBb", "WWWWWWWWWWWWWwbW", "WWWWWWWWWWWWWWWW", "WWWWWWwbWWWWWWWW",
                    "WWWWWWbBbWWWWWWW", "WWWWWWwbWWWWWWWW", "WWwbWWWWWWWWWWWW", "WbBbWWWWWWWWWWWW"
                ], { 'W': '#fafbf7', 'w': '#dedfd6', 'b': '#484a54', 'B': '#1a1b1f' });
                break;
            case 'birch_log_top':
                this.paint(ctx, [
                    "WWWWWWWWWWWWWWWW", "WWWWWWWWWWWWWWWW", "WWccTTTTTTTTccWW", "WWcTTttttttTTcWW",
                    "WWTTttcccccttTWW", "WWTTtccTTccttTWW", "WWTTtcTTTTcttTWW", "WWTTtcTTTTcttTWW",
                    "WWTTtccTTccttTWW", "WWTTttcccccttTWW", "WWcTTttttttTTcWW", "WWccTTTTTTTTccWW",
                    "WWWWWWWWWWWWWWWW", "WWWWWWWWWWWWWWWW", "WWWWWWWWWWWWWWWW", "WWWWWWWWWWWWWWWW"
                ], { 'W': '#fafbf7', 'c': '#ebdcba', 'T': '#d6c08c', 't': '#b59e66' });
                break;
            case 'birch_leaves':
                this.paint(ctx, [
                    "LLDDLLLLLDDLLLDL", "LDHHDDLLLDLLDDLD", "LLDDLLDDDLLLLDLD", "DDLLLDLLDDLLDDLL",
                    "LLDDLLLLLDDLLLLL", "LDLLDDLLLLLLDDLL", "LLLLLDDDLLLLDLLD", "DDLLLLLLDDLLLLDD",
                    "LLDDLLLLLDDLLLDL", "LDLLDDLLLDHHDDLD", "LLDDLLDDDLLLLDLD", "DDLLLDLLDDLLDDLL",
                    "LLDDLLLLLDDLLLLL", "LDLLDDLLLLLLDDLL", "LLLLLDDDLLLLDLLD", "DDLLLLLLDDLLLLDD"
                ], { 'H': '#8bf030', 'L': '#66cc1e', 'D': '#3a870a' });
                break;
            case 'birch_planks':
                this.paint(ctx, [
                    "SSSSSSSSSSSSSSSS", "LLLLLLLLLLLLLLLL", "LLmLLLLLLLLLLmLL", "LLLLLLmLLLLLLLLL",
                    "SSSSSSSSSSSSSSSS", "LLLLLLLLLLLLLLLL", "LLLLLmLLLLLLmLLL", "LmLLLLLLLLLLLLLL",
                    "SSSSSSSSSSSSSSSS", "LLLLLLLLLLLLLLLL", "LLmLLLLLLmLLLLLL", "LLLLLLLLLLLLLLmL",
                    "SSSSSSSSSSSSSSSS", "LLLLLLLLLLLLLLLL", "LLLLmLLLLLLLLLLL", "LLLLLLLLmLLLLmLL"
                ], { 'S': '#a69268', 'L': '#ede4c7', 'm': '#dfd4b3' });
                break;
            case 'acacia_log_side':
                this.paint(ctx, [
                    "ggdgggggdgggggdg", "ggdgggggdgggggdg", "ggdgdgggdgggggdg", "gdggdgggggdgggdg",
                    "gdggdgggggdgggdg", "gdggggdgggdgggdg", "gdggggdgggdggggg", "ggggggdgggdggggg",
                    "ggggggdggggdgggg", "dgggggdggggdgggg", "dgggggdggggdggdg", "dggggggggggdggdg",
                    "dggdgggggggdggdg", "gggdgggggggdgggg", "gggdggdggggdgggg", "gggdggdggggggggg"
                ], { 'g': '#68645f', 'd': '#4f4c49' });
                break;
            case 'acacia_log_top':
                this.paint(ctx, [
                    "gggggggggggggggg", "gggggggggggggggg", "ggOOooOOOOooOOgg", "ggOooDDDDDDooOgg",
                    "ggOoDDooooDDdOgg", "ggOoDoOOOOoDdOgg", "ggOoDoODDOoDdOgg", "ggOoDoODDOoDdOgg",
                    "ggOoDoOOOOoDdOgg", "ggOoDDooooDDdOgg", "ggOooDDDDDDooOgg", "ggOOooOOOOooOOgg",
                    "gggggggggggggggg", "gggggggggggggggg", "gggggggggggggggg", "gggggggggggggggg"
                ], { 'g': '#5f5b56', 'O': '#cb7342', 'o': '#ba6333', 'D': '#9a4c22', 'd': '#843e18' });
                break;
            case 'acacia_leaves':
                this.paint(ctx, [
                    "GGDDGGGGGGDDGGDG", "GDGGDDGGGDGGDDGD", "GGDDGGDDDGGGGDDD", "DDGGGDGGDDGGDDGG",
                    "GGDDGGGGGGDDGGGG", "GDGGDDGGGGGGDDGG", "GGGGGDDDGGGGDDGG", "DDGGGGGGDDGGGGDD",
                    "GGDDGGGGGGDDGGDG", "GDGGDDGGGDGGDDGD", "GGDDGGDDDGGGGDDD", "DDGGGDGGDDGGDDGG",
                    "GGDDGGGGGGDDGGGG", "GDGGDDGGGGGGDDGG", "GGGGGDDDGGGGDDGG", "DDGGGGGGDDGGGGDD"
                ], { 'G': '#647e38', 'D': '#4a5f27' });
                break;
            case 'acacia_planks':
                this.paint(ctx, [
                    "SSSSSSSSSSSSSSSS", "OOOOOOOOOOOOOOOO", "OOmOOOOOOOOOOmOO", "OOOOOOmOOOOOOOOO",
                    "SSSSSSSSSSSSSSSS", "OOOOOOOOOOOOOOOO", "OOOOOmOOOOOOmOOO", "OmOOOOOOOOOOOOOO",
                    "SSSSSSSSSSSSSSSS", "OOOOOOOOOOOOOOOO", "OOmOOOOOOmOOOOOO", "OOOOOOOOOOOOOOmO",
                    "SSSSSSSSSSSSSSSS", "OOOOOOOOOOOOOOOO", "OOOOmOOOOOOOOOOO", "OOOOOOOOOmOOOOOO"
                ], { 'S': '#894118', 'O': '#ba6333', 'm': '#a95529' });
                break;
            case 'dark_oak_log_side':
                this.paint(ctx, [
                    "bbdbbbbbdbbbbbdb", "bbdbbbbbdbbbbbdb", "bbdbdbbbdbbbbbdb", "bdbbdbbbbbdbbbdb",
                    "bdbbdbbbbbdbbbdb", "bdbbbbdbbbdbbbdb", "bdbbbbdbbbdbbbbb", "bbbbbbdbbbdbbbbb",
                    "bbbbbbdbbbbdbbbb", "dbbbbbdbbbbdbbbb", "dbbbbbdbbbbdbbdb", "dbbbbbbbbbbdbbdb",
                    "dbbdbbbbbbbdbbdb", "bbbdbbbbbbbdbbbb", "bbbdbbdbbbbdbbbb", "bbbdbbdbbbbbbbbb"
                ], { 'b': '#3d2b1c', 'd': '#281b10' });
                break;
            case 'dark_oak_log_top':
                this.paint(ctx, [
                    "bbbbbbbbbbbbbbbb", "bbbbbbbbbbbbbbbb", "bbDDddDDDDddDDbb", "bbDddBBBBBBddDbb",
                    "bbDdBBddddBBxDbb", "bbDdBDDDDDDdxDbb", "bbDdBDBBDBDdxDbb", "bbDdBDBBDBDdxDbb",
                    "bbDdBDDDDDDdxDbb", "bbDdBBddddBBxDbb", "bbDddBBBBBBddDbb", "bbDDddDDDDddDDbb",
                    "bbbbbbbbbbbbbbbb", "bbbbbbbbbbbbbbbb", "bbbbbbbbbbbbbbbb", "bbbbbbbbbbbbbbbb"
                ], { 'b': '#2c1e13', 'D': '#523a23', 'd': '#432e1a', 'B': '#352414', 'x': '#25180c' });
                break;
            case 'dark_oak_leaves':
                this.paint(ctx, [
                    "GGDDGGGGGGDDGGDG", "GDGGDDGGGDGGDDGD", "GGDDGGDDDGGGGDDD", "DDGGGDGGDDGGDDGG",
                    "GGDDGGGGGGDDGGGG", "GDGGDDGGGGGGDDGG", "GGGGGDDDGGGGDDGG", "DDGGGGGGDDGGGGDD",
                    "GGDDGGGGGGDDGGDG", "GDGGDDGGGDGGDDGD", "GGDDGGDDDGGGGDDD", "DDGGGDGGDDGGDDGG",
                    "GGDDGGGGGGDDGGGG", "GDGGDDGGGGGGDDGG", "GGGGGDDDGGGGDDGG", "DDGGGGGGDDGGGGDD"
                ], { 'G': '#244517', 'D': '#162e0c' });
                break;
            case 'dark_oak_planks':
                this.paint(ctx, [
                    "SSSSSSSSSSSSSSSS", "DDDDDDDDDDDDDDDD", "DDmDDDDDDDDDDmDD", "DDDDDDmDDDDDDDDD",
                    "SSSSSSSSSSSSSSSS", "DDDDDDDDDDDDDDDD", "DDDDDmDDDDDDmDDD", "DmDDDDDDDDDDDDDD",
                    "SSSSSSSSSSSSSSSS", "DDDDDDDDDDDDDDDD", "DDmDDDDDDmDDDDDD", "DDDDDDDDDDDDDDmD",
                    "SSSSSSSSSSSSSSSS", "DDDDDDDDDDDDDDDD", "DDDDmDDDDDDDDDDD", "DDDDDDDDmDDDDDDD"
                ], { 'S': '#26190e', 'D': '#432f1d', 'm': '#352415' });
                break;
            case 'snow_block':
                this.paint(ctx, [
                    "WWWWWWWWWWWWWWWW", "WWWWbWWWWWWWWbWW", "WWWbbWWWWWWWWbWW", "WWWWWWWWsWWWWWWW",
                    "WWWWWWWWWWWWWWWW", "WWbWWWWWWWWbWWWW", "WbbWWWWWWWWbbWWW", "WWWWWWsWWWWWWWWW",
                    "WWWWWWWWWWWWWWWW", "WWWWWWWWWWbWWWWW", "WWsWWWWWWWbbWWWW", "WWWWWWWWWWWWWWWW",
                    "WWWWbWWWWWWWWsWW", "WWWbbWWWWWWWWWWW", "WWWWWWWWWWWWWWWW", "WWWWWWWWWWWWWWWW"
                ], { 'W': '#ffffff', 'b': '#e4f0fa', 's': '#c6dff5' });
                break;
            case 'bucket':
                this.paint(ctx, [
                    "................", "...SS......SS...", "...SH......HS...", "...SHI....IHS...",
                    "...SHIIIIIIHS...", "...SHssssssHS...", "....HssssssH....", "....HssssssH....",
                    "....HssssssH....", ".....HssssH.....", ".....HssssH.....", "......HHHH......",
                    ".......HH.......", "................", "................", "................"
                ], { 'S': '#202226', 'H': '#ffffff', 'I': '#d4dbe4', 's': '#808996' });
                break;
            case 'water_bucket':
                this.paint(ctx, [
                    "................", "...SS......SS...", "...SH......HS...", "...SHWWWWWwHS...",
                    "...SHWBBBBwHS...", "...SHWBBBBwHS...", "....HWBBBBwH....", "....HWBBBBwH....",
                    "....HWBBBBwH....", ".....HWBBwH.....", ".....HWBBwH.....", "......HHHH......",
                    ".......HH.......", "................", "................", "................"
                ], { 'S': '#202226', 'H': '#ffffff', 'W': '#8ad8ff', 'B': '#1882ff', 'w': '#0055cc' });
                break;
            case 'bone':
                this.paint(ctx, [
                    ".............BB.", "............BBBB", "............BBB.", "...........BBB..",
                    "..........BBB...", ".........BBB....", "........BBB.....", ".......BBB......",
                    "......BBB.......", ".....BBB........", "....BBB.........", "...BBB..........",
                    "..BBB...........", ".BBB............", "BBBB............", ".BB............."
                ], { 'B': '#eef2f5' });
                break;
            case 'raw_beef':
                this.paint(ctx, [
                    "................", "....FFFFFFFF....", "...FRRRRRRRRF...", "..FRRRRRRRRRRF..",
                    ".FRRRRFFFFRRRRF.", ".FRRRFFFFFFRRRF.", ".FRRFFFFFFFFRRF.", ".FRRFFFFFFFFRRF.",
                    ".FRRRFFFFFFRRRF.", ".FRRRRFFFFRRRRF.", "..FRRRRRRRRRRF..", "...FRRRRRRRRF...",
                    "....FRRRRRRF....", ".....FRRRRF.....", "......FFFF......", "................"
                ], { 'F': '#fff1df', 'R': '#d62424' });
                break;
            case 'raw_porkchop':
                this.paint(ctx, [
                    "................", "....FFFFFFFF....", "...FPPPPPPPPF...", "..FPPPPPPPPPPF..",
                    ".FPPPPBBPPPPPPF.", ".FPPPBBBBPPPPPF.", ".FPPPPBBPPPPPPF.", ".FPPPPPPPPPPPPF.",
                    ".FPPPPPPPPPPPPF.", "..FPPPPPPPPPPF..", "...FPPPPPPPPF...", "....FFFFFFFF....",
                    "................", "................", "................", "................"
                ], { 'F': '#fff5eb', 'P': '#f58b99', 'B': '#ffffff' });
                break;
            case 'raw_chicken':
                this.paint(ctx, [
                    "................", ".......CCCC.....", "......CCCCCC....", ".....CCCCCCCC...",
                    "....CCCCCCCCCC..", "...CCCCCCCCCCC..", "...CCCCCCCCCCC..", "....CCCCCCCCCC..",
                    ".....CCCCCCCCC..", "......CCCCCC....", ".......BB.......", ".......BB.......",
                    "......BBBB......", "................", "................", "................"
                ], { 'C': '#f3ba89', 'B': '#fffaea' });
                break;
            case 'feather':
                this.paint(ctx, [
                    "..............WW", ".............WWW", "............WWWW", "...........WWWW.",
                    "..........WWWW..", ".........WWWW...", "........WWWW....", ".......WWWW.....",
                    "......WWWW......", ".....WWWW.......", "....WWWW........", "...WWWW.........",
                    "..QQWW..........", ".QQQ............", "QQ..............", "................"
                ], { 'W': '#ffffff', 'Q': '#a4b1c2' });
                break;
            case 'rotten_flesh':
                this.paint(ctx, [
                    "................", "....GGGGGGGG....", "...GKKKKKKKKG...", "..GKKKGGGGKKKG..",
                    ".GKKGGGGGGGGKKG.", ".GKGKKKKKKKKGKG.", ".GKGKGGGGGGKGKG.", ".GKGKGKKKKGKGKG.",
                    ".GKGKGKKKKGKGKG.", ".GKGKGGGGGGKGKG.", ".GKGKKKKKKKKGKG.", ".GKKGGGGGGGGKKG.",
                    "..GKKKGGGGKKKG..", "...GKKKKKKKKG...", "....GGGGGGGG....", "................"
                ], { 'G': '#7a8e3b', 'K': '#485622' });
                break;
            case 'oak_door_item':
                this.paint(ctx, [
                    "....SSSSSSSS....", "....SOOOOOOS....", "....SOGGGGIS....", "....SOGGGGIS....",
                    "....SOOOOOOS....", "....SOGGGGIS....", "....SOGGGGIS....", "....SOOOHOOS....",
                    "....SSSSSSSS....", "....SOOOOOOS....", "....SOIIIIOS....", "....SOIIIIOS....",
                    "....SOOOOOOS....", "....SOIIIIOS....", "....SOOOOOOS....", "....SSSSSSSS...."
                ], { 'S': '#4e331b', 'O': '#91693e', 'G': '#334455', 'I': '#704f2d', 'H': '#222222' });
                break;
            case 'oak_door_top':
                this.paint(ctx, [
                    "SSSSSSSSSSSSSSSS", "SOOOOOOOOOOOOOOS", "SOOGGGGISOGGGGIS", "SOOGGGGISOGGGGIS",
                    "SOOGGGGISOGGGGIS", "SOOGGGGISOGGGGIS", "SOOOOOOOOOOOOOOS", "SOOGGGGISOGGGGIS",
                    "SOOGGGGISOGGGGIS", "SOOGGGGISOGGGGIS", "SOOGGGGISOGGGGIS", "SOOOOOOOOOOOOOOS",
                    "SOOOOOOOOOOOOHOS", "SOOOOOOOOOOOOOOS", "SSSSSSSSSSSSSSSS", "SSSSSSSSSSSSSSSS"
                ], { 'S': '#4e331b', 'O': '#91693e', 'G': '#334455', 'I': '#704f2d', 'H': '#111111' });
                break;
            case 'oak_door_bottom':
                this.paint(ctx, [
                    "SSSSSSSSSSSSSSSS", "SOOOOOOOOOOOOOOS", "SOOIIIIIIIIIIOOS", "SOOIIIIIIIIIIOOS",
                    "SOOIIIIIIIIIIOOS", "SOOOOOOOOOOOOOOS", "SOOOOOOOOOOOOOOS", "SOOIIIIIIIIIIOOS",
                    "SOOIIIIIIIIIIOOS", "SOOIIIIIIIIIIOOS", "SOOIIIIIIIIIIOOS", "SOOOOOOOOOOOOOOS",
                    "SOOIIIIIIIIIIOOS", "SOOIIIIIIIIIIOOS", "SOOOOOOOOOOOOOOS", "SSSSSSSSSSSSSSSS"
                ], { 'S': '#4e331b', 'O': '#91693e', 'I': '#704f2d' });
                break;
            case 'birch_door_item':
            case 'birch_door_top':
                this.paint(ctx, [
                    "SSSSSSSSSSSSSSSS", "SBBBBBBBBBBBBBBS", "SBBGGBBBGGBBGGBB", "SBBGGBBBGGBBGGBB",
                    "SBBGGBBBGGBBGGBB", "SBBGGBBBGGBBGGBB", "SBBBBBBBBBBBBBBS", "SBBGGBBBGGBBGGBB",
                    "SBBGGBBBGGBBGGBB", "SBBGGBBBGGBBGGBB", "SBBBBBBBBBBBBHBS", "SBBBBBBBBBBBBBBS",
                    "SBBGGGGGGGGGGBBS", "SBBBBBBBBBBBBBBS", "SSSSSSSSSSSSSSSS", "SSSSSSSSSSSSSSSS"
                ], { 'S': '#9c8c67', 'B': '#dcd1b6', 'G': '#334455', 'H': '#222222' });
                break;
            case 'birch_door_bottom':
                this.paint(ctx, [
                    "SSSSSSSSSSSSSSSS", "SBBBBBBBBBBBBBBS", "SBBggggggggggBBS", "SBBggggggggggBBS",
                    "SBBBBBBBBBBBBBBS", "SBBggggggggggBBS", "SBBggggggggggBBS", "SBBBBBBBBBBBBBBS",
                    "SBBggggggggggBBS", "SBBggggggggggBBS", "SBBBBBBBBBBBBBBS", "SBBggggggggggBBS",
                    "SBBggggggggggBBS", "SBBBBBBBBBBBBBBS", "SBBBBBBBBBBBBBBS", "SSSSSSSSSSSSSSSS"
                ], { 'S': '#9c8c67', 'B': '#dcd1b6', 'g': '#c0b497' });
                break;
            case 'dark_oak_door_item':
            case 'dark_oak_door_top':
                this.paint(ctx, [
                    "SSSSSSSSSSSSSSSS", "SDDDDDDDDDDDDDDS", "SDDGGGGDDGGGGDDD", "SDDGGGGDDGGGGDDD",
                    "SDDGGGGDDGGGGDDD", "SDDDDDDDDDDDDDDS", "SDDGGGGDDGGGGDDD", "SDDGGGGDDGGGGDDD",
                    "SDDGGGGDDGGGGDDD", "SDDDDDDDDDDDDHDS", "SDDDDDDDDDDDDDDS", "SDDDDDDDDDDDDDDS",
                    "SDDDDDDDDDDDDDDS", "SDDDDDDDDDDDDDDS", "SSSSSSSSSSSSSSSS", "SSSSSSSSSSSSSSSS"
                ], { 'S': '#26190e', 'D': '#432f1d', 'G': '#334455', 'H': '#000000' });
                break;
            case 'dark_oak_door_bottom':
                this.paint(ctx, [
                    "SSSSSSSSSSSSSSSS", "SDDDDDDDDDDDDDDS", "SDDmmmmmmmmmmDDS", "SDDmmmmmmmmmmDDS",
                    "SDDDDDDDDDDDDDDS", "SDDDDDDDDDDDDDDS", "SDDmmmmmmmmmmDDS", "SDDmmmmmmmmmmDDS",
                    "SDDDDDDDDDDDDDDS", "SDDDDDDDDDDDDDDS", "SDDmmmmmmmmmmDDS", "SDDmmmmmmmmmmDDS",
                    "SDDDDDDDDDDDDDDS", "SDDDDDDDDDDDDDDS", "SDDDDDDDDDDDDDDS", "SSSSSSSSSSSSSSSS"
                ], { 'S': '#26190e', 'D': '#432f1d', 'm': '#312214' });
                break;
            case 'iron_door_item':
            case 'iron_door_top':
                this.paint(ctx, [
                    "SSSSSSSSSSSSSSSS", "SMMMMMMMMMMMMMMS", "SMMMMMMGGMMMMMMS", "SMMMMMMGGMMMMMMS",
                    "SMMMMMMGGMMMMMMS", "SMMMMMMMMMMMMMMS", "SMMMMMMMMMMMMMMS", "SMMMMMMGGMMMMMMS",
                    "SMMMMMMGGMMMMMMS", "SMMMMMMGGMMMMMMS", "SMMMMMMMMMMMMMMS", "SMMMMMMMMMMMMMMS",
                    "SMMMMMMMMMMMMMMS", "SMMMMMMMMMMMMMMS", "SSSSSSSSSSSSSSSS", "SSSSSSSSSSSSSSSS"
                ], { 'S': '#555555', 'M': '#cccccc', 'G': '#334455' });
                break;
            case 'iron_door_bottom':
                this.paint(ctx, [
                    "SSSSSSSSSSSSSSSS", "SMMMMMMMMMMMMMMS", "SMMmmmmmmmmmmMMS", "SMMmmmmmmmmmmMMS",
                    "SMMMMMMMMMMMMMMS", "SMMMMMMMMMMMMMMS", "SMMmmmmmmmmmmMMS", "SMMmmmmmmmmmmMMS",
                    "SMMMMMMMMMMMMMMS", "SMMMMMMMMMMMMMMS", "SMMmmmmmmmmmmMMS", "SMMmmmmmmmmmmMMS",
                    "SMMMMMMMMMMMMMMS", "SMMMMMMMMMMMMMMS", "SMMMMMMMMMMMMMMS", "SSSSSSSSSSSSSSSS"
                ], { 'S': '#555555', 'M': '#cccccc', 'm': '#a8a8a8' });
                break;
            case 'oak_trapdoor':
                this.paint(ctx, [
                    "SSSSSSSSSSSSSSSS", "SOOOOOOSSOOOOOOS", "SOIIIIOSSOIIIIOS", "SOIIIIOSSOIIIIOS",
                    "SOIIIIOSSOIIIIOS", "SOOOOOOSSOOOOOOS", "SSSSSSSSSSSSSSSS", "SSSSSSSSSSSSSSSS",
                    "SOOOOOOSSOOOOOOS", "SOIIIIOSSOIIIIOS", "SOIIIIOSSOIIIIOS", "SOIIIIOSSOIIIIOS",
                    "SOOOOOOSSOOOOOOS", "SSSSSSSSSSSSSSSS", "SSSSSSSSSSSSSSSS", "SSSSSSSSSSSSSSSS"
                ], { 'S': '#4e331b', 'O': '#91693e', 'I': '#704f2d' });
                break;
            case 'birch_trapdoor':
                this.paint(ctx, [
                    "SSSSSSSSSSSSSSSS", "SBBBBBBBBBBBBBBS", "SBBggBBggBBggBBS", "SBBggBBggBBggBBS",
                    "SBBggBBggBBggBBS", "SBBBBBBBBBBBBBBS", "SBBBBBBBBBBBBBBS", "SBBggBBggBBggBBS",
                    "SBBggBBggBBggBBS", "SBBggBBggBBggBBS", "SBBBBBBBBBBBBBBS", "SBBggBBggBBggBBS",
                    "SBBggBBggBBggBBS", "SBBBBBBBBBBBBBBS", "SSSSSSSSSSSSSSSS", "SSSSSSSSSSSSSSSS"
                ], { 'S': '#9c8c67', 'B': '#dcd1b6', 'g': '#334455' });
                break;
            default:
                ctx.fillStyle = '#ff00ff';
                ctx.fillRect(0, 0, 16, 16);
                ctx.fillStyle = '#000000';
                ctx.fillRect(0, 0, 8, 8);
                ctx.fillRect(8, 8, 8, 8);
                break;
        }
    }
}

class LumiBenchStudio {
    constructor() {
        this.painter = new ProceduralPainter();

        this.activeModule = {
            id: 'source',
            name: 'LumiBox Core Resources',
            version: '1.0.0',
            atlas: 'source-atlas.png',
            tileSize: 16,
            atlasSize: 256,
            textures: {},
            blocks: [...CANONICAL_BLOCKS],
            items: [...CANONICAL_ITEMS],
            recipes: {
                crafting: [
                    { result: { id: 11, count: 4 }, pattern: [[6]] },
                    { result: { id: 102, count: 4 }, pattern: [[11], [11]] },
                    { result: { id: 16, count: 1 }, pattern: [[11, 11], [11, 11]] },
                    { result: { id: 17, count: 1 }, pattern: [[3, 3, 3], [3, 0, 3], [3, 3, 3]] },
                    { result: { id: 200, count: 1 }, pattern: [[11, 11, 11], [0, 102, 0], [0, 102, 0]] },
                    { result: { id: 201, count: 1 }, pattern: [[11, 11, 0], [11, 102, 0], [0, 102, 0]] },
                    { result: { id: 202, count: 1 }, pattern: [[0, 11, 0], [0, 102, 0], [0, 102, 0]] },
                    { result: { id: 203, count: 1 }, pattern: [[3, 3, 3], [0, 102, 0], [0, 102, 0]] },
                    { result: { id: 204, count: 1 }, pattern: [[3, 3, 0], [3, 102, 0], [0, 102, 0]] },
                    { result: { id: 205, count: 1 }, pattern: [[0, 3, 0], [0, 102, 0], [0, 102, 0]] },
                    { result: { id: 206, count: 1 }, pattern: [[101, 101, 101], [0, 102, 0], [0, 102, 0]] },
                    { result: { id: 207, count: 1 }, pattern: [[101, 101, 0], [101, 102, 0], [0, 102, 0]] },
                    { result: { id: 208, count: 1 }, pattern: [[0, 101, 0], [0, 102, 0], [0, 102, 0]] },
                    { result: { id: 30, count: 4 }, pattern: [[28]] },
                    { result: { id: 33, count: 4 }, pattern: [[31]] },
                    { result: { id: 36, count: 4 }, pattern: [[34]] },
                    { result: { id: 43, count: 4 }, pattern: [[100], [102]] },
                    { result: { id: 107, count: 1 }, pattern: [[101, 0, 101], [0, 101, 0]] },
                    { result: { id: 103, count: 3 }, pattern: [[11, 11], [11, 11], [11, 11]] },
                    { result: { id: 104, count: 3 }, pattern: [[30, 30], [30, 30], [30, 30]] },
                    { result: { id: 105, count: 3 }, pattern: [[36, 36], [36, 36], [36, 36]] },
                    { result: { id: 106, count: 3 }, pattern: [[101, 101], [101, 101], [101, 101]] },
                    { result: { id: 41, count: 2 }, pattern: [[11, 11, 11], [11, 11, 11]] },
                    { result: { id: 42, count: 2 }, pattern: [[30, 30, 30], [30, 30, 30]] }
                ],
                smelting: { "12": 10, "3": 2, "6": 100, "9": 101 },
                fuels: { "6": 300, "11": 300, "16": 300, "28": 300, "30": 300, "31": 300, "33": 300, "34": 300, "36": 300, "41": 300, "42": 300, "100": 1600, "102": 100, "103": 300, "104": 300, "105": 300, "200": 200, "201": 200, "202": 200 }
            }
        };

        this.atlasCanvas = document.createElement('canvas');
        this.atlasCanvas.width = 256;
        this.atlasCanvas.height = 256;
        this.atlasCtx = this.atlasCanvas.getContext('2d', { willReadFrequently: true });
        this.atlasCtx.imageSmoothingEnabled = false;

        this.textureGrids = {};

        this.activeElement = null;
        this.activeFace = 'all';

        this.history = [];
        this.historyIndex = -1;

        this.currentTool = 'brush';
        this.currentColor = '#737987';
        this.isDrawing = false;
        this.shapeStartX = 0;
        this.shapeStartY = 0;

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.transformControls = null;
        this.gridHelper = null;
        this.modelGroup = new THREE.Group();
        this.cubes = [];
        this.selectedCubeId = null;
        this.wireframeMode = false;
        this.currentGizmoMode = 'translate';

        this.init();
    }

    createEmptyGrid(fillColor = null) {
        return Array(16).fill(null).map(() => Array(16).fill(fillColor));
    }

    async init() {
        this.init3D();
        this.initDOM();
        this.init2DCanvas();
        this.initPalettes();
        this.initPanelResizers();
        this.initContextMenuAndToasts();
        await this.loadInitialPack();
        this.showMainMenu();
    }

    showMainMenu() {
        const menu = document.getElementById('main-menu-overlay');
        if (menu) {
            menu.style.display = 'flex';
            setTimeout(() => menu.style.opacity = '1', 10);
        }
    }

    hideMainMenu() {
        const menu = document.getElementById('main-menu-overlay');
        if (menu) {
            menu.style.opacity = '0';
            setTimeout(() => menu.style.display = 'none', 300);
        }
    }

    initPanelResizers() {
        const makeResizable = (resizerId, targetPanelId, isLeft) => {
            const resizer = document.getElementById(resizerId);
            const panel = document.getElementById(targetPanelId);
            if (!resizer || !panel) return;

            let startX = 0;
            let startWidth = 0;

            const onMouseMove = (e) => {
                const delta = isLeft ? (e.clientX - startX) : (startX - e.clientX);
                const newWidth = Math.max(160, Math.min(500, startWidth + delta));
                panel.style.width = `${newWidth}px`;
                this.onResize();
            };

            const onMouseUp = () => {
                resizer.classList.remove('dragging');
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);
            };

            resizer.addEventListener('mousedown', (e) => {
                e.preventDefault();
                startX = e.clientX;
                startWidth = panel.getBoundingClientRect().width;
                resizer.classList.add('dragging');
                window.addEventListener('mousemove', onMouseMove);
                window.addEventListener('mouseup', onMouseUp);
            });
        };

        makeResizable('resizer-left', 'panel-left', true);
        makeResizable('resizer-right', 'panel-right', false);

        const midResizer = document.getElementById('resizer-mid');
        const view3d = document.getElementById('container-3d');
        if (midResizer && view3d) {
            let startX = 0;
            let startFlex = 0;

            const onMouseMove = (e) => {
                const delta = e.clientX - startX;
                const newWidth = Math.max(200, startFlex + delta);
                view3d.style.flex = `0 0 ${newWidth}px`;
                this.onResize();
            };

            const onMouseUp = () => {
                midResizer.classList.remove('dragging');
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);
            };

            midResizer.addEventListener('mousedown', (e) => {
                e.preventDefault();
                startX = e.clientX;
                startFlex = view3d.getBoundingClientRect().width;
                midResizer.classList.add('dragging');
                window.addEventListener('mousemove', onMouseMove);
                window.addEventListener('mouseup', onMouseUp);
            });
        }
    }

    showToast(message, type = 'info', duration = 2500) {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        const icons = { info: 'ℹ️', success: '✅', error: '❌', warning: '⚠️' };
        toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 250);
        }, duration);
    }

    showPrompt(title, label, defaultValue, onConfirm) {
        const backdrop = document.getElementById('custom-dialog-backdrop');
        const dTitle = document.getElementById('dialog-title');
        const inputCont = document.getElementById('dialog-input-container');
        const inputLabel = document.getElementById('dialog-input-label');
        const inputField = document.getElementById('dialog-input-field');

        dTitle.textContent = title;
        inputCont.style.display = 'block';
        inputLabel.textContent = label;
        inputField.value = defaultValue || '';
        backdrop.style.display = 'flex';

        setTimeout(() => inputField.focus(), 50);

        const confirmBtn = document.getElementById('dialog-confirm-btn');
        const cancelBtn = document.getElementById('dialog-cancel-btn');
        const closeBtn = document.getElementById('dialog-close-btn');

        const cleanup = () => {
            backdrop.style.display = 'none';
            confirmBtn.onclick = null;
            cancelBtn.onclick = null;
            closeBtn.onclick = null;
        };

        confirmBtn.onclick = () => {
            const val = inputField.value.trim();
            cleanup();
            if (onConfirm) onConfirm(val);
        };
        cancelBtn.onclick = cleanup;
        closeBtn.onclick = cleanup;
    }

    showConfirm(title, message, onConfirm) {
        const backdrop = document.getElementById('custom-dialog-backdrop');
        const dTitle = document.getElementById('dialog-title');
        const dMsg = document.getElementById('dialog-message');
        const inputCont = document.getElementById('dialog-input-container');

        dTitle.textContent = title;
        dMsg.textContent = message;
        inputCont.style.display = 'none';
        backdrop.style.display = 'flex';

        const confirmBtn = document.getElementById('dialog-confirm-btn');
        const cancelBtn = document.getElementById('dialog-cancel-btn');
        const closeBtn = document.getElementById('dialog-close-btn');

        const cleanup = () => {
            backdrop.style.display = 'none';
            confirmBtn.onclick = null;
            cancelBtn.onclick = null;
            closeBtn.onclick = null;
        };

        confirmBtn.onclick = () => {
            cleanup();
            if (onConfirm) onConfirm();
        };
        cancelBtn.onclick = cleanup;
        closeBtn.onclick = cleanup;
    }

    initContextMenuAndToasts() {
        const menu = document.getElementById('custom-context-menu');
        window.addEventListener('click', () => {
            if (menu) menu.style.display = 'none';
        });

        window.addEventListener('contextmenu', (e) => {
            const cubeEl = e.target.closest('.cube-item');
            if (cubeEl) {
                e.preventDefault();
                const cubeId = cubeEl.dataset.id;
                this.selectCube(cubeId);
                this.showCubeContextMenu(e.clientX, e.clientY, cubeId);
            }
        });
    }

    showCubeContextMenu(x, y, cubeId) {
        const cube = this.cubes.find(c => c.id === cubeId);
        if (!cube) return;

        const menu = document.getElementById('custom-context-menu');
        menu.innerHTML = '';
        menu.style.left = `${Math.min(window.innerWidth - 200, x)}px`;
        menu.style.top = `${Math.min(window.innerHeight - 220, y)}px`;
        menu.style.display = 'block';

        const isShared = (cube.textureMode === 'shared');

        const itemToggle = document.createElement('div');
        itemToggle.className = 'context-menu-item';
        itemToggle.innerHTML = isShared
            ? `<span>🎨</span><span>Сделать текстуру уникальной</span>`
            : `<span>🔗</span><span>Включить повторение (Общая)</span>`;
        itemToggle.onclick = () => {
            this.toggleCubeTextureMode(cube.id);
            menu.style.display = 'none';
        };
        menu.appendChild(itemToggle);

        const divider = document.createElement('div');
        divider.className = 'context-menu-divider';
        menu.appendChild(divider);

        const itemDup = document.createElement('div');
        itemDup.className = 'context-menu-item';
        itemDup.innerHTML = `<span>📋</span><span>Дублировать куб</span>`;
        itemDup.onclick = () => {
            this.duplicateCube();
            menu.style.display = 'none';
        };
        menu.appendChild(itemDup);

        const itemRename = document.createElement('div');
        itemRename.className = 'context-menu-item';
        itemRename.innerHTML = `<span>✏️</span><span>Переименовать...</span>`;
        itemRename.onclick = () => {
            this.showPrompt('Переименование куба', 'Новое имя:', cube.name, (newName) => {
                if (newName) {
                    cube.name = newName;
                    this.renderCubeHierarchy();
                    this.selectCube(cube.id);
                    this.showToast(`Куб переименован в "${newName}"`, 'success');
                }
            });
            menu.style.display = 'none';
        };
        menu.appendChild(itemRename);

        const itemDel = document.createElement('div');
        itemDel.className = 'context-menu-item';
        itemDel.innerHTML = `<span>🗑️</span><span>Удалить куб</span>`;
        itemDel.onclick = () => {
            this.deleteCube(cube.id);
            menu.style.display = 'none';
        };
        menu.appendChild(itemDel);
    }

    bakeAtlasAndManifest() {
        const modId = this.activeModule.id || 'source';
        this.atlasCtx.clearRect(0, 0, 256, 256);

        const textureCoordinates = {};
        const allocatedGridPositions = new Set();

        for (const [key, slot] of Object.entries(CANONICAL_SLOTS)) {
            textureCoordinates[key] = [...slot];
            allocatedGridPositions.add(`${slot[0]},${slot[1]}`);
        }

        let nextTx = 3;
        let nextTy = 5;
        const getNextFreeSlot = () => {
            while (allocatedGridPositions.has(`${nextTx},${nextTy}`)) {
                nextTx++;
                if (nextTx >= 16) {
                    nextTx = 0;
                    nextTy++;
                }
            }
            const slot = [nextTx, nextTy];
            allocatedGridPositions.add(`${nextTx},${nextTy}`);
            return slot;
        };

        for (const key of Object.keys(this.textureGrids)) {
            if (!textureCoordinates[key]) {
                textureCoordinates[key] = getNextFreeSlot();
            }
        }

        for (const [key, grid] of Object.entries(this.textureGrids)) {
            const coords = textureCoordinates[key];
            if (!coords) continue;
            const [tx, ty] = coords;

            for (let y = 0; y < 16; y++) {
                if (!grid[y]) continue;
                for (let x = 0; x < 16; x++) {
                    const color = grid[y][x];
                    if (color) {
                        this.atlasCtx.fillStyle = color;
                        this.atlasCtx.fillRect(tx * 16 + x, ty * 16 + y, 1, 1);
                    }
                }
            }
        }

        this.activeModule.textures = textureCoordinates;
        this.activeModule.atlas = `${modId}-atlas.png`;
    }

    getOrInitTextureGrid(cleanKey) {
        if (this.textureGrids[cleanKey]) {
            return this.textureGrids[cleanKey];
        }

        const grid = this.createEmptyGrid();
        const coords = this.activeModule.textures[cleanKey] || CANONICAL_SLOTS[cleanKey];

        if (coords) {
            const [tx, ty] = coords;
            const imgData = this.atlasCtx.getImageData(tx * 16, ty * 16, 16, 16).data;
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const idx = (y * 16 + x) * 4;
                    if (imgData[idx + 3] > 10) {
                        const r = imgData[idx].toString(16).padStart(2, '0');
                        const g = imgData[idx + 1].toString(16).padStart(2, '0');
                        const b = imgData[idx + 2].toString(16).padStart(2, '0');
                        grid[y][x] = `#${r}${g}${b}`;
                    }
                }
            }
        } else {
            const temp = document.createElement('canvas');
            temp.width = temp.height = 16;
            const tempCtx = temp.getContext('2d');
            this.painter.renderToCanvas(cleanKey, tempCtx);
            const imgData = tempCtx.getImageData(0, 0, 16, 16).data;
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const idx = (y * 16 + x) * 4;
                    if (imgData[idx + 3] > 10) {
                        const r = imgData[idx].toString(16).padStart(2, '0');
                        const g = imgData[idx + 1].toString(16).padStart(2, '0');
                        const b = imgData[idx + 2].toString(16).padStart(2, '0');
                        grid[y][x] = `#${r}${g}${b}`;
                    }
                }
            }
        }

        this.textureGrids[cleanKey] = grid;
        return grid;
    }

    async loadInitialPack() {
        const temp = document.createElement('canvas');
        temp.width = temp.height = 16;
        const tempCtx = temp.getContext('2d');

        for (const key of Object.keys(CANONICAL_SLOTS)) {
            tempCtx.clearRect(0, 0, 16, 16);
            this.painter.renderToCanvas(key, tempCtx);
            const grid = this.createEmptyGrid();
            const imgData = tempCtx.getImageData(0, 0, 16, 16).data;
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const idx = (y * 16 + x) * 4;
                    if (imgData[idx + 3] > 10) {
                        const r = imgData[idx].toString(16).padStart(2, '0');
                        const g = imgData[idx + 1].toString(16).padStart(2, '0');
                        const b = imgData[idx + 2].toString(16).padStart(2, '0');
                        grid[y][x] = `#${r}${g}${b}`;
                    }
                }
            }
            this.textureGrids[key] = grid;
        }

        this.bakeAtlasAndManifest();
        this.renderElementsList();
        const first = this.activeModule.blocks[1] || this.activeModule.blocks[0];
        if (first) this.selectElement(first);
    }

    renderElementsList(filter = '') {
        const list = document.getElementById('asset-list');
        if (!list) return;
        list.innerHTML = '';

        const all = [
            ...this.activeModule.blocks.map(b => ({ ...b, isItem: false })),
            ...this.activeModule.items.map(it => ({ ...it, isItem: true }))
        ];

        all.filter(el => el.name.toLowerCase().includes(filter) || String(el.id).includes(filter)).forEach(el => {
            const itemDiv = document.createElement('div');
            itemDiv.className = `asset-item ${this.activeElement && this.activeElement.id === el.id ? 'selected' : ''}`;

            const iconCanvas = document.createElement('canvas');
            iconCanvas.width = iconCanvas.height = 16;
            iconCanvas.className = 'asset-icon';
            this.drawTileToCanvas(el, iconCanvas);

            const label = document.createElement('span');
            label.textContent = `${el.name} (${el.id})`;

            itemDiv.appendChild(iconCanvas);
            itemDiv.appendChild(label);
            itemDiv.onclick = () => this.selectElement(el);
            list.appendChild(itemDiv);
        });
    }

    drawTileToCanvas(el, canvas) {
        let texKey = typeof el.texture === 'object' ? (el.texture.front || el.texture.side || el.texture.top) : el.texture;
        const clean = (texKey || '').replace(/^source:/, '').replace(/^gen:/, '');
        const coords = this.activeModule.textures[clean] || CANONICAL_SLOTS[clean];
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, 16, 16);

        if (coords) {
            ctx.drawImage(this.atlasCanvas, coords[0] * 16, coords[1] * 16, 16, 16, 0, 0, 16, 16);
        } else {
            ctx.fillStyle = el.isItem ? '#3b82f6' : '#737987';
            ctx.fillRect(0, 0, 16, 16);
        }
    }

    saveCurrentStateToElement() {
        if (this.activeElement) {
            this.activeElement.modelCubes = this.cubes.map(c => ({
                id: c.id,
                name: c.name,
                pos: [...c.pos],
                size: [...c.size],
                rot: [...c.rot],
                textureMode: c.textureMode,
                uniqueKeys: c.uniqueKeys ? JSON.parse(JSON.stringify(c.uniqueKeys)) : null
            }));
        }
    }

    selectElement(el) {
        this.saveCurrentStateToElement();

        this.activeElement = el;
        this.renderElementsList();

        const modelType = el.isPlant ? 'plant' : (el.isItem ? 'item' : 'cube');

        if (el.modelCubes && el.modelCubes.length > 0) {
            this.restoreCubes(el.modelCubes);
        } else {
            this.resetToDefaultCube(modelType);
        }

        const cleanMainKey = (typeof el.texture === 'object' ? (el.texture.front || el.texture.side) : el.texture).replace(/^source:/, '').replace(/^gen:/, '');
        this.getOrInitTextureGrid(cleanMainKey);

        this.selectCube(this.cubes[0] ? this.cubes[0].id : null);
        this.renderGrid();
        this.update3DTextures();
    }

    restoreCubes(cubesData) {
        if (this.transformControls) this.transformControls.detach();
        while (this.modelGroup.children.length > 0) {
            const obj = this.modelGroup.children[0];
            this.modelGroup.remove(obj);
            if (obj.geometry) obj.geometry.dispose();
        }
        this.cubes = [];
        
        cubesData.forEach(data => {
            this.addCubeData(data);
        });
        
        this.renderCubeHierarchy();
    }

    init3D() {
        const host = document.getElementById('threejs-canvas-host');
        if (!host) return;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x151518);
        this.camera = new THREE.PerspectiveCamera(45, host.clientWidth / host.clientHeight, 0.1, 100);
        this.camera.position.set(2.5, 2.5, 3.5);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(host.clientWidth, host.clientHeight);
        host.appendChild(this.renderer.domElement);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.target.set(0, 0.5, 0);

        this.transformControls = new TransformControls(this.camera, this.renderer.domElement);
        this.transformControls.size = 0.75;
        this.transformControls.setTranslationSnap(0.0625);
        this.transformControls.setScaleSnap(0.0625);
        this.transformControls.setRotationSnap(THREE.MathUtils.degToRad(15));
        this.scene.add(this.transformControls);

        this.transformControls.addEventListener('dragging-changed', (event) => {
            this.controls.enabled = !event.value;
            if (!event.value) {
                const cube = this.cubes.find(c => c.id === this.selectedCubeId);
                if (cube && this.currentGizmoMode === 'scale') {
                    this.bakeScaleToGeometry(cube);
                }
            }
        });

        this.transformControls.addEventListener('change', () => {
            const cube = this.cubes.find(c => c.id === this.selectedCubeId);
            if (!cube) return;

            if (this.currentGizmoMode === 'translate') {
                cube.pos = [
                    parseFloat(cube.mesh.position.x.toFixed(3)),
                    parseFloat(cube.mesh.position.y.toFixed(3)),
                    parseFloat(cube.mesh.position.z.toFixed(3))
                ];
                document.getElementById('prop-pos-x').value = cube.pos[0];
                document.getElementById('prop-pos-y').value = cube.pos[1];
                document.getElementById('prop-pos-z').value = cube.pos[2];
            } else if (this.currentGizmoMode === 'rotate') {
                cube.rot = [
                    Math.round(THREE.MathUtils.radToDeg(cube.mesh.rotation.x)),
                    Math.round(THREE.MathUtils.radToDeg(cube.mesh.rotation.y)),
                    Math.round(THREE.MathUtils.radToDeg(cube.mesh.rotation.z))
                ];
                document.getElementById('prop-rot-x').value = cube.rot[0];
                document.getElementById('prop-rot-y').value = cube.rot[1];
                document.getElementById('prop-rot-z').value = cube.rot[2];
            } else if (this.currentGizmoMode === 'scale') {
                const curW = Math.max(0.01, parseFloat((cube.size[0] * cube.mesh.scale.x).toFixed(3)));
                const curH = Math.max(0.01, parseFloat((cube.size[1] * cube.mesh.scale.y).toFixed(3)));
                const curD = Math.max(0.01, parseFloat((cube.size[2] * cube.mesh.scale.z).toFixed(3)));
                document.getElementById('prop-size-x').value = curW;
                document.getElementById('prop-size-y').value = curH;
                document.getElementById('prop-size-z').value = curD;
            }
        });

        this.scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.2));
        const dl = new THREE.DirectionalLight(0xffffff, 1.5);
        dl.position.set(5, 10, 7);
        this.scene.add(dl);

        this.gridHelper = new THREE.GridHelper(10, 10, 0x3b82f6, 0x333340);
        this.scene.add(this.gridHelper);
        this.scene.add(this.modelGroup);

        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        this.renderer.domElement.addEventListener('pointerdown', (e) => {
            if (e.button !== 0 || this.transformControls.dragging) return;
            const rect = this.renderer.domElement.getBoundingClientRect();
            mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
            raycaster.setFromCamera(mouse, this.camera);
            const intersects = raycaster.intersectObjects(this.modelGroup.children);

            if (intersects.length > 0) {
                const hit = intersects[0];
                this.selectCube(hit.object.userData.id);

                if (hit.faceIndex !== undefined) {
                    const faceIdx = Math.floor(hit.faceIndex / 2);
                    const faceMap = ['side', 'side', 'top', 'bottom', 'front', 'side'];
                    const targetFace = faceMap[faceIdx] || 'all';
                    this.switchFaceTab(targetFace);
                }
            }
        });

        const loop = () => {
            requestAnimationFrame(loop);
            this.controls.update();
            this.renderer.render(this.scene, this.camera);
        };
        loop();
    }

    setGizmoMode(mode) {
        this.currentGizmoMode = mode;
        ['translate', 'scale', 'rotate'].forEach(m => {
            const btn = document.getElementById(`btn-gizmo-${m}`);
            if (btn) btn.classList.toggle('active', mode === m);
        });

        const offBtn = document.getElementById('btn-gizmo-off');
        if (offBtn) offBtn.classList.toggle('active', mode === 'off');

        if (mode === 'off') {
            this.transformControls.detach();
        } else {
            this.transformControls.setMode(mode);
            const cube = this.cubes.find(c => c.id === this.selectedCubeId);
            if (cube) {
                this.transformControls.attach(cube.mesh);
            }
        }
    }

    bakeScaleToGeometry(cube) {
        const newW = Math.max(0.01, parseFloat((cube.size[0] * cube.mesh.scale.x).toFixed(3)));
        const newH = Math.max(0.01, parseFloat((cube.size[1] * cube.mesh.scale.y).toFixed(3)));
        const newD = Math.max(0.01, parseFloat((cube.size[2] * cube.mesh.scale.z).toFixed(3)));

        cube.size = [newW, newH, newD];
        cube.mesh.geometry.dispose();
        cube.mesh.geometry = new THREE.BoxGeometry(newW, newH, newD);
        cube.mesh.scale.set(1, 1, 1);

        document.getElementById('prop-size-x').value = newW;
        document.getElementById('prop-size-y').value = newH;
        document.getElementById('prop-size-z').value = newD;

        this.update3DTextures();
    }

    onResize() {
        const host = document.getElementById('threejs-canvas-host');
        if (!host || !this.renderer) return;
        this.camera.aspect = host.clientWidth / host.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(host.clientWidth, host.clientHeight);
    }

    resetToDefaultCube(type = 'cube') {
        if (this.transformControls) this.transformControls.detach();
        while (this.modelGroup.children.length > 0) {
            const obj = this.modelGroup.children[0];
            this.modelGroup.remove(obj);
            if (obj.geometry) obj.geometry.dispose();
        }
        this.cubes = [];

        if (type === 'cube') {
            this.addCubeData({ id: 'c0', name: 'Main Block', pos: [0, 0.5, 0], size: [1, 1, 1], rot: [0, 0, 0], textureMode: 'shared' });
        } else if (type === 'plant') {
            this.addCubeData({ id: 'p1', name: 'Cross 1', pos: [0, 0.5, 0], size: [1, 1, 0.02], rot: [0, 45, 0], textureMode: 'shared' });
            this.addCubeData({ id: 'p2', name: 'Cross 2', pos: [0, 0.5, 0], size: [1, 1, 0.02], rot: [0, -45, 0], textureMode: 'shared' });
        } else {
            this.addCubeData({ id: 'i0', name: 'Item', pos: [0, 0.5, 0], size: [0.75, 0.75, 0.06], rot: [0, 0, 0], textureMode: 'shared' });
        }

        this.selectCube(this.cubes[0].id);
        this.renderCubeHierarchy();
    }

    addNewCube() {
        const id = 'cube_' + Date.now();
        this.addCubeData({
            id,
            name: `Cube ${this.cubes.length + 1}`,
            pos: [0, 0.5, 0],
            size: [0.5, 0.5, 0.5],
            rot: [0, 0, 0],
            textureMode: 'shared'
        });
        this.selectCube(id);
        this.renderCubeHierarchy();
        this.showToast('Добавлен новый куб', 'info');
    }

    duplicateCube() {
        const cube = this.cubes.find(c => c.id === this.selectedCubeId);
        if (!cube) return;

        const id = 'cube_' + Date.now();
        this.addCubeData({
            id,
            name: `${cube.name}_copy`,
            pos: [cube.pos[0] + 0.1, cube.pos[1] + 0.1, cube.pos[2] + 0.1],
            size: [...cube.size],
            rot: [...cube.rot],
            textureMode: cube.textureMode,
            uniqueKeys: cube.uniqueKeys ? { ...cube.uniqueKeys } : null
        });
        this.selectCube(id);
        this.renderCubeHierarchy();
        this.showToast(`Куб "${cube.name}" продублирован`, 'success');
    }

    addCubeData(data) {
        const geo = new THREE.BoxGeometry(...data.size);
        const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: 0xffffff, wireframe: this.wireframeMode }));
        mesh.position.set(...data.pos);
        mesh.rotation.set(
            THREE.MathUtils.degToRad(data.rot[0]),
            THREE.MathUtils.degToRad(data.rot[1]),
            THREE.MathUtils.degToRad(data.rot[2])
        );
        mesh.userData = { id: data.id };
        this.modelGroup.add(mesh);

        const cubeData = {
            ...data,
            mesh,
            textureMode: data.textureMode || 'shared',
            uniqueKeys: data.uniqueKeys || null
        };

        this.cubes.push(cubeData);
        this.updateCubeMaterial(cubeData);
    }

    selectCube(id) {
        this.selectedCubeId = id;
        const cube = this.cubes.find(c => c.id === id);
        if (!cube) return;

        document.getElementById('prop-name').value = cube.name;
        document.getElementById('prop-pos-x').value = cube.pos[0];
        document.getElementById('prop-pos-y').value = cube.pos[1];
        document.getElementById('prop-pos-z').value = cube.pos[2];
        document.getElementById('prop-size-x').value = cube.size[0];
        document.getElementById('prop-size-y').value = cube.size[1];
        document.getElementById('prop-size-z').value = cube.size[2];
        document.getElementById('prop-rot-x').value = cube.rot[0];
        document.getElementById('prop-rot-y').value = cube.rot[1];
        document.getElementById('prop-rot-z').value = cube.rot[2];

        const scopeCubeName = document.getElementById('scope-cube-name');
        const scopeModeTag = document.getElementById('scope-mode-tag');
        if (scopeCubeName && scopeModeTag) {
            if (cube.textureMode === 'shared') {
                scopeCubeName.textContent = `Общая текстура (${this.activeElement ? this.activeElement.name : 'Элемент'})`;
                scopeModeTag.className = 'badge-tag';
                scopeModeTag.textContent = '🔗 Повторяется';
            } else {
                scopeCubeName.textContent = `Куб: ${cube.name}`;
                scopeModeTag.className = 'badge-tag unique';
                scopeModeTag.textContent = '🎨 Уникальная';
            }
        }

        if (this.currentGizmoMode !== 'off') {
            this.transformControls.attach(cube.mesh);
        }

        this.renderCubeHierarchy();
        this.renderGrid();
        this.generateCodeOutput();
    }

    renderCubeHierarchy() {
        const list = document.getElementById('cube-list');
        if (!list) return;
        list.innerHTML = '';
        this.cubes.forEach(c => {
            const el = document.createElement('div');
            el.className = `cube-item ${c.id === this.selectedCubeId ? 'selected' : ''}`;
            el.dataset.id = c.id;

            const isShared = (c.textureMode === 'shared');
            const badgeClass = isShared ? 'shared' : 'unique';
            const badgeIcon = isShared ? '🔗' : '🎨';

            el.innerHTML = `
                <div style="display: flex; align-items: center; gap: 4px;">
                    <span class="cube-badge ${badgeClass}" title="${isShared ? 'Общая текстура' : 'Уникальная текстура'}">${badgeIcon}</span>
                    <span>📦 ${c.name}</span>
                </div>
                <div class="cube-actions">
                    <button class="icon-btn-small" data-action="toggle-mode" title="${isShared ? 'Сделать текстуру уникальной' : 'Включить повторение'}">${badgeIcon}</button>
                    <button class="icon-btn-small" data-action="del" title="Удалить">❌</button>
                </div>
            `;

            el.onclick = (e) => {
                if (e.target.dataset.action === 'del') {
                    this.deleteCube(c.id);
                } else if (e.target.dataset.action === 'toggle-mode') {
                    this.toggleCubeTextureMode(c.id);
                } else {
                    this.selectCube(c.id);
                }
            };

            list.appendChild(el);
        });
    }

    toggleCubeTextureMode(cubeId) {
        const cube = this.cubes.find(c => c.id === cubeId);
        if (!cube) return;

        const cleanEntityName = (this.activeElement ? this.activeElement.name : 'mod').toLowerCase().replace(/ /g, '_');
        const cleanCubeName = cube.name.toLowerCase().replace(/ /g, '_');

        if (cube.textureMode === 'shared') {
            cube.textureMode = 'unique';
            cube.uniqueKeys = {
                all: `${cleanEntityName}_${cleanCubeName}_all`,
                top: `${cleanEntityName}_${cleanCubeName}_top`,
                bottom: `${cleanEntityName}_${cleanCubeName}_bottom`,
                front: `${cleanEntityName}_${cleanCubeName}_front`,
                side: `${cleanEntityName}_${cleanCubeName}_side`
            };

            const sharedKeys = this.getFaceTextureKeysForElement(this.activeElement);
            this.textureGrids[cube.uniqueKeys.all] = this.getOrInitTextureGrid(sharedKeys.all).map(r => [...r]);
            this.textureGrids[cube.uniqueKeys.top] = this.getOrInitTextureGrid(sharedKeys.top).map(r => [...r]);
            this.textureGrids[cube.uniqueKeys.bottom] = this.getOrInitTextureGrid(sharedKeys.bottom).map(r => [...r]);
            this.textureGrids[cube.uniqueKeys.front] = this.getOrInitTextureGrid(sharedKeys.front).map(r => [...r]);
            this.textureGrids[cube.uniqueKeys.side] = this.getOrInitTextureGrid(sharedKeys.side).map(r => [...r]);

            this.showToast(`Для "${cube.name}" создана уникальная разметка.`, 'warning');
        } else {
            cube.textureMode = 'shared';
            cube.uniqueKeys = null;
            this.showToast(`Для "${cube.name}" включено повторение общей текстуры.`, 'info');
        }

        this.bakeAtlasAndManifest();
        this.renderCubeHierarchy();
        this.selectCube(cube.id);
        this.update3DTextures();
    }

    deleteCube(id) {
        if (this.cubes.length <= 1) {
            this.showToast('Модель должна содержать хотя бы 1 куб!', 'error');
            return;
        }

        const cube = this.cubes.find(c => c.id === id);
        this.showConfirm('Удаление куба', `Удалить куб "${cube ? cube.name : id}"?`, () => {
            const idx = this.cubes.findIndex(c => c.id === id);
            if (idx !== -1) {
                if (this.selectedCubeId === id) this.transformControls.detach();
                this.modelGroup.remove(this.cubes[idx].mesh);
                this.cubes[idx].mesh.geometry.dispose();
                this.cubes.splice(idx, 1);
                this.selectCube(this.cubes[0].id);
                this.renderCubeHierarchy();
                this.showToast('Куб удален', 'info');
            }
        });
    }

    bindPropertyInputs() {
        const update = () => {
            const cube = this.cubes.find(c => c.id === this.selectedCubeId);
            if (!cube) return;

            cube.name = document.getElementById('prop-name').value;
            cube.pos = [
                parseFloat(document.getElementById('prop-pos-x').value) || 0,
                parseFloat(document.getElementById('prop-pos-y').value) || 0,
                parseFloat(document.getElementById('prop-pos-z').value) || 0
            ];
            cube.size = [
                Math.max(0.01, parseFloat(document.getElementById('prop-size-x').value) || 0.1),
                Math.max(0.01, parseFloat(document.getElementById('prop-size-y').value) || 0.1),
                Math.max(0.01, parseFloat(document.getElementById('prop-size-z').value) || 0.1)
            ];
            cube.rot = [
                parseFloat(document.getElementById('prop-rot-x').value) || 0,
                parseFloat(document.getElementById('prop-rot-y').value) || 0,
                parseFloat(document.getElementById('prop-rot-z').value) || 0
            ];

            cube.mesh.geometry.dispose();
            cube.mesh.geometry = new THREE.BoxGeometry(cube.size[0], cube.size[1], cube.size[2]);
            cube.mesh.position.set(...cube.pos);
            cube.mesh.rotation.set(
                THREE.MathUtils.degToRad(cube.rot[0]),
                THREE.MathUtils.degToRad(cube.rot[1]),
                THREE.MathUtils.degToRad(cube.rot[2])
            );

            this.renderCubeHierarchy();
            this.generateCodeOutput();
        };

        const ids = [
            'prop-name', 'prop-pos-x', 'prop-pos-y', 'prop-pos-z',
            'prop-size-x', 'prop-size-y', 'prop-size-z',
            'prop-rot-x', 'prop-rot-y', 'prop-rot-z'
        ];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.oninput = update;
        });
    }

    getFaceTextureKeysForElement(el) {
        if (!el) return { all: 'stone', top: 'stone', bottom: 'stone', front: 'stone', side: 'stone' };
        const rawTex = el.texture;
        if (typeof rawTex === 'object' && rawTex !== null) {
            const top = (rawTex.top || '').replace(/^source:/, '').replace(/^gen:/, '');
            const bottom = (rawTex.bottom || rawTex.top || '').replace(/^source:/, '').replace(/^gen:/, '');
            const front = (rawTex.front || rawTex.side || '').replace(/^source:/, '').replace(/^gen:/, '');
            const side = (rawTex.side || front).replace(/^source:/, '').replace(/^gen:/, '');
            return { all: front, top, bottom, front, side };
        } else {
            const single = (rawTex || el.name).replace(/^source:/, '').replace(/^gen:/, '');
            return { all: single, top: single, bottom: single, front: single, side: single };
        }
    }

    getActiveEditingGrid() {
        const cube = this.cubes.find(c => c.id === this.selectedCubeId) || this.cubes[0];
        let key = '';

        if (cube && cube.textureMode === 'unique' && cube.uniqueKeys) {
            key = cube.uniqueKeys[this.activeFace] || cube.uniqueKeys.all;
        } else {
            const keys = this.getFaceTextureKeysForElement(this.activeElement);
            key = keys[this.activeFace] || keys.all;
        }

        return this.getOrInitTextureGrid(key);
    }

    init2DCanvas() {
        const gridEl = document.getElementById('pixel-grid');
        if (!gridEl) return;
        gridEl.innerHTML = '';

        for (let y = 0; y < 16; y++) {
            for (let x = 0; x < 16; x++) {
                const cell = document.createElement('div');
                cell.className = 'pixel';
                cell.dataset.x = x;
                cell.dataset.y = y;

                cell.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    this.isDrawing = true;
                    this.shapeStartX = x;
                    this.shapeStartY = y;
                    this.applyTool(x, y);
                });

                cell.addEventListener('mouseenter', () => {
                    const coordLabel = document.getElementById('pixel-coord-label');
                    if (coordLabel) coordLabel.textContent = `X: ${x} Y: ${y}`;
                    if (this.isDrawing) this.applyTool(x, y);
                });

                gridEl.appendChild(cell);
            }
        }

        window.addEventListener('mouseup', () => {
            if (this.isDrawing) {
                this.isDrawing = false;
                this.saveHistoryState();
            }
        });
    }

    applyTool(x, y) {
        const currentGrid = this.getActiveEditingGrid();

        if (this.currentTool === 'picker') {
            const picked = currentGrid[y][x];
            if (picked) {
                this.currentColor = picked;
                document.getElementById('picker-color').value = picked;
                document.getElementById('color-hex-label').textContent = picked;
            }
            this.setTool('brush');
            return;
        }

        if (this.currentTool === 'bucket') {
            this.floodFill(x, y, currentGrid[y][x], this.currentColor);
            this.renderGrid();
            this.update3DTextures();
            return;
        }

        if (this.currentTool === 'brush' || this.currentTool === 'eraser') {
            const color = (this.currentTool === 'eraser') ? null : this.currentColor;
            currentGrid[y][x] = color;
            this.updatePixelDOM(x, y, color);
            this.update3DTextures();
            return;
        }

        if (this.currentTool === 'line') {
            this.renderGrid();
            this.drawLine(this.shapeStartX, this.shapeStartY, x, y, this.currentColor);
            this.update3DTextures();
        } else if (this.currentTool === 'rect') {
            this.renderGrid();
            this.drawRect(this.shapeStartX, this.shapeStartY, x, y, this.currentColor);
            this.update3DTextures();
        }
    }

    drawLine(x0, y0, x1, y1, color) {
        const currentGrid = this.getActiveEditingGrid();
        const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
        const sx = (x0 < x1) ? 1 : -1, sy = (y0 < y1) ? 1 : -1;
        let err = dx - dy;

        while (true) {
            currentGrid[y0][x0] = color;
            this.updatePixelDOM(x0, y0, color);
            if (x0 === x1 && y0 === y1) break;
            const e2 = 2 * err;
            if (e2 > -dy) { err -= dy; x0 += sx; }
            if (e2 < dx) { err += dx; y0 += sy; }
        }
    }

    drawRect(x0, y0, x1, y1, color) {
        const currentGrid = this.getActiveEditingGrid();
        const minX = Math.min(x0, x1), maxX = Math.max(x0, x1);
        const minY = Math.min(y0, y1), maxY = Math.max(y0, y1);

        for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
                currentGrid[y][x] = color;
                this.updatePixelDOM(x, y, color);
            }
        }
    }

    floodFill(x, y, targetColor, replaceColor) {
        if (targetColor === replaceColor) return;
        const grid = this.getActiveEditingGrid();
        if (grid[y][x] !== targetColor) return;

        const queue = [[x, y]];
        while (queue.length > 0) {
            const [cx, cy] = queue.pop();
            if (cx < 0 || cx >= 16 || cy < 0 || cy >= 16) continue;
            if (grid[cy][cx] === targetColor) {
                grid[cy][cx] = replaceColor;
                queue.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
            }
        }
    }

    setTool(tool) {
        this.currentTool = tool;
        document.querySelectorAll('.toolbar-2d .tool-btn').forEach(b => b.classList.remove('active'));
        const btn = document.getElementById(`tool-${tool}`);
        if (btn) btn.classList.add('active');
    }

    updatePixelDOM(x, y, color) {
        const gridEl = document.getElementById('pixel-grid');
        if (!gridEl) return;
        const cell = gridEl.children[y * 16 + x];
        if (cell) cell.style.backgroundColor = color || 'transparent';
        this.updatePreviews();
    }

    renderGrid() {
        const currentGrid = this.getActiveEditingGrid();
        for (let y = 0; y < 16; y++) {
            for (let x = 0; x < 16; x++) {
                this.updatePixelDOM(x, y, currentGrid[y][x]);
            }
        }
        this.updatePreviews();
    }

    createCanvasFromGrid(grid) {
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, 16, 16);

        if (grid) {
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    if (grid[y] && grid[y][x]) {
                        ctx.fillStyle = grid[y][x];
                        ctx.fillRect(x, y, 1, 1);
                    }
                }
            }
        }
        return canvas;
    }

    updateCubeMaterial(cube) {
        const isUnique = (cube.textureMode === 'unique' && cube.uniqueKeys);
        const keys = isUnique ? cube.uniqueKeys : this.getFaceTextureKeysForElement(this.activeElement);

        const topGrid = this.getOrInitTextureGrid(keys.top || keys.all);
        const btmGrid = this.getOrInitTextureGrid(keys.bottom || keys.all);
        const frontGrid = this.getOrInitTextureGrid(keys.front || keys.all);
        const sideGrid = this.getOrInitTextureGrid(keys.side || keys.all);

        const createTex = (grid) => {
            const cv = this.createCanvasFromGrid(grid);
            const t = new THREE.CanvasTexture(cv);
            t.magFilter = THREE.NearestFilter;
            t.minFilter = THREE.NearestFilter;
            return t;
        };

        cube.mesh.material = [
            new THREE.MeshLambertMaterial({ map: createTex(sideGrid), transparent: true, alphaTest: 0.1, wireframe: this.wireframeMode }),
            new THREE.MeshLambertMaterial({ map: createTex(sideGrid), transparent: true, alphaTest: 0.1, wireframe: this.wireframeMode }),
            new THREE.MeshLambertMaterial({ map: createTex(topGrid), transparent: true, alphaTest: 0.1, wireframe: this.wireframeMode }),
            new THREE.MeshLambertMaterial({ map: createTex(btmGrid), transparent: true, alphaTest: 0.1, wireframe: this.wireframeMode }),
            new THREE.MeshLambertMaterial({ map: createTex(frontGrid), transparent: true, alphaTest: 0.1, wireframe: this.wireframeMode }),
            new THREE.MeshLambertMaterial({ map: createTex(sideGrid), transparent: true, alphaTest: 0.1, wireframe: this.wireframeMode })
        ];
    }

    update3DTextures() {
        this.bakeAtlasAndManifest();
        this.cubes.forEach(c => this.updateCubeMaterial(c));
        this.generateCodeOutput();
    }

    updatePreviews() {
        const p16 = document.getElementById('prev-16');
        const p64 = document.getElementById('prev-64');
        if (!p16 || !p64) return;

        const prev16 = p16.getContext('2d');
        const prev64 = p64.getContext('2d');
        const cv = this.createCanvasFromGrid(this.getActiveEditingGrid());

        prev16.imageSmoothingEnabled = false;
        prev64.imageSmoothingEnabled = false;

        prev16.clearRect(0, 0, 16, 16);
        prev64.clearRect(0, 0, 64, 64);

        prev16.drawImage(cv, 0, 0);
        prev64.drawImage(cv, 0, 0, 64, 64);
    }

    initPalettes() {
        const container = document.getElementById('palette-swatches');
        if (!container) return;

        const render = (palKey) => {
            container.innerHTML = '';
            PALETTES[palKey].forEach(col => {
                const swatch = document.createElement('div');
                swatch.className = 'swatch';
                swatch.style.backgroundColor = col;
                swatch.onclick = () => {
                    this.currentColor = col;
                    document.getElementById('picker-color').value = col;
                    document.getElementById('color-hex-label').textContent = col;
                };
                container.appendChild(swatch);
            });
        };

        document.querySelectorAll('.pal-tab').forEach(tab => {
            tab.onclick = () => {
                document.querySelectorAll('.pal-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                render(tab.dataset.pal);
            };
        });

        document.getElementById('btn-add-current-color').onclick = () => {
            if (!PALETTES.custom.includes(this.currentColor)) {
                PALETTES.custom.push(this.currentColor);
                document.querySelector('.pal-tab[data-pal="custom"]').click();
                this.showToast(`Цвет ${this.currentColor} добавлен в палитру`, 'success');
            }
        };

        render('stone');
    }

    saveHistoryState() {
        const snapshot = JSON.stringify({
            textureGrids: this.textureGrids,
            cubes: this.cubes.map(c => ({
                id: c.id,
                name: c.name,
                pos: c.pos,
                size: c.size,
                rot: c.rot,
                textureMode: c.textureMode,
                uniqueKeys: c.uniqueKeys
            }))
        });

        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }
        this.history.push(snapshot);
        this.historyIndex++;
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.restoreHistoryState(this.history[this.historyIndex]);
            this.showToast('Отмена действия', 'info', 1000);
        }
    }

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.restoreHistoryState(this.history[this.historyIndex]);
            this.showToast('Повтор действия', 'info', 1000);
        }
    }

    restoreHistoryState(snapshotJson) {
        const data = JSON.parse(snapshotJson);
        if (data.textureGrids) this.textureGrids = data.textureGrids;

        if (Array.isArray(data.cubes)) {
            data.cubes.forEach(savedCube => {
                const existing = this.cubes.find(c => c.id === savedCube.id);
                if (existing) {
                    existing.textureMode = savedCube.textureMode;
                    existing.uniqueKeys = savedCube.uniqueKeys;
                    existing.pos = savedCube.pos;
                    existing.size = savedCube.size;
                    existing.rot = savedCube.rot;
                    existing.mesh.position.set(...existing.pos);
                    existing.mesh.rotation.set(
                        THREE.MathUtils.degToRad(existing.rot[0]),
                        THREE.MathUtils.degToRad(existing.rot[1]),
                        THREE.MathUtils.degToRad(existing.rot[2])
                    );
                }
            });
        }

        this.renderCubeHierarchy();
        this.renderGrid();
        this.update3DTextures();
    }

    gridToInstruction(grid) {
        const charSet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%&*";
        const colorToChar = {};
        const charToColor = {};
        let charIndex = 0;

        for (let y = 0; y < 16; y++) {
            for (let x = 0; x < 16; x++) {
                const col = grid ? grid[y][x] : null;
                if (col && !colorToChar[col]) {
                    const char = charSet[charIndex++];
                    colorToChar[col] = char;
                    charToColor[char] = col;
                }
            }
        }

        const rows = [];
        for (let y = 0; y < 16; y++) {
            let rowStr = "";
            for (let x = 0; x < 16; x++) {
                const col = grid ? grid[y][x] : null;
                rowStr += col ? colorToChar[col] : " ";
            }
            rows.push(rowStr);
        }

        return { map: rows, palette: charToColor };
    }

    generateCodeOutput() {
        const codeBox = document.getElementById('code-output');
        if (!codeBox) return;
        const { map, palette } = this.gridToInstruction(this.getActiveEditingGrid());
        const rows = map.map(r => `    "${r}"`).join(',\n');
        const palEntries = Object.entries(palette).map(([char, col]) => `    '${char}': '${col}'`).join(',\n');
        codeBox.value = `this.paint(ctx, [\n${rows}\n], {\n${palEntries}\n});`;
    }

    createNewAssetWizard() {
        this.showPrompt('Создание сущности', 'Системное имя (например, ruby_ore):', '', (name) => {
            if (!name) return;
            const cleanName = name.toLowerCase().trim().replace(/ /g, '_');

            this.showConfirm('Тип сущности', `Это предмет (в руках/инвентаре) или воксельный блок?\n\nНажмите "ОК" для ПРЕДМЕТА, "Отмена" для БЛОКА.`, () => {
                this.registerNewEntity(cleanName, true);
            });
            document.getElementById('dialog-cancel-btn').onclick = () => {
                document.getElementById('custom-dialog-backdrop').style.display = 'none';
                this.registerNewEntity(cleanName, false);
            };
        });
    }

    registerNewEntity(cleanName, isItem) {
        const nextId = Math.max(
            ...this.activeModule.blocks.map(b => b.id),
            ...this.activeModule.items.map(i => i.id),
            0
        ) + 1;

        this.textureGrids[cleanName] = this.createEmptyGrid(isItem ? '#3b82f6' : '#737987');

        const newEntry = isItem ? {
            id: nextId,
            name: cleanName,
            isItem: true,
            texture: `${this.activeModule.id}:${cleanName}`,
            modelCubes: []
        } : {
            id: nextId,
            name: cleanName,
            isSolid: true,
            isTransparent: false,
            texture: `${this.activeModule.id}:${cleanName}`,
            modelCubes: []
        };

        if (isItem) {
            this.activeModule.items.push(newEntry);
        } else {
            this.activeModule.blocks.push(newEntry);
        }

        this.bakeAtlasAndManifest();
        this.renderElementsList();
        this.selectElement(newEntry);
        this.showToast(`Создан [${cleanName}] (ID: ${nextId})`, 'success');
    }

    async exportZipPackage() {
        if (!window.JSZip) {
            this.showToast('Библиотека JSZip не загружена!', 'error');
            return;
        }

        this.saveCurrentStateToElement();
        this.bakeAtlasAndManifest();
        
        const zip = new JSZip();
        const modId = this.activeModule.id || 'source';

        zip.file(`${modId}.lumibench`, JSON.stringify(this.activeModule, null, 2));

        const atlasBlob = await new Promise(resolve => this.atlasCanvas.toBlob(resolve, 'image/png'));
        zip.file(`${modId}-atlas.png`, atlasBlob);

        const content = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = `${modId}.zip`;
        link.click();
        this.showToast(`Пакет [${modId}.zip] успешно собран!`, 'success');
    }

    async importZipPackage(file) {
        if (!window.JSZip) {
            this.showToast('Библиотека JSZip не загружена!', 'error');
            return;
        }

        try {
            const zip = await JSZip.loadAsync(file);

            let manifestFile = Object.values(zip.files).find(f => f.name.endsWith('.lumibench') || f.name.endsWith('.json'));
            if (!manifestFile) throw new Error('В архиве не найден .lumibench или .json манифест!');

            const jsonText = await manifestFile.async('text');
            const modData = JSON.parse(jsonText);

            let atlasFile = Object.values(zip.files).find(f => f.name.endsWith('.png'));
            if (atlasFile) {
                const imgBlob = await atlasFile.async('blob');
                const img = await this.loadImage(URL.createObjectURL(imgBlob));
                this.atlasCtx.clearRect(0, 0, 256, 256);
                this.atlasCtx.drawImage(img, 0, 0, 256, 256);
            }

            this.activeModule = modData;
            this.textureGrids = {};

            for (const [key, coords] of Object.entries(modData.textures || {})) {
                this.getOrInitTextureGrid(key);
            }

            this.renderElementsList();

            const first = (modData.blocks && modData.blocks[0]) || (modData.items && modData.items[0]);
            if (first) this.selectElement(first);

            this.hideMainMenu();
            this.showToast(`Модуль [${modData.name || modData.id}] загружен!`, 'success');
        } catch (e) {
            this.showToast('Ошибка импорта ZIP: ' + e.message, 'error');
        }
    }

    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }

    switchFaceTab(faceName) {
        const tab = document.querySelector(`.face-tab[data-face="${faceName}"]`);
        if (tab) tab.click();
    }

    initDOM() {
        const btnNewMod = () => {
            this.showConfirm('Новый модуль', 'Создать новый пустой модуль? Несохраненные изменения будут сброшены.', () => {
                this.activeModule = {
                    id: 'mod_' + Date.now(),
                    name: 'New Custom Mod',
                    version: '1.0.0',
                    atlas: 'custom-atlas.png',
                    tileSize: 16,
                    atlasSize: 256,
                    textures: { "custom_block": [0, 0] },
                    blocks: [{ id: 300, name: 'custom_block', isSolid: true, isTransparent: false, texture: 'custom_block', modelCubes: [] }],
                    items: [],
                    recipes: { crafting: [], smelting: {}, fuels: {} }
                };
                this.atlasCtx.clearRect(0, 0, 256, 256);
                this.textureGrids = {};
                this.renderElementsList();
                this.selectElement(this.activeModule.blocks[0]);
                this.hideMainMenu();
                this.showToast('Создан новый проект модуля', 'success');
            });
        };

        const btnOpenZip = () => document.getElementById('file-project-input').click();

        document.getElementById('btn-new-mod').onclick = btnNewMod;
        document.getElementById('menu-btn-new').onclick = btnNewMod;
        
        document.getElementById('btn-open-zip').onclick = btnOpenZip;
        document.getElementById('menu-btn-open').onclick = btnOpenZip;

        document.getElementById('menu-btn-continue').onclick = () => this.hideMainMenu();
        document.getElementById('header-logo-btn').onclick = () => this.showMainMenu();

        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const mode = btn.dataset.mode;
                const ws = document.getElementById('workspace');
                ws.className = `workspace mode-${mode}`;
                this.onResize();
            };
        });

        document.getElementById('btn-gizmo-translate').onclick = () => this.setGizmoMode('translate');
        document.getElementById('btn-gizmo-scale').onclick = () => this.setGizmoMode('scale');
        document.getElementById('btn-gizmo-rotate').onclick = () => this.setGizmoMode('rotate');
        document.getElementById('btn-gizmo-off').onclick = () => this.setGizmoMode('off');

        const bindTool = (id, tool) => {
            const btn = document.getElementById(id);
            if (btn) btn.onclick = () => this.setTool(tool);
        };
        bindTool('tool-brush', 'brush');
        bindTool('tool-line', 'line');
        bindTool('tool-rect', 'rect');
        bindTool('tool-bucket', 'bucket');
        bindTool('tool-picker', 'picker');
        bindTool('tool-eraser', 'eraser');

        document.getElementById('tool-clear').onclick = () => {
            this.showConfirm('Очистка', 'Очистить текущий холст?', () => {
                const targetGrid = this.getActiveEditingGrid();
                for (let y = 0; y < 16; y++) {
                    for (let x = 0; x < 16; x++) targetGrid[y][x] = null;
                }
                this.renderGrid();
                this.update3DTextures();
                this.saveHistoryState();
                this.showToast('Холст очищен', 'info');
            });
        };

        document.getElementById('tool-undo').onclick = () => this.undo();
        document.getElementById('tool-redo').onclick = () => this.redo();

        const colorInput = document.getElementById('picker-color');
        const colorLabel = document.getElementById('color-hex-label');
        if (colorInput) {
            colorInput.oninput = (e) => {
                this.currentColor = e.target.value;
                if (colorLabel) colorLabel.textContent = this.currentColor;
            };
        }

        document.querySelectorAll('.face-tab').forEach(tab => {
            tab.onclick = () => {
                document.querySelectorAll('.face-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.activeFace = tab.dataset.face;
                this.renderGrid();
            };
        });

        document.getElementById('btn-view-textured').onclick = (e) => {
            this.wireframeMode = false;
            e.target.classList.add('active');
            document.getElementById('btn-view-wireframe').classList.remove('active');
            this.update3DTextures();
        };

        document.getElementById('btn-view-wireframe').onclick = (e) => {
            this.wireframeMode = true;
            e.target.classList.add('active');
            document.getElementById('btn-view-textured').classList.remove('active');
            this.update3DTextures();
        };

        document.getElementById('btn-toggle-grid').onclick = (e) => {
            if (this.gridHelper) {
                this.gridHelper.visible = !this.gridHelper.visible;
                e.target.textContent = `Пол: ${this.gridHelper.visible ? 'ВКЛ' : 'ВЫКЛ'}`;
            }
        };

        document.getElementById('btn-reset-cam').onclick = () => {
            this.camera.position.set(2.5, 2.5, 3.5);
            this.controls.target.set(0, 0.5, 0);
        };

        document.getElementById('asset-search').oninput = (e) => {
            this.renderElementsList(e.target.value.toLowerCase());
        };
        document.getElementById('btn-add-cube').onclick = () => this.addNewCube();
        document.getElementById('btn-duplicate-cube').onclick = () => this.duplicateCube();
        document.getElementById('btn-add-custom-asset').onclick = () => this.createNewAssetWizard();
        this.bindPropertyInputs();

        document.getElementById('btn-export-zip').onclick = () => this.exportZipPackage();
        document.getElementById('btn-gen-source-pack').onclick = () => {
            this.saveCurrentStateToElement();
            this.bakeAtlasAndManifest();
            this.exportZipPackage();
        };
        document.getElementById('btn-export-atlas-png').onclick = () => {
            this.bakeAtlasAndManifest();
            const a = document.createElement('a');
            a.download = this.activeModule.atlas || 'source-atlas.png';
            a.href = this.atlasCanvas.toDataURL('image/png');
            a.click();
            this.showToast('Атлас PNG скачан', 'success');
        };
        document.getElementById('btn-export-code').onclick = () => this.openExportModal();
        document.getElementById('btn-close-modal').onclick = () => {
            document.getElementById('export-modal').style.display = 'none';
        };

        const openInput = document.getElementById('file-project-input');
        if (openInput) {
            openInput.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    if (file.name.endsWith('.zip')) {
                        this.importZipPackage(file);
                    } else {
                        const r = new FileReader();
                        r.onload = (evt) => {
                            this.activeModule = JSON.parse(evt.target.result);
                            this.renderElementsList();
                            if (this.activeModule.blocks[0]) this.selectElement(this.activeModule.blocks[0]);
                            this.hideMainMenu();
                        };
                        r.readAsText(file);
                    }
                }
            };
        }

        window.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            if (e.ctrlKey && (e.code === 'KeyZ')) {
                e.preventDefault();
                this.undo();
            } else if (e.ctrlKey && (e.code === 'KeyY')) {
                e.preventDefault();
                this.redo();
            } else if (e.code === 'KeyW') {
                this.setGizmoMode('translate');
            } else if (e.code === 'KeyR') {
                this.setGizmoMode('scale');
            } else if (e.code === 'KeyE') {
                this.setGizmoMode('rotate');
            } else if (e.code === 'Escape') {
                this.setGizmoMode('off');
            } else if (e.code === 'KeyB') {
                this.setTool('brush');
            } else if (e.code === 'KeyI') {
                this.setTool('picker');
            } else if (e.code === 'KeyF') {
                this.setTool('bucket');
            } else if (e.code === 'KeyL') {
                this.setTool('line');
            } else if (e.code === 'KeyU') {
                this.setTool('rect');
            }
        });

        window.addEventListener('resize', () => this.onResize());
    }

    openExportModal() {
        this.saveCurrentStateToElement();
        this.bakeAtlasAndManifest();
        const modal = document.getElementById('export-modal');
        const codeArea = document.getElementById('modal-code-area');
        if (!modal || !codeArea) return;
        modal.style.display = 'flex';

        const updateTab = (type) => {
            if (type === 'gen') {
                const { map, palette } = this.gridToInstruction(this.getActiveEditingGrid());
                const rows = map.map(r => `    "${r}"`).join(',\n');
                const palEntries = Object.entries(palette).map(([char, col]) => `    '${char}': '${col}'`).join(',\n');
                codeArea.value = `this.paint(ctx, [\n${rows}\n], {\n${palEntries}\n});`;
            } else if (type === 'block') {
                codeArea.value = JSON.stringify(this.activeModule, null, 2);
            } else if (type === 'model') {
                const cleanModel = this.cubes.map(c => ({
                    name: c.name, pos: c.pos, size: c.size, rot: c.rot, textureMode: c.textureMode
                }));
                codeArea.value = JSON.stringify(cleanModel, null, 4);
            }
        };

        document.getElementById('tab-gen-js').onclick = (e) => { this.switchModalTab(e); updateTab('gen'); };
        document.getElementById('tab-blocks-js').onclick = (e) => { this.switchModalTab(e); updateTab('block'); };
        document.getElementById('tab-model-json').onclick = (e) => { this.switchModalTab(e); updateTab('model'); };

        document.getElementById('btn-copy-modal-code').onclick = () => {
            navigator.clipboard.writeText(codeArea.value);
            this.showToast('Код скопирован в буфер', 'success');
        };

        document.getElementById('btn-download-code').onclick = () => {
            const blob = new Blob([codeArea.value], { type: 'text/plain' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `export_${Date.now()}.txt`;
            a.click();
            this.showToast('Файл экспорта скачан', 'success');
        };

        updateTab('block');
    }

    switchModalTab(e) {
        document.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.lumiBenchStudio = new LumiBenchStudio();
});