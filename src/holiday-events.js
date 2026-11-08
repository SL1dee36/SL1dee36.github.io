/**
 * 🎄 Holiday Events System
 * Automatic seasonal visual effects based on the current date
 *
 * Events:
 *   🎄 New Year / Christmas  (Dec 25 – Jan 7)   — snowfall + fireworks
 *   🎃 Halloween             (Oct 28 – Nov 1)    — bats, pumpkins, spooky palette
 *   💕 Valentine's Day       (Feb 13 – 15)       — floating hearts
 *   👨‍💻 Programmer's Day      (Sep 12 – 14)       — binary rain + dev banner
 *   🥧 Pi Day                (Mar 14)            — digits of π floating
 *   🚀 Cosmonautics Day      (Apr 12)            — rocket flyby
 *   🃏 April Fools           (Apr 1)             — UI goes wild
 */
(function () {
    'use strict';

    const now = new Date();
    const month = now.getMonth() + 1;   // 1-12
    const day = now.getDate();           // 1-31

    // Detect active holiday(s)
    const activeHolidays = [];

    if ((month === 12 && day >= 25) || (month === 1 && day <= 7))
        activeHolidays.push('newyear');
    if (month === 10 && day >= 28 || month === 11 && day <= 1)
        activeHolidays.push('halloween');
    if (month === 2 && day >= 13 && day <= 15)
        activeHolidays.push('valentine');
    if (month === 9 && day >= 12 && day <= 14)
        activeHolidays.push('programmer');
    if (month === 3 && day === 14)
        activeHolidays.push('piday');
    if (month === 4 && day === 12)
        activeHolidays.push('cosmonautics');
    if (month === 4 && day === 1)
        activeHolidays.push('aprilfools');

    if (activeHolidays.length === 0) return;

    // Expose for debugging: window.activeHolidays
    window.__holidayEvents = activeHolidays;

    /* ======================================================================
       Utility: overlay canvas for particle effects
       ====================================================================== */
    function createOverlayCanvas(id) {
        const c = document.createElement('canvas');
        c.id = id;
        c.className = 'holiday-overlay-canvas';
        c.width = window.innerWidth;
        c.height = window.innerHeight;
        document.body.appendChild(c);
        window.addEventListener('resize', () => {
            c.width = window.innerWidth;
            c.height = window.innerHeight;
        });
        return c;
    }

    /* ======================================================================
       Utility: holiday banner notification
       ====================================================================== */
    function showHolidayBanner(emoji, title, subtitle, accentColor) {
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

        setTimeout(() => {
            banner.classList.remove('visible');
            setTimeout(() => banner.remove(), 600);
        }, 5000);
    }


    /* ==================================================================
       🎄 NEW YEAR / CHRISTMAS — Snowfall + Fireworks
       ================================================================== */
    if (activeHolidays.includes('newyear')) {
        document.body.classList.add('holiday-newyear');

        const canvas = createOverlayCanvas('holiday-snow-canvas');
        const ctx = canvas.getContext('2d');
        let w = canvas.width, h = canvas.height;
        window.addEventListener('resize', () => { w = canvas.width; h = canvas.height; });

        // Snowflakes
        const FLAKE_COUNT = 120;
        const flakes = [];
        for (let i = 0; i < FLAKE_COUNT; i++) {
            flakes.push({
                x: Math.random() * w,
                y: Math.random() * h,
                r: Math.random() * 3 + 1,
                speed: Math.random() * 1.5 + 0.5,
                wind: (Math.random() - 0.5) * 0.8,
                alpha: Math.random() * 0.6 + 0.3,
                phase: Math.random() * Math.PI * 2
            });
        }

        // Firework rockets
        const fireworks = [];
        const sparks = [];

        function spawnFirework() {
            fireworks.push({
                x: Math.random() * w * 0.6 + w * 0.2,
                y: h,
                targetY: Math.random() * h * 0.3 + h * 0.1,
                speed: 3 + Math.random() * 2,
                hue: [0, 30, 60, 120, 200, 280, 340][Math.floor(Math.random() * 7)],
                trail: []
            });
        }

        function explodeFirework(fw) {
            const count = 40 + Math.floor(Math.random() * 30);
            for (let i = 0; i < count; i++) {
                const angle = (Math.PI * 2 / count) * i + Math.random() * 0.3;
                const v = 2 + Math.random() * 3;
                sparks.push({
                    x: fw.x, y: fw.y,
                    vx: Math.cos(angle) * v,
                    vy: Math.sin(angle) * v,
                    life: 1,
                    decay: 0.012 + Math.random() * 0.008,
                    hue: fw.hue + Math.random() * 30 - 15,
                    size: 1.5 + Math.random()
                });
            }
        }

        let t = 0;
        let nextFirework = 60;

        function renderSnow() {
            t++;
            ctx.clearRect(0, 0, w, h);

            // Snowflakes
            flakes.forEach(f => {
                f.y += f.speed;
                f.x += f.wind + Math.sin(t * 0.01 + f.phase) * 0.3;
                if (f.y > h + 10) { f.y = -10; f.x = Math.random() * w; }
                if (f.x > w + 10) f.x = -10;
                if (f.x < -10) f.x = w + 10;

                ctx.fillStyle = `rgba(255, 255, 255, ${f.alpha})`;
                ctx.beginPath();
                ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
                ctx.fill();
            });

            // Fireworks (spawn every ~3s)
            nextFirework--;
            if (nextFirework <= 0) {
                spawnFirework();
                nextFirework = 120 + Math.floor(Math.random() * 120);
            }

            // Update rockets
            for (let i = fireworks.length - 1; i >= 0; i--) {
                const fw = fireworks[i];
                fw.y -= fw.speed;
                fw.trail.push({ x: fw.x, y: fw.y, alpha: 1 });
                if (fw.trail.length > 8) fw.trail.shift();

                // Draw trail
                fw.trail.forEach((tp, idx) => {
                    tp.alpha *= 0.85;
                    ctx.fillStyle = `hsla(${fw.hue}, 80%, 70%, ${tp.alpha * 0.6})`;
                    ctx.beginPath();
                    ctx.arc(tp.x, tp.y, 2, 0, Math.PI * 2);
                    ctx.fill();
                });

                if (fw.y <= fw.targetY) {
                    explodeFirework(fw);
                    fireworks.splice(i, 1);
                }
            }

            // Update sparks
            for (let i = sparks.length - 1; i >= 0; i--) {
                const s = sparks[i];
                s.x += s.vx;
                s.y += s.vy;
                s.vy += 0.04; // gravity
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

            requestAnimationFrame(renderSnow);
        }

        renderSnow();

        showHolidayBanner('🎄', 'С Новым Годом!', 'Happy New Year & Merry Christmas', '#ff6b6b');
    }


    /* ==================================================================
       🎃 HALLOWEEN — Bats, pumpkins, spooky palette
       ================================================================== */
    if (activeHolidays.includes('halloween')) {
        document.body.classList.add('holiday-halloween');

        const canvas = createOverlayCanvas('holiday-halloween-canvas');
        const ctx = canvas.getContext('2d');
        let w = canvas.width, h = canvas.height;
        window.addEventListener('resize', () => { w = canvas.width; h = canvas.height; });

        // Bats
        const BAT_COUNT = 12;
        const bats = [];
        for (let i = 0; i < BAT_COUNT; i++) {
            bats.push({
                x: Math.random() * w,
                y: Math.random() * h * 0.5,
                size: 8 + Math.random() * 10,
                speedX: (Math.random() - 0.5) * 2.5,
                speedY: (Math.random() - 0.5) * 1,
                wingPhase: Math.random() * Math.PI * 2,
                wingSpeed: 0.12 + Math.random() * 0.06
            });
        }

        // Floating pumpkins (emoji-based, drawn on canvas)
        const PUMPKIN_COUNT = 6;
        const pumpkins = [];
        for (let i = 0; i < PUMPKIN_COUNT; i++) {
            pumpkins.push({
                x: Math.random() * w,
                y: h + 40 + Math.random() * 200,
                size: 18 + Math.random() * 14,
                speedY: -(0.3 + Math.random() * 0.4),
                wobble: Math.random() * Math.PI * 2,
                alpha: 0.6 + Math.random() * 0.3
            });
        }

        let t = 0;

        function drawBat(x, y, size, wingAngle) {
            ctx.save();
            ctx.translate(x, y);
            ctx.fillStyle = '#1a1a2e';

            // Body
            ctx.beginPath();
            ctx.ellipse(0, 0, size * 0.25, size * 0.35, 0, 0, Math.PI * 2);
            ctx.fill();

            // Left wing
            ctx.save();
            ctx.rotate(wingAngle * 0.6);
            ctx.beginPath();
            ctx.moveTo(0, -size * 0.1);
            ctx.quadraticCurveTo(-size * 0.8, -size * 0.7, -size, -size * 0.1);
            ctx.quadraticCurveTo(-size * 0.5, size * 0.1, 0, size * 0.1);
            ctx.fill();
            ctx.restore();

            // Right wing
            ctx.save();
            ctx.rotate(-wingAngle * 0.6);
            ctx.beginPath();
            ctx.moveTo(0, -size * 0.1);
            ctx.quadraticCurveTo(size * 0.8, -size * 0.7, size, -size * 0.1);
            ctx.quadraticCurveTo(size * 0.5, size * 0.1, 0, size * 0.1);
            ctx.fill();
            ctx.restore();

            // Eyes
            ctx.fillStyle = '#ff6600';
            ctx.beginPath();
            ctx.arc(-size * 0.1, -size * 0.08, size * 0.06, 0, Math.PI * 2);
            ctx.arc(size * 0.1, -size * 0.08, size * 0.06, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }

        function renderHalloween() {
            t++;
            ctx.clearRect(0, 0, w, h);

            // Bats
            bats.forEach(bat => {
                bat.x += bat.speedX;
                bat.y += bat.speedY + Math.sin(t * 0.02 + bat.wingPhase) * 0.5;

                if (bat.x > w + 30) bat.x = -30;
                if (bat.x < -30) bat.x = w + 30;
                if (bat.y > h * 0.6) bat.speedY = -Math.abs(bat.speedY);
                if (bat.y < -30) bat.speedY = Math.abs(bat.speedY);

                bat.wingPhase += bat.wingSpeed;
                const wingAngle = Math.sin(bat.wingPhase) * 0.5;
                drawBat(bat.x, bat.y, bat.size, wingAngle);
            });

            // Pumpkins
            ctx.font = '32px serif';
            ctx.textAlign = 'center';
            pumpkins.forEach(p => {
                p.y += p.speedY;
                p.wobble += 0.015;
                const wx = Math.sin(p.wobble) * 20;

                if (p.y < -50) {
                    p.y = h + 40;
                    p.x = Math.random() * w;
                }

                ctx.globalAlpha = p.alpha;
                ctx.font = `${p.size}px serif`;
                ctx.fillText('🎃', p.x + wx, p.y);
            });
            ctx.globalAlpha = 1;

            requestAnimationFrame(renderHalloween);
        }

        renderHalloween();

        showHolidayBanner('🎃', 'Happy Halloween!', 'Boo! Trick or treat? 👻', '#ff6600');
    }


    /* ==================================================================
       💕 VALENTINE'S DAY — Floating hearts
       ================================================================== */
    if (activeHolidays.includes('valentine')) {
        document.body.classList.add('holiday-valentine');

        const canvas = createOverlayCanvas('holiday-valentine-canvas');
        const ctx = canvas.getContext('2d');
        let w = canvas.width, h = canvas.height;
        window.addEventListener('resize', () => { w = canvas.width; h = canvas.height; });

        const HEART_COUNT = 25;
        const hearts = [];
        for (let i = 0; i < HEART_COUNT; i++) {
            hearts.push({
                x: Math.random() * w,
                y: h + Math.random() * 200 + 50,
                size: 8 + Math.random() * 16,
                speed: 0.5 + Math.random() * 1.2,
                wobble: Math.random() * Math.PI * 2,
                wobbleSpeed: 0.01 + Math.random() * 0.02,
                alpha: 0.3 + Math.random() * 0.5,
                hue: Math.random() > 0.5 ? 340 : 350,
                rotation: (Math.random() - 0.5) * 0.4
            });
        }

        function drawHeart(x, y, size, hue, alpha, rot) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rot);
            ctx.scale(size / 20, size / 20);

            ctx.fillStyle = `hsla(${hue}, 80%, 60%, ${alpha})`;
            ctx.shadowColor = `hsla(${hue}, 90%, 60%, ${alpha * 0.5})`;
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.moveTo(0, -5);
            ctx.bezierCurveTo(-10, -18, -22, -5, 0, 12);
            ctx.bezierCurveTo(22, -5, 10, -18, 0, -5);
            ctx.fill();
            ctx.shadowBlur = 0;

            ctx.restore();
        }

        function renderValentine() {
            ctx.clearRect(0, 0, w, h);

            hearts.forEach(ht => {
                ht.y -= ht.speed;
                ht.wobble += ht.wobbleSpeed;
                const wx = Math.sin(ht.wobble) * 30;

                if (ht.y < -30) {
                    ht.y = h + 50;
                    ht.x = Math.random() * w;
                }

                drawHeart(ht.x + wx, ht.y, ht.size, ht.hue, ht.alpha, ht.rotation + Math.sin(ht.wobble) * 0.15);
            });

            requestAnimationFrame(renderValentine);
        }

        renderValentine();

        showHolidayBanner('💕', 'Happy Valentine\'s Day!', 'Spread love, write code ❤️', '#e74c8b');
    }


    /* ==================================================================
       👨‍💻 PROGRAMMER'S DAY — Binary rain + dev banner
       Day 256 of the year (usually Sep 13)
       ================================================================== */
    if (activeHolidays.includes('programmer')) {
        document.body.classList.add('holiday-programmer');

        const canvas = createOverlayCanvas('holiday-programmer-canvas');
        const ctx = canvas.getContext('2d');
        let w = canvas.width, h = canvas.height;
        window.addEventListener('resize', () => { w = canvas.width; h = canvas.height; });

        const fontSize = 14;
        const cols = Math.floor(w / fontSize);
        const drops = new Array(cols).fill(0).map(() => Math.random() * -50);

        function renderBinaryRain() {
            ctx.fillStyle = 'rgba(28, 29, 29, 0.04)';
            ctx.fillRect(0, 0, w, h);

            ctx.font = `${fontSize}px monospace`;

            for (let i = 0; i < cols; i++) {
                if (Math.random() > 0.97) { // sparse columns
                    const char = Math.random() > 0.5 ? '1' : '0';
                    const x = i * fontSize;
                    const y = drops[i] * fontSize;

                    ctx.fillStyle = `rgba(223, 255, 179, ${0.15 + Math.random() * 0.25})`;
                    ctx.fillText(char, x, y);
                }

                drops[i] += 0.3;
                if (drops[i] * fontSize > h && Math.random() > 0.99) {
                    drops[i] = 0;
                }
            }

            requestAnimationFrame(renderBinaryRain);
        }

        renderBinaryRain();

        showHolidayBanner('👨‍💻', 'Happy Programmer\'s Day!', 'Day 256 — 0x100 in hex 🔢', '#DFFFB3');
    }


    /* ==================================================================
       🥧 PI DAY — Floating digits of π
       ================================================================== */
    if (activeHolidays.includes('piday')) {
        document.body.classList.add('holiday-piday');

        const canvas = createOverlayCanvas('holiday-piday-canvas');
        const ctx = canvas.getContext('2d');
        let w = canvas.width, h = canvas.height;
        window.addEventListener('resize', () => { w = canvas.width; h = canvas.height; });

        const PI_DIGITS = '3.14159265358979323846264338327950288419716939937510';
        const digits = [];

        function spawnDigit() {
            const idx = Math.floor(Math.random() * PI_DIGITS.length);
            digits.push({
                char: PI_DIGITS[idx],
                x: Math.random() * w,
                y: -20,
                speed: 0.5 + Math.random() * 1.5,
                size: 14 + Math.random() * 22,
                alpha: 0.2 + Math.random() * 0.4,
                wobble: Math.random() * Math.PI * 2,
                rotation: (Math.random() - 0.5) * 0.6
            });
        }

        let t = 0;

        function renderPi() {
            t++;
            ctx.clearRect(0, 0, w, h);

            if (t % 8 === 0 && digits.length < 40) spawnDigit();

            for (let i = digits.length - 1; i >= 0; i--) {
                const d = digits[i];
                d.y += d.speed;
                d.wobble += 0.02;

                if (d.y > h + 30) { digits.splice(i, 1); continue; }

                ctx.save();
                ctx.translate(d.x + Math.sin(d.wobble) * 15, d.y);
                ctx.rotate(d.rotation);
                ctx.font = `${d.size}px 'Courier New', monospace`;
                ctx.fillStyle = `rgba(223, 255, 179, ${d.alpha})`;
                ctx.textAlign = 'center';
                ctx.fillText(d.char, 0, 0);
                ctx.restore();
            }

            // Big π symbol in center (subtle)
            ctx.fillStyle = 'rgba(223, 255, 179, 0.04)';
            ctx.font = `${Math.min(w, h) * 0.35}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('π', w / 2, h / 2);

            requestAnimationFrame(renderPi);
        }

        renderPi();

        showHolidayBanner('🥧', 'Happy Pi Day!', '3.14159265... — math is beautiful ∞', '#DFFFB3');
    }


    /* ==================================================================
       🚀 COSMONAUTICS DAY — Rocket flyby
       ================================================================== */
    if (activeHolidays.includes('cosmonautics')) {
        document.body.classList.add('holiday-cosmonautics');

        const canvas = createOverlayCanvas('holiday-cosmo-canvas');
        const ctx = canvas.getContext('2d');
        let w = canvas.width, h = canvas.height;
        window.addEventListener('resize', () => { w = canvas.width; h = canvas.height; });

        let rocketX = -100;
        let rocketY = h * 0.6;
        const rocketSpeed = 2.5;
        const trail = [];
        let launched = false;
        let t = 0;

        function drawRocket(x, y, size) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(-0.35); // Angled flight

            // Flame
            const flameLen = 15 + Math.random() * 10;
            const flameGrad = ctx.createLinearGradient(0, size * 0.4, 0, size * 0.4 + flameLen);
            flameGrad.addColorStop(0, 'rgba(255, 200, 50, 0.9)');
            flameGrad.addColorStop(0.5, 'rgba(255, 100, 30, 0.6)');
            flameGrad.addColorStop(1, 'rgba(255, 50, 20, 0)');
            ctx.fillStyle = flameGrad;
            ctx.beginPath();
            ctx.moveTo(-size * 0.15, size * 0.35);
            ctx.lineTo(0, size * 0.35 + flameLen);
            ctx.lineTo(size * 0.15, size * 0.35);
            ctx.fill();

            // Body
            ctx.fillStyle = '#e8e8e8';
            ctx.beginPath();
            ctx.moveTo(0, -size * 0.5);
            ctx.quadraticCurveTo(size * 0.2, -size * 0.2, size * 0.18, size * 0.35);
            ctx.lineTo(-size * 0.18, size * 0.35);
            ctx.quadraticCurveTo(-size * 0.2, -size * 0.2, 0, -size * 0.5);
            ctx.fill();

            // Nose
            ctx.fillStyle = '#ff4444';
            ctx.beginPath();
            ctx.moveTo(0, -size * 0.5);
            ctx.quadraticCurveTo(size * 0.1, -size * 0.35, size * 0.08, -size * 0.25);
            ctx.lineTo(-size * 0.08, -size * 0.25);
            ctx.quadraticCurveTo(-size * 0.1, -size * 0.35, 0, -size * 0.5);
            ctx.fill();

            // Window
            ctx.fillStyle = '#4a90d9';
            ctx.shadowColor = '#4a90d9';
            ctx.shadowBlur = 4;
            ctx.beginPath();
            ctx.arc(0, -size * 0.1, size * 0.07, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Fins
            ctx.fillStyle = '#ff4444';
            // Left fin
            ctx.beginPath();
            ctx.moveTo(-size * 0.18, size * 0.2);
            ctx.lineTo(-size * 0.35, size * 0.4);
            ctx.lineTo(-size * 0.18, size * 0.35);
            ctx.fill();
            // Right fin
            ctx.beginPath();
            ctx.moveTo(size * 0.18, size * 0.2);
            ctx.lineTo(size * 0.35, size * 0.4);
            ctx.lineTo(size * 0.18, size * 0.35);
            ctx.fill();

            ctx.restore();
        }

        // Launch after small delay
        setTimeout(() => { launched = true; }, 2000);

        function renderCosmo() {
            t++;
            ctx.clearRect(0, 0, w, h);

            if (!launched) {
                requestAnimationFrame(renderCosmo);
                return;
            }

            rocketX += rocketSpeed;
            rocketY -= rocketSpeed * 0.35;

            // Smoke trail
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

            // Draw trail
            for (let i = trail.length - 1; i >= 0; i--) {
                const p = trail[i];
                p.x += p.vx;
                p.y += p.vy;
                p.alpha -= 0.008;
                p.size += 0.1;
                if (p.alpha <= 0) { trail.splice(i, 1); continue; }

                ctx.fillStyle = `rgba(200, 200, 200, ${p.alpha})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }

            // Draw rocket
            if (rocketX < w + 200 && rocketY > -200) {
                drawRocket(rocketX, rocketY, 40);
            }

            // Loop: restart after flying off screen
            if (rocketX > w + 300 || rocketY < -300) {
                rocketX = -100;
                rocketY = h * 0.6 + (Math.random() - 0.5) * 100;
                trail.length = 0;
                // Wait a bit before next pass
                launched = false;
                setTimeout(() => { launched = true; }, 8000 + Math.random() * 12000);
            }

            requestAnimationFrame(renderCosmo);
        }

        renderCosmo();

        showHolidayBanner('🚀', 'День космонавтики!', '«Поехали!» — Юрий Гагарин, 12 апреля 1961', '#4a90d9');
    }


    /* ==================================================================
       🃏 APRIL FOOLS — UI goes wild
       ================================================================== */
    if (activeHolidays.includes('aprilfools')) {
        document.body.classList.add('holiday-aprilfools');

        // Effect 1: Slowly rotate the entire page (barely noticeable at first)
        let rotation = 0;
        const rotInterval = setInterval(() => {
            rotation += 0.15;
            if (rotation > 3) {
                clearInterval(rotInterval);
                // Snap back after reaching max
                setTimeout(() => {
                    document.body.style.transition = 'transform 1s cubic-bezier(0.34, 1.56, 0.64, 1)';
                    document.body.style.transform = 'rotate(0deg)';
                    setTimeout(() => {
                        document.body.style.transition = '';
                    }, 1200);
                }, 2000);
            }
            document.body.style.transform = `rotate(${rotation}deg)`;
        }, 300);

        // Effect 2: Random elements occasionally wiggle
        setInterval(() => {
            const allItems = document.querySelectorAll('.project-item, .blog-card, .action-btn, .skill-chip');
            if (allItems.length === 0) return;
            const target = allItems[Math.floor(Math.random() * allItems.length)];
            target.style.transition = 'transform 0.3s ease';
            target.style.transform = `rotate(${(Math.random() - 0.5) * 6}deg) scale(${0.97 + Math.random() * 0.06})`;
            setTimeout(() => {
                target.style.transform = '';
            }, 800);
        }, 3000);

        // Effect 3: Search placeholder changes
        if (searchBar) {
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
                setInterval(() => {
                    searchBar.placeholder = jokes[jokeIdx % jokes.length];
                    jokeIdx++;
                }, 4000);
            }
        }

        showHolidayBanner('🃏', 'April Fools!', 'Something seems off today... 🤔', '#ffd93d');
    }

})();

