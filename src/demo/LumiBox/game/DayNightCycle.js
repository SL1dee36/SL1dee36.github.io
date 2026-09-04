// game/DayNightCycle.js
// author: Nazaryan A.K.
// github: @Sl1dee36

import { Component } from '../Lumina/js/core/Component.js';
import * as THREE from 'three';

export class DayNightCycle extends Component {
    constructor(gameObject, settingsManager) {
        super(gameObject);
        this.settings = settingsManager;
        this.dayDuration = 600;
        this.time = this.dayDuration * 0.25;
        this.skyPivot = new THREE.Group();
        this.cloudGroup = new THREE.Group();
        this.dayColor = new THREE.Color(0x78a7ff);
        this.nightColor = new THREE.Color(0x090b18);
        this.sunsetColor = new THREE.Color(0xe86834);
        this.sunriseColor = new THREE.Color(0xf2884b);
        this.twilightColor = new THREE.Color(0x351d45);
        this.currentSkyColor = new THREE.Color();
    }

    start() {
        const sc = this.engine.renderer.scene;
        this.player = this.engine.player;

        this.sunLight = new THREE.DirectionalLight(0xfffaed, 1.2);
        this.sunLight.position.set(0, 100, 0);
        this.sunLight.shadow.camera.near = 0.5;
        this.sunLight.shadow.camera.far = 200;
        this.sunLight.shadow.bias = -0.0005;
        this.updateShadowFrustum();
        sc.add(this.sunLight);

        this.ambientLight = new THREE.AmbientLight(0xb0b8c8, 0.4);
        sc.add(this.ambientLight);

        this.fog = new THREE.Fog(0x78a7ff, 10, 100);
        sc.fog = this.fog;

        this.skyPivot.renderOrder = -1;
        sc.add(this.skyPivot);

        this.createCelestialBodies();
        this.createStars();
        sc.add(this.cloudGroup);
        this.generateClouds();
    }

    updateShadowFrustum() {
        const d = this.settings.get('shadowDistance');
        this.sunLight.shadow.camera.left = -d;
        this.sunLight.shadow.camera.right = d;
        this.sunLight.shadow.camera.top = d;
        this.sunLight.shadow.camera.bottom = -d;
        this.sunLight.shadow.camera.updateProjectionMatrix();
    }

    createCelestialBodies() {
        const dist = 400;

        // Аутентичное квадратное пиксельное солнце
        const sT = this.createTexture(64, (c, w) => {
            c.fillStyle = '#FFAA00'; c.fillRect(0, 0, w, w);
            c.fillStyle = '#FFD700'; c.fillRect(4, 4, w - 8, w - 8);
            c.fillStyle = '#FFFDE0'; c.fillRect(12, 12, w - 24, w - 24);
            c.fillStyle = '#FFFFFF'; c.fillRect(20, 20, w - 40, w - 40);
        });
        this.sunMesh = new THREE.Mesh(new THREE.BoxGeometry(64, 64, 1), new THREE.MeshBasicMaterial({ map: sT, transparent: true, fog: false, depthWrite: false }));
        this.sunMesh.position.set(0, dist, 0);
        this.sunMesh.lookAt(0, 0, 0);
        this.skyPivot.add(this.sunMesh);

        // Аутентичная квадратная пиксельная луна с кратерами
        const mT = this.createTexture(64, (c, w) => {
            c.fillStyle = '#C8CCD4'; c.fillRect(0, 0, w, w);
            c.fillStyle = '#E8ECF5'; c.fillRect(4, 4, w - 8, w - 8);
            c.fillStyle = '#8E94A0';
            // Кратеры
            c.fillRect(10, 10, 12, 12);
            c.fillRect(36, 12, 16, 16);
            c.fillRect(14, 38, 14, 14);
            c.fillRect(38, 40, 10, 10);
            c.fillStyle = '#6E7480';
            c.fillRect(14, 14, 6, 6);
            c.fillRect(40, 16, 8, 8);
            c.fillRect(18, 42, 6, 6);
        });
        this.moonMesh = new THREE.Mesh(new THREE.BoxGeometry(48, 48, 1), new THREE.MeshBasicMaterial({ map: mT, transparent: true, fog: false, depthWrite: false }));
        this.moonMesh.position.set(0, -dist, 0);
        this.moonMesh.lookAt(0, 0, 0);
        this.skyPivot.add(this.moonMesh);
    }

