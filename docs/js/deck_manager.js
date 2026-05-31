// deck_manager.js — DBから作品一覧・デッキ一覧を読み込むだけの完全整理版

/* ---------------------------------------------------------
   作品一覧・デッキ一覧を UI に反映
--------------------------------------------------------- */
async function initWorkAndDeckUI() {
  const workList = document.getElementById("work-list");
  const deckList = document.getElementById("deck-list");

  // 作品一覧を取得
  const works = await dbGetAll("works");

  // UI クリア
  workList.innerHTML = "";
  deckList.innerHTML = "";

  // 作品一覧を select に追加
  works.forEach(work => {
    const opt = document.createElement("option");
    opt.value = work.id;
    opt.textContent = work.name;
    workList.appendChild(opt);
  });

  // 最初の作品を選択
  if (works.length > 0) {
    workList.value = works[0].id;
  }

  // デッキ一覧を更新
  await updateDeckListUI();
}

/* ---------------------------------------------------------
   デッキ一覧を UI に反映
--------------------------------------------------------- */
async function updateDeckListUI() {
  const deckList = document.getElementById("deck-list");
  deckList.innerHTML = "";

  const decks = await dbGetAll("decks");

  decks.forEach(deck => {
    const opt = document.createElement("option");
    opt.value = deck.id;
    opt.textContent = deck.name;
    deckList.appendChild(opt);
  });

  // 最初のデッキを選択
  if (decks.length > 0) {
    deckList.value = decks[0].id;
  }
}

/* ---------------------------------------------------------
   デッキを追加（編集画面用）
--------------------------------------------------------- */
async function addDeck(deckId, name, data) {
  await dbPut("decks", {
    id: deckId,
    name,
    data
  });

  await updateDeckListUI();
}

/* ---------------------------------------------------------
   デッキを削除（編集画面用）
--------------------------------------------------------- */
async function deleteDeck(deckId) {
  await dbDelete("decks", deckId);
  await updateDeckListUI();
}
