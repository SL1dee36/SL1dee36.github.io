// game/DayNightCycle.js
import { Component } from '../Lumina/js/core/Component.js';
import * as THREE from 'three';

export class DayNightCycle extends Component {
    constructor(gameObject) {
        super(gameObject);
        this.dayDuration = 600; // 10 minutes per day
        this.time = this.dayDuration * 0.25; // Start at morning

        this.sun = null;
        this.ambientLight = null;
        this.fog = null;
    }

    start() {
        const scene = this.engine.renderer.scene;

        this.sun = new THREE.DirectionalLight(0xffffff, 1);
        this.sun.position.set(0, 1, 0);
        scene.add(this.sun);

        this.ambientLight = new THREE.AmbientLight(0xcccccc, 0.2);
        scene.add(this.ambientLight);

        this.fog = new THREE.Fog(0x87ceeb, 0, 128);
        scene.fog = this.fog;
    }

    update(deltaTime) {
        this.time = (this.time + deltaTime) % this.dayDuration;
        const angle = (this.time / this.dayDuration) * 2 * Math.PI;

        const sunX = Math.cos(angle);
        const sunY = Math.sin(angle);
        
        this.sun.position.set(sunX, sunY, 0.5);

        // Light intensity
        this.sun.intensity = Math.max(0, sunY) * 1.2 + 0.1;
        this.ambientLight.intensity = Math.max(0.1, sunY * 0.5) + 0.1;

        // Sky color and fog
        const dayColor = new THREE.Color(0x87ceeb);
        const nightColor = new THREE.Color(0x000033);
        const sunsetColor = new THREE.Color(0xff8c00);
        
        let skyColor;
        if (sunY > 0.1) {
            skyColor = dayColor;
        } else if (sunY > -0.1) {
            skyColor = dayColor.clone().lerp(sunsetColor, 1 - (sunY + 0.1) / 0.2);
        } else {
            skyColor = sunsetColor.clone().lerp(nightColor, 1 - (sunY + 0.2) / 0.1);
        }
        
        this.engine.renderer.scene.background = skyColor;
        this.fog.color = skyColor;
    }
}