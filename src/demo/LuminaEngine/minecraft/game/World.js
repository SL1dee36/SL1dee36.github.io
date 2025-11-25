import * as THREE from 'three';
import { BLOCK } from './blocks.js';
import { GPUWorldGenerator } from './GPUWorldGenerator.js';
import { SimplexNoise } from './utils/SimplexNoise.js';
import { TextureGenerator } from './TextureGenerator.js';

const CHUNK_SIZE = 8;
const WORLD_HEIGHT = 128;
const REGION_SIZE = 4; 

class Chunk {
    constructor(x, z) {
        this.x = x;
        this.z = z;
        this.data = new Uint8Array(CHUNK_SIZE * WORLD_HEIGHT * CHUNK_SIZE);
    }
    getVoxel(x, y, z) {
        if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= WORLD_HEIGHT || z < 0 || z >= CHUNK_SIZE) return 0;
        return this.data[y * CHUNK_SIZE * CHUNK_SIZE + z * CHUNK_SIZE + x];
    }
    setVoxel(x, y, z, value) {
        if (x >= 0 && x < CHUNK_SIZE && y >= 0 && y < WORLD_HEIGHT && z >= 0 && z < CHUNK_SIZE) {
            this.data[y * CHUNK_SIZE * CHUNK_SIZE + z * CHUNK_SIZE + x] = value;
        }
    }
}

class WorldRegion {
    constructor(rx, rz, world) {
        this.rx = rx; this.rz = rz; this.world = world; 
        this.mesh = null; this.needsUpdate = true;
        const size = REGION_SIZE * CHUNK_SIZE;
        this.boundingSphere = new THREE.Sphere(
            new THREE.Vector3((rx * size) + size/2, WORLD_HEIGHT/2, (rz * size) + size/2),
            Math.sqrt(size*size + WORLD_HEIGHT*WORLD_HEIGHT + size*size) / 2
        );
    }
    
    dispose() {
        if (this.mesh) { 
            this.world.scene.remove(this.mesh); 
            this.mesh.geometry.dispose(); 
            this.mesh = null; 
        }
    }

