// main.js - полная версия с изменениями

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import GUI from 'https://cdn.jsdelivr.net/npm/lil-gui@0.19/+esm';

// --- НАСТРОЙКИ ---
const SETTINGS = {
    pool: {
        width: 10,
        depth: 10,
        height: 10,
        tiling: 1.0
    },
    water: {
        color: '#0051da',
        specular: '#ffffff',
        shininess: 100,
        waveAmplitude: 0.05,
        waveFrequency: 2.0,
        waveSpeed: 0.02
    },
    caustics: {
        enabled: true,
        strength: 0.3
    },
    light: {
        x: 1,
        y: 1,
        z: 1
    }
};

let scene, camera, renderer, controls, clock;
let waterMesh, floorMesh, poolWalls;
let cubeCamera, waterMaterial, floorMaterial;
let simulation;
let gui;

// --- КЛАСС ДЛЯ СИМУЛЯЦИИ НА FBO ---
class WaterSimulation {
    constructor(renderer) {
        this.renderer = renderer;
        this.size = 512;
        this.camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0, 1);
        this.scene = new THREE.Scene();
        
        const options = {
            type: THREE.FloatType, 
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat,
            stencilBuffer: false
        };
        this.target1 = new THREE.WebGLRenderTarget(this.size, this.size, options);
        this.target2 = new THREE.WebGLRenderTarget(this.size, this.size, options);
        this.target = this.target1;
        
        this.quad = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
        this.scene.add(this.quad);

        fetch('./shaders/simulationFragment.glsl')
            .then(res => res.text())
            .then(shader => {
                this.material = new THREE.ShaderMaterial({
                    uniforms: {
                        uPreviousTexture: { value: null },
                        uDelta: { value: new THREE.Vector2(1 / this.size, 1 / this.size) },
                        uDrop: { value: new THREE.Vector4(0, 0, 0, 0) } 
                    },
                    fragmentShader: shader
                });
                this.quad.material = this.material;
            });
    }

    addDrop(uv, radius, strength) {
        if (this.material) {
            this.material.uniforms.uDrop.value.set(uv.x, uv.y, radius, strength);
        }
    }

    update() {
        if (!this.material) return;
        this.material.uniforms.uPreviousTexture.value = this.target.texture;
        const oldTarget = this.target;
        const newTarget = this.target === this.target1 ? this.target2 : this.target1;
        this.renderer.setRenderTarget(newTarget);
        this.renderer.render(this.scene, this.camera);
        this.renderer.setRenderTarget(null);
        this.target = newTarget;
        this.material.uniforms.uDrop.value.w = 0.0;
    }
}

// --- ИНИЦИАЛИЗАЦИЯ ---
init();
animate();

function init() {
    scene = new THREE.Scene();
    clock = new THREE.Clock();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // *** ИЗМЕНЕНИЕ: Настраиваем кнопки мыши для OrbitControls ***
    // Правая кнопка - вращение, левая - ничего (она для ряби), средняя - масштабирование
    controls.mouseButtons = {
        LEFT: null,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.ROTATE
    };

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(SETTINGS.light.x, SETTINGS.light.y, SETTINGS.light.z).normalize();
    scene.add(directionalLight);

    const loader = new THREE.CubeTextureLoader();
    loader.setPath('textures/skybox/');
    // const skyboxTexture = loader.load(['px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png']);
    const skyboxTexture = loader.load(['image.jpg', 'image.jpg', 'image.jpg', 'image.jpg', 'image.jpg', 'image.jpg']);
    
    scene.background = skyboxTexture;

    const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(512);
    cubeCamera = new THREE.CubeCamera(1, 1000, cubeRenderTarget);
    scene.add(cubeCamera);

    simulation = new WaterSimulation(renderer);
    createPool();
    createWater();
    
    Promise.all([
        fetch('./shaders/waterVertex.glsl').then(res => res.text()),
        fetch('./shaders/waterFragment.glsl').then(res => res.text()),
        fetch('./shaders/floorVertex.glsl').then(res => res.text()),
        fetch('./shaders/floorFragment.glsl').then(res => res.text()),
        new THREE.TextureLoader().loadAsync('./textures/water_caustic.jpg'),
        new THREE.TextureLoader().loadAsync('./textures/wall.jpg')
    ]).then(([waterVertex, waterFragment, floorVertex, floorFragment, causticsTexture, tileTexture]) => {
        causticsTexture.wrapS = causticsTexture.wrapT = THREE.RepeatWrapping;
        tileTexture.wrapS = tileTexture.wrapT = THREE.RepeatWrapping;

        waterMaterial = new THREE.ShaderMaterial({
            vertexShader: waterVertex,
            fragmentShader: waterFragment,
            uniforms: {
                uTime: { value: 0 },
                uWaterColor: { value: new THREE.Color(SETTINGS.water.color) },
                uSpecularColor: { value: new THREE.Color(SETTINGS.water.specular) },
                uShininess: { value: SETTINGS.water.shininess },
                uWaveAmplitude: { value: SETTINGS.water.waveAmplitude },
                uWaveFrequency: { value: new THREE.Vector2(SETTINGS.water.waveFrequency, SETTINGS.water.waveFrequency) },
                uWaveSpeed: { value: SETTINGS.water.waveSpeed },
                uLightDirection: { value: directionalLight.position },
                uSkybox: { value: cubeRenderTarget.texture },
                uRippleTexture: { value: simulation.target.texture }
            },
            transparent: true
        });
        waterMesh.material = waterMaterial;

        floorMaterial = new THREE.ShaderMaterial({
            vertexShader: floorVertex,
            fragmentShader: floorFragment,
            uniforms: {
                uCausticsEnabled: { value: SETTINGS.caustics.enabled },
                uCausticsStrength: { value: SETTINGS.caustics.strength },
                uCausticsTexture: { value: causticsTexture },
                uRippleTexture: { value: simulation.target.texture },
                uPoolSize: { value: new THREE.Vector2(SETTINGS.pool.width, SETTINGS.pool.depth) },
                uLightDirection: { value: directionalLight.position },
                uTime: { value: 0 },
                uTileTexture: { value: tileTexture },
                uTiling: { value: SETTINGS.pool.tiling }
            }
        });
        floorMesh.material = floorMaterial;
        poolWalls.forEach(wall => wall.material = floorMaterial);

    }).catch(console.error);
    
    setupMouseInteraction();
    setupGUI(directionalLight);
    window.addEventListener('resize', onWindowResize);
}

