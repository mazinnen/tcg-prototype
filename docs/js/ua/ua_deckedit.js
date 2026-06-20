import { openDB, addDeck, updateDeck, getAllDecks, getDeck, deleteDeck } from "../core/db.js";

let deckCards = [];
let editingDeckId = null;
let titles = {};      // GAS の data.titles
let filteredWork = "";

const GAS_URL = "https://script.google.com/macros/s/AKfycbyEWHiA_TCbcZ4uVx3Jzx0LgMxGx1X_1com43ffOdFouqV20R0qQokaOcoygRz0XCdNyQ/exec";

// ---------- GAS からカード一覧取得 ----------
async function loadTitles() {
  const res = await fetch(GAS_URL);
  const data = await res.json();
  titles = data.titles || {};
  renderWorkSelect();
  renderCardList();
}

// ---------- 作品セレクト（GAS のキーそのまま） ----------
function renderWorkSelect() {
  const sel = document.getElementById("work");
  sel.innerHTML = "";

  const optAll = document.createElement("option");
  optAll.value = "";
  optAll.textContent = "すべて";
  sel.appendChild(optAll);

  Object.keys(titles).forEach(work => {
    const opt = document.createElement("option");
    opt.value = work;
    opt.textContent = work;
    sel.appendChild(opt);
  });
}

// ---------- カード一覧表示 ----------
function renderCardList() {
  const zone = document.getElementById("card-list");
  zone.innerHTML = "";

  Object.keys(titles).forEach(work => {
    if (filteredWork && filteredWork !== work) return;

    const title = document.createElement("div");
    title.textContent = `【${work}】`;
    title.style.fontWeight = "bold";
    title.style.margin = "6px 0";
    zone.appendChild(title);

    titles[work].forEach(id => {
      const row = document.createElement("div");
      row.className = "card-item";

      const thumb = document.createElement("div");
      thumb.className = "card-thumb";
      thumb.style.backgroundImage = `url('../data/img/UA/${id}.png')`;

      const label = document.createElement("div");
      label.textContent = id;

      row.appendChild(thumb);
      row.appendChild(label);

      row.onclick = () => addCard(id);
      row.onmouseenter = () => showPreview(id);

      zone.appendChild(row);
    });
  });
}

// ---------- デッキにカード追加 ----------
function addCard(id) {
  const found = deckCards.find(c => c.id === id);
  if (found) found.count++;
  else deckCards.push({ id, count: 1 });
  renderDeck();
  updateDeckCount();
}

// ---------- デッキ内容表示 ----------
function renderDeck() {
  const zone = document.getElementById("deck-cards");
  zone.innerHTML = "";

  deckCards.forEach(card => {
    const row = document.createElement("div");
    row.className = "deck-card-item";

    const thumb = document.createElement("div");
    thumb.className = "card-thumb";
    thumb.style.backgroundImage = `url('../data/img/UA/${card.id}.png')`;
    thumb.onmouseenter = () => showPreview(card.id);

    const label = document.createElement("div");
    label.textContent = card.id;

    const count = document.createElement("div");
    count.textContent = `${card.count}枚`;

    // ▼ 追加：＋ボタン
    const plus = document.createElement("button");
    plus.textContent = "+";
    plus.onclick = () => {
      if (card.count < 4) {        // 4枚制限
        card.count++;
        renderDeck();
        updateDeckCount();
      }
    };

    const minus = document.createElement("button");
    minus.textContent = "-";
    minus.onclick = () => {
      card.count--;
      if (card.count <= 0) {
        deckCards = deckCards.filter(c => c !== card);
      }
      renderDeck();
      updateDeckCount();
    };

    row.appendChild(thumb);
    row.appendChild(label);
    row.appendChild(count);
    row.appendChild(plus);   // ← 追加
    row.appendChild(minus);

    zone.appendChild(row);
  });
}

// ---------- 拡大表示 ----------
function showPreview(id) {
  const prev = document.getElementById("preview");
  prev.style.backgroundImage = `url('../data/img/UA/${id}.png')`;
}

// ---------- 保存済みデッキ一覧 ----------
async function loadSavedDecks() {
  await openDB();
  const decks = await getAllDecks();

  const sel = document.getElementById("saved-decks");
  sel.innerHTML = "";

  decks.forEach(d => {
    const opt = document.createElement("option");
    opt.value = d.id;
    opt.textContent = d.name;
    sel.appendChild(opt);
  });
}

// ---------- デッキ保存 ----------
document.getElementById("save-deck").onclick = async () => {
  await openDB();

  const name = document.getElementById("deck-name").value.trim();
  const work = document.getElementById("work").value;

  if (!name) {
    alert("デッキ名を入力してください");
    return;
  }

  const deckData = { name, work, cards: deckCards };

  if (editingDeckId) {
    deckData.id = editingDeckId;
    await updateDeck(deckData);
  } else {
    const newId = await addDeck(deckData);
    editingDeckId = newId;
  }

  alert("保存しました");
  loadSavedDecks();
};

// ---------- デッキ読み込み ----------
document.getElementById("load-deck").onclick = async () => {
  const id = Number(document.getElementById("saved-decks").value);
  if (!id) return;

  const d = await getDeck(id);
  if (!d) return;

  editingDeckId = id;
  deckCards = JSON.parse(JSON.stringify(d.cards || []));

  document.getElementById("deck-name").value = d.name || "";
  document.getElementById("work").value = d.work || "";

  filteredWork = d.work || "";
  renderCardList();
  renderDeck();
};

// ---------- デッキ削除 ----------
document.getElementById("delete-deck").onclick = async () => {
  const id = Number(document.getElementById("saved-decks").value);
  if (!id) return;
  if (!confirm("本当に削除しますか？")) return;

  await deleteDeck(id);
  alert("削除しました");

  editingDeckId = null;
  deckCards = [];
  renderDeck();
  loadSavedDecks();
};

// ---------- 作品フィルタ ----------
document.getElementById("work").onchange = () => {
  filteredWork = document.getElementById("work").value;
  renderCardList();
};

// ---------- 初期化 ----------
loadTitles();
loadSavedDecks();

function updateDeckCount() {
  const total = deckCards.reduce((sum, c) => sum + c.count, 0);
  document.getElementById("deck-count").textContent = `${total} / 50`;
}
