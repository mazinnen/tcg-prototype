// core.js

// --- カード状態 ---
const cards = {};
let deckOrder = [];

const ZONES = [
  "my-deck","my-hand","my-field","my-energy",
  "my-yellow","my-red","my-remove","my-drop","my-territory"
];

const COUNT_ZONES = [
  "my-deck","my-hand","my-yellow","my-red",
  "my-energy","my-remove","my-drop"
];

// --- カード生成 ---
function createAllCards() {
  // ★ デッキは deckOrder の順番で生成
  deckOrder.forEach(uid => {
    const card = cards[uid];
    const el = document.createElement("div");
    el.className = "card";
    el.id = card.id;
    el.dataset.face = card.face;
    el.dataset.type = card.type;
    el.dataset.rotated = "0";

    let img = "";

    if (card.type === "normal") {
      img = (card.face === "front") ? card.image : card.backImage;
    }

    if (card.type === "territory") {
      img = (card.face === "front") ? card.imageOpen : card.imageClose;
    }

    el.style.backgroundImage = `url(${img})`;

    document.getElementById(card.zone).appendChild(el);

    enableDrag(el);
    enableRotate(el);
    enableFlip(el);
    enablePreview(el);
  });

  // ★ デッキ以外のカード（テリトリーなど）
  Object.values(cards)
    .filter(c => c.zone !== "my-deck")
    .forEach(card => {
      const el = document.createElement("div");
      el.className = "card";
      el.id = card.id;
      el.dataset.face = card.face;
      el.dataset.type = card.type;
      el.dataset.rotated = "0";

      let img = "";

      if (card.type === "normal") {
        img = (card.face === "front") ? card.image : card.backImage;
      }

      if (card.type === "territory") {
        img = (card.face === "front") ? card.imageOpen : card.imageClose;
      }

      el.style.backgroundImage = `url(${img})`;

      document.getElementById(card.zone).appendChild(el);

      enableDrag(el);
      enableRotate(el);
      enableFlip(el);
      enablePreview(el);
    });
}

// --- レイアウト ---
function layoutAllZones() {
  ZONES.forEach((z) => layoutZone(z));
  COUNT_ZONES.forEach((z) => updateZoneCount(z));
}

