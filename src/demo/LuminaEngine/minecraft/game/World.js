import * as THREE from 'three';
import { BLOCK } from './blocks.js';
import { GPUWorldGenerator } from './GPUWorldGenerator.js';
import { SimplexNoise } from './utils/SimplexNoise.js';
import { TextureGenerator } from './TextureGenerator.js';

const CHUNK_SIZE = 16;
const WORLD_HEIGHT = 256;
const SECTION_HEIGHT = 32; 
const SECTIONS_PER_CHUNK = WORLD_HEIGHT / SECTION_HEIGHT;
const REGION_SIZE = 1; 

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
        this.rx = rx; 
        this.rz = rz; 
        this.world = world; 
        
        this.sections = new Array(SECTIONS_PER_CHUNK).fill(null);
        
        // ОПТИМИЗАЦИЯ: Вместо Set для visited используем счетчик кадра
        this.sectionVisFrame = new Int32Array(SECTIONS_PER_CHUNK).fill(-1);

        this.sectionPassability = new Array(SECTIONS_PER_CHUNK).fill(null).map(() => ({
            xp: true, xn: true,
            yp: true, yn: true,
            zp: true, zn: true
        }));

        this.needsUpdate = true;
        this.chunkX = rx * CHUNK_SIZE;
        this.chunkZ = rz * CHUNK_SIZE;

        this.sectionSpheres = [];
        const radius = Math.sqrt(CHUNK_SIZE*CHUNK_SIZE + SECTION_HEIGHT*SECTION_HEIGHT + CHUNK_SIZE*CHUNK_SIZE) / 2;
        const frustumPadding = 2.0; 

        for(let i=0; i < SECTIONS_PER_CHUNK; i++) {
            const centerY = (i * SECTION_HEIGHT) + (SECTION_HEIGHT / 2);
            const center = new THREE.Vector3(
                this.chunkX + CHUNK_SIZE/2,
                centerY,
                this.chunkZ + CHUNK_SIZE/2
            );
            this.sectionSpheres.push(new THREE.Sphere(center, radius + frustumPadding));
        }
    }
    
    dispose() {
        for(let i=0; i<this.sections.length; i++) {
            if (this.sections[i]) {
                this.world.scene.remove(this.sections[i]);
                this.sections[i].geometry.dispose();
                this.sections[i] = null;
            }
        }
    }

    checkUpdates() {
        if (this.needsUpdate) {
            this.generateAllSections();
            this.needsUpdate = false;
        }
    }

    generateAllSections() {
        const chunk = this.world.getChunk(this.rx, this.rz);
        if (!chunk) return;

        for (let i = 0; i < SECTIONS_PER_CHUNK; i++) {
            this.generateSection(i, chunk);
        }
    }

    generateSection(sectionIndex, chunk) {
        if (this.sections[sectionIndex]) {
            this.world.scene.remove(this.sections[sectionIndex]);
            this.sections[sectionIndex].geometry.dispose();
            this.sections[sectionIndex] = null;
        }

        const startY = sectionIndex * SECTION_HEIGHT;
        const endY = startY + SECTION_HEIGHT;
        
        const positions = [], normals = [], uvs = [], indices = [], colors = [];
        const geometry = new THREE.BufferGeometry();
        
        const getTexture = (props, dir) => {
            if (typeof props.texture !== 'object') return props.texture;
            if (dir === 'top') return props.texture.top;
            if (dir === 'bottom') return props.texture.bottom;
            if (dir === 'front' && props.texture.front) return props.texture.front; 
            return props.texture.side;
        };

        const useAO = this.world.settings.get('ambientOcclusion');

        // --- Calculate Passability ---
        let solidXN = true, solidXP = true;
        let solidYN = true, solidYP = true;
        let solidZN = true, solidZP = true;

        for(let x=0; x<CHUNK_SIZE; x++) {
            for(let z=0; z<CHUNK_SIZE; z++) {
                if (solidYN) {
                    const id = chunk.getVoxel(x, startY, z);
                    if (id === BLOCK.AIR || BLOCK.get(id).isTransparent) solidYN = false;
                }
                if (solidYP) {
                    const id = chunk.getVoxel(x, endY - 1, z);
                    if (id === BLOCK.AIR || BLOCK.get(id).isTransparent) solidYP = false;
                }
            }
        }

        for(let y=startY; y<endY; y++) {
            for(let i=0; i<CHUNK_SIZE; i++) { 
                if (solidXN) {
                    const id = chunk.getVoxel(0, y, i); 
                    if (id === BLOCK.AIR || BLOCK.get(id).isTransparent) solidXN = false;
                }
                if (solidXP) {
                    const id = chunk.getVoxel(CHUNK_SIZE-1, y, i);
                    if (id === BLOCK.AIR || BLOCK.get(id).isTransparent) solidXP = false;
                }
                if (solidZN) {
                    const id = chunk.getVoxel(i, y, 0); 
                    if (id === BLOCK.AIR || BLOCK.get(id).isTransparent) solidZN = false;
                }
                if (solidZP) {
                    const id = chunk.getVoxel(i, y, CHUNK_SIZE-1);
                    if (id === BLOCK.AIR || BLOCK.get(id).isTransparent) solidZP = false;
                }
            }
        }

        this.sectionPassability[sectionIndex] = {
            xn: !solidXN, xp: !solidXP,
            yn: !solidYN, yp: !solidYP,
            zn: !solidZN, zp: !solidZP
        };

        // --- Mesh Gen ---
        for (let y = startY; y < endY; y++) {
            for (let z = 0; z < CHUNK_SIZE; z++) {
                for (let x = 0; x < CHUNK_SIZE; x++) {
                    const voxel = chunk.getVoxel(x, y, z);
                    if (voxel === BLOCK.AIR) continue;

                    const blockProps = BLOCK.get(voxel);
                    const wx = this.chunkX + x;
                    const wz = this.chunkZ + z;

                    let baseLight = 1.0;
                    if (voxel === BLOCK.STONE || voxel === BLOCK.BEDROCK || voxel === BLOCK.COAL_ORE || voxel === BLOCK.IRON_ORE) baseLight = 0.6;

                    const checkAndAdd = (nx, ny, nz, dirVec, dirName, corners, uvCoords) => {
                        const neighborId = this.world.getVoxel(nx, ny, nz);
                        const neighborProps = BLOCK.get(neighborId);

                        let draw = false;

                        if (neighborId === BLOCK.AIR) {
                            draw = true;
                        } 
                        else if (neighborProps.isTransparent) {
                            if (blockProps.isTransparent && voxel === neighborId) draw = false;
                            else draw = true; 
                        } 
                        else {
                            draw = false;
                        }

                        if (draw) {
                            const vertexLights = [];
                            if (useAO) {
                                for(let k=0; k<4; k++) {
                                    vertexLights.push(baseLight * this.calculateVertexAO(wx, y, wz, dirName, k));
                                }
                            } else {
                                vertexLights.push(baseLight, baseLight, baseLight, baseLight);
                            }

                            this.addFace(positions, normals, uvs, colors, indices, wx, y, wz, 
                                dirVec, corners, uvCoords, 
                                getTexture(blockProps, dirName), vertexLights, geometry);
                        }
                    };

                    checkAndAdd(wx + 1, y, wz, [1,0,0], 'side', [[1,0,0],[1,1,0],[1,0,1],[1,1,1]], [0,0, 0,1, 1,0, 1,1]);
                    checkAndAdd(wx - 1, y, wz, [-1,0,0], 'side', [[0,0,1],[0,1,1],[0,0,0],[0,1,0]], [0,0, 0,1, 1,0, 1,1]);
                    checkAndAdd(wx, y + 1, wz, [0,1,0], 'top', [[0,1,1],[1,1,1],[0,1,0],[1,1,0]], [0,0, 1,0, 0,1, 1,1]);
                    checkAndAdd(wx, y - 1, wz, [0,-1,0], 'bottom', [[0,0,0],[1,0,0],[0,0,1],[1,0,1]], [0,0, 1,0, 0,1, 1,1]);
                    checkAndAdd(wx, y, wz + 1, [0,0,1], 'front', [[1,0,1],[1,1,1],[0,0,1],[0,1,1]], [0,0, 0,1, 1,0, 1,1]);
                    checkAndAdd(wx, y, wz - 1, [0,0,-1], 'side', [[0,0,0],[0,1,0],[1,0,0],[1,1,0]], [0,0, 0,1, 1,0, 1,1]);
                }
            }
        }

        if (positions.length === 0) return;

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.setIndex(indices);
        
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

    calculateVertexAO(x, y, z, dir, vIdx) {
        const s = (dx, dy, dz) => this.world.isSolid(x+dx, y+dy, z+dz) ? 0 : 1;
        let side1=1, side2=1, corner=1;

        if (dir === 'top') {
             if (vIdx===0) { side1=s(-1,1,0); side2=s(0,1,1); corner=s(-1,1,1); }
             if (vIdx===1) { side1=s(1,1,0); side2=s(0,1,1); corner=s(1,1,1); }
             if (vIdx===2) { side1=s(-1,1,0); side2=s(0,1,-1); corner=s(-1,1,-1); }
             if (vIdx===3) { side1=s(1,1,0); side2=s(0,1,-1); corner=s(1,1,-1); }
        }
        else if (dir === 'bottom') {
             if (vIdx===0) { side1=s(-1,-1,0); side2=s(0,-1,-1); corner=s(-1,-1,-1); } 
             if (vIdx===1) { side1=s(1,-1,0); side2=s(0,-1,-1); corner=s(1,-1,-1); }   
             if (vIdx===2) { side1=s(-1,-1,0); side2=s(0,-1,1); corner=s(-1,-1,1); }   
             if (vIdx===3) { side1=s(1,-1,0); side2=s(0,-1,1); corner=s(1,-1,1); }     
        }
        else if (dir === 'front') { 
             if (vIdx===0) { side1=s(1,0,1); side2=s(0,1,1); corner=s(1,1,1); } 
             if (vIdx===1) { side1=s(1,0,1); side2=s(0,-1,1); corner=s(1,-1,1); } 
             if (vIdx===2) { side1=s(-1,0,1); side2=s(0,1,1); corner=s(-1,1,1); } 
             if (vIdx===3) { side1=s(-1,0,1); side2=s(0,-1,1); corner=s(-1,-1,1); } 
        }
        else if (dir === 'side') {
            if(this.world.isSolid(x, y+1, z)) return 0.6;
        }
        
        const val = side1 + side2 + corner;
        if (val === 3) return 1.0;
        if (val === 2) return 0.8;
        if (val === 1) return 0.6;
        return 0.5;
    }

    addFace(posArr, normArr, uvArr, colArr, idxArr, wx, y, wz, dir, corners, uvs, texName, vertexLights, geo) {
        const ndx = posArr.length / 3;
        
        let sideDim = 1.0;
        if(dir[0] !== 0) sideDim = 0.8; 
        if(dir[2] !== 0) sideDim = 0.7; 
        if(dir[1] < 0) sideDim = 0.5;   
        
        for (let i = 0; i < corners.length; i++) {
            const c = corners[i];
            posArr.push(c[0] + wx, c[1] + y, c[2] + wz);
            normArr.push(...dir);
            
            const l = vertexLights[i] * sideDim;
            colArr.push(l, l, l);
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

        this.fallingBlocks = []; 
        
        // Глобальный счетчик кадров для BFS (чтобы не чистить массивы)
        this.cullFrameId = 0;
    }

    initMaterials() {
        let mi = 0;
        const processed = new Set();
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
                if (!processed.has(genKey)) {
                    processed.add(genKey);
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
    
    getTerrainHeight(x, z) {
        for (let y = WORLD_HEIGHT - 1; y > 0; y--) {
            if (this.getVoxel(x, y, z) !== BLOCK.AIR) return y;
        }
        return 0;
    }
    
    isSolid(x, y, z) {
        const v = this.getVoxel(x, y, z);
        return v !== BLOCK.AIR && BLOCK.get(v).isSolid;
    }

    setVoxel(x, y, z, v) {
        const cx = Math.floor(x / CHUNK_SIZE), cz = Math.floor(z / CHUNK_SIZE);
        let c = this.getChunk(cx, cz);
        if (!c) c = this.generateChunkData(cx, cz);
        
        const lx = x - cx * CHUNK_SIZE;
        const lz = z - cz * CHUNK_SIZE;
        c.setVoxel(lx, y, lz, v);
        
        const r = this.getRegion(cx, cz);
        if (r) r.needsUpdate = true;
        
        if (lx === 0) { const nr = this.getRegion(cx - 1, cz); if(nr) nr.needsUpdate = true; }
        if (lx === CHUNK_SIZE - 1) { const nr = this.getRegion(cx + 1, cz); if(nr) nr.needsUpdate = true; }
        if (lz === 0) { const nr = this.getRegion(cx, cz - 1); if(nr) nr.needsUpdate = true; }
        if (lz === CHUNK_SIZE - 1) { const nr = this.getRegion(cx, cz + 1); if(nr) nr.needsUpdate = true; }

        if(v === BLOCK.AIR) {
            const above = this.getVoxel(x, y+1, z);
            if(BLOCK.get(above).falling) this.spawnFallingBlock(x, y+1, z, above);
        } else if (BLOCK.get(v).falling) {
            this.spawnFallingBlock(x, y, z, v);
        }
    }

    spawnFallingBlock(x, y, z, id) {
        if (this.fallingBlocks.some(b => Math.abs(b.mesh.position.x - (x+0.5)) < 0.1 && Math.abs(b.mesh.position.z - (z+0.5)) < 0.1 && Math.abs(b.mesh.position.y - (y+0.5)) < 0.5)) return;

        const cx = Math.floor(x / CHUNK_SIZE), cz = Math.floor(z / CHUNK_SIZE);
        const c = this.getChunk(cx, cz);
        if(c) {
            c.setVoxel(x - cx*CHUNK_SIZE, y, z - cz*CHUNK_SIZE, BLOCK.AIR);
            const r = this.getRegion(cx, cz);
            if(r) r.needsUpdate = true;
        }

        const props = BLOCK.get(id);
        const texture = this.textureGenerator.generate(typeof props.texture === 'object' ? props.texture.side : props.texture);
        const mat = new THREE.MeshLambertMaterial({ map: texture });
        const geo = new THREE.BoxGeometry(0.98, 0.98, 0.98);
        const mesh = new THREE.Mesh(geo, mat);
        
        mesh.position.set(x + 0.5, y + 0.5, z + 0.5);
        mesh.castShadow = true;
        this.scene.add(mesh);

        this.fallingBlocks.push({ mesh: mesh, id: id, velocity: 0 });
    }
    
    updateFallingBlocks(dt) {
        if (this.fallingBlocks.length === 0) return;
        
        for (let i = this.fallingBlocks.length - 1; i >= 0; i--) {
            const fb = this.fallingBlocks[i];
            
            fb.velocity -= 20 * dt;
            fb.mesh.position.y += fb.velocity * dt;

            const gridY = Math.floor(fb.mesh.position.y - 0.5);
            const gridX = Math.floor(fb.mesh.position.x);
            const gridZ = Math.floor(fb.mesh.position.z);

            if (gridY < 0 || this.isSolid(gridX, gridY, gridZ)) {
                const targetY = gridY + 1;
                this.scene.remove(fb.mesh);
                fb.mesh.geometry.dispose();
                fb.mesh.material.dispose();
                
                this.setVoxel(gridX, targetY, gridZ, fb.id);
                this.fallingBlocks.splice(i, 1);
            }
        }
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
        
        const c = new Chunk(cx, cz); 
        this.chunks[k] = c;
        
        const hMap = this.gpuGenerator.generateHeightMap(cx, cz);
        
        for (let x = 0; x < CHUNK_SIZE; x++) for (let z = 0; z < CHUNK_SIZE; z++) {
            const h = Math.floor(hMap[z * CHUNK_SIZE + x] * 60) + 50; 
            const wx = cx * CHUNK_SIZE + x, wz = cz * CHUNK_SIZE + z;
            
            for (let y = 0; y < WORLD_HEIGHT; y++) {
                if (y === 0) c.setVoxel(x, y, z, BLOCK.BEDROCK);
                else if (y < h) {
                    const cave = (this.caveNoise.noise3D(wx * 0.03, y * 0.045, wz * 0.03) + 1) / 2;
                    if (y > 2 && y < h - 4 && cave > 0.6) {
                        c.setVoxel(x, y, z, BLOCK.AIR);
                    } else if (y < h - 4) {
                        c.setVoxel(x, y, z, BLOCK.STONE);
                    } else {
                        c.setVoxel(x, y, z, BLOCK.DIRT);
                    }
                } else if (y === h && c.getVoxel(x, y - 1, z) !== BLOCK.AIR) {
                    c.setVoxel(x, y, z, BLOCK.GRASS);
                }
            }
            if (c.getVoxel(x, h, z) === BLOCK.GRASS && h > 45 && Math.random() > 0.98 && x > 2 && x < 14 && z > 2 && z < 14) this.placeTree(c, x, h + 1, z);
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
        for (let i = 0; i < 5; i++) if (y + i < WORLD_HEIGHT) c.setVoxel(x, y + i, z, BLOCK.OAK_LOG);
        for (let dx = -2; dx <= 2; dx++) for (let dy = 2; dy <= 5; dy++) for (let dz = -2; dz <= 2; dz++)
            if (y + dy < WORLD_HEIGHT && (Math.abs(dx) !== 2 || Math.abs(dz) !== 2 || dy < 4)) if (c.getVoxel(x + dx, y + dy, z + dz) === BLOCK.AIR) c.setVoxel(x + dx, y + dy, z + dz, BLOCK.OAK_LEAVES);
    }

    generate() { this.updateChunks(new THREE.Vector3(0, 0, 0)); }

    updateChunks(p) {
        let rdSetting = this.settings ? this.settings.get('renderDistance') : 4;
        let radius = rdSetting - 1;
        if (radius < 0) radius = 0;

        const pcx = Math.floor(p.x / CHUNK_SIZE);
        const pcz = Math.floor(p.z / CHUNK_SIZE);
        
        const v = new Set();
        
        for (let x = -radius; x <= radius; x++) {
            for (let z = -radius; z <= radius; z++) {
                const targetCx = pcx + x;
                const targetCz = pcz + z;
                
                const regionKey = this.getRegionKey(targetCx, targetCz);
                v.add(regionKey);
                
                if (!this.regions[regionKey]) {
                    this.regions[regionKey] = new WorldRegion(targetCx, targetCz, this);
                    this.generateChunkData(targetCx, targetCz); 
                    this.regions[regionKey].needsUpdate = true; 

                    const checkAndDirty = (dx, dz) => {
                        const nk = this.getRegionKey(targetCx + dx, targetCz + dz);
                        if(this.regions[nk]) this.regions[nk].needsUpdate = true;
                    };
                    checkAndDirty(1, 0); checkAndDirty(-1, 0); checkAndDirty(0, 1); checkAndDirty(0, -1);
                }
            }
        }
        
        for (let k in this.regions) {
            if (!v.has(k)) { 
                this.regions[k].dispose(); 
                delete this.regions[k]; 
            }
        }
    }

    update(p, camera) {
        this.updateFallingBlocks(1/30);
        if (p) this.updateChunks(p);

        if (camera) {
            this.projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
            this.frustum.setFromProjectionMatrix(this.projScreenMatrix);
        }
        
        const regionKeys = Object.keys(this.regions);
        for (let k of regionKeys) {
            this.regions[k].checkUpdates();
        }

        // --- OPTIMIZED BFS CULLING ---
        // 1. Hide Everything
        for (let k of regionKeys) {
            const r = this.regions[k];
            for (let i=0; i<SECTIONS_PER_CHUNK; i++) {
                if(r.sections[i]) r.sections[i].visible = false;
            }
        }

        const pcx = Math.floor(p.x / CHUNK_SIZE);
        const pcz = Math.floor(p.z / CHUNK_SIZE);
        const pcy = Math.floor(p.y / SECTION_HEIGHT);

        const startKey = this.getRegionKey(pcx, pcz);
        const startRegion = this.regions[startKey];

        if (!startRegion) return;

        // BFS Setup
        this.cullFrameId++; // Increment global frame ID instead of clearing a Set
        const queue = [];
        const rd = this.settings ? this.settings.get('renderDistance') : 4;

        // Start from player position
        const safeY = Math.max(0, Math.min(SECTIONS_PER_CHUNK-1, pcy));
        
        // Mark start as visited using frame ID
        startRegion.sectionVisFrame[safeY] = this.cullFrameId;
        queue.push({ r: startRegion, y: safeY, rx: pcx, rz: pcz });

        const checkNeighbor = (curr, dx, dy, dz, boundaryFaceName) => {
            const nx = curr.rx + dx;
            const ny = curr.y + dy;
            const nz = curr.rz + dz;

            // Distance & Bounds Check (CRITICAL OPTIMIZATION)
            if (ny < 0 || ny >= SECTIONS_PER_CHUNK) return;
            if (Math.abs(nx - pcx) > rd || Math.abs(nz - pcz) > rd) return; 

            const nKey = this.getRegionKey(nx, nz);
            const nRegion = this.regions[nKey];

            if (!nRegion) return;

            // Fast Visited Check using Frame ID
            if (nRegion.sectionVisFrame[ny] === this.cullFrameId) return;

            // 1. Frustum Check
            let inFrustum = true;
            // Use sphere even if mesh doesn't exist (to traverse air)
            inFrustum = this.frustum.intersectsSphere(nRegion.sectionSpheres[ny]);
            
            if (!inFrustum) return;

            // 2. Passability Check
            const pass = curr.r.sectionPassability[curr.y][boundaryFaceName];
            if (!pass) return;

            // Add to queue
            nRegion.sectionVisFrame[ny] = this.cullFrameId;
            queue.push({ r: nRegion, y: ny, rx: nx, rz: nz });
        };

        let head = 0;
        while(head < queue.length) {
            const curr = queue[head++];
            
            if (curr.r.sections[curr.y]) {
                curr.r.sections[curr.y].visible = true;
            }

            checkNeighbor(curr, 1, 0, 0, 'xp');
            checkNeighbor(curr, -1, 0, 0, 'xn');
            checkNeighbor(curr, 0, 1, 0, 'yp');
            checkNeighbor(curr, 0, -1, 0, 'yn');
            checkNeighbor(curr, 0, 0, 1, 'zp');
            checkNeighbor(curr, 0, 0, -1, 'zn');
        }
    }

    getStats() {
        let totalTriangles = 0;
        let visibleSections = 0;
        for (const k in this.regions) {
            const r = this.regions[k];
            for (const s of r.sections) {
                if (s && s.geometry) {
                    totalTriangles += s.geometry.attributes.position.count / 3;
                    if(s.visible) visibleSections++;
                }
            }
        }
        return {
            chunks: Object.keys(this.chunks).length,
            regions: Object.keys(this.regions).length,
            totalTriangles: totalTriangles
        };
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