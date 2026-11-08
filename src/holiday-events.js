/**
 * 🎄 Holiday Events System & Custom Background Environments
 * Seasonal visual effects, fully custom dynamic backgrounds & manual console triggers
 *
 * Console triggers available:
 *   triggerNewYear()       — Aurora Borealis, cozy mountain cabin with glowing window, snowy pine forest, snowflakes & fireworks
 *   triggerHalloween()     — Blood Harvest Moon, grounded graveyard crosses/tombstones, creepy trees, bats & pumpkins
 *   triggerValentine()     — Saturn-like ringed planet, romantic nebula & floating hearts
 *   triggerProgrammer()    — 3D Synthwave cyber grid & binary matrix stream (Day 256)
 *   triggerPiDay()         — Floating digits of π & giant celestial pi symbol
 *   triggerCosmonautics()  — Realistic Earth from orbit view & Gagarin's Vostok rocket (SVG & accurate trajectory)
 *   triggerAprilFools()    — UI tilt, element jiggle & funny placeholders
 *   stopHolidays()         — Reset and remove all active holiday effects & restore default space background
 */
(function () {
    'use strict';

    let activeRaf = null;
    let activeIntervals = [];
    let activeTimeouts = [];

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

    // Dynamic Slime Cursor Theme Customizer
    function updateSlimeCursorGradient(theme) {
        const grad = document.getElementById('fluid-water-grad');
        if (!grad) return;
        const stops = grad.querySelectorAll('stop');
        if (stops.length < 4) return;

        if (theme === 'halloween') {
            stops[0].setAttribute('stop-color', '#ffffff');
            stops[1].setAttribute('stop-color', '#ffaa00');
            stops[2].setAttribute('stop-color', '#ff4400');
            stops[3].setAttribute('stop-color', '#3a0a20');
        } else if (theme === 'newyear') {
            stops[0].setAttribute('stop-color', '#ffffff');
            stops[1].setAttribute('stop-color', '#5ce1e6');
            stops[2].setAttribute('stop-color', '#38ef7d');
            stops[3].setAttribute('stop-color', '#091c33');
        } else if (theme === 'valentine') {
            stops[0].setAttribute('stop-color', '#ffffff');
            stops[1].setAttribute('stop-color', '#ff80ab');
            stops[2].setAttribute('stop-color', '#ff4081');
            stops[3].setAttribute('stop-color', '#4a0e2e');
        } else if (theme === 'programmer') {
            stops[0].setAttribute('stop-color', '#ffffff');
            stops[1].setAttribute('stop-color', '#39ff14');
            stops[2].setAttribute('stop-color', '#00cc44');
            stops[3].setAttribute('stop-color', '#062006');
        } else if (theme === 'cosmonautics') {
            stops[0].setAttribute('stop-color', '#ffffff');
            stops[1].setAttribute('stop-color', '#64d8ff');
            stops[2].setAttribute('stop-color', '#0091ea');
            stops[3].setAttribute('stop-color', '#071b38');
        } else {
            // Default Space Lime
            stops[0].setAttribute('stop-color', '#ffffff');
            stops[1].setAttribute('stop-color', '#DFFFB3');
            stops[2].setAttribute('stop-color', '#404D2D');
            stops[3].setAttribute('stop-color', '#404D2D');
        }
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

    function showHolidayBanner(iconHtml, title, subtitle, accentColor) {
        document.querySelectorAll('.holiday-banner').forEach(b => b.remove());

        const banner = document.createElement('div');
        banner.className = 'holiday-banner';
        banner.style.setProperty('--holiday-accent', accentColor);
        banner.innerHTML = `
            <div class="holiday-banner-content">
                <span class="holiday-banner-emoji">${iconHtml}</span>
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
        }, 5500);
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
        updateSlimeCursorGradient('default');

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
       1. 🎃 HALLOWEEN — Blood Moon, Spooky Forest & Grounded Graveyard
       ================================================================== */
    function startHalloween() {
        stopHolidays();
        hideDefaultSpaceBackground();
        updateSlimeCursorGradient('halloween');
        document.body.classList.add('holiday-halloween');

        const canvas = createOverlayCanvas('holiday-halloween-canvas');
        const ctx = canvas.getContext('2d');
        let w = canvas.width, h = canvas.height;

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

        function getHillY(x) {
            const normX = Math.max(0, Math.min(1, x / w));
            return h - (h * 0.16) - Math.sin(normX * Math.PI * 2.2) * (h * 0.06);
        }

        function drawSpookyTree(ctx, x, y, scale, flip) {
            ctx.save();
            ctx.translate(x, y);
            ctx.scale(flip ? -scale : scale, scale);
            ctx.fillStyle = '#0a0512';

            ctx.beginPath();
            ctx.moveTo(-10, 0);
            ctx.quadraticCurveTo(-6, -60, -3, -110);
            ctx.quadraticCurveTo(0, -140, 4, -165);
            ctx.lineTo(-2, -165);
            ctx.quadraticCurveTo(-14, -130, -18, -60);
            ctx.lineTo(-24, 0);
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(-8, -65);
            ctx.quadraticCurveTo(-35, -85, -55, -80);
            ctx.quadraticCurveTo(-40, -95, -28, -80);
            ctx.quadraticCurveTo(-15, -75, -6, -72);
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(0, -95);
            ctx.quadraticCurveTo(25, -120, 50, -115);
            ctx.quadraticCurveTo(35, -135, 20, -120);
            ctx.quadraticCurveTo(8, -105, 1, -100);
            ctx.fill();

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

            // 1. NIGHT SKY GRADIENT
            const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
            skyGrad.addColorStop(0, '#06020a');
            skyGrad.addColorStop(0.35, '#12041d');
            skyGrad.addColorStop(0.7, '#240a2d');
            skyGrad.addColorStop(1, '#360d26');
            ctx.fillStyle = skyGrad;
            ctx.fillRect(0, 0, w, h);

            // 2. STARS
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

            const moonGlow = ctx.createRadialGradient(moonX, moonY, moonR * 0.8, moonX, moonY, moonR * 2.8);
            moonGlow.addColorStop(0, 'rgba(255, 120, 20, 0.45)');
            moonGlow.addColorStop(0.4, 'rgba(200, 50, 40, 0.2)');
            moonGlow.addColorStop(0.75, 'rgba(120, 20, 80, 0.08)');
            moonGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = moonGlow;
            ctx.beginPath();
            ctx.arc(moonX, moonY, moonR * 2.8, 0, Math.PI * 2);
            ctx.fill();

            const moonGrad = ctx.createRadialGradient(moonX - moonR * 0.3, moonY - moonR * 0.3, 0, moonX, moonY, moonR);
            moonGrad.addColorStop(0, '#ffe08a');
            moonGrad.addColorStop(0.45, '#ff8a1e');
            moonGrad.addColorStop(0.85, '#d92c0a');
            moonGrad.addColorStop(1, '#941414');
            ctx.fillStyle = moonGrad;
            ctx.beginPath();
            ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = 'rgba(100, 10, 10, 0.22)';
            ctx.beginPath();
            ctx.arc(moonX - moonR * 0.25, moonY - moonR * 0.15, moonR * 0.22, 0, Math.PI * 2);
            ctx.arc(moonX + moonR * 0.22, moonY + moonR * 0.18, moonR * 0.32, 0, Math.PI * 2);
            ctx.arc(moonX - moonR * 0.1, moonY + moonR * 0.35, moonR * 0.18, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = 'rgba(30, 8, 38, 0.45)';
            ctx.beginPath();
            ctx.ellipse(moonX + Math.sin(time * 0.3) * 35, moonY + moonR * 0.3, moonR * 1.5, moonR * 0.25, -0.15, 0, Math.PI * 2);
            ctx.fill();

            // 4. DISTANT HILLS
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

            // 5. NEAR GRAVEYARD HILL
            ctx.fillStyle = '#0c0514';
            ctx.beginPath();
            ctx.moveTo(0, h);
            for (let i = 0; i <= 25; i++) {
                const normX = i / 25;
                const hx = normX * w;
                const hy = getHillY(hx);
                ctx.lineTo(hx, hy);
            }
            ctx.lineTo(w, h);
            ctx.closePath();
            ctx.fill();

            // 6. GROUNDED TREES, TOMBSTONES & CROSS (STRICTLY ON GROUND)
            const leftTreeX = Math.max(50, w * 0.07);
            drawSpookyTree(ctx, leftTreeX, getHillY(leftTreeX), 0.95, false);

            const rightTreeX = Math.min(w - 50, w * 0.93);
            drawSpookyTree(ctx, rightTreeX, getHillY(rightTreeX), 0.9, true);

            // Tombstone 1
            const t1X = w * 0.18;
            const t1Y = getHillY(t1X);
            ctx.fillStyle = '#08030e';
            ctx.beginPath();
            ctx.roundRect(t1X - 8, t1Y - 24, 16, 26, [8, 8, 0, 0]);
            ctx.fill();

            // Tombstone 2
            const t2X = w * 0.81;
            const t2Y = getHillY(t2X);
            ctx.beginPath();
            ctx.roundRect(t2X - 9, t2Y - 26, 18, 28, [9, 9, 0, 0]);
            ctx.fill();

            // Weathered Tilted Graveyard Cross — rooted strictly into the ground!
            const crossX = w * 0.865;
            const crossY = getHillY(crossX);
            ctx.save();
            ctx.translate(crossX, crossY);
            ctx.rotate(0.08); // old tilted cross
            ctx.fillStyle = '#08030e';
            ctx.fillRect(-2.5, -34, 5, 36); // vertical beam
            ctx.fillRect(-10, -25, 20, 4);  // crossbeam
            ctx.restore();

            // 7. CREEPING MIST WAVES
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

            // 8. BATS
            bats.forEach(bat => {
                bat.x += bat.speedX;
                bat.y += bat.speedY + Math.sin(time * 2 + bat.wingPhase) * 0.5;

                if (bat.x > w + 40) bat.x = -40;
                if (bat.x < -40) bat.x = w + 40;
                if (bat.y > h * 0.6) bat.speedY = -Math.abs(bat.speedY);
                if (bat.y < -30) bat.speedY = Math.abs(bat.speedY);

                bat.wingPhase += bat.wingSpeed;
                drawBat(ctx, bat.x, bat.y, bat.size, Math.sin(bat.wingPhase) * 0.5);
            });

            // 9. PUMPKINS
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
        showHolidayBanner('🎃', 'Happy Halloween!', 'Blood Moon, grounded graveyard & spooky forest', '#ff6600');
    }


    /* ==================================================================
       2. 🎄 NEW YEAR / CHRISTMAS — Magical Aurora, Cabin & Pine Forest
       ================================================================== */
    function startNewYear() {
        stopHolidays();
        hideDefaultSpaceBackground();
        updateSlimeCursorGradient('newyear');
        document.body.classList.add('holiday-newyear');

        const canvas = createOverlayCanvas('holiday-snow-canvas');
        const ctx = canvas.getContext('2d');
        let w = canvas.width, h = canvas.height;

        // 3 Layers of Snowflakes (Depth effect)
        const flakes = [];
        const TOTAL_SNOW = 160;
        for (let i = 0; i < TOTAL_SNOW; i++) {
            const layer = (i < 90) ? 0 : (i < 140 ? 1 : 2); // 0=far, 1=mid, 2=front
            flakes.push({
                x: Math.random() * w,
                y: Math.random() * h,
                layer: layer,
                r: layer === 0 ? (1 + Math.random() * 1.2) : (layer === 1 ? (2 + Math.random() * 1.5) : (3.5 + Math.random() * 2)),
                speed: layer === 0 ? (0.6 + Math.random() * 0.6) : (layer === 1 ? (1.1 + Math.random() * 0.8) : (1.8 + Math.random() * 1.2)),
                wind: (Math.random() - 0.5) * 0.8,
                alpha: layer === 0 ? 0.35 : (layer === 1 ? 0.6 : 0.85),
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
                hue: [35, 60, 140, 185, 275, 335][Math.floor(Math.random() * 6)],
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

        // Ground function for New Year Hills
        function getSnowHillY(x) {
            const norm = Math.max(0, Math.min(1, x / w));
            return h - (h * 0.15) - Math.sin(norm * Math.PI * 2.2) * (h * 0.06);
        }

        function drawDetailedPine(ctx, x, y, size) {
            ctx.save();
            ctx.translate(x, y);

            // Trunk
            ctx.fillStyle = '#040b14';
            ctx.fillRect(-2.5, 0, 5, size * 0.22);

            // 4 tiers of snowy branches
            for (let i = 0; i < 4; i++) {
                const ty = -size * 0.2 - i * (size * 0.22);
                const tw = size * (0.42 - i * 0.08);
                const th = size * 0.32;

                ctx.fillStyle = '#061322';
                ctx.beginPath();
                ctx.moveTo(0, ty - th);
                ctx.lineTo(tw, ty);
                ctx.lineTo(-tw, ty);
                ctx.closePath();
                ctx.fill();

                // Snow crest
                ctx.fillStyle = 'rgba(235, 248, 255, 0.75)';
                ctx.beginPath();
                ctx.moveTo(-tw * 0.95, ty);
                ctx.quadraticCurveTo(-tw * 0.3, ty - 6, 0, ty - 3);
                ctx.quadraticCurveTo(tw * 0.3, ty - 6, tw * 0.95, ty);
                ctx.lineTo(tw * 0.7, ty + 2);
                ctx.quadraticCurveTo(0, ty, -tw * 0.7, ty + 2);
                ctx.closePath();
                ctx.fill();
            }
            ctx.restore();
        }

        // Cozy Wooden Cabin with glowing window & chimney smoke
        function drawCozyCabin(ctx, x, y, size, time) {
            ctx.save();
            ctx.translate(x, y);

            // Cabin Body (Dark logs)
            ctx.fillStyle = '#110b06';
            ctx.fillRect(-size * 0.5, -size * 0.45, size, size * 0.45);

            // Chimney
            ctx.fillStyle = '#1c140f';
            ctx.fillRect(size * 0.22, -size * 0.85, size * 0.16, size * 0.45);

            // Chimney Smoke curling upward
            for (let i = 0; i < 6; i++) {
                const sp = ((time * 0.4 + i / 6) % 1.0);
                const smkX = size * 0.3 + Math.sin(time * 1.5 + i) * (10 + sp * 18);
                const smkY = -size * 0.85 - sp * 65;
                const smkR = 3 + sp * 10;
                ctx.fillStyle = `rgba(210, 225, 240, ${(1.0 - sp) * 0.25})`;
                ctx.beginPath();
                ctx.arc(smkX, smkY, smkR, 0, Math.PI * 2);
                ctx.fill();
            }

            // Gabled Roof
            ctx.fillStyle = '#080503';
            ctx.beginPath();
            ctx.moveTo(0, -size * 0.75);
            ctx.lineTo(size * 0.65, -size * 0.42);
            ctx.lineTo(-size * 0.65, -size * 0.42);
            ctx.closePath();
            ctx.fill();

            // Thick Snowdrifts on Roof
            ctx.fillStyle = 'rgba(235, 248, 255, 0.9)';
            ctx.beginPath();
            ctx.moveTo(0, -size * 0.82);
            ctx.quadraticCurveTo(size * 0.35, -size * 0.62, size * 0.68, -size * 0.42);
            ctx.lineTo(size * 0.62, -size * 0.38);
            ctx.quadraticCurveTo(size * 0.3, -size * 0.55, 0, -size * 0.73);
            ctx.quadraticCurveTo(-size * 0.3, -size * 0.55, -size * 0.62, -size * 0.38);
            ctx.lineTo(-size * 0.68, -size * 0.42);
            ctx.quadraticCurveTo(-size * 0.35, -size * 0.62, 0, -size * 0.82);
            ctx.closePath();
            ctx.fill();

            // Warm Glowing Window with light cast on snow
            const winX = -size * 0.28;
            const winY = -size * 0.34;
            const winW = size * 0.26;
            const winH = size * 0.22;

            // Window Warm Light Halo
            const wGlow = ctx.createRadialGradient(winX + winW / 2, winY + winH / 2, 2, winX + winW / 2, winY + winH / 2, size * 0.9);
            wGlow.addColorStop(0, 'rgba(255, 220, 110, 0.55)');
            wGlow.addColorStop(0.4, 'rgba(255, 170, 50, 0.25)');
            wGlow.addColorStop(1, 'rgba(255, 150, 20, 0)');
            ctx.fillStyle = wGlow;
            ctx.beginPath();
            ctx.arc(winX + winW / 2, winY + winH / 2, size * 0.9, 0, Math.PI * 2);
            ctx.fill();

            // Window Glass
            ctx.fillStyle = '#ffe066';
            ctx.fillRect(winX, winY, winW, winH);

            // Window Pane Frame
            ctx.strokeStyle = '#221406';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(winX, winY, winW, winH);
            ctx.beginPath();
            ctx.moveTo(winX + winW / 2, winY);
            ctx.lineTo(winX + winW / 2, winY + winH);
            ctx.moveTo(winX, winY + winH / 2);
            ctx.lineTo(winX + winW, winY + winH / 2);
            ctx.stroke();

            // Door
            ctx.fillStyle = '#1c0f06';
            ctx.fillRect(size * 0.1, -size * 0.35, size * 0.22, size * 0.35);

            ctx.restore();
        }

        let time = 0;
        let nextFirework = 75;

        function renderNewYear() {
            time += 0.016;
            w = canvas.width;
            h = canvas.height;
            ctx.clearRect(0, 0, w, h);

            // 1. DEEP FROSTY NIGHT SKY
            const nightSky = ctx.createLinearGradient(0, 0, 0, h);
            nightSky.addColorStop(0, '#030814');
            nightSky.addColorStop(0.35, '#061326');
            nightSky.addColorStop(0.7, '#0a203d');
            nightSky.addColorStop(1, '#112f54');
            ctx.fillStyle = nightSky;
            ctx.fillRect(0, 0, w, h);

            // 2. CRESCENT MOON
            const moonX = w * 0.82;
            const moonY = h * 0.18;
            const moonR = 24;

            ctx.save();
            ctx.shadowColor = 'rgba(255, 235, 180, 0.6)';
            ctx.shadowBlur = 18;
            ctx.fillStyle = '#fff4cc';
            ctx.beginPath();
            ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
            ctx.fill();
            // Subtract for crescent
            ctx.globalCompositeOperation = 'destination-out';
            ctx.beginPath();
            ctx.arc(moonX - moonR * 0.55, moonY - moonR * 0.15, moonR * 0.9, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // 3. AURORA BOREALIS (Multi-wave Northern Lights)
            const auroraWaves = [
                { color1: 'rgba(56, 239, 125, 0.22)', color2: 'rgba(56, 239, 125, 0)', speed: 0.9, yOffset: h * 0.24, amp: 48 },
                { color1: 'rgba(26, 188, 156, 0.18)', color2: 'rgba(26, 188, 156, 0)', speed: 1.3, yOffset: h * 0.30, amp: 60 },
                { color1: 'rgba(155, 89, 182, 0.15)', color2: 'rgba(155, 89, 182, 0)', speed: 0.7, yOffset: h * 0.20, amp: 38 }
            ];

            auroraWaves.forEach(aw => {
                ctx.save();
                const aGrad = ctx.createLinearGradient(0, aw.yOffset - aw.amp * 1.5, 0, aw.yOffset + aw.amp);
                aGrad.addColorStop(0, aw.color2);
                aGrad.addColorStop(0.5, aw.color1);
                aGrad.addColorStop(1, aw.color2);
                ctx.fillStyle = aGrad;
                ctx.beginPath();
                ctx.moveTo(0, 0);

                const segments = 24;
                for (let i = 0; i <= segments; i++) {
                    const norm = i / segments;
                    const ax = norm * w;
                    const ay = aw.yOffset + Math.sin(norm * 4 + time * aw.speed) * aw.amp
                                          + Math.cos(norm * 2.5 - time * 0.5) * 22;
                    ctx.lineTo(ax, ay);
                }
                ctx.lineTo(w, 0);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            });

            // 4. DISTANT SNOWY MOUNTAIN RANGE
            ctx.fillStyle = '#08172c';
            ctx.beginPath();
            ctx.moveTo(0, h);
            for (let i = 0; i <= 20; i++) {
                const norm = i / 20;
                const mx = norm * w;
                const my = h - (h * 0.24) - Math.sin(norm * Math.PI * 1.5 + 0.3) * (h * 0.08);
                ctx.lineTo(mx, my);
            }
            ctx.lineTo(w, h);
            ctx.closePath();
            ctx.fill();

            // 5. NEAR SNOWY HILLS HORIZON
            const hillGrad = ctx.createLinearGradient(0, h - h * 0.2, 0, h);
            hillGrad.addColorStop(0, '#0e2948');
            hillGrad.addColorStop(1, '#153964');
            ctx.fillStyle = hillGrad;
            ctx.beginPath();
            ctx.moveTo(0, h);
            for (let i = 0; i <= 25; i++) {
                const norm = i / 25;
                const hx = norm * w;
                const hy = getSnowHillY(hx);
                ctx.lineTo(hx, hy);
            }
            ctx.lineTo(w, h);
            ctx.closePath();
            ctx.fill();

            // Snow-crested Ridge Line
            ctx.strokeStyle = 'rgba(225, 245, 255, 0.55)';
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            for (let i = 0; i <= 25; i++) {
                const norm = i / 25;
                const hx = norm * w;
                const hy = getSnowHillY(hx);
                if (i === 0) ctx.moveTo(hx, hy);
                else ctx.lineTo(hx, hy);
            }
            ctx.stroke();

            // 6. COZY WOODEN CABIN NESTLED ON THE HILL
            const cabinX = w * 0.22;
            const cabinY = getSnowHillY(cabinX);
            drawCozyCabin(ctx, cabinX, cabinY, 54, time);

            // 7. SNOWY PINES (Grounded on Hill)
            const pinePositions = [
                0.05, 0.09, 0.14, 0.31, 0.36, 0.74, 0.79, 0.85, 0.91, 0.96
            ];
            pinePositions.forEach(pNorm => {
                const tx = pNorm * w;
                const ty = getSnowHillY(tx);
                drawDetailedPine(ctx, tx, ty, 48 + (pNorm * 120) % 22);
            });

            // 8. MULTI-LAYER SNOWFALL
            flakes.forEach(f => {
                f.y += f.speed;
                f.x += f.wind + Math.sin(time * 0.9 + f.phase) * 0.45;
                if (f.y > h + 10) { f.y = -10; f.x = Math.random() * w; }
                if (f.x > w + 10) f.x = -10;
                if (f.x < -10) f.x = w + 10;

                ctx.fillStyle = `rgba(255, 255, 255, ${f.alpha})`;
                ctx.beginPath();
                ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
                ctx.fill();
            });

            // 9. HOLIDAY FIREWORKS
            nextFirework--;
            if (nextFirework <= 0) {
                spawnFirework();
                nextFirework = 80 + Math.floor(Math.random() * 100);
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
                ctx.shadowBlur = 7;
                ctx.fillStyle = `hsla(${s.hue}, 90%, 70%, ${s.life})`;
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.size * s.life, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            }

            activeRaf = requestAnimationFrame(renderNewYear);
        }

        renderNewYear();
        showHolidayBanner('🎄', 'С Новым Годом!', 'Magical Aurora, cozy mountain cabin & holiday fireworks', '#5ce1e6');
    }


    /* ==================================================================
       3. 💕 VALENTINE'S DAY — Ringed Planet & Heart Nebula
       ================================================================== */
    function startValentine() {
        stopHolidays();
        hideDefaultSpaceBackground();
        updateSlimeCursorGradient('valentine');
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

            // 2. RINGED ROMANTIC PLANET
            const planetX = w * 0.5;
            const planetY = h * 1.15;
            const planetR = Math.max(w * 0.52, h * 0.62);

            const pGlow = ctx.createRadialGradient(planetX, planetY, 0, planetX, planetY, planetR * 1.25);
            pGlow.addColorStop(0, 'rgba(255, 64, 129, 0.35)');
            pGlow.addColorStop(0.5, 'rgba(180, 40, 100, 0.2)');
            pGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = pGlow;
            ctx.beginPath();
            ctx.arc(planetX, planetY, planetR * 1.25, 0, Math.PI * 2);
            ctx.fill();

            const pGrad = ctx.createRadialGradient(planetX - planetR * 0.2, planetY - planetR * 0.4, 0, planetX, planetY, planetR);
            pGrad.addColorStop(0, '#ff9ebb');
            pGrad.addColorStop(0.4, '#e74c8b');
            pGrad.addColorStop(0.8, '#8e1f58');
            pGrad.addColorStop(1, '#45092a');
            ctx.fillStyle = pGrad;
            ctx.beginPath();
            ctx.arc(planetX, planetY, planetR, 0, Math.PI * 2);
            ctx.fill();

            // Ring
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

            // 3. FLOATING HEARTS
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
        showHolidayBanner('💕', 'Happy Valentine\'s Day!', 'Ringed planet of romance & floating hearts ❤️', '#ff4081');
    }


    /* ==================================================================
       4. 👨‍💻 PROGRAMMER'S DAY — 3D Cyber Wireframe Grid & Binary Stream
       ================================================================== */
    function startProgrammer() {
        stopHolidays();
        hideDefaultSpaceBackground();
        updateSlimeCursorGradient('programmer');
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

            const sky = ctx.createLinearGradient(0, 0, 0, h);
            sky.addColorStop(0, '#060a06');
            sky.addColorStop(0.5, '#0c160c');
            sky.addColorStop(1, '#142514');
            ctx.fillStyle = sky;
            ctx.fillRect(0, 0, w, h);

            const horizonY = h * 0.62;
            ctx.save();

            const vpX = w * 0.5;
            const numLines = 26;
            ctx.strokeStyle = 'rgba(0, 255, 102, 0.22)';
            ctx.lineWidth = 1.2;

            for (let i = -numLines; i <= numLines; i++) {
                const bottomX = vpX + i * 45;
                ctx.beginPath();
                ctx.moveTo(vpX, horizonY);
                ctx.lineTo(bottomX, h);
                ctx.stroke();
            }

            for (let y = 0; y < (h - horizonY); y += 14) {
                const depthNorm = Math.pow(y / (h - horizonY), 2.2);
                const lineY = horizonY + depthNorm * (h - horizonY) + (gridOffset * depthNorm * 0.4);
                if (lineY <= h) {
                    ctx.strokeStyle = `rgba(0, 255, 102, ${0.08 + depthNorm * 0.35})`;
                    ctx.lineWidth = 1 + depthNorm * 1.5;
                    ctx.beginPath();
                    ctx.moveTo(0, lineY);
                    ctx.lineTo(w, lineY);
                    ctx.stroke();
                }
            }

            const hGlow = ctx.createLinearGradient(0, horizonY - 4, 0, horizonY + 8);
            hGlow.addColorStop(0, 'rgba(0, 255, 102, 0.45)');
            hGlow.addColorStop(1, 'rgba(0, 255, 102, 0)');
            ctx.fillStyle = hGlow;
            ctx.fillRect(0, horizonY - 4, w, 12);
            ctx.restore();

            ctx.font = `${fontSize}px monospace`;
            for (let i = 0; i < cols; i++) {
                if (Math.random() > 0.96) {
                    const char = Math.random() > 0.5 ? '1' : '0';
                    const x = i * fontSize;
                    const y = drops[i] * fontSize;

                    if (y < horizonY) {
                        ctx.fillStyle = `rgba(0, 255, 102, ${0.18 + Math.random() * 0.35})`;
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
        showHolidayBanner('👨‍💻', 'Happy Programmer\'s Day!', '3D Cyber Grid & binary stream — Day 256 (0x100)', '#00ff66');
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

            const sky = ctx.createLinearGradient(0, 0, 0, h);
            sky.addColorStop(0, '#0a0d14');
            sky.addColorStop(0.5, '#121824');
            sky.addColorStop(1, '#1b2333');
            ctx.fillStyle = sky;
            ctx.fillRect(0, 0, w, h);

            ctx.save();
            ctx.fillStyle = 'rgba(223, 255, 179, 0.055)';
            ctx.font = `${Math.min(w, h) * 0.45}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('π', w * 0.5, h * 0.52);
            ctx.restore();

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
       6. 🚀 COSMONAUTICS DAY — Earth from Orbit & Vostok Rocket (SVG & Angle Fix)
       ================================================================== */
    function startCosmonautics() {
        stopHolidays();
        hideDefaultSpaceBackground();
        updateSlimeCursorGradient('cosmonautics');
        document.body.classList.add('holiday-cosmonautics');

        const canvas = createOverlayCanvas('holiday-cosmo-canvas');
        const ctx = canvas.getContext('2d');
        let w = canvas.width, h = canvas.height;

        let rocketX = -130;
        let rocketY = h * 0.65;
        const rocketSpeedX = 2.8;
        const rocketSpeedY = -1.1; // Smooth diagonal upward trajectory
        const trail = [];
        let launched = false;
        let t = 0;

        // Vostok Rocket drawn oriented along +X (nose to the right), then rotated exactly to trajectoryAngle
        function drawVectorVostokRocket(ctx, x, y, angle, length) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);

            const wHalf = length * 0.14;
            const lHalf = length * 0.5;

            // Exhaust Plasma Fire (pointing backwards to -X)
            const flameLen = length * (0.45 + Math.sin(t * 0.8) * 0.12);
            const flameGrad = ctx.createLinearGradient(-lHalf, 0, -lHalf - flameLen, 0);
            flameGrad.addColorStop(0, '#ffffff');
            flameGrad.addColorStop(0.2, '#fff176');
            flameGrad.addColorStop(0.5, '#ff9800');
            flameGrad.addColorStop(0.85, '#ff3d00');
            flameGrad.addColorStop(1, 'rgba(255, 50, 0, 0)');
            ctx.fillStyle = flameGrad;
            ctx.beginPath();
            ctx.moveTo(-lHalf, -wHalf * 0.6);
            ctx.lineTo(-lHalf - flameLen, 0);
            ctx.lineTo(-lHalf, wHalf * 0.6);
            ctx.closePath();
            ctx.fill();

            // Stabilizer Fins (Red)
            ctx.fillStyle = '#d32f2f';
            ctx.beginPath();
            // Top Fin
            ctx.moveTo(-lHalf * 0.6, -wHalf);
            ctx.lineTo(-lHalf * 1.05, -wHalf * 2.2);
            ctx.lineTo(-lHalf * 0.9, -wHalf);
            ctx.closePath();
            ctx.fill();
            // Bottom Fin
            ctx.beginPath();
            ctx.moveTo(-lHalf * 0.6, wHalf);
            ctx.lineTo(-lHalf * 1.05, wHalf * 2.2);
            ctx.lineTo(-lHalf * 0.9, wHalf);
            ctx.closePath();
            ctx.fill();

            // Main Rocket Fuselage (Titanium / White Cylindrical Hull)
            const hullGrad = ctx.createLinearGradient(0, -wHalf, 0, wHalf);
            hullGrad.addColorStop(0, '#ffffff');
            hullGrad.addColorStop(0.35, '#e0e6ed');
            hullGrad.addColorStop(0.7, '#b0bec5');
            hullGrad.addColorStop(1, '#607d8b');
            ctx.fillStyle = hullGrad;
            ctx.beginPath();
            ctx.roundRect(-lHalf, -wHalf, length * 0.75, wHalf * 2, [3, 0, 0, 3]);
            ctx.fill();

            // Red Nose Cone (pointing strictly along +X flight path)
            ctx.fillStyle = '#e53935';
            ctx.beginPath();
            ctx.moveTo(lHalf * 0.5, -wHalf);
            ctx.quadraticCurveTo(lHalf * 0.85, -wHalf * 0.4, lHalf, 0);
            ctx.quadraticCurveTo(lHalf * 0.85, wHalf * 0.4, lHalf * 0.5, wHalf);
            ctx.closePath();
            ctx.fill();

            // Red decorative band
            ctx.fillStyle = '#c62828';
            ctx.fillRect(-lHalf * 0.15, -wHalf, length * 0.08, wHalf * 2);

            // Cosmonaut Glass Porthole (Cyan-Blue with shine)
            const portholeX = lHalf * 0.25;
            ctx.fillStyle = '#00d2ff';
            ctx.shadowColor = '#00d2ff';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(portholeX, 0, wHalf * 0.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Porthole rim & glass gleam
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.2;
            ctx.stroke();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(portholeX - wHalf * 0.15, -wHalf * 0.15, wHalf * 0.16, 0, Math.PI * 2);
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
            ctx.fillStyle = '#04070d';
            ctx.fillRect(0, 0, w, h);

            // 2. BLUE PLANET EARTH FROM ORBIT (Atmospheric rim & ocean below)
            const earthX = w * 0.5;
            const earthY = h * 1.18;
            const earthR = Math.max(w * 0.58, h * 0.70);

            // Outer Atmospheric Rayleigh Blue Glow
            const atmoGlow = ctx.createRadialGradient(earthX, earthY, earthR * 0.94, earthX, earthY, earthR * 1.18);
            atmoGlow.addColorStop(0, 'rgba(0, 210, 255, 0.45)');
            atmoGlow.addColorStop(0.35, 'rgba(0, 140, 255, 0.25)');
            atmoGlow.addColorStop(0.7, 'rgba(10, 70, 180, 0.08)');
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

            // 3. VOSTOK ROCKET FLIGHT (Exact trajectory orientation)
            if (launched) {
                rocketX += rocketSpeedX;
                rocketY += rocketSpeedY;

                const trajectoryAngle = Math.atan2(rocketSpeedY, rocketSpeedX);

                if (t % 2 === 0) {
                    trail.push({
                        x: rocketX - Math.cos(trajectoryAngle) * 25,
                        y: rocketY - Math.sin(trajectoryAngle) * 25,
                        size: 4 + Math.random() * 4,
                        alpha: 0.5,
                        vx: -Math.cos(trajectoryAngle) * 1.5 + (Math.random() - 0.5) * 0.6,
                        vy: -Math.sin(trajectoryAngle) * 1.5 + (Math.random() - 0.5) * 0.6
                    });
                }

                for (let i = trail.length - 1; i >= 0; i--) {
                    const p = trail[i];
                    p.x += p.vx;
                    p.y += p.vy;
                    p.alpha -= 0.01;
                    p.size += 0.12;
                    if (p.alpha <= 0) { trail.splice(i, 1); continue; }

                    ctx.fillStyle = `rgba(220, 235, 255, ${p.alpha})`;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fill();
                }

                if (rocketX < w + 200 && rocketY > -200) {
                    drawVectorVostokRocket(ctx, rocketX, rocketY, trajectoryAngle, 52);
                }

                if (rocketX > w + 300 || rocketY < -300) {
                    rocketX = -130;
                    rocketY = h * 0.65 + (Math.random() - 0.5) * 100;
                    trail.length = 0;
                    launched = false;
                    const nextT = setTimeout(() => { launched = true; }, 7000 + Math.random() * 9000);
                    activeTimeouts.push(nextT);
                }
            }

            activeRaf = requestAnimationFrame(renderCosmo);
        }

        // SVG Rocket Icon for Banner
        const svgRocketIcon = `
            <svg class="holiday-banner-svg" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M48 16C36 18 26 28 22 40L28 46C40 42 50 32 52 20L48 16Z" fill="#ECEFF1"/>
                <path d="M48 16L52 20C52 14 50 12 48 16Z" fill="#D32F2F"/>
                <circle cx="36" cy="30" r="4" fill="#00D2FF" stroke="#FFFFFF" stroke-width="1.5"/>
                <path d="M22 40L16 42L18 36L22 40Z" fill="#D32F2F"/>
                <path d="M28 46L30 52L24 50L28 46Z" fill="#D32F2F"/>
                <path d="M19 45L11 53C16 52 17 48 19 45Z" fill="#FF9800"/>
                <path d="M16 48L7 57C12 56 14 51 16 48Z" fill="#FF3D00"/>
            </svg>
        `;

        renderCosmo();
        showHolidayBanner(svgRocketIcon, 'День космонавтики!', 'View of Earth from orbit — «Поехали!» (12 апреля 1961)', '#00d2ff');
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
        '%c• triggerHalloween()     - Blood Harvest Moon, grounded graveyard, creepy trees\n' +
        '• triggerNewYear()       - Aurora Borealis, cozy mountain cabin, snowy forest\n' +
        '• triggerValentine()     - Ringed romantic planet, nebula & hearts\n' +
        '• triggerProgrammer()    - 3D Synthwave cyber grid & binary stream\n' +
        '• triggerCosmonautics()  - Realistic Earth from orbit & vector Vostok rocket\n' +
        '• triggerPiDay()         - Giant π symbol & falling digits\n' +
        '• triggerAprilFools()    - April fools UI mischief\n' +
        '• stopHolidays()         - Return to default Space Horizon background',
        'color: #DFFFB3; font-weight: bold; font-size: 13px;',
        'color: #9cb08c; font-size: 11px; line-height: 1.6;'
    );

})();