    createStars() {
        const p = [];
        for (let i = 0; i < 1800; i++) {
            const r = 380, t = Math.random() * Math.PI * 2, h = Math.acos(2 * Math.random() - 1);
            p.push(r * Math.sin(h) * Math.cos(t), r * Math.sin(h) * Math.sin(t), r * Math.cos(h));
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
        this.starSystem = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 2.2, transparent: true, fog: false }));
        this.skyPivot.add(this.starSystem);
    }

    generateClouds() {
        const g = new THREE.BoxGeometry(32, 8, 32), m = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7, fog: true });
        for (let i = 0; i < 64; i++) {
            const c = new THREE.Mesh(g, m);
            c.position.set((Math.random() - 0.5) * 800, 195 + (Math.random() * 12), (Math.random() - 0.5) * 800);
            c.scale.set(1 + Math.random() * 1.5, 1, 1 + Math.random() * 1.5);
            this.cloudGroup.add(c);
        }
    }

    createTexture(s, f) {
        const c = document.createElement('canvas');
        c.width = c.height = s;
        f(c.getContext('2d'), s);
        const t = new THREE.CanvasTexture(c);
        t.magFilter = THREE.NearestFilter;
        return t;
    }

    update(dt) {
        const shadowMapSize = this.settings.get('shadowMapSize');
        if (shadowMapSize === 0) {
            if (this.sunLight.castShadow) this.sunLight.castShadow = false;
        } else {
            if (!this.sunLight.castShadow) this.sunLight.castShadow = true;
            if (this.sunLight.shadow.mapSize.width !== shadowMapSize) {
                this.sunLight.shadow.mapSize.width = shadowMapSize;
                this.sunLight.shadow.mapSize.height = shadowMapSize;
                this.sunLight.shadow.map?.dispose();
                this.sunLight.shadow.map = null;
            }
        }

        const shadowDist = this.settings.get('shadowDistance');
        if (Math.abs(this.sunLight.shadow.camera.right - shadowDist) > 1) {
            this.updateShadowFrustum();
        }

        this.cloudGroup.visible = this.settings.get('showClouds');
        this.starSystem.visible = this.settings.get('showStars');
        this.sunMesh.visible = this.settings.get('showSunMoon');
        this.moonMesh.visible = this.settings.get('showSunMoon');

        const sm = this.settings.get('timeSpeed');
        this.time = (this.time + dt * sm) % this.dayDuration;
        const dayProgress = this.time / this.dayDuration;
        const ang = (dayProgress - 0.25) * Math.PI * 2;

        // 3D наклонение и смещение по другой оси (реалистичная дуга)
        const tiltX = Math.PI * 0.16; // наклон в ~29 градусов
        const driftY = Math.sin(ang * 0.5) * 0.22; // прецессия траектории

        this.skyPivot.rotation.x = tiltX;
        this.skyPivot.rotation.y = driftY;
        this.skyPivot.rotation.z = ang;

        const sunHeight = Math.sin(ang + Math.PI / 2) * Math.cos(tiltX);
        const isSunUp = sunHeight > -0.05;

        if (this.engine?.physicsEngine?.world) {
            this.engine.physicsEngine.world.sunBrightness = isSunUp ? Math.min(1.0, Math.max(0.08, sunHeight)) : 0.08;
        }

        // Переключение источника направленного света: солнце днем, луна ночью
        if (isSunUp) {
            const dayFactor = Math.max(0, sunHeight);
            this.sunLight.intensity = dayFactor * 1.1 + 0.1;
            this.ambientLight.intensity = dayFactor * 0.4 + 0.12;

            if (sunHeight < 0.25) {
                // Золотой свет заката / восхода
                this.sunLight.color.setRGB(1.0, 0.7 + sunHeight, 0.4 + sunHeight * 2);
            } else {
                this.sunLight.color.setRGB(1.0, 0.98, 0.92);
            }
        } else {
            // Лунный свет
            const moonHeight = -sunHeight;
            this.sunLight.intensity = Math.max(0.08, moonHeight * 0.25);
            this.sunLight.color.setRGB(0.55, 0.65, 0.85);
            this.ambientLight.intensity = 0.08;
            this.ambientLight.color.setRGB(0.12, 0.15, 0.25);
        }

        if (this.starSystem) {
            let o = 0;
            if (sunHeight < 0.2) {
                o = 1 - (sunHeight + 0.2) * 2.5;
                if (o > 1) o = 1;
            }
            this.starSystem.material.opacity = Math.max(0, o);
        }

        // Плавный расчет цвета неба и тумана
        if (sunHeight > 0.25) {
            this.currentSkyColor.copy(this.dayColor);
        } else if (sunHeight > -0.15) {
            const t = (sunHeight + 0.15) / 0.4;
            if (sunHeight > 0.05) {
                this.currentSkyColor.copy(this.sunsetColor).lerp(this.dayColor, t);
            } else {
                this.currentSkyColor.copy(this.twilightColor).lerp(this.sunsetColor, t * 1.5);
            }
        } else {
            const tNight = Math.min(1.0, (-sunHeight - 0.15) / 0.25);
            this.currentSkyColor.copy(this.twilightColor).lerp(this.nightColor, tNight);
        }

        // Пасмурность при дожде / снегопаде
        if (this.weatherFactor && this.weatherFactor > 0) {
            const overcast = new THREE.Color(0x5a6575);
            this.currentSkyColor.lerp(overcast, this.weatherFactor * 0.85);
            this.sunLight.intensity *= (1.0 - this.weatherFactor * 0.45);
            this.ambientLight.intensity = Math.max(0.06, this.ambientLight.intensity * (1.0 - this.weatherFactor * 0.35));
        }

        this.engine.renderer.scene.background = this.currentSkyColor;
        this.fog.color = this.currentSkyColor;

        const rdChunks = this.settings.get('renderDistance');
        const maxDist = rdChunks * 32;
        const fogFactor = this.settings.get('fogFactor');

        if (fogFactor <= 0.05) {
            this.fog.near = 5000;
            this.fog.far = 10000;
        } else {
            const fogEnd = maxDist * fogFactor;
            const fogStart = fogEnd * 0.6;
            const nightLimit = isSunUp ? 1.0 : 0.6;
            this.fog.near = fogStart * nightLimit;
            this.fog.far = fogEnd * nightLimit;
        }

        if (this.player) {
            const p = this.player.transform.position;
            this.skyPivot.position.set(p.x, p.y, p.z);

            // Направленный свет следует за солнцем днем и за луной ночью с учетом 3D дуги
            const activeAngle = isSunUp ? (ang + Math.PI / 2) : (ang + Math.PI / 2 + Math.PI);
            this.sunLight.position.set(
                p.x + Math.cos(activeAngle) * 110,
                p.y + Math.abs(Math.sin(activeAngle)) * 100 * Math.cos(tiltX) + 12,
                p.z + Math.sin(activeAngle) * Math.sin(tiltX) * 70 + Math.sin(driftY) * 50
            );
            this.sunLight.target.position.copy(p);
            this.sunLight.target.updateMatrixWorld();

            this.cloudGroup.position.x += dt * 2.2;
            if (Math.abs(this.cloudGroup.position.x - p.x) > 400) this.cloudGroup.position.x = p.x;
            if (Math.abs(this.cloudGroup.position.z - p.z) > 400) this.cloudGroup.position.z = p.z;
        }
    }
}