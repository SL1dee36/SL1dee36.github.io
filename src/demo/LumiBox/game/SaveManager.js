// game/SaveManager.js
// author: Nazaryan A.K.
// github: @Sl1dee36

export class SaveManager {
    constructor() {
        this.indexKey = 'luminaCraft_world_index';
        this.worldPrefix = 'luminaCraft_world_data_';
    }

    getWorldsList() {
        try {
            const raw = localStorage.getItem(this.indexKey);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            console.error("Failed to load worlds list:", e);
            return [];
        }
    }

    saveWorldsList(list) {
        localStorage.setItem(this.indexKey, JSON.stringify(list));
    }

    createWorld(name, seed, gameMode = 'survival') {
        const id = 'world_' + Date.now();
        const numericSeed = seed && !isNaN(Number(seed)) ? Number(seed) : this.hashString(seed || String(Math.random() * 1000000));
        
        const worldMeta = {
            id,
            name: name || 'New World',
            seed: numericSeed,
            gameMode, // 'survival' | 'creative'
            createdAt: Date.now(),
            lastPlayed: Date.now()
        };

        const list = this.getWorldsList();
        list.unshift(worldMeta);
        this.saveWorldsList(list);

        return worldMeta;
    }

    saveWorld(worldId, world, player, gameMode) {
        const list = this.getWorldsList();
        const meta = list.find(w => w.id === worldId);
        if (meta) {
            meta.lastPlayed = Date.now();
            if (gameMode) meta.gameMode = gameMode;
            this.saveWorldsList(list);
        }

        const saveData = {
            world: world.getData(),
            player: {
                position: player.transform.position.toArray(),
                rotation: player.transform.rotation.toArray(),
                inventory: player.getComponent('Inventory')?.getData() || null,
                hp: player.getComponent('PlayerController')?.hp || 20
            }
        };

        try {
            localStorage.setItem(this.worldPrefix + worldId, JSON.stringify(saveData));
        } catch (e) {
            console.error("Save failed:", e);
        }
    }

    loadWorld(worldId) {
        try {
            const raw = localStorage.getItem(this.worldPrefix + worldId);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            console.error("Failed to load world data:", e);
            return null;
        }
    }

    deleteWorld(worldId) {
        let list = this.getWorldsList();
        list = list.filter(w => w.id !== worldId);
        this.saveWorldsList(list);
        localStorage.removeItem(this.worldPrefix + worldId);
    }

    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = Math.imul(31, hash) + str.charCodeAt(i) | 0;
        }
        return Math.abs(hash);
    }
}