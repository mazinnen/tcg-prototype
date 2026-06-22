// bdb_solo_main.js — BDB 一人回しモード ゲームロジック（ES Module）
import {
  initDeckFromList,
  drawCard,
  getCardData,
  getAllCards,
  getDeckOrder,
  applyPeekOrder,
  peekDeck,
  shuffleDeck
} from "../core/deck.js";
import {
  createAllCards,
  layoutAllZones,
  layoutZone,
  updateZoneCount,
  syncDeckDomWithOrder,
  detectDropZone,
  applyFaceClass
} from "../core/core.js";
import { getBDBDeck, openBDB, getAllBDBDecks } from "./bdb_db.js";

// 右クリック系は DOM 構築後に張る
window.addEventListener("DOMContentLoaded", async () => {
  await openBDB();
  await loadDeckList();
  attachDeckRightClick();
  attachStackRightClick();
});

// GAS からカードデータ取得
async function loadCards() {
  const res = await fetch("https://script.google.com/macros/s/AKfycbyYl7wJ40jm8WfmhbF2O8Bmhk46ZwmaRzLaUVmIGryH-B1kDHha4JL3XH2i8bXkbn7R/exec");
  const data = await res.json();
  return data.carddata;
}

/* ---------------------------------------------------------
   デッキ一覧読み込み
--------------------------------------------------------- */
async function loadDeckList() {
  const decks = await getAllBDBDecks();
  const sel = document.getElementById("deck-list");
  sel.innerHTML = "";

  decks.forEach(d => {
    const opt = document.createElement("option");
    opt.value = d.id;
    opt.textContent = d.name;
    sel.appendChild(opt);
  });
}

/* ---------------------------------------------------------
   デッキ読み込み
--------------------------------------------------------- */
document.getElementById("load-deck").addEventListener("click", async () => {
  const selectedDeckId = Number(document.getElementById("deck-list").value);

  if (!selectedDeckId) {
    alert("デッキを選択してください");
    return;
  }

  // BDB_DB からデッキ取得
  const deck = await getBDBDeck(selectedDeckId);
  if (!deck) {
    alert("デッキが見つかりません");
    return;
  }

  // Excel（GAS）からカードデータ取得
  const carddata = await loadCards();

  // deck.js → デッキ構築（deckOrder 初期化＋シャッフル）
  // deck は { territory, cards, work } 構造
  await initDeckFromList(deck, carddata, deck.work);

  // DOM生成
  createAllCards();
  layoutAllZones();

  // 初期5ドロー
  initialDraw();
});

/* ---------------------------------------------------------
   初期5ドロー
--------------------------------------------------------- */
function initialDraw() {
  for (let i = 0; i < 5; i++) {
    const uid = drawCard();
    if (!uid) continue;

    const card = getCardData(uid);
    const el = document.getElementById(uid);

    el.dataset.face = "front";
    el.style.backgroundImage = `url(${card.image})`;

    document.getElementById("my-hand").appendChild(el);
  }
  layoutAllZones();
}

/* ---------------------------------------------------------
   マリガン
--------------------------------------------------------- */
document.getElementById("btn-mulligan").addEventListener("click", () => {
  doMulligan();
});

function doMulligan() {
  const allCards = getAllCards();
  const handCards = Object.values(allCards).filter(c => c.zone === "my-hand");

  // 手札を山札の下へ
  handCards.forEach(card => {
    card.zone = "my-deck";
    card.face = "back";
    applyPeekOrder([card.id], false); // 下に戻す
  });

  shuffleDeck();
  
  // DOM再生成
  createAllCards();

  // 引き直し
  for (let i = 0; i < 5; i++) {
    const uid = drawCard();
    if (!uid) continue;

    const card = getCardData(uid);
    const el = document.getElementById(uid);

    el.dataset.face = "front";
    el.style.backgroundImage = `url(${card.image})`;

    document.getElementById("my-hand").appendChild(el);
  }

  setupLifeAndEnergy();
}

/* ---------------------------------------------------------
   ライフ・エナジー配置
--------------------------------------------------------- */
document.getElementById("btn-start").addEventListener("click", () => {
  setupLifeAndEnergy();
});

