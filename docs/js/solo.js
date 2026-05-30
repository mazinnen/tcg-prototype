// solo.js

let selectedDeckId = null;

window.addEventListener("DOMContentLoaded", async () => {
  await initWorkAndDeckUI();  // 作品一覧＋デッキ一覧の初期化
});

// デッキ読み込み
document.getElementById("load-deck").addEventListener("click", async () => {
  if (!selectedDeckId) {
    alert("デッキを選択してください");
    return;
  }

  const workId = document.getElementById("work-list").value;
  const deck = await dbGet("decks", selectedDeckId);

  const cardRes = await fetch(`data/works/${workId}/carddata.json`);
  const carddata = await cardRes.json();

  await initDeckFromList(deck.data, carddata, workId);

  createAllCards();
  layoutAllZones();
});