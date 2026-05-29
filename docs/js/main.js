const socket = io("https://your-render-server.onrender.com");

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
