import { createCard, flipCard, renderStack, renderRow, getCardId } from "./ua_core.js";
import { openDB, getAllDecks, getDeck } from "./db.js";

let deck = [];
let deckStack = [];
let hand = [];
let front = [];
let energy = [];
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
});

// ===== デッキ一覧 =====
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

// ===== デッキ読み込み =====
document.getElementById("load-deck").onclick = async () => {
  const id = document.getElementById("deck-list").value;
  if (!id) return;

  const d = await getDeck(Number(id));
  if (!d || !d.cards) return;

  deck = expandDeck(d.cards);
  startGame(deck);
};

function expandDeck(cards) {
  const arr = [];
  cards.forEach(c => {
    for (let i = 0; i < c.count; i++) arr.push(c.id);
  });
  return arr;
}

// ===== ゲーム開始（まずはマリガン無し） =====
function startGame(srcDeck) {
  deckStack = [...srcDeck];
  shuffle(deckStack);

  hand = deckStack.splice(0, 7);          // 表
  ap = ["UA_BACK", "UA_BACK", "UA_BACK"]; // 裏ダミー
  front = [];
  energy = [];
  out = [];
  remove = [];
  life = deckStack.splice(0, 7);          // 裏

  renderAll();
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// ===== 描画 =====
function renderAll() {
  renderStack("ua-deck", deckStack, { face: "back" });
  renderLifeRow();
  renderStack("ua-out", out, { face: "back" });
  renderStack("ua-remove", remove, { face: "back" });

  renderRow("ua-hand", hand, { face: "front" });
  renderRow("front-line", front, { face: "front" });
  renderRow("energy-line", energy, { face: "front" });

  renderRow("ua-ap", ap, { face: "back" });
}

// ライフだけ横にずらして表示
function renderLifeRow() {
  const zone = document.getElementById("ua-life");
  zone.innerHTML = "";
  life.forEach((id, i) => {
    const card = createCard(id, "back");
    card.style.position = "absolute";
    card.style.left = `${i * 20}px`;
    zone.appendChild(card);
  });
}

// ===== DnD（HTML5 drag & drop） =====
function setupDragAndDrop() {
  // カードからドラッグ開始
  document.addEventListener("dragstart", e => {
    const id = getCardId(e.target);
    if (!id) return;
    const from = findArea(id);
    if (!from) return;

    dragFrom = from;
    e.dataTransfer.setData("text/plain", id);
  });

  // 各ゾーンをドロップ可能に
  ["ua-hand","front-line","energy-line","ua-out","ua-remove"].forEach(zoneId => {
    const zone = document.getElementById(zoneId);
    zone.addEventListener("dragover", e => e.preventDefault());
    zone.addEventListener("drop", e => {
      e.preventDefault();
      const id = e.dataTransfer.getData("text/plain");
      const to = zoneToArea(zoneId);
      moveCard(id, dragFrom, to);
      dragFrom = null;
    });
  });

  // カード上の右クリックで標準メニューを出さない
  document.addEventListener("contextmenu", e => {
    if (e.target.closest(".card")) e.preventDefault();
  });
}

function findArea(id) {
  if (hand.includes(id)) return "hand";
  if (front.includes(id)) return "front";
  if (energy.includes(id)) return "energy";
  if (out.includes(id)) return "out";
  if (remove.includes(id)) return "remove";
  if (life.includes(id)) return "life";
  return null;
}

function zoneToArea(zoneId) {
  return {
    "ua-hand": "hand",
    "front-line": "front",
    "energy-line": "energy",
    "ua-out": "out",
    "ua-remove": "remove"
  }[zoneId];
}

function moveCard(id, from, to) {
  if (!from || !to) return;
  if (to === "front" && front.length >= 4) return;
  if (to === "energy" && energy.length >= 4) return;

  removeFrom(from, id);
  addTo(to, id);
  renderAll();
}

function removeFrom(area, id) {
  let arr = getAreaArray(area);
  const idx = arr.indexOf(id);
  if (idx >= 0) arr.splice(idx, 1);
}

function addTo(area, id) {
  let arr = getAreaArray(area);
  arr.push(id);
}

function getAreaArray(area) {
  return { hand, front, energy, out, remove, life }[area];
}

// ===== ライフ反転 =====
function setupLifeFlip() {
  const lifeZone = document.getElementById("ua-life");
  lifeZone.addEventListener("click", e => {
    const cardEl = e.target.closest(".card");
    if (!cardEl) return;
    flipCard(cardEl);
  });
}

// ===== 山札 peek =====
function setupDeckPeek() {
  const deckZone = document.getElementById("ua-deck");
  deckZone.addEventListener("contextmenu", e => {
    e.preventDefault();
    const n = parseInt(prompt("何枚見ますか？"), 10);
    if (!n || n <= 0) return;

    const peek = deckStack.slice(0, n);
    showPeekDialog(peek);
  });
}

function showPeekDialog(cards) {
  const dlg = document.createElement("div");
  dlg.className = "peek-dialog";
  dlg.style.position = "fixed";
  dlg.style.left = "50%";
  dlg.style.top = "50%";
  dlg.style.transform = "translate(-50%, -50%)";
  dlg.style.background = "#222";
  dlg.style.padding = "8px";
  dlg.style.zIndex = "9999";
  dlg.style.display = "flex";
  dlg.style.gap = "4px";

  cards.forEach(id => {
    const card = createCard(id, "front");
    card.onclick = () => movePeekCard(id, dlg);
    dlg.appendChild(card);
  });

  document.body.appendChild(dlg);
}

function movePeekCard(id, dlg) {
  const dest = prompt("移動先: top / bottom / hand / out / remove");

  const idx = deckStack.indexOf(id);
  if (idx >= 0) deckStack.splice(idx, 1);

  if (dest === "top") {
    deckStack.unshift(id);
  } else if (dest === "bottom") {
    deckStack.push(id);
  } else if (dest === "hand") {
    hand.push(id);
  } else if (dest === "out") {
    out.push(id);
  } else if (dest === "remove") {
    remove.push(id);
  }

  dlg.remove();
  renderAll();
}
