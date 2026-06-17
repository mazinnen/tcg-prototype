// =========================
// カード生成（uid 付き）
// =========================
export function createCard(cardObj) {
  const card = document.createElement("div");
  card.classList.add("card");

  card.dataset.uid = cardObj.uid;
  card.dataset.id = cardObj.id;
  card.dataset.face = cardObj.face || "back";
  card.dataset.rotate = cardObj.rotate || "0";

  card.draggable = true;

  updateCardImage(card);
  updateCardRotation(card);

  // =========================
  // ★ カード自身に右クリック回転
  //    deck / out は回転禁止
  // =========================
  card.addEventListener("contextmenu", e => {
    e.preventDefault();

    const zone = card.closest(".zone")?.id;

    // ★ 回転禁止ゾーン
    if (zone === "ua-deck" || zone === "ua-out" || zone === "ua-hand" || zone === "ua-life") {
      return;
    }

    // ★ 縦横切替（0° ↔ 90°）
    const now = Number(card.dataset.rotate || 0);
    const next = now === 0 ? 90 : 0;

    card.dataset.rotate = next;
    card.style.transform = `rotate(${next}deg)`;

    cardObj.rotate = next;
  });

  return card;
}

// =========================
// 裏表反転（ライフ用）
// =========================
export function flipCard(card) {
  const now = card.dataset.face;
  const next = now === "back" ? "front" : "back";
  card.dataset.face = next;
  updateCardImage(card);
}

// =========================
// カード画像更新
// =========================
export function updateCardImage(card) {
  const id = card.dataset.id;
  const face = card.dataset.face;

  if (face === "back") {
    card.style.backgroundImage = "url('../data/img/UA/back.png')";
  } else {
    card.style.backgroundImage = `url('../data/img/UA/${id}.png')`;
  }
}

// =========================
// 回転反映
// =========================
export function updateCardRotation(card) {
  const deg = Number(card.dataset.rotate || 0);
  card.style.transform = `rotate(${deg}deg)`;
}

// =========================
// スタック描画
// =========================
export function renderStack(zoneId, cards) {
  const zone = document.getElementById(zoneId);
  zone.innerHTML = "";
  cards.forEach(c => zone.appendChild(createCard(c)));
}

// =========================
// 横並び（通常）
// =========================
export function renderRow(zoneId, cards) {
  const zone = document.getElementById(zoneId);
  zone.innerHTML = "";
  cards.forEach(c => zone.appendChild(createCard(c)));
}

// =========================
// レイド用：最大 2 枚重ね描画
// =========================
export function renderRaidRow(zoneId, slots) {
  const zone = document.getElementById(zoneId);
  zone.innerHTML = "";

  slots.forEach(stack => {
    const slotDiv = document.createElement("div");
    slotDiv.classList.add("raid-slot");

    stack.forEach((cardObj, i) => {
      const card = createCard(cardObj);
      card.style.position = "absolute";
      card.style.top = `${i * 20}px`; // 2 枚目を少し下にずらす
      slotDiv.appendChild(card);
    });

    zone.appendChild(slotDiv);
  });
}

// =========================
// UID 取得
// =========================
export function getCardUid(el) {
  const card = el.closest(".card");
  return card ? card.dataset.uid : null;
}
