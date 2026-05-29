// ===============================
// カードデータ（仮デッキ10枚）
// ===============================

let cards = {};

// 山札10枚（灰色）
for (let i = 1; i <= 10; i++) {
  cards["d" + i] = {
    id: "d" + i,
    zone: "my-deck",
    x: 0,
    y: 0,
    img: "gray"
  };
}

// 手札2枚（青）
cards.h1 = { id: "h1", zone: "my-hand", x: 0, y: 0, img: "blue" };
cards.h2 = { id: "h2", zone: "my-hand", x: 0, y: 0, img: "blue" };

// エナジー1枚（黄）
cards.e1 = { id: "e1", zone: "my-energy", x: 0, y: 0, img: "yellow" };

// ライフ（イエロー2枚）
cards.y1 = { id: "y1", zone: "my-yellow", x: 0, y: 0, img: "green" };
cards.y2 = { id: "y2", zone: "my-yellow", x: 0, y: 0, img: "green" };

// ライフ（レッド1枚）
cards.r1 = { id: "r1", zone: "my-red", x: 0, y: 0, img: "red" };

// ===============================
// 山札の順番（上が最後）
// ===============================
let deckOrder = Object.keys(cards).filter(id => id.startsWith("d"));
