/**
 * gridInventory.js - Сеточный тетрис-инвентарь садка (Resident Evil / Diablo style)
 * Поддерживает предметы от 1 до 5 ячеек, угловые L-формы, поворот на 90°,
 * перетаскивание, выбор, выбрасывание и проверку вместимости.
 */

(function (window) {
  'use strict';

  const GRID_COLS = 8;
  const GRID_ROWS = 6;
  const TOTAL_CELLS = GRID_COLS * GRID_ROWS;

  // Базовые матрицы форм (1-5 ячеек)
  const SHAPES = {
    // 1 ячейка: мелкая рыба (< 0.4 кг), ракушки, мелкий хлам
    TINY_1X1: [[1]],

    // 2 ячейки: обычная рыба (0.4 - 1.8 кг)
    LINE_2: [[1, 1]],

    // 3 ячейки: вытянутая средняя рыба (щука, судак, хариус)
    LINE_3: [[1, 1, 1]],

    // Угловая L-форма 3 ячейки: угорь, минога, сомик, изогнутая коряга
    CORNER_3: [
      [1, 0],
      [1, 1]
    ],

    // 4 ячейки прямая: крупная щука, таймень
    LINE_4: [[1, 1, 1, 1]],

    // 4 ячейки блок 2x2: широкотелая крупная рыба (лещ, сазан, карп кои)
    BLOCK_2X2: [
      [1, 1],
      [1, 1]
    ],

    // Угловая L-форма 4 ячейки: крупный угорь, изогнутый башмак
    CORNER_4: [
      [1, 0],
      [1, 0],
      [1, 1]
    ],

    // 5 ячеек прямая: трофейные осетры, белуга
    LINE_5: [[1, 1, 1, 1, 1]],

    // 5 ячеек T-форма: водные чудовища, речные гиганты
    TEE_5: [
      [1, 1, 1],
      [0, 1, 0],
      [0, 1, 0]
    ],

    // Угловая L-форма 5 ячеек: изогнутый сом, змей
    CORNER_5: [
      [1, 0],
      [1, 0],
      [1, 0],
      [1, 1]
    ]
  };

  /**
   * Определение формы и размера предмета в зависимости от типа, веса и свойств
   * @param {Object} item 
   * @returns {Array<Array<number>>} 2D матрица формы
   */
  function getItemGridShape(item) {
    if (!item) return SHAPES.TINY_1X1;

    // Если у предмета уже есть форма (например, сохранённая)
    if (item.gridShape && Array.isArray(item.gridShape)) {
      return item.gridShape;
    }

    const weight = Number(item.weight) || 0.5;
    const bodyType = typeof item.bodyType === 'number' ? item.bodyType : -1;
    const isBeast = !!item.isBeast;
    const isJunk = !!item.isJunk;
    const isLootbox = !!item.isLootbox;
    const name = (item.name || '').toLowerCase();

    // 1. Хлам и ларцы
    if (isLootbox) {
      return SHAPES.BLOCK_2X2; // Ларец 2x2 (4 клетки)
    }
    if (isJunk) {
      if (name.includes('сапог') || name.includes('башмак')) return SHAPES.CORNER_4;
      if (name.includes('коряга') || name.includes('ветка')) return SHAPES.CORNER_3;
      if (name.includes('бревно') || name.includes('доска')) return SHAPES.LINE_3;
      return SHAPES.TINY_1X1;
    }

    // 2. Водные чудовища (всегда крупные, 4-5 клеток)
    if (isBeast) {
      if (name.includes('змей') || name.includes('левиафан')) return SHAPES.CORNER_5;
      if (name.includes('кракен') || name.includes('краб')) return SHAPES.TEE_5;
      return SHAPES.LINE_5;
    }

    // 3. Угреобразные и изогнутые виды (L-образные / угловые)
    if (bodyType === 8 || name.includes('угорь') || name.includes('минога') || name.includes('вьюн')) {
      if (weight >= 3.0) return SHAPES.CORNER_5;
      if (weight >= 1.5) return SHAPES.CORNER_4;
      return SHAPES.CORNER_3;
    }

    // 4. Донные сомы
    if (bodyType === 3 || name.includes('сом') || name.includes('налим')) {
      if (weight >= 12.0) return SHAPES.CORNER_5;
      if (weight >= 5.0) return SHAPES.CORNER_4;
      return SHAPES.LINE_3;
    }

    // 5. Широкотелые озерные рыбы (Лещ, Карп, Карась-гигант, Сазан)
    if (bodyType === 0 && weight >= 3.5) {
      return SHAPES.BLOCK_2X2;
    }

    // 6. По весовым категориям
    if (weight < 0.4) {
      return SHAPES.TINY_1X1; // 1 клетка
    } else if (weight < 1.6) {
      return SHAPES.LINE_2; // 2 клетки
    } else if (weight < 4.5) {
      return SHAPES.LINE_3; // 3 клетки
    } else if (weight < 10.0) {
      return SHAPES.LINE_4; // 4 клетки
    } else {
      return SHAPES.LINE_5; // 5 клеток
    }
  }

  /**
   * Поворот 2D матрицы на 90 градусов по часовой стрелке
   * @param {Array<Array<number>>} matrix 
   * @returns {Array<Array<number>>}
   */
  function rotateMatrix(matrix) {
    if (!matrix || !matrix.length) return matrix;
    const rows = matrix.length;
    const cols = matrix[0].length;
    const rotated = [];

    for (let c = 0; c < cols; c++) {
      rotated[c] = [];
      for (let r = rows - 1; r >= 0; r--) {
        rotated[c].push(matrix[r][c]);
      }
    }
    return rotated;
  }

  /**
   * Подсчёт общего количества занятых ячеек в форме
   */
  function countShapeCells(shape) {
    if (!shape) return 1;
    let count = 0;
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] === 1) count++;
      }
    }
    return Math.max(1, count);
  }

  /**
   * Построение 2D карты сетки инвентаря
   * @param {Array} items Список предметов игрока
   * @param {string|number} [excludeItemId] Исключить предмет (при перетаскивании)
   * @returns {Array<Array<any>>}
   */
  function buildGridMap(items, excludeItemId = null) {
    const grid = [];
    for (let r = 0; r < GRID_ROWS; r++) {
      grid[r] = new Array(GRID_COLS).fill(null);
    }

    if (!Array.isArray(items)) return grid;

    items.forEach(item => {
      if (excludeItemId !== null && item.id === excludeItemId) return;
      if (typeof item.gridX !== 'number' || typeof item.gridY !== 'number') return;

      const shape = item.gridShape || getItemGridShape(item);
      const rows = shape.length;
      const cols = shape[0].length;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (shape[r][c] === 1) {
            const gx = item.gridX + c;
            const gy = item.gridY + r;
            if (gx >= 0 && gx < GRID_COLS && gy >= 0 && gy < GRID_ROWS) {
              grid[gy][gx] = item;
            }
          }
        }
      }
    });

    return grid;
  }

  /**
   * Проверка возможности размещения формы на сетке
   */
  function canPlace(gridMap, shape, targetX, targetY) {
    if (!shape || !shape.length) return false;
    const rows = shape.length;
    const cols = shape[0].length;

    if (targetX < 0 || targetY < 0) return false;
    if (targetX + cols > GRID_COLS || targetY + rows > GRID_ROWS) return false;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (shape[r][c] === 1) {
          const gx = targetX + c;
          const gy = targetY + r;
          if (gridMap[gy][gx] !== null) {
            return false; // Ячейка уже занята
          }
        }
      }
    }
    return true;
  }

  /**
   * Поиск первого свободного места для предмета (с учётом поворотов)
   * @param {Array} items Текущие предметы в инвентаре
   * @param {Object} newItem Новый предмет
   * @returns {{ success: boolean, x: number, y: number, shape: Array<Array<number>> }|null}
   */
  function autoPlaceItem(items, newItem) {
    let shape = newItem.gridShape ? newItem.gridShape : getItemGridShape(newItem);
    const gridMap = buildGridMap(items);

    // Пробуем разместить в исходной ориентации и с поворотом на 90°
    const orientations = [shape, rotateMatrix(shape)];

    for (const testShape of orientations) {
      const rows = testShape.length;
      const cols = testShape[0].length;

      for (let y = 0; y <= GRID_ROWS - rows; y++) {
        for (let x = 0; x <= GRID_COLS - cols; x++) {
          if (canPlace(gridMap, testShape, x, y)) {
            return {
              success: true,
              x: x,
              y: y,
              shape: testShape
            };
          }
        }
      }
    }

    return null; // Садок полон, место не найдено
  }

  /**
   * Подсчёт общего количества занятых ячеек в садке
   */
  function getOccupiedCellsCount(items) {
    if (!Array.isArray(items)) return 0;
    let count = 0;
    items.forEach(item => {
      const shape = item.gridShape || getItemGridShape(item);
      count += countShapeCells(shape);
    });
    return Math.min(TOTAL_CELLS, count);
  }

  window.GridInventory = {
    COLS: GRID_COLS,
    ROWS: GRID_ROWS,
    TOTAL_CELLS: TOTAL_CELLS,
    SHAPES: SHAPES,
    getItemGridShape: getItemGridShape,
    rotateMatrix: rotateMatrix,
    countShapeCells: countShapeCells,
    buildGridMap: buildGridMap,
    canPlace: canPlace,
    autoPlaceItem: autoPlaceItem,
    getOccupiedCellsCount: getOccupiedCellsCount
  };

})(window);
