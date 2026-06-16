// ===============================
// loaders.js（通常スクリプト版）
// ===============================

// 作品一覧（GAS）
const WORKS_API_URL = "https://script.google.com/macros/s/AKfycby2NX-tUIW7hJWCwnHHff_98riZfi9RecNsmJCrgUXjq8Fu2FrpVmzgF0tCeEqNMU7q/exec";

async function loadWorks() {
  try {
    const res = await fetch(WORKS_API_URL, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load works from sheet");

    const json = await res.json();
    return json.works;
  } catch (err) {
    console.error("works load error:", err);

    try {
      const res = await fetch("data/works.json");
      const json = await res.json();
      return json.works;
    } catch (e) {
      return [];
    }
  }
}

// ★ UA 用 API
const UA_SHEET_API_URL = "https://script.google.com/macros/s/AKfycbxd_qH37pR5xIsz-wo3elBGz2Yz9z3qhE7GFdZrgQaVT7BaZKmdtIy1pyVTwYb__MrWrQ/exec";
// カード一覧（GAS）
const BDB_SHEET_API_URL = "https://script.google.com/macros/s/AKfycbyS3sUwd3R2SkG0cFm4R4RoDKfzEA1OAEkfZif9Fvh1AcpSwledwDqIztu6VhveJFCJ/exec";

// ===============================
// 作品一覧（UA / BDB 共通）
// ===============================
async function loadWorks(game) {
  try {
    const url = (game === "UA")
      ? UA_SHEET_API_URL + "?mode=works"
      : BDB_SHEET_API_URL + "?mode=works";

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load works");

    const json = await res.json();
    return json.works;
  } catch (err) {
    console.error("loadWorks error:", err);
    return [];
  }
}

// ===============================
// カード一覧（UA / BDB 分岐）
// ===============================
async function loadCards(game) {
  const url = (game === "UA")
    ? UA_SHEET_API_URL
    : BDB_SHEET_API_URL;

  try {
    // IndexedDB キャッシュ
    const cached = await dbGet("cards", game);

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load cards");

    const json = await res.json();

    // バージョンが違えば更新
    if (!cached || cached.version !== json.version) {
      await dbPut("cards", json, game);
      return json;
    }

    return cached;
  } catch (err) {
    console.error("loadCards error:", err);
    return game === "UA"
      ? { titles: {} }
      : { cards: {} };
  }
}

// ===============================
// グローバル公開
// ===============================
window.loadWorks = loadWorks;
window.loadCards = loadCards;
