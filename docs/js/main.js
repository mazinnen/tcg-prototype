// ===============================
// 自分側だけの完全版 v9
// ===============================

// 右クリックメニュー完全無効化
document.addEventListener("contextmenu", (e) => e.preventDefault());

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

window.addEventListener("DOMContentLoaded", () => {
  initDeck();
  initTerritory();
  createAllCards();
  layoutAllZones();
  setupDraw();
  autoScale();
});

window.addEventListener("resize", autoScale);

// 山札40枚（裏面）
function initDeck() {
  deckOrder = [];
  for (let i = 1; i <= 40; i++) {
    const id = "d" + i;
    deckOrder.push(id);
    cards[id] = { id, zone: "my-deck", face: "back", type: "normal" };
  }
}

// テリトリーカード（裏面スタート）
function initTerritory() {
  const id = "territory1";
  cards[id] = { id, zone: "my-territory", face: "back", type: "territory" };
}

// DOM生成
function createAllCards() {
  Object.values(cards).forEach((card) => {
    const el = document.createElement("div");
    el.className = "card";
    el.id = card.id;
    el.dataset.face = card.face;
    el.dataset.type = card.type;
    el.dataset.rotated = "0";

    applyFaceClass(el);

    document.getElementById(card.zone).appendChild(el);

    enableDrag(el);
    enableRotate(el);
    enableFlip(el);
    enablePreview(el);
  });
}

// 全ゾーンレイアウト
function layoutAllZones() {
  ZONES.forEach((z) => layoutZone(z));
  COUNT_ZONES.forEach((z) => updateZoneCount(z));
}

function layoutZone(zoneId) {
  const zone = document.getElementById(zoneId);
  const list = Array.from(zone.querySelectorAll(".card"));

  // 山札・ドロップ・リムーブ：重ねる
  if (["my-deck","my-drop","my-remove"].includes(zoneId)) {
    list.forEach((el) => {
      el.style.left = "8px";
      el.style.top = "38px";
    });
    updateZoneCount(zoneId);
    return;
  }

  // ライフ
  if (["my-yellow","my-red"].includes(zoneId)) {
    list.forEach((el, i) => {
      el.style.left = `${8 + i * 20}px`;
      el.style.top = "45px";
    });
    updateZoneCount(zoneId);
    return;
  }

  // エナジー
  if (zoneId === "my-energy") {
    list.forEach((el, i) => {
      el.style.left = `${8 + i * 48}px`;
      el.style.top = "45px";
    });
    updateZoneCount(zoneId);
    return;
  }

  // 手札
  if (zoneId === "my-hand") {
    list.forEach((el, i) => {
      el.style.left = `${8 + i * 118}px`;
      el.style.top = "45px";
    });
    updateZoneCount(zoneId);
    return;
  }

  // フィールド：横幅に応じて1列→溢れたら2列目
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
      el.style.top = `${45 + row * 175}px`;
    });
    return;
  }

  // テリトリーなど
  list.forEach((el, i) => {
    el.style.left = `${8 + i * 48}px`;
    el.style.top = "35px"; // ← 上に寄せる
  });
}

// カウント
function updateZoneCount(zoneId) {
  const countEl = document.getElementById(zoneId + "-count");
  if (!countEl) return;
  const zone = document.getElementById(zoneId);
  countEl.textContent = zone.querySelectorAll(".card").length;
}

// 山札ドロー
function setupDraw() {
  document.getElementById("my-deck").addEventListener("click", () => {
    let id = null;
    while (deckOrder.length > 0) {
      const c = deckOrder.pop();
      if (cards[c].zone === "my-deck") { id = c; break; }
    }
    if (!id) return;

    const el = document.getElementById(id);
    cards[id].zone = "my-hand";
    cards[id].face = "front";
    el.dataset.face = "front";
    applyFaceClass(el);

    document.getElementById("my-hand").appendChild(el);

    layoutZone("my-deck");
    layoutZone("my-hand");
    updateZoneCount("my-deck");
    updateZoneCount("my-hand");
  });
}

// ドラッグ＆ドロップ
function enableDrag(el) {
  let isDragging = false;
  let offsetX = 0, offsetY = 0;
  let originalZone = null;

  el.addEventListener("mousedown", (e) => {
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

    // フィールド・エナジー以外は縦向き
    if (!["my-field","my-energy"].includes(targetZoneId)) {
      el.style.transform = "rotate(0deg)";
      el.dataset.rotated = "0";
    }

    // ゾーンごとの表裏初期状態
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

// フィールド・エナジーだけ横向き
function enableRotate(el) {
  el.addEventListener("contextmenu", (e) => {
    const zoneId = cards[el.id].zone;
    if (!["my-field","my-energy"].includes(zoneId)) return;
    e.preventDefault();

    const rotated = el.dataset.rotated === "1";
    el.style.transform = rotated ? "rotate(0deg)" : "rotate(90deg)";
    el.dataset.rotated = rotated ? "0" : "1";
  });
}

// レッド・イエロー・テリトリーで裏表反転
function enableFlip(el) {
  el.addEventListener("contextmenu", (e) => {
    const zoneId = cards[el.id].zone;
    if (!["my-yellow","my-red","my-territory"].includes(zoneId)) return;
    e.preventDefault();

    const next = cards[el.id].face === "front" ? "back" : "front";
    cards[el.id].face = next;
    el.dataset.face = next;
    applyFaceClass(el);
  });
}

// 表裏クラス付け
function applyFaceClass(el) {
  const type = el.dataset.type;
  const face = el.dataset.face;

  el.classList.remove("front","back","territory-front","territory-back");

  if (type === "territory") {
    el.classList.add(face === "front" ? "territory-front" : "territory-back");
  } else {
    el.classList.add(face === "front" ? "front" : "back");
  }
}

// ホバーでカード詳細（拡大画像＋テキスト）
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

// board-wrapper 全体をスケール
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
