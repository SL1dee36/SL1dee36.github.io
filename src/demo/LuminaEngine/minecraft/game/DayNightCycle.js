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
    }

    start() {
        const sc = this.engine.renderer.scene; 
        this.player = this.engine.player;

        this.sunLight = new THREE.DirectionalLight(0xffffff, 1);
        this.sunLight.position.set(0, 100, 0);
        
        this.sunLight.shadow.camera.near = 0.5; 
        this.sunLight.shadow.camera.far = 200; 
        this.sunLight.shadow.bias = -0.0005;   
        
        this.updateShadowFrustum();
        
        sc.add(this.sunLight);
        this.ambientLight = new THREE.AmbientLight(0xcccccc, 0.2); 
        sc.add(this.ambientLight);
        this.fog = new THREE.Fog(0x87ceeb, 10, 100); 
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
        const sT = this.createTexture(64,(c,w)=>{c.fillStyle='#FFF700';c.fillRect(0,0,w,w);c.fillStyle='#FFD700';c.fillRect(w/4,w/4,w/2,w/2);});
        this.sunMesh = new THREE.Mesh(new THREE.BoxGeometry(60,60,1), new THREE.MeshBasicMaterial({map:sT,transparent:true,fog:false,depthWrite:false}));
        this.sunMesh.position.set(0,dist,0); 
        this.sunMesh.lookAt(0,0,0); 
        this.skyPivot.add(this.sunMesh);

        const mT = this.createTexture(64,(c,w)=>{c.fillStyle='#F0F0F0';c.fillRect(0,0,w,w);c.fillStyle='#CCCCCC';c.fillRect(w/8,w/8,w/4,w/4);c.fillRect(w/2,w/2,w/3,w/3);});
        this.moonMesh = new THREE.Mesh(new THREE.BoxGeometry(40,40,1), new THREE.MeshBasicMaterial({map:mT,transparent:true,fog:false,depthWrite:false}));
        this.moonMesh.position.set(0,-dist,0); 
        this.moonMesh.lookAt(0,0,0); 
        this.skyPivot.add(this.moonMesh);
    }

    createStars() {
        const p=[]; 
        for(let i=0;i<1500;i++){
            const r=380,t=Math.random()*Math.PI*2,h=Math.acos(2*Math.random()-1);
            p.push(r*Math.sin(h)*Math.cos(t),r*Math.sin(h)*Math.sin(t),r*Math.cos(h));
        }
        const g=new THREE.BufferGeometry(); 
        g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
        this.starSystem=new THREE.Points(g,new THREE.PointsMaterial({color:0xffffff,size:2,transparent:true,fog:false}));
        this.skyPivot.add(this.starSystem);
    }

    generateClouds() {
        const g=new THREE.BoxGeometry(24,6,24), m=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.6,fog:true});
        for(let i=0;i<40;i++){
            const c=new THREE.Mesh(g,m); 
            c.position.set((Math.random()-0.5)*500, 110+(Math.random()*15), (Math.random()-0.5)*500); 
            c.scale.set(1+Math.random(),1,1+Math.random()); 
            this.cloudGroup.add(c);
        }
    }

    createTexture(s,f) { const c=document.createElement('canvas');c.width=c.height=s;f(c.getContext('2d'),s);const t=new THREE.CanvasTexture(c);t.magFilter=THREE.NearestFilter;return t;}

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
        const ang = (this.time / this.dayDuration - 0.25) * Math.PI * 2; 
        this.skyPivot.rotation.z = ang;
        const sunHeight = Math.sin(ang + Math.PI / 2);

        this.sunLight.intensity = Math.max(0, sunHeight) * 1.0 + 0.1; 
        this.ambientLight.intensity = Math.max(0.05, sunHeight * 0.6) + 0.15;
        
        if(this.starSystem) { 
            let o=0; if(sunHeight<0.25) {o=1-(sunHeight+0.25)*2; if(o>1)o=1;} 
            this.starSystem.material.opacity=Math.max(0,o); 
        }

        const dayColor = new THREE.Color(0x87ceeb);
        const nightColor = new THREE.Color(0x050510);
        const sunsetColor = new THREE.Color(0xffaa44);
        
        let skyColor; 
        if(sunHeight > 0.2) skyColor = dayColor; 
        else if(sunHeight > -0.2){
            const t=(sunHeight+0.2)/0.4; 
            skyColor = sunHeight>0 ? sunsetColor.clone().lerp(dayColor,t) : nightColor.clone().lerp(sunsetColor,t);
        } else skyColor = nightColor;
        
        this.engine.renderer.scene.background = skyColor;
        this.fog.color = skyColor;

        const rdChunks = this.settings.get('renderDistance');
        const maxDist = rdChunks * 32; 
        const fogFactor = this.settings.get('fogFactor');

        if (fogFactor <= 0.05) {
             this.fog.near = 5000;
             this.fog.far = 10000;
        } else {
             const fogEnd = maxDist * fogFactor; 
             const fogStart = fogEnd * 0.6;
             const nightLimit = sunHeight > 0 ? 1 : 0.4;
             
             this.fog.near = fogStart * nightLimit;
             this.fog.far = fogEnd * nightLimit;
        }

        if(this.player){ 
            const p = this.player.transform.position; 
            this.skyPivot.position.set(p.x,p.y,p.z); 
            
            this.sunLight.position.set(
                p.x + Math.cos(ang + Math.PI/2) * 100, 
                p.y + Math.sin(ang + Math.PI/2) * 100, 
                p.z
            );
            this.sunLight.target.position.copy(p);
            this.sunLight.target.updateMatrixWorld();

            this.cloudGroup.position.x += dt * 2; 
            if(Math.abs(this.cloudGroup.position.x - p.x) > 400) this.cloudGroup.position.x = p.x; 
            if(Math.abs(this.cloudGroup.position.z - p.z) > 400) this.cloudGroup.position.z = p.z; 
        }
    }
}