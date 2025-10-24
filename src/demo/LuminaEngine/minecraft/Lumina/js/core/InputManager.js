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

        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', (e) => this.keys[e.code] = false);

        document.addEventListener('mousedown', (e) => this.mouseButtons[e.button] = true);
        document.addEventListener('mouseup', (e) => this.mouseButtons[e.button] = false);
        document.addEventListener('wheel', (e) => this.scrollDelta += Math.sign(e.deltaY));


        document.addEventListener('click', () => {
             if (document.pointerLockElement !== this.lockElement) {
                this.lockElement.requestPointerLock();
            }
        });

        document.addEventListener('pointerlockchange', () => {
            const instructions = document.getElementById('instructions');
            if (document.pointerLockElement === this.lockElement) {
                document.addEventListener('mousemove', this.onMouseMove.bind(this), false);
                if (instructions) instructions.style.display = 'none';
            } else {
                document.removeEventListener('mousemove', this.onMouseMove.bind(this), false);
                if (instructions) instructions.style.display = 'block';
                this.keys = {}; 
                this.mouseButtons = {};
            }
        });
    }
    
    onKeyDown(event) {
        this.keys[event.code] = true;
        if (document.pointerLockElement === this.lockElement) {
            if (event.code !== 'Escape') {
                event.preventDefault();
            }
        }
    }

    onMouseMove(event) {
        this.mouseDelta.x += event.movementX;
        this.mouseDelta.y += event.movementY;
    }

    isKeyDown(key) {
        return this.keys[key] || false;
    }

    wasKeyJustPressed(key) {
        return this.isKeyDown(key) && !this.lastKeys[key];
    }
    
    isMouseButtonDown(button) {
        return this.mouseButtons[button] || false;
    }

    wasMouseButtonJustPressed(button) {
        return this.isMouseButtonDown(button) && !this.lastMouseButtons[button];
    }

    getMouseDelta() {
        return { ...this.mouseDelta };
    }
    
    getScrollDelta() {
        return this.scrollDelta;
    }

    resetDeltas() {
        this.mouseDelta.x = 0;
        this.mouseDelta.y = 0;
        this.scrollDelta = 0;
    }
    
    isPointerLocked() {
        return document.pointerLockElement === this.lockElement;
    }

    lateUpdate() {
        this.lastKeys = { ...this.keys };
        this.lastMouseButtons = { ...this.mouseButtons };
        this.resetDeltas();
    }
}