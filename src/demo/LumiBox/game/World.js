// game/World.js
// author: Nazaryan A.K.
// github: @Sl1dee36

import * as THREE from 'three';
import { BLOCK } from './blocks.js';
import { SimplexNoise } from './utils/SimplexNoise.js';
import { TextureGenerator, TextureAtlas } from './TextureGenerator.js';
import { ItemDrop } from './ItemDrop.js';

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
    constructor(initialCapacity = 16000) {
        this.positions = new Float32Array(initialCapacity * 3);
        this.normals = new Float32Array(initialCapacity * 3);
        this.uvs = new Float32Array(initialCapacity * 2);
        this.atlasBounds = new Float32Array(initialCapacity * 4);
        this.colors = new Float32Array(initialCapacity * 3);
        this.indices = new Uint32Array(initialCapacity * 1.5);
        this.vCount = 0;
        this.iCount = 0;
        this.groups = [];
    }

    ensureCapacity(verticesToAdd, indicesToAdd) {
        if ((this.vCount + verticesToAdd) * 3 >= this.positions.length) {
            const newSize = Math.max(this.positions.length * 2, (this.vCount + verticesToAdd) * 6);
            const p = new Float32Array(newSize);
            const n = new Float32Array(newSize);
            const c = new Float32Array(newSize);
            const u = new Float32Array((newSize / 3) * 2);
            const ab = new Float32Array((newSize / 3) * 4);

            p.set(this.positions);
            n.set(this.normals);
            c.set(this.colors);
            u.set(this.uvs);
            ab.set(this.atlasBounds);

            this.positions = p;
            this.normals = n;
            this.colors = c;
            this.uvs = u;
            this.atlasBounds = ab;
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
        this.mask = new Int32Array(CHUNK_SIZE * SECTION_HEIGHT);
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
        const props = BLOCK.get(v);
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

    generateSection(sectionIndex, chunk) {
        if (this.sections[sectionIndex]) {
            this.world.scene.remove(this.sections[sectionIndex]);
            if (this.sections[sectionIndex].geometry) this.sections[sectionIndex].geometry.dispose();
            this.sections[sectionIndex] = null;
        }

        const startY = sectionIndex * SECTION_HEIGHT;
        this.fillPaddedCache(startY);
        const builder = new GeometryBuilder();
        const useAO = this.world.settings.get('ambientOcclusion');

        const getTexName = (props, dir) => {
            if (typeof props.texture !== 'object') return props.texture;
            if (dir === 'top') return props.texture.top;
            if (dir === 'bottom') return props.texture.bottom;
            if (dir === 'front' && props.texture.front) return props.texture.front;
            return props.texture.side;
        };

        const faces = [
            { dirName: 'side', n: [1, 0, 0], axis: 0, sign: 1, uAxis: 2, vAxis: 1, buildCorners: (w, h) => [[1, 0, 0], [1, h, 0], [1, 0, w], [1, h, w]], buildUVs: (w, h) => [0, 0, 0, h, w, 0, w, h] },
            { dirName: 'side', n: [-1, 0, 0], axis: 0, sign: -1, uAxis: 2, vAxis: 1, buildCorners: (w, h) => [[0, 0, w], [0, h, w], [0, 0, 0], [0, h, 0]], buildUVs: (w, h) => [0, 0, 0, h, w, 0, w, h] },
            { dirName: 'top', n: [0, 1, 0], axis: 1, sign: 1, uAxis: 0, vAxis: 2, buildCorners: (w, h) => [[0, 1, h], [w, 1, h], [0, 1, 0], [w, 1, 0]], buildUVs: (w, h) => [0, 0, w, 0, 0, h, w, h] },
            { dirName: 'bottom', n: [0, -1, 0], axis: 1, sign: -1, uAxis: 0, vAxis: 2, buildCorners: (w, h) => [[0, 0, 0], [w, 0, 0], [0, 0, h], [w, 0, h]], buildUVs: (w, h) => [0, 0, w, 0, 0, h, w, h] },
            { dirName: 'front', n: [0, 0, 1], axis: 2, sign: 1, uAxis: 0, vAxis: 1, buildCorners: (w, h) => [[w, 0, 1], [w, h, 1], [0, 0, 1], [0, h, 1]], buildUVs: (w, h) => [0, 0, 0, h, w, 0, w, h] },
            { dirName: 'side', n: [0, 0, -1], axis: 2, sign: -1, uAxis: 0, vAxis: 1, buildCorners: (w, h) => [[0, 0, 0], [0, h, 0], [w, 0, 0], [w, h, 0]], buildUVs: (w, h) => [0, 0, 0, h, w, 0, w, h] }
        ];

        const waterFacesToBuild = [];

        // 1. Greedy Meshing
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
                        const bProps = BLOCK.get(voxel);
                        if (bProps.isPlant) continue;

                        let nx = x + (face.axis === 0 ? face.sign : 0);
                        let ny = y + (face.axis === 1 ? face.sign : 0);
                        let nz = z + (face.axis === 2 ? face.sign : 0);

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

                        if (draw) {
                            let ao0 = 10, ao1 = 10, ao2 = 10, ao3 = 10;
                            if (useAO && voxel !== BLOCK.WATER) {
                                let baseLight = (voxel === BLOCK.STONE || voxel === BLOCK.BEDROCK || voxel === BLOCK.COAL_ORE || voxel === BLOCK.IRON_ORE) ? 6 : 10;
                                ao0 = Math.floor(baseLight * this.calcAO(x, y, z, face.dirName, 0));
                                ao1 = Math.floor(baseLight * this.calcAO(x, y, z, face.dirName, 1));
                                ao2 = Math.floor(baseLight * this.calcAO(x, y, z, face.dirName, 2));
                                ao3 = Math.floor(baseLight * this.calcAO(x, y, z, face.dirName, 3));
                            }
                            const aoHash = (ao0) | (ao1 << 4) | (ao2 << 8) | (ao3 << 12);
                            this.mask[v * uSize + u] = voxel | (aoHash << 16);
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
                            if (!isWater) {
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

                            const aoHash = (maskVal >> 16) & 0xFFFF;
                            const ao = [(aoHash & 0xF) / 10, ((aoHash >> 4) & 0xF) / 10, ((aoHash >> 8) & 0xF) / 10, ((aoHash >> 12) & 0xF) / 10];
                            const corners = face.buildCorners(w, h);
                            const yOffsets = [0, 0, 0, 0];

                            if (isWater) {
                                for (let i = 0; i < 4; i++) {
                                    if (corners[i][1] > 0) {
                                        yOffsets[i] = this.getWaterOffset(x, y, z, corners[i][0], corners[i][2]);
                                    }
                                }
                                waterFacesToBuild.push({
                                    wx, wy, wz, n: face.n, corners, uvs: face.buildUVs(w, h), ao, yOffsets
                                });
                            } else {
                                const bProps = BLOCK.get(voxelId);
                                const texName = getTexName(bProps, face.dirName);
                                const uvBounds = this.world.atlas.getUV(texName);
                                this.addFacePacked(builder, wx, wy, wz, face.n, corners, face.buildUVs(w, h), false, uvBounds, ao, yOffsets);
                            }
                        }
                    }
                }
            }
        }

        // 2. Растения (X-Cross)
        for (let y = 0; y < SECTION_HEIGHT; y++) {
            for (let z = 0; z < CHUNK_SIZE; z++) {
                for (let x = 0; x < CHUNK_SIZE; x++) {
                    const raw = this.getCacheVoxelRaw(x, y, z);
                    const voxel = raw & 0xFF;
                    if (voxel === BLOCK.AIR) continue;
                    const bProps = BLOCK.get(voxel);
                    if (bProps.isPlant) {
                        const texName = getTexName(bProps, 'side');
                        const uvBounds = this.world.atlas.getUV(texName);
                        const wx = this.chunkX + x;
                        const wy = startY + y;
                        const wz = this.chunkZ + z;
                        this.addPlantMesh(builder, wx, wy, wz, uvBounds);
                    }
                }
            }
        }

        const opaqueIndexCount = builder.iCount;

        // 3. Добавление воды вторым проходом
        for (let i = 0; i < waterFacesToBuild.length; i++) {
            const wf = waterFacesToBuild[i];
            this.addFacePacked(builder, wf.wx, wf.wy, wf.wz, wf.n, wf.corners, wf.uvs, true, null, wf.ao, wf.yOffsets);
        }

        const waterIndexCount = builder.iCount - opaqueIndexCount;

        if (builder.vCount === 0) return;

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(builder.positions.subarray(0, builder.vCount * 3), 3));
        geometry.setAttribute('normal', new THREE.BufferAttribute(builder.normals.subarray(0, builder.vCount * 3), 3));
        geometry.setAttribute('uv', new THREE.BufferAttribute(builder.uvs.subarray(0, builder.vCount * 2), 2));
        geometry.setAttribute('atlasBounds', new THREE.BufferAttribute(builder.atlasBounds.subarray(0, builder.vCount * 4), 4));
        geometry.setAttribute('color', new THREE.BufferAttribute(builder.colors.subarray(0, builder.vCount * 3), 3));
        geometry.setIndex(new THREE.BufferAttribute(builder.indices.subarray(0, builder.iCount), 1));

        if (opaqueIndexCount > 0) {
            geometry.addGroup(0, opaqueIndexCount, 0);
        }
        if (waterIndexCount > 0) {
            geometry.addGroup(opaqueIndexCount, waterIndexCount, 1);
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

    addFacePacked(builder, wx, wy, wz, n, corners, uvs, isWater, uvBounds, ao, yOffsets) {
        builder.ensureCapacity(4, 6);
        const vBase = builder.vCount;
        let pIdx = vBase * 3, uIdx = vBase * 2, bIdx = vBase * 4;

        let sideDim = 1.0;
        if (n[0] !== 0) sideDim = 0.8;
        else if (n[2] !== 0) sideDim = 0.7;
        else if (n[1] < 0) sideDim = 0.5;

        const u0 = uvBounds ? uvBounds.u0 : 0;
        const v0 = uvBounds ? uvBounds.v0 : 0;
        const u1 = uvBounds ? uvBounds.u1 : 1;
        const v1 = uvBounds ? uvBounds.v1 : 1;

        for (let i = 0; i < 4; i++) {
            builder.positions[pIdx] = corners[i][0] + wx;
            builder.positions[pIdx + 1] = corners[i][1] - (yOffsets ? yOffsets[i] : 0) + wy;
            builder.positions[pIdx + 2] = corners[i][2] + wz;

            builder.normals[pIdx] = n[0];
            builder.normals[pIdx + 1] = n[1];
            builder.normals[pIdx + 2] = n[2];

            const l = ao[i] * sideDim;
            builder.colors[pIdx] = l;
            builder.colors[pIdx + 1] = l;
            builder.colors[pIdx + 2] = l;

            builder.uvs[uIdx] = uvs[i * 2];
            builder.uvs[uIdx + 1] = uvs[i * 2 + 1];

            builder.atlasBounds[bIdx] = u0;
            builder.atlasBounds[bIdx + 1] = v0;
            builder.atlasBounds[bIdx + 2] = u1;
            builder.atlasBounds[bIdx + 3] = v1;

            pIdx += 3;
            uIdx += 2;
            bIdx += 4;
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

    addPlantMesh(builder, wx, wy, wz, uvBounds) {
        builder.ensureCapacity(8, 12);
        const vBase = builder.vCount;
        let pIdx = vBase * 3, uIdx = vBase * 2, bIdx = vBase * 4;

        const d1 = [
            [wx, wy, wz], [wx + 1, wy, wz + 1],
            [wx, wy + 1, wz], [wx + 1, wy + 1, wz + 1]
        ];
        const d2 = [
            [wx, wy, wz + 1], [wx + 1, wy, wz],
            [wx, wy + 1, wz + 1], [wx + 1, wy + 1, wz]
        ];

        const plantVerts = [...d1, ...d2];
        const plantUVs = [0, 0, 1, 0, 0, 1, 1, 1, 0, 0, 1, 0, 0, 1, 1, 1];

        const u0 = uvBounds ? uvBounds.u0 : 0;
        const v0 = uvBounds ? uvBounds.v0 : 0;
        const u1 = uvBounds ? uvBounds.u1 : 1;
        const v1 = uvBounds ? uvBounds.v1 : 1;

        for (let i = 0; i < 8; i++) {
            builder.positions[pIdx] = plantVerts[i][0];
            builder.positions[pIdx + 1] = plantVerts[i][1];
            builder.positions[pIdx + 2] = plantVerts[i][2];

            builder.normals[pIdx] = 0;
            builder.normals[pIdx + 1] = 1;
            builder.normals[pIdx + 2] = 0;

            builder.colors[pIdx] = 0.95;
            builder.colors[pIdx + 1] = 0.95;
            builder.colors[pIdx + 2] = 0.95;

            builder.uvs[uIdx] = plantUVs[i * 2];
            builder.uvs[uIdx + 1] = plantUVs[i * 2 + 1];

            builder.atlasBounds[bIdx] = u0;
            builder.atlasBounds[bIdx + 1] = v0;
            builder.atlasBounds[bIdx + 2] = u1;
            builder.atlasBounds[bIdx + 3] = v1;

            pIdx += 3;
            uIdx += 2;
            bIdx += 4;
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
        return 1.0 - (s1 + s2 + c) * 0.2;
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
        this.terrainNoise = new SimplexNoise(this.seed);
        this.caveNoise = new SimplexNoise(this.seed + 1337);
        this.textureGenerator = new TextureGenerator();
        this.atlas = null;
        this.atlasTexture = null;
        this.materials = [];
        this.waterTexture = null;

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
        this.atlasTexture = this.atlas.buildTexture();

        // 1. Непрозрачные блоки, листва, стекла и растительность
        const opaqueMaterial = new THREE.MeshLambertMaterial({
            map: this.atlasTexture,
            transparent: false,
            alphaTest: 0.15,
            vertexColors: true,
            side: THREE.DoubleSide,
            depthWrite: true
        });

        opaqueMaterial.onBeforeCompile = (shader) => {
            shader.vertexShader = `
                attribute vec4 atlasBounds;
                varying vec4 vAtlasBounds;
                varying vec2 vCustomUv;
                ${shader.vertexShader}
            `.replace(
                `#include <uv_vertex>`,
                `
                #include <uv_vertex>
                vCustomUv = uv;
                vAtlasBounds = atlasBounds;
                `
            );

            shader.fragmentShader = `
                varying vec4 vAtlasBounds;
                varying vec2 vCustomUv;
                ${shader.fragmentShader}
            `.replace(
                `#include <map_fragment>`,
                `
                #ifdef USE_MAP
                    vec2 atlasUv = fract(vCustomUv) * (vAtlasBounds.zw - vAtlasBounds.xy) + vAtlasBounds.xy;
                    vec4 sampledColor = texture2D( map, atlasUv );
                    diffuseColor *= sampledColor;
                #endif
                `
            );
        };

        // 2. Полупрозрачная вода
        this.waterTexture = this.textureGenerator.generate('water');
        this.waterTexture.wrapS = THREE.RepeatWrapping;
        this.waterTexture.wrapT = THREE.RepeatWrapping;

        const waterMaterial = new THREE.MeshLambertMaterial({
            map: this.waterTexture,
            transparent: true,
            opacity: 0.75,
            side: THREE.DoubleSide,
            vertexColors: true,
            depthWrite: false
        });

        this.materials = [opaqueMaterial, waterMaterial];
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

    getTerrainHeightAt(wx, wz) {
        const base = (this.terrainNoise.noise3D(wx * 0.003, 0, wz * 0.003) + 1.0) * 0.5;
        const hills = (this.terrainNoise.noise3D(wx * 0.012, 10, wz * 0.012) + 1.0) * 0.5;
        const detail = (this.terrainNoise.noise3D(wx * 0.035, 20, wz * 0.035) + 1.0) * 0.5;

        let height = 54 + (base * 24) + (hills * 14) + (detail * 4);
        if (base > 0.65) {
            const mountain = Math.pow((base - 0.65) / 0.35, 2) * 35;
            height += mountain;
        }
        return Math.floor(height);
    }

    isSolid(x, y, z) {
        const v = this.getVoxel(x, y, z);
        return v !== BLOCK.AIR && BLOCK.get(v).isSolid;
    }

    isWater(x, y, z) {
        const v = this.getVoxel(x, y, z);
        return v === BLOCK.WATER;
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

    generateChunkData(cx, cz) {
        const k = this.getChunkKey(cx, cz);
        if (this.chunks[k] && this.chunks[k].isGenerated) return this.chunks[k];

        const c = this.chunks[k] || new Chunk(cx, cz);
        this.chunks[k] = c;

        const SEA_LEVEL = 60;

        for (let x = 0; x < CHUNK_SIZE; x++) {
            for (let z = 0; z < CHUNK_SIZE; z++) {
                const wx = cx * CHUNK_SIZE + x;
                const wz = cz * CHUNK_SIZE + z;
                const h = this.getTerrainHeightAt(wx, wz);
                const isBeach = (h >= SEA_LEVEL - 2 && h <= SEA_LEVEL + 1);

                for (let y = 0; y < WORLD_HEIGHT; y++) {
                    if (y === 0) {
                        c.setVoxel(x, y, z, BLOCK.BEDROCK);
                    } else if (y <= h) {
                        const cave = (this.caveNoise.noise3D(wx * 0.03, y * 0.045, wz * 0.03) + 1) / 2;
                        if (y > 2 && y < h - 4 && cave > 0.62) {
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

                // Деревья
                if (c.getVoxel(x, h, z) === BLOCK.GRASS && h > SEA_LEVEL && Math.random() > 0.985 && x > 2 && x < 14 && z > 2 && z < 14) {
                    for (let i = 0; i < 5; i++) if (h + 1 + i < WORLD_HEIGHT) c.setVoxel(x, h + 1 + i, z, BLOCK.OAK_LOG);
                    for (let dx = -2; dx <= 2; dx++) {
                        for (let dy = 2; dy <= 5; dy++) {
                            for (let dz = -2; dz <= 2; dz++) {
                                if (h + 1 + dy < WORLD_HEIGHT && (Math.abs(dx) !== 2 || Math.abs(dz) !== 2 || dy < 4)) {
                                    if (c.getVoxel(x + dx, h + 1 + dy, z + dz) === BLOCK.AIR) {
                                        c.setVoxel(x + dx, h + 1 + dy, z + dz, BLOCK.OAK_LEAVES);
                                    }
                                }
                            }
                        }
                    }
                }
                // Растительность
                else if (c.getVoxel(x, h, z) === BLOCK.GRASS && h > SEA_LEVEL && c.getVoxel(x, h + 1, z) === BLOCK.AIR) {
                    const plantRand = Math.random();
                    if (plantRand > 0.88) {
                        c.setVoxel(x, h + 1, z, BLOCK.TALL_GRASS);
                    } else if (plantRand > 0.84 && h + 2 < WORLD_HEIGHT) {
                        c.setVoxel(x, h + 1, z, BLOCK.DOUBLE_TALL_GRASS_BOTTOM);
                        c.setVoxel(x, h + 2, z, BLOCK.DOUBLE_TALL_GRASS_TOP);
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
            if (performance.now() - meshStartTime > 5) break;
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