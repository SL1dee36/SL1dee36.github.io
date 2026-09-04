// game/StructureGenerator.js
// author: Nazaryan A.K.
// github: @Sl1dee36

import { BLOCK } from './blocks.js';
import { BIOME } from './World.js';

export class StructureGenerator {
    static tryGenerateStructure(world, chunk, cx, cz) {
        // Редкий спавн структур (примерно 1 на 40-50 чанков)
        const hash = Math.sin(cx * 374761393 + cz * 668265263) * 43758.5453;
        const rand = hash - Math.floor(hash);
        if (rand > 0.024) return;

        const lx = 5 + Math.floor((rand * 100) % 6);
        const lz = 5 + Math.floor((rand * 1000) % 6);
        const wx = cx * 16 + lx;
        const wz = cz * 16 + lz;

        const biome = world.getBiomeAt(wx, wz);
        const h = world.getTerrainHeightAt(wx, wz);
        if (h < 60 || h > 230) return;

        if (biome === BIOME.DESERT) {
            this.generateDesertPyramid(chunk, lx, h, lz);
        } else if (biome === BIOME.MOUNTAINS && h > 95) {
            this.generateMountainWatchtower(chunk, lx, h, lz);
        } else if (biome === BIOME.OAK_FOREST || biome === BIOME.BIRCH_FOREST) {
            this.generateForestCabin(chunk, lx, h, lz, biome === BIOME.BIRCH_FOREST);
        } else if (biome === BIOME.FLOWER_MEADOW) {
            this.generateWell(chunk, lx, h, lz);
        }
    }

    // 1. Пустынная пирамида / святилище
    static generateDesertPyramid(c, lx, h, lz) {
        if (lx < 3 || lx > 12 || lz < 3 || lz > 12) return;
        // База 7x7
        for (let dx = -3; dx <= 3; dx++) {
            for (let dz = -3; dz <= 3; dz++) {
                const px = lx + dx, pz = lz + dz;
                if (px >= 0 && px < 16 && pz >= 0 && pz < 16) {
                    c.setVoxel(px, h, pz, BLOCK.SANDSTONE);
                    // Второй ярус 5x5
                    if (Math.abs(dx) <= 2 && Math.abs(dz) <= 2) {
                        c.setVoxel(px, h + 1, pz, BLOCK.SANDSTONE);
                    }
                    // Колонны по углам
                    if ((Math.abs(dx) === 2 && Math.abs(dz) === 2)) {
                        c.setVoxel(px, h + 2, pz, BLOCK.SANDSTONE);
                        c.setVoxel(px, h + 3, pz, BLOCK.SANDSTONE);
                        c.setVoxel(px, h + 4, pz, BLOCK.TORCH);
                    }
                }
            }
        }
        // Центральный постамент
        c.setVoxel(lx, h + 2, lz, BLOCK.CRAFTING_TABLE);
    }

    // 2. Лесная хижина / руины
    static generateForestCabin(c, lx, h, lz, isBirch = false) {
        if (lx < 3 || lx > 12 || lz < 3 || lz > 12) return;
        const logId = isBirch ? BLOCK.BIRCH_LOG : BLOCK.OAK_LOG;
        const plankId = isBirch ? BLOCK.BIRCH_PLANKS : BLOCK.PLANKS;

        // Фундамент 5x5
        for (let dx = -2; dx <= 2; dx++) {
            for (let dz = -2; dz <= 2; dz++) {
                const px = lx + dx, pz = lz + dz;
                if (px >= 0 && px < 16 && pz >= 0 && pz < 16) {
                    c.setVoxel(px, h, pz, BLOCK.COBBLESTONE);
                    // Пол
                    c.setVoxel(px, h, pz, plankId);

                    // Угловые столбы из бревен
                    if (Math.abs(dx) === 2 && Math.abs(dz) === 2) {
                        for (let dy = 1; dy <= 4; dy++) c.setVoxel(px, h + dy, pz, logId);
                    } else if (Math.abs(dx) === 2 || Math.abs(dz) === 2) {
                        // Стены из досок
                        c.setVoxel(px, h + 1, pz, plankId);
                        c.setVoxel(px, h + 2, pz, (dx === 0 || dz === 0) ? BLOCK.GLASS : plankId);
                        c.setVoxel(px, h + 3, pz, plankId);
                    } else {
                        // Внутри хижины
                        for (let dy = 1; dy <= 3; dy++) c.setVoxel(px, h + dy, pz, BLOCK.AIR);
                    }

                    // Крыша
                    c.setVoxel(px, h + 4, pz, plankId);
                }
            }
        }

        // Дверной проем
        c.setVoxel(lx, h + 1, lz - 2, BLOCK.AIR);
        c.setVoxel(lx, h + 2, lz - 2, BLOCK.AIR);

        // Интерьер
        c.setVoxel(lx - 1, h + 1, lz + 1, BLOCK.CRAFTING_TABLE);
        c.setVoxel(lx + 1, h + 1, lz + 1, BLOCK.FURNACE);
        c.setVoxel(lx, h + 3, lz + 1, BLOCK.TORCH);
    }

