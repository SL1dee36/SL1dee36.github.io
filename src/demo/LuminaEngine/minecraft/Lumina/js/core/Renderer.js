import * as THREE from 'three';

export class Renderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);

        this.coordsDisplay = document.getElementById('coords-display');
        this.fpsDisplay = document.getElementById('fps-display');
        
        window.addEventListener('resize', this.onWindowResize.bind(this), false);
    }

    get domElement() {
        return this.renderer.domElement;
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }
    
    updateUI(fps, playerTransform, worldStats, renderStats) {
        this.fpsDisplay.textContent = `FPS: ${fps}`;
        
        if (!playerTransform) return;
        
        const pos = playerTransform.position;
        
        const pitch = (this.camera.rotation.x * 180 / Math.PI).toFixed(1);
        let yaw = playerTransform.rotation.y * 180 / Math.PI;
        
        yaw = yaw % 360;
        if (yaw < 0) { yaw += 360; }
        
        const yawDisplay = yaw.toFixed(1);

        let statsHtml = `
            X: ${pos.x.toFixed(2)}<br>
            Y: ${pos.y.toFixed(2)}<br>
            Z: ${pos.z.toFixed(2)}<br>
            Pitch: ${pitch}° Yaw: ${yawDisplay}°
        `;

        if (worldStats && renderStats) {
            // Estimate blocks by loaded chunks capacity
            const totalBlocks = worldStats.chunks * 8 * 128 * 8; 
            
            statsHtml += `<br>
            Loaded Chunks: ${worldStats.chunks}<br>
            Total Capacity: ${totalBlocks.toLocaleString()} blocks<br>
            Visible Tris: ${renderStats.triangles.toLocaleString()}<br>
            Total Tris: ${worldStats.totalTriangles.toLocaleString()}
            `;
        }

        this.coordsDisplay.innerHTML = statsHtml;
    }
}