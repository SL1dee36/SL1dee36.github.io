// game/SettingsManager.js

export class SettingsManager {
    constructor() {
        this.settings = {
            renderDistance: 3,
            quality: 1.0,
            timeSpeed: 1.0,
            sensitivity: 0.002,
            showHand: true
        };
        this.load();
    }

    load() {
        const saved = localStorage.getItem('luminaSettings');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                this.settings = { ...this.settings, ...parsed };
            } catch (e) {
                console.error("Settings parse error", e);
            }
        }
    }

    save() {
        localStorage.setItem('luminaSettings', JSON.stringify(this.settings));
    }

    get(key) {
        return this.settings[key];
    }

    set(key, value) {
        this.settings[key] = value;
        this.save();
    }
}