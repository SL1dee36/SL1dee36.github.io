// game/World.js

import * as THREE from 'three';
import { BLOCK } from './blocks.js';
import { GPUWorldGenerator } from './GPUWorldGenerator.js';

const CHUNK_SIZE = 8;
const WORLD_HEIGHT = 128;
const REGION_SIZE = 4; 
const RENDER_DISTANCE = 3; // Радиус прогрузки в РЕГИОНАХ (не чанках)

// Хранилище данных (не удаляется при выгрузке меша)
class Chunk {
    constructor(x, z) {
        this.x = x;
        this.z = z;
        this.data = new Uint8Array(CHUNK_SIZE * WORLD_HEIGHT * CHUNK_SIZE);
        this.isModified = false;
    }

    getVoxel(x, y, z) {
        if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= WORLD_HEIGHT || z < 0 || z >= CHUNK_SIZE) return 0;
        return this.data[y * CHUNK_SIZE * CHUNK_SIZE + z * CHUNK_SIZE + x];
    }
    
    setVoxel(x, y, z, value) {
        this.data[y * CHUNK_SIZE * CHUNK_SIZE + z * CHUNK_SIZE + x] = value;
        this.isModified = true;
    }
}

// Визуальная часть (удаляется, если далеко)
class WorldRegion {
    constructor(rx, rz, world) {
        this.rx = rx;
        this.rz = rz;
        this.world = world;
        this.mesh = null;
        this.needsUpdate = true;
    }

    dispose() {
        if (this.mesh) {
            // Удаляем меш со сцены и очищаем память GPU
            this.world.scene.remove(this.mesh);
            this.mesh.geometry.dispose();
            // Материалы не удаляем, они общие
            this.mesh = null;
        }
    }