    generateMesh() {
        if (this.mesh) { this.world.scene.remove(this.mesh); this.mesh.geometry.dispose(); }
        
        const positions = [], normals = [], uvs = [], indices = [], colors = [];
        const geometry = new THREE.BufferGeometry();
        const startChunkX = this.rx * REGION_SIZE;
        const startChunkZ = this.rz * REGION_SIZE;

        const shouldDrawFace = (currentId, currentProps, nx, ny, nz) => {
            const neighborId = this.world.getVoxel(nx, ny, nz);
            if (neighborId === BLOCK.AIR) return true;
            const neighborProps = BLOCK.get(neighborId);
            if (neighborProps.isTransparent) {
                if (currentProps.isTransparent && currentId === neighborId) return false;
                return true;
            }
            return false;
        };

        const getTexture = (props, dir) => {
            if (typeof props.texture !== 'object') return props.texture;
            if (dir === 'top') return props.texture.top;
            if (dir === 'bottom') return props.texture.bottom;
            if (dir === 'front' && props.texture.front) return props.texture.front; 
            return props.texture.side;
        };
        
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
                            const wx = (startChunkX + cx) * CHUNK_SIZE + x;
                            const wz = (startChunkZ + cz) * CHUNK_SIZE + z;

                            let light = 1.0;
                            if (voxel === BLOCK.STONE || voxel === BLOCK.COAL_ORE || voxel === BLOCK.IRON_ORE || voxel === BLOCK.BEDROCK) light = 0.6;
                            if (this.world.isSolid(wx, y + 1, wz) && this.world.isSolid(wx, y + 2, wz)) light *= 0.4;

                            if (shouldDrawFace(voxel, blockProps, wx + 1, y, wz)) {
                                this.addFace(positions, normals, uvs, colors, indices, wx, y, wz, 
                                    [1, 0, 0], [[1,0,0],[1,1,0],[1,0,1],[1,1,1]], [0,0, 0,1, 1,0, 1,1], 
                                    getTexture(blockProps, 'side'), 0.8 * light, geometry);
                            }
                            if (shouldDrawFace(voxel, blockProps, wx - 1, y, wz)) {
                                this.addFace(positions, normals, uvs, colors, indices, wx, y, wz, 
                                    [-1, 0, 0], [[0,0,1],[0,1,1],[0,0,0],[0,1,0]], [0,0, 0,1, 1,0, 1,1], 
                                    getTexture(blockProps, 'side'), 0.8 * light, geometry);
                            }
                            if (shouldDrawFace(voxel, blockProps, wx, y + 1, wz)) {
                                this.addFace(positions, normals, uvs, colors, indices, wx, y, wz, 
                                    [0, 1, 0], [[0,1,1],[1,1,1],[0,1,0],[1,1,0]], [0,0, 1,0, 0,1, 1,1], 
                                    getTexture(blockProps, 'top'), 1.0 * light, geometry);
                            }
                            if (shouldDrawFace(voxel, blockProps, wx, y - 1, wz)) {
                                this.addFace(positions, normals, uvs, colors, indices, wx, y, wz, 
                                    [0, -1, 0], [[0,0,0],[1,0,0],[0,0,1],[1,0,1]], [0,0, 1,0, 0,1, 1,1], 
                                    getTexture(blockProps, 'bottom'), 0.5 * light, geometry);
                            }
                            if (shouldDrawFace(voxel, blockProps, wx, y, wz + 1)) {
                                this.addFace(positions, normals, uvs, colors, indices, wx, y, wz, 
                                    [0, 0, 1], [[1,0,1],[1,1,1],[0,0,1],[0,1,1]], [0,0, 0,1, 1,0, 1,1], 
                                    getTexture(blockProps, 'front'), 0.7 * light, geometry);
                            }
                            if (shouldDrawFace(voxel, blockProps, wx, y, wz - 1)) {
                                this.addFace(positions, normals, uvs, colors, indices, wx, y, wz, 
                                    [0, 0, -1], [[0,0,0],[0,1,0],[1,0,0],[1,1,0]], [0,0, 0,1, 1,0, 1,1], 
                                    getTexture(blockProps, 'side'), 0.7 * light, geometry);
                            }
                        }
                    }
                }
            }
        }

        if (positions.length === 0) { this.mesh = null; this.needsUpdate = false; return; }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.setIndex(indices);
        geometry.computeBoundingSphere(); 

        this.mesh = new THREE.Mesh(geometry, this.world.materials);
        this.mesh.castShadow = this.world.settings.get('shadows');
        this.mesh.receiveShadow = this.world.settings.get('shadows');
        this.mesh.frustumCulled = false; 

        this.world.scene.add(this.mesh);
        this.needsUpdate = false;
    }

    addFace(posArr, normArr, uvArr, colArr, idxArr, wx, y, wz, dir, corners, uvs, texName, light, geo) {
        const ndx = posArr.length / 3;
        for (const c of corners) {
            posArr.push(c[0] + wx, c[1] + y, c[2] + wz);
            normArr.push(...dir);
            colArr.push(light, light, light);
        }
        uvArr.push(...uvs);
        idxArr.push(ndx, ndx + 1, ndx + 2, ndx + 2, ndx + 1, ndx + 3);
        
        const matIndex = this.world.getMaterialIndex(texName);
        const lastGroup = geo.groups[geo.groups.length - 1];
        if (!lastGroup || lastGroup.materialIndex !== matIndex) {
            geo.addGroup(idxArr.length - 6, 6, matIndex);
        } else {
            lastGroup.count += 6;
        }
    }
}

