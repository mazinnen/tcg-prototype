// core.js — UI基盤（DOM生成・レイアウト・ドラッグ・回転・反転・プレビュー）

// ZONE 定義
const ZONES = [
  "my-deck","my-hand","my-field","my-energy",
  "my-yellow","my-red","my-remove","my-drop","my-territory"
];

const COUNT_ZONES = [
  "my-deck","my-hand","my-field","my-energy",
  "my-yellow","my-red","my-remove","my-drop"
];

/* ---------------------------------------------------------
   DOM生成（cards{} の内容を元に1回だけ生成）
--------------------------------------------------------- */
function createAllCards() {
  // ZONES 内のカードだけ削除
  ZONES.forEach(zoneId => {
    const zone = document.getElementById(zoneId);
    if (!zone) return;
    zone.querySelectorAll(".card").forEach(el => el.remove());
  });

  const allCards = getAllCards();
  const order = getDeckOrder(); // ★ deckOrder を取得

  // ★ まず deckOrder の順番で山札を生成
  order.forEach(uid => {
    const card = allCards[uid];
    const el = createCardElement(card);
    document.getElementById("my-deck").appendChild(el);
  });

  // ★ 次に deck 以外のカードを生成
  Object.values(allCards)
    .filter(c => c.zone !== "my-deck")
    .forEach(card => {
      const el = createCardElement(card);
      document.getElementById(card.zone).appendChild(el);
    });
}

function createCardElement(card) {
  const el = document.createElement("div");
  el.className = "card";
  el.id = card.id;
  el.dataset.face = card.face;
  el.dataset.type = card.type;
  el.dataset.rotated = "0";

  // ★ card.face をそのまま使う（勝手に front/back にしない）
  const img = (card.type === "territory")
    ? (card.face === "front" ? card.imageOpen : card.imageClose)
    : (card.face === "front" ? card.image : card.backImage);

  el.style.backgroundImage = `url(${img})`;

  enableDrag(el);
  enableRotate(el);
  enableFlip(el);
  enablePreview(el);

  return el;
}



/* ---------------------------------------------------------
   レイアウト
--------------------------------------------------------- */
function layoutAllZones() {
  ZONES.forEach(z => layoutZone(z));
  COUNT_ZONES.forEach(z => updateZoneCount(z));
}

function layoutZone(zoneId) {
  const zone = document.getElementById(zoneId);
  const list = Array.from(zone.querySelectorAll(".card"));

  // 山札・ドロップ・リムーブ
  if (["my-deck","my-drop","my-remove"].includes(zoneId)) {
    list.forEach(el => {
      el.style.left = "8px";
      el.style.top = "30px";
    });
    //updateZoneCount(zoneId);
    return;
  }

  // ライフ
  if (["my-yellow","my-red"].includes(zoneId)) {
    list.forEach((el, i) => {
      el.style.left = `${8 + i * 20}px`;
      el.style.top = "30px";
    });
    //updateZoneCount(zoneId);
    return;
  }

  // エナジー
  if (zoneId === "my-energy") {
    list.forEach((el, i) => {
      el.style.left = `${8 + i * 48}px`;
      el.style.top = "30px";
    });
    //updateZoneCount(zoneId);
    return;
  }

  // 手札
  if (zoneId === "my-hand") {
    list.forEach((el, i) => {
      el.style.left = `${8 + i * 118}px`;
      el.style.top = "30px";
    });
    //updateZoneCount(zoneId);
    return;
  }

  // フィールド
  if (zoneId === "my-field") {
    const rect = zone.getBoundingClientRect();
    const cardWidth = 110;
    const gap = 16;
    const usableWidth = rect.width - 16;
    const perRow = Math.max(1, Math.floor((usableWidth + gap) / (cardWidth + gap)));

    list.forEach((el, i) => {
      const col = i % perRow;
      const row = Math.floor(i / perRow);
      el.style.left = `${8 + col * (cardWidth + gap)}px`;
      el.style.top = `${30 + row * 175}px`;
    });
    return;
  }

  // テリトリーなど
  list.forEach((el, i) => {
    el.style.left = `${8 + i * 48}px`;
    el.style.top = "30px";
  });
}

function updateZoneCount(zoneId) {
  const countEl = document.getElementById(zoneId + "-count");
  if (!countEl) return;
  const zone = document.getElementById(zoneId);
  countEl.textContent = zone.querySelectorAll(".card").length;
}

