// ===============================
// ゾーンごとの整列ルール
// ===============================
function layoutZone(zoneId) {
  const zone = document.getElementById(zoneId);
  const cards = Array.from(zone.querySelectorAll(".card"));

  // 手札：横並び
  if (zone.classList.contains("hand")) {
    layoutHorizontal(cards, 90);
  }

  // エナジー：横並び
  else if (zone.classList.contains("energy")) {
    layoutHorizontal(cards, 90);
  }

  // ライフゾーン（イエロー/レッド）：5枚重ね
  else if (zone.classList.contains("life")) {
    layoutStack(cards, 20);
  }

  // 山札・ドロップ・リムーブ：重ね置き
  else if (
    zone.classList.contains("deck") ||
    zone.classList.contains("drop") ||
    zone.classList.contains("remove")
  ) {
    layoutStack(cards, 5);
  }

  // その他（フィールドなど）は横並び
  else {
    layoutHorizontal(cards, 90);
  }
}

// ===============================
// 横並び整列
// ===============================
function layoutHorizontal(cards, gap) {
  cards.forEach((card, i) => {
    card.style.left = i * gap + "px";
    card.style.top = "0px";
  });
}

// ===============================
// 重ね置き整列
// ===============================
function layoutStack(cards, gap) {
  cards.forEach((card, i) => {
    card.style.left = i * gap + "px";
    card.style.top = i * gap + "px";
  });
}
