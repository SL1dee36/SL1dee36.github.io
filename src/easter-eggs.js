/**
 * 🥚 Easter Eggs Collection
 * Six hidden surprises for the portfolio site
 */
(function () {

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
       5. IDLE ANIMATION — Stars form constellation
       After 30s of no mouse movement, background stars drift into </>
       ====================================================================== */
    let idleTimer = null;
    let idleConstellationActive = false;

    // The shape: </> represented as normalized points (0-1 range)
    const constellationPoints = [
        // <
        { x: 0.30, y: 0.25 }, { x: 0.15, y: 0.40 }, { x: 0.30, y: 0.55 },
        // /
        { x: 0.40, y: 0.60 }, { x: 0.55, y: 0.20 },
        // >
        { x: 0.65, y: 0.25 }, { x: 0.80, y: 0.40 }, { x: 0.65, y: 0.55 },
    ];

    function resetIdleTimer() {
        clearTimeout(idleTimer);
        if (idleConstellationActive) {
            deactivateConstellation();
        }
        idleTimer = setTimeout(activateConstellation, 30000);
    }

    function activateConstellation() {
        const spaceCanvas = document.getElementById('space-horizon-canvas');
        if (!spaceCanvas) return;

        idleConstellationActive = true;

        // Create a constellation overlay canvas
        const conCanvas = document.createElement('canvas');
        conCanvas.className = 'easter-constellation-canvas';
        conCanvas.width = window.innerWidth;
        conCanvas.height = window.innerHeight;
        document.body.appendChild(conCanvas);

        requestAnimationFrame(() => conCanvas.style.opacity = '1');

        const ctx = conCanvas.getContext('2d');
        const w = conCanvas.width;
        const h = conCanvas.height;

        // Place constellation in upper portion of screen
        const offsetX = w * 0.25;
        const offsetY = h * 0.10;
        const scaleX = w * 0.5;
        const scaleY = h * 0.5;

        // Create "star" dots that drift toward constellation positions
        const constellationStars = constellationPoints.map((cp, i) => ({
            targetX: offsetX + cp.x * scaleX,
            targetY: offsetY + cp.y * scaleY,
            x: Math.random() * w,
            y: Math.random() * h * 0.6,
            size: 2.5 + Math.random() * 1.5,
            alpha: 0,
            arrived: false,
            delay: i * 6 // frames delay
        }));

        // Extra ambient stars
        for (let i = 0; i < 20; i++) {
            const cpIdx = Math.floor(Math.random() * constellationPoints.length);
            const cp = constellationPoints[cpIdx];
            constellationStars.push({
                targetX: offsetX + cp.x * scaleX + (Math.random() - 0.5) * 60,
                targetY: offsetY + cp.y * scaleY + (Math.random() - 0.5) * 60,
                x: Math.random() * w,
                y: Math.random() * h * 0.6,
                size: 1 + Math.random(),
                alpha: 0,
                arrived: false,
                delay: 8 + i * 3
            });
        }

        let frame = 0;
        let lineAlpha = 0;

        function drawConstellation() {
            if (!idleConstellationActive) {
                conCanvas.style.opacity = '0';
                setTimeout(() => conCanvas.remove(), 1000);
                return;
            }

            frame++;
            ctx.clearRect(0, 0, w, h);

            // Move stars toward targets
            constellationStars.forEach(star => {
                if (frame < star.delay) return;

                const dx = star.targetX - star.x;
                const dy = star.targetY - star.y;
                star.x += dx * 0.025;
                star.y += dy * 0.025;
                star.alpha = Math.min(1, star.alpha + 0.015);

                if (Math.abs(dx) < 2 && Math.abs(dy) < 2) {
                    star.arrived = true;
                }

                // Draw star
                ctx.fillStyle = `rgba(223, 255, 179, ${star.alpha * 0.9})`;
                ctx.shadowColor = '#DFFFB3';
                ctx.shadowBlur = 6;
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            });

            // Draw connecting lines once stars arrive
            const mainStars = constellationStars.slice(0, constellationPoints.length);
            const allArrived = mainStars.every(s => s.arrived);
            if (allArrived) {
                lineAlpha = Math.min(0.4, lineAlpha + 0.005);
            }

            if (lineAlpha > 0) {
                ctx.strokeStyle = `rgba(223, 255, 179, ${lineAlpha})`;
                ctx.lineWidth = 1;
                ctx.setLineDash([4, 4]);

                // < lines
                ctx.beginPath();
                ctx.moveTo(mainStars[0].x, mainStars[0].y);
                ctx.lineTo(mainStars[1].x, mainStars[1].y);
                ctx.lineTo(mainStars[2].x, mainStars[2].y);
                ctx.stroke();

                // / line
                ctx.beginPath();
                ctx.moveTo(mainStars[3].x, mainStars[3].y);
                ctx.lineTo(mainStars[4].x, mainStars[4].y);
                ctx.stroke();

                // > lines
                ctx.beginPath();
                ctx.moveTo(mainStars[5].x, mainStars[5].y);
                ctx.lineTo(mainStars[6].x, mainStars[6].y);
                ctx.lineTo(mainStars[7].x, mainStars[7].y);
                ctx.stroke();

                ctx.setLineDash([]);
            }

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

})();

