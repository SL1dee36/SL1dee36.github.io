export class SettingsManager {
    constructor() {
        this.settings = {
            renderDistance: 3,
            renderMode: 'smart',   // 'normal' (все чанки в радиусе) или 'smart' (только видимые камерой)
            quality: 1.0,
            timeSpeed: 1.0,
            sensitivity: 0.002,
            showHand: true,
            shadows: true,
            shadowMapSize: 1024,   // По умолчанию Low для производительности
            showClouds: true,
            showStars: true,
            showSunMoon: true
        };
        this.load();
    }

    load() {
        const saved = localStorage.getItem('luminaSettings');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                this.settings = { ...this.settings, ...parsed };
            } catch (e) { console.error(e); }
        }
    }

    save() { localStorage.setItem('luminaSettings', JSON.stringify(this.settings)); }
    get(key) { return this.settings[key]; }
    set(key, value) { this.settings[key] = value; this.save(); }
}