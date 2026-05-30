// deck_manager.js

async function initWorkAndDeckUI() {
  await openDB();

  // 作品一覧を読み込む（works.json）
  const worksRes = await fetch("data/works.json");
  const worksJson = await worksRes.json();

  // IndexedDB に作品一覧を保存（初回のみ）
  for (const w of worksJson.works) {
    await dbPut("works", w);
  }

  const workList = document.getElementById("work-list");
  const deckList = document.getElementById("deck-list");

  // 作品一覧を UI に反映
  const works = await dbGetAll("works");
  works.forEach(w => {
    const opt = document.createElement("option");
    opt.value = w.id;
    opt.textContent = w.name;
    workList.appendChild(opt);
  });

  // 作品選択時にデッキ一覧を更新
  workList.addEventListener("change", async () => {
    const workId = workList.value;
    await updateDeckListUI(workId);
  });

  // デッキ読み込みボタン
document.getElementById("load-deck").addEventListener("click", async () => {
  const workId = workList.value;
  const deckId = deckList.value;

  const deck = await dbGet("decks", deckId);
  if (!deck) return alert("デッキが見つかりません");

  // 作品の carddata.json を読み込む
  const cardRes = await fetch(`data/works/${workId}/carddata.json`);
  const carddata = await cardRes.json();

  // 山札構築
  await initDeckFromList(deck.data, carddata, workId);

  createAllCards();
  layoutAllZones();
});


  // 初期作品のデッキ一覧を表示
  if (works.length > 0) {
    await updateDeckListUI(works[0].id);
  }
}

async function updateDeckListUI(workId) {
  const deckList = document.getElementById("deck-list");
  deckList.innerHTML = "";

  const decks = await dbGetAll("decks");
  decks
    .filter(d => d.workId === workId)
    .forEach(d => {
      const opt = document.createElement("option");
      opt.value = d.deckId;
      opt.textContent = d.name;
      deckList.appendChild(opt);
    });
}
