// カードデータ（画像は仮の色付きカード）
let cards = {
  // 手札
  h1: { id: "h1", zone: "my-hand", x: 0, y: 0, img: "blue" },
  h2: { id: "h2", zone: "my-hand", x: 0, y: 0, img: "blue" },

  // 山札
  d1: { id: "d1", zone: "my-deck", x: 0, y: 0, img: "gray" },

  // エナジー
  e1: { id: "e1", zone: "my-energy", x: 0, y: 0, img: "yellow" },

  // ライフ（イエロー）
  y1: { id: "y1", zone: "my-yellow", x: 0, y: 0, img: "green" },
  y2: { id: "y2", zone: "my-yellow", x: 0, y: 0, img: "green" },

  // ライフ（レッド）
  r1: { id: "r1", zone: "my-red", x: 0, y: 0, img: "red" }
};
