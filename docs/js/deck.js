// deck.js

async function initDeckFromList(deckJson, carddata, workId) {
  deckOrder = [];
  Object.keys(cards).forEach(k => delete cards[k]); // 既存カードをクリア
 
  resetAllCards();
  resetZones();

  // ★ テリトリーカードを登録
  const territoryId = deckJson.territory;
  cards["territory"] = {
    id: "territory",
    baseId: territoryId,
    zone: "my-territory",
    face: "back",
    type: "territory",
    name: territoryId,
    text: "",
    imageOpen:  `data/img/${workId}/${territoryId}_O.png`,
    imageClose: `data/img/${workId}/${territoryId}_C.png`
  };

  // ★ テリトリーDOMは createAllCards() で生成される
  
  deckJson.cards.forEach(entry => {
    const { id, count } = entry;

    for (let i = 0; i < count; i++) {
      const uid = `${id}_${i+1}`;

      deckOrder.push(uid);

      cards[uid] = {
        id: uid,
        baseId: id,
        zone: "my-deck",
        face: "back",
        type: "normal",
        name: carddata[id].name,
        text: carddata[id].text,
        cardType: carddata[id].type,
        image: `data/img/${workId}/${id}.png`,  // ★ 自動生成
        back: `data/img/card-back.png`
      };
    }
  });
  
  shuffleDeck();
}


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

function shuffleDeck() {
  for (let i = deckOrder.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deckOrder[i], deckOrder[j]] = [deckOrder[j], deckOrder[i]];
  }
  console.log("デッキをシャッフルしました");
}

// deck.js — デッキ操作（シャッフル・ドロー）

function drawCard() {
  if (deckOrder.length === 0) return;

  const uid = deckOrder.pop();
  const card = cards[uid];

  // ゾーン更新
  card.zone = "my-hand";
  card.face = "front"; // ドロー時は必ず表

  // DOM 更新
  const el = document.getElementById(uid);
  if (!el) {
    console.error("drawCard: DOM にカードが存在しません:", uid);
    return;
  }

  el.dataset.face = "front";
  el.style.backgroundImage = `url(${card.image})`;

  // 手札へ移動
  document.getElementById("my-hand").appendChild(el);
}
