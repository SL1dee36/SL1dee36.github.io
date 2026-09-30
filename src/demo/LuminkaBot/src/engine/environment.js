/* ==========================================================
   LUMIBOT FISHING - ENVIRONMENT.JS
   Менеджер времени суток (День/Ночь), динамической погоды и атмосферы
   ========================================================== */

var waveOffset = 0;
var lastFrameTime = performance.now();
var homeSceneTransition = 0.0;
var homeEmbers = [];

/* ==========================================================
   МЕНЕДЖЕР ВРЕМЕНИ СУТОК И ПОГОДНЫХ УСЛОВИЙ
   ========================================================== */
/* ==========================================================
   ЦВЕТОВАЯ ИНТЕРПОЛЯЦИЯ И 24-ЧАСОВЫЕ КЛЮЧЕВЫЕ КАДРЫ
   ========================================================== */
function envHexToRgb(hex) {
  const clean = hex.replace("#", "");
  const num = parseInt(clean, 16);
  if (clean.length === 6) {
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  } else if (clean.length === 3) {
    const r = (num >> 8) & 15;
    const g = (num >> 4) & 15;
    const b = num & 15;
    return [(r << 4) | r, (g << 4) | g, (b << 4) | b];
  }
  return [0, 0, 0];
}

const _parsedColorCache = new Map();
function envParseRgba(str) {
  if (Array.isArray(str)) return str;
  if (!str) return [0, 0, 0, 1.0];
  const cached = _parsedColorCache.get(str);
  if (cached) return cached;

  let res = [0, 0, 0, 1.0];
  if (str.startsWith("#")) {
    const [r, g, b] = envHexToRgb(str);
    res = [r, g, b, 1.0];
  } else {
    const match = str.match(/rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)(?:\s*,\s*([0-9.]+))?\s*\)/);
    if (match) {
      res = [parseFloat(match[1]), parseFloat(match[2]), parseFloat(match[3]), match[4] !== undefined ? parseFloat(match[4]) : 1.0];
    }
  }
  _parsedColorCache.set(str, res);
  return res;
}

function envLerpRgba(c1, c2, t) {
  const p1 = Array.isArray(c1) ? c1 : envParseRgba(c1);
  const p2 = Array.isArray(c2) ? c2 : envParseRgba(c2);
  const r = (p1[0] + (p2[0] - p1[0]) * t) | 0;
  const g = (p1[1] + (p2[1] - p1[1]) * t) | 0;
  const b = (p1[2] + (p2[2] - p1[2]) * t) | 0;
  const a = +(p1[3] + (p2[3] - p1[3]) * t).toFixed(3);
  return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + a + ')';
}

const TIME_KEYFRAMES = [
  { h: 0.0,  c0: '#020612', c1: '#071324', c2: '#0d2038', c3: '#122a46', wt: 'rgba(6, 18, 32, 0.95)', wb: '#020710', wash: 'rgba(3, 7, 18, 0.22)' },
  { h: 4.0,  c0: '#050b1a', c1: '#0c172c', c2: '#142540', c3: '#1a3250', wt: 'rgba(8, 20, 36, 0.95)', wb: '#030812', wash: 'rgba(3, 7, 18, 0.20)' },
  { h: 5.2,  c0: '#130a24', c1: '#2d123e', c2: '#6a1b4d', c3: '#b84732', wt: 'rgba(28, 16, 42, 0.94)', wb: '#08101e', wash: 'rgba(100, 25, 75, 0.12)' },
  { h: 6.5,  c0: '#181b45', c1: '#3b2667', c2: '#9e3d64', c3: '#f59e0b', wt: 'rgba(42, 28, 54, 0.92)', wb: '#0c182a', wash: 'rgba(245, 158, 11, 0.08)' },
  { h: 8.0,  c0: '#0c4a6e', c1: '#0284c7', c2: '#38bdf8', c3: '#fed7aa', wt: 'rgba(12, 74, 110, 0.90)', wb: '#072b45', wash: 'rgba(254, 215, 170, 0.05)' },
  { h: 10.5, c0: '#0369a1', c1: '#0284c7', c2: '#38bdf8', c3: '#bae6fd', wt: 'rgba(14, 116, 144, 0.88)', wb: '#082f49', wash: 'rgba(255, 255, 255, 0.03)' },
  { h: 13.5, c0: '#0284c7', c1: '#38bdf8', c2: '#7dd3fc', c3: '#e0f2fe', wt: 'rgba(14, 116, 144, 0.86)', wb: '#073b5c', wash: 'rgba(254, 240, 138, 0.04)' },
  { h: 16.5, c0: '#0369a1', c1: '#0ea5e9', c2: '#7dd3fc', c3: '#fed7aa', wt: 'rgba(14, 116, 144, 0.88)', wb: '#082f49', wash: 'rgba(251, 191, 36, 0.05)' },
  { h: 18.5, c0: '#1e1b4b', c1: '#432874', c2: '#b43a57', c3: '#ea580c', wt: 'rgba(60, 24, 66, 0.90)', wb: '#0e1a2f', wash: 'rgba(234, 88, 12, 0.10)' },
  { h: 20.0, c0: '#1c0d30', c1: '#581c87', c2: '#be123c', c3: '#c2410c', wt: 'rgba(76, 29, 65, 0.92)', wb: '#0f172a', wash: 'rgba(190, 18, 60, 0.14)' },
  { h: 21.5, c0: '#0f0728', c1: '#2e1065', c2: '#4c1d95', c3: '#312e81', wt: 'rgba(35, 18, 55, 0.94)', wb: '#080e1c', wash: 'rgba(49, 46, 129, 0.16)' },
  { h: 23.0, c0: '#020612', c1: '#081628', c2: '#0e243c', c3: '#163450', wt: 'rgba(8, 20, 36, 0.95)', wb: '#030712', wash: 'rgba(3, 7, 18, 0.20)' }
];