    generateMesh() {
        // Если меш уже есть, удаляем старую геометрию
        if (this.mesh) {
            this.world.scene.remove(this.mesh);
            this.mesh.geometry.dispose();
        }

        const positions = [];
        const normals = [];
        const uvs = [];
        const indices = [];
        
        // Используем заранее созданные материалы из World
        const materials = this.world.materials;
        const geometry = new THREE.BufferGeometry();
        
        const startChunkX = this.rx * REGION_SIZE;
        const startChunkZ = this.rz * REGION_SIZE;

        // Проходим по всем чанкам в регионе
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

                            // Простая проверка соседей (оптимизация: проверяем только границы)
                            // Для идеального occlusion culling нужно проверять чанки соседей
                            const neighbors = {
                                px: this.world.getVoxel(worldX + 1, y, worldZ), nx: this.world.getVoxel(worldX - 1, y, worldZ),
                                py: this.world.getVoxel(worldX, y + 1, worldZ), ny: this.world.getVoxel(worldX, y - 1, worldZ),
                                pz: this.world.getVoxel(worldX, y, worldZ + 1), nz: this.world.getVoxel(worldX, y, worldZ - 1),
                            };

                            const faces = [
                                { dir: [ 1, 0, 0], corners: [[1,0,0], [1,1,0], [1,0,1], [1,1,1]], uvs: [0,0, 0,1, 1,0, 1,1], neighbor: neighbors.px, texture: blockProps.texture?.side || blockProps.texture },
                                { dir: [-1, 0, 0], corners: [[0,0,1], [0,1,1], [0,0,0], [0,1,0]], uvs: [0,0, 0,1, 1,0, 1,1], neighbor: neighbors.nx, texture: blockProps.texture?.side || blockProps.texture },
                                { dir: [ 0, 1, 0], corners: [[0,1,1], [1,1,1], [0,1,0], [1,1,0]], uvs: [0,0, 1,0, 0,1, 1,1], neighbor: neighbors.py, texture: blockProps.texture?.top || blockProps.texture },
                                { dir: [ 0,-1, 0], corners: [[0,0,0], [1,0,0], [0,0,1], [1,0,1]], uvs: [0,0, 1,0, 0,1, 1,1], neighbor: neighbors.ny, texture: blockProps.texture?.bottom || blockProps.texture },
                                { dir: [ 0, 0, 1], corners: [[1,0,1], [1,1,1], [0,0,1], [0,1,1]], uvs: [0,0, 0,1, 1,0, 1,1], neighbor: neighbors.pz, texture: blockProps.texture?.side || blockProps.texture },
                                { dir: [ 0, 0,-1], corners: [[0,0,0], [0,1,0], [1,0,0], [1,1,0]], uvs: [0,0, 0,1, 1,0, 1,1], neighbor: neighbors.nz, texture: blockProps.texture?.side || blockProps.texture },
                            ];
                            
                            for (const { dir, corners, uvs: faceUVs, neighbor, texture } of faces) {
                                const neighborProps = BLOCK.get(neighbor);
                                // Рисуем грань, если сосед прозрачный
                                if (neighborProps.isTransparent) {
                                    const ndx = positions.length / 3;
                                    for (const pos of corners) {
                                        positions.push(pos[0] + worldX, pos[1] + y, pos[2] + worldZ);
                                        normals.push(...dir);
                                    }
                                    uvs.push(...faceUVs);
                                    indices.push(ndx, ndx + 1, ndx + 2, ndx + 2, ndx + 1, ndx + 3);
                                    
                                    // Находим индекс материала
                                    const matIndex = this.world.getMaterialIndex(texture);
                                    
                                    // Группировка по материалам
                                    const lastGroup = geometry.groups[geometry.groups.length - 1];
                                    if (!lastGroup || lastGroup.materialIndex !== matIndex) {
                                        geometry.addGroup(indices.length - 6, 6, matIndex);
                                    } else {
                                        lastGroup.count += 6;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        
        if (positions.length === 0) {
            this.mesh = null; 
            this.needsUpdate = false;
            return;
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        geometry.setIndex(indices);
        // Оптимизация: не считаем boundingSphere каждый раз, если не нужен frustum culling по сферам
        geometry.computeBoundingSphere(); 

        this.mesh = new THREE.Mesh(geometry, materials);
        this.world.scene.add(this.mesh);
        this.needsUpdate = false;
    }
}


export class World {
    constructor(scene, seed, renderer, settingsManager) {
        this.scene = scene;
        this.renderer = renderer;
        this.settings = settingsManager; // Сохраняем настройки
        this.seed = seed || Math.random() * 10000;
        
        this.chunks = {}; 
        this.regions = {}; 
        this.gpuGenerator = new GPUWorldGenerator(renderer, this.seed);
        
        this.materials = [];
        this.materialMap = {};
        this.initMaterials();
    }

    initMaterials() {
        const textureLoader = new THREE.TextureLoader();
        let matIndex = 0;
        for (const key in BLOCK.properties) {
            const props = BLOCK.properties[key];
            if (!props.texture) continue;
            const texturesToLoad = [];
            if (typeof props.texture === 'object') texturesToLoad.push(props.texture.top, props.texture.bottom, props.texture.side);
            else texturesToLoad.push(props.texture);

            texturesToLoad.forEach(texName => {
                if (this.materialMap[texName] === undefined) {
                    const texture = textureLoader.load(`textures/${texName}`);
                    texture.magFilter = THREE.NearestFilter;
                    texture.minFilter = THREE.NearestFilter;
                    texture.colorSpace = THREE.SRGBColorSpace;
                    const isTransparent = ['oak_leaves.png'].includes(texName) || props.isTransparent;
                    const mat = new THREE.MeshLambertMaterial({
                        map: texture,
                        transparent: isTransparent,
                        alphaTest: isTransparent ? 0.3 : 0,
                        side: THREE.DoubleSide
                    });
                    this.materials.push(mat);
                    this.materialMap[texName] = matIndex++;
                }
            });
        }
    }
    getMaterialIndex(name) { return this.materialMap[name] || 0; }
    getChunkKey(x,z) { return `${x},${z}`; }
    getRegionKey(x,z) { return `${x},${z}`; }
    
    getChunk(cx, cz) { return this.chunks[this.getChunkKey(cx, cz)]; }
    getRegion(rx, rz) { return this.regions[this.getRegionKey(rx, rz)]; }
    
    getVoxel(x,y,z) {
        const cx = Math.floor(x/CHUNK_SIZE), cz = Math.floor(z/CHUNK_SIZE);
        const lx = x - cx*CHUNK_SIZE, lz = z - cz*CHUNK_SIZE;
        let c = this.getChunk(cx, cz);
        if (!c) c = this.generateChunkData(cx, cz);
        return c.getVoxel(lx,y,lz);
    }
    
    setVoxel(x,y,z, v) {
         const cx = Math.floor(x/CHUNK_SIZE), cz = Math.floor(z/CHUNK_SIZE);
        const lx = x - cx*CHUNK_SIZE, lz = z - cz*CHUNK_SIZE;
        let c = this.getChunk(cx, cz);
        if (!c) c = this.generateChunkData(cx, cz);
        c.setVoxel(lx,y,lz, v);
        const rx = Math.floor(cx/REGION_SIZE), rz = Math.floor(cz/REGION_SIZE);
        const r = this.getRegion(rx, rz);
        if(r) r.needsUpdate = true;
    }

    generateChunkData(cx, cz) {
         const key = this.getChunkKey(cx, cz);
        if (this.chunks[key]) return this.chunks[key];
        const chunk = new Chunk(cx, cz);
        this.chunks[key] = chunk;
        const map = this.gpuGenerator.generateHeightMap(cx, cz);
        for(let x=0; x<CHUNK_SIZE; x++){
            for(let z=0; z<CHUNK_SIZE; z++){
                const h = Math.floor(map[z*CHUNK_SIZE+x]*30)+30;
                for(let y=0; y<WORLD_HEIGHT; y++){
                    if(y===0) chunk.setVoxel(x,y,z, BLOCK.BEDROCK);
                    else if(y<h-3) chunk.setVoxel(x,y,z, BLOCK.STONE);
                    else if(y<h) chunk.setVoxel(x,y,z, BLOCK.DIRT);
                    else if(y===h) chunk.setVoxel(x,y,z, BLOCK.GRASS);
                }
                 if (x === 4 && z === 4 && Math.random() > 0.95) this.placeTree(chunk, x, h + 1, z);
            }
        }
        return chunk;
    }
    
    placeTree(c, x, y, z) {
        for(let i=0; i<4; i++) if(y+i<128) c.setVoxel(x,y+i,z, BLOCK.OAK_LOG);
        for(let dx=-2; dx<=2; dx++) for(let dy=2; dy<=4; dy++) for(let dz=-2; dz<=2; dz++)
            if(y+dy<128 && (Math.abs(dx)!==2 || Math.abs(dz)!==2 || dy<4))
                 c.setVoxel(x+dx, y+dy, z+dz, BLOCK.OAK_LEAVES); // Buggy inside chunk gen, works for visualization
    }
    
    generate() { this.updateChunks(new THREE.Vector3(0,0,0)); }

    // --- ИЗМЕНЕННЫЙ МЕТОД ---
    updateChunks(playerPos) {
        // Берем значение из настроек
        const renderDist = this.settings ? this.settings.get('renderDistance') : 3;
        
        const prx = Math.floor(playerPos.x / (CHUNK_SIZE * REGION_SIZE));
        const prz = Math.floor(playerPos.z / (CHUNK_SIZE * REGION_SIZE));

        const visible = new Set();
        
        for (let rx = -renderDist; rx <= renderDist; rx++) {
            for (let rz = -renderDist; rz <= renderDist; rz++) {
                const crx = prx + rx;
                const crz = prz + rz;
                const key = this.getRegionKey(crx, crz);
                visible.add(key);

                if (!this.regions[key]) {
                    this.regions[key] = new WorldRegion(crx, crz, this);
                    for (let cx = 0; cx < REGION_SIZE; cx++) for (let cz = 0; cz < REGION_SIZE; cz++)
                        this.generateChunkData(crx * REGION_SIZE + cx, crz * REGION_SIZE + cz);
                    this.regions[key].generateMesh();
                }
            }
        }

        for (const key in this.regions) {
            if (!visible.has(key)) {
                this.regions[key].dispose();
                delete this.regions[key];
            }
        }
    }
    
    update(playerPos) {
        if (playerPos) this.updateChunks(playerPos);
        for (const k in this.regions) if (this.regions[k].needsUpdate) this.regions[k].generateMesh();
    }
    
    getData() {
        const d = {};
        for(const k in this.chunks) d[k] = Array.from(this.chunks[k].data);
        return { seed: this.seed, chunks: d };
    }
    
    loadData(d, rend) {
        this.seed = d.seed;
        if(this.gpuGenerator) this.gpuGenerator.dispose();
        this.gpuGenerator = new GPUWorldGenerator(rend, this.seed);
        this.chunks = {};
        for(const k in this.regions) this.regions[k].dispose();
        this.regions = {};
        for(const k in d.chunks) {
            const [x,z] = k.split(',').map(Number);
            const c = new Chunk(x,z);
            c.data = new Uint8Array(d.chunks[k]);
            this.chunks[k] = c;
        }
    }
}