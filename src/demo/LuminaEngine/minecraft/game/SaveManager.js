// game/SaveManager.js
export class SaveManager {
    constructor() {
        this.saveKey = 'luminaCraftWorld';
    }

    hasSavedWorld() {
        return localStorage.getItem(this.saveKey) !== null;
    }

    saveWorld(world, player) {
        const playerData = {
            position: player.transform.position.toArray(),
            rotation: player.transform.rotation.toArray(),
            inventory: player.getComponent('Inventory').getData()
        };
        const worldData = world.getData();
        
        const saveData = {
            world: worldData,
            player: playerData
        };

        try {
            localStorage.setItem(this.saveKey, JSON.stringify(saveData));
            console.log("Мир сохранен!");
        } catch (e) {
            console.error("Не удалось сохранить мир:", e);
        }
    }

    loadWorld() {
        const savedData = localStorage.getItem(this.saveKey);
        if (savedData) {
            try {
                return JSON.parse(savedData);
            } catch (e) {
                console.error("Не удалось загрузить мир:", e);
                return null;
            }
        }
        return null;
    }
}