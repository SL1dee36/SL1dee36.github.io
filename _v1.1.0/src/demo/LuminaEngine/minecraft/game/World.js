// game/World.js

import * as THREE from 'three';
// --- УДАЛЕНО: `import { noise } from '../lib/perlin.js';` ---
// Генерация шума теперь происходит на GPU, эта библиотека больше не нужна.
import { BLOCK } from './blocks.js';
// --- ДОБАВЛЕНО: Импорт нашего GPU-генератора ---
import { GPUWorldGenerator } from './GPUWorldGenerator.js';

const CHUNK_SIZE = 8; // Стандартный размер чанка
const WORLD_HEIGHT = 128;
const REGION_SIZE = 4; // 4x4 чанка в одном меше (64x64 блока)

// Класс для хранения данных о блоках. Больше не занимается рендерингом.
class Chunk {
    constructor(x, z) {
        this.x = x;
        this.z = z;
        this.data = new Uint8Array(CHUNK_SIZE * WORLD_HEIGHT * CHUNK_SIZE);
    }

    getVoxel(x, y, z) {
        if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= WORLD_HEIGHT || z < 0 || z >= CHUNK_SIZE) {
            return 0; // Air
        }
        const index = y * CHUNK_SIZE * CHUNK_SIZE + z * CHUNK_SIZE + x;
        return this.data[index];
    }
    
    setVoxel(x, y, z, value) {
        const index = y * CHUNK_SIZE * CHUNK_SIZE + z * CHUNK_SIZE + x;
        this.data[index] = value;
    }
}

// Новый класс для управления одним большим мешем, объединяющим несколько чанков
class WorldRegion {
    // ... (Этот класс остается без изменений)
    constructor(rx, rz, world) {
        this.rx = rx; // Координаты региона
        this.rz = rz;
        this.world = world;
        this.mesh = null;
        this.needsUpdate = false;
    }

