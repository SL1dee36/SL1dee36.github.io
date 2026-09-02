/**
 * ModView — Slime Modal Preview & Documentation Viewer (с поддержкой плавного Fullscreen)
 */
(function () {
    const style = document.createElement('style');
    style.id = 'modview-styles';
    style.textContent = `
        .modview-backdrop {
            position: fixed;
            inset: 0;
            background: rgba(18, 22, 16, 0.55);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            z-index: 2147483646;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.35s ease;
        }

        .modview-backdrop.active {
            opacity: 1;
            pointer-events: auto;
        }

        .modview-container {
            position: fixed;
            top: 50%;
            left: 50%;
            width: min(90vw, 1100px);
            height: min(85vh, 800px);
            transform: translate(-50%, -50%) scale(0.05);
            z-index: 2147483648;
            pointer-events: none;
            opacity: 0;
            display: flex;
            flex-direction: column;
            border-radius: 28px;
            background: #ffffff;
            border: 2px solid rgba(223, 255, 179, 0.9);
            box-shadow: 0 25px 65px rgba(0, 0, 0, 0.45);
            overflow: hidden;
            transform-origin: center center;
            transition: transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1),
                        opacity 0.25s ease,
                        width 0.4s cubic-bezier(0.25, 1, 0.5, 1),
                        height 0.4s cubic-bezier(0.25, 1, 0.5, 1),
                        border-radius 0.35s ease;
        }

        .modview-container.open {
            opacity: 1;
            pointer-events: auto;
            transform: translate(-50%, -50%) scale(1);
            animation: slimeModalJiggle 0.6s cubic-bezier(0.25, 1, 0.5, 1);
        }

        /* Полноэкранный режим с сохранением кнопок сверху */
        .modview-container.is-fullscreen {
            width: 100vw !important;
            height: 100vh !important;
            border-radius: 0px !important;
            border-width: 0px !important;
            box-shadow: none !important;
        }

        @keyframes slimeModalJiggle {
            0% {
                transform: translate(-50%, -50%) scale(0.08, 0.08);
                border-radius: 60px;
            }
            50% {
                transform: translate(-50%, -50%) scale(1.04, 0.94);
                border-radius: 36px 20px 34px 22px;
            }
            75% {
                transform: translate(-50%, -50%) scale(0.98, 1.02);
                border-radius: 22px 30px 24px 28px;
            }
            100% {
                transform: translate(-50%, -50%) scale(1, 1);
                border-radius: 24px;
            }
        }

        .modview-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 20px;
            background: #f4f6f0;
            border-bottom: 1px solid #e2e6db;
            user-select: none;
            flex-shrink: 0;
        }

        .modview-title-group {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .modview-badge {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 700;
            padding: 4px 10px;
            background: #DFFFB3;
            color: #404D2D;
            border-radius: 12px;
        }

        .modview-title {
            font-size: 15px;
            font-weight: 600;
            color: #191c1c;
            margin: 0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 480px;
        }

        .modview-controls {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .modview-btn {
            background: transparent;
            border: none;
            outline: none;
            padding: 6px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #404D2D;
            cursor: pointer;
            transition: background 0.15s ease, transform 0.15s ease;
        }

        .modview-btn:hover {
            background: rgba(64, 77, 45, 0.12);
            transform: scale(1.1);
        }

        .modview-body {
            position: relative;
            flex: 1;
            width: 100%;
            height: 100%;
            background: #ffffff;
            overflow: hidden;
        }

        .modview-iframe {
            width: 100%;
            height: 100%;
            border: none;
            display: block;
            background: #ffffff;
            overflow-y: auto;
            overflow-x: hidden;
        }

        .modview-loader {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #ffffff;
            font-weight: 600;
            color: #404D2D;
            font-family: inherit;
            transition: opacity 0.3s ease;
            z-index: 1;
        }

        .modview-loader.hidden {
            opacity: 0;
            pointer-events: none;
        }

        body.modview-active,
        body.modview-active *,
        body.modview-active *::before,
        body.modview-active *::after {
            cursor: auto !important;
        }

        body.modview-active .modview-btn,
        body.modview-active .modview-header a,
        body.modview-active button,
        body.modview-active a {
            cursor: pointer !important;
        }
    `;
    document.head.appendChild(style);

    const backdrop = document.createElement('div');
    backdrop.className = 'modview-backdrop';

    const container = document.createElement('div');
    container.className = 'modview-container';
    container.id = 'modview-modal';

    container.innerHTML = `
        <div class="modview-header">
            <div class="modview-title-group">
                <span class="modview-badge" id="modview-type-badge">Preview</span>
                <h4 class="modview-title" id="modview-title-text">Loading...</h4>
            </div>
            <div class="modview-controls">
                <button class="modview-btn" id="modview-expand-btn" title="Toggle Fullscreen" type="button">
                    <svg id="modview-expand-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                    </svg>
                </button>
                <button class="modview-btn" id="modview-close-btn" title="Close (Esc)" type="button">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
        </div>
        <div class="modview-body">
            <div class="modview-loader" id="modview-loader">Opening...</div>
            <iframe class="modview-iframe" id="modview-iframe" src="" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
        </div>
    `;

    document.body.appendChild(backdrop);
    document.body.appendChild(container);

    const iframe = container.querySelector('#modview-iframe');
    const titleText = container.querySelector('#modview-title-text');
    const badge = container.querySelector('#modview-type-badge');
    const expandBtn = container.querySelector('#modview-expand-btn');
    const expandIcon = container.querySelector('#modview-expand-icon');
    const closeBtn = container.querySelector('#modview-close-btn');
    const loader = container.querySelector('#modview-loader');

    let isFullscreen = false;

    const ICONS = {
        expand: `<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>`,
        collapse: `<path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7"/>`
    };

    function toggleFullscreen() {
        isFullscreen = !isFullscreen;
        container.classList.toggle('is-fullscreen', isFullscreen);
        expandBtn.title = isFullscreen ? 'Collapse' : 'Toggle Fullscreen';
        expandIcon.innerHTML = isFullscreen ? ICONS.collapse : ICONS.expand;

        // Оповещаем жидкий курсор о мгновенной смене геометрии
        if (window.FluidCursor && typeof window.FluidCursor.snapTo === 'function') {
            window.FluidCursor.snapTo(container);
        }
    }

    expandBtn.addEventListener('click', toggleFullscreen);

    function openModal(url, title = 'Preview', isDocs = false) {
        isFullscreen = false;
        container.classList.remove('is-fullscreen');
        expandIcon.innerHTML = ICONS.expand;
        expandBtn.title = 'Toggle Fullscreen';

        badge.textContent = isDocs ? 'Docs' : 'Demo';
        titleText.textContent = title;

        loader.classList.remove('hidden');
        iframe.src = url;
        iframe.onload = () => loader.classList.add('hidden');

        backdrop.classList.add('active');
        container.classList.add('open');
        document.body.classList.add('modview-active');

        if (window.FluidCursor && typeof window.FluidCursor.snapTo === 'function') {
            window.FluidCursor.snapTo(container);
        }
    }

    function closeModal() {
        container.classList.remove('open');
        container.classList.remove('is-fullscreen');
        backdrop.classList.remove('active');
        document.body.classList.remove('modview-active');
        isFullscreen = false;

        if (window.FluidCursor && typeof window.FluidCursor.release === 'function') {
            window.FluidCursor.release();
        }

        setTimeout(() => {
            if (!container.classList.contains('open')) {
                iframe.src = '';
                loader.classList.remove('hidden');
            }
        }, 300);
    }

    closeBtn.addEventListener('click', closeModal);
    backdrop.addEventListener('click', closeModal);

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && container.classList.contains('open')) {
            if (isFullscreen) {
                toggleFullscreen();
            } else {
                closeModal();
            }
        }
    });

    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link) return;

        const href = link.getAttribute('href');
        if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('javascript:')) return;

        const isDocs = href.includes('docs.html');
        const isBlog = href.includes('blog-post.html');
        const isDemo = href.includes('src/demo/') || link.classList.contains('accent') || link.textContent.trim().toLowerCase().includes('demo');

        if (isDocs || isDemo || isBlog) {
            e.preventDefault();
            e.stopPropagation();

            const projectCard = link.closest('.project-item, .project-content, .blog-card');
            let title = isBlog ? 'Blog Article' : 'Project View';

            if (projectCard) {
                const heading = projectCard.querySelector('h3');
                if (heading) title = heading.textContent.trim();
            } else if (isDocs) {
                const params = new URLSearchParams(href.split('?')[1] || '');
                title = params.get('projectName') || 'Documentation';
            }

            openModal(href, title, isDocs || isBlog);
        }
    });

    window.ModView = {
        open: openModal,
        close: closeModal,
        toggleFullscreen: toggleFullscreen
    };
})();