    // 3. Горная сторожевая башня
    static generateMountainWatchtower(c, lx, h, lz) {
        if (lx < 3 || lx > 12 || lz < 3 || lz > 12) return;
        // Башня 5x5, высота 7
        for (let dy = 0; dy <= 7; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
                for (let dz = -2; dz <= 2; dz++) {
                    const px = lx + dx, pz = lz + dz;
                    if (px >= 0 && px < 16 && pz >= 0 && pz < 16) {
                        const isBorder = (Math.abs(dx) === 2 || Math.abs(dz) === 2);
                        if (dy === 0 || dy === 6) {
                            c.setVoxel(px, h + dy, pz, BLOCK.COBBLESTONE);
                        } else if (dy === 7) {
                            // Зубцы башни
                            if ((Math.abs(dx) === 2 && Math.abs(dz) === 2) || (dx === 0 || dz === 0)) {
                                c.setVoxel(px, h + dy, pz, BLOCK.COBBLESTONE);
                                if (Math.abs(dx) === 2 && Math.abs(dz) === 2) {
                                    c.setVoxel(px, h + dy + 1, pz, BLOCK.TORCH);
                                }
                            }
                        } else {
                            if (isBorder) {
                                c.setVoxel(px, h + dy, pz, (dy === 3 && (dx === 0 || dz === 0)) ? BLOCK.AIR : BLOCK.STONE);
                            } else {
                                c.setVoxel(px, h + dy, pz, BLOCK.AIR);
                            }
                        }
                    }
                }
            }
        }
        // Вход
        c.setVoxel(lx, h + 1, lz - 2, BLOCK.AIR);
        c.setVoxel(lx, h + 2, lz - 2, BLOCK.AIR);
    }

    // 4. Заброшенный колодец
    static generateWell(c, lx, h, lz) {
        if (lx < 2 || lx > 13 || lz < 2 || lz > 13) return;
        for (let dx = -1; dx <= 1; dx++) {
            for (let dz = -1; dz <= 1; dz++) {
                const px = lx + dx, pz = lz + dz;
                if (px >= 0 && px < 16 && pz >= 0 && pz < 16) {
                    if (dx === 0 && dz === 0) {
                        c.setVoxel(px, h, pz, BLOCK.WATER, 8);
                        c.setVoxel(px, h - 1, pz, BLOCK.WATER, 8);
                        c.setVoxel(px, h - 2, pz, BLOCK.COBBLESTONE);
                    } else {
                        c.setVoxel(px, h, pz, BLOCK.COBBLESTONE);
                        c.setVoxel(px, h + 1, pz, BLOCK.COBBLESTONE);
                    }
                    // Крыша колодца
                    c.setVoxel(px, h + 4, pz, BLOCK.PLANKS);
                }
            }
        }
        // Угловые стойки
        c.setVoxel(lx - 1, h + 2, lz - 1, BLOCK.OAK_LOG);
        c.setVoxel(lx - 1, h + 3, lz - 1, BLOCK.OAK_LOG);
        c.setVoxel(lx + 1, h + 2, lz - 1, BLOCK.OAK_LOG);
        c.setVoxel(lx + 1, h + 3, lz - 1, BLOCK.OAK_LOG);
        c.setVoxel(lx - 1, h + 2, lz + 1, BLOCK.OAK_LOG);
        c.setVoxel(lx - 1, h + 3, lz + 1, BLOCK.OAK_LOG);
        c.setVoxel(lx + 1, h + 2, lz + 1, BLOCK.OAK_LOG);
        c.setVoxel(lx + 1, h + 3, lz + 1, BLOCK.OAK_LOG);
        c.setVoxel(lx, h + 5, lz, BLOCK.TORCH);
    }
}
