import * as THREE from 'three';

export class TextureGenerator {
    constructor() {
        this.size = 16;
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.size;
        this.canvas.height = this.size;
        this.ctx = this.canvas.getContext('2d');
    }

    generate(type) {
        const ctx = this.ctx;
        const w = this.size;
        
        // Очистка
        ctx.clearRect(0, 0, w, w);
        const name = type.replace('gen:', '');

        // Хелпер для фона с шумом (делает материал реалистичным)
        const baseNoise = (color, intensity = 10) => this.fillWithNoise(ctx, color, intensity);

        switch (name) {
            // --- BLOCKS ---

            case 'stone': 
                // Камень: база с шумом + процедурные вкрапления
                baseNoise('#7d7d7d', 15);
                this.speckle(ctx, '#555555', 8); // Темные пятна
                this.speckle(ctx, '#999999', 4); // Светлые пятна
                break;

            case 'dirt': 
                baseNoise('#5d4037', 20); // Более насыщенный коричневый
                this.speckle(ctx, '#3e2723', 10);
                this.speckle(ctx, '#8d6e63', 5);
                break;
            
            case 'grass_top': 
                baseNoise('#4caf50', 25); // Яркая зелень
                this.speckle(ctx, '#2e7d32', 15); // Темная трава
                this.speckle(ctx, '#81c784', 8);  // Светлая трава
                break;
            
            case 'grass_side':
                // Сначала рисуем землю
                baseNoise('#5d4037', 20);
                this.speckle(ctx, '#3e2723', 6);
                // Сверху трава с "подтеками"
                this.paint(ctx, [
                    "GGGGGGGGGGGGGGGG",
                    "GGGGGGGGGGGGGGGG",
                    "GGGGGGGGGGGGGGGG",
                    "GG GGGG G GGG GG",
                    "G  GG   G G   G ",
                    "   G          G "
                ], { 'G': '#4caf50' });
                // Добавим шум на траву сверху, чтобы не была плоской
                this.noiseOverlay(ctx, 0, 0, 16, 4, 0.2); 
                break;

            case 'cobblestone': this.paint(ctx, [
                "0000111000000000",
                "0111111110111100",
                "0111121110122110",
                "0011111000111110",
                "0000000111000000",
                "0111101121101110",
                "1121101111101111",
                "1111100111001121",
                "0000000000000000",
                "0111101111101110",
                "1122101121101211",
                "1111101111101111",
                "0000000000000000",
                "0111001111101110",
                "1111101121101111",
                "0011001111100110"
            ], { '0': '#505050', '1': '#757575', '2': '#909090' }); break;

            case 'planks': 
                // Дерево с более теплыми тонами и выделенными досками
                baseNoise('#a1887f', 5); // Подложка
                this.paint(ctx, [
                    "AAAAABAAAAABAAAA",
                    "CCCCCCCCCCCCCCCC",
                    "BBBBABBBBBABBBBB",
                    "BBBBABBBBBABBBBB",
                    "0000000000000000",
                    "AAABAAAAABAAAAAB",
                    "CCCCCCCCCCCCCCCC",
                    "BBABBBBBABBBBBAB",
                    "BBABBBBBABBBBBAB",
                    "0000000000000000",
                    "AABAAAAABAAAAABA",
                    "CCCCCCCCCCCCCCCC",
                    "BABBBBBABBBBBABB",
                    "BABBBBBABBBBBABB",
                    "0000000000000000",
                    "ABAAAAABAAAAABAA"
                ], { 
                    'A': '#d7ccc8', // Светлые волокна
                    'B': '#a1887f', // Основной цвет
                    'C': '#8d6e63', // Тень доски
                    '0': '#5d4037'  // Щели между досками
                }); 
                break;

            case 'log_side': 
                // Вертикальная текстура коры
                baseNoise('#5d4037', 10);
                for(let i=0; i<8; i++) {
                    let x = Math.floor(Math.random()*16);
                    ctx.fillStyle = '#3e2723';
                    ctx.fillRect(x, 0, 1, 16); // Темные прожилки
                }
                break;

            case 'log_top': this.paint(ctx, [
                "5555555555555555",
                "5566666666666655",
                "5677777777777765",
                "5678888888888765",
                "5678999999998765",
                "56789AAAAAA98765",
                "56789A9999A98765",
                "56789A9BB9A98765",
                "56789A9BB9A98765",
                "56789A9999A98765",
                "56789AAAAAA98765",
                "5678999999998765",
                "5678888888888765",
                "5677777777777765",
                "5566666666666655",
                "5555555555555555"
            ], { 
                '5': '#3e2723', '6': '#4e342e', '7': '#5d4037', 
                '8': '#6d4c41', '9': '#795548', 'A': '#8d6e63', 'B': '#a1887f' 
            }); break;

            case 'bedrock': 
                baseNoise('#212121', 20); 
                this.speckle(ctx, '#000000', 10);
                this.speckle(ctx, '#424242', 10);
                break;
            
            case 'sand': 
                baseNoise('#e6ddc5', 15); // Песочный
                this.speckle(ctx, '#dccca3', 10);
                break;
            
            case 'gravel': 
                baseNoise('#9e9e9e', 20);
                this.speckle(ctx, '#616161', 12); // Камешки
                this.speckle(ctx, '#bdbdbd', 8);
                break;
            
            case 'leaves': 
                // Прозрачность для листвы
                ctx.fillStyle = 'rgba(0,0,0,0)'; 
                ctx.clearRect(0,0,16,16);
                // Рисуем много полупрозрачных точек
                for(let i=0; i<60; i++) {
                    ctx.fillStyle = Math.random() > 0.5 ? '#2e7d32' : '#1b5e20';
                    ctx.globalAlpha = 0.8;
                    ctx.fillRect(Math.floor(Math.random()*16), Math.floor(Math.random()*16), 2, 2);
                }
                ctx.globalAlpha = 1.0;
                break;
            
            case 'coal_ore': 
                this.generate('gen:stone'); 
                this.paintOre(ctx, '#212121'); 
                break;
            case 'iron_ore': 
                this.generate('gen:stone'); 
                this.paintOre(ctx, '#d7ccc8'); 
                break;
            case 'glass': 
                ctx.fillStyle = '#e3f2fd'; 
                ctx.globalAlpha = 0.3;
                ctx.fillRect(0,0,16,16);
                ctx.globalAlpha = 0.8;
                ctx.strokeStyle = '#90caf9';
                ctx.strokeRect(0.5,0.5,15,15); // Рамка
                // Блики
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(3,3, 2, 1);
                ctx.fillRect(4,4, 1, 1);
                ctx.fillRect(11,12, 2, 1);
                ctx.globalAlpha = 1.0;
                break;
            
            case 'sandstone_side': 
                baseNoise('#e6ddc5', 5);
                this.paint(ctx, [
                    "AAAAAAAAAAAAAAAA",
                    "BBBBBBBBBBBBBBBB",
                    "AAAAAAAAAAAAAAAA",
                    "CCCCCCCCCCCCCCCC",
                    "AAAAAAAAAAAAAAAA",
                    "AAAAAAAAAAAAAAAA",
                    "BBBBBBBBBBBBBBBB",
                    "AAAAAAAAAAAAAAAA",
                    "AAAAAAAAAAAAAAAA",
                    "CCCCCCCCCCCCCCCC",
                    "AAAAAAAAAAAAAAAA",
                    "BBBBBBBBBBBBBBBB",
                    "AAAAAAAAAAAAAAAA",
                    "AAAAAAAAAAAAAAAA",
                    "CCCCCCCCCCCCCCCC",
                    "AAAAAAAAAAAAAAAA"
                ], { 'A': 'rgba(0,0,0,0)', 'B': '#dccca3', 'C': '#c5b58d' });
                break;
            case 'sandstone_top': this.generate('gen:sand'); break;
            case 'sandstone_bottom': this.generate('gen:sand'); break;

            case 'crafting_table_top': this.paint(ctx, [
                "7777777777777777",
                "7555555555555557",
                "75A9A9A9A9A9A957",
                "759A9A9A9A9A9A57",
                "75A9A9A9A9A9A957",
                "759A9A9A9A9A9A57",
                "75A9A9A9A9A9A957",
                "759A9A9A9A9A9A57",
                "75A9A9A9A9A9A957",
                "759A9A9A9A9A9A57",
                "75A9A9A9A9A9A957",
                "759A9A9A9A9A9A57",
                "75A9A9A9A9A9A957",
                "7555555555555557",
                "7777777777777777",
                "0000000000000000"
            ], { '0': 'rgba(0,0,0,0.2)', '7': '#3e2723', '5': '#5d4037', 'A': '#d7ccc8', '9': '#a1887f' }); break;
            
            case 'crafting_table_side': 
                baseNoise('#5d4037', 5);
                this.paint(ctx, [
                    "0000000000000000",
                    "0111111111111110",
                    "0122222222222210",
                    "0123333333333210",
                    "0123000000003210",
                    "0123044444403210",
                    "0123044444403210",
                    "0123044444403210",
                    "0123044444403210",
                    "0123044444403210",
                    "0123044444403210",
                    "0123000000003210",
                    "0123333333333210",
                    "0122222222222210",
                    "0111111111111110",
                    "0000000000000000"
                ], { 
                    '0': '#3e2723', // Dark border
                    '1': '#5d4037', 
                    '2': '#6d4c41', 
                    '3': '#795548',
                    '4': '#4e342e'  // Inner shadow
                }); 
                break;
            case 'crafting_table_front': this.generate('gen:crafting_table_side'); break;

            case 'furnace_front': this.paint(ctx, [
                "1111111111111111",
                "1112111111112111",
                "1112111111112111",
                "1110000000000111",
                "1104444444444011",
                "1104333333334011",
                "1104333333334011",
                "1104333333334011",
                "1104333333334011",
                "1104333333334011",
                "1104333333334011",
                "1104444444444011",
                "1110000000000111",
                "1112222222222111",
                "1112111221112111",
                "1111111111111111"
            ], { '1': '#757575', '2': '#616161', '0': '#212121', '3': '#424242', '4': '#000000' }); break;
            case 'furnace_side': this.generate('gen:cobblestone'); break;
            case 'furnace_top': this.generate('gen:cobblestone'); break;

            // --- ITEMS ---
            
            case 'item_stick': 
                this.paintItem(ctx, [
                    "              A ",
                    "             AB ",
                    "            AB  ",
                    "           AB   ",
                    "          AB    ",
                    "         AB     ",
                    "        AB      ",
                    "       AB       ",
                    "      AB        ",
                    "     AB         ",
                    "    AB          ",
                    "   AB           ",
                    "  AB            ",
                    " A              ",
                    "A               ",
                    "                "
                ], { 'A': '#8d6e63', 'B': '#5d4037' }); 
                break;

            case 'item_coal': 
                this.paintItem(ctx, [
                    "  1111          ",
                    " 122231         ",
                    "12233321        ",
                    "12333221        ",
                    "1222221         ",
                    " 11111          "
                ], { '1': '#212121', '2': '#424242', '3': '#616161' }, 4, 4); 
                break;

            case 'item_iron_ingot': 
                this.paintItem(ctx, [
                    "  111111        ",
                    " 12222221       ",
                    "1233333321      ",
                    "1233333321      ",
                    "1122222211      ",
                    " 11111111       "
                ], { '1': '#616161', '2': '#bdbdbd', '3': '#eeeeee' }, 3, 5); 
                break;

            // --- TOOLS ---
            // Для инструментов используем более сложную палитру для объема
            
            case 'tool_wood_pick': this.generateTool(ctx, 'wood', 'pick'); break;
            case 'tool_stone_pick': this.generateTool(ctx, 'stone', 'pick'); break;
            case 'tool_iron_pick': this.generateTool(ctx, 'iron', 'pick'); break;
            
            case 'tool_wood_axe': this.generateTool(ctx, 'wood', 'axe'); break;
            case 'tool_stone_axe': this.generateTool(ctx, 'stone', 'axe'); break;
            case 'tool_iron_axe': this.generateTool(ctx, 'iron', 'axe'); break;

            case 'tool_wood_shovel': this.generateTool(ctx, 'wood', 'shovel'); break;
            case 'tool_stone_shovel': this.generateTool(ctx, 'stone', 'shovel'); break;
            case 'tool_iron_shovel': this.generateTool(ctx, 'iron', 'shovel'); break;

            default: baseNoise('#ff00ff', 0); break; // Error magenta
        }

        const texture = new THREE.CanvasTexture(this.canvas);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        texture.colorSpace = THREE.SRGBColorSpace;
        
        // Клонируем канвас, чтобы текстура не перезаписалась при следующем вызове
        const newImage = document.createElement('canvas');
        newImage.width = w; newImage.height = w;
        newImage.getContext('2d').drawImage(this.canvas, 0, 0);
        texture.image = newImage;
        texture.needsUpdate = true;
        return texture;
    }

