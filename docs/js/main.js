// 山札10枚
let deckOrder = [];
for (let i = 1; i <= 10; i++) {
  deckOrder.push("d" + i);
}

// カードDOM生成
window.addEventListener("DOMContentLoaded", () => {
  const deck = document.getElementById("deck");

  deckOrder.forEach((id, i) => {
    const el = document.createElement("div");
    el.className = "card";
    el.id = id;
    el.style.left = (i * 5) + "px";
    el.style.top = (i * 5) + "px";
    deck.appendChild(el);
  });

  setupDraw();
});

// ドロー処理
function setupDraw() {
  document.getElementById("deck").addEventListener("click", () => {
    if (deckOrder.length === 0) return;

    const topId = deckOrder.pop();
    const el = document.getElementById(topId);

    document.getElementById("hand").appendChild(el);

    // 手札は横並び
    const handCards = Array.from(document.querySelectorAll("#hand .card"));
    handCards.forEach((c, i) => {
      c.style.left = (i * 70) + "px";
      c.style.top = "40px";
    });
  });
}
