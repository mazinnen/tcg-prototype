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
