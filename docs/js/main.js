// ===============================
// 超シンプル版：ブラウザだけで完結
// ===============================

// 仮カードデータ
const cards = {};
for (let i = 1; i <= 10; i++) {
  cards["d" + i] = {
    id: "d" + i,
    zone: "my-deck",
    x: 0,
    y: 0,
    color: "gray"
  };
}
cards.h1 = { id: "h1", zone: "my-hand", x: 0, y: 0, color: "blue" };
cards.h2 = { id: "h2", zone: "my-hand", x: 0, y: 0, color: "blue" };

let deckOrder = Object.keys(cards).filter((id) => id.startsWith("d"));

// 初期化
window.addEventListener("DOMContentLoaded", () => {
  // カードDOM生成
  Object.values(cards).forEach((card) => {
    const el = document.createElement("div");
    el.className = "card";
    el.id = card.id;
    el.style.background = card.color;

    const zone = document.getElementById(card.zone);
    zone.appendChild(el);
  });

  renderDeck();
  layoutHand();
  setupDraw();
  setupShuffle();
});

// 山札描画
function renderDeck() {
  const deckZone = document.getElementById("my-deck");
  deckZone.innerHTML = `
    山札
    <div class="deck-count" id="my-deck-count"></div>
  `;

  deckOrder.forEach((id) => {
    const el = document.getElementById(id);
    deckZone.appendChild(el);
  });

  layoutStack(deckZone);
  document.getElementById("my-deck-count").textContent = deckOrder.length;
}

// 手札整列
function layoutHand() {
  const hand = document.getElementById("my-hand");
  const list = Array.from(hand.querySelectorAll(".card"));
  list.forEach((el, i) => {
    el.style.position = "absolute";
    el.style.left = i * 90 + "px";
    el.style.top = "0px";
  });
}

// 山札を重ねる
function layoutStack(zone) {
  const list = Array.from(zone.querySelectorAll(".card"));
  list.forEach((el, i) => {
    el.style.position = "absolute";
    el.style.left = i * 5 + "px";
    el.style.top = i * 5 + "px";
  });
}

// ドロー
function setupDraw() {
  document.getElementById("my-deck").addEventListener("click", () => {
    if (deckOrder.length === 0) return;

    const topId = deckOrder.pop();
    const el = document.getElementById(topId);
    document.getElementById("my-hand").appendChild(el);

    layoutHand();
    renderDeck();
  });
}

// シャッフル
function shuffleDeck() {
  for (let i = deckOrder.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deckOrder[i], deckOrder[j]] = [deckOrder[j], deckOrder[i]];
  }
}

function setupShuffle() {
  document.getElementById("my-deck").addEventListener("contextmenu", (e) => {
    e.preventDefault();
    shuffleDeck();
    renderDeck();
  });
}
