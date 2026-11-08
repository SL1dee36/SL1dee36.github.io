/**
 * 🎄 Holiday Events System & Custom Background Environments
 * Seasonal visual effects, fully custom dynamic backgrounds & manual console triggers
 *
 * Console triggers available:
 *   triggerNewYear()       — Aurora Borealis, pine forest, snowfall & fireworks
 *   triggerHalloween()     — Blood Moon, spooky forest & graveyard mist, bats, pumpkins
 *   triggerValentine()     — Saturn-like ringed planet, nebula & floating hearts
 *   triggerProgrammer()    — 3D Cyber Grid horizon & binary matrix stream (Day 256)
 *   triggerPiDay()         — Floating digits of π & giant celestial pi symbol
 *   triggerCosmonautics()  — Realistic Earth from orbit view & Gagarin's Vostok rocket
 *   triggerAprilFools()    — UI tilt, element jiggle & funny placeholders
 *   stopHolidays()         — Reset and remove all active holiday effects & restore default space background
 */
(function () {
    'use strict';

    let activeRaf = null;
    let activeIntervals = [];
    let activeTimeouts = [];
    let currentCustomBg = null;

    function clearTimers() {
        if (activeRaf) {
            cancelAnimationFrame(activeRaf);
            activeRaf = null;
        }
        activeIntervals.forEach(id => clearInterval(id));
        activeIntervals = [];
        activeTimeouts.forEach(id => clearTimeout(id));
        activeTimeouts = [];
    }

    function createOverlayCanvas(id) {
        const existing = document.getElementById(id);
        if (existing) existing.remove();

        const c = document.createElement('canvas');
        c.id = id;
        c.className = 'holiday-overlay-canvas';
        c.width = window.innerWidth;
        c.height = window.innerHeight;
        document.body.appendChild(c);

        const resizeHandler = () => {
            if (c.isConnected) {
                c.width = window.innerWidth;
                c.height = window.innerHeight;
            }
        };
        window.addEventListener('resize', resizeHandler);
        return c;
    }

    function showHolidayBanner(emoji, title, subtitle, accentColor) {
        document.querySelectorAll('.holiday-banner').forEach(b => b.remove());

        const banner = document.createElement('div');
        banner.className = 'holiday-banner';
        banner.style.setProperty('--holiday-accent', accentColor);
        banner.innerHTML = `
            <div class="holiday-banner-content">
                <span class="holiday-banner-emoji">${emoji}</span>
                <div class="holiday-banner-text">
                    <strong>${title}</strong>
                    <span>${subtitle}</span>
                </div>
            </div>
        `;
        document.body.appendChild(banner);
        requestAnimationFrame(() => {
            requestAnimationFrame(() => banner.classList.add('visible'));
        });

        const tId = setTimeout(() => {
            banner.classList.remove('visible');
            setTimeout(() => banner.remove(), 600);
        }, 5000);
        activeTimeouts.push(tId);
    }

    function hideDefaultSpaceBackground() {
        const defaultSpace = document.getElementById('space-horizon-canvas');
        if (defaultSpace) {
            defaultSpace.style.display = 'none';
        }
    }

    function restoreDefaultSpaceBackground() {
        const defaultSpace = document.getElementById('space-horizon-canvas');
        if (defaultSpace) {
            defaultSpace.style.display = 'block';
        }
    }

    function stopHolidays() {
        clearTimers();
        currentCustomBg = null;

        // Remove CSS theme classes
        document.body.classList.remove(
            'holiday-newyear',
            'holiday-halloween',
            'holiday-valentine',
            'holiday-programmer',
            'holiday-piday',
            'holiday-cosmonautics',
            'holiday-aprilfools'
        );
        document.body.style.transform = '';

        // Remove all holiday canvases and banners
        document.querySelectorAll('.holiday-overlay-canvas').forEach(c => c.remove());
        document.querySelectorAll('.holiday-banner').forEach(b => b.remove());

        // Restore default background
        restoreDefaultSpaceBackground();

        // Restore search placeholder if modified by April Fools
        const searchBar = document.getElementById('search-bar');
        if (searchBar) {
            searchBar.placeholder = 'search here';
        }

        console.log('%c[Holidays] All seasonal effects stopped & space horizon restored.', 'color: #8a8e7a');
    }


    /* ==================================================================
       1. 🎃 HALLOWEEN — Blood Harvest Moon & Spooky Forest Background
       ================================================================== */
    function startHalloween() {
        stopHolidays();
        hideDefaultSpaceBackground();
        document.body.classList.add('holiday-halloween');

        const canvas = createOverlayCanvas('holiday-halloween-canvas');
        const ctx = canvas.getContext('2d');
        let w = canvas.width, h = canvas.height;

        // Spooky Stars / Fog Wisps
        const stars = [];
        for (let i = 0; i < 70; i++) {
            stars.push({
                x: Math.random() * w,
                y: Math.random() * h * 0.65,
                r: Math.random() * 1.5 + 0.4,
                alpha: Math.random() * 0.5 + 0.2,
                twinkle: Math.random() * 0.03 + 0.01,
                phase: Math.random() * Math.PI * 2
            });
        }

        // Bats
        const BAT_COUNT = 14;
        const bats = [];
        for (let i = 0; i < BAT_COUNT; i++) {
            bats.push({
                x: Math.random() * w,
                y: Math.random() * h * 0.5,
                size: 8 + Math.random() * 10,
                speedX: (Math.random() - 0.5) * 2.6,
                speedY: (Math.random() - 0.5) * 1.1,
                wingPhase: Math.random() * Math.PI * 2,
                wingSpeed: 0.12 + Math.random() * 0.06
            });
        }

        // Floating glowing pumpkins
        const PUMPKIN_COUNT = 6;
        const pumpkins = [];
        for (let i = 0; i < PUMPKIN_COUNT; i++) {
            pumpkins.push({
                x: Math.random() * w,
                y: h + 40 + Math.random() * 200,
                size: 20 + Math.random() * 14,
                speedY: -(0.35 + Math.random() * 0.35),
                wobble: Math.random() * Math.PI * 2,
                alpha: 0.65 + Math.random() * 0.35
            });
        }

        function drawSpookyTree(ctx, x, y, scale, flip) {
            ctx.save();
            ctx.translate(x, y);
            ctx.scale(flip ? -scale : scale, scale);
            ctx.fillStyle = '#0a0512';

            ctx.beginPath();
            // Trunk
            ctx.moveTo(-10, 0);
            ctx.quadraticCurveTo(-6, -60, -3, -110);
            ctx.quadraticCurveTo(0, -140, 4, -165);
            ctx.lineTo(-2, -165);
            ctx.quadraticCurveTo(-14, -130, -18, -60);
            ctx.lineTo(-24, 0);
            ctx.fill();

            // Crooked branch 1 (left)
            ctx.beginPath();
            ctx.moveTo(-8, -65);
            ctx.quadraticCurveTo(-35, -85, -55, -80);
            ctx.quadraticCurveTo(-40, -95, -28, -80);
            ctx.quadraticCurveTo(-15, -75, -6, -72);
            ctx.fill();

            // Crooked branch 2 (right)
            ctx.beginPath();
            ctx.moveTo(0, -95);
            ctx.quadraticCurveTo(25, -120, 50, -115);
            ctx.quadraticCurveTo(35, -135, 20, -120);
            ctx.quadraticCurveTo(8, -105, 1, -100);
            ctx.fill();

            // Branch 3 (top twisted)
            ctx.beginPath();
            ctx.moveTo(-4, -130);
            ctx.quadraticCurveTo(-25, -155, -35, -180);
            ctx.quadraticCurveTo(-22, -165, -12, -150);
            ctx.quadraticCurveTo(-3, -140, -2, -135);
            ctx.fill();

            ctx.restore();
        }

        function drawBat(ctx, x, y, size, wingAngle) {
            ctx.save();
            ctx.translate(x, y);
            ctx.fillStyle = '#0a0512';

            ctx.beginPath();
            ctx.ellipse(0, 0, size * 0.25, size * 0.35, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.save();
            ctx.rotate(wingAngle * 0.6);
            ctx.beginPath();
            ctx.moveTo(0, -size * 0.1);
            ctx.quadraticCurveTo(-size * 0.8, -size * 0.7, -size, -size * 0.1);
            ctx.quadraticCurveTo(-size * 0.5, size * 0.1, 0, size * 0.1);
            ctx.fill();
            ctx.restore();

            ctx.save();
            ctx.rotate(-wingAngle * 0.6);
            ctx.beginPath();
            ctx.moveTo(0, -size * 0.1);
            ctx.quadraticCurveTo(size * 0.8, -size * 0.7, size, -size * 0.1);
            ctx.quadraticCurveTo(size * 0.5, size * 0.1, 0, size * 0.1);
            ctx.fill();
            ctx.restore();

            // Glowing orange bat eyes
            ctx.fillStyle = '#ff6600';
            ctx.beginPath();
            ctx.arc(-size * 0.1, -size * 0.08, size * 0.07, 0, Math.PI * 2);
            ctx.arc(size * 0.1, -size * 0.08, size * 0.07, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }

        let time = 0;

        function renderHalloween() {
            time += 0.02;
            w = canvas.width;
            h = canvas.height;
            ctx.clearRect(0, 0, w, h);

            // 1. NIGHT SKY GRADIENT (Deep Purple / Crimson Night)
            const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
            skyGrad.addColorStop(0, '#06020a');
            skyGrad.addColorStop(0.35, '#12041d');
            skyGrad.addColorStop(0.7, '#240a2d');
            skyGrad.addColorStop(1, '#360d26');
            ctx.fillStyle = skyGrad;
            ctx.fillRect(0, 0, w, h);

            // 2. STARS IN SKY
            stars.forEach(s => {
                const a = s.alpha + Math.sin(time * 30 * s.twinkle + s.phase) * 0.2;
                ctx.fillStyle = `rgba(230, 200, 255, ${Math.max(0.05, Math.min(0.9, a))})`;
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
                ctx.fill();
            });

            // 3. GIANT BLOOD HARVEST MOON
            const moonX = w * 0.76;
            const moonY = h * 0.23;
            const moonR = Math.min(85, Math.max(55, w * 0.07));

            // Moon Outer Halo Glow
            const moonGlow = ctx.createRadialGradient(moonX, moonY, moonR * 0.8, moonX, moonY, moonR * 2.8);
            moonGlow.addColorStop(0, 'rgba(255, 120, 20, 0.45)');
            moonGlow.addColorStop(0.4, 'rgba(200, 50, 40, 0.2)');
            moonGlow.addColorStop(0.75, 'rgba(120, 20, 80, 0.08)');
            moonGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = moonGlow;
            ctx.beginPath();
            ctx.arc(moonX, moonY, moonR * 2.8, 0, Math.PI * 2);
            ctx.fill();

            // Moon Sphere
            const moonGrad = ctx.createRadialGradient(moonX - moonR * 0.3, moonY - moonR * 0.3, 0, moonX, moonY, moonR);
            moonGrad.addColorStop(0, '#ffe08a');
            moonGrad.addColorStop(0.45, '#ff8a1e');
            moonGrad.addColorStop(0.85, '#d92c0a');
            moonGrad.addColorStop(1, '#941414');
            ctx.fillStyle = moonGrad;
            ctx.beginPath();
            ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
            ctx.fill();

            // Craters / Dark patches on moon
            ctx.fillStyle = 'rgba(100, 10, 10, 0.22)';
            ctx.beginPath();
            ctx.arc(moonX - moonR * 0.25, moonY - moonR * 0.15, moonR * 0.22, 0, Math.PI * 2);
            ctx.arc(moonX + moonR * 0.22, moonY + moonR * 0.18, moonR * 0.32, 0, Math.PI * 2);
            ctx.arc(moonX - moonR * 0.1, moonY + moonR * 0.35, moonR * 0.18, 0, Math.PI * 2);
            ctx.fill();

            // Passing spooky wispy cloud over moon
            ctx.fillStyle = 'rgba(30, 8, 38, 0.45)';
            ctx.beginPath();
            ctx.ellipse(moonX + Math.sin(time * 0.3) * 35, moonY + moonR * 0.3, moonR * 1.5, moonR * 0.25, -0.15, 0, Math.PI * 2);
            ctx.fill();

            // 4. DISTANT HILLS & GRAVEYARD HORIZON
            // Back hill
            ctx.fillStyle = '#170b24';
            ctx.beginPath();
            ctx.moveTo(0, h);
            for (let i = 0; i <= 20; i++) {
                const normX = i / 20;
                const hx = normX * w;
                const hy = h - (h * 0.24) - Math.sin(normX * Math.PI * 1.5 + 0.4) * (h * 0.08);
                ctx.lineTo(hx, hy);
            }
            ctx.lineTo(w, h);
            ctx.closePath();
            ctx.fill();

            // Front hill
            ctx.fillStyle = '#0c0514';
            ctx.beginPath();
            ctx.moveTo(0, h);
            for (let i = 0; i <= 25; i++) {
                const normX = i / 25;
                const hx = normX * w;
                const hy = h - (h * 0.16) - Math.sin(normX * Math.PI * 2.2) * (h * 0.06);
                ctx.lineTo(hx, hy);
            }
            ctx.lineTo(w, h);
            ctx.closePath();
            ctx.fill();

            // 5. SPOOKY SILHOUETTE TREES ON HORIZON
            drawSpookyTree(ctx, Math.max(60, w * 0.08), h - h * 0.14, 0.95, false);
            drawSpookyTree(ctx, Math.min(w - 60, w * 0.92), h - h * 0.15, 0.9, true);

            // Tombstone silhouettes
            ctx.fillStyle = '#08030e';
            ctx.beginPath();
            ctx.roundRect(w * 0.18, h - h * 0.18, 16, 24, [8, 8, 0, 0]);
            ctx.roundRect(w * 0.82, h - h * 0.17, 18, 26, [9, 9, 0, 0]);
            ctx.fill();

            // Cross silhouette
            ctx.fillRect(w * 0.87, h - h * 0.22, 4, 30);
            ctx.fillRect(w * 0.87 - 7, h - h * 0.22 + 8, 18, 4);

            // 6. CREEPING MIST / FOG WAVES ON GROUND
            for (let layer = 0; layer < 2; layer++) {
                ctx.save();
                ctx.fillStyle = layer === 0 ? 'rgba(80, 20, 100, 0.12)' : 'rgba(255, 102, 0, 0.06)';
                ctx.beginPath();
                ctx.moveTo(0, h);
                for (let i = 0; i <= 20; i++) {
                    const norm = i / 20;
                    const mx = norm * w;
                    const my = h - (h * 0.10) - Math.sin(norm * 4 + time * (1.2 + layer)) * 14;
                    ctx.lineTo(mx, my);
                }
                ctx.lineTo(w, h);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }

            // 7. BATS IN THE SKY
            bats.forEach(bat => {
                bat.x += bat.speedX;
                bat.y += bat.speedY + Math.sin(time * 2 + bat.wingPhase) * 0.5;

                if (bat.x > w + 40) bat.x = -40;
                if (bat.x < -40) bat.x = w + 40;
                if (bat.y > h * 0.6) bat.speedY = -Math.abs(bat.speedY);
                if (bat.y < -30) bat.speedY = Math.abs(bat.speedY);

                bat.wingPhase += bat.wingSpeed;
                const wingAngle = Math.sin(bat.wingPhase) * 0.5;
                drawBat(ctx, bat.x, bat.y, bat.size, wingAngle);
            });

            // 8. FLOATING GLOWING PUMPKINS
            pumpkins.forEach(p => {
                p.y += p.speedY;
                p.wobble += 0.015;
                const wx = Math.sin(p.wobble) * 20;

                if (p.y < -60) {
                    p.y = h + 40;
                    p.x = Math.random() * w;
                }

                ctx.save();
                ctx.globalAlpha = p.alpha;
                ctx.shadowColor = '#ff6600';
                ctx.shadowBlur = 14;
                ctx.font = `${p.size}px serif`;
                ctx.textAlign = 'center';
                ctx.fillText('🎃', p.x + wx, p.y);
                ctx.restore();
            });

            activeRaf = requestAnimationFrame(renderHalloween);
        }

        renderHalloween();
        showHolidayBanner('🎃', 'Happy Halloween!', 'Blood Moon rises over the haunted forest 👻', '#ff6600');
    }


    /* ==================================================================
       2. 🎄 NEW YEAR / CHRISTMAS — Aurora Borealis & Snowy Pine Forest
       ================================================================== */
    function startNewYear() {
        stopHolidays();
        hideDefaultSpaceBackground();
        document.body.classList.add('holiday-newyear');

        const canvas = createOverlayCanvas('holiday-snow-canvas');
        const ctx = canvas.getContext('2d');
        let w = canvas.width, h = canvas.height;

        // Snowflakes
        const FLAKE_COUNT = 140;
        const flakes = [];
        for (let i = 0; i < FLAKE_COUNT; i++) {
            flakes.push({
                x: Math.random() * w,
                y: Math.random() * h,
                r: Math.random() * 3 + 1,
                speed: Math.random() * 1.4 + 0.6,
                wind: (Math.random() - 0.5) * 0.9,
                alpha: Math.random() * 0.6 + 0.35,
                phase: Math.random() * Math.PI * 2
            });
        }

        const fireworks = [];
        const sparks = [];

        function spawnFirework() {
            fireworks.push({
                x: Math.random() * w * 0.65 + w * 0.18,
                y: h,
                targetY: Math.random() * h * 0.32 + h * 0.10,
                speed: 3.5 + Math.random() * 2,
                hue: [0, 35, 60, 120, 190, 275, 335][Math.floor(Math.random() * 7)],
                trail: []
            });
        }

        function explodeFirework(fw) {
            const count = 45 + Math.floor(Math.random() * 25);
            for (let i = 0; i < count; i++) {
                const angle = (Math.PI * 2 / count) * i + Math.random() * 0.3;
                const v = 2 + Math.random() * 3.2;
                sparks.push({
                    x: fw.x, y: fw.y,
                    vx: Math.cos(angle) * v,
                    vy: Math.sin(angle) * v,
                    life: 1,
                    decay: 0.012 + Math.random() * 0.008,
                    hue: fw.hue + Math.random() * 25 - 12,
                    size: 1.5 + Math.random()
                });
            }
        }

        function drawPineTree(ctx, x, y, size) {
            ctx.save();
            ctx.translate(x, y);
            ctx.fillStyle = '#061320';

            // Trunk
            ctx.fillRect(-2, 0, 4, size * 0.25);

            // Tiered foliage with snow caps
            for (let i = 0; i < 3; i++) {
                const ty = -size * 0.25 - i * (size * 0.28);
                const tw = size * (0.45 - i * 0.09);
                const th = size * 0.38;

                ctx.fillStyle = '#05121e';
                ctx.beginPath();
                ctx.moveTo(0, ty - th);
                ctx.lineTo(tw, ty);
                ctx.lineTo(-tw, ty);
                ctx.closePath();
                ctx.fill();

                // Snow rim on branches
                ctx.strokeStyle = 'rgba(230, 245, 255, 0.45)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(-tw * 0.9, ty - 1);
                ctx.lineTo(-tw * 0.3, ty - 4);
                ctx.lineTo(0, ty - 2);
                ctx.lineTo(tw * 0.3, ty - 4);
                ctx.lineTo(tw * 0.9, ty - 1);
                ctx.stroke();
            }
            ctx.restore();
        }

        let time = 0;
        let nextFirework = 60;

        function renderNewYear() {
            time += 0.018;
            w = canvas.width;
            h = canvas.height;
            ctx.clearRect(0, 0, w, h);

            // 1. POLAR NIGHT SKY
            const nightSky = ctx.createLinearGradient(0, 0, 0, h);
            nightSky.addColorStop(0, '#030814');
            nightSky.addColorStop(0.4, '#07162b');
            nightSky.addColorStop(0.8, '#0d223f');
            nightSky.addColorStop(1, '#132e54');
            ctx.fillStyle = nightSky;
            ctx.fillRect(0, 0, w, h);

            // 2. AURORA BOREALIS (Northern Lights)
            const auroraWaves = [
                { color: 'rgba(56, 239, 125, 0.18)', speed: 1.0, yOffset: h * 0.22, amp: 40 },
                { color: 'rgba(17, 153, 142, 0.14)', speed: 1.4, yOffset: h * 0.28, amp: 55 },
                { color: 'rgba(196, 113, 237, 0.12)', speed: 0.8, yOffset: h * 0.18, amp: 35 }
            ];

            auroraWaves.forEach(aw => {
                ctx.save();
                ctx.fillStyle = aw.color;
                ctx.beginPath();
                ctx.moveTo(0, 0);

                const segments = 24;
                for (let i = 0; i <= segments; i++) {
                    const norm = i / segments;
                    const ax = norm * w;
                    const ay = aw.yOffset + Math.sin(norm * 4 + time * aw.speed) * aw.amp
                                          + Math.cos(norm * 2.5 - time * 0.6) * 20;
                    ctx.lineTo(ax, ay);
                }
                ctx.lineTo(w, 0);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            });

            // 3. SNOWY HILLS HORIZON
            // Distant snowy ridge
            ctx.fillStyle = '#0a1d35';
            ctx.beginPath();
            ctx.moveTo(0, h);
            for (let i = 0; i <= 20; i++) {
                const norm = i / 20;
                const hx = norm * w;
                const hy = h - (h * 0.22) - Math.sin(norm * Math.PI * 1.6 + 0.3) * (h * 0.08);
                ctx.lineTo(hx, hy);
            }
            ctx.lineTo(w, h);
            ctx.closePath();
            ctx.fill();

            // Near snowy hills
            const hillGrad = ctx.createLinearGradient(0, h - h * 0.2, 0, h);
            hillGrad.addColorStop(0, '#102d50');
            hillGrad.addColorStop(1, '#1b4578');
            ctx.fillStyle = hillGrad;
            ctx.beginPath();
            ctx.moveTo(0, h);
            for (let i = 0; i <= 25; i++) {
                const norm = i / 25;
                const hx = norm * w;
                const hy = h - (h * 0.15) - Math.sin(norm * Math.PI * 2.2) * (h * 0.06);
                ctx.lineTo(hx, hy);
            }
            ctx.lineTo(w, h);
            ctx.closePath();
            ctx.fill();

            // Snow highlight crest on near hills
            ctx.strokeStyle = 'rgba(220, 240, 255, 0.45)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            for (let i = 0; i <= 25; i++) {
                const norm = i / 25;
                const hx = norm * w;
                const hy = h - (h * 0.15) - Math.sin(norm * Math.PI * 2.2) * (h * 0.06);
                if (i === 0) ctx.moveTo(hx, hy);
                else ctx.lineTo(hx, hy);
            }
            ctx.stroke();

            // 4. SILHOUETTE PINE FOREST ON HORIZON
            const pineForestPositions = [
                0.05, 0.09, 0.14, 0.20, 0.24, 0.76, 0.82, 0.88, 0.93, 0.97
            ];
            pineForestPositions.forEach(pNorm => {
                const tx = pNorm * w;
                const hillY = h - (h * 0.15) - Math.sin(pNorm * Math.PI * 2.2) * (h * 0.06);
                drawPineTree(ctx, tx, hillY, 48 + (pNorm * 100) % 20);
            });

            // 5. SNOWFALL
            flakes.forEach(f => {
                f.y += f.speed;
                f.x += f.wind + Math.sin(time * 0.8 + f.phase) * 0.4;
                if (f.y > h + 10) { f.y = -10; f.x = Math.random() * w; }
                if (f.x > w + 10) f.x = -10;
                if (f.x < -10) f.x = w + 10;

                ctx.fillStyle = `rgba(255, 255, 255, ${f.alpha})`;
                ctx.beginPath();
                ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
                ctx.fill();
            });

            // 6. FIREWORKS
            nextFirework--;
            if (nextFirework <= 0) {
                spawnFirework();
                nextFirework = 90 + Math.floor(Math.random() * 110);
            }

            for (let i = fireworks.length - 1; i >= 0; i--) {
                const fw = fireworks[i];
                fw.y -= fw.speed;
                fw.trail.push({ x: fw.x, y: fw.y, alpha: 1 });
                if (fw.trail.length > 8) fw.trail.shift();

                fw.trail.forEach(tp => {
                    tp.alpha *= 0.85;
                    ctx.fillStyle = `hsla(${fw.hue}, 85%, 70%, ${tp.alpha * 0.6})`;
                    ctx.beginPath();
                    ctx.arc(tp.x, tp.y, 2.2, 0, Math.PI * 2);
                    ctx.fill();
                });

                if (fw.y <= fw.targetY) {
                    explodeFirework(fw);
                    fireworks.splice(i, 1);
                }
            }

            for (let i = sparks.length - 1; i >= 0; i--) {
                const s = sparks[i];
                s.x += s.vx;
                s.y += s.vy;
                s.vy += 0.04;
                s.vx *= 0.99;
                s.life -= s.decay;

                if (s.life <= 0) { sparks.splice(i, 1); continue; }

                ctx.shadowColor = `hsla(${s.hue}, 90%, 65%, ${s.life})`;
                ctx.shadowBlur = 6;
                ctx.fillStyle = `hsla(${s.hue}, 90%, 70%, ${s.life})`;
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.size * s.life, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            }

            activeRaf = requestAnimationFrame(renderNewYear);
        }

        renderNewYear();
        showHolidayBanner('🎄', 'С Новым Годом!', 'Aurora Borealis, pine forest & holiday fireworks', '#ff6b6b');
    }


    /* ==================================================================
       3. 💕 VALENTINE'S DAY — Ringed Planet & Heart Nebula
       ================================================================== */
    function startValentine() {
        stopHolidays();
        hideDefaultSpaceBackground();
        document.body.classList.add('holiday-valentine');

        const canvas = createOverlayCanvas('holiday-valentine-canvas');
        const ctx = canvas.getContext('2d');
        let w = canvas.width, h = canvas.height;

        const HEART_COUNT = 28;
        const hearts = [];
        for (let i = 0; i < HEART_COUNT; i++) {
            hearts.push({
                x: Math.random() * w,
                y: h + Math.random() * 200 + 50,
                size: 9 + Math.random() * 16,
                speed: 0.5 + Math.random() * 1.2,
                wobble: Math.random() * Math.PI * 2,
                wobbleSpeed: 0.01 + Math.random() * 0.02,
                alpha: 0.35 + Math.random() * 0.5,
                hue: Math.random() > 0.5 ? 335 : 350,
                rotation: (Math.random() - 0.5) * 0.4
            });
        }

        function drawHeart(ctx, x, y, size, hue, alpha, rot) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rot);
            ctx.scale(size / 20, size / 20);

            ctx.fillStyle = `hsla(${hue}, 82%, 62%, ${alpha})`;
            ctx.shadowColor = `hsla(${hue}, 90%, 60%, ${alpha * 0.6})`;
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.moveTo(0, -5);
            ctx.bezierCurveTo(-10, -18, -22, -5, 0, 12);
            ctx.bezierCurveTo(22, -5, 10, -18, 0, -5);
            ctx.fill();
            ctx.shadowBlur = 0;

            ctx.restore();
        }

        let time = 0;

        function renderValentine() {
            time += 0.015;
            w = canvas.width;
            h = canvas.height;
            ctx.clearRect(0, 0, w, h);

            // 1. ROMANTIC NEBULA SKY
            const sky = ctx.createLinearGradient(0, 0, 0, h);
            sky.addColorStop(0, '#100516');
            sky.addColorStop(0.4, '#240a2c');
            sky.addColorStop(0.75, '#42143d');
            sky.addColorStop(1, '#561a46');
            ctx.fillStyle = sky;
            ctx.fillRect(0, 0, w, h);

            // 2. RINGED ROMANTIC PLANET ON HORIZON
            const planetX = w * 0.5;
            const planetY = h * 1.15;
            const planetR = Math.max(w * 0.52, h * 0.62);

            // Planet Glow
            const pGlow = ctx.createRadialGradient(planetX, planetY, 0, planetX, planetY, planetR * 1.25);
            pGlow.addColorStop(0, 'rgba(231, 76, 139, 0.35)');
            pGlow.addColorStop(0.5, 'rgba(165, 45, 110, 0.2)');
            pGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = pGlow;
            ctx.beginPath();
            ctx.arc(planetX, planetY, planetR * 1.25, 0, Math.PI * 2);
            ctx.fill();

            // Planet Body
            const pGrad = ctx.createRadialGradient(planetX - planetR * 0.2, planetY - planetR * 0.4, 0, planetX, planetY, planetR);
            pGrad.addColorStop(0, '#ff9ebb');
            pGrad.addColorStop(0.4, '#e74c8b');
            pGrad.addColorStop(0.8, '#8e1f58');
            pGrad.addColorStop(1, '#45092a');
            ctx.fillStyle = pGrad;
            ctx.beginPath();
            ctx.arc(planetX, planetY, planetR, 0, Math.PI * 2);
            ctx.fill();

            // Planetary Golden-Rose Ring
            ctx.save();
            ctx.translate(planetX, planetY - planetR * 0.3);
            ctx.rotate(-0.2);
            ctx.strokeStyle = 'rgba(255, 215, 180, 0.35)';
            ctx.lineWidth = 14;
            ctx.beginPath();
            ctx.ellipse(0, 0, planetR * 1.45, planetR * 0.22, 0, 0, Math.PI * 2);
            ctx.stroke();

            ctx.strokeStyle = 'rgba(255, 150, 200, 0.5)';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.ellipse(0, 0, planetR * 1.52, planetR * 0.24, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();

            // 3. FLOATING ASCENDING HEARTS
            hearts.forEach(ht => {
                ht.y -= ht.speed;
                ht.wobble += ht.wobbleSpeed;
                const wx = Math.sin(ht.wobble) * 28;

                if (ht.y < -30) {
                    ht.y = h + 50;
                    ht.x = Math.random() * w;
                }

                drawHeart(ctx, ht.x + wx, ht.y, ht.size, ht.hue, ht.alpha, ht.rotation + Math.sin(ht.wobble) * 0.15);
            });

            activeRaf = requestAnimationFrame(renderValentine);
        }

        renderValentine();
        showHolidayBanner('💕', 'Happy Valentine\'s Day!', 'Ringed planet of romance & floating hearts ❤️', '#e74c8b');
    }


    /* ==================================================================
       4. 👨‍💻 PROGRAMMER'S DAY — 3D Cyber Wireframe Grid & Binary Stream
       ================================================================== */
    function startProgrammer() {
        stopHolidays();
        hideDefaultSpaceBackground();
        document.body.classList.add('holiday-programmer');

        const canvas = createOverlayCanvas('holiday-programmer-canvas');
        const ctx = canvas.getContext('2d');
        let w = canvas.width, h = canvas.height;

        const fontSize = 14;
        const cols = Math.floor(w / fontSize);
        const drops = new Array(cols).fill(0).map(() => Math.random() * -40);

        let gridOffset = 0;

        function renderProgrammer() {
            w = canvas.width;
            h = canvas.height;
            gridOffset = (gridOffset + 0.6) % 36;
            ctx.clearRect(0, 0, w, h);

            // 1. DARK CYBER TERMINAL SKY
            const sky = ctx.createLinearGradient(0, 0, 0, h);
            sky.addColorStop(0, '#060a06');
            sky.addColorStop(0.5, '#0c160c');
            sky.addColorStop(1, '#142514');
            ctx.fillStyle = sky;
            ctx.fillRect(0, 0, w, h);

            // 2. 3D PERSPECTIVE CYBER GRID HORIZON (Synthwave / Tron Grid)
            const horizonY = h * 0.62;
            ctx.save();

            // Perspective vanishing lines
            const vpX = w * 0.5;
            const numLines = 26;
            ctx.strokeStyle = 'rgba(223, 255, 179, 0.22)';
            ctx.lineWidth = 1.2;

            for (let i = -numLines; i <= numLines; i++) {
                const bottomX = vpX + i * 45;
                ctx.beginPath();
                ctx.moveTo(vpX, horizonY);
                ctx.lineTo(bottomX, h);
                ctx.stroke();
            }

            // Moving horizontal depth lines
            for (let y = 0; y < (h - horizonY); y += 14) {
                const depthNorm = Math.pow(y / (h - horizonY), 2.2);
                const lineY = horizonY + depthNorm * (h - horizonY) + (gridOffset * depthNorm * 0.4);
                if (lineY <= h) {
                    ctx.strokeStyle = `rgba(223, 255, 179, ${0.08 + depthNorm * 0.35})`;
                    ctx.lineWidth = 1 + depthNorm * 1.5;
                    ctx.beginPath();
                    ctx.moveTo(0, lineY);
                    ctx.lineTo(w, lineY);
                    ctx.stroke();
                }
            }

            // Horizon Neon Glow Bar
            const hGlow = ctx.createLinearGradient(0, horizonY - 4, 0, horizonY + 8);
            hGlow.addColorStop(0, 'rgba(223, 255, 179, 0.45)');
            hGlow.addColorStop(1, 'rgba(223, 255, 179, 0)');
            ctx.fillStyle = hGlow;
            ctx.fillRect(0, horizonY - 4, w, 12);
            ctx.restore();

            // 3. BINARY RAIN IN UPPER SKY
            ctx.font = `${fontSize}px monospace`;
            for (let i = 0; i < cols; i++) {
                if (Math.random() > 0.96) {
                    const char = Math.random() > 0.5 ? '1' : '0';
                    const x = i * fontSize;
                    const y = drops[i] * fontSize;

                    if (y < horizonY) {
                        ctx.fillStyle = `rgba(223, 255, 179, ${0.18 + Math.random() * 0.35})`;
                        ctx.fillText(char, x, y);
                    }
                }

                drops[i] += 0.35;
                if (drops[i] * fontSize > horizonY && Math.random() > 0.985) {
                    drops[i] = 0;
                }
            }

            activeRaf = requestAnimationFrame(renderProgrammer);
        }

        renderProgrammer();
        showHolidayBanner('👨‍💻', 'Happy Programmer\'s Day!', '3D Cyber Grid & binary stream — Day 256 (0x100)', '#DFFFB3');
    }


    /* ==================================================================
       5. 🥧 PI DAY — Floating Digits of Pi & Celestial Symbol
       ================================================================== */
    function startPiDay() {
        stopHolidays();
        hideDefaultSpaceBackground();
        document.body.classList.add('holiday-piday');

        const canvas = createOverlayCanvas('holiday-piday-canvas');
        const ctx = canvas.getContext('2d');
        let w = canvas.width, h = canvas.height;

        const PI_DIGITS = '3.14159265358979323846264338327950288419716939937510';
        const digits = [];

        function spawnDigit() {
            const idx = Math.floor(Math.random() * PI_DIGITS.length);
            digits.push({
                char: PI_DIGITS[idx],
                x: Math.random() * w,
                y: -20,
                speed: 0.6 + Math.random() * 1.5,
                size: 15 + Math.random() * 22,
                alpha: 0.22 + Math.random() * 0.45,
                wobble: Math.random() * Math.PI * 2,
                rotation: (Math.random() - 0.5) * 0.6
            });
        }

        let time = 0;

        function renderPi() {
            time++;
            w = canvas.width;
            h = canvas.height;
            ctx.clearRect(0, 0, w, h);

            // 1. MATHEMATICAL DEEP SPACE SKY
            const sky = ctx.createLinearGradient(0, 0, 0, h);
            sky.addColorStop(0, '#0a0d14');
            sky.addColorStop(0.5, '#121824');
            sky.addColorStop(1, '#1b2333');
            ctx.fillStyle = sky;
            ctx.fillRect(0, 0, w, h);

            // 2. CELESTIAL GIANT PI SYMBOL
            ctx.save();
            ctx.fillStyle = 'rgba(223, 255, 179, 0.055)';
            ctx.font = `${Math.min(w, h) * 0.45}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('π', w * 0.5, h * 0.52);
            ctx.restore();

            // 3. FALLING DIGITS
            if (time % 7 === 0 && digits.length < 48) spawnDigit();

            for (let i = digits.length - 1; i >= 0; i--) {
                const d = digits[i];
                d.y += d.speed;
                d.wobble += 0.02;

                if (d.y > h + 30) { digits.splice(i, 1); continue; }

                ctx.save();
                ctx.translate(d.x + Math.sin(d.wobble) * 16, d.y);
                ctx.rotate(d.rotation);
                ctx.font = `${d.size}px 'Courier New', monospace`;
                ctx.fillStyle = `rgba(223, 255, 179, ${d.alpha})`;
                ctx.textAlign = 'center';
                ctx.fillText(d.char, 0, 0);
                ctx.restore();
            }

            activeRaf = requestAnimationFrame(renderPi);
        }

        renderPi();
        showHolidayBanner('🥧', 'Happy Pi Day!', '3.14159265... — mathematical harmony ∞', '#DFFFB3');
    }


    /* ==================================================================
       6. 🚀 COSMONAUTICS DAY — Earth from Orbit & Vostok Rocket
       ================================================================== */
    function startCosmonautics() {
        stopHolidays();
        hideDefaultSpaceBackground();
        document.body.classList.add('holiday-cosmonautics');

        const canvas = createOverlayCanvas('holiday-cosmo-canvas');
        const ctx = canvas.getContext('2d');
        let w = canvas.width, h = canvas.height;

        let rocketX = -120;
        let rocketY = h * 0.65;
        const rocketSpeed = 2.6;
        const trail = [];
        let launched = false;
        let t = 0;

        function drawRocket(x, y, size) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(-0.35);

            // Flame
            const flameLen = 16 + Math.random() * 12;
            const flameGrad = ctx.createLinearGradient(0, size * 0.4, 0, size * 0.4 + flameLen);
            flameGrad.addColorStop(0, 'rgba(255, 210, 60, 0.95)');
            flameGrad.addColorStop(0.5, 'rgba(255, 110, 30, 0.6)');
            flameGrad.addColorStop(1, 'rgba(255, 50, 20, 0)');
            ctx.fillStyle = flameGrad;
            ctx.beginPath();
            ctx.moveTo(-size * 0.15, size * 0.35);
            ctx.lineTo(0, size * 0.35 + flameLen);
            ctx.lineTo(size * 0.15, size * 0.35);
            ctx.fill();

            // Fuselage
            ctx.fillStyle = '#f0f0f0';
            ctx.beginPath();
            ctx.moveTo(0, -size * 0.5);
            ctx.quadraticCurveTo(size * 0.2, -size * 0.2, size * 0.18, size * 0.35);
            ctx.lineTo(-size * 0.18, size * 0.35);
            ctx.quadraticCurveTo(-size * 0.2, -size * 0.2, 0, -size * 0.5);
            ctx.fill();

            // Red nose
            ctx.fillStyle = '#ff3333';
            ctx.beginPath();
            ctx.moveTo(0, -size * 0.5);
            ctx.quadraticCurveTo(size * 0.1, -size * 0.35, size * 0.08, -size * 0.25);
            ctx.lineTo(-size * 0.08, -size * 0.25);
            ctx.quadraticCurveTo(-size * 0.1, -size * 0.35, 0, -size * 0.5);
            ctx.fill();

            // Porthole
            ctx.fillStyle = '#4a90d9';
            ctx.shadowColor = '#64b5f6';
            ctx.shadowBlur = 5;
            ctx.beginPath();
            ctx.arc(0, -size * 0.1, size * 0.075, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Stabilizer fins
            ctx.fillStyle = '#ff3333';
            ctx.beginPath();
            ctx.moveTo(-size * 0.18, size * 0.2);
            ctx.lineTo(-size * 0.35, size * 0.4);
            ctx.lineTo(-size * 0.18, size * 0.35);
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(size * 0.18, size * 0.2);
            ctx.lineTo(size * 0.35, size * 0.4);
            ctx.lineTo(size * 0.18, size * 0.35);
            ctx.fill();

            ctx.restore();
        }

        const tLaunch = setTimeout(() => { launched = true; }, 1200);
        activeTimeouts.push(tLaunch);

        function renderCosmo() {
            t++;
            w = canvas.width;
            h = canvas.height;
            ctx.clearRect(0, 0, w, h);

            // 1. DEEP SPACE
            ctx.fillStyle = '#05070a';
            ctx.fillRect(0, 0, w, h);

            // 2. BLUE PLANET EARTH FROM ORBIT (Atmospheric rim & ocean below)
            const earthX = w * 0.5;
            const earthY = h * 1.18;
            const earthR = Math.max(w * 0.58, h * 0.70);

            // Outer Atmospheric Rayleigh Blue Glow
            const atmoGlow = ctx.createRadialGradient(earthX, earthY, earthR * 0.94, earthX, earthY, earthR * 1.18);
            atmoGlow.addColorStop(0, 'rgba(80, 185, 255, 0.45)');
            atmoGlow.addColorStop(0.35, 'rgba(40, 140, 240, 0.25)');
            atmoGlow.addColorStop(0.7, 'rgba(20, 80, 180, 0.08)');
            atmoGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = atmoGlow;
            ctx.beginPath();
            ctx.arc(earthX, earthY, earthR * 1.18, 0, Math.PI * 2);
            ctx.fill();

            // Earth Globe
            const earthGrad = ctx.createRadialGradient(earthX - earthR * 0.2, earthY - earthR * 0.4, 0, earthX, earthY, earthR);
            earthGrad.addColorStop(0, '#5cb8ff');
            earthGrad.addColorStop(0.3, '#1e88e5');
            earthGrad.addColorStop(0.65, '#0d47a1');
            earthGrad.addColorStop(0.95, '#051b44');
            earthGrad.addColorStop(1, '#020b1c');
            ctx.fillStyle = earthGrad;
            ctx.beginPath();
            ctx.arc(earthX, earthY, earthR, 0, Math.PI * 2);
            ctx.fill();

            // Clouds over Earth
            ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
            ctx.beginPath();
            ctx.ellipse(earthX - earthR * 0.2, earthY - earthR * 0.55, earthR * 0.45, earthR * 0.12, 0.1, 0, Math.PI * 2);
            ctx.ellipse(earthX + earthR * 0.35, earthY - earthR * 0.48, earthR * 0.35, earthR * 0.09, -0.15, 0, Math.PI * 2);
            ctx.fill();

            // 3. VOSTOK ROCKET FLIGHT
            if (launched) {
                rocketX += rocketSpeed;
                rocketY -= rocketSpeed * 0.36;

                if (t % 3 === 0) {
                    trail.push({
                        x: rocketX - 10,
                        y: rocketY + 20,
                        size: 4 + Math.random() * 4,
                        alpha: 0.5,
                        vx: (Math.random() - 0.5) * 0.5 - 1,
                        vy: Math.random() * 0.5 + 0.3
                    });
                }

                for (let i = trail.length - 1; i >= 0; i--) {
                    const p = trail[i];
                    p.x += p.vx;
                    p.y += p.vy;
                    p.alpha -= 0.008;
                    p.size += 0.1;
                    if (p.alpha <= 0) { trail.splice(i, 1); continue; }

                    ctx.fillStyle = `rgba(220, 220, 220, ${p.alpha})`;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fill();
                }

                if (rocketX < w + 200 && rocketY > -200) {
                    drawRocket(rocketX, rocketY, 42);
                }

                if (rocketX > w + 300 || rocketY < -300) {
                    rocketX = -120;
                    rocketY = h * 0.65 + (Math.random() - 0.5) * 100;
                    trail.length = 0;
                    launched = false;
                    const nextT = setTimeout(() => { launched = true; }, 7000 + Math.random() * 9000);
                    activeTimeouts.push(nextT);
                }
            }

            activeRaf = requestAnimationFrame(renderCosmo);
        }

        renderCosmo();
        showHolidayBanner('🚀', 'День космонавтики!', 'View of Earth from orbit — «Поехали!» (12 апреля 1961)', '#4a90d9');
    }


    /* ==================================================================
       7. 🃏 APRIL FOOLS — UI Shenanigans
       ================================================================== */
    function startAprilFools() {
        stopHolidays();
        document.body.classList.add('holiday-aprilfools');

        let rotation = 0;
        const rotInterval = setInterval(() => {
            rotation += 0.15;
            if (rotation > 3) {
                clearInterval(rotInterval);
                const tSnap = setTimeout(() => {
                    document.body.style.transition = 'transform 1s cubic-bezier(0.34, 1.56, 0.64, 1)';
                    document.body.style.transform = 'rotate(0deg)';
                    const tReset = setTimeout(() => {
                        document.body.style.transition = '';
                    }, 1200);
                    activeTimeouts.push(tReset);
                }, 2000);
                activeTimeouts.push(tSnap);
            }
            document.body.style.transform = `rotate(${rotation}deg)`;
        }, 300);
        activeIntervals.push(rotInterval);

        const jiggleInterval = setInterval(() => {
            const allItems = document.querySelectorAll('.project-item, .blog-card, .action-btn, .skill-chip');
            if (allItems.length === 0) return;
            const target = allItems[Math.floor(Math.random() * allItems.length)];
            target.style.transition = 'transform 0.3s ease';
            target.style.transform = `rotate(${(Math.random() - 0.5) * 6}deg) scale(${0.97 + Math.random() * 0.06})`;
            const tJig = setTimeout(() => {
                target.style.transform = '';
            }, 800);
            activeTimeouts.push(tJig);
        }, 3000);
        activeIntervals.push(jiggleInterval);

        const jokes = [
            'looking for bugs? 🐛',
            'try: rm -rf / 😈',
            'help im trapped inside',
            'segfault at 0x00 🔥',
            'have you tried turning it off?',
            '404: placeholder not found'
        ];
        let jokeIdx = 0;
        const searchBar = document.getElementById('search-bar');
        if (searchBar) {
            const jokeInterval = setInterval(() => {
                searchBar.placeholder = jokes[jokeIdx % jokes.length];
                jokeIdx++;
            }, 4000);
            activeIntervals.push(jokeInterval);
        }

        showHolidayBanner('🃏', 'April Fools!', 'Something seems off today... 🤔', '#ffd93d');
    }


    /* ==================================================================
       Universal Trigger Dispatcher & Global Console Registration
       ================================================================== */
    const holidayMap = {
        newyear: startNewYear,
        christmas: startNewYear,
        halloween: startHalloween,
        valentine: startValentine,
        programmer: startProgrammer,
        piday: startPiDay,
        cosmonautics: startCosmonautics,
        aprilfools: startAprilFools
    };

    function triggerHoliday(name) {
        const key = String(name).toLowerCase().replace(/[^a-z]/g, '');
        const fn = holidayMap[key];
        if (typeof fn === 'function') {
            console.log(`%c[Holidays] Activated custom holiday environment: "${key}"`, 'color: #DFFFB3; font-weight: bold;');
            fn();
        } else {
            console.warn(`[Holidays] Unknown holiday: "${name}". Valid choices:`, Object.keys(holidayMap));
        }
    }

    // Expose console triggers on window & globalThis
    window.triggerHoliday = triggerHoliday;
    window.stopHolidays = stopHolidays;
    window.triggerNewYear = startNewYear;
    window.triggerHalloween = startHalloween;
    window.triggerValentine = startValentine;
    window.triggerProgrammer = startProgrammer;
    window.triggerPiDay = startPiDay;
    window.triggerCosmonautics = startCosmonautics;
    window.triggerAprilFools = startAprilFools;

    try {
        globalThis.triggerHoliday = triggerHoliday;
        globalThis.stopHolidays = stopHolidays;
        globalThis.triggerNewYear = startNewYear;
        globalThis.triggerHalloween = startHalloween;
        globalThis.triggerValentine = startValentine;
        globalThis.triggerProgrammer = startProgrammer;
        globalThis.triggerPiDay = startPiDay;
        globalThis.triggerCosmonautics = startCosmonautics;
        globalThis.triggerAprilFools = startAprilFools;
    } catch (e) {}

    // Automatic activation on real holiday dates
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();

    if ((month === 12 && day >= 25) || (month === 1 && day <= 7)) {
        startNewYear();
    } else if ((month === 10 && day >= 28) || (month === 11 && day <= 1)) {
        startHalloween();
    } else if (month === 2 && day >= 13 && day <= 15) {
        startValentine();
    } else if (month === 9 && day >= 12 && day <= 14) {
        startProgrammer();
    } else if (month === 3 && day === 14) {
        startPiDay();
    } else if (month === 4 && day === 12) {
        startCosmonautics();
    } else if (month === 4 && day === 1) {
        startAprilFools();
    }

    // Print helpful commands in console
    console.log(
        '%c🎉 Custom Holiday Environments Ready!\n' +
        '%c• triggerHalloween()     - Blood Harvest Moon, creepy trees, cemetery mist\n' +
        '• triggerNewYear()       - Aurora Borealis, snowy pine forest, fireworks\n' +
        '• triggerValentine()     - Ringed romantic planet, nebula & hearts\n' +
        '• triggerProgrammer()    - 3D Synthwave cyber grid & binary stream\n' +
        '• triggerCosmonautics()  - Realistic Earth from orbit & Vostok rocket\n' +
        '• triggerPiDay()         - Giant π symbol & falling digits\n' +
        '• triggerAprilFools()    - April fools UI mischief\n' +
        '• stopHolidays()         - Return to default Space Horizon background',
        'color: #DFFFB3; font-weight: bold; font-size: 13px;',
        'color: #9cb08c; font-size: 11px; line-height: 1.6;'
    );

})();
