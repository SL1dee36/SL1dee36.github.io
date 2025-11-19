// Lumina/js/core/InputManager.js

export class InputManager {
    constructor(targetElement) {
        this.keys = {};
        this.lastKeys = {};
        this.mouseButtons = {};
        this.lastMouseButtons = {};
        this.mouseDelta = { x: 0, y: 0 };
        this.scrollDelta = 0;
        this.lockElement = targetElement; // Это наш Canvas
        
        this.isPaused = false; 
        this.isInventoryOpen = false;

        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', (e) => this.keys[e.code] = false);

        document.addEventListener('mousedown', (e) => this.mouseButtons[e.button] = true);
        document.addEventListener('mouseup', (e) => this.mouseButtons[e.button] = false);
        document.addEventListener('wheel', (e) => this.scrollDelta += Math.sign(e.deltaY));

        // Клик по игре (если мы не в меню)
        document.addEventListener('click', (e) => {
            // Игнорируем клики по интерфейсу
            if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT' || e.target.closest('.menu-screen')) return;
            
            if (!this.isPaused && !this.isInventoryOpen && document.pointerLockElement !== this.lockElement) {
                this.lock();
            }
        });

        document.addEventListener('pointerlockchange', () => {
            // Проверяем, захвачен ли НАШ элемент (canvas) ИЛИ body (для надежности)
            if (document.pointerLockElement === this.lockElement || document.pointerLockElement === document.body) {
                // === ИГРА АКТИВНА ===
                this.isPaused = false;
                if (this.onPauseToggle) this.onPauseToggle(false);
                
                document.addEventListener('mousemove', this.onMouseMove.bind(this), false);
            } else {
                // === КУРСОР ОСВОБОЖДЕН ===
                document.removeEventListener('mousemove', this.onMouseMove.bind(this), false);
                
                // Если мы не в инвентаре -> значит это пауза (Esc или Alt-Tab)
                if (!this.isInventoryOpen) {
                    if (!this.isPaused) {
                        this.setPaused(true);
                    }
                }
            }
        });
    }
    
    // Метод для вызова из UI
    lock() {
        this.lockElement.requestPointerLock();
    }
    
    onPauseToggle(isPaused) { /* Переопределяется в UIManager */ }

    setPaused(paused) {
        this.isPaused = paused;
        if (this.onPauseToggle) this.onPauseToggle(paused);
        
        // Если ставим паузу программно -> отпускаем мышь
        if (paused) {
            document.exitPointerLock();
        }
    }

    onKeyDown(event) { this.keys[event.code] = true; }

    onMouseMove(event) {
        if (this.isPaused || this.isInventoryOpen) return;
        this.mouseDelta.x += event.movementX;
        this.mouseDelta.y += event.movementY;
    }

    isKeyDown(key) { return this.keys[key] || false; }
    wasKeyJustPressed(key) { return this.isKeyDown(key) && !this.lastKeys[key]; }
    isMouseButtonDown(button) { return this.mouseButtons[button] || false; }
    wasMouseButtonJustPressed(button) { return this.isMouseButtonDown(button) && !this.lastMouseButtons[button]; }
    getMouseDelta() { return { ...this.mouseDelta }; }
    getScrollDelta() { return this.scrollDelta; }
    
    isPointerLocked() { 
        return document.pointerLockElement === this.lockElement || document.pointerLockElement === document.body; 
    }

    resetDeltas() {
        this.mouseDelta.x = 0;
        this.mouseDelta.y = 0;
        this.scrollDelta = 0;
    }

    lateUpdate() {
        this.lastKeys = { ...this.keys };
        this.lastMouseButtons = { ...this.mouseButtons };
        this.resetDeltas();
    }
}