    generateMesh() {
        const positions = [];
        const normals = [];
        const uvs = [];
        const indices = [];
        
        const geometry = new THREE.BufferGeometry();
        
        const textureLoader = new THREE.TextureLoader();
        const textures = {};
        const materials = [];
        const materialMap = {};
        let materialIndex = 0;

        function getMaterialIndex(textureName) {
            if (materialMap[textureName] === undefined) {
                if (!textures[textureName]) {
                    textures[textureName] = textureLoader.load(`textures/${textureName}`);
                    textures[textureName].magFilter = THREE.NearestFilter;
                    textures[textureName].minFilter = THREE.NearestFilter;
                }
                const isTransparent = textureName.includes('leaves');
                materials.push(new THREE.MeshLambertMaterial({
                    map: textures[textureName],
                    transparent: isTransparent,
                    alphaTest: isTransparent ? 0.5 : 0
                }));
                materialMap[textureName] = materialIndex++;
            }
            return materialMap[textureName];
        }

        const startChunkX = this.rx * REGION_SIZE;
        const startChunkZ = this.rz * REGION_SIZE;

        for (let cx = 0; cx < REGION_SIZE; cx++) {
            for (let cz = 0; cz < REGION_SIZE; cz++) {
                const chunk = this.world.getChunk(startChunkX + cx, startChunkZ + cz);
                if (!chunk) continue; 

                for (let y = 0; y < WORLD_HEIGHT; y++) {
                    for (let z = 0; z < CHUNK_SIZE; z++) {
                        for (let x = 0; x < CHUNK_SIZE; x++) {
                            const voxel = chunk.getVoxel(x, y, z);
                            if (voxel === BLOCK.AIR) continue;
                            
                            const blockProps = BLOCK.get(voxel);
                            const worldX = chunk.x * CHUNK_SIZE + x;
                            const worldZ = chunk.z * CHUNK_SIZE + z;

                            const neighbors = {
                                px: this.world.getVoxel(worldX + 1, y, worldZ), nx: this.world.getVoxel(worldX - 1, y, worldZ),
                                py: this.world.getVoxel(worldX, y + 1, worldZ), ny: this.world.getVoxel(worldX, y - 1, worldZ),
                                pz: this.world.getVoxel(worldX, y, worldZ + 1), nz: this.world.getVoxel(worldX, y, worldZ - 1),
                            };

                            const faces = [
                                { dir: [ 1, 0, 0], corners: [ [1,0,0], [1,1,0], [1,0,1], [1,1,1] ], uvs: [0,0, 0,1, 1,0, 1,1], neighbor: neighbors.px, texture: typeof blockProps.texture === 'object' ? blockProps.texture.side : blockProps.texture },
                                { dir: [-1, 0, 0], corners: [ [0,0,1], [0,1,1], [0,0,0], [0,1,0] ], uvs: [0,0, 0,1, 1,0, 1,1], neighbor: neighbors.nx, texture: typeof blockProps.texture === 'object' ? blockProps.texture.side : blockProps.texture },
                                { dir: [ 0, 1, 0], corners: [ [0,1,1], [1,1,1], [0,1,0], [1,1,0] ], uvs: [0,0, 1,0, 0,1, 1,1], neighbor: neighbors.py, texture: typeof blockProps.texture === 'object' ? blockProps.texture.top : blockProps.texture },
                                { dir: [ 0,-1, 0], corners: [ [0,0,0], [1,0,0], [0,0,1], [1,0,1] ], uvs: [0,0, 1,0, 0,1, 1,1], neighbor: neighbors.ny, texture: typeof blockProps.texture === 'object' ? blockProps.texture.bottom : blockProps.texture },
                                { dir: [ 0, 0, 1], corners: [ [1,0,1], [1,1,1], [0,0,1], [0,1,1] ], uvs: [0,0, 0,1, 1,0, 1,1], neighbor: neighbors.pz, texture: typeof blockProps.texture === 'object' ? blockProps.texture.side : blockProps.texture },
                                { dir: [ 0, 0,-1], corners: [ [0,0,0], [0,1,0], [1,0,0], [1,1,0] ], uvs: [0,0, 0,1, 1,0, 1,1], neighbor: neighbors.nz, texture: typeof blockProps.texture === 'object' ? blockProps.texture.side : blockProps.texture },
                            ];
                            
                            for (const { dir, corners, uvs: faceUVs, neighbor, texture } of faces) {
                                const neighborProps = BLOCK.get(neighbor);
                                if (neighborProps.isTransparent) {
                                    const ndx = positions.length / 3;
                                    for (const pos of corners) {
                                        positions.push(pos[0] + worldX, pos[1] + y, pos[2] + worldZ);
                                        normals.push(...dir);
                                    }
                                    
                                    uvs.push(...faceUVs);
                                    indices.push(ndx, ndx + 1, ndx + 2, ndx + 2, ndx + 1, ndx + 3);
                                    const matIndex = getMaterialIndex(texture);
                                    if (geometry.groups.length === 0 || geometry.groups[geometry.groups.length - 1].materialIndex !== matIndex) {
                                        geometry.addGroup(indices.length - 6, 6, matIndex);
                                    } else {
                                        geometry.groups[geometry.groups.length - 1].count += 6;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        
        if (positions.length === 0) {
            if (this.mesh) this.world.scene.remove(this.mesh);
            this.mesh = null; return;
        }
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        geometry.setIndex(indices);
        geometry.computeBoundingSphere();
        if(this.mesh) {
            this.world.scene.remove(this.mesh); this.mesh.geometry.dispose();
            if (Array.isArray(this.mesh.material)) { this.mesh.material.forEach(m => m.dispose());
            } else if (this.mesh.material) { this.mesh.material.dispose(); }
        }
        this.mesh = new THREE.Mesh(geometry, materials);
        this.world.scene.add(this.mesh);
        this.needsUpdate = false;
    }
}


export class World {
    // --- ИЗМЕНЕНИЕ: Конструктор теперь принимает renderer ---
    constructor(scene, seed, renderer) {
        this.scene = scene;
        this.chunks = {};
        this.regions = {};
        this.seed = seed || Math.random() * 10000;
        
        // --- УДАЛЕНО: `noise.seed(this.seed);` ---

        // --- ДОБАВЛЕНО: Создаем экземпляр GPU-генератора ---
        this.gpuGenerator = new GPUWorldGenerator(renderer, this.seed);
    }
    
    getChunkKey(x, z) { return `${x},${z}`; }
    getRegionKey(rx, rz) { return `${rx},${rz}`; }

    getChunk(chunkX, chunkZ) {
        return this.chunks[this.getChunkKey(chunkX, chunkZ)];
    }

    getRegion(regionX, regionZ) {
        return this.regions[this.getRegionKey(regionX, regionZ)];
    }

    getVoxel(x, y, z) {
        const chunkX = Math.floor(x / CHUNK_SIZE);
        const chunkZ = Math.floor(z / CHUNK_SIZE);
        const localX = x - chunkX * CHUNK_SIZE;
        const localZ = z - chunkZ * CHUNK_SIZE;
        const chunk = this.getChunk(chunkX, chunkZ);
        if (!chunk) return BLOCK.AIR;
        return chunk.getVoxel(localX, y, localZ);
    }

    setVoxel(x, y, z, value) {
        const chunkX = Math.floor(x / CHUNK_SIZE);
        const chunkZ = Math.floor(z / CHUNK_SIZE);
        const localX = x - chunkX * CHUNK_SIZE;
        const localZ = z - chunkZ * CHUNK_SIZE;
        let chunk = this.getChunk(chunkX, chunkZ);
        if (!chunk) {
            chunk = this.generateChunkData(chunkX, chunkZ);
        }
        if (chunk) {
            chunk.setVoxel(localX, y, localZ, value);
            const regionX = Math.floor(chunkX / REGION_SIZE);
            const regionZ = Math.floor(chunkZ / REGION_SIZE);
            const region = this.getRegion(regionX, regionZ);
            if (region) {
                region.needsUpdate = true;
            }
        }
    }

    generate() {
        const radius = 3;
        for (let x = -radius; x < radius; x++) {
            for (let z = -radius; z < radius; z++) {
                this.generateChunkData(x, z);
            }
        }
        const regionRadius = Math.ceil(radius / REGION_SIZE);
         for (let rx = -regionRadius; rx < regionRadius; rx++) {
            for (let rz = -regionRadius; rz < regionRadius; rz++) {
                const key = this.getRegionKey(rx, rz);
                if (!this.regions[key]) {
                    this.regions[key] = new WorldRegion(rx, rz, this);
                }
                this.regions[key].generateMesh();
            }
        }
    }

    // --- ИЗМЕНЕНИЕ: Полностью переписан метод генерации данных чанка ---
    generateChunkData(chunkX, chunkZ) {
        const key = this.getChunkKey(chunkX, chunkZ);
        if (this.chunks[key]) return this.chunks[key];

        const chunk = new Chunk(chunkX, chunkZ);
        this.chunks[key] = chunk;
        
        // 1. Получаем карту высот для этого чанка от GPU
        const heightMap = this.gpuGenerator.generateHeightMap(chunkX, chunkZ);
        
        // 2. Заполняем чанк данными на основе полученной карты высот
        for (let x = 0; x < CHUNK_SIZE; x++) {
            for (let z = 0; z < CHUNK_SIZE; z++) {
                const index = z * CHUNK_SIZE + x;
                const normalizedHeight = heightMap[index]; // Высота от 0.0 до 1.0

                // Конвертируем нормализованную высоту в высоту в блоках
                const height = Math.floor(normalizedHeight * 20) + 40;

                for (let y = 0; y < WORLD_HEIGHT; y++) {
                    if (y === 0) {
                        chunk.setVoxel(x, y, z, BLOCK.BEDROCK);
                    } else if (y < height - 3) {
                        chunk.setVoxel(x, y, z, BLOCK.STONE);
                    } else if (y < height) {
                        chunk.setVoxel(x, y, z, BLOCK.DIRT);
                    } else if (y === height) {
                        chunk.setVoxel(x, y, z, BLOCK.GRASS);
                    } else {
                        chunk.setVoxel(x, y, z, BLOCK.AIR);
                    }
                }
            }
        }
        return chunk;
    }
    
    update() {
        for (const key in this.regions) {
            if (this.regions[key].needsUpdate) {
                this.regions[key].generateMesh();
            }
        }
    }

    getData() {
        const data = {};
        for(const key in this.chunks) {
            data[key] = Array.from(this.chunks[key].data);
        }
        return { seed: this.seed, chunks: data };
    }

    // --- ИЗМЕНЕНИЕ: Метод загрузки теперь тоже принимает renderer ---
    loadData(data, renderer) {
        this.seed = data.seed;
        // --- УДАЛЕНО: `noise.seed(this.seed);` ---

        // --- ДОБАВЛЕНО: Пересоздаем GPU-генератор с новым seed'ом ---
        // Важно сначала уничтожить старый, чтобы освободить ресурсы GPU
        if (this.gpuGenerator) this.gpuGenerator.dispose();
        this.gpuGenerator = new GPUWorldGenerator(renderer, this.seed);
        
        this.chunks = {};
        this.regions = {};

        for(const key in data.chunks) {
            const [x, z] = key.split(',').map(Number);
            const chunk = new Chunk(x, z);
            chunk.data = new Uint8Array(data.chunks[key]);
            this.chunks[key] = chunk;
            
            const regionX = Math.floor(x / REGION_SIZE);
            const regionZ = Math.floor(z / REGION_SIZE);
            const regionKey = this.getRegionKey(regionX, regionZ);
            if (!this.regions[regionKey]) {
                 this.regions[regionKey] = new WorldRegion(regionX, regionZ, this);
                 this.regions[regionKey].needsUpdate = true;
            }
        }
        this.update();
    }
}