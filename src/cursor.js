/**
 * Ultra-Smooth Multi-Joint Slime Cursor (с поддержкой snap на модальное окно)
 */
(function () {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const container = document.createElement('div');
    container.className = 'custom-cursor-fluid';

    const SVG_NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 500 500');
    svg.innerHTML = `
        <defs>
            <radialGradient id="fluid-water-grad" cx="35%" cy="30%" r="65%">
                <stop offset="0%" stop-color="#ffffff" stop-opacity="0.5" />
                <stop offset="35%" stop-color="#DFFFB3" stop-opacity="0.2" />
                <stop offset="70%" stop-color="#404D2D" stop-opacity="0.08" />
                <stop offset="100%" stop-color="#404D2D" stop-opacity="0.25" />
            </radialGradient>
        </defs>
        <path class="fluid-blob-path" d="" />
    `;
    const blobPath = svg.querySelector('.fluid-blob-path');
    container.appendChild(svg);

    const dot = document.createElement('div');
    dot.className = 'fluid-cursor-dot';
    container.appendChild(dot);
    document.body.appendChild(container);

    const NUM_POINTS = 48;
    const BASE_RADIUS = 17.5;
    const points = [];
    for (let i = 0; i < NUM_POINTS; i++) {
        const norm = i / NUM_POINTS;
        const angle = norm * Math.PI * 2;
        points.push({
            tNorm: norm,
            phi: angle,
            x: 250 + Math.cos(angle) * BASE_RADIUS,
            y: 250 + Math.sin(angle) * BASE_RADIUS,
            targetX: 250 + Math.cos(angle) * BASE_RADIUS,
            targetY: 250 + Math.sin(angle) * BASE_RADIUS,
            phase: i * 0.35
        });
    }

    const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const SPINE_COUNT = 6;
    const spine = [];
    for (let i = 0; i < SPINE_COUNT; i++) {
        spine.push({ x: mouse.x, y: mouse.y });
    }

    let snapProgress = 0.0;
    let textProgress = 0.0;
    let hoverMode = 'free'; // 'free' | 'snap' | 'text'
    let targetElement = null;
    let lastZoomedElement = null;
    let isPressed = false;
    let pressScale = 1.0;

    // Глобальное управление для внешних скриптов (modview)
    window.FluidCursor = {
        snapTo: function (element) {
            if (!element) return;
            if (lastZoomedElement && lastZoomedElement !== element) resetElementZoom();
            hoverMode = 'snap';
            targetElement = element;
            container.classList.add('is-snap');
            container.classList.remove('is-text');
        },
        release: function () {
            hoverMode = 'free';
            targetElement = null;
            container.classList.remove('is-snap', 'is-text');
            resetElementZoom();
        }
    };

    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        container.style.opacity = '1';
    }, { passive: true });

    window.addEventListener('mouseleave', () => {
        const modalOpen = document.querySelector('.modview-container.open');
        if (!modalOpen) {
            container.style.opacity = '0';
            resetElementZoom();
        }
    });

    window.addEventListener('mousedown', () => { isPressed = true; });
    window.addEventListener('mouseup', () => { isPressed = false; });

    // .modview-container.open включен в SNAP_SELECTORS
    const SNAP_SELECTORS = [
        'button',
        'a',
        'input',
        '#search-bar',
        '.header-logo',
        '.header-breadcrumb',
        '.header-avatar-btn',
        '.side-nav-btn',
        '.action-btn',
        '.blog-tag',
        '.skill-chip',
        '.contact-card',
        '.modview-container.open'
    ].join(', ');

    const TEXT_SELECTORS = [
        'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        '.counter', '.about-subtitle', '.contact-val', 'article', 'label'
    ].join(', ');

    function resetElementZoom() {
        if (lastZoomedElement) {
            lastZoomedElement.style.transform = '';
            lastZoomedElement = null;
        }
    }

    document.addEventListener('mouseover', (e) => {
        // Если открыто модальное окно, удерживаем фокус на нем
        const activeModal = document.querySelector('.modview-container.open');
        if (activeModal) {
            if (targetElement !== activeModal) {
                window.FluidCursor.snapTo(activeModal);
            }
            return;
        }

        const snapTarget = e.target.closest(SNAP_SELECTORS);
        if (snapTarget) {
            if (lastZoomedElement && lastZoomedElement !== snapTarget) resetElementZoom();
            hoverMode = 'snap';
            targetElement = snapTarget;
            lastZoomedElement = snapTarget;
            container.classList.add('is-snap');
            container.classList.remove('is-text');
            return;
        }

        const textTarget = e.target.closest(TEXT_SELECTORS);
        if (textTarget) {
            resetElementZoom();
            hoverMode = 'text';
            targetElement = textTarget;
            container.classList.add('is-text');
            container.classList.remove('is-snap');
            return;
        }
    });

    document.addEventListener('mouseout', (e) => {
        const activeModal = document.querySelector('.modview-container.open');
        if (activeModal) return;

        const related = e.relatedTarget;
        if (!related || !related.closest(`${SNAP_SELECTORS}, ${TEXT_SELECTORS}`)) {
            hoverMode = 'free';
            targetElement = null;
            container.classList.remove('is-snap', 'is-text');
            resetElementZoom();
        }
    });

    function getSplinePath(pts) {
        const n = pts.length;
        let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)} `;
        for (let i = 0; i < n; i++) {
            const p0 = pts[(i - 1 + n) % n];
            const p1 = pts[i];
            const p2 = pts[(i + 1) % n];
            const p3 = pts[(i + 2) % n];
            const cp1x = p1.x + (p2.x - p0.x) / 6;
            const cp1y = p1.y + (p2.y - p0.y) / 6;
            const cp2x = p2.x - (p3.x - p1.x) / 6;
            const cp2y = p2.y - (p3.y - p1.y) / 6;
            d += `C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)} `;
        }
        return d + 'Z';
    }

    function getSpinePointAndTangent(nodes, s, center) {
        const N = nodes.length;
        const k = s * (N - 1);
        const idx = Math.min(Math.floor(k), N - 2);
        const t = k - idx;
        const p0 = nodes[Math.max(0, idx - 1)];
        const p1 = nodes[idx];
        const p2 = nodes[Math.min(N - 1, idx + 1)];
        const p3 = nodes[Math.min(N - 1, idx + 2)];
        const t2 = t * t;
        const t3 = t2 * t;
        const px = 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);
        const py = 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);
        let tx = 0.5 * ((-p0.x + p2.x) + 2 * (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t + 3 * (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t2);
        let ty = 0.5 * ((-p0.y + p2.y) + 2 * (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t + 3 * (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t2);
        const len = Math.hypot(tx, ty);
        if (len > 0.001) {
            tx /= len;
            ty /= len;
        } else {
            tx = 1;
            ty = 0;
        }
        return { px, py, tx, ty, nx: -ty, ny: tx };
    }

    function getPerimeterRoundedRectPoint(tNorm, width, height, radius) {
        const hw = width / 2;
        const hh = height / 2;
        const r = Math.min(radius, hw, hh);
        const lenTop = Math.max(0, width - 2 * r);
        const lenRight = Math.max(0, height - 2 * r);
        const lenArc = 0.5 * Math.PI * r;
        const totalPerimeter = 2 * lenTop + 2 * lenRight + 4 * lenArc;
        if (totalPerimeter <= 0.001) return { x: 0, y: 0 };
        let d = (tNorm % 1.0) * totalPerimeter;
        const s1 = lenTop / 2;
        if (d < s1) return { x: d, y: -hh };
        d -= s1;
        if (d < lenArc) {
            const ang = -0.5 * Math.PI + (d / lenArc) * (0.5 * Math.PI);
            return { x: (hw - r) + r * Math.cos(ang), y: (-hh + r) + r * Math.sin(ang) };
        }
        d -= lenArc;
        if (d < lenRight) return { x: hw, y: (-hh + r) + d };
        d -= lenRight;
        if (d < lenArc) {
            const ang = (d / lenArc) * (0.5 * Math.PI);
            return { x: (hw - r) + r * Math.cos(ang), y: (hh - r) + r * Math.sin(ang) };
        }
        d -= lenArc;
        if (d < lenTop) return { x: (hw - r) - d, y: hh };
        d -= lenTop;
        if (d < lenArc) {
            const ang = 0.5 * Math.PI + (d / lenArc) * (0.5 * Math.PI);
            return { x: (-hw + r) + r * Math.cos(ang), y: (hh - r) + r * Math.sin(ang) };
        }
        d -= lenArc;
        if (d < lenRight) return { x: -hw, y: (hh - r) - d };
        d -= lenRight;
        if (d < lenArc) {
            const ang = Math.PI + (d / lenArc) * (0.5 * Math.PI);
            return { x: (-hw + r) + r * Math.cos(ang), y: (-hh + r) + r * Math.sin(ang) };
        }
        d -= lenArc;
        return { x: -hw + r + d, y: -hh };
    }

    function getPolarRoundedRectPoint(angle, width, height, radius) {
        const hw = width / 2;
        const hh = height / 2;
        const r = Math.min(radius, hw, hh);
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);
        let t = (hw * hh) / Math.sqrt((hh * cosA) ** 2 + (hw * sinA) ** 2 + 1e-6);
        for (let k = 0; k < 4; k++) {
            const px = t * cosA;
            const py = t * sinA;
            const qx = Math.abs(px) - (hw - r);
            const qy = Math.abs(py) - (hh - r);
            const sdf = Math.hypot(Math.max(0, qx), Math.max(0, qy)) + Math.min(0, Math.max(qx, qy)) - r;
            t -= sdf;
        }
        return { x: t * cosA, y: t * sinA };
    }

    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    function smoothstep(min, max, val) {
        const x = Math.max(0, Math.min(1, (val - min) / (max - min)));
        return x * x * (3 - 2 * x);
    }

    let time = 0;
    function render() {
        time += 0.024;

        // Принудительно проверяем активное модальное окно
        const activeModal = document.querySelector('.modview-container.open');
        if (activeModal && targetElement !== activeModal) {
            window.FluidCursor.snapTo(activeModal);
        } else if (!activeModal && targetElement && targetElement.classList.contains('modview-container')) {
            window.FluidCursor.release();
        }

        const isModalTarget = targetElement && targetElement.classList.contains('modview-container');
        const targetSnap = (hoverMode === 'snap') ? 1.0 : 0.0;
        const targetText = (hoverMode === 'text') ? 1.0 : 0.0;

        snapProgress += (targetSnap - snapProgress) * (isModalTarget ? 0.16 : 0.12);
        textProgress += (targetText - textProgress) * 0.16;

        const targetPress = isPressed ? 0.86 : 1.0;
        pressScale += (targetPress - pressScale) * 0.18;

        spine[0].x += (mouse.x - spine[0].x) * 0.12;
        spine[0].y += (mouse.y - spine[0].y) * 0.12;
        for (let i = 1; i < SPINE_COUNT; i++) {
            spine[i].x += (spine[i - 1].x - spine[i].x) * 0.26;
            spine[i].y += (spine[i - 1].y - spine[i].y) * 0.26;
        }

        let totalSpineDist = 0;
        for (let i = 1; i < SPINE_COUNT; i++) {
            totalSpineDist += Math.hypot(spine[i].x - spine[i - 1].x, spine[i].y - spine[i - 1].y);
        }

        const motionWeight = smoothstep(4.0, 18.0, totalSpineDist);
        const stretchFactor = Math.min(totalSpineDist / 42.0, 2.2) * motionWeight;
        const rHead = (BASE_RADIUS / Math.sqrt(1.0 + stretchFactor * 0.42)) * pressScale;
        const rTail = (BASE_RADIUS * Math.max(0.2, 1.0 - stretchFactor * 0.48)) * pressScale;
        const waistPinch = 0.54 * Math.min(stretchFactor, 1.0) * motionWeight;

        let pillPadW = 0, pillPadH = 0, pillR = 16;
        let snapCenterX = spine[0].x, snapCenterY = spine[0].y;
        let usePerimeter = false;

        // Динамический размер холста SVG
        let currentCanvasSize = 500;

        if (targetElement && hoverMode === 'snap') {
            const rect = targetElement.getBoundingClientRect();
            const isInputTarget = targetElement.tagName === 'INPUT' || targetElement.id === 'search-bar';

            if (isModalTarget) {
                // Модальное окно: расширяем холст SVG под реальные габариты
                pillPadW = rect.width + 16;
                pillPadH = rect.height + 16;
                pillR = 30;
                snapCenterX = rect.left + rect.width / 2;
                snapCenterY = rect.top + rect.height / 2;
                usePerimeter = true;
                currentCanvasSize = Math.max(pillPadW, pillPadH) + 160;
                resetElementZoom();
            } else {
                pillPadW = rect.width + (isInputTarget ? 10 : 12);
                pillPadH = rect.height + (isInputTarget ? 6 : 8);
                const style = window.getComputedStyle(targetElement);
                pillR = Math.min(pillPadH / 2, (parseFloat(style.borderRadius) || 16) + 2);
                const rawCenterX = rect.left + rect.width / 2;
                const rawCenterY = rect.top + rect.height / 2;
                snapCenterX = rawCenterX + (mouse.x - rawCenterX) * 0.12;
                snapCenterY = rawCenterY + (mouse.y - rawCenterY) * 0.12;
                usePerimeter = isInputTarget;
                targetElement.style.transform = `scale(${1 + 0.03 * snapProgress}) translate3d(${(mouse.x - rawCenterX) * 0.06 * snapProgress}px, ${(mouse.y - rawCenterY) * 0.06 * snapProgress}px, 0)`;
            }
        } else {
            resetElementZoom();
        }

        // Обновляем размер SVG-контейнера при снапе на модалку
        const halfSize = currentCanvasSize / 2;
        container.style.width = `${currentCanvasSize}px`;
        container.style.height = `${currentCanvasSize}px`;
        container.style.marginLeft = `-${halfSize}px`;
        container.style.marginTop = `-${halfSize}px`;
        svg.setAttribute('viewBox', `0 0 ${currentCanvasSize} ${currentCanvasSize}`);

        const center = halfSize;
        const localSpine = spine.map(node => ({
            x: node.x - spine[0].x + center,
            y: node.y - spine[0].y + center
        }));

        const renderPosX = lerp(spine[0].x, snapCenterX, snapProgress);
        const renderPosY = lerp(spine[0].y, snapCenterY, snapProgress);

        points.forEach((pt) => {
            const phi = pt.phi;
            const cosP = Math.cos(phi);
            const sinP = Math.sin(phi);
            const idleRipple = (Math.sin(time * 2.2 + pt.phase) * 1.8 + Math.cos(time * 1.5 + pt.phase * 2.0) * 0.9)
                                * Math.max(0.15, 1.0 - stretchFactor);
            const idleR = BASE_RADIUS * pressScale + idleRipple;

            const freeX_idle = center + Math.cos(phi) * idleR;
            const freeY_idle = center + Math.sin(phi) * idleR;

            const w = (1.0 - cosP) * 0.5;
            const s = w * w * (3.0 - 2.0 * w);
            const { px, py, tx, ty, nx, ny } = getSpinePointAndTangent(localSpine, s, center);

            const rCurr = rHead * (1.0 - s) + rTail * s;
            const pinchFactor = 1.0 - waistPinch * Math.sin(s * Math.PI);
            const rEff = rCurr * pinchFactor + idleRipple;

            const freeX_motion = px - tx * cosP * rEff * 0.65 + nx * sinP * rEff;
            const freeY_motion = py - ty * cosP * rEff * 0.65 + ny * sinP * rEff;

            const freeX = lerp(freeX_idle, freeX_motion, motionWeight);
            const freeY = lerp(freeY_idle, freeY_motion, motionWeight);

            let pillPt;
            if (usePerimeter) {
                pillPt = getPerimeterRoundedRectPoint(pt.tNorm, pillPadW, pillPadH, pillR);
            } else {
                pillPt = getPolarRoundedRectPoint(phi, pillPadW, pillPadH, pillR);
            }

            const buttonUndulate = Math.sin(time * 2.0 + pt.phase) * (isModalTarget ? 1.5 : 0.5);
            const snapX = center + pillPt.x + Math.cos(phi) * buttonUndulate;
            const snapY = center + pillPt.y + Math.sin(phi) * buttonUndulate;

            const textPt = getPolarRoundedRectPoint(phi, 3.5, 22, 2);
            const textX = center + textPt.x;
            const textY = center + textPt.y;

            let mixedX = lerp(freeX, snapX, snapProgress);
            let mixedY = lerp(freeY, snapY, snapProgress);

            if (textProgress > 0.001) {
                mixedX = lerp(mixedX, textX, textProgress);
                mixedY = lerp(mixedY, textY, textProgress);
            }

            pt.targetX = mixedX;
            pt.targetY = mixedY;
        });

        points.forEach((pt) => {
            pt.x += (pt.targetX - pt.x) * (isModalTarget ? 0.22 : 0.32);
            pt.y += (pt.targetY - pt.y) * (isModalTarget ? 0.22 : 0.32);
        });

        blobPath.setAttribute('d', getSplinePath(points));
        container.style.transform = `translate3d(${renderPosX}px, ${renderPosY}px, 0)`;

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
})();