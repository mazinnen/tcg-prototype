// solo_main.js — 一人回しモード 初期化担当（ES Module）

import { openDB } from "./db.js";
import { getDecksByWork } from "./deck_manager.js";
import "./solo.js"; // ゲームロジック（ES Module）

window.addEventListener("DOMContentLoaded", async () => {
  // IndexedDB オープン
  await openDB();

  // 作品一覧ロード（Excel → GAS）
  const works = await loadWorks();

  // UI 初期化
  initWorkSelector(works);
  initDeckSelector();
});

// ----------------------------
// 作品選択
// ----------------------------
function initWorkSelector(works) {
  const sel = document.getElementById("work-list");
  sel.innerHTML = "";

  works.forEach(w => {
    const opt = document.createElement("option");
    opt.value = w.id;
    opt.textContent = w.name;
    sel.appendChild(opt);
  });

  sel.addEventListener("change", initDeckSelector);
}

// ----------------------------
// デッキ一覧
// ----------------------------
async function initDeckSelector() {
  const workId = document.getElementById("work-list").value;
  const deckSel = document.getElementById("deck-list");

  const decks = await getDecksByWork(workId);

  deckSel.innerHTML = "";
  decks.forEach(d => {
    const opt = document.createElement("option");
    opt.value = d.deckId;
    opt.textContent = d.name;
    deckSel.appendChild(opt);
  });

  // 初期選択を反映
  if (decks.length > 0) {
    window.selectedDeckId = decks[0].deckId;
  } else {
    window.selectedDeckId = null;
  }

  // change で選択デッキを更新
  deckSel.addEventListener("change", () => {
    window.selectedDeckId = deckSel.value;
  });
}