    // --- PAINTERS & UTILS ---

    // Заливка с шумом для реализма
    fillWithNoise(ctx, hexColor, intensity) {
        const w = this.size;
        const h = this.size;
        
        // Парсинг Hex
        let r = parseInt(hexColor.slice(1, 3), 16);
        let g = parseInt(hexColor.slice(3, 5), 16);
        let b = parseInt(hexColor.slice(5, 7), 16);

        const imgData = ctx.createImageData(w, h);
        const data = imgData.data;

        for (let i = 0; i < data.length; i += 4) {
            // Случайное отклонение
            const noise = (Math.random() - 0.5) * intensity;
            
            data[i]     = Math.min(255, Math.max(0, r + noise));
            data[i + 1] = Math.min(255, Math.max(0, g + noise));
            data[i + 2] = Math.min(255, Math.max(0, b + noise));
            data[i + 3] = 255; // Alpha
        }
        ctx.putImageData(imgData, 0, 0);
    }

    noiseOverlay(ctx, x, y, w, h, opacity) {
        ctx.save();
        ctx.globalAlpha = opacity;
        for(let i=x; i<x+w; i++) {
            for(let j=y; j<y+h; j++) {
                if(Math.random()>0.5) {
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(i,j,1,1);
                } else {
                    ctx.fillStyle = '#000000';
                    ctx.fillRect(i,j,1,1);
                }
            }
        }
        ctx.restore();
    }

