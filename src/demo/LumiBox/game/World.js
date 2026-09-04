// game/World.js
// author: Nazaryan A.K.
// github: @Sl1dee36

import * as THREE from 'three';
import { BLOCK } from './blocks.js';
import { SimplexNoise } from './utils/SimplexNoise.js';
import { TextureGenerator, TextureAtlas, registerAllProceduralTextures } from './TextureGenerator.js';
import { ItemDrop } from './ItemDrop.js';
import { StructureGenerator } from './StructureGenerator.js';

const CHUNK_SIZE = 16;
const WORLD_HEIGHT = 256;
const SECTION_HEIGHT = 32;
const SECTIONS_PER_CHUNK = WORLD_HEIGHT / SECTION_HEIGHT;
const PX = CHUNK_SIZE + 2;
const PY = SECTION_HEIGHT + 3;
const PZ = CHUNK_SIZE + 2;

export const BIOME = {
    OCEAN: 0,
    BEACH: 1,
    FLOWER_MEADOW: 2,
    OAK_FOREST: 3,
    BIRCH_FOREST: 4,
    DARK_OAK_FOREST: 5,
    MOUNTAINS: 6,
    DESERT: 7,
    SWAMP: 8
};

export const BIOME_DATA = {
    [BIOME.OCEAN]: {
        name: 'Ocean',
        grassColor: [0.43, 0.73, 0.28],
        waterColor: [0.10, 0.26, 0.56],
        baseHeight: 45
    },
    [BIOME.BEACH]: {
        name: 'Beach',
        grassColor: [0.55, 0.75, 0.35],
        waterColor: [0.18, 0.55, 0.88],
        baseHeight: 61
    },
    [BIOME.FLOWER_MEADOW]: {
        name: 'Flower Meadow',
        grassColor: [0.33, 0.82, 0.25],
        waterColor: [0.22, 0.52, 0.92],
        baseHeight: 68
    },
    [BIOME.OAK_FOREST]: {
        name: 'Oak Forest',
        grassColor: [0.30, 0.65, 0.20],
        waterColor: [0.25, 0.46, 0.89],
        baseHeight: 68
    },
    [BIOME.BIRCH_FOREST]: {
        name: 'Birch Forest',
        grassColor: [0.41, 0.73, 0.26],
        waterColor: [0.24, 0.67, 0.97],
        baseHeight: 69
    },
    [BIOME.DARK_OAK_FOREST]: {
        name: 'Dark Oak Forest',
        grassColor: [0.19, 0.38, 0.12],
        waterColor: [0.19, 0.31, 0.56],
        baseHeight: 70
    },
    [BIOME.MOUNTAINS]: {
        name: 'Mountains',
        grassColor: [0.38, 0.54, 0.33],
        waterColor: [0.16, 0.46, 0.83],
        baseHeight: 92
    },
    [BIOME.DESERT]: {
        name: 'Desert',
        grassColor: [0.75, 0.72, 0.33],
        waterColor: [0.16, 0.52, 0.80],
        baseHeight: 65
    },
    [BIOME.SWAMP]: {
        name: 'Swamp',
        grassColor: [0.30, 0.35, 0.16],
        waterColor: [0.25, 0.31, 0.22],
        baseHeight: 61
    }
};

class Chunk {
    constructor(x, z) {
        this.x = x;
        this.z = z;
        this.data = new Uint16Array(CHUNK_SIZE * WORLD_HEIGHT * CHUNK_SIZE);
        this.isGenerated = false;
    }

    getVoxel(x, y, z) {
        if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= WORLD_HEIGHT || z < 0 || z >= CHUNK_SIZE) return 0;
        return this.data[y * CHUNK_SIZE * CHUNK_SIZE + z * CHUNK_SIZE + x] & 0xFF;
    }

    getMeta(x, y, z) {
        if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= WORLD_HEIGHT || z < 0 || z >= CHUNK_SIZE) return 0;
        return (this.data[y * CHUNK_SIZE * CHUNK_SIZE + z * CHUNK_SIZE + x] >> 8) & 0xFF;
    }

    setVoxel(x, y, z, value, meta = 0) {
        if (x >= 0 && x < CHUNK_SIZE && y >= 0 && y < WORLD_HEIGHT && z >= 0 && z < CHUNK_SIZE) {
            this.data[y * CHUNK_SIZE * CHUNK_SIZE + z * CHUNK_SIZE + x] = (value & 0xFF) | ((meta & 0xFF) << 8);
        }
    }
}

class GeometryBuilder {
    constructor(initialCapacity = 16000) {
        this.positions = new Float32Array(initialCapacity * 3);
        this.normals = new Float32Array(initialCapacity * 3);
        this.uvs = new Float32Array(initialCapacity * 2);
        this.colors = new Float32Array(initialCapacity * 3);
        this.indices = new Uint32Array(initialCapacity * 1.5);
        this.vCount = 0;
        this.iCount = 0;
    }

    ensureCapacity(verticesToAdd, indicesToAdd) {
        if ((this.vCount + verticesToAdd) * 3 >= this.positions.length) {
            const newSize = Math.max(this.positions.length * 2, (this.vCount + verticesToAdd) * 6);
            const p = new Float32Array(newSize);
            const n = new Float32Array(newSize);
            const c = new Float32Array(newSize);
            const u = new Float32Array((newSize / 3) * 2);

            p.set(this.positions);
            n.set(this.normals);
            c.set(this.colors);
            u.set(this.uvs);

            this.positions = p;
            this.normals = n;
            this.colors = c;
            this.uvs = u;
        }

        if (this.iCount + indicesToAdd >= this.indices.length) {
            const newSize = Math.max(this.indices.length * 2, this.iCount + indicesToAdd + 1000);
            const i = new Uint32Array(newSize);
            i.set(this.indices);
            this.indices = i;
        }
    }
}

class WorldRegion {
    constructor(rx, rz, world) {
        this.rx = rx;
        this.rz = rz;
        this.world = world;
        this.sections = new Array(SECTIONS_PER_CHUNK).fill(null);
        this.sectionVisFrame = new Int32Array(SECTIONS_PER_CHUNK).fill(-1);
        this.sectionPassability = new Array(SECTIONS_PER_CHUNK).fill(null).map(() => ({
            xp: true, xn: true, yp: true, yn: true, zp: true, zn: true
        }));
        this.needsUpdate = false;
        this.chunkX = rx * CHUNK_SIZE;
        this.chunkZ = rz * CHUNK_SIZE;
        this.sectionSpheres = [];
        const radius = Math.sqrt(CHUNK_SIZE * CHUNK_SIZE + SECTION_HEIGHT * SECTION_HEIGHT + CHUNK_SIZE * CHUNK_SIZE) / 2;
        for (let i = 0; i < SECTIONS_PER_CHUNK; i++) {
            const centerY = (i * SECTION_HEIGHT) + (SECTION_HEIGHT / 2);
            this.sectionSpheres.push(new THREE.Sphere(new THREE.Vector3(this.chunkX + CHUNK_SIZE / 2, centerY, this.chunkZ + CHUNK_SIZE / 2), radius + 2.0));
        }
        this.paddedCache = new Uint16Array(PX * PY * PZ);
    }

    dispose() {
        for (let i = 0; i < this.sections.length; i++) {
            if (this.sections[i]) {
                this.world.scene.remove(this.sections[i]);
                if (this.sections[i].geometry) this.sections[i].geometry.dispose();
                this.sections[i] = null;
            }
        }
    }

    checkUpdates() {
        if (this.needsUpdate) {
            const chunk = this.world.getChunk(this.rx, this.rz);
            if (chunk && chunk.isGenerated) {
                for (let i = 0; i < SECTIONS_PER_CHUNK; i++) {
                    const exists = this.world.meshBuildQueue.find(t => t.region === this && t.sectionIndex === i);
                    if (!exists) this.world.meshBuildQueue.push({ region: this, sectionIndex: i, chunk: chunk });
                }
                this.needsUpdate = false;
            }
        }
    }

    fillPaddedCache(startY) {
        for (let y = -1; y <= SECTION_HEIGHT + 1; y++) {
            const wy = startY + y;
            const yIdx = (y + 1) * PX * PZ;
            if (wy < 0 || wy >= WORLD_HEIGHT) {
                for (let z = -1; z <= CHUNK_SIZE; z++) {
                    const zIdx = yIdx + (z + 1) * PX;
                    for (let x = -1; x <= CHUNK_SIZE; x++) {
                        this.paddedCache[zIdx + (x + 1)] = 0;
                    }
                }
                continue;
            }
            for (let z = -1; z <= CHUNK_SIZE; z++) {
                const zIdx = yIdx + (z + 1) * PX;
                const wz = this.chunkZ + z;
                for (let x = -1; x <= CHUNK_SIZE; x++) {
                    const wx = this.chunkX + x;
                    this.paddedCache[zIdx + (x + 1)] = this.world.getRawVoxel(wx, wy, wz);
                }
            }
        }
    }

    getCacheVoxelRaw(x, y, z) {
        return this.paddedCache[(y + 1) * PX * PZ + (z + 1) * PX + (x + 1)];
    }

    isCacheSolid(x, y, z) {
        const raw = this.paddedCache[(y + 1) * PX * PZ + (z + 1) * PX + (x + 1)];
        const v = raw & 0xFF;
        if (v === BLOCK.AIR) return 0;
        const meta = (raw >> 8) & 0xFF;
        const props = BLOCK.get(v);

        // Открытые двери и люки проходимы (не твердые)
        if (props.isDoor && (meta & 2) !== 0) return 0;
        if (props.isTrapdoor && (meta & 1) !== 0) return 0;

        return props.isSolid && !props.isTransparent ? 1 : 0;
    }

