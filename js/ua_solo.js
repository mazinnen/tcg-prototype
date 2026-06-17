import {
  createCard,
  flipCard,
  renderStack,
  renderRow,
  renderRaidRow,
  getCardUid
} from "./ua_core.js";

import { openDB, getAllDecks, getDeck } from "./db.js";

let deckStack = [];
let hand = [];
let front = [[], [], [], []];   // ★ スロット構造を維持
let energy = [[], [], [], []];
let life = [];
let ap = [];
let out = [];
let remove = [];

let dragFrom = null;

window.addEventListener("DOMContentLoaded", async () => {
  await openDB();
  await loadDeckList();
  setupDragAndDrop();
  setupLifeFlip();
  setupDeckPeek();
  setupPreviewHover();
  setupOutListDialog();
});

// =========================
// デッキ一覧
// =========================
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

// =========================
// デッキ読み込み
// =========================
document.getElementById("load-deck").onclick = async () => {
  const id = Number(document.getElementById("deck-list").value);
  if (!id) return;

  const d = await getDeck(id);
  if (!d || !d.cards) return;

  const deck = expandDeck(d.cards);
  startGame(deck);
};

// =========================
// デッキ展開（uid 付与）
// =========================
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

// =========================
// ゲーム開始
// =========================
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

// =========================
// シャッフル
// =========================
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// =========================
// 描画
// =========================
function renderAll() {
  renderStack("ua-deck", deckStack);
  renderStack("ua-out", out.map(c => ({ ...c, face: "front" })));
  renderStack("ua-remove", remove.map(c => ({ ...c, face: "front" })));

  renderLife();

  renderRow("ua-hand", hand.map(c => ({ ...c, face: "front" })));

  // ★ レイド対応（スロット構造のまま描画）
  renderRaidRow("front-line", front);
  renderRaidRow("energy-line", energy);

  renderRow("ua-ap", ap);

  setupPreviewHover();
}

// =========================
// ライフ
// =========================
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

// =========================
// DnD
// =========================
function setupDragAndDrop() {
  document.addEventListener("dragstart", e => {
    const uid = getCardUid(e.target);
    if (!uid) return;
    dragFrom = findArea(uid);
    e.dataTransfer.setData("text/plain", uid);
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
        return;
      }

      moveCard(uid, dragFrom, zoneId, e);
      dragFrom = null;
    });
  });
}

// =========================
// ドロー
// =========================
function drawCardToHand() {
  if (deckStack.length === 0) return;

  const top = deckStack.shift();
  top.face = "front";
  hand.push(top);

  renderAll();
}

// =========================
// カード移動（レイド対応）
// =========================
function moveCard(uid, from, zoneId, event) {
  const to = zoneToArea(zoneId);
  if (!from || !to) return;

  // ★ 移動元からカードを正しく削除
  const card = removeFromArea(uid, from);

  if (!card) return;

  // ★ 山札に置いたら裏向き
  if (to === "deck") {
    card.face = "back";
    deckStack.unshift(card);
    renderAll();
    return;
  }

  // ★ front / energy のレイド処理
  if (to === "front" || to === "energy") {
    const slots = to === "front" ? front : energy;

    const zone = document.getElementById(zoneId);
    const rect = zone.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const slotWidth = rect.width / 4;
    const slotIndex = Math.floor(x / slotWidth);

    if (slots[slotIndex].length >= 2) {
      // 元に戻す
      addToArea(card, from);
      return;
    }

    slots[slotIndex].push(card);
    renderAll();
    return;
  }

  // 通常ゾーン
  addToArea(card, to);
  renderAll();
}

// =========================
// 移動元からカードを削除（スロット対応）
// =========================
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

// =========================
// 移動先に追加（スロット対応）
// =========================
function addToArea(card, area) {
  if (area === "front") return; // レイド処理で追加済み
  if (area === "energy") return;

  getAreaArray(area).push(card);
}

// =========================
// エリア配列取得（front/energy は flat しない）
// =========================
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

// =========================
// カードがどのエリアにいるか判定
// =========================
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

// =========================
// ライフ反転
// =========================
function setupLifeFlip() {
  document.getElementById("ua-life").addEventListener("click", e => {
    const card = e.target.closest(".card");
    if (!card) return;

    const uid = card.dataset.uid;
    const obj = life.find(c => c.uid === uid);
    obj.face = obj.face === "back" ? "front" : "back";

    flipCard(card);
  });
}

// // =========================
// // ★ ライフは右クリックで裏表切り替え（回転禁止）
// // =========================
// document.getElementById("ua-life").addEventListener("contextmenu", e => {
//   const card = e.target.closest(".card");
//   if (!card) return;

//   e.preventDefault(); // ブラウザの右クリックメニューを消す

//   const uid = card.dataset.uid;
//   const obj = life.find(c => c.uid === uid);
//   if (!obj) return;

//   // 裏表切り替え
//   obj.face = obj.face === "back" ? "front" : "back";

//   flipCard(card); // DOM 更新
// });


// =========================
// 山札 peek
// =========================
function setupDeckPeek() {
  document.addEventListener("contextmenu", e => {
    if (!e.target.closest("#ua-deck")) return;

    e.preventDefault();

    const n = parseInt(prompt("何枚見ますか？"), 10);
    if (!n || n <= 0) return;

    showPeekDialog(deckStack.slice(0, n));
  });
}

function showPeekDialog(cards) {
  const dlg = document.createElement("div");
  dlg.className = "peek-dialog";

  const closeBtn = document.createElement("button");
  closeBtn.textContent = "×";
  closeBtn.style.marginRight = "8px";
  closeBtn.onclick = () => dlg.remove();
  dlg.appendChild(closeBtn);

  cards.forEach(c => {
    const cardEl = createCard({ ...c, face: "front" });
    cardEl.onclick = () => movePeekCard(c.uid, cardEl, dlg);
    dlg.appendChild(cardEl);
  });

  document.body.appendChild(dlg);
}

function movePeekCard(uid, cardEl, dlg) {
  const idx = deckStack.findIndex(c => c.uid === uid);
  if (idx >= 0) deckStack.splice(idx, 1);

  cardEl.remove();

  if (dlg.children.length === 1) dlg.remove();

  renderAll();
}

// =========================
// プレビュー（hover）
// =========================
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

// =========================
// 場外一覧
// =========================
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

  out.forEach(c => {
    const cardEl = createCard({ ...c, face: "front" });
    dlg.appendChild(cardEl);
  });

  document.body.appendChild(dlg);
}