function setupLifeAndEnergy() {
  const yellowZone = document.getElementById("my-yellow");
  const redZone = document.getElementById("my-red");
  const energyZone = document.getElementById("my-energy");

  // 黄5
  for (let i = 0; i < 5; i++) {
    const uid = drawCard();
    const card = getCardData(uid);
    card.zone = "my-yellow";

    const el = document.getElementById(uid);
    el.dataset.face = "back";
    el.style.backgroundImage = `url(${card.backImage})`;

    yellowZone.appendChild(el);
  }

  // 赤5
  for (let i = 0; i < 5; i++) {
    const uid = drawCard();
    const card = getCardData(uid);
    card.zone = "my-red";

    const el = document.getElementById(uid);
    el.dataset.face = "back";
    el.style.backgroundImage = `url(${card.backImage})`;

    redZone.appendChild(el);
  }

  // エナジー2（表）
  for (let i = 0; i < 2; i++) {
    const uid = drawCard();
    const card = getCardData(uid);
    card.zone = "my-energy";

    const el = document.getElementById(uid);
    el.dataset.face = "front";
    el.style.backgroundImage = `url(${card.image})`;

    energyZone.appendChild(el);
  }

  layoutAllZones();
}

/* ---------------------------------------------------------
   山札右クリック → peek
--------------------------------------------------------- */
function attachDeckRightClick() {
  const deckZone = document.getElementById("my-deck");
  if (!deckZone) return;

  deckZone.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    openDeckPeekInput();
  });
}

/* ---------------------------------------------------------
   山札右クリック → stack
--------------------------------------------------------- */
function attachStackRightClick() {
  ["my-drop", "my-remove"].forEach(zoneId => {
    const zone = document.getElementById(zoneId);
    if (!zone) return;

    zone.addEventListener("contextmenu", (e) => {
      e.preventDefault();

      const ids = Array.from(zone.querySelectorAll(".card"))
        .map(el => el.id);

      if (ids.length > 0) {
        openStackDialog(ids);
      }
    });
  });
}

/* ---------------------------------------------------------
   peek ダイアログ
--------------------------------------------------------- */
function openDeckPeekInput() {
  const n = prompt("上から何枚見ますか？");
  const count = parseInt(n);
  if (!count || count <= 0) return;

  const order = getDeckOrder();
  const ids = order.slice(-count).reverse();

  openDeckPeekDialog(ids);
}

function openDeckPeekDialog(cardIds) {
  const list = document.getElementById("deck-peek-list");
  list.innerHTML = "";

  cardIds.forEach(id => {
    const card = getCardData(id);

    const clone = document.createElement("div");
    clone.classList.add("peek-card");
    clone.dataset.cardId = id;
    clone.style.backgroundImage = `url(${card.image})`;

    enablePeekDrag(clone);

    list.appendChild(clone);
  });

  document.getElementById("deck-peek-dialog").classList.remove("hidden");
}

function updateDeckOrderFromPeek() {
  const list = document.getElementById("deck-peek-list");
  const clones = Array.from(list.children);

  const newOrder = clones.map(clone => clone.dataset.cardId);
  const order = getDeckOrder();

  const count = newOrder.length;
  const remain = order.slice(0, order.length - count);

  const updated = remain.concat(newOrder.reverse());
  setDeckOrder(updated);
}

function moveCardToZone(real, zoneId) {
  const card = getCardData(real.id);

  const originalZone = card.zone;
  card.zone = zoneId;

  document.getElementById(zoneId).appendChild(real);

  if (["my-yellow","my-red","my-deck"].includes(zoneId)) {
    card.face = "back";
  } else {
    card.face = "front";
  }
  real.dataset.face = card.face;
  applyFaceClass(real);

  layoutZone(originalZone);
  layoutZone(zoneId);

  updateZoneCount(originalZone);
  updateZoneCount(zoneId);
}

/* ---------------------------------------------------------
   peek の並びを deckOrder に反映
--------------------------------------------------------- */
document.getElementById("deck-peek-top").addEventListener("click", () => {
  applyPeekReturn(true);
});

document.getElementById("deck-peek-bottom").addEventListener("click", () => {
  applyPeekReturn(false);
});

function applyPeekReturn(toTop) {
  const zone = document.getElementById("deck-peek-list");
  const els = Array.from(zone.querySelectorAll(".peek-card"));
  const ids = els.map(el => el.dataset.cardId);

  applyPeekOrder(ids, toTop);
  syncDeckDomWithOrder();

  document.getElementById("deck-peek-dialog").classList.add("hidden");
  zone.innerHTML = "";
}

/* ---------------------------------------------------------
   peek 閉じる
--------------------------------------------------------- */
document.getElementById("deck-peek-close").addEventListener("click", () => {
  document.getElementById("deck-peek-dialog").classList.add("hidden");
  document.getElementById("deck-peek-list").innerHTML = "";
});

