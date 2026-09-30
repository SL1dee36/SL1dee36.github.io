/* ==========================================================
   LUMIBOT FISHING - TELEGRAM.JS
   Интеграция с Telegram WebApp SDK, тема и тактильный отклик (haptic)
   ========================================================== */

    // Telegram WebApp SDK интеграция
    const tg = window.Telegram?.WebApp;
    if (tg) {
      try {
        tg.ready();
        tg.expand();
        if (tg.setHeaderColor) tg.setHeaderColor('#07131e');
        if (tg.setBackgroundColor) tg.setBackgroundColor('#07131e');
      } catch (e) {
        console.error(e);
      }
    }

    // Извлечение данных пользователя и чата
    const urlParams = new URLSearchParams(window.location.search);
    const chatIdParam = urlParams.get('chat_id') || (tg?.initDataUnsafe?.start_param ? tg.initDataUnsafe.start_param.replace('chat_', '') : null);
    const currentChatId = chatIdParam ? parseInt(chatIdParam, 10) : null;

    const tgUser = tg?.initDataUnsafe?.user || {
      id: 99999901,
      first_name: "Гость",
      username: "fisherman_guest"
    };

    // Каталог удочек и спиннингов


    function triggerHaptic(type) {
      if (!tg?.HapticFeedback) return;
      try {
        // HapticFeedback доступен только в Telegram WebApp 6.1+
        if (typeof tg.isVersionAtLeast === 'function') {
          if (!tg.isVersionAtLeast('6.1')) return;
        } else if (tg.version) {
          const parts = tg.version.toString().split('.').map(Number);
          const major = parts[0] || 0;
          const minor = parts[1] || 0;
          if (major < 6 || (major === 6 && minor < 1)) return;
        } else {
          return;
        }

        if (type === 'light' || type === 'medium' || type === 'heavy') {
          tg.HapticFeedback.impactOccurred(type);
        } else if (type === 'success' || type === 'error' || type === 'warning') {
          tg.HapticFeedback.notificationOccurred(type);
        }
      } catch (e) {
        // Игнорируем в средах без поддержки хаптики
      }
    }



window.tg = tg;
window.currentChatId = currentChatId;
window.tgUser = tgUser;
window.triggerHaptic = triggerHaptic;
