/* ==========================================================
   LUMIBOT FISHING - MARKET.JS
   Динамический рынок рыбы (закон спроса и предложения)
   ========================================================== */

    /* ==========================================================
       ДИНАМИЧЕСКИЙ РЫНОК РЫБЫ (ЗАКОН СПРОСА И ПРЕДЛОЖЕНИЯ)
       ========================================================== */
    let marketSales = {};
    try {
      const rawMarket = localStorage.getItem("lumibot_market_sales");
      if (rawMarket) marketSales = JSON.parse(rawMarket);
      if (!marketSales || typeof marketSales !== 'object') marketSales = {};
    } catch (e) {
      marketSales = {};
    }

    function recordFishSale(fishKey, count = 1) {
      if (!fishKey) return;
      marketSales[fishKey] = (marketSales[fishKey] || 0) + count;
      try {
        localStorage.setItem("lumibot_market_sales", JSON.stringify(marketSales));
      } catch (e) {}

      if (supabaseClient) {
        supabaseClient.rpc('record_market_sale', { p_fish_id: String(fishKey), p_count: count })
          .then(({ error }) => {
            if (error) {
              supabaseClient.from('market_sales').upsert({
                fish_id: String(fishKey),
                total_sold: marketSales[fishKey],
                updated_at: new Date().toISOString()
              }).catch(() => {});
            }
          }).catch(() => {});
      }
    }

    function getFishDynamicPrice(fish) {
      const basePrice = (fish && typeof fish.price === 'number') ? fish.price : 20;
      const totalSales = Object.values(marketSales).reduce((sum, v) => sum + (typeof v === 'number' ? v : 0), 0);
      const MIN_DATA_THRESHOLD = 12; // Пока недостаточно данных, цена как сейчас (Requirement 4)

      if (totalSales < MIN_DATA_THRESHOLD) {
        return {
          price: basePrice,
          basePrice: basePrice,
          multiplier: 1.0,
          trend: 'initial',
          diffPercent: 0,
          label: 'Базовая'
        };
      }

      const fishKey = fish.fishId || fish.id || "common_fish";
      const speciesKeys = Object.keys(marketSales);
      const avgSales = totalSales / Math.max(1, speciesKeys.length);
      const currentFishSales = marketSales[fishKey] || 0;

      // Относительное отклонение от среднего:
      // Если рыбу сдают чаще среднего -> переизбыток -> цена падает (до 0.50x)
      // Если рыбу сдают реже среднего -> дефицит -> цена растет (до 1.65x)
      const diff = (avgSales - currentFishSales) / (avgSales + 6);
      const multiplier = Math.max(0.50, Math.min(1.65, 1.0 + diff * 0.55));
      const dynamicPrice = Math.max(1, Math.round(basePrice * multiplier));
      const diffPercent = Math.round((multiplier - 1.0) * 100);

      let trend = 'neutral';
      let label = '⚖️ Норма';
      if (diffPercent >= 6) {
        trend = 'up';
        label = `📈 +${diffPercent}%`;
      } else if (diffPercent <= -6) {
        trend = 'down';
        label = `📉 ${diffPercent}%`;
      }

      return {
        price: dynamicPrice,
        basePrice: basePrice,
        multiplier: multiplier,
        trend: trend,
        diffPercent: diffPercent,
        label: label
      };
    }
    window.getFishDynamicPrice = getFishDynamicPrice;



window.recordFishSale = recordFishSale;
window.getFishDynamicPrice = getFishDynamicPrice;