    getWaterOffset(lx, ly, lz, dx, dz) {
        let sumHeight = 0;
        let count = 0;
        for (let i = 0; i < 2; i++) {
            for (let j = 0; j < 2; j++) {
                const nx = lx + dx - i;
                const nz = lz + dz - j;
                const rawAbove = this.getCacheVoxelRaw(nx, ly + 1, nz);
                if ((rawAbove & 0xFF) === BLOCK.WATER) return 0.0;
                const raw = this.getCacheVoxelRaw(nx, ly, nz);
                const id = raw & 0xFF;
                if (id === BLOCK.WATER) {
                    const meta = (raw >> 8) & 0xFF;
                    let height = (meta === 8 || meta === 0) ? 0.85 : ((meta / 8.0) * 0.75 + 0.1);
                    sumHeight += height;
                    count++;
                }
            }
        }
        if (count === 0) return 0.15;
        return 1.0 - (sumHeight / count);
    }

    // Расчёт динамического освещения в стиле Minecraft (Skylight + Blocklight + Caves)
    computeLighting(startY) {
        const lightMap = new Uint8Array(PX * PY * PZ);
        const skyQueue = [];
        const blockQueue = [];

        // 1. Трассировка солнечного света сверху вниз
        for (let z = 0; z < PZ; z++) {
            const wz = this.chunkZ + z - 1;
            for (let x = 0; x < PX; x++) {
                const wx = this.chunkX + x - 1;
                const th = this.world.getTerrainHeightAt(wx, wz);

                let sky = 15;
                for (let y = PY - 1; y >= 0; y--) {
                    const wy = startY + y - 1;
                    const idx = y * PX * PZ + z * PX + x;
                    const raw = this.paddedCache[idx];
                    const voxel = raw & 0xFF;

                    if (voxel === BLOCK.AIR) {
                        if (wy <= th) {
                            const depth = th - wy;
                            if (depth > 2) sky = 0; // В пещерах без прямого неба - 0
                            else sky = Math.max(0, 15 - depth * 4);
                        }
                        lightMap[idx] = (sky << 4);
                        if (sky > 1) skyQueue.push(x, y, z);
                    } else {
                        const props = BLOCK.get(voxel);
                        if (!props.isSolid || props.isTransparent) {
                            if (voxel === BLOCK.WATER) sky = Math.max(0, sky - 2);
                            else if (props.isLeaves) sky = Math.max(0, sky - 1);
                            lightMap[idx] = (sky << 4);
                            if (sky > 1) skyQueue.push(x, y, z);
                        } else {
                            sky = 0; // Сплошной блок полностью блокирует солнечный свет
                            lightMap[idx] = 0;
                        }

                        // Проверка источников света блоков (Факелы, печи)
                        const emit = props.lightEmission || (voxel === BLOCK.TORCH ? 14 : 0);
                        if (emit > 0) {
                            lightMap[idx] = (lightMap[idx] & 0xF0) | emit;
                            blockQueue.push(x, y, z);
                        }
                    }
                }
            }
        }

        // 2. Распространение солнечного света в навесы и входы в пещеры (BFS)
        let sHead = 0;
        const dirs = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
        while (sHead < skyQueue.length) {
            const qx = skyQueue[sHead++];
            const qy = skyQueue[sHead++];
            const qz = skyQueue[sHead++];
            const qIdx = qy * PX * PZ + qz * PX + qx;
            const curSky = (lightMap[qIdx] >> 4) & 0xF;
            if (curSky <= 1) continue;

            for (let d = 0; d < 6; d++) {
                const nx = qx + dirs[d][0], ny = qy + dirs[d][1], nz = qz + dirs[d][2];
                if (nx >= 0 && nx < PX && ny >= 0 && ny < PY && nz >= 0 && nz < PZ) {
                    const nIdx = ny * PX * PZ + nz * PX + nx;
                    const nRaw = this.paddedCache[nIdx];
                    const nVoxel = nRaw & 0xFF;
                    const nProps = BLOCK.get(nVoxel);
                    if (nVoxel === BLOCK.AIR || nProps.isTransparent) {
                        const nSky = (lightMap[nIdx] >> 4) & 0xF;
                        const loss = (nVoxel === BLOCK.WATER) ? 2 : 1;
                        const nextSky = Math.max(0, curSky - loss);
                        if (nextSky > nSky) {
                            lightMap[nIdx] = (nextSky << 4) | (lightMap[nIdx] & 0xF);
                            skyQueue.push(nx, ny, nz);
                        }
                    }
                }
            }
        }

        // 3. Динамический свет от игрока (если держит факел / светящийся предмет)
        if (this.world.playerPos) {
            const p = this.world.playerPos;
            const plx = Math.floor(p.x - this.chunkX) + 1;
            const ply = Math.floor(p.y - startY) + 1;
            const plz = Math.floor(p.z - this.chunkZ) + 1;
            if (plx >= 0 && plx < PX && ply >= 0 && ply < PY && plz >= 0 && plz < PZ) {
                const pIdx = ply * PX * PZ + plz * PX + plx;
                const dynamicVal = 14;
                if ((lightMap[pIdx] & 0xF) < dynamicVal) {
                    lightMap[pIdx] = (lightMap[pIdx] & 0xF0) | dynamicVal;
                    blockQueue.push(plx, ply, plz);
                }
            }
        }

        // 4. Распространение света блоков (BFS)
        let bHead = 0;
        while (bHead < blockQueue.length) {
            const qx = blockQueue[bHead++];
            const qy = blockQueue[bHead++];
            const qz = blockQueue[bHead++];
            const qIdx = qy * PX * PZ + qz * PX + qx;
            const curBlock = lightMap[qIdx] & 0xF;
            if (curBlock <= 1) continue;

            for (let d = 0; d < 6; d++) {
                const nx = qx + dirs[d][0], ny = qy + dirs[d][1], nz = qz + dirs[d][2];
                if (nx >= 0 && nx < PX && ny >= 0 && ny < PY && nz >= 0 && nz < PZ) {
                    const nIdx = ny * PX * PZ + nz * PX + nx;
                    const nRaw = this.paddedCache[nIdx];
                    const nVoxel = nRaw & 0xFF;
                    const nProps = BLOCK.get(nVoxel);
                    if (nVoxel === BLOCK.AIR || nProps.isTransparent) {
                        const nBlock = lightMap[nIdx] & 0xF;
                        const nextBlock = curBlock - 1;
                        if (nextBlock > nBlock) {
                            lightMap[nIdx] = (lightMap[nIdx] & 0xF0) | nextBlock;
                            blockQueue.push(nx, ny, nz);
                        }
                    }
                }
            }
        }

        return lightMap;
    }

