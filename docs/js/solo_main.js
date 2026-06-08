import { openDB } from "./db.js";
import { loadWorks, loadCards } from "./loaders.js";
import { getDecksByWork } from "./deck_manager.js";
import "./solo.js"; // ゲームロジック

window.addEventListener("DOMContentLoaded", async () => {
  await openDB(); // グローバル関数として呼べる

  const works = await loadWorks();
  const cards = await loadCards();

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

  // ★ 初期選択を反映
  if (decks.length > 0) {
    window.selectedDeckId = decks[0].deckId;
  } else {
    window.selectedDeckId = null;
  }

  // ★ change イベントで更新
  deckSel.addEventListener("change", () => {
    window.selectedDeckId = deckSel.value;
  });
}
