import { Component } from '../Lumina/js/core/Component.js';
import * as THREE from 'three';

export class DayNightCycle extends Component {
    constructor(gameObject, settingsManager) {
        super(gameObject);
        this.settings = settingsManager;
        this.dayDuration = 600; this.time = this.dayDuration * 0.25;
        this.skyPivot = new THREE.Group(); this.cloudGroup = new THREE.Group();
    }
    start() {
        const sc = this.engine.renderer.scene; this.player = this.engine.player;
        this.sunLight = new THREE.DirectionalLight(0xffffff, 1);
        this.sunLight.position.set(0, 100, 0);
        this.sunLight.shadow.camera.near = 0.5; this.sunLight.shadow.camera.far = 500;
        this.sunLight.shadow.camera.left = -100; this.sunLight.shadow.camera.right = 100;
        this.sunLight.shadow.camera.top = 100; this.sunLight.shadow.camera.bottom = -100;
        sc.add(this.sunLight);
        this.ambientLight = new THREE.AmbientLight(0xcccccc, 0.2); sc.add(this.ambientLight);
        this.fog = new THREE.Fog(0x87ceeb, 20, 160); sc.fog = this.fog;
        this.skyPivot.renderOrder = -1; sc.add(this.skyPivot);
        this.createCelestialBodies(); this.createStars();
        sc.add(this.cloudGroup); this.generateClouds();
    }
    createCelestialBodies() {
        const dist = 400;
        const sT = this.createTexture(64,(c,w)=>{c.fillStyle='#FFF700';c.fillRect(0,0,w,w);c.fillStyle='#FFD700';c.fillRect(w/4,w/4,w/2,w/2);});
        this.sunMesh = new THREE.Mesh(new THREE.BoxGeometry(60,60,1), new THREE.MeshBasicMaterial({map:sT,transparent:true,fog:false,depthWrite:false}));
        this.sunMesh.position.set(0,dist,0); this.sunMesh.lookAt(0,0,0); this.sunMesh.renderOrder=-1; this.skyPivot.add(this.sunMesh);
        const mT = this.createTexture(64,(c,w)=>{c.fillStyle='#F0F0F0';c.fillRect(0,0,w,w);c.fillStyle='#CCCCCC';c.fillRect(w/8,w/8,w/4,w/4);c.fillRect(w/2,w/2,w/3,w/3);});
        this.moonMesh = new THREE.Mesh(new THREE.BoxGeometry(40,40,1), new THREE.MeshBasicMaterial({map:mT,transparent:true,fog:false,depthWrite:false}));
        this.moonMesh.position.set(0,-dist,0); this.moonMesh.lookAt(0,0,0); this.moonMesh.renderOrder=-1; this.skyPivot.add(this.moonMesh);
    }
    createStars() {
        const p=[]; for(let i=0;i<2000;i++){const r=380,t=Math.random()*Math.PI*2,h=Math.acos(2*Math.random()-1);p.push(r*Math.sin(h)*Math.cos(t),r*Math.sin(h)*Math.sin(t),r*Math.cos(h));}
        const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
        this.starSystem=new THREE.Points(g,new THREE.PointsMaterial({color:0xffffff,size:2.5,sizeAttenuation:false,transparent:true,fog:false,depthWrite:false}));
        this.starSystem.renderOrder=-2; this.skyPivot.add(this.starSystem);
    }
    generateClouds() {
        const g=new THREE.BoxGeometry(24,6,24), m=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.5,fog:true});
        for(let i=0;i<50;i++){const c=new THREE.Mesh(g,m); c.position.set((Math.random()-0.5)*500,110+(Math.random()*15),(Math.random()-0.5)*500); c.scale.set(1+Math.random(),1,1+Math.random()); this.cloudGroup.add(c);}
    }
    createTexture(s,f) { const c=document.createElement('canvas');c.width=c.height=s;f(c.getContext('2d'),s);const t=new THREE.CanvasTexture(c);t.magFilter=THREE.NearestFilter;return t;}
    update(dt) {
        // Применение настроек
        const shadows = this.settings.get('shadows');
        if(this.sunLight.castShadow !== shadows) this.sunLight.castShadow = shadows;
        if(shadows) {
            const size = this.settings.get('shadowMapSize');
            if(this.sunLight.shadow.mapSize.width !== size) {
                this.sunLight.shadow.mapSize.width = size;
                this.sunLight.shadow.mapSize.height = size;
                this.sunLight.shadow.map?.dispose();
                this.sunLight.shadow.map = null;
            }
        }
        this.cloudGroup.visible = this.settings.get('showClouds');
        this.starSystem.visible = this.settings.get('showStars');
        this.sunMesh.visible = this.settings.get('showSunMoon');
        this.moonMesh.visible = this.settings.get('showSunMoon');

        const sm = this.settings.get('timeSpeed'); this.time=(this.time+dt*sm)%this.dayDuration;
        const ang=(this.time/this.dayDuration - 0.25)*Math.PI*2; this.skyPivot.rotation.z=ang;
        const sh=Math.sin(ang+Math.PI/2); this.sunMesh.getWorldPosition(this.sunLight.position);
        this.sunLight.intensity=Math.max(0,sh)*1.0+0.1; this.ambientLight.intensity=Math.max(0.05,sh*0.6)+0.1;
        if(this.starSystem) { let o=0; if(sh<0.25) {o=1-(sh+0.25)*2; if(o>1)o=1;} this.starSystem.material.opacity=Math.max(0,o); }
        const dc=new THREE.Color(0x87ceeb), nc=new THREE.Color(0x050510), sc=new THREE.Color(0xffaa44);
        let c; if(sh>0.2)c=dc; else if(sh>-0.2){const t=(sh+0.2)/0.4; c=sh>0?sc.clone().lerp(dc,t):nc.clone().lerp(sc,t);} else c=nc;
        this.engine.renderer.scene.background=c; this.fog.color=c;
        const rd=this.settings.get('renderDistance'), bf=(rd*32)-10, fd=Math.max(60,bf), fn=Math.max(40,bf*0.6);
        this.fog.far=sh>0?fd:THREE.MathUtils.lerp(fn,fd,sh+1);
        if(this.player){ const p=this.player.transform.position; this.skyPivot.position.set(p.x,p.y,p.z); this.cloudGroup.position.x+=dt*2; if(Math.abs(this.cloudGroup.position.x-p.x)>400)this.cloudGroup.position.x=p.x; if(Math.abs(this.cloudGroup.position.z-p.z)>400)this.cloudGroup.position.z=p.z; }
    }
}