    speckle(ctx, c, count) { 
        ctx.fillStyle = c; 
        for(let i=0; i<count; i++) 
            ctx.fillRect(Math.floor(Math.random()*16), Math.floor(Math.random()*16), 1, 1); 
    }

    paint(ctx, map, palette) {
        for(let y=0; y<16; y++) {
            // Если строка короче 16, пропускаем или повторяем (защита)
            if(!map[y]) continue; 
            for(let x=0; x<16; x++) {
                const char = map[y][x];
                if(char && char !== ' ' && palette[char]) {
                    ctx.fillStyle = palette[char];
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
    }

    paintOre(ctx, color) {
        // Рисует красивые "кластеры" руды
        ctx.fillStyle = color;
        const spots = [
            [4,4], [5,4], [4,5], 
            [10,8], [11,8], [11,9], [12,9],
            [3, 12], [4,12], [4,11]
        ];
        spots.forEach(pos => {
            ctx.fillRect(pos[0], pos[1], 1, 1);
        });
    }

    paintItem(ctx, map, palette, offX=0, offY=0) {
        for(let y=0; y<map.length; y++) {
            for(let x=0; x<map[y].length; x++) {
                const char = map[y][x];
                if(palette[char]) {
                    ctx.fillStyle = palette[char];
                    ctx.fillRect(x+offX, y+offY, 1, 1);
                }
            }
        }
    }

    generateTool(ctx, material, type) {
        let pal = {};
        if(material === 'wood')  pal = { '1': '#8d6e63', '2': '#a1887f', '3': '#d7ccc8' }; // Dark, Mid, Light
        if(material === 'stone') pal = { '1': '#616161', '2': '#757575', '3': '#9e9e9e' };
        if(material === 'iron')  pal = { '1': '#bdbdbd', '2': '#e0e0e0', '3': '#ffffff' };
        
        const stick = { 'S': '#5d4037', 's': '#8d6e63' }; // Stick dark, stick light

        // Универсальная ручка
        const handleMap = [
            "     SSs        ",
            "     SSS        ",
            "     sSs        ",
            "     SsS        ",
            "     SSs        ",
            "     SsS        ",
            "     sSS        ",
            "     SsS        ",
            "     sSS        ",
            "     SsS        ",
            "     sSS        ",
            "     SsS        ",
            "     sSs        ",
            "     SsS        ",
            "     SsS        ",
            "      S         "
        ];
        
        // Объединяем палитры
        const fullPal = { ...pal, ...stick };

        // Рисуем ручку
        this.paint(ctx, handleMap, fullPal);

        // Карты головок инструментов
        let headMap = [];

        if (type === 'pick') {
            headMap = [
                "    11123       ",
                "   1223332      ",
                " 123     232    ",
                "132       231   ",
                "32         23   ",
                "                ",
                "                "
            ];
        } else if (type === 'axe') {
            headMap = [
                "   11           ",
                "  1222          ",
                "  12332         ",
                "  12333         ",
                "   1232         ",
                "    11          ",
                "                "
            ];
        } else if (type === 'shovel') {
            headMap = [
                "                ",
                "      111       ",
                "     12321      ",
                "     12321      ",
                "      121       ",
                "       1        ",
                "                "
            ];
        }

        this.paint(ctx, headMap, fullPal);
    }
}