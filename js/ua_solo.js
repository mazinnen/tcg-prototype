import { createCard, makeDroppable, flipCard, renderStack, renderRow, getCardId } from "./ua_core.js";
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
});

// ====== デッキ一覧をセレクトに反映 ======
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

// ====== デッキ読み込みボタン ======
document.getElementById("load-deck").onclick = async () => {
  const id = document.getElementById("deck-list").value;
  if (!id) return;

  const d = await getDeck(Number(id));
  if (!d || !d.cards) return;

  deck = expandDeck(d.cards);   // {id,count} → [id,id,id,...]
  setupBoard(deck);
};

// ====== デッキ展開 ======
function expandDeck(cards) {
  const arr = [];
  cards.forEach(c => {
    for (let i = 0; i < c.count; i++) arr.push(c.id);
  });
  return arr;
}

// ====== 初期セットアップ ======
function setupBoard(srcDeck) {
  deckStack = [...srcDeck];

  life = deckStack.splice(0, 7);
  renderStack("ua-life", life);

  ap = deckStack.splice(0, 3);
  renderRow("ua-ap", ap);

  hand = [];
  renderRow("ua-hand", hand);

  front = [];
  energy = [];
  renderRow("front-line", front);
  renderRow("energy-line", energy);

  renderStack("ua-deck", deckStack);

  out = [];
  remove = [];
  renderStack("ua-out", out);
  renderStack("ua-remove", remove);
}

// ====== ドラッグ操作（ua_core の getCardId 前提） ======
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
}

function findArea(id) {
  if (hand.includes(id)) return "hand";
  if (front.includes(id)) return "front";
  if (energy.includes(id)) return "energy";
  if (out.includes(id)) return "out";
  if (remove.includes(id)) return "remove";
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
  return { hand, front, energy, out, remove }[area];
}

function renderAll() {
  renderStack("ua-deck", deckStack);
  renderRow("ua-hand", hand);
  renderRow("front-line", front);
  renderRow("energy-line", energy);
  renderStack("ua-out", out);
  renderStack("ua-remove", remove);
}