const WEATHER_OVERCAST = {
  storm: {
    c0: '#080c14', c1: '#111827', c2: '#1e293b', c3: '#334155',
    wt: 'rgba(15, 23, 42, 0.96)', wb: '#020617',
    wash: 'rgba(15, 23, 42, 0.28)'
  },
  rain: {
    c0: '#0f172a', c1: '#1e293b', c2: '#293d58', c3: '#475569',
    wt: 'rgba(20, 32, 48, 0.94)', wb: '#06101c',
    wash: 'rgba(15, 23, 42, 0.18)'
  },
  fog: {
    c0: '#1e293b', c1: '#334155', c2: '#475569', c3: '#64748b',
    wt: 'rgba(30, 41, 59, 0.92)', wb: '#0f172a',
    wash: 'rgba(148, 163, 184, 0.15)'
  }
};

/* ==========================================================
   ЦВЕТОВАЯ ИНТЕРПОЛЯЦИЯ И 24-ЧАСОВЫЕ КЛЮЧЕВЫЕ КАДРЫ
   ========================================================== */
class EnvironmentManager {
  constructor() {
    // Возможность тестирования любого времени суток через URL (?time=12.5)
    let initHours = 5.5; // Красивый рассвет по умолчанию
    if (typeof window !== "undefined" && window.location && window.location.search) {
      const params = new URLSearchParams(window.location.search);
      if (params.has("time")) {
        const val = parseFloat(params.get("time"));
        if (!isNaN(val)) initHours = (val % 24.0 + 24.0) % 24.0;
      }
    }
    this.gameTimeHours = initHours;
    // Скорость времени: 1 игровой час за 35 реальных секунд (~14 минут полный цикл 24ч)
    this.timeScale = 1.0 / 35.0;

    // Погода: "clear", "cloudy", "rain", "fog", "storm"
    this.weather = "clear";
    this.previousWeather = "clear";
    this.weatherTransition = 1.0;
    this.weatherTimer = 220 + Math.random() * 120; // 3.5 - 5.5 минут на тип погоды

    // Частицы дождя
    this.rainParticles = [];
    this.maxRain = 95;
    this.initRain();

    // Круги от капель на поверхности воды
    this.waterRings = [];
    this.maxRings = 40;

    // Объёмы тумана
    this.fogVolumes = [];
    this.initFog();

    // Молния во время грозы
    this.lightningTimer = 6 + Math.random() * 8;
    this.lightningFlash = 0; // 0.0 - 1.0

    // Процедурные облака над озером
    this.clouds = [];
    this.initClouds();
  }

  initRain() {
    this.rainParticles = [];
    for (let i = 0; i < this.maxRain; i++) {
      this.rainParticles.push({
        x: Math.random() * 800,
        y: Math.random() * 800,
        len: 12 + Math.random() * 16,
        speed: 620 + Math.random() * 260,
        wind: -65 - Math.random() * 45
      });
    }
  }

  initFog() {
    this.fogVolumes = [];
    for (let i = 0; i < 9; i++) {
      this.fogVolumes.push({
        relX: Math.random(),
        relY: 0.38 + Math.random() * 0.18,
        radiusX: 90 + Math.random() * 110,
        radiusY: 20 + Math.random() * 18,
        speed: 0.008 + Math.random() * 0.012,
        phase: Math.random() * Math.PI * 2,
        baseAlpha: 0.12 + Math.random() * 0.14
      });
    }
  }

  initClouds(w = 800, waterTop = 350) {
    this.clouds = [];
    const count = 7;
    for (let i = 0; i < count; i++) {
      const isCirrus = i < 2; // 2 высоких перистых облака, 5 объемных кучевых
      const scale = isCirrus ? (1.0 + Math.random() * 0.6) : (0.75 + Math.random() * 0.55);
      const puffs = [];
      if (!isCirrus) {
        puffs.push({ dx: 0, dy: 6, rx: 55, ry: 18 });
        puffs.push({ dx: -24, dy: -4, rx: 32, ry: 24 });
        puffs.push({ dx: 12, dy: -8, rx: 38, ry: 28 });
        puffs.push({ dx: -6, dy: -18, rx: 26, ry: 22 });
        puffs.push({ dx: -48, dy: 4, rx: 24, ry: 15 });
        puffs.push({ dx: 44, dy: 3, rx: 28, ry: 16 });
      } else {
        puffs.push({ dx: -55, dy: 0, rx: 65, ry: 9 });
        puffs.push({ dx: 12, dy: -3, rx: 78, ry: 11 });
        puffs.push({ dx: 68, dy: 2, rx: 48, ry: 8 });
      }

      this.clouds.push({
        x: (w / count) * i + (Math.random() - 0.5) * 80,
        y: waterTop * (isCirrus ? (0.06 + Math.random() * 0.14) : (0.16 + (i % 3) * 0.11)),
        speed: isCirrus ? (3.5 + Math.random() * 3.5) : (6.5 + Math.random() * 7.5),
        scale: scale,
        layer: isCirrus ? "cirrus" : "cumulus",
        opacity: isCirrus ? (0.28 + Math.random() * 0.16) : (0.65 + Math.random() * 0.22),
        puffs: puffs
      });
    }
  }

