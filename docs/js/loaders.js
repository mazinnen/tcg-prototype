const WORKS_API_URL = "https://script.google.com/macros/s/AKfycby2NX-tUIW7hJWCwnHHff_98riZfi9RecNsmJCrgUXjq8Fu2FrpVmzgF0tCeEqNMU7q/exec";

// data/works.json を読み込むだけのローダー
export async function loadWorks() {
  try {
    const res = await fetch(WORKS_API_URL, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load works from sheet");

    const json = await res.json();
    return json.works; // [{id:"BTR", name:"Blue Trigger"}, ...]
  } catch (err) {
    console.error("works load error:", err);

    // fallback: data/works.json
    try {
      const res = await fetch("data/works.json");
      const json = await res.json();
      return json.works;
    } catch (e) {
      return [];
    }
  }
}
import { dbGet, dbPut } from "./db.js";

const SHEET_API_URL = "https://script.google.com/macros/s/AKfycbyS3sUwd3R2SkG0cFm4R4RoDKfzEA1OAEkfZif9Fvh1AcpSwledwDqIztu6VhveJFCJ/exec";

// data/cards.json を読み込み、IndexedDB にキャッシュする
export async function loadCards() {
  try {
    const cached = await dbGet("cards", "cards");

    const res = await fetch(SHEET_API_URL, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load cards from sheet");

    const json = await res.json();

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