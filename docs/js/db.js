// db.js — IndexedDB のみを担当する完全整理版

const DB_NAME = "tcg-db";
const DB_VERSION = 1;
let db = null;

/* ---------------------------------------------------------
   DB を開く（初回は stores を作成）
--------------------------------------------------------- */
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;

      // 作品一覧
      if (!db.objectStoreNames.contains("works")) {
        db.createObjectStore("works", { keyPath: "id" });
      }

      // デッキ一覧
      if (!db.objectStoreNames.contains("decks")) {
        db.createObjectStore("decks", { keyPath: "id" });
      }
    };

    req.onsuccess = (e) => {
      db = e.target.result;
      resolve();
    };

    req.onerror = (e) => {
      console.error("IndexedDB open error:", e);
      reject(e);
    };
  });
}

/* ---------------------------------------------------------
   汎用：get
--------------------------------------------------------- */
function dbGet(storeName, key) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction([storeName], "readonly");
    const store = tx.objectStore(storeName);
    const req = store.get(key);

    req.onsuccess = () => resolve(req.result || null);
    req.onerror = (e) => reject(e);
  });
}

/* ---------------------------------------------------------
   汎用：getAll
--------------------------------------------------------- */
function dbGetAll(storeName) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction([storeName], "readonly");
    const store = tx.objectStore(storeName);
    const req = store.getAll();

    req.onsuccess = () => resolve(req.result || []);
    req.onerror = (e) => reject(e);
  });
}

/* ---------------------------------------------------------
   汎用：put（追加 or 上書き）
--------------------------------------------------------- */
function dbPut(storeName, data) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction([storeName], "readwrite");
    const store = tx.objectStore(storeName);
    const req = store.put(data);

    req.onsuccess = () => resolve();
    req.onerror = (e) => reject(e);
  });
}

/* ---------------------------------------------------------
   汎用：delete
--------------------------------------------------------- */
function dbDelete(storeName, key) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction([storeName], "readwrite");
    const store = tx.objectStore(storeName);
    const req = store.delete(key);

    req.onsuccess = () => resolve();
    req.onerror = (e) => reject(e);
  });
}
