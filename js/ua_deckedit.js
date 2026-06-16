import { openDB, addDeck, updateDeck, getAllDecks, getDeck } from "./db.js";

// Google Sheets → GAS の UA カード一覧 API
const UA_CARD_API = "https://script.google.com/macros/s/AKfycbyEWHiA_TCbcZ4uVx3Jzx0LgMxGx1X_1com43ffOdFouqV20R0qQokaOcoygRz0XCdNyQ/exec";

let cardData = {};   // { title: [id, id, ...] }
let deck = { name: "", work: "", cards: [] };

window.addEventListener("DOMContentLoaded", async () => {
  await openDB();

  const res = await fetch(UA_CARD_API);
  const json = await res.json();
  cardData = json.titles;

  initWorkList();
  initCardList();
  initEvents();
  updateCount();
});

// ===============================
// UI 初期化
// ===============================
function initWorkList() {
  const sel = document.getElementById("work");
  sel.innerHTML = "";

  Object.keys(cardData).forEach(title => {
    const opt = document.createElement("option");
    opt.value = title;
    opt.textContent = title;
    sel.appendChild(opt);
  });
}

function initCardList() {
  const work = document.getElementById("work").value;
  const list = document.getElementById("card-list");
  list.innerHTML = "";
  list.className = "card-grid";

  cardData[work].forEach(id => {
    const div = document.createElement("div");
    div.className = "card-item";

    div.innerHTML = `
      <div class="card-thumb" style="background-image:url('../data/img/UA/${id}.png')"></div>
      <div class="card-id">${id}</div>
    `;

    div.onclick = () => addCard(id);
    div.onmouseenter = () => showPreview(id);

    list.appendChild(div);
  });
}


function initEvents() {
  document.getElementById("work").addEventListener("change", () => {
    initCardList();
  });

  document.getElementById("save").addEventListener("click", saveDeck);
}

// ===============================
// デッキ操作
// ===============================
function addCard(id) {
  const found = deck.cards.find(c => c.id === id);

  if (found) {
    if (found.count >= 4) {
      alert("同名カードは4枚までです");
      return;
    }
    found.count++;
  } else {
    deck.cards.push({ id, count: 1 });
  }

  renderDeck();
  updateCount();
}

function renderDeck() {
  const div = document.getElementById("deck-cards");
  div.innerHTML = "";

  deck.cards.forEach(c => {
    const row = document.createElement("div");
    row.className = "deck-row";

  row.innerHTML = `
    <span class="deck-card" data-id="${c.id}">${c.id} × ${c.count}</span>
    <button class="btn" data-id="${c.id}" data-act="plus">＋</button>
    <button class="btn" data-id="${c.id}" data-act="minus">−</button>
    <button class="btn" data-id="${c.id}" data-act="del">削除</button>
  `;
  
  row.querySelector(".deck-card").onmouseenter = () => showPreview(c.id);

    div.appendChild(row);
  });

  // ボタンイベント
  div.querySelectorAll(".btn").forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.id;
      const act = btn.dataset.act;
      modifyCard(id, act);
    };
  });
}

function modifyCard(id, act) {
  const c = deck.cards.find(x => x.id === id);
  if (!c) return;

  if (act === "plus") {
    if (c.count >= 4) return;
    c.count++;
  }

  if (act === "minus") {
    c.count--;
    if (c.count <= 0) {
      deck.cards = deck.cards.filter(x => x.id !== id);
    }
  }

  if (act === "del") {
    deck.cards = deck.cards.filter(x => x.id !== id);
  }

  renderDeck();
  updateCount();
}

// ===============================
// 枚数表示
// ===============================
function updateCount() {
  const total = deck.cards.reduce((sum, c) => sum + c.count, 0);
  document.getElementById("deck-count").textContent = `${total} / 50`;
}

// ===============================
// デッキ保存
// ===============================
async function saveDeck() {
  const total = deck.cards.reduce((sum, c) => sum + c.count, 0);
  if (total !== 50) {
    alert("デッキは50枚ちょうどである必要があります");
    return;
  }

  deck.name = document.getElementById("deck-name").value;
  deck.work = document.getElementById("work").value;

  if (!deck.name) {
    alert("デッキ名を入力してください");
    return;
  }

  await addDeck(deck);

  const decks = await getAllDecks();
  const last = decks[decks.length - 1];
  localStorage.setItem("UA_LAST_DECK", last.id);

  alert("デッキを保存しました");
  location.href = "index.html";
}

function showPreview(id) {
  const preview = document.getElementById("preview-image");
  preview.style.backgroundImage = `url('../data/img/UA/${id}.png')`;
}

async function loadSavedDecks() {
  const decks = await getAllDecks();
  const sel = document.getElementById("saved-decks");
  sel.innerHTML = "";

  decks.forEach(d => {
    const opt = document.createElement("option");
    opt.value = d.id;
    opt.textContent = `${d.name}（${d.work}）`;
    sel.appendChild(opt);
  });
}

document.getElementById("load-deck").onclick = async () => {
  const id = document.getElementById("saved-decks").value;
  if (!id) return;

  const d = await getDeck(id);
  deck = JSON.parse(JSON.stringify(d)); // deep copy
  renderDeck();
  updateCount();
};
