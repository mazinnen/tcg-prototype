// カードデータ
let cards = {
  d1: { id: "d1", zone: "my-deck", x: 0, y: 0, img: "gray" },
  d2: { id: "d2", zone: "my-deck", x: 0, y: 0, img: "gray" },
  d3: { id: "d3", zone: "my-deck", x: 0, y: 0, img: "gray" },

  h1: { id: "h1", zone: "my-hand", x: 0, y: 0, img: "blue" },

  e1: { id: "e1", zone: "my-energy", x: 0, y: 0, img: "yellow" },

  y1: { id: "y1", zone: "my-yellow", x: 0, y: 0, img: "green" },
  y2: { id: "y2", zone: "my-yellow", x: 0, y: 0, img: "green" },

  r1: { id: "r1", zone: "my-red", x: 0, y: 0, img: "red" }
};

// 山札の順番（上が最後の要素）
let deckOrder = ["d1", "d2", "d3"];
