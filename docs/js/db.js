// ===============================
// IndexedDB Wrapper
// ===============================

const DB_NAME = "tcg-db";
const DB_VERSION = 1;

let db = null;

// DB を開く
export function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      db = e.target.result;

      // カードキャッシュ
      if (!db.objectStoreNames.contains("cards")) {
        db.createObjectStore("cards");
      }

      // デッキ保存用
      if (!db.objectStoreNames.contains("decks")) {
        db.createObjectStore("decks");
      }
    };

    request.onsuccess = (e) => {
      db = e.target.result;
      resolve();
    };

    request.onerror = (e) => reject(e);
  });
}

// 汎用：取得
export function dbGet(store, key) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).get(key);

    req.onsuccess = () => resolve(req.result);
    req.onerror = reject;
  });
}

// 汎用：保存
export function dbPut(store, value, key) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).put(value, key);

    tx.oncomplete = resolve;
    tx.onerror = reject;
  });
}

// 汎用：削除
export function dbDelete(store, key) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).delete(key);

    tx.oncomplete = resolve;
    tx.onerror = reject;
  });
}

// 汎用：全件取得
export function dbGetAll(store) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).getAll();

    req.onsuccess = () => resolve(req.result);
    req.onerror = reject;
  });
}
