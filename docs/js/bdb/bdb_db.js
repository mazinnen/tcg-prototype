// ===============================
// BDB 専用 IndexedDB
// DB名: BDB_DB
// Store: bdb_decks
// ===============================

let bdb = null;

export function openBDB() {
  return new Promise((resolve, reject) => {
    if (bdb) return resolve(bdb);

    const req = indexedDB.open("BDB_DB", 1);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;

      if (!db.objectStoreNames.contains("bdb_decks")) {
        db.createObjectStore("bdb_decks", {
          keyPath: "id",
          autoIncrement: true
        });
      }
    };

    req.onsuccess = (e) => {
      bdb = e.target.result;
      resolve(bdb);
    };

    req.onerror = (e) => reject(e);
  });
}

// ------------------------------
// すべてのデッキ取得
// ------------------------------
export async function getAllBDBDecks() {
  const db = await openBDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("bdb_decks", "readonly");
    const store = tx.objectStore("bdb_decks");
    const req = store.getAll();

    req.onsuccess = () => resolve(req.result);
    req.onerror = (e) => reject(e);
  });
}

// ------------------------------
// デッキ取得
// ------------------------------
export async function getBDBDeck(id) {
  const db = await openBDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("bdb_decks", "readonly");
    const store = tx.objectStore("bdb_decks");
    const req = store.get(id);

    req.onsuccess = () => resolve(req.result);
    req.onerror = (e) => reject(e);
  });
}

// ------------------------------
// デッキ追加
// ------------------------------
export async function addBDBDeck(deck) {
  const db = await openBDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("bdb_decks", "readwrite");
    const store = tx.objectStore("bdb_decks");
    const req = store.add(deck);

    req.onsuccess = () => resolve(req.result);
    req.onerror = (e) => reject(e);
  });
}

// ------------------------------
// デッキ更新
// ------------------------------
export async function updateBDBDeck(deck) {
  const db = await openBDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("bdb_decks", "readwrite");
    const store = tx.objectStore("bdb_decks");
    const req = store.put(deck);

    req.onsuccess = () => resolve(true);
    req.onerror = (e) => reject(e);
  });
}

// ------------------------------
// デッキ削除
// ------------------------------
export async function deleteBDBDeck(id) {
  const db = await openBDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("bdb_decks", "readwrite");
    const store = tx.objectStore("bdb_decks");
    const req = store.delete(id);

    req.onsuccess = () => resolve(true);
    req.onerror = (e) => reject(e);
  });
}
