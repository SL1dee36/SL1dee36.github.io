/* ==========================================================
   LUMIBOT FISHING - SUPABASE.JS
   Интеграция с базой данных Supabase, RPC вызовы и синхронизация
   ========================================================== */


    // Инициализация Supabase Client
    let supabaseClient = null;
    if (window.supabase && SUPABASE_URL && !SUPABASE_URL.includes("your-supabase-project")) {
      try {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
          }
        });
        console.log("Supabase подключен успешно");
      } catch (err) {
        console.warn("Не удалось инициализировать Supabase:", err);
      }
    } else {
      console.log("Работа в автономном демо-режиме");
    }



/* ==========================================================
       ОТПРАВКА ДАННЫХ В SUPABASE
       ========================================================== */
    async function saveCatchToSupabase(fishId, weight, reward, xp) {
      if (!supabaseClient) {
        console.log("Локальный режим: сохранение пропущено.");
        return;
      }

      try {
        if (dbHasStatsColumns) {
          // Попытка вызова атомарной RPC функции log_catch
          const { data, error } = await supabaseClient.rpc('log_catch', {
            p_user_id: player.id,
            p_username: player.username || player.name,
            p_chat_id: currentChatId || null,
            p_fish_id: fishId,
            p_weight: weight,
            p_reward: reward,
            p_xp: xp
          });

          if (!error) {
            console.log("Улов успешно сохранен через RPC:", data);
            return;
          }
          console.warn("RPC log_catch не сработал, сохраняем через прямые таблицы:", error);
        }

        // Fallback: запись в catches напрямую
        await supabaseClient.from('catches').insert([{
          user_id: player.id,
          chat_id: currentChatId,
          fish_id: fishId,
          weight: weight,
          reward: reward,
          is_announced: false
        }]);

        // Обновление пользователя (гарантированные базовые поля)
        await supabaseClient.from('users').upsert({
          id: player.id,
          username: player.username || player.name,
          balance: player.balance,
          xp: player.xp,
          level: player.level
        });
      } catch (err) {
        console.error("Ошибка сохранения в Supabase:", err);
      }
    }



    async function syncUserStatsToSupabase() {
      if (!supabaseClient) return;
      try {
        if (dbHasStatsColumns) {
          const { error } = await supabaseClient.from('users').upsert({
            id: player.id,
            username: player.username || player.name,
            balance: player.balance,
            xp: player.xp,
            level: player.level,
            fish_caught: player.fishCaught,
            fish_sold: player.fishSold,
            total_earned: player.totalEarned,
            current_rod_id: player.rodId,
            current_line_id: player.lineId,
            fatigue: Math.round(player.fatigue || 0)
          });
          if (!error) return;
          console.warn("Ошибка расширенной синхронизации:", error);
        }

        // Базовый профиль, гарантированно работающий до выполнения SQL-миграции
        await supabaseClient.from('users').upsert({
          id: player.id,
          username: player.username || player.name,
          balance: player.balance,
          xp: player.xp,
          level: player.level
        });
      } catch (err) {
        console.warn("Не удалось синхронизировать статистику с Supabase:", err);
      }
    }

    // Загрузка начальных данных пользователя из Supabase
    async function loadUserData() {
      loadPlayerLocal();
      updatePlayerHUD();
      updateTensionSafeZoneUI();

      if (!supabaseClient) return;
      try {
        const { data, error } = await supabaseClient
          .from('users')
          .select('*')
          .eq('id', player.id)
          .maybeSingle();

        if (data && !error) {
          if ('fish_caught' in data) {
            dbHasStatsColumns = true;
          }
          player.balance = data.balance ?? player.balance;
          player.xp = data.xp ?? player.xp;
          player.level = data.level ?? player.level;
          player.fishCaught = Math.max(player.fishCaught, data.fish_caught ?? 0);
          player.fishSold = Math.max(player.fishSold, data.fish_sold ?? 0);
          player.totalEarned = Math.max(player.totalEarned, data.total_earned ?? 0);
          if (typeof data.fatigue === 'number') {
            player.fatigue = Math.max(0, Math.min(100, data.fatigue));
            updatePlayerHUD();
          }

          if (data.current_rod_id && RODS[data.current_rod_id]) {
            player.rodId = data.current_rod_id;
            if (!player.ownedRods.includes(data.current_rod_id)) player.ownedRods.push(data.current_rod_id);
          }
          if (data.current_line_id && LINES[data.current_line_id]) {
            player.lineId = data.current_line_id;
            if (!player.ownedLines.includes(data.current_line_id)) player.ownedLines.push(data.current_line_id);
          }

          // Загрузка статистики скупки рыбы для глобального рынка цен
          try {
            const { data: marketData } = await supabaseClient.from('market_sales').select('fish_id, total_sold');
            if (marketData && marketData.length > 0) {
              marketData.forEach(row => {
                marketSales[row.fish_id] = Math.max(marketSales[row.fish_id] || 0, Number(row.total_sold) || 0);
              });
              try { localStorage.setItem("lumibot_market_sales", JSON.stringify(marketSales)); } catch (e) {}
            }
          } catch (mErr) {
            console.log("Таблица market_sales еще не создана или оффлайн");
          }

          // Загрузка истории вылова для заполнения FishDex
          const { data: catchesData } = await supabaseClient
            .from('catches')
            .select('fish_id, weight, reward')
            .eq('user_id', player.id);

          if (catchesData && catchesData.length > 0) {
            for (const c of catchesData) {
              const fish = FISH_DATABASE.find(f => f.id === c.fish_id);
              if (!fish) continue;
              if (!player.bestCatch || !player.bestCatch.weight || c.weight > player.bestCatch.weight) {
                player.bestCatch = { name: fish.name, weight: c.weight, rarity: fish.rarity };
              }
              if (!player.caughtSpecies[c.fish_id]) {
                player.caughtSpecies[c.fish_id] = { maxWeight: c.weight, count: 1 };
              } else {
                player.caughtSpecies[c.fish_id].count++;
                if (c.weight > player.caughtSpecies[c.fish_id].maxWeight) {
                  player.caughtSpecies[c.fish_id].maxWeight = c.weight;
                }
              }
            }
          }

          savePlayerLocal();
          updatePlayerHUD();
          updateTensionSafeZoneUI();
        } else if (!error && !data) {
          // Пользователя еще нет в базе, регистрируем
          await supabaseClient.from('users').upsert({
            id: player.id,
            username: player.username || player.name,
            balance: player.balance,
            xp: player.xp,
            level: player.level,
            fish_caught: player.fishCaught,
            fish_sold: player.fishSold,
            total_earned: player.totalEarned,
            current_rod_id: player.rodId,
            current_line_id: player.lineId
          });
        }
      } catch (e) {
        console.warn("Не удалось загрузить пользователя из БД:", e);
      }
    }



window.supabaseClient = supabaseClient;
window.saveCatchToSupabase = saveCatchToSupabase;
window.syncUserStatsToSupabase = syncUserStatsToSupabase;
window.loadUserData = loadUserData;