/* ---------------------------------------------------------
   ドラッグ（ゾーン移動）
--------------------------------------------------------- */
function enableDrag(el) {
  let isDragging = false;
  let offsetX = 0, offsetY = 0;
  let originalZone = null;

  el.addEventListener("mousedown", (e) => {
    if (el.dataset.inDialog === "1") return;
    e.preventDefault();

    const rect = el.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    originalZone = getCardData(el.id).zone;

    isDragging = true;

    document.body.appendChild(el);
    el.style.position = "fixed";
    el.style.zIndex = 9999;
    el.style.left = rect.left + "px";
    el.style.top = rect.top + "px";
  });

  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    el.style.left = `${e.clientX - offsetX}px`;
    el.style.top = `${e.clientY - offsetY}px`;
  });

document.addEventListener("mouseup", (e) => {
  if (!isDragging) return;
  isDragging = false;

  const dropZone = detectDropZone(e.clientX, e.clientY);
  let targetZoneId = dropZone ? dropZone.id : originalZone;

  const card = getCardData(el.id);
  card.zone = targetZoneId;

  document.getElementById(targetZoneId).appendChild(el);

  /* --------------------------------------------
     ★ 山札 → 他ゾーン：deckOrder から削除
  -------------------------------------------- */
  if (originalZone === "my-deck" && targetZoneId !== "my-deck") {
    const order = getDeckOrder();
    const idx = order.indexOf(el.id);
    if (idx !== -1) order.splice(idx, 1);
  }

  /* --------------------------------------------
     ★ 他ゾーン → 山札：deckOrder に追加
  -------------------------------------------- */
  if (originalZone !== "my-deck" && targetZoneId === "my-deck") {
    const order = getDeckOrder();
    order.push(el.id); // 山札の上に戻す
    card.face = "back";
    el.dataset.face = "back";
    applyFaceClass(el);
  }

  // 裏表処理（山札は常に裏）
  if (["my-yellow","my-red","my-deck"].includes(targetZoneId)) {
    card.face = "back";
  } else {
    card.face = "front";
  }
  el.dataset.face = card.face;
  applyFaceClass(el);

  el.style.position = "absolute";
  el.style.zIndex = 1;

  layoutZone(originalZone);
  layoutZone(targetZoneId);
});
}

function detectDropZone(x, y) {
  for (const zoneId of ZONES) {
    const rect = document.getElementById(zoneId).getBoundingClientRect();
    if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
      return document.getElementById(zoneId);
    }
  }
  return null;
}

/* ---------------------------------------------------------
   回転・反転・プレビュー
--------------------------------------------------------- */
function enableRotate(el) {
  let rotateTarget = null;

  el.addEventListener("mousedown", (e) => {
    if (e.button === 2) rotateTarget = el;
  });

  el.addEventListener("contextmenu", (e) => {
    const card = getCardData(el.id);
    const zoneId = card.zone;
    if (!["my-field","my-energy"].includes(zoneId)) return;

    e.preventDefault();

    if (rotateTarget !== el) return;

    const rotated = el.dataset.rotated === "1";
    el.style.transform = rotated ? "rotate(0deg)" : "rotate(90deg)";
    el.dataset.rotated = rotated ? "0" : "1";

    rotateTarget = null;
  });
}

function enableFlip(el) {
  el.addEventListener("contextmenu", (e) => {
    const card = getCardData(el.id);
    const zoneId = card.zone;

    if (!["my-yellow","my-red","my-territory"].includes(zoneId)) return;

    e.preventDefault();

    card.face = (card.face === "front") ? "back" : "front";
    applyFaceClass(el);
  });
}

function applyFaceClass(el) {
  const card = getCardData(el.id);

  const img = (card.type === "territory")
    ? (card.face === "front" ? card.imageOpen : card.imageClose)
    : (card.face === "front" ? card.image : card.backImage);

  el.style.backgroundImage = `url(${img})`;
}

function enablePreview(el) {
  el.addEventListener("mouseenter", () => {
    if (el.dataset.face !== "front") return;

    const panel = document.getElementById("card-detail");
    const img = panel.querySelector(".detail-image");
    const text = panel.querySelector(".detail-text");

    const card = getCardData(el.id);

    img.style.backgroundImage = `url(${card.image || card.imageOpen})`;
    img.style.backgroundSize = "contain";
    img.style.backgroundRepeat = "no-repeat";
    img.style.backgroundPosition = "center";
    text.textContent = card.text || "テキストなし";
  });
}

/* ---------------------------------------------------------
   リセット（deckOrder は消さない）
--------------------------------------------------------- */
function resetAllCards() {
  ZONES.forEach(zoneId => {
    const zone = document.getElementById(zoneId);
    if (!zone) return;
    zone.querySelectorAll(".card").forEach(el => el.remove());
  });

  for (const k in cards) delete cards[k];
}

function resetZones() {
  ZONES.forEach(id => {
    const zone = document.getElementById(id);
    if (!zone) return;
    zone.querySelectorAll(".card").forEach(el => el.remove());
  });
}