export class World {
    constructor(scene, seed, renderer, settingsManager) {
        this.scene = scene;
        this.renderer = renderer;
        this.settings = settingsManager;
        this.seed = seed || Math.random() * 10000;
        
        this.chunks = {};
        this.regions = {};
        this.gpuGenerator = new GPUWorldGenerator(renderer, this.seed);
        this.caveNoise = new SimplexNoise(this.seed);

        this.textureGenerator = new TextureGenerator();
        this.materials = [];
        this.materialMap = {};
        this.initMaterials();
        
        this.frustum = new THREE.Frustum();
        this.projScreenMatrix = new THREE.Matrix4();

        this.fallingBlocks = []; // List of {x, y, z, id, time}
    }

    initMaterials() {
        let mi = 0;
        for (const k in BLOCK.properties) {
            const p = BLOCK.properties[k];
            if (!p.texture) continue;
            
            const arr = [];
            if (typeof p.texture === 'object') {
                if(p.texture.top) arr.push(p.texture.top);
                if(p.texture.bottom) arr.push(p.texture.bottom);
                if(p.texture.side) arr.push(p.texture.side);
                if(p.texture.front) arr.push(p.texture.front);
            } else {
                arr.push(p.texture);
            }
            
            arr.forEach(genKey => {
                if (this.materialMap[genKey] === undefined) {
                    const texture = this.textureGenerator.generate(genKey);
                    const isTransparent = p.isTransparent || genKey.includes('glass') || genKey.includes('leaves') || genKey.includes('water');
                    const mat = new THREE.MeshLambertMaterial({ 
                        map: texture, 
                        transparent: isTransparent, 
                        alphaTest: isTransparent ? 0.3 : 0, 
                        side: THREE.DoubleSide, 
                        vertexColors: true 
                    });
                    this.materials.push(mat);
                    this.materialMap[genKey] = mi++;
                }
            });
        }
    }
    
    getMaterialIndex(n) { return this.materialMap[n] || 0; }
    getChunkKey(x, z) { return `${x},${z}`; }
    getRegionKey(x, z) { return `${x},${z}`; }
    getChunk(cx, cz) { return this.chunks[this.getChunkKey(cx, cz)]; }
    getRegion(rx, rz) { return this.regions[this.getRegionKey(rx, rz)]; }

    getVoxel(x, y, z) {
        const cx = Math.floor(x / CHUNK_SIZE), cz = Math.floor(z / CHUNK_SIZE);
        let c = this.getChunk(cx, cz);
        if (!c) return 0;
        return c.getVoxel(x - cx * CHUNK_SIZE, y, z - cz * CHUNK_SIZE);
    }
    
    isSolid(x, y, z) {
        const v = this.getVoxel(x, y, z);
        return v !== BLOCK.AIR && !BLOCK.get(v).isTransparent;
    }

    setVoxel(x, y, z, v) {
        const cx = Math.floor(x / CHUNK_SIZE), cz = Math.floor(z / CHUNK_SIZE);
        let c = this.getChunk(cx, cz);
        if (!c) c = this.generateChunkData(cx, cz);
        c.setVoxel(x - cx * CHUNK_SIZE, y, z - cz * CHUNK_SIZE, v);
        
        const rx = Math.floor(cx / REGION_SIZE), rz = Math.floor(cz / REGION_SIZE);
        const r = this.getRegion(rx, rz);
        if (r) r.needsUpdate = true;
        
        // Check for updates
        if(v === BLOCK.AIR) {
            // Block removed, check block above if falling
            const above = this.getVoxel(x, y+1, z);
            if(BLOCK.get(above).falling) {
                this.scheduleBlockFall(x, y+1, z);
            }
        } else if (BLOCK.get(v).falling) {
            // Block placed, check if should fall
            this.scheduleBlockFall(x, y, z);
        }
    }

    scheduleBlockFall(x, y, z) {
        if (!this.fallingBlocks.some(b => b.x === x && b.y === y && b.z === z)) {
            this.fallingBlocks.push({ x, y, z, id: this.getVoxel(x, y, z), time: 0 });
        }
    }
    