function layoutZone(zoneId) {
  const zone = document.getElementById(zoneId);
  const list = Array.from(zone.querySelectorAll(".card"));

  // 山札・ドロップ・リムーブ
  if (["my-deck","my-drop","my-remove"].includes(zoneId)) {
    list.forEach((el) => {
      el.style.left = "8px";
      el.style.top = "30px";
    });
    updateZoneCount(zoneId);
    return;
  }

  // ライフ
  if (["my-yellow","my-red"].includes(zoneId)) {
    list.forEach((el, i) => {
      el.style.left = `${8 + i * 20}px`;
      el.style.top = "30px";
    });
    updateZoneCount(zoneId);
    return;
  }

  // エナジー
  if (zoneId === "my-energy") {
    list.forEach((el, i) => {
      el.style.left = `${8 + i * 48}px`;
      el.style.top = "30px";
    });
    updateZoneCount(zoneId);
    return;
  }

  // 手札
  if (zoneId === "my-hand") {
    list.forEach((el, i) => {
      el.style.left = `${8 + i * 118}px`;
      el.style.top = "30px";
    });
    updateZoneCount(zoneId);
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

// --- 通常ドラッグ（ゾーン移動） ---
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
    originalZone = cards[el.id].zone;

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

    const id = el.id;
    cards[id].zone = targetZoneId;

    document.getElementById(targetZoneId).appendChild(el);

    if (!["my-field","my-energy"].includes(targetZoneId)) {
      el.style.transform = "rotate(0deg)";
      el.dataset.rotated = "0";
    }

    if (["my-yellow","my-red","my-deck"].includes(targetZoneId)) {
      cards[id].face = "back";
    } else {
      cards[id].face = "front";
    }
    el.dataset.face = cards[id].face;
    applyFaceClass(el);

    el.style.position = "absolute";
    el.style.zIndex = 1;

    layoutZone(originalZone);
    layoutZone(targetZoneId);
    if (COUNT_ZONES.includes(originalZone)) updateZoneCount(originalZone);
    if (COUNT_ZONES.includes(targetZoneId)) updateZoneCount(targetZoneId);
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

// --- 回転・反転・プレビュー ---
function enableRotate(el) {
  let rotateTarget = null;

  el.addEventListener("mousedown", (e) => {
    if (e.button === 2) { // 右クリック
      rotateTarget = el; // ★ このカードだけ回転対象にする
    }
  });

  el.addEventListener("contextmenu", (e) => {
    const zoneId = cards[el.id].zone;
    if (!["my-field","my-energy"].includes(zoneId)) return;
    
    e.preventDefault();

    // ★ rotateTarget が自分のときだけ回転
    if (rotateTarget !== el) return;

    const rotated = el.dataset.rotated === "1";
    el.style.transform = rotated ? "rotate(0deg)" : "rotate(90deg)";
    el.dataset.rotated = rotated ? "0" : "1";
    
    rotateTarget = null; // リセット
  });
}

function enableFlip(el) {
  el.addEventListener("contextmenu", (e) => {
    const card = cards[el.id];
    const zoneId = card.zone;

    // 裏表切替が許可されるゾーン
    if (!["my-yellow","my-red","my-territory","my-life"].includes(zoneId)) return;

    e.preventDefault();

    // テリトリー
    if (card.type === "territory") {
      card.face = (card.face === "front") ? "back" : "front";
      const img = (card.face === "front") ? card.imageOpen : card.imageClose;
      el.style.backgroundImage = `url(${img})`;
      el.dataset.face = card.face;
      return;
    }

    // 通常カード
    card.face = (card.face === "front") ? "back" : "front";
    const img = (card.face === "front") ? card.image : card.backImage;
    el.style.backgroundImage = `url(${img})`;
    el.dataset.face = card.face;
  });
}


function applyFaceClass(el) {
  const card = cards[el.id];

  if (card.type === "normal") {
    const img = (card.face === "front") ? card.image : card.backImage;
    el.style.backgroundImage = `url(${img})`;
  }

  if (card.type === "territory") {
    const img = (card.face === "front") ? card.imageOpen : card.imageClose;
    el.style.backgroundImage = `url(${img})`;
  }
}


function enablePreview(el) {
  el.addEventListener("mouseenter", () => {
    if (el.dataset.face !== "front") return;

    const panel = document.getElementById("card-detail");
    const img = panel.querySelector(".detail-image");
    const text = panel.querySelector(".detail-text");

    const bg = window.getComputedStyle(el).backgroundImage;

    img.style.backgroundImage = bg;
    img.style.backgroundSize = "contain";
    img.style.backgroundRepeat = "no-repeat";
    img.style.backgroundPosition = "center";

    text.textContent =
      `ダミーテキスト\n\n` +
      `これはカード「${el.id}」の説明文です。\n` +
      `実際のテキスト管理を始めたら、ここに効果やフレーバーを表示します。`;
  });
}

// --- スケール ---
function autoScale() {
  const wrapper = document.getElementById("board-wrapper");
  wrapper.style.transform = "scale(1)";
  const rect = wrapper.getBoundingClientRect();

  const scale = Math.min(
    window.innerWidth / (rect.width + 40),
    window.innerHeight / (rect.height + 40)
  );

  wrapper.style.transform = `scale(${scale})`;
}

function resetAllCards() {
  // 全カード DOM を削除
  document.querySelectorAll(".card").forEach(el => el.remove());

  // 全カードデータを削除
  for (const k in cards) delete cards[k];

  // デッキ順もクリア
  deckOrder = [];

  console.log("全カードをリセットしました");
}

function resetZones() {
  const zones = [
    "my-deck", "my-hand", "my-energy", "my-life",
    "my-yellow", "my-red", "my-territory",
    "my-drop", "my-remove"
  ];

  zones.forEach(id => {
    const zone = document.getElementById(id);
    if (!zone) return;

    // ★ カードだけ消す
    zone.querySelectorAll(".card").forEach(el => el.remove());
  });
}

