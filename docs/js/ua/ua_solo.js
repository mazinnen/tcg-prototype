import {
  createCard,
  flipCard,
  renderStack,
  renderRow,
  renderRaidRow,
  getCardUid
} from "./ua_core.js";

import { openDB, getAllDecks, getDeck } from "../core/db.js";

let deckStack = [];
let hand = [];
let front = [[], [], [], []];
let energy = [[], [], [], []];
let life = [];
let ap = [];
let out = [];
let remove = [];

let dragFrom = null;

// peek ダイアログ状態
let currentPeek = null;

window.addEventListener("DOMContentLoaded", async () => {
  await openDB();
  await loadDeckList();
  setupDragAndDrop();
  setupLifeFlip();
  setupDeckPeek();
  setupPreviewHover();
  setupOutListDialog();
  updateDeckCountDisplay();
});

// デッキ一覧
async function loadDeckList() {
  const decks = await getAllDecks();
  const sel = document.getElementById("deck-list");
  sel.innerHTML = "";

  decks.forEach(d => {
    const opt = document.createElement("option");
    opt.value = d.id;
    opt.textContent = d.name;
    sel.appendChild(opt);
  });
}

// デッキ読み込み
document.getElementById("load-deck").onclick = async () => {
  const id = Number(document.getElementById("deck-list").value);
  if (!id) return;

  const d = await getDeck(id);
  if (!d || !d.cards) return;

  const deck = expandDeck(d.cards);
  startGame(deck);
};

// デッキ展開（uid 付与）
function expandDeck(cards) {
  const arr = [];
  let uidCounter = 0;

  cards.forEach(c => {
    for (let i = 0; i < c.count; i++) {
      arr.push({
        uid: "c" + (uidCounter++),
        id: c.id,
        face: "back",
        rotate: 0
      });
    }
  });

  return arr;
}

// ゲーム開始
function startGame(deck) {
  deckStack = shuffle([...deck]);

  hand = deckStack.splice(0, 7).map(c => ({ ...c, face: "front" }));

  ap = [
    { uid: "ap1", id: "UA_BACK", face: "back", rotate: 0 },
    { uid: "ap2", id: "UA_BACK", face: "back", rotate: 0 },
    { uid: "ap3", id: "UA_BACK", face: "back", rotate: 0 }
  ];

  front = [[], [], [], []];
  energy = [[], [], [], []];

  out = [];
  remove = [];

  life = deckStack.splice(0, 7).map(c => ({ ...c, face: "back" }));

  renderAll();
}

// シャッフル
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// 描画
function renderAll() {
  renderStack("ua-deck", deckStack);
  renderStack("ua-out", out.map(c => ({ ...c, face: "front" })));
  renderStack("ua-remove", remove.map(c => ({ ...c, face: "front" })));

  renderLife();

  renderRow("ua-hand", hand.map(c => ({ ...c, face: "front" })));

  renderRaidRow("front-line", front);
  renderRaidRow("energy-line", energy);

  renderRow("ua-ap", ap);

  setupPreviewHover();
  updateDeckCountDisplay();
}

// 山札残り枚数表示
function updateDeckCountDisplay() {
  const el = document.getElementById("ua-deck-count");
  if (!el) return;
  el.textContent = `残り ${deckStack.length} 枚`;
}

// ライフ
function renderLife() {
  const zone = document.getElementById("ua-life");
  zone.innerHTML = "";

  life.forEach((c, i) => {
    const card = createCard(c);
    card.style.position = "absolute";
    card.style.left = `${i * 20}px`;
    zone.appendChild(card);
  });
}

// DnD
function setupDragAndDrop() {
  document.addEventListener("dragstart", e => {
    const cardEl = e.target.closest(".card");
    if (!cardEl) return;

    const uid = cardEl.dataset.uid;
    if (!uid) return;

    if (cardEl.closest(".peek-dialog")) {
      dragFrom = "peek";
    } else {
      dragFrom = findArea(uid);
    }

    e.dataTransfer.setData("text/plain", uid);
    e.dataTransfer.effectAllowed = "move";
  });

  [
    "ua-hand",
    "front-line",
    "energy-line",
    "ua-out",
    "ua-remove",
    "ua-ap",
    "ua-deck"
  ].forEach(zoneId => {
    const zone = document.getElementById(zoneId);
    zone.addEventListener("dragover", e => e.preventDefault());
    zone.addEventListener("drop", e => {
      e.preventDefault();
      const uid = e.dataTransfer.getData("text/plain");

      if (dragFrom === "deck" && zoneId === "ua-hand") {
        drawCardToHand();
      } else if (dragFrom === "peek") {
        handlePeekDrop(uid, zoneId, e);   // ★ ここで削除する
      } else {
        moveCard(uid, dragFrom, zoneId, e);
      }

      dragFrom = null;
    });
  });
}

