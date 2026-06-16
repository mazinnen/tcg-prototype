// カード画像パス
export function getCardImagePath(id) {
  return `../data/img/UA/${id}.png`;
}

// ===============================
// カード生成（表裏対応）
// ===============================
export function createCard(id, face = "back") {
  const div = document.createElement("div");
  div.className = "card";
  div.dataset.id = id;
  div.dataset.face = face;

  // ドラッグ可能
  div.draggable = true;
  div.addEventListener("dragstart", onDragStart);
  div.addEventListener("dragend", onDragEnd);

  updateCardImage(div);
  return div;
}

// ===============================
// 表裏切り替え
// ===============================
export function flipCard(card) {
  card.dataset.face = card.dataset.face === "front" ? "back" : "front";
  updateCardImage(card);
}

// ===============================
// 画像更新
// ===============================
function updateCardImage(card) {
  if (card.dataset.face === "back") {
    card.style.backgroundImage = "url('../data/img/back.png')";
  } else {
    card.style.backgroundImage = `url('../data/img/UA/${card.dataset.id}.png')`;
  }
}

// ===============================
// ドラッグ処理（ここが重要）
// ===============================
let draggedCard = null;

function onDragStart(e) {
  draggedCard = e.target;
  e.dataTransfer.setData("text/plain", draggedCard.dataset.id);
  draggedCard.classList.add("dragging");
}

function onDragEnd(e) {
  if (draggedCard) draggedCard.classList.remove("dragging");
  draggedCard = null;
}

// ===============================
// ドロップ可能にするヘルパー
// ===============================
export function makeDroppable(zone, handler) {
  zone.addEventListener("dragover", e => e.preventDefault());
  zone.addEventListener("drop", e => {
    e.preventDefault();
    if (!draggedCard) return;
    handler(draggedCard, zone);
  });
}


// 重ねゾーン
export function renderStack(zoneId, arr) {
  const zone = document.getElementById(zoneId);
  zone.innerHTML = "";
  arr.forEach((id, i) => {
    const c = createCard(id);
    c.style.setProperty("--i", i);
    zone.appendChild(c);
  });
}

// 横並びゾーン
export function renderRow(zoneId, arr) {
  const zone = document.getElementById(zoneId);
  zone.innerHTML = "";
  arr.forEach(id => zone.appendChild(createCard(id)));
}

// カードID取得
export function getCardId(el) {
  if (!el.classList.contains("card")) return null;
  return el.dataset.id;
}