    updateFallingBlocks(dt) {
        if (this.fallingBlocks.length === 0) return;
        
        // Simple cellular automata physics, not entity based for simplicity
        const nextFrame = [];
        const updates = new Set(); // Store coords to update mesh once

        for (const block of this.fallingBlocks) {
            block.time += dt;
            if (block.time > 0.1) { // Fall speed
                const below = this.getVoxel(block.x, block.y - 1, block.z);
                if (below === BLOCK.AIR || below === BLOCK.WATER) {
                    // Move down
                    this.setVoxel(block.x, block.y, block.z, BLOCK.AIR);
                    this.setVoxel(block.x, block.y - 1, block.z, block.id);
                    nextFrame.push({ x: block.x, y: block.y - 1, z: block.z, id: block.id, time: 0 });
                    
                    // Trigger block above original pos
                    const above = this.getVoxel(block.x, block.y + 1, block.z);
                    if (BLOCK.get(above).falling) {
                         nextFrame.push({ x: block.x, y: block.y + 1, z: block.z, id: above, time: 0 });
                    }
                }
            } else {
                nextFrame.push(block);
            }
        }
        this.fallingBlocks = nextFrame;
    }

    getTerrainHeight(x, z) {
        for (let y = WORLD_HEIGHT - 1; y > 0; y--) if (this.getVoxel(x, y, z) !== BLOCK.AIR) return y;
        return 0;
    }

    generateVein(chunk, lx, ly, lz, blockId, size) {
        let cx = lx, cy = ly, cz = lz;
        for (let i = 0; i < size; i++) {
            if (cx >= 0 && cx < CHUNK_SIZE && cy > 0 && cy < WORLD_HEIGHT && cz >= 0 && cz < CHUNK_SIZE) {
                if (chunk.getVoxel(cx, cy, cz) === BLOCK.STONE) chunk.setVoxel(cx, cy, cz, blockId);
            }
            const d = Math.floor(Math.random() * 6);
            if (d === 0) cx++; else if (d === 1) cx--; else if (d === 2) cy++; else if (d === 3) cy--; else if (d === 4) cz++; else cz--;
        }
    }

    generateChunkData(cx, cz) {
        const k = this.getChunkKey(cx, cz);
        if (this.chunks[k]) return this.chunks[k];
        const c = new Chunk(cx, cz); this.chunks[k] = c;
        const hMap = this.gpuGenerator.generateHeightMap(cx, cz);
        for (let x = 0; x < CHUNK_SIZE; x++) for (let z = 0; z < CHUNK_SIZE; z++) {
            const h = Math.floor(hMap[z * CHUNK_SIZE + x] * 50) + 40;
            const wx = cx * CHUNK_SIZE + x, wz = cz * CHUNK_SIZE + z;
            for (let y = 0; y < WORLD_HEIGHT; y++) {
                if (y === 0) c.setVoxel(x, y, z, BLOCK.BEDROCK);
                else if (y < h) {
                    const cave = (this.caveNoise.noise3D(wx * 0.03, y * 0.045, wz * 0.03) + 1) / 2;
                    if (y > 2 && y < h - 4 && cave > 0.55) c.setVoxel(x, y, z, BLOCK.AIR);
                    else if (y < h - 4) c.setVoxel(x, y, z, BLOCK.STONE);
                    else c.setVoxel(x, y, z, BLOCK.DIRT);
                } else if (y === h && c.getVoxel(x, y - 1, z) !== BLOCK.AIR) c.setVoxel(x, y, z, BLOCK.GRASS);
            }
            if (c.getVoxel(x, h, z) === BLOCK.GRASS && h > 45 && Math.random() > 0.98 && x > 2 && x < 5 && z > 2 && z < 5) this.placeTree(c, x, h + 1, z);
        }
        for (let x = 0; x < CHUNK_SIZE; x++) for (let z = 0; z < CHUNK_SIZE; z++) for (let y = 1; y < WORLD_HEIGHT - 5; y++) {
            if (c.getVoxel(x, y, z) === BLOCK.STONE) {
                if (Math.random() < 0.006) this.generateVein(c, x, y, z, BLOCK.COAL_ORE, Math.floor(Math.random() * 4) + 2);
                if (y < 60 && Math.random() < 0.004) this.generateVein(c, x, y, z, BLOCK.IRON_ORE, Math.floor(Math.random() * 3) + 2);
            }
        }
        return c;
    }
    
