import { openDB } from "./db.js";
import { loadWorks, loadCards } from "./loaders.js";
import { initWorkAndDeckUI } from "./deck_manager.js";
import { attachDeckRightClick, attachStackRightClick } from "./ui_events.js"; 
// ↑ UIイベントは別ファイルに分けるのが理想（後で作る）

window.addEventListener("DOMContentLoaded", async () => {
  await openDB();

  // 管理側データのロード
  const works = await loadWorks();
  const cards = await loadCards();

  // デッキ編集 UI 初期化
  await initWorkAndDeckUI(works);

  // 右クリックメニュー
  attachDeckRightClick();
  attachStackRightClick();

  // 初期デッキ選択
  window.selectedDeckId = document.getElementById("deck-list").value;
});