/* ---------------------------------------------------------
   stack ダイアログ
--------------------------------------------------------- */
function openStackDialog(cardIds) {
  const list = document.getElementById("stack-list");
  list.innerHTML = "";

  cardIds.forEach(id => {
    const card = getCardData(id);

    const clone = document.createElement("div");
    clone.classList.add("peek-card");
    clone.dataset.cardId = id;
    clone.style.backgroundImage = `url(${card.image})`;

    enableDialogDrag(clone);

    list.appendChild(clone);
  });

  document.getElementById("stack-dialog").classList.remove("hidden");
}

document.getElementById("stack-close").addEventListener("click", () => {
  const list = document.getElementById("stack-list");
  const cards = Array.from(list.querySelectorAll(".card"));

  cards.forEach(el => {
    const card = getCardData(el.id);
    const zone = document.getElementById(card.zone);
    zone.appendChild(el);
    el.classList.remove("peek-card");
  });

  document.getElementById("stack-dialog").classList.add("hidden");
});

/* ---------------------------------------------------------
   peek 用ドラッグ
--------------------------------------------------------- */
function enablePeekDrag(clone) {
  const list = document.getElementById("deck-peek-list");
  let dragging = false;
  let leftDialog = false;

  clone.addEventListener("mousedown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragging = true;
    leftDialog = false;
  });

  document.addEventListener("mousemove", (e) => {
    if (!dragging) return;

    if (isInsideDialog(e.clientX, e.clientY)) {
      leftDialog = false;

      const clones = Array.from(list.children);
      const x = e.clientX;

      let target = null;
      for (const c of clones) {
        const rect = c.getBoundingClientRect();
        const center = (rect.left + rect.right) / 2;
        if (x < center) {
          target = c;
          break;
        }
      }
      if (target && target !== clone) {
        list.insertBefore(clone, target);
      } else if (!target) {
        list.appendChild(clone);
      }
      return;
    }

    leftDialog = true;
    clone.style.position = "absolute";
    clone.style.zIndex = 9999;
    clone.style.left = (e.pageX - clone.offsetWidth / 2) + "px";
    clone.style.top = (e.pageY - clone.offsetHeight / 2) + "px";
  });

  document.addEventListener("mouseup", (e) => {
    if (!dragging) return;
    dragging = false;

    const id = clone.dataset.cardId;
    const real = document.getElementById(id);

    if (!leftDialog) {
      updateDeckOrderFromPeek();
      return;
    }

    const dropZone = detectDropZone(e.clientX, e.clientY);
    if (dropZone) {
      moveCardToZone(real, dropZone.id);
      clone.remove();
      return;
    }

    clone.style.position = "";
    clone.style.left = "";
    clone.style.top = "";
    clone.style.zIndex = "";
  });
}

function enableDialogDrag(clone) {
  let offsetX = 0;
  let offsetY = 0;
  let dragging = false;
  let leftDialog = false;

  clone.addEventListener("mousedown", (e) => {
    e.preventDefault();
    e.stopPropagation();

    dragging = true;
    leftDialog = false;

    offsetX = e.offsetX;
    offsetY = e.offsetY;

    clone.style.position = "absolute";
    clone.style.zIndex = 9999;
  });

  document.addEventListener("mousemove", (e) => {
    if (!dragging) return;

    clone.style.left = (e.pageX - offsetX) + "px";
    clone.style.top = (e.pageY - offsetY) + "px";

    if (!isInsideDialog(e.clientX, e.clientY)) {
      leftDialog = true;
    }
  });

  document.addEventListener("mouseup", (e) => {
    if (!dragging) return;
    dragging = false;

    const id = clone.dataset.cardId;
    const real = document.getElementById(id);

    if (!leftDialog) {
      updateDeckOrderFromPeek();
      clone.style.position = "";
      clone.style.left = "";
      clone.style.top = "";
      clone.style.zIndex = "";
      return;
    }

    const dropZone = detectDropZone(e.clientX, e.clientY);

    if (dropZone) {
      moveCardToZone(real, dropZone.id);
      clone.remove();
      return;
    }

    clone.style.position = "";
    clone.style.left = "";
    clone.style.top = "";
    clone.style.zIndex = "";
  });
}

function isInsideDialog(x, y) {
  const lists = [
    document.getElementById("deck-peek-list"),
    document.getElementById("stack-list")
  ];

  return lists.some(list => {
    if (!list) return false;
    const rect = list.getBoundingClientRect();
    return (
      x >= rect.left &&
      x <= rect.right &&
      y >= rect.top &&
      y <= rect.bottom
    );
  });
}
