// main.js（v12）
window.addEventListener("DOMContentLoaded", () => {
  initDeck();
  initTerritory();
  createAllCards();

  layoutAllZones();
  setupDraw();

  setupStackDialog();
  setupDeckPeekDialog();

  autoScale();
});

window.addEventListener("resize", autoScale);
