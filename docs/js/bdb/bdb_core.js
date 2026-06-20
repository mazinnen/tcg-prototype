// ===============================
// BDB 専用 core.js
// カード生成・共通UI処理
// ===============================

// カード DOM を生成する
export function createCard(card) {
  const el = document.createElement("div");
  el.className = "card";
  el.draggable = true;

  el.dataset.uid = card.uid;
  el.dataset.id = card.id;

  // 表裏
  if (card.face === "front") {
    el.style.backgroundImage = `url('../data/img/BDB/${card.title}/${card.id}.png')`;
  } else {
    el.style.backgroundImage = `url('../data/img/BDB/bd-back.png')`;
  }

  // 回転
  if (card.rotate) {
    el.style.transform = `rotate(${card.rotate}deg)`;
  }

  return el;
}

// カードを表にする
export function flipFront(card) {
  card.face = "front";
}

// カードを裏にする
export function flipBack(card) {
  card.face = "back";
}

// カードを回転させる
export function rotateCard(card, deg = 90) {
  card.rotate = (card.rotate + deg) % 360;
}
