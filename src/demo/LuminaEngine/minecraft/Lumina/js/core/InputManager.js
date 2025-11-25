// Lumina/js/core/InputManager.js

export class InputManager {
    constructor(targetElement) {
        this.keys = {};
        this.lastKeys = {};
        this.mouseButtons = {};
        this.lastMouseButtons = {};
        this.mouseDelta = { x: 0, y: 0 };
        this.scrollDelta = 0;
        this.lockElement = targetElement;
        
        // Mobile
        this.joystickInput = { x: 0, y: 0 };
        this.touchDelta = { x: 0, y: 0 };
        this.isSprintingMobile = false; 

        this.isPaused = false; 
        this.isInventoryOpen = false;

        // Block Context Menu globally for Right-Click logic
        document.addEventListener('contextmenu', (e) => e.preventDefault(), false);

        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', (e) => this.keys[e.code] = false);

        document.addEventListener('mousedown', (e) => this.mouseButtons[e.button] = true);
        document.addEventListener('mouseup', (e) => this.mouseButtons[e.button] = false);
        document.addEventListener('wheel', (e) => this.scrollDelta += Math.sign(e.deltaY));

        document.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT' || e.target.closest('.menu-screen') || e.target.closest('#mobile-controls') || e.target.closest('.slot')) return;
            
            if (!this.isPaused && !this.isInventoryOpen && document.pointerLockElement !== this.lockElement) {
                this.lock();
            }
        });

        document.addEventListener('pointerlockchange', () => {
             if (document.pointerLockElement === this.lockElement || document.pointerLockElement === document.body) {
                this.isPaused = false;
                if (this.onPauseToggle) this.onPauseToggle(false);
                document.addEventListener('mousemove', this.onMouseMove.bind(this), false);
            } else {
                document.removeEventListener('mousemove', this.onMouseMove.bind(this), false);
                if (!this.isInventoryOpen && !this.isMobile()) {
                    if (!this.isPaused) this.setPaused(true);
                }
            }
        });
    }

    setJoystickInput(x, y) {
        this.joystickInput.x = x;
        this.joystickInput.y = y;
    }
    
    addTouchDelta(dx, dy) {
        this.touchDelta.x += dx;
        this.touchDelta.y += dy;
    }

    emulateKey(code, pressed) {
        this.keys[code] = pressed;
    }
    
    setMobileSprint(isActive) {
        this.isSprintingMobile = isActive;
    }

    emulateMouseClick(button) {
        this.mouseButtons[button] = true;
        this.lastMouseButtons[button] = false;
    }

    emulateMouseHold(button, isDown) {
        this.mouseButtons[button] = isDown;
        if (!isDown) {
             this.lastMouseButtons[button] = false;
        }
    }
    
    isMobile() {
         return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1);
    }

    lock() {
        if (!this.isMobile()) {
            this.lockElement.requestPointerLock();
        } else {
             this.isPaused = false;
             if (this.onPauseToggle) this.onPauseToggle(false);
        }
    }
    
    onPauseToggle(isPaused) { /* Override */ }

    setPaused(paused) {
        this.isPaused = paused;
        if (this.onPauseToggle) this.onPauseToggle(paused);
        if (paused && !this.isMobile()) document.exitPointerLock();
    }

    onKeyDown(event) { this.keys[event.code] = true; }

    onMouseMove(event) {
        if (this.isPaused || this.isInventoryOpen) return;
        this.mouseDelta.x += event.movementX;
        this.mouseDelta.y += event.movementY;
    }

    isKeyDown(key) { 
        if (key === 'KeyW' && this.joystickInput.y < -0.3) return true;
        if (key === 'KeyS' && this.joystickInput.y > 0.3) return true;
        if (key === 'KeyA' && this.joystickInput.x < -0.3) return true;
        if (key === 'KeyD' && this.joystickInput.x > 0.3) return true;
        if (key === 'ShiftLeft' && this.isSprintingMobile) return true;
        return this.keys[key] || false; 
    }
    
    wasKeyJustPressed(key) { return this.isKeyDown(key) && !this.lastKeys[key]; }
    isMouseButtonDown(button) { return this.mouseButtons[button] || false; }
    wasMouseButtonJustPressed(button) { return this.isMouseButtonDown(button) && !this.lastMouseButtons[button]; }
    
    getMouseDelta() { 
        return { 
            x: this.mouseDelta.x + this.touchDelta.x, 
            y: this.mouseDelta.y + this.touchDelta.y 
        }; 
    }
    
    getScrollDelta() { return this.scrollDelta; }
    
    isPointerLocked() { 
        if (this.isMobile()) return !this.isPaused && !this.isInventoryOpen;
        return document.pointerLockElement === this.lockElement || document.pointerLockElement === document.body; 
    }

    resetDeltas() {
        this.mouseDelta.x = 0;
        this.mouseDelta.y = 0;
        this.scrollDelta = 0;
        this.touchDelta.x = 0;
        this.touchDelta.y = 0;
    }

    lateUpdate() {
        this.lastKeys = { ...this.keys };
        this.lastMouseButtons = { ...this.mouseButtons };
        this.resetDeltas();
    }
}