    generateSection(sectionIndex, chunk) {
        if (this.sections[sectionIndex]) {
            this.world.scene.remove(this.sections[sectionIndex]);
            if (this.sections[sectionIndex].geometry) this.sections[sectionIndex].geometry.dispose();
            this.sections[sectionIndex] = null;
        }

        const startY = sectionIndex * SECTION_HEIGHT;
        this.fillPaddedCache(startY);
        const lightMap = this.computeLighting(startY);
        const builder = new GeometryBuilder();
        const useAO = this.world.settings.get('ambientOcclusion');
        const sunBrightness = this.world.sunBrightness !== undefined ? this.world.sunBrightness : 1.0;

        const getTexName = (props, dir, meta) => {
            if (props.isDoor) {
                return (meta & 1) ? props.texture.top : props.texture.bottom;
            }
            if (typeof props.texture !== 'object') return props.texture;
            if (dir === 'top') return props.texture.top;
            if (dir === 'bottom') return props.texture.bottom;
            if (dir === 'front' && props.texture.front) return props.texture.front;
            return props.texture.side;
        };

        const faces = [
            { dirName: 'side', n: [1, 0, 0], axis: 0, sign: 1, corners: [[1, 0, 0], [1, 1, 0], [1, 0, 1], [1, 1, 1]] },
            { dirName: 'side', n: [-1, 0, 0], axis: 0, sign: -1, corners: [[0, 0, 1], [0, 1, 1], [0, 0, 0], [0, 1, 0]] },
            { dirName: 'top', n: [0, 1, 0], axis: 1, sign: 1, corners: [[0, 1, 1], [1, 1, 1], [0, 1, 0], [1, 1, 0]] },
            { dirName: 'bottom', n: [0, -1, 0], axis: 1, sign: -1, corners: [[0, 0, 0], [1, 0, 0], [0, 0, 1], [1, 0, 1]] },
            { dirName: 'front', n: [0, 0, 1], axis: 2, sign: 1, corners: [[1, 0, 1], [1, 1, 1], [0, 0, 1], [0, 1, 1]] },
            { dirName: 'side', n: [0, 0, -1], axis: 2, sign: -1, corners: [[0, 0, 0], [0, 1, 0], [1, 0, 0], [1, 1, 0]] }
        ];

        const waterFacesToBuild = [];
        const cutoutFacesToBuild = [];

        // 1. Генерация граней блоков (1x1 quads)
        for (let y = 0; y < SECTION_HEIGHT; y++) {
            const wy = startY + y;
            for (let z = 0; z < CHUNK_SIZE; z++) {
                const wz = this.chunkZ + z;
                for (let x = 0; x < CHUNK_SIZE; x++) {
                    const wx = this.chunkX + x;
                    const raw = this.getCacheVoxelRaw(x, y, z);
                    const voxel = raw & 0xFF;
                    if (voxel === BLOCK.AIR) continue;
                    const bProps = BLOCK.get(voxel);
                    if (bProps.isPlant) continue;

                    const meta = (raw >> 8) & 0xFF;
                    const isCutoutBlock = bProps.isTransparent && voxel !== BLOCK.WATER;

                    for (const face of faces) {
                        const nx = x + (face.axis === 0 ? face.sign : 0);
                        const ny = y + (face.axis === 1 ? face.sign : 0);
                        const nz = z + (face.axis === 2 ? face.sign : 0);

                        const neighborRaw = this.getCacheVoxelRaw(nx, ny, nz);
                        const neighborId = neighborRaw & 0xFF;
                        const nProps = BLOCK.get(neighborId);

                        let draw = false;
                        if (neighborId === BLOCK.AIR || nProps.isPlant) {
                            draw = true;
                        } else if (nProps.isTransparent) {
                            if (voxel === BLOCK.WATER && neighborId === BLOCK.WATER) {
                                draw = false;
                            } else if (bProps.isTransparent && voxel === neighborId) {
                                draw = false;
                            } else {
                                draw = true;
                            }
                        }

                        if (!draw) continue;

                        // Сэмплирование света соседнего прозрачного блока
                        const lx = nx + 1, ly = ny + 1, lz = nz + 1;
                        const lIdx = ly * PX * PZ + lz * PX + lx;
                        const lightVal = lightMap[lIdx];
                        const sky = (lightVal >> 4) & 0xF;
                        const block = lightVal & 0xF;

                        const effectiveSky = sky * sunBrightness;
                        const maxLight = Math.max(block, effectiveSky);
                        // Minecraft кривая яркости
                        const baseBrightness = 0.05 + 0.95 * Math.pow(maxLight / 15.0, 1.5);

                        let sideDim = 1.0;
                        if (face.axis === 0) sideDim = 0.8;
                        else if (face.axis === 2) sideDim = 0.7;
                        else if (face.sign < 0) sideDim = 0.5;

                        const aoFactors = [
                            useAO ? this.calcAO(x, y, z, face.dirName, 0) : 1.0,
                            useAO ? this.calcAO(x, y, z, face.dirName, 1) : 1.0,
                            useAO ? this.calcAO(x, y, z, face.dirName, 2) : 1.0,
                            useAO ? this.calcAO(x, y, z, face.dirName, 3) : 1.0
                        ];

                        const isWater = (voxel === BLOCK.WATER);

                        if (isWater) {
                            const yOffsets = [0, 0, 0, 0];
                            for (let i = 0; i < 4; i++) {
                                if (face.corners[i][1] > 0) {
                                    yOffsets[i] = this.getWaterOffset(x, y, z, face.corners[i][0], face.corners[i][2]);
                                }
                            }
                            const waterCol = this.world.getBiomeWaterColor(wx, wz);
                            const colors = [];
                            for (let i = 0; i < 4; i++) {
                                const l = baseBrightness * sideDim * aoFactors[i];
                                colors.push(waterCol[0] * l, waterCol[1] * l, waterCol[2] * l);
                            }
                            waterFacesToBuild.push({
                                wx, wy, wz, n: face.n, corners: face.corners,
                                uvs: [0, 0, 0, 1, 1, 0, 1, 1],
                                colors, yOffsets
                            });
                        } else {
                            const texName = getTexName(bProps, face.dirName, meta);
                            const uvBounds = this.world.atlas.getUV(texName);
                            const { u0, v0, u1, v1 } = uvBounds;

                            let uvs;
                            if (face.dirName === 'top') uvs = [u0, v1, u1, v1, u0, v0, u1, v0];
                            else if (face.dirName === 'bottom') uvs = [u0, v0, u1, v0, u0, v1, u1, v1];
                            else uvs = [u1, v0, u1, v1, u0, v0, u0, v1];

                            const isGrassTop = (voxel === BLOCK.GRASS && face.dirName === 'top');
                            const grassCol = isGrassTop ? this.world.getBiomeGrassColor(wx, wz) : null;

                            const colors = [];
                            for (let i = 0; i < 4; i++) {
                                const l = baseBrightness * sideDim * aoFactors[i];
                                if (isGrassTop) {
                                    colors.push(grassCol[0] * l, grassCol[1] * l, grassCol[2] * l);
                                } else {
                                    colors.push(l, l, l);
                                }
                            }

                            if (isCutoutBlock) {
                                cutoutFacesToBuild.push({
                                    wx, wy, wz, n: face.n, corners: face.corners, uvs, colors
                                });
                            } else {
                                this.addFacePacked(builder, wx, wy, wz, face.n, face.corners, uvs, colors, null);
                            }
                        }
                    }
                }
            }
        }

        const solidIndexCount = builder.iCount;

        // 2. Вода вторым проходом (группа 1: waterMaterial)
        for (let i = 0; i < waterFacesToBuild.length; i++) {
            const wf = waterFacesToBuild[i];
            this.addFacePacked(builder, wf.wx, wf.wy, wf.wz, wf.n, wf.corners, wf.uvs, wf.colors, wf.yOffsets);
        }
        const waterIndexCount = builder.iCount - solidIndexCount;

        // 3. Cutout грани (листва, стекло, двери, группа 2: cutoutMaterial)
        for (let i = 0; i < cutoutFacesToBuild.length; i++) {
            const cf = cutoutFacesToBuild[i];
            this.addFacePacked(builder, cf.wx, cf.wy, cf.wz, cf.n, cf.corners, cf.uvs, cf.colors, null);
        }

        // 4. Растительность (Цветы, высокая трава, факелы - X-Cross, группа 2: cutoutMaterial)
        for (let y = 0; y < SECTION_HEIGHT; y++) {
            const wy = startY + y;
            for (let z = 0; z < CHUNK_SIZE; z++) {
                const wz = this.chunkZ + z;
                for (let x = 0; x < CHUNK_SIZE; x++) {
                    const wx = this.chunkX + x;
                    const raw = this.getCacheVoxelRaw(x, y, z);
                    const voxel = raw & 0xFF;
                    if (voxel === BLOCK.AIR) continue;
                    const bProps = BLOCK.get(voxel);
                    if (bProps.isPlant) {
                        const texName = getTexName(bProps, 'side', 0);
                        const uvBounds = this.world.atlas.getUV(texName);

                        const pIdx = (y + 1) * PX * PZ + (z + 1) * PX + (x + 1);
                        const pVal = lightMap[pIdx];
                        const pSky = (pVal >> 4) & 0xF;
                        const pBlock = pVal & 0xF;
                        const pMaxLight = Math.max(pBlock, pSky * sunBrightness);
                        const pBright = Math.max(0.08, 0.05 + 0.95 * Math.pow(pMaxLight / 15.0, 1.5));

                        let pColor = [pBright, pBright, pBright];
                        if (voxel === BLOCK.TALL_GRASS || voxel === BLOCK.DOUBLE_TALL_GRASS_BOTTOM || voxel === BLOCK.DOUBLE_TALL_GRASS_TOP) {
                            const gc = this.world.getBiomeGrassColor(wx, wz);
                            pColor = [gc[0] * pBright, gc[1] * pBright, gc[2] * pBright];
                        }

                        this.addPlantMesh(builder, wx, wy, wz, uvBounds, pColor);
                    }
                }
            }
        }

        const cutoutIndexCount = builder.iCount - solidIndexCount - waterIndexCount;

        if (builder.vCount === 0) return;

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(builder.positions.subarray(0, builder.vCount * 3), 3));
        geometry.setAttribute('normal', new THREE.BufferAttribute(builder.normals.subarray(0, builder.vCount * 3), 3));
        geometry.setAttribute('uv', new THREE.BufferAttribute(builder.uvs.subarray(0, builder.vCount * 2), 2));
        geometry.setAttribute('color', new THREE.BufferAttribute(builder.colors.subarray(0, builder.vCount * 3), 3));
        geometry.setIndex(new THREE.BufferAttribute(builder.indices.subarray(0, builder.iCount), 1));

        if (solidIndexCount > 0) {
            geometry.addGroup(0, solidIndexCount, 0);
        }
        if (waterIndexCount > 0) {
            geometry.addGroup(solidIndexCount, waterIndexCount, 1);
        }
        if (cutoutIndexCount > 0) {
            geometry.addGroup(solidIndexCount + waterIndexCount, cutoutIndexCount, 2);
        }

        geometry.boundingSphere = this.sectionSpheres[sectionIndex].clone();

        const mesh = new THREE.Mesh(geometry, this.world.materials);
        const shadowSize = this.world.settings.get('shadowMapSize');
        mesh.castShadow = shadowSize > 0;
        mesh.receiveShadow = shadowSize > 0;
        mesh.frustumCulled = false;
        mesh.visible = false;

