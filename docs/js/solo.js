// solo.js — DB版 一人回しモード

const workList = document.getElementById("work-list");
const deckList = document.getElementById("deck-list");
let selectedDeckId = null;

/* ---------------------------------------------------------
   初期化：DB → 作品一覧 → デッキ一覧
--------------------------------------------------------- */
window.addEventListener("DOMContentLoaded", async () => {
  await openDB();              // DB を開く
  await initWorkAndDeckUI();   // DB から作品とデッキを読み込む

  selectedDeckId = deckList.value;
});

/* ---------------------------------------------------------
   デッキ選択（select）
--------------------------------------------------------- */
deckList.addEventListener("change", () => {
  selectedDeckId = deckList.value;
  console.log("選択されたデッキ:", selectedDeckId);
});

/* ---------------------------------------------------------
   デッキ読み込み
--------------------------------------------------------- */
document.getElementById("load-deck").addEventListener("click", async () => {
  if (!selectedDeckId) {
    alert("デッキを選択してください");
    return;
  }

  const workId = workList.value;

  // DB からデッキを取得
  const deck = await dbGet("decks", selectedDeckId);
  if (!deck) {
    alert("デッキが見つかりません");
    return;
  }

  // 作品フォルダからカードデータを取得
  const cardRes = await fetch(`data/works/${workId}/carddata.json`);
  const carddata = await cardRes.json();

  // デッキ構築（内部でリセット＋シャッフル）
  await initDeckFromList(deck.data, carddata, workId);

  // カード DOM 生成
  createAllCards();
  layoutAllZones();

  // 初期 5 ドロー
  initialDraw();
});

/* ---------------------------------------------------------
   初期 5 ドロー
--------------------------------------------------------- */
function initialDraw() {
  for (let i = 0; i < 5; i++) {
    drawCard();
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
  const handCards = Object.values(cards).filter(c => c.zone === "my-hand");

  // 手札を山札の下に戻す（unshift → push に変更）
  handCards.forEach(card => {
    card.zone = "my-deck";
    deckOrder.push(card.id); // ★ 山札の下に戻す
  });

  // 手札の DOM を消す
  document.getElementById("my-hand").innerHTML = "";

  // 山札をシャッフル
  shuffleDeck();

  // 引き直し
  for (let i = 0; i < 5; i++) drawCard();

  layoutAllZones();

  // ライフとエナジーを再配置
  setupLifeAndEnergy();
}


/* ---------------------------------------------------------
   対戦開始
--------------------------------------------------------- */
document.getElementById("btn-start").addEventListener("click", () => {
  doStartBattle();
});

function doStartBattle() {
  setupLifeAndEnergy();
}

/* ---------------------------------------------------------
   ライフ（黄5 / 赤5）＋エナジー（2）配置
--------------------------------------------------------- */
function setupLifeAndEnergy() {
  const yellowZone = document.getElementById("my-yellow");
  const redZone = document.getElementById("my-red");
  const energyZone = document.getElementById("my-energy");

  // 既存カードをクリア
  yellowZone.innerHTML = "";
  redZone.innerHTML = "";
  energyZone.innerHTML = "";

  // 5 → イエロー（裏向き）
  for (let i = 0; i < 5; i++) {
    const uid = deckOrder.pop();
    const card = cards[uid];
    card.zone = "my-yellow";

    const el = document.getElementById(uid);
    el.dataset.face = "back"; // ★ 裏向き
    el.style.backgroundImage = `url(${card.back})`;

    yellowZone.appendChild(el);
  }

  // 5 → レッド（裏向き）
  for (let i = 0; i < 5; i++) {
    const uid = deckOrder.pop();
    const card = cards[uid];
    card.zone = "my-red";

    const el = document.getElementById(uid);
    el.dataset.face = "back"; // ★ 裏向き
    el.style.backgroundImage = `url(${card.back})`;

    redZone.appendChild(el);
  }

  // 2 → エナジー（表向き）
  for (let i = 0; i < 2; i++) {
    const uid = deckOrder.pop();
    const card = cards[uid];
    card.zone = "my-energy";

    const el = document.getElementById(uid);
    el.dataset.face = "front"; // ★ 表向き
    el.style.backgroundImage = `url(${card.image})`;

    energyZone.appendChild(el);
  }

  layoutAllZones();
}

