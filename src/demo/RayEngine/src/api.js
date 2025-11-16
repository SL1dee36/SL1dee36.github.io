// api.js - Описание API для разработчиков 2D игр

/**
 * @namespace GameAPI
 */
const GameAPI = {
    /**
     * Временная переменная, увеличивается с каждым кадром
     * @type {number}
     */
    time: 0,

    /**
     * Математическая функция синуса
     * @param {number} value значение
     * @returns {number}
     */
    sin: Math.sin,

  /**
   * Математическая функция косинуса
   * @param {number} value значение
   * @returns {number}
   */
    cos: Math.cos,

   /**
    * Математическая функция тангенса
    * @param {number} value значение
    * @returns {number}
    */
   tan: Math.tan,
  
   /**
    *  Получить рандомное число.
     * @param {number} min минимальное значение
    * @param {number} max максимальное значение
    * @returns {number}
    */
    random: function(min, max) {
      return Math.random() * (max - min) + min;
    },


    /**
     * Функция для получения расстояния между двумя точками.
      * @param {number} x1 Координата X первой точки.
     * @param {number} y1 Координата Y первой точки.
     * @param {number} x2 Координата X второй точки.
     * @param {number} y2 Координата Y второй точки.
     * @returns {number} Расстояние между точками.
     */
    distance: function(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    },


    /**
     *  Функция для вывода сообщения в консоль
      * @param {any} message Сообщение для вывода в консоль
    */
     log: function(message) {
        console.log(message);
      },
    /**
     * Функция для перемещения объекта
     * @param {object} obj Объект, который нужно переместить
     * @param {number} x Новая координата X.
     * @param {number} y Новая координата Y.
     */
      move: function(obj, x, y) {
        obj.x = x;
        obj.y = y;
    },

    /**
     * Функция для изменения угла поворота объекта.
      * @param {object} obj Объект, угол которого нужно изменить.
     * @param {number} angle Новый угол поворота в градусах.
     */
    rotate: function(obj, angle) {
        obj.angle = angle;
    },


    /**
      * Функция для изменения цвета объекта.
      * @param {object} obj Объект, цвет которого нужно изменить.
     * @param {string} color Новый цвет в формате HEX (#RRGGBB).
      */
    setColor: function(obj, color) {
       obj.color = color;
    },

    /**
     * Функция для получения позиции мыши.
     * @returns {{x:number, y:number}}
     */
    getMousePosition: function () {
         return {x: mouseX, y: mouseY}
    }


};