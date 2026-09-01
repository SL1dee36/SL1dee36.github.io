/**
 * Space Horizon & Twinkling Stars Background
 * - Starfield with depth & gentle twinkling
 * - Undulating glowing bottom horizon wave (Canvas 2D, 60fps)
 */
(function () {
    const canvas = document.createElement('canvas');
    canvas.id = 'space-horizon-canvas';
    document.body.prepend(canvas);

    Object.assign(canvas.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100vw',
        height: '100vh',
        zIndex: '0',
        backgroundColor: '#1c1d1d',
        pointerEvents: 'none',
        display: 'block'
    });

    const ctx = canvas.getContext('2d');
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const STAR_COUNT = 140;
    const stars = [];

    for (let i = 0; i < STAR_COUNT; i++) {
        stars.push({
            x: Math.random() * width,
            y: Math.random() * height * 0.72,
            size: Math.random() * 1.6 + 0.4,
            baseAlpha: Math.random() * 0.5 + 0.2,
            twinkleSpeed: Math.random() * 0.02 + 0.008,
            phase: Math.random() * Math.PI * 2,
            parallaxFactor: Math.random() * 0.04 + 0.01
        });
    }

    const mouse = { x: width / 2, y: height / 2, targetX: width / 2, targetY: height / 2 };

    window.addEventListener('mousemove', (e) => {
        mouse.targetX = e.clientX;
        mouse.targetY = e.clientY;
    }, { passive: true });

    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        stars.forEach(s => {
            s.x = Math.random() * width;
            s.y = Math.random() * height * 0.72;
        });
    });

    let time = 0;

    function render() {
        time += 0.012;

        mouse.x += (mouse.targetX - mouse.x) * 0.03;
        mouse.y += (mouse.targetY - mouse.y) * 0.03;

        const mouseOffsetX = (mouse.x - width / 2);
        const mouseOffsetY = (mouse.y - height / 2);

        ctx.fillStyle = '#1c1d1d';
        ctx.fillRect(0, 0, width, height);

        stars.forEach(star => {
            const alpha = star.baseAlpha + Math.sin(time * 60 * star.twinkleSpeed + star.phase) * 0.25;
            const px = star.x + mouseOffsetX * star.parallaxFactor;
            const py = star.y + mouseOffsetY * star.parallaxFactor;

            ctx.fillStyle = `rgba(235, 245, 225, ${Math.max(0.05, Math.min(1, alpha))})`;
            ctx.beginPath();
            ctx.arc(px, py, star.size, 0, Math.PI * 2);
            ctx.fill();
        });

        const domeCenterX = width * 0.5 + mouseOffsetX * 0.04;
        const domeCenterY = height * 1.12;
        const baseDomeRadius = Math.max(width * 0.55, height * 0.65);

        const domeRadius = baseDomeRadius + Math.sin(time * 1.2) * 20;

        const domeGrad = ctx.createRadialGradient(
            domeCenterX, domeCenterY, 0,
            domeCenterX, domeCenterY, domeRadius
        );
        domeGrad.addColorStop(0, 'rgba(223, 255, 179, 0.18)');
        domeGrad.addColorStop(0.35, 'rgba(64, 77, 45, 0.22)');
        domeGrad.addColorStop(0.7, 'rgba(40, 50, 30, 0.1)');
        domeGrad.addColorStop(1, 'rgba(28, 29, 29, 0)');

        ctx.fillStyle = domeGrad;
        ctx.beginPath();
        ctx.arc(domeCenterX, domeCenterY, domeRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.beginPath();

        const waveSegments = 40;
        const startY = height;
        ctx.moveTo(0, height);

        for (let i = 0; i <= waveSegments; i++) {
            const normX = i / waveSegments;
            const x = normX * width;

            const arch = Math.sin(normX * Math.PI) * (height * 0.22);

            const wave1 = Math.sin(normX * 4.0 + time * 1.5) * 14;
            const wave2 = Math.cos(normX * 2.5 - time * 1.0) * 8;
            const waveY = height - arch - wave1 - wave2;

            if (i === 0) ctx.lineTo(x, waveY);
            else ctx.lineTo(x, waveY);
        }

        ctx.lineTo(width, height);
        ctx.closePath();

        const waveGrad = ctx.createLinearGradient(0, height - height * 0.25, 0, height);
        waveGrad.addColorStop(0, 'rgba(223, 255, 179, 0.08)');
        waveGrad.addColorStop(0.5, 'rgba(64, 77, 45, 0.12)');
        waveGrad.addColorStop(1, 'rgba(28, 29, 29, 0)');

        ctx.fillStyle = waveGrad;
        ctx.fill();
        ctx.restore();

        requestAnimationFrame(render);
    }

    render();
})();