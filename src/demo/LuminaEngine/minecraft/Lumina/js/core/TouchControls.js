// Lumina/js/core/TouchControls.js

export class TouchControls {
    constructor(inputManager, uiManager) {
        this.inputManager = inputManager;
        this.uiManager = uiManager;
        
        this.joystickZone = document.getElementById('joystick-zone');
        this.joystickKnob = document.getElementById('joystick-knob');
        
        // State Joystick
        this.touchId = null; 
        this.origin = { x: 0, y: 0 };
        this.joystickVector = { x: 0, y: 0 }; 

        // State Camera / Action
        this.lookTouchId = null;
        this.lastLookX = 0;
        this.lastLookY = 0;
        this.tapStartX = 0;
        this.tapStartY = 0;
        
        // Tap vs Hold Logic
        this.interactionTimer = null;
        this.isBreaking = false; // Режим удержания
        this.isDrag = false;     // Если палец поехал, это не тап и не холд
        
        this.holdThreshold = 300; // мс до начала ломания
        this.dragThreshold = 10;  // пикселей до отмены ломания

        if (this.isMobile()) {
            this.init();
        }
    }

    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1);
    }

    init() {
        // --- Джойстик ---
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

        // --- Вращение камеры и Действия (Tap/Hold) ---
        // Вешаем на document, но игнорируем UI
        document.addEventListener('touchstart', (e) => {
            if (e.target.closest('#mobile-controls') || e.target.closest('#inventory') || e.target.closest('.menu-screen')) return;
            
            if (this.lookTouchId === null) {
                // e.preventDefault(); // Можно, но осторожно (блочит скролл)
                const touch = e.changedTouches[0];
                this.lookTouchId = touch.identifier;
                
                this.lastLookX = touch.clientX;
                this.lastLookY = touch.clientY;
                
                this.tapStartX = touch.clientX;
                this.tapStartY = touch.clientY;
                
                this.isDrag = false;
                this.isBreaking = false;

                // Запускаем таймер на удержание (ломание)
                this.interactionTimer = setTimeout(() => {
                    if (!this.isDrag) {
                        this.isBreaking = true;
                        this.inputManager.emulateMouseHold(0, true); // Зажать ЛКМ
                        // Вибрация при начале ломания (если поддерживается)
                        if (navigator.vibrate) navigator.vibrate(50);
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
                    
                    // Вращаем камеру
                    this.inputManager.addTouchDelta(dx * 2.0, dy * 2.0);

                    this.lastLookX = touch.clientX;
                    this.lastLookY = touch.clientY;

                    // Проверяем, не сдвинулся ли палец слишком сильно для тапа/холда
                    const dist = Math.sqrt(Math.pow(touch.clientX - this.tapStartX, 2) + Math.pow(touch.clientY - this.tapStartY, 2));
                    if (dist > this.dragThreshold) {
                        this.isDrag = true;
                        // Если начали двигать, отменяем ломание
                        if (this.interactionTimer) clearTimeout(this.interactionTimer);
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
                    
                    // Очищаем таймер (если палец отпустили раньше 300мс)
                    if (this.interactionTimer) clearTimeout(this.interactionTimer);

                    if (this.isBreaking) {
                        // Если мы ломали, то прекращаем
                        this.isBreaking = false;
                        this.inputManager.emulateMouseHold(0, false);
                    } else if (!this.isDrag) {
                        // Если это был не драг и не холд -> значит ТАП
                        // Ставим блок (ПКМ)
                        this.inputManager.emulateMouseClick(2);
                    }
                }
            }
        };
        document.addEventListener('touchend', endLook);
        document.addEventListener('touchcancel', endLook);

        // --- Кнопки ---
        const btnJump = document.getElementById('btn-jump');
        btnJump.addEventListener('touchstart', (e) => { e.preventDefault(); e.stopPropagation(); this.inputManager.emulateKey('Space', true); });
        btnJump.addEventListener('touchend', (e) => { e.preventDefault(); e.stopPropagation(); this.inputManager.emulateKey('Space', false); });

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

        // ИНВЕНТАРЬ
        const btnInv = document.getElementById('btn-inv-mobile');
        btnInv.addEventListener('touchstart', (e) => {
            e.preventDefault(); e.stopPropagation();
            this.uiManager.toggleInventory();
        });

        // ПАУЗА / НАСТРОЙКИ
        const btnPause = document.getElementById('btn-pause-mobile');
        btnPause.addEventListener('touchstart', (e) => {
            e.preventDefault(); e.stopPropagation();
            // Вызываем паузу принудительно
            this.inputManager.setPaused(true);
        });
    }

    updateJoystick(x, y) {
        const maxRadius = 70; // Чуть больше для удобства
        let dx = x - this.origin.x;
        let dy = y - this.origin.y;
        
        const distance = Math.sqrt(dx*dx + dy*dy);
        if (distance > maxRadius) {
            const ratio = maxRadius / distance;
            dx *= ratio;
            dy *= ratio;
        }
        
        this.joystickKnob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
        
        // Нормализуем (-1 до 1)
        this.joystickVector.x = dx / maxRadius;
        this.joystickVector.y = dy / maxRadius;
        
        this.inputManager.setJoystickInput(this.joystickVector.x, this.joystickVector.y);
    }

    resetJoystick() {
        this.joystickKnob.style.transform = `translate(-50%, -50%)`;
        this.joystickVector = { x: 0, y: 0 };
        this.inputManager.setJoystickInput(0, 0);
    }
}