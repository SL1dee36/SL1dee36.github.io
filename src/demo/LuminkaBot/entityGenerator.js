/**
 * ENTITY_GENERATOR: Модульный процедурный генератор улова
 * - Распределение шансов: 80% Рыба, 8% Звери, 12% Хлам/Топливо/Сундуки
 * - Взвешивание по способу ловли и наживке
 * - Процедурные комбинации: 15 мутаций, 12 сред, 10 легендарных титулов
 * - Динамический расчет веса, цены, агрессии, съедобности (edible, hungerValue, poison) и топлива (fuelValue)
 * - Механика открытия сундуков-лутбоксов
 */

(function (window) {
  'use strict';

  const EntityGenerator = {

    /**
     * Генерация улова на основе метода ловли и наживки
     */
    rollCatch(methodId = "float", baitKey = "worm") {
      const ED = window.ENTITY_DATA;
      if (!ED) {
        console.error("ENTITY_DATA не загружен!");
        return null;
      }

      // 1. Определение категории сущности (80% Рыба, 8% Зверь, 12% Хлам)
      const categoryRoll = Math.random() * 100;
      let category = "fish";

      if (categoryRoll < 12) {
        category = "junk";
      } else if (categoryRoll < 20) {
        category = "beast";
      } else {
        category = "fish";
      }

      // Живец (live_bait) повышает шанс поимки хищных зверей (крокодилов/выдр)
      if (baitKey === "live_bait" && Math.random() < 0.25) {
        category = "beast";
      }

      let entity = null;
      if (category === "junk") {
        entity = this.rollJunk();
      } else if (category === "beast") {
        entity = this.rollBeast(methodId, baitKey);
      } else {
        entity = this.rollFish(methodId, baitKey);
      }

      return entity;
    },

    /**
     * Выбор и процедурная генерация рыбы
     */
    rollFish(methodId, baitKey) {
      const ED = window.ENTITY_DATA;
      const allFish = ED.FISH_SPECIES;

      // 1. Взвешенный выбор редкости на основе наживки
      const rarity = this.pickRarityForBait(baitKey);

      // Пул рыб выбранной редкости
      let pool = allFish.filter(f => f.rarity === rarity);
      if (!pool.length) pool = allFish;

      // 2. Взвешивание шансов рыбы в зависимости от способа ловли
      const weightedList = pool.map(fish => {
        let weight = 1.0;
        const bt = fish.bodyType;
        const fam = fish.family;

        if (methodId === "spinning") {
          // Спиннинг приманивает хищников, щуковых и быстрых лососевых
          if (fam === "predators" || fam === "esociforms") weight = 4.5;
          else if (fam === "salmonids" && (bt === 1 || bt === 2)) weight = 3.5;
          else if (bt === 0) weight = 0.3; // мирная рыба редко берет блесну
        } else if (methodId === "feeder") {
          // Фидер идеален для донных гигантов, осетровых и крупных карповых
          if (fam === "bottom_giants" || fam === "sturgeons") weight = 4.5;
          else if (fam === "cyprinids" && fish.max_weight > 2.0) weight = 3.8;
          else if (bt === 1) weight = 0.5;
        } else if (methodId === "fly") {
          // Нахлыст обожает лососевых, хариусов и верховодку
          if (fam === "salmonids") weight = 5.0;
          else if (fish.id === 7 || fish.id === 19 || fish.id === 21) weight = 3.5; // Красноперка, Голавль, Уклейка
          else if (fam === "bottom_giants") weight = 0.2;
        } else {
          // Поплавок — классика для карповых и мирных всех горизонтов
          if (fam === "cyprinids") weight = 3.5;
          else if (fam === "predators" && (fish.id === 38 || fish.id === 41)) weight = 2.0; // Окунь, Ерш
        }

        return { fish, weight };
      });

      const baseFish = this.weightedPick(weightedList);
      return this.applyProceduralMatrix(baseFish, "fish", methodId);
    },

    /**
     * Выбор и процедурная генерация водного зверя
     */
    rollBeast(methodId, baitKey) {
      const ED = window.ENTITY_DATA;
      const allBeasts = ED.BEAST_SPECIES;
      const rarity = this.pickRarityForBait(baitKey);

      let pool = allBeasts.filter(b => b.rarity === rarity);
      if (!pool.length) pool = allBeasts;

      // Взвешивание зверей
      const weightedList = pool.map(beast => {
        let weight = 1.0;
        if (methodId === "spinning" && beast.combatStyle === "death_roll") weight = 3.0; // Крокодилы
        if (methodId === "feeder" && (beast.combatStyle === "stone_sink" || beast.bodyType === 6)) weight = 3.5; // Черепахи, Раки
        return { fish: beast, weight };
      });

      const baseBeast = this.weightedPick(weightedList);
      return this.applyProceduralMatrix(baseBeast, "beast", methodId);
    },

    /**
     * Выбор предмета хлама, топлива или сундука
     */
    rollJunk() {
      const ED = window.ENTITY_DATA;
      const junkItems = ED.JUNK_ITEMS;

      // Шанс лутбокса 25% внутри хлама (3% от общего вылова)
      const rollType = Math.random();
      let pool = [];

      if (rollType < 0.25) {
        // Сундук
        pool = junkItems.filter(j => j.type === "chest");
      } else if (rollType < 0.60) {
        // Топливо для печи
        pool = junkItems.filter(j => j.type === "fuel");
      } else {
        // Обычный хлам
        pool = junkItems.filter(j => j.type === "junk");
      }

      if (!pool.length) pool = junkItems;
      const chosen = pool[Math.floor(Math.random() * pool.length)];

      // Случайный вес
      const weight = +(chosen.min_weight + Math.random() * (chosen.max_weight - chosen.min_weight)).toFixed(2);

      return {
        ...chosen,
        weight,
        isJunk: chosen.type === "junk",
        isFuel: chosen.type === "fuel",
        isLootbox: !!chosen.isLootbox,
        fuelValue: chosen.fuelValue || 0,
        fightSpeed: 0.6,
        fightIntensity: 0.5,
        combatStyle: "standard",
        mutation: null,
        environment: null,
        title: null
      };
    },

    /**
     * Наложение процедурной матрицы (мутации, среды, титулы)
     */
    applyProceduralMatrix(baseEntity, category, methodId) {
      const ED = window.ENTITY_DATA;

      // 1. Базовый расчет веса (нормальное распределение)
      const rNorm = (Math.random() + Math.random()) / 2;
      let finalWeight = +(baseEntity.min_weight + rNorm * (baseEntity.max_weight - baseEntity.min_weight)).toFixed(2);
      let finalPrice = baseEntity.base_price;
      let finalName = baseEntity.name;
      let renderColor = baseEntity.color;
      let renderFinColor = baseEntity.finColor || baseEntity.color;

      let aggroMultiplier = 1.0;
      let fightSpeed = 1.0;
      let isEdible = baseEntity.edible !== false;
      let hungerVal = baseEntity.hungerValue || 20;
      let isPoison = !!baseEntity.poison;

      let selectedMutation = null;
      let selectedEnv = null;
      let selectedTitle = null;

      // 2. ШАНС МУТАЦИИ (~12% для рыб и зверей)
      if (Math.random() < 0.12) {
        const mutationKeys = Object.keys(ED.MUTATIONS);
        const mKey = mutationKeys[Math.floor(Math.random() * mutationKeys.length)];
        selectedMutation = ED.MUTATIONS[mKey];

        // Модификации от мутации
        finalPrice = Math.round(finalPrice * selectedMutation.priceMult);
        finalWeight = +(finalWeight * selectedMutation.weightMult).toFixed(2);
        aggroMultiplier *= selectedMutation.aggroMult;

        if (selectedMutation.colorOverride) renderColor = selectedMutation.colorOverride;
        if (selectedMutation.finOverride) renderFinColor = selectedMutation.finOverride;

        if (selectedMutation.edible === false) isEdible = false;
        if (selectedMutation.poison) isPoison = true;
        if (isPoison) hungerVal = 0;
        else hungerVal = Math.round(hungerVal * (selectedMutation.weightMult || 1));
      }

      // 3. ШАНС СРЕДЫ ОБИТАНИЯ (~25% для рыб и зверей)
      if (Math.random() < 0.25) {
        const envKeys = Object.keys(ED.ENVIRONMENTS);
        const eKey = envKeys[Math.floor(Math.random() * envKeys.length)];
        selectedEnv = ED.ENVIRONMENTS[eKey];

        finalPrice = Math.round(finalPrice * selectedEnv.priceMult);
        finalWeight = +(finalWeight * selectedEnv.weightMult).toFixed(2);
        aggroMultiplier *= selectedEnv.aggroMult;
      }

      // 4. ШАНС ЛЕГЕНДАРНОГО ТИТУЛА
      // Высокий шанс для Legendary (45%), средний для Epic (15%), высокий для исполинских мутантов
      const titleChance = (baseEntity.rarity === "Legendary") ? 0.45 : ((baseEntity.rarity === "Epic" || (selectedMutation && selectedMutation.id === "colossal")) ? 0.18 : 0.03);

      if (Math.random() < titleChance) {
        // Предпочтение титулам, связанным со способом ловли
        const matchingTitles = ED.TITLES.filter(t => !t.preferredMethod || t.preferredMethod === methodId);
        selectedTitle = matchingTitles[Math.floor(Math.random() * matchingTitles.length)] || ED.TITLES[0];

        finalPrice = Math.round(finalPrice * selectedTitle.priceMult);
        finalWeight = +(finalWeight * selectedTitle.weightMult).toFixed(2);
        aggroMultiplier *= selectedTitle.aggroMult;
      }

      // 5. ДИНАМИЧЕСКОЕ ФОРМИРОВАНИЕ ИМЕНИ СУЩНОСТИ
      let nameParts = [];
      if (selectedEnv) nameParts.push(selectedEnv.name);
      if (selectedMutation) nameParts.push(selectedMutation.name);
      nameParts.push(baseEntity.name);
      if (selectedTitle) nameParts.push(selectedTitle.title);

      finalName = nameParts.join(" ");

      // 6. БОЕВОЙ СТИЛЬ И АГРЕССИЯ
      let combatStyle = baseEntity.combatStyle || "standard";
      fightSpeed = +(1.0 * aggroMultiplier).toFixed(2);

      // Исполины сытнее для семьи
      if (isEdible && finalWeight > 5.0) {
        hungerVal = Math.min(100, Math.round(hungerVal * 1.5));
      }

      return {
        ...baseEntity,
        name: finalName,
        originalName: baseEntity.name,
        weight: finalWeight,
        price: finalPrice,
        color: renderColor,
        finColor: renderFinColor,
        mutation: selectedMutation,
        environment: selectedEnv,
        title: selectedTitle,
        combatStyle,
        aggroMultiplier,
        fightSpeed,
        edible: isEdible,
        hungerValue: hungerVal,
        poison: isPoison,
        fuelValue: 0
      };
    },

    /**
     * Выбор редкости на основе наживки
     */
    pickRarityForBait(baitKey) {
      // Стандартные веса редкостей по типам наживок
      const weights = {
        worm: { Common: 70, Rare: 24, Epic: 5.5, Legendary: 0.5 },
        corn: { Common: 78, Rare: 19, Epic: 2.7, Legendary: 0.3 },
        dough: { Common: 82, Rare: 16, Epic: 1.8, Legendary: 0.2 },
        bloodworm: { Common: 60, Rare: 31, Epic: 8.2, Legendary: 0.8 },
        lure_spoon: { Common: 30, Rare: 46, Epic: 21, Legendary: 3.0 },
        lure_spinner: { Common: 40, Rare: 42, Epic: 16, Legendary: 2.0 },
        lure_wobbler: { Common: 20, Rare: 45, Epic: 29, Legendary: 6.0 },
        lure_jig: { Common: 35, Rare: 45, Epic: 18, Legendary: 2.0 },
        feeder_mix: { Common: 50, Rare: 34, Epic: 14, Legendary: 2.0 },
        boilie: { Common: 25, Rare: 42, Epic: 27, Legendary: 6.0 },
        maggot: { Common: 65, Rare: 27, Epic: 7.3, Legendary: 0.7 },
        live_bait: { Common: 15, Rare: 40, Epic: 37, Legendary: 8.0 },
        dry_fly: { Common: 35, Rare: 45, Epic: 17, Legendary: 3.0 },
        nymph: { Common: 25, Rare: 48, Epic: 22, Legendary: 5.0 }
      }[baitKey] || { Common: 65, Rare: 26, Epic: 8, Legendary: 1 };

      const rand = Math.random() * 100;
      let accum = 0;
      for (const [rarity, chance] of Object.entries(weights)) {
        accum += chance;
        if (rand <= accum) return rarity;
      }
      return "Common";
    },

    /**
     * Взвешенный выбор элемента из списка { fish, weight }
     */
    weightedPick(items) {
      const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
      let roll = Math.random() * totalWeight;
      for (const item of items) {
        roll -= item.weight;
        if (roll <= 0) return item.fish;
      }
      return items[0].fish;
    },

    /**
     * Открытие сундука-лутбокса (Unpack Chest)
     */
    unpackChest(chestItem) {
      const minCoins = chestItem.minCoins || 150;
      const maxCoins = chestItem.maxCoins || 600;
      const coinsReward = Math.round(minCoins + Math.random() * (maxCoins - minCoins));
      const xpReward = Math.round(coinsReward * 0.4);

      // Случайные приманки
      const possibleBaits = ["lure_wobbler", "live_bait", "boilie", "lure_spoon", "nymph"];
      const bonusBait = possibleBaits[Math.floor(Math.random() * possibleBaits.length)];
      const baitAmount = chestItem.baitCount || 3;

      return {
        coins: coinsReward,
        xp: xpReward,
        bait: bonusBait,
        baitCount: baitAmount,
        title: chestItem.name
      };
    }
  };

  window.EntityGenerator = EntityGenerator;

})(typeof window !== 'undefined' ? window : global);