  update(dt, w = 400, waterTop = 350) {
    // 1. Продвижение игрового времени
    this.gameTimeHours = (this.gameTimeHours + dt * this.timeScale) % 24.0;

    // 2. Таймер смены погоды
    this.weatherTimer -= dt;
    if (this.weatherTimer <= 0) {
      this.cycleWeather();
    }
    if (this.weatherTransition < 1.0) {
      this.weatherTransition = Math.min(1.0, this.weatherTransition + dt * 0.4);
    }

    // 3. Обновление дождя
    const isRaining = this.weather === "rain" || this.weather === "storm";
    const rainCount = this.weather === "storm" ? 140 : 85;

    if (isRaining) {
      while (this.rainParticles.length < rainCount) {
        this.rainParticles.push({
          x: Math.random() * (w + 120),
          y: -20 - Math.random() * 100,
          len: 14 + Math.random() * 18,
          speed: 700 + Math.random() * 250,
          wind: -85 - Math.random() * 55
        });
      }

      for (let i = 0; i < this.rainParticles.length; i++) {
        const p = this.rainParticles[i];
        p.x += p.wind * dt;
        p.y += p.speed * dt;

        // Если капля достигла воды — создаем кружок на поверхности
        const surfaceY = (typeof getWaterSurfaceY === "function")
          ? getWaterSurfaceY(p.x, 0, 1.0)
          : waterTop;

        if (p.y >= surfaceY) {
          if (p.x >= 0 && p.x <= w && this.waterRings.length < this.maxRings) {
            this.waterRings.push({
              x: p.x,
              y: surfaceY,
              r: 1.5,
              maxR: 9 + Math.random() * 11,
              alpha: 0.45 + Math.random() * 0.25
            });
          }
          // Перезапуск капли сверху
          p.x = Math.random() * (w + 140);
          p.y = -20 - Math.random() * 40;
        }
      }

      // Обновление кругов на воде (O(1) swap-pop без GC нагрузки)
      for (let i = this.waterRings.length - 1; i >= 0; i--) {
        const ring = this.waterRings[i];
        ring.r += dt * 26;
        ring.alpha -= dt * 0.85;
        if (ring.alpha <= 0 || ring.r >= ring.maxR) {
          const lastRing = this.waterRings.pop();
          if (i < this.waterRings.length) {
            this.waterRings[i] = lastRing;
          }
        }
      }
    } else {
      this.rainParticles.length = 0;
      this.waterRings.length = 0;
    }

    // 4. Обновление тумана
    for (let i = 0; i < this.fogVolumes.length; i++) {
      const fog = this.fogVolumes[i];
      fog.relX += fog.speed * dt * 0.4;
      if (fog.relX > 1.25) fog.relX = -0.25;
    }

    // 4.5. Плавное перемещение процедурных облаков по ветру
    if (this.clouds && this.clouds.length > 0) {
      const windFactor = (this.weather === "storm" ? 2.6 : this.weather === "rain" ? 1.6 : 1.0);
      for (let i = 0; i < this.clouds.length; i++) {
        const c = this.clouds[i];
        c.x += c.speed * dt * windFactor;
        const bound = 140 * c.scale;
        if (c.x > w + bound) {
          c.x = -bound;
          c.y = waterTop * (c.layer === "cirrus" ? (0.05 + Math.random() * 0.15) : (0.14 + Math.random() * 0.35));
        }
      }
    }

    // Обновление HUD индикатора времени и погоды раз в секунду
    this._hudTimer = (this._hudTimer || 0) + dt;
    if (this._hudTimer >= 1.2) {
      this._hudTimer = 0;
      const envTimeText = document.getElementById("envTimeText");
      const envWeatherIcon = document.getElementById("envWeatherIcon");
      if (envTimeText && envWeatherIcon) {
        const info = this.getHUDInfo();
        envTimeText.textContent = `${info.timeStr} • ${info.weatherName}`;
        envWeatherIcon.innerHTML = info.iconSvg;
      }
    }

    // 5. Обновление грозы и молний
    if (this.weather === "storm") {
      this.lightningTimer -= dt;
      if (this.lightningTimer <= 0) {
        this.triggerLightning();
        this.lightningTimer = 8 + Math.random() * 14;
      }
      if (this.lightningFlash > 0) {
        this.lightningFlash = Math.max(0, this.lightningFlash - dt * 4.5);
      }
    } else {
      this.lightningFlash = 0;
    }
  }

