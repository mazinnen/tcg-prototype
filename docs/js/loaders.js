// data/works.json を読み込むだけのローダー
export async function loadWorks() {
  try {
    const res = await fetch("data/works.json", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load works.json");

    const data = await res.json();
    return data.works; // [{id:"BTR", name:"Blue Trigger"}, ...]
  } catch (err) {
    console.error("works.json load error:", err);
    return [];
  }
}

import { dbGet, dbPut } from "./db.js";

// data/cards.json を読み込み、IndexedDB にキャッシュする
export async function loadCards() {
  try {
    const cached = await dbGet("cards", "cards");

    const res = await fetch("data/cards.json", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load cards.json");

    const json = await res.json();

    // version が違う or キャッシュなし → 更新
    if (!cached || cached.version !== json.version) {
      await dbPut("cards", json, "cards");
      return json.cards;
    }

    return cached.cards;
  } catch (err) {
    console.error("cards.json load error:", err);
    return {};
  }
}
