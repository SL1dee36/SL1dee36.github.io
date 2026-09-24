/**
 * PROCEDURAL_RENDERER: Анатомический движок процедурной отрисовки на Canvas
 * - Кривые Безье для типов тела 0, 1, 2, 3, 5, 6, 8, -1 (хлам, бревна, сундуки)
 * - Многослойный градиент (темная спина -> базовый пигмент -> светлое брюшко)
 * - Процедурные текстуры: чешуя (дуги через ctx.clip()), полосы хищников, пятна щуки/форели
 * - Боковая линия, жаберная крышка, реалистичный глаз с бликом, лучи плавников
 * - Динамические шейдерные эффекты свечения (shadowBlur, shadowColor) с пульсацией
 */

(function (window) {
  'use strict';

  const ProceduralFishRenderer = {

    /**
     * Преобразование hex-цвета в rgba
     */
    hexToRgba(hex, alpha) {
      if (!hex || typeof hex !== 'string') return `rgba(148,163,184,${alpha})`;
      if (hex.startsWith('rgba') || hex.startsWith('hsla')) return hex;
      let c = hex.replace('#', '');
      if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
      const num = parseInt(c, 16);
      if (isNaN(num)) return `rgba(148,163,184,${alpha})`;
      const r = (num >> 16) & 255;
      const g = (num >> 8) & 255;
      const b = num & 255;
      return `rgba(${r},${g},${b},${alpha})`;
    },

    /**
     * Затемнение или осветление hex-цвета
     */
    adjustColor(hex, factor) {
      if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return hex || '#64748b';
      let c = hex.replace('#', '');
      if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
      const num = parseInt(c, 16);
      if (isNaN(num)) return hex;
      let r = Math.min(255, Math.max(0, Math.round(((num >> 16) & 255) * factor)));
      let g = Math.min(255, Math.max(0, Math.round(((num >> 8) & 255) * factor)));
      let b = Math.min(255, Math.max(0, Math.round((num & 255) * factor)));
      return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    },

    /**
     * Отрисовка превью сущности в окне поимки и атласе (Preview Canvas)
     */
    drawPreview(canvas, entity) {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Автоматическое масштабирование под холст любого разрешения
      const fishScale = Math.min(canvas.width / 140, canvas.height / 75) * 0.9;

      // Математическое центрирование (центроид анатомии рыбы x ≈ -18, y ≈ -3)
      const cx = (canvas.width / 2) + (18 * fishScale);
      const cy = (canvas.height / 2) + (3 * fishScale);

      ctx.save();
      this.renderEntity(ctx, entity, cx, cy, 0, 0, fishScale, true);
      ctx.restore();
    },

    /**
     * Отрисовка сущности под водой в игровом процессе
     */
    drawUnderwater(ctx, entity, x, y, angle, tailOsc, scale = 0.55) {
      ctx.save();
      this.renderEntity(ctx, entity, x, y, angle, tailOsc, scale, false);
      ctx.restore();
    },

    /**
     * Главный маршрутизатор рендеринга сущностей
     */
    renderEntity(ctx, entity, x, y, angle, tailOsc, scale, isPreview = false) {
      if (!entity) return;

      const bodyType = typeof entity.bodyType === 'number' ? entity.bodyType : 0;
      const baseColor = entity.color || '#94a3b8';
      const finColor = entity.finColor || this.adjustColor(baseColor, 0.8);
      const isLegendary = entity.rarity === 'Legendary';
      const mutation = entity.mutation || null;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.scale(scale, scale);

      // --- ДИНАМИЧЕСКИЕ ШЕЙДЕРНЫЕ ЭФФЕКТЫ (ПУЛЬСАЦИЯ СВЕЧЕНИЯ) ---
      const now = Date.now() * 0.003;
      const pulse = 0.85 + Math.sin(now) * 0.15;

      if (mutation && mutation.glowColor) {
        ctx.shadowColor = mutation.glowColor;
        ctx.shadowBlur = (mutation.id === 'radioactive' ? 26 : 18) * pulse;
      } else if (isLegendary) {
        ctx.shadowColor = baseColor;
        ctx.shadowBlur = 20 * pulse;
      } else if (entity.rarity === 'Epic') {
        ctx.shadowColor = baseColor;
        ctx.shadowBlur = 10;
      } else {
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
      }

      // Призрачность
      if (mutation && mutation.id === 'ghost') {
        ctx.globalAlpha = 0.65;
      }

      // Ветвление по типам анатомии
      if (bodyType === -1) {
        this.drawJunkOrChest(ctx, entity);
      } else if (bodyType === 8) {
        this.drawCrocodile(ctx, entity, tailOsc);
      } else if (bodyType === 5) {
        this.drawTurtle(ctx, entity, tailOsc);
      } else if (bodyType === 6) {
        this.drawCrayfish(ctx, entity, tailOsc);
      } else if (bodyType === 7) {
        this.drawWaterBeast(ctx, entity, tailOsc);
      } else {
        // Рыбы (bodyType: 0, 1, 2, 3, 4)
        this.drawFishAnatomy(ctx, entity, bodyType, baseColor, finColor, tailOsc);
      }

      ctx.restore();
    },

    /* ==========================================================
       АНАТОМИЧЕСКИЙ РЕНДЕРИНГ РЫБ (Безье-контуры 0, 1, 2, 3)
       ========================================================== */
    drawFishAnatomy(ctx, entity, bodyType, baseColor, finColor, tailOsc) {
      const darkBack = this.adjustColor(baseColor, 0.45);
      const lightBelly = this.adjustColor(baseColor, 1.45);
      const tailSway = Math.sin(tailOsc || 0) * (bodyType === 3 ? 9 : 6);

      // 1. ПАРНЫЕ ПЛАВНИКИ (ХВОСТОВОЙ, СПИННОЙ, АНАЛЬНЫЙ, БРЮШНЫЕ)
      this.drawFishFins(ctx, entity, bodyType, finColor, tailSway);

      // 2. АНАТОМИЧЕСКИЙ КОНТУР ТЕЛА НА КРИВЫХ БЕЗЬЕ
      ctx.save();
      ctx.beginPath();

      if (bodyType === 0) {
        // --- BODYTYPE 0: Высокотелые карповые с выраженным горбом ---
        ctx.moveTo(34, 0); // Рот
        // Спинной контур (крутой подъем в горб)
        ctx.bezierCurveTo(24, -14, 8, -26, -10, -25);
        ctx.bezierCurveTo(-24, -24, -36, -14, -44, -5);
        // Хвостовой стебель
        ctx.lineTo(-48, 0);
        ctx.lineTo(-44, 5);
        // Брюшной контур (глубокое округлое брюшко)
        ctx.bezierCurveTo(-36, 16, -20, 26, -5, 25);
        ctx.bezierCurveTo(12, 24, 26, 12, 34, 0);
      } else if (bodyType === 1) {
        // --- BODYTYPE 1: Хищники и окунеобразные (торпедообразные) ---
        ctx.moveTo(38, -1);
        // Выдающаяся нижняя челюсть и спина
        ctx.bezierCurveTo(28, -11, 10, -19, -8, -18);
        ctx.bezierCurveTo(-26, -17, -40, -10, -50, -4);
        // Хвостовой стебель
        ctx.lineTo(-54, 0);
        ctx.lineTo(-50, 4);
        // Брюхо
        ctx.bezierCurveTo(-40, 11, -24, 18, -4, 18);
        ctx.bezierCurveTo(14, 18, 28, 10, 38, -1);
      } else if (bodyType === 2) {
        // --- BODYTYPE 2: Стреловидные торпеды (Щука / Осетр / Таймень) ---
        const isSturgeon = entity.family === 'sturgeons' || entity.id === 55;
        if (isSturgeon) {
          // Осетровый острый рострум
          ctx.moveTo(48, -4);
          ctx.bezierCurveTo(34, -12, 10, -16, -15, -15);
          ctx.bezierCurveTo(-35, -14, -50, -8, -60, -3);
          ctx.lineTo(-64, 0);
          ctx.lineTo(-60, 3);
          ctx.bezierCurveTo(-48, 8, -20, 13, 5, 12);
          ctx.bezierCurveTo(26, 11, 38, 2, 48, -4);
        } else {
          // Щучий стреловидный утиный нос
          ctx.moveTo(46, -1);
          ctx.bezierCurveTo(30, -9, 8, -14, -18, -14);
          ctx.bezierCurveTo(-38, -14, -52, -7, -62, -3);
          ctx.lineTo(-66, 0);
          ctx.lineTo(-62, 3);
          ctx.bezierCurveTo(-52, 7, -34, 14, -10, 14);
          ctx.bezierCurveTo(12, 14, 32, 7, 46, -1);
        }
      } else if (bodyType === 3) {
        // --- BODYTYPE 3: Донные сомы с массивной широкой головой ---
        ctx.moveTo(36, 0);
        ctx.bezierCurveTo(30, -16, 12, -21, -8, -19);
        ctx.bezierCurveTo(-28, -17, -46, -10, -60, -4);
        ctx.lineTo(-64, 0);
        ctx.lineTo(-60, 4);
        ctx.bezierCurveTo(-46, 11, -26, 17, -6, 18);
        ctx.bezierCurveTo(14, 19, 30, 15, 36, 0);
      } else {
        // Универсальный овальный профиль
        ctx.ellipse(0, 0, 38, 18, 0, 0, Math.PI * 2);
      }

      ctx.closePath();

      // МНОГОСЛОЙНЫЙ ГРАДИЕНТ (ТЕМНАЯ СПИНА -> ПИГМЕНТ -> СВЕТЛОЕ БРЮШКО)
      const grad = ctx.createLinearGradient(0, -26, 0, 26);
      grad.addColorStop(0, darkBack);
      grad.addColorStop(0.35, baseColor);
      grad.addColorStop(0.75, this.hexToRgba(baseColor, 0.85));
      grad.addColorStop(1, lightBelly);
      ctx.fillStyle = grad;
      ctx.fill();

      // ОГРАНИЧЕНИЕ ТЕКСТУРЫ ВНУТРИ ТЕЛА ЧЕРЕЗ CTX.CLIP()
      ctx.clip();

      // 3. ПРОЦЕДУРНЫЕ ТЕКСТУРЫ (ЧЕШУЯ, ПОЛОСЫ, ПЯТНА)
      this.drawFishTextures(ctx, entity, bodyType);

      ctx.restore(); // Снятие clip()

      // 4. АНАТОМИЧЕСКИЕ ДЕТАЛИ: ЖАБЕРНАЯ КРЫШКА, БОКОВАЯ ЛИНИЯ, ГЛАЗ, УСЫ
      this.drawFishAnatomyDetails(ctx, entity, bodyType, darkBack);
    },

    /**
     * Отрисовка плавников рыбы
     */
    drawFishFins(ctx, entity, bodyType, finColor, tailSway) {
      ctx.save();
      ctx.fillStyle = finColor;
      ctx.strokeStyle = this.adjustColor(finColor, 0.6);
      ctx.lineWidth = 1;

      // 1. СПИННОЙ ПЛАВНИК
      ctx.beginPath();
      if (bodyType === 1) {
        // Высокий колючий спинной плавник хищника (Окунь, Судак)
        ctx.moveTo(-16, -17);
        ctx.lineTo(-10, -32);
        ctx.lineTo(-2, -30);
        ctx.lineTo(8, -26);
        ctx.lineTo(16, -15);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Лучи спинного плавника
        ctx.beginPath();
        ctx.moveTo(-10, -32); ctx.lineTo(-10, -17);
        ctx.moveTo(-2, -30); ctx.lineTo(-2, -18);
        ctx.moveTo(8, -26); ctx.lineTo(8, -17);
        ctx.stroke();
      } else if (bodyType === 2) {
        // Смещен назад к хвосту (Щука / Осетр)
        ctx.moveTo(-36, -13);
        ctx.bezierCurveTo(-38, -24, -28, -26, -22, -14);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (bodyType === 3) {
        // Небольшой сомовий спинной плавник
        ctx.moveTo(-6, -19);
        ctx.lineTo(-1, -26);
        ctx.lineTo(5, -18);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        // Классический серповидный плавник карповых
        ctx.moveTo(-14, -24);
        ctx.bezierCurveTo(-6, -34, 8, -32, 14, -21);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // 2. ХВОСТОВОЙ ПЛАВНИК С СИНУСОИДАЛЬНЫМ ИЗГИБОМ
      ctx.beginPath();
      if (bodyType === 3) {
        // Округлый веслообразный хвост сома
        ctx.moveTo(-54, -4);
        ctx.bezierCurveTo(-72 + tailSway, -14, -80 + tailSway, 0, -72 + tailSway, 14);
        ctx.lineTo(-54, 4);
      } else if (bodyType === 2 && (entity.family === 'sturgeons' || entity.id === 55)) {
        // Гетероцеркальный верхний длинный хвост осетра
        ctx.moveTo(-62, -2);
        ctx.lineTo(-88 + tailSway, -22);
        ctx.lineTo(-76 + tailSway, -2);
        ctx.lineTo(-84 + tailSway, 12);
        ctx.lineTo(-62, 2);
      } else {
        // V-образный раздвоенный хвост карповых и хищников
        ctx.moveTo(-46, 0);
        ctx.lineTo(-72 + tailSway, -18);
        ctx.lineTo(-62 + tailSway, 0);
        ctx.lineTo(-72 + tailSway, 18);
        ctx.lineTo(-46, 0);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 3. БРЮШНОЙ / АНАЛЬНЫЙ ПЛАВНИК
      ctx.beginPath();
      ctx.moveTo(-28, 14);
      ctx.bezierCurveTo(-32, 26, -20, 28, -14, 16);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    },

    /**
     * Процедурная чешуя, полосы и пятна внутри тела
     */
    drawFishTextures(ctx, entity, bodyType) {
      const pattern = entity.pattern || 'scales';

      if (pattern === 'stripes' || bodyType === 1) {
        // Вертикальные полосы окуня/судака
        ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
        for (let sx = -24; sx <= 20; sx += 9) {
          ctx.beginPath();
          ctx.moveTo(sx - 2, -24);
          ctx.lineTo(sx + 3, -24);
          ctx.lineTo(sx - 1, 12);
          ctx.lineTo(sx - 4, 12);
          ctx.closePath();
          ctx.fill();
        }
      }

      if (pattern === 'spots' || bodyType === 2) {
        // Камуфляжные овальные пятна щуки, сома или форели
        ctx.fillStyle = entity.family === 'esociforms' ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.25)';
        for (let px = -36; px <= 24; px += 10) {
          for (let py = -10; py <= 10; py += 8) {
            ctx.beginPath();
            ctx.ellipse(px + (py % 4), py, 3.2, 2.0, 0.2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      if (pattern === 'speckles') {
        // Мелкий форелевый крап
        ctx.fillStyle = 'rgba(239, 68, 68, 0.65)';
        for (let i = 0; i < 28; i++) {
          const rx = -34 + (i * 37) % 64;
          const ry = -12 + (i * 23) % 24;
          ctx.beginPath();
          ctx.arc(rx, ry, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        for (let i = 0; i < 24; i++) {
          const rx = -30 + (i * 29) % 60;
          const ry = -10 + (i * 19) % 20;
          ctx.beginPath();
          ctx.arc(rx, ry, 1.0, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (pattern === 'scales' || bodyType === 0) {
        // Процедурная чешуя дугами
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
        ctx.lineWidth = 1.0;
        for (let col = -34; col <= 24; col += 7) {
          for (let row = -18; row <= 18; row += 6) {
            const offsetX = (row % 12 === 0) ? 3.5 : 0;
            ctx.beginPath();
            ctx.arc(col + offsetX, row, 4.2, Math.PI * 0.2, Math.PI * 0.8, false);
            ctx.stroke();
          }
        }
      }
    },

    /**
     * Анатомические детали (глаз, жабры, боковая линия, усы)
     */
    drawFishAnatomyDetails(ctx, entity, bodyType, darkBack) {
      ctx.save();

      // 1. БОКОВАЯ ЛИНИЯ
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(-42, 0);
      ctx.bezierCurveTo(-15, 3, 10, -2, 22, -1);
      ctx.stroke();
      ctx.setLineDash([]); // Сброс

      // 2. ЖАБЕРНАЯ КРЫШКА
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(16, 0, 14, Math.PI * 0.55, Math.PI * 1.45, false);
      ctx.stroke();

      // 3. ГЛАЗ С БЛИКОМ
      const eyeX = bodyType === 2 ? 34 : (bodyType === 3 ? 24 : 22);
      const eyeY = bodyType === 3 ? -6 : -4;
      const eyeRadius = bodyType === 3 ? 3.0 : 4.5;

      // Склера
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(eyeX, eyeY, eyeRadius, 0, Math.PI * 2);
      ctx.fill();

      // Радужка
      ctx.fillStyle = entity.rarity === 'Legendary' ? '#f59e0b' : '#334155';
      ctx.beginPath();
      ctx.arc(eyeX + 0.5, eyeY, eyeRadius * 0.65, 0, Math.PI * 2);
      ctx.fill();

      // Черный зрачок
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(eyeX + 0.8, eyeY, eyeRadius * 0.35, 0, Math.PI * 2);
      ctx.fill();

      // Белый блик
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(eyeX - 0.5, eyeY - 1.2, 1.2, 0, Math.PI * 2);
      ctx.fill();

      // 4. ДЛИННЫЕ УСЫ (ДЛЯ СОМОВ И ОСЕТРОВЫХ)
      if (bodyType === 3 || entity.family === 'sturgeons' || entity.id === 57) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 1.6;

        // Верхний длинный ус
        ctx.beginPath();
        ctx.moveTo(eyeX + 8, eyeY + 4);
        ctx.bezierCurveTo(eyeX + 26, eyeY - 8, eyeX + 32, eyeY + 14, eyeX + 28, eyeY + 28);
        ctx.stroke();

        // Нижний короткий усик
        ctx.beginPath();
        ctx.moveTo(eyeX + 6, eyeY + 8);
        ctx.quadraticCurveTo(eyeX + 16, eyeY + 14, eyeX + 12, eyeY + 22);
        ctx.stroke();
      }

      ctx.restore();
    },

    /* ==========================================================
       АНАТОМИЯ КРОКОДИЛА (bodyType: 8)
       ========================================================== */
    drawCrocodile(ctx, entity, tailOsc) {
      const tailSway = Math.sin(tailOsc || 0) * 8;
      const baseColor = entity.color || '#3f6212';
      const darkColor = this.adjustColor(baseColor, 0.5);

      ctx.save();

      // 1. Хвост с двойным роговым гребнем
      ctx.fillStyle = baseColor;
      ctx.beginPath();
      ctx.moveTo(-18, -6);
      ctx.bezierCurveTo(-45, -10 + tailSway, -75, -6 + tailSway * 1.5, -92, tailSway * 2);
      ctx.bezierCurveTo(-72, 10 + tailSway, -45, 12 + tailSway, -18, 8);
      ctx.closePath();
      ctx.fill();

      // Гребни хвоста
      ctx.fillStyle = darkColor;
      for (let tx = -25; tx >= -80; tx -= 10) {
        ctx.beginPath();
        ctx.moveTo(tx, -8);
        ctx.lineTo(tx - 4, -16);
        ctx.lineTo(tx - 8, -7);
        ctx.fill();
      }

      // 2. Лапы
      ctx.fillStyle = darkColor;
      // Передняя лапа
      ctx.beginPath();
      ctx.ellipse(14, 18, 6, 12, 0.3, 0, Math.PI * 2);
      ctx.fill();
      // Задняя лапа
      ctx.beginPath();
      ctx.ellipse(-14, 16, 7, 13, -0.4, 0, Math.PI * 2);
      ctx.fill();

      // 3. Массивное туловище с остеодермами
      ctx.fillStyle = baseColor;
      ctx.beginPath();
      ctx.ellipse(0, 0, 36, 16, 0, 0, Math.PI * 2);
      ctx.fill();

      // Щитки на спине
      ctx.fillStyle = darkColor;
      for (let bx = -22; bx <= 18; bx += 8) {
        ctx.fillRect(bx, -14, 5, 4);
        ctx.fillRect(bx + 2, -8, 4, 3);
      }

      // 4. Пасть с челюстями и зубами
      ctx.fillStyle = baseColor;
      ctx.beginPath();
      ctx.moveTo(28, -8);
      ctx.lineTo(68, -4); // Ноздри
      ctx.lineTo(66, 6);  // Кончик челюсти
      ctx.lineTo(30, 8);
      ctx.closePath();
      ctx.fill();

      // Пасть / линия смыкания
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(34, 1);
      ctx.lineTo(64, 2);
      ctx.stroke();

      // Белые клыки
      ctx.fillStyle = '#fff';
      for (let z = 38; z <= 60; z += 6) {
        ctx.beginPath();
        ctx.moveTo(z, 2);
        ctx.lineTo(z + 1.5, -2);
        ctx.lineTo(z + 3, 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(z + 3, 2);
        ctx.lineTo(z + 4.5, 6);
        ctx.lineTo(z + 6, 2);
        ctx.fill();
      }

      // 5. Глаз крокодила (выпуклый желтый с вертикальным зрачком)
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.arc(32, -9, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.fillRect(31.5, -12, 1.2, 6);

      ctx.restore();
    },

    /* ==========================================================
       АНАТОМИЯ ЧЕРЕПАХИ (bodyType: 5)
       ========================================================== */
    drawTurtle(ctx, entity, tailOsc) {
      const baseColor = entity.color || '#365314';
      const shellColor = this.adjustColor(baseColor, 0.7);

      ctx.save();

      // 1. Лапы и голова
      ctx.fillStyle = baseColor;
      // 4 лапы
      ctx.beginPath();
      ctx.ellipse(22, -18, 9, 5, -0.4, 0, Math.PI * 2); // передняя верхняя
      ctx.ellipse(22, 18, 9, 5, 0.4, 0, Math.PI * 2);  // передняя нижняя
      ctx.ellipse(-20, -18, 8, 4, 0.3, 0, Math.PI * 2); // задняя верхняя
      ctx.ellipse(-20, 18, 8, 4, -0.3, 0, Math.PI * 2); // задняя нижняя
      ctx.fill();

      // Хвостик
      ctx.beginPath();
      ctx.moveTo(-28, -2);
      ctx.lineTo(-40, 0);
      ctx.lineTo(-28, 2);
      ctx.fill();

      // Голова с клювом
      ctx.beginPath();
      ctx.ellipse(32, 0, 11, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      // Глаз
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(36, -3, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(36.5, -3, 1, 0, Math.PI * 2);
      ctx.fill();

      // 2. Куполообразный панцирь (Карапакс)
      ctx.fillStyle = shellColor;
      ctx.beginPath();
      ctx.ellipse(0, 0, 28, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = this.adjustColor(shellColor, 0.4);
      ctx.lineWidth = 2;
      ctx.stroke();

      // Щитки панциря
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1.2;
      // Центральный ряд
      for (let sc = -12; sc <= 12; sc += 12) {
        ctx.beginPath();
        ctx.arc(sc, 0, 6, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    },

    /* ==========================================================
       АНАТОМИЯ РАКА (bodyType: 6)
       ========================================================== */
    drawCrayfish(ctx, entity, tailOsc) {
      const baseColor = entity.color || '#78350f';
      const darkColor = this.adjustColor(baseColor, 0.6);

      ctx.save();

      // 1. Сегментированный хвост (6 сегментов)
      ctx.fillStyle = baseColor;
      for (let seg = 1; seg <= 5; seg++) {
        const sx = -seg * 8;
        const sw = 16 - seg * 2;
        ctx.beginPath();
        ctx.ellipse(sx, 0, 5, sw, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = darkColor;
        ctx.stroke();
      }
      // Веерообразный тельсон и уроподы
      ctx.beginPath();
      ctx.moveTo(-44, 0);
      ctx.lineTo(-58, -14);
      ctx.lineTo(-54, 0);
      ctx.lineTo(-58, 14);
      ctx.closePath();
      ctx.fill();

      // 2. Головогрудь (Цефалоторакс)
      ctx.fillStyle = baseColor;
      ctx.beginPath();
      ctx.ellipse(2, 0, 16, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      // 3. Острый рострум и глаза
      ctx.beginPath();
      ctx.moveTo(14, -3);
      ctx.lineTo(26, 0);
      ctx.lineTo(14, 3);
      ctx.fill();
      // Глаза на стебельках
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(16, -6, 2, 0, Math.PI * 2);
      ctx.arc(16, 6, 2, 0, Math.PI * 2);
      ctx.fill();

      // Длинные усы-антенны
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(24, -2);
      ctx.bezierCurveTo(40, -18, 55, -24, 65, -28);
      ctx.moveTo(24, 2);
      ctx.bezierCurveTo(40, 18, 55, 24, 65, 28);
      ctx.stroke();

      // 4. Две массивные клешни (Chelae)
      ctx.fillStyle = this.adjustColor(baseColor, 0.9);
      // Верхняя клешня
      ctx.beginPath();
      ctx.moveTo(8, -10);
      ctx.lineTo(20, -22);
      ctx.ellipse(32, -26, 12, 6, -0.4, 0, Math.PI * 2);
      ctx.fill();
      // Нижняя клешня
      ctx.beginPath();
      ctx.moveTo(8, 10);
      ctx.lineTo(20, 22);
      ctx.ellipse(32, 26, 12, 6, 0.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    },

    /* ==========================================================
       АНАТОМИЯ ПОЛУВОДНЫХ ЗВЕРЕЙ И ЗМЕЙ (bodyType: 7)
       ========================================================== */
    drawWaterBeast(ctx, entity, tailOsc) {
      const baseColor = entity.color || '#57534e';
      const isSnake = entity.name.includes('уж') || entity.name.includes('гадюка') || entity.name.includes('змея');

      ctx.save();
      if (isSnake) {
        // Водная змея (волнообразное тело)
        ctx.strokeStyle = baseColor;
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-45, Math.sin(tailOsc) * 8);
        ctx.bezierCurveTo(-20, 15, 10, -15, 38, 0);
        ctx.stroke();
        // Голова змеи
        ctx.fillStyle = this.adjustColor(baseColor, 0.8);
        ctx.beginPath();
        ctx.ellipse(40, 0, 7, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        // Глаз
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(42, -2, 1.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Бобр / Ондатра: пушистое каплевидное тело, уши, хвост-лопата
        // Плоский чешуйчатый хвост
        ctx.fillStyle = '#292524';
        ctx.beginPath();
        ctx.ellipse(-34, 0, 16, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        // Тело
        ctx.fillStyle = baseColor;
        ctx.beginPath();
        ctx.ellipse(0, 0, 26, 16, 0, 0, Math.PI * 2);
        ctx.fill();

        // Круглая мордочка и уши
        ctx.beginPath();
        ctx.ellipse(24, -2, 10, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#44403c';
        ctx.beginPath();
        ctx.arc(20, -10, 3, 0, Math.PI * 2);
        ctx.fill();
        // Глаз-бусинка
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(28, -4, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    },

    /* ==========================================================
       ОТРИСОВКА ХЛАМА, ДРОВ И СУНДУКОВ (bodyType: -1)
       ========================================================== */
    drawJunkOrChest(ctx, entity) {
      const kind = entity.itemKind || 'boot';

      ctx.save();
      if (kind === 'chest') {
        // --- СУНДУК КОНТРАБАНДИСТОВ / ЛАРЕЦ ---
        // Деревянный корпус
        ctx.fillStyle = entity.color || '#b45309';
        ctx.fillRect(-28, -18, 56, 36);

        // Крышка со скруглением
        ctx.beginPath();
        ctx.ellipse(0, -18, 28, 8, 0, Math.PI, 0);
        ctx.fill();

        // Кованые железные полосы с заклепками
        ctx.fillStyle = '#334155';
        ctx.fillRect(-22, -22, 6, 40);
        ctx.fillRect(16, -22, 6, 40);

        // Таинственное сияние из щели
        ctx.fillStyle = '#fbbf24';
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 12;
        ctx.fillRect(-27, -2, 54, 3);
        ctx.shadowBlur = 0;

        // Замочная скважина / навесной замок
        ctx.fillStyle = '#ca8a04';
        ctx.beginPath();
        ctx.arc(0, 4, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.fillRect(-1.5, 3, 3, 5);

      } else if (kind === 'log') {
        // --- ДЕРЕВЯННОЕ БРЕВНО ДЛЯ ПЕЧИ ---
        // Кора бревна
        ctx.fillStyle = entity.color || '#78350f';
        ctx.fillRect(-32, -14, 60, 28);

        // Годичные кольца спила
        ctx.fillStyle = '#d97706';
        ctx.beginPath();
        ctx.ellipse(28, 0, 7, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#92400e';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(28, 0, 4, 8, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Трещины и сучок
        ctx.fillStyle = '#451a03';
        ctx.beginPath();
        ctx.arc(-8, -4, 3.5, 0, Math.PI * 2);
        ctx.fill();

      } else if (kind === 'boot') {
        // --- САПОГ С КАБЛУКОМ И ЗАПЛАТКОЙ ---
        ctx.fillStyle = entity.color || '#1e293b';
        ctx.beginPath();
        ctx.moveTo(-16, -24);
        ctx.lineTo(2, -24);
        ctx.lineTo(2, 6);
        ctx.bezierCurveTo(12, 6, 28, 10, 32, 16);
        ctx.lineTo(30, 22);
        ctx.lineTo(-18, 22); // подошва
        ctx.lineTo(-18, 14); // каблук
        ctx.lineTo(-12, 14);
        ctx.lineTo(-16, -24);
        ctx.closePath();
        ctx.fill();

        // Подошва
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-18, 20, 49, 4);

      } else if (kind === 'anchor') {
        // --- КОВАНЫЙ ЯКОРЬ ---
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';

        // Веретено
        ctx.beginPath();
        ctx.moveTo(0, -26);
        ctx.lineTo(0, 18);
        ctx.stroke();

        // Рога якоря
        ctx.beginPath();
        ctx.arc(0, 6, 20, Math.PI * 0.1, Math.PI * 0.9, false);
        ctx.stroke();

        // Кольцо (рым)
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, -26, 6, 0, Math.PI * 2);
        ctx.stroke();

      } else {
        // Универсальный предмет (консервная банка / тина / книга)
        ctx.fillStyle = entity.color || '#64748b';
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(-20, -14, 40, 28, 6) : ctx.rect(-20, -14, 40, 28);
        ctx.fill();
      }

      ctx.restore();
    }
  };

  window.ProceduralFishRenderer = ProceduralFishRenderer;

})(typeof window !== 'undefined' ? window : global);