        this.world.scene.add(mesh);
        this.sections[sectionIndex] = mesh;
    }

    addFacePacked(builder, wx, wy, wz, n, corners, uvs, colors, yOffsets) {
        builder.ensureCapacity(4, 6);
        const vBase = builder.vCount;
        let pIdx = vBase * 3, uIdx = vBase * 2, cIdx = vBase * 3;

        for (let i = 0; i < 4; i++) {
            builder.positions[pIdx] = corners[i][0] + wx;
            builder.positions[pIdx + 1] = corners[i][1] - (yOffsets ? yOffsets[i] : 0) + wy;
            builder.positions[pIdx + 2] = corners[i][2] + wz;

            builder.normals[pIdx] = n[0];
            builder.normals[pIdx + 1] = n[1];
            builder.normals[pIdx + 2] = n[2];

            builder.uvs[uIdx] = uvs[i * 2];
            builder.uvs[uIdx + 1] = uvs[i * 2 + 1];

            builder.colors[cIdx] = colors[i * 3];
            builder.colors[cIdx + 1] = colors[i * 3 + 1];
            builder.colors[cIdx + 2] = colors[i * 3 + 2];

            pIdx += 3;
            uIdx += 2;
            cIdx += 3;
        }

        let iIdx = builder.iCount;
        builder.indices[iIdx] = vBase;
        builder.indices[iIdx + 1] = vBase + 1;
        builder.indices[iIdx + 2] = vBase + 2;

        builder.indices[iIdx + 3] = vBase + 2;
        builder.indices[iIdx + 4] = vBase + 1;
        builder.indices[iIdx + 5] = vBase + 3;

        builder.vCount += 4;
        builder.iCount += 6;
    }

    addPlantMesh(builder, wx, wy, wz, uvBounds, lightColor) {
        builder.ensureCapacity(8, 12);
        const vBase = builder.vCount;
        let pIdx = vBase * 3, uIdx = vBase * 2, cIdx = vBase * 3;

        const d1 = [
            [wx, wy, wz], [wx + 1, wy, wz + 1],
            [wx, wy + 1, wz], [wx + 1, wy + 1, wz + 1]
        ];
        const d2 = [
            [wx, wy, wz + 1], [wx + 1, wy, wz],
            [wx, wy + 1, wz + 1], [wx + 1, wy + 1, wz]
        ];

        const plantVerts = [...d1, ...d2];
        const u0 = uvBounds ? uvBounds.u0 : 0;
        const v0 = uvBounds ? uvBounds.v0 : 0;
        const u1 = uvBounds ? uvBounds.u1 : 1;
        const v1 = uvBounds ? uvBounds.v1 : 1;

        const plantUVs = [
            u0, v0, u1, v0, u0, v1, u1, v1,
            u0, v0, u1, v0, u0, v1, u1, v1
        ];

        const cr = lightColor[0], cg = lightColor[1], cb = lightColor[2];

        for (let i = 0; i < 8; i++) {
            builder.positions[pIdx] = plantVerts[i][0];
            builder.positions[pIdx + 1] = plantVerts[i][1];
            builder.positions[pIdx + 2] = plantVerts[i][2];

            builder.normals[pIdx] = 0;
            builder.normals[pIdx + 1] = 1;
            builder.normals[pIdx + 2] = 0;

            builder.uvs[uIdx] = plantUVs[i * 2];
            builder.uvs[uIdx + 1] = plantUVs[i * 2 + 1];

            builder.colors[cIdx] = cr;
            builder.colors[cIdx + 1] = cg;
            builder.colors[cIdx + 2] = cb;

            pIdx += 3;
            uIdx += 2;
            cIdx += 3;
        }

        let iIdx = builder.iCount;
        builder.indices[iIdx] = vBase;
        builder.indices[iIdx + 1] = vBase + 1;
        builder.indices[iIdx + 2] = vBase + 2;

        builder.indices[iIdx + 3] = vBase + 2;
        builder.indices[iIdx + 4] = vBase + 1;
        builder.indices[iIdx + 5] = vBase + 3;

        builder.indices[iIdx + 6] = vBase + 4;
        builder.indices[iIdx + 7] = vBase + 5;
        builder.indices[iIdx + 8] = vBase + 6;

        builder.indices[iIdx + 9] = vBase + 6;
        builder.indices[iIdx + 10] = vBase + 5;
        builder.indices[iIdx + 11] = vBase + 7;

        builder.vCount += 8;
        builder.iCount += 12;
    }

    calcAO(x, y, z, dir, vIdx) {
        const s = (dx, dy, dz) => this.isCacheSolid(x + dx, y + dy, z + dz);
        let s1 = 0, s2 = 0, c = 0;

        if (dir === 'top') {
            if (vIdx === 0) { s1 = s(-1, 1, 0); s2 = s(0, 1, 1); c = s(-1, 1, 1); }
            else if (vIdx === 1) { s1 = s(1, 1, 0); s2 = s(0, 1, 1); c = s(1, 1, 1); }
            else if (vIdx === 2) { s1 = s(-1, 1, 0); s2 = s(0, 1, -1); c = s(-1, 1, -1); }
            else if (vIdx === 3) { s1 = s(1, 1, 0); s2 = s(0, 1, -1); c = s(1, 1, -1); }
        } else if (dir === 'bottom') {
            if (vIdx === 0) { s1 = s(-1, -1, 0); s2 = s(0, -1, -1); c = s(-1, -1, -1); }
            else if (vIdx === 1) { s1 = s(1, -1, 0); s2 = s(0, -1, -1); c = s(1, -1, -1); }
            else if (vIdx === 2) { s1 = s(-1, -1, 0); s2 = s(0, -1, 1); c = s(-1, -1, 1); }
            else if (vIdx === 3) { s1 = s(1, -1, 0); s2 = s(0, -1, 1); c = s(1, -1, 1); }
        } else if (dir === 'front') {
            if (vIdx === 0) { s1 = s(1, 0, 1); s2 = s(0, 1, 1); c = s(1, 1, 1); }
            else if (vIdx === 1) { s1 = s(1, 0, 1); s2 = s(0, -1, 1); c = s(1, -1, 1); }
            else if (vIdx === 2) { s1 = s(-1, 0, 1); s2 = s(0, 1, 1); c = s(-1, 1, 1); }
            else if (vIdx === 3) { s1 = s(-1, 0, 1); s2 = s(0, -1, 1); c = s(-1, -1, 1); }
        } else if (dir === 'side') {
            if (this.isCacheSolid(x, y + 1, z)) return 0.6;
        }

        if (s1 && s2) return 0.5;
        return 1.0 - (s1 + s2 + c) * 0.16;
    }
}

export class World {
    constructor(scene, seed, renderer, settingsManager) {
        this.scene = scene;
        this.renderer = renderer;
        this.settings = settingsManager;
        this.seed = typeof seed === 'number' ? seed : (Math.random() * 10000);
        this.chunks = {};
        this.regions = {};

        // Шум биомов и ландшафта
        this.terrainNoise = new SimplexNoise(this.seed);
        this.caveNoise = new SimplexNoise(this.seed + 1337);
        this.continentalNoise = new SimplexNoise(this.seed + 201);
        this.tempNoise = new SimplexNoise(this.seed + 503);
        this.moistNoise = new SimplexNoise(this.seed + 709);

        this.textureGenerator = new TextureGenerator();
        this.atlas = null;
        this.atlasTexture = null;
        this.materials = [];
        this.waterTexture = null;
        this.sunBrightness = 1.0;
        this.playerPos = null;

        this.initMaterials();

        this.frustum = new THREE.Frustum();
        this.projScreenMatrix = new THREE.Matrix4();
        this.fallingBlocks = [];
        this.itemDrops = [];
        this.cullFrameId = 0;
        this.meshBuildQueue = [];
        this.fluidQueue = [];
        this.fluidSet = new Set();
        this.lastChunkX = null;
        this.lastChunkZ = null;
        this.visibleSections = [];
    }

    initMaterials() {
        if (!this.atlas) {
            this.atlas = new TextureAtlas(16, 256);
        }
        registerAllProceduralTextures(this.atlas, this.textureGenerator);
        this.atlasTexture = this.atlas.buildTexture();

        // 1. Монолитный непрозрачный материал для сплошных блоков (БЕЗ alphaTest и с FrontSide)
        const opaqueMaterial = new THREE.MeshLambertMaterial({
            map: this.atlasTexture,
            transparent: false,
            alphaTest: 0,
            vertexColors: true,
            side: THREE.FrontSide,
            depthWrite: true
        });

        // 2. Полупрозрачная вода
        this.waterTexture = this.textureGenerator.generate('water');
        this.waterTexture.wrapS = THREE.RepeatWrapping;
        this.waterTexture.wrapT = THREE.RepeatWrapping;

        const waterMaterial = new THREE.MeshLambertMaterial({
            map: this.waterTexture,
            transparent: true,
            opacity: 0.72,
            side: THREE.DoubleSide,
            vertexColors: true,
            depthWrite: false
        });

        // 3. Cutout материал для листвы, стекла, дверей и растений (alphaTest: 0.15, DoubleSide)
        const cutoutMaterial = new THREE.MeshLambertMaterial({
            map: this.atlasTexture,
            transparent: false,
            alphaTest: 0.15,
            vertexColors: true,
            side: THREE.DoubleSide,
            depthWrite: true
        });

        this.materials = [opaqueMaterial, waterMaterial, cutoutMaterial];
    }

    reloadMaterials() {
        this.initMaterials();
        for (const k in this.regions) {
            const region = this.regions[k];
            for (let i = 0; i < region.sections.length; i++) {
                if (region.sections[i]) {
                    region.sections[i].material = this.materials;
                }
            }
        }
    }

    getBiomeCoords(wx, wz) {
        // Искажение координат шумом сглаживает прямолинейные границы биомов
        const n1 = this.terrainNoise.noise2D(wx * 0.015, wz * 0.015);
        const n2 = this.terrainNoise.noise2D(wx * 0.045 + 50, wz * 0.045 + 50);
        const warpX = n1 * 28 + n2 * 8;
        const warpZ = this.terrainNoise.noise2D(wx * 0.015 + 100, wz * 0.015 + 100) * 28 + this.terrainNoise.noise2D(wx * 0.045 + 150, wz * 0.045 + 150) * 8;
        return [wx + warpX, wz + warpZ];
    }

    getBiomeAt(wx, wz) {
        const [bx, bz] = this.getBiomeCoords(wx, wz);
        const c = this.continentalNoise.noise2D(bx * 0.002, bz * 0.002);
        if (c < -0.28) return BIOME.OCEAN;
        if (c < -0.14) return BIOME.BEACH;
        if (c > 0.40) return BIOME.MOUNTAINS;

        const t = this.tempNoise.noise2D(bx * 0.0025, bz * 0.0025);
        const m = this.moistNoise.noise2D(bx * 0.0025, bz * 0.0025);

        if (t > 0.42 && m < -0.18) return BIOME.DESERT;
        if (m > 0.38 && t < 0.22) return BIOME.SWAMP;
        if (m > 0.32) return BIOME.FLOWER_MEADOW;
        if (t > 0.18 && m > 0.04) return BIOME.DARK_OAK_FOREST;
        if (t < -0.14) return BIOME.BIRCH_FOREST;
        return BIOME.OAK_FOREST;
    }

