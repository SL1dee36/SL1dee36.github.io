import * as THREE from 'three';
import { BLOCK } from './blocks.js';
import { GPUWorldGenerator } from './GPUWorldGenerator.js';
import { SimplexNoise } from './utils/SimplexNoise.js';
import { TextureGenerator } from './TextureGenerator.js';

const CHUNK_SIZE = 16;
const WORLD_HEIGHT = 256;
const SECTION_HEIGHT = 32;
const SECTIONS_PER_CHUNK = WORLD_HEIGHT / SECTION_HEIGHT;

const PX = CHUNK_SIZE + 2;
const PY = SECTION_HEIGHT + 3;
const PZ = CHUNK_SIZE + 2;

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
    constructor(initialCapacity = 10000) {
        this.positions = new Float32Array(initialCapacity * 3);
        this.normals = new Float32Array(initialCapacity * 3);
        this.uvs = new Float32Array(initialCapacity * 2);
        this.colors = new Float32Array(initialCapacity * 3);
        this.indices = new Uint32Array(initialCapacity * 1.5);
        this.vCount = 0;
        this.iCount = 0;
        this.groups = [];
    }

    ensureCapacity(verticesToAdd, indicesToAdd) {
        if ((this.vCount + verticesToAdd) * 3 >= this.positions.length) {
            const newSize = this.positions.length * 2;
            const p = new Float32Array(newSize), n = new Float32Array(newSize), c = new Float32Array(newSize), u = new Float32Array((newSize/3)*2);
            p.set(this.positions); n.set(this.normals); c.set(this.colors); u.set(this.uvs);
            this.positions = p; this.normals = n; this.colors = c; this.uvs = u;
        }
        if (this.iCount + indicesToAdd >= this.indices.length) {
            const i = new Uint32Array(this.indices.length * 2);
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
        const radius = Math.sqrt(CHUNK_SIZE*CHUNK_SIZE + SECTION_HEIGHT*SECTION_HEIGHT + CHUNK_SIZE*CHUNK_SIZE) / 2;
        
        for(let i=0; i < SECTIONS_PER_CHUNK; i++) {
            const centerY = (i * SECTION_HEIGHT) + (SECTION_HEIGHT / 2);
            this.sectionSpheres.push(new THREE.Sphere(new THREE.Vector3(this.chunkX + CHUNK_SIZE/2, centerY, this.chunkZ + CHUNK_SIZE/2), radius + 2.0));
        }

        this.paddedCache = new Uint16Array(PX * PY * PZ);
        this.mask = new Int32Array(CHUNK_SIZE * SECTION_HEIGHT);
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
            for (let z = -1; z <= CHUNK_SIZE; z++) {
                for (let x = -1; x <= CHUNK_SIZE; x++) {
                    const idx = (y + 1) * PX * PZ + (z + 1) * PX + (x + 1);
                    if (startY + y < 0 || startY + y >= WORLD_HEIGHT) {
                        this.paddedCache[idx] = 0;
                    } else {
                        this.paddedCache[idx] = this.world.getRawVoxel(this.chunkX + x, startY + y, this.chunkZ + z);
                    }
                }
            }
        }
    }

    getCacheVoxelRaw(x, y, z) { return this.paddedCache[(y + 1) * PX * PZ + (z + 1) * PX + (x + 1)]; }
    
    isCacheSolid(x, y, z) {
        const raw = this.paddedCache[(y + 1) * PX * PZ + (z + 1) * PX + (x + 1)];
        const v = raw & 0xFF;
        return v !== BLOCK.AIR && BLOCK.get(v).isSolid ? 1 : 0;
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
                if ((raw & 0xFF) === BLOCK.WATER) {
                    const meta = (raw >> 8) & 0xFF;
                    let height = meta === 8 ? 0.9 : (meta / 8.0);
                    sumHeight += height;
                    count++;
                }
            }
        }
        
        if (count === 0) return 0.1;
        return 1.0 - (sumHeight / count);
    }

    generateSection(sectionIndex, chunk) {
        if (this.sections[sectionIndex]) {
            this.world.scene.remove(this.sections[sectionIndex]);
            this.sections[sectionIndex].geometry.dispose();
            this.sections[sectionIndex] = null;
        }

        const startY = sectionIndex * SECTION_HEIGHT;
        this.fillPaddedCache(startY);

        const builder = new GeometryBuilder();
        const useAO = this.world.settings.get('ambientOcclusion');

        const getTextureIdx = (props, dir) => {
            let texName = typeof props.texture !== 'object' ? props.texture : (dir === 'top' ? props.texture.top : (dir === 'bottom' ? props.texture.bottom : (dir === 'front' && props.texture.front ? props.texture.front : props.texture.side)));
            return this.world.getMaterialIndex(texName);
        };

        const faces = [
            { dirName: 'side', n: [1, 0, 0], axis: 0, sign: 1, uAxis: 2, vAxis: 1, buildCorners: (w, h) => [[1, 0, 0], [1, h, 0], [1, 0, w], [1, h, w]], buildUVs: (w, h) => [0,0, 0,h, w,0, w,h] },
            { dirName: 'side', n: [-1, 0, 0], axis: 0, sign: -1, uAxis: 2, vAxis: 1, buildCorners: (w, h) => [[0, 0, w], [0, h, w], [0, 0, 0], [0, h, 0]], buildUVs: (w, h) => [0,0, 0,h, w,0, w,h] },
            { dirName: 'top', n: [0, 1, 0], axis: 1, sign: 1, uAxis: 0, vAxis: 2, buildCorners: (w, h) => [[0, 1, h], [w, 1, h], [0, 1, 0], [w, 1, 0]], buildUVs: (w, h) => [0,0, w,0, 0,h, w,h] },
            { dirName: 'bottom', n: [0, -1, 0], axis: 1, sign: -1, uAxis: 0, vAxis: 2, buildCorners: (w, h) => [[0, 0, 0], [w, 0, 0], [0, 0, h], [w, 0, h]], buildUVs: (w, h) => [0,0, w,0, 0,h, w,h] },
            { dirName: 'front', n: [0, 0, 1], axis: 2, sign: 1, uAxis: 0, vAxis: 1, buildCorners: (w, h) => [[w, 0, 1], [w, h, 1], [0, 0, 1], [0, h, 1]], buildUVs: (w, h) => [0,0, 0,h, w,0, w,h] },
            { dirName: 'side', n: [0, 0, -1], axis: 2, sign: -1, uAxis: 0, vAxis: 1, buildCorners: (w, h) => [[0, 0, 0], [0, h, 0], [w, 0, 0], [w, h, 0]], buildUVs: (w, h) => [0,0, 0,h, w,0, w,h] }
        ];

        for (const face of faces) {
            const uSize = face.uAxis === 1 ? SECTION_HEIGHT : CHUNK_SIZE;
            const vSize = face.vAxis === 1 ? SECTION_HEIGHT : CHUNK_SIZE;
            const dSize = face.axis === 1 ? SECTION_HEIGHT : CHUNK_SIZE;

            for (let d = 0; d < dSize; d++) {
                this.mask.fill(0);

                for (let v = 0; v < vSize; v++) {
                    for (let u = 0; u < uSize; u++) {
                        let x = face.axis === 0 ? d : (face.uAxis === 0 ? u : v);
                        let y = face.axis === 1 ? d : (face.uAxis === 1 ? u : v);
                        let z = face.axis === 2 ? d : (face.uAxis === 2 ? u : v);

                        const raw = this.getCacheVoxelRaw(x, y, z);
                        const voxel = raw & 0xFF;
                        if (voxel === BLOCK.AIR) continue;

                        let nx = x + (face.axis === 0 ? face.sign : 0);
                        let ny = y + (face.axis === 1 ? face.sign : 0);
                        let nz = z + (face.axis === 2 ? face.sign : 0);

                        const neighborRaw = this.getCacheVoxelRaw(nx, ny, nz);
                        const neighborId = neighborRaw & 0xFF;
                        const nProps = BLOCK.get(neighborId);
                        const bProps = BLOCK.get(voxel);

                        let draw = false;
                        if (neighborId === BLOCK.AIR) draw = true;
                        else if (nProps.isTransparent) {
                            if (bProps.isTransparent && voxel === neighborId) draw = false;
                            else draw = true;
                        }

                        if (draw) {
                            const texIdx = getTextureIdx(bProps, face.dirName);
                            let ao0=10, ao1=10, ao2=10, ao3=10;

                            if (useAO && voxel !== BLOCK.WATER) { 
                                let baseLight = (voxel === BLOCK.STONE || voxel === BLOCK.BEDROCK || voxel === BLOCK.COAL_ORE || voxel === BLOCK.IRON_ORE) ? 6 : 10;
                                ao0 = Math.floor(baseLight * this.calcAO(x, y, z, face.dirName, 0));
                                ao1 = Math.floor(baseLight * this.calcAO(x, y, z, face.dirName, 1));
                                ao2 = Math.floor(baseLight * this.calcAO(x, y, z, face.dirName, 2));
                                ao3 = Math.floor(baseLight * this.calcAO(x, y, z, face.dirName, 3));
                            }

                            const aoHash = (ao0) | (ao1 << 4) | (ao2 << 8) | (ao3 << 12);
                            this.mask[v * uSize + u] = voxel | (texIdx << 8) | (aoHash << 16);
                        }
                    }
                }

                for (let v = 0; v < vSize; v++) {
                    for (let u = 0; u < uSize; u++) {
                        const maskVal = this.mask[v * uSize + u];
                        if (maskVal !== 0) {
                            const voxelId = maskVal & 0xFF;
                            const isWater = (voxelId === BLOCK.WATER);

                            let w = 1, h = 1;

                            if (!isWater) { // Water does not merge to form smooth peaks!
                                while (u + w < uSize && this.mask[v * uSize + (u + w)] === maskVal) w++;

                                let done = false;
                                while (v + h < vSize && !done) {
                                    for (let i = 0; i < w; i++) {
                                        if (this.mask[(v + h) * uSize + (u + i)] !== maskVal) { done = true; break; }
                                    }
                                    if (!done) h++;
                                }
                            }

                            for (let j = 0; j < h; j++) {
                                for (let i = 0; i < w; i++) this.mask[(v + j) * uSize + (u + i)] = 0;
                            }

                            let x = face.axis === 0 ? d : (face.uAxis === 0 ? u : v);
                            let y = face.axis === 1 ? d : (face.uAxis === 1 ? u : v);
                            let z = face.axis === 2 ? d : (face.uAxis === 2 ? u : v);

                            const wx = this.chunkX + x;
                            const wy = startY + y;
                            const wz = this.chunkZ + z;
                            
                            const texIdx = (maskVal >> 8) & 0xFF;
                            const aoHash = (maskVal >> 16) & 0xFFFF;
                            const ao = [ (aoHash & 0xF)/10, ((aoHash>>4) & 0xF)/10, ((aoHash>>8) & 0xF)/10, ((aoHash>>12) & 0xF)/10 ];

                            const corners = face.buildCorners(w, h);
                            const yOffsets = [0, 0, 0, 0];

                            // Water smoothing
                            if (isWater) {
                                for (let i = 0; i < 4; i++) {
                                    if (corners[i][1] > 0) {
                                        yOffsets[i] = this.getWaterOffset(x, y, z, corners[i][0], corners[i][2]);
                                    }
                                }
                            }

                            this.addFacePacked(builder, wx, wy, wz, face.n, corners, face.buildUVs(w, h), texIdx, ao, yOffsets);
                        }
                    }
                }
            }
        }

        if (builder.vCount === 0) return;

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(builder.positions.subarray(0, builder.vCount * 3), 3));
        geometry.setAttribute('normal', new THREE.BufferAttribute(builder.normals.subarray(0, builder.vCount * 3), 3));
        geometry.setAttribute('uv', new THREE.BufferAttribute(builder.uvs.subarray(0, builder.vCount * 2), 2));
        geometry.setAttribute('color', new THREE.BufferAttribute(builder.colors.subarray(0, builder.vCount * 3), 3));
        geometry.setIndex(new THREE.BufferAttribute(builder.indices.subarray(0, builder.iCount), 1));
        
        for(let g of builder.groups) geometry.addGroup(g.start, g.count, g.mat);
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

    calcAO(x, y, z, dir, vIdx) {
        const s = (dx, dy, dz) => this.isCacheSolid(x+dx, y+dy, z+dz);
        let s1=0, s2=0, c=0;

        if (dir === 'top') {
             if (vIdx===0) { s1=s(-1,1,0); s2=s(0,1,1); c=s(-1,1,1); }
             else if (vIdx===1) { s1=s(1,1,0); s2=s(0,1,1); c=s(1,1,1); }
             else if (vIdx===2) { s1=s(-1,1,0); s2=s(0,1,-1); c=s(-1,1,-1); }
             else if (vIdx===3) { s1=s(1,1,0); s2=s(0,1,-1); c=s(1,1,-1); }
        } else if (dir === 'bottom') {
             if (vIdx===0) { s1=s(-1,-1,0); s2=s(0,-1,-1); c=s(-1,-1,-1); }
             else if (vIdx===1) { s1=s(1,-1,0); s2=s(0,-1,-1); c=s(1,-1,-1); }
             else if (vIdx===2) { s1=s(-1,-1,0); s2=s(0,-1,1); c=s(-1,-1,1); }
             else if (vIdx===3) { s1=s(1,-1,0); s2=s(0,-1,1); c=s(1,-1,1); }
        } else if (dir === 'front') {
             if (vIdx===0) { s1=s(1,0,1); s2=s(0,1,1); c=s(1,1,1); }
             else if (vIdx===1) { s1=s(1,0,1); s2=s(0,-1,1); c=s(1,-1,1); }
             else if (vIdx===2) { s1=s(-1,0,1); s2=s(0,1,1); c=s(-1,1,1); }
             else if (vIdx===3) { s1=s(-1,0,1); s2=s(0,-1,1); c=s(-1,-1,1); }
        } else if (dir === 'side') {
            if(this.isCacheSolid(x, y+1, z)) return 0.6;
        }

        if (s1 && s2) return 0.5;
        return 1.0 - (s1 + s2 + c) * 0.2;
    }

    addFacePacked(builder, wx, y, wz, n, corners, uvs, matIdx, ao, yOffsets) {
        builder.ensureCapacity(4, 6);
        const vBase = builder.vCount;
        let pIdx = vBase * 3, uIdx = vBase * 2;
        
        let sideDim = 1.0;
        if(n[0] !== 0) sideDim = 0.8;
        else if(n[2] !== 0) sideDim = 0.7;
        else if(n[1] < 0) sideDim = 0.5;

        for (let i = 0; i < 4; i++) {
            builder.positions[pIdx] = corners[i][0] + wx;
            builder.positions[pIdx+1] = corners[i][1] - (yOffsets ? yOffsets[i] : 0) + y;
            builder.positions[pIdx+2] = corners[i][2] + wz;
            builder.normals[pIdx] = n[0]; builder.normals[pIdx+1] = n[1]; builder.normals[pIdx+2] = n[2];
            
            const l = ao[i] * sideDim;
            builder.colors[pIdx] = l; builder.colors[pIdx+1] = l; builder.colors[pIdx+2] = l;
            
            builder.uvs[uIdx] = uvs[i*2]; builder.uvs[uIdx+1] = uvs[i*2+1];
            pIdx += 3; uIdx += 2;
        }

        let iIdx = builder.iCount;
        builder.indices[iIdx] = vBase; builder.indices[iIdx+1] = vBase+1; builder.indices[iIdx+2] = vBase+2;
        builder.indices[iIdx+3] = vBase+2; builder.indices[iIdx+4] = vBase+1; builder.indices[iIdx+5] = vBase+3;

        builder.vCount += 4;
        builder.iCount += 6;

        let g = builder.groups;
        if (g.length === 0 || g[g.length-1].mat !== matIdx) g.push({ start: iIdx, count: 6, mat: matIdx });
        else g[g.length-1].count += 6;
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
        
        this.waterTexture = null;
        this.waterUniforms = { 
            time: { value: 0 },
            skyColor: { value: new THREE.Color() }
        };
        
        this.initMaterials();

        this.frustum = new THREE.Frustum();
        this.projScreenMatrix = new THREE.Matrix4();
        this.fallingBlocks = [];
        
        this.cullFrameId = 0;
        
        this.chunkGenQueue = [];
        this.meshBuildQueue = [];

        this.fluidQueue = [];
        this.fluidSet = new Set();
        this.fluidTimer = 0;
    }

    initMaterials() {
        let mi = 0;
        const processed = new Set();
        for (const k in BLOCK.properties) {
            const p = BLOCK.properties[k];
            if (!p.texture) continue;
            const arr = typeof p.texture === 'object' ? [p.texture.top, p.texture.bottom, p.texture.side, p.texture.front].filter(Boolean) : [p.texture];

            arr.forEach(genKey => {
                if (!processed.has(genKey)) {
                    processed.add(genKey);
                    const texture = this.textureGenerator.generate(genKey);
                    texture.wrapS = THREE.RepeatWrapping; texture.wrapT = THREE.RepeatWrapping;
                    const isTrans = p.isTransparent || genKey.includes('glass') || genKey.includes('leaves') || genKey.includes('water');
                    
                    if (genKey.includes('water')) {
                        this.waterTexture = texture;
                        const mat = new THREE.MeshLambertMaterial({
                            map: texture, transparent: true, opacity: 0.85, side: THREE.DoubleSide, vertexColors: true, depthWrite: false
                        });

                        mat.onBeforeCompile = (shader) => {
                            shader.uniforms.time = this.waterUniforms.time;
                            shader.uniforms.skyColor = this.waterUniforms.skyColor;
                            
                            shader.vertexShader = `
                                uniform float time;
                                varying vec3 vWorldPosW;
                                ${shader.vertexShader}
                            `.replace(
                                `#include <begin_vertex>`,
                                `
                                #include <begin_vertex>
                                vWorldPosW = (modelMatrix * vec4(position, 1.0)).xyz;
                                if (normal.y > 0.5) {
                                    float wave = sin(vWorldPosW.x * 2.0 + time * 3.0) * 0.05 + cos(vWorldPosW.z * 2.0 + time * 2.5) * 0.05;
                                    transformed.y += wave;
                                }
                                `
                            );

                            shader.fragmentShader = `
                                uniform vec3 skyColor;
                                varying vec3 vWorldPosW;
                                ${shader.fragmentShader}
                            `.replace(
                                `#include <fog_fragment>`,
                                `
                                vec3 viewDirW = normalize(cameraPosition - vWorldPosW);
                                float fresnel = 1.0 - max(dot(viewDirW, vec3(0.0, 1.0, 0.0)), 0.0);
                                fresnel = pow(fresnel, 3.0);
                                gl_FragColor.rgb = mix(gl_FragColor.rgb, skyColor, fresnel * 0.8);
                                gl_FragColor.a = max(gl_FragColor.a, fresnel * 0.9);
                                #include <fog_fragment>
                                `
                            );
                        };
                        this.materials.push(mat);
                    } else {
                        this.materials.push(new THREE.MeshLambertMaterial({
                            map: texture, transparent: isTrans, alphaTest: isTrans ? 0.3 : 0, side: THREE.FrontSide, vertexColors: true
                        }));
                    }
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
    isChunkLoaded(x, z) { return !!this.getChunk(Math.floor(x/16), Math.floor(z/16)); }

    getRawVoxel(x, y, z) {
        const cx = Math.floor(x / CHUNK_SIZE), cz = Math.floor(z / CHUNK_SIZE);
        let c = this.getChunk(cx, cz);
        if (!c) return 0;
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
            if (this.getVoxel(x, y, z) !== BLOCK.AIR) return y;
        }
        return 0;
    }

    isSolid(x, y, z) {
        const v = this.getVoxel(x, y, z);
        return v !== BLOCK.AIR && BLOCK.get(v).isSolid;
    }

    setVoxel(x, y, z, v, meta = 0) {
        const cx = Math.floor(x / CHUNK_SIZE), cz = Math.floor(z / CHUNK_SIZE);
        let c = this.getChunk(cx, cz);
        if (!c) {
            this.generateChunkData(cx, cz);
            c = this.getChunk(cx, cz);
        }

        if (v === BLOCK.WATER && meta === 0) meta = 8;

        const lx = x - cx * CHUNK_SIZE, lz = z - cz * CHUNK_SIZE;
        c.setVoxel(lx, y, lz, v, meta);

        const flagUpdate = (dx, dz) => { const r = this.getRegion(cx+dx, cz+dz); if(r) r.needsUpdate = true; };
        flagUpdate(0,0);
        if (lx === 0) flagUpdate(-1,0); if (lx === CHUNK_SIZE - 1) flagUpdate(1,0);
        if (lz === 0) flagUpdate(0,-1); if (lz === CHUNK_SIZE - 1) flagUpdate(0,1);

        if(v === BLOCK.AIR) {
            const above = this.getVoxel(x, y+1, z);
            if(BLOCK.get(above).falling) this.spawnFallingBlock(x, y+1, z, above);
        } else if (BLOCK.get(v).falling) this.spawnFallingBlock(x, y, z, v);

        // Waking up the neighbors for water
        this.scheduleFluidUpdate(x, y, z);
        this.scheduleFluidUpdate(x+1, y, z);
        this.scheduleFluidUpdate(x-1, y, z);
        this.scheduleFluidUpdate(x, y+1, z);
        this.scheduleFluidUpdate(x, y-1, z);
        this.scheduleFluidUpdate(x, y, z+1);
        this.scheduleFluidUpdate(x, y, z-1);
    }

    scheduleFluidUpdate(x, y, z) {
        const key = `${x},${y},${z}`;
        if (!this.fluidSet.has(key)) {
            this.fluidSet.add(key);
            this.fluidQueue.push({x, y, z});
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
            if (this.getVoxel(x, y+1, z) === BLOCK.WATER) {
                expectedLevel = 7;
            } else {
                let maxNeighbor = 0;
                const dirs = [[1,0,0], [-1,0,0], [0,0,1], [0,0,-1]];
                for(let d of dirs) {
                    const nx = x+d[0], nz = z+d[2];
                    if (!this.isChunkLoaded(nx, nz)) continue;
                    if(this.getVoxel(nx, y, nz) === BLOCK.WATER) {
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
            const below = this.getVoxel(x, y-1, z);
            if (below === BLOCK.AIR) {
                this.setVoxel(x, y-1, z, BLOCK.WATER, 7);
            } else if (below !== BLOCK.WATER && BLOCK.get(below).isSolid) {
                if (expectedLevel > 1) {
                    const dirs = [[1,0,0], [-1,0,0], [0,0,1], [0,0,-1]];
                    for(let d of dirs) {
                        const nx = x+d[0], nz = z+d[2];
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

    spawnFallingBlock(x, y, z, id) {
        if (this.fallingBlocks.some(b => Math.abs(b.mesh.position.x - (x+0.5)) < 0.1 && Math.abs(b.mesh.position.z - (z+0.5)) < 0.1 && Math.abs(b.mesh.position.y - (y+0.5)) < 0.5)) return;
        this.setVoxel(x, y, z, BLOCK.AIR);
        
        const props = BLOCK.get(id);
        const tex = this.textureGenerator.generate(typeof props.texture === 'object' ? props.texture.side : props.texture);
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.98, 0.98), new THREE.MeshLambertMaterial({ map: tex }));
        mesh.position.set(x + 0.5, y + 0.5, z + 0.5);
        mesh.castShadow = true;
        this.scene.add(mesh);
        this.fallingBlocks.push({ mesh: mesh, id: id, velocity: 0 });
    }

    updateFallingBlocks(dt) {
        for (let i = this.fallingBlocks.length - 1; i >= 0; i--) {
            const fb = this.fallingBlocks[i];
            fb.velocity -= 20 * dt;
            fb.mesh.position.y += fb.velocity * dt;

            const gridY = Math.floor(fb.mesh.position.y - 0.5), gridX = Math.floor(fb.mesh.position.x), gridZ = Math.floor(fb.mesh.position.z);
            if (gridY < 0 || this.isSolid(gridX, gridY, gridZ)) {
                this.scene.remove(fb.mesh); fb.mesh.geometry.dispose(); fb.mesh.material.dispose();
                this.setVoxel(gridX, gridY + 1, gridZ, fb.id);
                this.fallingBlocks.splice(i, 1);
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

    generateChunkData(cx, cz) {
        const k = this.getChunkKey(cx, cz);
        if (this.chunks[k] && this.chunks[k].isGenerated) return this.chunks[k];
        
        const c = this.chunks[k] || new Chunk(cx, cz);
        this.chunks[k] = c;

        const hMap = this.gpuGenerator.generateHeightMap(cx, cz);
        const SEA_LEVEL = 60;

        for (let x = 0; x < CHUNK_SIZE; x++) {
            for (let z = 0; z < CHUNK_SIZE; z++) {
                const h = Math.floor(hMap[z * CHUNK_SIZE + x] * 80) + 30;
                const wx = cx * CHUNK_SIZE + x, wz = cz * CHUNK_SIZE + z;
                
                const isBeach = (h >= SEA_LEVEL - 2 && h <= SEA_LEVEL + 1);

                for (let y = 0; y < WORLD_HEIGHT; y++) {
                    if (y === 0) {
                        c.setVoxel(x, y, z, BLOCK.BEDROCK);
                    } else if (y <= h) {
                        const cave = (this.caveNoise.noise3D(wx * 0.03, y * 0.045, wz * 0.03) + 1) / 2;
                        
                        if (y > 2 && y < h - 4 && cave > 0.6) {
                            c.setVoxel(x, y, z, BLOCK.AIR);
                        } else if (y === h && c.getVoxel(x, y - 1, z) !== BLOCK.AIR) {
                            if (isBeach) c.setVoxel(x, y, z, BLOCK.SAND);
                            else if (h < SEA_LEVEL) c.setVoxel(x, y, z, (Math.random() > 0.3 ? BLOCK.SAND : BLOCK.DIRT));
                            else c.setVoxel(x, y, z, BLOCK.GRASS);
                        } else if (y < h - 4) {
                            c.setVoxel(x, y, z, BLOCK.STONE);
                        } else {
                            c.setVoxel(x, y, z, (isBeach || h < SEA_LEVEL) ? BLOCK.SAND : BLOCK.DIRT);
                        }
                    } else if (y <= SEA_LEVEL) {
                        c.setVoxel(x, y, z, BLOCK.WATER, 8);
                    }
                }
                
                if (c.getVoxel(x, h, z) === BLOCK.GRASS && h > SEA_LEVEL && Math.random() > 0.98 && x > 2 && x < 14 && z > 2 && z < 14) {
                    for (let i = 0; i < 5; i++) if (h + 1 + i < WORLD_HEIGHT) c.setVoxel(x, h + 1 + i, z, BLOCK.OAK_LOG);
                    for (let dx = -2; dx <= 2; dx++) for (let dy = 2; dy <= 5; dy++) for (let dz = -2; dz <= 2; dz++)
                        if (h + 1 + dy < WORLD_HEIGHT && (Math.abs(dx) !== 2 || Math.abs(dz) !== 2 || dy < 4)) if (c.getVoxel(x + dx, h + 1 + dy, z + dz) === BLOCK.AIR) c.setVoxel(x + dx, h + 1 + dy, z + dz, BLOCK.OAK_LEAVES);
                }
            }
        }
        
        for (let x = 0; x < CHUNK_SIZE; x++) for (let z = 0; z < CHUNK_SIZE; z++) for (let y = 1; y < WORLD_HEIGHT - 5; y++) {
            if (c.getVoxel(x, y, z) === BLOCK.STONE) {
                if (Math.random() < 0.006) this.generateVein(c, x, y, z, BLOCK.COAL_ORE, Math.floor(Math.random() * 4) + 2);
                if (y < 60 && Math.random() < 0.004) this.generateVein(c, x, y, z, BLOCK.IRON_ORE, Math.floor(Math.random() * 3) + 2);
            }
        }
        
        c.isGenerated = true;
        return c;
    }

    generate() { this.updateChunks(new THREE.Vector3(0, 0, 0)); }

    updateChunks(p) {
        const radius = Math.max(0, (this.settings ? this.settings.get('renderDistance') : 4) - 1);
        const pcx = Math.floor(p.x / CHUNK_SIZE), pcz = Math.floor(p.z / CHUNK_SIZE);
        const v = new Set();

        for (let x = -radius; x <= radius; x++) {
            for (let z = -radius; z <= radius; z++) {
                const targetCx = pcx + x, targetCz = pcz + z;
                const regionKey = this.getRegionKey(targetCx, targetCz);
                v.add(regionKey);

                if (!this.regions[regionKey]) {
                    this.regions[regionKey] = new WorldRegion(targetCx, targetCz, this);
                    this.chunkGenQueue.push({ cx: targetCx, cz: targetCz, key: regionKey });
                }
            }
        }

        for (let k in this.regions) {
            if (!v.has(k)) {
                this.regions[k].dispose();
                this.meshBuildQueue = this.meshBuildQueue.filter(task => task.region !== this.regions[k]);
                this.chunkGenQueue = this.chunkGenQueue.filter(task => task.key !== k);
                delete this.regions[k];
            }
        }
    }

    update(p, camera) {
        const t = performance.now() / 1000.0;
        if (this.waterUniforms) {
            this.waterUniforms.time.value = t;
            if (this.waterTexture) this.waterTexture.offset.set(t * 0.1, t * 0.05);
        }

        this.updateFallingBlocks(1/30);
        
        // Smooth spreading: 5 ticks per second (0.2s)
        if (t - this.fluidTimer > 0.2) {
            this.fluidTimer = t;
            let count = 0;
            // Process up to 2 water blocks per tick
            while(this.fluidQueue.length > 0 && count < 100) {
                const pos = this.fluidQueue.shift();
                this.fluidSet.delete(`${pos.x},${pos.y},${pos.z}`);
                this.updateFluidBlock(pos.x, pos.y, pos.z);
                count++;
            }
        }
        
        if (this.chunkGenQueue.length > 0) {
            const task = this.chunkGenQueue.shift();
            if (this.regions[task.key]) {
                this.generateChunkData(task.cx, task.cz);
                this.regions[task.key].needsUpdate = true;

                const flagUpdate = (dx, dz) => { 
                    const nk = this.getRegionKey(task.cx + dx, task.cz + dz); 
                    if (this.regions[nk] && this.chunks[nk]?.isGenerated) this.regions[nk].needsUpdate = true; 
                };
                flagUpdate(1, 0); flagUpdate(-1, 0); flagUpdate(0, 1); flagUpdate(0, -1);
            }
        }

        const meshStartTime = performance.now();
        while (this.meshBuildQueue.length > 0) {
            if (performance.now() - meshStartTime > 8) break; 
            
            const task = this.meshBuildQueue.shift();
            if (this.regions[task.region.rx + ',' + task.region.rz] === task.region) {
                task.region.generateSection(task.sectionIndex, task.chunk);
            }
        }

        if (p) this.updateChunks(p);

        if (camera) {
            this.projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
            this.frustum.setFromProjectionMatrix(this.projScreenMatrix);
        }

        const regionKeys = Object.keys(this.regions);
        for (let k of regionKeys) this.regions[k].checkUpdates();

        for (let k of regionKeys) {
            for (let i=0; i<SECTIONS_PER_CHUNK; i++) if(this.regions[k].sections[i]) this.regions[k].sections[i].visible = false;
        }

        const pcx = Math.floor(p.x / CHUNK_SIZE), pcz = Math.floor(p.z / CHUNK_SIZE), pcy = Math.floor(p.y / SECTION_HEIGHT);
        const startRegion = this.regions[this.getRegionKey(pcx, pcz)];
        if (!startRegion) return;

        this.cullFrameId++;
        const queue = [], rd = this.settings ? this.settings.get('renderDistance') : 4;
        const safeY = Math.max(0, Math.min(SECTIONS_PER_CHUNK-1, pcy));

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
        while(head < queue.length) {
            const curr = queue[head++];
            if (curr.r.sections[curr.y]) curr.r.sections[curr.y].visible = true;

            checkNeighbor(curr, 1, 0, 0, 'xp'); checkNeighbor(curr, -1, 0, 0, 'xn');
            checkNeighbor(curr, 0, 1, 0, 'yp'); checkNeighbor(curr, 0, -1, 0, 'yn');
            checkNeighbor(curr, 0, 0, 1, 'zp'); checkNeighbor(curr, 0, 0, -1, 'zn');
        }
    }

    getStats() {
        let tris = 0, vis = 0;
        for (const k in this.regions) for (const s of this.regions[k].sections) {
            if (s && s.geometry) { tris += s.geometry.attributes.position.count / 3; if(s.visible) vis++; }
        }
        return { chunks: Object.keys(this.chunks).length, regions: Object.keys(this.regions).length, totalTriangles: tris };
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
            c.data = new Uint16Array(d.chunks[k]); 
            c.isGenerated = true;
            this.chunks[k] = c;
        }
    }
}