function createPool() {
    const { width, depth, height } = SETTINGS.pool;
    const wallThickness = 0.2;

    if (floorMesh) scene.remove(floorMesh);
    const floorGeometry = new THREE.PlaneGeometry(width, depth, 100, 100);
    floorMesh = new THREE.Mesh(floorGeometry, new THREE.MeshStandardMaterial({color: 0x888888}));
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = -height;
    scene.add(floorMesh);
    
    if (poolWalls) poolWalls.forEach(wall => scene.remove(wall));
    poolWalls = [];
    const wallGeometries = [
        new THREE.BoxGeometry(width + wallThickness * 2, height, wallThickness),
        new THREE.BoxGeometry(width + wallThickness * 2, height, wallThickness),
        new THREE.BoxGeometry(wallThickness, height, depth),
        new THREE.BoxGeometry(wallThickness, height, depth)
    ];
    const wallPositions = [
        new THREE.Vector3(0, -height / 2, -depth / 2 - wallThickness / 2),
        new THREE.Vector3(0, -height / 2, depth / 2 + wallThickness / 2),
        new THREE.Vector3(-width / 2 - wallThickness / 2, -height / 2, 0),
        new THREE.Vector3(width / 2 + wallThickness / 2, -height / 2, 0)
    ];
    wallGeometries.forEach((geom, i) => {
        const uvs = geom.attributes.uv;
        if (i < 2) {
             uvs.setXY(4, 0, height/width * SETTINGS.pool.tiling); uvs.setXY(5, SETTINGS.pool.tiling, height/width * SETTINGS.pool.tiling);
             uvs.setXY(6, 0, 0); uvs.setXY(7, SETTINGS.pool.tiling, 0);
        } else {
             uvs.setXY(0, 0, height/depth * SETTINGS.pool.tiling); uvs.setXY(1, SETTINGS.pool.tiling, height/depth * SETTINGS.pool.tiling);
             uvs.setXY(2, 0, 0); uvs.setXY(3, SETTINGS.pool.tiling, 0);
        }

        const wall = new THREE.Mesh(geom, new THREE.MeshStandardMaterial({color: 0x888888}));
        wall.position.copy(wallPositions[i]);
        scene.add(wall);
        poolWalls.push(wall);
    });
}

function createWater() {
    if (waterMesh) scene.remove(waterMesh);
    const { width, depth } = SETTINGS.pool;
    const waterGeometry = new THREE.PlaneGeometry(width, depth, 256, 256);
    waterMesh = new THREE.Mesh(waterGeometry, new THREE.MeshBasicMaterial({ color: 0x0000ff, wireframe: true }));
    waterMesh.rotation.x = -Math.PI / 2;
    scene.add(waterMesh);
}

