// Lumina/js/core/TouchControls.js

export class TouchControls {
    constructor(inputManager, uiManager) {
        this.inputManager = inputManager;
        this.uiManager = uiManager;
        
        this.joystickZone = document.getElementById('joystick-zone');
        this.joystickKnob = document.getElementById('joystick-knob');
        
        // Joystick State
        this.touchId = null; 
        this.origin = { x: 0, y: 0 };
        
        // Camera/Action State
        this.lookTouchId = null;
        this.lastLookX = 0;
        this.lastLookY = 0;
        this.tapStartX = 0;
        this.tapStartY = 0;
        
        // Logic for Hold to Break
        this.interactionTimer = null;
        this.isBreaking = false; 
        this.isDrag = false;
        
        this.holdThreshold = 250; // мс (быстрее реакция)
        this.dragThreshold = 15;

        if (this.isMobile()) {
            this.init();
        }
    }

    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1);
    }

    init() {
        // --- Joystick Logic (unchanged) ---
        this.joystickZone.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.changedTouches[0];
            this.touchId = touch.identifier;
            this.origin = { x: touch.clientX, y: touch.clientY };
            this.updateJoystick(touch.clientX, touch.clientY);
        }, { passive: false });

        this.joystickZone.addEventListener('touchmove', (e) => {
            e.preventDefault();
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === this.touchId) {
                    const touch = e.changedTouches[i];
                    this.updateJoystick(touch.clientX, touch.clientY);
                    break;
                }
            }
        }, { passive: false });

        const endJoystick = (e) => {
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === this.touchId) {
                    this.touchId = null;
                    this.resetJoystick();
                    break;
                }
            }
        };
        this.joystickZone.addEventListener('touchend', endJoystick);
        this.joystickZone.addEventListener('touchcancel', endJoystick);

        // --- Interaction Logic (Break/Place) ---
        document.addEventListener('touchstart', (e) => {
            if (e.target.closest('#mobile-controls') || e.target.closest('#inventory') || e.target.closest('.menu-screen')) return;
            
            if (this.lookTouchId === null) {
                const touch = e.changedTouches[0];
                this.lookTouchId = touch.identifier;
                
                this.lastLookX = touch.clientX;
                this.lastLookY = touch.clientY;
                this.tapStartX = touch.clientX;
                this.tapStartY = touch.clientY;
                
                this.isDrag = false;
                this.isBreaking = false;

                // Начинаем таймер. Если палец не сдвинется сильно -> включаем "Hold"
                this.interactionTimer = setTimeout(() => {
                    if (!this.isDrag) {
                        this.isBreaking = true;
                        // Task 5: Удерживаем кнопку ломания
                        this.inputManager.emulateMouseHold(0, true); 
                        if (navigator.vibrate) navigator.vibrate(30);
                    }
                }, this.holdThreshold);
            }
        }, { passive: false });

        document.addEventListener('touchmove', (e) => {
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === this.lookTouchId) {
                    const touch = e.changedTouches[i];
                    
                    const dx = touch.clientX - this.lastLookX;
                    const dy = touch.clientY - this.lastLookY;
                    
                    this.inputManager.addTouchDelta(dx * 2.0, dy * 2.0);

                    this.lastLookX = touch.clientX;
                    this.lastLookY = touch.clientY;

                    // Если палец сдвинулся сильно, это уже не попытка сломать блок, а осмотр
                    const dist = Math.sqrt(Math.pow(touch.clientX - this.tapStartX, 2) + Math.pow(touch.clientY - this.tapStartY, 2));
                    
                    if (dist > this.dragThreshold) {
                        this.isDrag = true;
                        if (this.interactionTimer) clearTimeout(this.interactionTimer);
                        
                        // Если уже начали ломать, а потом дернули камерой -> прерываем ломание
                        if (this.isBreaking) {
                            this.isBreaking = false;
                            this.inputManager.emulateMouseHold(0, false);
                        }
                    }
                }
            }
        }, { passive: false });

        const endLook = (e) => {
             for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === this.lookTouchId) {
                    this.lookTouchId = null;
                    if (this.interactionTimer) clearTimeout(this.interactionTimer);

                    if (this.isBreaking) {
                        // Мы держали палец -> ломание прекращается
                        this.isBreaking = false;
                        this.inputManager.emulateMouseHold(0, false);
                    } else if (!this.isDrag) {
                        // Мы просто тапнули -> ставим блок (ПКМ)
                        this.inputManager.emulateMouseClick(2);
                    }
                }
            }
        };
        document.addEventListener('touchend', endLook);
        document.addEventListener('touchcancel', endLook);

        // --- Buttons ---
        this.bindButton('btn-jump', 'Space');
        
        // Sprint logic
        const btnRun = document.getElementById('btn-run');
        btnRun.addEventListener('touchstart', (e) => { 
            e.preventDefault(); e.stopPropagation();
            this.inputManager.setMobileSprint(true);
            btnRun.classList.add('active');
        });
        btnRun.addEventListener('touchend', (e) => { 
            e.preventDefault(); e.stopPropagation();
            this.inputManager.setMobileSprint(false);
            btnRun.classList.remove('active');
        });

        // UI toggles
        document.getElementById('btn-inv-mobile').addEventListener('touchstart', (e) => { e.preventDefault(); e.stopPropagation(); this.uiManager.toggleInventory(); });
        document.getElementById('btn-pause-mobile').addEventListener('touchstart', (e) => { e.preventDefault(); e.stopPropagation(); this.inputManager.setPaused(true); });
    }

    bindButton(id, key) {
        const btn = document.getElementById(id);
        btn.addEventListener('touchstart', (e) => { e.preventDefault(); e.stopPropagation(); this.inputManager.emulateKey(key, true); btn.classList.add('active'); });
        btn.addEventListener('touchend', (e) => { e.preventDefault(); e.stopPropagation(); this.inputManager.emulateKey(key, false); btn.classList.remove('active'); });
    }

    updateJoystick(x, y) {
        const maxRadius = 70;
        let dx = x - this.origin.x;
        let dy = y - this.origin.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist > maxRadius) {
            dx = (dx / dist) * maxRadius;
            dy = (dy / dist) * maxRadius;
        }
        this.joystickKnob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
        this.inputManager.setJoystickInput(dx / maxRadius, dy / maxRadius);
    }

    resetJoystick() {
        this.joystickKnob.style.transform = `translate(-50%, -50%)`;
        this.inputManager.setJoystickInput(0, 0);
    }
}