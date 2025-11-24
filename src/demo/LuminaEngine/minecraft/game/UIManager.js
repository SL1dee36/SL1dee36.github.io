import { BLOCK } from './blocks.js';

export class UIManager {
    constructor(inputManager, settingsManager, saveManagerCallback) {
        this.inputManager = inputManager;
        this.settings = settingsManager;
        this.saveAndQuitCallback = saveManagerCallback;
        this.hotbarElement = document.getElementById('hotbar');
        this.inventoryElement = document.getElementById('inventory');
        this.dragIcon = document.getElementById('drag-icon');
        this.pauseMenu = document.getElementById('pause-menu');
        this.optionsMenu = document.getElementById('options-menu');
        this.statsMenu = document.getElementById('stats-menu');
        this.inventoryComponent = null;
        this.cursorItem = null;
        this.initPauseMenu();
        this.initOptionsMenu();
        this.initInventoryDrag();
        this.inputManager.onPauseToggle = (paused) => { if (paused) this.showScreen(this.pauseMenu); else this.closeAllMenus(); };
    }
    setInventory(inv) { this.inventoryComponent = inv; this.updateAll(); }
    showScreen(el) { this.pauseMenu.style.display = 'none'; this.optionsMenu.style.display = 'none'; this.statsMenu.style.display = 'none'; if(el){ el.style.display='flex'; document.exitPointerLock(); } }
    closeAllMenus() { this.pauseMenu.style.display='none'; this.optionsMenu.style.display='none'; this.statsMenu.style.display='none'; }
    toggleInventory() {
        if(this.inputManager.isPaused) return;
        this.inputManager.isInventoryOpen = !this.inputManager.isInventoryOpen;
        if(this.inputManager.isInventoryOpen){ this.inventoryElement.style.display='block'; document.exitPointerLock(); this.updateAll(); }
        else { this.inventoryElement.style.display='none'; if(this.cursorItem){this.inventoryComponent.addItem(this.cursorItem.id,this.cursorItem.count); this.cursorItem=null; this.updateCursorIcon();} this.inputManager.lock(); }
    }
    initPauseMenu() {
        document.getElementById('resume-btn').onclick = () => { this.closeAllMenus(); this.inputManager.isPaused=false; setTimeout(()=>this.inputManager.lock(),10); };
        document.getElementById('options-btn').onclick = () => { this.updateOptionsUI(); this.showScreen(this.optionsMenu); };
        document.getElementById('stats-btn').onclick = () => { this.updateStatsUI(); this.showScreen(this.statsMenu); };
        document.getElementById('save-quit-btn').onclick = () => { if(this.saveAndQuitCallback)this.saveAndQuitCallback(); location.reload(); };
    }
    initOptionsMenu() {
        const bindR = (id,k,dId) => { const el=document.getElementById(id),d=document.getElementById(dId); el.value=this.settings.get(k); d.textContent=el.value; el.oninput=(e)=>{this.settings.set(k,parseFloat(e.target.value)); d.textContent=e.target.value;}; };
        bindR('opt-render-dist','renderDistance','val-render-dist'); bindR('opt-sensitivity','sensitivity','val-sensitivity'); bindR('opt-time-speed','timeSpeed','val-time-speed');
        
        const bindBool = (id, k) => { const b=document.getElementById(id); b.textContent=this.settings.get(k)?'ON':'OFF'; b.onclick=()=>{const v=!this.settings.get(k); this.settings.set(k,v); b.textContent=v?'ON':'OFF';}; };
        bindBool('opt-show-hand','showHand'); bindBool('opt-show-clouds','showClouds'); bindBool('opt-show-stars','showStars'); bindBool('opt-show-sky','showSunMoon');

        const shadowSel = document.getElementById('opt-shadows');
        const sSize = this.settings.get('shadowMapSize'); const sOn = this.settings.get('shadows');
        shadowSel.value = !sOn ? 'off' : (sSize===1024?'low':'high');
        shadowSel.onchange = (e) => {
            if(e.target.value==='off') { this.settings.set('shadows', false); }
            else { this.settings.set('shadows', true); this.settings.set('shadowMapSize', e.target.value==='low'?1024:2048); }
        };
        const renderModeSel = document.getElementById('opt-render-mode');
        renderModeSel.value = this.settings.get('renderMode');
        renderModeSel.onchange = (e) => {
            this.settings.set('renderMode', e.target.value);
        };
        document.getElementById('options-back-btn').onclick = () => this.showScreen(this.pauseMenu);
    }
    updateOptionsUI() { document.getElementById('opt-render-dist').value = this.settings.get('renderDistance'); document.getElementById('val-render-dist').textContent = this.settings.get('renderDistance'); }
    updateStatsUI() { const p=this.inventoryComponent.gameObject.transform.position; document.getElementById('stats-content').innerHTML=`Pos: ${p.x.toFixed(0)}, ${p.y.toFixed(0)}, ${p.z.toFixed(0)}<br>Seed: ${this.inventoryComponent.engine.physicsEngine.world.seed.toFixed(0)}`; document.getElementById('stats-back-btn').onclick=()=>this.showScreen(this.pauseMenu); }
    initInventoryDrag() { document.addEventListener('mousemove',(e)=>{if(this.cursorItem){this.dragIcon.style.left=(e.pageX+10)+'px'; this.dragIcon.style.top=(e.pageY+10)+'px';}}); }
    createSlotElement(item, i, isH, clk) {
        const s=document.createElement('div'); s.className='slot';
        if(isH && !this.inputManager.isInventoryOpen) s.className+=' hotbar-slot';
        if(isH && !this.inputManager.isInventoryOpen && i===this.inventoryComponent.selectedSlot) s.classList.add('selected');
        if(item) { const p=BLOCK.get(item.id); s.style.backgroundImage=`url(textures/${typeof p.texture==='object'?p.texture.side:p.texture})`; if(item.count>1)s.innerHTML=`<div class="item-count">${item.count}</div>`; }
        s.onmousedown=(e)=>{if(this.inputManager.isInventoryOpen){e.stopPropagation();clk(i);}else if(isH){this.inventoryComponent.selectedSlot=i;this.updateHotbarHUD();}};
        s.ontouchstart=(e)=>{e.stopPropagation();if(this.inputManager.isInventoryOpen){clk(i);}else if(isH){this.inventoryComponent.selectedSlot=i;this.updateHotbarHUD();}};
        return s;
    }
    updateAll() { if(!this.inventoryComponent)return; this.updateHotbarHUD(); if(this.inputManager.isInventoryOpen){this.updateInventoryWindow();this.updateCursorIcon();} }
    updateCursorIcon() { if(this.cursorItem){this.dragIcon.style.display='block'; const p=BLOCK.get(this.cursorItem.id); this.dragIcon.style.backgroundImage=`url(textures/${typeof p.texture==='object'?p.texture.side:p.texture})`; this.dragIcon.innerHTML=this.cursorItem.count>1?`<div class="item-count">${this.cursorItem.count}</div>`:''; }else{this.dragIcon.style.display='none';} }
    updateHotbarHUD() { this.hotbarElement.innerHTML=''; for(let i=0;i<9;i++)this.hotbarElement.appendChild(this.createSlotElement(this.inventoryComponent.hotbar[i],i,true,()=>{})); }
    updateInventoryWindow() { const mg=document.getElementById('main-inventory-grid'), hg=document.getElementById('hotbar-inventory-grid'); mg.innerHTML=''; hg.innerHTML=''; for(let i=0;i<27;i++)mg.appendChild(this.createSlotElement(this.inventoryComponent.main[i],i,false,(x)=>this.handleSlotClick('main',x))); for(let i=0;i<9;i++)hg.appendChild(this.createSlotElement(this.inventoryComponent.hotbar[i],i,true,(x)=>this.handleSlotClick('hotbar',x))); }
    handleSlotClick(t,i) { const c=t==='main'?this.inventoryComponent.main:this.inventoryComponent.hotbar; const cl=c[i]; if(!this.cursorItem){if(cl){this.cursorItem=cl;c[i]=null;}}else{if(!cl){c[i]=this.cursorItem;this.cursorItem=null;}else{if(cl.id===this.cursorItem.id){const add=Math.min(64-cl.count,this.cursorItem.count);cl.count+=add;this.cursorItem.count-=add;if(this.cursorItem.count<=0)this.cursorItem=null;}else{const tmp=c[i];c[i]=this.cursorItem;this.cursorItem=tmp;}}} this.updateAll(); }
}