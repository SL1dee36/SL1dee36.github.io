// game/MobManager.js
// author: Nazaryan A.K.
// github: @Sl1dee36

import * as THREE from 'three';
import { Component } from '../Lumina/js/core/Component.js';
import { Mob } from './Mob.js';
import { BLOCK } from './blocks.js';

export class MobManager extends Component {
    constructor(gameObject, world, soundManager, settingsManager) {
        super(gameObject);
        this.world = world;
        this.soundManager = soundManager;
        this.settings = settingsManager;

        this.mobs = [];
        this.maxMobs = 24;
        this.spawnTimer = 4.0;
    }

    spawnMob(type, x, y, z) {
        if (this.mobs.length >= this.maxMobs) return null;
        const mob = new Mob(type, this.world, x, y, z);
        this.mobs.push(mob);
        return mob;
    }

    update(dt) {
        const playerPos = this.world.playerPos;
        if (!playerPos) return;

        // Обновление всех активных мобов
        for (let i = this.mobs.length - 1; i >= 0; i--) {
            const mob = this.mobs[i];
            if (mob.isDead) {
                this.mobs.splice(i, 1);
                continue;
            }

            mob.update(dt, playerPos);

            // Удаление слишком далеких мобов (> 55 блоков)
            if (mob.position.distanceTo(playerPos) > 55) {
                mob.dispose();
                this.mobs.splice(i, 1);
            }
        }

        // Спавн мобов
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
            this.spawnTimer = 3.5 + Math.random() * 2.0;
            this.trySpawnRandomMob(playerPos);
        }
    }

    trySpawnRandomMob(playerPos) {
        if (this.mobs.length >= this.maxMobs) return;

        // Спавним в кольце вокруг игрока на расстоянии 20-38 блоков
        const angle = Math.random() * Math.PI * 2;
        const dist = 20 + Math.random() * 18;
        const sx = Math.floor(playerPos.x + Math.cos(angle) * dist);
        const sz = Math.floor(playerPos.z + Math.sin(angle) * dist);

        const sy = this.world.getTerrainHeight(sx, sz);
        if (sy <= 0 || sy >= 240) return;

        const surfaceVoxel = this.world.getVoxel(sx, sy, sz);
        const isDay = (this.world.sunBrightness > 0.35);

        if (isDay) {
            // Днем спавнятся только мирные мобы на траве
            if (surfaceVoxel === BLOCK.GRASS) {
                const passiveTypes = ['chicken', 'pig', 'cow'];
                const chosen = passiveTypes[Math.floor(Math.random() * passiveTypes.length)];
                this.spawnMob(chosen, sx + 0.5, sy + 1.0, sz + 0.5);
            }
        } else {
            // Ночью на поверхности спавнятся зомби и скелеты
            const hostileTypes = ['zombie', 'skeleton'];
            const chosen = hostileTypes[Math.floor(Math.random() * hostileTypes.length)];
            this.spawnMob(chosen, sx + 0.5, sy + 1.0, sz + 0.5);
        }
    }

    // Проверка попадания игрока при атаке
    checkAttackHit(origin, direction, range = 3.5, damage = 4) {
        const ray = new THREE.Ray(origin, direction);
        let closestMob = null;
        let closestDist = range;

        for (const mob of this.mobs) {
            if (mob.isDead) continue;
            const mobSphere = new THREE.Sphere(new THREE.Vector3(mob.position.x, mob.position.y + 0.8, mob.position.z), 0.75);
            const hitPoint = new THREE.Vector3();
            if (ray.intersectSphere(mobSphere, hitPoint)) {
                const d = origin.distanceTo(hitPoint);
                if (d < closestDist) {
                    closestDist = d;
                    closestMob = mob;
                }
            }
        }

        if (closestMob) {
            closestMob.takeDamage(damage, origin);
            if (this.soundManager) this.soundManager.play('hit');
            return true;
        }

        return false;
    }
}
