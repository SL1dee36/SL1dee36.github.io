/**
 * ENTITY_DATA: База данных сущностей игры "Таёжное Озеро"
 * - 100 реальных видов рыб по 6 семействам
 * - Водные животные и звери с уникальными боевыми стилями
 * - Хлам, топливо для печи и сундуки-лутбоксы
 * - Процедурные матрицы мутаций (15), сред (12) и легендарных титулов (10)
 */

(function (window) {
  'use strict';

  /* ==========================================================
     1. КАТАЛОГ 100 РЕАЛЬНЫХ ВИДОВ РЫБ
     ========================================================== */
  const FISH_SPECIES = [
    // --- КАРПОВЫЕ И МИРНЫЕ (37 видов) [bodyType: 0] ---
    { id: 1, name: "Карась серебряный", family: "cyprinids", rarity: "Common", min_weight: 0.15, max_weight: 1.20, base_price: 25, color: "#94a3b8", finColor: "#64748b", bodyType: 0, pattern: "scales", edible: true, hungerValue: 25, poison: false },
    { id: 2, name: "Карась золотой", family: "cyprinids", rarity: "Common", min_weight: 0.20, max_weight: 2.10, base_price: 35, color: "#eab308", finColor: "#ca8a04", bodyType: 0, pattern: "scales", edible: true, hungerValue: 30, poison: false },
    { id: 3, name: "Плотва обыкновенная", family: "cyprinids", rarity: "Common", min_weight: 0.10, max_weight: 0.90, base_price: 20, color: "#cbd5e1", finColor: "#ef4444", bodyType: 0, pattern: "scales", edible: true, hungerValue: 20, poison: false },
    { id: 4, name: "Лещ обыкновенный", family: "cyprinids", rarity: "Rare", min_weight: 0.80, max_weight: 4.80, base_price: 95, color: "#ca8a04", finColor: "#854d0e", bodyType: 0, pattern: "scales", edible: true, hungerValue: 55, poison: false },
    { id: 5, name: "Подлещик", family: "cyprinids", rarity: "Common", min_weight: 0.25, max_weight: 0.75, base_price: 30, color: "#94a3b8", finColor: "#64748b", bodyType: 0, pattern: "scales", edible: true, hungerValue: 25, poison: false },
    { id: 6, name: "Густера", family: "cyprinids", rarity: "Common", min_weight: 0.15, max_weight: 1.10, base_price: 28, color: "#94a3b8", finColor: "#f87171", bodyType: 0, pattern: "scales", edible: true, hungerValue: 25, poison: false },
    { id: 7, name: "Красноперка", family: "cyprinids", rarity: "Common", min_weight: 0.15, max_weight: 1.10, base_price: 32, color: "#fbbf24", finColor: "#dc2626", bodyType: 0, pattern: "scales", edible: true, hungerValue: 28, poison: false },
    { id: 8, name: "Линь озерный", family: "cyprinids", rarity: "Rare", min_weight: 0.60, max_weight: 3.80, base_price: 130, color: "#65a30d", finColor: "#3f6212", bodyType: 0, pattern: "scales", edible: true, hungerValue: 60, poison: false },
    { id: 9, name: "Сазан дикий амурский", family: "cyprinids", rarity: "Epic", min_weight: 4.00, max_weight: 24.00, base_price: 520, color: "#d97706", finColor: "#92400e", bodyType: 0, pattern: "scales", edible: true, hungerValue: 85, poison: false },
    { id: 10, name: "Карп чешуйчатый", family: "cyprinids", rarity: "Rare", min_weight: 2.00, max_weight: 16.00, base_price: 260, color: "#b45309", finColor: "#78350f", bodyType: 0, pattern: "scales", edible: true, hungerValue: 75, poison: false },
    { id: 11, name: "Карп зеркальный", family: "cyprinids", rarity: "Epic", min_weight: 3.50, max_weight: 20.00, base_price: 430, color: "#92400e", finColor: "#451a03", bodyType: 0, pattern: "scales", edible: true, hungerValue: 80, poison: false },
    { id: 12, name: "Карп Кои парчовый", family: "cyprinids", rarity: "Legendary", min_weight: 1.50, max_weight: 9.00, base_price: 1800, color: "#ea580c", finColor: "#ffffff", bodyType: 0, pattern: "spots", edible: false, hungerValue: 10, poison: false },
    { id: 13, name: "Белый Амур", family: "cyprinids", rarity: "Rare", min_weight: 2.50, max_weight: 22.00, base_price: 310, color: "#84cc16", finColor: "#4d7c0f", bodyType: 0, pattern: "scales", edible: true, hungerValue: 80, poison: false },
    { id: 14, name: "Черный Амур", family: "cyprinids", rarity: "Epic", min_weight: 3.00, max_weight: 26.00, base_price: 580, color: "#334155", finColor: "#1e293b", bodyType: 0, pattern: "scales", edible: true, hungerValue: 85, poison: false },
    { id: 15, name: "Толстолобик белый", family: "cyprinids", rarity: "Rare", min_weight: 2.00, max_weight: 18.00, base_price: 240, color: "#94a3b8", finColor: "#64748b", bodyType: 0, pattern: "scales", edible: true, hungerValue: 70, poison: false },
    { id: 16, name: "Толстолобик пестрый", family: "cyprinids", rarity: "Epic", min_weight: 3.50, max_weight: 28.00, base_price: 490, color: "#475569", finColor: "#334155", bodyType: 0, pattern: "speckles", edible: true, hungerValue: 85, poison: false },
    { id: 17, name: "Язь обыкновенный", family: "cyprinids", rarity: "Rare", min_weight: 0.70, max_weight: 3.50, base_price: 115, color: "#fb923c", finColor: "#ea580c", bodyType: 0, pattern: "scales", edible: true, hungerValue: 50, poison: false },
    { id: 18, name: "Елец сибирский", family: "cyprinids", rarity: "Common", min_weight: 0.08, max_weight: 0.35, base_price: 22, color: "#cbd5e1", finColor: "#94a3b8", bodyType: 0, pattern: "scales", edible: true, hungerValue: 20, poison: false },
    { id: 19, name: "Голавль речной", family: "cyprinids", rarity: "Rare", min_weight: 0.50, max_weight: 4.20, base_price: 140, color: "#38bdf8", finColor: "#dc2626", bodyType: 0, pattern: "scales", edible: true, hungerValue: 55, poison: false },
    { id: 20, name: "Жерех обыкновенный", family: "cyprinids", rarity: "Epic", min_weight: 1.80, max_weight: 9.00, base_price: 470, color: "#60a5fa", finColor: "#2563eb", bodyType: 2, pattern: "scales", edible: true, hungerValue: 70, poison: false },
    { id: 21, name: "Уклейка верховодка", family: "cyprinids", rarity: "Common", min_weight: 0.03, max_weight: 0.18, base_price: 12, color: "#f1f5f9", finColor: "#e2e8f0", bodyType: 0, pattern: "scales", edible: true, hungerValue: 15, poison: false },
    { id: 22, name: "Верховка озерная", family: "cyprinids", rarity: "Common", min_weight: 0.02, max_weight: 0.10, base_price: 10, color: "#e2e8f0", finColor: "#cbd5e1", bodyType: 0, pattern: "scales", edible: true, hungerValue: 10, poison: false },
    { id: 23, name: "Быстрянка русская", family: "cyprinids", rarity: "Common", min_weight: 0.04, max_weight: 0.15, base_price: 18, color: "#93c5fd", finColor: "#60a5fa", bodyType: 0, pattern: "scales", edible: true, hungerValue: 15, poison: false },
    { id: 24, name: "Пескарь обыкновенный", family: "cyprinids", rarity: "Common", min_weight: 0.04, max_weight: 0.22, base_price: 16, color: "#d97706", finColor: "#b45309", bodyType: 0, pattern: "speckles", edible: true, hungerValue: 18, poison: false },
    { id: 25, name: "Пескарь длинноусый", family: "cyprinids", rarity: "Common", min_weight: 0.05, max_weight: 0.25, base_price: 24, color: "#b45309", finColor: "#78350f", bodyType: 0, pattern: "speckles", edible: true, hungerValue: 20, poison: false },
    { id: 26, name: "Подуст волжский", family: "cyprinids", rarity: "Common", min_weight: 0.20, max_weight: 1.40, base_price: 45, color: "#a1a1aa", finColor: "#71717a", bodyType: 0, pattern: "scales", edible: true, hungerValue: 35, poison: false },
    { id: 27, name: "Рыбец сырть", family: "cyprinids", rarity: "Rare", min_weight: 0.30, max_weight: 2.20, base_price: 150, color: "#f59e0b", finColor: "#d97706", bodyType: 0, pattern: "scales", edible: true, hungerValue: 55, poison: false },
    { id: 28, name: "Шемая черноморская", family: "cyprinids", rarity: "Rare", min_weight: 0.12, max_weight: 0.60, base_price: 165, color: "#fbbf24", finColor: "#f59e0b", bodyType: 0, pattern: "scales", edible: true, hungerValue: 45, poison: false },
    { id: 29, name: "Чехонь саблевидная", family: "cyprinids", rarity: "Common", min_weight: 0.15, max_weight: 1.10, base_price: 50, color: "#e2e8f0", finColor: "#cbd5e1", bodyType: 2, pattern: "scales", edible: true, hungerValue: 40, poison: false },
    { id: 30, name: "Горчак обыкновенный", family: "cyprinids", rarity: "Common", min_weight: 0.02, max_weight: 0.09, base_price: 15, color: "#f472b6", finColor: "#ec4899", bodyType: 0, pattern: "scales", edible: true, hungerValue: 10, poison: false },
    { id: 31, name: "Вьюн обыкновенный", family: "cyprinids", rarity: "Common", min_weight: 0.06, max_weight: 0.30, base_price: 30, color: "#a16207", finColor: "#713f12", bodyType: 3, pattern: "stripes", edible: true, hungerValue: 25, poison: false },
    { id: 32, name: "Синец", family: "cyprinids", rarity: "Common", min_weight: 0.20, max_weight: 1.20, base_price: 38, color: "#60a5fa", finColor: "#3b82f6", bodyType: 0, pattern: "scales", edible: true, hungerValue: 30, poison: false },
    { id: 33, name: "Белоглазка сопа", family: "cyprinids", rarity: "Common", min_weight: 0.18, max_weight: 1.05, base_price: 35, color: "#cbd5e1", finColor: "#94a3b8", bodyType: 0, pattern: "scales", edible: true, hungerValue: 28, poison: false },
    { id: 34, name: "Кутум каспийский", family: "cyprinids", rarity: "Epic", min_weight: 1.50, max_weight: 6.50, base_price: 620, color: "#38bdf8", finColor: "#0284c7", bodyType: 0, pattern: "scales", edible: true, hungerValue: 80, poison: false },
    { id: 35, name: "Вырезуб", family: "cyprinids", rarity: "Epic", min_weight: 2.00, max_weight: 7.50, base_price: 690, color: "#0ea5e9", finColor: "#0369a1", bodyType: 0, pattern: "scales", edible: true, hungerValue: 85, poison: false },
    { id: 36, name: "Усач днепровский марена", family: "cyprinids", rarity: "Rare", min_weight: 1.00, max_weight: 5.50, base_price: 210, color: "#ca8a04", finColor: "#a16207", bodyType: 0, pattern: "speckles", edible: true, hungerValue: 60, poison: false },
    { id: 37, name: "Маринка закавказская", family: "cyprinids", rarity: "Rare", min_weight: 0.40, max_weight: 2.80, base_price: 180, color: "#854d0e", finColor: "#581c87", bodyType: 0, pattern: "speckles", edible: false, hungerValue: 0, poison: true },

    // --- ХИЩНЫЕ И ОКУНЕОБРАЗНЫЕ (13 видов) [bodyType: 1] ---
    { id: 38, name: "Окунь речной", family: "predators", rarity: "Common", min_weight: 0.20, max_weight: 1.80, base_price: 42, color: "#84cc16", finColor: "#ea580c", bodyType: 1, pattern: "stripes", edible: true, hungerValue: 35, poison: false },
    { id: 39, name: "Судак обыкновенный", family: "predators", rarity: "Rare", min_weight: 1.20, max_weight: 7.20, base_price: 175, color: "#06b6d4", finColor: "#0891b2", bodyType: 1, pattern: "stripes", edible: true, hungerValue: 70, poison: false },
    { id: 40, name: "Берш волжский", family: "predators", rarity: "Rare", min_weight: 0.40, max_weight: 2.10, base_price: 125, color: "#22d3ee", finColor: "#06b6d4", bodyType: 1, pattern: "stripes", edible: true, hungerValue: 48, poison: false },
    { id: 41, name: "Ерш обыкновенный", family: "predators", rarity: "Common", min_weight: 0.05, max_weight: 0.35, base_price: 16, color: "#ca8a04", finColor: "#854d0e", bodyType: 1, pattern: "speckles", edible: true, hungerValue: 18, poison: false },
    { id: 42, name: "Ерш-носарь бирючок", family: "predators", rarity: "Common", min_weight: 0.07, max_weight: 0.40, base_price: 26, color: "#eab308", finColor: "#a16207", bodyType: 1, pattern: "speckles", edible: true, hungerValue: 22, poison: false },
    { id: 43, name: "Змееголов амурский", family: "predators", rarity: "Epic", min_weight: 1.80, max_weight: 8.50, base_price: 520, color: "#475569", finColor: "#334155", bodyType: 1, pattern: "spots", edible: true, hungerValue: 75, poison: false },
    { id: 44, name: "Ротан-головешка", family: "predators", rarity: "Common", min_weight: 0.08, max_weight: 0.55, base_price: 22, color: "#1e293b", finColor: "#0f172a", bodyType: 1, pattern: "spots", edible: true, hungerValue: 25, poison: false },
    { id: 45, name: "Ауха китайский окунь", family: "predators", rarity: "Epic", min_weight: 1.50, max_weight: 7.00, base_price: 610, color: "#f59e0b", finColor: "#b45309", bodyType: 1, pattern: "spots", edible: true, hungerValue: 75, poison: false },
    { id: 46, name: "Чоп большой", family: "predators", rarity: "Rare", min_weight: 0.30, max_weight: 1.90, base_price: 145, color: "#a16207", finColor: "#78350f", bodyType: 1, pattern: "stripes", edible: true, hungerValue: 45, poison: false },
    { id: 47, name: "Бычок-кругляк", family: "predators", rarity: "Common", min_weight: 0.06, max_weight: 0.28, base_price: 18, color: "#78716c", finColor: "#57534e", bodyType: 1, pattern: "speckles", edible: true, hungerValue: 20, poison: false },
    { id: 48, name: "Бычок-песочник", family: "predators", rarity: "Common", min_weight: 0.05, max_weight: 0.22, base_price: 15, color: "#a8a29e", finColor: "#78716c", bodyType: 1, pattern: "speckles", edible: true, hungerValue: 18, poison: false },
    { id: 49, name: "Подкаменщик сибирский", family: "predators", rarity: "Rare", min_weight: 0.04, max_weight: 0.18, base_price: 90, color: "#57534e", finColor: "#44403c", bodyType: 1, pattern: "speckles", edible: true, hungerValue: 15, poison: false },
    { id: 50, name: "Морской судак каспийский", family: "predators", rarity: "Epic", min_weight: 1.00, max_weight: 5.50, base_price: 490, color: "#0284c7", finColor: "#0369a1", bodyType: 1, pattern: "stripes", edible: true, hungerValue: 70, poison: false },

    // --- ЩУКОВЫЕ (5 видов) [bodyType: 2] ---
    { id: 51, name: "Щука травянка", family: "esociforms", rarity: "Common", min_weight: 0.80, max_weight: 3.50, base_price: 85, color: "#4ade80", finColor: "#16a34a", bodyType: 2, pattern: "spots", edible: true, hungerValue: 50, poison: false },
    { id: 52, name: "Щука глубинная", family: "esociforms", rarity: "Epic", min_weight: 3.50, max_weight: 16.50, base_price: 450, color: "#15803d", finColor: "#14532d", bodyType: 2, pattern: "spots", edible: true, hungerValue: 80, poison: false },
    { id: 53, name: "Щука амурская сетчатая", family: "esociforms", rarity: "Epic", min_weight: 2.00, max_weight: 11.00, base_price: 480, color: "#059669", finColor: "#047857", bodyType: 2, pattern: "stripes", edible: true, hungerValue: 75, poison: false },
    { id: 54, name: "Маскинонг великий", family: "esociforms", rarity: "Legendary", min_weight: 7.00, max_weight: 32.00, base_price: 2400, color: "#10b981", finColor: "#065f46", bodyType: 2, pattern: "stripes", edible: true, hungerValue: 95, poison: false },
    { id: 55, name: "Панцирник аллигаторовый", family: "esociforms", rarity: "Legendary", min_weight: 12.00, max_weight: 65.00, base_price: 3200, color: "#334155", finColor: "#1e293b", bodyType: 2, pattern: "scales", edible: false, hungerValue: 0, poison: true },

    // --- ДОННЫЕ ГИГАНТЫ И УСАТЫЕ (11 видов) [bodyType: 3] ---
    { id: 56, name: "Сом европейский", family: "bottom_giants", rarity: "Epic", min_weight: 8.00, max_weight: 65.00, base_price: 920, color: "#475569", finColor: "#334155", bodyType: 3, pattern: "spots", edible: true, hungerValue: 90, poison: false },
    { id: 57, name: "Сом Солдатова", family: "bottom_giants", rarity: "Legendary", min_weight: 15.00, max_weight: 95.00, base_price: 3600, color: "#1e293b", finColor: "#0f172a", bodyType: 3, pattern: "spots", edible: true, hungerValue: 95, poison: false },
    { id: 58, name: "Сомик канальный", family: "bottom_giants", rarity: "Common", min_weight: 0.50, max_weight: 3.50, base_price: 65, color: "#64748b", finColor: "#475569", bodyType: 3, pattern: "speckles", edible: true, hungerValue: 45, poison: false },
    { id: 59, name: "Налим речной", family: "bottom_giants", rarity: "Rare", min_weight: 1.00, max_weight: 6.50, base_price: 185, color: "#3f3f46", finColor: "#27272a", bodyType: 3, pattern: "spots", edible: true, hungerValue: 65, poison: false },
    { id: 60, name: "Налим озёрный", family: "bottom_giants", rarity: "Epic", min_weight: 2.50, max_weight: 12.00, base_price: 430, color: "#27272a", finColor: "#18181b", bodyType: 3, pattern: "spots", edible: true, hungerValue: 80, poison: false },
    { id: 61, name: "Угорь европейский", family: "bottom_giants", rarity: "Epic", min_weight: 0.80, max_weight: 4.50, base_price: 540, color: "#1c1917", finColor: "#0c0a09", bodyType: 3, pattern: "scales", edible: true, hungerValue: 75, poison: false },
    { id: 62, name: "Минога речная", family: "bottom_giants", rarity: "Rare", min_weight: 0.08, max_weight: 0.35, base_price: 120, color: "#52525b", finColor: "#3f3f46", bodyType: 3, pattern: "scales", edible: true, hungerValue: 40, poison: false },
    { id: 63, name: "Минога сибирская", family: "bottom_giants", rarity: "Rare", min_weight: 0.06, max_weight: 0.28, base_price: 135, color: "#71717a", finColor: "#52525b", bodyType: 3, pattern: "scales", edible: true, hungerValue: 40, poison: false },
    { id: 64, name: "Сом амурский", family: "bottom_giants", rarity: "Rare", min_weight: 1.50, max_weight: 9.00, base_price: 240, color: "#57534e", finColor: "#44403c", bodyType: 3, pattern: "spots", edible: true, hungerValue: 70, poison: false },
    { id: 65, name: "Голец усатый донный", family: "bottom_giants", rarity: "Common", min_weight: 0.03, max_weight: 0.15, base_price: 20, color: "#a8a29e", finColor: "#78716c", bodyType: 3, pattern: "speckles", edible: true, hungerValue: 15, poison: false },
    { id: 66, name: "Шиповка обыкновенная", family: "bottom_giants", rarity: "Common", min_weight: 0.02, max_weight: 0.10, base_price: 18, color: "#d6d3d1", finColor: "#a8a29e", bodyType: 3, pattern: "speckles", edible: true, hungerValue: 12, poison: false },

    // --- ЛОСОСЕВЫЕ И ХАРИУСЫ (26 видов) [bodyType: 1 и 2] ---
    { id: 67, name: "Таймень сибирский", family: "salmonids", rarity: "Epic", min_weight: 6.00, max_weight: 42.00, base_price: 1250, color: "#dc2626", finColor: "#991b1b", bodyType: 2, pattern: "spots", edible: true, hungerValue: 95, poison: false },
    { id: 68, name: "Ленок острорылый", family: "salmonids", rarity: "Rare", min_weight: 0.80, max_weight: 4.50, base_price: 210, color: "#ea580c", finColor: "#c2410c", bodyType: 1, pattern: "spots", edible: true, hungerValue: 65, poison: false },
    { id: 69, name: "Ленок тупорылый", family: "salmonids", rarity: "Rare", min_weight: 0.70, max_weight: 4.20, base_price: 195, color: "#c2410c", finColor: "#9a3412", bodyType: 1, pattern: "spots", edible: true, hungerValue: 60, poison: false },
    { id: 70, name: "Хариус сибирский", family: "salmonids", rarity: "Rare", min_weight: 0.40, max_weight: 2.80, base_price: 185, color: "#818cf8", finColor: "#6366f1", bodyType: 1, pattern: "spots", edible: true, hungerValue: 55, poison: false },
    { id: 71, name: "Хариус европейский", family: "salmonids", rarity: "Rare", min_weight: 0.35, max_weight: 2.40, base_price: 175, color: "#a78bfa", finColor: "#8b5cf6", bodyType: 1, pattern: "spots", edible: true, hungerValue: 50, poison: false },
    { id: 72, name: "Хариус байкальский белый", family: "salmonids", rarity: "Epic", min_weight: 0.50, max_weight: 3.20, base_price: 440, color: "#e0e7ff", finColor: "#c7d2fe", bodyType: 1, pattern: "spots", edible: true, hungerValue: 65, poison: false },
    { id: 73, name: "Хариус байкальский черный", family: "salmonids", rarity: "Epic", min_weight: 0.40, max_weight: 2.90, base_price: 460, color: "#312e81", finColor: "#1e1b4b", bodyType: 1, pattern: "spots", edible: true, hungerValue: 65, poison: false },
    { id: 74, name: "Форель радужная", family: "salmonids", rarity: "Rare", min_weight: 0.60, max_weight: 5.20, base_price: 215, color: "#ec4899", finColor: "#db2777", bodyType: 1, pattern: "speckles", edible: true, hungerValue: 65, poison: false },
    { id: 75, name: "Форель ручьевая пеструшка", family: "salmonids", rarity: "Rare", min_weight: 0.30, max_weight: 2.50, base_price: 195, color: "#f43f5e", finColor: "#e11d48", bodyType: 1, pattern: "speckles", edible: true, hungerValue: 55, poison: false },
    { id: 76, name: "Форель озерная кумжа", family: "salmonids", rarity: "Epic", min_weight: 1.50, max_weight: 9.50, base_price: 580, color: "#d946ef", finColor: "#c026d3", bodyType: 1, pattern: "speckles", edible: true, hungerValue: 80, poison: false },
    { id: 77, name: "Сёмга атлантическая", family: "salmonids", rarity: "Legendary", min_weight: 4.00, max_weight: 26.00, base_price: 2100, color: "#38bdf8", finColor: "#0284c7", bodyType: 1, pattern: "speckles", edible: true, hungerValue: 95, poison: false },
    { id: 78, name: "Нельма северная", family: "salmonids", rarity: "Epic", min_weight: 3.50, max_weight: 22.00, base_price: 890, color: "#f8fafc", finColor: "#cbd5e1", bodyType: 1, pattern: "scales", edible: true, hungerValue: 90, poison: false },
    { id: 79, name: "Омуль байкальский", family: "salmonids", rarity: "Rare", min_weight: 0.40, max_weight: 2.30, base_price: 220, color: "#93c5fd", finColor: "#60a5fa", bodyType: 1, pattern: "scales", edible: true, hungerValue: 55, poison: false },
    { id: 80, name: "Омуль арктический", family: "salmonids", rarity: "Rare", min_weight: 0.50, max_weight: 2.80, base_price: 240, color: "#67e8f9", finColor: "#22d3ee", bodyType: 1, pattern: "scales", edible: true, hungerValue: 60, poison: false },
    { id: 81, name: "Муксун сибирский", family: "salmonids", rarity: "Rare", min_weight: 0.80, max_weight: 4.80, base_price: 290, color: "#a5b4fc", finColor: "#818cf8", bodyType: 0, pattern: "scales", edible: true, hungerValue: 70, poison: false },
    { id: 82, name: "Сиг проходной", family: "salmonids", rarity: "Rare", min_weight: 0.60, max_weight: 3.90, base_price: 230, color: "#bae6fd", finColor: "#7dd3fc", bodyType: 0, pattern: "scales", edible: true, hungerValue: 60, poison: false },
    { id: 83, name: "Сиг-пыжьян", family: "salmonids", rarity: "Rare", min_weight: 0.50, max_weight: 3.20, base_price: 210, color: "#7dd3fc", finColor: "#38bdf8", bodyType: 0, pattern: "scales", edible: true, hungerValue: 55, poison: false },
    { id: 84, name: "Ряпушка европейская", family: "salmonids", rarity: "Common", min_weight: 0.05, max_weight: 0.28, base_price: 28, color: "#e2e8f0", finColor: "#cbd5e1", bodyType: 0, pattern: "scales", edible: true, hungerValue: 22, poison: false },
    { id: 85, name: "Пелядь сырок", family: "salmonids", rarity: "Common", min_weight: 0.30, max_weight: 2.00, base_price: 65, color: "#cbd5e1", finColor: "#94a3b8", bodyType: 0, pattern: "scales", edible: true, hungerValue: 45, poison: false },
    { id: 86, name: "Чир щекур", family: "salmonids", rarity: "Epic", min_weight: 1.50, max_weight: 9.00, base_price: 490, color: "#94a3b8", finColor: "#64748b", bodyType: 0, pattern: "scales", edible: true, hungerValue: 80, poison: false },
    { id: 87, name: "Тугун сосьвинский", family: "salmonids", rarity: "Rare", min_weight: 0.03, max_weight: 0.12, base_price: 150, color: "#f1f5f9", finColor: "#e2e8f0", bodyType: 0, pattern: "scales", edible: true, hungerValue: 30, poison: false },
    { id: 88, name: "Горбуша тихоокеанская", family: "salmonids", rarity: "Rare", min_weight: 1.20, max_weight: 3.80, base_price: 220, color: "#fb7185", finColor: "#f43f5e", bodyType: 1, pattern: "spots", edible: true, hungerValue: 65, poison: false },
    { id: 89, name: "Кета дальневосточная", family: "salmonids", rarity: "Epic", min_weight: 2.50, max_weight: 9.50, base_price: 510, color: "#f97316", finColor: "#ea580c", bodyType: 1, pattern: "stripes", edible: true, hungerValue: 80, poison: false },
    { id: 90, name: "Нерка красница", family: "salmonids", rarity: "Epic", min_weight: 1.80, max_weight: 5.50, base_price: 560, color: "#ef4444", finColor: "#dc2626", bodyType: 1, pattern: "scales", edible: true, hungerValue: 75, poison: false },
    { id: 91, name: "Кижуч серебряный лосось", family: "salmonids", rarity: "Epic", min_weight: 2.80, max_weight: 12.00, base_price: 640, color: "#e2e8f0", finColor: "#94a3b8", bodyType: 1, pattern: "speckles", edible: true, hungerValue: 85, poison: false },
    { id: 92, name: "Голец арктический палья", family: "salmonids", rarity: "Epic", min_weight: 1.20, max_weight: 7.50, base_price: 590, color: "#f43f5e", finColor: "#e11d48", bodyType: 1, pattern: "spots", edible: true, hungerValue: 75, poison: false },

    // --- ОСЕТРОВЫЕ И РЕЛИКТОВЫЕ (8 видов) [bodyType: 2 и 3] ---
    { id: 93, name: "Осетр русский", family: "sturgeons", rarity: "Epic", min_weight: 8.00, max_weight: 45.00, base_price: 1550, color: "#78716c", finColor: "#57534e", bodyType: 2, pattern: "scales", edible: true, hungerValue: 95, poison: false },
    { id: 94, name: "Осетр сибирский", family: "sturgeons", rarity: "Legendary", min_weight: 12.00, max_weight: 75.00, base_price: 2500, color: "#f59e0b", finColor: "#d97706", bodyType: 2, pattern: "scales", edible: true, hungerValue: 100, poison: false },
    { id: 95, name: "Осетр амурский", family: "sturgeons", rarity: "Epic", min_weight: 6.00, max_weight: 38.00, base_price: 1400, color: "#a8a29e", finColor: "#78716c", bodyType: 2, pattern: "scales", edible: true, hungerValue: 90, poison: false },
    { id: 96, name: "Стерлядь волжская", family: "sturgeons", rarity: "Rare", min_weight: 0.80, max_weight: 5.50, base_price: 360, color: "#ca8a04", finColor: "#a16207", bodyType: 2, pattern: "scales", edible: true, hungerValue: 70, poison: false },
    { id: 97, name: "Белуга каспийская", family: "sturgeons", rarity: "Legendary", min_weight: 25.00, max_weight: 160.00, base_price: 5200, color: "#334155", finColor: "#1e293b", bodyType: 3, pattern: "scales", edible: true, hungerValue: 100, poison: false },
    { id: 98, name: "Калуга амурская", family: "sturgeons", rarity: "Legendary", min_weight: 30.00, max_weight: 190.00, base_price: 6400, color: "#0f172a", finColor: "#020617", bodyType: 3, pattern: "scales", edible: true, hungerValue: 100, poison: false },
    { id: 99, name: "Севрюга звездчатая", family: "sturgeons", rarity: "Epic", min_weight: 5.00, max_weight: 28.00, base_price: 1350, color: "#64748b", finColor: "#475569", bodyType: 2, pattern: "scales", edible: true, hungerValue: 85, poison: false },
    { id: 100, name: "Шип реликтовый", family: "sturgeons", rarity: "Legendary", min_weight: 10.00, max_weight: 50.00, base_price: 3100, color: "#d97706", finColor: "#b45309", bodyType: 2, pattern: "scales", edible: true, hungerValue: 95, poison: false }
  ];

  /* ==========================================================
     2. БАЗА ВОДНЫХ ЖИВОТНЫХ И ЗВЕРЕЙ (8% ШАНС)
     ========================================================== */
  const BEAST_SPECIES = [
    // Крокодилы / кайманы (bodyType: 8, combatStyle: 'death_roll')
    { id: 201, name: "Карликовый кайман Кювье", family: "beasts", rarity: "Epic", min_weight: 4.0, max_weight: 9.0, base_price: 850, color: "#3f6212", finColor: "#1a2e05", bodyType: 8, combatStyle: "death_roll", edible: true, hungerValue: 70, poison: false },
    { id: 202, name: "Крокодиловый кайман", family: "beasts", rarity: "Epic", min_weight: 18.0, max_weight: 55.0, base_price: 1800, color: "#4d7c0f", finColor: "#365314", bodyType: 8, combatStyle: "death_roll", edible: true, hungerValue: 90, poison: false },
    { id: 203, name: "Черный кайман", family: "beasts", rarity: "Legendary", min_weight: 70.0, max_weight: 240.0, base_price: 4800, color: "#1c1917", finColor: "#0c0a09", bodyType: 8, combatStyle: "death_roll", edible: true, hungerValue: 100, poison: false },
    { id: 204, name: "Нильский крокодил-исполин", family: "beasts", rarity: "Legendary", min_weight: 120.0, max_weight: 310.0, base_price: 7500, color: "#292524", finColor: "#1c1917", bodyType: 8, combatStyle: "death_roll", edible: true, hungerValue: 100, poison: false },

    // Черепахи (bodyType: 5, combatStyle: 'stone_sink')
    { id: 205, name: "Болотная черепаха европейская", family: "beasts", rarity: "Common", min_weight: 0.8, max_weight: 2.4, base_price: 60, color: "#365314", finColor: "#1a2e05", bodyType: 5, combatStyle: "stone_sink", edible: true, hungerValue: 35, poison: false },
    { id: 206, name: "Каймановая черепаха", family: "beasts", rarity: "Rare", min_weight: 6.0, max_weight: 22.0, base_price: 380, color: "#44403c", finColor: "#292524", bodyType: 5, combatStyle: "stone_sink", edible: true, hungerValue: 65, poison: false },
    { id: 207, name: "Грифовая черепаха аллигаторова", family: "beasts", rarity: "Epic", min_weight: 25.0, max_weight: 95.0, base_price: 1450, color: "#27272a", finColor: "#18181b", bodyType: 5, combatStyle: "stone_sink", edible: true, hungerValue: 90, poison: false },
    { id: 208, name: "Дальневосточный трионикс", family: "beasts", rarity: "Rare", min_weight: 2.0, max_weight: 6.5, base_price: 290, color: "#854d0e", finColor: "#713f12", bodyType: 5, combatStyle: "stone_sink", edible: true, hungerValue: 50, poison: false },

    // Ракообразные (bodyType: 6, combatStyle: 'claw_snag')
    { id: 209, name: "Широкопалый речной рак", family: "beasts", rarity: "Common", min_weight: 0.10, max_weight: 0.35, base_price: 45, color: "#78350f", finColor: "#451a03", bodyType: 6, combatStyle: "claw_snag", edible: true, hungerValue: 25, poison: false },
    { id: 210, name: "Узкопалый длиннопалый рак", family: "beasts", rarity: "Common", min_weight: 0.08, max_weight: 0.28, base_price: 40, color: "#92400e", finColor: "#78350f", bodyType: 6, combatStyle: "claw_snag", edible: true, hungerValue: 20, poison: false },
    { id: 211, name: "Голубой кубинский рак", family: "beasts", rarity: "Rare", min_weight: 0.15, max_weight: 0.45, base_price: 240, color: "#0284c7", finColor: "#0369a1", bodyType: 6, combatStyle: "claw_snag", edible: true, hungerValue: 30, poison: false },
    { id: 212, name: "Тасманийский гигантский рак", family: "beasts", rarity: "Epic", min_weight: 1.50, max_weight: 4.80, base_price: 980, color: "#1e3a8a", finColor: "#172554", bodyType: 6, combatStyle: "claw_snag", edible: true, hungerValue: 75, poison: false },

    // Полуводные млекопитающие и рептилии (bodyType: 7/beasts)
    { id: 213, name: "Ондатра речная", family: "beasts", rarity: "Common", min_weight: 0.9, max_weight: 2.1, base_price: 90, color: "#57534e", finColor: "#44403c", bodyType: 7, combatStyle: "death_roll", edible: true, hungerValue: 40, poison: false },
    { id: 214, name: "Бобр европейский", family: "beasts", rarity: "Rare", min_weight: 14.0, max_weight: 32.0, base_price: 520, color: "#78350f", finColor: "#451a03", bodyType: 7, combatStyle: "stone_sink", edible: true, hungerValue: 85, poison: false },
    { id: 215, name: "Водяной уж рыбоядный", family: "beasts", rarity: "Common", min_weight: 0.4, max_weight: 1.4, base_price: 55, color: "#52525b", finColor: "#3f3f46", bodyType: 7, combatStyle: "claw_snag", edible: false, hungerValue: 0, poison: false },
    { id: 216, name: "Болотная гадюка", family: "beasts", rarity: "Rare", min_weight: 0.3, max_weight: 0.9, base_price: 180, color: "#365314", finColor: "#1a2e05", bodyType: 7, combatStyle: "claw_snag", edible: false, hungerValue: 0, poison: true }
  ];

  /* ==========================================================
     3. БАЗА ХЛАМА, ТОПЛИВА И СУНДУКОВ (12% ШАНС)
     ========================================================== */
  const JUNK_ITEMS = [
    // Обувь и мусор
    { id: 501, name: "Старый резиновый сапог", type: "junk", rarity: "Common", min_weight: 0.8, max_weight: 1.5, base_price: 6, color: "#1e293b", bodyType: -1, fuelValue: 0, edible: false, hungerValue: 0, itemKind: "boot" },
    { id: 502, name: "Офицерский яловый сапог", type: "junk", rarity: "Common", min_weight: 1.1, max_weight: 1.8, base_price: 25, color: "#3f3f46", bodyType: -1, fuelValue: 0, edible: false, hungerValue: 0, itemKind: "boot" },
    { id: 503, name: "Рваная шляпа лесничего", type: "junk", rarity: "Common", min_weight: 0.3, max_weight: 0.7, base_price: 12, color: "#57534e", bodyType: -1, fuelValue: 0, edible: false, hungerValue: 0, itemKind: "hat" },
    { id: 504, name: "Ржавая консервная банка", type: "junk", rarity: "Common", min_weight: 0.2, max_weight: 0.5, base_price: 4, color: "#a16207", bodyType: -1, fuelValue: 0, edible: false, hungerValue: 0, itemKind: "can" },
    { id: 505, name: "Клубок болотной тины", type: "junk", rarity: "Common", min_weight: 0.5, max_weight: 2.0, base_price: 2, color: "#4d7c0f", bodyType: -1, fuelValue: 0, edible: false, hungerValue: 0, itemKind: "weed" },
    { id: 506, name: "Ржавая якорная цепь", type: "junk", rarity: "Rare", min_weight: 4.0, max_weight: 14.0, base_price: 60, color: "#78716c", bodyType: -1, fuelValue: 0, edible: false, hungerValue: 0, itemKind: "chain" },
    { id: 507, name: "Кованый речной якорь", type: "junk", rarity: "Epic", min_weight: 8.0, max_weight: 25.0, base_price: 240, color: "#475569", bodyType: -1, fuelValue: 0, edible: false, hungerValue: 0, itemKind: "anchor" },
    { id: 508, name: "Размокшая старинная книга", type: "junk", rarity: "Rare", min_weight: 0.8, max_weight: 1.6, base_price: 95, color: "#854d0e", bodyType: -1, fuelValue: 8, edible: false, hungerValue: 0, itemKind: "book" },
    { id: 509, name: "Медный карманный хронометр", type: "junk", rarity: "Epic", min_weight: 0.3, max_weight: 0.6, base_price: 380, color: "#f59e0b", bodyType: -1, fuelValue: 0, edible: false, hungerValue: 0, itemKind: "chronometer" },

    // Топливо для печи в хижине
    { id: 510, name: "Мокрое сосновое бревно", type: "fuel", rarity: "Common", min_weight: 3.5, max_weight: 10.0, base_price: 35, color: "#78350f", bodyType: -1, fuelValue: 30, edible: false, hungerValue: 0, itemKind: "log" },
    { id: 511, name: "Березовое полено", type: "fuel", rarity: "Common", min_weight: 2.0, max_weight: 6.0, base_price: 25, color: "#f8fafc", bodyType: -1, fuelValue: 25, edible: false, hungerValue: 0, itemKind: "log" },
    { id: 512, name: "Мореный дубовый кряж", type: "fuel", rarity: "Rare", min_weight: 6.0, max_weight: 18.0, base_price: 110, color: "#292524", bodyType: -1, fuelValue: 65, edible: false, hungerValue: 0, itemKind: "log" },
    { id: 513, name: "Смолистая сучковатая коряга", type: "fuel", rarity: "Common", min_weight: 3.0, max_weight: 8.5, base_price: 45, color: "#451a03", bodyType: -1, fuelValue: 40, edible: false, hungerValue: 0, itemKind: "log" },

    // Сундуки и ларцы (Лутбоксы)
    { id: 520, name: "Затонувший деревянный ларец", type: "chest", rarity: "Rare", min_weight: 5.0, max_weight: 12.0, base_price: 180, color: "#b45309", bodyType: -1, fuelValue: 15, isLootbox: true, minCoins: 120, maxCoins: 450, baitCount: 4, itemKind: "chest" },
    { id: 521, name: "Кованый сундук контрабандистов", type: "chest", rarity: "Epic", min_weight: 12.0, max_weight: 30.0, base_price: 650, color: "#334155", bodyType: -1, fuelValue: 0, isLootbox: true, minCoins: 600, maxCoins: 2400, baitCount: 10, itemKind: "chest" },
    { id: 522, name: "Замшелый пиратский сейф", type: "chest", rarity: "Legendary", min_weight: 25.0, max_weight: 60.0, base_price: 2200, color: "#ca8a04", bodyType: -1, fuelValue: 0, isLootbox: true, minCoins: 2500, maxCoins: 8000, baitCount: 20, itemKind: "chest" }
  ];

  /* ==========================================================
     4. МАТРИЦА ПРОЦЕДУРНЫХ КОМБИНАЦИЙ
     ========================================================== */

  // 15 мутаций и состояний
  const MUTATIONS = {
    albino: { id: "albino", name: "Альбинос", priceMult: 2.2, weightMult: 0.95, aggroMult: 0.9, glowColor: "rgba(255,255,255,0.7)", colorOverride: "#f8fafc", finOverride: "#fbcfe8", edible: true, poison: false, rarityBoost: 1 },
    golden: { id: "golden", name: "Золотой", priceMult: 3.5, weightMult: 1.1, aggroMult: 1.15, glowColor: "#facc15", colorOverride: "#f59e0b", finOverride: "#fde047", edible: true, poison: false, rarityBoost: 2 },
    melanistic: { id: "melanistic", name: "Меланист", priceMult: 2.0, weightMult: 1.2, aggroMult: 1.1, glowColor: "rgba(30,41,59,0.9)", colorOverride: "#0f172a", finOverride: "#020617", edible: true, poison: false, rarityBoost: 1 },
    plague: { id: "plague", name: "Чумной", priceMult: 0.6, weightMult: 0.85, aggroMult: 1.35, glowColor: "#84cc16", colorOverride: "#4d7c0f", finOverride: "#3f6212", edible: false, poison: true, rarityBoost: 0 },
    radioactive: { id: "radioactive", name: "Радиоактивный", priceMult: 4.0, weightMult: 1.3, aggroMult: 1.5, glowColor: "#22c55e", colorOverride: "#15803d", finOverride: "#4ade80", edible: false, poison: true, rarityBoost: 2 },
    two_headed: { id: "two_headed", name: "Двуглавый", priceMult: 3.0, weightMult: 1.35, aggroMult: 1.45, glowColor: "#ec4899", colorOverride: null, finOverride: null, edible: false, poison: false, rarityBoost: 2 },
    colossal: { id: "colossal", name: "Исполинский", priceMult: 2.8, weightMult: 2.4, aggroMult: 1.6, glowColor: "#38bdf8", colorOverride: null, finOverride: null, edible: true, poison: false, rarityBoost: 2 },
    dwarf: { id: "dwarf", name: "Карликовый", priceMult: 1.4, weightMult: 0.45, aggroMult: 0.8, glowColor: null, colorOverride: null, finOverride: null, edible: true, poison: false, rarityBoost: 0 },
    glowing: { id: "glowing", name: "Светящийся", priceMult: 2.5, weightMult: 1.0, aggroMult: 1.05, glowColor: "#38bdf8", colorOverride: "#0ea5e9", finOverride: "#7dd3fc", edible: true, poison: false, rarityBoost: 1 },
    void: { id: "void", name: "Бездный", priceMult: 5.0, weightMult: 1.25, aggroMult: 1.8, glowColor: "#a855f7", colorOverride: "#3b0764", finOverride: "#6b21a8", edible: false, poison: true, rarityBoost: 3 },
    crystal: { id: "crystal", name: "Кристальный", priceMult: 4.5, weightMult: 1.15, aggroMult: 1.2, glowColor: "#67e8f9", colorOverride: "#06b6d4", finOverride: "#a5f3fc", edible: true, poison: false, rarityBoost: 2 },
    ghost: { id: "ghost", name: "Призрачный", priceMult: 3.2, weightMult: 0.7, aggroMult: 1.3, glowColor: "rgba(226,232,240,0.8)", colorOverride: "rgba(241,245,249,0.55)", finOverride: "rgba(203,213,225,0.4)", edible: false, poison: false, rarityBoost: 2 },
    electric: { id: "electric", name: "Электрический", priceMult: 3.0, weightMult: 1.05, aggroMult: 1.4, glowColor: "#60a5fa", colorOverride: "#2563eb", finOverride: "#93c5fd", edible: true, poison: false, rarityBoost: 2 },
    armored: { id: "armored", name: "Бронированный", priceMult: 2.0, weightMult: 1.4, aggroMult: 1.25, glowColor: "#94a3b8", colorOverride: "#475569", finOverride: "#334155", edible: true, poison: false, rarityBoost: 1 },
    mossy: { id: "mossy", name: "Мшистый", priceMult: 1.4, weightMult: 1.15, aggroMult: 0.95, glowColor: "#65a30d", colorOverride: "#365314", finOverride: "#4d7c0f", edible: true, poison: false, rarityBoost: 0 }
  };

  // 12 модификаторов среды обитания
  const ENVIRONMENTS = {
    taiga: { id: "taiga", name: "Таёжный", priceMult: 1.15, weightMult: 1.15, aggroMult: 1.05, colorHue: 0 },
    swamp: { id: "swamp", name: "Болотный", priceMult: 0.95, weightMult: 1.05, aggroMult: 1.1, colorHue: 40 },
    deep: { id: "deep", name: "Глубинный", priceMult: 1.3, weightMult: 1.2, aggroMult: 1.25, colorHue: -20 },
    fast_river: { id: "fast_river", name: "Быстроречный", priceMult: 1.2, weightMult: 0.95, aggroMult: 1.3, colorHue: 10 },
    whirlpool: { id: "whirlpool", name: "Омутный", priceMult: 1.35, weightMult: 1.25, aggroMult: 1.35, colorHue: -10 },
    cave: { id: "cave", name: "Пещерный", priceMult: 1.5, weightMult: 0.9, aggroMult: 1.15, colorHue: -50 },
    glacial: { id: "glacial", name: "Ледниковый", priceMult: 1.4, weightMult: 1.1, aggroMult: 1.2, colorHue: -15 },
    reedy: { id: "reedy", name: "Камышовый", priceMult: 1.05, weightMult: 1.0, aggroMult: 1.0, colorHue: 25 },
    sunken: { id: "sunken", name: "Затопленный", priceMult: 1.25, weightMult: 1.1, aggroMult: 1.15, colorHue: 15 },
    volcanic: { id: "volcanic", name: "Вулканический", priceMult: 1.6, weightMult: 1.2, aggroMult: 1.45, colorHue: -35 },
    muddy: { id: "muddy", name: "Илистый", priceMult: 0.9, weightMult: 1.1, aggroMult: 0.9, colorHue: 30 },
    brackish: { id: "brackish", name: "Солоноватый", priceMult: 1.25, weightMult: 1.05, aggroMult: 1.1, colorHue: 5 }
  };

  // 10 легендарных титулов-суффиксов
  const TITLES = [
    { id: "spoons_eater", title: "«Пожиратель Блесен»", priceMult: 2.0, aggroMult: 1.5, weightMult: 1.2, preferredMethod: "spinning" },
    { id: "pool_master", title: "«Хозяин Омута»", priceMult: 2.2, aggroMult: 1.3, weightMult: 1.4, preferredMethod: "feeder" },
    { id: "deep_whisperer", title: "«Шептун Глубин»", priceMult: 2.5, aggroMult: 1.4, weightMult: 1.3, preferredMethod: "feeder" },
    { id: "net_bane", title: "«Гроза Сетей»", priceMult: 2.3, aggroMult: 1.6, weightMult: 1.5, preferredMethod: null },
    { id: "silt_lord", title: "«Владыка Ила»", priceMult: 1.9, aggroMult: 1.2, weightMult: 1.6, preferredMethod: "feeder" },
    { id: "elusive", title: "«Неуловимый»", priceMult: 2.4, aggroMult: 1.7, weightMult: 1.1, preferredMethod: "float" },
    { id: "ancient_colossus", title: "«Древний Исполин»", priceMult: 3.0, aggroMult: 1.5, weightMult: 1.9, preferredMethod: null },
    { id: "scaled_demon", title: "«Чешуйчатый Демон»", priceMult: 2.6, aggroMult: 1.8, weightMult: 1.35, preferredMethod: "spinning" },
    { id: "current_ruler", title: "«Повелитель Течений»", priceMult: 2.1, aggroMult: 1.5, weightMult: 1.25, preferredMethod: "fly" },
    { id: "lake_guardian", title: "«Хранитель Озера»", priceMult: 3.5, aggroMult: 1.75, weightMult: 1.8, preferredMethod: null }
  ];

  // Экспорт во внешнюю область видимости
  window.ENTITY_DATA = {
    FISH_SPECIES,
    BEAST_SPECIES,
    JUNK_ITEMS,
    MUTATIONS,
    ENVIRONMENTS,
    TITLES
  };

})(typeof window !== 'undefined' ? window : global);
