
// ===============================
// アプリ初期化
// ===============================
function initApp() {
  socket = io("https://tcg-prototype.onrender.com");

  // カードDOM生成
  Object.values(cards).forEach((card) => {
    const el = document.createElement("div");
    el.className = "card";
    el.id = card.id;
    el.style.background = card.img;

    const zone = document.getElementById(card.zone);
    zone.appendChild(el);

    el.style.left = card.x + "px";
    el.style.top = card.y + "px";

    enableDrag(el);
  });

  // 山札を deckOrder に基づいて描画
  renderDeck();

  // 山札クリック → ドロー
  setupDraw();

  // 山札右クリック → シャッフル
  setupShuffle();

  // Socket.io 同期
  setupSocketSync();
}


// ===============================
// 山札の描画（deckOrder に基づく）
// ===============================
function renderDeck() {
  const deckZone = document.getElementById("my-deck");

  // 山札ラベル + カウンターを残す
  deckZone.innerHTML = `
    山札
    <div class="deck-count" id="my-deck-count"></div>
  `;

  deckOrder.forEach((id) => {
    const el = document.getElementById(id);
    deckZone.appendChild(el);
  });

  layoutZone("my-deck");
  updateDeckCount();
}


// ===============================
// 山札の残り枚数更新
// ===============================
function updateDeckCount() {
  const count = deckOrder.length;
  document.getElementById("my-deck-count").textContent = count;
}


// ===============================
// ドロー処理
// ===============================
function setupDraw() {
  document.getElementById("my-deck").addEventListener("click", () => {
    if (deckOrder.length === 0) return;

    const topId = deckOrder.pop();
    const card = cards[topId];

    card.zone = "my-hand";

    const el = document.getElementById(topId);
    document.getElementById("my-hand").appendChild(el);

    layoutZone("my-hand");
    renderDeck();

    socket.emit("move_card", {
      id: topId,
      zone: "my-hand",
      x: 0,
      y: 0
    });
  });
}


// ===============================
// シャッフル処理
// ===============================
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

    socket.emit("shuffle_deck", { order: deckOrder });
  });
}


// ===============================
// Socket.io 同期
// ===============================
function setupSocketSync() {
  // カード移動
  socket.on("move_card", (data) => {
    const el = document.getElementById(data.id);
    const zone = document.getElementById(data.zone);

    zone.appendChild(el);
    el.style.left = data.x + "px";
    el.style.top = data.y + "px";

    layoutZone(data.zone);
  });

  // シャッフル同期
  socket.on("shuffle_deck", (data) => {
    deckOrder = data.order;
    renderDeck();
  });
}
