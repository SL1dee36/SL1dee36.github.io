// game/WeatherSystem.js
// author: Nazaryan A.K.
// github: @Sl1dee36

import * as THREE from 'three';
import { Component } from '../Lumina/js/core/Component.js';
import { BIOME } from './World.js';

export class WeatherSystem extends Component {
    constructor(gameObject, world, settingsManager) {
        super(gameObject);
        this.world = world;
        this.settings = settingsManager;
        this.scene = this.world.scene;

        this.weatherType = 'clear'; // 'clear', 'rain', 'snow'
        this.weatherIntensity = 0.0; // 0.0 to 1.0
        this.timer = 240.0; // 4 minutes until next weather change

        this.particleCount = 1400;
        this.particleBoxSize = 42;

        this.rainGeometry = null;
        this.rainPoints = null;
        this.snowGeometry = null;
        this.snowPoints = null;

        this.initParticles();
    }

    initParticles() {
        const count = this.particleCount;
        const box = this.particleBoxSize;

        // 1. Частицы дождя (быстрые капли)
        const rainPos = new Float32Array(count * 3);
        const rainVel = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            rainPos[i * 3] = (Math.random() - 0.5) * box;
            rainPos[i * 3 + 1] = Math.random() * box;
            rainPos[i * 3 + 2] = (Math.random() - 0.5) * box;
            rainVel[i] = 24.0 + Math.random() * 8.0;
        }

        this.rainGeometry = new THREE.BufferGeometry();
        this.rainGeometry.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
        this.rainVelocities = rainVel;

        const rainMat = new THREE.PointsMaterial({
            color: 0x88bbff,
            size: 1.8,
            transparent: true,
            opacity: 0.65,
            fog: true,
            depthWrite: false
        });
        this.rainPoints = new THREE.Points(this.rainGeometry, rainMat);
        this.rainPoints.visible = false;
        this.scene.add(this.rainPoints);

        // 2. Частицы снега (медленные белые снежинки с колыханием)
        const snowPos = new Float32Array(count * 3);
        const snowVel = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            snowPos[i * 3] = (Math.random() - 0.5) * box;
            snowPos[i * 3 + 1] = Math.random() * box;
            snowPos[i * 3 + 2] = (Math.random() - 0.5) * box;
            snowVel[i] = 3.2 + Math.random() * 2.0;
        }

        this.snowGeometry = new THREE.BufferGeometry();
        this.snowGeometry.setAttribute('position', new THREE.BufferAttribute(snowPos, 3));
        this.snowVelocities = snowVel;

        const snowMat = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 2.8,
            transparent: true,
            opacity: 0.85,
            fog: true,
            depthWrite: false
        });
        this.snowPoints = new THREE.Points(this.snowGeometry, snowMat);
        this.snowPoints.visible = false;
        this.scene.add(this.snowPoints);
    }

    setWeather(type) {
        this.weatherType = type;
        if (type === 'clear') this.timer = 180 + Math.random() * 180;
        else this.timer = 120 + Math.random() * 90;
    }

    update(dt) {
        if (!this.settings || this.settings.get('weather') === false) {
            this.rainPoints.visible = false;
            this.snowPoints.visible = false;
            return;
        }

        // Автоматический цикл погоды
        this.timer -= dt;
        if (this.timer <= 0) {
            if (this.weatherType === 'clear') {
                this.setWeather('rain');
            } else {
                this.setWeather('clear');
            }
        }

        const targetIntensity = (this.weatherType !== 'clear') ? 1.0 : 0.0;
        this.weatherIntensity += (targetIntensity - this.weatherIntensity) * dt * 0.4;

        const player = this.world.playerPos;
        if (!player) return;

        // Определение биома игрока
        const biome = this.world.getBiomeAt(player.x, player.z);
        const isSnowy = (biome === BIOME.MOUNTAINS || player.y >= 95);
        const isDesert = (biome === BIOME.DESERT);

        // Обновляем фактор погоды для DayNightCycle (пасмурное небо)
        const dayNight = this.engine?.gameObjects.find(g => g.name === 'Sky')?.getComponent('DayNightCycle');
        if (dayNight) {
            dayNight.weatherFactor = isDesert ? 0 : this.weatherIntensity;
        }

        const box = this.particleBoxSize;
        const halfBox = box * 0.5;

        if (this.weatherIntensity > 0.05 && !isDesert) {
            if (isSnowy) {
                this.snowPoints.visible = true;
                this.rainPoints.visible = false;
                this.snowPoints.position.set(player.x, player.y, player.z);

                const pos = this.snowGeometry.attributes.position.array;
                const time = performance.now() * 0.0015;
                for (let i = 0; i < this.particleCount; i++) {
                    const idx = i * 3;
                    pos[idx + 1] -= this.snowVelocities[i] * dt;
                    pos[idx] += Math.sin(time + i) * 0.8 * dt;
                    pos[idx + 2] += Math.cos(time + i * 0.7) * 0.8 * dt;

                    if (pos[idx + 1] < -halfBox) {
                        pos[idx + 1] = halfBox;
                        pos[idx] = (Math.random() - 0.5) * box;
                        pos[idx + 2] = (Math.random() - 0.5) * box;
                    }
                }
                this.snowGeometry.attributes.position.needsUpdate = true;
                this.snowPoints.material.opacity = this.weatherIntensity * 0.85;
            } else {
                this.rainPoints.visible = true;
                this.snowPoints.visible = false;
                this.rainPoints.position.set(player.x, player.y, player.z);

                const pos = this.rainGeometry.attributes.position.array;
                for (let i = 0; i < this.particleCount; i++) {
                    const idx = i * 3;
                    pos[idx + 1] -= this.rainVelocities[i] * dt;
                    pos[idx] += 0.5 * dt; // легкий наклон дождя от ветра

                    if (pos[idx + 1] < -halfBox) {
                        pos[idx + 1] = halfBox;
                        pos[idx] = (Math.random() - 0.5) * box;
                        pos[idx + 2] = (Math.random() - 0.5) * box;
                    }
                }
                this.rainGeometry.attributes.position.needsUpdate = true;
                this.rainPoints.material.opacity = this.weatherIntensity * 0.65;
            }
        } else {
            this.rainPoints.visible = false;
            this.snowPoints.visible = false;
        }
    }
}
