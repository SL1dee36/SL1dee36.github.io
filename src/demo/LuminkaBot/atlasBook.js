/**
 * atlasBook.js - Полевой Атлас видов (Книга исследователя фауны)
 * Листание страниц, сокрытие не пойманных видов (силуэты с ?),
 * интерактивная матрица всех 15 мутаций/вариаций с динамическим предпросмотром.
 */

(function (window) {
  'use strict';

  let currentPageIndex = 0;
  let currentFamilyFilter = 'all';
  let activeVariationPreview = 'base'; // Текущая выбранная мутация для предпросмотра
  let isGridOverviewMode = false;

  // 15 ключевых мутаций в соответствии с матрицей
  const ALL_VARIATIONS = [
    { id: 'base', name: 'Обычная', color: '#94a3b8', desc: 'Естественный природный окрас' },
    { id: 'albino', name: 'Альбинос', color: '#f1f5f9', desc: 'Белоснежная чешуя и рубиновые глаза' },
    { id: 'golden', name: 'Золотая', color: '#fbbf24', desc: 'Драгоценный золотой отлив' },
    { id: 'radioactive', name: 'Радиоактивная', color: '#4ade80', desc: 'Ядовитое неоновое свечение' },
    { id: 'ghost', name: 'Призрачная', color: '#c084fc', desc: 'Полупрозрачная туманная аура' },
    { id: 'abyssal', name: 'Глубоководная', color: '#0284c7', desc: 'Темный ультрамариновый градиент' },
    { id: 'neon', name: 'Неоновая', color: '#06b6d4', desc: 'Бирюзовые электрические узоры' },
    { id: 'prismatic', name: 'Радужная', color: '#ec4899', desc: 'Переливы северного сияния' },
    { id: 'magma', name: 'Лавовая', color: '#ef4444', desc: 'Огненные трещины и раскаленный пепел' },
    { id: 'frost', name: 'Ледяная', color: '#67e8f9', desc: 'Хрустальные кристаллы вечной мерзлоты' },
    { id: 'toxic', name: 'Токсичная', color: '#84cc16', desc: 'Едкие болотные кислоты и наросты' },
    { id: 'ancient', name: 'Древняя', color: '#d97706', desc: 'Окаменелые реликтовые чешуйки' },
    { id: 'bone', name: 'Костяная', color: '#e2e8f0', desc: 'Скелетные пластины и острые шипы' },
    { id: 'melanist', name: 'Меланист', color: '#334155', desc: 'Глубокий угольно-чёрный пигмент' },
    { id: 'cosmic', name: 'Космическая', color: '#8b5cf6', desc: 'Астральные созвездия и звездная пыль' }
  ];

  /**
   * Получение отфильтрованного списка всех сущностей атласа
   */
  function getFilteredSpecies() {
    const ED = window.ENTITY_DATA;
    const fishList = (ED && ED.FISH_SPECIES) ? ED.FISH_SPECIES : (window.FISH_DATABASE || []);
    const beastList = (ED && ED.BEAST_SPECIES) ? ED.BEAST_SPECIES : [];
    const all = [...fishList, ...beastList];

    if (currentFamilyFilter === 'all') return all;
    if (currentFamilyFilter === 'beasts') return beastList;

    return all.filter(f => f.family === currentFamilyFilter);
  }

  /**
   * Отрисовка силуэта рыбы (для скрытых не пойманных видов)
   */
  function drawLockedSilhouette(canvas) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Темная мистическая подложка
    const grad = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w / 2);
    grad.addColorStop(0, 'rgba(30, 41, 59, 0.4)');
    grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    const fishScale = Math.min(w / 140, h / 75) * 0.9;
    const cx = (w / 2) + (18 * fishScale);
    const cy = (h / 2) + (3 * fishScale);

    // Силуэт тени рыбы
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.ellipse(cx - 18 * fishScale, cy, 38 * fishScale, 20 * fishScale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Хвостовой плавник
    ctx.beginPath();
    ctx.moveTo(cx - 46 * fishScale, cy);
    ctx.lineTo(cx - 70 * fishScale, cy - 18 * fishScale);
    ctx.lineTo(cx - 60 * fishScale, cy);
    ctx.lineTo(cx - 70 * fishScale, cy + 18 * fishScale);
    ctx.closePath();
    ctx.fill();

    // Большой знак вопроса по центру
    ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.font = `bold ${Math.round(36 * (w / 240))}px -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', cx - 18 * fishScale, cy);
    ctx.restore();
  }

  /**
   * Отрисовка открытой рыбы с учётом выбранной вариации
   */
  function drawDiscoveredFish(canvas, fish, variationId) {
    if (!canvas || !fish) return;

    // Клонируем объект рыбы для предпросмотра конкретной мутации
    const previewFish = Object.assign({}, fish);
    if (variationId && variationId !== 'base' && window.ENTITY_DATA && window.ENTITY_DATA.MUTATION_MATRIX) {
      const mut = window.ENTITY_DATA.MUTATION_MATRIX[variationId];
      if (mut) {
        previewFish.mutation = mut;
        if (mut.glowColor) previewFish.color = mut.glowColor;
      }
    } else {
      previewFish.mutation = null;
    }

    if (typeof ProceduralFishRenderer !== 'undefined') {
      ProceduralFishRenderer.drawPreview(canvas, previewFish);
    }
  }

  /**
   * Отрендерить текущую страницу книги
   */
  function renderBookPage() {
    const bookContainer = document.getElementById('atlasBookContainer');
    if (!bookContainer) return;

    const speciesList = getFilteredSpecies();
    const totalCount = speciesList.length;

    if (totalCount === 0) {
      bookContainer.innerHTML = '<div style="padding:40px;text-align:center;color:#94a3b8;">В этом разделе нет видов.</div>';
      return;
    }

    if (currentPageIndex >= totalCount) currentPageIndex = 0;
    if (currentPageIndex < 0) currentPageIndex = totalCount - 1;

    const fish = speciesList[currentPageIndex];
    const player = window.player || { caughtSpecies: {} };
    const caught = player.caughtSpecies ? (player.caughtSpecies[fish.id] || player.caughtSpecies[String(fish.id)]) : null;
    const isDiscovered = !!caught;

    // Если открыли страницу 0 и она не поймана, но у игрока уже есть пойманные виды, покажем первую пойманную
    if (currentPageIndex === 0 && !isDiscovered && !isGridOverviewMode) {
      const firstDiscoveredIdx = speciesList.findIndex(f => player.caughtSpecies && (player.caughtSpecies[f.id] || player.caughtSpecies[String(f.id)]));
      if (firstDiscoveredIdx > 0) {
        currentPageIndex = firstDiscoveredIdx;
        renderBookPage();
        return;
      }
    }

    const discoveredVariations = (caught && caught.discoveredVariations) ? caught.discoveredVariations : { base: true };

    // Если открыт режим оглавления (Grid)
    if (isGridOverviewMode) {
      renderTableOfContents(bookContainer, speciesList, player);
      return;
    }

    const lockIconSvg = `<svg class="chip-lock-svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:2px;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`;

    bookContainer.scrollTop = 0;

    // Рендеринг разворота книги (Левая страница: иллюстрация, Правая: описание и матрица вариаций)
    bookContainer.innerHTML = `
      <div class="atlas-book-spread">
        <!-- Левая страница: Анатомическая иллюстрация -->
        <div class="atlas-page atlas-page-left">
          <div class="atlas-page-stamp">${isDiscovered ? 'ИЗУЧЕНО' : 'НЕИЗВЕСТНО'}</div>
          <div class="atlas-canvas-frame">
            <canvas id="atlasFishCanvas" width="480" height="280"></canvas>
          </div>
          <div class="atlas-page-title-box">
            <div class="atlas-species-name">${isDiscovered ? fish.name : 'Неизвестный вид'}</div>
            <div class="atlas-species-sub">
              ${isDiscovered ? (fish.family ? getFamilyTitle(fish.family) : 'Пресноводный вид') : 'Таёжное озеро • Глубины'}
            </div>
            ${isDiscovered ? `<div class="rarity-pill rarity-${fish.rarity}" style="margin-top:6px;">${fish.rarity}</div>` : ''}
          </div>
        </div>

        <!-- Правая страница: Заметки натуралиста и матрица 15 вариаций -->
        <div class="atlas-page atlas-page-right">
          <div class="atlas-notes-section">
            <div class="atlas-section-title">Заметки исследователя</div>
            ${isDiscovered ? `
              <div class="atlas-record-row">
                <span>Главный трофей:</span>
                <strong style="color:#38bdf8;">${caught.maxWeight || fish.baseWeight || 1.0} кг</strong>
              </div>
              <div class="atlas-record-row">
                <span>Выловлено экземпляров:</span>
                <strong>${caught.count || 1} шт.</strong>
              </div>
              <div class="atlas-record-row">
                <span>Среда обитания:</span>
                <span>${fish.habitat || 'Спокойные заливы, омуты'}</span>
              </div>
              <div class="atlas-record-row">
                <span>Свойства:</span>
                <span>${fish.poison ? 'Ядовитая рыба' : (fish.edible ? 'Съедобная' : 'Универсальная')}</span>
              </div>
              <div class="atlas-record-row" style="margin-top:4px;font-size:11px;color:#94a3b8;">
                <span>Вариации особи:</span>
                <span style="color:#cbd5e1;">15 мутаций • 10 биотопов • 12 титулов</span>
              </div>
            ` : `
              <div style="font-size:12px;color:#64748b;line-height:1.6;padding:12px 0;">
                Вид ещё не исследован в этом озере. Поймайте его на удочку, чтобы разблокировать научные заметки, анатомию и вариации.
              </div>
            `}
          </div>

          <!-- Каталог всех 15 возможных вариаций -->
          <div class="atlas-variations-section">
            <div class="atlas-section-title" style="display:flex;justify-content:space-between;align-items:center;">
              <span>Матрица вариаций и мутаций (15)</span>
              ${isDiscovered ? `<span style="font-size:10px;color:#94a3b8;">Нажмите для предпросмотра</span>` : ''}
            </div>
            <div class="atlas-variations-grid">
              ${ALL_VARIATIONS.map(v => {
                const isVariationCaught = isDiscovered && (v.id === 'base' || !!discoveredVariations[v.id]);
                const isSelected = activeVariationPreview === v.id;
                return `
                  <button class="atlas-var-chip ${isVariationCaught ? 'unlocked' : 'locked'} ${isSelected ? 'selected' : ''}" 
                          data-variation="${v.id}" 
                          title="${v.name}: ${v.desc}">
                    <span class="var-dot" style="background:${isVariationCaught ? v.color : '#334155'};"></span>
                    <span class="var-name">${isVariationCaught ? v.name : `${lockIconSvg} ${v.name}`}</span>
                  </button>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    // Отрисовываем рыбу на холсте
    const canvas = document.getElementById('atlasFishCanvas');
    if (canvas) {
      if (isDiscovered) {
        drawDiscoveredFish(canvas, fish, activeVariationPreview);
      } else {
        drawLockedSilhouette(canvas);
      }
    }

    // Слушатели кликов по чипам вариаций
    bookContainer.querySelectorAll('.atlas-var-chip').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const varId = e.currentTarget.dataset.variation;
        const v = ALL_VARIATIONS.find(x => x.id === varId);
        const isVariationCaught = isDiscovered && (varId === 'base' || !!discoveredVariations[varId]);

        if (isVariationCaught) {
          activeVariationPreview = varId;
          bookContainer.querySelectorAll('.atlas-var-chip').forEach(b => b.classList.remove('selected'));
          e.currentTarget.classList.add('selected');
          if (canvas && isDiscovered) {
            drawDiscoveredFish(canvas, fish, activeVariationPreview);
          }
          if (typeof window.triggerHaptic === 'function') window.triggerHaptic('light');
        } else {
          if (typeof window.showToast === 'function' && v) {
            window.showToast(`${v.name}: ${v.desc}. Ещё не поймана в озере!`);
          }
          if (typeof window.triggerHaptic === 'function') window.triggerHaptic('error');
        }
      });
    });

    // Touch swipe left/right to turn pages
    let touchStartX = 0;
    bookContainer.ontouchstart = (e) => {
      if (e.changedTouches && e.changedTouches[0]) {
        touchStartX = e.changedTouches[0].screenX;
      }
    };
    bookContainer.ontouchend = (e) => {
      if (e.changedTouches && e.changedTouches[0]) {
        const touchEndX = e.changedTouches[0].screenX;
        if (touchEndX - touchStartX > 60) {
          prevPage();
        } else if (touchStartX - touchEndX > 60) {
          nextPage();
        }
      }
    };

    // Обновляем индикатор страницы
    updatePageCounter(currentPageIndex + 1, totalCount);
  }

  /**
   * Отрисовка оглавления (сетка мини-марок всех видов)
   */
  function renderTableOfContents(container, speciesList, player) {
    container.scrollTop = 0;
    const fishSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 12c3.5-5 9.5-5 13.5 0-4 5-10 5-13.5 0z"></path><polygon points="4 8 7 12 4 16 4 8"></polygon></svg>`;
    const lockSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;

    container.innerHTML = `
      <div class="atlas-toc-grid">
        ${speciesList.map((f, idx) => {
          const isCaught = player.caughtSpecies && (player.caughtSpecies[f.id] || player.caughtSpecies[String(f.id)]);
          return `
            <div class="atlas-toc-card ${isCaught ? 'unlocked' : 'locked'}" data-index="${idx}">
              <div class="toc-num">#${idx + 1}</div>
              <div class="toc-icon">${isCaught ? fishSvg : lockSvg}</div>
              <div class="toc-name">${isCaught ? f.name : '???'}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    container.querySelectorAll('.atlas-toc-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.dataset.index, 10);
        currentPageIndex = idx;
        activeVariationPreview = 'base';
        isGridOverviewMode = false;
        renderBookPage();
      });
    });

    updatePageCounter(0, speciesList.length, true);
  }

  function getFamilyTitle(family) {
    const titles = {
      cyprinids: 'Карповые и мирные',
      predators: 'Хищные и окунеобразные',
      esociforms: 'Щуковые',
      bottom_giants: 'Донные гиганты',
      salmonids: 'Лососевые и хариусы',
      sturgeons: 'Древние осетровые',
      beasts: 'Водные чудовища'
    };
    return titles[family] || family;
  }

  function updatePageCounter(curr, total, isToc = false) {
    const counterEl = document.getElementById('atlasPageCounter');
    if (counterEl) {
      counterEl.textContent = isToc ? `Оглавление (${total} видов)` : `Страница ${curr} из ${total}`;
    }
  }

  function nextPage() {
    isGridOverviewMode = false;
    activeVariationPreview = 'base';
    currentPageIndex++;
    renderBookPage();
  }

  function prevPage() {
    isGridOverviewMode = false;
    activeVariationPreview = 'base';
    currentPageIndex--;
    renderBookPage();
  }

  function toggleOverviewMode() {
    isGridOverviewMode = !isGridOverviewMode;
    renderBookPage();
  }

  function setFamilyFilter(family) {
    currentFamilyFilter = family;
    currentPageIndex = 0;
    activeVariationPreview = 'base';
    renderBookPage();
  }

  window.AtlasBook = {
    renderBookPage: renderBookPage,
    nextPage: nextPage,
    prevPage: prevPage,
    toggleOverviewMode: toggleOverviewMode,
    setFamilyFilter: setFamilyFilter,
    ALL_VARIATIONS: ALL_VARIATIONS
  };

})(window);
