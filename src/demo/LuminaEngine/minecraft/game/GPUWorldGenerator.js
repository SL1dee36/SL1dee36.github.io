import * as THREE from 'three';

// --- ИЗМЕНЕНИЕ: Удаляем импорты файлов .glsl ---
// import vertexShader from '../Lumina/js/shaders/worldGenVertex.glsl';
// import fragmentShader from '../Lumina/js/shaders/worldGenFragment.glsl';

// --- ИЗМЕНЕНИЕ: Вставляем код шейдеров прямо сюда в виде строк ---

const vertexShader = `
varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
varying vec2 vUv;

uniform vec2 u_offset; // Смещение в мировых координатах
uniform float u_seed;
uniform float u_scale; // Масштаб шума

// 2D Random
float random (vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123 * (u_seed + 1.0));
}

// 2D Noise based on Morgan McGuire @morgan3d
// https://www.shadertoy.com/view/4dS3Wd
float noise (vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    // Four corners in 2D of a tile
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) +
            (c - a)* u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
}


void main() {
    // Рассчитываем мировые координаты для этого "пикселя"
    vec2 worldPos = u_offset + vUv * u_scale;

    // Вычисляем высоту ландшафта
    // Для простоты здесь используется только одна октава шума
    float height = noise(worldPos / 50.0); // Делим, чтобы сделать ландшафт более плавным

    // Преобразуем высоту в диапазон [0, 1] и записываем в красный канал цвета
    // Мы можем использовать другие каналы (g, b, a) для других данных, например, биома
    gl_FragColor = vec4(height, 0.0, 0.0, 1.0);
}
`;


// Код ниже остается без изменений
const CHUNK_SIZE = 8; // Должно совпадать с World.js

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
            vertexShader, // Теперь это просто переменная со строкой
            fragmentShader, // И это тоже
            uniforms: {
                u_offset: { value: new THREE.Vector2() },
                u_seed: { value: this.seed },
                u_scale: { value: CHUNK_SIZE },
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
        this.scene.children.forEach(child => {
            if (child.geometry) child.geometry.dispose();
        });
    }
}