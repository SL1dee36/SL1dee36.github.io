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
        
        ctx.clearRect(0, 0, w, w);
        const name = type.replace('gen:', '');

        switch (name) {
            // Blocks
            case 'stone': this.paint(ctx, [
                "7777777777777777",
                "7777767777776777",
                "7776667777766677",
                "7777677777776777",
                "7777777677777777",
                "7677776667777767",
                "6667777677777666",
                "7677777777777767",
                "7777777777777777",
                "7777677777776777",
                "7776667777766677",
                "7777677777776777",
                "7777777677777777",
                "7677776667777767",
                "6667777677777666",
                "7677777777777767"
            ], { '7': '#7d7d7d', '6': '#656565' }); break;

            case 'dirt': this.noise(ctx, '#5d4030', '#483022', 0.2); break;
            
            case 'grass_top': 
                this.noise(ctx, '#4C7D32', '#365E23', 0.2); 
                this.speckle(ctx, '#254217', 10);
                break;
            
            case 'grass_side':
                this.noise(ctx, '#5d4030', '#483022', 0.2); // Dirt
                ctx.fillStyle = '#4C7D32'; ctx.fillRect(0, 0, 16, 4); // Top strip
                this.speckle(ctx, '#4C7D32', 15, 0, 6); // Dripping grass
                break;

            case 'cobblestone': this.paint(ctx, [
                "4444444004444444",
                "4444440550444444",
                "4400405555044004",
                "4055045555405550",
                "4055544004455550",
                "4405544444455504",
                "4440440000440044",
                "4444405555044444",
                "4444405555044444",
                "4400440550440044",
                "0555044004055550",
                "0555544444555550",
                "4055044004455504",
                "4400440550440044",
                "4444440550444444",
                "4444444004444444"
            ], { '4': '#777777', '5': '#555555', '0': '#444444' }); break;

            case 'planks': this.paint(ctx, [
                "AA9AA9AAAA9AAAAA",
                "AA9AA9AAAA9AAAAA",
                "AA9AA9AAAA9AAAAA",
                "AA9AA9AAAA9AAAAA",
                "8888888888888888",
                "A9AAAAA9AAAA9AAA",
                "A9AAAAA9AAAA9AAA",
                "A9AAAAA9AAAA9AAA",
                "A9AAAAA9AAAA9AAA",
                "8888888888888888",
                "AAAA9AAAAA9AA9AA",
                "AAAA9AAAAA9AA9AA",
                "AAAA9AAAAA9AA9AA",
                "AAAA9AAAAA9AA9AA",
                "8888888888888888",
                "AA9AAAA9AAAAA9AA"
            ], { 'A': '#ac8252', '9': '#916d43', '8': '#684e31' }); break;

            case 'log_side': this.paint(ctx, [
                "5454554555455455",
                "5454554555455455",
                "5454554555455455",
                "5454554555455455",
                "5454554555455455",
                "5454554555455455",
                "5454554555455455",
                "5454554555455455",
                "5454554555455455",
                "5454554555455455",
                "5454554555455455",
                "5454554555455455",
                "5454554555455455",
                "5454554555455455",
                "5454554555455455",
                "5454554555455455"
            ], { '5': '#624830', '4': '#483522' }); break;

            case 'log_top': this.paint(ctx, [
                "5555555555555555",
                "555AAA9AA9AAAA55",
                "55A9AA9AA9AA9A55",
                "5A9AAA9AA9AAAAA5",
                "5A9AA9AAAA9AA9A5",
                "5A9AA9AAAA9AA9A5",
                "5A9AA9AAAA9AA9A5",
                "5A9AA9AAAA9AA9A5",
                "5A9AA9AAAA9AA9A5",
                "5A9AA9AAAA9AA9A5",
                "5A9AA9AAAA9AA9A5",
                "5A9AAA9AA9AAAAA5",
                "55A9AA9AA9AA9A55",
                "555AAA9AA9AAAA55",
                "5555555555555555",
                "5555555555555555"
            ], { '5': '#624830', 'A': '#ac8252', '9': '#8a6841' }); break;

            case 'bedrock': this.noise(ctx, '#444', '#111', 0.5); break;
            case 'sand': this.noise(ctx, '#DBD3A0', '#C6BF90', 0.1); break;
            case 'gravel': this.noise(ctx, '#7F7F7F', '#565656', 0.4); break;
            case 'leaves': this.noise(ctx, 'rgba(45,95,30,0.9)', 'rgba(30,70,20,0.9)', 0.4); break;
            
            case 'coal_ore': this.generate('gen:stone'); this.speckle(ctx, '#111', 8, 2, 14); break;
            case 'iron_ore': this.generate('gen:stone'); this.speckle(ctx, '#E6CFA1', 8, 2, 14); break;
            case 'glass': ctx.fillStyle='rgba(255,255,255,0.2)'; ctx.fillRect(0,0,16,16); ctx.strokeStyle='#fff'; ctx.strokeRect(0,0,16,16); ctx.fillStyle='#fff'; ctx.fillRect(3,3,2,2); ctx.fillRect(10,10,3,3); break;
            
            case 'sandstone_side': this.paint(ctx, [
                "DDDDDDDDDDDDDDDD",
                "DDDDDDDDDDDDDDDD",
                "DDDDDDDDDDDDDDDD",
                "AAAAAAAAAAAAAAAA",
                "DDDDDDDDDDDDDDDD",
                "DDDDDDDDDDDDDDDD",
                "DDDDDDDDDDDDDDDD",
                "AAAAAAAAAAAAAAAA",
                "DDDDDDDDDDDDDDDD",
                "DDDDDDDDDDDDDDDD",
                "DDDDDDDDDDDDDDDD",
                "AAAAAAAAAAAAAAAA",
                "DDDDDDDDDDDDDDDD",
                "DDDDDDDDDDDDDDDD",
                "DDDDDDDDDDDDDDDD",
                "AAAAAAAAAAAAAAAA"
            ], { 'D': '#DBD3A0', 'A': '#C6BF90' }); break;
            case 'sandstone_top': this.generate('gen:sand'); break;
            case 'sandstone_bottom': this.generate('gen:sand'); break;

            case 'crafting_table_top': this.paint(ctx, [
                "BB666666666666BB",
                "B6AAAAAAAAAAAA6B",
                "6AAAAAAAAAAAAAA6",
                "6AA6666AA6666AA6",
                "6AA6666AA6666AA6",
                "6AA6666AA6666AA6",
                "6AAAAAAAAAAAAAA6",
                "6AAAAAAAAAAAAAA6",
                "6AAAAAAAAAAAAAA6",
                "6AA6666AA6666AA6",
                "6AA6666AA6666AA6",
                "6AA6666AA6666AA6",
                "6AAAAAAAAAAAAAA6",
                "B6AAAAAAAAAAAA6B",
                "BB666666666666BB",
                "BBBBBBBBBBBBBBBB"
            ], { 'B': '#483522', '6': '#624830', 'A': '#ac8252' }); break;
            case 'crafting_table_side': this.paint(ctx, [
                "BBBBBBBBBBBBBBBB",
                "B77777777777777B",
                "B73333333333337B",
                "B73333333333337B",
                "B73333333333337B",
                "B73333333333337B",
                "B73333333333337B",
                "B73333333333337B",
                "B73333333333337B",
                "B73333333333337B",
                "B73333333333337B",
                "B73333333333337B",
                "B73333333333337B",
                "B77777777777777B",
                "BBBBBBBBBBBBBBBB",
                "BBBBBBBBBBBBBBBB"
            ], { 'B': '#624830', '7': '#483522', '3': '#302012' }); break;
            case 'crafting_table_front': this.generate('gen:crafting_table_side'); break;

            case 'furnace_front': this.paint(ctx, [
                "4444444444444444",
                "4444444444444444",
                "4400000000000044",
                "4400000000000044",
                "4400000000000044",
                "4400000000000044",
                "4400000000000044",
                "4400000000000044",
                "4400000000000044",
                "4400000000000044",
                "4444444444444444",
                "4444444444444444",
                "4445544554455444",
                "4445544554455444",
                "4445544554455444",
                "4444444444444444"
            ], { '4': '#777777', '5': '#111', '0': '#222' }); break;
            case 'furnace_side': this.generate('gen:cobblestone'); break;
            case 'furnace_top': this.generate('gen:cobblestone'); break;

            // ITEMS
            case 'item_stick': this.paint(ctx, [
                "................",
                ".............555",
                "............555.",
                "...........555..",
                "..........555...",
                ".........555....",
                "........555.....",
                ".......555......",
                "......555.......",
                ".....555........",
                "....555.........",
                "...555..........",
                "..555...........",
                ".555............",
                "................",
                "................"
            ], { '5': '#624830' }); break;

            case 'item_coal': this.paint(ctx, [
                "................",
                "....2222........",
                "...221122.......",
                "..22111122......",
                "..21111112......",
                "..21111122......",
                "...221222.......",
                "....222.........",
                "................",
                "................",
                "................",
                "................",
                "................",
                "................",
                "................",
                "................"
            ], { '2': '#111', '1': '#333' }); break;

            case 'item_iron_ingot': this.paint(ctx, [
                "................",
                "................",
                "................",
                "................",
                "....EEEEE.......",
                "...EEFFFFE......",
                "..EEFFFFFE......",
                ".EEEEEEEEE......",
                "................",
                "................",
                "................",
                "................",
                "................",
                "................",
                "................",
                "................"
            ], { 'E': '#ccc', 'F': '#fff' }); break;

            // TOOLS
            case 'tool_wood_pick': this.paintTool(ctx, '#ac8252', 'pick'); break;
            case 'tool_stone_pick': this.paintTool(ctx, '#777', 'pick'); break;
            case 'tool_iron_pick': this.paintTool(ctx, '#eee', 'pick'); break;
            
            case 'tool_wood_axe': this.paintTool(ctx, '#ac8252', 'axe'); break;
            case 'tool_stone_axe': this.paintTool(ctx, '#777', 'axe'); break;
            case 'tool_iron_axe': this.paintTool(ctx, '#eee', 'axe'); break;

            case 'tool_wood_shovel': this.paintTool(ctx, '#ac8252', 'shovel'); break;
            case 'tool_stone_shovel': this.paintTool(ctx, '#777', 'shovel'); break;
            case 'tool_iron_shovel': this.paintTool(ctx, '#eee', 'shovel'); break;

            default: this.noise(ctx, '#f0f', '#000', 0.5); break;
        }

        const texture = new THREE.CanvasTexture(this.canvas);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        texture.colorSpace = THREE.SRGBColorSpace;
        
        const newImage = document.createElement('canvas');
        newImage.width = w; newImage.height = w;
        newImage.getContext('2d').drawImage(this.canvas, 0, 0);
        texture.image = newImage;
        texture.needsUpdate = true;
        return texture;
    }

    // --- PAINTERS ---
    noise(ctx, b, n, d) { 
        const w=this.size; ctx.fillStyle=b; ctx.fillRect(0,0,w,w); 
        ctx.fillStyle=n; for(let i=0;i<w*w*d;i++) ctx.fillRect(Math.floor(Math.random()*w),Math.floor(Math.random()*w),1,1); 
    }
    speckle(ctx, c, count, xoff=0, yoff=0) { 
        ctx.fillStyle=c; for(let i=0;i<count;i++) ctx.fillRect(xoff+Math.floor(Math.random()*(16-xoff)),yoff+Math.floor(Math.random()*(16-yoff)),1,1); 
    }
    paint(ctx, map, palette) {
        for(let y=0; y<16; y++) {
            for(let x=0; x<16; x++) {
                const char = map[y][x];
                if(palette[char]) {
                    ctx.fillStyle = palette[char];
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
    }

    paintTool(ctx, headColor, type) {
        // Stick
        this.paint(ctx, [
            "................",
            "................",
            "................",
            "............555.",
            "...........555..",
            "..........555...",
            ".........555....",
            "........555.....",
            ".......555......",
            "......555.......",
            ".....555........",
            "....555.........",
            "...555..........",
            "..555...........",
            ".555............",
            "555............."
        ], { '5': '#624830' });

        const palette = { 'X': headColor };
        
        if (type === 'pick') {
            this.paint(ctx, [
                "................",
                ".......XXXXXXX..",
                ".....XXXXXXXXXX.",
                ".....XXX.....XXX",
                "..............XX",
                "..............XX",
                "..............XX",
                "..............XX",
                "..............XX",
                ".............XXX",
                ".............XX.",
                ".............XX.",
                "................",
                "................",
                "................",
                "................"
            ], palette);
        } else if (type === 'axe') {
            this.paint(ctx, [
                "................",
                "....XX..........",
                "...XXXX.........",
                "...XXXX.........",
                "....XX..........",
                "................",
                "................",
                "................",
                "................",
                "................",
                "................",
                "................",
                "................",
                "................",
                "................",
                "................"
            ], palette);
        } else if (type === 'shovel') {
            this.paint(ctx, [
                "................",
                "................",
                "....X...........",
                "...XXX..........",
                "...XXX..........",
                "....X...........",
                "................",
                "................",
                "................",
                "................",
                "................",
                "................",
                "................",
                "................",
                "................",
                "................"
            ], palette);
        }
    }
}