  cycleWeather() {
    this.previousWeather = this.weather;
    const pool = ["clear", "clear", "cloudy", "rain", "fog", "storm"];
    let next = pool[Math.floor(Math.random() * pool.length)];
    if (next === this.weather) {
      next = this.weather === "clear" ? "rain" : "clear";
    }
    this.weather = next;
    this.weatherTransition = 0.0;
    this.weatherTimer = 200 + Math.random() * 140;

    if (typeof showToast === "function") {
      const info = this.getHUDInfo();
      showToast(`Погода изменилась: ${info.weatherName}! ${info.bonusText}`);
    }
  }

  triggerLightning() {
    this.lightningFlash = 0.95;
    if (window.sound && typeof window.sound.playThunder === "function") {
      try { window.sound.playThunder(); } catch (e) { }
    }
    if (typeof triggerHaptic === "function") triggerHaptic("medium");
  }

  setWeather(wKey) {
    if (["clear", "cloudy", "rain", "fog", "storm"].includes(wKey)) {
      this.previousWeather = this.weather;
      this.weather = wKey;
      this.weatherTransition = 0.0;
      this.weatherTimer = 300;
    }
  }

  setTime(hours) {
    this.gameTimeHours = (hours % 24.0 + 24.0) % 24.0;
  }

  getTimePhase() {
    const h = this.gameTimeHours;
    if (h >= 4.5 && h < 8.5) return "dawn";
    if (h >= 8.5 && h < 18.5) return "day";
    if (h >= 18.5 && h < 22.5) return "dusk";
    return "night";
  }

  // Расчет плавной интерполяции суточных ключевых кадров с быстрым кешированием на кадр
  _getInterpolatedTimeState() {
    const h = (this.gameTimeHours % 24.0 + 24.0) % 24.0;
    const quantH = Math.round(h * 60) / 60; // квантование для 97%+ попадания в кэш градиентов
    const quantTrans = Math.round(this.weatherTransition * 20) / 20;
    if (this._lastHourCalc === quantH && this._lastWeatherCalc === this.weather && this._lastTransCalc === quantTrans && this._cachedState) {
      return this._cachedState;
    }
    const len = TIME_KEYFRAMES.length;
    let k1 = TIME_KEYFRAMES[len - 1];
    let k2 = TIME_KEYFRAMES[0];
    let progress = 0;

    for (let i = 0; i < len; i++) {
      const curr = TIME_KEYFRAMES[i];
      const next = TIME_KEYFRAMES[(i + 1) % len];
      const t1 = curr.h;
      const t2 = (i + 1 < len) ? next.h : 24.0;

      if (h >= t1 && h < t2) {
        k1 = curr;
        k2 = next;
        progress = (h - t1) / (t2 - t1);
        break;
      }
    }

    // Базовые гладкие цвета ясного неба и освещения
    let c0 = envLerpRgba(k1.c0, k2.c0, progress);
    let c1 = envLerpRgba(k1.c1, k2.c1, progress);
    let c2 = envLerpRgba(k1.c2, k2.c2, progress);
    let c3 = envLerpRgba(k1.c3, k2.c3, progress);
    let topColor = envLerpRgba(k1.wt, k2.wt, progress);
    let bottomColor = envLerpRgba(k1.wb, k2.wb, progress);
    let ambientWash = envLerpRgba(k1.wash, k2.wash, progress);

    // Плавное влияние погоды (пасмурность, дождь, туман, гроза)
    const overcast = WEATHER_OVERCAST[this.weather];
    if (overcast) {
      const transFactor = (this.weather === "storm" ? 0.90 : this.weather === "rain" ? 0.78 : 0.65) * Math.min(1.0, this.weatherTransition);
      c0 = envLerpRgba(c0, overcast.c0, transFactor);
      c1 = envLerpRgba(c1, overcast.c1, transFactor);
      c2 = envLerpRgba(c2, overcast.c2, transFactor);
      c3 = envLerpRgba(c3, overcast.c3, transFactor);
      topColor = envLerpRgba(topColor, overcast.wt, transFactor);
      bottomColor = envLerpRgba(bottomColor, overcast.wb, transFactor);
      ambientWash = envLerpRgba(ambientWash, overcast.wash, transFactor);
    } else if (this.weather === "cloudy") {
      const cloudFactor = 0.28 * Math.min(1.0, this.weatherTransition);
      c0 = envLerpRgba(c0, "#1e293b", cloudFactor);
      c1 = envLerpRgba(c1, "#334155", cloudFactor);
      c2 = envLerpRgba(c2, "#475569", cloudFactor);
      c3 = envLerpRgba(c3, "#64748b", cloudFactor);
    }

    this._lastHourCalc = quantH;
    this._lastWeatherCalc = this.weather;
    this._lastTransCalc = quantTrans;
    this._cachedState = { c0, c1, c2, c3, topColor, bottomColor, ambientWash };
    return this._cachedState;
  }

  getSkyColors(waterTop = 350) {
    const state = this._getInterpolatedTimeState();
    return { c0: state.c0, c1: state.c1, c2: state.c2, c3: state.c3 };
  }

