// Lumina/js/core/Component.js
// author: Nazaryan A.K. 
// github: @Sl1dee36

export class Component {
    constructor(gameObject) {
        this.gameObject = gameObject;
        this.transform = gameObject.transform;
        this.engine = null; // Будет установлено движком
    }

    start() {
        // Переопределяется в дочерних классах
    }

    update(deltaTime) {
        // Переопределяется в дочерних классах
    }
}