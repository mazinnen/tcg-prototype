// deck.js — deckOrder と cards の唯一の管理者

// 全カードデータ
const cards = {};

// 山札の順番（唯一の正解）
let deckOrder = [];

/* ---------------------------------------------------------
   デッキ初期化（DB版）
   deckJson = { territory: "xxx", cards: [{id, count}, ...] }
--------------------------------------------------------- */
async function initDeckFromList(deckJson, carddata, workId) {
  // 既存データを完全クリア
  deckOrder = [];
  for (const k in cards) delete cards[k];

  // ★ テリトリーカード
  const territoryId = deckJson.territory;
  cards["territory"] = {
    id: "territory",
    baseId: territoryId,
    zone: "my-territory",
    face: "back",
    type: "territory",
    name: territoryId,
    text: carddata[territoryId].text,
    imageOpen:  `data/img/${workId}/${territoryId}_O.png`,
    imageClose: `data/img/${workId}/${territoryId}_C.png`
  };

  // ★ 通常カード
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
        image: `data/img/${workId}/${id}.png`,
        backImage: `data/img/card-back.png`
      };
    }
  });

  shuffleDeck();
}

/* ---------------------------------------------------------
   シャッフル（deckOrder のみ変更）
--------------------------------------------------------- */
function shuffleDeck() {
  for (let i = deckOrder.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deckOrder[i], deckOrder[j]] = [deckOrder[j], deckOrder[i]];
  }
  console.log("デッキをシャッフルしました");
}

/* ---------------------------------------------------------
   ドロー（deckOrder.pop() の唯一の場所）
--------------------------------------------------------- */
function drawCard() {
  if (deckOrder.length === 0) return null;

  const uid = deckOrder.pop();
  const card = cards[uid];

  // ゾーン更新
  card.zone = "my-hand";
  card.face = "front";

  return uid; // DOM 操作は solo.js / core.js が担当
}

/* ---------------------------------------------------------
   山札の上から n 枚を取得（peek 用）
--------------------------------------------------------- */
function peekDeck(count) {
  return deckOrder.slice(-count).reverse();
}

/* ---------------------------------------------------------
   peek の並び替え結果を deckOrder に反映
--------------------------------------------------------- */
function applyPeekOrder(newOrderIds, toTop) {
  const count = newOrderIds.length;

  // 山札の上から count 枚を削除
  deckOrder.splice(deckOrder.length - count, count);

  // 並び替えた順番で戻す
  if (toTop) {
    // 上に戻す → deckOrder の末尾に逆順で push
    newOrderIds.slice().reverse().forEach(id => deckOrder.push(id));
  } else {
    // 下に戻す → deckOrder の先頭に unshift
    newOrderIds.forEach(id => deckOrder.unshift(id));
  }
}

/* ---------------------------------------------------------
   デッキの状態を外部に提供（solo.js 用）
--------------------------------------------------------- */
function getDeckOrder() {
  return deckOrder;
}

function getCardData(uid) {
  return cards[uid];
}

function getAllCards() {
  return cards;
}