  getCloudColors() {
    const h = (this.gameTimeHours % 24.0 + 24.0) % 24.0;
    const quantH = Math.round(h * 60) / 60;
    const quantTrans = Math.round(this.weatherTransition * 20) / 20;
    if (this._lastCloudHour === quantH && this._lastCloudWeather === this.weather && this._lastCloudTrans === quantTrans && this._cachedCloudColors) {
      return this._cachedCloudColors;
    }
    const CLOUD_KEYFRAMES = [
      { h: 0.0,  top: "rgba(22, 36, 56, 0.45)",  bot: "rgba(10, 18, 30, 0.70)", rim: "rgba(186, 215, 238, 0.18)" },
      { h: 4.0,  top: "rgba(26, 42, 64, 0.50)",  bot: "rgba(12, 22, 36, 0.72)", rim: "rgba(186, 215, 238, 0.18)" },
      { h: 5.2,  top: "rgba(168, 85, 120, 0.70)", bot: "rgba(74, 28, 68, 0.75)", rim: "rgba(251, 146, 60, 0.45)" },
      { h: 6.5,  top: "rgba(254, 215, 170, 0.85)", bot: "rgba(180, 83, 9, 0.65)", rim: "rgba(245, 158, 11, 0.55)" },
      { h: 8.5,  top: "rgba(255, 255, 255, 0.90)", bot: "rgba(203, 213, 225, 0.72)", rim: "rgba(255, 255, 255, 0.50)" },
      { h: 13.0, top: "rgba(255, 255, 255, 0.94)", bot: "rgba(186, 215, 238, 0.75)", rim: "rgba(255, 255, 255, 0.60)" },
      { h: 17.5, top: "rgba(254, 243, 199, 0.90)", bot: "rgba(203, 213, 225, 0.72)", rim: "rgba(251, 191, 36, 0.55)" },
      { h: 19.5, top: "rgba(251, 146, 60, 0.88)",  bot: "rgba(159, 18, 57, 0.75)", rim: "rgba(234, 88, 12, 0.60)" },
      { h: 21.0, top: "rgba(147, 51, 234, 0.65)",  bot: "rgba(49, 46, 129, 0.78)", rim: "rgba(217, 70, 239, 0.35)" },
      { h: 22.5, top: "rgba(30, 41, 59, 0.50)",   bot: "rgba(15, 23, 42, 0.72)", rim: "rgba(148, 163, 184, 0.20)" }
    ];

    const len = CLOUD_KEYFRAMES.length;
    let k1 = CLOUD_KEYFRAMES[len - 1];
    let k2 = CLOUD_KEYFRAMES[0];
    let progress = 0;

    for (let i = 0; i < len; i++) {
      const curr = CLOUD_KEYFRAMES[i];
      const next = CLOUD_KEYFRAMES[(i + 1) % len];
      const t1 = curr.h;
      const t2 = (i + 1 < len) ? next.h : 24.0;
      if (h >= t1 && h < t2) {
        k1 = curr;
        k2 = next;
        progress = (h - t1) / (t2 - t1);
        break;
      }
    }

    let top = envLerpRgba(k1.top, k2.top, progress);
    let bot = envLerpRgba(k1.bot, k2.bot, progress);
    let rim = envLerpRgba(k1.rim, k2.rim, progress);

    // Влияние пасмурной/дождливой погоды
    if (this.weather === "storm") {
      const f = 0.88 * Math.min(1.0, this.weatherTransition);
      top = envLerpRgba(top, "rgba(51, 65, 85, 0.95)", f);
      bot = envLerpRgba(bot, "rgba(15, 23, 42, 0.98)", f);
      rim = envLerpRgba(rim, "rgba(30, 41, 59, 0.40)", f);
    } else if (this.weather === "rain") {
      const f = 0.75 * Math.min(1.0, this.weatherTransition);
      top = envLerpRgba(top, "rgba(100, 116, 139, 0.90)", f);
      bot = envLerpRgba(bot, "rgba(30, 41, 59, 0.92)", f);
      rim = envLerpRgba(rim, "rgba(71, 85, 105, 0.35)", f);
    } else if (this.weather === "cloudy") {
      const f = 0.45 * Math.min(1.0, this.weatherTransition);
      top = envLerpRgba(top, "rgba(226, 232, 240, 0.92)", f);
      bot = envLerpRgba(bot, "rgba(148, 163, 184, 0.82)", f);
    }

    this._lastCloudHour = quantH;
    this._lastCloudWeather = this.weather;
    this._lastCloudTrans = quantTrans;
    this._cachedCloudColors = { top, bot, rim };
    return this._cachedCloudColors;
  }

  getWaterColors(waterTop, h) {
    const state = this._getInterpolatedTimeState();
    return { topColor: state.topColor, bottomColor: state.bottomColor };
  }

  getAmbientWash() {
    const state = this._getInterpolatedTimeState();
    return state.ambientWash;
  }