    getBiomeGrassColor(wx, wz) {
        const offsets = [
            [0, 0, 4],
            [4, 0, 2], [-4, 0, 2],
            [0, 4, 2], [0, -4, 2],
            [6, 6, 1], [-6, 6, 1], [6, -6, 1], [-6, -6, 1]
        ];
        let r = 0, g = 0, b = 0, tw = 0;
        for (let i = 0; i < offsets.length; i++) {
            const [dx, dz, w] = offsets[i];
            const biome = this.getBiomeAt(wx + dx, wz + dz);
            const col = BIOME_DATA[biome].grassColor;
            r += col[0] * w;
            g += col[1] * w;
            b += col[2] * w;
            tw += w;
        }
        return [r / tw, g / tw, b / tw];
    }

    getBiomeWaterColor(wx, wz) {
        const offsets = [
            [0, 0, 4],
            [4, 0, 2], [-4, 0, 2],
            [0, 4, 2], [0, -4, 2],
            [6, 6, 1], [-6, 6, 1], [6, -6, 1], [-6, -6, 1]
        ];
        let r = 0, g = 0, b = 0, tw = 0;
        for (let i = 0; i < offsets.length; i++) {
            const [dx, dz, w] = offsets[i];
            const biome = this.getBiomeAt(wx + dx, wz + dz);
            const col = BIOME_DATA[biome].waterColor;
            r += col[0] * w;
            g += col[1] * w;
            b += col[2] * w;
            tw += w;
        }
        return [r / tw, g / tw, b / tw];
    }

    getTerrainHeightAt(wx, wz) {
        const [bx, bz] = this.getBiomeCoords(wx, wz);
        const c = this.continentalNoise.noise2D(bx * 0.002, bz * 0.002);
        const t = this.tempNoise.noise2D(bx * 0.0025, bz * 0.0025);
        const m = this.moistNoise.noise2D(bx * 0.0025, bz * 0.0025);

        const hills = this.terrainNoise.noise2D(wx * 0.012, wz * 0.012);
        const detail = this.terrainNoise.noise2D(wx * 0.035, wz * 0.035) * 3;

        // Базовая высота суши (холмы)
        let inlandH = 66 + hills * 9;

        // 1. Плавное влияние болота (снижает высоту к воде, без ступеней)
        const swampT = Math.max(0, Math.min(1, (m - 0.25) / 0.15)) * Math.max(0, Math.min(1, (0.35 - t) / 0.15));
        if (swampT > 0) {
            inlandH = inlandH * (1 - swampT) + (61.5 + hills * 2) * swampT;
        }

        // 2. Плавное влияние пустыни (дюны)
        const desertT = Math.max(0, Math.min(1, (t - 0.30) / 0.15)) * Math.max(0, Math.min(1, (-0.08 - m) / 0.15));
        if (desertT > 0) {
            inlandH = inlandH * (1 - desertT) + (65 + hills * 5) * desertT;
        }

        // 3. Величественные скалистые горы с хребтами и пиками (Ridged multi-fractal)
        const mountT = Math.max(0, Math.min(1, (c - 0.18) / 0.36));
        if (mountT > 0) {
            const mountSmooth = mountT * mountT * (3 - 2 * mountT);
            const ridge1 = 1.0 - Math.abs(this.terrainNoise.noise2D(wx * 0.009, wz * 0.009));
            const ridge2 = 1.0 - Math.abs(this.terrainNoise.noise2D(wx * 0.022, wz * 0.022));
            const crags = ridge1 * ridge1 * 48 + ridge2 * 24;
            const spireNoise = Math.max(0, this.terrainNoise.noise2D(wx * 0.04, wz * 0.04)) * 18;
            inlandH += mountSmooth * (28 + crags + spireNoise);
        }

        // 4. Побережье и океан (плавное соединение суши, пляжа и дна океана)
        const beachH = 61.5 + hills * 1.5;
        const depth = Math.max(0, (-0.28 - c) / 0.35);
        const oceanH = 58 - depth * 18;

        let finalH;
        if (c < -0.28) {
            finalH = oceanH;
        } else if (c < -0.14) {
            // Плавный переход океан -> пляж
            const tCoast = (c - (-0.28)) / 0.14;
            const sCoast = tCoast * tCoast * (3 - 2 * tCoast);
            finalH = oceanH * (1 - sCoast) + beachH * sCoast;
        } else if (c < 0.02) {
            // Плавный переход пляж -> суша
            const tInland = (c - (-0.14)) / 0.16;
            const sInland = tInland * tInland * (3 - 2 * tInland);
            finalH = beachH * (1 - sInland) + inlandH * sInland;
        } else {
            finalH = inlandH;
        }

        return Math.floor(finalH + detail);
    }

    getChunkKey(x, z) { return `${x},${z}`; }
    getRegionKey(x, z) { return `${x},${z}`; }
    getChunk(cx, cz) { return this.chunks[this.getChunkKey(cx, cz)]; }
    getRegion(rx, rz) { return this.regions[this.getRegionKey(rx, rz)]; }
    isChunkLoaded(x, z) { return !!this.getChunk(Math.floor(x / 16), Math.floor(z / 16)); }

    getRawVoxel(x, y, z) {
        const cx = Math.floor(x / CHUNK_SIZE), cz = Math.floor(z / CHUNK_SIZE);
        let c = this.getChunk(cx, cz);
        if (!c) {
            c = this.generateChunkData(cx, cz);
        }
        return c.data[y * CHUNK_SIZE * CHUNK_SIZE + (z - cz * CHUNK_SIZE) * CHUNK_SIZE + (x - cx * CHUNK_SIZE)];
    }

    getVoxel(x, y, z) {
        const cx = Math.floor(x / CHUNK_SIZE), cz = Math.floor(z / CHUNK_SIZE);
        let c = this.getChunk(cx, cz);
        return c ? c.getVoxel(x - cx * CHUNK_SIZE, y, z - cz * CHUNK_SIZE) : 0;
    }

    getMeta(x, y, z) {
        const cx = Math.floor(x / CHUNK_SIZE), cz = Math.floor(z / CHUNK_SIZE);
        let c = this.getChunk(cx, cz);
        return c ? c.getMeta(x - cx * CHUNK_SIZE, y, z - cz * CHUNK_SIZE) : 0;
    }

    getTerrainHeight(x, z) {
        for (let y = WORLD_HEIGHT - 1; y > 0; y--) {
            const v = this.getVoxel(x, y, z);
            if (v !== BLOCK.AIR && !BLOCK.get(v).isPlant) return y;
        }
        return 0;
    }

    isSolid(x, y, z) {
        const v = this.getVoxel(x, y, z);
        if (v === BLOCK.AIR) return false;
        const props = BLOCK.get(v);
        const meta = this.getMeta(x, y, z);
        if (props.isDoor && (meta & 2) !== 0) return false;
        if (props.isTrapdoor && (meta & 1) !== 0) return false;
        return props.isSolid;
    }

    isWater(x, y, z) {
        return this.getVoxel(x, y, z) === BLOCK.WATER;
    }

    setVoxel(x, y, z, v, meta = 0) {
        const cx = Math.floor(x / CHUNK_SIZE), cz = Math.floor(z / CHUNK_SIZE);
        let c = this.getChunk(cx, cz);
        if (!c) {
            c = this.generateChunkData(cx, cz);
        }
        if (v === BLOCK.WATER && meta === 0) meta = 8;
        const lx = x - cx * CHUNK_SIZE, lz = z - cz * CHUNK_SIZE;
        const oldRaw = c.getVoxel(lx, y, lz);

        c.setVoxel(lx, y, lz, v, meta);

        const flagUpdate = (dx, dz) => {
            const r = this.getRegion(cx + dx, cz + dz);
            if (r) r.needsUpdate = true;
        };

        flagUpdate(0, 0);
        if (lx === 0) flagUpdate(-1, 0); if (lx === CHUNK_SIZE - 1) flagUpdate(1, 0);
        if (lz === 0) flagUpdate(0, -1); if (lz === CHUNK_SIZE - 1) flagUpdate(0, 1);

        if (v === BLOCK.AIR) {
            if (oldRaw === BLOCK.DOUBLE_TALL_GRASS_BOTTOM) {
                if (this.getVoxel(x, y + 1, z) === BLOCK.DOUBLE_TALL_GRASS_TOP) {
                    this.setVoxel(x, y + 1, z, BLOCK.AIR);
                }
            } else if (oldRaw === BLOCK.DOUBLE_TALL_GRASS_TOP) {
                if (this.getVoxel(x, y - 1, z) === BLOCK.DOUBLE_TALL_GRASS_BOTTOM) {
                    this.setVoxel(x, y - 1, z, BLOCK.AIR);
                }
            }
            const above = this.getVoxel(x, y + 1, z);
            if (above === BLOCK.TALL_GRASS || above === BLOCK.DOUBLE_TALL_GRASS_BOTTOM) {
                this.setVoxel(x, y + 1, z, BLOCK.AIR);
            } else if (BLOCK.get(above).falling) {
                this.spawnFallingBlock(x, y + 1, z, above);
            }
        } else if (BLOCK.get(v).falling) {
            this.spawnFallingBlock(x, y, z, v);
        }

        this.triggerBlockPhysics(x, y, z);

        this.scheduleFluidUpdate(x, y, z);
        this.scheduleFluidUpdate(x + 1, y, z);
        this.scheduleFluidUpdate(x - 1, y, z);
        this.scheduleFluidUpdate(x, y + 1, z);
        this.scheduleFluidUpdate(x, y - 1, z);
        this.scheduleFluidUpdate(x, y, z + 1);
        this.scheduleFluidUpdate(x, y, z - 1);
    }

