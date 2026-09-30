/* ==========================================================
   LUMIBOT FISHING - ATLASUI.JS
   Интерфейс и модальное окно Полевого Атласа Видов
   ========================================================== */

    /* ==========================================================
       ПОЛЕВОЙ АТЛАС ВИДОВ (КНИГА ИССЛЕДОВАТЕЛЯ)
       ========================================================== */
    const atlasModal = document.getElementById("atlasModal");
    const openAtlasBtn = document.getElementById("openAtlasBtn");
    const closeAtlasBtn = document.getElementById("closeAtlasBtn");
    const homeGoAtlasBtn = document.getElementById("homeGoAtlasBtn");
    const atlasPrevBtn = document.getElementById("atlasPrevBtn");
    const atlasNextBtn = document.getElementById("atlasNextBtn");
    const atlasTocToggleBtn = document.getElementById("atlasTocToggleBtn");

    function openAtlas() {
      if (!atlasModal) return;
      window.player = player;
      const ED = window.ENTITY_DATA;
      const totalCount = ((ED && ED.FISH_SPECIES) ? ED.FISH_SPECIES.length : 100) + ((ED && ED.BEAST_SPECIES) ? ED.BEAST_SPECIES.length : 16);
      const discoveredCount = Object.keys(player.caughtSpecies || {}).length;

      const badge = document.getElementById("atlasDiscoveredBadge");
      if (badge) badge.textContent = `${discoveredCount} / ${totalCount}`;

      window.FrameNav.open("atlasModal", () => {
        if (window.AtlasBook) {
          window.AtlasBook.renderBookPage();
        }
      });
    }

    function closeAtlas() {
      window.FrameNav.close("atlasModal");
    }

    if (openAtlasBtn) openAtlasBtn.addEventListener("click", openAtlas);
    if (closeAtlasBtn) closeAtlasBtn.addEventListener("click", closeAtlas);
    if (homeGoAtlasBtn) {
      homeGoAtlasBtn.addEventListener("click", openAtlas);
    }

    if (atlasPrevBtn) atlasPrevBtn.addEventListener("click", () => {
      if (window.AtlasBook) window.AtlasBook.prevPage();
    });
    if (atlasNextBtn) atlasNextBtn.addEventListener("click", () => {
      if (window.AtlasBook) window.AtlasBook.nextPage();
    });
    if (atlasTocToggleBtn) atlasTocToggleBtn.addEventListener("click", () => {
      if (window.AtlasBook) window.AtlasBook.toggleOverviewMode();
    });

    document.querySelectorAll("#atlasFamilyTabs .atlas-tab-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        document.querySelectorAll("#atlasFamilyTabs .atlas-tab-btn").forEach(b => b.classList.remove("active"));
        e.currentTarget.classList.add("active");
        if (window.AtlasBook) window.AtlasBook.setFamilyFilter(e.currentTarget.dataset.family);
      });
    });

    // Закрытие по клику на фон модального окна (только при клике на сам оверлей)
    [livewellModal, shopModal, homeModal, atlasModal, settingsModal, casinoModal].forEach(modal => {
      if (!modal) return;
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          window.FrameNav.close(modal.id);
        }
      });
    });



window.openAtlas = openAtlas;
