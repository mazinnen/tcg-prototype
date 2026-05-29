const socket = io("https://tcg-prototype.onrender.com");

let cards = {
  c1: { id: "c1", zone: "my-hand", x: 10, y: 10 },
  c2: { id: "c2", zone: "my-hand", x: 100, y: 10 },
  c3: { id: "c3", zone: "my-deck", x: 0, y: 0 }
};

const zones = document.querySelectorAll(".zone");

// カードDOM生成
Object.values(cards).forEach((card) => {
  const el = document.createElement("div");
  el.className = "card";
  el.id = card.id;
  el.textContent = card.id.toUpperCase();

  const zone = document.getElementById(card.zone);
  zone.appendChild(el);

  el.style.left = card.x + "px";
  el.style.top = card.y + "px";

  enableDrag(el);
  layoutZone(card.zone);
});

// ドラッグ処理
function enableDrag(el) {
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  el.addEventListener("mousedown", (e) => {
    isDragging = true;
    offsetX = e.offsetX;
    offsetY = e.offsetY;
  });

  document.addEventListener("mouseup", (e) => {
    if (!isDragging) return;
    isDragging = false;

    zones.forEach((zone) => {
      const rect = zone.getBoundingClientRect();
      if (
        e.clientX > rect.left &&
        e.clientX < rect.right &&
        e.clientY > rect.top &&
        e.clientY < rect.bottom
      ) {
        zone.appendChild(el);

        const x = e.clientX - rect.left - offsetX;
        const y = e.clientY - rect.top - offsetY;

        el.style.left = x + "px";
        el.style.top = y + "px";

        socket.emit("move_card", {
          id: el.id,
          zone: zone.id,
          x,
          y
        });

        layoutZone(zone.id);
      }
    });
  });

  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    el.style.left = e.clientX - offsetX + "px";
    el.style.top = e.clientY - offsetY + "px";
  });
}

// 整列処理
function layoutZone(zoneId) {
  const zone = document.getElementById(zoneId);
  const cards = Array.from(zone.querySelectorAll(".card"));

  // 横並び整列
  cards.forEach((card, index) => {
    card.style.left = index * 90 + "px";
    card.style.top = "0px";
  });
}

// 相手側同期
socket.on("move_card", (data) => {
  const el = document.getElementById(data.id);
  const zone = document.getElementById(data.zone);

  zone.appendChild(el);
  el.style.left = data.x + "px";
  el.style.top = data.y + "px";

  layoutZone(data.zone);
});
