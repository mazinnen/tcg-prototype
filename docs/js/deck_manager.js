// deck_manager.js — デッキデータ管理（IndexedDB）

/* ---------------------------------------------------------
   IndexedDB 基本操作
--------------------------------------------------------- */
async function dbGetAll(store) {
  return new Promise(resolve => {
    const req = db.transaction([store], "readonly").objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result);
  });
}

async function dbGet(store, key) {
  return new Promise(resolve => {
    const req = db.transaction([store], "readonly").objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result);
  });
}

async function dbPut(store, value) {
  return new Promise(resolve => {
    const req = db.transaction([store], "readwrite").objectStore(store).put(value);
    req.onsuccess = () => resolve();
  });
}

async function dbDelete(store, key) {
  return new Promise(resolve => {
    const req = db.transaction([store], "readwrite").objectStore(store).delete(key);
    req.onsuccess = () => resolve();
  });
}

/* ---------------------------------------------------------
   デッキ追加
--------------------------------------------------------- */
async function addDeck(workId, name, data) {
  const deckId = crypto.randomUUID();
  await dbPut("decks", { deckId, workId, name, data });
}

/* ---------------------------------------------------------
   作品一覧＋デッキ一覧の初期化
--------------------------------------------------------- */
async function initWorkAndDeckUI() {
  const workList = document.getElementById("work-list");

  const works = await dbGetAll("works");

  workList.innerHTML = "";
  works.forEach(w => {
    const opt = document.createElement("option");
    opt.value = w.id;
    opt.textContent = w.name;
    workList.appendChild(opt);
  });

  if (works.length > 0) {
    updateDeckListUI(works[0].id);
  }

  workList.addEventListener("change", () => {
    updateDeckListUI(workList.value);
  });
}

/* ---------------------------------------------------------
   デッキ一覧（select 用 option を生成）
--------------------------------------------------------- */
async function updateDeckListUI(workId) {
  const deckList = document.getElementById("deck-list");
  deckList.innerHTML = "";

  const decks = await dbGetAll("decks");
  const filtered = decks.filter(d => d.workId === workId);

  filtered.forEach(d => {
    const opt = document.createElement("option");
    opt.value = d.deckId;
    opt.textContent = d.name;
    deckList.appendChild(opt);
  });

  // 初期選択（solo.js が拾えるように）
  if (filtered.length > 0) {
    deckList.value = filtered[0].deckId;
  }
}