    scheduleFluidUpdate(x, y, z) {
        const key = `${x},${y},${z}`;
        if (!this.fluidSet.has(key)) {
            this.fluidSet.add(key);
            this.fluidQueue.push({ x, y, z });
        }
    }

    updateFluidBlock(x, y, z) {
        const voxel = this.getVoxel(x, y, z);
        if (voxel !== BLOCK.WATER) return;

        const meta = this.getMeta(x, y, z);
        let expectedLevel = 0;

        if (meta === 8) {
            expectedLevel = 8;
        } else {
            if (this.getVoxel(x, y + 1, z) === BLOCK.WATER) {
                expectedLevel = 7;
            } else {
                let maxNeighbor = 0;
                const dirs = [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]];
                for (let d of dirs) {
                    const nx = x + d[0], nz = z + d[2];
                    if (!this.isChunkLoaded(nx, nz)) continue;
                    if (this.getVoxel(nx, y, nz) === BLOCK.WATER) {
                        let nMeta = this.getMeta(nx, y, nz);
                        if (nMeta === 8) maxNeighbor = Math.max(maxNeighbor, 7);
                        else maxNeighbor = Math.max(maxNeighbor, nMeta - 1);
                    }
                }
                expectedLevel = maxNeighbor;
            }
        }

        if (meta !== 8 && meta !== expectedLevel) {
            if (expectedLevel <= 0) {
                this.setVoxel(x, y, z, BLOCK.AIR, 0);
                return;
            } else {
                this.setVoxel(x, y, z, BLOCK.WATER, expectedLevel);
            }
        }

