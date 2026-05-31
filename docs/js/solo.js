// solo.js — 一人回しモード（DB版・peek/stack 完全版）

let selectedDeckId = null;

/* ---------------------------------------------------------
   初期化：DB → 作品一覧 → デッキ一覧
--------------------------------------------------------- */
window.addEventListener("DOMContentLoaded", async () => {
  await openDB();
  await initWorkAndDeckUI(); // deck_manager.js

  attachDeckRightClick(); // ← ここに移動（1回だけ）
  selectedDeckId = document.getElementById("deck-list").value;
});

/* ---------------------------------------------------------
   デッキ選択
--------------------------------------------------------- */
document.getElementById("deck-list").addEventListener("change", () => {
  selectedDeckId = document.getElementById("deck-list").value;
});

/* ---------------------------------------------------------
   デッキ読み込み
--------------------------------------------------------- */
document.getElementById("load-deck").addEventListener("click", async () => {
  if (!selectedDeckId) {
    alert("デッキを選択してください");
    return;
  }

  const workId = document.getElementById("work-list").value;

  // DB からデッキ取得
  const deck = await dbGet("decks", selectedDeckId);
  if (!deck) {
    alert("デッキが見つかりません");
    return;
  }

  // カードデータ読み込み
  const cardRes = await fetch(`data/works/${workId}/carddata.json`);
  const carddata = await cardRes.json();

  // deck.js → デッキ構築（deckOrder 初期化＋シャッフル）
  await initDeckFromList(deck.data, carddata, workId);

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
    const uid = drawCard(); // deck.js
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
    applyPeekOrder([card.id], false); // 下に戻す
  });

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

  deckZone.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    openDeckPeekInput();
  });
}

/* ---------------------------------------------------------
   peek ダイアログ
--------------------------------------------------------- */
function openDeckPeekInput() {
  const n = prompt("上から何枚見ますか？");
  const count = parseInt(n);
  if (!count || count <= 0) return;

  openDeckPeekDialog(count);
}

function openDeckPeekDialog(count) {
  const list = document.getElementById("deck-peek-list");
  list.innerHTML = "";

  const peekIds = peekDeck(count); // deck.js

  peekIds.forEach(id => {
    const card = getCardData(id);

    const el = document.createElement("div");
    el.classList.add("peek-card");
    el.dataset.cardId = id;
    el.style.backgroundImage = `url(${card.image})`;

    list.appendChild(el);
  });

  makeDeckPeekSortable();
  document.getElementById("deck-peek-dialog").classList.remove("hidden");
}

function makeDeckPeekSortable() {
  const zone = document.getElementById("deck-peek-list");
  let dragEl = null;

  zone.querySelectorAll(".peek-card").forEach(el => {
    el.draggable = true;

    el.addEventListener("dragstart", () => {
      dragEl = el;
    });

    el.addEventListener("dragover", (e) => {
      e.preventDefault();
      const target = e.target.closest(".peek-card");
      if (target && target !== dragEl) {
        zone.insertBefore(dragEl, target);
      }
    });
  });
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

  applyPeekOrder(ids, toTop); // deck.js（deckOrder 更新）

  // ★ DOM を deckOrder に合わせて再生成
  createAllCards();
  //layoutAllZones();

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

    const el = document.createElement("div");
    el.classList.add("peek-card");
    el.style.backgroundImage = `url(${card.image})`;

    list.appendChild(el);
  });

  document.getElementById("stack-dialog").classList.remove("hidden");
}

document.getElementById("stack-close").addEventListener("click", () => {
  document.getElementById("stack-dialog").classList.add("hidden");
  document.getElementById("stack-list").innerHTML = "";
});