// ドロー
function drawCardToHand() {
  if (deckStack.length === 0) return;

  const top = deckStack.shift();
  top.face = "front";
  hand.push(top);

  renderAll();
}

// カード移動（レイド対応）
function moveCard(uid, from, zoneId, event) {
  const to = zoneToArea(zoneId);
  if (!from || !to) return;

  const card = removeFromArea(uid, from);
  if (!card) return;

  if (to === "deck") {
    card.face = "back";
    deckStack.unshift(card);
    renderAll();
    return;
  }

  if (to === "front" || to === "energy") {
    const slots = to === "front" ? front : energy;
    const zone = document.getElementById(zoneId);
    const rect = zone.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const slotWidth = rect.width / 4;
    const slotIndex = Math.floor(x / slotWidth);

    if (slots[slotIndex].length >= 2) {
      addToArea(card, from);
      return;
    }

    card.face = "front";
    slots[slotIndex].push(card);
    renderAll();
    return;
  }

  addToArea(card, to);
  renderAll();
}

// peek から他ゾーンへ移動
function handlePeekDrop(uid, zoneId, event) {
  const to = zoneToArea(zoneId);
  if (!to || to === "deck") return;

  // ★ deckStack から正しいカードを取り出す
  const idx = deckStack.findIndex(c => c.uid === uid);
  if (idx < 0) return;

  const card = deckStack.splice(idx, 1)[0];  // ← これが重要（正しい card）

  // ★ peek ダイアログ側からも削除
  if (currentPeek) {
    currentPeek.peekCards = currentPeek.peekCards.filter(c => c.uid !== uid);
    currentPeek.render();
  }

  // ★ フロント/エナジーライン（レイド対応）
  if (to === "front" || to === "energy") {
    const slots = to === "front" ? front : energy;
    const zone = document.getElementById(zoneId);
    const rect = zone.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const slotWidth = rect.width / 4;
    const slotIndex = Math.floor(x / slotWidth);

    if (slots[slotIndex].length >= 2) {
      // スロット満杯 → 山札に戻す
      deckStack.unshift(card);
      if (currentPeek) currentPeek.render();
      renderAll();
      return;
    }

    // ★ peek から移動したカードは必ず表向き
    card.face = "front";
    slots[slotIndex].push(card);
    renderAll();
    return;
  }

  // ★ 手札・場外・除外など通常ゾーン
  card.face = "front";
  addToArea(card, to);
  renderAll();
}

// 移動元から削除
function removeFromArea(uid, area) {
  if (area === "front") {
    for (let i = 0; i < 4; i++) {
      const idx = front[i].findIndex(c => c.uid === uid);
      if (idx >= 0) return front[i].splice(idx, 1)[0];
    }
    return null;
  }

  if (area === "energy") {
    for (let i = 0; i < 4; i++) {
      const idx = energy[i].findIndex(c => c.uid === uid);
      if (idx >= 0) return energy[i].splice(idx, 1)[0];
    }
    return null;
  }

  const arr = getAreaArray(area);
  const idx = arr.findIndex(c => c.uid === uid);
  if (idx >= 0) return arr.splice(idx, 1)[0];

  return null;
}

// 移動先に追加
function addToArea(card, area) {
  if (area === "front" || area === "energy") return;
  getAreaArray(area).push(card);
}

// エリア配列取得
function getAreaArray(area) {
  return {
    hand,
    out,
    remove,
    life,
    ap,
    deck: deckStack
  }[area];
}

// エリア判定
function findArea(uid) {
  if (hand.some(c => c.uid === uid)) return "hand";
  if (front.some(slot => slot.some(c => c.uid === uid))) return "front";
  if (energy.some(slot => slot.some(c => c.uid === uid))) return "energy";
  if (out.some(c => c.uid === uid)) return "out";
  if (remove.some(c => c.uid === uid)) return "remove";
  if (life.some(c => c.uid === uid)) return "life";
  if (ap.some(c => c.uid === uid)) return "ap";
  if (deckStack.some(c => c.uid === uid)) return "deck";
  return null;
}

function zoneToArea(zoneId) {
  return {
    "ua-hand": "hand",
    "front-line": "front",
    "energy-line": "energy",
    "ua-out": "out",
    "ua-remove": "remove",
    "ua-ap": "ap",
    "ua-deck": "deck"
  }[zoneId];
}

// ライフ反転（左クリック）
function setupLifeFlip() {
  document.getElementById("ua-life").addEventListener("click", e => {
    const card = e.target.closest(".card");
    if (!card) return;

    const uid = card.dataset.uid;
    const obj = life.find(c => c.uid === uid);
    if (!obj) return;

    obj.face = obj.face === "back" ? "front" : "back";
    flipCard(card);
  });

  // ライフ右クリックで裏表のみ
  document.getElementById("ua-life").addEventListener("contextmenu", e => {
    const card = e.target.closest(".card");
    if (!card) return;

    e.preventDefault();

    const uid = card.dataset.uid;
    const obj = life.find(c => c.uid === uid);
    if (!obj) return;

    obj.face = obj.face === "back" ? "front" : "back";
    flipCard(card);
  });
}