  getCelestialBody(w, waterTop) {
    const h = (this.gameTimeHours % 24.0 + 24.0) % 24.0;

    // Солнце: восход с 04:30 до заката в 21:00
    if (h >= 4.5 && h <= 21.0) {
      const sunProgress = (h - 4.5) / 16.5; // 0.0 до 1.0
      const sunX = w * (0.12 + sunProgress * 0.76);
      const arc = Math.sin(sunProgress * Math.PI);
      const sunY = waterTop * (0.90 - arc * 0.78);
      const isLow = arc < 0.35;
      const sunAlpha = Math.min(1.0, arc * 3.5);

      // Плавное переливание цвета солнца от рассветного янтаря до полуденного золота
      const sunColor = envLerpRgba("#f59e0b", "#fef08a", Math.min(1.0, arc * 2.2));
      const sunGlow = isLow
        ? `rgba(245, 158, 11, ${(0.35 * sunAlpha).toFixed(3)})`
        : `rgba(254, 240, 138, ${(0.38 * sunAlpha).toFixed(3)})`;

      return {
        type: "sun",
        x: sunX,
        y: sunY,
        radius: isLow ? 17 : 20,
        color: sunColor,
        glowColor: sunGlow,
        trailColor: isLow ? "rgba_warm" : "rgba_gold",
        alpha: sunAlpha
      };
    }

    // Луна: восход с 20:20 до захода в 05:40
    let moonProgress = -1;
    if (h >= 20.2) {
      moonProgress = (h - 20.2) / 9.6;
    } else if (h <= 5.8) {
      moonProgress = (h + 3.8) / 9.6;
    }

    if (moonProgress >= 0 && moonProgress <= 1.0) {
      const moonX = w * (0.18 + moonProgress * 0.68);
      const mArc = Math.sin(moonProgress * Math.PI);
      const moonY = waterTop * (0.78 - mArc * 0.58);
      const moonAlpha = Math.min(1.0, mArc * 3.0);

      return {
        type: "moon",
        x: moonX,
        y: moonY,
        radius: 16,
        color: "#fef08a",
        glowColor: `rgba(254, 240, 138, ${(0.22 * moonAlpha).toFixed(3)})`,
        trailColor: "rgba_gold",
        alpha: moonAlpha
      };
    }

    return null;
  }

  getFishingModifiers() {
    let biteSpeedMult = 1.0;
    let rareBonus = 0;
    let weightBonus = 1.0;
    const phase = this.getTimePhase();

    // Погода
    if (this.weather === "rain") {
      biteSpeedMult = 1.25; // Дождь возбуждает аппетит рыбы
    } else if (this.weather === "fog") {
      rareBonus = 22; // В тумане выходят редкие скрытные виды
    } else if (this.weather === "storm") {
      weightBonus = 1.25; // Буря привлекает гигантских трофеев
      rareBonus = 15;
      biteSpeedMult = 1.15;
    }

    // Время суток
    if (phase === "dawn" || phase === "dusk") {
      biteSpeedMult *= 1.2; // Утренний и вечерний жор
    } else if (phase === "night") {
      rareBonus += 10; // Ночные хищники
    }

    return { biteSpeedMult, rareBonus, weightBonus };
  }

  getHUDInfo() {
    const hours = Math.floor(this.gameTimeHours);
    const mins = Math.floor((this.gameTimeHours % 1) * 60);
    const timeStr = `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;

    const phaseNames = {
      dawn: "Рассвет",
      day: "День",
      dusk: "Закат",
      night: "Ночь"
    };
    const phase = this.getTimePhase();
    const phaseName = phaseNames[phase];

    const weatherNames = {
      clear: "Ясно",
      cloudy: "Облачно",
      rain: "Дождь",
      fog: "Туман",
      storm: "Гроза"
    };
    const weatherName = weatherNames[this.weather] || "Ясно";

    const bonusTexts = {
      clear: "Стабильный клёв, ясная видимость.",
      cloudy: "Мягкий рассеянный свет.",
      rain: "Клёв ускорен на +25%!",
      fog: "+22% к шансу редкой и эпической рыбы!",
      storm: "Трофейный вес +25% и яростная хватка!"
    };
    const bonusText = bonusTexts[this.weather];

    // SVG иконки
    const icons = {
      clear: phase === "night"
        ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`
        : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line></svg>`,
      cloudy: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path></svg>`,
      rain: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="16" y1="13" x2="16" y2="21"></line><line x1="8" y1="13" x2="8" y2="21"></line><line x1="12" y1="15" x2="12" y2="23"></line><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"></path></svg>`,
      fog: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="12" x2="20" y2="12"></line><line x1="4" y1="8" x2="20" y2="8"></line><line x1="4" y1="16" x2="20" y2="16"></line></svg>`,
      storm: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`
    };
    const iconSvg = icons[this.weather] || icons.clear;

    return { timeStr, phase, phaseName, weather: this.weather, weatherName, bonusText, iconSvg };
  }
}

const environmentManager = new EnvironmentManager();
window.EnvironmentManager = environmentManager;
window.environmentManager = environmentManager;

/* ==========================================================
   АТМОСФЕРА ДОМА И КАМИН (С ДИНАМИЧЕСКИМ ОКНОМ)
   ========================================================== */
function initHomeEmbers() {
  homeEmbers = [];
  for (let i = 0; i < 28; i++) {
    homeEmbers.push({
      x: (typeof width !== "undefined" ? width : 400) * 0.5 + (Math.random() - 0.5) * 80,
      y: (typeof height !== "undefined" ? height : 800) * 0.76 + Math.random() * 30,
      vx: (Math.random() - 0.5) * 14,
      vy: -22 - Math.random() * 32,
      size: 1.5 + Math.random() * 2.5,
      maxLife: 1.4 + Math.random() * 1.6,
      life: Math.random() * 2
    });
  }
}

