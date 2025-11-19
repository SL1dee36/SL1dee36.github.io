// game/DayNightCycle.js
import { Component } from '../Lumina/js/core/Component.js';
import * as THREE from 'three';

export class DayNightCycle extends Component {
    constructor(gameObject, settingsManager) {
        super(gameObject);
        this.settings = settingsManager;
        this.dayDuration = 600; // Base duration
        this.time = this.dayDuration * 0.25;
        this.sun = null;
        this.ambient = null;
        this.fog = null;
    }

    start() {
        const scene = this.engine.renderer.scene;
        this.sun = new THREE.DirectionalLight(0xffffff, 1);
        this.sun.position.set(0, 1, 0);
        this.sun.castShadow = true; // Если тени включены в движке
        scene.add(this.sun);

        this.ambient = new THREE.AmbientLight(0xcccccc, 0.2);
        scene.add(this.ambient);

        this.fog = new THREE.Fog(0x87ceeb, 0, 128);
        scene.fog = this.fog;
    }

    update(deltaTime) {
        // Учитываем множитель времени
        const speedMult = this.settings ? this.settings.get('timeSpeed') : 1.0;
        
        this.time = (this.time + deltaTime * speedMult) % this.dayDuration;
        const angle = (this.time / this.dayDuration) * 2 * Math.PI;

        const sunY = Math.sin(angle);
        this.sun.position.set(Math.cos(angle), sunY, 0.5);

        this.sun.intensity = Math.max(0, sunY) * 1.2 + 0.1;
        this.ambient.intensity = Math.max(0.1, sunY * 0.5) + 0.1;

        const dayColor = new THREE.Color(0x87ceeb);
        const nightColor = new THREE.Color(0x000033);
        const sunsetColor = new THREE.Color(0xff8c00);
        
        let skyColor;
        if (sunY > 0.1) skyColor = dayColor;
        else if (sunY > -0.1) skyColor = dayColor.clone().lerp(sunsetColor, 1 - (sunY + 0.1) / 0.2);
        else skyColor = sunsetColor.clone().lerp(nightColor, 1 - (sunY + 0.2) / 0.1);
        
        this.engine.renderer.scene.background = skyColor;
        this.fog.color = skyColor;
    }
}