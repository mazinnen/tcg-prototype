// ===============================
// BDB デッキ編集（最終完成版）
// ===============================

import { createCard } from "./bdb_core.js";
import {
  openBDB,
  addBDBDeck,
  updateBDBDeck,
  getAllBDBDecks,
  getBDBDeck,
  deleteBDBDeck
} from "./bdb_db.js";

const BDB_GAS_URL = "https://script.google.com/macros/s/AKfycbyYl7wJ40jm8WfmhbF2O8Bmhk46ZwmaRzLaUVmIGryH-B1kDHha4JL3XH2i8bXkbn7R/exec";

let titles = {};
let territories = {};
let carddata = {};

let deckCards = []; 
let editingId = null;

// ------------------------------
// 初期化
// ------------------------------
window.addEventListener("DOMContentLoaded", async () => {
  await openBDB();
  await loadCardData();
  await loadSavedDecks();

  document.getElementById("work-select").onchange = renderCardList;
  document.getElementById("territory-select").onchange = () => {};

  document.getElementById("save-deck").onclick = saveDeck;
  document.getElementById("load-deck").onclick = loadDeck;
  document.getElementById("delete-deck").onclick = deleteDeckData;
});

// ------------------------------
// GAS からカードデータ取得
// ------------------------------
async function loadCardData() {
  try {
    const res = await fetch(BDB_GAS_URL);
    const data = await res.json();

    titles = data.titles;
    territories = data.territories;
    carddata = data.carddata;

    renderWorkSelect();
    renderTerritorySelect();
    renderCardList();
  } catch (e) {
    console.error("カードデータ取得失敗", e);
  }
}

// ------------------------------
// 作品セレクト
// ------------------------------
function renderWorkSelect() {
  const sel = document.getElementById("work-select");
  sel.innerHTML = "";

  Object.keys(titles).forEach(work => {
    const opt = document.createElement("option");
    opt.value = work;
    opt.textContent = work;
    sel.appendChild(opt);
  });
}

// ------------------------------
// テリトリーセレクト
// ------------------------------
function renderTerritorySelect(work) {
  const sel = document.getElementById("territory-select");
  sel.innerHTML = "";

  // ★ work が指定されている場合 → その作品だけ
  const targetWorks = work ? [work] : Object.keys(territories);

  targetWorks.forEach(w => {
    territories[w].forEach(id => {
    const opt = document.createElement("option");
    opt.value = id;
    opt.textContent = `${w} / ${id}`;
    sel.appendChild(opt);
    });
  });
}

// ------------------------------
// カード一覧
// ------------------------------
function renderCardList() {
  const zone = document.getElementById("card-list");
  zone.innerHTML = "";

  const work = document.getElementById("work-select").value;

  titles[work].forEach(id => {
    const info = carddata[id];

    // ★ テリトリーはカード一覧に出さない
    if (info.type === "テリトリー") return;

    const row = document.createElement("div");
    row.className = "card-row";

    const thumb = document.createElement("div");
    thumb.className = "thumb";
    thumb.style.backgroundImage =
      `url('../data/img/BDB/${info.title}/${id}.png')`;

    const label = document.createElement("div");
    label.textContent = `${id} / ${info.name}`;

    row.appendChild(thumb);
    row.appendChild(label);

    row.onclick = () => addCard(id);

    zone.appendChild(row);
  });

  renderTerritorySelect(work);
}

// ------------------------------
// デッキにカード追加
// ------------------------------
function addCard(id) {
  const info = carddata[id];

  // ★ テリトリーはデッキに入れない
  if (info.type === "テリトリー") return;

  const found = deckCards.find(c => c.id === id);
  if (found) {
    found.count++;
  } else {
    deckCards.push({ id, count: 1 });
  }
  renderDeck();
}

// ------------------------------
// デッキ表示
// ------------------------------
function renderDeck() {
  const zone = document.getElementById("deck-cards");
  zone.innerHTML = "";

  deckCards.forEach(card => {
    const info = carddata[card.id];

    const row = document.createElement("div");
    row.className = "deck-row";

    const thumb = document.createElement("div");
    thumb.className = "thumb";
    thumb.style.backgroundImage =
      `url('../data/img/BDB/${info.title}/${card.id}.png')`;

    const label = document.createElement("div");
    label.textContent = `${card.id} / ${info.name}`;

    const count = document.createElement("div");
    count.textContent = `${card.count}枚`;

    const plus = document.createElement("button");
    plus.textContent = "+";
    plus.onclick = () => {
      card.count++;
      renderDeck();
    };

    const minus = document.createElement("button");
    minus.textContent = "-";
    minus.onclick = () => {
      card.count--;
      if (card.count <= 0) {
        deckCards = deckCards.filter(c => c !== card);
      }
      renderDeck();
    };

    row.appendChild(thumb);
    row.appendChild(label);
    row.appendChild(count);
    row.appendChild(plus);
    row.appendChild(minus);

    zone.appendChild(row);
  });

  document.getElementById("deck-count").textContent =
    deckCards.reduce((s, c) => s + c.count, 0);
}

// ------------------------------
// デッキ保存
// ------------------------------
async function saveDeck() {
  const name = document.getElementById("deck-name").value;
  const work = document.getElementById("work-select").value;
  const territory = document.getElementById("territory-select").value;

  const total = deckCards.reduce((s, c) => s + c.count, 0);
  if (total < 40 || total > 50) {
    if (!confirm(`現在 ${total} 枚です。40〜50 枚の範囲外ですが保存しますか？`)) {
      return;
    }
  }

  // ★ テリトリーは cards に入れない
  const deck = { name, work, territory, cards: deckCards };

  if (editingId) {
    deck.id = editingId;
    await updateBDBDeck(deck);
  } else {
    editingId = await addBDBDeck(deck);
  }

  alert("保存しました");
  loadSavedDecks();
}

// ------------------------------
// デッキ読み込み
// ------------------------------
async function loadDeck() {
  const id = Number(document.getElementById("saved-decks").value);
  if (!id) return;

  const d = await getBDBDeck(id);
  editingId = id;
  deckCards = JSON.parse(JSON.stringify(d.cards));

  document.getElementById("deck-name").value = d.name;
  document.getElementById("work-select").value = d.work;
  document.getElementById("territory-select").value = d.territory;

  renderCardList();
  renderDeck();
}

// ------------------------------
// デッキ削除
// ------------------------------
async function deleteDeckData() {
  const id = Number(document.getElementById("saved-decks").value);
  if (!id) return;

  await deleteBDBDeck(id);
  alert("削除しました");

  editingId = null;
  deckCards = [];
  renderDeck();
  loadSavedDecks();
}

// ------------------------------
// 保存済みデッキ一覧
// ------------------------------
async function loadSavedDecks() {
  const decks = await getAllBDBDecks();
  const sel = document.getElementById("saved-decks");
  sel.innerHTML = "";

  decks.forEach(d => {
    const opt = document.createElement("option");
    opt.value = d.id;
    opt.textContent = d.name;
    sel.appendChild(opt);
  });
}
