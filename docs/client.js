const socket = io("https://tcg-prototype.onrender.com");

const card = document.getElementById("card");
let isDragging = false;

card.addEventListener("mousedown", () => (isDragging = true));
document.addEventListener("mouseup", () => (isDragging = false));

document.addEventListener("mousemove", (e) => {
  if (!isDragging) return;

  const pos = { x: e.clientX - 50, y: e.clientY - 75 };
  card.style.left = pos.x + "px";
  card.style.top = pos.y + "px";

  socket.emit("move_card", pos);
});

socket.on("move_card", (pos) => {
  card.style.left = pos.x + "px";
  card.style.top = pos.y + "px";
});


const zones = document.querySelectorAll(".zone");
const card = document.getElementById("card");

let isDragging = false;
let offsetX = 0;
let offsetY = 0;

card.addEventListener("mousedown", (e) => {
  isDragging = true;
  offsetX = e.offsetX;
  offsetY = e.offsetY;
});

document.addEventListener("mouseup", (e) => {
  if (!isDragging) return;
  isDragging = false;

  // ドロップ先のゾーンを判定
  zones.forEach((zone) => {
    const rect = zone.getBoundingClientRect();
    if (
      e.clientX > rect.left &&
      e.clientX < rect.right &&
      e.clientY > rect.top &&
      e.clientY < rect.bottom
    ) {
      // ゾーンに移動
      zone.appendChild(card);
      card.style.position = "absolute";
      card.style.left = e.clientX - rect.left - offsetX + "px";
      card.style.top = e.clientY - rect.top - offsetY + "px";

      socket.emit("move_card", {
        zone: zone.id,
        x: card.style.left,
        y: card.style.top
      });
    }
  });
});

document.addEventListener("mousemove", (e) => {
  if (!isDragging) return;

  card.style.left = e.clientX - offsetX + "px";
  card.style.top = e.clientY - offsetY + "px";
});

// 相手側の更新
socket.on("move_card", (data) => {
  const zone = document.getElementById(data.zone);
  zone.appendChild(card);
  card.style.left = data.x;
  card.style.top = data.y;
});
