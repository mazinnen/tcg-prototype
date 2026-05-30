// main.js

window.addEventListener("DOMContentLoaded", async () => {
  await initWorkAndDeckUI();   // ★ 作品・デッキ選択 UI

  initTerritory();
  setupDraw();
  setupStackDialog();
  setupDeckPeekDialog();

  autoScale();
});

window.addEventListener("resize", autoScale);
