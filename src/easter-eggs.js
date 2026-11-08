/**
 * 🥚 Easter Eggs Collection
 * Six hidden surprises for the portfolio site
 */
(function () {
    'use strict';

    // Global triggers for manual activation from DevTools console
    window.triggerUFO = function () {
        if (typeof launchUFO === 'function') launchUFO();
    };
    window.launchUFO = window.triggerUFO;
    window.triggerMatrix = function () {
        if (typeof startMatrixRain === 'function') startMatrixRain();
    };
    window.triggerCRT = function () {
        if (typeof toggleCRTMode === 'function') toggleCRTMode();
    };
    window.triggerStarCatcher = function () {
        if (typeof launchStarCatcher === 'function') launchStarCatcher();
    };
    window.triggerConstellation = function () {
        if (typeof activateConstellation === 'function') activateConstellation();
    };
    window.triggerVinyl = function () {
        if (typeof spinAvatarManually === 'function') spinAvatarManually();
    };

    /* ======================================================================
       1. KONAMI CODE → Matrix Rain
       ↑↑↓↓←→←→BA  triggers a 12-second Matrix digital rain overlay
       ====================================================================== */
    const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
    let konamiIndex = 0;
    let matrixActive = false;

    window.addEventListener('keydown', (e) => {
        if (e.key === KONAMI[konamiIndex]) {
            konamiIndex++;
            if (konamiIndex === KONAMI.length) {
                konamiIndex = 0;
                if (!matrixActive) startMatrixRain();
            }
        } else {
            konamiIndex = e.key === KONAMI[0] ? 1 : 0;
        }
    });

    function startMatrixRain() {
        matrixActive = true;
        const canvas = document.createElement('canvas');
        canvas.className = 'easter-matrix-canvas';
        document.body.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        let w = canvas.width = window.innerWidth;
        let h = canvas.height = window.innerHeight;

        const fontSize = 15;
        const cols = Math.floor(w / fontSize);
        const drops = new Array(cols).fill(1);
        const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF</>{}();=+'.split('');

        // Fade in
        requestAnimationFrame(() => canvas.style.opacity = '1');

        function draw() {
            ctx.fillStyle = 'rgba(28, 29, 29, 0.06)';
            ctx.fillRect(0, 0, w, h);

            ctx.font = `${fontSize}px monospace`;

            for (let i = 0; i < cols; i++) {
                const char = chars[Math.floor(Math.random() * chars.length)];
                const x = i * fontSize;
                const y = drops[i] * fontSize;

                // Head glow: bright lime, trail: dimmer
                if (Math.random() > 0.5) {
                    ctx.fillStyle = '#DFFFB3';
                    ctx.shadowColor = '#DFFFB3';
                    ctx.shadowBlur = 8;
                } else {
                    ctx.fillStyle = 'rgba(64, 77, 45, 0.7)';
                    ctx.shadowBlur = 0;
                }

                ctx.fillText(char, x, y);
                ctx.shadowBlur = 0;

                if (y > h && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        }

        const matrixInterval = setInterval(draw, 40);

        // Auto-dismiss after 12 seconds
        setTimeout(() => {
            canvas.style.opacity = '0';
            setTimeout(() => {
                clearInterval(matrixInterval);
                canvas.remove();
                matrixActive = false;
            }, 1000);
        }, 12000);
    }


    /* ======================================================================
       2. SECRET SEARCH COMMANDS
       Type 'sudo hire me' or '> kernel panic' in the search bar
       ====================================================================== */
    const searchBar = document.getElementById('search-bar');
    const secretCommands = {
        'sudo hire me': {
            message: '$ sudo hire me\nPassword: ********\n\n✓ Access granted.\n✓ Loading resume...\n✓ Skills verified.\n\n>> Ready to deploy. 🚀',
            color: '#DFFFB3'
        },
        '> kernel panic': {
            message: 'KERNEL PANIC - not syncing:\nVFS: Unable to mount root fs\non unknown-block(0,0)\n\n---[ end Kernel panic - not syncing ]---\n\n...just kidding 😄\nEverything is fine here.',
            color: '#ff6b6b'
        },
        'rm -rf /': {
            message: '$ rm -rf /\nrm: refusing to remove \'/\'\nwithout --no-preserve-root\n\n¯\\_(ツ)_/¯\nNice try though.',
            color: '#ffd93d'
        },
        'hello world': {
            message: '#include <stdio.h>\n\nint main() {\n    printf("Hello, visitor!\\n");\n    printf("Welcome to my portfolio.\\n");\n    return 0;\n}',
            color: '#DFFFB3'
        }
    };

    let lastSearchValue = '';
    if (searchBar) {
        searchBar.addEventListener('input', () => {
            const val = searchBar.value.toLowerCase().trim();

            // Silent triggers without opening terminal
            if (val === 'ufo' || val === 'alien') {
                window.triggerUFO();
                setTimeout(() => {
                    searchBar.value = '';
                    searchBar.dispatchEvent(new Event('input'));
                }, 200);
                return;
            }

            if (val !== lastSearchValue) {
                lastSearchValue = val;
                const cmd = secretCommands[val];
                if (cmd) {
                    showTerminalOverlay(cmd.message, cmd.color);
                    // Reset search after a moment
                    setTimeout(() => {
                        searchBar.value = '';
                        searchBar.dispatchEvent(new Event('input'));
                    }, 300);
                }
            }
        });
    }

    function showTerminalOverlay(message, accentColor) {
        if (document.querySelector('.easter-terminal')) return;

        const overlay = document.createElement('div');
        overlay.className = 'easter-terminal';
        overlay.innerHTML = `
            <div class="easter-terminal-window">
                <div class="easter-terminal-header">
                    <span class="terminal-dot red"></span>
                    <span class="terminal-dot yellow"></span>
                    <span class="terminal-dot green"></span>
                    <span class="terminal-title">terminal</span>
                </div>
                <pre class="easter-terminal-body" style="--accent: ${accentColor}"></pre>
            </div>
        `;
        document.body.appendChild(overlay);

        requestAnimationFrame(() => overlay.classList.add('visible'));

        // Typewriter effect
        const body = overlay.querySelector('.easter-terminal-body');
        let i = 0;
        const typeInterval = setInterval(() => {
            if (i < message.length) {
                body.textContent += message[i];
                i++;
            } else {
                clearInterval(typeInterval);
                body.textContent += '\n█';
                // Blinking cursor
                let blink = true;
                const blinkInterval = setInterval(() => {
                    const text = body.textContent;
                    body.textContent = blink ? text.replace('█', ' ') : text.replace(/\s$/, '█');
                    blink = !blink;
                }, 500);

                setTimeout(() => {
                    clearInterval(blinkInterval);
                    overlay.classList.remove('visible');
                    setTimeout(() => overlay.remove(), 500);
                }, 4000);
            }
        }, 30);

        overlay.addEventListener('click', () => {
            clearInterval(typeInterval);
            overlay.classList.remove('visible');
            setTimeout(() => overlay.remove(), 500);
        });
    }


    /* ======================================================================
       3. TRIPLE-CLICK LOGO → CRT Terminal Mode
       3 rapid clicks on "PORTFOLIO" header logo toggle retro CRT mode
       ====================================================================== */
    const headerLogo = document.getElementById('home-button');
    let logoClickCount = 0;
    let logoClickTimer = null;
    let crtActive = false;

    if (headerLogo) {
        headerLogo.addEventListener('click', () => {
            logoClickCount++;
            clearTimeout(logoClickTimer);

            logoClickTimer = setTimeout(() => {
                if (logoClickCount >= 3) {
                    toggleCRTMode();
                }
                logoClickCount = 0;
            }, 400);
        });
    }

    function toggleCRTMode() {
        crtActive = !crtActive;
        document.body.classList.toggle('easter-crt-mode', crtActive);

        if (crtActive) {
            // Show "access granted" banner
            const banner = document.createElement('div');
            banner.className = 'easter-crt-banner';
            banner.innerHTML = `
                <div class="crt-banner-text">
                    <span class="crt-line">SYSTEM OVERRIDE</span>
                    <span class="crt-line accent">ACCESS GRANTED</span>
                    <span class="crt-line small">[ click logo 3x to exit ]</span>
                </div>
            `;
            document.body.appendChild(banner);

            requestAnimationFrame(() => banner.classList.add('visible'));

            setTimeout(() => {
                banner.classList.remove('visible');
                setTimeout(() => banner.remove(), 600);
            }, 2500);
        }
    }


    /* ======================================================================
       4. 404 MINI-GAME — Star Catcher
       Activated when docs.html returns 404 or via console command
       Can also be triggered by typing '404' in search
       ====================================================================== */
    if (searchBar) {
        searchBar.addEventListener('input', () => {
            if (searchBar.value.trim() === '404') {
                searchBar.value = '';
                searchBar.dispatchEvent(new Event('input'));
                launchStarCatcher();
            }
        });
    }

    function launchStarCatcher() {
        if (document.querySelector('.easter-game-overlay')) return;

        const overlay = document.createElement('div');
        overlay.className = 'easter-game-overlay';
        overlay.innerHTML = `
            <canvas class="easter-game-canvas"></canvas>
            <div class="easter-game-hud">
                <span class="game-score">⭐ 0</span>
                <span class="game-timer">30s</span>
                <button class="game-close" title="Close">✕</button>
            </div>
            <div class="easter-game-start">
                <h2>⭐ Star Catcher</h2>
                <p>Catch falling stars before they vanish!</p>
                <button class="game-start-btn">Play</button>
            </div>
        `;
        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add('visible'));

        const gameCanvas = overlay.querySelector('.easter-game-canvas');
        const ctx = gameCanvas.getContext('2d');
        const scoreEl = overlay.querySelector('.game-score');
        const timerEl = overlay.querySelector('.game-timer');
        const startScreen = overlay.querySelector('.easter-game-start');
        const startBtn = overlay.querySelector('.game-start-btn');
        const closeBtn = overlay.querySelector('.game-close');

        let gw, gh;

        function resizeGame() {
            gw = gameCanvas.width = overlay.clientWidth;
            gh = gameCanvas.height = overlay.clientHeight;
        }
        resizeGame();
        window.addEventListener('resize', resizeGame);

        let gameRunning = false;
        let score = 0;
        let timeLeft = 30;
        let stars = [];
        let particles = [];
        let mouseX = gw / 2, mouseY = gh / 2;
        let gameRaf = null;
        let gameTimer = null;

        overlay.addEventListener('mousemove', (e) => {
            const rect = overlay.getBoundingClientRect();
            mouseX = e.clientX - rect.left;
            mouseY = e.clientY - rect.top;
        });

        closeBtn.addEventListener('click', endGame);

        startBtn.addEventListener('click', () => {
            startScreen.style.display = 'none';
            gameRunning = true;
            score = 0;
            timeLeft = 30;
            stars = [];
            particles = [];

            gameTimer = setInterval(() => {
                timeLeft--;
                timerEl.textContent = `${timeLeft}s`;
                if (timeLeft <= 0) endGame();
            }, 1000);

            gameLoop();
        });

        function spawnStar() {
            stars.push({
                x: Math.random() * (gw - 40) + 20,
                y: -20,
                size: Math.random() * 12 + 8,
                speed: Math.random() * 2 + 1.5,
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 0.08,
                alpha: 1,
                glow: Math.random() * 0.5 + 0.5
            });
        }

        function spawnParticles(x, y) {
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI * 2 / 8) * i + Math.random() * 0.5;
                particles.push({
                    x, y,
                    vx: Math.cos(angle) * (2 + Math.random() * 3),
                    vy: Math.sin(angle) * (2 + Math.random() * 3),
                    life: 1,
                    size: Math.random() * 3 + 1
                });
            }
        }

        function gameLoop() {
            if (!gameRunning) return;

            ctx.clearRect(0, 0, gw, gh);

            // Background
            ctx.fillStyle = 'rgba(28, 29, 29, 0.95)';
            ctx.fillRect(0, 0, gw, gh);

            // Spawn stars
            if (Math.random() < 0.06) spawnStar();

            // Update & draw stars
            for (let i = stars.length - 1; i >= 0; i--) {
                const s = stars[i];
                s.y += s.speed;
                s.rotation += s.rotSpeed;

                // Check catch (proximity to cursor)
                const dx = s.x - mouseX;
                const dy = s.y - mouseY;
                if (Math.sqrt(dx * dx + dy * dy) < s.size + 25) {
                    score++;
                    scoreEl.textContent = `⭐ ${score}`;
                    spawnParticles(s.x, s.y);
                    stars.splice(i, 1);
                    continue;
                }

                // Remove if off-screen
                if (s.y > gh + 30) {
                    stars.splice(i, 1);
                    continue;
                }

                // Draw star
                ctx.save();
                ctx.translate(s.x, s.y);
                ctx.rotate(s.rotation);
                ctx.shadowColor = '#DFFFB3';
                ctx.shadowBlur = 10 * s.glow;
                ctx.fillStyle = '#DFFFB3';
                drawStar(ctx, 0, 0, 5, s.size, s.size * 0.45);
                ctx.restore();
            }

            // Update & draw particles
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.life -= 0.03;
                if (p.life <= 0) {
                    particles.splice(i, 1);
                    continue;
                }
                ctx.fillStyle = `rgba(223, 255, 179, ${p.life})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }

            // Draw cursor area (subtle glow)
            const gradient = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 35);
            gradient.addColorStop(0, 'rgba(223, 255, 179, 0.15)');
            gradient.addColorStop(1, 'rgba(223, 255, 179, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(mouseX, mouseY, 35, 0, Math.PI * 2);
            ctx.fill();

            gameRaf = requestAnimationFrame(gameLoop);
        }

        function drawStar(ctx, cx, cy, spikes, outer, inner) {
            let rot = Math.PI / 2 * 3;
            const step = Math.PI / spikes;
            ctx.beginPath();
            ctx.moveTo(cx, cy - outer);
            for (let i = 0; i < spikes; i++) {
                ctx.lineTo(cx + Math.cos(rot) * outer, cy + Math.sin(rot) * outer);
                rot += step;
                ctx.lineTo(cx + Math.cos(rot) * inner, cy + Math.sin(rot) * inner);
                rot += step;
            }
            ctx.closePath();
            ctx.fill();
        }

        function endGame() {
            gameRunning = false;
            clearInterval(gameTimer);
            cancelAnimationFrame(gameRaf);

            // Show final score
            ctx.fillStyle = 'rgba(28, 29, 29, 0.85)';
            ctx.fillRect(0, 0, gw, gh);

            ctx.fillStyle = '#DFFFB3';
            ctx.font = 'bold 36px "Google Sans Flex", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`⭐ ${score} stars caught!`, gw / 2, gh / 2 - 10);
            ctx.font = '16px "Google Sans Flex", sans-serif';
            ctx.fillStyle = '#8a8e7a';
            ctx.fillText('click anywhere to close', gw / 2, gh / 2 + 30);

            overlay.addEventListener('click', () => {
                overlay.classList.remove('visible');
                setTimeout(() => overlay.remove(), 500);
            }, { once: true });
        }
    }


    /* ======================================================================
       5. IDLE ANIMATION — Full-Width Star Cluster Constellation </> (No Lines)
       After 25s of inactivity, stars across the entire sky converge to form
       a giant </> constellation made purely of twinkling stars and star dust.
       ====================================================================== */
    let idleTimer = null;
    let idleConstellationActive = false;

    function resetIdleTimer() {
        clearTimeout(idleTimer);
        if (idleConstellationActive) {
            deactivateConstellation();
        }
        idleTimer = setTimeout(activateConstellation, 25000);
    }

    function generateConstellationStars(w, h) {
        const stars = [];

        // Helper: creates a stream of stars along a line segment
        function addSegmentStars(x1, y1, x2, y2, count, jitter, isMajorSegment) {
            const dx = x2 - x1;
            const dy = y2 - y1;
            const len = Math.hypot(dx, dy) || 1;
            const nx = -dy / len;
            const ny = dx / len;

            for (let i = 0; i <= count; i++) {
                const t = i / count;
                const baseX = x1 + dx * t;
                const baseY = y1 + dy * t;
                const isAnchor = (i === 0 || i === count);

                const jitDist = isAnchor ? 0 : (Math.random() - 0.5) * jitter;
                const randOffset = (Math.random() - 0.5) * 3;

                const starSize = isAnchor ? (3.2 + Math.random() * 1.0) : (1.1 + Math.random() * 1.8);
                const baseAlpha = isAnchor ? 1.0 : (0.5 + Math.random() * 0.45);

                stars.push({
                    targetX: baseX + nx * jitDist + randOffset,
                    targetY: baseY + ny * jitDist + randOffset,
                    x: Math.random() * w,
                    y: Math.random() * h,
                    size: starSize,
                    isAnchor: isAnchor && isMajorSegment,
                    baseAlpha: baseAlpha,
                    twinkleSpeed: 0.02 + Math.random() * 0.04,
                    phase: Math.random() * Math.PI * 2,
                    alpha: 0,
                    delay: Math.floor(Math.random() * 18)
                });
            }
        }

        // Full-screen width geometry for < / >
        const topY = h * 0.16;
        const midY = h * 0.40;
        const botY = h * 0.64;

        // < (Left side of screen)
        const leftTipX = Math.max(30, w * 0.05);
        const leftEndX = Math.min(w * 0.28, leftTipX + 240);
        addSegmentStars(leftEndX, topY, leftTipX, midY, 28, 7, true);
        addSegmentStars(leftTipX, midY, leftEndX, botY, 28, 7, true);

        // / (Middle of screen)
        const slashTopX = w * 0.58;
        const slashTopY = h * 0.12;
        const slashBotX = w * 0.42;
        const slashBotY = h * 0.68;
        addSegmentStars(slashBotX, slashBotY, slashTopX, slashTopY, 46, 8, true);

        // > (Right side of screen)
        const rightTipX = Math.min(w - 30, w * 0.95);
        const rightEndX = Math.max(w * 0.72, rightTipX - 240);
        addSegmentStars(rightEndX, topY, rightTipX, midY, 28, 7, true);
        addSegmentStars(rightTipX, midY, rightEndX, botY, 28, 7, true);

        // Ambient star cluster dust around the lines (nebula feel)
        const coreLength = stars.length;
        for (let i = 0; i < 65; i++) {
            const anchor = stars[Math.floor(Math.random() * coreLength)];
            const angle = Math.random() * Math.PI * 2;
            const dist = 8 + Math.random() * 32;
            stars.push({
                targetX: anchor.targetX + Math.cos(angle) * dist,
                targetY: anchor.targetY + Math.sin(angle) * dist,
                x: Math.random() * w,
                y: Math.random() * h,
                size: 0.8 + Math.random() * 1.1,
                isAnchor: false,
                baseAlpha: 0.25 + Math.random() * 0.35,
                twinkleSpeed: 0.015 + Math.random() * 0.03,
                phase: Math.random() * Math.PI * 2,
                alpha: 0,
                delay: 10 + Math.floor(Math.random() * 25)
            });
        }

        return stars;
    }

    function activateConstellation() {
        const spaceCanvas = document.getElementById('space-horizon-canvas');
        if (!spaceCanvas) return;

        idleConstellationActive = true;

        const conCanvas = document.createElement('canvas');
        conCanvas.className = 'easter-constellation-canvas';
        conCanvas.width = window.innerWidth;
        conCanvas.height = window.innerHeight;
        document.body.appendChild(conCanvas);

        requestAnimationFrame(() => conCanvas.style.opacity = '1');

        const ctx = conCanvas.getContext('2d');
        let w = conCanvas.width;
        let h = conCanvas.height;

        let stars = generateConstellationStars(w, h);

        window.addEventListener('resize', () => {
            if (!idleConstellationActive) return;
            w = conCanvas.width = window.innerWidth;
            h = conCanvas.height = window.innerHeight;
            stars = generateConstellationStars(w, h);
        });

        let frame = 0;

        function drawConstellation() {
            if (!idleConstellationActive) {
                conCanvas.style.opacity = '0';
                setTimeout(() => conCanvas.remove(), 1800);
                return;
            }

            frame++;
            ctx.clearRect(0, 0, w, h);

            stars.forEach(s => {
                if (frame < s.delay) return;

                // Smooth drift toward constellation position
                const dx = s.targetX - s.x;
                const dy = s.targetY - s.y;
                s.x += dx * 0.028;
                s.y += dy * 0.028;
                s.alpha = Math.min(s.baseAlpha, s.alpha + 0.012);

                // Twinkle
                const twinkle = Math.sin(frame * s.twinkleSpeed + s.phase) * 0.22;
                const currentAlpha = Math.max(0.1, Math.min(1.0, s.alpha + twinkle));

                // Pure star drawing without any connecting lines
                ctx.fillStyle = `rgba(223, 255, 179, ${currentAlpha})`;
                ctx.shadowColor = '#DFFFB3';
                ctx.shadowBlur = s.isAnchor ? 12 : 5;
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;

                // Astronomical diffraction spike on major anchor stars
                if (s.isAnchor && currentAlpha > 0.65) {
                    const spikeLen = s.size * 3.4;
                    ctx.strokeStyle = `rgba(223, 255, 179, ${currentAlpha * 0.35})`;
                    ctx.lineWidth = 0.9;
                    ctx.beginPath();
                    ctx.moveTo(s.x - spikeLen, s.y);
                    ctx.lineTo(s.x + spikeLen, s.y);
                    ctx.moveTo(s.x, s.y - spikeLen);
                    ctx.lineTo(s.x, s.y + spikeLen);
                    ctx.stroke();
                }
            });

            requestAnimationFrame(drawConstellation);
        }

        requestAnimationFrame(drawConstellation);
    }

    function deactivateConstellation() {
        idleConstellationActive = false;
    }

    window.addEventListener('mousemove', resetIdleTimer, { passive: true });
    window.addEventListener('keydown', resetIdleTimer);
    window.addEventListener('scroll', resetIdleTimer, { passive: true });
    window.addEventListener('click', resetIdleTimer);
    resetIdleTimer();


    /* ======================================================================
       6. DRAG & DROP AVATAR → Vinyl Spin
       Drag the about-page avatar to make it spin like a vinyl record
       ====================================================================== */
    function initAvatarVinyl() {
        const avatar = document.querySelector('.about-avatar');
        if (!avatar) return;

        let isDragging = false;
        let spinning = false;
        let spinAngle = 0;
        let spinSpeed = 0;
        let spinRaf = null;

        avatar.setAttribute('draggable', 'false');
        avatar.style.cursor = 'grab';

        avatar.addEventListener('mousedown', (e) => {
            e.preventDefault();
            isDragging = true;
            avatar.style.cursor = 'grabbing';
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            spinSpeed = Math.min(spinSpeed + 0.3, 12);
            if (!spinning) {
                spinning = true;
                avatar.classList.add('easter-vinyl-spin');
                spinVinyl();
            }
        }, { passive: true });

        window.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                avatar.style.cursor = 'grab';
            }
        });

        function spinVinyl() {
            if (!spinning) return;

            spinAngle += spinSpeed;
            avatar.style.transform = `rotate(${spinAngle}deg)`;

            if (!isDragging) {
                spinSpeed *= 0.985; // Slow deceleration for smooth spin-down
            }

            if (spinSpeed < 0.05) {
                spinning = false;
                spinSpeed = 0;
                avatar.classList.remove('easter-vinyl-spin');
                // Slowly return to 0
                const currentAngle = spinAngle % 360;
                avatar.style.transition = 'transform 0.8s cubic-bezier(0.25, 1, 0.5, 1)';
                avatar.style.transform = `rotate(0deg)`;
                setTimeout(() => {
                    avatar.style.transition = '';
                    spinAngle = 0;
                }, 800);
                return;
            }

            spinRaf = requestAnimationFrame(spinVinyl);
        }

        // Double-click for instant full-speed spin
        avatar.addEventListener('dblclick', (e) => {
            e.preventDefault();
            spinSpeed = 8;
            if (!spinning) {
                spinning = true;
                avatar.classList.add('easter-vinyl-spin');
                spinVinyl();
            }
        });
    }

    function spinAvatarManually() {
        const aboutBtn = document.querySelector('[data-view="about"]');
        if (aboutBtn && !aboutBtn.classList.contains('active')) {
            aboutBtn.click();
        }
        setTimeout(() => {
            const avatar = document.querySelector('.about-avatar');
            if (avatar) {
                avatar.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
            }
        }, 150);
    }

    // Re-init avatar vinyl when about view becomes visible
    const observer = new MutationObserver(() => {
        const aboutView = document.getElementById('view-about');
        if (aboutView && aboutView.classList.contains('visible')) {
            initAvatarVinyl();
        }
    });

    const viewAbout = document.getElementById('view-about');
    if (viewAbout) {
        observer.observe(viewAbout, { attributes: true, attributeFilter: ['class'] });
    }

    // Also init on DOMContentLoaded if already visible
    if (viewAbout && viewAbout.classList.contains('visible')) {
        initAvatarVinyl();
    }


    /* ======================================================================
       7. AMBIENT FLYING SAUCER (UFO Abduction at Bottom Planet)
       Subtle retro-futuristic saucer flies down to the bottom horizon planet,
       hovers, beams up a specimen (cow/crystal/star) right from the planet surface,
       then warps up into deep space.
       ====================================================================== */
    let ufoCanvas = null;
    let ufoCtx = null;
    let ufoActive = false;
    let ufoState = 'idle'; // idle | enter | beam | abduct | zap | warp
    let ufoTimer = null;

    let ufoX = 0, ufoY = 0;
    let ufoTargetX = 0, ufoTargetY = 0;
    let ufoTilt = 0;
    let ufoSpeedX = 0, ufoSpeedY = 0;
    let ufoLightsPhase = 0;
    let beamProgress = 0;
    let beamRingsTime = 0;

    let abducteeType = 'cow'; // 'cow' | 'star' | 'crystal'
    let abducteeY = 0;
    let abducteeProgress = 0;
    let abducteeRot = 0;
    let abducteeAlpha = 0;

    const ufoSparks = [];
    const warpTrails = [];

    function ensureUFOCanvas() {
        if (!ufoCanvas) {
            ufoCanvas = document.createElement('canvas');
            ufoCanvas.className = 'easter-ufo-canvas';
            ufoCanvas.width = window.innerWidth;
            ufoCanvas.height = window.innerHeight;
            document.body.appendChild(ufoCanvas);
            ufoCtx = ufoCanvas.getContext('2d');

            window.addEventListener('resize', () => {
                if (ufoCanvas) {
                    ufoCanvas.width = window.innerWidth;
                    ufoCanvas.height = window.innerHeight;
                }
            });
        }
    }

    function launchUFO() {
        if (ufoActive) return;
        ensureUFOCanvas();

        ufoActive = true;
        ufoState = 'enter';

        const w = ufoCanvas.width;
        const h = ufoCanvas.height;

        // Choose random entrance side
        const fromLeft = Math.random() > 0.5;
        ufoX = fromLeft ? -130 : w + 130;
        ufoY = 50 + Math.random() * 80;

        // Fly down to the bottom planet horizon!
        ufoTargetX = fromLeft
            ? Math.max(90, Math.min(w * 0.22, 280))
            : Math.min(w - 90, Math.max(w * 0.78, w - 280));

        // Height of the planet surface at ufoTargetX (matching particle.js dome)
        const normX = Math.max(0, Math.min(1, ufoTargetX / w));
        const planetArch = Math.sin(normX * Math.PI) * (h * 0.22);
        const planetSurfaceY = h - planetArch;

        // Hover directly above the planet surface
        ufoTargetY = planetSurfaceY - 145;

        ufoSpeedX = fromLeft ? 5 : -5;
        ufoSpeedY = 0;
        ufoTilt = fromLeft ? 0.2 : -0.2;
        beamProgress = 0;

        // Pick abductee
        const types = ['cow', 'star', 'crystal'];
        abducteeType = types[Math.floor(Math.random() * types.length)];
        abducteeProgress = 0;
        abducteeRot = 0;
        abducteeAlpha = 0;

        ufoSparks.length = 0;
        warpTrails.length = 0;

        requestAnimationFrame(renderUFO);
    }

    function renderUFO() {
        if (!ufoActive || !ufoCtx) return;

        const w = ufoCanvas.width;
        const h = ufoCanvas.height;
        ufoCtx.clearRect(0, 0, w, h);

        beamRingsTime += 0.04;
        ufoLightsPhase += 0.08;

        // Planet surface calculation at current X
        const currentNormX = Math.max(0, Math.min(1, ufoX / w));
        const planetArch = Math.sin(currentNormX * Math.PI) * (h * 0.22);
        const planetSurfaceY = h - planetArch;
        const fullBeamLength = Math.max(110, planetSurfaceY - (ufoY + 12));

        // State Machine
        if (ufoState === 'enter') {
            const dx = ufoTargetX - ufoX;
            const dy = ufoTargetY - ufoY;
            ufoX += dx * 0.042;
            ufoY += dy * 0.042 + Math.sin(beamRingsTime * 2) * 0.5;
            ufoTilt = (dx * 0.002);

            if (Math.abs(dx) < 6 && Math.abs(dy) < 8) {
                ufoState = 'beam';
            }
        } else if (ufoState === 'beam') {
            ufoY += Math.sin(beamRingsTime * 2.5) * 0.4;
            ufoTilt *= 0.9;
            beamProgress = Math.min(1.0, beamProgress + 0.045);

            if (beamProgress >= 1.0) {
                ufoState = 'abduct';
                abducteeAlpha = 1.0;
            }
        } else if (ufoState === 'abduct') {
            ufoY += Math.sin(beamRingsTime * 2.5) * 0.4;
            abducteeProgress = Math.min(1.0, abducteeProgress + 0.015);
            abducteeRot += 0.05;

            // Lift object right off the bottom planet surface into saucer
            abducteeY = (planetSurfaceY - 4) - ((fullBeamLength - 4) * abducteeProgress);

            if (abducteeProgress >= 0.98) {
                // Zap & suck inside
                ufoState = 'zap';
                abducteeAlpha = 0;

                // Burst of sparks
                for (let i = 0; i < 20; i++) {
                    const ang = Math.random() * Math.PI * 2;
                    const spd = 2 + Math.random() * 3.5;
                    ufoSparks.push({
                        x: ufoX,
                        y: ufoY + 12,
                        vx: Math.cos(ang) * spd,
                        vy: Math.sin(ang) * spd,
                        life: 1.0,
                        decay: 0.04 + Math.random() * 0.03,
                        size: 1.2 + Math.random() * 2
                    });
                }
            }
        } else if (ufoState === 'zap') {
            beamProgress = Math.max(0, beamProgress - 0.12);
            ufoTilt = (ufoX < w * 0.5 ? 0.35 : -0.35); // Tilt upward for space escape

            if (beamProgress <= 0.01) {
                ufoState = 'warp';
                // Accelerate upward into deep space
                ufoSpeedX = (ufoX < w * 0.5 ? 18 : -18);
                ufoSpeedY = -22;
            }
        } else if (ufoState === 'warp') {
            // Accelerate exponentially up into space
            ufoSpeedX *= 1.26;
            ufoSpeedY *= 1.24;
            ufoX += ufoSpeedX;
            ufoY += ufoSpeedY;
            ufoTilt = Math.atan2(ufoSpeedY, ufoSpeedX) + (ufoSpeedX < 0 ? Math.PI : 0);

            // Warp speed streak trail
            warpTrails.push({
                x: ufoX,
                y: ufoY,
                vx: -ufoSpeedX * 0.4,
                vy: -ufoSpeedY * 0.4,
                alpha: 0.9,
                len: Math.hypot(ufoSpeedX, ufoSpeedY) * 2
            });

            // Off-screen check
            if (ufoX < -250 || ufoX > w + 250 || ufoY < -200) {
                ufoActive = false;
                ufoState = 'idle';
                ufoCtx.clearRect(0, 0, w, h);
                scheduleNextUFO();
                return;
            }
        }

        // Draw Warp Trails
        for (let i = warpTrails.length - 1; i >= 0; i--) {
            const tr = warpTrails[i];
            tr.alpha -= 0.06;
            if (tr.alpha <= 0) {
                warpTrails.splice(i, 1);
                continue;
            }
            ufoCtx.strokeStyle = `rgba(223, 255, 179, ${tr.alpha * 0.6})`;
            ufoCtx.lineWidth = 3;
            ufoCtx.beginPath();
            ufoCtx.moveTo(tr.x, tr.y);
            ufoCtx.lineTo(tr.x + tr.vx, tr.y + tr.vy);
            ufoCtx.stroke();
        }

        // Draw Tractor Beam down to planet surface
        if (beamProgress > 0.01) {
            drawTractorBeam(ufoCtx, ufoX, ufoY + 12, ufoTilt, beamProgress, beamRingsTime, fullBeamLength);
        }

        // Draw Abductee
        if (abducteeAlpha > 0 && ufoState === 'abduct') {
            const scale = 0.55 + 0.45 * (1.0 - abducteeProgress * 0.45);
            drawAbductee(ufoCtx, abducteeType, ufoX, abducteeY, abducteeRot, scale, abducteeAlpha);
        }

        // Draw Sparks
        for (let i = ufoSparks.length - 1; i >= 0; i--) {
            const sp = ufoSparks[i];
            sp.x += sp.vx;
            sp.y += sp.vy;
            sp.life -= sp.decay;
            if (sp.life <= 0) {
                ufoSparks.splice(i, 1);
                continue;
            }
            ufoCtx.fillStyle = `rgba(223, 255, 179, ${sp.life})`;
            ufoCtx.shadowColor = '#DFFFB3';
            ufoCtx.shadowBlur = 8;
            ufoCtx.beginPath();
            ufoCtx.arc(sp.x, sp.y, sp.size * sp.life, 0, Math.PI * 2);
            ufoCtx.fill();
            ufoCtx.shadowBlur = 0;
        }

        // Draw Saucer
        drawSaucer(ufoCtx, ufoX, ufoY, ufoTilt, ufoLightsPhase, 1.0, 1.0);

        requestAnimationFrame(renderUFO);
    }

    function drawSaucer(ctx, x, y, tilt, lightsPhase, scale, alpha) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(tilt);
        ctx.scale(scale, scale);
        ctx.globalAlpha = alpha;

        const width = 86;
        const height = 24;

        // 1. Cockpit glass dome (glowing cyan-lime)
        const domeGrad = ctx.createRadialGradient(-4, -13, 2, 0, -8, 22);
        domeGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        domeGrad.addColorStop(0.3, 'rgba(223, 255, 179, 0.7)');
        domeGrad.addColorStop(0.7, 'rgba(64, 77, 45, 0.4)');
        domeGrad.addColorStop(1, 'rgba(28, 29, 29, 0.2)');
        ctx.fillStyle = domeGrad;
        ctx.beginPath();
        ctx.ellipse(0, -6, width * 0.28, height * 0.75, 0, Math.PI, 0);
        ctx.fill();

        // Glowing core/pilot inside dome
        ctx.fillStyle = '#DFFFB3';
        ctx.shadowColor = '#DFFFB3';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(0, -9, 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // 2. Main metallic saucer body
        const bodyGrad = ctx.createLinearGradient(0, -height * 0.5, 0, height * 0.6);
        bodyGrad.addColorStop(0, '#3e4933');
        bodyGrad.addColorStop(0.3, '#2a3324');
        bodyGrad.addColorStop(0.7, '#1f251a');
        bodyGrad.addColorStop(1, '#141811');

        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, width * 0.5, height * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Neon rim outline
        ctx.strokeStyle = 'rgba(223, 255, 179, 0.65)';
        ctx.lineWidth = 1.3;
        ctx.stroke();

        // 3. Bottom tractor beam emitter
        ctx.fillStyle = 'rgba(223, 255, 179, 0.95)';
        ctx.shadowColor = '#DFFFB3';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.ellipse(0, height * 0.35, width * 0.18, height * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // 4. Perimeter running lights (8 pulsing LEDs)
        const numLights = 8;
        for (let i = 0; i < numLights; i++) {
            const ang = (i / numLights) * Math.PI * 2 + lightsPhase;
            const lx = Math.cos(ang) * (width * 0.44);
            const ly = Math.sin(ang) * (height * 0.38);

            const isFront = Math.sin(ang) > -0.2;
            const lAlpha = isFront ? (0.5 + 0.5 * Math.sin(lightsPhase * 2 + i * 1.2)) : 0.25;

            ctx.fillStyle = (i % 2 === 0) ? `rgba(223, 255, 179, ${lAlpha})` : `rgba(255, 255, 255, ${lAlpha})`;
            ctx.beginPath();
            ctx.arc(lx, ly, 1.8, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    function drawTractorBeam(ctx, x, y, tilt, progress, time, maxBeamLen) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(tilt);

        const startY = 0;
        const targetLen = maxBeamLen || 210;
        const topRadius = 14;
        const bottomRadius = 38 + Math.min(55, targetLen * 0.26) + Math.sin(time * 3) * 4;
        const beamLength = targetLen * progress;

        // Conical glowing gradient down to the planet surface
        const beamGrad = ctx.createLinearGradient(0, startY, 0, startY + beamLength);
        beamGrad.addColorStop(0, `rgba(223, 255, 179, ${0.45 * progress})`);
        beamGrad.addColorStop(0.35, `rgba(223, 255, 179, ${0.25 * progress})`);
        beamGrad.addColorStop(0.75, `rgba(223, 255, 179, ${0.10 * progress})`);
        beamGrad.addColorStop(1, 'rgba(223, 255, 179, 0)');

        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.moveTo(-topRadius, startY);
        ctx.lineTo(topRadius, startY);
        ctx.lineTo(bottomRadius, startY + beamLength);
        ctx.lineTo(-bottomRadius, startY + beamLength);
        ctx.closePath();
        ctx.fill();

        // Pulsing ascending energy rings
        const numRings = 4;
        for (let i = 0; i < numRings; i++) {
            const ringProgress = ((time * 0.5 + i / numRings) % 1.0);
            const ry = startY + beamLength * (1.0 - ringProgress);
            const rw = topRadius + (bottomRadius - topRadius) * (1.0 - ringProgress);
            const ringAlpha = Math.sin(ringProgress * Math.PI) * 0.35 * progress;

            ctx.strokeStyle = `rgba(223, 255, 179, ${ringAlpha})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.ellipse(0, ry, rw * 0.9, 4, 0, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();
    }

    function drawAbductee(ctx, type, x, y, rot, scale, alpha) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);
        ctx.scale(scale, scale);
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

        if (type === 'cow') {
            // Cute tiny cow 🐄
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.roundRect(-12, -7, 24, 14, 4);
            ctx.fill();

            // Black patches
            ctx.fillStyle = '#222222';
            ctx.beginPath();
            ctx.arc(-4, -2, 4, 0, Math.PI * 2);
            ctx.arc(5, 1, 3.5, 0, Math.PI * 2);
            ctx.fill();

            // Head
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.roundRect(9, -9, 10, 10, 2);
            ctx.fill();

            // Pink snout
            ctx.fillStyle = '#ffb6c1';
            ctx.beginPath();
            ctx.roundRect(14, -6, 5, 6, 2);
            ctx.fill();

            // Eye
            ctx.fillStyle = '#000000';
            ctx.fillRect(12, -7, 1.5, 1.5);

            // Legs
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-9, 7, 3, 6);
            ctx.fillRect(-3, 7, 3, 6);
            ctx.fillRect(3, 7, 3, 6);
            ctx.fillRect(8, 7, 3, 6);

            // Hooves
            ctx.fillStyle = '#222222';
            ctx.fillRect(-9, 11, 3, 2);
            ctx.fillRect(-3, 11, 3, 2);
            ctx.fillRect(3, 11, 3, 2);
            ctx.fillRect(8, 11, 3, 2);
        } else if (type === 'crystal') {
            // Glowing neon crystal 💎
            ctx.fillStyle = 'rgba(223, 255, 179, 0.9)';
            ctx.shadowColor = '#DFFFB3';
            ctx.shadowBlur = 14;
            ctx.beginPath();
            ctx.moveTo(0, -14);
            ctx.lineTo(10, -3);
            ctx.lineTo(6, 12);
            ctx.lineTo(-6, 12);
            ctx.lineTo(-10, -3);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.shadowBlur = 0;
        } else {
            // Golden-lime star ⭐
            ctx.fillStyle = '#DFFFB3';
            ctx.shadowColor = '#DFFFB3';
            ctx.shadowBlur = 14;
            const spikes = 5;
            const outer = 13;
            const inner = 5.5;
            let r = Math.PI / 2 * 3;
            const step = Math.PI / spikes;
            ctx.beginPath();
            ctx.moveTo(0, -outer);
            for (let i = 0; i < spikes; i++) {
                ctx.lineTo(Math.cos(r) * outer, Math.sin(r) * outer);
                r += step;
                ctx.lineTo(Math.cos(r) * inner, Math.sin(r) * inner);
                r += step;
            }
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        ctx.restore();
    }

    function scheduleNextUFO() {
        clearTimeout(ufoTimer);
        // Random appearance between 50 and 95 seconds
        const delay = 50000 + Math.random() * 45000;
        ufoTimer = setTimeout(() => {
            launchUFO();
        }, delay);
    }

    // First UFO flyby ~22 seconds after page load
    setTimeout(() => {
        scheduleNextUFO();
    }, 22000);

})();