function renderHomeAtmosphere(ctx, w, h, dt) {
  if (homeEmbers.length === 0) initHomeEmbers();
  const now = performance.now();

  // 1. Бревенчатые стены хижины (Теплый глубокий градиент)
  const wallGrad = ctx.createLinearGradient(0, 0, 0, h * 0.72);
  wallGrad.addColorStop(0, "#1c120a");
  wallGrad.addColorStop(0.5, "#2b180d");
  wallGrad.addColorStop(1, "#381f10");
  ctx.fillStyle = wallGrad;
  ctx.fillRect(0, 0, w, h * 0.72);

  // Горизонтальные стыки брёвен
  const logHeight = 36;
  for (let y = logHeight; y < h * 0.72; y += logHeight) {
    ctx.fillStyle = "rgba(10, 6, 3, 0.45)";
    ctx.fillRect(0, y, w, 3);
    ctx.fillStyle = "rgba(254, 215, 170, 0.05)";
    ctx.fillRect(0, y + 3, w, 1);
  }

  // 2. Окно в открытый мир (динамическое небо, погода и небесные тела)
  const winX = w * 0.08;
  const winY = h * 0.12;
  const winW = Math.min(130, w * 0.32);
  const winH = Math.min(120, h * 0.22);

  const sky = environmentManager.getSkyColors(winH);
  const winSky = ctx.createLinearGradient(winX, winY, winX, winY + winH);
  winSky.addColorStop(0, sky.c0);
  winSky.addColorStop(0.4, sky.c1);
  winSky.addColorStop(0.8, sky.c2);
  winSky.addColorStop(1, sky.c3);
  ctx.fillStyle = winSky;
  ctx.fillRect(winX, winY, winW, winH);

  // Небесные тела в окне
  const body = environmentManager.getCelestialBody(winW, winH);
  if (body) {
    const bx = winX + winW * (body.x / (typeof width !== "undefined" ? width : 400));
    const by = winY + winH * (body.y / (typeof height !== "undefined" ? height * 0.44 : 350));
    ctx.fillStyle = body.color;
    ctx.beginPath();
    ctx.arc(Math.max(winX + 12, Math.min(winX + winW - 12, bx)), Math.max(winY + 12, Math.min(winY + winH - 12, by)), body.radius * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }

  // Звезды за окном (если ночь)
  if (environmentManager.getTimePhase() === "night") {
    const starCoords = [
      [0.2, 0.25], [0.35, 0.6], [0.55, 0.3], [0.75, 0.45], [0.85, 0.2], [0.45, 0.75]
    ];
    starCoords.forEach(([sx, sy], idx) => {
      const starAlpha = 0.3 + 0.7 * Math.sin(now * 0.003 + idx * 1.5);
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.1, starAlpha)})`;
      ctx.fillRect(winX + winW * sx, winY + winH * sy, 2, 2);
    });
  }

  // Капли на стекле окна во время дождя или грозы
  if (environmentManager.weather === "rain" || environmentManager.weather === "storm") {
    ctx.fillStyle = "rgba(224, 242, 254, 0.4)";
    for (let r = 0; r < 12; r++) {
      const rx = winX + (r * 11 + Math.sin(now * 0.001 + r) * 6) % winW;
      const ry = winY + (r * 17 + now * 0.04) % winH;
      ctx.fillRect(rx, ry, 1.5, 4);
    }
  }

  // Деревянная рама окна
  ctx.strokeStyle = "#451a03";
  ctx.lineWidth = 4;
  ctx.strokeRect(winX, winY, winW, winH);
  ctx.beginPath();
  ctx.moveTo(winX + winW / 2, winY);
  ctx.lineTo(winX + winW / 2, winY + winH);
  ctx.moveTo(winX, winY + winH / 2);
  ctx.lineTo(winX + winW, winY + winH / 2);
  ctx.stroke();

  // 3. Стойка для удочек (на правой стене)
  const rackX = w * 0.74;
  const rackY = h * 0.16;
  ctx.fillStyle = "#451a03";
  ctx.fillRect(rackX, rackY, 6, 60);
  ctx.fillRect(rackX + 42, rackY, 6, 60);
  ctx.strokeStyle = "#d97706";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(rackX - 10, rackY + 20);
  ctx.lineTo(rackX + 56, rackY + 18);
  ctx.stroke();
  ctx.strokeStyle = "#0284c7";
  ctx.beginPath();
  ctx.moveTo(rackX - 14, rackY + 45);
  ctx.lineTo(rackX + 60, rackY + 43);
  ctx.stroke();

  // Настенный фонарь
  ctx.fillStyle = "#78350f";
  ctx.fillRect(w * 0.88, h * 0.08, 14, 18);
  ctx.fillStyle = "#fbbf24";
  ctx.fillRect(w * 0.88 + 3, h * 0.08 + 4, 8, 10);

  // 4. Деревянный пол
  const floorY = h * 0.72;
  const floorGrad = ctx.createLinearGradient(0, floorY, 0, h);
  floorGrad.addColorStop(0, "#1c1008");
  floorGrad.addColorStop(1, "#0f0804");
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, floorY, w, h - floorY);

  // Доски пола
  ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
  ctx.lineWidth = 2;
  for (let px = 0; px <= w; px += 45) {
    ctx.beginPath();
    ctx.moveTo(px, floorY);
    ctx.lineTo(px + (px - w / 2) * 0.35, h);
    ctx.stroke();
  }

  // Тканый коврик перед очагом
  ctx.fillStyle = "#7c2d12";
  ctx.beginPath();
  ctx.ellipse(w * 0.5, floorY + 45, Math.min(130, w * 0.36), 24, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#b45309";
  ctx.lineWidth = 2;
  ctx.stroke();

  // 5. Камин / Очаг по центру
  const hearthW = Math.min(170, w * 0.46);
  const hearthH = 100;
  const hearthX = (w - hearthW) / 2;
  const hearthY = floorY - hearthH + 18;

  // Каменная кладка
  ctx.fillStyle = "#292524";
  ctx.fillRect(hearthX - 10, hearthY - 12, hearthW + 20, hearthH + 12);
  ctx.fillStyle = "#44403c";
  ctx.fillRect(hearthX - 16, hearthY - 16, hearthW + 32, 10);

  // Арка топки
  ctx.fillStyle = "#0c0a09";
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(hearthX, hearthY, hearthW, hearthH, [28, 28, 0, 0]);
  } else {
    ctx.rect(hearthX, hearthY, hearthW, hearthH);
  }
  ctx.fill();

  // Дрова в очаге
  ctx.fillStyle = "#271406";
  ctx.beginPath();
  ctx.ellipse(w * 0.44, hearthY + hearthH - 12, 26, 7, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(w * 0.56, hearthY + hearthH - 12, 26, 7, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Теплый отсвет камина
  const fireGlow = ctx.createRadialGradient(w * 0.5, hearthY + hearthH - 25, 10, w * 0.5, hearthY + hearthH - 25, 190);
  fireGlow.addColorStop(0, "rgba(245, 158, 11, 0.32)");
  fireGlow.addColorStop(0.5, "rgba(234, 88, 12, 0.12)");
  fireGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = fireGlow;
  ctx.fillRect(0, 0, w, h);

  // Пламя огня
  const fireBaseY = hearthY + hearthH - 12;
  const fireCenterX = w * 0.5;

  // Внешнее красное пламя
  ctx.fillStyle = "#dc2626";
  ctx.beginPath();
  ctx.moveTo(fireCenterX - 32, fireBaseY);
  ctx.quadraticCurveTo(fireCenterX - 18 + Math.sin(now * 0.009) * 5, fireBaseY - 42, fireCenterX - 5, fireBaseY - 50 + Math.sin(now * 0.012) * 7);
  ctx.quadraticCurveTo(fireCenterX + 14 + Math.cos(now * 0.008) * 5, fireBaseY - 38, fireCenterX + 32, fireBaseY);
  ctx.closePath();
  ctx.fill();

  // Среднее оранжевое пламя
  ctx.fillStyle = "#f97316";
  ctx.beginPath();
  ctx.moveTo(fireCenterX - 22, fireBaseY);
  ctx.quadraticCurveTo(fireCenterX - 8 + Math.cos(now * 0.011) * 4, fireBaseY - 35, fireCenterX + 2, fireBaseY - 42 + Math.sin(now * 0.015) * 5);
  ctx.quadraticCurveTo(fireCenterX + 10 + Math.sin(now * 0.01) * 4, fireBaseY - 30, fireCenterX + 22, fireBaseY);
  ctx.closePath();
  ctx.fill();

  // Внутреннее золотое пламя
  ctx.fillStyle = "#fef08a";
  ctx.beginPath();
  ctx.moveTo(fireCenterX - 12, fireBaseY);
  ctx.quadraticCurveTo(fireCenterX - 3 + Math.sin(now * 0.013) * 3, fireBaseY - 24, fireCenterX, fireBaseY - 28 + Math.sin(now * 0.018) * 4);
  ctx.quadraticCurveTo(fireCenterX + 5 + Math.cos(now * 0.012) * 3, fireBaseY - 20, fireCenterX + 12, fireBaseY);
  ctx.closePath();
  ctx.fill();

  // 6. Искры и угольки
  homeEmbers.forEach(e => {
    e.life += dt;
    if (e.life >= e.maxLife) {
      e.life = 0;
      e.x = fireCenterX + (Math.random() - 0.5) * 45;
      e.y = fireBaseY - 8;
      e.vx = (Math.random() - 0.5) * 14;
      e.vy = -22 - Math.random() * 32;
    }
    e.x += e.vx * dt;
    e.y += e.vy * dt;
    const progress = e.life / e.maxLife;
    const alpha = Math.sin(progress * Math.PI) * 0.85;

    ctx.fillStyle = `rgba(251, 191, 36, ${Math.max(0, alpha)})`;
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.size * (1 - progress * 0.5), 0, Math.PI * 2);
    ctx.fill();
  });
}

window.initHomeEmbers = initHomeEmbers;
window.renderHomeAtmosphere = renderHomeAtmosphere;