    placeTree(c, x, y, z) {
        for (let i = 0; i < 5; i++) if (y + i < 128) c.setVoxel(x, y + i, z, BLOCK.OAK_LOG);
        for (let dx = -2; dx <= 2; dx++) for (let dy = 2; dy <= 5; dy++) for (let dz = -2; dz <= 2; dz++)
            if (y + dy < 128 && (Math.abs(dx) !== 2 || Math.abs(dz) !== 2 || dy < 4)) if (c.getVoxel(x + dx, y + dy, z + dz) === BLOCK.AIR) c.setVoxel(x + dx, y + dy, z + dz, BLOCK.OAK_LEAVES);
    }

    generate() { this.updateChunks(new THREE.Vector3(0, 0, 0)); }

    updateChunks(p) {
        const rd = this.settings ? this.settings.get('renderDistance') : 3;
        const rx = Math.floor(p.x / (CHUNK_SIZE * REGION_SIZE));
        const rz = Math.floor(p.z / (CHUNK_SIZE * REGION_SIZE));
        const v = new Set();
        
        for (let x = -rd; x <= rd; x++) {
            for (let z = -rd; z <= rd; z++) {
                const k = this.getRegionKey(rx + x, rz + z);
                v.add(k);
                if (!this.regions[k]) {
                    this.regions[k] = new WorldRegion(rx + x, rz + z, this);
                    for (let i = 0; i < 16; i++) {
                        const cx = (rx + x) * 4 + (i % 4);
                        const cz = (rz + z) * 4 + Math.floor(i / 4);
                        this.generateChunkData(cx, cz);
                    }
                    this.regions[k].needsUpdate = true; 
                }
            }
        }
        for (let k in this.regions) if (!v.has(k)) { this.regions[k].dispose(); delete this.regions[k]; }
    }

    update(p, camera) {
        // Physics update for falling blocks
        this.updateFallingBlocks(1/30); // Approx frame time

        if (p) this.updateChunks(p);

        if (camera) {
            this.projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
            this.frustum.setFromProjectionMatrix(this.projScreenMatrix);
        }
        
        const smartMode = this.settings.get('renderMode') === 'smart';
        let updates = 0;
        
        for (let k in this.regions) {
            const r = this.regions[k];
            
            let isVisible = true;
            if (smartMode && r.mesh && camera) {
                isVisible = this.frustum.intersectsSphere(r.boundingSphere);
                r.mesh.visible = isVisible;
            } else if (r.mesh) {
                r.mesh.visible = true; 
            }

            const dist = p ? r.boundingSphere.center.distanceTo(p) : 0;
            
            if (r.needsUpdate && updates < 2) {
                if (dist < 100 || isVisible) {
                    r.generateMesh();
                    updates++;
                }
            }
        }
    }
    
    getData() { const d = {}; for (const k in this.chunks) d[k] = Array.from(this.chunks[k].data); return { seed: this.seed, chunks: d }; }
    loadData(d, r) {
        this.seed = d.seed;
        if (this.gpuGenerator) this.gpuGenerator.dispose();
        this.gpuGenerator = new GPUWorldGenerator(r, this.seed);
        this.caveNoise = new SimplexNoise(this.seed);
        this.chunks = {}; for (const k in this.regions) this.regions[k].dispose(); this.regions = {};
        for (const k in d.chunks) {
            const [x, z] = k.split(',').map(Number);
            const c = new Chunk(x, z);
            c.data = new Uint8Array(d.chunks[k]);
            this.chunks[k] = c;
        }
    }
}