import * as THREE from 'three';

const vertexShader = `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const fragmentShader = `
varying vec2 vUv;
uniform vec2 u_offset;
uniform float u_seed;

// Pseudo-random
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

// Value Noise
float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// Fractal Brownian Motion
float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100.0);
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
    for (int i = 0; i < 4; ++i) { // 4 октавы
        v += a * noise(p + u_seed); // Добавляем seed
        p = rot * p * 2.0 + shift;
        a *= 0.5;
    }
    return v;
}

void main() {
    // 16.0 = CHUNK_SIZE
    vec2 worldPos = u_offset + vUv * 16.0; 
    
    // Масштаб шума 
    float scale = 0.010; 
    
    // Генерируем высоту
    float h = fbm(worldPos * scale);
    
    // Делаем ландшафт более "гористым"
    h = pow(h, 1.2); 

    gl_FragColor = vec4(h, 0.0, 0.0, 1.0);
}
`;

// Update to match World.js
const CHUNK_SIZE = 16; 

export class GPUWorldGenerator {
    constructor(renderer, seed) {
        this.renderer = renderer;
        this.seed = seed;
        this.width = CHUNK_SIZE;
        this.height = CHUNK_SIZE;

        this.renderTarget = new THREE.WebGLRenderTarget(this.width, this.height, {
            format: THREE.RedFormat, 
            type: THREE.FloatType,
            minFilter: THREE.NearestFilter,
            magFilter: THREE.NearestFilter,
        });

        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0, 1);

        this.material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                u_offset: { value: new THREE.Vector2() },
                u_seed: { value: this.seed }
            }
        });

        const geometry = new THREE.PlaneGeometry(1, 1);
        const plane = new THREE.Mesh(geometry, this.material);
        this.scene.add(plane);
    }

    generateHeightMap(chunkX, chunkZ) {
        this.material.uniforms.u_offset.value.set(chunkX * CHUNK_SIZE, chunkZ * CHUNK_SIZE);
        
        const oldRenderTarget = this.renderer.getRenderTarget();
        this.renderer.setRenderTarget(this.renderTarget);
        this.renderer.render(this.scene, this.camera);
        
        const buffer = new Float32Array(this.width * this.height);
        this.renderer.readRenderTargetPixels(this.renderTarget, 0, 0, this.width, this.height, buffer);
        this.renderer.setRenderTarget(oldRenderTarget);

        return buffer;
    }
    
    dispose() {
        this.renderTarget.dispose();
        this.material.dispose();
    }
}