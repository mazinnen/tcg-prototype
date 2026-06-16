let db = null;

export async function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("UA_DB", 1);

    req.onupgradeneeded = (e) => {
      db = e.target.result;
      if (!db.objectStoreNames.contains("decks")) {
        db.createObjectStore("decks", { keyPath: "id", autoIncrement: true });
      }
    };

    req.onsuccess = (e) => {
      db = e.target.result;
      resolve();
    };

    req.onerror = reject;
  });
}

export function getAllDecks() {
  return new Promise((resolve) => {
    const tx = db.transaction("decks", "readonly");
    const store = tx.objectStore("decks");
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
  });
}

export function addDeck(deck) {
  return new Promise((resolve) => {
    const tx = db.transaction("decks", "readwrite");
    tx.objectStore("decks").add(deck).onsuccess = resolve;
  });
}

export function updateDeck(deck) {
  return new Promise((resolve) => {
    const tx = db.transaction("decks", "readwrite");
    tx.objectStore("decks").put(deck).onsuccess = resolve;
  });
}

export function getDeck(id) {
  return new Promise((resolve) => {
    const tx = db.transaction("decks", "readonly");
    tx.objectStore("decks").get(Number(id)).onsuccess = (e) => resolve(e.target.result);
  });
}