// 山札 peek 起動
function setupDeckPeek() {
  document.addEventListener("contextmenu", e => {
    if (!e.target.closest("#ua-deck")) return;

    e.preventDefault();

    const n = parseInt(prompt("何枚見ますか？"), 10);
    if (!n || n <= 0) return;

    openPeekDialog(deckStack.slice(0, n));
  });
}

// peek ダイアログ（中央固定・並び替え・上/下戻し）
function openPeekDialog(cards) {
  const dlg = document.createElement("div");
  dlg.className = "peek-dialog";

  // 中央固定
  dlg.style.position = "fixed";
  dlg.style.top = "50%";
  dlg.style.left = "50%";
  dlg.style.transform = "translate(-50%, -50%)";
  dlg.style.background = "#222";
  dlg.style.padding = "12px";
  dlg.style.border = "2px solid #fff";
  dlg.style.zIndex = "9999";

  // 並び替え用
  let peekCards = [...cards];

  // ====== ボタン ======
  const btnTop = document.createElement("button");
  btnTop.textContent = "上に戻す";
  btnTop.onclick = () => {
    deckStack = [...peekCards, ...deckStack.slice(cards.length)];
    dlg.remove();
    currentPeek = null;
    renderAll();
  };

  const btnBottom = document.createElement("button");
  btnBottom.textContent = "下に戻す";
  btnBottom.onclick = () => {
    deckStack = [...deckStack.slice(cards.length), ...peekCards];
    dlg.remove();
    currentPeek = null;
    renderAll();
  };

  const btnClose = document.createElement("button");
  btnClose.textContent = "閉じる";
  btnClose.onclick = () => {
    dlg.remove();
    currentPeek = null;
  };

  dlg.appendChild(btnTop);
  dlg.appendChild(btnBottom);
  dlg.appendChild(btnClose);

  // ====== カードリスト ======
  const list = document.createElement("div");
  list.className = "peek-list";
  list.style.display = "flex";
  list.style.gap = "8px";
  list.style.marginTop = "10px";
  dlg.appendChild(list);

  let dragIndex = null;

  function renderPeekList() {
    list.innerHTML = "";

    peekCards.forEach((c, index) => {
      // ★ createCard を使わない（DnD が安定する）
      const cardEl = document.createElement("div");
      cardEl.className = "card";
      cardEl.style.width = "80px";
      cardEl.style.height = "112px";
      cardEl.style.backgroundImage = `url('../data/img/UA/${c.id}.png')`;
      cardEl.style.backgroundSize = "cover";
      cardEl.draggable = true;

      // D&D 並び替え
      cardEl.addEventListener("dragstart", e => {
        dragFrom = "peek"; // ★ これが確実に保持される
        dragIndex = index;
        e.dataTransfer.effectAllowed = "move";
      });

      cardEl.addEventListener("dragover", e => e.preventDefault());

      cardEl.addEventListener("drop", e => {
        e.preventDefault();
        if (dragIndex === null) return;

        const moved = peekCards.splice(dragIndex, 1)[0];
        peekCards.splice(index, 0, moved);

        dragIndex = null;
        renderPeekList();
      });

      list.appendChild(cardEl);
    });
  }

  currentPeek = {
    dlg,
    peekCards,
    render: renderPeekList
  };

  renderPeekList();
  document.body.appendChild(dlg);
}

// プレビュー
function setupPreviewHover() {
  const preview = document.getElementById("preview");

  document.querySelectorAll(".card").forEach(card => {
    card.addEventListener("mouseenter", () => {
      const id = card.dataset.id;
      preview.style.backgroundImage = `url('../data/img/UA/${id}.png')`;
    });

    card.addEventListener("mouseleave", () => {
      preview.style.backgroundImage = "";
    });
  });
}

// 場外一覧
function setupOutListDialog() {
  document.addEventListener("contextmenu", e => {
    if (!e.target.closest("#ua-out")) return;

    e.preventDefault();

    if (out.length === 0) return;

    showOutListDialog();
  });
}

function showOutListDialog() {
  const dlg = document.createElement("div");
  dlg.className = "peek-dialog";

  const closeBtn = document.createElement("button");
  closeBtn.textContent = "×";
  closeBtn.style.marginRight = "8px";
  closeBtn.onclick = () => dlg.remove();
  dlg.appendChild(closeBtn);

  const list = document.createElement("div");
  list.className = "peek-list";
  dlg.appendChild(list);

  out.forEach(c => {
    const cardEl = createCard({ ...c, face: "front" });
    list.appendChild(cardEl);
  });

  document.body.appendChild(dlg);
}
