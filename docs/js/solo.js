// solo.js — 一人回しモード（DB版・peek/stack 完全版）

let selectedDeckId = null;

/* ---------------------------------------------------------
   初期化：DB → 作品一覧 → デッキ一覧
--------------------------------------------------------- */
window.addEventListener("DOMContentLoaded", async () => {
  await openDB();
  await initWorkAndDeckUI(); // deck_manager.js

  attachDeckRightClick();
  attachStackRightClick();
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
   山札右クリック → stack
--------------------------------------------------------- */
function attachStackRightClick() {
  ["my-drop", "my-remove"].forEach(zoneId => {
    const zone = document.getElementById(zoneId);

    zone.addEventListener("contextmenu", (e) => {
      e.preventDefault();

      // ゾーン内のカードIDを取得
      const ids = Array.from(zone.querySelectorAll(".card"))
        .map(el => el.id);

      if (ids.length > 0) {
        openStackDialog(ids); // ★ ここで使う
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

  // ★ デッキの上から count 枚を取得（末尾が上）
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

    enableDialogDrag(clone); // ★ 新しいドラッグ処理

    list.appendChild(clone);
  });

  document.getElementById("deck-peek-dialog").classList.remove("hidden");
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

    // ★ ダイアログ外に出た瞬間だけ true にする
    if (!isInsideDialog(e.clientX, e.clientY)) {
      leftDialog = true;
    }
  });

  document.addEventListener("mouseup", (e) => {
    if (!dragging) return;
    dragging = false;

    const id = clone.dataset.cardId;
    const real = document.getElementById(id);

    // ★ ダイアログ内 → 並び替え成立 → 位置リセットしない
    if (!leftDialog) {
      clone.style.position = "";
      clone.style.left = "";
      clone.style.top = "";
      clone.style.zIndex = "";
      return;
    }

    // ★ ダイアログ外 → ゾーン移動
    const dropZone = detectDropZone(e.clientX, e.clientY);

    if (dropZone) {
      moveCardToZone(real, dropZone.id);
      clone.remove(); // ダイアログから消す
      return;
    }

    // ★ ダイアログ外だがゾーンに落ちていない → 元に戻す
    clone.style.position = "";
    clone.style.left = "";
    clone.style.top = "";
    clone.style.zIndex = "";
  });
}

function moveCardToZone(real, zoneId) {
  const card = getCardData(real.id);

  const originalZone = card.zone;
  card.zone = zoneId;

  document.getElementById(zoneId).appendChild(real);

  // 裏表制御
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

  applyPeekOrder(ids, toTop); // deck.js（deckOrder 更新）

  // ★ DOM を deckOrder に合わせて再生成
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
