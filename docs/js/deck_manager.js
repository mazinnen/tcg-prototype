import { dbGet, dbPut, dbDelete, dbGetAll } from "./db.js";

// ===============================
// デッキ CRUD（IndexedDB）
// ===============================

// デッキ追加（deckId は UUID）
export async function addDeck(deckData) {
  const deckId = crypto.randomUUID();
  const data = { deckId, ...deckData };
  await dbPut("decks", data, deckId);
  return deckId;
}

// デッキ更新
export async function updateDeck(deckId, deckData) {
  const data = { deckId, ...deckData };
  await dbPut("decks", data, deckId);
}

// デッキ削除
export async function deleteDeck(deckId) {
  await dbDelete("decks", deckId);
}

// デッキ取得
export async function getDeck(deckId) {
  return await dbGet("decks", deckId);
}

// 全デッキ取得
export async function getAllDecks() {
  return await dbGetAll("decks");
}

// 作品ごとのデッキ一覧取得
export async function getDecksByWork(workId) {
  const all = await dbGetAll("decks");
  return all.filter(d => d.work === workId);
}
