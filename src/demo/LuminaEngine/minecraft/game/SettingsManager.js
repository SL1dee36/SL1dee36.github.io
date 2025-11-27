export class SettingsManager {
    constructor() {
        this.settings = {
            renderDistance: 4,
            renderMode: 'smart',
            quality: 1.0,
            timeSpeed: 1.0,
            sensitivity: 0.003,
            showHand: true,
            shadowMapSize: 1024,
            shadowDistance: 50,
            fogFactor: 0.8,
            volume: 0.5,
            showClouds: true,
            showStars: true,
            showSunMoon: true,
            ambientOcclusion: true // Новая настройка
        };
        this.load();
    }

    load() {
        const saved = localStorage.getItem('luminaSettings_v3');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                this.settings = { ...this.settings, ...parsed };
            } catch (e) { console.error(e); }
        }
    }

    save() { localStorage.setItem('luminaSettings_v3', JSON.stringify(this.settings)); }
    
    get(key) { 
        return this.settings[key] !== undefined ? this.settings[key] : null; 
    }
    
    set(key, value) { 
        this.settings[key] = value; 
        this.save(); 
    }
}