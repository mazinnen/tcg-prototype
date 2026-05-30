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

document.getElementById("load-deck").addEventListener("click", async () => {
  const workId = workList.value;
  const deckId = deckList.value;

  const deck = await dbGet("decks", deckId);
  if (!deck) return alert("デッキが見つかりません");

  const cardRes = await fetch(`data/works/${workId}/carddata.json`);
  const carddata = await cardRes.json();

  // ★ デッキ構築（内部でリセット＋シャッフル）
  await initDeckFromList(deck.data, carddata, workId);

  // ★ カード生成
  createAllCards();
  layoutAllZones();
});
