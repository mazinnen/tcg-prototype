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

let dragCard = null;
let dragFrom = null;

window.addEventListener("DOMContentLoaded", async () => {
  await openDB();
  await loadDeckList();
  setupDragEvents();
  setupLifeFlip();
  setupDeckPeek();
});

// ====== デッキ一覧 ======
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

// ====== デッキ読み込み → ゲーム開始 ======
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

// ====== ゲーム開始処理 ======
function startGame(srcDeck) {
  deckStack = [...srcDeck];
  shuffle(deckStack);

  hand = deckStack.splice(0, 7);
  ap = ["UA_BACK", "UA_BACK", "UA_BACK"];

  front = [];
  energy = [];
  out = [];
  remove = [];
  life = [];

  renderAll();

  const doMulligan = confirm("マリガンしますか？");

  if (!doMulligan) {
    life = deckStack.splice(0, 7);
  } else {
    deckStack.push(...hand);
    hand = [];

    hand = deckStack.splice(0, 7);

    shuffle(deckStack);
    life = deckStack.splice(0, 7);
  }

  renderAll();
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function renderAll() {
  renderStack("ua-deck", deckStack, { face: "back" });
  renderStack("ua-life", life, { face: "back" });
  renderStack("ua-out", out, { face: "back" });
  renderStack("ua-remove", remove, { face: "back" });

  renderRow("ua-hand", hand, { face: "front" });
  renderRow("front-line", front, { face: "front" });
  renderRow("energy-line", energy, { face: "front" });

  renderRow("ua-ap", ap, { face: "back" });
}

// ====== ドラッグ＆ドロップ ======
function setupDragEvents() {
  document.addEventListener("mousedown", (e) => {
    const id = getCardId(e.target);
    if (!id) return;
    dragCard = id;
    dragFrom = findArea(id);
  });

  document.addEventListener("mouseup", (e) => {
    if (!dragCard) return;

    const dropZone = getDropZone(e.target);
    if (dropZone) moveCard(dragCard, dragFrom, dropZone);

    dragCard = null;
    dragFrom = null;
  });

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

function getDropZone(el) {
  const zones = ["ua-hand","front-line","energy-line","ua-out","ua-remove"];
  for (const z of zones) {
    if (el.closest(`#${z}`)) return zoneToArea(z);
  }
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

// ====== ライフ反転 ======
function setupLifeFlip() {
  const lifeZone = document.getElementById("ua-life");
  lifeZone.addEventListener("click", e => {
    const cardEl = e.target.closest(".card");
    if (!cardEl) return;
    flipCard(cardEl);
  });
}

// ====== 山札 peek ======
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

  cards.forEach((id, i) => {
    const card = createCard(id, "front");
    card.onclick = () => movePeekCard(i, id, dlg);
    dlg.appendChild(card);
  });

  document.body.appendChild(dlg);
}

function movePeekCard(index, id, dlg) {
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