        if (expectedLevel > 0 && y > 0) {
            const below = this.getVoxel(x, y - 1, z);
            if (below === BLOCK.AIR) {
                this.setVoxel(x, y - 1, z, BLOCK.WATER, 7);
            } else if (below !== BLOCK.WATER && BLOCK.get(below).isSolid) {
                if (expectedLevel > 1) {
                    const dirs = [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]];
                    for (let d of dirs) {
                        const nx = x + d[0], nz = z + d[2];
                        if (!this.isChunkLoaded(nx, nz)) continue;
                        const side = this.getVoxel(nx, y, nz);
                        const sideMeta = this.getMeta(nx, y, nz);
                        if (side === BLOCK.AIR) {
                            this.setVoxel(nx, y, nz, BLOCK.WATER, expectedLevel - 1);
                        } else if (side === BLOCK.WATER && sideMeta < expectedLevel - 1 && sideMeta !== 8) {
                            this.setVoxel(nx, y, nz, BLOCK.WATER, expectedLevel - 1);
                        }
                    }
                }
            }
        }
    }

    triggerBlockPhysics(x, y, z) {
        const queue = [{ x, y, z }];
        const visited = new Set();

        while (queue.length > 0) {
            const cur = queue.shift();
            const key = `${cur.x},${cur.y},${cur.z}`;
            if (visited.has(key)) continue;
            visited.add(key);

            const offsets = [
                [0, 1, 0], [0, -1, 0],
                [1, 0, 0], [-1, 0, 0],
                [0, 0, 1], [0, 0, -1]
            ];

            for (const [dx, dy, dz] of offsets) {
                const nx = cur.x + dx, ny = cur.y + dy, nz = cur.z + dz;
                if (ny <= 0 || ny >= WORLD_HEIGHT) continue;
                const nKey = `${nx},${ny},${nz}`;
                if (visited.has(nKey)) continue;

                const nVoxel = this.getVoxel(nx, ny, nz);
                if (nVoxel !== BLOCK.AIR && BLOCK.get(nVoxel).falling) {
                    const below = this.getVoxel(nx, ny - 1, nz);
                    const belowProps = BLOCK.get(below);
                    if (below === BLOCK.AIR || belowProps.isPlant || below === BLOCK.WATER) {
                        this.spawnFallingBlock(nx, ny, nz, nVoxel);
                        queue.push({ x: nx, y: ny, z: nz });
                        queue.push({ x: nx, y: ny + 1, z: nz });
                    }
                }
            }
        }
    }

    spawnFallingBlock(x, y, z, id) {
        if (this.fallingBlocks.some(b => Math.abs(b.mesh.position.x - (x + 0.5)) < 0.1 && Math.abs(b.mesh.position.z - (z + 0.5)) < 0.1 && Math.abs(b.mesh.position.y - (y + 0.5)) < 0.5)) return;
        this.setVoxel(x, y, z, BLOCK.AIR);
        const props = BLOCK.get(id);
        const texKey = typeof props.texture === 'object' ? props.texture.side : props.texture;
        const tex = this.textureGenerator.generate(texKey);

        const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.99, 0.99, 0.99), new THREE.MeshLambertMaterial({ map: tex }));
        mesh.position.set(x + 0.5, y + 0.5, z + 0.5);
        mesh.castShadow = true;
        this.scene.add(mesh);
        this.fallingBlocks.push({ mesh: mesh, id: id, velocity: 0 });
    }

    updateFallingBlocks(dt) {
        for (let i = this.fallingBlocks.length - 1; i >= 0; i--) {
            const fb = this.fallingBlocks[i];
            fb.velocity -= 18.0 * dt;
            fb.mesh.position.y += fb.velocity * dt;

            const gridY = Math.floor(fb.mesh.position.y - 0.5);
            const gridX = Math.floor(fb.mesh.position.x);
            const gridZ = Math.floor(fb.mesh.position.z);

            if (gridY < 0 || this.isSolid(gridX, gridY, gridZ)) {
                this.scene.remove(fb.mesh);
                if (fb.mesh.geometry) fb.mesh.geometry.dispose();
                if (fb.mesh.material) fb.mesh.material.dispose();
                this.setVoxel(gridX, gridY + 1, gridZ, fb.id);
                this.triggerBlockPhysics(gridX, gridY + 1, gridZ);
                this.fallingBlocks.splice(i, 1);
            }
        }
    }

    spawnItemDrop(x, y, z, blockId, count = 1, velocity = null) {
        const drop = new ItemDrop(this, x, y, z, blockId, count, velocity);
        this.itemDrops.push(drop);
    }

    fixedTick(dt, player) {
        let fluidCount = 0;
        while (this.fluidQueue.length > 0 && fluidCount < 4) {
            const pos = this.fluidQueue.shift();
            this.fluidSet.delete(`${pos.x},${pos.y},${pos.z}`);
            this.updateFluidBlock(pos.x, pos.y, pos.z);
            fluidCount++;
        }

        for (let i = this.itemDrops.length - 1; i >= 0; i--) {
            const drop = this.itemDrops[i];
            drop.fixedUpdate(dt, player);
            if (drop.isPickedUp) {
                this.itemDrops.splice(i, 1);
            }
        }
    }

    generateVein(chunk, lx, ly, lz, blockId, size) {
        let cx = lx, cy = ly, cz = lz;
        for (let i = 0; i < size; i++) {
            if (cx >= 0 && cx < CHUNK_SIZE && cy > 0 && cy < WORLD_HEIGHT && cz >= 0 && cz < CHUNK_SIZE) {
                if ((chunk.getVoxel(cx, cy, cz) & 0xFF) === BLOCK.STONE) chunk.setVoxel(cx, cy, cz, blockId);
            }
            const d = Math.floor(Math.random() * 6);
            if (d === 0) cx++; else if (d === 1) cx--; else if (d === 2) cy++; else if (d === 3) cy--; else if (d === 4) cz++; else cz--;
        }
    }

    // Генераторы деревьев различных видов
    generateOakTree(c, x, h, z) {
        for (let i = 0; i < 5; i++) {
            if (h + 1 + i < WORLD_HEIGHT) c.setVoxel(x, h + 1 + i, z, BLOCK.OAK_LOG);
        }
        for (let dx = -2; dx <= 2; dx++) {
            for (let dy = 2; dy <= 5; dy++) {
                for (let dz = -2; dz <= 2; dz++) {
                    if (h + 1 + dy < WORLD_HEIGHT && (Math.abs(dx) !== 2 || Math.abs(dz) !== 2 || dy < 4)) {
                        const px = x + dx, pz = z + dz;
                        if (px >= 0 && px < CHUNK_SIZE && pz >= 0 && pz < CHUNK_SIZE) {
                            if (c.getVoxel(px, h + 1 + dy, pz) === BLOCK.AIR) {
                                c.setVoxel(px, h + 1 + dy, pz, BLOCK.OAK_LEAVES);
                            }
                        }
                    }
                }
            }
        }
    }

    generateBirchTree(c, x, h, z) {
        const height = 5 + Math.floor(Math.random() * 3);
        for (let i = 0; i < height; i++) {
            if (h + 1 + i < WORLD_HEIGHT) c.setVoxel(x, h + 1 + i, z, BLOCK.BIRCH_LOG);
        }
        for (let dx = -2; dx <= 2; dx++) {
            for (let dy = height - 3; dy <= height + 1; dy++) {
                for (let dz = -2; dz <= 2; dz++) {
                    if (h + 1 + dy < WORLD_HEIGHT && (Math.abs(dx) !== 2 || Math.abs(dz) !== 2 || dy < height)) {
                        const px = x + dx, pz = z + dz;
                        if (px >= 0 && px < CHUNK_SIZE && pz >= 0 && pz < CHUNK_SIZE) {
                            if (c.getVoxel(px, h + 1 + dy, pz) === BLOCK.AIR) {
                                c.setVoxel(px, h + 1 + dy, pz, BLOCK.BIRCH_LEAVES);
                            }
                        }
                    }
                }
            }
        }
    }

    generateDarkOakTree(c, x, h, z) {
        const height = 6 + Math.floor(Math.random() * 3);
        // Ствол 2x2
        for (let i = 0; i < height; i++) {
            if (h + 1 + i < WORLD_HEIGHT) {
                c.setVoxel(x, h + 1 + i, z, BLOCK.DARK_OAK_LOG);
                if (x + 1 < CHUNK_SIZE) c.setVoxel(x + 1, h + 1 + i, z, BLOCK.DARK_OAK_LOG);
                if (z + 1 < CHUNK_SIZE) c.setVoxel(x, h + 1 + i, z + 1, BLOCK.DARK_OAK_LOG);
                if (x + 1 < CHUNK_SIZE && z + 1 < CHUNK_SIZE) c.setVoxel(x + 1, h + 1 + i, z + 1, BLOCK.DARK_OAK_LOG);
            }
        }
        // Мощная широкая плотная крона
        for (let dx = -3; dx <= 4; dx++) {
            for (let dy = height - 2; dy <= height + 2; dy++) {
                for (let dz = -3; dz <= 4; dz++) {
                    if (h + 1 + dy < WORLD_HEIGHT && (Math.abs(dx) <= 3 && Math.abs(dz) <= 3)) {
                        const px = x + dx, pz = z + dz;
                        if (px >= 0 && px < CHUNK_SIZE && pz >= 0 && pz < CHUNK_SIZE) {
                            if (c.getVoxel(px, h + 1 + dy, pz) === BLOCK.AIR) {
                                c.setVoxel(px, h + 1 + dy, pz, BLOCK.DARK_OAK_LEAVES);
                            }
                        }
                    }
                }
            }
        }
    }

    generateAcaciaTree(c, x, h, z) {
        const height = 6 + Math.floor(Math.random() * 2);
        let curX = x, curZ = z;
        for (let i = 0; i < height; i++) {
            if (h + 1 + i < WORLD_HEIGHT) {
                c.setVoxel(curX, h + 1 + i, curZ, BLOCK.ACACIA_LOG);
                if (i === 3) { curX = Math.min(CHUNK_SIZE - 2, curX + 1); }
            }
        }
        // Зонтичная плоская крона
        for (let dx = -3; dx <= 3; dx++) {
            for (let dz = -3; dz <= 3; dz++) {
                if (Math.abs(dx) + Math.abs(dz) <= 4) {
                    const px = curX + dx, pz = curZ + dz;
                    if (px >= 0 && px < CHUNK_SIZE && pz >= 0 && pz < CHUNK_SIZE) {
                        if (h + 1 + height < WORLD_HEIGHT && c.getVoxel(px, h + 1 + height, pz) === BLOCK.AIR) {
                            c.setVoxel(px, h + 1 + height, pz, BLOCK.ACACIA_LEAVES);
                        }
                        if (h + 2 + height < WORLD_HEIGHT && Math.abs(dx) <= 1 && Math.abs(dz) <= 1 && c.getVoxel(px, h + 2 + height, pz) === BLOCK.AIR) {
                            c.setVoxel(px, h + 2 + height, pz, BLOCK.ACACIA_LEAVES);
                        }
                    }
                }
            }
        }
    }

    generateSwampTree(c, x, h, z) {
        for (let i = 0; i < 5; i++) {
            if (h + 1 + i < WORLD_HEIGHT) c.setVoxel(x, h + 1 + i, z, BLOCK.OAK_LOG);
        }
        for (let dx = -3; dx <= 3; dx++) {
            for (let dy = 2; dy <= 5; dy++) {
                for (let dz = -3; dz <= 3; dz++) {
                    if (Math.abs(dx) + Math.abs(dz) <= 4) {
                        const px = x + dx, pz = z + dz;
                        if (px >= 0 && px < CHUNK_SIZE && pz >= 0 && pz < CHUNK_SIZE) {
                            if (h + 1 + dy < WORLD_HEIGHT && c.getVoxel(px, h + 1 + dy, pz) === BLOCK.AIR) {
                                c.setVoxel(px, h + 1 + dy, pz, BLOCK.OAK_LEAVES);
                            }
                        }
                    }
                }
            }
        }
    }

    generateChunkData(cx, cz) {
        const k = this.getChunkKey(cx, cz);
        if (this.chunks[k] && this.chunks[k].isGenerated) return this.chunks[k];

        const c = this.chunks[k] || new Chunk(cx, cz);
        this.chunks[k] = c;

        const SEA_LEVEL = 60;
        const allFlowers = [
            BLOCK.DANDELION, BLOCK.POPPY, BLOCK.BLUE_ORCHID,
            BLOCK.ALLIUM, BLOCK.RED_TULIP, BLOCK.WHITE_TULIP, BLOCK.OXEYE_DAISY
        ];

        for (let x = 0; x < CHUNK_SIZE; x++) {
            for (let z = 0; z < CHUNK_SIZE; z++) {
                const wx = cx * CHUNK_SIZE + x;
                const wz = cz * CHUNK_SIZE + z;
                const biome = this.getBiomeAt(wx, wz);
                const h = this.getTerrainHeightAt(wx, wz);

                for (let y = 0; y < WORLD_HEIGHT; y++) {
                    if (y === 0) {
                        c.setVoxel(x, y, z, BLOCK.BEDROCK);
                    } else if (y <= h) {
                        const cave = (this.caveNoise.noise3D(wx * 0.03, y * 0.045, wz * 0.03) + 1) / 2;
                        if (y > 2 && y < h - 4 && cave > 0.62) {
                            c.setVoxel(x, y, z, BLOCK.AIR);
                        } else if (y === h && c.getVoxel(x, y - 1, z) !== BLOCK.AIR) {
                            const [bx, bz] = this.getBiomeCoords(wx, wz);
                            const cVal = this.continentalNoise.noise2D(bx * 0.002, bz * 0.002);
                            const tVal = this.tempNoise.noise2D(bx * 0.0025, bz * 0.0025);
                            const mVal = this.moistNoise.noise2D(bx * 0.0025, bz * 0.0025);
                            const dither = this.terrainNoise.noise2D(wx * 0.18, wz * 0.18) * 0.06;

                            const isSand = (cVal + dither < -0.14) || (tVal + dither > 0.42 && mVal - dither < -0.18);

                            if (cVal < -0.28) {
                                c.setVoxel(x, y, z, Math.random() > 0.4 ? BLOCK.GRAVEL : BLOCK.SAND);
                            } else if (isSand) {
                                c.setVoxel(x, y, z, BLOCK.SAND);
                            } else if (biome === BIOME.MOUNTAINS) {
                                if (h >= 102) {
                                    // Снежные шапки гор
                                    c.setVoxel(x, y, z, BLOCK.SNOW_BLOCK);
                                } else if (h >= 78) {
                                    // Скалистые склоны гор
                                    const stoneNoise = Math.random();
                                    if (stoneNoise > 0.3) c.setVoxel(x, y, z, BLOCK.STONE);
                                    else if (stoneNoise > 0.1) c.setVoxel(x, y, z, BLOCK.COBBLESTONE);
                                    else c.setVoxel(x, y, z, BLOCK.GRAVEL);
                                } else {
                                    c.setVoxel(x, y, z, BLOCK.GRASS);
                                }
                            } else {
                                c.setVoxel(x, y, z, BLOCK.GRASS);
                            }
                        } else if (y < h - 4) {
                            c.setVoxel(x, y, z, BLOCK.STONE);
                        } else {
                            const [bx, bz] = this.getBiomeCoords(wx, wz);
                            const cVal = this.continentalNoise.noise2D(bx * 0.002, bz * 0.002);
                            const tVal = this.tempNoise.noise2D(bx * 0.0025, bz * 0.0025);
                            const mVal = this.moistNoise.noise2D(bx * 0.0025, bz * 0.0025);
                            const isSand = (cVal < -0.14) || (tVal > 0.42 && mVal < -0.18);
                            if (isSand) {
                                c.setVoxel(x, y, z, BLOCK.SANDSTONE);
                            } else if (biome === BIOME.MOUNTAINS && h >= 102) {
                                c.setVoxel(x, y, z, BLOCK.SNOW_BLOCK);
                            } else if (biome === BIOME.MOUNTAINS && h >= 78) {
                                c.setVoxel(x, y, z, BLOCK.STONE);
                            } else {
                                c.setVoxel(x, y, z, BLOCK.DIRT);
                            }
                        }
                    } else if (y <= SEA_LEVEL) {
                        c.setVoxel(x, y, z, BLOCK.WATER, 8);
                    }
                }

                // Генерация деревьев по биомам
                const surfaceBlock = c.getVoxel(x, h, z);
                const isGrass = (surfaceBlock === BLOCK.GRASS);
                const canTree = isGrass && h > SEA_LEVEL && x >= 3 && x <= 12 && z >= 3 && z <= 12;

                if (canTree) {
                    if (biome === BIOME.BIRCH_FOREST && Math.random() < 0.04) {
                        this.generateBirchTree(c, x, h, z);
                    } else if (biome === BIOME.DARK_OAK_FOREST && Math.random() < 0.04) {
                        this.generateDarkOakTree(c, x, h, z);
                    } else if (biome === BIOME.SWAMP && Math.random() < 0.03) {
                        this.generateSwampTree(c, x, h, z);
                    } else if (biome === BIOME.OAK_FOREST && Math.random() < 0.035) {
                        this.generateOakTree(c, x, h, z);
                    } else if (biome === BIOME.FLOWER_MEADOW && Math.random() < 0.01) {
                        if (Math.random() < 0.5) this.generateBirchTree(c, x, h, z);
                        else this.generateOakTree(c, x, h, z);
                    }
                }

                // Генерация цветов и растительности (умеренная, без спама)
                if (c.getVoxel(x, h, z) === BLOCK.GRASS && h > SEA_LEVEL && c.getVoxel(x, h + 1, z) === BLOCK.AIR) {
                    const plantRand = Math.random();

                    if (biome === BIOME.FLOWER_MEADOW) {
                        if (plantRand < 0.08) {
                            const flowerIdx = Math.floor(Math.random() * allFlowers.length);
                            c.setVoxel(x, h + 1, z, allFlowers[flowerIdx]);
                        } else if (plantRand < 0.15) {
                            c.setVoxel(x, h + 1, z, BLOCK.TALL_GRASS);
                        } else if (plantRand < 0.19 && h + 2 < WORLD_HEIGHT) {
                            c.setVoxel(x, h + 1, z, BLOCK.DOUBLE_TALL_GRASS_BOTTOM);
                            c.setVoxel(x, h + 2, z, BLOCK.DOUBLE_TALL_GRASS_TOP);
                        }
                    } else if (biome === BIOME.SWAMP) {
                        if (plantRand < 0.03) {
                            c.setVoxel(x, h + 1, z, BLOCK.BLUE_ORCHID);
                        } else if (plantRand < 0.08) {
                            c.setVoxel(x, h + 1, z, BLOCK.TALL_GRASS);
                        }
                    } else if (biome === BIOME.BIRCH_FOREST) {
                        if (plantRand < 0.025) {
                            const flowers = [BLOCK.WHITE_TULIP, BLOCK.OXEYE_DAISY, BLOCK.DANDELION];
                            c.setVoxel(x, h + 1, z, flowers[Math.floor(Math.random() * flowers.length)]);
                        } else if (plantRand < 0.07) {
                            c.setVoxel(x, h + 1, z, BLOCK.TALL_GRASS);
                        }
                    } else if (biome === BIOME.OAK_FOREST) {
                        if (plantRand < 0.025) {
                            const flowers = [BLOCK.POPPY, BLOCK.DANDELION, BLOCK.RED_TULIP];
                            c.setVoxel(x, h + 1, z, flowers[Math.floor(Math.random() * flowers.length)]);
                        } else if (plantRand < 0.07) {
                            c.setVoxel(x, h + 1, z, BLOCK.TALL_GRASS);
                        }
                    } else if (biome === BIOME.MOUNTAINS) {
                        if (plantRand < 0.012 && h < 95) {
                            c.setVoxel(x, h + 1, z, BLOCK.OXEYE_DAISY);
                        } else if (plantRand < 0.035 && h < 95) {
                            c.setVoxel(x, h + 1, z, BLOCK.TALL_GRASS);
                        }
                    }
                }
            }
        }

        // Генерация руд
        for (let x = 0; x < CHUNK_SIZE; x++) {
            for (let z = 0; z < CHUNK_SIZE; z++) {
                for (let y = 1; y < WORLD_HEIGHT - 5; y++) {
                    if (c.getVoxel(x, y, z) === BLOCK.STONE) {
                        if (Math.random() < 0.006) this.generateVein(c, x, y, z, BLOCK.COAL_ORE, Math.floor(Math.random() * 4) + 2);
                        if (y < 60 && Math.random() < 0.004) this.generateVein(c, x, y, z, BLOCK.IRON_ORE, Math.floor(Math.random() * 3) + 2);
                    }
                }
            }
        }

        // Генерация структур
        StructureGenerator.tryGenerateStructure(this, c, cx, cz);

        c.isGenerated = true;
        return c;
    }

    generate() {
        this.updateChunks(new THREE.Vector3(8, 70, 8));
    }

    updateChunks(p) {
        const radius = Math.max(0, (this.settings ? this.settings.get('renderDistance') : 4) - 1);
        const pcx = Math.floor(p.x / CHUNK_SIZE), pcz = Math.floor(p.z / CHUNK_SIZE);
        const v = new Set();

        for (let x = -radius - 1; x <= radius + 1; x++) {
            for (let z = -radius - 1; z <= radius + 1; z++) {
                this.generateChunkData(pcx + x, pcz + z);
            }
        }

        for (let x = -radius; x <= radius; x++) {
            for (let z = -radius; z <= radius; z++) {
                const targetCx = pcx + x, targetCz = pcz + z;
                const regionKey = this.getRegionKey(targetCx, targetCz);
                v.add(regionKey);
                if (!this.regions[regionKey]) {
                    const reg = new WorldRegion(targetCx, targetCz, this);
                    this.regions[regionKey] = reg;
                    reg.needsUpdate = true;
                }
            }
        }

        for (let k in this.regions) {
            if (!v.has(k)) {
                this.regions[k].dispose();
                this.meshBuildQueue = this.meshBuildQueue.filter(task => task.region !== this.regions[k]);
                delete this.regions[k];
            }
        }
    }

    update(p, camera, deltaTime = 1 / 60) {
        this.playerPos = p;

        if (this.waterTexture) {
            this.waterTexture.offset.y = (this.waterTexture.offset.y + deltaTime * 0.012) % 1.0;
            this.waterTexture.offset.x = (this.waterTexture.offset.x + deltaTime * 0.004) % 1.0;
        }

        this.updateFallingBlocks(deltaTime);

        for (let i = 0; i < this.itemDrops.length; i++) {
            this.itemDrops[i].renderUpdate(deltaTime);
        }

        if (p) {
            const currentPcx = Math.floor(p.x / CHUNK_SIZE);
            const currentPcz = Math.floor(p.z / CHUNK_SIZE);
            if (this.lastChunkX !== currentPcx || this.lastChunkZ !== currentPcz) {
                this.lastChunkX = currentPcx;
                this.lastChunkZ = currentPcz;
                this.updateChunks(p);
            }
        }

        const meshStartTime = performance.now();
        while (this.meshBuildQueue.length > 0) {
            if (performance.now() - meshStartTime > 6) break;
            const task = this.meshBuildQueue.shift();
            if (this.regions[task.region.rx + ',' + task.region.rz] === task.region) {
                task.region.generateSection(task.sectionIndex, task.chunk);
            }
        }

        if (camera) {
            this.projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
            this.frustum.setFromProjectionMatrix(this.projScreenMatrix);
        }

        for (const k in this.regions) {
            this.regions[k].checkUpdates();
        }

        for (let i = 0; i < this.visibleSections.length; i++) {
            this.visibleSections[i].visible = false;
        }
        this.visibleSections.length = 0;

        if (!p) return;

        const pcx = Math.floor(p.x / CHUNK_SIZE), pcz = Math.floor(p.z / CHUNK_SIZE), pcy = Math.floor(p.y / SECTION_HEIGHT);
        const startRegion = this.regions[this.getRegionKey(pcx, pcz)];
        if (!startRegion) return;

        this.cullFrameId++;
        const queue = [], rd = this.settings ? this.settings.get('renderDistance') : 4;
        const safeY = Math.max(0, Math.min(SECTIONS_PER_CHUNK - 1, pcy));

        startRegion.sectionVisFrame[safeY] = this.cullFrameId;
        queue.push({ r: startRegion, y: safeY, rx: pcx, rz: pcz });

        const checkNeighbor = (curr, dx, dy, dz, face) => {
            const nx = curr.rx + dx, ny = curr.y + dy, nz = curr.rz + dz;
            if (ny < 0 || ny >= SECTIONS_PER_CHUNK || Math.abs(nx - pcx) > rd || Math.abs(nz - pcz) > rd) return;
            const nR = this.regions[this.getRegionKey(nx, nz)];
            if (!nR || nR.sectionVisFrame[ny] === this.cullFrameId) return;
            if (!this.frustum.intersectsSphere(nR.sectionSpheres[ny])) return;
            if (!curr.r.sectionPassability[curr.y][face]) return;
            nR.sectionVisFrame[ny] = this.cullFrameId;
            queue.push({ r: nR, y: ny, rx: nx, rz: nz });
        };

        let head = 0;
        while (head < queue.length) {
            const curr = queue[head++];
            const mesh = curr.r.sections[curr.y];
            if (mesh) {
                mesh.visible = true;
                this.visibleSections.push(mesh);
            }
            checkNeighbor(curr, 1, 0, 0, 'xp'); checkNeighbor(curr, -1, 0, 0, 'xn');
            checkNeighbor(curr, 0, 1, 0, 'yp'); checkNeighbor(curr, 0, -1, 0, 'yn');
            checkNeighbor(curr, 0, 0, 1, 'zp'); checkNeighbor(curr, 0, 0, -1, 'zn');
        }
    }

    getStats() {
        let tris = 0;
        for (let i = 0; i < this.visibleSections.length; i++) {
            const s = this.visibleSections[i];
            if (s && s.geometry) tris += s.geometry.attributes.position.count / 3;
        }
        return { chunks: Object.keys(this.chunks).length, regions: Object.keys(this.regions).length, totalTriangles: tris, itemDrops: this.itemDrops.length };
    }

    getData() {
        const d = {};
        for (const k in this.chunks) d[k] = Array.from(this.chunks[k].data);
        return { seed: this.seed, chunks: d };
    }

    loadData(d) {
        this.seed = d.seed;
        this.terrainNoise = new SimplexNoise(this.seed);
        this.caveNoise = new SimplexNoise(this.seed + 1337);
        this.continentalNoise = new SimplexNoise(this.seed + 201);
        this.tempNoise = new SimplexNoise(this.seed + 503);
        this.moistNoise = new SimplexNoise(this.seed + 709);
        this.chunks = {};

        for (let i = this.itemDrops.length - 1; i >= 0; i--) {
            this.itemDrops[i].destroy();
        }
        this.itemDrops = [];

        for (const k in this.regions) this.regions[k].dispose();
        this.regions = {};
        this.visibleSections.length = 0;
        this.lastChunkX = null;
        this.lastChunkZ = null;

        for (const k in d.chunks) {
            const [x, z] = k.split(',').map(Number);
            const c = new Chunk(x, z);
            c.data = new Uint16Array(d.chunks[k]);
            c.isGenerated = true;
            this.chunks[k] = c;
        }
    }
}