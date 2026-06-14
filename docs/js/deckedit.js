import {
  addDeck, updateDeck, deleteDeck,
  getDeck, getDecksByWork
} from "./deck_manager.js";

let works = [];
let cards = {};
let currentDeckId = null;
let filteredCards = [];

window.addEventListener("DOMContentLoaded", async () => {
  await openDB();
  works = await loadWorks();
  cards = await loadCards();

  initWorkSelector(works);
  initEvents();
});

// ----------------------------
// UI 初期化
// ----------------------------
function initWorkSelector() {
  const sel = document.getElementById("work-select");
  sel.innerHTML = "";

  works.forEach(w => {
    const opt = document.createElement("option");
    opt.value = w.id;
    opt.textContent = w.name;
    sel.appendChild(opt);
  });

  sel.addEventListener("change", updateDeckList);
  updateDeckList();
  renderCardList();
  renderTerritoryList();
}

function renderTerritoryList() {
  const workId = document.getElementById("work-select").value;
  const sel = document.getElementById("territory-select");

  // type がテリトリーのカードだけ抽出
  const territories = Object.entries(cards)
    .filter(([id, data]) => id.startsWith(workId))
    .filter(([id, data]) => data.type === "テリトリー");

  sel.innerHTML = "";

  territories.forEach(([id, data]) => {
    const opt = document.createElement("option");
    opt.value = id;
    opt.textContent = `${id} : ${data.name}`;
    sel.appendChild(opt);
  });
}

function renderCardList() {
  const workId = document.getElementById("work-select").value;
  const search = document.getElementById("card-search").value.trim().toLowerCase();
  const panel = document.getElementById("card-list-panel");

  filteredCards = Object.entries(cards)
    .filter(([id, data]) => id.startsWith(workId)) // 作品フィルタ
    .filter(([id, data]) => data.type !== "テリトリー") // ★ テリトリー除外
    .filter(([id, data]) =>
      id.toLowerCase().includes(search) ||
      data.name.toLowerCase().includes(search)
    );

  panel.innerHTML = "";

  filteredCards.forEach(([id, data]) => {
    const div = document.createElement("div");
    div.className = "card-list-item";
    div.style.cursor = "pointer";
    div.style.padding = "4px";
    div.style.borderBottom = "1px solid #eee";

    div.textContent = `${id} : ${data.name}`;

    div.addEventListener("click", () => {
      addCardFromList(id);
    });

    panel.appendChild(div);
  });
}

function addCardFromList(cardId) {
  const deck = collectDeckFromUI();

  // 新形式 or 旧形式どちらでも動く
  const cardList = deck.data?.cards ?? deck.cards;

  const existing = cardList.find(c => c.id === cardId);

  if (existing) {
    existing.count += 1;
  } else {
    cardList.push({ id: cardId, count: 1 });
  }

  renderCardTable(cardList);
}


async function updateDeckList() {
  const workId = document.getElementById("work-select").value;
  const deckSel = document.getElementById("deck-list");

  const deckList = await getDecksByWork(workId);

  deckSel.innerHTML = "";
  deckList.forEach(d => {
    const opt = document.createElement("option");
    opt.value = d.deckId;
    opt.textContent = d.name;
    deckSel.appendChild(opt);
  });

  deckSel.addEventListener("change", loadDeckToUI);

  if (deckList.length > 0) {
    currentDeckId = deckList[0].deckId;
    loadDeckToUI();
  } else {
    clearDeckUI();
  }
}

// ----------------------------
// デッキ読み込み
// ----------------------------
async function loadDeckToUI() {
  const deckId = document.getElementById("deck-list").value;
  currentDeckId = deckId;

  const deck = await getDeck(deckId);
  if (!deck) return;

  // 新形式 or 旧形式どちらでも動くようにする
  const data = deck.data ?? deck;

  document.getElementById("deck-name").value = deck.name;
  document.getElementById("territory-select").value = data.territory || "";

  renderCardTable(data.cards || []);
}

// ----------------------------
// カード一覧表示
// ----------------------------
function renderCardTable(cardList) {
  const tbody = document.getElementById("card-table");
  tbody.innerHTML = "";

  cardList.forEach(c => {
    const tr = document.createElement("tr");

    const name = cards[c.id]?.name || "(不明)";

    tr.innerHTML = `
      <td>${c.id}</td>
      <td>${name}</td>
      <td><input type="number" value="${c.count}" min="1" data-id="${c.id}" class="count-input"></td>
      <td><button data-id="${c.id}" class="delete-card-btn">削除</button></td>
    `;

    tbody.appendChild(tr);
  });

  // 枚数変更
  document.querySelectorAll(".count-input").forEach(inp => {
    inp.addEventListener("change", () => {
      const id = inp.dataset.id;
      const deck = collectDeckFromUI();
      const card = deck.cards.find(x => x.id === id);
      if (card) card.count = Number(inp.value);
    });
  });

  // 削除
  document.querySelectorAll(".delete-card-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const deck = collectDeckFromUI();
      deck.cards = deck.cards.filter(x => x.id !== id);
      renderCardTable(deck.cards);
    });
  });
}

// ----------------------------
// デッキ UI → データ構造
// ----------------------------
function collectDeckFromUI() {
  const rows = document.querySelectorAll("#card-table tr");

  const cards = [...rows].map(r => {
    const id = r.children[0].textContent;
    const count = Number(r.querySelector(".count-input").value);
    return { id, count };
  });

  return {
    name: document.getElementById("deck-name").value,
    work: document.getElementById("work-select").value,
    data: {
      territory: document.getElementById("territory-select").value,
      cards
    }
  };
}

// ----------------------------
// イベント
// ----------------------------
function initEvents() {
  document.getElementById("new-deck-btn").addEventListener("click", async () => {
    const work = document.getElementById("work-select").value;
    const deckId = await addDeck({
      work,
      name: "新規デッキ",
      data: {
        territory: "",
        cards: []
      }
    });

    currentDeckId = deckId;
    updateDeckList();
  });

  document.getElementById("delete-deck-btn").addEventListener("click", async () => {
    if (!currentDeckId) return;
    await deleteDeck(currentDeckId);
    currentDeckId = null;
    updateDeckList();
  });

  // ★ add-card-btn は削除したのでイベントも削除

  document.getElementById("save-deck-btn").addEventListener("click", async () => {
    const deck = collectDeckFromUI();

    if (currentDeckId) {
      await updateDeck(currentDeckId, deck);
    } else {
      currentDeckId = await addDeck(deck);
    }

    alert("保存しました");
    updateDeckList();
  });

  document.getElementById("card-search").addEventListener("input", renderCardList);
}

// ----------------------------
// デッキ UI 初期化
// ----------------------------
function clearDeckUI() {
  document.getElementById("deck-name").value = "";
  document.getElementById("territory-select").value = "";
  renderCardTable([]);
}
