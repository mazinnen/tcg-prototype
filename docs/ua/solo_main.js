// ===============================
// UA 一人回しモード専用
// ===============================
const GAME = "UA";

let uaCards = {};     // { title: [no, no, ...] }
let deckList = [];    // デッキの no[] 配列
let deckStack = [];   // 山札（配列）
let hand = [];        // 手札
let frontLine = [];   // フロントライン（最大4）
let energyLine = [];  // エナジーライン（最大4）
let lifeStack = [];   // ライフ（7）
let apStack = [];     // AP（3）
let outStack = [];    // 場外
let removeStack = []; // リムーブ

const UA_DEFAULT_DECK = {
  name: "青ロキシー",
  work: "MST",
  cards: [
    { id: "UA54BT_MST-1-014", count: 4 },
    { id: "UA54BT_MST-1-030", count: 4 },
    { id: "UA54BT_MST-1-031", count: 4 },
    { id: "UA54BT_MST-1-032", count: 4 },
    { id: "UA54BT_MST-1-028", count: 4 },
    { id: "UA54BT_MST-1-027", count: 4 },
    { id: "UA54BT_MST-1-029", count: 4 },
    { id: "UA54BT_MST-1-022", count: 4 },
    { id: "UA54BT_MST-1-026", count: 4 },
    { id: "UA54BT_MST-1-036", count: 4 },
    { id: "UA54BT_MST-1-040", count: 4 },
    { id: "UA54BT_MST-1-037", count: 4 },
    { id: "UA54BT_MST-1-038", count: 2 }
  ]
};

// ===============================
// 初期化
// ===============================
window.addEventListener("DOMContentLoaded", async () => {
  await openDB();

  const works = await loadWorks(GAME);
  uaCards = (await loadCards(GAME)).titles;

  initWorkList(works);
  initDeckList();
  initEvents();
  await ensureDefaultDeck();
});

// ===============================
// UI 初期化
// ===============================
function initWorkList(works) {
  const sel = document.getElementById("work-list");
  sel.innerHTML = "";

  works.forEach(w => {
    const opt = document.createElement("option");
    opt.value = w;
    opt.textContent = w;
    sel.appendChild(opt);
  });
}

function initDeckList() {
  const sel = document.getElementById("deck-list");
  sel.innerHTML = "";

  // IndexedDB から UA のデッキ一覧を取得
  getAllDecks("UA").then(decks => {
    decks.forEach(d => {
      const opt = document.createElement("option");
      opt.value = d.id;
      opt.textContent = d.name;
      sel.appendChild(opt);
    });
  });
}

// ===============================
// イベント
// ===============================
function initEvents() {
  document.getElementById("load-deck").addEventListener("click", async () => {
    const deckId = document.getElementById("deck-list").value;
    if (!deckId) return;

    const deck = await getDeck(deckId);
    deckList = deck.data.cards; // no[] の配列

    setupBoard();
  });
}

// ===============================
// 盤面セットアップ
// ===============================
function setupBoard() {
  // 山札をセット
  deckStack = [...deckList];
  renderStack("ua-deck", deckStack);

  // ライフ 7 枚
  lifeStack = deckStack.splice(0, 7);
  renderLife();

  // AP 3 枚
  apStack = deckStack.splice(0, 3);
  renderAP();

  // 手札は空
  hand = [];
  renderHand();

  // フロントライン / エナジーラインは空
  frontLine = [];
  energyLine = [];
  renderFrontLine();
  renderEnergyLine();

  // 場外 / リムーブは空
  outStack = [];
  removeStack = [];
  renderStack("ua-out", outStack);
  renderStack("ua-remove", removeStack);
}

// ===============================
// 描画処理
// ===============================
function renderStack(id, stack) {
  const zone = document.getElementById(id);
  zone.innerHTML = "";

  stack.forEach((no, i) => {
    const card = createCard(no);
    card.style.setProperty("--i", i);
    zone.appendChild(card);
  });
}

function renderLife() {
  const zone = document.getElementById("ua-life");
  zone.innerHTML = "";

  lifeStack.forEach((no, i) => {
    const card = createCard(no);
    card.style.setProperty("--i", i);
    zone.appendChild(card);
  });
}

function renderAP() {
  const zone = document.getElementById("ua-ap");
  zone.innerHTML = "";

  apStack.forEach(no => {
    const card = createCard(no);
    zone.appendChild(card);
  });
}

function renderHand() {
  const zone = document.getElementById("ua-hand");
  zone.innerHTML = "";

  hand.forEach(no => {
    const card = createCard(no);
    zone.appendChild(card);
  });
}

function renderFrontLine() {
  const zone = document.getElementById("front-line");
  zone.innerHTML = "";

  frontLine.forEach(no => {
    const card = createCard(no);
    zone.appendChild(card);
  });
}

function renderEnergyLine() {
  const zone = document.getElementById("energy-line");
  zone.innerHTML = "";

  energyLine.forEach(no => {
    const card = createCard(no);
    zone.appendChild(card);
  });
}

// ===============================
// カード DOM 生成
// ===============================
function createCard(no) {
  const div = document.createElement("div");
  div.className = "card";
  div.textContent = no; // 画像があるなら img に差し替え

  // UA のカード画像パス例
  div.style.backgroundImage = `url('../data/img/ua-back.png')`;

  return div;
}

async function ensureDefaultDeck() {
  const decks = await getAllDecks("UA");
  if (decks.length === 0) {
    console.log("UA: デッキが0件のため初期デッキを登録します");
    await addDeck(UA_DEFAULT_DECK, "UA");
  }
}
