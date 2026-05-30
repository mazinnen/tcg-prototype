// deck.js

function initDeck() {
  deckOrder = [];
  for (let i = 1; i <= 40; i++) {
    const id = "d" + i;
    deckOrder.push(id);
    cards[id] = { id, zone: "my-deck", face: "back", type: "normal" };
  }
}

function initTerritory() {
  const id = "territory1";
  cards[id] = { id, zone: "my-territory", face: "back", type: "territory" };
}

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

function restoreDeckFaces() {
  deckOrder.forEach(id => {
    if (cards[id].zone === "my-deck") {
      cards[id].face = "back";
      const el = document.getElementById(id);
      el.dataset.face = "back";
      applyFaceClass(el);
    }
  });
}