function setupMouseInteraction() {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let isMouseDown = false;
    
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersectPoint = new THREE.Vector3();

    const onPointerMove = (event) => {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        if (isMouseDown && simulation) {
            raycaster.setFromCamera(mouse, camera);
            raycaster.ray.intersectPlane(plane, intersectPoint);
            const uv = new THREE.Vector2(
                (intersectPoint.x + SETTINGS.pool.width / 2) / SETTINGS.pool.width,
                1.0 - ((intersectPoint.z + SETTINGS.pool.depth / 2) / SETTINGS.pool.depth)
            );
            if (uv.x >= 0 && uv.x <= 1 && uv.y >= 0 && uv.y <= 1) {
                simulation.addDrop(uv, 0.03, 0.1);
            }
        }
    };
    
    const onPointerDown = (event) => {
        // *** ИЗМЕНЕНИЕ: Мы проверяем только левую кнопку мыши (button === 0) для создания ряби ***
        if (event.button === 0) {
            isMouseDown = true;
            // controls.enabled = false; // <-- Больше не нужно, т.к. ЛКМ не управляет камерой
            onPointerMove(event);
        }
    };

    const onPointerUp = (event) => { // *** ИЗМЕНЕНИЕ: Принимаем event, чтобы проверить кнопку ***
        // *** ИЗМЕНЕНИЕ: Прекращаем "рисование" только если была отпущена левая кнопка ***
        if (event.button === 0) {
            isMouseDown = false;
        }
        // controls.enabled = true; // <-- Больше не нужно
    };
    
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);
    // *** ИЗМЕНЕНИЕ: Отключаем контекстное меню по правому клику, чтобы оно не мешало вращению камеры ***
    window.addEventListener('contextmenu', (event) => event.preventDefault());
}

function setupGUI(light) {
    gui = new GUI();
    const waterFolder = gui.addFolder('Water');
    waterFolder.addColor(SETTINGS.water, 'color').name('Color').onChange(val => {
        if(waterMaterial) waterMaterial.uniforms.uWaterColor.value.set(val);
    });
    waterFolder.add(SETTINGS.water, 'shininess', 1, 200).name('Shininess').onChange(val => {
        if(waterMaterial) waterMaterial.uniforms.uShininess.value = val;
    });
    waterFolder.add(SETTINGS.water, 'waveAmplitude', 0, 0.5).name('Wave Amplitude').onChange(val => {
        if(waterMaterial) waterMaterial.uniforms.uWaveAmplitude.value = val;
    });
    waterFolder.add(SETTINGS.water, 'waveFrequency', 0, 10).name('Wave Frequency').onChange(val => {
        if(waterMaterial) waterMaterial.uniforms.uWaveFrequency.value.set(val, val);
    });

    const causticsFolder = gui.addFolder('Caustics');
    causticsFolder.add(SETTINGS.caustics, 'enabled').name('Enabled').onChange(val => {
        if(floorMaterial) floorMaterial.uniforms.uCausticsEnabled.value = val;
    });
    causticsFolder.add(SETTINGS.caustics, 'strength', 0, 2).name('Strength').onChange(val => {
        if(floorMaterial) floorMaterial.uniforms.uCausticsStrength.value = val;
    });

    const lightFolder = gui.addFolder('Light');
    lightFolder.add(SETTINGS.light, 'x', -5, 5).name('X').onChange(val => light.position.x = val);
    lightFolder.add(SETTINGS.light, 'y', 0.1, 5).name('Y').onChange(val => light.position.y = val);
    lightFolder.add(SETTINGS.light, 'z', -5, 5).name('Z').onChange(val => light.position.z = val);
    
    const poolFolder = gui.addFolder('Pool');
    poolFolder.add(SETTINGS.pool, 'width', 1, 50, 1).name('Width').onFinishChange(rebuildScene);
    poolFolder.add(SETTINGS.pool, 'depth', 1, 50, 1).name('Depth').onFinishChange(rebuildScene);
    poolFolder.add(SETTINGS.pool, 'height', 1, 10, 0.5).name('Height').onFinishChange(rebuildScene);
    poolFolder.add(SETTINGS.pool, 'tiling', 1, 50, 1).name('Tiling').onChange(val => {
        if(floorMaterial) floorMaterial.uniforms.uTiling.value = val;
    });
}

function rebuildScene() {
    createPool();
    createWater();
    if(waterMaterial) waterMesh.material = waterMaterial;
    if(floorMaterial) {
        floorMesh.material = floorMaterial;
        poolWalls.forEach(wall => wall.material = floorMaterial);
        floorMaterial.uniforms.uPoolSize.value.set(SETTINGS.pool.width, SETTINGS.pool.depth);
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    const elapsedTime = clock.getElapsedTime();
    controls.update();
    if (simulation) {
        simulation.update();
    }
    if (waterMesh && waterMaterial) {
        waterMesh.visible = false;
        cubeCamera.position.copy(camera.position);
        cubeCamera.update(renderer, scene);
        waterMesh.visible = true;
        waterMaterial.uniforms.uTime.value = elapsedTime;
        waterMaterial.uniforms.uRippleTexture.value = simulation.target.texture;
    }
    if (floorMaterial) {
        floorMaterial.uniforms.uTime.value = elapsedTime;
        floorMaterial.uniforms.uRippleTexture.value = simulation.target.texture;
    }
    renderer.render(scene, camera);
}