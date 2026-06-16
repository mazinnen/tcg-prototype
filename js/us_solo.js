import { createCard, renderStack, renderRow, getCardId } from "./ua_core.js";
import { openDB, getAllDecks, getDeck } from "./db.js";

// ====== デッキ（仮） ======
// まずは動かすために固定デッキ
const FIXED_DECK = [
  "UA01-001","UA01-002","UA01-003","UA01-004",
  "UA01-005","UA01-006","UA01-007","UA01-008",
  "UA01-009","UA01-010","UA01-011","UA01-012",
  "UA01-013","UA01-014","UA01-015","UA01-016",
  "UA01-017","UA01-018","UA01-019","UA01-020"
];

// ====== 盤面 ======
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

window.addEventListener("DOMContentLoaded", () => {
  setupBoard();
  setupDragEvents();
  loadDeckList();
});

// ====== 初期セットアップ ======
function setupBoard() {
  deckStack = [...FIXED_DECK];

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

// ====== ドラッグ操作 ======
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

// ====== カード移動 ======
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

document.getElementById("load-deck").onclick = async () => {
  const id = document.getElementById("deck-list").value;
  const d = await getDeck(id);
  deck = expandDeck(d.cards);
  setupBoard();
};
