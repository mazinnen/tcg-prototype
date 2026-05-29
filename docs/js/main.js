const socket = io("https://tcg-prototype.onrender.com");

// カードDOM生成
Object.values(cards).forEach((card) => {
  const el = document.createElement("div");
  el.className = "card";
  el.id = card.id;

  // 仮のカード画像（色付き）
  el.style.background = card.img;

  const zone = document.getElementById(card.zone);
  zone.appendChild(el);

  el.style.left = card.x + "px";
  el.style.top = card.y + "px";

  enableDrag(el);
  layoutZone(card.zone);
});

// 相手側同期
socket.on("move_card", (data) => {
  const el = document.getElementById(data.id);
  const zone = document.getElementById(data.zone);

  zone.appendChild(el);
  el.style.left = data.x + "px";
  el.style.top = data.y + "px";

  layoutZone(data.zone);
});

// ===============================
// 山札からドロー
// ===============================
document.getElementById("my-deck").addEventListener("click", () => {
  // 山札にあるカードを取得
  const deckCards = Object.values(cards).filter(c => c.zone === "my-deck");
  if (deckCards.length === 0) return; // 山札が空なら何もしない

  // 一番上のカード（最後に追加されたカード）
  const top = deckCards[deckCards.length - 1];

  // 手札へ移動
  top.zone = "my-hand";

  const el = document.getElementById(top.id);
  const hand = document.getElementById("my-hand");
  hand.appendChild(el);

  // 手札の整列
  layoutZone("my-hand");
  layoutZone("my-deck");

  // 相手側へ同期
  socket.emit("move_card", {
    id: top.id,
    zone: "my-hand",
    x: 0,
    y: 0
  });
});

function shuffleDeck() {
  for (let i = deckOrder.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deckOrder[i], deckOrder[j]] = [deckOrder[j], deckOrder[i]];
  }
}

// ===============================
// 山札を右クリックでシャッフル
// ===============================
document.getElementById("my-deck").addEventListener("contextmenu", (e) => {
  e.preventDefault();

  shuffleDeck();

  // DOM の重ね順を更新
  const deckZone = document.getElementById("my-deck");
  deckZone.innerHTML = ""; // 一旦クリア

  deckOrder.forEach((id) => {
    const el = document.getElementById(id);
    deckZone.appendChild(el);
  });

  layoutZone("my-deck");

  // 相手側へ同期
  socket.emit("shuffle_deck", { order: deckOrder });
});

socket.on("shuffle_deck", (data) => {
  deckOrder = data.order;

  const deckZone = document.getElementById("op-deck");
  deckZone.innerHTML = "";

  deckOrder.forEach((id) => {
    const el = document.getElementById(id);
    deckZone.appendChild(el);
  });

  layoutZone("op-deck");
});

function updateDeckCount() {
  const myCount = deckOrder.length;
  document.getElementById("my-deck-count").textContent = myCount;

  const opCount = deckOrder.length; // 相手も同じ山札構造を共有
  document.getElementById("op-deck-count").textContent = opCount;
}

socket.on("shuffle_deck", (data) => {
  deckOrder = data.order;

  const deckZone = document.getElementById("op-deck");
  deckZone.innerHTML = "";

  deckOrder.forEach((id) => {
    const el = document.getElementById(id);
    deckZone.appendChild(el);
  });

  layoutZone("op-deck");
  updateDeckCount();
});
