let db = null;

export function openDB() {
  return new Promise((resolve, reject) => {
    if (db) return resolve(db);

    const req = indexedDB.open("UA_DB", 1);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("decks")) {
        db.createObjectStore("decks", { keyPath: "id", autoIncrement: true });
      }
    };

    req.onsuccess = (e) => {
      db = e.target.result;
      resolve(db);
    };

    req.onerror = (e) => reject(e);
  });
}

export async function getAllDecks() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("decks", "readonly");
    const store = tx.objectStore("decks");
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = (e) => reject(e);
  });
}

export async function getDeck(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("decks", "readonly");
    const store = tx.objectStore("decks");
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = (e) => reject(e);
  });
}

export async function addDeck(deck) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("decks", "readwrite");
    const store = tx.objectStore("decks");
    const req = store.add(deck);
    req.onsuccess = () => resolve(req.result);
    req.onerror = (e) => reject(e);
  });
}

export async function updateDeck(deck) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("decks", "readwrite");
    const store = tx.objectStore("decks");
    const req = store.put(deck);
    req.onsuccess = () => resolve(true);
    req.onerror = (e) => reject(e);
  });
}

export async function deleteDeck(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("decks", "readwrite");
    const store = tx.objectStore("decks");
    const req = store.delete(id);
    req.onsuccess = () => resolve(true);
    req.onerror = (e) => reject(e);
  });
}
